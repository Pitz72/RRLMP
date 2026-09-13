# RRLMP — Roadmap & Backlog

**Versione corrente:** 1.15.32 — **rilasciata** (Latest su RRLMP-Releases, unica release presente)
**Ultimo aggiornamento:** 2026-09-13 — dopo il rilascio della 1.15.32 e la verifica di audit, revisioni e roadmap contro il codice

Scope del prodotto: **regia umana per show finiti** (podcast, eventi, web radio). Nessuna automazione 24h. L'unica eccezione controllata è la rotazione PRE-SHOW — vedi [VISION.md](./VISION.md).

---

## 📊 Stato attuale

| Area | Stato |
|------|-------|
| Typecheck (renderer/main/node/preload) | **0 errori** su tutti e 4 |
| Test Vitest | **232/232 verdi** (24 file) |
| Criticità aperte del codice | **nessuna** dalla [revisione 2026-07-28](./technical/REVISIONE-CODICE-2026-07-28.md) (22 reperti chiusi in 1.15.16 → 1.15.29) — resta da verificare il limiter, vedi sotto |
| Ultima release **pubblicata** | **v1.15.32** — note cumulative 1.15.16 → 1.15.32 in italiano e inglese; v1.15.31 e v1.15.15 eliminate con i tag |
| Lingue | **Solo italiano e inglese** in app, guida rapida, manuale e note di rilascio (dalla 1.15.32) |
| Manuale utente | IT + EN allineati alla 1.15.32, schermate nuove, pubblicati su `RRLMP-Releases/manuals` (link verificato dal software) |
| Auto-updater | operativo (nativo su Windows/Linux-AppImage, fallback browser su macOS/.deb); `latest.yml` e `latest-linux.yml` → 1.15.32 |
| Pacchetti | exe 114 MB · AppImage 158 MB · deb 108 MB · dmg 143 MB (il problema dei 500 MB non si ripresenta). Dalla 1.15.33 niente più `.dmg`: macOS si compila dal sorgente |
| Apertura del sorgente | **in corso**: ritiro dalla vendita e pubblicazione MIT su `Pitz72/RRLMP` — Fasi 1 e 2 chiuse, vedi [PIANO-APERTURA.md](./PIANO-APERTURA.md) |

---

## 🔴 Priorità 1 — Da fare nel codice

1. **Limiter della master chain da misurare.** Oggi `AudioContextManager.ts` usa `DynamicsCompressorNode` con soglia −1 dBFS, ratio 20, knee 0. Su StreamFlow è stato **misurato** che con questi parametri il tetto non regge (uscita sopra 0 dBFS già a +6 dB di sovraccarico) e che Chromium aggiunge un makeup implicito di ~0,57 dB per ogni dB di soglia, anche a riposo. Rifare la stessa sonda con `OfflineAudioContext` dentro RRLMP; se confermato, correggere (in StreamFlow ha funzionato soglia −3 dB + trim di compensazione).
2. **Microfono (Smart Mic) — completamento**, in ordine:
   1. **interruttore ducking on/off** — oggi armare il microfono implica l'abbassamento della musica;
   2. **compressore sulla voce** — con trim del makeup implicito, misurato e non stimato;
   3. **equalizzatore** — tre `BiquadFilter` (rumble, corpo, presenza 3–4 kHz);
   4. **riduzione rumore** — partire da un expander sul gate già presente in `MicManager`; RNNoise/WASM è la strada di qualità ma è una dipendenza nuova.

   Nota: `MicManager` **instrada già** la voce al master bus quando il *Canale Mix Microfono* è attivo (`micGain` → `manager.getOutput()`), quindi compressore ed equalizzatore hanno un'uscita su cui agire anche prima dell'integrazione LIVE.

---

## 🟠 Priorità 2 — Verifiche sul campo aperte

Non riproducibili con i test automatici:

- **Hero IN ONDA e card stabili** (1.15.31) durante una sequenza play_next reale, con intro/outro.
- **Aggiornamento automatico dalla 1.15.15 alla 1.15.32**, con il popup che mostra le note cumulative.
- **Share di rete reale** (1.15.20): riprodurre un brano su NAS/cartella condivisa.
- **Distacco di un supporto durante la registrazione** (1.15.21): la sessione deve chiudersi salvando quanto raccolto.
- **Tasti F1–F6** (1.15.26): F6 lancia PRE-SHOW; nascondendo una colonna i tasti si rimappano.
- **Esportazione su cartella `audio/` preesistente** (1.15.17): avviso al primo export, nessun file estraneo rimosso.
- **"Riavvia e installa" con progetto sporco** (1.15.19): deve chiedere Salva / Non Salvare / Annulla.
- **Smart Mic con microfono USB** (1.15.30): la musica scende parlando e risale smettendo.
- **Utente con lingua rimossa** (1.15.32): chi aveva l'app in francese/tedesco/… deve ripartire in inglese.

Feature precedenti mai validate su materiale reale:

- **Preset Glue Multibanda non-neutri** (rock/jazz/elettronico, v1.7.0) — valori plausibili ma mai misurati; richiedono ascolto critico.
- **I 10 suoni FX di default** (v1.10.8) — solo CC0/Public Domain, **mai ascoltati**.
- **Automix beat-match su musica reale** — motore coperto da 26 test, orchestrazione live no.
- **Plausibilità BPM su musica reale** — validato su toni sintetici.

---

## 🟡 Priorità 3 — Debito tecnico annotato

- **`music-metadata` / `file-type`** (ancora `^7.14.0`) — vulnerabilità alta (ciclo infinito nel parser ASF su `.wma`/`.asf` malformati). La correzione richiede il salto major `7.14 → 11.x` con interfaccia diversa: **sessione dedicata**, verifica su file reali. Attenuazione presente: lettura tag sotto `withIpcTimeout(10s)`.
- **`uuid`** (ancora `^9.0.1`) — vulnerabilità media su modalità non usate (gli identificatori vengono da `crypto.randomUUID`). Da sistemare con un aggiornamento major delle dipendenze.
- **Aggiornamento generale delle dipendenze** — `npm audit fix` automatico tocca decine di pacchetti di sviluppo: da fare per conto suo, mai insieme a correzioni.
- **Zoom del Waveform Editor** — ancora cosmetico: stira le 200 barre generate da `AudioProcessor.ts` senza aggiungere risoluzione. Evoluzione: più punti, aggregati lato renderer in base allo zoom.
- **PDF delle 6 lingue rimosse** in `RRLMP-Releases/manuals` — lasciati volutamente: le versioni ≤ 1.15.31 impostate in quelle lingue li aprono ancora. Rimuovibili quando nessuno userà più quelle versioni.

---

## 🎙️ Filone aperto — Voce in diretta e integrazione con StreamFlow

Aperto il **2026-07-28** da un problema reale in onda: una speaker con microfono USB e senza mixer, il cui sottofondo ondeggiava da solo sullo stream. Causa trovata in StreamFlow (`getDisplayMedia` senza vincoli → AGC di Chromium sull'audio di sistema), **corretta in StreamFlow 0.8.1–0.8.3**. Le ricadute su RRLMP sono il limiter (Priorità 1) e lo Smart Mic (Priorità 1, punto 2).

### Passo 1 — Microfono in RRLMP ✅ avviato (v1.15.30)
Smart Mic riattivata e documentata nel manuale (capitoli 3, 6, 13). Il completamento è in Priorità 1.

### Passo 2 — `stream-core`: motore di streaming condiviso
I moduli di streaming di StreamFlow (`ffmpeg-manager`, `metadata-manager`, `connection-diagnostic`, `zmq-command`, `credentials`) sono **1.389 righe già disaccoppiate** (solo builtin Node, `electron`, `ffmpeg-static`). Unico aggancio: `BrowserWindow` dentro `ffmpeg-manager`, da sostituire con una callback iniettata.

> ⚠️ **Premessa da discutere prima di progettare.** StreamFlow **è pensato per il solo team di Runtime Radio**. Con un pubblico interno e noto la condivisione del codice può essere più diretta del repo versionato con tag ipotizzato in origine (`github:Ecosystem-Runtime/stream-core#v1.0.0`). Aspettare le domande dell'utente su questo punto.

### Passo 3 — LIVE dentro RRLMP (integrazione, non fusione)
**Decisione dell'utente (2026-07-28): StreamFlow resta un prodotto autonomo.**
- **pulsante LIVE** nella barra in alto + **pannello di configurazione della diretta** (server, credenziali, bitrate, metadati);
- **MIX MODE non va portato**: in RRLMP il segnale è già interno;
- prelievo dal **`recordingBus`** (tap dopo il limitatore, oggi usato da `AudioRecorder`) → AudioWorklet + IPC come in StreamFlow.

Si guadagna: niente cattura di sistema (niente AGC, niente notifiche Windows in onda) · un solo microfono processato una volta · **"now playing" automatico**.
⚠️ Contro: integrando, un crash di RRLMP porta giù anche la diretta. Mitigazione: encoder e connessione nel **main process**.

---

## 🟢 Feature

| ID | Effort | Descrizione | Stato |
|----|--------|-------------|------|
| F-04 | Basso | Soundboard rapida jingle/stinger | **CHIUSA** — coperta dai pad FX (v1.9.7) |
| F-06 | — | Loudness normalization LUFS per clip | **FATTA** (v1.4.3) |
| F-11 | — | Undo/Redo playlist | **FATTA** (v1.5.0) |
| F-13 | — | BPM detection automatica | **FATTA** (v1.8.0), usata dall'Automix dalla v1.10.21 |
| F-25 | Medio | Controllo remoto da tablet | **FATTO** in forma HTTP+WS+PIN (v1.11.3). OSC/TouchOSC resta un'ipotesi non pianificata |
| F-07 | Medio | Metadata streaming Icecast/Shoutcast ("Now Playing") | **SOSPESO** — da riprendere insieme al Passo 3 (LIVE) |
| F-12 | Alto | Voice Tracking / registrazione inserti | **SOSPESO** — l'utente non è convinto che serva |

### Miglioramenti minori annotati
- **Decongestione topbar** — parzialmente affrontata (brand compattato v1.9.7, menu FILE raggruppato v1.10.19); con ARM tornato visibile (v1.15.30) lo spazio è di nuovo da tenere d'occhio.
- **Pulizia `hiddenColumnIds` orfani** — innocui, deliberatamente non fatta.

---

## ⏸️ Sospeso con motivazione

- **Ducking mic-only sui mixer esterni** — indagine chiusa il 2026-07-02: l'ingresso USB del Rødecaster presenta a Windows il **mix principale**, non il solo microfono; tutte le vie Chromium senza uscita. Lo Smart Mic è tornato visibile (v1.15.30) per il **microfono USB diretto**, con l'avviso sui mixer scritto nella UI e nel manuale. Il caso mixer torna con la cattura nativa (cpal) nella 2.0.0/Tauri.
- **Output device multi-routing** (Main/Cue/Monitor separati) — richiede hardware e test cross-platform.
- **Migrazione Tauri/Rust 2.0.0** — rimandata. È il punto naturale per resettare la percezione del numero di versione.

---

## 🏛️ Decisioni consolidate da non rimettere in discussione

- **Il take-over e le regole di mix li determina la COLONNA**, non un flag per-clip (behavior `Stacco` rimosso in v1.15.15; il campo resta nel modello solo per compatibilità `.lmp`).
- **Solo italiano e inglese** — app, guida rapida, manuale e note di rilascio (dalla 1.15.32). Nuove chiavi i18n solo in `it.json` + `en.json`; `supportedLngs: ['en','it']` fa ripiegare su inglese chi aveva una lingua rimossa.
- **Ciclo di rilascio**: si eliminano le release precedenti; il changelog della versione **è** il corpo della release, in italiano (`<ver>.md`) e inglese (`<ver>.en.md`, obbligatorio). L'updater mostra **solo** il corpo dell'ultima release → le note devono essere **cumulative** dall'ultima versione che gli utenti potrebbero avere.
- **La CI non usa lo storage artifact in modalità release** (bozza → upload diretto → publish finale).
- **Nessuna vendita** — dal settembre 2026 il programma è software libero MIT, distribuito solo da GitHub; macOS si compila dal sorgente.
- **Schermate del manuale** si rifanno con gli script (`manuale-utente/capture-app.js`, `capture-extra.js`, `finalize-screenshots.py`) su Vite :5199 — config "Renderer (Vite, porta capture manuale)" in `.claude/launch.json`.

---

## ✅ Archivio sintetico delle milestone

| Versione | Contenuto |
|---|---|
| **1.15.32** | App **solo italiano e inglese** · schermata di benvenuto con tendina lingua · manuali IT/EN aggiornati con schermate nuove e pubblicati · note di rilascio bilingui e cumulative |
| **1.15.31** | Hero IN ONDA sempre presente e card clip senza scatti |
| **1.15.30** | Torna Smart Mic (microfono USB diretto) |
| **1.15.16-29** | **Chiusura della revisione totale del codice**: 4 gravi, 8 medie, 10 lievi — una patch atomica per reperto |
| **1.15.14-15** | Portabilità dei progetti esportati (riparazione path via `audio/`) · rimozione del behavior Stacco |
| **1.15.11-13** | Fader percettivo (curva cubica) · waveform fedele · VU meter rifatto (scala dB + peak-hold) |
| **1.15.9-10** | L'archivio export **diventa** il riferimento · fix critico della chiusura durante l'update |
| **1.15.6** | Localizzazione integrale: 461 chiavi × 8 lingue, main process incluso (ridotte a IT+EN nella 1.15.32) |
| **1.11.5** | Auto-updater reale (electron-updater + RRLMP-Releases) |
| **1.11.3** | Controllo remoto HTTP+WS+PIN da tablet |
| **1.10.x** | Automix (fasi A-D) · pad FX · libreria FX di default · layout colonne configurabile |
| **1.8.0** | BPM detection |
| **1.6.0** | Restyling "Spectrum Live" |
| **1.5.0** | Undo/Redo playlist |
| **1.4.x** | Revisione regia (33 reperti) · loudness EBU R128 · Glue multibanda · rotazione PRE-SHOW |
| **1.3.0** | Milestone "Zero Criticità" |
| **1.0.0** | i18n · Master Chain · Smart Mic · Waveform Editor |

---
*Roadmap allineata alla v1.15.32 (2026-09-13). Lo storico fix versione per versione è in [`relazione.md`](../relazione.md); la revisione del codice in [`technical/REVISIONE-CODICE-2026-07-28.md`](./technical/REVISIONE-CODICE-2026-07-28.md).*
