import { app, shell, BrowserWindow, protocol, nativeImage, ipcMain, dialog, globalShortcut, session } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { Readable } from 'stream';
import { AudioProcessor } from './AudioProcessor';

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
    });

    // CLOSING HANDSHAKE
    mainWindow.on('close', (e) => {
        if (mainWindow.webContents.isDestroyed()) return;
        e.preventDefault(); // ALWAYS prevent default first
        mainWindow.webContents.send('check-close-intent'); // Ask Renderer
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    // GR6 Fix: Content Security Policy header.
    // BUGFIX v0.10.3: In produzione (file://), la CSP iniettata tramite onHeadersReceived
    // può bloccare il bundle JS se troppo restrittiva. Aggiungiamo compatibilità specifica.
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        const cspHeader = [
            "default-src 'self' 'unsafe-inline' data: blob:; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // unsafe-eval necessario per HMR in dev
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
        console.warn('!!! RENDERER PROCESS IS HANGING (White Screen detected) !!!');
    });

    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        console.error(`!!! RENDERER PROCESS GONE: ${details.reason} (Exit Code: ${details.exitCode}) !!!`);
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
    return await AudioProcessor.extractMetadata(filePath);
});

ipcMain.handle('get-waveform-data', async (_event, filePath: string) => {
    return await AudioProcessor.generateWaveformData(filePath);
});

ipcMain.handle('detect-silence', async (_event, filePath: string) => {
    return await AudioProcessor.detectSilence(filePath);
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
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true, filePath };
    } catch (error) {
        console.error('Save failed:', error);
        return { success: false, error: String(error) };
    }
});

// New: Direct Save (Overwrite)
ipcMain.handle('save-project-direct', async (_event: Electron.IpcMainInvokeEvent, content: string, filePath: string) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
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
            return { success: true, data: content, filePath: filePaths[0] };
        }
    } catch (error) {
        console.error('Load failed:', error);
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
        const paths: string[] = lines
            .map((line: string) => require('path').isAbsolute(line) ? line : require('path').resolve(m3uDir, line))
            .filter((p: string) => {
                const ext = require('path').extname(p).toLowerCase();
                return AUDIO_EXTS.includes(ext) && fs.existsSync(p);
            });
        return { success: true, paths };
    } catch (e) {
        return { success: false, error: String(e) };
    }
});

ipcMain.handle('export-project', async (event, projectJsonString: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false };
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: 'Select Export Directory',
        properties: ['openDirectory', 'createDirectory']
    });

    if (canceled || filePaths.length === 0) return { success: false };

    const exportDir = filePaths[0];
    const audioDir = join(exportDir, 'audio');

    try {
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        const projectData = JSON.parse(projectJsonString);
        const { columns } = projectData.project;
        let successParams = { copied: 0, skipped: 0 };
        let totalFiles = 0;
        columns.forEach((col: any) => {
            totalFiles += col.clips.length;
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

                if (originalPath && fs.existsSync(originalPath)) {
                    const fileName = join(originalPath).split(process.platform === 'win32' ? '\\' : '/').pop();
                    if (fileName) {
                        const ext = fileName.includes('.') ? fileName.split('.').pop()! : '';
                        const base = ext ? fileName.slice(0, -(ext.length + 1)) : fileName;
                        let destFileName = fileName;
                        let counter = 1;
                        while (fs.existsSync(join(audioDir, destFileName))) {
                            destFileName = `${base}_${counter++}.${ext}`;
                        }
                        const destPath = join(audioDir, destFileName);
                        fs.copyFileSync(originalPath, destPath);
                        clip.path = `audio/${destFileName}`;
                        successParams.copied++;
                    }
                } else {
                    successParams.skipped++;
                }
            }
        }

        const newLmpPath = join(exportDir, 'project.lmp');
        fs.writeFileSync(newLmpPath, JSON.stringify(projectData, null, 2), 'utf-8');

        return { success: true, path: exportDir, stats: successParams };

    } catch (error) {
        console.error('Export failed:', error);
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
        fs.writeFileSync(targetPath, content, 'utf-8');

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
                try { fs.unlinkSync(join(autosaveDir, f.name)); } catch { /* ignore */ }
            });
        }

        return { success: true, path: targetPath };
    } catch (error) {
        console.error('Auto-save failed:', error);
        return { success: false, error: String(error) };
    }
});

// --- SESSION RECORDING IPC (v1.1.1+) ---

let recordingWriteStream: fs.WriteStream | null = null;
let currentTempRecordingPath: string | null = null;

ipcMain.handle('start-recording', async (_event) => {
    try {
        const tempDir = app.getPath('temp');
        const timestamp = Date.now();
        currentTempRecordingPath = join(tempDir, `rrlmp_temp_${timestamp}.webm`);
        
        recordingWriteStream = fs.createWriteStream(currentTempRecordingPath);
        console.log(`[Main] Temp recording started: ${currentTempRecordingPath}`);
        
        return { success: true, path: currentTempRecordingPath };
    } catch (error) {
        console.error('[Main] Failed to start temp recording:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('append-record-chunk', async (_event, arrayBuffer: ArrayBuffer) => {
    if (!recordingWriteStream) return { success: false, error: 'No active recording stream' };
    
    try {
        const buffer = Buffer.from(arrayBuffer);
        recordingWriteStream.write(buffer);
        return { success: true };
    } catch (error) {
        console.error('[Main] Failed to append chunk:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('stop-recording', async (_event) => {
    return new Promise((resolve) => {
        if (!recordingWriteStream) {
            return resolve({ success: false, error: 'No active recording stream' });
        }

        const path = currentTempRecordingPath;
        recordingWriteStream.end(() => {
            console.log(`[Main] Temp recording stopped: ${path}`);
            recordingWriteStream = null;
            resolve({ success: true, path });
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

    try {
        const result = await AudioProcessor.convertAudio(
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
        );

        if (result.success) {
            // Se la conversione è riuscita e il file è diverso dall'input, eliminiamo il temporaneo
            if (inputPath !== outputPath && fs.existsSync(inputPath)) {
                try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }
            }
        }

        return result;
    } catch (error) {
        console.error('[Main] Conversion failed:', error);
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
        console.log(`[Main] Recording buffer saved to: ${tempPath}`);
        return { success: true, path: tempPath };
    } catch (error) {
        console.error('[Main] Failed to save recording buffer:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('delete-temp-recording', async (_event, path: string) => {
    try {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
            return { success: true };
        }
        return { success: false, error: 'File not found' };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

// Apre un URL nel browser di sistema (usato dall'update checker)
ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url);
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
            return { success: true, data: content, filePath };
        }
    } catch (error) {
        console.error('[Main] load-project-path failed:', error);
        return { success: false, error: String(error) };
    }
});


app.whenReady().then(() => {
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

            // DIAGNOSTICS: Log the file being requested
            console.log(`[Media] Requesting: ${filePath}`);

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
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;

                // Ottimizzazione v0.12.0: Buffer ibrido. 
                // Start a 128KB per colpire immediatamente l'evento <audio onPlay> ed azzerare la latenza.
                // 1MB per chunking parallelo o stream pesante.
                const isStartup = start === 0;
                const bufferSize = isStartup ? 128 * 1024 : 1024 * 1024;
                const nodeStream = fs.createReadStream(filePath, { start, end, highWaterMark: bufferSize });
                nodeStream.on('error', (err) => console.error('[Media] ReadStream Range error:', err));
                
                const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

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
                nodeStream.on('error', (err) => console.error('[Media] ReadStream Full error:', err));
                
                const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

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
            console.error('Media Protocol Error:', error);
            return new Response('Internal Error', { status: 500 });
        }
    });

    if (process.platform === 'win32') app.setAppUserModelId('com.electron');

    // v1.2.3 — Rileva file .lmp passato come argomento (doppio click / file association OS)
    // Su Windows l'OS passa il path come process.argv[1] quando l'app è registrata come handler
    const initialFilePath = process.argv.find(arg => arg.endsWith('.lmp'));
    createWindow(initialFilePath);

    // v0.17.0 — Smart Mic: approva automaticamente i permessi getUserMedia (audio)
    // Electron 28 richiede che il main process approvi esplicitamente le richieste
    // di accesso ai dispositivi media dal renderer (getUserMedia per microfono).
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        if (permission === 'media') {
            callback(true); // approva sempre l'accesso audio/video richiesto dall'app
        } else {
            callback(false);
        }
    });

    // v0.14.3 — Emergency Stop globale: Escape → stopAll nel renderer
    globalShortcut.register('Escape', () => {
        BrowserWindow.getAllWindows().forEach(w => {
            if (!w.isDestroyed()) w.webContents.send('emergency-stop');
        });
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
