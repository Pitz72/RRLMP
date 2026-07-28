import { describe, it, expect } from 'vitest';
import { mediaUrlToFilePath } from '../mediaPath';

// v1.15.20 (G4) — decodifica degli URL media:// nei path di filesystem.
// Qui sta la sola metà "main" della catena: il round-trip completo con
// `toFileUrl` del renderer è in `renderer/src/utils/__tests__/pathUtils.test.ts`
// (questo progetto TS ha rootDir `src/main` e non può importare dal renderer).

describe('mediaUrlToFilePath — Windows, unità locale', () => {
    it('decodifica un path con lettera di unità', () => {
        expect(mediaUrlToFilePath('media:///C:/audio/brano.mp3', 'win32')).toBe('C:\\audio\\brano.mp3');
    });

    it('decodifica spazi e accenti', () => {
        expect(mediaUrlToFilePath('media:///C:/audio/Citt%C3%A0%20di%20notte.mp3', 'win32'))
            .toBe('C:\\audio\\Città di notte.mp3');
    });

    it('respinge un percent-encoding malformato', () => {
        expect(mediaUrlToFilePath('media:///C:/audio/%E0%A4%A.mp3', 'win32')).toBeNull();
    });
});

describe('mediaUrlToFilePath — POSIX', () => {
    it('decodifica un path assoluto Linux/macOS', () => {
        expect(mediaUrlToFilePath('media:///home/utente/x.mp3', 'linux')).toBe('/home/utente/x.mp3');
        expect(mediaUrlToFilePath('media:///Users/simone/x.mp3', 'darwin')).toBe('/Users/simone/x.mp3');
    });

    it('non tenta di servire un UNC fuori da Windows', () => {
        // Su Linux/macOS le share si montano come path POSIX: un host qui non è servibile.
        expect(mediaUrlToFilePath('media://NAS/musica/x.mp3', 'linux')).toBeNull();
    });
});

describe('mediaUrlToFilePath — percorsi di rete UNC (Windows)', () => {
    it('ricostruisce \\\\SERVER\\share\\file', () => {
        expect(mediaUrlToFilePath('media://NAS/musica/brano.mp3', 'win32'))
            .toBe('\\\\NAS\\musica\\brano.mp3');
    });

    it('conserva le maiuscole del nome server', () => {
        // `media` non è uno schema "speciale": l'host non viene normalizzato a minuscole.
        expect(mediaUrlToFilePath('media://NAS-Studio/musica/x.mp3', 'win32'))
            .toBe('\\\\NAS-Studio\\musica\\x.mp3');
    });

    it('accetta un server indicato per indirizzo IP', () => {
        expect(mediaUrlToFilePath('media://192.168.1.10/regia/jingle.wav', 'win32'))
            .toBe('\\\\192.168.1.10\\regia\\jingle.wav');
    });

    it('gestisce sottocartelle profonde e spazi', () => {
        expect(mediaUrlToFilePath('media://NAS/Archivio%20Musica/2026/Estate/brano%201.mp3', 'win32'))
            .toBe('\\\\NAS\\Archivio Musica\\2026\\Estate\\brano 1.mp3');
    });
});

describe('mediaUrlToFilePath — difese', () => {
    it('respinge un host che contiene separatori di percorso', () => {
        expect(mediaUrlToFilePath('media://NAS%2F..%2Fx/share/f.mp3', 'win32')).toBeNull();
    });

    it('respinge un host con risalita di directory', () => {
        expect(mediaUrlToFilePath('media://..%2F../share/f.mp3', 'win32')).toBeNull();
    });

    it('respinge input vuoto', () => {
        expect(mediaUrlToFilePath('', 'win32')).toBeNull();
    });

    // Fino alla v1.15.19 `toFileUrl` produceva `media:////home/...` per i path POSIX
    // e il vecchio handler lo raddrizzava per compensazione. La forma resta accettata.
    it('accetta la forma storica con slash iniziali in eccesso (POSIX)', () => {
        expect(mediaUrlToFilePath('media:////home/utente/x.mp3', 'linux')).toBe('/home/utente/x.mp3');
    });
});
