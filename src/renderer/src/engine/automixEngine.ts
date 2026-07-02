// Automix Fase B (v1.10.21) — NUCLEO PURO del motore di transizione beat-aligned.
//
// Questo modulo contiene SOLO matematica testabile (nessun audio, nessuno store):
// dato lo stato dei due brani (bpm/offset/confidence dalla Fase A, posizione,
// trim) produce il "piano di transizione" — beat di aggancio sull'uscente,
// punto di partenza dell'entrante, playbackRate del tempo-match, durata del
// crossfade — oppure il fallback esplicito a crossfade classico (Fase D,
// progettata SUBITO come da piano: l'esito peggiore ammesso è un crossfade
// normale, MAI un mix sbagliato in onda).
//
// L'orchestrazione vera (chiamate a useAudioStore/StreamPlayer, rampa di
// rientro del rate, telemetria debugLog) arriva negli step successivi e
// consumerà queste funzioni senza modificarle.

/** Info beat di una clip (dalla Fase A, persistite nel .lmp). */
export interface BeatInfo {
    bpm?: number;
    beatOffsetSec?: number;
    bpmConfidence?: number;
}

export const AUTOMIX_DEFAULTS = {
    /** Cap del tempo-match: oltre questa deviazione di rate (±8%) si degrada a
     *  crossfade classico (piano B.2 — un rate più spinto si sente anche con
     *  preservesPitch). */
    maxRateDeviation: 0.08,
    /** Soglia di confidence sotto cui NON si tenta il beat-match. La validazione
     *  A3 su musica reale (docs/automix/VALIDAZIONE-A3.md) ha mostrato che 0.3
     *  non basta: "Mother" (tempo variabile) esce a 0.41, i brani buoni a 0.53+. */
    minConfidence: 0.5,
    /** Beat di crossfade di default (piano B.4, configurabile in futuro). */
    crossfadeBeats: 8,
    /** Margine minimo prima del beat di aggancio: copre la latenza di play()/
     *  scheduling (da tarare empiricamente nella fase di orchestrazione). */
    minLeadSec: 0.15,
} as const;

/**
 * Prossimo beat della griglia `t_k = beatOffsetSec + k·(60/bpm)` con
 * `t_k ≥ positionSec + minLeadSec`. I beat sono sull'asse del FILE (come
 * beatOffsetSec, v1.10.17), non del trim.
 */
export function nextBeatAfter(positionSec: number, bpm: number, beatOffsetSec: number, minLeadSec = 0): number | null {
    if (!isFinite(bpm) || bpm <= 0 || !isFinite(beatOffsetSec) || beatOffsetSec < 0) return null;
    if (!isFinite(positionSec) || !isFinite(minLeadSec)) return null;
    const period = 60 / bpm;
    const target = positionSec + minLeadSec;
    const k = Math.max(0, Math.ceil((target - beatOffsetSec) / period));
    return beatOffsetSec + k * period;
}

/**
 * PlaybackRate del tempo-match, OCTAVE-AWARE: l'entrante può agganciarsi al
 * tempo dell'uscente anche in rapporto half/double-time (es. 175.9 BPM sopra
 * un brano a 90 → rate 1.023, un beat sì e uno no coincidono). Si prova
 * m ∈ {0.5, 1, 2} e si sceglie il rate più vicino a 1; null se anche il
 * migliore supera il cap → fallback crossfade classico.
 */
export function computeTempoMatchRate(bpmOutgoing: number, bpmIncoming: number, maxDeviation: number = AUTOMIX_DEFAULTS.maxRateDeviation): number | null {
    if (!isFinite(bpmOutgoing) || bpmOutgoing <= 0 || !isFinite(bpmIncoming) || bpmIncoming <= 0) return null;
    let best: number | null = null;
    for (const m of [0.5, 1, 2]) {
        const rate = (bpmOutgoing * m) / bpmIncoming;
        if (best === null || Math.abs(rate - 1) < Math.abs(best - 1)) best = rate;
    }
    if (best === null || Math.abs(best - 1) > maxDeviation) return null;
    return best;
}

/** Durata del crossfade: N beat al tempo del brano USCENTE (il tempo in onda). */
export function crossfadeDurationSec(bpmOutgoing: number, beats: number = AUTOMIX_DEFAULTS.crossfadeBeats): number {
    if (!isFinite(bpmOutgoing) || bpmOutgoing <= 0 || !isFinite(beats) || beats <= 0) return 0;
    return beats * (60 / bpmOutgoing);
}

/** Motivi di fallback (Fase D) — telemetria/indicatori UI li useranno così come sono. */
export type ClassicReason = 'missing-bpm' | 'missing-offset' | 'low-confidence' | 'rate-cap' | 'no-beat-available';

export type TransitionPlan =
    | {
        mode: 'beatmatched';
        /** playbackRate iniziale dell'entrante (poi rampa di rientro a 1.0). */
        rate: number;
        /** Beat dell'USCENTE (asse file) su cui parte l'entrante. */
        anchorBeatSec: number;
        /** Punto di partenza dell'ENTRANTE (asse file): un suo beat ≥ trimStart. */
        incomingStartSec: number;
        /** Durata del crossfade in secondi (N beat al tempo dell'uscente). */
        crossfadeSec: number;
    }
    | { mode: 'classic'; reason: ClassicReason };

/**
 * Decisione completa della transizione (piano B.1-B.4 + regole Fase D).
 * Regola d'oro: qualunque dato mancante/debole → 'classic', senza tentativi eroici.
 *
 * @param outgoing brano in onda: info beat + posizione corrente; `effectiveEndSec`
 *                 (durata − trimEnd) permette di rifiutare agganci troppo a ridosso della fine.
 * @param incoming brano successivo: info beat + trimStart (default 0).
 */
export function planTransition(args: {
    outgoing: BeatInfo & { positionSec: number; effectiveEndSec?: number };
    incoming: BeatInfo & { trimStartSec?: number };
    options?: Partial<{ maxRateDeviation: number; minConfidence: number; crossfadeBeats: number; minLeadSec: number }>;
}): TransitionPlan {
    const { outgoing, incoming } = args;
    const opt = { ...AUTOMIX_DEFAULTS, ...(args.options ?? {}) };

    if (!outgoing.bpm || !incoming.bpm) return { mode: 'classic', reason: 'missing-bpm' };
    if (outgoing.beatOffsetSec === undefined || incoming.beatOffsetSec === undefined) {
        return { mode: 'classic', reason: 'missing-offset' };
    }
    // Confidence ASSENTE = insufficiente (clip analizzate prima della persistenza
    // della confidence, v1.10.20): prudenza, il re-check la porterà.
    if ((outgoing.bpmConfidence ?? 0) < opt.minConfidence || (incoming.bpmConfidence ?? 0) < opt.minConfidence) {
        return { mode: 'classic', reason: 'low-confidence' };
    }

    const rate = computeTempoMatchRate(outgoing.bpm, incoming.bpm, opt.maxRateDeviation);
    if (rate === null) return { mode: 'classic', reason: 'rate-cap' };

    const anchorBeatSec = nextBeatAfter(outgoing.positionSec, outgoing.bpm, outgoing.beatOffsetSec, opt.minLeadSec);
    if (anchorBeatSec === null) return { mode: 'classic', reason: 'no-beat-available' };

    const crossfadeSec = crossfadeDurationSec(outgoing.bpm, opt.crossfadeBeats);
    // L'aggancio deve lasciare spazio al crossfade prima della fine effettiva
    // dell'uscente: altrimenti il mix verrebbe troncato → meglio il classico.
    if (outgoing.effectiveEndSec !== undefined && anchorBeatSec + crossfadeSec > outgoing.effectiveEndSec) {
        return { mode: 'classic', reason: 'no-beat-available' };
    }

    const incomingStartSec = nextBeatAfter(incoming.trimStartSec ?? 0, incoming.bpm, incoming.beatOffsetSec, 0);
    if (incomingStartSec === null) return { mode: 'classic', reason: 'no-beat-available' };

    return { mode: 'beatmatched', rate, anchorBeatSec, incomingStartSec, crossfadeSec };
}
