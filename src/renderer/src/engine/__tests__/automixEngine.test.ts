import { describe, it, expect } from 'vitest';
import {
    nextBeatAfter,
    computeTempoMatchRate,
    crossfadeDurationSec,
    planTransition,
    assessCompatibility,
    AUTOMIX_DEFAULTS
} from '../automixEngine';

describe('nextBeatAfter', () => {
    it('trova il prossimo beat della griglia (120 BPM, offset 0.5)', () => {
        // griglia: 0.5, 1.0, 1.5, ... — da 1.2 il prossimo è 1.5
        expect(nextBeatAfter(1.2, 120, 0.5)).toBeCloseTo(1.5, 6);
    });

    it('posizione esattamente su un beat → ritorna quel beat', () => {
        expect(nextBeatAfter(1.0, 120, 0.5)).toBeCloseTo(1.0, 6);
    });

    it('posizione prima del primo beat → ritorna il primo beat (mai k negativi)', () => {
        expect(nextBeatAfter(0, 120, 0.5)).toBeCloseTo(0.5, 6);
    });

    it('minLeadSec sposta oltre il beat troppo vicino', () => {
        // da 0.95 il beat a 1.0 è a soli 50ms: col lead 0.15 si aggancia a 1.5
        expect(nextBeatAfter(0.95, 120, 0.5, 0.15)).toBeCloseTo(1.5, 6);
    });

    it('bpm/offset non validi → null', () => {
        expect(nextBeatAfter(1, 0, 0.5)).toBeNull();
        expect(nextBeatAfter(1, -120, 0.5)).toBeNull();
        expect(nextBeatAfter(1, 120, -0.1)).toBeNull();
        expect(nextBeatAfter(1, 120, NaN)).toBeNull();
    });
});

describe('computeTempoMatchRate', () => {
    it('delta piccolo → rate diretto (120 in onda, 118 entrante)', () => {
        expect(computeTempoMatchRate(120, 118)).toBeCloseTo(120 / 118, 6);
    });

    it('octave-aware: 90 in onda, 175.9 entrante → rate ~1.023 (half-time)', () => {
        const r = computeTempoMatchRate(90, 175.9);
        expect(r).not.toBeNull();
        expect(r!).toBeCloseTo(180 / 175.9, 4);
    });

    it('oltre il cap ±8% → null (120 vs 135, nessuna ottava aiuta)', () => {
        expect(computeTempoMatchRate(120, 135)).toBeNull();
    });

    it('bpm identici → rate 1', () => {
        expect(computeTempoMatchRate(128, 128)).toBe(1);
    });

    it('input non validi → null', () => {
        expect(computeTempoMatchRate(0, 120)).toBeNull();
        expect(computeTempoMatchRate(120, NaN)).toBeNull();
    });
});

describe('crossfadeDurationSec', () => {
    it('8 beat a 120 BPM → 4s', () => {
        expect(crossfadeDurationSec(120, 8)).toBeCloseTo(4, 6);
    });

    it('default AUTOMIX_DEFAULTS.crossfadeBeats', () => {
        expect(crossfadeDurationSec(120)).toBeCloseTo(AUTOMIX_DEFAULTS.crossfadeBeats * 0.5, 6);
    });

    it('bpm non valido → 0', () => {
        expect(crossfadeDurationSec(0)).toBe(0);
    });
});

describe('planTransition (regole Fase D incluse)', () => {
    const goodOutgoing = { bpm: 120, beatOffsetSec: 0.5, bpmConfidence: 0.7, positionSec: 60, effectiveEndSec: 180 };
    const goodIncoming = { bpm: 118, beatOffsetSec: 0.3, bpmConfidence: 0.6, trimStartSec: 1.0 };

    it('caso felice → beatmatched con rate, aggancio e partenza su beat', () => {
        const plan = planTransition({ outgoing: goodOutgoing, incoming: goodIncoming });
        expect(plan.mode).toBe('beatmatched');
        if (plan.mode !== 'beatmatched') return;
        expect(plan.rate).toBeCloseTo(120 / 118, 6);
        // aggancio: primo beat di 120BPM/offset0.5 dopo 60+0.15s → 60.5
        expect(plan.anchorBeatSec).toBeCloseTo(60.5, 6);
        // partenza entrante: griglia 118BPM offset 0.3 → primo beat ≥ 1.0
        const periodIn = 60 / 118;
        expect(plan.incomingStartSec).toBeGreaterThanOrEqual(1.0);
        expect((plan.incomingStartSec - 0.3) % periodIn).toBeCloseTo(0, 6);
        // crossfade: 8 beat a 120 → 4s
        expect(plan.crossfadeSec).toBeCloseTo(4, 6);
    });

    it('bpm mancante su uno dei due → classic/missing-bpm', () => {
        const plan = planTransition({ outgoing: { ...goodOutgoing, bpm: undefined }, incoming: goodIncoming });
        expect(plan).toEqual({ mode: 'classic', reason: 'missing-bpm' });
    });

    it('offset mancante → classic/missing-offset', () => {
        const plan = planTransition({ outgoing: goodOutgoing, incoming: { ...goodIncoming, beatOffsetSec: undefined } });
        expect(plan).toEqual({ mode: 'classic', reason: 'missing-offset' });
    });

    it('confidence 0.41 (caso "Mother" della validazione A3) → classic/low-confidence', () => {
        const plan = planTransition({ outgoing: goodOutgoing, incoming: { ...goodIncoming, bpmConfidence: 0.41 } });
        expect(plan).toEqual({ mode: 'classic', reason: 'low-confidence' });
    });

    it('confidence ASSENTE (clip pre-v1.10.20) → classic/low-confidence, prudenza', () => {
        const plan = planTransition({ outgoing: goodOutgoing, incoming: { ...goodIncoming, bpmConfidence: undefined } });
        expect(plan).toEqual({ mode: 'classic', reason: 'low-confidence' });
    });

    it('delta BPM oltre il cap → classic/rate-cap', () => {
        const plan = planTransition({ outgoing: goodOutgoing, incoming: { ...goodIncoming, bpm: 135 } });
        expect(plan).toEqual({ mode: 'classic', reason: 'rate-cap' });
    });

    it('aggancio troppo vicino alla fine effettiva (crossfade non ci sta) → classic/no-beat-available', () => {
        const plan = planTransition({
            outgoing: { ...goodOutgoing, positionSec: 177, effectiveEndSec: 180 }, // beat a ~177.5, +4s di fade > 180
            incoming: goodIncoming
        });
        expect(plan).toEqual({ mode: 'classic', reason: 'no-beat-available' });
    });

    it('le opzioni override funzionano (cap più permissivo accetta 120 vs 135)', () => {
        const plan = planTransition({
            outgoing: goodOutgoing,
            incoming: { ...goodIncoming, bpm: 135 },
            options: { maxRateDeviation: 0.15 }
        });
        expect(plan.mode).toBe('beatmatched');
    });
});

describe('assessCompatibility (indicatore C1)', () => {
    const good = (bpm: number) => ({ bpm, beatOffsetSec: 0.3, bpmConfidence: 0.7 });

    it('delta ≤4% → verde (120 vs 118)', () => {
        const r = assessCompatibility(good(120), good(118));
        expect(r.level).toBe('green');
        expect(r.rate).toBeCloseTo(120 / 118, 6);
    });

    it('delta tra 4% e 8% → giallo (120 vs 113)', () => {
        const r = assessCompatibility(good(120), good(113));
        expect(r.level).toBe('yellow');
    });

    it('octave-aware: 90 vs 175.9 → verde (half-time, rate ~1.023)', () => {
        expect(assessCompatibility(good(90), good(175.9)).level).toBe('green');
    });

    it('oltre il cap → rosso/rate-cap (120 vs 135)', () => {
        expect(assessCompatibility(good(120), good(135))).toEqual({ level: 'red', reason: 'rate-cap' });
    });

    it('bpm/offset/confidence mancanti o deboli → rosso col motivo giusto', () => {
        expect(assessCompatibility({ ...good(120), bpm: undefined }, good(118)).reason).toBe('missing-bpm');
        expect(assessCompatibility(good(120), { ...good(118), beatOffsetSec: undefined }).reason).toBe('missing-offset');
        expect(assessCompatibility(good(120), { ...good(118), bpmConfidence: 0.41 }).reason).toBe('low-confidence');
        expect(assessCompatibility(good(120), { ...good(118), bpmConfidence: undefined }).reason).toBe('low-confidence');
    });
});
