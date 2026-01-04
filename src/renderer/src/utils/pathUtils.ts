export const toFileUrl = (filePath: string): string => {
    // Normalizza gli slash (Windows backslash -> Forward slash)
    let normalized = filePath.replace(/\\/g, '/');

    // Legacy Mode: Usa file:/// diretto
    // Chromium gestirà nativamente lo streaming
    return `file:///${normalized}`;
};
