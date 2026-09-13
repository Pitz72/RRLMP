// i18n del processo MAIN (2026-07-03) — dizionario minimale per le stringhe
// user-facing che nascono qui: titoli/filtri dei dialog nativi Electron e i
// messaggi di errore IPC che il renderer mostra nei toast ({{err}}).
//
// La lingua arriva dal renderer via IPC 'i18n:set-language' (vedi src/renderer/
// src/i18n.ts, evento languageChanged): il main non legge localStorage e non
// ha accesso a i18next — questo modulo è l'equivalente piatto, senza dipendenze.
// Default 'en' finché il renderer non notifica (accade all'import di i18n.ts,
// prima di qualunque dialog).

// v1.15.32: l'app supporta solo italiano e inglese.
export type AppLanguage = 'en' | 'it';

const SUPPORTED: ReadonlySet<string> = new Set(['en', 'it']);

let currentLanguage: AppLanguage = 'en';

export function setMainLanguage(lang: unknown): void {
    if (typeof lang !== 'string') return;
    const base = lang.toLowerCase().split('-')[0];
    if (SUPPORTED.has(base)) currentLanguage = base as AppLanguage;
}

export function getMainLanguage(): AppLanguage {
    return currentLanguage;
}

type Dict = Record<string, string>;

const en: Dict = {
    'dlg.saveProject': 'Save Project',
    'dlg.loadProject': 'Load Project',
    'dlg.projectFilter': 'RRLMP Project',
    'dlg.importM3u': 'Import M3U Playlist',
    'dlg.m3uFilter': 'M3U Playlist',
    'dlg.selectExportDir': 'Select Export Directory',
    'dlg.saveRecording': 'Choose where to save the final recording',
    'dlg.wavFilter': 'WAV Audio (Lossless)',
    'dlg.webmFilter': 'WebM Audio (Opus)',
    'dlg.allFiles': 'All Files',
    'dlg.savePlayoutLog': 'Save Playout Log',
    'dlg.textFilter': 'Text',
    'close.title': 'Unsaved changes',
    'close.message': 'There are unsaved changes. What do you want to do?',
    'close.save': 'Save',
    'close.discard': "Don't Save",
    'close.cancel': 'Cancel',
    'err.lmpCorrupt': 'Invalid or corrupted .lmp file: {msg}',
    'err.invalidProjectPath': 'Invalid project path',
    'err.invalidProjectStructure': 'Invalid project structure',
    'err.sfxManifestMissing': 'Default FX library not found (missing manifest)',
    'err.sfxManifestInvalid': 'Invalid default-sfx manifest',
    'err.convInvalidPath': 'Invalid conversion path',
    'err.convInputNotAllowed': 'Input file not allowed',
    'err.lmpPathInvalid': 'Invalid path (expected an absolute .lmp file path)',
    'err.fileNotFound': 'File not found',
    'err.allSilence': 'The file appears to be all silence or the volume is too low.',
    'err.bpmInsufficient': 'Not enough audio for BPM estimation',
};

const it: Dict = {
    'dlg.saveProject': 'Salva Progetto',
    'dlg.loadProject': 'Carica Progetto',
    'dlg.projectFilter': 'Progetto RRLMP',
    'dlg.importM3u': 'Importa Playlist M3U',
    'dlg.m3uFilter': 'Playlist M3U',
    'dlg.selectExportDir': 'Seleziona cartella di esportazione',
    'dlg.saveRecording': 'Seleziona dove salvare la registrazione finale',
    'dlg.wavFilter': 'Audio WAV (Lossless)',
    'dlg.webmFilter': 'Audio WebM (Opus)',
    'dlg.allFiles': 'Tutti i file',
    'dlg.savePlayoutLog': 'Salva Playout Log',
    'dlg.textFilter': 'Testo',
    'close.title': 'Modifiche non salvate',
    'close.message': 'Ci sono modifiche non salvate. Cosa vuoi fare?',
    'close.save': 'Salva',
    'close.discard': 'Non Salvare',
    'close.cancel': 'Annulla',
    'err.lmpCorrupt': 'File .lmp non valido o corrotto: {msg}',
    'err.invalidProjectPath': 'Percorso progetto non valido',
    'err.invalidProjectStructure': 'Struttura progetto non valida',
    'err.sfxManifestMissing': 'Libreria FX di default non trovata (manifest assente)',
    'err.sfxManifestInvalid': 'Manifest default-sfx non valido',
    'err.convInvalidPath': 'Path di conversione non valido',
    'err.convInputNotAllowed': 'File di input non consentito',
    'err.lmpPathInvalid': 'Path non valido (atteso file .lmp con percorso assoluto)',
    'err.fileNotFound': 'File non trovato',
    'err.allSilence': 'Il file sembra essere tutto silenzio o il volume è troppo basso.',
    'err.bpmInsufficient': 'Audio insufficiente per la stima BPM',
};

const DICTS: Record<AppLanguage, Dict> = { en, it };

/** Traduce una chiave nella lingua corrente; {msg} viene interpolato da `vars`.
 *  Chiave sconosciuta → fallback inglese → chiave stessa (mai throw). */
export function tMain(key: string, vars?: Record<string, string>): string {
    let str = DICTS[currentLanguage][key] ?? en[key] ?? key;
    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            str = str.replace(`{${k}}`, v);
        }
    }
    return str;
}
