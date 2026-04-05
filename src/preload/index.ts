import { contextBridge, ipcRenderer } from 'electron';
const { webUtils } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', {
            // Metodo sicuro per ottenere il path di un File Object
            // Usa fallback su proprietà non standard se webUtils fallisce (electron < 20 o problemi di bundling)
            getFilePath: (file: File) => {
                // @ts-ignore
                if (webUtils && typeof webUtils.getPathForFile === 'function') {
                    // @ts-ignore
                    return webUtils.getPathForFile(file);
                }
                if ((file as any).path) {
                    return (file as any).path;
                }
                return '';
            },
            // Persistence APIs
            saveProject: (content: string) => ipcRenderer.invoke('dialog:save-project', content),
            loadProject: () => ipcRenderer.invoke('dialog:load-project'),
            // Export API (v0.7.0)
            exportProject: (projectJsonString: string) => ipcRenderer.invoke('export-project', projectJsonString),
            onExportProgress: (callback: (event: any, data: { current: number; total: number; filename: string }) => void) => {
                const subscription = (_event: any, data: any) => callback(_event, data);
                ipcRenderer.on('export-progress', subscription);
                // Return cleanup function to allow removing listener
                return () => ipcRenderer.removeListener('export-progress', subscription);
            },
            saveProjectSilent: (content: string, filePath?: string) => ipcRenderer.invoke('save-project-silent', content, filePath),
            saveProjectDirect: (content: string, filePath: string) => ipcRenderer.invoke('save-project-direct', content, filePath),
            showCloseDialog: () => ipcRenderer.invoke('show-close-dialog'),
            forceClose: () => ipcRenderer.send('force-close'),
            onCheckCloseIntent: (callback: () => void) => {
                const subscription = (_: any) => callback();
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
    // @ts-ignore (define in dts)
    window.electron = {
        getFilePath: (file: File) => (file as any).path,
        saveProject: async () => ({ success: false, error: 'Not available in non-isolated mode' }),
        loadProject: async () => ({ success: false, error: 'Not available in non-isolated mode' }),
        exportProject: async () => ({ success: false, error: 'Not available in non-isolated mode' }),
        onExportProgress: () => () => { } // No-op cleanup
    };


}
