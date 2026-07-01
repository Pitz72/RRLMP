import { describe, it, expect } from 'vitest';
import { generatePin } from '../RemoteControlServer';

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
});
