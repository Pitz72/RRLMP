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
        });
    } catch (error) {
        console.error("Context Bridge Error:", error);
    }
} else {
    // Fallback for non-isolated environments
    (window as any).electron = {
        getFilePath: (file: File) => (file as any).path || '',
        saveProject: async () => ({ success: false, error: 'Not available in non-isolated mode' }),
        loadProject: async () => ({ success: false, error: 'Not available in non-isolated mode' }),
        exportProject: async () => ({ success: false, error: 'Not available in non-isolated mode' }),
        onExportProgress: () => () => { } // No-op cleanup
    };
}
