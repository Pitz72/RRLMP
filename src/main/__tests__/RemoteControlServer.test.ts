import { describe, it, expect } from 'vitest';
import { generatePin, isAllowedWsOrigin } from '../RemoteControlServer';

describe('generatePin', () => {
    it('genera sempre un PIN numerico di 6 cifre', () => {
        for (let i = 0; i < 50; i++) {
            const pin = generatePin();
            expect(pin).toMatch(/^\d{6}$/);
            const n = Number(pin);
            expect(n).toBeGreaterThanOrEqual(100000);
            expect(n).toBeLessThanOrEqual(999999);
        }
    });

    // v1.15.23: non è più Math.random(). Non si può testare la qualità di un PRNG
    // con un unit test, ma un generatore rotto (valore fisso, range sbagliato) sì.
    it('copre lo spazio dei valori senza ripetersi in modo sospetto', () => {
        const seen = new Set<string>();
        for (let i = 0; i < 500; i++) seen.add(generatePin());
        expect(seen.size).toBeGreaterThan(450); // 500 estrazioni su 900.000 valori
    });
});

// v1.15.23 (M6) — i WebSocket non rispettano la same-origin policy: una pagina web
// di terzi aperta su un dispositivo della stessa rete potrebbe aprire un socket
// verso la regia e tentare il PIN.
describe('isAllowedWsOrigin', () => {
    const PORT = 8787;

    it('accetta un client senza Origin (app non-browser)', () => {
        expect(isAllowedWsOrigin(undefined, PORT)).toBe(true);
    });

    it('accetta la pagina servita dal server stesso, su qualunque indirizzo locale', () => {
        expect(isAllowedWsOrigin('http://192.168.1.42:8787', PORT)).toBe(true);
        expect(isAllowedWsOrigin('http://localhost:8787', PORT)).toBe(true);
        expect(isAllowedWsOrigin('http://10.0.0.5:8787', PORT)).toBe(true);
    });

    it('rifiuta una pagina web di terzi', () => {
        expect(isAllowedWsOrigin('https://sito-malevolo.example', PORT)).toBe(false);
        expect(isAllowedWsOrigin('http://sito-malevolo.example:80', PORT)).toBe(false);
    });

    it('rifiuta la stessa macchina su una porta diversa (altro servizio locale)', () => {
        expect(isAllowedWsOrigin('http://192.168.1.42:3000', PORT)).toBe(false);
    });

    it('rifiuta origini con schemi non web o malformate', () => {
        expect(isAllowedWsOrigin('file://', PORT)).toBe(false);
        expect(isAllowedWsOrigin('non-un-url', PORT)).toBe(false);
        expect(isAllowedWsOrigin('null', PORT)).toBe(false);
    });
});
