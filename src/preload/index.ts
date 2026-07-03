import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
const { webUtils } = require('electron');

// Speculare a UpdaterStatusPayload in src/main/updateManager.ts
type UpdaterStatusPayload =
    | { type: 'checking' }
    | { type: 'not-available' }
    | { type: 'available'; version: string; canAutoInstall: boolean; downloadUrl?: string; releaseNotes?: string }
    | { type: 'downloading'; percent: number }
    | { type: 'ready'; version: string; canAutoInstall: boolean }
    | { type: 'error'; message: string };

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', {
            // Metodo sicuro per ottenere il path di un File Object
            getFilePath: (file: File) => {
                if (webUtils && typeof webUtils.getPathForFile === 'function') {
                    return webUtils.getPathForFile(file);
                }
                // Fallback for older electron or specific cases where webUtils might be restricted
                const fileWithPath = file as File & { path?: string };
                if (fileWithPath.path) {
                    return fileWithPath.path;
                }
                return '';
            },
            // Audio Engine (Main-Side-Heavy)
            getAudioMetadata: (filePath: string) => ipcRenderer.invoke('get-audio-metadata', filePath),
            measureLoudness: (filePath: string) => ipcRenderer.invoke('measure-loudness', filePath),
            getWaveformData: (filePath: string) => ipcRenderer.invoke('get-waveform-data', filePath),
            detectSilence: (filePath: string, thresholdDb?: number) => ipcRenderer.invoke('detect-silence', filePath, thresholdDb),
            detectSmartCues: (filePath: string) => ipcRenderer.invoke('detect-smart-cues', filePath),
            detectBpm: (filePath: string) => ipcRenderer.invoke('detect-bpm', filePath),

            // Controllo Remoto (2026-07-01, Step 1/N) — server LAN locale opt-in
            remoteControlStart: () => ipcRenderer.invoke('remote-control:start'),
            remoteControlStop: () => ipcRenderer.invoke('remote-control:stop'),
            remoteControlStatus: () => ipcRenderer.invoke('remote-control:status'),
            onRemoteCommand: (callback: (data: { name: string; clipId?: string }) => void) => {
                const subscription = (_event: IpcRendererEvent, data: { name: string; clipId?: string }) => callback(data);
                ipcRenderer.on('remote-command', subscription);
                return () => ipcRenderer.removeListener('remote-command', subscription);
            },
            publishRemoteState: (clips: Array<{ id: string; name: string; isPlaying: boolean }>) =>
                ipcRenderer.send('remote-control:publish-state', clips),
            checkFilesExist: (paths: string[]) => ipcRenderer.invoke('check-files-exist', paths),
            // v1.10.8 — libreria FX di default (CC0): copia in userData e ritorna i path
            restoreDefaultSfx: () => ipcRenderer.invoke('restore-default-sfx'),

            // Persistence APIs
            saveProject: (content: string) => ipcRenderer.invoke('dialog:save-project', content),
            loadProject: () => ipcRenderer.invoke('dialog:load-project'),
            // Export API (v0.7.0)
            exportProject: (projectJsonString: string, lmpPath?: string) => ipcRenderer.invoke('export-project', projectJsonString, lmpPath),
            onExportProgress: (callback: (event: IpcRendererEvent, data: { current: number; total: number; filename: string }) => void) => {
                const subscription = (_event: IpcRendererEvent, data: { current: number; total: number; filename: string }) => callback(_event, data);
                ipcRenderer.on('export-progress', subscription);
                // Return cleanup function to allow removing listener
                return () => ipcRenderer.removeListener('export-progress', subscription);
            },
            saveProjectSilent: (content: string, filePath?: string) => ipcRenderer.invoke('save-project-silent', content, filePath),
            saveProjectDirect: (content: string, filePath: string) => ipcRenderer.invoke('save-project-direct', content, filePath),
            showCloseDialog: () => ipcRenderer.invoke('show-close-dialog'),
            // i18n (2026-07-03) — notifica al main la lingua corrente (dialoghi nativi + errori IPC)
            setAppLanguage: (lang: string) => ipcRenderer.send('i18n:set-language', lang),
            forceClose: () => ipcRenderer.send('force-close'),
            onCheckCloseIntent: (callback: () => void) => {
                const subscription = () => callback();
                ipcRenderer.on('check-close-intent', subscription);
                return () => ipcRenderer.removeListener('check-close-intent', subscription);
            },
            // M1 Fix: dialog con label localizzate dal renderer
            showCloseDialogI18n: (labels: {
                btnSave: string;
                btnDiscard: string;
                btnCancel: string;
                title: string;
                message: string;
            }) => ipcRenderer.invoke('show-close-dialog-i18n', labels),
            // v0.14.12 — Import playlist M3U → PRE-SHOW
            importM3u: () => ipcRenderer.invoke('import-m3u'),
            // v0.14.3 — Emergency Stop globale
            onEmergencyStop: (callback: () => void) => {
                const subscription = () => callback();
                ipcRenderer.on('emergency-stop', subscription);
                return () => ipcRenderer.removeListener('emergency-stop', subscription);
            },
            // Utilities
            openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
            getPlatform: () => process.platform,
            // Auto-Updater (2026-07-02) — payload speculare a UpdaterStatusPayload in
            // src/main/updateManager.ts (non importato direttamente: preload e main
            // hanno rootDir separati in tsconfig, il tipo va tenuto allineato a mano).
            checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
            downloadUpdate: () => ipcRenderer.invoke('download-update'),
            quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
            onUpdaterStatus: (callback: (status: UpdaterStatusPayload) => void) => {
                const subscription = (_event: IpcRendererEvent, status: UpdaterStatusPayload) => callback(status);
                ipcRenderer.on('updater:status', subscription);
                return () => ipcRenderer.removeListener('updater:status', subscription);
            },
            // v1.2.3 — Apertura diretta file .lmp da doppio click / file association OS
            loadProjectFromPath: (filePath: string) => ipcRenderer.invoke('load-project-path', filePath),
            onOpenFile: (callback: (filePath: string) => void) => {
                const subscription = (_event: IpcRendererEvent, filePath: string) => callback(filePath);
                ipcRenderer.on('open-file', subscription);
                return () => ipcRenderer.removeListener('open-file', subscription);
            },
            // v1.1.3 — Session Recording (fix preload mismatch)
            showSaveDialogRecording: (defaultName: string, format: string) => ipcRenderer.invoke('show-save-dialog-recording', defaultName, format),
            saveRecordingBuffer: (arrayBuffer: ArrayBuffer) => ipcRenderer.invoke('save-recording-buffer', arrayBuffer),
            convertRecording: (inputPath: string, outputPath: string, options: { format?: string; bitrate?: number; sampleDepth?: number }) => ipcRenderer.invoke('convert-recording', inputPath, outputPath, options),
            deleteTempRecording: (path: string) => ipcRenderer.invoke('delete-temp-recording', path),
            // Playout Log
            savePlayoutLog: (csvContent: string, suggestedName: string) => ipcRenderer.invoke('save-playout-log', csvContent, suggestedName),
        });
    } catch (error) {
        console.error("Context Bridge Error:", error);
    }
} else {
    // Fallback for non-isolated environments
    (window as unknown as { electron: Record<string, unknown> }).electron = {
        getFilePath: (file: File) => (file as File & { path?: string }).path || '',
        saveProject: async () => ({ success: false, error: 'Not available in non-isolated mode' }),
        loadProject: async () => ({ success: false, error: 'Not available in non-isolated mode' }),
        exportProject: async () => ({ success: false, error: 'Not available in non-isolated mode' }),
        onExportProgress: () => () => { } // No-op cleanup
    };
}
