// Controllo Remoto da tablet/PC secondario (2026-07-01) — Step 1/N.
// Server HTTP locale in LAN, avviabile/disattivabile a mano dalle Impostazioni
// (default OFF: nessuna superficie di rete attiva senza un'azione esplicita
// dell'utente). In questo step il server espone solo un endpoint di verifica
// (/health) protetto da un PIN generato a ogni avvio — la superficie comandi
// vera e propria (WebSocket + pagina web) arriva negli step successivi.
import * as http from 'http';
import * as os from 'os';
import { logger } from './logger';

const PORT = 8787;

let server: http.Server | null = null;
let currentPin: string | null = null;

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

export function startRemoteControlServer(): RemoteControlStatus {
    if (server) return getRemoteControlStatus(); // già avviato, idempotente

    currentPin = generatePin();
    const srv = http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
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

    // Bind su tutte le interfacce: deve essere raggiungibile da altri dispositivi sulla LAN, non solo localhost.
    srv.listen(PORT, '0.0.0.0');
    server = srv;
    logger.info(`[RemoteControlServer] Avviato su porta ${PORT}`);
    return getRemoteControlStatus();
}

export function stopRemoteControlServer(): void {
    if (!server) return;
    server.close();
    server = null;
    currentPin = null;
    logger.info('[RemoteControlServer] Fermato');
}
