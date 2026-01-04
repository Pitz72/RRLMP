import { contextBridge } from 'electron';
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
                // Fallback Legacy Electron
                if ((file as any).path) {
                    return (file as any).path;
                }
                return '';
            }
        });
    } catch (error) {
        console.error("Context Bridge Error:", error);
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = {
        getFilePath: (file: File) => (file as any).path
    };
}
