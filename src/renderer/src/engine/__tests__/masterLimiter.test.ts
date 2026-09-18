import { describe, it, expect } from 'vitest';
import { limiterParams, LIMITER_HEADROOM_DB, LIMITER_MAKEUP_PER_DB, GLUE_LEGACY_MAKEUP_GAIN } from '../masterLimiter';

// v1.15.34 — la verifica acustica è la sonda OfflineAudioContext (docs/log);
// qui si blocca la matematica, così un ritocco distratto non passa inosservato.
describe('limiterParams', () => {
    it('tetto di default −1: soglia interna sotto il tetto e trim che annulla il makeup', () => {
        const p = limiterParams(-1, true);
        expect(p.threshold).toBeCloseTo(-1 - LIMITER_HEADROOM_DB, 6);
        expect(p.ratio).toBe(20);
        expect(p.trimDb).toBeCloseTo((-1 - LIMITER_HEADROOM_DB) * LIMITER_MAKEUP_PER_DB, 6);
    });

    it('il trim è sempre l\'opposto del makeup della soglia effettiva', () => {
        for (const c of [-0.1, -1, -3, -6]) {
            const p = limiterParams(c, true);
            expect(p.trimDb + LIMITER_MAKEUP_PER_DB * -p.threshold).toBeCloseTo(0, 9);
        }
    });

    it('catena in bypass: limiter neutro e nessun trim', () => {
        expect(limiterParams(-1, false)).toEqual({ threshold: 0, ratio: 1, trimDb: 0 });
    });

    it('un tetto positivo (dato persistito rovinato) non alza la soglia sopra 0', () => {
        expect(limiterParams(3, true).threshold).toBeCloseTo(-LIMITER_HEADROOM_DB, 6);
    });

    it('compensazione del Glue: +0,57 dB', () => {
        expect(20 * Math.log10(GLUE_LEGACY_MAKEUP_GAIN)).toBeCloseTo(0.57, 6);
    });
});
