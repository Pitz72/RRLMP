import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
const { webUtils } = require('electron');

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
            getWaveformData: (filePath: string) => ipcRenderer.invoke('get-waveform-data', filePath),
            detectSilence: (filePath: string) => ipcRenderer.invoke('detect-silence', filePath),
            checkFilesExist: (paths: string[]) => ipcRenderer.invoke('check-files-exist', paths),

            // Persistence APIs
            saveProject: (content: string) => ipcRenderer.invoke('dialog:save-project', content),
            loadProject: () => ipcRenderer.invoke('dialog:load-project'),
            // Export API (v0.7.0)
            exportProject: (projectJsonString: string) => ipcRenderer.invoke('export-project', projectJsonString),
            onExportProgress: (callback: (event: IpcRendererEvent, data: { current: number; total: number; filename: string }) => void) => {
                const subscription = (_event: IpcRendererEvent, data: { current: number; total: number; filename: string }) => callback(_event, data);
                ipcRenderer.on('export-progress', subscription);
                // Return cleanup function to allow removing listener
                return () => ipcRenderer.removeListener('export-progress', subscription);
            },
            saveProjectSilent: (content: string, filePath?: string) => ipcRenderer.invoke('save-project-silent', content, filePath),
            saveProjectDirect: (content: string, filePath: string) => ipcRenderer.invoke('save-project-direct', content, filePath),
            showCloseDialog: () => ipcRenderer.invoke('show-close-dialog'),
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
            // v1.1.3 — Session Recording (fix preload mismatch)
            showSaveDialogRecording: (defaultName: string, format: string) => ipcRenderer.invoke('show-save-dialog-recording', defaultName, format),
            saveRecordingBuffer: (arrayBuffer: ArrayBuffer) => ipcRenderer.invoke('save-recording-buffer', arrayBuffer),
            convertRecording: (inputPath: string, outputPath: string, options: { format?: string; bitrate?: number; sampleDepth?: number }) => ipcRenderer.invoke('convert-recording', inputPath, outputPath, options),
            deleteTempRecording: (path: string) => ipcRenderer.invoke('delete-temp-recording', path),
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
