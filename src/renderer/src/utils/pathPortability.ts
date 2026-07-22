// v1.15.14 — Portabilità dei progetti esportati.
//
// L'export (v1.15.9) ripunta le clip alla cartella `audio/` accanto al .lmp con
// PATH ASSOLUTI della macchina di origine. Un archivio zippato e aperto su
// un'altra macchina (o spostato in un'altra cartella) ha quindi clip visibili
// ma non riproducibili: i path puntano a posizioni che non esistono.
//
// Queste funzioni sono pure (niente IPC/fs) così da essere testabili in Vitest;
// i chiamanti (useProjectStore) fanno i check di esistenza via IPC.

/** Path assoluto? Copre drive Windows (C:\ o C:/), UNC (\\server\share) e POSIX (/). */
export const isAbsolutePath = (p: string): boolean =>
    /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith('\\\\') || p.startsWith('/');

/** Separatore da usare per costruire path coerenti con `referencePath`. */
const sepOf = (referencePath: string): string => (referencePath.includes('\\') ? '\\' : '/');

/** Cartella che contiene il file (senza separatore finale). Null se non determinabile. */
export const dirnameOf = (filePath: string): string | null => {
    const idx = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
    return idx > 0 ? filePath.slice(0, idx) : null;
};

/** Ultimo segmento del path (nome file), qualunque sia il separatore. */
export const basenameOf = (p: string): string => {
    const idx = Math.max(p.lastIndexOf('\\'), p.lastIndexOf('/'));
    return idx >= 0 ? p.slice(idx + 1) : p;
};

/**
 * Risolve un path di clip RELATIVO (es. `audio/jingle.mp3`, scritto dall'export
 * "libero" nel project.lmp) contro la cartella del .lmp. I path assoluti
 * tornano invariati. Normalizza i separatori a quelli del .lmp.
 */
export const resolveClipPath = (clipPath: string, lmpPath: string): string => {
    if (!clipPath || isAbsolutePath(clipPath)) return clipPath;
    const dir = dirnameOf(lmpPath);
    if (!dir) return clipPath;
    const sep = sepOf(lmpPath);
    return `${dir}${sep}${clipPath.replace(/[\\/]/g, sep)}`;
};

/**
 * Candidato di riparazione per una clip il cui file non esiste più: lo stesso
 * nome file dentro `audio/` accanto al .lmp (layout garantito dall'export).
 * Null se il candidato coincide col path già rotto (niente da tentare).
 */
export const audioFallbackCandidate = (clipPath: string, lmpPath: string): string | null => {
    const dir = dirnameOf(lmpPath);
    if (!dir || !clipPath) return null;
    const sep = sepOf(lmpPath);
    const candidate = `${dir}${sep}audio${sep}${basenameOf(clipPath)}`;
    return candidate.toLowerCase() === clipPath.toLowerCase() ? null : candidate;
};
