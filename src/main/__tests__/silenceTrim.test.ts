import { describe, it, expect } from 'vitest';
import {
    BlockLevelAccumulator, computeEdgeTrim, parseSilenceRegions, pickSmartCues,
    LEAD_MARGIN_SEC, TAIL_MARGIN_SEC, type BlockLevels,
} from '../silenceTrim';

// Inviluppo sintetico a blocchi da 10 ms: ogni segmento ha durata, energia (dBFS RMS)
// e picco (dBFS). -Infinity = silenzio digitale.
interface Seg { sec: number; rmsDb: number; peakDb?: number }
function levelsFrom(segs: Seg[]): BlockLevels {
    const peaks: number[] = [];
    const meanSquares: number[] = [];
    for (const s of segs) {
        const n = Math.round(s.sec * 100);
        const ms = Number.isFinite(s.rmsDb) ? Math.pow(10, s.rmsDb / 10) : 0;
        const pkDb = s.peakDb ?? s.rmsDb + 10;
        const pk = Number.isFinite(pkDb) ? Math.pow(10, pkDb / 20) : 0;
        for (let i = 0; i < n; i++) { meanSquares.push(ms); peaks.push(pk); }
    }
    return { peaks, meanSquares, blockSec: 0.01, durationSec: meanSquares.length * 0.01 };
}
const SILENCE: Seg = { sec: 0, rmsDb: -Infinity, peakDb: -Infinity };
const silence = (sec: number): Seg => ({ ...SILENCE, sec });
const music = (sec: number, rmsDb = -14): Seg => ({ sec, rmsDb, peakDb: rmsDb + 12 });

describe('computeEdgeTrim — si taglia solo ai bordi', () => {
    it('una pausa interna NON diventa il punto di partenza (caso «Splash! Boing!», 105 s)', () => {
        const r = computeEdgeTrim(levelsFrom([music(105.3), silence(0.3), music(137.2)]));
        expect(r.trimStart).toBe(0);
        expect(r.trimEnd).toBe(0);
    });

    it('una pausa dopo metà brano con finale secco NON taglia la coda (caso «Le tengo io», 87 s)', () => {
        const r = computeEdgeTrim(levelsFrom([music(156), silence(0.4), music(87)]));
        expect(r.trimEnd).toBe(0);
    });

    // La finestra d'energia da 50 ms centrata «vede» il suono 20 ms prima dell'attacco
    // e 20 ms dopo la fine: il taglio cade sempre dalla parte della musica, mai dentro.
    it('silenzio vero in apertura: taglio fino al primo suono meno il margine, mai oltre l\'attacco', () => {
        const r = computeEdgeTrim(levelsFrom([silence(1.2), music(60)]));
        expect(r.contentStartSec).toBeLessThanOrEqual(1.2);
        expect(r.contentStartSec).toBeGreaterThanOrEqual(1.17);
        expect(r.trimStart).toBeCloseTo(r.contentStartSec - LEAD_MARGIN_SEC, 6);
    });

    it('silenzio vero in coda: taglio dopo l\'ultimo suono più il margine, mai prima della fine', () => {
        const r = computeEdgeTrim(levelsFrom([music(60), silence(2)]));
        expect(r.contentEndSec).toBeGreaterThanOrEqual(60);
        expect(r.contentEndSec).toBeLessThanOrEqual(60.03);
        expect(r.trimEnd).toBeCloseTo(r.durationSec - r.contentEndSec - TAIL_MARGIN_SEC, 6);
    });

    it('musica dall\'inizio alla fine: nessun taglio', () => {
        const r = computeEdgeTrim(levelsFrom([music(30)]));
        expect(r.trimStart).toBe(0);
        expect(r.trimEnd).toBe(0);
        expect(r.allSilent).toBe(false);
    });

    it('file muto: allSilent', () => {
        expect(computeEdgeTrim(levelsFrom([silence(5)])).allSilent).toBe(true);
    });

    it('la rampa di rumore negli ultimi 40 ms non blocca il taglio di coda', () => {
        const r = computeEdgeTrim(levelsFrom([
            music(60), silence(2),
            { sec: 0.02, rmsDb: -80, peakDb: -70 }, { sec: 0.02, rmsDb: -65, peakDb: -52 },
        ]));
        expect(r.trimEnd).toBeGreaterThan(1.8);
    });

    it('un colpo vero a metà di quegli ultimi istanti resta (finale secco a fine file)', () => {
        const r = computeEdgeTrim(levelsFrom([music(60), silence(1), music(0.3)]));
        expect(r.trimEnd).toBe(0);
    });

    it('suoni radi con picco netto ma poca energia (sussurri) restano in coda', () => {
        const whisper: Seg = { sec: 0.1, rmsDb: -75, peakDb: -44 };
        const r = computeEdgeTrim(levelsFrom([
            music(60, -19), silence(0.5), whisper, silence(0.5), whisper, silence(1),
        ]));
        // l'ultimo sussurro finisce a 61,2 s: la coda tolta è solo il silenzio dopo
        expect(r.contentEndSec).toBeCloseTo(61.2, 2);
    });

    it('un tappeto morbido d\'apertura sopra soglia resta, anche se stabile', () => {
        const r = computeEdgeTrim(levelsFrom([{ sec: 1.5, rmsDb: -56, peakDb: -50 }, music(60, -13)]));
        expect(r.trimStart).toBe(0);
    });

    it('fruscio stabile in coda: si toglie, ma mai sopra rif − 40 dB', () => {
        const levels = levelsFrom([
            music(60, -16),
            { sec: 1.0, rmsDb: -52, peakDb: -45 }, // dissolvenza ancora udibile: resta
            { sec: 2.0, rmsDb: -60, peakDb: -57 }, // fruscio stabile: va tolto
        ]);
        const r = computeEdgeTrim(levels);
        expect(r.contentEndSec).toBeCloseTo(61, 1);
        expect(r.tailThresholdDb).toBeLessThanOrEqual(r.referenceDb - 40 + 1e-9);
    });

    it('in apertura la soglia non sale mai sul fondo: un fondo sopra soglia base resta', () => {
        // rif −12 → soglia base −57: un fondo stabile a −55 è sopra, quindi resta
        const r = computeEdgeTrim(levelsFrom([{ sec: 2, rmsDb: -55, peakDb: -52 }, music(60, -12)]));
        expect(r.headThresholdDb).toBeCloseTo(r.referenceDb - 45, 6);
        expect(r.trimStart).toBe(0);
    });
});

describe('BlockLevelAccumulator', () => {
    function pcmStereo(frames: Array<[number, number]>): Buffer {
        const b = Buffer.alloc(frames.length * 4);
        frames.forEach(([l, r], i) => { b.writeInt16LE(l, i * 4); b.writeInt16LE(r, i * 4 + 2); });
        return b;
    }

    it('frame spezzati tra chunk danno lo stesso risultato di un chunk unico', () => {
        const frames: Array<[number, number]> = Array.from({ length: 1000 }, (_, i) => [((i * 37) % 2000) - 1000, (i % 7) * 300]);
        const whole = pcmStereo(frames);
        const a = new BlockLevelAccumulator(24000, 2, 240);
        a.push(whole);
        const b = new BlockLevelAccumulator(24000, 2, 240);
        for (let off = 0; off < whole.length; off += 7) b.push(whole.subarray(off, Math.min(whole.length, off + 7)));
        expect(b.finalize()).toEqual(a.finalize());
    });

    it('durata esatta dai frame e picco massimo tra i canali', () => {
        const acc = new BlockLevelAccumulator(24000, 2, 240);
        acc.push(pcmStereo([[0, -16384], ...Array.from({ length: 479 }, () => [0, 0] as [number, number])]));
        const l = acc.finalize();
        expect(l.durationSec).toBeCloseTo(480 / 24000, 9);
        expect(l.peaks.length).toBe(2);
        expect(l.peaks[0]).toBeCloseTo(0.5, 6);
        expect(l.peaks[1]).toBe(0);
    });
});

describe('Smart Cues — solo tratti quieti attaccati ai bordi', () => {
    it('parseSilenceRegions accoppia inizio/fine e accetta un silenzio aperto fino a EOF', () => {
        const regions = parseSilenceRegions('silence_start: 0\r[x] silence_end: 8.5 | silence_duration: 8.5\nsilence_start: 190.2\n');
        expect(regions).toEqual([{ start: 0, end: 8.5 }, { start: 190.2, end: null }]);
    });

    it('un tratto quieto interno dopo il 40% NON diventa outro se la musica riparte', () => {
        const cues = pickSmartCues([{ start: 120, end: 121 }], 240);
        expect(cues.outroCue).toBe(0);
    });

    it('la dissolvenza finale che arriva a fine file diventa outro', () => {
        expect(pickSmartCues([{ start: 230, end: 240 }], 240).outroCue).toBe(230);
        expect(pickSmartCues([{ start: 230, end: null }], 240).outroCue).toBe(230);
    });

    it('intro solo se il tratto quieto parte dall\'inizio del file', () => {
        expect(pickSmartCues([{ start: 0, end: 8 }], 240).introCue).toBe(8);
        expect(pickSmartCues([{ start: 30, end: 31 }], 240).introCue).toBe(0);
    });
});
