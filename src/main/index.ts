import { app, shell, BrowserWindow, protocol, nativeImage } from 'electron';
import { join } from 'path';

// M7 Fix: rimosso bypassCSP — il protocollo media:// ha secure:true
// che gli assegna il livello di attendibilità di una pagina HTTPS.
// GR6 Fix: CSP viene applicato via onHeadersReceived (vedi createWindow).
protocol.registerSchemesAsPrivileged([
    { scheme: 'media', privileges: { secure: true, supportFetchAPI: true, stream: true } }
]);

function createWindow(): void {
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

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    // CLOSING HANDSHAKE
    mainWindow.on('close', (e) => {
        e.preventDefault(); // ALWAYS prevent default first
        mainWindow.webContents.send('check-close-intent'); // Ask Renderer
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    // GR6 Fix: Content Security Policy header.
    // Permette risorse solo da 'self' e dal protocollo media:// per l'audio.
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self'; " +
                    // media: necessario per il protocollo custom (audio)
                    "media-src 'self' media:; " +
                    // 'unsafe-inline' necessario per il bundle Vite (script inline nell'HTML)
                    "script-src 'self' 'unsafe-inline'; " +
                    // 'unsafe-inline' necessario per Tailwind CSS-in-JS
                    "style-src 'self' 'unsafe-inline'; " +
                    "font-src 'self' data:; " +
                    "img-src 'self' data:; " +
                    // runtimeradio.it necessario per il check aggiornamenti versione
                    "connect-src 'self' https://www.runtimeradio.it;"
                ]
            }
        });
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    // --- IPC HANDLERS ---
    const { ipcMain, dialog } = require('electron');
    const fs = require('fs');

    // Force Close (Called by Renderer when safe)
    ipcMain.on('force-close', () => {
        mainWindow.destroy();
    });

    // Show Close Dialog (Called by Renderer if Dirty) — stringhe hardcoded (legacy)
    ipcMain.handle('show-close-dialog', async () => {
        const result = await dialog.showMessageBox(mainWindow, {
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
    // Evita dialog hardcoded in italiano su interfacce in altre lingue.
    ipcMain.handle('show-close-dialog-i18n', async (_: any, labels: {
        btnSave: string;
        btnDiscard: string;
        btnCancel: string;
        title: string;
        message: string;
    }) => {
        const result = await dialog.showMessageBox(mainWindow, {
            type: 'question',
            buttons: [labels.btnSave, labels.btnDiscard, labels.btnCancel],
            title: labels.title,
            message: labels.message,
            defaultId: 0,
            cancelId: 2
        });
        return result.response;
    });

    ipcMain.handle('dialog:save-project', async (_: any, content: string) => {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
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
    ipcMain.handle('save-project-direct', async (_: any, content: string, filePath: string) => {
        try {
            fs.writeFileSync(filePath, content, 'utf-8');
            return { success: true, filePath };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle('dialog:load-project', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'Load Project',
            filters: [{ name: 'RRLMP Project', extensions: ['lmp'] }],
            properties: ['openFile']
        });

        if (canceled || filePaths.length === 0) return { success: false };

        try {
            const content = fs.readFileSync(filePaths[0], 'utf-8');
            return { success: true, data: content, filePath: filePaths[0] };
        } catch (error) {
            console.error('Load failed:', error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle('export-project', async (_: any, projectJsonString: string) => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
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
                        mainWindow.webContents.send('export-progress', {
                            current: processed,
                            total: totalFiles,
                            filename: currentFileName
                        });
                    }

                    await new Promise(resolve => setTimeout(resolve, 5));

                    if (originalPath && fs.existsSync(originalPath)) {
                        const fileName = join(originalPath).split(process.platform === 'win32' ? '\\' : '/').pop();
                        if (fileName) {
                            // GR9 Fix: evita sovrascrittura silenziosa di file con lo stesso nome.
                            // Se il file di destinazione esiste già, aggiunge suffisso numerico.
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

    ipcMain.handle('save-project-silent', async (_: any, content: string, filePath?: string) => {
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

            // GR10 Fix: rotazione autosave — mantieni solo gli ultimi 10 file.
            // Evita l'accumulo di centinaia di file dopo settimane di uso.
            if (!filePath) {
                const userDataPath = app.getPath('userData');
                const autosaveDir = join(userDataPath, 'autosaves');
                const allFiles = fs.readdirSync(autosaveDir)
                    .filter((f: string) => f.startsWith('autosave_') && f.endsWith('.lmp'))
                    .map((f: string) => ({ name: f, time: fs.statSync(join(autosaveDir, f)).mtimeMs }))
                    .sort((a: { time: number }, b: { time: number }) => b.time - a.time); // più recenti prima
                const MAX_AUTOSAVES = 10;
                const toDelete = allFiles.slice(MAX_AUTOSAVES);
                toDelete.forEach((f: { name: string }) => {
                    try { fs.unlinkSync(join(autosaveDir, f.name)); } catch { /* ignora errori di pulizia */ }
                });
            }

            return { success: true, path: targetPath };
        } catch (error) {
            console.error('Auto-save failed:', error);
            return { success: false, error: String(error) };
        }
    });
}



app.whenReady().then(() => {
    // Handle media:// protocol
    protocol.handle('media', (request) => {
        try {
            // FIX 0.5.3: Strict URI Decoding Logic
            const requestUrl = request.url;

            // 1. Remove protocol
            let pathName = requestUrl.replace('media://', '');

            // 2. Handle triple slash or leading slash residue
            // (e.g. media:///C:/... -> /C:/... -> C:/...)
            if (pathName.startsWith('/')) {
                pathName = pathName.slice(1);
            }

            // 3. CRITICAL DECODING (Fixes spaces %20 and accents)
            let filePath = decodeURIComponent(pathName);

            // 4. Windows Normalization
            if (process.platform === 'win32') {
                filePath = filePath.replace(/\//g, '\\');
            }

            // Debug Log
            // console.log('Serving media:', filePath);

            // Debug Log
            // console.log('Media Request:', request.url, '->', filePath);

            const fs = require('fs');
            const { Readable } = require('stream');

            if (!fs.existsSync(filePath)) {
                console.error('File not found:', filePath);
                return new Response('File not found', { status: 404 });
            }

            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = request.headers.get('Range');

            // Determine Content-Type
            const ext = filePath.split('.').pop()?.toLowerCase();
            let contentType = 'audio/mpeg'; // Default (MP3)
            if (ext === 'wav') contentType = 'audio/wav';
            else if (ext === 'ogg') contentType = 'audio/ogg';
            else if (ext === 'm4a') contentType = 'audio/mp4';
            else if (ext === 'aac') contentType = 'audio/aac';
            else if (ext === 'flac') contentType = 'audio/flac';

            if (range) {
                // Handle Range Request (206)
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;

                const nodeStream = fs.createReadStream(filePath, { start, end, highWaterMark: 64 * 1024 }); // 64KB chunks optimized for seeking
                // @ts-ignore
                const webStream = Readable.toWeb(nodeStream);

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
                // Handle Full Request (200)
                const nodeStream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });
                // @ts-ignore
                const webStream = Readable.toWeb(nodeStream);

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

    // Set app user model id for windows
    if (process.platform === 'win32') app.setAppUserModelId('com.electron');

    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
