// Controllo Remoto da tablet/PC secondario (2026-07-01) — Step 1-3/N.
// Server HTTP locale in LAN, avviabile/disattivabile a mano dalle Impostazioni
// (default OFF: nessuna superficie di rete attiva senza un'azione esplicita
// dell'utente). Step 1: /health + PIN. Step 2: pagina web installabile come
// PWA (manifest.json + sw.js) con verifica PIN (/api/verify-pin, con
// rate-limit — vedi pinRateLimiter.ts). Step 3 (qui): canale comandi reale via
// WebSocket, con un solo comando abilitato per ora (STOP ALL) — whitelist
// esplicita in ALLOWED_COMMANDS, non un canale IPC generico apribile a
// qualunque azione futura senza revisione.
import * as http from 'http';
import * as os from 'os';
import * as fs from 'fs';
import { join } from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './logger';
import { createPinRateLimiter } from './pinRateLimiter';
import { INDEX_HTML, MANIFEST_JSON, SERVICE_WORKER_JS } from './remoteControlAssets';

const PORT = 8787;
const MAX_BODY_BYTES = 1024; // il body più grande atteso è {"pin":"123456"} — margine ampio
const AUTH_TIMEOUT_MS = 10_000; // una connessione WS deve autenticarsi entro 10s o viene chiusa

// Stesso path usato in main/index.ts per l'icona della finestra: funziona sia in
// dev (progetto non pacchettizzato) sia in produzione (build/icon.png è incluso
// esplicitamente in package.json build.files, leggibile anche dentro app.asar).
const ICON_PATH = join(__dirname, '../../build/icon.png');

/** Comandi remoti abilitati in questo step. Whitelist esplicita — un comando
 *  non presente qui viene ignorato anche se il client lo invia autenticato. */
export type RemoteCommandName = 'stopAll';
const ALLOWED_COMMANDS: ReadonlySet<string> = new Set<RemoteCommandName>(['stopAll']);

let server: http.Server | null = null;
let wss: WebSocketServer | null = null;
let currentPin: string | null = null;
let pinLimiter = createPinRateLimiter();
let onRemoteCommand: ((name: RemoteCommandName) => void) | null = null;

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

/** PIN numerico a 6 cifre, rigenerato a ogni avvio del server. */
export function generatePin(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
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
 *   nella whitelist ALLOWED_COMMANDS — il chiamante (main/index.ts) inoltra al
 *   renderer via webContents.send, stesso pattern del canale 'open-file'.
 */
export function startRemoteControlServer(handleCommand: (name: RemoteCommandName) => void): RemoteControlStatus {
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

        if (req.method === 'GET' && req.url === '/manifest.json') {
            res.writeHead(200, { 'Content-Type': 'application/manifest+json' });
            res.end(MANIFEST_JSON);
            return;
        }

        if (req.method === 'GET' && req.url === '/sw.js') {
            res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
            res.end(SERVICE_WORKER_JS);
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
                const ok = currentPin !== null && submittedPin === currentPin;
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
                const ok = currentPin !== null && String(m.pin) === currentPin;
                ws.send(JSON.stringify({ type: 'auth-result', ok }));
                if (!ok) { ws.close(); return; }
                authenticated = true;
                pinLimiter.reset(clientKey); // PIN corretto: non penalizzare futuri tentativi legittimi da questo IP
                clearTimeout(authTimeout);
                return;
            }

            if (m.type === 'command' && typeof m.name === 'string' && ALLOWED_COMMANDS.has(m.name)) {
                onRemoteCommand?.(m.name as RemoteCommandName);
                ws.send(JSON.stringify({ type: 'command-ack', name: m.name }));
            }
        });

        ws.on('close', () => clearTimeout(authTimeout));
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
    server.close();
    server = null;
    currentPin = null;
    logger.info('[RemoteControlServer] Fermato');
}
