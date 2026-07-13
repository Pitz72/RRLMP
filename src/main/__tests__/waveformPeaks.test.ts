import { describe, it, expect } from 'vitest';
import { PeakAccumulator, reduceToBars, WAVEFORM_WINDOW_SAMPLES } from '../waveformPeaks';

// Costruisce un Buffer PCM s16le da ampiezze float (-1..1).
const s16le = (samples: number[]): Buffer => {
    const buf = Buffer.alloc(samples.length * 2);
    samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
    return buf;
};

describe('PeakAccumulator — inviluppo max(|x|) per finestre da 10 ms (v1.15.12)', () => {
    it('una finestra piena produce il picco della finestra', () => {
        const acc = new PeakAccumulator();
        const samples = new Array(WAVEFORM_WINDOW_SAMPLES).fill(0.1);
        samples[13] = -0.8; // il picco è un valore assoluto, anche negativo
        acc.push(s16le(samples));
        const env = acc.finalize();
        expect(env).toHaveLength(1);
        expect(env[0]).toBeCloseTo(0.8, 2);
    });

    it('la finestra residua parziale viene chiusa da finalize()', () => {
        const acc = new PeakAccumulator();
        acc.push(s16le(new Array(WAVEFORM_WINDOW_SAMPLES + 10).fill(0.5)));
        expect(acc.finalize()).toHaveLength(2);
    });

    it('campione a 16 bit spezzato tra due chunk: stesso risultato di un chunk unico', () => {
        const samples = Array.from({ length: WAVEFORM_WINDOW_SAMPLES * 3 }, (_, i) => (i % 7 === 0 ? -0.9 : 0.2));
        const whole = s16le(samples);

        const single = new PeakAccumulator();
        single.push(whole);

        const split = new PeakAccumulator();
        // Tagli a offset DISPARI: ogni campione a cavallo arriva spezzato in due chunk.
        split.push(whole.subarray(0, 33));
        split.push(whole.subarray(33, 101));
        split.push(whole.subarray(101));

        expect(split.finalize()).toEqual(single.finalize());
    });

    it('stream vuoto → inviluppo vuoto', () => {
        expect(new PeakAccumulator().finalize()).toEqual([]);
    });
});

describe('reduceToBars — riduzione a barre di pari durata + normalizzazione al picco', () => {
    it('profilo forte→piano preservato e normalizzato (la barra più alta tocca 1.0)', () => {
        const envelope = [...new Array(100).fill(0.8), ...new Array(100).fill(0.2)];
        const bars = reduceToBars(envelope, 10);
        expect(bars).toHaveLength(10);
        // Prima metà normalizzata a 1.0 (0.8/0.8), seconda a 0.25 (0.2/0.8):
        // il rapporto tra le sezioni del brano resta fedele.
        bars.slice(0, 5).forEach(b => expect(b).toBeCloseTo(1.0, 5));
        bars.slice(5).forEach(b => expect(b).toBeCloseTo(0.25, 5));
    });

    it('ogni barra è il MAX del suo gruppo (i transienti non si perdono nella media)', () => {
        const envelope = new Array(50).fill(0.1);
        envelope[27] = 1.0; // colpo isolato
        const bars = reduceToBars(envelope, 5);
        expect(Math.max(...bars)).toBe(1.0);
        expect(bars[2]).toBe(1.0); // indice 27 → terza barra (gruppi da 10)
    });

    it('mai più barre dei punti disponibili, mai più del target', () => {
        expect(reduceToBars(new Array(7).fill(0.5), 200)).toHaveLength(7);
        expect(reduceToBars(new Array(100000).fill(0.5), 200)).toHaveLength(200);
    });

    it('file in pratica silenzioso: nessuna amplificazione del rumore di fondo', () => {
        const bars = reduceToBars(new Array(400).fill(0.0005), 10);
        bars.forEach(b => expect(b).toBeLessThanOrEqual(0.0005));
    });

    it('inviluppo vuoto → nessuna barra', () => {
        expect(reduceToBars([], 200)).toEqual([]);
    });
});
