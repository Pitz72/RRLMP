import { describe, it, expect } from 'vitest';
import {
    isAbsolutePath,
    dirnameOf,
    basenameOf,
    resolveClipPath,
    audioFallbackCandidate
} from '../pathPortability';

// v1.15.14 — portabilità progetti esportati (path assoluti nel .lmp che non
// esistono su un'altra macchina / dopo uno spostamento di cartella).

describe('isAbsolutePath', () => {
    it('riconosce drive Windows, UNC e POSIX', () => {
        expect(isAbsolutePath('C:\\Users\\x\\a.mp3')).toBe(true);
        expect(isAbsolutePath('c:/Users/x/a.mp3')).toBe(true);
        expect(isAbsolutePath('\\\\server\\share\\a.mp3')).toBe(true);
        expect(isAbsolutePath('/home/x/a.mp3')).toBe(true);
    });
    it('riconosce i relativi', () => {
        expect(isAbsolutePath('audio/a.mp3')).toBe(false);
        expect(isAbsolutePath('audio\\a.mp3')).toBe(false);
        expect(isAbsolutePath('a.mp3')).toBe(false);
        expect(isAbsolutePath('')).toBe(false);
    });
});

describe('dirnameOf / basenameOf', () => {
    it('gestisce entrambi i separatori', () => {
        expect(dirnameOf('C:\\proj\\show.lmp')).toBe('C:\\proj');
        expect(dirnameOf('/home/x/show.lmp')).toBe('/home/x');
        expect(basenameOf('C:\\proj\\audio\\a.mp3')).toBe('a.mp3');
        expect(basenameOf('/home/x/audio/a.mp3')).toBe('a.mp3');
        expect(basenameOf('a.mp3')).toBe('a.mp3');
    });
    it('dirnameOf torna null senza separatore utile', () => {
        expect(dirnameOf('show.lmp')).toBe(null);
    });
});

describe('resolveClipPath', () => {
    it('risolve i relativi contro la cartella del .lmp (separatori del .lmp)', () => {
        expect(resolveClipPath('audio/a.mp3', 'C:\\proj\\show.lmp'))
            .toBe('C:\\proj\\audio\\a.mp3');
        expect(resolveClipPath('audio/a.mp3', '/home/x/show.lmp'))
            .toBe('/home/x/audio/a.mp3');
    });
    it('lascia invariati gli assoluti', () => {
        expect(resolveClipPath('D:\\musica\\a.mp3', 'C:\\proj\\show.lmp'))
            .toBe('D:\\musica\\a.mp3');
        expect(resolveClipPath('\\\\nas\\musica\\a.mp3', 'C:\\proj\\show.lmp'))
            .toBe('\\\\nas\\musica\\a.mp3');
    });
    it('path vuoto o .lmp senza cartella: nessuna modifica', () => {
        expect(resolveClipPath('', 'C:\\proj\\show.lmp')).toBe('');
        expect(resolveClipPath('audio/a.mp3', 'show.lmp')).toBe('audio/a.mp3');
    });
});

describe('audioFallbackCandidate', () => {
    it('costruisce <dir .lmp>/audio/<nomefile> dal path rotto di un altra macchina', () => {
        expect(audioFallbackCandidate('C:\\Users\\Utente\\vecchio\\audio\\a.mp3', 'D:\\scaricati\\show.lmp'))
            .toBe('D:\\scaricati\\audio\\a.mp3');
        // Anche un originale MAI archiviato (path fuori da audio/) viene tentato per nome
        expect(audioFallbackCandidate('C:\\musica\\brano.mp3', 'D:\\scaricati\\show.lmp'))
            .toBe('D:\\scaricati\\audio\\brano.mp3');
    });
    it('cross-platform: bundle esportato su Windows aperto su macOS/Linux', () => {
        expect(audioFallbackCandidate('C:\\Users\\x\\proj\\audio\\a.mp3', '/Users/collega/proj/show.lmp'))
            .toBe('/Users/collega/proj/audio/a.mp3');
    });
    // v1.15.20: con i percorsi di rete finalmente riproducibili, un progetto che
    // pesca dal NAS diventa un caso normale — e va condiviso come tutti gli altri.
    it('share di rete Windows → archivio esportato aperto su Linux', () => {
        expect(audioFallbackCandidate('\\\\NAS\\musica\\brano.mp3', '/home/collega/Progetti/show.lmp'))
            .toBe('/home/collega/Progetti/audio/brano.mp3');
    });
    it('share di rete Windows → archivio riaperto su un altro PC Windows', () => {
        expect(audioFallbackCandidate('\\\\NAS-Studio\\Archivio\\brano.mp3', 'E:\\Ricevuti\\show.lmp'))
            .toBe('E:\\Ricevuti\\audio\\brano.mp3');
    });
    it('archivio prodotto su Linux e riaperto su Windows', () => {
        expect(audioFallbackCandidate('/home/simone/Progetti/Show/audio/brano.mp3', 'C:\\Ricevuti\\show.lmp'))
            .toBe('C:\\Ricevuti\\audio\\brano.mp3');
    });

    it('null se il candidato coincide col path già rotto (case-insensitive)', () => {
        expect(audioFallbackCandidate('D:\\proj\\audio\\a.mp3', 'D:\\proj\\show.lmp')).toBe(null);
        expect(audioFallbackCandidate('d:\\proj\\AUDIO\\A.mp3', 'D:\\proj\\show.lmp')).toBe(null);
    });
    it('null senza cartella del .lmp o path clip vuoto', () => {
        expect(audioFallbackCandidate('C:\\x\\a.mp3', 'show.lmp')).toBe(null);
        expect(audioFallbackCandidate('', 'D:\\proj\\show.lmp')).toBe(null);
    });
});
