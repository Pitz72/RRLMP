// Taglio automatico del silenzio: decide cosa scrivere nella clip dopo un'analisi.
//
// v1.7.1 — un'analisi fallita (rate-limit, timeout, file illeggibile) non viene MAI
// segnata come «controllata»: va ritentata al caricamento successivo.
//
// v1.15.38 — il rilevatore nel main ora taglia solo il silenzio ai bordi del file
// (silenceTrim.ts). Fino alla 1.15.37 una pausa interna poteva diventare il punto
// di partenza o di fine del brano, e quei tagli sono salvati nei progetti. Al primo
// caricamento ogni clip senza silenceCheckedV3 viene rianalizzata e qui si decide:
//   - clip mai analizzata, o senza tagli → si scrive il taglio nuovo;
//   - tagli salvati IDENTICI a ciò che il vecchio rilevatore produce oggi sullo
//     stesso file → li aveva scritti lui: si sostituiscono col taglio nuovo;
//   - tagli salvati diversi → li ha toccati l'operatore: restano com'erano.
//
// v1.15.39 — la stessa analisi misura la durata VERA del file (decodifica completa)
// e la scrive nella clip con durationDecoded: alcuni file dichiarano una durata
// falsa e il mix automatico, la dissolvenza finale e il taglio non scattavano.
// Le clip già ricontrollate dalla 1.15.38 vengono rianalizzate una volta solo per
// la durata (reason 'durationOnly'), senza toccare i tagli.

export interface SilenceDetectResult {
    success: boolean;
    data?: {
        trimStart: number;
        trimEnd: number;
        noSilence?: boolean;
        contentStartSec?: number;
        contentEndSec?: number;
        durationSec?: number;
        legacy?: { trimStart: number; trimEnd: number } | null;
    } | null;
    error?: string;
}

export interface ClipTrimState {
    trimStart?: number;
    trimEnd?: number;
    silenceCheckedV2?: boolean;
    silenceCheckedV3?: boolean;
    duration?: number;
    durationDecoded?: boolean;
}

export type SilenceDecisionReason =
    | 'failed'          // analisi non riuscita: niente da scrivere, si ritenta
    | 'applied'         // clip nuova o senza tagli: taglio nuovo scritto
    | 'replacedLegacy'  // tagli del vecchio rilevatore sostituiti
    | 'keptManual'      // tagli dell'operatore lasciati com'erano
    | 'durationOnly';   // v1.15.39: clip già ricontrollata, si aggiunge solo la durata misurata

export interface SilenceDecision {
    reason: SilenceDecisionReason;
    /** Campi da scrivere nella clip (assente se l'analisi è fallita). */
    patch?: {
        trimStart?: number;
        trimEnd?: number;
        silenceCheckedV2: true;
        silenceCheckedV3: true;
        duration?: number;
        durationDecoded?: true;
    };
    /** Solo per replacedLegacy: il taglio vecchio cambiava di più di 50 ms. */
    changed?: boolean;
    /** v1.15.39: la durata salvata differiva da quella misurata di più di DURATION_FIX_SEC
     *  (intestazione del file sbagliata): vale la pena salvarla e dirlo all'operatore. */
    durationFixed?: boolean;
}

/** v1.15.39 — oltre questo scarto la durata dei metadati si considera sbagliata. */
export const DURATION_FIX_SEC = 0.5;

/** Tolleranza per riconoscere un taglio del vecchio rilevatore (salvato a 3 decimali). */
export const LEGACY_MATCH_TOLERANCE_SEC = 0.0015;

const same = (a: number, b: number): boolean => Math.abs(a - b) <= LEGACY_MATCH_TOLERANCE_SEC;

/** Va chiesta al main anche l'impronta del vecchio rilevatore per questa clip?
 *  Solo prima del gate V3: dopo, i tagli sono già quelli nuovi o dell'operatore. */
export function needsLegacyFingerprint(clip: ClipTrimState): boolean {
    return !clip.silenceCheckedV3 && !!clip.silenceCheckedV2 && ((clip.trimStart ?? 0) > 0 || (clip.trimEnd ?? 0) > 0);
}

/** Va (ri)analizzata al caricamento? Senza gate V3 o senza durata misurata. */
export function needsSilenceAnalysis(clip: ClipTrimState & { isMissing?: boolean }): boolean {
    return !clip.isMissing && (!clip.silenceCheckedV3 || !clip.durationDecoded);
}

export function decideSilenceUpdate(clip: ClipTrimState, result: SilenceDetectResult): SilenceDecision {
    if (!result.success || !result.data) return { reason: 'failed' };

    const d = result.data;
    const next = { trimStart: d.noSilence ? 0 : d.trimStart, trimEnd: d.noSilence ? 0 : d.trimEnd };
    const flags = { silenceCheckedV2: true as const, silenceCheckedV3: true as const };

    // v1.15.39: durata misurata decodificando il file (vera anche quando l'intestazione mente).
    const measured = d.durationSec !== undefined && d.durationSec > 0 ? Math.round(d.durationSec * 1000) / 1000 : undefined;
    const durationPatch = measured !== undefined ? { duration: measured, durationDecoded: true as const } : {};
    const durationFixed = measured !== undefined && !(Math.abs((clip.duration ?? 0) - measured) <= DURATION_FIX_SEC);

    // Clip già ricontrollata dalla 1.15.38: i suoi tagli sono già quelli nuovi (o
    // dell'operatore) e non si toccano; manca solo la durata misurata.
    if (clip.silenceCheckedV3) {
        return { reason: 'durationOnly', patch: { ...flags, ...durationPatch }, durationFixed };
    }

    const storedStart = clip.trimStart ?? 0;
    const storedEnd = clip.trimEnd ?? 0;

    if (!clip.silenceCheckedV2 || (storedStart === 0 && storedEnd === 0)) {
        return { reason: 'applied', patch: { ...next, ...flags, ...durationPatch }, durationFixed };
    }

    const legacy = d.legacy;
    if (legacy && same(storedStart, legacy.trimStart) && same(storedEnd, legacy.trimEnd)) {
        const changed = Math.abs(storedStart - next.trimStart) > 0.05 || Math.abs(storedEnd - next.trimEnd) > 0.05;
        return { reason: 'replacedLegacy', patch: { ...next, ...flags, ...durationPatch }, changed, durationFixed };
    }

    return { reason: 'keptManual', patch: { ...flags, ...durationPatch }, durationFixed };
}
