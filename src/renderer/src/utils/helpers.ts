import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const optimizeTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};
