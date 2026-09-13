const MANUAL_FILENAMES: Record<string, string> = {
    en: 'User-Manual-EN.pdf',
    it: 'Manuale-Utente-IT.pdf',
};

const MANUALS_BASE_URL = 'https://raw.githubusercontent.com/Ecosystem-Runtime/RRLMP-Releases/master/manuals';

export function getManualUrl(lang: string): string {
    const filename = MANUAL_FILENAMES[lang] || MANUAL_FILENAMES.en;
    return `${MANUALS_BASE_URL}/${filename}`;
}
