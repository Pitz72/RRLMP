// Controllo Remoto da tablet/PC secondario (2026-07-01) — server locale in
// LAN, avviabile/disattivabile a mano dalle Impostazioni (default OFF: nessuna
// superficie di rete attiva senza un'azione esplicita dell'utente).
// Endpoint: /health + pagina web con verifica PIN (/api/verify-pin, con
// rate-limit — vedi pinRateLimiter.ts). Canale comandi reale via WebSocket,
// whitelist esplicita in ALLOWED_COMMANDS (non un canale IPC generico apribile
// a qualunque azione futura senza revisione). Verso opposto: il renderer
// pubblica lo stato della colonna Music (updateRemoteMusicState, validato da
// remoteClipState.ts) e il server lo trasmette in broadcast ai client WS
// autenticati; comandi playClip/stopClip con clipId.
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
import * as http from 'http';
import * as os from 'os';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { join } from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './logger';
import { createPinRateLimiter } from './pinRateLimiter';
import { INDEX_HTML } from './remoteControlAssets';
import { RemoteClipState, sanitizeRemoteClipState } from './remoteClipState';

const PORT = 8787;
const MAX_BODY_BYTES = 1024; // il body più grande atteso è {"pin":"123456"} — margine ampio
const AUTH_TIMEOUT_MS = 10_000; // una connessione WS deve autenticarsi entro 10s o viene chiusa

// Stesso path usato in main/index.ts per l'icona della finestra: funziona sia in
// dev (progetto non pacchettizzato) sia in produzione (build/icon.png è incluso
// esplicitamente in package.json build.files, leggibile anche dentro app.asar).
const ICON_PATH = join(__dirname, '../../build/icon.png');

/** Comandi remoti abilitati in questo step. Whitelist esplicita — un comando
 *  non presente qui viene ignorato anche se il client lo invia autenticato. */
export type RemoteCommandName = 'stopAll' | 'playClip' | 'stopClip';
const ALLOWED_COMMANDS: ReadonlySet<string> = new Set<RemoteCommandName>(['stopAll', 'playClip', 'stopClip']);

let server: http.Server | null = null;
let wss: WebSocketServer | null = null;
let currentPin: string | null = null;
let pinLimiter = createPinRateLimiter();
let onRemoteCommand: ((name: RemoteCommandName, clipId?: string) => void) | null = null;
let musicState: RemoteClipState[] = [];
const authenticatedClients = new Set<WebSocket>();

function broadcastMusicState(): void {
    const payload = JSON.stringify({ type: 'state', clips: musicState });
    for (const client of authenticatedClients) {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
    }
}

/** Chiamata dal main quando il renderer pubblica lo stato aggiornato della
 *  colonna Music (vedi ipcMain 'remote-control:publish-state'). */
export function updateRemoteMusicState(clips: unknown): void {
    musicState = sanitizeRemoteClipState(clips);
    broadcastMusicState();
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

/** PIN numerico a 6 cifre, rigenerato a ogni avvio del server.
 *  v1.15.23: generato con il PRNG crittografico. `Math.random()` non è pensato per
 *  produrre segreti — il suo stato interno è ricostruibile osservandone l'output —
 *  e questo PIN è l'unica credenziale del canale che comanda l'audio in onda. */
export function generatePin(): string {
    return String(crypto.randomInt(100000, 1000000));
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
export function isAllowedWsOrigin(origin: string | undefined, port: number): boolean {
    if (!origin) return true; // client non-browser: nessun Origin da falsificare
    try {
        const u = new URL(origin);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
        return u.port === String(port);
    } catch {
        return false;
    }
}

/** Indirizzi IPv4 non-loopback delle interfacce di rete locali (per mostrare all'utente l'URL da digitare sul tablet). */
export function getLocalLanAddresses(): string[] {
    const nets = os.networkInterfaces();
    const addresses: string[] = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] ?? []) {
            if (net.family === 'IPv4' && !net.internal) addresses.push(net.address);
        }
    }
    return addresses;
}

export interface RemoteControlStatus {
    running: boolean;
    port?: number;
    pin?: string;
    addresses?: string[];
}

export function getRemoteControlStatus(): RemoteControlStatus {
    if (!server) return { running: false };
    return { running: true, port: PORT, pin: currentPin ?? undefined, addresses: getLocalLanAddresses() };
}

/**
 * @param handleCommand invocata quando un client autenticato invia un comando
 *   nella whitelist ALLOWED_COMMANDS (con clipId per playClip/stopClip) — il
 *   chiamante (main/index.ts) inoltra al renderer via webContents.send, stesso
 *   pattern del canale 'open-file'.
 */
export function startRemoteControlServer(handleCommand: (name: RemoteCommandName, clipId?: string) => void): RemoteControlStatus {
    if (server) return getRemoteControlStatus(); // già avviato, idempotente

    currentPin = generatePin();
    pinLimiter = createPinRateLimiter(); // stato pulito ad ogni avvio, nessun residuo dalla sessione precedente
    onRemoteCommand = handleCommand;

    const srv = http.createServer((req, res) => {
        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
        }

        if (req.method === 'GET' && req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(INDEX_HTML);
            return;
        }

        if (req.method === 'GET' && req.url === '/icon.png') {
            fs.readFile(ICON_PATH, (err, data) => {
                if (err) { res.writeHead(404); res.end(); return; }
                res.writeHead(200, { 'Content-Type': 'image/png' });
                res.end(data);
            });
            return;
        }

        if (req.method === 'POST' && req.url === '/api/verify-pin') {
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
        logger.error(`[RemoteControlServer] Errore: ${err.message}`);
        server = null;
        currentPin = null;
    });

    const socketServer = new WebSocketServer({ server: srv, path: '/ws' });
    socketServer.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
        let authenticated = false;
        const clientKey = req.socket.remoteAddress || 'unknown';

        // v1.15.23 (M6): rifiuta le connessioni che arrivano da una pagina web di
        // terzi. Vedi isAllowedWsOrigin — i WebSocket ignorano la same-origin policy.
        if (!isAllowedWsOrigin(req.headers.origin, PORT)) {
            logger.warn(`[RemoteControlServer] Connessione WS rifiutata, origine non consentita: ${req.headers.origin}`);
            ws.close();
            return;
        }

        const authTimeout = setTimeout(() => {
            if (!authenticated) ws.close();
        }, AUTH_TIMEOUT_MS);

        ws.on('message', (raw: Buffer) => {
            let msg: unknown;
            try { msg = JSON.parse(raw.toString('utf8')); } catch { return; }
            if (typeof msg !== 'object' || msg === null) return;
            const m = msg as Record<string, unknown>;

            if (!authenticated) {
                if (m.type !== 'auth') return; // ignora qualunque messaggio prima dell'autenticazione
                if (!pinLimiter.allow(clientKey)) {
                    ws.send(JSON.stringify({ type: 'auth-result', ok: false, error: 'rate-limited' }));
                    ws.close();
                    return;
                }
                const ok = pinMatches(String(m.pin), currentPin); // v1.15.23: confronto a tempo costante
                ws.send(JSON.stringify({ type: 'auth-result', ok }));
                if (!ok) { ws.close(); return; }
                authenticated = true;
                pinLimiter.reset(clientKey); // PIN corretto: non penalizzare futuri tentativi legittimi da questo IP
                clearTimeout(authTimeout);
                authenticatedClients.add(ws);
                ws.send(JSON.stringify({ type: 'state', clips: musicState })); // stato corrente subito alla connessione
                return;
            }

            if (m.type === 'command' && typeof m.name === 'string' && ALLOWED_COMMANDS.has(m.name)) {
                const clipId = typeof m.clipId === 'string' ? m.clipId : undefined;
                onRemoteCommand?.(m.name as RemoteCommandName, clipId);
                ws.send(JSON.stringify({ type: 'command-ack', name: m.name, clipId }));
            }
        });

        ws.on('close', () => {
            clearTimeout(authTimeout);
            authenticatedClients.delete(ws);
        });
    });

    // Bind su tutte le interfacce: deve essere raggiungibile da altri dispositivi sulla LAN, non solo localhost.
    srv.listen(PORT, '0.0.0.0');
    server = srv;
    wss = socketServer;
    logger.info(`[RemoteControlServer] Avviato su porta ${PORT}`);
    return getRemoteControlStatus();
}

export function stopRemoteControlServer(): void {
    if (!server) return;
    wss?.clients.forEach((c) => c.terminate());
    wss?.close();
    wss = null;
    onRemoteCommand = null;
    authenticatedClients.clear();
    musicState = [];
    server.close();
    server = null;
    currentPin = null;
    logger.info('[RemoteControlServer] Fermato');
}
