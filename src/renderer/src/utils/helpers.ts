import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const optimizeTime = (seconds: number): string => {
    // AUDIT-LI (2026-05-29): guardia su input non valido. Senza, un seconds NaN
    // (duration non ancora nota) o negativo produceva "NaN:NaN" / tempi negativi
    // in UI. Si normalizza a 0 prima della formattazione.
    const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    const m = Math.floor(safe / 60);
    const s = Math.floor(safe % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};
