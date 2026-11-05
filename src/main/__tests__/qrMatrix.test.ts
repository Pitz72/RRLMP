import { describe, it, expect } from 'vitest';
import { buildQrMatrix } from '../qrMatrix';

// v1.15.37 — QR code del Controllo Remoto. Non si decodifica qui (servirebbe un
// lettore QR), ma si verifica la struttura che ogni lettore cerca per primo.
describe('buildQrMatrix', () => {
    const url = 'http://192.168.1.5:8787/#pin=482913';

    it('matrice quadrata di dimensione QR valida (21 + 4·k moduli)', () => {
        const m = buildQrMatrix(url);
        expect(m.rows).toHaveLength(m.size);
        expect(m.rows.every((r) => r.length === m.size && /^[01]+$/.test(r))).toBe(true);
        expect((m.size - 21) % 4).toBe(0);
        expect(m.size).toBeLessThanOrEqual(41); // versione ≤ 6: moduli grandi, facile da inquadrare
    });

    it('ha i tre quadrati di posizionamento negli angoli', () => {
        const m = buildQrMatrix(url);
        const finder = ['1111111', '1000001', '1011101', '1011101', '1011101', '1000001', '1111111'];
        const at = (r0: number, c0: number) => finder.every((row, i) => m.rows[r0 + i].slice(c0, c0 + 7) === row);
        expect(at(0, 0)).toBe(true);
        expect(at(0, m.size - 7)).toBe(true);
        expect(at(m.size - 7, 0)).toBe(true);
    });

    it('testi diversi → codici diversi', () => {
        expect(buildQrMatrix(url).rows.join('')).not.toBe(buildQrMatrix('http://192.168.1.5:8787/#pin=765432').rows.join(''));
    });
});
