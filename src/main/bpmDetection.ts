// BPM Detection (2026-07-01) — stima automatica del tempo di un brano per abilitare
// in futuro crossfade beat-aligned negli show musicali (nessun uso del BPM ancora
// nel motore audio: questo modulo copre solo la logica pura di stima).
//
// Approccio: onset detection + autocorrelazione, in puro JS/TS, senza dipendenze
// esterne. AudioProcessor.detectBpm() decodifica il file in PCM mono a bassa
// samplerate via FFmpeg e passa i campioni a queste funzioni pure (testabili
// senza FFmpeg/filesystem).

export interface BpmEstimate {
    bpm: number;
    /** 0..1, quanto è marcata la periodicità trovata nell'inviluppo energetico. */
    confidence: number;
}

const MIN_BPM = 60;
const MAX_BPM = 200;
/** Range "di riferimento" in cui riportare le ottave doppie/dimezzate del lag trovato. */
const OCTAVE_LOW = 90;
const OCTAVE_HIGH = 180;

/**
 * Calcola l'inviluppo di energia (RMS a finestre) da campioni PCM16 mono.
 * `windowMs` determina la risoluzione temporale dell'inviluppo (e quindi la
 * frequenza di campionamento dell'inviluppo stesso, ritornata dal chiamante).
 */
export function computeEnergyEnvelope(samples: Int16Array, sampleRate: number, windowMs = 20): number[] {
    const windowSize = Math.max(1, Math.round((sampleRate * windowMs) / 1000));
    const envelope: number[] = [];
    for (let i = 0; i < samples.length; i += windowSize) {
        const end = Math.min(i + windowSize, samples.length);
        let sumSq = 0;
        for (let j = i; j < end; j++) {
            const v = samples[j] / 32768;
            sumSq += v * v;
        }
        envelope.push(Math.sqrt(sumSq / (end - i)));
    }
    return envelope;
}

/**
 * Stima il BPM tramite autocorrelazione dell'inviluppo di energia: cerca il
 * ritardo (lag), nel range 60-200 BPM, per cui l'inviluppo correla meglio con
 * se stesso — cioè il periodo del beat dominante.
 *
 * @param envelope inviluppo di energia (vedi computeEnergyEnvelope)
 * @param envelopeRateHz frequenza di campionamento dell'inviluppo (= 1000/windowMs)
 */
export function estimateBpmFromEnvelope(envelope: number[], envelopeRateHz: number): BpmEstimate | null {
    if (envelopeRateHz <= 0 || envelope.length < envelopeRateHz * 2) return null; // servono almeno ~2s di dati

    const mean = envelope.reduce((a, b) => a + b, 0) / envelope.length;
    const centered = envelope.map(v => v - mean);

    const energyVariance = centered.reduce((a, b) => a + b * b, 0) / centered.length;
    if (!isFinite(energyVariance) || energyVariance <= 0) return null; // segnale piatto/silenzio: nessun beat rilevabile

    const minLag = Math.max(1, Math.floor((60 / MAX_BPM) * envelopeRateHz));
    const maxLag = Math.min(centered.length - 1, Math.ceil((60 / MIN_BPM) * envelopeRateHz));
    if (minLag >= maxLag) return null;

    let bestLag = -1;
    let bestScore = -Infinity;
    const scores = new Map<number, number>();
    for (let lag = minLag; lag <= maxLag; lag++) {
        let sum = 0;
        for (let i = 0; i + lag < centered.length; i++) {
            sum += centered[i] * centered[i + lag];
        }
        const norm = sum / (centered.length - lag);
        scores.set(lag, norm);
        if (norm > bestScore) {
            bestScore = norm;
            bestLag = lag;
        }
    }
    if (bestLag <= 0) return null;

    const confidence = Math.max(0, Math.min(1, bestScore / energyVariance));

    // v1.10.14 (preparazione Automix): interpolazione parabolica del picco di
    // autocorrelazione → lag frazionario. Con inviluppo a 50Hz il lag INTERO
    // quantizza il BPM a passi grossi (~±2.5 BPM attorno a 120: 95 BPM reali
    // venivano letti 93.8) — troppo per il tempo-match via playbackRate, dove
    // l'errore di stima diventa deriva di fase nel crossfade beat-aligned.
    // Fit di una parabola sui 3 punti attorno al picco: il vertice è il periodo vero.
    let refinedLag = bestLag;
    const sPrev = scores.get(bestLag - 1);
    const sNext = scores.get(bestLag + 1);
    if (sPrev !== undefined && sNext !== undefined) {
        const denom = sPrev - 2 * bestScore + sNext;
        if (denom < 0) { // picco concavo valido
            const delta = 0.5 * (sPrev - sNext) / denom;
            if (isFinite(delta) && Math.abs(delta) <= 0.5) refinedLag = bestLag + delta;
        }
    }

    let bpm = 60 / (refinedLag / envelopeRateHz);
    // Riporta ottave doppie/dimezzate del lag trovato nel range di riferimento
    // (l'autocorrelazione su musica con beat marcato spesso trova anche il
    // sottomultiplo/multiplo del tempo percepito).
    while (bpm < OCTAVE_LOW) bpm *= 2;
    while (bpm > OCTAVE_HIGH) bpm /= 2;

    if (!isFinite(bpm) || bpm <= 0) return null;

    return { bpm: Math.round(bpm * 10) / 10, confidence: Math.round(confidence * 100) / 100 };
}
