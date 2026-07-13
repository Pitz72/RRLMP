/**
 * Scala e misure del VU meter master (v1.15.13) — logica pura, testabile.
 *
 * Fino alla v1.15.12 il meter mappava l'RMS lineare in percentuale
 * (`rms · 100 · 2`, clamp a 100): il programma tipico a −14 LUFS stava a
 * ~30-40% della corsa, un bed duckato era invisibile e tutto ciò che superava
 * −6 dBFS RMS era appiattito a fondo scala. Un meter da regia lavora in dB:
 * qui la corsa 0–100% mappa linearmente −48…0 dBFS, così il programma normale
 * sta a ~70%, il giallo inizia davvero attorno a −12 dB e il rosso vive solo
 * a ridosso del limiter (−1 dBFS).
 */

/** Fondo scala del meter in dBFS: sotto questo livello la barra è a zero. */
export const METER_DB_FLOOR = -48;

/** Ampiezza lineare (0..1+) → dBFS. Silenzio/valori non validi → −Infinity. */
export const ampToDb = (amp: number): number =>
    Number.isFinite(amp) && amp > 0 ? 20 * Math.log10(amp) : -Infinity;

/** dBFS → percentuale di corsa del meter (0..100), lineare in dB su [FLOOR..0]. */
export const dbToPct = (db: number): number => {
    if (!Number.isFinite(db)) return 0;
    return Math.max(0, Math.min(100, ((db - METER_DB_FLOOR) / -METER_DB_FLOOR) * 100));
};

export interface MeterReading {
    /** Livello RMS della finestra, in dBFS (−Infinity = silenzio). */
    rmsDb: number;
    /** Picco assoluto della finestra, in dBFS (−Infinity = silenzio). */
    peakDb: number;
}

/**
 * RMS + picco di una finestra di campioni float (-1..1) in un solo passaggio.
 * Finestra vuota → silenzio (−Infinity), mai NaN.
 */
export const analyzeBuffer = (buf: Float32Array): MeterReading => {
    if (buf.length === 0) return { rmsDb: -Infinity, peakDb: -Infinity };
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < buf.length; i++) {
        const v = buf[i];
        sum += v * v;
        const a = Math.abs(v);
        if (a > peak) peak = a;
    }
    return { rmsDb: ampToDb(Math.sqrt(sum / buf.length)), peakDb: ampToDb(peak) };
};
