import { describe, it, expect } from 'vitest';
import { computeEnergyEnvelope, estimateBpmFromEnvelope, estimateBeatOffsetSec } from '../bpmDetection';

// Costruisce un inviluppo sintetico con impulsi periodici ogni `periodSamples`
// campioni, per simulare un beat regolare a BPM noto. Il periodo può essere
// FRAZIONARIO (v1.10.14): `i % 31.578` produce impulsi la cui spaziatura media
// è il periodo vero, come i beat reali campionati da una griglia a 50Hz.
// `offsetSamples` (v1.10.16, Fase A Automix) sposta la fase della griglia:
// il primo beat cade a `offsetSamples` invece che a 0.
function makePeriodicEnvelope(length: number, periodSamples: number, amplitude = 1, offsetSamples = 0): number[] {
    const env: number[] = [];
    for (let i = 0; i < length; i++) {
        const phase = (((i - offsetSamples) % periodSamples) + periodSamples) % periodSamples;
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

describe('estimateBeatOffsetSec (v1.10.16, Fase A Automix)', () => {
    // Tolleranza: 2 campioni di inviluppo a 50Hz = 40ms. L'onset (derivata
    // positiva) cade sul primo campione dell'impulso, ma il fronte può essere
    // spalmato su un campione adiacente con periodi frazionari.
    const TOL_SEC = 0.045;

    it('griglia 120 BPM che parte a 0.3s → offset ≈ 0.3', () => {
        const envelopeRateHz = 50;
        const periodSamples = 25; // 120 BPM
        const offsetSamples = 15; // 0.3s
        const envelope = makePeriodicEnvelope(envelopeRateHz * 20, periodSamples, 1, offsetSamples);
        const offset = estimateBeatOffsetSec(envelope, envelopeRateHz, 120);
        expect(offset).not.toBeNull();
        expect(Math.abs(offset! - 0.3)).toBeLessThan(TOL_SEC);
    });

    it('griglia in fase (primo beat a 0) → offset ≈ 0', () => {
        const envelopeRateHz = 50;
        const envelope = makePeriodicEnvelope(envelopeRateHz * 20, 25);
        const offset = estimateBeatOffsetSec(envelope, envelopeRateHz, 120);
        expect(offset).not.toBeNull();
        // la fase può anche risultare ~periodo (wrap): accetta 0 o un periodo pieno
        const period = 60 / 120;
        const dist = Math.min(offset!, period - offset!);
        expect(dist).toBeLessThan(TOL_SEC);
    });

    it('periodo FRAZIONARIO (95 BPM) con primo beat a 0.5s → offset ≈ 0.5', () => {
        const envelopeRateHz = 50;
        const periodSamples = (60 / 95) * envelopeRateHz; // 31.578...
        const offsetSamples = 25; // 0.5s
        const envelope = makePeriodicEnvelope(envelopeRateHz * 30, periodSamples, 1, offsetSamples);
        const offset = estimateBeatOffsetSec(envelope, envelopeRateHz, 95);
        expect(offset).not.toBeNull();
        expect(Math.abs(offset! - 0.5)).toBeLessThan(TOL_SEC);
    });

    it('coerenza con la pipeline reale: offset stimato sul BPM uscito da estimateBpmFromEnvelope', () => {
        // Simula l'uso vero in AudioProcessor.detectBpm: prima si stima il BPM
        // dall'inviluppo, poi la fase usando QUEL bpm (non quello nominale).
        const envelopeRateHz = 50;
        const periodSamples = (60 / 95) * envelopeRateHz;
        const offsetSamples = 25; // 0.5s
        const envelope = makePeriodicEnvelope(envelopeRateHz * 30, periodSamples, 1, offsetSamples);
        const est = estimateBpmFromEnvelope(envelope, envelopeRateHz);
        expect(est).not.toBeNull();
        const offset = estimateBeatOffsetSec(envelope, envelopeRateHz, est!.bpm);
        expect(offset).not.toBeNull();
        expect(Math.abs(offset! - 0.5)).toBeLessThan(TOL_SEC);
    });

    it('ritorna null su inviluppo piatto (nessuna salita di energia)', () => {
        const envelopeRateHz = 50;
        const envelope = new Array(envelopeRateHz * 5).fill(0.5);
        expect(estimateBeatOffsetSec(envelope, envelopeRateHz, 120)).toBeNull();
    });

    it('ritorna null con bpm non valido o dati insufficienti', () => {
        const envelopeRateHz = 50;
        const envelope = makePeriodicEnvelope(envelopeRateHz * 20, 25);
        expect(estimateBeatOffsetSec(envelope, envelopeRateHz, 0)).toBeNull();
        expect(estimateBeatOffsetSec(envelope, envelopeRateHz, -10)).toBeNull();
        expect(estimateBeatOffsetSec([0.1, 0.2, 0.1], envelopeRateHz, 120)).toBeNull();
    });
});
