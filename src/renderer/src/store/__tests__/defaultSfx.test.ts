import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectStore } from '../useProjectStore';
import { useAudioStore } from '../useAudioStore';
import { populateDefaultFxIfPadEmpty } from '../../utils/defaultSfx';

// v1.10.9 — regressione del bug dev 2026-07-02: "Nuovo Progetto" (resetProject)
// svuotava le colonne DOPO il popolamento di avvio → pad FX vuoto.
// v1.11.2 — semantica generalizzata (richiesta utente): il pad si popola coi
// default OGNI volta che è vuoto, anche su un .lmp caricato (prima serviva un
// reset manuale). La guardia anti-race non è più "nessun file caricato" ma
// "currentFilePath invariato tra prima e dopo l'IPC".

const SOUNDS = [
    { title: 'Applausi', path: 'C:/userData/default-sfx/Applausi.wav' },
    { title: 'Gong', path: 'C:/userData/default-sfx/Gong.ogg' },
];

const getSfxCol = () => useProjectStore.getState().columns.find((c) => c.type === 'sfx')!;

describe('populateDefaultFxIfPadEmpty (v1.10.9 → v1.11.2)', () => {
    beforeEach(() => {
        useProjectStore.getState().resetProject();
        useProjectStore.setState({ currentFilePath: null });
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
        await populateDefaultFxIfPadEmpty();
        const clips = getSfxCol().clips;
        expect(clips.length).toBe(2);
        expect(clips.map((c) => c.name)).toEqual(['Applausi', 'Gong']);
        expect(clips.every((c) => c.type === 'sfx')).toBe(true);
    });

    it('dopo il popolamento il progetto resta "pulito": niente isDirty né undo spuri', async () => {
        await populateDefaultFxIfPadEmpty();
        expect(useProjectStore.getState().isDirty).toBe(false);
        expect(useProjectStore.getState().undoStack.length).toBe(0);
    });

    it('v1.11.2: popola ANCHE con un .lmp caricato, se il pad è vuoto', async () => {
        useProjectStore.setState({ currentFilePath: 'C:/progetti/show.lmp' });
        await populateDefaultFxIfPadEmpty();
        expect(getSfxCol().clips.length).toBe(2);
        expect(useProjectStore.getState().isDirty).toBe(false);
    });

    it('v1.11.2: abortisce se il progetto CAMBIA durante l\'IPC (anti-race open-file)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).electron.restoreDefaultSfx = vi.fn(async () => {
            // simula un load .lmp arrivato mentre l'IPC era in volo
            useProjectStore.setState({ currentFilePath: 'C:/progetti/altro.lmp' });
            return { success: true, sounds: SOUNDS };
        });
        await populateDefaultFxIfPadEmpty();
        expect(getSfxCol().clips.length).toBe(0);
    });

    it('NON tocca una colonna FX già popolata', async () => {
        useProjectStore.getState().addClipFromPath(getSfxCol().id, 'C:/mio/effetto.wav');
        await populateDefaultFxIfPadEmpty();
        expect(getSfxCol().clips.length).toBe(1);
        expect(getSfxCol().clips[0].name).toBe('effetto');
    });

    it('è un no-op se la libreria non è disponibile (IPC in errore)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).electron.restoreDefaultSfx = vi.fn(async () => ({ success: false, error: 'boom' }));
        await populateDefaultFxIfPadEmpty();
        expect(getSfxCol().clips.length).toBe(0);
    });
});
