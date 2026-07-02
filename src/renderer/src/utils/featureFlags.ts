/**
 * Feature flags — interruttori per funzionalità dormienti.
 * Nessuna logica va cancellata quando una feature viene spenta da qui:
 * il flag nasconde solo la UI, il motore resta intatto e riattivabile.
 */

/**
 * ARM microfono (Smart Ducking via getUserMedia) — v1.11.1: NASCOSTO, non rimosso.
 *
 * Indagine hardware 2026-07-02 (Rødecaster Pro II su Windows 11, probe eseguiti
 * con l'Electron del progetto): con i mixer USB l'arm è inaffidabile perché il
 * device di input espone il MIX di programma, non il solo microfono → l'analyser
 * RMS del ducking sente la musica in onda e scatta da solo (falsi trigger).
 * Nessuna via pulita dentro Chromium/Electron:
 *  - device multitrack 16ch del RCPII: getUserMedia fallisce (NotReadableError)
 *    con qualunque constraint (il motore di cattura non gestisce i 16ch discreti);
 *  - device "Chat": porta il mix completo (è mix-minus del solo ritorno chat,
 *    verificato: mic chiuso + musica piena → −17.7 dB RMS ≈ main mix);
 *  - FFmpeg/DirectShow: espone al massimo 2 canali (= main mix stereo);
 *  - echoCancellation di Chromium: attenua il rientro di appena 3-10 dB,
 *    instabile (DSP del mixer sul loop + clock drift USB) — servivano ≥20 dB.
 *
 * La feature resta utile SOLO con microfoni USB diretti → decisione utente
 * (2026-07-02): nasconderla finché non esiste la cattura nativa multicanale
 * (PortAudio/cpal, naturale col salto 2.0.0/Tauri — vedi memoria di progetto
 * "feature_mic_channel_mapping"). Per riattivare la UI: mettere a true.
 * Restano intatti: MicManager, ducking mic in evaluateMix, routing recording bus.
 */
export const MIC_ARM_ENABLED = false;
