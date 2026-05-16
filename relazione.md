# Relazione Tecnica — Runtime Live Machine Pro

**Ultima analisi**: 16 maggio 2026  
**Versione corrente**: 1.2.15  
**Stack**: Electron 28.3.3 · React 18.2.0 · TypeScript 5.3.3 · Zustand · Web Audio API · FFmpeg

---

## STORICO FIX

| Versione | Commit | Modifiche |
| ---------- | -------- | --------- |
| v1.2.6 | 7cfefe2 | GR-01, GR-02, GR-03, GR-04, GR-08 (bonus) |
| v1.2.7 | d7fe551 | GR-05, GR-07 (GR-06 già risolto nel codebase) |
| v1.2.8 | 061f41b | ME-01, ME-05 |
| v1.2.9 | 177aa98 | ME-03, ME-07 |
| v1.2.10 | 12dc386 | ME-02, ME-04, ME-06 |
| v1.2.11 | 8b3bf7d | LI-01, LI-02, LI-03, LI-04, LI-05 |
| v1.2.12 | ab4cbd4 | ESC Focus Guard — bugfix |
| v1.2.13 | 238de31 | Relazione: Waveform Editor, MIDI, Voice Tracking, ESC aggiornati — documentazione |
| v1.2.14 | e2c235c | Smart Mic Ducking: hold times configurabili + nota loopback USB mixer — miglioramento |
| v1.2.15 | c3b1bf6 | Auto-Silence Detection: soglia dinamica da volumedetect — miglioramento |

---

## CRITICITÀ RISOLTE

✅ **GR-01** · `setInterval` eterno nel corpo di `create()` Zustand — risolto in v1.2.6  
✅ **GR-02** · Race condition nel sequencer con generazioni di caricamento — risolto in v1.2.6  
✅ **GR-03** · Nessun timeout sugli IPC handler asincroni — risolto in v1.2.6  
✅ **GR-04** · Path traversal non validato nel protocollo `media://` — risolto in v1.2.6  
✅ **GR-05** · StreamPlayer: chiusure orfane e loop post-cleanup — risolto in v1.2.7  
✅ **GR-06** · `isAnalyzing: true` permanente su errore IPC silence detection — già risolto nel codebase  
✅ **GR-07** · Export zombie: loop continua dopo chiusura finestra — risolto in v1.2.7  
✅ **GR-08** · Stato `fadingClipIds` e `previewingClipIds` non puliti su `stopAll` — risolto in v1.2.6  
✅ **ME-01** · FFmpeg zombie in `AudioProcessor.ts` — risolto in v1.2.8  
✅ **ME-02** · Nessuna validazione struttura `.lmp` al caricamento — risolto in v1.2.10  
✅ **ME-03** · Auto-backup: race condition badge "Auto-saved" — risolto in v1.2.9  
✅ **ME-04** · Output device hot-switch senza retry su device ricollegato — risolto in v1.2.10  
✅ **ME-05** · `MicManager.arm()` lascia stream zombie su eccezione parziale — risolto in v1.2.8  
✅ **ME-06** · Typecast `as unknown as` su tipi noti — risolto in v1.2.10  
✅ **ME-07** · `evaluateMix` accede allo store ad ogni chiamata — risolto in v1.2.9  
✅ **LI-01** · `ErrorBoundary` non cattura errori asincroni — risolto in v1.2.11  
✅ **LI-02** · Nessun rate-limit sugli IPC handler dal renderer — risolto in v1.2.11  
✅ **LI-03** · `console.*` non strutturato in produzione — risolto in v1.2.11  
✅ **LI-04** · Singleton audio non distrutti su ricarica webview — risolto in v1.2.11  
✅ **LI-05** · Countdown MIDI Learn attivabile in doppio — risolto in v1.2.11  
✅ **ESC** · Emergency Stop globale attivo anche fuori focus — risolto in v1.2.12  

---

## 1. FUNZIONALITÀ MIGLIORABILI

| Area | Stato | Cosa manca |
| ------ | ------- | ------------ |
| Waveform Editor | Buono | Smart Cues: il backend IPC/FFmpeg restituisce solo trimStart/trimEnd; manca rilevazione automatica di introCue/outroCue (primo picco energetico e punto di dissolvenza naturale) da integrare nei marker del WaveformEditor |
| MIDI Learn | Funzionale | Velocity ricevuta ma ignorata (\_velocity nei callback) — non usata come controllo di volume per le clip; OSC rimandato a roadmap (F-25, Tier 3) |
| Auto-Silence Detection | Buono | Soglia ora dinamica (volumedetect → mean − 25 dB, clamped −55/−20) da v1.2.15; override manuale opzionale; mancano ancora introCue/outroCue automatici |
| Smart Mic Ducking | Buono | Hold time configurabili da v1.2.14 (con nota per loopback USB mixer); Talkback/IFB (F-17) rimandato a roadmap |
| Export Self-Contained | Funzionale | Nessun Playout Log automatico; export solo on-demand manuale (F-03) |
| Open-file da OS (.lmp association) | Funzionale | Associazione icona e "Apri con..." non garantiti su tutte le config Windows |

---

## 2. FEATURE INDISPENSABILI MANCANTI

### TIER 1 — Critiche per uso professionale quotidiano

**F-01 · Clock Wheel / Scheduling orario**  
Nessun software di regia professionale manca di un sistema di scheduling orario. L'operatore deve poter pianificare cosa va in onda ad ogni slot orario (00:00, :15, :30, :45) con trigger automatico o manuale. Attualmente RRLMP è puramente reattivo all'input umano.

**F-02 · Rundown / Scaletta di trasmissione**  
Una scaletta ordinata e sequenziale degli elementi in onda (notizie, spot, jingle, musica) con timing previsto vs. timing reale, indispensabile per coordinare la regia con la redazione. Il PRE-SHOW è un approccio simile ma non è una scaletta strutturata.

**F-03 · Playout Log / Storia trasmissione**  
Registro persistente di tutto ciò che è andato in onda: nome clip, timestamp inizio/fine, durata effettiva, operatore. Obbligatorio per molte licenze radiofoniche (SIAE, ASCAP) e per reporting agli investitori pubblicitari.

**F-04 · Hotkeys globali per Jingle/Stinger**  
Un soundboard con 16-32 tasti (F1-F12, numpad) che avvia istantaneamente clip "one-shot" senza dover interagire con la board principale. Standard assoluto in ogni regia radio.

**F-05 · Gestione Spot / Spot Break automatico**  
Sequenza automatica di spot pubblicitari con calcolo durata totale del break, warning operatore a 30/15/5 secondi dalla fine, rientro automatico con fade-up della musica.

**F-06 · Loudness Normalization per clip (LUFS)**  
Analisi e normalizzazione a target LUFS (EBU R128 -14 LUFS) per garantire coerenza sonora tra tracce di diversa origine. La Master Chain comprime il master ma non normalizza le clip individualmente.

---

### TIER 2 — Importanti per flusso di lavoro professionale

**F-07 · Metadata streaming (Icecast/Shoutcast)**  
Invio "Now Playing" al server streaming: artista, titolo, artwork. Essenziale per emittenti con stream online.

**F-08 · Integrazione RDS (Radio Data System)**  
Invio titolo corrente alla trasmissione FM via interfaccia RDS hardware (seriale/USB). Standard EBU per radio FM europee.

**F-09 · Cart System (Soundboard dedicata)**  
Pannello separato con 32-64 pulsanti colorati per effetti sonori e stacchetti — clip one-shot senza waveform editor né transizioni.

**F-10 · Equalizzatore per canale**  
EQ a 3 o 5 bande per ogni bus (Music, Voice, SFX) separato dalla Master Chain, per compensare differenze timbriche tra sorgenti.

**F-11 · Undo/Redo nelle operazioni di playlist**  
Aggiunta, rimozione e riordinamento clip sono operazioni irreversibili. Stack undo/redo da 20-50 operazioni è standard in tutti i DAW.

**F-12 · Voice Tracking / Jingle Recording integrato**  
Possibilità per il conduttore di registrare inserti voce singoli (intro, outro, link) direttamente in regia, con pre-roll della clip precedente e post-roll della clip successiva per un ascolto in contesto. Il file registrato viene salvato come clip nella board. Distinto dal Session Recording (che cattura l'intera sessione): il Voice Tracking opera clip per clip e produce file standalone pronti per la rotazione.

**F-13 · BPM Detection automatica**  
Rilevazione BPM via FFmpeg/aubio per sincronizzare crossfade al beat della traccia musicale.

**F-14 · ReplayGain su file**  
Analisi R128 e scrittura del tag nel file audio per normalize il volume clip-by-clip senza alterare il file originale.

---

### TIER 3 — Desiderabili per completezza del prodotto

**F-15 · Remote Control Web Interface** — pannello tablet/smartphone per controllo remoto  
**F-16 · Multiple Output Bus (Studio + Stream)** — PFL/cue separato dal master on-air  
**F-17 · Talkback / IFB** — comunicazione bidirezionale con ospiti in studio  
**F-18 · Phone Hybrid Integration** — gestione chiamate VoIP in diretta  
**F-19 · Plugin System (VST3/CLAP)** — processori di terze parti sul master o sui bus  
**F-20 · Gestione Archivio Musicale** — browser database con rotation rules  
**F-21 · Waveform skimmer su hover** — preview audio senza avviare playback  
**F-22 · Second Screen Support** — display on-air per il conduttore  
**F-23 · Segue intelligente** — analisi FFmpeg del punto di mix-out naturale  
**F-24 · Export Report / Cue Sheet** — scaletta in PDF o CSV per documentazione  
**F-25 · OSC Integration** — controllo remoto da hardware e TouchOSC  

---

## 3. RIEPILOGO PRIORITÀ ATTUALE

### Criticità aperte da pianificare

Nessuna. Tutte le criticità note sono state risolte in v1.2.6–v1.2.12.

### Feature da valutare per roadmap

| ID | Priorità broadcast | Effort | Descrizione |
|----|-------------------|--------|-------------|
| F-01 | CRITICA | Alta | Clock Wheel / Scheduling orario |
| F-03 | CRITICA | Alta | Playout Log persistente |
| F-04 | CRITICA | Bassa | Hotkeys globali Jingle/Stinger |
| F-06 | CRITICA | Media | Loudness normalization LUFS per clip |
| F-07 | CRITICA | Media | Metadata streaming Icecast/Shoutcast |
| F-02 | ALTA | Alta | Rundown / Scaletta strutturata |
| F-05 | ALTA | Alta | Gestione Spot Break automatico |
| F-10 | ALTA | Media | EQ per canale |
| F-11 | ALTA | Media | Undo/Redo operazioni playlist |
| F-13 | MEDIA | Media | BPM Detection automatica |
| F-16 | MEDIA | Alta | Multiple Output Bus (Studio + Stream) |
| F-22 | BASSA | Alta | Second Screen Support |

---

*Aggiornato a v1.2.15. Tutte le criticità note (gravissime, gravi, medie e lievi) sono state risolte in v1.2.6–v1.2.12. v1.2.13–v1.2.15 portano miglioramenti alle funzionalità esistenti.*
