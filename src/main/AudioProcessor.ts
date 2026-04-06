import * as fs from 'fs';
import * as mm from 'music-metadata';
import * as ffmpeg from 'fluent-ffmpeg';

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
  static async generateWaveformData(filePath: string): Promise<any> {
    return new Promise((resolve) => {
        try {
            console.log(`[AudioProcessor] Generazione Peak Data per: ${filePath}`);

            // Utilizziamo un semplice child process chiamando ffmpeg statico
            // Estrarrà i peak grezzi su un frame ristretto per velocità, per poi buildare i dati omettendo
            // i blob pesanti. Stiamo simulando il behavior del builder audiowaveform 
            // ma lo facciamo interamente in fluente-ffmpeg. 
            
            let audioBuffer: number[] = [];

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
                .on('error', (err: any) => {
                    console.error('[AudioProcessor] Waveform Error:', err);
                    resolve({ success: false, error: err.message });
                });

            // Una transform stream (rimossa in v0.11.0 poiché si ascolta l'evento data direttamente)

            const ffStream = command.pipe();
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
                    reducedPeaks.push(max);
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
}
