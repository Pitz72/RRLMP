import { describe, it, expect } from 'vitest';
import { capPlayoutLog } from '../useAudioStore';
import { PlayoutLogEntry } from '../../types';

// Blocco 1 (v1.4.5) — smoke test: valida la toolchain Vitest + jsdom + import del
// motore audio. capPlayoutLog e' la funzione piu' pura del modulo (cap FIFO a 2000).

const entry = (i: number): PlayoutLogEntry => ({
    id: `e${i}`,
    clipId: `c${i}`,
    clipName: `clip ${i}`,
    clipType: 'music',
    startTime: i,
});

describe('capPlayoutLog', () => {
    it('lascia invariato un log sotto la soglia', () => {
        const log = [entry(1), entry(2), entry(3)];
        expect(capPlayoutLog(log)).toBe(log);
    });

    it('lascia invariato un log esattamente a 2000 entry', () => {
        const log = Array.from({ length: 2000 }, (_, i) => entry(i));
        expect(capPlayoutLog(log)).toBe(log);
        expect(capPlayoutLog(log)).toHaveLength(2000);
    });

    it('tronca a 2000 tenendo le entry piu' + ' recenti (slice -2000)', () => {
        const log = Array.from({ length: 2050 }, (_, i) => entry(i));
        const capped = capPlayoutLog(log);
        expect(capped).toHaveLength(2000);
        // le prime 50 (le piu' vecchie) sono droppate
        expect(capped[0].clipId).toBe('c50');
        expect(capped[capped.length - 1].clipId).toBe('c2049');
    });
});
