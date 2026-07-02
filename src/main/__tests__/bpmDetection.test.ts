import { describe, it, expect } from 'vitest';
import { computeEnergyEnvelope, estimateBpmFromEnvelope } from '../bpmDetection';

// Costruisce un inviluppo sintetico con impulsi periodici ogni `periodSamples`
// campioni, per simulare un beat regolare a BPM noto. Il periodo può essere
// FRAZIONARIO (v1.10.14): `i % 31.578` produce impulsi la cui spaziatura media
// è il periodo vero, come i beat reali campionati da una griglia a 50Hz.
function makePeriodicEnvelope(length: number, periodSamples: number, amplitude = 1): number[] {
    const env: number[] = [];
    for (let i = 0; i < length; i++) {
        const phase = i % periodSamples;
        // impulso "smussato" attorno alla fase 0 (picco di energia del beat)
        env.push(phase < 2 ? amplitude : amplitude * 0.1);
    }
    return env;
}

describe('computeEnergyEnvelope', () => {
    it('produce un campione di inviluppo per ogni finestra', () => {
        const sampleRate = 1000;
        const windowMs = 20; // 20 campioni per finestra
        const samples = new Int16Array(200); // 10 finestre esatte
        const env = computeEnergyEnvelope(samples, sampleRate, windowMs);
        expect(env.length).toBe(10);
    });

    it('rileva energia più alta in una finestra con segnale rispetto al silenzio', () => {
        const sampleRate = 1000;
        const samples = new Int16Array(40);
        for (let i = 20; i < 40; i++) samples[i] = 32767; // seconda finestra a piena scala
        const env = computeEnergyEnvelope(samples, sampleRate, 20);
        expect(env[0]).toBe(0);
        expect(env[1]).toBeGreaterThan(env[0]);
    });
});

describe('estimateBpmFromEnvelope', () => {
    it('stima ~120 BPM da un inviluppo periodico a 0.5s (envelopeRate 50Hz -> periodo 25 campioni)', () => {
        const envelopeRateHz = 50; // finestre da 20ms
        const periodSamples = 25; // 25 * 20ms = 500ms = 120 BPM
        const envelope = makePeriodicEnvelope(envelopeRateHz * 20, periodSamples);
        const result = estimateBpmFromEnvelope(envelope, envelopeRateHz);
        expect(result).not.toBeNull();
        expect(result!.bpm).toBeCloseTo(120, 0);
        expect(result!.confidence).toBeGreaterThan(0);
    });

    it('stima ~140 BPM riportando in ottava un periodo molto corto (280 BPM grezzo)', () => {
        const envelopeRateHz = 50;
        const periodSamples = Math.round((60 / 280) * envelopeRateHz); // ~11 campioni
        const envelope = makePeriodicEnvelope(envelopeRateHz * 20, periodSamples);
        const result = estimateBpmFromEnvelope(envelope, envelopeRateHz);
        expect(result).not.toBeNull();
        // 280 BPM raddoppiato/dimezzato deve ricadere nel range 90-180
        expect(result!.bpm).toBeGreaterThanOrEqual(90);
        expect(result!.bpm).toBeLessThanOrEqual(180);
    });

    it('v1.10.14: stima ~95 BPM con periodo FRAZIONARIO (interpolazione parabolica del picco)', () => {
        // 95 BPM a 50Hz = periodo 31.578 campioni: il lag intero più vicino (32)
        // darebbe 93.75 BPM — è il caso reale osservato nei test v1.8.0
        // ("95 atteso → 93.8 rilevato"). Con l'interpolazione l'errore deve
        // scendere sotto ±0.5 BPM.
        const envelopeRateHz = 50;
        const periodSamples = (60 / 95) * envelopeRateHz; // 31.578...
        const envelope = makePeriodicEnvelope(envelopeRateHz * 30, periodSamples);
        const result = estimateBpmFromEnvelope(envelope, envelopeRateHz);
        expect(result).not.toBeNull();
        expect(Math.abs(result!.bpm - 95)).toBeLessThan(0.5);
    });

    it('v1.10.14: il caso a periodo intero resta esatto (120 BPM → 120.0)', () => {
        const envelopeRateHz = 50;
        const envelope = makePeriodicEnvelope(envelopeRateHz * 20, 25);
        const result = estimateBpmFromEnvelope(envelope, envelopeRateHz);
        expect(result!.bpm).toBeCloseTo(120, 1);
    });

    it('ritorna null su inviluppo troppo corto (<2s di dati)', () => {
        const envelopeRateHz = 50;
        const envelope = makePeriodicEnvelope(30, 10); // 0.6s
        expect(estimateBpmFromEnvelope(envelope, envelopeRateHz)).toBeNull();
    });

    it('ritorna null su inviluppo piatto (silenzio/segnale costante)', () => {
        const envelopeRateHz = 50;
        const envelope = new Array(envelopeRateHz * 5).fill(0.5);
        expect(estimateBpmFromEnvelope(envelope, envelopeRateHz)).toBeNull();
    });
});
