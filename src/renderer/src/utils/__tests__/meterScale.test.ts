import { describe, it, expect } from 'vitest';
import { ampToDb, dbToPct, analyzeBuffer, METER_DB_FLOOR } from '../meterScale';

const sine = (amp: number, samples = 2048, period = 64): Float32Array =>
    Float32Array.from({ length: samples }, (_, i) => amp * Math.sin((2 * Math.PI * i) / period));

describe('meterScale — scala in dB del VU meter master (v1.15.13)', () => {
    it('ampToDb: riferimenti noti', () => {
        expect(ampToDb(1)).toBeCloseTo(0, 5);
        expect(ampToDb(0.5)).toBeCloseTo(-6.02, 2);
        expect(ampToDb(0.1)).toBeCloseTo(-20, 5);
        expect(ampToDb(0)).toBe(-Infinity);
        expect(ampToDb(NaN)).toBe(-Infinity);
    });

    it('dbToPct: corsa lineare in dB su [-48..0]', () => {
        expect(dbToPct(0)).toBe(100);
        expect(dbToPct(METER_DB_FLOOR)).toBe(0);
        expect(dbToPct(-24)).toBe(50);
        expect(dbToPct(-12)).toBe(75);
        expect(dbToPct(-6)).toBeCloseTo(87.5, 5);
        // fuori scala: clamp, mai valori negativi o > 100
        expect(dbToPct(-90)).toBe(0);
        expect(dbToPct(6)).toBe(100);
        expect(dbToPct(-Infinity)).toBe(0);
    });

    it('analyzeBuffer: sinusoide full-scale → RMS −3 dB, picco 0 dB', () => {
        const { rmsDb, peakDb } = analyzeBuffer(sine(1));
        expect(rmsDb).toBeCloseTo(-3.01, 1);
        expect(peakDb).toBeCloseTo(0, 1);
    });

    it('analyzeBuffer: sinusoide a −12 dB (amp 0.25) → RMS ~−15 dB, picco ~−12 dB', () => {
        const { rmsDb, peakDb } = analyzeBuffer(sine(0.25));
        expect(rmsDb).toBeCloseTo(-15.05, 1);
        expect(peakDb).toBeCloseTo(-12.04, 1);
    });

    it('il programma tipico ora vive a metà-alta corsa (prima ~30%)', () => {
        // RMS −14 dBFS (≈ programma radiofonico): deve stare oltre il 65% della corsa
        expect(dbToPct(-14)).toBeGreaterThan(65);
        // e un bed duckato a −35 dB deve restare VISIBILE (>20%), non a ~3%
        expect(dbToPct(-35)).toBeGreaterThan(20);
    });

    it('silenzio e finestre vuote: mai NaN, sempre 0%', () => {
        const zeroes = analyzeBuffer(new Float32Array(2048));
        expect(zeroes.rmsDb).toBe(-Infinity);
        expect(dbToPct(zeroes.rmsDb)).toBe(0);
        const empty = analyzeBuffer(new Float32Array(0));
        expect(empty.peakDb).toBe(-Infinity);
        expect(dbToPct(empty.peakDb)).toBe(0);
    });

    it('il picco è il massimo assoluto (sensibile anche ai transienti negativi)', () => {
        const buf = new Float32Array(2048).fill(0.05);
        buf[500] = -0.9;
        expect(analyzeBuffer(buf).peakDb).toBeCloseTo(ampToDb(0.9), 5);
    });
});
