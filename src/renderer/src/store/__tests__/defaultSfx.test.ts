import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectStore } from '../useProjectStore';
import { useAudioStore } from '../useAudioStore';
import { populateDefaultFxIfVirgin } from '../../utils/defaultSfx';

// v1.10.9 — regressione del bug dev 2026-07-02: "Nuovo Progetto" (resetProject)
// svuotava le colonne DOPO il popolamento di avvio → pad FX vuoto. Il fix
// estrae populateDefaultFxIfVirgin e la richiama anche dopo il reset: qui
// testiamo la funzione (popola solo su progetto vergine, azzera dirty/undo).

const SOUNDS = [
    { title: 'Applausi', path: 'C:/userData/default-sfx/Applausi.wav' },
    { title: 'Gong', path: 'C:/userData/default-sfx/Gong.ogg' },
];

const getSfxCol = () => useProjectStore.getState().columns.find((c) => c.type === 'sfx')!;

describe('populateDefaultFxIfVirgin (v1.10.9)', () => {
    beforeEach(() => {
        useProjectStore.getState().resetProject();
        // stub IPC (il setup globale non conosce restoreDefaultSfx) e loadClip
        // (il vero loadClip toccherebbe StreamPlayer/metadata IPC)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).electron = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(window as any).electron,
            restoreDefaultSfx: vi.fn(async () => ({ success: true, sounds: SOUNDS })),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useAudioStore.setState({ loadClip: vi.fn(async () => {}) } as any);
    });

    it('popola la colonna FX vuota su progetto vergine (scenario "Nuovo Progetto")', async () => {
        expect(getSfxCol().clips.length).toBe(0);
        await populateDefaultFxIfVirgin();
        const clips = getSfxCol().clips;
        expect(clips.length).toBe(2);
        expect(clips.map((c) => c.name)).toEqual(['Applausi', 'Gong']);
        expect(clips.every((c) => c.type === 'sfx')).toBe(true);
    });

    it('dopo il popolamento il progetto resta "pulito": niente isDirty né undo spuri', async () => {
        await populateDefaultFxIfVirgin();
        expect(useProjectStore.getState().isDirty).toBe(false);
        expect(useProjectStore.getState().undoStack.length).toBe(0);
    });

    it('NON tocca un progetto con un .lmp caricato', async () => {
        useProjectStore.setState({ currentFilePath: 'C:/progetti/show.lmp' });
        await populateDefaultFxIfVirgin();
        expect(getSfxCol().clips.length).toBe(0);
    });

    it('NON tocca una colonna FX già popolata', async () => {
        useProjectStore.getState().addClipFromPath(getSfxCol().id, 'C:/mio/effetto.wav');
        await populateDefaultFxIfVirgin();
        expect(getSfxCol().clips.length).toBe(1);
        expect(getSfxCol().clips[0].name).toBe('effetto');
    });

    it('è un no-op se la libreria non è disponibile (IPC in errore)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).electron.restoreDefaultSfx = vi.fn(async () => ({ success: false, error: 'boom' }));
        await populateDefaultFxIfVirgin();
        expect(getSfxCol().clips.length).toBe(0);
    });
});
