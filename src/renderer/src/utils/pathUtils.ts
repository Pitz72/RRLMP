export const toFileUrl = (filePath: string): string => {
    // G6 Fix: Usa il protocollo media:// invece di file:///
    // media:// è gestito dal main process (src/main/index.ts) con supporto
    // Range Request, streaming 64KB e decoding corretto di URI (spazi, accenti).
    const normalized = filePath.replace(/\\/g, '/');
    // Encode solo i caratteri speciali mantenendo il drive letter (C:/)
    const encoded = normalized.split('/').map((segment, i) =>
        // Non encodare il drive letter (es. "C:") né stringhe vuote
        (i === 0 && segment.includes(':')) ? segment : encodeURIComponent(segment)
    ).join('/');
    // IMPORTANTE: triplo slash (media:///) per avere authority vuota.
    // media://K:/path tratterebbe "K:" come hostname (URL invalido su Windows).
    // media:///K:/path → authority="" path="/K:/path" → identico a file:///C:/path
    return `media:///${encoded}`;
};
