const isDev = process.env.NODE_ENV === 'development';

function ts(): string {
    return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

export const logger = {
    info: (msg: string, ...args: unknown[]): void => {
        if (isDev) console.log(`[${ts()}] ${msg}`, ...args);
    },
    warn: (msg: string, ...args: unknown[]): void => {
        console.warn(`[${ts()}] ${msg}`, ...args);
    },
    error: (msg: string, ...args: unknown[]): void => {
        console.error(`[${ts()}] ${msg}`, ...args);
    },
};