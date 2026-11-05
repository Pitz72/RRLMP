import { describe, it, expect } from 'vitest';
import { generatePin, isAllowedWsOrigin, isValidPin, rankLanAddresses } from '../RemoteControlServer';

// v1.15.37 — il link copiato e il QR usano il PRIMO indirizzo: deve essere quello
// della rete vera. Caso reale del PC di regia (2026-11-05): Wi-Fi 192.168.1.5,
// WSL 172.26.160.1, quattro schede senza rete con 169.254.x.
describe('rankLanAddresses', () => {
    const v4 = (address: string) => ({ family: 'IPv4', address, internal: false });

    it('mette il Wi-Fi prima di WSL anche se il sistema elenca WSL per primo', () => {
        expect(rankLanAddresses({
            'vEthernet (WSL (Hyper-V firewall))': [v4('172.26.160.1')],
            'Wi-Fi': [v4('192.168.1.5')]
        })).toEqual(['192.168.1.5', '172.26.160.1']);
    });

    it('esclude gli indirizzi 169.254 (scheda senza rete), loopback e IPv6', () => {
        expect(rankLanAddresses({
            Ethernet: [v4('169.254.255.140')],
            'Wi-Fi 2': [v4('169.254.179.33')],
            'Loopback Pseudo-Interface 1': [{ family: 'IPv4', address: '127.0.0.1', internal: true }],
            'Wi-Fi': [v4('192.168.1.5'), { family: 'IPv6', address: 'fe80::1', internal: false }]
        })).toEqual(['192.168.1.5']);
    });

    it('accetta family numerica (Node 18.0-18.3) e toglie i duplicati', () => {
        expect(rankLanAddresses({
            eth0: [{ family: 4, address: '10.0.0.7', internal: false }],
            eth1: [{ family: 4, address: '10.0.0.7', internal: false }]
        })).toEqual(['10.0.0.7']);
    });

    it('adattatori virtuali sempre in fondo, anche con indirizzo 192.168', () => {
        expect(rankLanAddresses({
            'VirtualBox Host-Only Network': [v4('192.168.56.1')],
            Ethernet: [v4('10.1.2.3')]
        })).toEqual(['10.1.2.3', '192.168.56.1']);
    });

    it('nessuna rete → elenco vuoto', () => {
        expect(rankLanAddresses({})).toEqual([]);
    });
});

describe('isValidPin', () => {
    it('accetta solo 6 cifre senza zero iniziale (la forma di generatePin)', () => {
        expect(isValidPin('482913')).toBe(true);
        expect(isValidPin(generatePin())).toBe(true);
        expect(isValidPin('012345')).toBe(false);
        expect(isValidPin('12345')).toBe(false);
        expect(isValidPin('1234567')).toBe(false);
        expect(isValidPin('12a456')).toBe(false);
        expect(isValidPin(482913)).toBe(false);
        expect(isValidPin(undefined)).toBe(false);
    });
});

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

    // v1.15.35 (L10): con l'header Host l'origine deve coincidere con l'indirizzo
    // a cui il browser si è collegato, non solo con la porta.
    it('con Host: accetta la pagina servita dallo stesso indirizzo', () => {
        expect(isAllowedWsOrigin('http://192.168.1.42:8787', PORT, '192.168.1.42:8787')).toBe(true);
        expect(isAllowedWsOrigin('http://Regia.local:8787', PORT, 'regia.local:8787')).toBe(true);
    });

    it('con Host: rifiuta un sito esterno che usa la stessa porta', () => {
        expect(isAllowedWsOrigin('http://sito-malevolo.example:8787', PORT, '192.168.1.42:8787')).toBe(false);
        expect(isAllowedWsOrigin('http://192.168.1.99:8787', PORT, '192.168.1.42:8787')).toBe(false);
    });

    it('rifiuta origini con schemi non web o malformate', () => {
        expect(isAllowedWsOrigin('file://', PORT)).toBe(false);
        expect(isAllowedWsOrigin('non-un-url', PORT)).toBe(false);
        expect(isAllowedWsOrigin('null', PORT)).toBe(false);
    });
});
