import { describe, it, expect } from 'vitest';
import { createPinRateLimiter } from '../pinRateLimiter';

describe('createPinRateLimiter', () => {
    it('permette fino a maxAttempts tentativi nella finestra, poi blocca', () => {
        let t = 0;
        const limiter = createPinRateLimiter(3, 1000, () => t);
        expect(limiter.allow('1.2.3.4')).toBe(true);
        expect(limiter.allow('1.2.3.4')).toBe(true);
        expect(limiter.allow('1.2.3.4')).toBe(true);
        expect(limiter.allow('1.2.3.4')).toBe(false); // 4° tentativo nella stessa finestra
    });

    it('client diversi hanno contatori indipendenti', () => {
        let t = 0;
        const limiter = createPinRateLimiter(1, 1000, () => t);
        expect(limiter.allow('a')).toBe(true);
        expect(limiter.allow('a')).toBe(false);
        expect(limiter.allow('b')).toBe(true); // client diverso, non influenzato da "a"
    });

    it('la finestra scorrevole si resetta dopo windowMs', () => {
        let t = 0;
        const limiter = createPinRateLimiter(2, 1000, () => t);
        expect(limiter.allow('x')).toBe(true);
        expect(limiter.allow('x')).toBe(true);
        expect(limiter.allow('x')).toBe(false);
        t = 1001; // finestra scaduta
        expect(limiter.allow('x')).toBe(true);
    });

    it('reset(key) azzera i tentativi di un solo client', () => {
        let t = 0;
        const limiter = createPinRateLimiter(1, 1000, () => t);
        expect(limiter.allow('a')).toBe(true);
        expect(limiter.allow('a')).toBe(false);
        limiter.reset('a');
        expect(limiter.allow('a')).toBe(true);
    });

    it('reset() senza argomenti azzera tutti i client', () => {
        let t = 0;
        const limiter = createPinRateLimiter(1, 1000, () => t);
        limiter.allow('a');
        limiter.allow('b');
        limiter.reset();
        expect(limiter.allow('a')).toBe(true);
        expect(limiter.allow('b')).toBe(true);
    });
});
