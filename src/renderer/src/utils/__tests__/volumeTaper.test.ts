import { describe, it, expect } from 'vitest';
import { sliderToGain, gainToSlider, gainToDbLabel } from '../volumeTaper';

describe('volumeTaper — taper percettivo cubico dei fader clip (v1.15.11)', () => {
    it('estremi: pos 0 → mute, pos 1 → fondo scala', () => {
        expect(sliderToGain(0, 2)).toBe(0);
        expect(sliderToGain(1, 2)).toBe(2);
        expect(sliderToGain(0, 1)).toBe(0);
        expect(sliderToGain(1, 1)).toBe(1);
    });

    it('roundtrip gain → slider → gain entro l\'arrotondamento a 4 decimali', () => {
        for (const g of [0.05, 0.1, 0.25, 0.5, 1.0, 1.5, 2.0]) {
            expect(sliderToGain(gainToSlider(g, 2), 2)).toBeCloseTo(g, 3);
        }
        for (const g of [0.05, 0.3, 1.0]) {
            expect(sliderToGain(gainToSlider(g, 1), 1)).toBeCloseTo(g, 3);
        }
    });

    it('unity (0 dB) sta a ~79% della corsa con fondo scala 2', () => {
        expect(gainToSlider(1, 2)).toBeCloseTo(0.7937, 3);
    });

    it('il livello da sottofondo (−26 dB, gain 0.05) sta a ~29% della corsa — non più a una tacca dal mute', () => {
        const pos = gainToSlider(0.05, 2);
        expect(pos).toBeGreaterThan(0.28);
        expect(pos).toBeLessThan(0.31);
    });

    it('monotonia stretta della curva', () => {
        let prev = -1;
        for (let p = 0; p <= 1.0001; p += 0.01) {
            const g = sliderToGain(p, 2);
            expect(g).toBeGreaterThanOrEqual(prev);
            prev = g;
        }
    });

    it('input difensivi: NaN/negativi/oltre-corsa clampati, gain > fondo scala pinna a 1', () => {
        expect(sliderToGain(NaN, 2)).toBe(0);
        expect(sliderToGain(-0.5, 2)).toBe(0);
        expect(sliderToGain(1.5, 2)).toBe(2);
        expect(gainToSlider(NaN, 2)).toBe(0);
        expect(gainToSlider(-1, 2)).toBe(0);
        // clip.volume 2.0 aperta nella FxQuick (fondo scala 1): slider pinnato al max
        expect(gainToSlider(2, 1)).toBe(1);
    });

    it('etichette dB', () => {
        expect(gainToDbLabel(1)).toBe('0.0 dB');
        expect(gainToDbLabel(2)).toBe('+6.0 dB');
        expect(gainToDbLabel(0.5)).toBe('−6.0 dB');
        expect(gainToDbLabel(0.05)).toBe('−26.0 dB');
        expect(gainToDbLabel(0)).toBe('−∞ dB');
        expect(gainToDbLabel(NaN)).toBe('−∞ dB');
    });
});
