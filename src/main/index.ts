import { app, shell, BrowserWindow, protocol } from 'electron';
import { join } from 'path';

// Registra privilegi per il protocollo media
protocol.registerSchemesAsPrivileged([
    { scheme: 'media', privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true } }
]);

function createWindow(): void {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon: join(__dirname, '../../build/icon.png') } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            // contextIsolation: true, // Standard
            // nodeIntegration: false, // Standard
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false // Allow local file access (Legacy Mode for Audio Stability)
        }
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        mainWindow.webContents.openDevTools(); // Enable DevTools in production for Debug
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    // HMR for renderer base on electron-vite usage usually.
    // For manual setup:
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
}

app.whenReady().then(() => {
    // Handle media:// protocol
    protocol.handle('media', (request) => {
        try {
            // Estrae il path rimuovendo media://, media:///, etc.
            const url = request.url.replace(/^media:\/*/, '');

            // Decodifica (gestisce %20, etc.)
            const filePath = decodeURIComponent(url);

            // Log per debug (visibile se lanciato da terminale)
            console.log('Media Request:', request.url, '->', filePath);

            // Use Native Node Streams for maximum stability
            // This prevents buffering the whole file in Main process
            // We use standard require here to ensure node environment access
            const fs = require('fs');
            const { Readable } = require('stream');

            try {
                if (!fs.existsSync(filePath)) {
                    console.error('File not found:', filePath);
                    return new Response('File not found', { status: 404 });
                }

                const stat = fs.statSync(filePath);
                // highWaterMark: 1MB buffering per chunk (riduce stuttering)
                const nodeStream = fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 });
                // Convert Node stream to Web stream for Response
                // @ts-ignore
                const webStream = Readable.toWeb(nodeStream);

                return new Response(webStream, {
                    status: 200,
                    headers: {
                        'Content-Length': stat.size.toString(),
                        'Content-Type': 'audio/mpeg', // fallback
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } catch (fsError) {
                console.error('FS Read Error:', fsError);
                return new Response('File Access Error', { status: 500 });
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
