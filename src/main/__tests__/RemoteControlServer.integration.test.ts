// v1.15.37 — il server del Controllo Remoto con socket VERI (nessun mock): il
// telefono è simulato da un client `ws`, la regia dai callback. Copre il percorso
// completo di un tocco su un pad FX: PIN → stato → comando → conferma.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as net from 'net';
import * as http from 'http';
import { WebSocket } from 'ws';
import {
    startRemoteControlServer, stopRemoteControlServer, updateRemoteState,
    changeRemotePin, getRemoteControlStatus, RemoteCommandName
} from '../RemoteControlServer';

const PIN = '482913';
let port = 0;
const commands: Array<{ name: RemoteCommandName; clipId?: string }> = [];
const clientCounts: number[] = [];

const STATE = {
    music: [{ id: 'm1', name: 'Brano 1', isPlaying: false }],
    fx: [
        { id: 'fx1', name: 'Applausi', isPlaying: false, color: '#EF4444' },
        { id: 'fx2', name: 'Gong', isPlaying: false, missing: true }
    ]
};

function freePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const s = net.createServer();
        s.unref();
        s.on('error', reject);
        s.listen(0, '127.0.0.1', () => {
            const p = (s.address() as net.AddressInfo).port;
            s.close(() => resolve(p));
        });
    });
}

/** Client che accoda i messaggi ricevuti e permette di aspettarne uno di un tipo. */
class Phone {
    ws: WebSocket;
    inbox: Array<Record<string, unknown>> = [];
    private waiters: Array<{ type: string; resolve: (m: Record<string, unknown>) => void }> = [];
    closed: Promise<void>;

    constructor() {
        this.ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
        this.ws.on('message', (raw: Buffer) => {
            const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
            const i = this.waiters.findIndex((w) => w.type === msg.type);
            if (i >= 0) this.waiters.splice(i, 1)[0].resolve(msg);
            else this.inbox.push(msg);
        });
        this.closed = new Promise((resolve) => this.ws.on('close', () => resolve()));
    }

    opened(): Promise<void> {
        return new Promise((resolve, reject) => { this.ws.on('open', () => resolve()); this.ws.on('error', reject); });
    }

    next(type: string, timeoutMs = 2000): Promise<Record<string, unknown>> {
        const i = this.inbox.findIndex((m) => m.type === type);
        if (i >= 0) return Promise.resolve(this.inbox.splice(i, 1)[0]);
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`nessun messaggio "${type}"`)), timeoutMs);
            this.waiters.push({ type, resolve: (m) => { clearTimeout(timer); resolve(m); } });
        });
    }

    send(msg: unknown): void { this.ws.send(JSON.stringify(msg)); }

    async auth(pin: string): Promise<Record<string, unknown>> {
        await this.opened();
        this.send({ type: 'auth', pin });
        return this.next('auth-result');
    }
}

function get(path: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}${path}`, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
        }).on('error', reject);
    });
}

beforeAll(async () => {
    port = await freePort();
    updateRemoteState(STATE);
    const status = startRemoteControlServer({
        onCommand: (name, clipId) => commands.push({ name, clipId }),
        onClientsChanged: (n) => clientCounts.push(n)
    }, PIN, port);
    expect(status.running).toBe(true);
    expect(status.pin).toBe(PIN);
    await new Promise((r) => setTimeout(r, 50)); // listen asincrono
});

afterAll(() => {
    stopRemoteControlServer();
});

describe('Controllo Remoto — server reale', () => {
    it('serve la pagina senza cache e risponde a /health', async () => {
        const page = await get('/');
        expect(page.status).toBe(200);
        expect(page.headers['cache-control']).toBe('no-store');
        expect(page.body).toContain('id="padGrid"');
        const pageWithQuery = await get('/?x=1');
        expect(pageWithQuery.status).toBe(200);
        expect((await get('/health')).body).toBe('{"ok":true}');
        expect((await get('/non-esiste')).status).toBe(404);
    });

    it('PIN errato: rifiutato e socket chiuso', async () => {
        const phone = new Phone();
        const res = await phone.auth('111111');
        expect(res).toMatchObject({ ok: false, error: 'wrong-pin' });
        await phone.closed;
    });

    it('PIN giusto: stato con pad FX e colonna Music, poi comandi confermati', async () => {
        const phone = new Phone();
        expect((await phone.auth(PIN)).ok).toBe(true);
        const state = await phone.next('state');
        expect(state.fx).toEqual([
            { id: 'fx1', name: 'Applausi', isPlaying: false, color: '#ef4444' },
            { id: 'fx2', name: 'Gong', isPlaying: false, missing: true }
        ]);
        expect(state.music).toEqual(STATE.music);
        expect(getRemoteControlStatus().clients).toBe(1);
        expect(clientCounts.at(-1)).toBe(1);

        commands.length = 0;
        phone.send({ type: 'command', name: 'fxTrigger', clipId: 'fx1', seq: 1 });
        expect(await phone.next('ack')).toEqual({ type: 'ack', seq: 1, name: 'fxTrigger', clipId: 'fx1', ok: true });
        expect(commands).toEqual([{ name: 'fxTrigger', clipId: 'fx1' }]);

        phone.send({ type: 'command', name: 'fxTrigger', clipId: 'fx2', seq: 2 });
        expect(await phone.next('ack')).toMatchObject({ seq: 2, ok: false, error: 'file-missing' });
        phone.send({ type: 'command', name: 'fxTrigger', clipId: 'non-esiste', seq: 3 });
        expect(await phone.next('ack')).toMatchObject({ seq: 3, ok: false, error: 'unknown-clip' });
        phone.send({ type: 'command', name: 'cancellaTutto', seq: 4 });
        expect(await phone.next('ack')).toMatchObject({ seq: 4, ok: false, error: 'not-allowed' });
        phone.send({ type: 'command', name: 'stopAllFx', seq: 5 });
        expect(await phone.next('ack')).toMatchObject({ seq: 5, ok: true });
        phone.send({ type: 'command', name: 'playClip', clipId: 'm1', seq: 6 });
        expect(await phone.next('ack')).toMatchObject({ seq: 6, ok: true });
        // solo i comandi validi sono arrivati alla regia
        expect(commands).toEqual([
            { name: 'fxTrigger', clipId: 'fx1' },
            { name: 'stopAllFx', clipId: undefined },
            { name: 'playClip', clipId: 'm1' }
        ]);

        // v1.15.37 — modalità MIX: PROSSIMO solo se c'è un brano dopo
        commands.length = 0;
        phone.send({ type: 'command', name: 'mixNext', seq: 7 });
        expect(await phone.next('ack')).toMatchObject({ seq: 7, ok: false, error: 'end-of-list' });
        updateRemoteState({ ...STATE, mix: { on: true, nextId: 'm1', nextName: 'Brano 1', nextMode: 'start' } });
        expect((await phone.next('state')).mix).toEqual({ on: true, nextId: 'm1', nextName: 'Brano 1', nextMode: 'start' });
        phone.send({ type: 'command', name: 'mixNext', seq: 8 });
        expect(await phone.next('ack')).toMatchObject({ seq: 8, ok: true });
        phone.send({ type: 'command', name: 'mixOff', seq: 9 });
        expect(await phone.next('ack')).toMatchObject({ seq: 9, ok: true });
        expect(commands.map((c) => c.name)).toEqual(['mixNext', 'mixOff']);
        updateRemoteState(STATE);
        await phone.next('state');

        phone.send({ type: 'ping', t: 123.5 });
        expect(await phone.next('pong')).toEqual({ type: 'pong', t: 123.5 });

        // stato invariato → nessuna trasmissione; stato cambiato → trasmesso
        updateRemoteState(STATE);
        updateRemoteState({ ...STATE, fx: [{ ...STATE.fx[0], isPlaying: true }, STATE.fx[1]] });
        const live = await phone.next('state');
        expect((live.fx as Array<{ isPlaying: boolean }>)[0].isPlaying).toBe(true);
        await new Promise((r) => setTimeout(r, 50));
        expect(phone.inbox.filter((m) => m.type === 'state')).toEqual([]);
        updateRemoteState(STATE);
        await phone.next('state');

        phone.ws.close();
        await phone.closed;
    });

    it('latenza: 200 tocchi in fila, conferma media e massima in locale', async () => {
        const phone = new Phone();
        expect((await phone.auth(PIN)).ok).toBe(true);
        await phone.next('state');
        const times: number[] = [];
        for (let seq = 1; seq <= 200; seq++) {
            const t0 = performance.now();
            phone.send({ type: 'command', name: 'fxTrigger', clipId: 'fx1', seq });
            await phone.next('ack');
            times.push(performance.now() - t0);
        }
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const max = Math.max(...times);
        console.log(`[latenza] andata e ritorno su localhost: media ${avg.toFixed(2)} ms, massima ${max.toFixed(2)} ms`);
        expect(avg).toBeLessThan(10);
        phone.ws.close();
        await phone.closed;
    });

    it('Nuovo PIN: chi è collegato riceve bye e viene chiuso; il PIN nuovo funziona', async () => {
        const phone = new Phone();
        expect((await phone.auth(PIN)).ok).toBe(true);
        await phone.next('state');
        changeRemotePin('765432');
        expect(await phone.next('bye')).toEqual({ type: 'bye', reason: 'pin-changed' });
        await phone.closed;
        expect(getRemoteControlStatus().clients).toBe(0);

        const old = new Phone();
        expect((await old.auth(PIN)).ok).toBe(false);
        const fresh = new Phone();
        expect((await fresh.auth('765432')).ok).toBe(true);
        await fresh.next('state');

        stopRemoteControlServer();
        expect(await fresh.next('bye')).toEqual({ type: 'bye', reason: 'stopped' });
        await fresh.closed;
        expect(getRemoteControlStatus()).toEqual({ running: false });
    });

    it('dopo un riavvio lo stato pubblicato resta disponibile (prima il tablet restava vuoto)', async () => {
        startRemoteControlServer({ onCommand: () => {} }, PIN, port);
        await new Promise((r) => setTimeout(r, 50));
        const phone = new Phone();
        expect((await phone.auth(PIN)).ok).toBe(true);
        const state = await phone.next('state');
        expect((state.fx as unknown[]).length).toBe(2);
        phone.ws.close();
        await phone.closed;
    });
});
