import { describe, it, expect } from 'vitest';
import { toFileUrl } from '../pathUtils';
import { mediaUrlToFilePath } from '../../../../main/mediaPath';

// v1.15.20 (G4) — la catena COMPLETA: `toFileUrl` (renderer, costruisce l'URL che
// finisce nell'elemento <audio>) → `mediaUrlToFilePath` (main, lo riporta a un path
// di filesystem). Il bug dei percorsi di rete stava esattamente nel disallineamento
// fra le due metà, quindi vanno verificate insieme.

const roundTrip = (p: string, platform: NodeJS.Platform) => mediaUrlToFilePath(toFileUrl(p), platform);

describe('toFileUrl — forma dell\'URL', () => {
    it('unità locale Windows: authority vuota', () => {
        expect(toFileUrl('C:\\audio\\x.mp3')).toBe('media:///C:/audio/x.mp3');
    });

    it('path POSIX: esattamente tre slash', () => {
        // Fino alla v1.15.19 uscivano QUATTRO slash e il main compensava tagliandoli tutti.
        expect(toFileUrl('/home/utente/x.mp3')).toBe('media:///home/utente/x.mp3');
    });

    it('percorso di rete UNC: il server va nell\'authority', () => {
        expect(toFileUrl('\\\\NAS\\musica\\x.mp3')).toBe('media://NAS/musica/x.mp3');
    });

    it('codifica spazi e accenti nei segmenti', () => {
        expect(toFileUrl('C:\\Musica\\Città di notte.mp3'))
            .toBe('media:///C:/Musica/Citt%C3%A0%20di%20notte.mp3');
    });
});

describe('toFileUrl → mediaUrlToFilePath — andata e ritorno', () => {
    it('unità locale Windows', () => {
        expect(roundTrip('C:\\audio\\brano.mp3', 'win32')).toBe('C:\\audio\\brano.mp3');
    });

    it('unità locale Windows con spazi e accenti', () => {
        expect(roundTrip('C:\\Musica\\Città di notte.mp3', 'win32')).toBe('C:\\Musica\\Città di notte.mp3');
    });

    it('percorso di rete UNC — il caso che prima falliva con 403', () => {
        expect(roundTrip('\\\\NAS\\musica\\brano.mp3', 'win32')).toBe('\\\\NAS\\musica\\brano.mp3');
    });

    it('percorso di rete UNC con spazi nel nome della share', () => {
        expect(roundTrip('\\\\NAS-Studio\\Archivio Musica\\brano 1.mp3', 'win32'))
            .toBe('\\\\NAS-Studio\\Archivio Musica\\brano 1.mp3');
    });

    it('path Linux', () => {
        expect(roundTrip('/home/utente/audio/x.mp3', 'linux')).toBe('/home/utente/audio/x.mp3');
    });

    it('path Linux con spazi e accenti', () => {
        expect(roundTrip('/home/utente/Musica/Città di notte.mp3', 'linux'))
            .toBe('/home/utente/Musica/Città di notte.mp3');
    });

    it('path Linux su volume montato (progetto condiviso da un altro PC)', () => {
        expect(roundTrip('/media/regia/NAS/musica/x.mp3', 'linux')).toBe('/media/regia/NAS/musica/x.mp3');
    });

    it('path macOS', () => {
        expect(roundTrip('/Users/simone/Music/x.mp3', 'darwin')).toBe('/Users/simone/Music/x.mp3');
    });

    it('path relativo di un archivio esportato, già risolto in assoluto al caricamento', () => {
        // I .lmp portabili contengono `audio/x.mp3`; `resolveClipPath` (pathPortability)
        // li rende assoluti PRIMA che arrivino qui, su entrambe le famiglie di OS.
        expect(roundTrip('/home/utente/Progetti/Show/audio/x.mp3', 'linux'))
            .toBe('/home/utente/Progetti/Show/audio/x.mp3');
        expect(roundTrip('D:\\Progetti\\Show\\audio\\x.mp3', 'win32'))
            .toBe('D:\\Progetti\\Show\\audio\\x.mp3');
    });

    // Su POSIX un path può cominciare con `//` senza essere una share di rete:
    // non deve MAI finire nel ramo UNC (il server verrebbe letto come host e su
    // Linux l'URL sarebbe irrisolvibile → la clip non partirebbe più).
    it('un path POSIX che inizia con doppio slash non viene scambiato per UNC', () => {
        expect(toFileUrl('//srv/audio/x.mp3').startsWith('media:///')).toBe(true);
        expect(roundTrip('//srv/audio/x.mp3', 'linux')).toBe('/srv/audio/x.mp3');
    });
});
