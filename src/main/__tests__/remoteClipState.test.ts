import { describe, it, expect } from 'vitest';
import { sanitizeRemoteClipState, sanitizeRemoteFxState, sanitizeRemoteState, sanitizeRemoteMixState } from '../remoteClipState';

// v1.15.37 — pad FX verso il telefono
describe('sanitizeRemoteFxState', () => {
    it('conserva colore esadecimale e flag file mancante', () => {
        const out = sanitizeRemoteFxState([
            { id: 'a', name: 'Applausi', isPlaying: true, color: '#EF4444' },
            { id: 'b', name: 'Gong', isPlaying: false, missing: true }
        ]);
        expect(out).toEqual([
            { id: 'a', name: 'Applausi', isPlaying: true, color: '#ef4444' },
            { id: 'b', name: 'Gong', isPlaying: false, missing: true }
        ]);
    });

    it('scarta colori che non sono #rrggbb (niente CSS arbitrario verso il telefono)', () => {
        const out = sanitizeRemoteFxState([
            { id: 'a', name: 'x', color: 'red; background:url(http://x)' },
            { id: 'b', name: 'y', color: '#fff' },
            { id: 'c', name: 'z', color: 42 }
        ]);
        expect(out.every((c) => c.color === undefined)).toBe(true);
    });

    it('un file mancante non risulta mai in onda', () => {
        const [pad] = sanitizeRemoteFxState([{ id: 'a', name: 'x', isPlaying: true, missing: true }]);
        expect(pad.isPlaying).toBe(false);
    });

    it('tronca i nomi troppo lunghi', () => {
        const [pad] = sanitizeRemoteFxState([{ id: 'a', name: 'n'.repeat(5000) }]);
        expect(pad.name.length).toBe(200);
    });
});

describe('sanitizeRemoteState', () => {
    it('accetta la forma { music, fx }', () => {
        const out = sanitizeRemoteState({
            music: [{ id: 'm', name: 'Brano', isPlaying: false }],
            fx: [{ id: 'f', name: 'Ding', isPlaying: true }]
        });
        expect(out).toEqual({
            music: [{ id: 'm', name: 'Brano', isPlaying: false }],
            fx: [{ id: 'f', name: 'Ding', isPlaying: true }],
            mix: { on: false }
        });
    });

    it('accetta ancora la forma storica (array = sola colonna Music)', () => {
        expect(sanitizeRemoteState([{ id: 'm', name: 'Brano' }])).toEqual({
            music: [{ id: 'm', name: 'Brano', isPlaying: false }],
            fx: [],
            mix: { on: false }
        });
    });

    it('input non valido → stato vuoto', () => {
        expect(sanitizeRemoteState(null)).toEqual({ music: [], fx: [], mix: { on: false } });
        expect(sanitizeRemoteState('x')).toEqual({ music: [], fx: [], mix: { on: false } });
        expect(sanitizeRemoteState({ music: 'x', fx: 3 })).toEqual({ music: [], fx: [], mix: { on: false } });
    });

    // v1.15.37 — modalità MIX verso il telefono
    it('brano in uscita (fading) e stato MIX', () => {
        const out = sanitizeRemoteState({
            music: [
                { id: 'a', name: 'Uscente', isPlaying: false, fading: true },
                { id: 'b', name: 'In onda', isPlaying: true, fading: true }
            ],
            fx: [],
            mix: { on: true, nextId: 'c', nextName: 'Prossimo', nextMode: 'tempo', last: 'beatmatched' }
        });
        expect(out.music).toEqual([
            { id: 'a', name: 'Uscente', isPlaying: false, fading: true },
            { id: 'b', name: 'In onda', isPlaying: true } // in onda vince: mai entrambi
        ]);
        expect(out.mix).toEqual({ on: true, nextId: 'c', nextName: 'Prossimo', nextMode: 'tempo', last: 'beatmatched' });
    });

    it('stato MIX: valori sconosciuti scartati', () => {
        expect(sanitizeRemoteMixState({ on: 'sì', nextId: 'c', nextName: 5, nextMode: 'boh', last: 'rm -rf' })).toEqual({ on: false });
        expect(sanitizeRemoteMixState({ on: true, nextId: 'c', nextName: 'X', nextMode: 'boh' })).toEqual({ on: true, nextId: 'c', nextName: 'X' });
        expect(sanitizeRemoteMixState(null)).toEqual({ on: false });
    });
});

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
