const MANUAL_FILENAMES: Record<string, string> = {
    en: 'User-Manual-EN.pdf',
    it: 'Manuale-Utente-IT.pdf',
};

// v1.15.33 (apertura del sorgente): i PDF sono versionati nel repository pubblico
// del progetto. Fino alla 1.15.32 si scaricavano da Ecosystem-Runtime/RRLMP-Releases.
const MANUALS_BASE_URL = 'https://raw.githubusercontent.com/Pitz72/RRLMP/master/manuale-utente/typst';

export function getManualUrl(lang: string): string {
    const filename = MANUAL_FILENAMES[lang] || MANUAL_FILENAMES.en;
    return `${MANUALS_BASE_URL}/${filename}`;
}
