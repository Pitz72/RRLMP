// Controllo Remoto da tablet/PC secondario (2026-07-01) — server locale in
// LAN, avviabile/disattivabile a mano dalle Impostazioni (default OFF: nessuna
// superficie di rete attiva senza un'azione esplicita dell'utente).
// Endpoint: /health + pagina web con verifica PIN (/api/verify-pin, con
// rate-limit — vedi pinRateLimiter.ts). Canale comandi reale via WebSocket,
// whitelist esplicita in ALLOWED_COMMANDS (non un canale IPC generico apribile
// a qualunque azione futura senza revisione). Verso opposto: il renderer
// pubblica lo stato (updateRemoteState, validato da remoteClipState.ts) e il
// server lo trasmette in broadcast ai client WS autenticati.
//
// v1.11.3 — MODELLO DEFINITIVO (decisione utente 2026-07-02): pagina HTTP
// aperta nel BROWSER del dispositivo in LAN, punto. La storia completa: la PWA
// installabile richiedeva secure context → macchina dei certificati
// auto-firmati ("buco nero" PKI); l'app Android nativa (APK WebView + mDNS)
// la scavalcava ma aggiungeva un intero progetto satellite da mantenere e
// testare ("stavamo complicando tutto"). Rimossi entrambi: niente manifest/
// service worker, niente cartella android/, niente mDNS. La sicurezza resta
// affidata al PIN + autenticazione sul WebSocket, adeguata per una LAN; lo
// schermo intero si ottiene col pulsante Fullscreen nella pagina.
//
// v1.15.37 — PAD FX DAL TELEFONO (richiesta utente 2026-11-05: «governare in
// tempo reale e senza latenza i pad degli effetti sonori»). Novità:
//  - comandi `fxTrigger` (stesso gesto del click sul pad in regia: suona, o
//    ferma se è già in onda) e `stopAllFx` (ferma solo gli effetti);
//  - ogni comando porta un numero `seq` e riceve un `ack`: la pagina sa se il
//    tocco è arrivato e lo segnala se non arriva;
//  - ping applicativo (la pagina misura la latenza e si accorge di un
//    collegamento morto) + heartbeat lato server (chiude i client spariti senza
//    salutare, tipico di un telefono che va in standby);
//  - PIN fornito dal chiamante (main/index.ts lo conserva fra un avvio e
//    l'altro) e sostituibile a caldo con changeRemotePin: i client collegati
//    ricevono `bye` e devono reinserirlo;
//  - indirizzi LAN ordinati: prima la rete vera (Wi-Fi/Ethernet 192.168/10.x),
//    in fondo gli adattatori virtuali (WSL, Hyper-V, VirtualBox…), esclusi gli
//    indirizzi 169.254 (scheda senza rete). Il link da copiare usa il primo.
import * as http from 'http';
import * as os from 'os';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { join } from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './logger';
import { createPinRateLimiter } from './pinRateLimiter';
import { INDEX_HTML } from './remoteControlAssets';
import { RemoteState, sanitizeRemoteState } from './remoteClipState';

export const REMOTE_PORT = 8787;
let activePort = REMOTE_PORT; // fissa in produzione; i test ne usano una libera
const MAX_BODY_BYTES = 1024; // il body più grande atteso è {"pin":"123456"} — margine ampio
const MAX_WS_MESSAGE_BYTES = 4096; // il messaggio più grande atteso è un comando con clipId (UUID)
const AUTH_TIMEOUT_MS = 10_000; // una connessione WS deve autenticarsi entro 10s o viene chiusa
const HEARTBEAT_MS = 15_000; // ogni 15s: chi non ha risposto al giro precedente viene chiuso

// Stesso path usato in main/index.ts per l'icona della finestra: funziona sia in
// dev (progetto non pacchettizzato) sia in produzione (build/icon.png è incluso
// esplicitamente in package.json build.files, leggibile anche dentro app.asar).
const ICON_PATH = join(__dirname, '../../build/icon.png');

/** Comandi remoti abilitati. Whitelist esplicita — un comando non presente qui
 *  viene rifiutato anche se il client lo invia autenticato. */
export type RemoteCommandName = 'stopAll' | 'playClip' | 'stopClip' | 'fxTrigger' | 'stopAllFx' | 'mixNext' | 'mixOn' | 'mixOff';
// v1.15.37: mixNext (PROSSIMO col mix), mixOn/mixOff (modalità MIX) — senza clipId
const ALLOWED_COMMANDS: ReadonlySet<string> = new Set<RemoteCommandName>(['stopAll', 'playClip', 'stopClip', 'fxTrigger', 'stopAllFx', 'mixNext', 'mixOn', 'mixOff']);

export interface RemoteControlHandlers {
    /** Comando autenticato e valido: il main lo inoltra al renderer. */
    onCommand: (name: RemoteCommandName, clipId?: string) => void;
    /** v1.15.25 (M8): il server è caduto DOPO l'avvio (tipico: porta occupata —
     *  `listen` fallisce in modo asincrono, quando l'avvio ha già risposto "acceso"). */
    onFailure?: (message: string) => void;
    /** v1.15.37: numero di dispositivi autenticati cambiato (per le Impostazioni). */
    onClientsChanged?: (count: number) => void;
}

let server: http.Server | null = null;
let wss: WebSocketServer | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let currentPin: string | null = null;
let pinLimiter = createPinRateLimiter();
let handlers: RemoteControlHandlers | null = null;
let state: RemoteState = { music: [], fx: [], mix: { on: false } };
let statePayload = JSON.stringify({ type: 'state', music: [], fx: [], mix: { on: false } });
const authenticatedClients = new Set<WebSocket>();
const aliveClients = new WeakSet<WebSocket>();

function notifyClients(): void {
    handlers?.onClientsChanged?.(authenticatedClients.size);
}

function broadcast(payload: string): void {
    for (const client of authenticatedClients) {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
    }
}

/** Chiamata dal main quando il renderer pubblica lo stato aggiornato (colonna
 *  Music + pad FX, vedi ipcMain 'remote-control:publish-state'). Trasmette solo
 *  se qualcosa è cambiato davvero: il renderer pubblica anche per modifiche che
 *  il telefono non vede (durata, BPM…). */
export function updateRemoteState(input: unknown): void {
    state = sanitizeRemoteState(input);
    const payload = JSON.stringify({ type: 'state', music: state.music, fx: state.fx, mix: state.mix });
    if (payload === statePayload) return;
    statePayload = payload;
    broadcast(payload);
}

function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) {
                reject(new Error('Body troppo grande'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            } catch (err) {
                reject(err);
            }
        });
        req.on('error', reject);
    });
}

/** PIN numerico a 6 cifre.
 *  v1.15.23: generato con il PRNG crittografico. `Math.random()` non è pensato per
 *  produrre segreti — il suo stato interno è ricostruibile osservandone l'output —
 *  e questo PIN è l'unica credenziale del canale che comanda l'audio in onda. */
export function generatePin(): string {
    return String(crypto.randomInt(100000, 1000000));
}

/** v1.15.37: forma valida di un PIN conservato su disco (6 cifre, non zero iniziale). */
export function isValidPin(pin: unknown): pin is string {
    return typeof pin === 'string' && /^[1-9]\d{5}$/.test(pin);
}

/** v1.15.23: confronto a tempo costante, così la durata della risposta non lascia
 *  trapelare quante cifre iniziali erano corrette. Le stringhe di lunghezza diversa
 *  escono subito: la lunghezza del PIN è pubblica, non è un segreto da proteggere. */
function pinMatches(submitted: string, expected: string | null): boolean {
    if (!expected || submitted.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(submitted, 'utf8'), Buffer.from(expected, 'utf8'));
}

/**
 * v1.15.23: le connessioni WebSocket NON sono soggette alla same-origin policy —
 * una pagina web qualsiasi, aperta su un dispositivo della stessa rete, può aprire
 * un socket verso la regia e mettersi a tentare il PIN. Il rate-limiter rende il
 * tentativo a forza bruta impraticabile, ma il controllo dell'origine è la difesa
 * che mancava. Un client legittimo è la nostra pagina servita da questo stesso
 * server: o non manda `Origin` (WebSocket da app non-browser), oppure manda
 * l'origine di questo server. Qualunque altra origine è una pagina di terzi.
 */
export function isAllowedWsOrigin(origin: string | undefined, port: number, host?: string): boolean {
    if (!origin) return true; // client non-browser: nessun Origin da falsificare
    try {
        const u = new URL(origin);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
        if (u.port !== String(port)) return false;
        // v1.15.35 (L10): la sola porta non bastava — `http://sito-esterno:8787` passava.
        // La nostra pagina apre il socket verso lo stesso indirizzo da cui è stata
        // servita, quindi Origin e Host della richiesta coincidono (IP o nome, porta
        // compresa). Host assente (client particolari): resta il solo controllo di porta.
        if (host && u.host.toLowerCase() !== host.toLowerCase()) return false;
        return true;
    } catch {
        return false;
    }
}

/** Interfaccia di rete come la restituisce os.networkInterfaces(), ridotta al necessario. */
export interface NetIfaceAddress {
    family: string | number;
    address: string;
    internal: boolean;
}

// Adattatori che non portano alla rete della regia: macchine virtuali, WSL,
// Docker, VPN. Restano in elenco (in fondo) perché in casi rari servono davvero.
const VIRTUAL_IFACE = /vethernet|wsl|hyper-v|virtualbox|vbox|vmware|docker|loopback|bluetooth|tap-|tailscale|zerotier|hamachi|vpn|npcap/i;
const PHYSICAL_IFACE = /wi-?fi|wlan|wireless|ethernet|^eth|^en\d|^wl/i;

function addressScore(ifaceName: string, address: string): number {
    let score = 0;
    if (address.startsWith('192.168.')) score += 30;
    else if (address.startsWith('10.')) score += 20;
    else if (/^172\.(1[6-9]|2\d|3[01])\./.test(address)) score += 10; // spesso Docker/WSL
    if (PHYSICAL_IFACE.test(ifaceName)) score += 5;
    if (VIRTUAL_IFACE.test(ifaceName)) score -= 100;
    return score;
}

/**
 * v1.15.37: indirizzi IPv4 raggiungibili dalla LAN, il più probabile per primo.
 * Prima l'ordine era quello del sistema: su un PC con WSL o Hyper-V il primo poteva
 * essere l'adattatore virtuale (172.x) e il link copiato non funzionava dal telefono.
 * Esclusi gli indirizzi 169.254.x.x: li assegna Windows a una scheda senza rete.
 */
export function rankLanAddresses(nets: Record<string, NetIfaceAddress[] | undefined>): string[] {
    const found: Array<{ address: string; score: number; order: number }> = [];
    let order = 0;
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] ?? []) {
            const isV4 = net.family === 'IPv4' || net.family === 4;
            if (!isV4 || net.internal) continue;
            if (net.address.startsWith('169.254.')) continue;
            if (found.some((f) => f.address === net.address)) continue;
            found.push({ address: net.address, score: addressScore(name, net.address), order: order++ });
        }
    }
    found.sort((a, b) => b.score - a.score || a.order - b.order);
    return found.map((f) => f.address);
}

/** Indirizzi IPv4 non-loopback delle interfacce di rete locali (per mostrare all'utente l'URL da digitare sul tablet). */
export function getLocalLanAddresses(): string[] {
    return rankLanAddresses(os.networkInterfaces() as Record<string, NetIfaceAddress[] | undefined>);
}

export interface RemoteControlStatus {
    running: boolean;
    port?: number;
    pin?: string;
    addresses?: string[];
    /** v1.15.37: dispositivi autenticati in questo momento. */
    clients?: number;
}

export function getRemoteControlStatus(): RemoteControlStatus {
    if (!server) return { running: false };
    return {
        running: true,
        port: activePort,
        pin: currentPin ?? undefined,
        addresses: getLocalLanAddresses(),
        clients: authenticatedClients.size
    };
}

/** Chiude tutti i client collegati dopo aver spiegato loro il motivo. */
function dismissClients(reason: 'pin-changed' | 'stopped'): void {
    const bye = JSON.stringify({ type: 'bye', reason });
    for (const client of authenticatedClients) {
        try {
            if (client.readyState === WebSocket.OPEN) client.send(bye);
            client.close();
        } catch { /* già chiuso */ }
    }
    authenticatedClients.clear();
    notifyClients();
}

/**
 * v1.15.37: sostituisce il PIN a server acceso. Chi era collegato col PIN vecchio
 * riceve `bye` (motivo `pin-changed`) e deve inserire quello nuovo. A server
 * spento non fa nulla: il nuovo PIN verrà passato al prossimo avvio.
 */
export function changeRemotePin(pin: string): RemoteControlStatus {
    if (!server) return getRemoteControlStatus();
    currentPin = pin;
    pinLimiter = createPinRateLimiter();
    dismissClients('pin-changed');
    logger.info('[RemoteControlServer] PIN sostituito');
    return getRemoteControlStatus();
}

function sendJson(ws: WebSocket, msg: unknown): void {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

/** Il comando punta a una clip che la regia ha pubblicato? (difesa in profondità:
 *  il renderer ricontrolla comunque sulla sua copia del progetto) */
function validateTarget(name: RemoteCommandName, clipId: string | undefined): string | null {
    if (name === 'stopAll' || name === 'stopAllFx' || name === 'mixOn' || name === 'mixOff') return null;
    // v1.15.37: PROSSIMO a scaletta finita → il telefono lo dice, invece di confermare un nulla
    if (name === 'mixNext') return state.mix.nextId ? null : 'end-of-list';
    if (!clipId) return 'clip-missing';
    if (name === 'fxTrigger') {
        const pad = state.fx.find((c) => c.id === clipId);
        if (!pad) return 'unknown-clip';
        if (pad.missing) return 'file-missing';
        return null;
    }
    // playClip / stopClip: colonna Music
    return state.music.some((c) => c.id === clipId) ? null : 'unknown-clip';
}

/**
 * @param h      callback verso il main (vedi RemoteControlHandlers)
 * @param pin    PIN da usare; se assente o malformato ne viene generato uno nuovo
 *               (il chiamante lo legge da getRemoteControlStatus e lo conserva)
 * @param port   solo per i test (porta libera); l'app usa sempre REMOTE_PORT
 */
export function startRemoteControlServer(h: RemoteControlHandlers, pin?: string, port: number = REMOTE_PORT): RemoteControlStatus {
    if (server) return getRemoteControlStatus(); // già avviato, idempotente

    activePort = port;
    currentPin = isValidPin(pin) ? pin : generatePin();
    pinLimiter = createPinRateLimiter(); // stato pulito ad ogni avvio, nessun residuo dalla sessione precedente
    handlers = h;

    const srv = http.createServer((req, res) => {
        let pathname = '/';
        try { pathname = new URL(req.url ?? '/', 'http://x').pathname; } catch { /* url anomalo: 404 sotto */ }

        if (req.method === 'GET' && pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
        }

        if (req.method === 'GET' && pathname === '/') {
            // no-store: dopo un aggiornamento dell'app il telefono deve ricevere la
            // pagina nuova, non quella in cache che parla un protocollo vecchio.
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(INDEX_HTML);
            return;
        }

        if (req.method === 'GET' && pathname === '/icon.png') {
            fs.readFile(ICON_PATH, (err, data) => {
                if (err) { res.writeHead(404); res.end(); return; }
                res.writeHead(200, { 'Content-Type': 'image/png' });
                res.end(data);
            });
            return;
        }

        if (req.method === 'POST' && pathname === '/api/verify-pin') {
            const clientKey = req.socket.remoteAddress || 'unknown';
            if (!pinLimiter.allow(clientKey)) {
                res.writeHead(429, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Troppi tentativi, riprova più tardi' }));
                return;
            }
            readJsonBody(req).then((body) => {
                const submittedPin = typeof body === 'object' && body !== null && 'pin' in body ? String((body as { pin: unknown }).pin) : '';
                const ok = pinMatches(submittedPin, currentPin);
                if (ok) pinLimiter.reset(clientKey); // PIN corretto: non penalizzare i tentativi successivi legittimi
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok }));
            }).catch(() => {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Richiesta non valida' }));
            });
            return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Not found' }));
    });

    srv.on('error', (err: Error) => {
        // v1.15.25 (M8): l'errore più comune è "porta 8787 già occupata" (una
        // seconda istanza, un altro programma). Prima si azzeravano solo `server` e
        // `currentPin`: il WebSocketServer restava attaccato a un server morto e
        // `stopRemoteControlServer` usciva subito sul controllo `if (!server)`,
        // lasciandolo orfano. In più il renderer non veniva avvisato di nulla e in
        // Impostazioni il controllo remoto risultava acceso senza esserlo.
        logger.error(`[RemoteControlServer] Errore: ${err.message}`);
        const failure = handlers?.onFailure;
        teardown();
        try { srv.close(); } catch { /* mai messosi in ascolto */ }
        failure?.(err.message);
    });

    const socketServer = new WebSocketServer({ server: srv, path: '/ws', maxPayload: MAX_WS_MESSAGE_BYTES });
    socketServer.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
        let authenticated = false;
        const clientKey = req.socket.remoteAddress || 'unknown';
        // Latenza minima: niente attesa di Nagle sui pacchetti piccoli (ws lo
        // imposta già da sé; esplicito perché è il cuore di questa funzione).
        try { req.socket.setNoDelay(true); } catch { /* socket già chiuso */ }

        // v1.15.23 (M6): rifiuta le connessioni che arrivano da una pagina web di
        // terzi. Vedi isAllowedWsOrigin — i WebSocket ignorano la same-origin policy.
        if (!isAllowedWsOrigin(req.headers.origin, activePort, req.headers.host)) {
            logger.warn(`[RemoteControlServer] Connessione WS rifiutata, origine non consentita: ${req.headers.origin}`);
            ws.close();
            return;
        }

        aliveClients.add(ws);
        ws.on('pong', () => aliveClients.add(ws));

        const authTimeout = setTimeout(() => {
            if (!authenticated) ws.close();
        }, AUTH_TIMEOUT_MS);

        ws.on('message', (raw: Buffer) => {
            aliveClients.add(ws);
            let msg: unknown;
            try { msg = JSON.parse(raw.toString('utf8')); } catch { return; }
            if (typeof msg !== 'object' || msg === null) return;
            const m = msg as Record<string, unknown>;

            if (!authenticated) {
                if (m.type !== 'auth') return; // ignora qualunque messaggio prima dell'autenticazione
                if (!pinLimiter.allow(clientKey)) {
                    sendJson(ws, { type: 'auth-result', ok: false, error: 'rate-limited' });
                    ws.close();
                    return;
                }
                const ok = pinMatches(String(m.pin), currentPin); // v1.15.23: confronto a tempo costante
                sendJson(ws, { type: 'auth-result', ok, ...(ok ? {} : { error: 'wrong-pin' }) });
                if (!ok) { ws.close(); return; }
                authenticated = true;
                pinLimiter.reset(clientKey); // PIN corretto: non penalizzare futuri tentativi legittimi da questo IP
                clearTimeout(authTimeout);
                authenticatedClients.add(ws);
                notifyClients();
                ws.send(statePayload); // stato corrente subito alla connessione
                logger.info(`[RemoteControlServer] Dispositivo collegato: ${clientKey}`);
                return;
            }

            if (m.type === 'ping') {
                // la pagina misura il giro completo e si accorge di un collegamento morto
                sendJson(ws, { type: 'pong', t: typeof m.t === 'number' ? m.t : 0 });
                return;
            }

            if (m.type === 'command') {
                const seq = typeof m.seq === 'number' ? m.seq : undefined;
                const name = typeof m.name === 'string' ? m.name : '';
                const clipId = typeof m.clipId === 'string' ? m.clipId : undefined;
                if (!ALLOWED_COMMANDS.has(name)) {
                    sendJson(ws, { type: 'ack', seq, name, ok: false, error: 'not-allowed' });
                    return;
                }
                const error = validateTarget(name as RemoteCommandName, clipId);
                if (error) {
                    sendJson(ws, { type: 'ack', seq, name, clipId, ok: false, error });
                    return;
                }
                // Prima si inoltra (è la cosa che deve succedere SUBITO), poi si risponde.
                handlers?.onCommand(name as RemoteCommandName, clipId);
                sendJson(ws, { type: 'ack', seq, name, clipId, ok: true });
            }
        });

        ws.on('close', () => {
            clearTimeout(authTimeout);
            if (authenticatedClients.delete(ws)) {
                notifyClients();
                logger.info(`[RemoteControlServer] Dispositivo scollegato: ${clientKey}`);
            }
        });
        ws.on('error', () => { /* gestito da close */ });
    });

    // Heartbeat: un telefono che va in standby o esce dal Wi-Fi spesso non chiude
    // il socket. Senza questo giro resterebbe fra i "collegati" per ore.
    heartbeat = setInterval(() => {
        for (const client of socketServer.clients) {
            if (!aliveClients.has(client)) { client.terminate(); continue; }
            aliveClients.delete(client);
            try { client.ping(); } catch { /* chiuso nel frattempo */ }
        }
    }, HEARTBEAT_MS);

    // Bind su tutte le interfacce: deve essere raggiungibile da altri dispositivi sulla LAN, non solo localhost.
    srv.listen(activePort, '0.0.0.0');
    server = srv;
    wss = socketServer;
    logger.info(`[RemoteControlServer] Avviato su porta ${activePort}`);
    return getRemoteControlStatus();
}

/** Azzera tutto lo stato del server (usata da stop e dalla caduta per errore). */
function teardown(): void {
    if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
    try { wss?.clients.forEach((c) => c.terminate()); } catch { /* già chiuso */ }
    try { wss?.close(); } catch { /* già chiuso */ }
    wss = null;
    const hadClients = authenticatedClients.size > 0;
    authenticatedClients.clear();
    if (hadClients) notifyClients();
    handlers = null;
    server = null;
    currentPin = null;
}

export function stopRemoteControlServer(): void {
    if (!server) return;
    const srv = server;
    dismissClients('stopped'); // la pagina sa che la regia ha spento, non che la rete è caduta
    teardown();
    srv.close();
    logger.info('[RemoteControlServer] Fermato');
}
