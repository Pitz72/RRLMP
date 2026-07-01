import { describe, it, expect } from 'vitest';
import { sanitizeRemoteClipState } from '../remoteClipState';

describe('sanitizeRemoteClipState', () => {
    it('accetta un array valido e normalizza isPlaying a booleano', () => {
        const out = sanitizeRemoteClipState([
            { id: 'a', name: 'Brano A', isPlaying: true },
            { id: 'b', name: 'Brano B' }
        ]);
        expect(out).toEqual([
            { id: 'a', name: 'Brano A', isPlaying: true },
            { id: 'b', name: 'Brano B', isPlaying: false }
        ]);
    });

    it('scarta elementi senza id o name validi', () => {
        const out = sanitizeRemoteClipState([
            { id: '', name: 'x' },
            { id: 'ok', name: 123 },
            { name: 'senza id' },
            { id: 'c', name: 'Valida' }
        ]);
        expect(out).toEqual([{ id: 'c', name: 'Valida', isPlaying: false }]);
    });

    it('ritorna array vuoto per input non-array', () => {
        expect(sanitizeRemoteClipState(null)).toEqual([]);
        expect(sanitizeRemoteClipState(undefined)).toEqual([]);
        expect(sanitizeRemoteClipState('not an array')).toEqual([]);
        expect(sanitizeRemoteClipState({ id: 'a' })).toEqual([]);
    });

    it('tronca a MAX_CLIPS (500) elementi', () => {
        const input = Array.from({ length: 600 }, (_, i) => ({ id: 'id' + i, name: 'n' + i }));
        const out = sanitizeRemoteClipState(input);
        expect(out.length).toBe(500);
    });
});
