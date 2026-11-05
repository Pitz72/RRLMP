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
    /** v1.15.37: quanto la griglia cade sugli attacchi della cassa (vedi minGridScore). */
    beatGridScore?: number;
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
    /** v1.15.37 — punteggio minimo della griglia dei beat (refineBeatGrid, main).
     *  Su 38 brani di Sanremo 2026 con confidence ≥ 0.5, sopra 2,5 la griglia del
     *  primo minuto prende i battiti del minuto dopo con 3 ms di scarto mediano;
     *  sotto (ballate, cassa irregolare) gli scarti arrivano a mezzo battito.
     *  Sotto soglia → crossfade classico: mai battute agganciate a caso. */
    minGridScore: 2.5,
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

/**
 * Compatibilità di mix tra due brani ADIACENTI in scaletta (indicatore C1):
 * verde = beat-match comodo (deviazione ≤4%), giallo = al limite (≤ cap 8%),
 * rosso = si andrà di crossfade classico (delta troppo grande o dati mancanti).
 * Stessa semantica octave-aware di computeTempoMatchRate.
 */
export function assessCompatibility(
    prev: BeatInfo,
    next: BeatInfo,
    options?: Partial<{ maxRateDeviation: number; minConfidence: number; minGridScore: number }>
): { level: 'green' | 'yellow' | 'red'; reason?: ClassicReason; rate?: number } {
    const opt = { ...AUTOMIX_DEFAULTS, ...(options ?? {}) };
    if (!prev.bpm || !next.bpm) return { level: 'red', reason: 'missing-bpm' };
    if (prev.beatOffsetSec === undefined || next.beatOffsetSec === undefined) {
        return { level: 'red', reason: 'missing-offset' };
    }
    if ((prev.bpmConfidence ?? 0) < opt.minConfidence || (next.bpmConfidence ?? 0) < opt.minConfidence) {
        return { level: 'red', reason: 'low-confidence' };
    }
    // v1.15.37: griglia non affidabile (o analizzata prima della 1.15.37) → crossfade
    if ((prev.beatGridScore ?? 0) < opt.minGridScore || (next.beatGridScore ?? 0) < opt.minGridScore) {
        return { level: 'red', reason: 'low-confidence' };
    }
    const rate = computeTempoMatchRate(prev.bpm, next.bpm, opt.maxRateDeviation);
    if (rate === null) return { level: 'red', reason: 'rate-cap' };
    return { level: Math.abs(rate - 1) <= 0.04 ? 'green' : 'yellow', rate };
}

export type TransitionPlan =
    | {
        mode: 'beatmatched';
        /** playbackRate iniziale dell'entrante (poi rampa di rientro a 1.0). */
        rate: number;
        /** Beat dell'USCENTE (asse file) su cui parte l'entrante. */
        anchorBeatSec: number;
        /** Punto di partenza dell'ENTRANTE (asse file): un suo beat ≥ trimStart. */
        incomingStartSec: number;
        /** Durata del crossfade in secondi REALI (N beat al tempo udito dell'uscente). */
        crossfadeSec: number;
        /** v1.15.37: playbackRate dell'uscente al momento del piano (1 = velocità nominale). */
        outgoingRate: number;
    }
    | { mode: 'classic'; reason: ClassicReason };

/**
 * Decisione completa della transizione (piano B.1-B.4 + regole Fase D).
 * Regola d'oro: qualunque dato mancante/debole → 'classic', senza tentativi eroici.
 *
 * @param outgoing brano in onda: info beat + posizione corrente; `effectiveEndSec`
 *                 (durata − trimEnd) permette di rifiutare agganci troppo a ridosso della fine.
 *                 `playbackRate` (v1.15.37) è la velocità a cui sta suonando DAVVERO.
 * @param incoming brano successivo: info beat + trimStart (default 0).
 *
 * v1.15.37 — PASSAGGI RAPIDI (classifica veloce, medley). Dopo un mix l'entrante
 * suona a un rate ≠ 1 (agganciato al tempo dell'uscente) e rientra a 1.0 di 0,1%
 * al secondo: per un delta del 3% servono 30 s. Se l'operatore passa al brano
 * dopo prima di allora, il tempo UDITO è bpm·rate, non bpm. Fino alla 1.15.36
 * il piano usava il bpm nominale: entrante agganciato a un tempo sbagliato fino
 * all'8% → battute sfasate già a metà del crossfade. Ora il tempo dell'uscente è
 * quello effettivo; la griglia dei beat resta sull'asse del file (bpm nominale),
 * le durate in secondi reali.
 */
export function planTransition(args: {
    outgoing: BeatInfo & { positionSec: number; effectiveEndSec?: number; playbackRate?: number };
    incoming: BeatInfo & { trimStartSec?: number };
    options?: Partial<{ maxRateDeviation: number; minConfidence: number; minGridScore: number; crossfadeBeats: number; minLeadSec: number }>;
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
    // v1.15.37: griglia dei beat non affidabile (o analizzata prima della 1.15.37,
    // quando era sfasata di ~140 ms in mediana) → crossfade classico.
    if ((outgoing.beatGridScore ?? 0) < opt.minGridScore || (incoming.beatGridScore ?? 0) < opt.minGridScore) {
        return { mode: 'classic', reason: 'low-confidence' };
    }

    const outgoingRate = outgoing.playbackRate !== undefined && isFinite(outgoing.playbackRate) && outgoing.playbackRate > 0
        ? outgoing.playbackRate
        : 1;
    const heardOutgoingBpm = outgoing.bpm * outgoingRate;

    const rate = computeTempoMatchRate(heardOutgoingBpm, incoming.bpm, opt.maxRateDeviation);
    if (rate === null) return { mode: 'classic', reason: 'rate-cap' };

    // Lead in secondi reali → secondi del file dell'uscente
    const anchorBeatSec = nextBeatAfter(outgoing.positionSec, outgoing.bpm, outgoing.beatOffsetSec, opt.minLeadSec * outgoingRate);
    if (anchorBeatSec === null) return { mode: 'classic', reason: 'no-beat-available' };

    const crossfadeSec = crossfadeDurationSec(heardOutgoingBpm, opt.crossfadeBeats);
    // L'aggancio deve lasciare spazio al crossfade prima della fine effettiva
    // dell'uscente: altrimenti il mix verrebbe troncato → meglio il classico.
    // (crossfade in secondi reali → secondi del file dell'uscente)
    if (outgoing.effectiveEndSec !== undefined && anchorBeatSec + crossfadeSec * outgoingRate > outgoing.effectiveEndSec) {
        return { mode: 'classic', reason: 'no-beat-available' };
    }

    const incomingStartSec = nextBeatAfter(incoming.trimStartSec ?? 0, incoming.bpm, incoming.beatOffsetSec, 0);
    if (incomingStartSec === null) return { mode: 'classic', reason: 'no-beat-available' };

    return { mode: 'beatmatched', rate, anchorBeatSec, incomingStartSec, crossfadeSec, outgoingRate };
}

/**
 * v1.15.37 — posizione (asse file) a cui portare l'entrante, già partito, perché
 * quando l'uscente arriva su `anchorBeatSec` l'entrante sia esattamente su
 * `incomingStartSec`. Assorbe la latenza reale di load()+play(): si chiama a
 * entrambi i brani in riproduzione.
 *
 * Tempo reale fino all'aggancio = (anchor − posOut) / rateOut; in quel tempo
 * l'entrante avanza di tempo·rateIn secondi del suo file.
 * Mai posizioni negative: si avanza di beat INTERI dell'entrante (stessa fase).
 */
export function incomingSeekForPhase(
    plan: { anchorBeatSec: number; incomingStartSec: number; rate: number; outgoingRate?: number },
    outgoingPositionNowSec: number,
    incomingBpm: number
): number {
    const rateOut = plan.outgoingRate && plan.outgoingRate > 0 ? plan.outgoingRate : 1;
    const realSecToAnchor = (plan.anchorBeatSec - outgoingPositionNowSec) / rateOut;
    let aligned = plan.incomingStartSec - realSecToAnchor * plan.rate;
    if (aligned < 0 && isFinite(incomingBpm) && incomingBpm > 0) {
        const periodIn = 60 / incomingBpm;
        aligned += Math.ceil(-aligned / periodIn) * periodIn;
    }
    return Math.max(0, aligned);
}

/** v1.15.37 — durate del mix a scelta dell'operatore (in beat): corto, medio, lungo. */
export const AUTOMIX_BEAT_CHOICES = [4, 8, 16] as const;
export type AutomixBeats = typeof AUTOMIX_BEAT_CHOICES[number];

/**
 * v1.15.37 — brano su cui mixare con «PROSSIMO»: il primo DOPO quello in onda
 * che abbia un file (in una classifica veloce un file mancante si salta, non
 * blocca la sequenza). Nulla in onda → il primo brano disponibile.
 */
export function findMixNext<T extends { id: string; isMissing?: boolean }>(clips: T[], currentId: string | null): T | null {
    const start = currentId ? clips.findIndex((c) => c.id === currentId) + 1 : 0;
    if (currentId && start === 0) return null; // il brano in onda non è in scaletta
    for (let i = start; i < clips.length; i++) {
        if (!clips[i].isMissing) return clips[i];
    }
    return null;
}
