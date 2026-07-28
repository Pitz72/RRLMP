import { describe, it, expect } from 'vitest';
import { validateLmpProjectData } from '../useProjectStore';

// v1.15.24 (M7) — sanificazione dei valori numerici incoerenti nei .lmp.
// Il validatore non deve MAI rifiutare un progetto per un numero storto: lo
// corregge e lo lascia caricabile. Qui si verifica che i trim impossibili non
// arrivino al motore audio.

const clip = (over: Record<string, unknown> = {}) => ({
    id: 'c1', name: 'brano', path: 'C:/audio/x.mp3', type: 'music',
    duration: 180, trimStart: 0, trimEnd: 0, volume: 1, ...over,
});
const project = (clips: Record<string, unknown>[]) => ({
    columns: [{ id: 'col-music', title: 'MUSICA', type: 'music', clips }],
});

const firstClip = (raw: unknown) =>
    (validateLmpProjectData(raw) as unknown as { columns: { clips: Record<string, unknown>[] }[] }).columns
        .find(c => (c as unknown as { id: string }).id === 'col-music')!.clips[0];

describe('validateLmpProjectData — trim incoerenti', () => {
    it('azzera i trim quando il taglio finale supera la durata', () => {
        // effectiveDuration = 0 → la clip finirebbe all'istante; in LOOP diventerebbe
        // un ciclo di riavvii continuo (StreamPlayer.ontimeupdate → restartLoop).
        const out = firstClip(project([clip({ duration: 180, trimEnd: 200 })]));
        expect(out.trimStart).toBe(0);
        expect(out.trimEnd).toBe(0);
    });

    it('azzera i trim quando insieme coprono tutta la clip', () => {
        const out = firstClip(project([clip({ duration: 100, trimStart: 60, trimEnd: 40 })]));
        expect(out.trimStart).toBe(0);
        expect(out.trimEnd).toBe(0);
    });

    it('lascia intatti i trim legittimi', () => {
        const out = firstClip(project([clip({ duration: 180, trimStart: 2.5, trimEnd: 3 })]));
        expect(out.trimStart).toBe(2.5);
        expect(out.trimEnd).toBe(3);
    });

    it('non tocca i trim se la durata non è ancora nota', () => {
        // duration 0 = clip non ancora analizzata: i trim verranno verificati dopo.
        const out = firstClip(project([clip({ duration: 0, trimStart: 5, trimEnd: 5 })]));
        expect(out.trimStart).toBe(5);
        expect(out.trimEnd).toBe(5);
    });

    it('riporta a zero i valori negativi o non finiti', () => {
        const out = firstClip(project([clip({ duration: 180, trimStart: -10, trimEnd: Number.NaN })]));
        expect(out.trimStart).toBe(0);
        expect(out.trimEnd).toBe(0);
    });
});

describe('validateLmpProjectData — struttura', () => {
    it('rifiuta una radice che non è un progetto', () => {
        expect(() => validateLmpProjectData(null)).toThrow();
        expect(() => validateLmpProjectData({ colonne: [] })).toThrow();
    });

    it('migra i .lmp a 5 colonne aggiungendo JINGLE e PROMO dopo gli ASSETS', () => {
        const raw = {
            columns: [
                { id: 'col-assets', title: 'ASSETS', type: 'asset', clips: [] },
                { id: 'col-music', title: 'MUSICA', type: 'music', clips: [] },
            ],
        };
        const ids = validateLmpProjectData(raw).columns.map(c => c.id);
        expect(ids).toEqual(['col-assets', 'col-jingle', 'col-promo', 'col-music']);
    });
});
