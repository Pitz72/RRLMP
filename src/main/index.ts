import { app, shell, BrowserWindow, protocol, nativeImage, ipcMain, dialog, globalShortcut, session } from 'electron';
import { join, normalize, isAbsolute, extname } from 'path';
import * as fs from 'fs';
import { AudioProcessor } from './AudioProcessor';
import { logger } from './logger';
import { startRemoteControlServer, stopRemoteControlServer, getRemoteControlStatus, updateRemoteMusicState, RemoteCommandName } from './RemoteControlServer';

// GR-03 Fix: timeout wrapper per IPC handler asincroni che invocano FFmpeg.
// Evita hang permanenti dell'app se FFmpeg si blocca o il file è illeggibile.
const withIpcTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
    Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`IPC_TIMEOUT: ${label} (${ms}ms)`)), ms)
        )
    ]);

// GR-04 Fix: whitelist estensioni audio per il protocollo media://.
// Blocca path traversal e accesso a file non audio.
const ALLOWED_MEDIA_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.opus', '.wma', '.webm', '.mp4']);

// LI-02: semaforo di concorrenza per gli IPC handler FFmpeg-heavy.
// Limita le chiamate parallele per tipo per evitare flood dal renderer.
//
// v1.7.1 — FIX bug regia (2026-07-01): era un limitatore "a scarto" (se il
// semaforo era pieno, la richiesta in eccesso veniva RIGETTATA subito con
// IPC_RATE_LIMITED, mai eseguita). Con batch che lanciano molte richieste in
// parallelo (es. import M3U di decine di brani, o il batch auto-silenzio al
// caricamento progetto) solo le prime `max` passavano davvero; il resto veniva
// scartato e i chiamanti (vedi detectSilence in MainGrid/GlobalControls)
// trattavano l'errore come "successo, nessun silenzio" — marcando le clip come
// "controllate" senza che l'analisi fosse mai realmente avvenuta. Ora è una
// vera coda FIFO: le richieste in eccesso ASPETTANO il proprio turno invece di
// essere scartate. Il timeout (withIpcTimeout) parte solo quando `fn()` viene
// davvero invocata, quindi l'attesa in coda non consuma budget di timeout.
const _ipcInflight = new Map<string, number>();
const _ipcQueues = new Map<string, Array<() => void>>();
function withConcurrencyLimit<T>(key: string, max: number, fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const run = () => {
            _ipcInflight.set(key, (_ipcInflight.get(key) ?? 0) + 1);
            fn().then(resolve, reject).finally(() => {
                _ipcInflight.set(key, Math.max(0, (_ipcInflight.get(key) ?? 1) - 1));
                const queue = _ipcQueues.get(key);
                const next = queue?.shift();
                if (next) next();
            });
        };
        const current = _ipcInflight.get(key) ?? 0;
        if (current >= max) {
            const queue = _ipcQueues.get(key) ?? [];
            queue.push(run);
            _ipcQueues.set(key, queue);
            return;
        }
        run();
    });
}

// SEC (audit 2026-05-29): valida che un path appartenga al nostro recorder temporaneo
// (dentro la temp dir di sistema + pattern rrlmp_temp_*.webm). Riusato da convert-recording
// prima della unlink, con la stessa logica di delete-temp-recording (REC-01).
function isTempRecordingPath(filePath: unknown): boolean {
    if (typeof filePath !== 'string' || !filePath) return false;
    try {
        const tempDir = fs.realpathSync(app.getPath('temp'));
        let resolved: string;
        try { resolved = fs.realpathSync(filePath); } catch { resolved = require('path').resolve(filePath); }
        const relative = require('path').relative(tempDir, resolved);
        const insideTemp = !!relative && !relative.startsWith('..') && !require('path').isAbsolute(relative);
        const baseName = require('path').basename(resolved);
        return insideTemp && /^rrlmp_temp_\d+\.webm$/.test(baseName);
    } catch {
        return false;
    }
}

// SEC (audit 2026-05-29): consenti l'apertura esterna solo a URL http/https.
// shell.openExternal apre qualsiasi schema (file://, javascript:, handler custom):
// un downloadUrl proveniente dal feed di aggiornamento remoto va validato.
function isSafeExternalUrl(url: unknown): boolean {
    if (typeof url !== 'string' || !url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

// SEC (audit 2026-05-29): estensioni consentite come output di una conversione registrazione.
const ALLOWED_RECORDING_OUTPUT_EXT = new Set(['.wav', '.mp3', '.flac', '.ogg', '.webm', '.m4a', '.aac']);

// CRITICAL: Disable GPU Acceleration to prevent 0xC0000005 Access Violation crashes on some Windows systems
// especially when using multiple Canvas elements (Waveform Editor).
app.disableHardwareAcceleration();

// M7 Fix: rimosso bypassCSP — il protocollo media:// ha secure:true
// che gli assegna il livello di attendibilità di una pagina HTTPS.
// GR6 Fix: CSP viene applicato via onHeadersReceived (vedi createWindow).
protocol.registerSchemesAsPrivileged([
    { scheme: 'media', privileges: { secure: true, supportFetchAPI: true, stream: true } }
]);

// v1.2.3 — Supporto apertura file .lmp da file association OS
// mainWindow a livello modulo per consentire l'accesso dall'handler open-file (macOS)
let mainWindowRef: BrowserWindow | null = null;
// pendingOpenFilePath: il file può arrivare PRIMA che la finestra sia pronta (macOS)
let pendingOpenFilePath: string | null = null;

// macOS: app.on('open-file') deve essere registrato PRIMA di app.whenReady()
// altrimenti l'evento viene perso se il file è aperto mentre l'app non è ancora avviata
app.on('open-file', (event, filePath) => {
    event.preventDefault();
    if (!filePath.endsWith('.lmp')) return;
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
        mainWindowRef.webContents.send('open-file', filePath);
    } else {
        pendingOpenFilePath = filePath;
    }
});

function createWindow(initialFilePath?: string): void {
    // Create the browser window.
    const iconPath = join(__dirname, '../../build/icon.png');
    const appIcon = nativeImage.createFromPath(iconPath);

    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        autoHideMenuBar: true,
        icon: appIcon,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            // G1 Fix: webSecurity ora ATTIVO.
            // Reso possibile dalla migrazione file:/// -> media:// in pathUtils.ts (G6).
            webSecurity: true
        }
    });

    mainWindow.maximize(); // Start Maximized

    mainWindowRef = mainWindow;

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        // v1.2.3 — Apertura diretta file .lmp da doppio click / file association OS
        // Windows: path da process.argv; macOS: path da pendingOpenFilePath (open-file event)
        const fileToOpen = initialFilePath ?? pendingOpenFilePath;
        if (fileToOpen && fs.existsSync(fileToOpen)) {
            mainWindow.webContents.send('open-file', fileToOpen);
        }
        pendingOpenFilePath = null;
    });

    mainWindow.on('closed', () => {
        mainWindowRef = null;
        // v1.2.17 (NEW-GR-01): termina conversioni FFmpeg in corso quando la finestra muore
        const killed = AudioProcessor.cancelAllConversions();
        if (killed > 0) logger.warn(`[Main] Terminate ${killed} conversioni FFmpeg attive su window close`);
    });

    // CLOSING HANDSHAKE
    mainWindow.on('close', (e) => {
        if (mainWindow.webContents.isDestroyed()) return;
        e.preventDefault(); // ALWAYS prevent default first
        mainWindow.webContents.send('check-close-intent'); // Ask Renderer
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        // SEC (audit 2026-05-29): apri solo URL http/https — mai file://, javascript:, ecc.
        if (isSafeExternalUrl(details.url)) {
            shell.openExternal(details.url);
        } else {
            logger.warn(`[Main] window-open bloccato (schema non sicuro): ${details.url}`);
        }
        return { action: 'deny' };
    });

    // GR6 Fix: Content Security Policy header.
    // BUGFIX v0.10.3: In produzione (file://), la CSP iniettata tramite onHeadersReceived
    // può bloccare il bundle JS se troppo restrittiva. Aggiungiamo compatibilità specifica.
    // v1.2.21 (NEW-GR-06): in produzione rimuoviamo 'unsafe-eval' dal script-src.
    // 'unsafe-eval' è necessario solo per il fast refresh di Vite in dev. Il bundle
    // prodotto da Vite per la produzione non usa eval() — tenerlo abilitato in prod
    // amplifica la superficie XSS per nulla. 'unsafe-inline' resta necessario per
    // gli style inline generati da React (style={{...}}) e da alcune librerie.
    const isDev = process.env.NODE_ENV === 'development';
    const scriptSrc = isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        : "script-src 'self' 'unsafe-inline'; ";
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        const cspHeader = [
            "default-src 'self' 'unsafe-inline' data: blob:; " +
            scriptSrc +
            "style-src 'self' 'unsafe-inline'; " +
            "media-src 'self' media: blob:; " +
            "font-src 'self' data:; " +
            "img-src 'self' data: blob:; " +
            "worker-src 'self' blob:; " +
            "connect-src 'self' media: blob: ws: https://www.runtimeradio.it https://runtimeradio.it https://www.runtimeradio.com https://runtimeradio.com;"
        ];

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': cspHeader
            }
        });
    });

    // DIAGNOSTICS: Catch Renderer Hangs/Crashes (White Screen)
    mainWindow.on('unresponsive', () => {
        logger.warn('!!! RENDERER PROCESS IS HANGING (White Screen detected) !!!');
    });

    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        logger.error(`!!! RENDERER PROCESS GONE: ${details.reason} (Exit Code: ${details.exitCode}) !!!`);
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
}

// --- IPC HANDLERS (Top Level to avoid multiple registrations) ---

// Audio Processing (Main-Side-Heavy Architecture)
ipcMain.handle('get-audio-metadata', async (_event, filePath: string) => {
    return withConcurrencyLimit('get-audio-metadata', 5, () =>
        withIpcTimeout(AudioProcessor.extractMetadata(filePath), 10_000, 'get-audio-metadata')
    ).catch((err: Error) => ({ success: false, error: err.message }));
});

// v1.4.3 — Misura loudness EBU R128 per omologazione volume clip (read-only)
ipcMain.handle('measure-loudness', async (_event, filePath: string) => {
    return withConcurrencyLimit('measure-loudness', 2, () =>
        withIpcTimeout(AudioProcessor.measureLoudness(filePath), 65_000, 'measure-loudness')
    ).catch((err: Error) => ({ success: false, error: err.message }));
});

ipcMain.handle('get-waveform-data', async (_event, filePath: string) => {
    return withConcurrencyLimit('get-waveform-data', 2, () =>
        withIpcTimeout(AudioProcessor.generateWaveformData(filePath), 30_000, 'get-waveform-data')
    ).catch((err: Error) => ({ success: false, error: err.message }));
});

ipcMain.handle('detect-silence', async (_event, filePath: string, thresholdDb?: number) => {
    return withConcurrencyLimit('detect-silence', 3, () =>
        withIpcTimeout(AudioProcessor.detectSilence(filePath, thresholdDb), 45_000, 'detect-silence')
    ).catch((err: Error) => ({ success: false, error: err.message }));
});

// Controllo Remoto (2026-07-01, Step 1/N) — avvio/stop server LAN a mano dalle
// Impostazioni. Nessun timeout/rate-limit: sono azioni istantanee locali, non FFmpeg.
function forwardRemoteCommandToRenderer(name: RemoteCommandName, clipId?: string): void {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
        mainWindowRef.webContents.send('remote-command', { name, clipId });
    }
}
ipcMain.handle('remote-control:start', () => startRemoteControlServer(forwardRemoteCommandToRenderer));
ipcMain.handle('remote-control:stop', () => { stopRemoteControlServer(); return getRemoteControlStatus(); });
ipcMain.handle('remote-control:status', () => getRemoteControlStatus());
// Step 4/N — verso opposto: il renderer pubblica lo stato della colonna Music
// (fire-and-forget, nessuna risposta attesa) così il server può servirlo al tablet.
ipcMain.on('remote-control:publish-state', (_event, clips: unknown) => updateRemoteMusicState(clips));

// 2026-07-01 — Stima BPM (rilevamento + persistenza, nessun uso ancora nel motore
// audio). Timeout 25s: copre i 20s interni di AudioProcessor.detectBpm + grace.
ipcMain.handle('detect-bpm', async (_event, filePath: string) => {
    return withConcurrencyLimit('detect-bpm', 2, () =>
        withIpcTimeout(AudioProcessor.detectBpm(filePath), 25_000, 'detect-bpm')
    ).catch((err: Error) => ({ success: false, error: err.message }));
});

ipcMain.handle('detect-smart-cues', async (_event, filePath: string) => {
    // v1.2.18 (NEW-GR-03): timeout IPC = 50s.
    // Coperti i sub-timeout interni FFmpeg: _estimateMeanLevel (10s) + silencedetect (30s) = 40s,
    // + 10s di grace per garantire che il kill interno fissi sempre lo stato prima che
    // withIpcTimeout rigetti — altrimenti withConcurrencyLimit decrementerebbe il semaforo
    // con processi FFmpeg ancora vivi, saturando i tentativi successivi (IPC_RATE_LIMITED a catena).
    return withConcurrencyLimit('detect-smart-cues', 2, () =>
        withIpcTimeout(AudioProcessor.detectSmartCues(filePath), 50_000, 'detect-smart-cues')
    ).catch((err: Error) => ({ success: false, error: err.message }));
});

ipcMain.handle('check-files-exist', async (_event, paths: string[]) => {
    const missing = (paths as string[]).filter(p => !fs.existsSync(p));
    return { missing };
});

// Force Close (Called by Renderer when safe)
ipcMain.on('force-close', () => {
    const wins = BrowserWindow.getAllWindows();
    wins.forEach(w => w.destroy());
});

// Show Close Dialog (Called by Renderer if Dirty) — stringhe hardcoded (legacy)
ipcMain.handle('show-close-dialog', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return 2;
    const result = await dialog.showMessageBox(win, {
        type: 'question',
        buttons: ['Salva', 'Non Salvare', 'Annulla'],
        title: 'Modifiche non salvate',
        message: 'Ci sono modifiche non salvate. Cosa vuoi fare?',
        defaultId: 0,
        cancelId: 2
    });
    return result.response;
});

// M1 Fix: variante i18n — il renderer passa le stringhe localizzate.
ipcMain.handle('show-close-dialog-i18n', async (event, labels: {
    btnSave: string;
    btnDiscard: string;
    btnCancel: string;
    title: string;
    message: string;
}) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return 2;
    const result = await dialog.showMessageBox(win, {
        type: 'question',
        buttons: [labels.btnSave, labels.btnDiscard, labels.btnCancel],
        title: labels.title,
        message: labels.message,
        defaultId: 0,
        cancelId: 2
    });
    return result.response;
});

// PERSIST-02 (v1.3.3): write atomico — scrive su file .tmp adiacente e poi rename().
// Su filesystem POSIX e NTFS la rename è atomica: o vede il vecchio file integro o il
// nuovo file completo, mai un file troncato. Senza questo, un crash app / power loss
// nel mezzo di writeFileSync corromperebbe il .lmp dell'utente.
const writeFileAtomicSync = (targetPath: string, content: string): void => {
    const tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tmpPath, content, 'utf-8');
    try {
        fs.renameSync(tmpPath, targetPath);
    } catch (e) {
        try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
        throw e;
    }
};

ipcMain.handle('dialog:save-project', async (event, content: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false };
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Save Project',
        defaultPath: 'project.lmp',
        filters: [{ name: 'RRLMP Project', extensions: ['lmp'] }]
    });

    if (canceled || !filePath) return { success: false };

    try {
        writeFileAtomicSync(filePath, content);
        return { success: true, filePath };
    } catch (error) {
        logger.error('Save failed:', error);
        return { success: false, error: String(error) };
    }
});

// New: Direct Save (Overwrite)
ipcMain.handle('save-project-direct', async (_event: Electron.IpcMainInvokeEvent, content: string, filePath: string) => {
    try {
        // SEC (audit 2026-05-29): filePath arriva dal renderer. Era l'unica scrittura su disco
        // senza validazione (a differenza di delete-temp-recording). Accetta solo path .lmp assoluti.
        if (typeof filePath !== 'string' || !isAbsolute(filePath) || extname(filePath).toLowerCase() !== '.lmp') {
            logger.warn(`[Main] save-project-direct rifiutato (path non valido): ${String(filePath)}`);
            return { success: false, error: 'Path non valido (atteso file .lmp con percorso assoluto)' };
        }
        writeFileAtomicSync(filePath, content);
        return { success: true, filePath };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('dialog:load-project', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false };
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: 'Load Project',
        filters: [{ name: 'RRLMP Project', extensions: ['lmp'] }],
        properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return { success: false };

    try {
        const content = fs.readFileSync(filePaths[0], 'utf-8');
        try {
            const parsed = JSON.parse(content) as any;
            if (parsed && parsed.project && parsed.project.columns) {
                // Diagnostica all'apertura del salvataggio: segnaliamo le clip mancanti
                parsed.project.columns.forEach((col: any) => {
                    col.clips.forEach((clip: any) => {
                        let absolutePath = clip.path;
                        // Resolve if relative or use as is
                        if (absolutePath && !fs.existsSync(absolutePath)) {
                            clip.isMissing = true;
                        } else {
                            clip.isMissing = false;
                        }
                    });
                });
            }
            return { success: true, data: JSON.stringify(parsed), filePath: filePaths[0] };
        } catch (e) {
            // PERSIST-04 (v1.3.3): se il parse JSON fallisce non spacciare il raw come "success".
            // Prima: success:true + data:rawString → il renderer rifaceva JSON.parse, otteneva
            // un errore opaco a livello UI. Ora torniamo errore esplicito così il toast di
            // load può mostrare un messaggio comprensibile ("file .lmp non valido o corrotto").
            logger.error('Load failed: invalid JSON', e);
            return { success: false, error: `File .lmp non valido o corrotto: ${e instanceof Error ? e.message : String(e)}` };
        }
    } catch (error) {
        logger.error('Load failed:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('import-m3u', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false };
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: 'Importa Playlist M3U',
        filters: [{ name: 'Playlist M3U', extensions: ['m3u', 'm3u8'] }],
        properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) return { success: false };
    try {
        const m3uPath = filePaths[0];
        const m3uDir = require('path').dirname(m3uPath);
        const content = fs.readFileSync(m3uPath, 'utf-8');
        const lines = content.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith('#'));
        const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.opus', '.wma'];
        // v1.2.27 (NEW-LI-02): normalize del path risolto per appiattire `..` e separatori
        // duplicati, coerentemente con il filtro whitelist del protocollo media://.
        const _path = require('path');
        const paths: string[] = lines
            .map((line: string) => _path.normalize(_path.isAbsolute(line) ? line : _path.resolve(m3uDir, line)))
            .filter((p: string) => {
                const ext = _path.extname(p).toLowerCase();
                return AUDIO_EXTS.includes(ext) && fs.existsSync(p);
            });
        return { success: true, paths };
    } catch (e) {
        return { success: false, error: String(e) };
    }
});

ipcMain.handle('export-project', async (event, projectJsonString: string, lmpPath?: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false };

    // v1.4.14 (#4a): l'export è LEGATO al file di salvataggio aperto. La cartella
    // `audio/` vive accanto al .lmp; non si chiede una cartella né si scrive un
    // project.lmp separato — si sincronizza soltanto (copia mancanti + prune orfani).
    // Fallback storico (nessun lmpPath): selettore cartella + project.lmp, come prima.
    let exportDir: string;
    let writeLmpCopy: boolean;
    if (typeof lmpPath === 'string' && lmpPath) {
        if (!isAbsolute(lmpPath) || extname(lmpPath).toLowerCase() !== '.lmp') {
            return { success: false, error: 'Percorso progetto non valido' };
        }
        exportDir = require('path').dirname(lmpPath);
        writeLmpCopy = false;
    } else {
        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
            title: 'Select Export Directory',
            properties: ['openDirectory', 'createDirectory']
        });
        if (canceled || filePaths.length === 0) return { success: false };
        exportDir = filePaths[0];
        writeLmpCopy = true;
    }
    const audioDir = join(exportDir, 'audio');

    try {
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        const projectData = JSON.parse(projectJsonString);
        // SYNC (audit 2026-05-29): guard sulla struttura — un .lmp leggermente corrotto
        // non deve produrre un TypeError opaco.
        if (!projectData?.project || !Array.isArray(projectData.project.columns)) {
            return { success: false, error: 'Struttura progetto non valida' };
        }
        const { columns } = projectData.project;
        let successParams = { copied: 0, skipped: 0, pruned: 0 };
        // SYNC: nomi-destinazione effettivamente usati da QUESTO export. Serve sia per il
        // dedup interno (due clip con stesso filename) sia per il pruning degli orfani dopo.
        const usedDestNames = new Set<string>();
        let totalFiles = 0;
        columns.forEach((col: any) => {
            totalFiles += Array.isArray(col.clips) ? col.clips.length : 0;
        });

        let processed = 0;
        for (const col of columns) {
            for (const clip of col.clips) {
                processed++;
                const originalPath = clip.path;

                if (originalPath) {
                    const currentFileName = join(originalPath).split(process.platform === 'win32' ? '\\' : '/').pop() || 'Unknown';
                    if (!win.isDestroyed()) {
                        win.webContents.send('export-progress', {
                            current: processed,
                            total: totalFiles,
                            filename: currentFileName
                        });
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 5));

                // GR-07 Fix: dopo ogni yield controlla che la finestra esista ancora.
                // Se l'utente chiude l'app durante l'export il loop si interrompe senza
                // lasciare stream di copia o promise zombie nel main process.
                if (win.isDestroyed()) {
                    return { success: false, error: 'Export cancelled: window closed' };
                }

                if (originalPath && fs.existsSync(originalPath)) {
                    const fileName = join(originalPath).split(process.platform === 'win32' ? '\\' : '/').pop();
                    if (fileName) {
                        const ext = fileName.includes('.') ? fileName.split('.').pop()! : '';
                        const base = ext ? fileName.slice(0, -(ext.length + 1)) : fileName;
                        let destFileName = fileName;
                        let counter = 1;
                        // SYNC: il dedup è SOLO rispetto ai file di questo export (usedDestNames),
                        // non rispetto ai file già presenti sul disco. Così i nomi restano stabili
                        // tra un export e l'altro: copyFileSync sovrascrive il file aggiornato,
                        // e gli orfani vengono rimossi dopo (pruning). Niente accumulo di _1, _2…
                        while (usedDestNames.has(destFileName.toLowerCase())) {
                            destFileName = `${base}_${counter++}.${ext}`;
                        }
                        usedDestNames.add(destFileName.toLowerCase());
                        const destPath = join(audioDir, destFileName);
                        // v1.4.14 (#4c): copia solo i file mancanti o cambiati (confronto
                        // dimensione). I file già presenti e identici si saltano: su archivi
                        // grandi evita di ricopiare l'intero banco regia a ogni export.
                        let needsCopy = true;
                        try {
                            const dst = fs.statSync(destPath);
                            if (dst.isFile() && dst.size === fs.statSync(originalPath).size) needsCopy = false;
                        } catch { needsCopy = true; }
                        if (needsCopy) {
                            fs.copyFileSync(originalPath, destPath);
                            successParams.copied++;
                        } else {
                            successParams.skipped++;
                        }
                        clip.path = `audio/${destFileName}`;
                    }
                } else {
                    successParams.skipped++;
                }
            }
        }

        // SYNC (audit 2026-05-29): pruning — la cartella audio deve rispecchiare lo stato reale
        // del progetto. Rimuove i file non più referenziati (clip eliminate, rinominate o sostituite)
        // invece di lasciarli accumulare.
        try {
            for (const f of fs.readdirSync(audioDir)) {
                if (!usedDestNames.has(f.toLowerCase())) {
                    const full = join(audioDir, f);
                    try {
                        if (fs.statSync(full).isFile()) {
                            fs.unlinkSync(full);
                            successParams.pruned++;
                        }
                    } catch (e) {
                        logger.warn(`[Main] Export prune: impossibile rimuovere ${f}: ${e instanceof Error ? e.message : String(e)}`);
                    }
                }
            }
        } catch (e) {
            logger.warn(`[Main] Export prune: lettura cartella audio fallita: ${e instanceof Error ? e.message : String(e)}`);
        }

        // v1.4.14 (#4a): scrive il project.lmp SOLO nell'export "libero" (selettore
        // cartella). Nell'export legato al salvataggio non si crea un file separato:
        // l'archivio resta agganciato al .lmp originale dell'operatore.
        if (writeLmpCopy) {
            const newLmpPath = join(exportDir, 'project.lmp');
            fs.writeFileSync(newLmpPath, JSON.stringify(projectData, null, 2), 'utf-8');
        }

        return { success: true, path: exportDir, stats: successParams };

    } catch (error) {
        logger.error('Export failed:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('save-project-silent', async (_event: Electron.IpcMainInvokeEvent, content: string, filePath?: string) => {
    try {
        let targetPath = '';
        if (filePath && fs.existsSync(filePath)) {
            targetPath = filePath + '.bak';
        } else {
            const userDataPath = app.getPath('userData');
            const autosaveDir = join(userDataPath, 'autosaves');
            if (!fs.existsSync(autosaveDir)) {
                fs.mkdirSync(autosaveDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            targetPath = join(autosaveDir, `autosave_${timestamp}.lmp`);
        }
        // PERSIST-02 (v1.3.3): atomic write anche per autosave/.bak.
        writeFileAtomicSync(targetPath, content);

        // GR10 Fix: rotazione autosave
        if (!filePath) {
            const userDataPath = app.getPath('userData');
            const autosaveDir = join(userDataPath, 'autosaves');
            const allFiles = fs.readdirSync(autosaveDir)
                .filter((f: string) => f.startsWith('autosave_') && f.endsWith('.lmp'))
                .map((f: string) => ({ name: f, time: fs.statSync(join(autosaveDir, f)).mtimeMs }))
                .sort((a: { time: number }, b: { time: number }) => b.time - a.time);
            const MAX_AUTOSAVES = 10;
            const toDelete = allFiles.slice(MAX_AUTOSAVES);
            toDelete.forEach((f: { name: string }) => {
                // PERSIST-06 (v1.3.3): log dell'errore invece di silent ignore.
                // Se la rotazione fallisce ripetutamente (file lockato AV, permessi,
                // disco pieno), prima non c'era alcun segnale → leak silenzioso.
                try {
                    fs.unlinkSync(join(autosaveDir, f.name));
                } catch (e) {
                    logger.warn(`[Main] Auto-save rotation: impossibile eliminare ${f.name}: ${e instanceof Error ? e.message : String(e)}`);
                }
            });
        }

        return { success: true, path: targetPath };
    } catch (error) {
        logger.error('Auto-save failed:', error);
        return { success: false, error: String(error) };
    }
});

// --- SESSION RECORDING IPC (v1.1.1+) ---

let recordingWriteStream: fs.WriteStream | null = null;
let currentTempRecordingPath: string | null = null;
// SEC/STAB (audit 2026-05-29): primo errore dello stream di registrazione (disco pieno,
// USB scollegata). Senza handler 'error' un evento non gestito può terminare il main process
// e far perdere la diretta. Lo memorizziamo e lo restituiamo al renderer al chunk successivo.
let recordingStreamError: string | null = null;

ipcMain.handle('start-recording', async (_event) => {
    try {
        // STAB: se uno stream precedente è ancora aperto (start senza stop / doppio start),
        // chiudilo prima per non perdere il file descriptor (handle leak).
        if (recordingWriteStream) {
            try { recordingWriteStream.end(); } catch { /* ignore */ }
            recordingWriteStream = null;
        }
        recordingStreamError = null;

        const tempDir = app.getPath('temp');
        const timestamp = Date.now();
        currentTempRecordingPath = join(tempDir, `rrlmp_temp_${timestamp}.webm`);

        const stream = fs.createWriteStream(currentTempRecordingPath);
        // STAB: handler 'error' obbligatorio — evita unhandled 'error' event → crash main process.
        stream.on('error', (err) => {
            recordingStreamError = err instanceof Error ? err.message : String(err);
            logger.error('[Main] Recording stream error:', err);
        });
        recordingWriteStream = stream;
        logger.info(`[Main] Temp recording started: ${currentTempRecordingPath}`);

        return { success: true, path: currentTempRecordingPath };
    } catch (error) {
        logger.error('[Main] Failed to start temp recording:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('append-record-chunk', async (_event, arrayBuffer: ArrayBuffer) => {
    if (!recordingWriteStream) return { success: false, error: 'No active recording stream' };
    // STAB: se lo stream è andato in errore (disco pieno/USB), segnalalo al renderer
    // che potrà fermare la sessione in modo pulito invece di accumulare chunk in RAM.
    if (recordingStreamError) return { success: false, error: recordingStreamError };

    try {
        const buffer = Buffer.from(arrayBuffer);
        const ok = recordingWriteStream.write(buffer);
        // STAB: backpressure — se il buffer interno è pieno (disco/USB lento), attendi 'drain'
        // prima di accettare altri chunk, così la RAM non cresce senza limite su sessioni lunghe.
        if (!ok) {
            await new Promise<void>((resolve) => {
                const stream = recordingWriteStream;
                if (!stream) return resolve();
                stream.once('drain', resolve);
            });
        }
        return { success: true };
    } catch (error) {
        logger.error('[Main] Failed to append chunk:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('stop-recording', async (_event) => {
    return new Promise((resolve) => {
        if (!recordingWriteStream) {
            return resolve({ success: false, error: 'No active recording stream' });
        }

        const path = currentTempRecordingPath;
        const streamError = recordingStreamError;
        recordingWriteStream.end(() => {
            logger.info(`[Main] Temp recording stopped: ${path}`);
            recordingWriteStream = null;
            recordingStreamError = null;
            // Se lo stream aveva accumulato un errore, riportiamo il file comunque scritto
            // fin dove possibile, ma segnaliamo l'anomalia.
            if (streamError) {
                resolve({ success: false, path, error: streamError });
            } else {
                resolve({ success: true, path });
            }
        });
    });
});

ipcMain.handle('show-save-dialog-recording', async (event, defaultName: string, format: 'wav' | 'webm') => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { canceled: true };
    
    const filters = format === 'wav' 
        ? [{ name: 'Audio WAV (Lossless)', extensions: ['wav'] }]
        : [{ name: 'Audio WebM (Opus)', extensions: ['webm'] }];

    return await dialog.showSaveDialog(win, {
        title: 'Seleziona dove salvare la registrazione finale',
        defaultPath: defaultName,
        filters: [...filters, { name: 'Tutti i file', extensions: ['*'] }]
    });
});

ipcMain.handle('convert-recording', async (event, inputPath: string, outputPath: string, options: { bitrate?: number, format?: string }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false, error: 'No window found' };

    // SEC (audit 2026-05-29): valida i path renderer-controlled. outputPath deve essere assoluto
    // con estensione audio whitelisted; inputPath deve essere un nostro temp recording.
    if (typeof inputPath !== 'string' || typeof outputPath !== 'string'
        || !isAbsolute(outputPath) || !ALLOWED_RECORDING_OUTPUT_EXT.has(extname(outputPath).toLowerCase())) {
        logger.warn('[Main] convert-recording rifiutato (path non valido)');
        return { success: false, error: 'Path di conversione non valido' };
    }
    if (!isTempRecordingPath(inputPath)) {
        logger.warn('[Main] convert-recording rifiutato (inputPath non è un temp recording)');
        return { success: false, error: 'File di input non consentito' };
    }

    try {
        // REC-02 (v1.3.1): hard timeout IPC 30 min — allineato al cap interno di AudioProcessor.convertAudio
        // (NEW-GR-01 v1.2.17). Evita che il renderer resti appeso indefinitamente se FFmpeg hang.
        const result = await withIpcTimeout(
            AudioProcessor.convertAudio(
                inputPath,
                outputPath,
                options,
                (progress) => {
                    if (!win.isDestroyed()) {
                        // Riutilizziamo l'evento export-progress per la barra UI
                        win.webContents.send('export-progress', {
                            current: progress,
                            total: 100,
                            filename: 'Conversione in corso...'
                        });
                    }
                }
            ),
            1_800_000,
            'convert-recording'
        );

        if (result.success) {
            // Se la conversione è riuscita e il file è diverso dall'input, eliminiamo il temporaneo.
            // SEC: inputPath è già stato validato come temp recording sopra → unlink sicura.
            if (inputPath !== outputPath && fs.existsSync(inputPath)) {
                try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }
            }
        }

        return result;
    } catch (error) {
        logger.error('[Main] Conversion failed:', error);
        return { success: false, error: String(error) };
    }
});

// v1.1.3 — Salva ArrayBuffer (dal MediaRecorder renderer-side) su disco come file temp
ipcMain.handle('save-recording-buffer', async (_event, arrayBuffer: ArrayBuffer) => {
    try {
        const tempDir = app.getPath('temp');
        const timestamp = Date.now();
        const tempPath = join(tempDir, `rrlmp_temp_${timestamp}.webm`);
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(tempPath, buffer);
        logger.info(`[Main] Recording buffer saved to: ${tempPath}`);
        return { success: true, path: tempPath };
    } catch (error) {
        logger.error('[Main] Failed to save recording buffer:', error);
        return { success: false, error: String(error) };
    }
});

// REC-01 (v1.3.1): valida che il path sia dentro temp dir + matchi il pattern del nostro recorder.
// Impedisce eliminazione di file arbitrari via IPC compromesso (path traversal o path random).
ipcMain.handle('delete-temp-recording', async (_event, filePath: string) => {
    try {
        if (typeof filePath !== 'string' || !filePath) {
            return { success: false, error: 'Invalid path' };
        }
        const tempDir = fs.realpathSync(app.getPath('temp'));
        let resolved: string;
        try {
            resolved = fs.realpathSync(filePath);
        } catch {
            resolved = require('path').resolve(filePath);
        }
        const relative = require('path').relative(tempDir, resolved);
        const insideTemp = relative && !relative.startsWith('..') && !require('path').isAbsolute(relative);
        const baseName = require('path').basename(resolved);
        const allowedPattern = /^rrlmp_temp_\d+\.webm$/;
        if (!insideTemp || !allowedPattern.test(baseName)) {
            logger.warn(`[Main] delete-temp-recording rifiutato (path non sicuro): ${filePath}`);
            return { success: false, error: 'Path not allowed' };
        }
        if (fs.existsSync(resolved)) {
            fs.unlinkSync(resolved);
            return { success: true };
        }
        return { success: false, error: 'File not found' };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

// Playout Log export
ipcMain.handle('save-playout-log', async (event, csvContent: string, suggestedName: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false };
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Salva Playout Log',
        defaultPath: suggestedName,
        filters: [
            { name: 'CSV', extensions: ['csv'] },
            { name: 'Testo', extensions: ['txt'] }
        ]
    });
    if (canceled || !filePath) return { success: false };
    try {
        fs.writeFileSync(filePath, csvContent, 'utf-8');
        return { success: true, filePath };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

// Apre un URL nel browser di sistema (usato dall'update checker)
ipcMain.handle('open-external', async (_event, url: string) => {
    // SEC (audit 2026-05-29): il downloadUrl proviene dal feed di aggiornamento remoto.
    // Consenti solo http/https per evitare apertura di schemi pericolosi via feed compromesso.
    if (!isSafeExternalUrl(url)) {
        logger.warn(`[Main] open-external rifiutato (schema non sicuro): ${String(url)}`);
        return { success: false, error: 'URL non consentito' };
    }
    await shell.openExternal(url);
    return { success: true };
});

// v1.2.3 — Carica un progetto direttamente dal path (senza dialog) — usato da open-file / argv
ipcMain.handle('load-project-path', async (_event, filePath: string) => {
    try {
        if (!fs.existsSync(filePath)) return { success: false, error: 'File not found' };
        const content = fs.readFileSync(filePath, 'utf-8');
        try {
            const parsed = JSON.parse(content) as any;
            if (parsed && parsed.project && parsed.project.columns) {
                parsed.project.columns.forEach((col: any) => {
                    col.clips.forEach((clip: any) => {
                        clip.isMissing = !fs.existsSync(clip.path);
                    });
                });
            }
            return { success: true, data: JSON.stringify(parsed), filePath };
        } catch (e) {
            // PERSIST-04 (v1.3.3): coerente con dialog:load-project — niente più
            // success:true con raw string. Doppio-click su .lmp corrotto da OS produce
            // ora un errore chiaro all'utente.
            logger.error('[Main] load-project-path: invalid JSON', e);
            return { success: false, error: `File .lmp non valido o corrotto: ${e instanceof Error ? e.message : String(e)}` };
        }
    } catch (error) {
        logger.error('[Main] load-project-path failed:', error);
        return { success: false, error: String(error) };
    }
});


// BUILD-02 (v1.3.7): single-instance lock per evitare doppia esecuzione di RRLMP.
// Una seconda istanza accidentale (doppio-click rapido su icona, drop di un .lmp su
// app già aperta, taskbar pin lanciato due volte) produrrebbe DUE output audio
// simultanei sullo stesso device — disastro in diretta. Con il lock la seconda
// istanza esce immediatamente, e l'evento 'second-instance' nella prima istanza
// porta la finestra in primo piano + inoltra l'eventuale .lmp passato come argv.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, argv) => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            if (mainWindowRef.isMinimized()) mainWindowRef.restore();
            mainWindowRef.focus();
            // Cerca un .lmp negli argv ricevuti dalla seconda istanza e inoltralo
            // alla logica onOpenFile esistente nel renderer.
            const lmpArg = argv.slice(1).find(arg =>
                arg.endsWith('.lmp') &&
                !arg.includes('app.asar') &&
                fs.existsSync(arg)
            );
            if (lmpArg) {
                mainWindowRef.webContents.send('open-file', lmpArg);
            }
        }
    });
}

app.whenReady().then(() => {
    // v1.4.12 (MEDIA-05): adapter Node→Web stream SICURO per il protocollo media://.
    // `Readable.toWeb()` ha una race nota: quando il client annulla la richiesta a
    // stream in corso (audio element che cambia src, player.cleanup() durante
    // caricamenti di massa, preload scartato) il controller web viene chiuso e
    // l'evento 'close' del ReadStream prova a richiuderlo → TypeError
    // [ERR_INVALID_STATE] "Controller is already closed" come UNCAUGHT EXCEPTION nel
    // main (dialog d'errore in regia, visto in live il 2026-06-10). Questo adapter
    // rende close/enqueue/error idempotenti e distrugge il ReadStream su cancel.
    const toSafeWebStream = (nodeStream: fs.ReadStream): ReadableStream => {
        let done = false;
        return new ReadableStream({
            start(controller) {
                const safeClose = () => {
                    if (done) return;
                    done = true;
                    try { controller.close(); } catch { /* già chiuso/cancellato */ }
                };
                nodeStream.on('data', (chunk) => {
                    if (done) return;
                    try {
                        controller.enqueue(chunk as Buffer);
                    } catch {
                        // controller chiuso dal client: ferma la lettura
                        done = true;
                        nodeStream.destroy();
                        return;
                    }
                    // Backpressure: sospendi finché il consumer non richiede altri dati
                    if ((controller.desiredSize ?? 1) <= 0) nodeStream.pause();
                });
                nodeStream.on('end', safeClose);
                nodeStream.on('close', safeClose);
                nodeStream.on('error', (err) => {
                    if (done) return;
                    done = true;
                    try { controller.error(err); } catch { /* già chiuso */ }
                });
            },
            pull() {
                nodeStream.resume();
            },
            cancel() {
                done = true;
                nodeStream.destroy();
            }
        });
    };

    // Handle media:// protocol
    protocol.handle('media', (request) => {
        try {
            const requestUrl = request.url;
            // G6 Fix: Robust URI parsing for media:// protocol.
            // Strip protocol prefix, leaving the raw path component.
            let pathName = requestUrl.replace(/^media:\/\/+/, '');

            let filePath = decodeURIComponent(pathName);

            if (process.platform === 'win32') {
                // Windows: remove any accidental leading slash before drive letter (C:/)
                // media:///C:/... → after strip → /C:/... → remove leading /
                if (filePath.match(/^\/[A-Za-z]:\//)) {
                    filePath = filePath.slice(1);
                }
                filePath = filePath.replace(/\//g, '\\');
            } else {
                // macOS / Linux: paths are absolute and start with /
                // media:///Users/... → after strip → /Users/...
                // media:///home/... → /home/...
                // Ensure the leading slash is present (it should be, but guard against edge cases)
                if (!filePath.startsWith('/')) {
                    filePath = '/' + filePath;
                }
            }

            // GR-04 Fix: valida path prima di servire il file.
            // normalize() risolve i segmenti ".." per prevenire path traversal.
            // isAbsolute() blocca path relativi inattesi.
            // La whitelist estensioni impedisce l'accesso a file non audio.
            filePath = normalize(filePath);
            if (!isAbsolute(filePath)) {
                logger.warn(`[Media] Blocked non-absolute path: ${filePath}`);
                return new Response('Forbidden', { status: 403 });
            }
            if (!ALLOWED_MEDIA_EXTENSIONS.has(extname(filePath).toLowerCase())) {
                logger.warn(`[Media] Blocked non-audio extension: ${filePath}`);
                return new Response('Forbidden', { status: 403 });
            }

            if (!fs.existsSync(filePath)) {
                return new Response('File not found', { status: 404 });
            }

            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = request.headers.get('Range');

            const ext = filePath.split('.').pop()?.toLowerCase();
            let contentType = 'audio/mpeg';
            if (ext === 'wav') contentType = 'audio/wav';
            else if (ext === 'ogg') contentType = 'audio/ogg';
            else if (ext === 'm4a') contentType = 'audio/mp4';
            else if (ext === 'aac') contentType = 'audio/aac';
            else if (ext === 'flac') contentType = 'audio/flac';
            else if (ext === 'opus') contentType = 'audio/opus';

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const rawStart = parseInt(parts[0], 10);
                const rawEnd = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

                // MEDIA-03 (v1.3.4): clamp Range a [0, fileSize-1].
                // Un client (audio element con scrub aggressivo o seek su clip troncata
                // dopo trim) può chiedere `Range: bytes=N-N+big` con end oltre EOF: prima
                // veniva passato a createReadStream così com'era → Content-Length errato e
                // chunksize potenzialmente negativo se start>end. Ora rispondiamo 416 sui
                // range invalidi e clamp end a fileSize-1 sui range troppo larghi.
                if (!isFinite(rawStart) || rawStart < 0 || rawStart >= fileSize) {
                    return new Response('Range Not Satisfiable', {
                        status: 416,
                        headers: { 'Content-Range': `bytes */${fileSize}` }
                    });
                }
                const start = rawStart;
                const end = Math.min(isFinite(rawEnd) ? rawEnd : fileSize - 1, fileSize - 1);
                const chunksize = (end - start) + 1;

                // Ottimizzazione v0.12.0: Buffer ibrido.
                // Start a 128KB per colpire immediatamente l'evento <audio onPlay> ed azzerare la latenza.
                // 1MB per chunking parallelo o stream pesante.
                const isStartup = start === 0;
                const bufferSize = isStartup ? 128 * 1024 : 1024 * 1024;
                const nodeStream = fs.createReadStream(filePath, { start, end, highWaterMark: bufferSize });
                // MEDIA-04 (v1.3.4): su errore (USB unplugged, file rimosso mid-stream,
                // permessi cambiati) distruggi il nodeStream così Readable.toWeb propaga
                // l'errore al client come stream interrotto invece di lasciarlo appeso.
                nodeStream.on('error', (err) => {
                    logger.error('[Media] ReadStream Range error:', err);
                    try { nodeStream.destroy(err as Error); } catch { /* noop */ }
                });

                // v1.4.12 (MEDIA-05): adapter sicuro al posto di Readable.toWeb (vedi sopra).
                const webStream = toSafeWebStream(nodeStream);

                return new Response(webStream, {
                    status: 206,
                    headers: {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize.toString(),
                        'Content-Type': contentType,
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } else {
                const nodeStream = fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 });
                // MEDIA-04 (v1.3.4): vedi sopra.
                nodeStream.on('error', (err) => {
                    logger.error('[Media] ReadStream Full error:', err);
                    try { nodeStream.destroy(err as Error); } catch { /* noop */ }
                });

                // v1.4.12 (MEDIA-05): adapter sicuro al posto di Readable.toWeb (vedi sopra).
                const webStream = toSafeWebStream(nodeStream);

                return new Response(webStream, {
                    status: 200,
                    headers: {
                        'Content-Length': fileSize.toString(),
                        'Content-Type': contentType,
                        'Accept-Ranges': 'bytes',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

        } catch (error) {
            logger.error('Media Protocol Error:', error);
            return new Response('Internal Error', { status: 500 });
        }
    });

    // BUILD-01 (v1.3.7): AppUserModelId allineato a package.json build.appId.
    // Prima era `'com.electron'` (placeholder Electron) → su Windows il jump list e
    // la file association con .lmp soffrivano di mismatch (icona generica Electron,
    // toast notification raggruppato sotto "Electron Framework").
    if (process.platform === 'win32') app.setAppUserModelId('com.antigravity.rrlmp');

    // v1.2.3 — Rileva file .lmp passato come argomento (doppio click / file association OS)
    // Su Windows l'OS passa il path tra gli argv quando l'app è registrata come handler.
    // Escludiamo path interni di Electron (app.asar, electron.exe) e verifichiamo esistenza su disco.
    const initialFilePath = process.argv.slice(1).find(arg =>
        arg.endsWith('.lmp') &&
        !arg.includes('app.asar') &&
        fs.existsSync(arg)
    );
    createWindow(initialFilePath);

    // v0.17.0 — Smart Mic: approva automaticamente i permessi getUserMedia (audio)
    // Electron 28 richiede che il main process approvi esplicitamente le richieste
    // di accesso ai dispositivi media dal renderer (getUserMedia per microfono).
    // v1.2.26 (NEW-ME-05): approva 'media' SOLO per audio. Electron passa
    // `details.mediaTypes` (array di 'audio'/'video') con la richiesta: l'app
    // non usa la webcam — autorizzare anche video amplierebbe la superficie
    // di attacco senza beneficio funzionale.
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => {
        if (permission === 'media') {
            const mediaTypes = (details as { mediaTypes?: string[] })?.mediaTypes;
            // Se mediaTypes è definito e contiene 'video', neghiamo l'intera richiesta.
            // Se mediaTypes è assente (older Electron), permettiamo: il constraint
            // nel renderer è già {audio: ..., video: false}, quindi non si può ottenere video comunque.
            if (mediaTypes && mediaTypes.includes('video')) {
                callback(false);
                return;
            }
            callback(true);
        } else if (permission === 'clipboard-sanitized-write') {
            // v1.4.1: il bottone COPY del LOG STREAM (Debug Overlay) usa
            // navigator.clipboard.writeText, che in Electron 28 richiede questo
            // permesso. Senza, la richiesta veniva negata dal ramo else → la Promise
            // di writeText rigettava ("error" segnalato in regia). Concediamo SOLO la
            // scrittura sanitizzata (testo su gesto utente): basso rischio, niente
            // lettura clipboard né altri permessi.
            callback(true);
        } else {
            callback(false);
        }
    });

    // v0.14.3 — Emergency Stop globale: Escape → stopAll nel renderer
    // v1.2.12 — guard isFocused(): non sparare se la finestra non è in primo piano
    // v1.4.13 (ESC-01) — RIMOSSO il globalShortcut: intercettava ESC a livello OS
    // PRIMA che il renderer vedesse il tasto, quindi i modali non potevano
    // consumarlo → STOP ALL anche con una modale aperta. Dato che dal v1.2.12
    // scattava comunque solo a finestra in primo piano, un listener keydown nel
    // renderer (App.tsx) è equivalente E lascia ai modali la possibilità di
    // intercettare ESC per chiudersi (hook useEscapeToClose).

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// v1.2.17 (NEW-GR-01): assicura che nessun child FFmpeg sopravviva all'app
app.on('before-quit', () => {
    const killed = AudioProcessor.cancelAllConversions();
    if (killed > 0) logger.warn(`[Main] Terminate ${killed} conversioni FFmpeg attive su before-quit`);
    stopRemoteControlServer(); // Controllo Remoto: mai lasciare il server LAN attivo dopo la chiusura dell'app
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
