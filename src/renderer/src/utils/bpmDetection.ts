// BPM Detection (2026-07-01) — helper di classificazione, stesso schema di
// silenceDetection.ts: distingue "analisi fallita" (rate-limit/timeout/file
// corrotto — da ritentare al prossimo caricamento) da "analisi riuscita" (con
// o senza un BPM rilevabile), evitando di marcare per sempre come controllata
// una clip la cui analisi non è mai realmente avvenuta.

export interface BpmDetectResult {
    success: boolean;
    data?: { bpm: number; confidence: number; detected: boolean } | null;
    error?: string;
}

export interface BpmClassification {
    /** true solo se l'analisi è realmente avvenuta (con o senza BPM rilevato). */
    checked: boolean;
    /** presente solo se l'analisi ha prodotto una stima valida (detected:true). */
    bpm?: number;
}

export function classifyBpmResult(result: BpmDetectResult): BpmClassification {
    if (!result.success || !result.data) {
        return { checked: false }; // fallita/dati assenti: NON segnare come controllata, ritentare al prossimo load
    }
    if (!result.data.detected) {
        return { checked: true }; // analisi riuscita, nessuna periodicità marcata (es. voce/ambient)
    }
    return { checked: true, bpm: result.data.bpm };
}
