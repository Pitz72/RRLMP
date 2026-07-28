# RRLMP — Roadmap & Backlog

**Versione corrente:** 1.15.30 (⚠️ **non ancora rilasciata** — l'ultima pubblicata su RRLMP-Releases è la 1.15.15)
**Ultimo aggiornamento:** 2026-07-28 — dopo la [revisione totale del codice](./technical/REVISIONE-CODICE-2026-07-28.md) e la chiusura di tutti i suoi reperti

Scope del prodotto: **regia umana per show finiti** (podcast, eventi, web radio). Nessuna automazione 24h. L'unica eccezione controllata è la rotazione PRE-SHOW — vedi [VISION.md](./VISION.md).

---

## 📊 Stato attuale

| Area | Stato |
|------|-------|
| Typecheck (renderer/main/preload) | **0 errori** su tutti e 3 |
| Test Vitest | **224/224 verdi** (23 file) — erano 172 prima della revisione |
| Build di produzione | `vite build` verde |
| Criticità aperte del codice | **nessuna** — i 22 reperti della [revisione 2026-07-28](./technical/REVISIONE-CODICE-2026-07-28.md) sono chiusi nelle versioni 1.15.16 → 1.15.29 |
| Ultima release **pubblicata** | v1.15.15 — le 15 versioni successive sono committate ma **non ancora rilasciate** |
| Auto-updater | operativo (nativo su Windows/Linux-AppImage, fallback browser su macOS/.deb) |
| Distribuzione Gumroad | pacchetti fermi alla 1.15.10 — scelta deliberata: gli utenti si aggiornano dall'updater |

---

## 🔴 Priorità 1 — Prima del prossimo rilascio

Le versioni 1.15.16 → 1.15.30 sono in `master` ma non sono ancora arrivate a nessuno.

1. **Verificare in dev/regia** i punti non verificabili con i test automatici (elenco sotto).
2. **Changelog cumulativo** per la versione che si rilascia: deve includere tutte le novità dalla 1.15.16 in poi, altrimenti chi aggiorna dalla 1.15.15 non le vede mai (pattern già usato per 1.15.13 e 1.15.15).
3. Ciclo di rilascio abituale: eliminare la release precedente, poi `gh workflow run build.yml -f publish_release=true`.

### Verifiche sul campo aperte da queste correzioni

- **Share di rete reale** (1.15.20): riprodurre un brano che sta su NAS/cartella condivisa. Coperto da 34 test sulla costruzione dei percorsi, ma la lettura vera da rete non è simulabile.
- **Distacco di un supporto durante la registrazione** (1.15.21): la sessione deve chiudersi salvando quanto raccolto, non restare bloccata.
- **Tasti F1–F6** (1.15.26): F6 ora lancia PRE-SHOW; nascondendo una colonna i tasti si rimappano.
- **Esportazione su cartella `audio/` preesistente** (1.15.17): al primo export deve comparire l'avviso e nessun file estraneo deve sparire.
- **"Riavvia e installa" con progetto sporco** (1.15.19): deve chiedere Salva / Non salvare / Annulla.
- **Smart Mic con microfono USB** (1.15.30): armare il microfono e verificare che la musica scenda parlando e risalga smettendo.

---

## 🎙️ Filone aperto — Voce in diretta e integrazione con StreamFlow

Aperto il **2026-07-28** partendo da un problema reale in onda: una speaker con microfono USB e senza mixer, il cui sottofondo musicale ondeggiava da solo sullo stream. La diagnosi ha toccato tre software e ha aperto un percorso.

### Come è nato

Misure su una registrazione reale di 17'30" (FFmpeg, EBU R128 + inviluppo a bande):
- il sottofondo **non si abbassa** quando la speaker parla (differenza 1,4 dB → nessun ducking da nessuna parte);
- loudness **−22,3 LUFS** contro un target di −16 → 6 dB sotto gli altri streamer;
- escursione **16,2 LU**, non compressa → il file analizzato è a monte di AzuraCast.

Causa individuata in **StreamFlow**: `getDisplayMedia({ audio: true })` senza vincoli faceva applicare a Chromium il proprio *auto gain control* all'audio di sistema. Concausa a valle: arrivando 6 dB sotto, il compressore di AzuraCast lavorava molto su quella sorgente e ne amplificava l'ondeggiamento. **Corretto in StreamFlow 0.8.1–0.8.3** (AGC spento, limitatore, livello a −16 LUFS).

> Ricaduta su RRLMP da verificare: l'agente di StreamFlow ha **misurato** che il `DynamicsCompressorNode` di Chromium applica un makeup implicito di ~0,57 dB per ogni dB di soglia, e che con soglia −1 dBFS e ratio 20 **il tetto non regge** (uscita sopra 0 dBFS già a +6 dB di sovraccarico). Il limiter della master chain di RRLMP ha esattamente quei parametri: **rifare la stessa sonda dentro RRLMP** e, se confermato, correggere.

### Passo 1 — Microfono in RRLMP ✅ avviato (v1.15.30)

Smart Mic riattivata. Restano da fare, in ordine:

1. **Interruttore ducking on/off** — oggi armare il microfono implica l'abbassamento automatico della musica; vanno separate le due cose.
2. **Compressore sulla voce** — `DynamicsCompressorNode` con trim di compensazione del makeup implicito (vedi nota sopra: va misurato, non stimato).
3. **Equalizzatore** — tre `BiquadFilter` in cascata: taglio del rumble, controllo del corpo, presenza sui 3–4 kHz.
4. **Riduzione rumore** — partire dall'expander costruito sul gate già presente in `MicManager` (copre ventola, fruscio, riverbero di stanza). Il `noiseSuppression` di Chromium è gratis ma fa artefatti sulla voce radiofonica; RNNoise via WebAssembly è la strada di qualità, ma è una dipendenza nuova.

⚠️ Nodo architetturale da sciogliere prima del punto 2: oggi `MicManager` **analizza** il microfono ma non lo instrada all'audio. Comprimere ed equalizzare ha senso solo se la voce processata esce da qualche parte — cioè solo insieme al passo 3.

### Passo 2 — `stream-core`: motore di streaming condiviso

I moduli di streaming di StreamFlow (`ffmpeg-manager`, `metadata-manager`, `connection-diagnostic`, `zmq-command`, `credentials`) sono **1.389 righe già disaccoppiate**: importano solo builtin di Node, `electron`, `ffmpeg-static` e se stessi — **zero dipendenze dal renderer, dallo store o da React**. Unico aggancio da sciogliere: `BrowserWindow` usato dentro `ffmpeg-manager` per notificare lo stato, da sostituire con una callback iniettata.

Il confine è già nel punto giusto: in MIX MODE FFmpeg riceve il PCM da `pipe:0`, quindi il motore **non sa già oggi** da dove arriva l'audio.

Forma proposta: repo dedicato + dipendenza git con tag (`"stream-core": "github:Ecosystem-Runtime/stream-core#v1.0.0"`). Nessun registry, nessun monorepo, e **ogni app adotta la versione quando vuole** — una diretta non dipende dai lavori sull'altro prodotto.

### Passo 3 — LIVE dentro RRLMP (integrazione, non fusione)

**Decisione dell'utente (2026-07-28): StreamFlow resta un prodotto autonomo** per chi non usa Live Machine. Quella che entra in RRLMP è un'integrazione, non un assorbimento.

Forma richiesta:
- un **pulsante LIVE** nella barra in alto;
- un **pannello di configurazione della diretta** (server, credenziali, bitrate, metadati);
- **MIX MODE non va portato**: in RRLMP non serve. Il segnale è già interno.

Il punto di prelievo esiste già: il **`recordingBus`** della master chain (tap dopo il limitatore, oggi usato da `AudioRecorder`). Si collega lì lo stesso AudioWorklet di StreamFlow e si manda il PCM al main via IPC — meccanismo identico a quello già collaudato.

Cosa si guadagna:
- **niente cattura di sistema** → l'AGC di Chromium non può più esistere, e le notifiche di Windows non finiscono più in onda;
- **un solo microfono**, processato una volta: ducka la musica in modo nativo e va allo stream (è ciò che dà senso al passo 1);
- **"now playing" automatico**: StreamFlow ha il metadata manager ma non sa cosa suona; RRLMP conosce titolo e artista di ogni clip.

⚠️ Contro da governare: oggi sono due processi separati, e se RRLMP si pianta la connessione allo stream resta viva (non si perde lo slot su AzuraCast). Integrando, un crash porta giù anche la diretta. Mitigazione: encoder e connessione nel **main process**, che sopravvive a un crash del renderer.

---

## 🟡 Priorità 2 — Debito tecnico annotato

- **`music-metadata` / `file-type`** — vulnerabilità di gravità alta (ciclo infinito nel parser ASF su file `.wma`/`.asf` malformati). La correzione richiede il salto major `7.14 → 11.x`, con interfaccia completamente diversa: **sessione dedicata**, con verifica su file reali. Attenuazione già presente: la lettura dei tag gira sotto `withIpcTimeout(10s)`.
- **`uuid`** — vulnerabilità media che riguarda modalità non usate dall'app (gli identificatori vengono da `crypto.randomUUID`). Da sistemare quando capiterà un aggiornamento major delle dipendenze.
- **Aggiornamento generale delle dipendenze** — `npm audit fix` automatico tocca decine di pacchetti dell'ambiente di sviluppo: da fare e verificare per conto suo, mai insieme a delle correzioni.

---

## 🟠 Priorità 3 — Verifiche sul campo di feature precedenti

Cose implementate e non ancora validate nell'uso reale:

- **v1.15.15 in diretta vera** — l'utente ha verificato in regia il 2026-07-22 (progetto spostato di cartella, sigla, FX, voce, sottofondo: tutto ok, nessuna regressione dalla rimozione dello Stacco). Resta l'osservazione durante una diretta reale completa.
- **Preset Glue Multibanda non-neutri** (rock/jazz/elettronico, v1.7.0) — valori di partenza plausibili ma **mai misurati** con il rigore del preset `neutro`. Richiedono ascolto critico.
- **I 10 suoni FX di default** (v1.10.8) — curati via metadata Wikimedia (solo CC0/Public Domain), **mai ascoltati**.
- **Automix beat-match su musica reale** — il motore puro è coperto da 26 test, l'orchestrazione live no.
- **Plausibilità BPM su musica reale** — validato su toni sintetici a ritmo perfetto.

---

## 🟢 Priorità 4 — Feature aperte

| ID | Effort | Descrizione | Nota |
|----|--------|-------------|------|
| F-04 | Basso | Soundboard rapida jingle/stinger | **CHIUSA**: i pad FX (v1.9.7) coprono il caso d'uso |
| F-06 | — | Loudness normalization LUFS per clip | **FATTA** (v1.4.3) |
| F-11 | — | Undo/Redo playlist | **FATTA** (v1.5.0) |
| F-13 | — | BPM detection automatica | **FATTA** (v1.8.0), usata dall'Automix dalla v1.10.21 |
| F-25 | Medio | Controllo remoto da tablet | **FATTO** in forma HTTP+WS+PIN (v1.11.3). OSC/TouchOSC resta un'ipotesi non pianificata |
| F-07 | Medio | Metadata streaming Icecast/Shoutcast ("Now Playing") | **SOSPESO** — da definire cosa mostrare quando si torna al parlato |
| F-12 | Alto | Voice Tracking / registrazione inserti | **SOSPESO** — l'utente non è convinto che serva (non è regia automatizzata) |

### Miglioramenti minori annotati
- **Zoom del Waveform Editor** — oggi è cosmetico (stira le 200 barre senza aggiungere risoluzione). Evoluzione possibile: generare più punti e aggregarli lato renderer in base allo zoom.
- **Decongestione topbar** — parzialmente affrontata (brand compattato in v1.9.7, menu FILE raggruppato in v1.10.19).
- **Pulizia `hiddenColumnIds` orfani** — innocui, deliberatamente non fatta.

---

## ⏸️ Sospeso con motivazione

- **Ducking mic-only sui mixer esterni** — indagine chiusa il 2026-07-02: l'ingresso USB del Rødecaster presenta a Windows il **mix principale**, non il solo microfono; tutte le vie Chromium sono risultate senza uscita. L'ARM è nascosto dietro `MIC_ARM_ENABLED=false` (`utils/featureFlags.ts`), la logica resta intatta. Ritorno previsto con la cattura nativa (cpal) nella 2.0.0/Tauri.
- **Output device multi-routing** (Main/Cue/Monitor separati) — richiede hardware e test cross-platform.
- **Migrazione Tauri/Rust 2.0.0** — rimandata. È il punto naturale per resettare la percezione del numero di versione.

---

## 🏛️ Decisioni consolidate da non rimettere in discussione

- **Il take-over e le regole di mix li determina la COLONNA**, non un flag per-clip. Il behavior `Stacco` è stato rimosso nella v1.15.15 proprio perché ridondante e fuorviante (il campo resta nel modello solo per compatibilità `.lmp`, come `duckingRole`).
- **Manuale utente: solo IT + EN.** Interfaccia dell'app e guida rapida in-app restano a 8 lingue.
- **Ciclo di rilascio**: si elimina la release precedente prima di pubblicare la nuova; il changelog della versione **è** il corpo della release.
- **La CI non usa più lo storage artifact in modalità release** (bozza → upload diretto → publish finale): la quota GitHub piena bloccava i rilasci.
- **Nessun ricarico su Gumroad a ogni patch** — gli utenti si aggiornano dall'updater.

---

## ✅ Archivio sintetico delle milestone

| Versione | Contenuto |
|---|---|
| **1.15.16-29** | **Chiusura della revisione totale del codice**: 4 gravi, 8 medie, 10 lievi — una patch atomica per reperto |
| **1.15.14-15** | Portabilità dei progetti esportati (riparazione path via `audio/`) · rimozione del behavior Stacco |
| **1.15.11-13** | Fader percettivo (curva cubica) · waveform fedele · VU meter rifatto (scala dB + peak-hold) |
| **1.15.9-10** | L'archivio export **diventa** il riferimento · fix critico della chiusura durante l'update |
| **1.15.6** | Localizzazione integrale: 461 chiavi × 8 lingue, main process incluso |
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
*Roadmap allineata alla v1.15.15. Lo storico fix versione per versione è in [`relazione.md`](../relazione.md); le criticità aperte del codice nella [revisione 2026-07-28](./technical/REVISIONE-CODICE-2026-07-28.md).*
