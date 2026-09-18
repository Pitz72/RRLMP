// v1.15.34 — Note brevi della schermata «Novità» (standard di distribuzione 2.0, §4).
//
// Una voce per versione, in italiano e inglese: poche righe su ciò che l'utente
// nota in regia. Il changelog completo resta in docs/changelogs e nella pagina
// della release. Una versione senza voce mostra il testo generico
// (modal.whatsNew.fallback) con il link alle note complete.

export interface WhatsNewEntry {
    it: string[];
    en: string[];
}

export const WHATS_NEW: Record<string, WhatsNewEntry> = {
    '1.15.34': {
        it: [
            'Limiter del master corretto: non alza più di mezzo decibel tutto il programma e tiene davvero il tetto impostato. Prima, con segnali molto forti, poteva superare 0 dBFS.',
            'Glue Multibanda ritarato di conseguenza: con il Glue acceso il livello resta quello di prima.',
            'Questa finestra: dopo ogni aggiornamento riassume le novità, una volta sola.',
        ],
        en: [
            'Master limiter fixed: it no longer raises the whole programme by half a decibel, and it really holds the ceiling you set. Before, very loud signals could go above 0 dBFS.',
            'Multiband Glue recalibrated to match: with the Glue on, the level stays where it was.',
            'This window: after every update it sums up what is new, just once.',
        ],
    },
};

/** Note della versione nella lingua dell'interfaccia (inglese per ogni lingua diversa dall'italiano). */
export function whatsNewFor(version: string, language: string): string[] | null {
    const entry = WHATS_NEW[version];
    if (!entry) return null;
    return language.toLowerCase().startsWith('it') ? entry.it : entry.en;
}

export const releasePageUrl = (version: string): string =>
    `https://github.com/Pitz72/RRLMP/releases/tag/v${version}`;
