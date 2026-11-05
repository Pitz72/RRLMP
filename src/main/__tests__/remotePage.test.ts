// v1.15.37 — la pagina del telefono eseguita davvero (jsdom, script compresi),
// con un WebSocket finto al posto della regia. Verifica ciò che l'operatore vede
// e tocca: PIN dal QR code, pad FX, conferme, errori, ricollegamento, contrasti.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { INDEX_HTML } from '../remoteControlAssets';
import { COLUMN_COLORS } from '../../renderer/src/components/modals/ClipSettingsModal';

interface FakeSocket {
    url: string;
    sent: Array<Record<string, unknown>>;
    readyState: number;
    onopen: (() => void) | null;
    onmessage: ((e: { data: string }) => void) | null;
    onclose: (() => void) | null;
    onerror: (() => void) | null;
    send(data: string): void;
    close(): void;
    /** lato regia: apre, risponde, chiude */
    serverOpen(): void;
    serverSend(msg: unknown): void;
    serverClose(): void;
}

function makeFakeWebSocketClass(sockets: FakeSocket[]) {
    return class FakeWebSocket implements FakeSocket {
        url: string;
        sent: Array<Record<string, unknown>> = [];
        readyState = 0;
        onopen: (() => void) | null = null;
        onmessage: ((e: { data: string }) => void) | null = null;
        onclose: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(url: string) { this.url = url; sockets.push(this); }
        send(data: string) { this.sent.push(JSON.parse(data)); }
        close() { this.readyState = 3; }
        serverOpen() { this.readyState = 1; this.onopen?.(); }
        serverSend(msg: unknown) { this.onmessage?.({ data: JSON.stringify(msg) }); }
        serverClose() { this.readyState = 3; this.onclose?.(); }
    };
}

const FX = [
    { id: 'fx1', name: 'Applausi', isPlaying: false, color: '#ef4444' },
    { id: 'fx2', name: 'Risata', isPlaying: true },
    { id: 'fx3', name: 'Gong', isPlaying: false, missing: true }
];

function openPage(opts: { url?: string; pointerEvents?: boolean; lang?: string; storedPin?: string } = {}) {
    const sockets: FakeSocket[] = [];
    const dom = new JSDOM(INDEX_HTML, {
        url: opts.url ?? 'http://192.168.1.5:8787/#pin=482913',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        beforeParse(window) {
            const w = window as unknown as Record<string, unknown>;
            w.WebSocket = makeFakeWebSocketClass(sockets);
            // l'orologio della finestra jsdom è un altro Date: lo si lega a quello del
            // test, così vi.useFakeTimers() vale anche per Date.now() nella pagina
            (window.Date as unknown as { now: () => number }).now = () => Date.now();
            Object.defineProperty(window.navigator, 'language', { value: opts.lang ?? 'it-IT', configurable: true });
            if (opts.storedPin) window.localStorage.setItem('rrlmp-remote-pin', opts.storedPin);
            if (opts.pointerEvents !== false) {
                // la maggior parte dei telefoni ha i Pointer Events; jsdom no
                w.PointerEvent = class extends window.MouseEvent {
                    pointerType: string;
                    constructor(type: string, init: MouseEventInit & { pointerType?: string } = {}) {
                        super(type, init);
                        this.pointerType = init.pointerType ?? 'touch';
                    }
                };
            }
        }
    });
    const doc = dom.window.document;
    const $ = (sel: string) => doc.querySelector(sel) as HTMLElement;
    const pads = () => Array.from(doc.querySelectorAll('#padGrid .pad')) as HTMLElement[];
    const pad = (name: string) => pads().find((p) => p.querySelector('.name')?.textContent === name)!;
    const press = (el: HTMLElement) => {
        const W = dom.window as unknown as { PointerEvent?: typeof MouseEvent };
        const ev = W.PointerEvent
            ? new W.PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 } as MouseEventInit)
            : new dom.window.MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
        el.dispatchEvent(ev);
    };
    const click = (el: HTMLElement) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    const commands = (s: FakeSocket) => s.sent.filter((m) => m.type === 'command');
    /** collega e autentica il socket corrente, poi manda lo stato */
    const connect = (fx = FX, music: unknown[] = [], mix?: unknown) => {
        const s = sockets[sockets.length - 1];
        s.serverOpen();
        s.serverSend({ type: 'auth-result', ok: true });
        s.serverSend({ type: 'state', fx, music, ...(mix ? { mix } : {}) });
        return s;
    };
    return { dom, doc, $, sockets, pads, pad, press, click, commands, connect };
}

let current: ReturnType<typeof openPage> | null = null;
afterEach(() => {
    current?.dom.window.close();
    current = null;
    vi.useRealTimers();
});

describe('pagina del telefono — collegamento', () => {
    it('legge il PIN dal QR code, lo memorizza e lo toglie dalla barra degli indirizzi', () => {
        current = openPage();
        const { dom, sockets } = current;
        expect(dom.window.localStorage.getItem('rrlmp-remote-pin')).toBe('482913');
        expect(dom.window.location.hash).toBe('');
        expect(sockets).toHaveLength(1);
        expect(sockets[0].url).toBe('ws://192.168.1.5:8787/ws');
        sockets[0].serverOpen();
        expect(sockets[0].sent[0]).toEqual({ type: 'auth', pin: '482913' });
    });

    it('senza PIN mostra la schermata PIN; 6 cifre digitate → si collega da sola', () => {
        current = openPage({ url: 'http://192.168.1.5:8787/' });
        const { $, sockets, dom } = current;
        expect($('#pinScreen').hidden).toBe(false);
        expect($('#ctrlScreen').hidden).toBe(true);
        expect(sockets).toHaveLength(0);
        const input = $('#pin') as HTMLInputElement;
        input.value = '482913';
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
        expect(sockets).toHaveLength(1);
        sockets[0].serverOpen();
        expect(sockets[0].sent[0]).toEqual({ type: 'auth', pin: '482913' });
    });

    it('QR inquadrato con la pagina già aperta (cambia solo il #): legge il PIN nuovo e si ricollega', () => {
        current = openPage();
        const { connect, sockets, dom } = current;
        connect();
        dom.window.location.hash = '#pin=765432';
        dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
        expect(dom.window.localStorage.getItem('rrlmp-remote-pin')).toBe('765432');
        expect(dom.window.location.hash).toBe('');
        const s2 = sockets[sockets.length - 1];
        expect(sockets.length).toBe(2);
        s2.serverOpen();
        expect(s2.sent[0]).toEqual({ type: 'auth', pin: '765432' });
    });

    it('PIN errato: torna alla schermata PIN e lo dimentica', () => {
        current = openPage();
        const { $, sockets, dom } = current;
        sockets[0].serverOpen();
        sockets[0].serverSend({ type: 'auth-result', ok: false, error: 'wrong-pin' });
        expect($('#pinScreen').hidden).toBe(false);
        expect($('#pinMsg').textContent).toBe('PIN errato.');
        expect(dom.window.localStorage.getItem('rrlmp-remote-pin')).toBeNull();
    });

    it('PIN cambiato in regia (bye): schermata PIN con spiegazione', () => {
        current = openPage();
        const { $, connect, dom } = current;
        const s = connect();
        s.serverSend({ type: 'bye', reason: 'pin-changed' });
        expect($('#pinScreen').hidden).toBe(false);
        expect($('#pinMsg').textContent).toContain('cambiato in regia');
        expect(dom.window.localStorage.getItem('rrlmp-remote-pin')).toBeNull();
    });

    it('collegamento perso: pad in grigio, avviso, e nuovo tentativo da solo', () => {
        vi.useFakeTimers();
        current = openPage();
        const { $, connect, sockets } = current;
        const s = connect();
        expect($('#connText').textContent).toBe('Collegato');
        s.serverClose();
        expect($('#ctrlScreen').classList.contains('offline')).toBe(true);
        expect($('#connText').textContent).toBe('Ricollegamento…');
        vi.advanceTimersByTime(350);
        expect(sockets).toHaveLength(2);
        connect();
        expect($('#ctrlScreen').classList.contains('offline')).toBe(false);
    });

    it('la regia tace (Wi-Fi caduto senza chiusura): se ne accorge entro pochi secondi', () => {
        vi.useFakeTimers();
        current = openPage();
        const { $, connect, sockets } = current;
        const s = connect();
        expect(s.sent.some((m) => m.type === 'ping')).toBe(true);
        vi.advanceTimersByTime(10_000); // nessun pong
        expect($('#ctrlScreen').classList.contains('offline')).toBe(true);
        expect(sockets.length).toBeGreaterThan(1); // sta già riprovando
    });
});

describe('pagina del telefono — pad FX', () => {
    it('mostra i pad con nome, stato in onda, colore e file mancante', () => {
        current = openPage();
        const { connect, pads, pad } = current;
        connect();
        expect(pads().map((p) => p.querySelector('.name')!.textContent)).toEqual(['Applausi', 'Risata', 'Gong']);
        expect(pad('Risata').classList.contains('live')).toBe(true);
        expect(pad('Risata').getAttribute('aria-pressed')).toBe('true');
        expect(pad('Risata').querySelector('.state')!.textContent).toBe('▶ IN ONDA');
        expect(pad('Applausi').style.getPropertyValue('--pad-color')).toBe('#ef4444');
        expect(pad('Gong').classList.contains('missing')).toBe(true);
        expect(pad('Gong').querySelector('.state')!.textContent).toBe('FILE MANCANTE');
    });

    it('il pad parte alla PRESSIONE del dito, con numero di sequenza; la conferma toglie l\'attesa', () => {
        current = openPage();
        const { connect, pad, press, commands } = current;
        const s = connect();
        press(pad('Applausi'));
        expect(commands(s)).toEqual([{ type: 'command', name: 'fxTrigger', seq: 1, clipId: 'fx1' }]);
        expect(pad('Applausi').classList.contains('pending')).toBe(true);
        s.serverSend({ type: 'ack', seq: 1, ok: true });
        expect(pad('Applausi').classList.contains('pending')).toBe(false);
    });

    it('pressione + click dello stesso tocco = UN solo comando', () => {
        current = openPage();
        const { connect, pad, press, click, commands } = current;
        const s = connect();
        press(pad('Applausi'));
        click(pad('Applausi'));
        expect(commands(s)).toHaveLength(1);
    });

    it('lettore di schermo / tastiera (solo click, nessuna pressione) → il comando parte', () => {
        current = openPage();
        const { connect, pad, click, commands } = current;
        const s = connect();
        click(pad('Applausi'));
        expect(commands(s)).toHaveLength(1);
    });

    it('telefoni senza Pointer Events: funziona con il tocco classico', () => {
        current = openPage({ pointerEvents: false });
        const { connect, pad, press, commands } = current;
        const s = connect();
        press(pad('Applausi'));
        expect(commands(s)).toEqual([{ type: 'command', name: 'fxTrigger', seq: 1, clipId: 'fx1' }]);
    });

    it('conferma che non arriva: il pad diventa rosso con «NON ARRIVATO»', () => {
        vi.useFakeTimers();
        current = openPage();
        const { connect, pad, press } = current;
        connect();
        press(pad('Applausi'));
        vi.advanceTimersByTime(1600);
        expect(pad('Applausi').classList.contains('failed')).toBe(true);
        expect(pad('Applausi').querySelector('.state')!.textContent).toBe('NON ARRIVATO');
        vi.advanceTimersByTime(1700);
        expect(pad('Applausi').classList.contains('failed')).toBe(false);
    });

    it('pad con file mancante: nessun comando', () => {
        current = openPage();
        const { connect, pad, press, commands } = current;
        const s = connect();
        press(pad('Gong'));
        expect(commands(s)).toEqual([]);
    });

    it('tocco senza collegamento: NON messo in coda (niente applausi in ritardo)', () => {
        current = openPage();
        const { connect, pad, press, sockets, $ } = current;
        const s = connect();
        s.serverClose();
        press(pad('Applausi'));
        expect(sockets.flatMap((x) => x.sent).filter((m) => m.type === 'command')).toEqual([]);
        expect($('#connText').textContent).toBe('Non collegato: il comando non è partito.');
    });

    it('lo stato dalla regia aggiorna i pad senza ricrearli', () => {
        current = openPage();
        const { connect, pad } = current;
        const s = connect();
        const before = pad('Applausi');
        s.serverSend({ type: 'state', fx: [{ ...FX[0], isPlaying: true }, FX[1], FX[2]], music: [] });
        expect(pad('Applausi')).toBe(before);
        expect(before.classList.contains('live')).toBe(true);
    });

    it('STOP ALL e STOP FX mandano i loro comandi', () => {
        current = openPage();
        const { connect, $, click, commands } = current;
        const s = connect();
        click($('#stopFx'));
        click($('#stopAll'));
        expect(commands(s).map((c) => c.name)).toEqual(['stopAllFx', 'stopAll']);
    });

    it('scheda Musica: elenco brani con play/stop', () => {
        current = openPage();
        const { connect, $, doc, click, commands } = current;
        const s = connect(FX, [{ id: 'm1', name: 'Brano 1', isPlaying: false }, { id: 'm2', name: 'Brano 2', isPlaying: true }]);
        click($('#tabMusic'));
        expect($('#musicView').hidden).toBe(false);
        expect($('#stopFx').hidden).toBe(true);
        const buttons = Array.from(doc.querySelectorAll('#musicList .act')) as HTMLElement[];
        expect(buttons.map((b) => b.textContent)).toEqual(['▶ PLAY', '■ STOP']);
        click(buttons[0]);
        click(buttons[1]);
        expect(commands(s).map((c) => [c.name, c.clipId])).toEqual([['playClip', 'm1'], ['stopClip', 'm2']]);
    });

    it('in inglese con un browser inglese', () => {
        current = openPage({ lang: 'en-US' });
        const { connect, pad, $ } = current;
        connect();
        expect($('#connText').textContent).toBe('Connected');
        expect(pad('Risata').querySelector('.state')!.textContent).toBe('▶ ON AIR');
    });
});

// v1.15.37 — modalità MIX dal telefono
describe('pagina del telefono — modalità MIX', () => {
    const MUSIC = [
        { id: 'm1', name: 'Brano 1', isPlaying: false, fading: true },
        { id: 'm2', name: 'Brano 2', isPlaying: true },
        { id: 'm3', name: 'Brano 3', isPlaying: false },
    ];

    it('interruttore MIX: mostra lo stato e manda mixOn / mixOff', () => {
        current = openPage();
        const { connect, $, click, commands } = current;
        const s = connect(FX, MUSIC, { on: false, nextId: 'm3', nextName: 'Brano 3', nextMode: 'tempo' });
        click($('#tabMusic'));
        expect($('#mixToggle').textContent).toBe('MIX SPENTO');
        expect($('#mixToggle').getAttribute('aria-pressed')).toBe('false');
        expect($('#mixHint').textContent).toBe('Cambiare brano = taglio netto');
        click($('#mixToggle'));
        s.serverSend({ type: 'state', fx: FX, music: MUSIC, mix: { on: true, nextId: 'm3', nextName: 'Brano 3', nextMode: 'tempo' } });
        expect($('#mixToggle').textContent).toBe('MIX ACCESO');
        expect($('#tabMusic').textContent).toBe('MUSICA · MIX');
        click($('#mixToggle'));
        expect(commands(s).map((c) => c.name)).toEqual(['mixOn', 'mixOff']);
    });

    it('PROSSIMO: titolo del brano dopo, tipo di passaggio, comando mixNext', () => {
        current = openPage();
        const { connect, $, click, commands } = current;
        const s = connect(FX, MUSIC, { on: true, nextId: 'm3', nextName: 'Brano 3', nextMode: 'tempo', last: 'beatmatched' });
        click($('#tabMusic'));
        expect($('#mixNextTop').textContent).toBe('▶▶ PROSSIMO');
        expect($('#mixNextName').textContent).toBe('Brano 3');
        expect($('#mixNextMode').textContent).toBe('mix a tempo');
        expect($('#mixLast').textContent).toBe('Ultimo passaggio: mix a tempo');
        click($('#mixNext'));
        expect(commands(s)).toEqual([{ type: 'command', name: 'mixNext', seq: 1 }]);
    });

    it('nulla in onda: il pulsante diventa START sul primo brano', () => {
        current = openPage();
        const { connect, $, click } = current;
        connect(FX, [{ id: 'm1', name: 'Brano 1', isPlaying: false }], { on: true, nextId: 'm1', nextName: 'Brano 1', nextMode: 'start' });
        click($('#tabMusic'));
        expect($('#mixNextTop').textContent).toBe('▶ START');
        expect($('#mixNextMode').textContent).toBe('parte il primo brano');
    });

    it('fine scaletta: pulsante disattivato', () => {
        current = openPage();
        const { connect, $, click, commands } = current;
        const s = connect(FX, MUSIC, { on: true });
        click($('#tabMusic'));
        expect(($('#mixNext') as HTMLButtonElement).disabled).toBe(true);
        expect($('#mixNextTop').textContent).toBe('FINE SCALETTA');
        click($('#mixNext'));
        expect(commands(s)).toEqual([]);
    });

    it('elenco: brano IN USCITA, brano IN ONDA, e MIX sugli altri con il MIX acceso', () => {
        current = openPage();
        const { connect, $, doc, click } = current;
        connect(FX, MUSIC, { on: true, nextId: 'm3', nextName: 'Brano 3', nextMode: 'tempo' });
        click($('#tabMusic'));
        const rows = Array.from(doc.querySelectorAll('#musicList .row')) as HTMLElement[];
        expect(rows[0].classList.contains('fading')).toBe(true);
        expect(rows[0].querySelector('.out-tag')!.textContent).toBe('IN USCITA');
        expect(rows[1].querySelector('.live-tag')!.textContent).toBe('▶ IN ONDA');
        expect((rows[2].querySelector('.act') as HTMLElement).textContent).toBe('MIX ▶');
        expect((rows[2].querySelector('.act') as HTMLElement).getAttribute('aria-label')).toBe('MIX Brano 3');
    });

    it('PROSSIMO rifiutato (fine scaletta) → segnalato in rosso', () => {
        vi.useFakeTimers();
        current = openPage();
        const { connect, $, click } = current;
        const s = connect(FX, MUSIC, { on: true, nextId: 'm3', nextName: 'Brano 3', nextMode: 'tempo' });
        click($('#tabMusic'));
        click($('#mixNext'));
        s.serverSend({ type: 'ack', seq: 1, ok: false, error: 'end-of-list' });
        expect($('#mixNext').classList.contains('failed')).toBe(true);
        expect($('#mixNextTop').textContent).toBe('FINE SCALETTA');
        vi.advanceTimersByTime(1700);
        expect($('#mixNext').classList.contains('failed')).toBe(false);
    });
});

// ---------- contrasto WCAG (operatore ipovedente: requisito, non estetica) ----------
function lum(hex: string): number {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a: string, b: string): number {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

describe('pagina del telefono — contrasto', () => {
    it('ogni coppia testo/fondo della pagina supera 4.5:1', () => {
        const pairs: Array<[string, string, string]> = [
            ['testo su fondo', '#f8fafc', '#0b0f17'],
            ['testo su pannello/pad', '#f8fafc', '#1b2230'],
            ['testo secondario su pannello', '#cbd5e1', '#1b2230'],
            ['testo secondario su fondo', '#cbd5e1', '#0b0f17'],
            ['collegato', '#4ade80', '#0b0f17'],
            ['ricollegamento', '#fbbf24', '#0b0f17'],
            ['errore su fondo', '#f87171', '#0b0f17'],
            ['errore su pad', '#f87171', '#1b2230'],
            ['file mancante su pad', '#fca5a5', '#1b2230'],
            ['pulsante Collegati', '#0b0f17', '#38bdf8'],
            ['pulsante Collegati disattivato', '#ffffff', '#475569'],
            ['scheda selezionata', '#0b0f17', '#f8fafc'],
            ['STOP FX', '#0b0f17', '#fbbf24'],
            ['STOP ALL', '#ffffff', '#dc2626'],
            ['PLAY brano', '#0b0f17', '#38bdf8'],
            ['segnaposto PIN', '#8b96a8', '#0b0f17'],
            // v1.15.37 — modalità MIX
            ['MIX ACCESO', '#0b0f17', '#4ade80'],
            ['MIX SPENTO', '#f8fafc', '#1b2230'],
            ['PROSSIMO', '#0b0f17', '#c4b5fd'],
            ['PROSSIMO disattivato', '#cbd5e1', '#252e3f'],
            ['IN USCITA su riga', '#fbbf24', '#1b2230'],
            ['STOP su riga in uscita', '#f8fafc', '#252e3f'],
            ['ultimo passaggio a tempo', '#4ade80', '#0b0f17'],
            ['ultimo passaggio classico', '#fbbf24', '#0b0f17']
        ];
        for (const [label, fg, bg] of pairs) {
            expect(contrast(fg, bg), label).toBeGreaterThanOrEqual(4.5);
        }
    });

    it('pad acceso: per tutti i 30 colori dei pad la pagina sceglie un testo ≥ 4.5:1', () => {
        current = openPage();
        const { connect, pad } = current;
        const fx = COLUMN_COLORS.map((c, i) => ({ id: 'c' + i, name: 'C' + i, isPlaying: true, color: c.toLowerCase() }));
        connect(fx);
        for (let i = 0; i < COLUMN_COLORS.length; i++) {
            const el = pad('C' + i);
            const bg = el.style.getPropertyValue('--pad-color');
            const ink = el.style.getPropertyValue('--pad-ink');
            expect(contrast(ink, bg), `${COLUMN_COLORS[i]} con ${ink}`).toBeGreaterThanOrEqual(4.5);
        }
        // senza colore il pad acceso è verde: testo nero (valore di ripiego del CSS)
        expect(contrast('#000000', '#22c55e')).toBeGreaterThanOrEqual(4.5);
    });
});
