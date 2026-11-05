// Controllo Remoto (2026-07-01, Step 4/N) — validazione dello stato clip
// pubblicato dal renderer verso il main (verso opposto rispetto ai comandi:
// qui è il renderer a informare il server di cosa mostrare sul tablet).
// Logica pura e testabile: il main non deve mai fidarsi ciecamente della
// forma del payload ricevuto via IPC prima di rispedirlo a un client di rete.
//
// v1.15.37: oltre alla colonna Music viaggiano i pad FX (colonna col-sfx), con
// il colore scelto dall'utente e il flag «file mancante», così il telefono
// mostra la stessa cartwall della regia.

export interface RemoteClipState {
    id: string;
    name: string;
    isPlaying: boolean;
    /** v1.15.37: brano Music in uscita durante un mix. */
    fading?: boolean;
}

/** v1.15.37 — modalità MIX vista dal telefono. */
export interface RemoteMixState {
    on: boolean;
    nextId?: string;
    nextName?: string;
    /** come si arriverà al prossimo: mix a tempo, crossfade classico, o partenza (nulla in onda) */
    nextMode?: 'tempo' | 'classic' | 'start';
    /** esito dell'ultimo passaggio */
    last?: 'beatmatched' | 'classic' | 'skipped';
}

export interface RemoteFxState extends RemoteClipState {
    /** Colore del pad (#rrggbb), solo se assegnato dall'utente. */
    color?: string;
    /** File audio non trovato: il pad è visibile ma non suona. */
    missing?: boolean;
}

export interface RemoteState {
    music: RemoteClipState[];
    fx: RemoteFxState[];
    mix: RemoteMixState;
}

const MAX_CLIPS = 500; // margine ampio, protegge solo da payload anomali
const MAX_NAME_LENGTH = 200; // un titolo più lungo non entra comunque in un pad
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function sanitizeBase(obj: Record<string, unknown>): RemoteClipState | null {
    if (typeof obj.id !== 'string' || !obj.id) return null;
    if (typeof obj.name !== 'string') return null;
    return { id: obj.id, name: obj.name.slice(0, MAX_NAME_LENGTH), isPlaying: obj.isPlaying === true };
}

export function sanitizeRemoteClipState(input: unknown): RemoteClipState[] {
    if (!Array.isArray(input)) return [];
    const out: RemoteClipState[] = [];
    for (const item of input) {
        if (out.length >= MAX_CLIPS) break;
        if (typeof item !== 'object' || item === null) continue;
        const base = sanitizeBase(item as Record<string, unknown>);
        if (!base) continue;
        // v1.15.37: in uscita durante un mix (mai insieme a «in onda»)
        if ((item as Record<string, unknown>).fading === true && !base.isPlaying) base.fading = true;
        out.push(base);
    }
    return out;
}

const NEXT_MODES = new Set(['tempo', 'classic', 'start']);
const LAST_MODES = new Set(['beatmatched', 'classic', 'skipped']);

/** v1.15.37 — stato MIX: solo valori noti, nomi troncati. */
export function sanitizeRemoteMixState(input: unknown): RemoteMixState {
    if (typeof input !== 'object' || input === null) return { on: false };
    const obj = input as Record<string, unknown>;
    const out: RemoteMixState = { on: obj.on === true };
    if (typeof obj.nextId === 'string' && obj.nextId && typeof obj.nextName === 'string') {
        out.nextId = obj.nextId.slice(0, MAX_NAME_LENGTH);
        out.nextName = obj.nextName.slice(0, MAX_NAME_LENGTH);
        if (typeof obj.nextMode === 'string' && NEXT_MODES.has(obj.nextMode)) out.nextMode = obj.nextMode as RemoteMixState['nextMode'];
    }
    if (typeof obj.last === 'string' && LAST_MODES.has(obj.last)) out.last = obj.last as RemoteMixState['last'];
    return out;
}

export function sanitizeRemoteFxState(input: unknown): RemoteFxState[] {
    if (!Array.isArray(input)) return [];
    const out: RemoteFxState[] = [];
    for (const item of input) {
        if (out.length >= MAX_CLIPS) break;
        if (typeof item !== 'object' || item === null) continue;
        const obj = item as Record<string, unknown>;
        const base = sanitizeBase(obj);
        if (!base) continue;
        const fx: RemoteFxState = { ...base };
        if (typeof obj.color === 'string' && HEX_COLOR.test(obj.color)) fx.color = obj.color.toLowerCase();
        if (obj.missing === true) {
            fx.missing = true;
            fx.isPlaying = false; // un file mancante non può essere in onda
        }
        out.push(fx);
    }
    return out;
}

/**
 * Stato completo pubblicato dal renderer. Accetta anche la forma storica (un
 * array = sola colonna Music, fino alla 1.15.36) per non rompere un renderer
 * più vecchio durante lo sviluppo.
 */
export function sanitizeRemoteState(input: unknown): RemoteState {
    if (Array.isArray(input)) return { music: sanitizeRemoteClipState(input), fx: [], mix: { on: false } };
    if (typeof input !== 'object' || input === null) return { music: [], fx: [], mix: { on: false } };
    const obj = input as Record<string, unknown>;
    return {
        music: sanitizeRemoteClipState(obj.music),
        fx: sanitizeRemoteFxState(obj.fx),
        mix: sanitizeRemoteMixState(obj.mix)
    };
}
