// v1.15.34 — Note brevi della schermata «Novità» (standard di distribuzione 2.0, §4).
//
// Una voce per versione, in italiano e inglese: poche righe su ciò che l'utente
// nota in regia. Il changelog completo resta in docs/changelogs e nella pagina
// della release. Una versione senza voce mostra il testo generico
// (modal.whatsNew.fallback) con il link alle note complete.

export interface WhatsNewEntry {
    it: string[];
    en: string[];
}

export const WHATS_NEW: Record<string, WhatsNewEntry> = {
    '1.15.37': {
        it: [
            'Pad FX dal telefono: il Controllo Remoto mostra la cartwall con i suoi colori, e il pad parte appena lo tocchi. QR code nelle Impostazioni, PIN che non cambia più a ogni avvio.',
            'Modalità MIX: con la vista MIX aperta ogni cambio di brano è un mix, anche quando lo fai tu (clic, tasto, MIDI, telefono). Dal telefono: MIX acceso/spento e un grande PROSSIMO.',
            'Durata del mix a scelta: corto (4 beat) per classifiche veloci e medley, medio, lungo.',
            'Mix a tempo corretto: il primo battito dei brani era sbagliato fino a 90 ms e i passaggi rapidi uscivano sfasati. I brani vengono rianalizzati una volta, da soli.',
            'I brani senza un ritmo regolare passano con un crossfade, mai con battute agganciate a caso.',
            'Barra in alto riorganizzata: progetto e registrazione a sinistra, console audio al centro, diretta e orologio a destra; più grande sugli schermi Full HD.',
        ],
        en: [
            'FX pads from your phone: Remote Control shows the cartwall in its colours, and a pad fires the moment you touch it. QR code in Settings, and the PIN no longer changes at every launch.',
            'MIX mode: with the MIX view open every track change is a mix, even when you make it yourself (click, key, MIDI, phone). From the phone: MIX on/off and a large NEXT button.',
            'Choose the mix length: short (4 beats) for fast chart countdowns and medleys, medium, long.',
            'Beat-matched mixing fixed: the first beat of tracks could be up to 90 ms off and fast changes came out of phase. Tracks are analysed again once, automatically.',
            'Tracks without a steady beat change with a crossfade, never with beats locked at random.',
            'Top bar reorganised: project and recording on the left, audio console in the centre, live controls and clock on the right; larger on Full HD screens.',
        ],
    },
    '1.15.36': {
        it: [
            'Interfaccia nuova, «Pad luminosi»: la board è una superficie con tasti in rilievo e la clip in onda si accende del colore della sua colonna.',
            'Il display IN ONDA mostra l’avanzamento vero con LED: ciano durante l’intro, ambra dall’outro in poi.',
            'Testi più grandi e contrasto verificato su tutte le schermate; le impostazioni disattivate ora si leggono.',
            'I caratteri sono inclusi nel programma e funzionano anche senza rete.',
            'Comprende le correzioni della 1.15.35: Ctrl+R non ricarica più, i controller MIDI funzionano, la registrazione non si perde chiudendo.',
        ],
        en: [
            'New "Backlit Pads" interface: the board is a surface of raised keys and the clip on air lights up in its column’s colour.',
            'The ON AIR display shows the real progress with LEDs: cyan during the intro, amber from the outro on.',
            'Larger text and contrast checked on every screen; disabled settings are now readable.',
            'Fonts are bundled with the program and work offline too.',
            'Includes the 1.15.35 fixes: Ctrl+R no longer reloads, MIDI controllers work, the recording is not lost on quit.',
        ],
    },
    '1.15.35': {
        it: [
            'Ctrl+R non ricarica più l’interfaccia: in diretta fermava tutto.',
            'I controller MIDI tornano a funzionare (lanci, MIDI Learn, comandi globali).',
            'Chiudendo il programma con una registrazione in corso o non esportata, ora viene chiesta conferma.',
            'L’esportazione con audio non sovrascrive più i file già archiviati con lo stesso nome.',
            'Una clip che non si può riprodurre mostra un avviso e la sequenza passa alla successiva.',
        ],
        en: [
            'Ctrl+R no longer reloads the interface: on air it stopped everything.',
            'MIDI controllers work again (launching, MIDI Learn, global commands).',
            'Quitting with a recording running or not yet exported now asks for confirmation.',
            'Export with audio no longer overwrites archived files with the same name.',
            'A clip that cannot be played shows a message and the sequence moves on to the next one.',
        ],
    },
    '1.15.34': {
        it: [
            'Limiter del master corretto: non alza più di mezzo decibel tutto il programma e tiene davvero il tetto impostato. Prima, con segnali molto forti, poteva superare 0 dBFS.',
            'Glue Multibanda ritarato di conseguenza: con il Glue acceso il livello resta quello di prima.',
            'Questa finestra: dopo ogni aggiornamento riassume le novità, una volta sola.',
        ],
        en: [
            'Master limiter fixed: it no longer raises the whole programme by half a decibel, and it really holds the ceiling you set. Before, very loud signals could go above 0 dBFS.',
            'Multiband Glue recalibrated to match: with the Glue on, the level stays where it was.',
            'This window: after every update it sums up what is new, just once.',
        ],
    },
};

/** Note della versione nella lingua dell'interfaccia (inglese per ogni lingua diversa dall'italiano). */
export function whatsNewFor(version: string, language: string): string[] | null {
    const entry = WHATS_NEW[version];
    if (!entry) return null;
    return language.toLowerCase().startsWith('it') ? entry.it : entry.en;
}

export const releasePageUrl = (version: string): string =>
    `https://github.com/Pitz72/RRLMP/releases/tag/v${version}`;
