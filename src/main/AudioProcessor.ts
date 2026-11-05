import * as fs from 'fs';
import * as mm from 'music-metadata';
import * as ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'child_process';
import { logger } from './logger';
import { computeEnergyEnvelope, estimateBpmFromEnvelope, estimateBeatOffsetSec, lowPassFilter, computeOnsetEnvelope, refineBeatGrid, BEAT_GRID_LOWPASS_HZ } from './bpmDetection';
import { PeakAccumulator, reduceToBars, WAVEFORM_SAMPLE_RATE } from './waveformPeaks';
import { BlockLevelAccumulator, computeEdgeTrim, parseSilenceRegions, pickSmartCues, TRIM_SAMPLE_RATE, TRIM_CHANNELS, type BlockLevels } from './silenceTrim';
import { tMain } from './i18nMain';

/** Esito di detectSilence (contratto IPC `detect-silence`). */
export interface DetectSilenceResult {
    success: boolean;
    data?: {
        trimStart: number;
        trimEnd: number;
        noSilence?: boolean;
        /** Soglia (dBFS RMS) usata in apertura; in coda può differire, vedi silenceTrim.ts. */
        thresholdUsed?: number;
        contentStartSec?: number;
        contentEndSec?: number;
        durationSec?: number;
        /** Solo con options.withLegacy: ciò che il rilevatore fino alla 1.15.37 produrrebbe
         *  oggi sullo stesso file (null se allora falliva). Serve a riconoscere, nei progetti
         *  salvati, i tagli automatici da ricalcolare rispetto a quelli fatti a mano. */
        legacy?: { trimStart: number; trimEnd: number } | null;
    };
    error?: string;
}

// Fix ESM/CJS interop per questi pacchetti old-school exports
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

// Gestione corretta ASAR unpack per far partire i child process da un filesystem reale
const ffprobePath = ffprobeStatic.path || ffprobeStatic;
const safeFfmpegPath = ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
const safeFfprobePath = ffprobePath.replace('app.asar', 'app.asar.unpacked');

// Set paths to static binaries
ffmpeg.setFfmpegPath(safeFfmpegPath);
ffmpeg.setFfprobePath(safeFfprobePath);

// v1.2.17 (NEW-GR-01): registro globale delle conversioni FFmpeg in corso,
// per poterle terminare quando la finestra viene chiusa o l'app esce.
const activeConversions = new Set<any>();

export class AudioProcessor {
  /**
   * v1.2.17 — Termina forzatamente tutte le conversioni FFmpeg attive.
   * Chiamato su window-close e before-quit per evitare processi zombie.
   */
  static cancelAllConversions(): number {
    const count = activeConversions.size;
    for (const cmd of activeConversions) {
      try { cmd.kill('SIGKILL'); } catch { /* noop */ }
    }
    activeConversions.clear();
    return count;
  }

  /**
   * Estrae i metadati essenziali (durata, tag) senza caricamento completo in memoria.
   */
  static async extractMetadata(filePath: string) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(tMain('err.fileNotFound'));
      }

      logger.info(`[AudioProcessor] Estrazione metadati per: ${filePath}`);
      // L'operazione è molto più veloce e non satura il buffer come decodificare l'intero file.
      const metadata = await mm.parseFile(filePath, { duration: true, skipCovers: true });

      return {
        success: true,
        data: {
          duration: metadata.format.duration || 0,
          sampleRate: metadata.format.sampleRate || 44100,
          channels: metadata.format.numberOfChannels || 2,
          codec: metadata.format.codec,
          bitrate: metadata.format.bitrate
        }
      };
    } catch (error) {
      console.error('[AudioProcessor] Errore metadati:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Genera i pacchetti Waveform Data (Peak Data) tramite FFmpeg in streaming.
   * Ritorna un array di barre 0..1 (max 200) pronte al rendering.
   *
   * v1.15.12 — fix fedeltà: il vecchio `aresample=100` filtrava passa-basso a
   * ~50 Hz (anti-aliasing del resampler), quindi la "waveform" era il residuo
   * sub-bass del brano, non il suo inviluppo. Ora: decode mono a 8 kHz e
   * max(|campione|) per finestre da 10 ms (waveformPeaks.ts), barre normalizzate
   * al picco del file. RAM comunque minima: l'accumulatore tiene 100 valori/s,
   * mai il PCM intero.
   */
  static async generateWaveformData(filePath: string): Promise<{ success: boolean; data?: number[]; error?: string }> {
    return new Promise((resolve) => {
        try {
            logger.info(`[AudioProcessor] Generazione Peak Data per: ${filePath}`);

            const accumulator = new PeakAccumulator();
            let _waveformKillTimeout: ReturnType<typeof setTimeout> | null = null;

            const command = ffmpeg(filePath)
                // -ac 1 downmixa in mono, -ar 8000 tiene il passa-basso del resampler
                // a 4 kHz (l'energia percepita resta), -f s16le stream raw per l'analisi
                .outputOptions([
                    '-ac', '1',
                    '-ar', String(WAVEFORM_SAMPLE_RATE),
                    '-map', '0:a',
                    '-c:a', 'pcm_s16le',
                    '-f', 's16le'
                ])
                .on('error', (err: Error) => {
                    if (_waveformKillTimeout) { clearTimeout(_waveformKillTimeout); _waveformKillTimeout = null; }
                    console.error('[AudioProcessor] Waveform Error:', err);
                    resolve({ success: false, error: err.message });
                });

            // Una transform stream (rimossa in v0.11.0 poiché si ascolta l'evento data direttamente)

            const ffStream = command.pipe();

            _waveformKillTimeout = setTimeout(() => {
                _waveformKillTimeout = null;
                try { command.kill('SIGKILL'); } catch { /* noop */ }
                resolve({ success: false, error: 'Timeout: waveform generation exceeded 28s' });
            }, 28000);

            ffStream.on('error', (err: Error) => {
                if (_waveformKillTimeout) { clearTimeout(_waveformKillTimeout); _waveformKillTimeout = null; }
                console.error('[AudioProcessor] ffStream pipe error:', err);
                resolve({ success: false, error: err.message });
            });

            // L'accumulatore gestisce anche i campioni a 16 bit spezzati tra due
            // chunk (il vecchio codice scartava il byte di coda e da lì in poi
            // leggeva tutti i campioni disallineati di un byte).
            ffStream.on('data', (chunk: Buffer) => accumulator.push(chunk));

            ffStream.on('end', () => {
                if (_waveformKillTimeout) { clearTimeout(_waveformKillTimeout); _waveformKillTimeout = null; }
                // Riduzione a max 200 barre di pari durata (contratto renderer
                // invariato) + normalizzazione al picco del file.
                const reducedPeaks = reduceToBars(accumulator.finalize());
                if (reducedPeaks.length === 0) {
                     console.warn(`[AudioProcessor] Attenzione: l'array peak per ${filePath} è vuoto!`);
                     return resolve({ success: true, data: [] });
                }

                logger.info(`[AudioProcessor] Peak Data estratti con successo! Punti: ${reducedPeaks.length}`);
                resolve({ success: true, data: reducedPeaks });
                });

                } catch (error) {
                console.error('[AudioProcessor] Errore fatale waveform:', error);
                resolve({ success: false, error: String(error) });
                }
                });
                }

                /**
                * Converte un file audio in un altro formato (es. WebM -> WAV) 
                * con monitoraggio del progresso.
                */
                static async convertAudio(
                inputPath: string,
                outputPath: string,
                options: { bitrate?: number; format?: string; sampleDepth?: 16 | 24 | 32 } = {},
                onProgress?: (progress: number) => void
                ): Promise<{ success: boolean; error?: string }> {
                return new Promise((resolve) => {
                try {
                logger.info(`[AudioProcessor] Conversione: ${inputPath} -> ${outputPath} (format=${options.format})`);

                let killTimer: NodeJS.Timeout | null = null;
                let settled = false;
                const finish = (result: { success: boolean; error?: string }) => {
                    if (settled) return;
                    settled = true;
                    if (killTimer) { clearTimeout(killTimer); killTimer = null; }
                    activeConversions.delete(command);
                    resolve(result);
                };

                const command = ffmpeg(inputPath)
                .output(outputPath)
                .on('progress', (info) => {
                if (onProgress && info.percent) {
                    onProgress(Math.floor(info.percent));
                }
                })
                .on('error', (err: Error) => {
                console.error('[AudioProcessor] Conversion Error:', err);
                finish({ success: false, error: err.message });
                })
                .on('end', () => {
                logger.info(`[AudioProcessor] Conversione completata: ${outputPath}`);
                finish({ success: true });
                });

                // v1.2.17 (NEW-GR-01): hard timeout 30 min — evita zombie su conversioni infinite
                killTimer = setTimeout(() => {
                    try { command.kill('SIGKILL'); } catch { /* noop */ }
                    finish({ success: false, error: 'CONVERSION_TIMEOUT' });
                }, 30 * 60 * 1000);

                activeConversions.add(command);

                const fmt = options.format || 'webm';

                if (fmt === 'wav') {
                    const depth = options.sampleDepth || 16;
                    const codec = depth === 32 ? 'pcm_f32le' : depth === 24 ? 'pcm_s24le' : 'pcm_s16le';
                    command.toFormat('wav').audioCodec(codec);
                } else if (fmt === 'mp3') {
                    command.toFormat('mp3').audioCodec('libmp3lame');
                    if (options.bitrate) command.audioBitrate(options.bitrate / 1000);
                } else if (fmt === 'flac') {
                    const depth = options.sampleDepth || 16;
                    command.toFormat('flac').audioCodec('flac')
                        .outputOptions([`-sample_fmt ${depth === 24 ? 's32' : 's16'}`]);
                } else if (fmt === 'ogg') {
                    command.toFormat('ogg').audioCodec('libvorbis');
                    if (options.bitrate) command.audioBitrate(options.bitrate / 1000);
                } else if (fmt === 'webm') {
                    command.toFormat('webm').audioCodec('libopus');
                    if (options.bitrate) command.audioBitrate(options.bitrate / 1000);
                }

                command.run();

                } catch (error) {
                console.error('[AudioProcessor] Errore fatale conversione:', error);
                resolve({ success: false, error: String(error) });
                }
                });
                }

                /**
                * Stima il livello medio del file tramite FFmpeg volumedetect (analizza max 60s).
                * Usato da detectSilence per calcolare la soglia di silenzio dinamica.
                * Ritorna mean_volume in dBFS o null se il processo fallisce.
                */
  private static async _estimateMeanLevel(filePath: string): Promise<number | null> {
    return new Promise((resolve) => {
        try {
            const proc = spawn(safeFfmpegPath, [
                '-i', filePath,
                '-t', '60',
                '-af', 'volumedetect',
                '-f', 'null', '-'
            ]);
            let stderrData = '';

            const killTimeout = setTimeout(() => {
                try { proc.kill('SIGKILL'); } catch { /* noop */ }
                resolve(null);
            }, 10000);

            proc.stderr.on('data', (chunk: Buffer) => { stderrData += chunk.toString(); });
            proc.on('error', () => { clearTimeout(killTimeout); resolve(null); });
            proc.on('close', () => {
                clearTimeout(killTimeout);
                const match = stderrData.match(/mean_volume:\s*(-?[\d.]+)\s*dB/);
                if (!match) return resolve(null);
                const v = parseFloat(match[1]);
                resolve(isFinite(v) ? v : null);
            });
        } catch {
            resolve(null);
        }
    });
  }

                /**
                * Rileva il silenzio iniziale e finale del file audio tramite FFmpeg silencedetect.
                * v1.2.15: analisi intelligente con soglia dinamica basata su volumedetect.
                *
                * Viene eseguito nel main process (Node.js) per evitare OOM nel renderer su file grandi.
                * Ritorna trimStart, trimEnd e thresholdUsed in secondi/dBFS.
                *
                * @param overrideThresholdDb  Se fornito, usa questa soglia fissa invece del calcolo dinamico.
                */
  /**
   * Analizza il file con una soglia alta (vicina al livello medio) per trovare:
   * - introCue: primo momento in cui l'audio raggiunge piena energia (primo picco energetico)
   * - outroCue: ultimo momento di energia sostenuta prima della dissolvenza finale
   *
   * Usa silencedetect con threshold = mean - 3dB per catturare solo le zone "silenziose"
   * rispetto al corpo del brano. I boundary silence_end/silence_start diventano i cue suggeriti.
   */
  static async detectSmartCues(filePath: string): Promise<{ success: boolean; data?: { introCue: number; outroCue: number }; error?: string }> {
    if (!fs.existsSync(filePath)) return { success: false, error: tMain('err.fileNotFound') };

    const meanLevel = await AudioProcessor._estimateMeanLevel(filePath);
    // Soglia aggressiva: mean - 3dB, clamped tra -25 e -10 dBFS
    const threshold = meanLevel !== null
        ? Math.max(-25, Math.min(-10, meanLevel - 3))
        : -18;

    return new Promise((resolve) => {
        const proc = spawn(safeFfmpegPath, [
            '-i', filePath,
            '-af', `silencedetect=noise=${threshold.toFixed(1)}dB:d=0.25`,
            '-f', 'null', '-'
        ]);
        let stderrData = '';
        const killTimeout = setTimeout(() => {
            try { proc.kill('SIGKILL'); } catch { /* noop */ }
            resolve({ success: false, error: 'Timeout: smart cues detection exceeded 30s' });
        }, 30000);

        proc.stderr.on('data', (chunk: Buffer) => { stderrData += chunk.toString(); });
        proc.on('error', (err: Error) => { clearTimeout(killTimeout); resolve({ success: false, error: err.message }); });
        proc.on('close', () => {
            clearTimeout(killTimeout);
            try {
                const durMatch = stderrData.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
                const duration = durMatch
                    ? parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseFloat(durMatch[3])
                    : 0;

                // v1.15.38: un tratto quieto vale come intro solo se parte dall'inizio
                // del file, come outro solo se arriva alla fine. Prima l'outro era
                // «l'ultimo tratto quieto dopo il 40%» anche con la musica che ripartiva
                // dopo: in PRE-SHOW il marker di outro lancia il brano successivo, quindi
                // una pausa interna tagliava via il resto della canzone.
                const { introCue, outroCue } = pickSmartCues(parseSilenceRegions(stderrData), duration);
                resolve({ success: true, data: { introCue, outroCue } });
            } catch (parseErr) {
                resolve({ success: false, error: String(parseErr) });
            }
        });
    });
  }

  /**
   * v1.4.3 — Misura la loudness integrata (EBU R128) del file in LUFS.
   * Usata per l'omologazione del volume tra clip (guadagno statico per clip).
   * Ritorna { success, data: { integratedLufs } } oppure success:false.
   * Lettura read-only, nessuna modifica al file.
   */
  static async measureLoudness(filePath: string): Promise<{ success: boolean; data?: { integratedLufs: number }; error?: string }> {
    if (!fs.existsSync(filePath)) return { success: false, error: tMain('err.fileNotFound') };

    return new Promise((resolve) => {
        try {
            // ebur128 stampa un riepilogo finale con "I:  -xx.x LUFS" (integrated loudness)
            const proc = spawn(safeFfmpegPath, [
                '-i', filePath,
                '-af', 'ebur128=framelog=quiet',
                '-f', 'null', '-'
            ]);
            let stderrData = '';

            const killTimeout = setTimeout(() => {
                try { proc.kill('SIGKILL'); } catch { /* noop */ }
                resolve({ success: false, error: 'Timeout: loudness measurement exceeded 60s' });
            }, 60000);

            proc.stderr.on('data', (chunk: Buffer) => { stderrData += chunk.toString(); });
            proc.on('error', (err: Error) => { clearTimeout(killTimeout); resolve({ success: false, error: err.message }); });
            proc.on('close', () => {
                clearTimeout(killTimeout);
                // Prendi l'ULTIMA occorrenza di "I:  -xx.x LUFS" (il riepilogo finale)
                const matches = [...stderrData.matchAll(/I:\s*(-?[\d.]+)\s*LUFS/g)];
                if (matches.length === 0) return resolve({ success: false, error: 'Loudness non rilevabile' });
                const v = parseFloat(matches[matches.length - 1][1]);
                if (!isFinite(v)) return resolve({ success: false, error: 'Loudness non finita' });
                resolve({ success: true, data: { integratedLufs: v } });
            });
        } catch (error) {
            resolve({ success: false, error: String(error) });
        }
    });
  }

  /**
   * v1.15.38 — Taglio automatico del silenzio ai BORDI del file (vedi silenceTrim.ts
   * per il perché e le misure). Decodifica l'intero file in PCM 24 kHz stereo e ne
   * calcola l'energia a blocchi da 10 ms in streaming: si taglia solo ciò che sta
   * prima del primo suono e dopo l'ultimo, mai una pausa interna.
   *
   * @param overrideThresholdDb  Soglia fissa (dBFS RMS) al posto di quella automatica.
   * @param options.withLegacy   Calcola anche il risultato del vecchio rilevatore
   *                             (impronta per riconoscere i tagli automatici salvati).
   */
  static async detectSilence(filePath: string, overrideThresholdDb?: number, options?: { withLegacy?: boolean }): Promise<DetectSilenceResult> {
    if (!fs.existsSync(filePath)) {
        return { success: false, error: tMain('err.fileNotFound') };
    }

    type Decoded = { ok: true; levels: BlockLevels } | { ok: false; error: string };
    const decoded = await new Promise<Decoded>((resolve) => {
        try {
            const acc = new BlockLevelAccumulator();
            const proc = spawn(safeFfmpegPath, [
                '-hide_banner', '-nostdin', '-v', 'error',
                '-i', filePath,
                '-map', '0:a:0', '-vn', '-sn', '-dn', // solo il primo flusso audio (le copertine sono «video»)
                '-ac', String(TRIM_CHANNELS),
                '-ar', String(TRIM_SAMPLE_RATE),
                '-f', 's16le', '-acodec', 'pcm_s16le',
                'pipe:1'
            ]);
            let stderrData = '';
            let settled = false;
            const finish = (r: Decoded): void => {
                if (settled) return;
                settled = true;
                clearTimeout(killTimeout);
                resolve(r);
            };
            const killTimeout = setTimeout(() => {
                try { proc.kill('SIGKILL'); } catch { /* noop */ }
                finish({ ok: false, error: 'Timeout: silence detection exceeded 28s' });
            }, 28000);

            proc.stdout.on('data', (chunk: Buffer) => { acc.push(chunk); });
            proc.stderr.on('data', (chunk: Buffer) => { stderrData += chunk.toString(); });
            proc.on('error', (err: Error) => finish({ ok: false, error: err.message }));
            proc.on('close', (code: number | null) => {
                const levels = acc.finalize();
                // Un file illeggibile non deve mai diventare «nessun silenzio»: esito
                // fallito, così il renderer lo ritenta al caricamento successivo.
                if (levels.durationSec <= 0) {
                    const lastLine = stderrData.trim().split(/\r?\n/).pop();
                    return finish({ ok: false, error: lastLine || `ffmpeg exit ${code}` });
                }
                finish({ ok: true, levels });
            });
        } catch (error) {
            resolve({ ok: false, error: String(error) });
        }
    });

    if (!decoded.ok) return { success: false, error: decoded.error };

    const r = computeEdgeTrim(decoded.levels, overrideThresholdDb);
    if (r.allSilent) return { success: false, error: tMain('err.allSilence') };

    const legacy = options?.withLegacy ? await AudioProcessor._legacyDetectSilenceTrims(filePath) : undefined;
    const legacyNote = legacy === undefined ? '' : ` (vecchio rilevatore: ${legacy ? `${legacy.trimStart}/${legacy.trimEnd}` : 'fallito'})`;
    logger.info(`[AudioProcessor] Silenzio ai bordi: ${filePath} — durata ${r.durationSec.toFixed(2)}s, rif ${r.referenceDb.toFixed(1)} dB, soglie ${r.headThresholdDb.toFixed(1)}/${r.tailThresholdDb.toFixed(1)} dB, suono ${r.contentStartSec}–${r.contentEndSec}s → taglio ${r.trimStart}/${r.trimEnd}s${legacyNote}`);

    return {
        success: true,
        data: {
            trimStart: r.trimStart,
            trimEnd: r.trimEnd,
            ...(r.trimStart === 0 && r.trimEnd === 0 ? { noSilence: true } : {}),
            thresholdUsed: r.headThresholdDb,
            contentStartSec: r.contentStartSec,
            contentEndSec: r.contentEndSec,
            durationSec: r.durationSec,
            ...(legacy !== undefined ? { legacy } : {}),
        },
    };
  }

  /**
   * Il rilevatore fino alla 1.15.37, IDENTICO nei numeri (soglia = livello medio dei
   * primi 60 s − 25 dB, silencedetect d=0.1, margine 0.1, arrotondamento a 3 decimali).
   * NON va più usato per tagliare: serve solo da impronta. Se i tagli salvati in una
   * clip coincidono con ciò che questo produce oggi, li aveva scritti lui (e vanno
   * ricalcolati); se differiscono, li ha toccati l'operatore e restano com'erano.
   * Ritorna null se allora l'analisi falliva o dava «tutto silenzio».
   */
  private static async _legacyDetectSilenceTrims(filePath: string): Promise<{ trimStart: number; trimEnd: number } | null> {
    const meanLevel = await AudioProcessor._estimateMeanLevel(filePath);
    const thresholdDb = meanLevel !== null ? Math.max(-55, Math.min(-20, meanLevel - 25)) : -40;

    return new Promise((resolve) => {
        try {
            const proc = spawn(safeFfmpegPath, [
                '-i', filePath,
                '-af', `silencedetect=noise=${thresholdDb.toFixed(1)}dB:d=0.1`,
                '-f', 'null', '-'
            ]);
            let stderrData = '';
            const killTimeout = setTimeout(() => {
                try { proc.kill('SIGKILL'); } catch { /* noop */ }
                resolve(null);
            }, 28000);
            proc.stderr.on('data', (chunk: Buffer) => { stderrData += chunk.toString(); });
            proc.on('error', () => { clearTimeout(killTimeout); resolve(null); });
            proc.on('close', () => {
                clearTimeout(killTimeout);
                try {
                    const durMatch = stderrData.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
                    const duration = durMatch
                        ? parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseFloat(durMatch[3])
                        : 0;
                    const silenceEnds: number[] = [];
                    const silenceStarts: number[] = [];
                    for (const line of stderrData.split('\n')) {
                        const endMatch = line.match(/silence_end:\s*([\d.e+\-]+)/);
                        if (endMatch) silenceEnds.push(parseFloat(endMatch[1]));
                        const startMatch = line.match(/silence_start:\s*([\d.e+\-]+)/);
                        if (startMatch) silenceStarts.push(parseFloat(startMatch[1]));
                    }
                    const margin = 0.1;
                    let trimStart = 0;
                    let trimEnd = 0;
                    if (silenceEnds.length > 0 && silenceEnds[0] < duration * 0.5) {
                        trimStart = parseFloat(Math.max(0, silenceEnds[0] - margin).toFixed(3));
                    }
                    if (silenceStarts.length > 0 && silenceStarts[silenceStarts.length - 1] > duration * 0.5) {
                        trimEnd = parseFloat(Math.max(0, duration - silenceStarts[silenceStarts.length - 1] - margin).toFixed(3));
                    }
                    if ((trimStart !== 0 || trimEnd !== 0) && duration > 0 && duration - trimEnd <= trimStart + 0.1) {
                        return resolve(null);
                    }
                    resolve({ trimStart, trimEnd });
                } catch {
                    resolve(null);
                }
            });
        } catch {
            resolve(null);
        }
    });
  }

  /**
   * BPM Detection (2026-07-01) — stima il tempo del brano per abilitare in
   * futuro crossfade beat-aligned negli show musicali (solo rilevamento +
   * persistenza in questo step, nessun uso ancora nel motore audio).
   *
   * Decodifica i primi 60s del file in PCM16 mono a 11025Hz via FFmpeg (pipe
   * su stdout, nessun file temporaneo), poi passa i campioni all'algoritmo
   * puro (onset detection + autocorrelazione) in bpmDetection.ts.
   *
   * v1.10.17 (Automix Fase A, step A2): il risultato include anche
   * `beatOffsetSec` — la fase della griglia dei beat (offset del primo beat
   * dall'inizio del file), quando stimabile. Estensione ADDITIVA: i campi
   * esistenti sono invariati, i chiamanti vecchi continuano a funzionare.
   */
  static async detectBpm(filePath: string): Promise<{ success: boolean; data?: { bpm: number; confidence: number; detected: boolean; beatOffsetSec?: number; gridScore?: number }; error?: string }> {
    if (!fs.existsSync(filePath)) return { success: false, error: tMain('err.fileNotFound') };

    const SAMPLE_RATE = 11025;
    const WINDOW_MS = 20;

    return new Promise((resolve) => {
        try {
            const proc = spawn(safeFfmpegPath, [
                '-i', filePath,
                '-t', '60',
                '-ac', '1',
                '-ar', String(SAMPLE_RATE),
                '-f', 's16le',
                '-acodec', 'pcm_s16le',
                'pipe:1'
            ]);

            const chunks: Buffer[] = [];
            let stderrData = '';

            const killTimeout = setTimeout(() => {
                try { proc.kill('SIGKILL'); } catch { /* noop */ }
                resolve({ success: false, error: 'Timeout: BPM detection exceeded 20s' });
            }, 20000);

            proc.stdout.on('data', (chunk: Buffer) => { chunks.push(chunk); });
            proc.stderr.on('data', (chunk: Buffer) => { stderrData += chunk.toString(); });
            proc.on('error', (err: Error) => { clearTimeout(killTimeout); resolve({ success: false, error: err.message }); });
            proc.on('close', () => {
                clearTimeout(killTimeout);
                try {
                    const pcm = Buffer.concat(chunks);
                    if (pcm.length < SAMPLE_RATE * 2) { // meno di ~1s di audio decodificato
                        return resolve({ success: false, error: tMain('err.bpmInsufficient') });
                    }
                    // Buffer PCM16LE -> Int16Array (rispetta l'allineamento del buffer sottostante)
                    const sampleCount = Math.floor(pcm.length / 2);
                    const samples = new Int16Array(pcm.buffer, pcm.byteOffset, sampleCount);

                    const envelope = computeEnergyEnvelope(samples, SAMPLE_RATE, WINDOW_MS);
                    // v1.15.37: frequenza VERA dell'inviluppo. A 11025 Hz una finestra di
                    // «20 ms» è di 221 campioni (20,045 ms): con 1000/20 = 50 Hz tutti i BPM
                    // uscivano gonfiati dello 0,23% e la griglia scivolava di ~1 ms a battito.
                    const windowSize = Math.max(1, Math.round((SAMPLE_RATE * WINDOW_MS) / 1000));
                    const envelopeRateHz = SAMPLE_RATE / windowSize;
                    const estimate = estimateBpmFromEnvelope(envelope, envelopeRateHz);

                    // "Non rilevabile" (nessuna periodicità marcata, es. voce/ambient) è
                    // un esito valido dell'analisi, non un fallimento: va comunque marcato
                    // come "controllato" per non ritentare a ogni caricamento (vedi
                    // detected:false, letto da classifyBpmResult nel renderer).
                    if (!estimate) return resolve({ success: true, data: { bpm: 0, confidence: 0, detected: false } });
                    // v1.10.17 (Fase A Automix): fase della griglia dei beat sul BPM
                    // appena stimato. Se non stimabile (null) il campo resta assente:
                    // a valle scatterà il fallback crossfade classico (Fase D).
                    // v1.15.37: tempo e fase raffinati INSIEME sulla cassa (vedi
                    // refineBeatGrid in bpmDetection.ts) + punteggio della griglia, che
                    // il mix usa per decidere se agganciare le battute o fare un crossfade.
                    const { onset, rateHz } = computeOnsetEnvelope(lowPassFilter(samples, SAMPLE_RATE, BEAT_GRID_LOWPASS_HZ), SAMPLE_RATE);
                    const grid = refineBeatGrid(onset, rateHz, estimate.bpm);
                    if (grid) {
                        return resolve({ success: true, data: { bpm: grid.bpm, confidence: estimate.confidence, detected: true, beatOffsetSec: grid.beatOffsetSec, gridScore: grid.gridScore } });
                    }
                    const beatOffsetSec = estimateBeatOffsetSec(envelope, envelopeRateHz, estimate.bpm);
                    resolve({ success: true, data: { ...estimate, detected: true, ...(beatOffsetSec !== null ? { beatOffsetSec } : {}) } });
                } catch (parseErr) {
                    resolve({ success: false, error: String(parseErr) });
                }
            });
        } catch (error) {
            resolve({ success: false, error: String(error) });
        }
    });
  }
}
