import * as fs from 'fs';
import * as mm from 'music-metadata';
import * as ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'child_process';

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

export class AudioProcessor {
  /**
   * Estrae i metadati essenziali (durata, tag) senza caricamento completo in memoria.
   */
  static async extractMetadata(filePath: string) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File non trovato');
      }

      console.log(`[AudioProcessor] Estrazione metadati per: ${filePath}`);
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
            console.log(`[AudioProcessor] Generazione Peak Data per: ${filePath}`);

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

                console.log(`[AudioProcessor] Peak Data estratti con successo! Punti: ${reducedPeaks.length}`);
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
                console.log(`[AudioProcessor] Conversione: ${inputPath} -> ${outputPath} (format=${options.format})`);

                const command = ffmpeg(inputPath)
                .output(outputPath)
                .on('progress', (info) => {
                if (onProgress && info.percent) {
                    onProgress(Math.floor(info.percent));
                }
                })
                .on('error', (err: Error) => {
                console.error('[AudioProcessor] Conversion Error:', err);
                resolve({ success: false, error: err.message });
                })
                .on('end', () => {
                console.log(`[AudioProcessor] Conversione completata: ${outputPath}`);
                resolve({ success: true });
                });

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
                * Rileva il silenzio iniziale e finale del file audio tramite FFmpeg silencedetect.

   * Viene eseguito nel main process (Node.js) per evitare OOM nel renderer su file grandi.
   * Ritorna trimStart e trimEnd in secondi.
   */
  static async detectSilence(filePath: string): Promise<any> {
    return new Promise((resolve) => {
        try {
            if (!fs.existsSync(filePath)) {
                return resolve({ success: false, error: 'File non trovato' });
            }

            console.log(`[AudioProcessor] Silence detection per: ${filePath}`);

            const args = [
                '-i', filePath,
                '-af', 'silencedetect=noise=-40dB:d=0.1',
                '-f', 'null', '-'
            ];

            const proc = spawn(safeFfmpegPath, args);
            let stderrData = '';

            const _silenceKillTimeout = setTimeout(() => {
                try { proc.kill('SIGKILL'); } catch { /* noop */ }
                resolve({ success: false, error: 'Timeout: silence detection exceeded 28s' });
            }, 28000);

            proc.stderr.on('data', (chunk: Buffer) => {
                stderrData += chunk.toString();
            });

            proc.on('error', (err: Error) => {
                clearTimeout(_silenceKillTimeout);
                console.error('[AudioProcessor] detectSilence spawn error:', err);
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
                        return resolve({ success: true, data: { trimStart: 0, trimEnd: 0, noSilence: true } });
                    }

                    if (duration > 0 && duration - trimEnd <= trimStart + 0.1) {
                        return resolve({ success: false, error: 'Il file sembra essere tutto silenzio o il volume è troppo basso.' });
                    }

                    console.log(`[AudioProcessor] Silence OK: trimStart=${trimStart}, trimEnd=${trimEnd}, dur=${duration.toFixed(2)}`);
                    resolve({ success: true, data: { trimStart, trimEnd } });
                } catch (parseErr) {
                    console.error('[AudioProcessor] Parse error silence:', parseErr);
                    resolve({ success: false, error: String(parseErr) });
                }
            });

        } catch (error) {
            console.error('[AudioProcessor] detectSilence error:', error);
            resolve({ success: false, error: String(error) });
        }
    });
  }
}
