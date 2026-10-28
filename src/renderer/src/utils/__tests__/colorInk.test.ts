import { describe, it, expect } from 'vitest';
import { inkFor, prefersLightInk, relativeLuminance, INK_DARK, INK_LIGHT } from '../colorInk';

describe('colorInk — testo sopra il pad acceso', () => {
    it('luminanza: bianco 1, nero 0, forma corta uguale a quella lunga', () => {
        expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
        expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
        expect(relativeLuminance('#fff')).toBeCloseTo(relativeLuminance('#FFFFFF')!, 10);
    });

    it('colori non esadecimali → null e inchiostro scuro', () => {
        expect(relativeLuminance(undefined)).toBeNull();
        expect(relativeLuminance('rgb(1,2,3)')).toBeNull();
        expect(inkFor('var(--x)')).toBe(INK_DARK);
    });

    it('tinte di default delle colonne → inchiostro scuro', () => {
        for (const c of ['#10B981', '#F59E0B', '#06B6D4', '#EF4444', '#F97316', '#8B5CF6']) {
            expect(inkFor(c)).toBe(INK_DARK);
        }
    });

    it('tinte scure della tavolozza → inchiostro bianco', () => {
        for (const c of ['#1D4ED8', '#0369A1', '#7C3AED', '#BE185D']) {
            expect(prefersLightInk(c)).toBe(true);
            expect(inkFor(c)).toBe(INK_LIGHT);
        }
    });
});
