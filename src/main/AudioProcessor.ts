import * as fs from 'fs';
import * as mm from 'music-metadata';
import * as ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'child_process';
import { logger } from './logger';
import { computeEnergyEnvelope, estimateBpmFromEnvelope } from './bpmDetection';

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
        throw new Error('File non trovato');
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
   * Genera i pacchetti Waveform Data (Peak Data) tramite FFmpeg + Audiowaveform proxy
   * o leggendo l'output stdout in stream. Ritorna i dati serializzati pronti al rendering.
   */
  static async generateWaveformData(filePath: string): Promise<{ success: boolean; data?: number[]; error?: string }> {
    return new Promise((resolve) => {
        try {
            logger.info(`[AudioProcessor] Generazione Peak Data per: ${filePath}`);

            // Utilizziamo un semplice child process chiamando ffmpeg statico
            // Estrarrà i peak grezzi su un frame ristretto per velocità, per poi buildare i dati omettendo
            // i blob pesanti. Stiamo simulando il behavior del builder audiowaveform 
            // ma lo facciamo interamente in fluente-ffmpeg. 
            
            let audioBuffer: number[] = [];
            let _waveformKillTimeout: ReturnType<typeof setTimeout> | null = null;

            const command = ffmpeg(filePath)
                // -ac 1 downmixa in mono per il picco, -filter:a aresample per scalare uniformememente 
                // e -f s16le stream raw a 16bit per l'analisi dei byte
                .outputOptions([
                    '-ac', '1',
                    '-filter:a', 'aresample=100', // Downsampling a 100hz per stabilità e RAM minima
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

            ffStream.on('data', (chunk: Buffer) => {
                 // Sicurezza contro Buffer troncati/dispari che lanciano RangeError
                 const limit = chunk.length - (chunk.length % 2);
                 for (let i = 0; i < limit; i += 2) {
                     const val = chunk.readInt16LE(i);
                     // Salviamo il valore assoluto modulato per il frontend (Math.abs da 0 a 1)
                     audioBuffer.push(Math.abs(val / 32768.0));
                 }
            });

            ffStream.on('end', () => {
                if (_waveformKillTimeout) { clearTimeout(_waveformKillTimeout); _waveformKillTimeout = null; }
                if (audioBuffer.length === 0) {
                     console.warn(`[AudioProcessor] Attenzione: l'array peak per ${filePath} è vuoto!`);
                     return resolve({ success: true, data: [] });
                }

                // Evitiamo DOM overload sul frontend: estraiamo un numero fisso di "Barre" div indipendentemente dalla durata
                const TARGET_BARS = 200;
                const samplesPerBar = Math.max(1, Math.floor(audioBuffer.length / TARGET_BARS));
                const reducedPeaks: number[] = [];

                for (let i = 0; i < audioBuffer.length; i += samplesPerBar) {
                    let max = 0;
                    for(let j = 0; j < samplesPerBar && i + j < audioBuffer.length; j++) {
                        if(audioBuffer[i + j] > max) max = audioBuffer[i + j];
                    }
                    // Mappiamo e amplifichiamo i picchi (x2.0) per migliorare la visibilità visiva nel mini-editor
                    reducedPeaks.push(Math.min(max * 2.0, 1.0));
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
    if (!fs.existsSync(filePath)) return { success: false, error: 'File non trovato' };

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

                const silenceEnds: number[] = [];
                const silenceStarts: number[] = [];
                for (const line of stderrData.split('\n')) {
                    const eMatch = line.match(/silence_end:\s*([\d.e+\-]+)/);
                    if (eMatch) silenceEnds.push(parseFloat(eMatch[1]));
                    const sMatch = line.match(/silence_start:\s*([\d.e+\-]+)/);
                    if (sMatch) silenceStarts.push(parseFloat(sMatch[1]));
                }

                // introCue: primo silence_end nel primo 40% del brano (dove l'audio raggiunge piena energia)
                const earlyEnds = silenceEnds.filter(t => t > 0.3 && t < duration * 0.4);
                const introCue = earlyEnds.length > 0 ? parseFloat(earlyEnds[0].toFixed(3)) : 0;

                // outroCue: ultimo silence_start dopo il 40% del brano (inizio dissolvenza finale)
                const lateStarts = silenceStarts.filter(t => t > duration * 0.4 && t < duration - 1.0);
                const outroCue = lateStarts.length > 0 ? parseFloat(lateStarts[lateStarts.length - 1].toFixed(3)) : 0;

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
    if (!fs.existsSync(filePath)) return { success: false, error: 'File non trovato' };

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

  static async detectSilence(filePath: string, overrideThresholdDb?: number): Promise<any> {
    if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File non trovato' };
    }

    // Step 1: calcola soglia — override manuale o analisi dinamica del livello medio
    let thresholdDb: number;
    if (overrideThresholdDb !== undefined) {
        thresholdDb = overrideThresholdDb;
    } else {
        const meanLevel = await AudioProcessor._estimateMeanLevel(filePath);
        if (meanLevel !== null) {
            // Soglia = livello medio − 25 dB, clamped tra −55 e −20 dBFS
            // Es: file mastered a −10 dBFS → soglia −35 dBFS (rimuove code quasi-silenti)
            // Es: registrazione vocale a −25 dBFS → soglia −50 dBFS (cattura anche pause brevi)
            thresholdDb = Math.max(-55, Math.min(-20, meanLevel - 25));
        } else {
            thresholdDb = -40; // fallback legacy
        }
    }

    // Step 2: silencedetect con soglia calcolata
    return new Promise((resolve) => {
        try {
            const args = [
                '-i', filePath,
                '-af', `silencedetect=noise=${thresholdDb.toFixed(1)}dB:d=0.1`,
                '-f', 'null', '-'
            ];

            const proc = spawn(safeFfmpegPath, args);
            let stderrData = '';

            const _silenceKillTimeout = setTimeout(() => {
                try { proc.kill('SIGKILL'); } catch { /* noop */ }
                resolve({ success: false, error: 'Timeout: silence detection exceeded 28s' });
            }, 28000);

            proc.stderr.on('data', (chunk: Buffer) => { stderrData += chunk.toString(); });

            proc.on('error', (err: Error) => {
                clearTimeout(_silenceKillTimeout);
                resolve({ success: false, error: err.message });
            });

            proc.on('close', () => {
                clearTimeout(_silenceKillTimeout);
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

                    // Silenzio iniziale: il file comincia con silenzio
                    if (silenceEnds.length > 0 && silenceEnds[0] < duration * 0.5) {
                        trimStart = parseFloat(Math.max(0, silenceEnds[0] - margin).toFixed(3));
                    }

                    // Silenzio finale: il file termina con silenzio
                    if (silenceStarts.length > 0 && silenceStarts[silenceStarts.length - 1] > duration * 0.5) {
                        trimEnd = parseFloat(Math.max(0, duration - silenceStarts[silenceStarts.length - 1] - margin).toFixed(3));
                    }

                    if (trimStart === 0 && trimEnd === 0) {
                        return resolve({ success: true, data: { trimStart: 0, trimEnd: 0, noSilence: true, thresholdUsed: thresholdDb } });
                    }

                    if (duration > 0 && duration - trimEnd <= trimStart + 0.1) {
                        return resolve({ success: false, error: 'Il file sembra essere tutto silenzio o il volume è troppo basso.' });
                    }

                    resolve({ success: true, data: { trimStart, trimEnd, thresholdUsed: thresholdDb } });
                } catch (parseErr) {
                    resolve({ success: false, error: String(parseErr) });
                }
            });

        } catch (error) {
            resolve({ success: false, error: String(error) });
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
   */
  static async detectBpm(filePath: string): Promise<{ success: boolean; data?: { bpm: number; confidence: number; detected: boolean }; error?: string }> {
    if (!fs.existsSync(filePath)) return { success: false, error: 'File non trovato' };

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
                        return resolve({ success: false, error: 'Audio insufficiente per la stima BPM' });
                    }
                    // Buffer PCM16LE -> Int16Array (rispetta l'allineamento del buffer sottostante)
                    const sampleCount = Math.floor(pcm.length / 2);
                    const samples = new Int16Array(pcm.buffer, pcm.byteOffset, sampleCount);

                    const envelope = computeEnergyEnvelope(samples, SAMPLE_RATE, WINDOW_MS);
                    const envelopeRateHz = 1000 / WINDOW_MS;
                    const estimate = estimateBpmFromEnvelope(envelope, envelopeRateHz);

                    // "Non rilevabile" (nessuna periodicità marcata, es. voce/ambient) è
                    // un esito valido dell'analisi, non un fallimento: va comunque marcato
                    // come "controllato" per non ritentare a ogni caricamento (vedi
                    // detected:false, letto da classifyBpmResult nel renderer).
                    if (!estimate) return resolve({ success: true, data: { bpm: 0, confidence: 0, detected: false } });
                    resolve({ success: true, data: { ...estimate, detected: true } });
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
