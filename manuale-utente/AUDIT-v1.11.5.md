# Audit manuale ↔ codice — da v1.2.0 a v1.11.5

Documento di lavoro. Confronta il manuale esistente (scritto per **v1.2.0**, PDF consegnato v1.2.4)
con la verità di base estratta dal codice sorgente di **v1.11.5**. Ogni voce è tracciata a
`file:riga`. Serve da specifica per la riscrittura 1:1 del manuale italiano.

Legenda: **[ERR]** = il manuale dice il falso · **[OBS]** = obsoleto/superato ·
**[NEW]** = funzione reale non documentata · **[OK]** = confermato corretto.

---

## A. Cambiamenti globali (toccano tutto il manuale)

- **[OBS] Versione**: il manuale cita `1.2.0` in cap1, colophon e ovunque. Va portato a **1.11.5**.
- **[ERR] «Cinque colonne»** — è il pilastro narrativo di cap1/cap3/cap4/cap6, ma il codice
  (`useProjectStore.ts:138-190`) definisce **7 colonne**:
  1. `col-assets` — **SHOW ASSETS** · verde `#10B981` · type `asset`
  2. `col-jingle` — **JINGLE** · ambra `#F59E0B` · type `asset`  *(nuova, v1.3.21)*
  3. `col-promo` — **PROMO** · ciano `#06B6D4` · type `asset`  *(nuova, v1.3.21)*
  4. `col-music` — **CANZONI DELL'EPISODIO** · rosso `#EF4444` · type `music`
  5. `col-voice` — **VOCI / PREREGISTRAZIONI** · arancio `#F97316` · type `voice`
  6. `col-sfx` — **SFX / CARTWALL** · ardesia `#64748B` · type `sfx` → **fuori dalla griglia**
  7. `col-preshow` — **PRE-SHOW** · viola `#8B5CF6` · type `preshow`
  In griglia si vedono **6 colonne** (`MainGrid.tsx:537` filtra `type !== 'sfx'`); gli SFX vivono nel **pad FX**.
  Le colonne si possono nascondere singolarmente (Impostazioni → Generali → Layout regia, `hiddenColumnIds`).
- **[ERR] `Esc` shortcut globale di sistema** — cap3/cap4/cap8 affermano che `Esc` (STOP ALL)
  funziona anche a finestra non attiva. **Falso da v1.4.13** (`App.tsx:251-254`): il `globalShortcut`
  è stato rimosso per far consumare `Esc` alle modali. `Esc` funziona come STOP ALL solo con l'app a fuoco
  (anche mentre si è in un campo di testo, ma non con l'app in background).
- **[OBS] Aggiornamenti** — modello vecchio «vai sul sito e scarica» (cap2, cap11, cap12).
  Da v1.11.5 c'è un **auto-updater reale** (vedi §B).
- **[ERR] «codice sorgente disponibile pubblicamente»** (cap2, nota SmartScreen) — oggi la repo di
  sviluppo è **privata**; pubblica è solo `Ecosystem-Runtime/RRLMP-Releases` (solo binari). Correggere.
- **[OBS] Microfono** — `MIC_ARM_ENABLED=false` (`featureFlags.ts:29`): la tab «Microfono» delle
  Impostazioni è **filtrata via** (`GeneralSettingsModal.tsx:209`) e il pulsante ARM in topbar è
  nascosto (`GlobalControls.tsx`). **In v1.11.5 l'intero microfono è irraggiungibile dall'utente.**
  Il motore (MicManager, ducking mic, recording bus) resta intatto ma dormiente. Ritorno previsto in v2.0/Tauri.
  → Impatta cap3 (pulsante ARM), **cap7 intero**, cap6 (§ducking mic), cap9 (§Mic-in-Mix), cap11.4 (§Microfono), cap12.

---

## B. Funzioni reali NON documentate (da aggiungere)

- **[NEW] Pad FX «jingle machine» 5×5** (`FxPadOverlay.tsx`) — overlay non bloccante in basso
  (sinistra/destra, preferenza persistita), sostituisce la colonna FX. Doppio livello di config:
  modale **rapida** (nome/colore/volume/loop) e Impostazioni complete. Toggle «FX» in topbar; badge conteggio SFX attivi.
- **[NEW] Vista Automix** (`AutomixView.tsx`) — schermata a deck stile DJ sulla colonna Musica.
  Pallini di compatibilità BPM (verde/giallo/rosso), crossfade beat-matched, pulsantone di transizione,
  modalità **«auto a fine brano»** (default OFF, attiva solo a vista aperta). Toggle «MIX» in topbar. z-30, sopra la board.
- **[NEW] Controllo Remoto via browser** (v1.11.3, `RemoteControlServer.ts`, `remoteControlAssets.ts`) —
  server HTTP+WebSocket locale, **porta 8787**, bind `0.0.0.0` (tutta la LAN). Attivazione da Impostazioni →
  Generali → «Controllo Remoto (Beta)». **PIN 6 cifre** rigenerato a ogni avvio (nessun persist), rate-limit
  5 tentativi/15 min. Da browser (tablet/telefono) si controlla la colonna **Musica**: play/stop clip e Stop All
  (whitelist `stopAll`/`playClip`/`stopClip`). Pulsante «Copia link» → `http://<ip>:8787`.
- **[NEW] Auto-Updater** (v1.11.5, `updateManager.ts`, `UpdateModal.tsx`) — doppio percorso:
  - **Windows NSIS + Linux AppImage**: `electron-updater` nativo, `autoDownload:false` (scarica solo su clic),
    check 3 s dopo l'avvio, install al quit.
  - **macOS non firmato + Linux .deb**: fallback via GitHub Releases API → apre il browser sull'asset.
  Gating **«mai durante la diretta»**: il popup automatico si accoda se `onAirStartTime !== null` e si apre a
  diretta finita; il pulsante «Controlla aggiornamenti ora» in Info ignora il gating (azione esplicita).
- **[NEW] Playout Log** (`PlayoutLogModal.tsx`, cap 2000 voci) — registro cronologico dei lanci; icona in topbar.
- **[NEW] Undo/Redo scaletta** — `Ctrl+Z` / `Ctrl+Y` (`Ctrl+Shift+Z`), profondità 50 (`useProjectStore.ts:258`). Menu Strumenti.
- **[NEW] Import M3U** — voce «Importa M3U» nel menu FILE.
- **[NEW] BPM automatico** — analisi BPM sulle clip della colonna Musica; badge `### BPM` sulla card.
- **[NEW] Omologazione loudness** — normalizzazione a **−16 LUFS** (EBU R128), **attiva di default**
  (`useSettingsStore.ts:94`, `loudnessNormEnabled=true`). Tab Master Chain.
- **[NEW] Debug Overlay** — `Ctrl+Shift+D` (già in memoria progetto): buffer 200 FIFO, export COPY.
- **[NEW] MIDI Simulator** — `Ctrl+Shift+M`, modale di test MIDI.
- **[NEW] Rotazione Jingle&Promo** — la colonna PRE-SHOW ha una rotazione configurabile
  (ogni N tracce inserisce jingle/promo); pulsante rotazione nell'header PRE-SHOW.
- **[NEW] Salvataggio atomico + backup** — save atomico (`.tmp`+rename), `.bak` per progetto,
  autosave in `userData/autosaves/` con **rotazione max 10** (non «un solo .bak ogni 5 minuti»).

---

## C. Delta per capitolo

### Cap 1 — Filosofia
- **[OBS]** §1.4 «Le cinque colonne» → sei colonne visibili + pad FX (riscrivere la tabella e la grammatica).
- **[OBS]** §1.5 versione 1.2.0 → 1.11.5; l'indicatore aggiornamenti ora è l'auto-updater.
- **[OK]** Filosofia Single Show, `.lmp`, Main-Side-Heavy, `media://` — tutto confermato dal codice.

### Cap 2 — Installazione e primo avvio
- **[ERR]** Nomi installer con `1.2.0` → `1.11.5` (`Runtime-Live-Machine-Pro-1.11.5.exe`, `artifactName` in package.json).
- **[ERR]** Nota SmartScreen «codice sorgente pubblico» → falso (repo privata; pubblici solo i binari di release).
- **[OBS]** §2.5 Welcome: indicatore aggiornamenti verde/giallo → ora **popup auto-updater** con «Scarica».
- **[OBS]** §2.6 badge PRO: confermato in topbar (`RLM PRO`, gradiente ciano→verde→ambra→rosso), ma la
  descrizione «FFmpeg/`media://` in ascolto» va mantenuta come dettaglio tecnico, non come funzione del badge.

### Cap 3 — Interfaccia
- **[ERR]** Toolbar: la topbar reale ha **menu FILE** (Nuovo, Salva, Salva come, Carica, **Importa M3U**, Esporta Archivio),
  toggle **FX** e **MIX**, menu **Strumenti** (Undo/Redo, MIDI Learn, Keybinds, Impostazioni, Info),
  **Playout Log**, **Recording**, **On Air Timer**, **orologio**. Non c'è un pulsante «MIDI Learn» isolato: è nel menu Strumenti.
- **[ERR]** Pulsante **ARM Microfono**: nascosto (flag off) → rimuovere da cap3.
- **[ERR]** §3.2 «Griglia a cinque colonne» → sei visibili + SFX nel pad FX; aggiungere JINGLE e PROMO.
- **[ERR]** DEAD AIR: soglia reale **< 20 s** (non «circa 20 s»), badge testuale **«END»** + icona, per-colonna,
  solo se la clip è l'ultima, in play, non in loop (`ColumnHeader.tsx:52-75`). Palette **30 colori** confermata.
- **[ERR]** Card: badge reali = STACCO, LOOP, NEXT, ▶ UP NEXT, TRIM…, **BPM**, FADE OUT, nota 📋; keybind mostrato
  come lettera/M-nota; timer rosso < 15 s. Cue: `INTRO: -MM:SS`, `OUTRO IN: -MM:SS`, `🚨 OUTRO`.
- **[ERR]** Interazione: doppio clic **non** implementato (= clic singolo); tasto destro apre le Impostazioni clip
  (non un menu con Edit/Remove).

### Cap 4 — Workflow base
- **[OK]** Drag & drop, percorso assoluto, linea d'inserimento blu.
- **[ERR]** Formati import: confermare da `audioExtensions.ts` (l'audit non ha ispezionato la lista esatta — **da verificare**).
- **[ERR]** Esclusione per colonna e regola «SFX sempre pieni»: gli SFX **scendono al 50%** con voce attiva
  (`useAudioStore.ts:195`), non sono del tutto fuori dal ducking. Correggere qui e in cap6.
- **[ERR]** `Esc` non è globale di sistema (vedi §A).

### Cap 5 — Proprietà clip e Waveform Editor
- **[OK]** Gain 0–150% (0.0–1.5), non distruttivo, quattro handle.
- **[ERR]** Colori handle reali: Trim Start/End **rossi** `#ef4444` (non «verdi»); Intro **ciano** `#22d3ee`
  (non «gialla»); Outro **arancio** `#fb923c`. Zoom **1×→8×** a step [1,2,3,4,6,8].
- **[ERR]** Auto-Trim: soglia **dinamica** (media − 25 dB, clamp −55…−20; fallback −40 dB), non fissa a −40 dB.
- **[NEW]** Smart Cues: rilevamento automatico Intro/Outro (soglia media − 3 dB) oltre all'Auto-Trim.
- **[ERR]** Next Action reali: **Stop / Play Next** (l'enum ha `loop` ma non è esposto: il loop è il toggle `isLooping`).
  Rivedere la sezione che presenta «Loop» come Next Action.
- **[ERR]** Fade In/Out: range **0–60000 ms**, curva **lineare**. Confermare gli esempi.
- **[ERR]** Anteprima transizione: pulsante **«Test →»**, disponibile solo se esiste una clip successiva; riproduce
  gli ultimi secondi. Keybind clip assegnato via modale **Keybinds** (menu Strumenti) oltre che nelle Impostazioni clip.

### Cap 6 — Motore di mixaggio
- **[OK]** Ducking musica a **0.2 (≈ −14 dB)**, fade 500 ms; Music Dominance (asset → 0 con musica attiva); stacco fade 100 ms.
- **[ERR]** SFX «sempre a volume pieno, mai duckati» → **duck al 50% con voce**.
- **[ERR] Master Chain (grave)**: il manuale dice HPF **80 Hz** + compressore singolo **4:1 a −18 dBFS**.
  Realtà (`AudioContextManager.ts`): **HPF 30 Hz** (Q 0.7) + **glue multibanda a 3 bande**
  (LR4; soglie −30/−26/−30 dBFS; ratio 2.0/2.0/1.6) + **limiter −1 dBFS, 20:1**, attacco 2 ms, rilascio 100 ms.
  Stile glue selezionabile (Neutro/Rock/Jazz/Elettronico). Tutto **attivo di default**.
- **[NEW]** Omologazione loudness **−16 LUFS** attiva di default (da documentare qui).
- **[OBS]** § ducking microfono → funzione dormiente (flag off); rimuovere o spostare in nota «in arrivo».

### Cap 7 — Il microfono in regia
- **[OBS] Intero capitolo** descrive funzioni **irraggiungibili** in v1.11.5 (ARM, Smart Mic, Mic-in-Mix).
  Decisione editoriale necessaria (vedi §D). Se si mantiene, va etichettato come «temporaneamente non disponibile».

### Cap 8 — Hardware, routing, controllo
- **[OK]** Selezione device output (`enumerateDevices` + `setSinkId`), fallback automatico, latenza gestita dall'OS.
- **[ERR] Tastiera globale (grave)**: **non esistono F1–F5** per lanciare le colonne. Reali:
  `Esc` = STOP ALL · `Ctrl+Shift+D` = Debug · `Ctrl+Shift+M` = MIDI Simulator · `Ctrl+Z`/`Ctrl+Y` = Undo/Redo ·
  `Delete`/`Backspace` = elimina clip selezionate. Riscrivere l'intera tabella.
- **[OK]** Keybind per clip (`e.code`), rilevamento conflitti; disabilitati in input di testo.
- **[ERR]** MIDI: Note On + CC (Note Off ignorato), su 16 canali. MIDI Learn via modale **Keybinds/Strumenti**.
  Bind clip nel `.lmp`; bind globali (Stop All, Master Volume) in **localStorage**, non nel `.lmp`. Correggere §portabilità.

### Cap 9 — Registrazione
- **[OK]** Cattura master **post-limiter**; overhead trascurabile.
- **[ERR]** Formato nativo interno = **Opus/WebM 320 kbps**; cap memoria **~4 h** (14400 chunk). Export FFmpeg a
  WAV/FLAC/MP3/OGG/WEBM (+ m4a/aac ammessi). Bitrate 128/192/256/320; profondità 16/24/32 (**default 24**).
- **[OBS]** § «Uso con Mic-in-Mix» → funzione dormiente; rimuovere o marcare.

### Cap 10 — Progetti e sicurezza dati
- **[OK]** `.lmp` = JSON coi percorsi, non i file; Export Package copia in `audio/`.
- **[ERR] Auto-backup (grave)**: non «un `.bak` ogni 5 minuti nella cartella del progetto». Realtà:
  autosave in `userData/autosaves/` con nome timestamp e **rotazione max 10** (`index.ts:673-691`);
  in più un `.bak` per progetto (pre-save). Percorsi app: `AppData\Roaming\<APP>`. Riscrivere §10.3.
- **[ERR]** Export Package: due modalità (accanto al `.lmp`, oppure cartella libera con `project.lmp` +
  path `audio/<file>`), con dedup e pruning orfani. Precisare.

### Cap 11 — Funzioni avanzate
- **[OK]** NoteBoard (pannello inferiore, mostra la nota della prima clip in play con note); toast.
- **[ERR]** Transizioni: **Crossfade 2000 ms** (overlap), **Segue 800 ms** (entrante subito a pieno),
  **Gapless/Hard Cut** (taglio netto), più «Default Globale» (non persistito). Default PRE-SHOW = crossfade.
- **[ERR]** §11.4 Impostazioni: struttura reale a **5 tab** — Generali (lingua, **Controllo Remoto**, Layout regia),
  Audio & Mix (device, ducking, transizioni), Microfono *(nascosta)*, Registrazione, Master Chain
  (loudness, HPF, glue, limiter). Riscrivere.
- **[NEW]** Aggiungere: Pad FX, Automix, Controllo Remoto, Auto-Updater, Playout Log, Undo/Redo, Import M3U, BPM.

### Cap 12 — Troubleshooting e FAQ
- **[OBS]** FAQ «come aggiorno» → auto-updater. FAQ compatibilità `.lmp` «versione 1.2» → 1.11.5.
- **[OBS]** Backup path/procedura di recupero → `userData/autosaves/`.
- **[ERR]** Rimuovere riferimenti a funzioni mic; correggere `Esc` non globale.

---

## D. Struttura proposta (da confermare)

Manuale attuale: 12 capitoli. Proposta v1.11.5 (Seconda Edizione):

1. Filosofia · 2. Installazione e primo avvio · 3. Interfaccia (6 colonne + topbar reale) ·
4. Workflow base · 5. Proprietà clip e Waveform Editor · 6. Motore di mixaggio (master chain reale + loudness) ·
7. **Pad FX e Automix** *(sostituisce il vecchio cap microfono)* · 8. Hardware, tastiera, MIDI ·
9. Registrazione · 10. Progetti e sicurezza dati · 11. **Controllo Remoto** *(nuovo)* ·
12. **Aggiornamenti** *(nuovo, auto-updater)* · 13. Funzioni avanzate (NoteBoard, colori, transizioni, Impostazioni, Playout Log, Undo/Redo) ·
14. Troubleshooting e FAQ.

Nodo aperto: **cosa fare del microfono** (dormiente) — vedi domanda all'utente.
