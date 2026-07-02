// BPM Detection (2026-07-01) — helper di classificazione, stesso schema di
// silenceDetection.ts: distingue "analisi fallita" (rate-limit/timeout/file
// corrotto — da ritentare al prossimo caricamento) da "analisi riuscita" (con
// o senza un BPM rilevabile), evitando di marcare per sempre come controllata
// una clip la cui analisi non è mai realmente avvenuta.

export interface BpmDetectResult {
    success: boolean;
    data?: { bpm: number; confidence: number; detected: boolean; beatOffsetSec?: number } | null;
    error?: string;
}

export interface BpmClassification {
    /** true solo se l'analisi è realmente avvenuta (con o senza BPM rilevato). */
    checked: boolean;
    /** presente solo se l'analisi ha prodotto una stima valida (detected:true). */
    bpm?: number;
    /** v1.10.17 (Automix Fase A): fase della griglia dei beat, se stimata dal main.
     *  Può mancare anche con bpm presente (inviluppo senza salite nette). */
    beatOffsetSec?: number;
    /** v1.10.20 (chiusura A3): confidence 0..1 della stima — segnale di fallback
     *  della Fase D (soglia ≥0.5, vedi docs/automix/VALIDAZIONE-A3.md). */
    confidence?: number;
}

export function classifyBpmResult(result: BpmDetectResult): BpmClassification {
    if (!result.success || !result.data) {
        return { checked: false }; // fallita/dati assenti: NON segnare come controllata, ritentare al prossimo load
    }
    if (!result.data.detected) {
        return { checked: true }; // analisi riuscita, nessuna periodicità marcata (es. voce/ambient)
    }
    return {
        checked: true,
        bpm: result.data.bpm,
        ...(typeof result.data.beatOffsetSec === 'number' && isFinite(result.data.beatOffsetSec)
            ? { beatOffsetSec: result.data.beatOffsetSec }
            : {}),
        ...(typeof result.data.confidence === 'number' && isFinite(result.data.confidence)
            ? { confidence: result.data.confidence }
            : {})
    };
}
