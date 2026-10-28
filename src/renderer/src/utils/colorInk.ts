/**
 * Colore del testo sopra un pad acceso (tema "Pad luminosi", v1.15.36) — logica
 * pura, solo presentazione.
 *
 * La clip in onda si accende del colore della sua colonna. Il colore lo sceglie
 * l'utente fra 30 tinte, dal giallo al blu notte: un testo sempre scuro sparirebbe
 * sulle tinte scure, uno sempre bianco su quelle chiare. Si sceglie il più
 * contrastato secondo la luminanza relativa WCAG.
 */

/** Inchiostro scuro dei pad accesi. */
export const INK_DARK = '#14090A';
/** Inchiostro chiaro dei pad accesi. */
export const INK_LIGHT = '#FFFFFF';

const channel = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

/** Luminanza relativa WCAG di un colore #rgb / #rrggbb; null se non è un esadecimale. */
export const relativeLuminance = (color: string | undefined): number | null => {
    if (!color) return null;
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
    if (!m) return null;
    let hex = m[1];
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const n = parseInt(hex, 16);
    return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};

/**
 * true se sopra il colore si legge meglio il testo bianco. Colori non
 * riconosciuti → false (inchiostro scuro, il caso delle tinte di default).
 */
export const prefersLightInk = (color: string | undefined): boolean => {
    const L = relativeLuminance(color);
    if (L === null) return false;
    const darkL = relativeLuminance(INK_DARK) ?? 0;
    const contrastDark = (L + 0.05) / (darkL + 0.05);
    const contrastLight = 1.05 / (L + 0.05);
    return contrastLight > contrastDark;
};

/** Inchiostro da usare sopra il colore. */
export const inkFor = (color: string | undefined): string => (prefersLightInk(color) ? INK_LIGHT : INK_DARK);
