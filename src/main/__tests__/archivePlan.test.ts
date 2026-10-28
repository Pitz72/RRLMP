import { describe, it, expect } from 'vitest';
import { planArchiveNames } from '../archivePlan';

// v1.15.35 (G3) — piano dei nomi dell'archivio audio/ dell'export.

const AUDIO_WIN = 'D:\\Show\\audio';
const AUDIO_POSIX = '/home/regia/show/audio';

const names = (plan: ReturnType<typeof planArchiveNames>) => plan.map((e) => e && e.destName);

describe('planArchiveNames', () => {
    it('file esterni con nomi diversi: tengono il proprio nome', () => {
        const plan = planArchiveNames(['C:\\Musica\\a.mp3', 'C:\\Jingle\\b.wav'], AUDIO_WIN, 'win32');
        expect(names(plan)).toEqual(['a.mp3', 'b.wav']);
        expect(plan.every((e) => e && !e.inPlace)).toBe(true);
    });

    it('stesso nome da cartelle diverse: il secondo riceve un suffisso', () => {
        const plan = planArchiveNames(['C:\\A\\intro.mp3', 'C:\\B\\intro.mp3'], AUDIO_WIN, 'win32');
        expect(names(plan)).toEqual(['intro.mp3', 'intro_1.mp3']);
    });

    it('IL DIFETTO: una clip nuova omonima PRIMA di una già archiviata non ne prende il nome', () => {
        // La clip archiviata (già ripuntata in audio/) è dopo in scaletta.
        const plan = planArchiveNames(
            ['C:\\Nuovi\\intro.mp3', 'D:\\Show\\audio\\intro.mp3'],
            AUDIO_WIN,
            'win32'
        );
        // Prima: la nuova prendeva "intro.mp3" e sovrascriveva la copia archiviata.
        expect(plan[0]).toEqual({ destName: 'intro_1.mp3', inPlace: false });
        expect(plan[1]).toEqual({ destName: 'intro.mp3', inPlace: true });
    });

    it('i file già nell\'archivio restano dove sono, anche con suffisso', () => {
        const plan = planArchiveNames(
            ['D:\\Show\\audio\\intro_1.mp3', 'C:\\Altro\\intro_1.mp3'],
            AUDIO_WIN,
            'win32'
        );
        expect(plan[0]).toEqual({ destName: 'intro_1.mp3', inPlace: true });
        expect(plan[1]).toEqual({ destName: 'intro_1_1.mp3', inPlace: false });
    });

    it('la stessa sorgente usata da più clip riceve un solo nome (niente doppioni)', () => {
        const plan = planArchiveNames(['C:\\M\\x.mp3', 'C:\\M\\x.mp3', 'c:/m/X.mp3'], AUDIO_WIN, 'win32');
        expect(names(plan)).toEqual(['x.mp3', 'x.mp3', 'x.mp3']);
    });

    it('Windows: il confronto con la cartella archivio ignora maiuscole e separatori', () => {
        const plan = planArchiveNames(['d:/show/AUDIO/Spot.mp3', 'C:\\X\\spot.mp3'], AUDIO_WIN, 'win32');
        expect(plan[0]).toEqual({ destName: 'Spot.mp3', inPlace: true });
        expect(plan[1]).toEqual({ destName: 'spot_1.mp3', inPlace: false });
    });

    it('POSIX: stessa regola, cartella archivio confrontata alla lettera', () => {
        const plan = planArchiveNames(
            ['/home/regia/nuovi/intro.mp3', '/home/regia/show/audio/intro.mp3'],
            AUDIO_POSIX,
            'linux'
        );
        expect(plan[0]).toEqual({ destName: 'intro_1.mp3', inPlace: false });
        expect(plan[1]).toEqual({ destName: 'intro.mp3', inPlace: true });
    });

    it('i nomi collidono senza distinguere maiuscole anche su POSIX (archivio portabile su Windows)', () => {
        const plan = planArchiveNames(['/a/Intro.mp3', '/b/intro.mp3'], AUDIO_POSIX, 'linux');
        expect(names(plan)).toEqual(['Intro.mp3', 'intro_1.mp3']);
    });

    it('le sorgenti nulle (file mancante) restano nulle e non occupano nomi', () => {
        const plan = planArchiveNames([null, 'C:\\A\\a.mp3', null], AUDIO_WIN, 'win32');
        expect(plan).toEqual([null, { destName: 'a.mp3', inPlace: false }, null]);
    });

    it('file senza estensione: suffisso senza punto finale', () => {
        const plan = planArchiveNames(['C:\\A\\sigla', 'C:\\B\\sigla'], AUDIO_WIN, 'win32');
        expect(names(plan)).toEqual(['sigla', 'sigla_1']);
    });

    it('nomi stabili tra due export: dopo il ripuntamento tutto è in posto', () => {
        const first = planArchiveNames(['C:\\A\\intro.mp3', 'C:\\B\\intro.mp3'], AUDIO_WIN, 'win32');
        const repointed = first.map((e) => `${AUDIO_WIN}\\${e!.destName}`);
        const second = planArchiveNames(repointed, AUDIO_WIN, 'win32');
        expect(second).toEqual([
            { destName: 'intro.mp3', inPlace: true },
            { destName: 'intro_1.mp3', inPlace: true },
        ]);
    });
});
