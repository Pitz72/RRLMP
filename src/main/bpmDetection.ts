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

/**
 * Fase A Automix (v1.10.16) — stima la FASE della griglia dei beat: l'offset in
 * secondi (dall'inizio dell'audio analizzato) del primo beat. Con `bpm` +
 * `beatOffsetSec` il motore di transizione può calcolare la posizione di
 * qualunque beat: t_k = offset + k * (60/bpm).
 *
 * Metodo: comb-filter sulla fase. Il periodo è noto (dal BPM stimato); per ogni
 * fase p ∈ [0, periodo) si somma l'energia di ONSET in p + k*periodo — la fase
 * col massimo è quella dei beat. Si usa l'onset (derivata positiva
 * dell'inviluppo, half-wave rectified) invece dell'inviluppo grezzo: il beat è
 * dove l'energia SALE, e i picchi di salita sono molto più netti del plateau
 * RMS (un sustain lungo non deve vincere sul transiente).
 *
 * NB: il BPM passato è quello già riportato in ottava (90-180). Se il tempo
 * "vero" fosse il sottomultiplo, metà dei beat della griglia cade tra gli
 * onset reali, ma la fase di massimo resta agganciata agli onset veri: per
 * l'allineamento delle transizioni è comunque corretta.
 *
 * @param envelope inviluppo di energia (vedi computeEnergyEnvelope)
 * @param envelopeRateHz frequenza di campionamento dell'inviluppo
 * @param bpm tempo stimato (da estimateBpmFromEnvelope)
 * @returns offset del primo beat in secondi, o null se non stimabile
 */
export function estimateBeatOffsetSec(envelope: number[], envelopeRateHz: number, bpm: number): number | null {
    if (!isFinite(bpm) || bpm <= 0 || envelopeRateHz <= 0) return null;
    const period = (60 / bpm) * envelopeRateHz; // in campioni di inviluppo (frazionario)
    if (!isFinite(period) || period < 2 || envelope.length < period * 2) return null;

    // Onset: derivata positiva dell'inviluppo, half-wave rectified.
    const onset = new Array<number>(envelope.length).fill(0);
    for (let i = 1; i < envelope.length; i++) {
        const d = envelope[i] - envelope[i - 1];
        if (d > 0) onset[i] = d;
    }

    // Comb-filter: fase a passo sub-campione (0.25) con interpolazione lineare
    // dell'onset — il periodo è frazionario (v1.10.14), quantizzare la fase al
    // campione intero butterebbe via la precisione appena guadagnata.
    const PHASE_STEP = 0.25;
    let bestPhase = 0;
    let bestAvg = -Infinity;
    for (let p = 0; p < period; p += PHASE_STEP) {
        let sum = 0;
        let count = 0;
        for (let t = p; t < onset.length - 1; t += period) {
            const i = Math.floor(t);
            const frac = t - i;
            sum += onset[i] * (1 - frac) + onset[i + 1] * frac;
            count++;
        }
        if (count > 0) {
            const avg = sum / count;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestPhase = p;
            }
        }
    }
    // Nessuna salita di energia in tutto l'inviluppo (segnale piatto/decrescente):
    // la fase sarebbe arbitraria, meglio dichiarare "non stimabile".
    if (bestAvg <= 0) return null;

    const offsetSec = bestPhase / envelopeRateHz;
    return Math.round(offsetSec * 1000) / 1000; // ms di precisione, come i trim
}
