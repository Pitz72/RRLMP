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

// ---------------------------------------------------------------------------
// v1.15.37 — griglia raffinata. Segnali audio sintetici a tempo e primo battito
// NOTI (cassa + charleston in controtempo), alla stessa frequenza della pipeline
// reale (11025 Hz). Il vecchio rilevatore sbagliava il primo battito di 35-90 ms.
// ---------------------------------------------------------------------------
import { lowPassFilter, computeOnsetEnvelope, refineBeatGrid, BEAT_GRID_LOWPASS_HZ } from '../bpmDetection';

const SR = 11025;
function drumLoop(bpm: number, offsetSec: number, seconds: number, hats = true): Int16Array {
    const out = new Float32Array(SR * seconds);
    const period = 60 / bpm;
    let seed = 7;
    const noise = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };
    for (let t0 = offsetSec; t0 < seconds; t0 += period) {
        const s = Math.round(t0 * SR);
        for (let i = 0; i < SR * 0.2 && s + i < out.length; i++) {           // cassa
            const t = i / SR;
            out[s + i] += 0.8 * Math.exp(-t * 18) * Math.sin(2 * Math.PI * (45 + 65 * Math.exp(-t * 30)) * t);
        }
        if (hats) {                                                          // charleston in controtempo, forte
            const h = Math.round((t0 + period / 2) * SR);
            for (let i = 0; i < SR * 0.04 && h + i < out.length; i++) out[h + i] += 0.5 * Math.exp(-i / SR * 90) * noise();
        }
    }
    const pcm = new Int16Array(out.length);
    for (let i = 0; i < out.length; i++) pcm[i] = Math.max(-32767, Math.min(32767, Math.round(out[i] * 32767)));
    return pcm;
}
function analyze(pcm: Int16Array, coarseBpm: number) {
    const { onset, rateHz } = computeOnsetEnvelope(lowPassFilter(pcm, SR, BEAT_GRID_LOWPASS_HZ), SR);
    return refineBeatGrid(onset, rateHz, coarseBpm);
}

describe('computeOnsetEnvelope (v1.15.37)', () => {
    it('riporta la frequenza VERA: a 11025 Hz «5 ms» sono 55 campioni', () => {
        const { rateHz } = computeOnsetEnvelope(new Float32Array(SR), SR);
        expect(rateHz).toBeCloseTo(SR / 55, 9); // 200,45 Hz, non 200
    });
});

describe('refineBeatGrid (v1.15.37)', () => {
    const cases: Array<[number, number]> = [[124, 0.25], [120, 0.31], [118, 0.18], [96, 0.42], [132, 0.05]];
    for (const [bpm, offset] of cases) {
        it(`${bpm} BPM, primo battito a ${offset}s: tempo esatto e fase entro 10 ms, anche con charleston forte in controtempo`, () => {
            // stima grezza volutamente sbagliata dell'1,5% (come può uscire dall'autocorrelazione)
            const g = analyze(drumLoop(bpm, offset, 40), bpm * 1.015)!;
            expect(g).not.toBeNull();
            expect(Math.abs(g.bpm - bpm)).toBeLessThanOrEqual(0.05);
            const period = 60 / bpm;
            const d = ((g.beatOffsetSec - offset) % period + period) % period;
            expect(Math.min(d, period - d) * 1000).toBeLessThan(10);
            expect(g.gridScore).toBeGreaterThan(2.5);
        });
    }

    it('accordo tenuto senza ritmo: punteggio sotto la soglia del mix (niente falso «a tempo»)', () => {
        const pcm = new Int16Array(SR * 30);
        for (let i = 0; i < pcm.length; i++) {
            const t = i / SR;
            pcm[i] = Math.round(3500 * (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 277.18 * t) + Math.sin(2 * Math.PI * 329.63 * t)));
        }
        const g = analyze(pcm, 147);
        expect(g === null || g.gridScore < 2.5).toBe(true);
    });

    it('silenzio o dati troppo corti → null', () => {
        expect(analyze(new Int16Array(SR * 10), 120)).toBeNull();
        expect(analyze(drumLoop(120, 0.1, 1), 120)).toBeNull();
        expect(refineBeatGrid(new Float32Array(100), 200, 0)).toBeNull();
    });
});
