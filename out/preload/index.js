"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const { webUtils } = require('electron');
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
if (process.contextIsolated) {
    try {
        electron_1.contextBridge.exposeInMainWorld('electron', {
            // Metodo sicuro per ottenere il path di un File Object
            // Usa fallback su proprietà non standard se webUtils fallisce (electron < 20 o problemi di bundling)
            getFilePath: (file) => {
                // @ts-ignore
                if (webUtils && typeof webUtils.getPathForFile === 'function') {
                    // @ts-ignore
                    return webUtils.getPathForFile(file);
                }
                // Fallback Legacy Electron
                if (file.path) {
                    return file.path;
                }
                return '';
            }
        });
    }
    catch (error) {
        console.error("Context Bridge Error:", error);
    }
}
else {
    // @ts-ignore (define in dts)
    window.electron = {
        getFilePath: (file) => file.path
    };
}
