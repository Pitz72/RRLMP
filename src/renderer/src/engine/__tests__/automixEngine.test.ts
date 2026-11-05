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
    const goodOutgoing = { bpm: 120, beatOffsetSec: 0.5, bpmConfidence: 0.7, beatGridScore: 4, positionSec: 60, effectiveEndSec: 180 };
    const goodIncoming = { bpm: 118, beatOffsetSec: 0.3, bpmConfidence: 0.6, beatGridScore: 3.5, trimStartSec: 1.0 };

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
    const good = (bpm: number) => ({ bpm, beatOffsetSec: 0.3, bpmConfidence: 0.7, beatGridScore: 4 });

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

// ---------------------------------------------------------------------------
// v1.15.37 — passaggi rapidi (classifica veloce, medley): il brano in onda può
// suonare a un rate diverso da 1 perché è appena entrato con un mix.
// ---------------------------------------------------------------------------
import { incomingSeekForPhase, findMixNext } from '../automixEngine';

describe('planTransition — tempo UDITO dell\'uscente (v1.15.37)', () => {
    const beat = (bpm: number, beatOffsetSec = 0.2) => ({ bpm, beatOffsetSec, bpmConfidence: 0.8, beatGridScore: 4 });

    it('aggancia l\'entrante al tempo udito, non a quello nominale', () => {
        // B (120 BPM) è entrato sopra A (124): suona a 124/120 → si sente a 124
        const plan = planTransition({
            outgoing: { ...beat(120), positionSec: 20, playbackRate: 124 / 120 },
            incoming: beat(118),
        });
        expect(plan.mode).toBe('beatmatched');
        if (plan.mode !== 'beatmatched') return;
        expect(plan.rate).toBeCloseTo(124 / 118, 6);          // fino alla 1.15.36: 120/118
        expect(plan.outgoingRate).toBeCloseTo(124 / 120, 6);
        expect(plan.crossfadeSec).toBeCloseTo(8 * 60 / 124, 6); // 8 beat al tempo udito
    });

    it('il limite dell\'8% si valuta sul tempo udito', () => {
        // nominale 100 → udito 107: un entrante a 115 è al 7% (ok), sul nominale sarebbe al 13%
        const plan = planTransition({ outgoing: { ...beat(100), positionSec: 20, playbackRate: 1.07 }, incoming: beat(115) });
        expect(plan.mode).toBe('beatmatched');
        const nominal = planTransition({ outgoing: { ...beat(100), positionSec: 20 }, incoming: beat(115) });
        expect(nominal).toEqual({ mode: 'classic', reason: 'rate-cap' });
    });

    it('durata del mix a scelta: 4 beat (corto) per i passaggi rapidi', () => {
        const plan = planTransition({ outgoing: { ...beat(120), positionSec: 20 }, incoming: beat(120), options: { crossfadeBeats: 4 } });
        expect(plan.mode === 'beatmatched' && plan.crossfadeSec).toBeCloseTo(2, 6);
    });

    it('senza playbackRate si comporta come prima (rate 1)', () => {
        const plan = planTransition({ outgoing: { ...beat(120), positionSec: 20 }, incoming: beat(118) });
        expect(plan.mode === 'beatmatched' && plan.rate).toBeCloseTo(120 / 118, 6);
        expect(plan.mode === 'beatmatched' && plan.outgoingRate).toBe(1);
    });
});

describe('incomingSeekForPhase — battute allineate battito per battito', () => {
    /** Simula i due brani in tempo reale e misura lo scarto di fase su 16 beat (ms). */
    function maxPhaseErrorMs(outBpm: number, outRate: number, inBpm: number, posOutAtSeek: number) {
        const plan = planTransition({
            outgoing: { bpm: outBpm, beatOffsetSec: 0.21, bpmConfidence: 0.8, beatGridScore: 4, positionSec: posOutAtSeek - 0.3, playbackRate: outRate },
            incoming: { bpm: inBpm, beatOffsetSec: 0.13, bpmConfidence: 0.8, beatGridScore: 4 },
            options: { minLeadSec: 0.5 },
        });
        if (plan.mode !== 'beatmatched') throw new Error('atteso beat-match');
        // nel frattempo (load+play dell'entrante) l'uscente è avanzato: si corregge da qui
        const seek = incomingSeekForPhase(plan, posOutAtSeek, inBpm);
        let worst = 0;
        for (let k = 0; k < 16; k++) {
            const outBeat = plan.anchorBeatSec + k * 60 / outBpm;              // asse file uscente
            const tReal = (outBeat - posOutAtSeek) / outRate;                   // quando si sente
            const inPos = seek + tReal * plan.rate;                             // dove è l'entrante
            const inBeat = plan.incomingStartSec + k * 60 / inBpm;              // dove dovrebbe essere
            worst = Math.max(worst, phaseErrSec(inPos - inBeat, 60 / inBpm) / plan.rate * 1000);
        }
        return worst;
    }
    /** Scarto di FASE: conta di quanto si è fuori dal battito più vicino (l'entrante
     *  può essere avanzato di battiti interi per non partire da una posizione negativa). */
    function phaseErrSec(diff: number, period: number) {
        const d = ((diff % period) + period) % period;
        return Math.min(d, period - d);
    }

    it('uscente a velocità nominale: scarto nullo', () => {
        expect(maxPhaseErrorMs(124, 1, 120, 30)).toBeLessThan(0.01);
    });

    it('uscente appena entrato a rate 1.0333 (caso classifica veloce): scarto nullo', () => {
        expect(maxPhaseErrorMs(120, 124 / 120, 118, 12.4)).toBeLessThan(0.01);
    });

    it('con il calcolo della 1.15.36 lo stesso caso andava fuori fase', () => {
        // tempo nominale + nessuna correzione per il rate dell'uscente
        const outBpm = 120, outRate = 124 / 120, inBpm = 118, pos = 12.4;
        const old = planTransition({
            outgoing: { bpm: outBpm, beatOffsetSec: 0.21, bpmConfidence: 0.8, beatGridScore: 4, positionSec: pos - 0.3 },
            incoming: { bpm: inBpm, beatOffsetSec: 0.13, bpmConfidence: 0.8, beatGridScore: 4 },
            options: { minLeadSec: 0.5 },
        });
        if (old.mode !== 'beatmatched') throw new Error('atteso beat-match');
        const seek = old.incomingStartSec + (pos - old.anchorBeatSec) * old.rate;
        const k = 8; // a fine crossfade (8 beat)
        const tReal = (old.anchorBeatSec + k * 60 / outBpm - pos) / outRate;
        const errMs = phaseErrSec(seek + tReal * old.rate - (old.incomingStartSec + k * 60 / inBpm), 60 / inBpm) / old.rate * 1000;
        expect(errMs).toBeGreaterThan(40); // battute che «flammano»: sfasamento ben udibile
    });

    it('mai posizioni negative: si avanza di beat interi dell\'entrante', () => {
        const seek = incomingSeekForPhase({ anchorBeatSec: 10, incomingStartSec: 0.1, rate: 1, outgoingRate: 1 }, 9.2, 120);
        expect(seek).toBeGreaterThanOrEqual(0);
        // stessa fase: (seek - (0.1 - 0.8)) multiplo di 0.5 s
        const beats = (seek + 0.7) / 0.5;
        expect(Math.abs(beats - Math.round(beats))).toBeLessThan(1e-9);
    });
});

describe('findMixNext', () => {
    const list = [
        { id: 'a' }, { id: 'b', isMissing: true }, { id: 'c' }, { id: 'd' },
    ];
    it('il brano dopo quello in onda, saltando i file mancanti', () => {
        expect(findMixNext(list, 'a')?.id).toBe('c');
        expect(findMixNext(list, 'c')?.id).toBe('d');
    });
    it('fine scaletta → null; nulla in onda → primo disponibile', () => {
        expect(findMixNext(list, 'd')).toBeNull();
        expect(findMixNext(list, null)?.id).toBe('a');
        expect(findMixNext([{ id: 'x', isMissing: true }, { id: 'y' }], null)?.id).toBe('y');
    });
    it('brano in onda non in scaletta → null', () => {
        expect(findMixNext(list, 'zzz')).toBeNull();
    });
});

// v1.15.37 — soglia di affidabilità della griglia dei beat
describe('minGridScore — mai battute agganciate a una griglia incerta', () => {
    const b = (bpm: number, beatGridScore?: number) => ({ bpm, beatOffsetSec: 0.2, bpmConfidence: 0.8, ...(beatGridScore !== undefined ? { beatGridScore } : {}) });
    it('griglia sotto 2,5 su uno dei due brani → crossfade classico', () => {
        expect(planTransition({ outgoing: { ...b(120, 4), positionSec: 20 }, incoming: b(118, 2.1) })).toEqual({ mode: 'classic', reason: 'low-confidence' });
        expect(planTransition({ outgoing: { ...b(120, 1.6), positionSec: 20 }, incoming: b(118, 4) })).toEqual({ mode: 'classic', reason: 'low-confidence' });
        expect(assessCompatibility(b(120, 4), b(118, 2.1))).toEqual({ level: 'red', reason: 'low-confidence' });
    });
    it('brano analizzato prima della 1.15.37 (nessun punteggio) → crossfade classico', () => {
        expect(planTransition({ outgoing: { ...b(120), positionSec: 20 }, incoming: b(118, 4) })).toEqual({ mode: 'classic', reason: 'low-confidence' });
    });
    it('entrambe sopra soglia → mix a tempo', () => {
        expect(planTransition({ outgoing: { ...b(120, 2.5), positionSec: 20 }, incoming: b(118, 9) }).mode).toBe('beatmatched');
        expect(AUTOMIX_DEFAULTS.minGridScore).toBe(2.5);
    });
});
