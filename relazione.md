# Relazione Tecnica — Runtime Live Machine Pro

**Ultima analisi**: 15 maggio 2026  
**Versione corrente**: 1.2.7 (commit d7fe551)  
**Stack**: Electron 28.3.3 · React 18.2.0 · TypeScript 5.3.3 · Zustand · Web Audio API · FFmpeg

---

## STORICO FIX

| Versione | Commit | Criticità risolte |
|----------|--------|-------------------|
| v1.2.6 | 7cfefe2 | GR-01, GR-02, GR-03, GR-04, GR-08 (bonus) |
| v1.2.7 | d7fe551 | GR-05, GR-07 (GR-06 già risolto nel codebase) |

---

## 1. CRITICITÀ GRAVISSIME — TUTTE RISOLTE

### ~~GR-01~~ · `setInterval` eterno nel corpo di `create()` Zustand
**Risolto in v1.2.6** · `src/renderer/src/store/useAudioStore.ts`

Aggiunta variabile module-level `_progressLoopStarted` che garantisce un singolo interval per lifetime del modulo, indipendentemente da quante volte React StrictMode o il hot-reload reinizializzano il callback di Zustand.

---

### ~~GR-02~~ · Race condition nel sequencer con generazioni di caricamento
**Risolto in v1.2.6** · `src/renderer/src/store/useAudioStore.ts`

Sostituito il contatore intero `playGenerations` con `playRunIds`: ogni invocazione di `playClip` genera un run-ID UUID casuale. Il load viene accettato solo se il suo ID è ancora il più recente per quella clip, eliminando l'edge case del reset del contatore.

---

### ~~GR-03~~ · Nessun timeout sugli IPC handler asincroni
**Risolto in v1.2.6** · `src/main/index.ts`

Aggiunto `withIpcTimeout()` wrapper con `Promise.race()`. Timeout: 10s per `get-audio-metadata`, 30s per `get-waveform-data` e `detect-silence`. In caso di timeout l'handler ritorna `{ success: false, error: 'IPC_TIMEOUT' }`.

---

### ~~GR-04~~ · Path traversal non validato nel protocollo `media://`
**Risolto in v1.2.6** · `src/main/index.ts`

Aggiunta validazione in tre livelli: `path.normalize()` per risolvere segmenti `..`, `path.isAbsolute()` per bloccare path relativi, whitelist `ALLOWED_MEDIA_EXTENSIONS` per bloccare file non audio (HTTP 403).

---

## 2. CRITICITÀ GRAVI — TUTTE RISOLTE

### ~~GR-05~~ · StreamPlayer: chiusure orfane e loop post-cleanup
**Risolto in v1.2.7** · `src/renderer/src/engine/StreamPlayer.ts`

Aggiunto `this.isLooping = false` come prima istruzione di `cleanup()` per bloccare race con `restartLoop()`. Aggiunti `onIntroReachedCallback = null` e `onOutroReachedCallback = null` completando il rilascio di tutte le chiusure (in precedenza mancavano).

---

### ~~GR-06~~ · `isAnalyzing: true` permanente su errore IPC silence detection
**Già risolto nel codebase** · `src/renderer/src/components/layout/MainGrid.tsx`

Entrambi i path (batch al caricamento progetto e on-drop da OS) presentavano già blocchi `catch` con reset corretto di `isAnalyzing: false`, decremento contatore UI e `silenceChecked: true`. Nessuna modifica necessaria.

---

### ~~GR-07~~ · Export zombie: loop continua dopo chiusura finestra
**Risolto in v1.2.7** · `src/main/index.ts`

Aggiunto `if (win.isDestroyed()) return { success: false }` immediatamente dopo ogni `await setTimeout(5)` nel loop di copia. Il loop si interrompe pulitamente al primo yield successivo alla chiusura della finestra.

---

### ~~GR-08~~ · Stato `fadingClipIds` e `previewingClipIds` non puliti su `stopAll`
**Risolto in v1.2.6** · `src/renderer/src/store/useAudioStore.ts`

`stopAll()` resetta ora entrambi gli array: `fadingClipIds: []` e `previewingClipIds: []`. Badge FADE OUT e stato preview non rimangono orfani dopo Stop All.

---

## 3. CRITICITÀ MEDIE — APERTE (7)

### ME-01 · FFmpeg zombie in `AudioProcessor.ts`
**File**: `src/main/AudioProcessor.ts`  
**Impatto**: processo FFmpeg figlio in esecuzione indefinita su file corrotti o codec non supportati

Il timeout IPC (GR-03) protegge il renderer dall'hang, ma non termina il processo FFmpeg figlio: quando la promise IPC scade, il processo figlio lanciato da `fluent-ffmpeg` rimane in esecuzione consumando CPU finché non produce output o viene terminato dall'OS.

**Fix**: aggiungere `command.kill()` nel handler di timeout interno ad `AudioProcessor`, prima che la promise si risolva con errore.

---

### ME-02 · Nessuna validazione struttura `.lmp` al caricamento
**File**: `src/main/index.ts` (handler `dialog:load-project` e `load-project-path`)  
**Impatto**: stato globale corrotto con file `.lmp` parzialmente scritti o manomessi

```typescript
const parsed = JSON.parse(content) as any;
// clip.path potrebbe essere null, number, array — nessuna verifica
col.clips.forEach((clip: any) => {
    clip.isMissing = !fs.existsSync(clip.path); // crash se clip.path non è stringa
});
```

Un file `.lmp` scritto parzialmente (crash durante auto-save) o con struttura inattesa può corrompere lo stato al caricamento.

**Fix**: validatore di schema (funzione `validateLmpSchema()` o libreria Zod) da eseguire prima del parsing.

---

### ME-03 · Auto-backup: race condition badge "Auto-saved"
**File**: `src/renderer/src/components/ui/GlobalControls.tsx`  
**Impatto**: badge visivo inaffidabile; in casi rari due `setTimeout` paralleli invertono il flag

```typescript
const result = await window.electron.saveProjectSilent(json, ...);
if (result.success) {
    setShowAutoSaved(true);
    setTimeout(() => setShowAutoSaved(false), 3000); // ← nessun cancel del precedente
}
```

Se `saveProjectSilent` impiega > 3s e l'interval di 5 minuti scatta di nuovo, si generano due timeout in conflitto.

**Fix**:
```typescript
if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
badgeTimerRef.current = setTimeout(() => setShowAutoSaved(false), 3000);
```

---

### ME-04 · Output device hot-switch senza retry su device ricollegato
**File**: `src/renderer/src/engine/StreamPlayer.ts`  
**Impatto**: audio rimane sullo speaker di sistema per il resto della sessione dopo riconnessione cuffie

Se il device audio si scollega durante il playback, `setSinkId()` fallisce e fa fallback a `'default'`. Quando il device viene ricollegato, nessun codice ritenta con il device preferito.

**Fix**: sottoscrivere `navigator.mediaDevices.ondevicechange` in `AudioContextManager` e ritentare `setOutputDevice()` su tutti i player attivi.

---

### ME-05 · `MicManager.arm()` lascia stream zombie su eccezione parziale
**File**: `src/renderer/src/engine/MicManager.ts`  
**Impatto**: LED microfono acceso nel browser, accesso audio non rilasciato

Se un'eccezione viene lanciata dopo `getUserMedia()` ma prima che `this.source` venga registrato, il `_cleanup()` nel catch non trova `this.source` e non stoppa le tracce del `MediaStream`. Il browser mantiene il microfono attivo.

**Fix**: salvare immediatamente il riferimento allo stream in una variabile locale prima di qualsiasi operazione che possa lanciare, e garantire `stream.getTracks().forEach(t => t.stop())` nel cleanup indipendentemente dallo stato di `this.source`.

---

### ME-06 · Typecast `as unknown as` su tipi noti
**File**: `useRecordingStore.ts`, `MidiManager.ts`, `main/index.ts`  
**Impatto**: perdita type-safety, errori runtime non rilevati in compile time

```typescript
timerIntervalId: intervalId as unknown as number  // già number, cast ridondante
navigator as unknown as { requestMIDIAccess?: () => Promise<any> }
Readable.toWeb(nodeStream) as unknown as ReadableStream
```

**Fix**: tipizzare correttamente `timerIntervalId` come `ReturnType<typeof setInterval>`, usare type guard per MIDI API, aggiungere `@types/node` override per `Readable.toWeb`.

---

### ME-07 · `evaluateMix` accede allo store ad ogni chiamata
**File**: `src/renderer/src/store/useAudioStore.ts`  
**Impatto**: overhead inutile con molte clip attive e transizioni rapide

`evaluateMix()` chiama `useSettingsStore.getState()` ad ogni invocazione per leggere `duckingFactor` e `duckingDuration`. Con transizioni rapide viene chiamata decine di volte al secondo.

**Fix**: passare `duckingFactor` e `duckingDuration` come parametri a `evaluateMix()`, leggendoli una sola volta nello store chiamante.

---

## 4. CRITICITÀ LIEVI — APERTE (5)

### LI-01 · `ErrorBoundary` non cattura errori asincroni
**File**: `src/renderer/src/components/ui/ErrorBoundary.tsx`

React Error Boundaries catturano solo errori sincroni nel render tree. Promise rigettate, setTimeout e handler IPC che lanciano eccezioni non vengono intercettati: crash silenziosi in console senza mostrare l'error screen.

**Fix**: `window.addEventListener('unhandledrejection', handler)` che mostra un toast di errore non bloccante.

---

### LI-02 · Nessun rate-limit sugli IPC handler dal renderer
**File**: `src/main/index.ts`

Un renderer buggy (loop infinito, click rapido) può spammare `detectSilence` o `get-waveform-data` saturando il main process con N promise FFmpeg parallele.

**Fix**: debounce/throttle per handler oppure semaforo che limita le chiamate concorrenti per tipo.

---

### LI-03 · `console.*` non strutturato in produzione
**File**: multipli

Il codebase usa estensivamente `console.log/warn/error` anche in path critici. In produzione, i log Electron non vengono strutturati né ruotati: in sessioni 24/7 possono occupare GB.

**Fix**: `electron-log` con rotazione automatica e livelli, rimozione dei `console.*` non essenziali.

---

### LI-04 · Singleton audio non distrutti su ricarica webview
**File**: `engine/MicManager.ts`, `engine/MidiManager.ts`, `engine/AudioContextManager.ts`

In hot-reload dev i singleton non espongono `destroy()` e non vengono ripuliti, causando duplicati di listener e AudioContext orfani.

---

### LI-05 · Countdown MIDI Learn attivabile in doppio
**File**: `src/renderer/src/components/ui/GlobalControls.tsx`

Con toggle rapido (< 100ms) di MIDI Learn mode possono coesistere due `setInterval` del countdown per 1-2 cicli prima che il cleanup dell'effect si attivi. Effetto cosmetic (contatore a valori doppi).

---

## 5. FUNZIONALITÀ A BUON PUNTO

| Area | Stato | Note |
|------|-------|------|
| Streaming `media://` | Solido | Nessun caricamento RAM; path traversal bloccato (v1.2.6) |
| Waveform Editor | Buono | 4 handle drag + zoom + ruler adattivo funzionano |
| Crossfade / Segue / Gapless | Solido | Race condition sequencer risolta (v1.2.6) |
| Session Recording | Buono | Pipeline completa: arm → record → export WAV/FLAC/MP3/OGG/WEBM |
| i18n 8 lingue | Completo | react-i18next, tutte le chiavi presenti |
| MIDI Learn | Funzionale | Bind per clip, countdown 15s, VU meter MIDI |
| Auto-Silence Detection | Funzionale | Batch su Music, on-drop su PRE-SHOW; errori IPC gestiti correttamente |
| Smart Mic Ducking | Funzionale | Noise gate con isteresi, ramp duck 60ms/400ms |
| Master Chain (HPF+Comp+Limiter) | Solido | Implementazione corretta via Web Audio API |
| Toast notification system | Solido | Nessun `alert()` bloccante |
| Export Self-Contained | Funzionale | Loop interrotto su chiusura finestra (v1.2.7); timeout IPC (v1.2.6) |
| ConfirmDialog / ThreeWayDialog | Solido | Promise-based, non bloccante |
| Column Color Picker | Solido | `effectiveColor` dinamico, ereditarietà corretta |
| Auto-save 5min | Funzionale | Con race condition UI minore (ME-03) |
| Emergency Stop (Escape) | Solido | `globalShortcut` main-side, non intercettabile dal renderer |
| Drop OS con Drop Indicator | Solido | Posizione precisa, linea blu luminosa |
| LMP Integrity Check | Parziale | Controlla `isMissing` ma non valida schema (ME-02) |
| Open-file da OS (.lmp association) | Funzionale | macOS `open-file` + Windows `argv` |
| Preview Transizione | Solido | `previewingClipIds` resettato su stopAll (v1.2.6) |
| StreamPlayer cleanup | Solido | Tutte le chiusure rilasciate, loop bloccato pre-cleanup (v1.2.7) |
| IPC handler FFmpeg | Solido | Timeout 10s/30s su tutti gli handler critici (v1.2.6) |

---

## 6. FUNZIONALITÀ ROTTE O A RISCHIO

| Funzionalità | Severità | Problema |
|---|---|---|
| Waveform su file corrotti | A rischio | FFmpeg zombie nel main process (ME-01) — UI non si blocca più (GR-03 risolto) ma il processo figlio sopravvive |
| Output audio su device ricollegato | Rotto | Non ritenta `setSinkId` dopo riconnessione (ME-04) |
| Caricamento `.lmp` parzialmente corrotto | A rischio | Nessuna validazione schema (ME-02) |
| Arm microfono con permission error | A rischio | Stream zombie non rilasciato (ME-05) |

---

## 7. FEATURE INDISPENSABILI MANCANTI

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
Registrazione di voiceover nella scaletta con pre-roll e post-roll della clip adiacente. La Session Recording registra l'intera sessione, non i singoli inserti.

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

## 8. RIEPILOGO PRIORITÀ ATTUALE

### Criticità aperte da pianificare

| ID | Severità | Effort | Descrizione |
|----|----------|--------|-------------|
| ME-01 | MEDIA | Media | FFmpeg zombie in AudioProcessor — aggiungere command.kill() |
| ME-02 | MEDIA | Alta | Validazione schema .lmp — funzione validateLmpSchema() o Zod |
| ME-03 | MEDIA | Bassa | Race condition badge auto-saved — useRef per il timeout |
| ME-04 | MEDIA | Media | No retry setSinkId su device ricollegato — ondevicechange listener |
| ME-05 | MEDIA | Media | MicManager stream zombie su arm() parziale |
| ME-06 | LIEVE | Bassa | Typecast as unknown as su tipi noti |
| ME-07 | LIEVE | Bassa | evaluateMix legge store ad ogni chiamata |
| LI-01 | LIEVE | Bassa | ErrorBoundary non cattura async — unhandledrejection listener |
| LI-02 | LIEVE | Media | Nessun rate-limit IPC dal renderer |
| LI-03 | LIEVE | Media | console.* non strutturato — electron-log con rotazione |
| LI-04 | LIEVE | Media | Singleton audio non distrutti su ricarica webview |
| LI-05 | LIEVE | Bassa | Countdown MIDI Learn attivabile in doppio |

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

*Aggiornato a v1.2.7. Tutte le criticità gravissime e gravi sono state risolte. Rimangono 7 medie e 5 lievi.*
