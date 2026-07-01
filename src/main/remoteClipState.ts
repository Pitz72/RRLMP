// Controllo Remoto (2026-07-01, Step 4/N) — validazione dello stato clip
// pubblicato dal renderer verso il main (verso opposto rispetto ai comandi:
// qui è il renderer a informare il server di cosa mostrare sul tablet).
// Logica pura e testabile: il main non deve mai fidarsi ciecamente della
// forma del payload ricevuto via IPC prima di rispedirlo a un client di rete.

export interface RemoteClipState {
    id: string;
    name: string;
    isPlaying: boolean;
}

const MAX_CLIPS = 500; // margine ampio, protegge solo da payload anomali

export function sanitizeRemoteClipState(input: unknown): RemoteClipState[] {
    if (!Array.isArray(input)) return [];
    const out: RemoteClipState[] = [];
    for (const item of input) {
        if (out.length >= MAX_CLIPS) break;
        if (typeof item !== 'object' || item === null) continue;
        const obj = item as Record<string, unknown>;
        if (typeof obj.id !== 'string' || !obj.id) continue;
        if (typeof obj.name !== 'string') continue;
        out.push({ id: obj.id, name: obj.name, isPlaying: obj.isPlaying === true });
    }
    return out;
}
