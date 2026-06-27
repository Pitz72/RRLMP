import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../useProjectStore';
import { makeClip, makeColumn } from './fixtures';

// v1.4.14 (#3): spostamento in blocco della multiselezione tra colonne.
// moveSelectedClips è un'azione pura dello store: rimuove le clip selezionate da
// TUTTE le colonne e le reinserisce nella destinazione, aggiornando type/colore
// per quelle che cambiano colonna e preservando l'ordine visivo.

const idsIn = (colId: string) =>
    useProjectStore.getState().columns.find(c => c.id === colId)!.clips.map(c => c.id);

describe('moveSelectedClips', () => {
    beforeEach(() => {
        const music = makeColumn('col-music', 'music', [
            makeClip({ id: 'm1' }), makeClip({ id: 'm2' }), makeClip({ id: 'm3' }),
        ]);
        const voice = makeColumn('col-voice', 'voice', [
            makeClip({ id: 'v1', type: 'voice', color: '#111' }),
        ]);
        useProjectStore.setState({ columns: [music, voice], selectedClipIds: [], isDirty: false });
    });

    it('sposta in blocco clip da più colonne nella destinazione (accodando)', () => {
        useProjectStore.setState({ selectedClipIds: ['m1', 'v1'] });
        useProjectStore.getState().moveSelectedClips('col-voice', null);

        // m1 e v1 escono dalle origini e vengono reinseriti in coda nell'ordine
        // stabile di raccolta (per colonna: prima m1 da music, poi v1 da voice).
        // Anche v1, già in dest ma selezionata, viene riposizionata.
        expect(idsIn('col-music')).toEqual(['m2', 'm3']);
        expect(idsIn('col-voice')).toEqual(['m1', 'v1']);
    });

    it('inserisce prima della clip-bersaglio (overId)', () => {
        useProjectStore.setState({ selectedClipIds: ['m3'] });
        useProjectStore.getState().moveSelectedClips('col-music', 'm1');
        expect(idsIn('col-music')).toEqual(['m3', 'm1', 'm2']);
    });

    it('aggiorna type e colore per le clip che cambiano colonna', () => {
        useProjectStore.setState({ selectedClipIds: ['m1'] });
        useProjectStore.getState().moveSelectedClips('col-voice', null);
        const moved = useProjectStore.getState().columns
            .find(c => c.id === 'col-voice')!.clips.find(c => c.id === 'm1')!;
        expect(moved.type).toBe('voice');
        expect(moved.color).toBe('#888888'); // colore base di col-voice (makeColumn)
    });

    it('riordino intra-colonna non altera type/colore', () => {
        useProjectStore.setState({ selectedClipIds: ['m1'] });
        useProjectStore.getState().moveSelectedClips('col-music', 'm3');
        const moved = useProjectStore.getState().columns
            .find(c => c.id === 'col-music')!.clips.find(c => c.id === 'm1')!;
        expect(moved.type).toBe('music');
        expect(idsIn('col-music')).toEqual(['m2', 'm1', 'm3']);
    });

    it('no-op senza selezione', () => {
        useProjectStore.getState().moveSelectedClips('col-voice', null);
        expect(idsIn('col-music')).toEqual(['m1', 'm2', 'm3']);
        expect(idsIn('col-voice')).toEqual(['v1']);
    });
});
