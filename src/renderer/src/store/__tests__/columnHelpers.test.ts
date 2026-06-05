import { describe, it, expect, afterEach, vi } from 'vitest';
import { pickRandomFromColumn, getColumnForClip } from '../useAudioStore';
import { useProjectStore } from '../useProjectStore';
import { makeClip, makeColumn } from './fixtures';

// Blocco 5 (v1.4.5) — helper di colonna: pickRandomFromColumn (random + anti-repeat,
// salta clip mancanti) e getColumnForClip (lookup colonna).

afterEach(() => {
    vi.restoreAllMocks();
    useProjectStore.setState({ columns: [] });
});

describe('pickRandomFromColumn', () => {
    it('ritorna null se la colonna non esiste', () => {
        useProjectStore.setState({ columns: [] });
        expect(pickRandomFromColumn('col-jingle', null)).toBeNull();
    });

    it('ritorna null se la colonna e\' vuota', () => {
        useProjectStore.setState({ columns: [makeColumn('col-jingle', 'asset', [])] });
        expect(pickRandomFromColumn('col-jingle', null)).toBeNull();
    });

    it('ritorna null se tutte le clip sono mancanti', () => {
        const a = makeClip({ id: 'a', isMissing: true });
        const b = makeClip({ id: 'b', isMissing: true });
        useProjectStore.setState({ columns: [makeColumn('col-jingle', 'asset', [a, b])] });
        expect(pickRandomFromColumn('col-jingle', null)).toBeNull();
    });

    it('con un solo candidato lo ritorna anche se coincide con lastId', () => {
        const a = makeClip({ id: 'a' });
        useProjectStore.setState({ columns: [makeColumn('col-jingle', 'asset', [a])] });
        expect(pickRandomFromColumn('col-jingle', 'a')?.id).toBe('a');
    });

    it('salta la clip mancante e ritorna l\'unica valida', () => {
        const a = makeClip({ id: 'a', isMissing: true });
        const b = makeClip({ id: 'b' });
        useProjectStore.setState({ columns: [makeColumn('col-jingle', 'asset', [a, b])] });
        expect(pickRandomFromColumn('col-jingle', null)?.id).toBe('b');
    });

    it('anti-repeat: con due candidati evita lastId', () => {
        const a = makeClip({ id: 'a' });
        const b = makeClip({ id: 'b' });
        useProjectStore.setState({ columns: [makeColumn('col-jingle', 'asset', [a, b])] });
        vi.spyOn(Math, 'random').mockReturnValue(0); // primo elemento del pool filtrato
        // lastId = 'a' → pool = ['b'] → ritorna b
        expect(pickRandomFromColumn('col-jingle', 'a')?.id).toBe('b');
        // lastId = 'b' → pool = ['a'] → ritorna a
        expect(pickRandomFromColumn('col-jingle', 'b')?.id).toBe('a');
    });

    it('con lastId null pesca via indice random sull\'intero set', () => {
        const a = makeClip({ id: 'a' });
        const b = makeClip({ id: 'b' });
        useProjectStore.setState({ columns: [makeColumn('col-jingle', 'asset', [a, b])] });
        const spy = vi.spyOn(Math, 'random');
        spy.mockReturnValue(0);
        expect(pickRandomFromColumn('col-jingle', null)?.id).toBe('a');
        spy.mockReturnValue(0.99);
        expect(pickRandomFromColumn('col-jingle', null)?.id).toBe('b');
    });
});

describe('getColumnForClip', () => {
    it('ritorna l\'id della colonna che contiene la clip', () => {
        const a = makeClip({ id: 'a' });
        const b = makeClip({ id: 'b' });
        useProjectStore.setState({
            columns: [makeColumn('col-music', 'music', [a]), makeColumn('col-assets', 'asset', [b])],
        });
        expect(getColumnForClip('a')).toBe('col-music');
        expect(getColumnForClip('b')).toBe('col-assets');
    });

    it('ritorna null se la clip non e\' in nessuna colonna', () => {
        useProjectStore.setState({ columns: [makeColumn('col-music', 'music', [])] });
        expect(getColumnForClip('ghost')).toBeNull();
    });
});
