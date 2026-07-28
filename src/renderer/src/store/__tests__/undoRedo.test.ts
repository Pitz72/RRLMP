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

    // v1.15.18 — le scritture di runtime non marcano più il progetto come "da salvare".
    it('updateClip con { runtime: true } non sporca isDirty', () => {
        useProjectStore.setState({
            columns: [makeColumn('col-music', 'music', [
                { id: 'm1', name: 'x', path: 'x', type: 'music', color: '#000', volume: 1, pan: 0,
                  isLooping: false, isPlaying: false, duration: 0, currentTime: 0,
                  nextAction: 'stop', behavior: 'normal', duckingRole: 'none', fadeIn: 0, fadeOut: 0 },
            ])],
            isDirty: false,
        });
        useProjectStore.getState().updateClip('col-music', 'm1', { silenceCheckedV2: true, trimStart: 1.2 }, { runtime: true });
        expect(useProjectStore.getState().isDirty).toBe(false);
        // ...e il dato è stato comunque scritto.
        expect(useProjectStore.getState().columns[0].clips[0].trimStart).toBe(1.2);
    });

    it('updateClip senza opts continua a sporcare isDirty (default conservativo)', () => {
        useProjectStore.setState({
            columns: [makeColumn('col-music', 'music', [
                { id: 'm1', name: 'x', path: 'x', type: 'music', color: '#000', volume: 1, pan: 0,
                  isLooping: false, isPlaying: false, duration: 0, currentTime: 0,
                  nextAction: 'stop', behavior: 'normal', duckingRole: 'none', fadeIn: 0, fadeOut: 0 },
            ])],
            isDirty: false,
        });
        useProjectStore.getState().updateClip('col-music', 'm1', { volume: 0.5 });
        expect(useProjectStore.getState().isDirty).toBe(true);
    });

    // v1.15.22 — "Salva con nome" registra il percorso e nient'altro.
    it('setCurrentFilePath aggiorna il percorso senza toccare le clip', () => {
        useProjectStore.setState({
            columns: [makeColumn('col-music', 'music', [
                { id: 'm1', name: 'x', path: 'C:\\assente\\x.mp3', type: 'music', color: '#000', volume: 1, pan: 0,
                  isLooping: false, isPlaying: false, duration: 0, currentTime: 0,
                  nextAction: 'stop', behavior: 'normal', duckingRole: 'none', fadeIn: 0, fadeOut: 0,
                  isMissing: true, silenceCheckedV2: true },
            ])],
            currentFilePath: null,
            undoStack: [], redoStack: [],
        });
        useProjectStore.getState().setCurrentFilePath('D:\\Progetti\\show.lmp');

        const st = useProjectStore.getState();
        expect(st.currentFilePath).toBe('D:\\Progetti\\show.lmp');
        // Il badge "file mancante" deve restare: prima il salvataggio passava da
        // loadProject e lo azzerava, facendo sembrare sane clip che non suonano.
        expect(st.columns[0].clips[0].isMissing).toBe(true);
        expect(st.columns[0].clips[0].silenceCheckedV2).toBe(true);
        expect(st.undoStack.length).toBe(0);
    });

    it('una modifica utente precedente non viene cancellata da una scrittura runtime', () => {
        useProjectStore.setState({
            columns: [makeColumn('col-music', 'music', [
                { id: 'm1', name: 'x', path: 'x', type: 'music', color: '#000', volume: 1, pan: 0,
                  isLooping: false, isPlaying: false, duration: 0, currentTime: 0,
                  nextAction: 'stop', behavior: 'normal', duckingRole: 'none', fadeIn: 0, fadeOut: 0 },
            ])],
            isDirty: true,
        });
        useProjectStore.getState().updateClip('col-music', 'm1', { bpm: 120 }, { runtime: true });
        expect(useProjectStore.getState().isDirty).toBe(true);
    });
});
