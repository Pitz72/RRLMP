# RUNTIME LIVE MACHINE PRO — Piano Post-Release

> **Base**: v1.2.2 — Data documento: 2026-04-11 — **Ultimo aggiornamento**: 2026-04-11 (v1.2.3)
> **Legenda**: ✅ Fatto · ⬜ Da fare · 🔄 In corso · ❌ Non fare / Sospeso · ❓ Da chiarire

---

## Legenda Tipi

| Tag | Significato |
| --- | --- |
| `[BUG]` | Regressione o comportamento errato |
| `[FEATURE]` | Nuova funzionalità richiesta |
| `[ENHANCEMENT]` | Miglioramento di funzionalità esistente |
| `[QUESTION]` | Dubbio aperto, richiede analisi prima di agire |
| `[BRANDING]` | Correzione di naming / identità prodotto |

---

## 01 · [BUG] ClipSettingsModal sovrascrive il colore anche senza toccare il picker

**Problema**: Aprire le impostazioni di una clip (senza toccare il selettore colore) modifica ugualmente il colore della clip, perdendo il colore dinamico della colonna.

**Comportamento atteso**: Se l'utente non interagisce con il color picker, il campo `customColor` della clip deve restare `null` / `undefined`. Il colore si calcola sempre come `effectiveColor = clip.customColor || column.customColor || column.color`.

**File coinvolti**: `ClipSettingsModal.tsx`, logica `useClipStore` relativa a `customColor`.

### Piano · #01

- ✅ Leggere `ClipSettingsModal.tsx` e verificare dove viene inizializzato il colore del picker
- ✅ Correggere: il picker deve partire da `null` (nessun colore impostato) e scrivere `customColor` **solo se l'utente seleziona esplicitamente un colore**
- ✅ Aggiungere un pulsante "↺ Eredita colore dalla colonna" che imposta `customColor = null`

---

## 02 · [FEATURE] Espandere palette colori nel picker della clip

**Richiesta**: La clip può avere un colore personalizzato che la distingue visivamente. La palette attuale è limitata. Uniformarla alla stessa palette delle colonne (12 colori).

**Dipendenza**: Implementare dopo il fix #01 (altrimenti il picker non funziona correttamente).

### Piano · #02

- ✅ Identificare la costante palette colori usata nelle colonne (`COLUMN_COLORS` in `ColumnHeader.tsx`)
- ✅ Riutilizzare la stessa costante nel color picker di `ClipSettingsModal.tsx` (30 colori, griglia 6×5)
- ✅ UI: aggiunta opzione "↺ Eredita colore dalla colonna" visibile solo quando customColor è impostato

---

## 03 · [QUESTION] Silence Detection su file in loop — comportamento coda

**Domanda originale**: Se un file va in loop ma ha una coda silenziosa, il rilevamento del silenzio tiene conto del loop? Quando riparte dall'inizio, la coda viene "saltata"?

**Analisi**: La silence detection attuale imposta i punti `Intro` e `Outro` (cue points). Per un file in loop, la logica dovrebbe:

1. Rilevare il silenzio iniziale (Intro point)
2. Rilevare il silenzio finale / coda (Outro point)
3. Il loop dovrebbe girare tra Intro e Outro, escludendo la coda

**Stato attuale**: Da verificare se il playback in loop rispetta l'Outro point o se suona fino alla fine del file.

### Piano · #03

- ⬜ Verificare in `useAudioStore` / engine di playback: il loop rispetta `outroTime` come punto di fine loop?
- ⬜ Se no: implementare — quando `loopEnabled = true`, il loop riparte da `introTime` alla fine del segmento `outroTime`
- ⬜ Documentare il comportamento nel tooltip del campo Loop in `ClipSettingsModal`

---

## 04 · [QUESTION] La Silence Detection modifica il Trim In/Out o solo le Cue Point?

**Domanda originale**: Il rilevamento del silenzio dovrebbe modificare il trim in/out del brano, non farlo fare a mano all'utente.

**Analisi**: Distinzione importante:

- **Trim In/Out (hard cut)**: taglia il file — il materiale escluso non viene mai letto
- **Intro/Outro cue points (soft cue)**: il file è intero ma la transizione parte/finisce ai punti impostati

La silence detection attuale imposta i cue points Intro/Outro. La domanda è se dovrebbe anche impostare il Trim (e quindi escludere definitivamente il silenzio iniziale/finale dal file).

### Piano · #04

- ❓ Decidere con Simone: silence detection deve agire su **Trim** (hard) o su **Cue Points** (soft)?
- ⬜ Una volta deciso, documentare nel tooltip "Auto-Silence Detection" in UI
- ⬜ Se si decide per il Trim: verificare che il Waveform Editor aggiorni i handle di conseguenza

---

## 05 · [FEATURE] Auto-Silence Detection automatica sulla colonna Music (Canzoni)

**Richiesta**: Come già avviene per PRE-SHOW al drop, anche la colonna Music (Canzoni dell'Episodio) deve triggerare l'auto-silence detection automaticamente quando si caricano clip — senza però impostare il comportamento "Play Next".

**Condizione**: Solo se Intro/Outro **non sono già impostati** (clip "non ancora ottimizzata"). Non sovrascrivere impostazioni manuali.

**File coinvolti**: Logica di drop su colonna Music, `useClipStore`, `useAudioStore.detectSilence`.

### Piano · #05

- ⬜ Identificare dove viene gestito il drop su colonna PRE-SHOW e la chiamata auto-silence
- ⬜ Replicare la stessa logica per la colonna Music, con flag: `if (!clip.introTime && !clip.outroTime)`
- ⬜ Al caricamento di un progetto esistente: scansionare le clip Music prive di cue points e triggerare silence detection in batch (non bloccante — in background con toast)
- ⬜ Aggiungere opzione nelle settings per abilitare/disabilitare questo comportamento automatico

---

## 06 · [FEATURE] Nuova colonna "Jingle" (posizione 2)

**Richiesta**: Spostare stacchi e jingle dalla colonna Assets in una colonna dedicata "Jingle" al secondo posto nel layout.

**Alternativa pratica**: Implementare una **modifica multipla** sulle clip — selezionare N clip e cambiarne categoria/comportamento in blocco.

**Note architetturali**: Il backlog già riporta "Layout Regia 5.0: colonne configurabili/rinominabili" come **SOSPESO** (richiede migrazione `.lmp`). Aggiungere una sesta colonna fissa è meno invasivo ma comunque richiede migrazione del formato.

### Piano · #06

- ❓ Decidere approccio: **colonna fissa aggiuntiva** vs. **bulk edit** sulle clip esistenti
- ⬜ **Se colonna fissa**: pianificare migrazione `.lmp` v2 (aggiungere `jingleClips: []` nel progetto) + aggiornare LMP Integrity Check
- ⬜ **Se bulk edit**: implementare selezione multipla clip (ctrl+click) + context menu "Modifica selezionate" con opzioni categoria, comportamento, colore
- ❌ Non implementare entrambe contemporaneamente — scegliere un approccio

---

## 07 · [BUG] Doppio click su file .lmp apre la Welcome Screen invece del progetto

**Problema**: Aprire un file `.lmp` dal filesystem (doppio click, associazione file OS) porta alla Welcome Screen anziché caricare direttamente il progetto.

**Comportamento atteso**: Come in tutti i software professionali (Audacity, Ableton, Premiere…), il file deve aprirsi direttamente, bypassando la schermata di benvenuto.

**File coinvolti**: `main.ts` (Electron main process) — gestione `open-file` event e `argv` di lancio.

### Piano · #07

- ✅ In `main.ts`: intercettare il path del file `.lmp` da `process.argv`
- ✅ Passare il path al renderer via IPC `open-file` dopo `ready-to-show`
- ✅ In `App.tsx`: `useEffect` su `onOpenFile` carica il progetto e bypassa la Welcome Screen
- ✅ Gestire anche `app.on('open-file', ...)` per Mac — implementato: handler registrato prima di `app.whenReady()`, `mainWindowRef` module-level, `pendingOpenFilePath` per gestire il caso "file aperto prima che la finestra esista"
- ✅ Test file inesistente/corrotto: `toast` di errore, no crash

---

## 08 · [ENHANCEMENT] Rilascio ducking microfono troppo brusco

**Problema**: Con le ultime fix il ducking funziona correttamente, ma il rilascio (quando il microfono si abbassa) è troppo repentino — suona innaturale.

**Stato attuale** (da memory): `releaseHoldMs = 200ms`, `smoothingTimeConstant = 0.10`.

**Standard broadcast**: Il rilascio naturale di un ducking in contesto radiofonico è tipicamente tra **500ms e 1000ms**. La BBC R&D raccomanda un release percettivamente trasparente attorno a 600–800ms per voci over musica.

### Piano · #08

- ✅ In `MicManager.ts`: aggiornato `releaseHoldMs` da 200ms a **600ms**
- ✅ `smoothingTimeConstant` aggiornato da 0.10 a **0.15**
- ⬜ Test soggettivo: ascoltare il rilascio su musica a volume medio — deve sembrare naturale, non "pop"
- ⬜ Esporre `releaseHoldMs` come parametro configurabile in GeneralSettingsModal tab Microfono (futuro)

---

## 09 · [QUESTION] Rodecaster Pro II — MUTE hardware non ferma i picchi di ducking

**Problema**: Anche con il microfono in MUTE sul Rodecaster Pro II, si verificano picchi di ducking nel software. Il segnale audio USB continua a fluire anche quando il canale è mutato sull'hardware.

**Analisi tecnica**: Il Rodecaster Pro II è un'interfaccia USB audio. Il MUTE hardware agisce sul monitoring interno e sull'uscita analogica ma **non interrompe lo stream USB**. Il segnale continua ad arrivare al PC, spesso con rumore residuo o bleed del mix interno. Questo è un comportamento noto e documentato del Rodecaster.

**Non replicabile su microfoni USB standard** (es. Blue Yeti, HyperX) dove MUTE fisico taglia il segnale USB.

### Piano · #09

- ⬜ Ricercare: Rodecaster Pro II USB stream behavior when hardware-muted (confermare il comportamento)
- ⬜ Valutare soluzione software: abbassare soglia del noise gate (`micThresholdDb`) o aggiungere un **floor level** sotto il quale il segnale viene sempre ignorato
- ⬜ Alternativa: aggiungere un pulsante **MUTE SOFTWARE** dedicato in UI (ARM + MUTE separati) che forza `gain = 0` sul `micGainNode` indipendentemente dal noise gate
- ❓ Decidere se documentare come limitazione hardware-specifica o fixare in software

---

## 10 · [BRANDING] Prefisso file registrazione: "RRLMP" → "RLMP"

**Problema**: I file di registrazione vengono salvati con prefisso `RRLMP_REC_YYYY-MM-DD_HH-MM-SS.ext`. "RRLMP" era l'acronimo di "**Radio** Runtime Live Machine Pro". Il nome del software è ora **Runtime Live Machine Pro** → acronimo corretto: **RLMP**.

**File coinvolti**: La logica che genera il nome file di default (probabilmente in `RecordingExportModal.tsx` o nel handler IPC `show-save-dialog-recording`).

### Piano · #10

- ✅ Trovato in `useRecordingStore.ts:88`
- ✅ Sostituito `RRLMP_REC_` con `RLMP_REC_`
- ⬜ Verificare ulteriori occorrenze visibili all'utente (dialog labels, About, etc.) — rinviato

---

## 11 · [FEATURE] Barra di progresso durante l'esportazione registrazione

**Richiesta**: Nel `RecordingExportModal`, durante la fase di trascodifica FFmpeg (es. WebM → MP3), mostrare una barra di avanzamento invece di uno stato "in attesa" generico.

**Analisi tecnica**: FFmpeg emette progress su stderr in formato `frame=... fps=... time=... size=... speed=...`. Il main process può parsare questo output e inviarlo al renderer via IPC durante `convert-recording`.

**File coinvolti**: `main.ts` (handler `convert-recording`), `RecordingExportModal.tsx`, `useRecordingStore`.

### Piano · #11

- ⬜ In `main.ts` handler `convert-recording`: parsare output FFmpeg stderr per estrarre `time=` (posizione attuale) e durata totale
- ⬜ Inviare progress via `mainWindow.webContents.send('recording-export-progress', { percent })` durante la conversione
- ⬜ In `preload.ts`: esporre `onExportProgress(callback)` via contextBridge
- ⬜ In `useRecordingStore`: aggiungere stato `exportProgress: number | null`
- ⬜ In `RecordingExportModal.tsx`: mostrare barra progresso (0–100%) quando `exportProgress !== null`
- ⬜ Gestire il caso in cui FFmpeg non riporta la durata (progress indeterminato → spinner)

---

## 12 · [BUG] Voce nel recording troppo bassa

**Problema**: Il canale microfono nella registrazione risulta con volume molto basso rispetto all'audio principale.

**Analisi architetturale** (da memory v1.2.2):

- `micRecordingGain.gain = 1` se `mixEnabled = false` (Rodecaster/hardware monitor)
- `micRecordingGain.gain = 0` se `mixEnabled = true` (mic già nel recording via master chain)

Se `mixEnabled = false`, il microfono va nel `recordingBus` con gain 1, ma **non passa per il master chain** (HPF + Compressore + Limiter). Il segnale grezzo potrebbe risultare basso se il livello di input del microfono non è calibrato.

Se `mixEnabled = true`, il microfono passa per il master chain con `micVolume` (default 0.8) → il suo contributo al mix registrato dipende dal bilanciamento micVolume/masterGain.

**File coinvolti**: `MicManager.ts`, `AudioContextManager.ts`, `useSettingsStore`.

### Piano · #12

- ✅ Verificato in `MicManager.ts`: `gain=1` in `mixEnabled=false` era troppo basso vs. audio post-limiter
- ✅ `mixEnabled=false`: `micRecordingGain.gain` alzato da `1` a `3` (+9.5 dB boost)
- ✅ Aggiornato anche `updateMixSettings()` con la stessa logica
- ⬜ Test soggettivo: registrare 10 secondi con voce e musica, verificare bilanciamento in DAW esterna
- ⬜ Esporre "Gain mic in registrazione" come setting configurabile (futuro)

---

## Riepilogo Priorità

| # | Tipo | Priorità | Dipendenze | Stato |
| --- | --- | --- | --- | --- |
| 01 | BUG | 🔴 Alta | — | ✅ v1.2.3 |
| 02 | FEATURE | 🟡 Media | Dopo #01 | ✅ v1.2.3 |
| 07 | BUG | 🔴 Alta | — | ✅ v1.2.3 |
| 10 | BRANDING | 🟢 Bassa (quickfix) | — | ✅ v1.2.3 |
| 12 | BUG | 🔴 Alta | — | ✅ v1.2.3 (parziale, test mancante) |
| 08 | ENHANCEMENT | 🟡 Media | — | ✅ v1.2.3 (test mancante) |
| 11 | FEATURE | 🟡 Media | — | ⬜ |
| 09 | QUESTION | ❓ Analisi prima | — | ⬜ |
| 03 | QUESTION | ❓ Analisi prima | — | ⬜ |
| 04 | QUESTION | ❓ Decidere con Simone | — | ⬜ |
| 05 | FEATURE | 🟡 Media | Dopo #04 | ⬜ |
| 06 | FEATURE | 🔵 Bassa | Scelta approccio | ⬜ |

---

*Documento aggiornato progressivamente — spuntare le checkbox man mano che le attività vengono completate.*
