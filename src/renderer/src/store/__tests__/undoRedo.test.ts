import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../useProjectStore';
import { makeColumn } from './fixtures';

// v1.5.0: Undo/Redo della playlist. Lo snapshot viene catturato dalle azioni
// utente (qui setColumnColor) PRIMA della modifica; undo/redo navigano gli stack.

const colorOf = (colId: string) =>
    useProjectStore.getState().columns.find(c => c.id === colId)?.customColor;

describe('Undo/Redo playlist', () => {
    beforeEach(() => {
        useProjectStore.setState({
            columns: [makeColumn('col-music', 'music', []), makeColumn('col-voice', 'voice', [])],
            undoStack: [], redoStack: [], selectedClipIds: [], isDirty: false,
        });
    });

    it('undo ripristina lo stato precedente, redo lo riapplica', () => {
        const s = useProjectStore.getState();
        s.setColumnColor('col-music', '#aaaaaa');
        expect(colorOf('col-music')).toBe('#aaaaaa');
        expect(useProjectStore.getState().undoStack.length).toBe(1);

        useProjectStore.getState().undo();
        expect(colorOf('col-music')).toBeUndefined();
        expect(useProjectStore.getState().redoStack.length).toBe(1);

        useProjectStore.getState().redo();
        expect(colorOf('col-music')).toBe('#aaaaaa');
    });

    it('più passi in sequenza (LIFO)', () => {
        const s = useProjectStore.getState();
        s.setColumnColor('col-music', '#111111');
        useProjectStore.getState().setColumnColor('col-music', '#222222');
        expect(colorOf('col-music')).toBe('#222222');

        useProjectStore.getState().undo();
        expect(colorOf('col-music')).toBe('#111111');
        useProjectStore.getState().undo();
        expect(colorOf('col-music')).toBeUndefined();
    });

    it('una nuova modifica dopo undo svuota il redo', () => {
        const s = useProjectStore.getState();
        s.setColumnColor('col-music', '#111111');
        useProjectStore.getState().undo();
        expect(useProjectStore.getState().redoStack.length).toBe(1);

        useProjectStore.getState().setColumnColor('col-voice', '#333333');
        expect(useProjectStore.getState().redoStack.length).toBe(0);
    });

    it('undo/redo sono no-op con stack vuoti', () => {
        useProjectStore.getState().undo();
        useProjectStore.getState().redo();
        expect(colorOf('col-music')).toBeUndefined();
        expect(useProjectStore.getState().undoStack.length).toBe(0);
    });

    it('le azioni runtime non instrumentate non sporcano la cronologia', () => {
        // updateClip NON chiama _snapshot (condivisa con scritture runtime): nessuno snapshot.
        useProjectStore.setState({
            columns: [makeColumn('col-music', 'music', [
                { id: 'm1', name: 'x', path: 'x', type: 'music', color: '#000', volume: 1, pan: 0,
                  isLooping: false, isPlaying: false, duration: 0, currentTime: 0,
                  nextAction: 'stop', behavior: 'normal', duckingRole: 'none', fadeIn: 0, fadeOut: 0 },
            ])],
            undoStack: [], redoStack: [],
        });
        useProjectStore.getState().updateClip('col-music', 'm1', { isAnalyzing: true, hasPlayed: true });
        expect(useProjectStore.getState().undoStack.length).toBe(0);
    });
});
