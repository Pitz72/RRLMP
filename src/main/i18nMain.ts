// i18n del processo MAIN (2026-07-03) — dizionario minimale per le stringhe
// user-facing che nascono qui: titoli/filtri dei dialog nativi Electron e i
// messaggi di errore IPC che il renderer mostra nei toast ({{err}}).
//
// La lingua arriva dal renderer via IPC 'i18n:set-language' (vedi src/renderer/
// src/i18n.ts, evento languageChanged): il main non legge localStorage e non
// ha accesso a i18next — questo modulo è l'equivalente piatto, senza dipendenze.
// Default 'en' finché il renderer non notifica (accade all'import di i18n.ts,
// prima di qualunque dialog).

export type AppLanguage = 'en' | 'it' | 'fr' | 'de' | 'es' | 'pt' | 'ru' | 'zh';

const SUPPORTED: ReadonlySet<string> = new Set(['en', 'it', 'fr', 'de', 'es', 'pt', 'ru', 'zh']);

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

const fr: Dict = {
    'dlg.saveProject': 'Enregistrer le projet',
    'dlg.loadProject': 'Charger le projet',
    'dlg.projectFilter': 'Projet RRLMP',
    'dlg.importM3u': 'Importer une playlist M3U',
    'dlg.m3uFilter': 'Playlist M3U',
    'dlg.selectExportDir': "Choisir le dossier d'exportation",
    'dlg.saveRecording': "Choisir où enregistrer l'enregistrement final",
    'dlg.wavFilter': 'Audio WAV (sans perte)',
    'dlg.webmFilter': 'Audio WebM (Opus)',
    'dlg.allFiles': 'Tous les fichiers',
    'dlg.savePlayoutLog': 'Enregistrer le journal de diffusion',
    'dlg.textFilter': 'Texte',
    'close.title': 'Modifications non enregistrées',
    'close.message': 'Des modifications ne sont pas enregistrées. Que voulez-vous faire ?',
    'close.save': 'Enregistrer',
    'close.discard': 'Ne pas enregistrer',
    'close.cancel': 'Annuler',
    'err.lmpCorrupt': 'Fichier .lmp invalide ou corrompu : {msg}',
    'err.invalidProjectPath': 'Chemin du projet invalide',
    'err.invalidProjectStructure': 'Structure du projet invalide',
    'err.sfxManifestMissing': 'Bibliothèque FX par défaut introuvable (manifest absent)',
    'err.sfxManifestInvalid': 'Manifest default-sfx invalide',
    'err.convInvalidPath': 'Chemin de conversion invalide',
    'err.convInputNotAllowed': "Fichier d'entrée non autorisé",
    'err.lmpPathInvalid': 'Chemin invalide (fichier .lmp avec chemin absolu attendu)',
    'err.fileNotFound': 'Fichier introuvable',
    'err.allSilence': 'Le fichier semble entièrement silencieux ou le volume est trop faible.',
    'err.bpmInsufficient': 'Audio insuffisant pour estimer le BPM',
};

const de: Dict = {
    'dlg.saveProject': 'Projekt speichern',
    'dlg.loadProject': 'Projekt laden',
    'dlg.projectFilter': 'RRLMP-Projekt',
    'dlg.importM3u': 'M3U-Playlist importieren',
    'dlg.m3uFilter': 'M3U-Playlist',
    'dlg.selectExportDir': 'Exportordner auswählen',
    'dlg.saveRecording': 'Speicherort für die endgültige Aufnahme wählen',
    'dlg.wavFilter': 'WAV-Audio (verlustfrei)',
    'dlg.webmFilter': 'WebM-Audio (Opus)',
    'dlg.allFiles': 'Alle Dateien',
    'dlg.savePlayoutLog': 'Playout-Log speichern',
    'dlg.textFilter': 'Text',
    'close.title': 'Ungespeicherte Änderungen',
    'close.message': 'Es gibt ungespeicherte Änderungen. Was möchten Sie tun?',
    'close.save': 'Speichern',
    'close.discard': 'Nicht speichern',
    'close.cancel': 'Abbrechen',
    'err.lmpCorrupt': 'Ungültige oder beschädigte .lmp-Datei: {msg}',
    'err.invalidProjectPath': 'Ungültiger Projektpfad',
    'err.invalidProjectStructure': 'Ungültige Projektstruktur',
    'err.sfxManifestMissing': 'Standard-FX-Bibliothek nicht gefunden (Manifest fehlt)',
    'err.sfxManifestInvalid': 'Ungültiges default-sfx-Manifest',
    'err.convInvalidPath': 'Ungültiger Konvertierungspfad',
    'err.convInputNotAllowed': 'Eingabedatei nicht erlaubt',
    'err.lmpPathInvalid': 'Ungültiger Pfad (absolute .lmp-Datei erwartet)',
    'err.fileNotFound': 'Datei nicht gefunden',
    'err.allSilence': 'Die Datei scheint komplett still zu sein oder die Lautstärke ist zu niedrig.',
    'err.bpmInsufficient': 'Zu wenig Audiomaterial für die BPM-Schätzung',
};

const es: Dict = {
    'dlg.saveProject': 'Guardar proyecto',
    'dlg.loadProject': 'Cargar proyecto',
    'dlg.projectFilter': 'Proyecto RRLMP',
    'dlg.importM3u': 'Importar lista M3U',
    'dlg.m3uFilter': 'Lista M3U',
    'dlg.selectExportDir': 'Seleccionar carpeta de exportación',
    'dlg.saveRecording': 'Elige dónde guardar la grabación final',
    'dlg.wavFilter': 'Audio WAV (sin pérdida)',
    'dlg.webmFilter': 'Audio WebM (Opus)',
    'dlg.allFiles': 'Todos los archivos',
    'dlg.savePlayoutLog': 'Guardar registro de emisión',
    'dlg.textFilter': 'Texto',
    'close.title': 'Cambios sin guardar',
    'close.message': 'Hay cambios sin guardar. ¿Qué quieres hacer?',
    'close.save': 'Guardar',
    'close.discard': 'No guardar',
    'close.cancel': 'Cancelar',
    'err.lmpCorrupt': 'Archivo .lmp no válido o dañado: {msg}',
    'err.invalidProjectPath': 'Ruta del proyecto no válida',
    'err.invalidProjectStructure': 'Estructura del proyecto no válida',
    'err.sfxManifestMissing': 'Biblioteca FX predeterminada no encontrada (falta el manifest)',
    'err.sfxManifestInvalid': 'Manifest default-sfx no válido',
    'err.convInvalidPath': 'Ruta de conversión no válida',
    'err.convInputNotAllowed': 'Archivo de entrada no permitido',
    'err.lmpPathInvalid': 'Ruta no válida (se espera un archivo .lmp con ruta absoluta)',
    'err.fileNotFound': 'Archivo no encontrado',
    'err.allSilence': 'El archivo parece ser todo silencio o el volumen es demasiado bajo.',
    'err.bpmInsufficient': 'Audio insuficiente para estimar los BPM',
};

const pt: Dict = {
    'dlg.saveProject': 'Salvar projeto',
    'dlg.loadProject': 'Carregar projeto',
    'dlg.projectFilter': 'Projeto RRLMP',
    'dlg.importM3u': 'Importar playlist M3U',
    'dlg.m3uFilter': 'Playlist M3U',
    'dlg.selectExportDir': 'Selecionar pasta de exportação',
    'dlg.saveRecording': 'Escolha onde salvar a gravação final',
    'dlg.wavFilter': 'Áudio WAV (sem perdas)',
    'dlg.webmFilter': 'Áudio WebM (Opus)',
    'dlg.allFiles': 'Todos os arquivos',
    'dlg.savePlayoutLog': 'Salvar log de transmissão',
    'dlg.textFilter': 'Texto',
    'close.title': 'Alterações não salvas',
    'close.message': 'Há alterações não salvas. O que você quer fazer?',
    'close.save': 'Salvar',
    'close.discard': 'Não salvar',
    'close.cancel': 'Cancelar',
    'err.lmpCorrupt': 'Arquivo .lmp inválido ou corrompido: {msg}',
    'err.invalidProjectPath': 'Caminho do projeto inválido',
    'err.invalidProjectStructure': 'Estrutura do projeto inválida',
    'err.sfxManifestMissing': 'Biblioteca FX padrão não encontrada (manifest ausente)',
    'err.sfxManifestInvalid': 'Manifest default-sfx inválido',
    'err.convInvalidPath': 'Caminho de conversão inválido',
    'err.convInputNotAllowed': 'Arquivo de entrada não permitido',
    'err.lmpPathInvalid': 'Caminho inválido (esperado arquivo .lmp com caminho absoluto)',
    'err.fileNotFound': 'Arquivo não encontrado',
    'err.allSilence': 'O arquivo parece ser todo silêncio ou o volume está muito baixo.',
    'err.bpmInsufficient': 'Áudio insuficiente para estimar o BPM',
};

const ru: Dict = {
    'dlg.saveProject': 'Сохранить проект',
    'dlg.loadProject': 'Загрузить проект',
    'dlg.projectFilter': 'Проект RRLMP',
    'dlg.importM3u': 'Импорт плейлиста M3U',
    'dlg.m3uFilter': 'Плейлист M3U',
    'dlg.selectExportDir': 'Выберите папку экспорта',
    'dlg.saveRecording': 'Выберите, куда сохранить итоговую запись',
    'dlg.wavFilter': 'Аудио WAV (без потерь)',
    'dlg.webmFilter': 'Аудио WebM (Opus)',
    'dlg.allFiles': 'Все файлы',
    'dlg.savePlayoutLog': 'Сохранить журнал эфира',
    'dlg.textFilter': 'Текст',
    'close.title': 'Несохранённые изменения',
    'close.message': 'Есть несохранённые изменения. Что вы хотите сделать?',
    'close.save': 'Сохранить',
    'close.discard': 'Не сохранять',
    'close.cancel': 'Отмена',
    'err.lmpCorrupt': 'Недопустимый или повреждённый файл .lmp: {msg}',
    'err.invalidProjectPath': 'Недопустимый путь проекта',
    'err.invalidProjectStructure': 'Недопустимая структура проекта',
    'err.sfxManifestMissing': 'Библиотека FX по умолчанию не найдена (отсутствует manifest)',
    'err.sfxManifestInvalid': 'Недопустимый manifest default-sfx',
    'err.convInvalidPath': 'Недопустимый путь конвертации',
    'err.convInputNotAllowed': 'Входной файл не разрешён',
    'err.lmpPathInvalid': 'Недопустимый путь (ожидается абсолютный путь к файлу .lmp)',
    'err.fileNotFound': 'Файл не найден',
    'err.allSilence': 'Файл, похоже, полностью состоит из тишины, или громкость слишком мала.',
    'err.bpmInsufficient': 'Недостаточно аудио для оценки BPM',
};

const zh: Dict = {
    'dlg.saveProject': '保存项目',
    'dlg.loadProject': '加载项目',
    'dlg.projectFilter': 'RRLMP 项目',
    'dlg.importM3u': '导入 M3U 播放列表',
    'dlg.m3uFilter': 'M3U 播放列表',
    'dlg.selectExportDir': '选择导出文件夹',
    'dlg.saveRecording': '选择最终录音的保存位置',
    'dlg.wavFilter': 'WAV 音频（无损）',
    'dlg.webmFilter': 'WebM 音频（Opus）',
    'dlg.allFiles': '所有文件',
    'dlg.savePlayoutLog': '保存播出日志',
    'dlg.textFilter': '文本',
    'close.title': '未保存的更改',
    'close.message': '有未保存的更改，您希望如何处理？',
    'close.save': '保存',
    'close.discard': '不保存',
    'close.cancel': '取消',
    'err.lmpCorrupt': '.lmp 文件无效或已损坏：{msg}',
    'err.invalidProjectPath': '项目路径无效',
    'err.invalidProjectStructure': '项目结构无效',
    'err.sfxManifestMissing': '未找到默认 FX 库（缺少 manifest）',
    'err.sfxManifestInvalid': 'default-sfx manifest 无效',
    'err.convInvalidPath': '转换路径无效',
    'err.convInputNotAllowed': '不允许的输入文件',
    'err.lmpPathInvalid': '路径无效（应为绝对路径的 .lmp 文件）',
    'err.fileNotFound': '文件未找到',
    'err.allSilence': '该文件似乎全是静音，或音量过低。',
    'err.bpmInsufficient': '音频不足，无法估算 BPM',
};

const DICTS: Record<AppLanguage, Dict> = { en, it, fr, de, es, pt, ru, zh };

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
