import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolvePreshowNext, resetPreshowRotation, useAudioStore } from '../useAudioStore';
import { useProjectStore } from '../useProjectStore';
import { RotationConfig } from '../../types';
import { makeClip, makeColumn } from './fixtures';

// Blocco 4 (v1.4.5) — resolvePreshowNext + rotazione PRE-SHOW (Jingle&Promo, v1.4.0).
// Logica delicata (fonte di bug passati). Stato runtime module-level azzerato in beforeEach
// via resetPreshowRotation(). Colonne jingle/promo a clip singola → pick deterministico
// (pickRandomFromColumn ignora l'anti-repeat quando c'e' un solo candidato).

const ROT = (over: Partial<RotationConfig> = {}): RotationConfig => ({
    jingleEnabled: false,
    jingleEvery: 4,
    promoEnabled: false,
    promoEvery: 6,
    ...over,
});

// s1,s2,s3 PRE-SHOW; j1 jingle; p1 promo.
const s1 = makeClip({ id: 's1', name: 'S1', type: 'preshow' });
const s2 = makeClip({ id: 's2', name: 'S2', type: 'preshow' });
const s3 = makeClip({ id: 's3', name: 'S3', type: 'preshow' });
const j1 = makeClip({ id: 'j1', name: 'J1', type: 'asset' });
const p1 = makeClip({ id: 'p1', name: 'P1', type: 'asset' });
const m1 = makeClip({ id: 'm1', name: 'M1', type: 'music' });
const m2 = makeClip({ id: 'm2', name: 'M2', type: 'music' });

const setup = (rotation?: RotationConfig) => {
    useProjectStore.setState({
        columns: [
            makeColumn('col-preshow', 'preshow', [s1, s2, s3], rotation),
            makeColumn('col-jingle', 'asset', [j1]),
            makeColumn('col-promo', 'asset', [p1]),
            makeColumn('col-music', 'music', [m1, m2]),
        ],
    });
};

beforeEach(() => {
    resetPreshowRotation();
    useAudioStore.setState({ previewingClipIds: [] });
});

afterEach(() => {
    useProjectStore.setState({ columns: [] });
});

describe('resolvePreshowNext — fuori PRE-SHOW', () => {
    it('ritorna il prossimo sequenziale senza effetti collaterali', () => {
        setup(ROT({ jingleEnabled: true, jingleEvery: 1 }));
        expect(resolvePreshowNext(m1, 'col-music')?.id).toBe('m2');
    });

    it('ritorna null a fine colonna non-preshow', () => {
        setup();
        expect(resolvePreshowNext(m2, 'col-music')).toBeNull();
    });
});

describe('resolvePreshowNext — PRE-SHOW senza rotazione', () => {
    it('senza config rotation prosegue sequenziale', () => {
        setup(undefined);
        expect(resolvePreshowNext(s1, 'col-preshow')?.id).toBe('s2');
    });

    it('a fine lista PRE-SHOW non inserisce nulla (ritorna null)', () => {
        setup(ROT({ jingleEnabled: true, jingleEvery: 1 }));
        expect(resolvePreshowNext(s3, 'col-preshow')).toBeNull();
    });

    it('durante la Preview Transizione non applica rotazione', () => {
        setup(ROT({ jingleEnabled: true, jingleEvery: 1 }));
        useAudioStore.setState({ previewingClipIds: ['s1'] });
        expect(resolvePreshowNext(s1, 'col-preshow')?.id).toBe('s2'); // sequenziale, non j1
    });
});

describe('resolvePreshowNext — rotazione jingle', () => {
    it('inserisce un jingle quando scatta l\'intervallo (ogni 1)', () => {
        setup(ROT({ jingleEnabled: true, jingleEvery: 1 }));
        expect(resolvePreshowNext(s1, 'col-preshow')?.id).toBe('j1');
    });

    it('non inserisce prima dell\'intervallo (ogni 2, primo brano)', () => {
        setup(ROT({ jingleEnabled: true, jingleEvery: 2 }));
        expect(resolvePreshowNext(s1, 'col-preshow')?.id).toBe('s2');
    });
});

describe('resolvePreshowNext — memoizzazione (anti doppio-incremento)', () => {
    it('una seconda risoluzione della stessa clip non incrementa di nuovo il contatore', () => {
        setup(ROT({ jingleEnabled: true, jingleEvery: 2 }));
        // 1a risoluzione di s1: counter 0→1 (<2) → sequenziale s2
        expect(resolvePreshowNext(s1, 'col-preshow')?.id).toBe('s2');
        // 2a risoluzione di s1 (onPreEnd + fallback onEnded): memo → ancora s2, NIENTE incremento
        expect(resolvePreshowNext(s1, 'col-preshow')?.id).toBe('s2');
        // risoluzione di s2: counter 1→2 (>=2) → scatta il jingle
        expect(resolvePreshowNext(s2, 'col-preshow')?.id).toBe('j1');
    });
});

describe('resolvePreshowNext — collisione jingle + promo', () => {
    it('quando scattano insieme ritorna prima il jingle (poi il promo va in coda)', () => {
        setup(ROT({ jingleEnabled: true, jingleEvery: 1, promoEnabled: true, promoEvery: 1 }));
        // ordine nel codice: jingle prima del promo
        expect(resolvePreshowNext(s1, 'col-preshow')?.id).toBe('j1');
    });
});

// v1.4.8 (revisione 2026-06-10, #23): lo slot di rotazione NON va "bruciato" se la
// colonna jingle è vuota/non disponibile — il contatore resta maturo e si ritenta
// al brano successivo (prima: "ogni 2" diventava silenziosamente "ogni 4").
describe('resolvePreshowNext — slot non bruciato su colonna vuota (#23)', () => {
    it('riprova al brano successivo quando la colonna jingle torna disponibile', () => {
        useProjectStore.setState({
            columns: [
                makeColumn('col-preshow', 'preshow', [s1, s2, s3], ROT({ jingleEnabled: true, jingleEvery: 2 })),
                makeColumn('col-jingle', 'asset', []), // vuota: pick fallisce
                makeColumn('col-promo', 'asset', []),
            ],
        });
        // counter 0→1 (<2) → sequenziale
        expect(resolvePreshowNext(s1, 'col-preshow')?.id).toBe('s2');
        // counter 1→2 (>=2) ma colonna vuota → sequenziale, slot RESTA maturo
        expect(resolvePreshowNext(s2, 'col-preshow')?.id).toBe('s3');
        // la colonna si ripopola: al prossimo brano l'inserto scatta subito
        useProjectStore.setState({
            columns: [
                makeColumn('col-preshow', 'preshow', [s1, s2, s3, makeClip({ id: 's4', name: 'S4', type: 'preshow' })], ROT({ jingleEnabled: true, jingleEvery: 2 })),
                makeColumn('col-jingle', 'asset', [j1]),
                makeColumn('col-promo', 'asset', []),
            ],
        });
        expect(resolvePreshowNext(s3, 'col-preshow')?.id).toBe('j1');
    });
});

// v1.4.8 (#13): la rotazione non deve pescare una clip attualmente in onda
// (playClip la interpreterebbe come toggle-stop troncandola).
describe('resolvePreshowNext — pick esclude le clip in onda (#13)', () => {
    it('con il jingle unico già attivo, la pesca fallisce e si prosegue sequenziale', () => {
        setup(ROT({ jingleEnabled: true, jingleEvery: 1 }));
        const fakeActive = { player: {} as never, isPlaying: true, progress: 0, clip: j1 };
        useAudioStore.setState({ activeClips: { j1: fakeActive } });
        try {
            expect(resolvePreshowNext(s1, 'col-preshow')?.id).toBe('s2'); // non j1
        } finally {
            useAudioStore.setState({ activeClips: {} });
        }
    });
});
