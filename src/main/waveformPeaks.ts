/**
 * Estrazione peaks waveform — logica pura, testabile senza FFmpeg (v1.15.12).
 *
 * Fino alla v1.15.11 la pipeline usava `-filter:a aresample=100`: il resampler,
 * per anti-aliasing, applica un passa-basso a ~50 Hz (Nyquist di 100 Hz), quindi
 * ciò che arrivava al calcolo dei picchi NON era l'inviluppo del brano ma il suo
 * residuo sub-bass (voce, chitarre, piatti quasi invisibili; da qui il ×2.0 "di
 * visibilità" poi clippato a 1.0). Ora il decode è a 8 kHz e l'inviluppo è un
 * vero max(|campione|) per finestre da 10 ms, ridotto a barre di pari durata e
 * normalizzato al picco del file, come in un editor audio.
 */

export const WAVEFORM_SAMPLE_RATE = 8000;
export const WAVEFORM_WINDOW_SAMPLES = 80; // 10 ms @ 8 kHz → 100 valori/secondo
export const WAVEFORM_TARGET_BARS = 200;   // stesso contratto IPC/renderer di prima

// Sotto questo picco (~−60 dBFS) il file è in pratica silenzio: normalizzarlo
// amplificherebbe solo il rumore di fondo, quindi le barre restano com'è.
const SILENCE_PEAK_FLOOR = 0.001;

/**
 * Accumula PCM s16le mono in streaming e produce l'inviluppo max(|x|) per
 * finestre da WAVEFORM_WINDOW_SAMPLES campioni. La memoria è O(durata·100/s),
 * non O(campioni): mai l'intero PCM in RAM.
 *
 * Gestisce il carry del byte dispari tra chunk: un campione a 16 bit può
 * arrivare spezzato su due chunk dello stream (il vecchio codice scartava il
 * byte di coda e da lì in poi leggeva tutti i campioni disallineati di un byte).
 */
export class PeakAccumulator {
    private carry: number | null = null; // byte basso orfano del chunk precedente
    private windowMax = 0;
    private windowCount = 0;
    private envelope: number[] = [];

    push(chunk: Buffer): void {
        let start = 0;
        if (this.carry !== null && chunk.length > 0) {
            // Completa il campione spezzato: carry = byte basso (LE), chunk[0] = byte alto.
            const raw = (chunk[0] << 8) | this.carry;
            this.addSample((raw << 16) >> 16); // sign-extend a int16
            this.carry = null;
            start = 1;
        }
        const even = start + Math.floor((chunk.length - start) / 2) * 2;
        for (let i = start; i < even; i += 2) {
            this.addSample(chunk.readInt16LE(i));
        }
        this.carry = even < chunk.length ? chunk[even] : this.carry;
    }

    private addSample(s16: number): void {
        const a = Math.abs(s16) / 32768;
        if (a > this.windowMax) this.windowMax = a;
        if (++this.windowCount >= WAVEFORM_WINDOW_SAMPLES) {
            this.envelope.push(this.windowMax);
            this.windowMax = 0;
            this.windowCount = 0;
        }
    }

    /** Chiude la finestra residua e restituisce l'inviluppo raccolto (0..1). */
    finalize(): number[] {
        if (this.windowCount > 0) {
            this.envelope.push(this.windowMax);
            this.windowMax = 0;
            this.windowCount = 0;
        }
        return this.envelope;
    }
}

/**
 * Riduce l'inviluppo a `bars` barre di pari durata (max per gruppo, mai media:
 * la media nasconde i transienti) e normalizza al picco del file, così la barra
 * più alta tocca sempre 1.0 e il profilo resta leggibile anche su file
 * masterizzati piano. File in pratica silenziosi non vengono amplificati.
 */
export function reduceToBars(envelope: number[], bars = WAVEFORM_TARGET_BARS): number[] {
    if (envelope.length === 0) return [];
    const n = Math.min(bars, envelope.length);
    const out: number[] = new Array(n);
    let peak = 0;
    for (let b = 0; b < n; b++) {
        const start = Math.floor((b * envelope.length) / n);
        const end = Math.max(start + 1, Math.floor(((b + 1) * envelope.length) / n));
        let max = 0;
        for (let i = start; i < end; i++) {
            if (envelope[i] > max) max = envelope[i];
        }
        out[b] = max;
        if (max > peak) peak = max;
    }
    if (peak <= SILENCE_PEAK_FLOOR) return out;
    for (let b = 0; b < n; b++) out[b] = Math.min(1, out[b] / peak);
    return out;
}
