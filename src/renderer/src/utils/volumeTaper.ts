/**
 * Taper percettivo per i fader di volume clip (v1.15.11).
 *
 * `clip.volume` resta un GAIN LINEARE di ampiezza in tutto il modello, nel
 * .lmp e nel motore audio (StreamPlayer/evaluateMix): questi helper convertono
 * SOLO la posizione fisica dello slider (0..1) da/verso quel gain. Nessun
 * cambiamento di formato dati o di comportamento di riproduzione.
 *
 * Curva cubica (gain = maxGain · pos³), lo standard dei fader delle console:
 * l'orecchio ragiona in dB, un cursore lineare in ampiezza schiaccia tutto il
 * range utile dei sottofondi (−20…−40 dB) nelle prime due tacche. Con
 * maxGain=2: unity (0 dB) a ~79% della corsa, −26 dB (livello tipico da bed)
 * a ~29% — prima stava a una tacca dal mute.
 */

/** Posizione slider (0..1) → gain lineare (0..maxGain), arrotondato a 4 decimali. */
export const sliderToGain = (pos: number, maxGain = 2): number => {
    const p = Number.isFinite(pos) ? Math.max(0, Math.min(1, pos)) : 0;
    return Math.round(maxGain * p * p * p * 10000) / 10000;
};

/** Gain lineare (0..maxGain) → posizione slider (0..1). Inversa di sliderToGain. */
export const gainToSlider = (gain: number, maxGain = 2): number => {
    if (!Number.isFinite(gain) || gain <= 0) return 0;
    return Math.min(1, Math.cbrt(gain / maxGain));
};

/** Etichetta in dB di un gain lineare: "0.0 dB", "−26.0 dB", "+6.0 dB", "−∞ dB". */
export const gainToDbLabel = (gain: number): string => {
    if (!Number.isFinite(gain) || gain <= 0) return '−∞ dB';
    const db = Math.round(20 * Math.log10(gain) * 10) / 10;
    const sign = db > 0 ? '+' : db < 0 ? '−' : '';
    return `${sign}${Math.abs(db).toFixed(1)} dB`;
};
