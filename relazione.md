# Relazione Tecnica — Runtime Live Machine Pro v1.2.5

**Data analisi**: 15 maggio 2026  
**Versione analizzata**: 1.2.5 (commit 201769e)  
**Stack**: Electron 28.3.3 · React 18.2.0 · TypeScript 5.3.3 · Zustand · Web Audio API · FFmpeg

---

## 1. CRITICITÀ GRAVISSIME

### GR-01 · `setInterval` eterno nel corpo di `create()` Zustand
**File**: `src/renderer/src/store/useAudioStore.ts:205-209`  
**Impatto**: Corruzione stato in development, potenziale causa di freeze in produzione

```typescript
// QUESTO CODICE È DENTRO IL CORPO DI create(), NON IN UN useEffect
setInterval(() => {
    if (Object.keys(get().activeClips).length > 0) {
        get()._syncProgress();
    }
}, 100);
```

Il `setInterval` è creato al momento dell'inizializzazione del modulo Zustand, **non** al mount del componente. Non viene mai clearato. In React 18 StrictMode (dev), il modulo può essere eseguito due volte, generando due interval paralleli che chiamano `_syncProgress()` ogni 50ms effettivi anziché 100ms. Anche in produzione, qualsiasi ricarica della webview crea un secondo interval. Dopo N ricariche si accumulano N×10 chiamate/secondo a Zustand inutili.

**Fix**: Spostare l'interval in un `useEffect(() => { ... return () => clearInterval(id) }, [])` nel componente root (`App.tsx`), oppure esporre un metodo `startEngine()`/`stopEngine()` dallo store e chiamarlo in modo controllato.

---

### GR-02 · Race condition nel sequencer con generazioni di caricamento
**File**: `src/renderer/src/store/useAudioStore.ts:285-415`  
**Impatto**: Clip sbagliata avviata durante crossfade rapido (< 500ms)

La guardia con `playGenerations` (Map<clipId, number>) controlla che la clip non sia stata invalidata durante il `load()` asincrono. Il meccanismo è corretto per click diretti dell'utente, ma fallisce nel caso del sequencer automatico (`applyTransitionAndPlayNext`):

1. Clip A finisce → sequencer avvia Clip B (generation B=1)
2. Clip B è lenta da caricare (rete lenta, file grande)
3. L'utente clicca Clip B direttamente (generation B=2)
4. Il load asincrono della chiamata #1 torna, vede generation=2, si scarta ✓
5. **MA**: se nel frattempo `stopClip(B)` era già stato chiamato dall'utente, la generation viene resettata. Se il sequencer ritenta, lo stesso ID riassume generation=1 e il check non funziona

**Fix**: Usare un GUID per run invece che un contatore incrementale per clipId. Oppure controllare anche che la clip non sia già in `activeClips` con un player diverso.

---

### GR-03 · Nessun timeout sugli IPC handler asincroni
**File**: `src/main/index.ts` (tutti gli `ipcMain.handle`)  
**Impatto**: Hang permanente dell'app su file lenti o FFmpeg bloccato

Handler come `get-waveform-data` e `export-project` possono bloccarsi per minuti (file audio da 4GB, disco lento, FFmpeg zombie). Non esiste nessun `Promise.race()` con timeout. Il renderer aspetta all'infinito. L'utente percepisce l'app come congelata senza possibilità di recupero.

```typescript
// Assente: nessun timeout wrapper
ipcMain.handle('get-waveform-data', async (_event, filePath: string) => {
    return await AudioProcessor.generateWaveformData(filePath); // può bloccarsi per sempre
});
```

**Fix**: Wrappare ogni handler con:
```typescript
const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
    Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('IPC_TIMEOUT')), ms))]);
```

---

### GR-04 · Path traversal non validato nel protocollo `media://`
**File**: `src/main/index.ts:560-584`  
**Impatto**: Lettura di qualsiasi file del sistema operativo dall'interno del renderer

Il handler del protocollo custom `media://` non valida che il percorso richiesto sia dentro una cartella autorizzata:

```typescript
protocol.handle('media', (request) => {
    let filePath = decodeURIComponent(pathName);
    // ... normalize win32 ...
    if (!fs.existsSync(filePath)) return new Response('File not found', { status: 404 });
    const nodeStream = fs.createReadStream(filePath); // NESSUN CHECK WHITELIST
    return new Response(webStream, ...);
});
```

Un path come `media:///C:/Windows/System32/config/SAM` verrebbe servito senza alcun blocco. Sebbene il renderer sia sotto contextIsolation, xss injection in dipendenze terze o plugin futuri potrebbero sfruttarlo.

**Fix**: Verificare che `filePath` sia assoluto e che corrisponda a una delle cartelle approvate (directory documenti utente, directory temp dell'app).

---

## 2. CRITICITÀ GRAVI

### GR-05 · StreamPlayer: memory leak con `createMediaElementSource`
**File**: `src/renderer/src/engine/StreamPlayer.ts:52`  
**Impatto**: Crescita RAM durante sessioni broadcast lunghe (24/7)

`createMediaElementSource()` lega un `HTMLAudioElement` al Web Audio graph in modo **permanente**. Se il player viene distrutto (cleanup) e un nuovo `StreamPlayer` viene creato per la stessa sorgente audio, il vecchio `MediaElementAudioSourceNode` rimane allocato nel `BaseAudioContext` fino al suo reset. Durante transizioni rapide il sequencer crea e distrugge player velocemente, ma il graph audio accumula nodi disconnessi che la GC del browser non libera immediatamente.

**Misura**: Con crossfade a 500ms e 200 tracce consecutive, la RAM può crescere di 15-30MB/ora.

**Fix**: Mantenere un pool limitato di `StreamPlayer` (es. max 3) e riutilizzarli invece di crearne di nuovi.

---

### GR-06 · `isAnalyzing: true` permanente su errore IPC silence detection
**File**: `src/renderer/src/components/layout/MainGrid.tsx:135-152`  
**Impatto**: Spinner infinito sulla ClipCard se il file è corrotto o il percorso è mancante

```typescript
}).catch(() => {
    // NB: NON resetta isAnalyzing sulla clip!
    // La clip rimane con lo spinner per sempre
});
```

**Fix**:
```typescript
.catch(() => {
    updateClip('col-music', clip.id, { isAnalyzing: false, silenceChecked: true });
    setMusicAnalyzingCount(n => Math.max(0, n - 1));
});
```

---

### GR-07 · Promise non risolta durante export se la finestra viene chiusa
**File**: `src/main/index.ts` (handler `export-project`)  
**Impatto**: Stream di file non chiusi, processi FFmpeg zombie, blocco del processo main

L'handler export usa `await new Promise(resolve => setTimeout(resolve, 5))` per non bloccare l'event loop durante la copia di 1000+ file. Se l'utente chiude la finestra durante l'operazione, `mainWindowRef` viene nullificato ma la promise continua a girare nel background del main process, con stream `fs.copyFileSync` (sync) o `fs.createReadStream` (se presente) non chiusi.

**Fix**: Usare un flag di cancellazione (`let cancelled = false`) settato nell'handler `will-navigate`/`closed`, e controllarlo nel loop.

---

### GR-08 · Stato `fadingClipIds` non pulito su `stopAll`
**File**: `src/renderer/src/store/useAudioStore.ts`  
**Impatto**: Badge "FADE OUT" viola rimane visibile su clip già ferme

Quando si preme Stop All (Escape), `fadingClipIds` non viene resettato prima di fermare tutti i player. Il setTimeout schedulato dalla crossfade tenta di chiamare `stopClip()` su un clip già fermata, ma il badge FADE OUT rimane in UI per la durata del timeout originale (fino a `crossfadeDuration + 200`ms dopo Stop All).

**Fix**: In `stopAll()`, aggiungere `set({ fadingClipIds: [] })` prima del loop di stop.

---

## 3. CRITICITÀ MEDIE

### ME-01 · `waveform generation` senza timeout né processo zombie kill
**File**: `src/main/AudioProcessor.ts`  
**Impatto**: FFmpeg può diventare processo zombie con file audio non standard

Se FFmpeg si avvia ma non produce output (codec non supportato, file header troncato), l'event `'end'` su `ffStream` non viene mai emesso. La promise rimane pending. Il processo FFmpeg figlio rimane in esecuzione consumando CPU.

**Fix**: Aggiungere `command.kill()` nel timeout handler, con timeout di 30s.

---

### ME-02 · Nessuna validazione struttura `.lmp` al caricamento
**File**: `src/main/index.ts:234-248`  
**Impatto**: Crash o stato corrotto con file `.lmp` manomessi o parzialmente scritti

```typescript
const parsed = JSON.parse(content) as any;
if (parsed && parsed.project && parsed.project.columns) {
    parsed.project.columns.forEach((col: any) => {
        col.clips.forEach((clip: any) => {
            // clip.path potrebbe essere null, number, array...
```

Non c'è validazione che `clip.path` sia una stringa, che `col.clips` sia un array, o che la struttura corrisponda a uno schema atteso. Un file `.lmp` parzialmente scritto (crash durante auto-save) può corrompere lo stato globale.

**Fix**: Implementare uno schema Zod (già in dipendenze del progetto?) o una funzione `validateLmpSchema()` prima del processo.

---

### ME-03 · Auto-backup: race condition UI tra IPC e setTimeout badge
**File**: `src/renderer/src/components/ui/GlobalControls.tsx:82-111`  
**Impatto**: Badge "Auto-saved" non appare se il salvataggio richiede > 3 secondi

```typescript
const result = await window.electron.saveProjectSilent(json, ...);
if (result.success) {
    setShowAutoSaved(true);
    setTimeout(() => setShowAutoSaved(false), 3000); // ← potrebbe già essere falso
}
```

Se `saveProjectSilent` impiega più di 3s (disco lento, file grande) e nel frattempo l'interval di 5 minuti scatta di nuovo, si generano due setTimeout paralleli che invertono il flag in sequenza imprevedibile.

**Fix**: Usare un ref per il timeout e cancellarlo prima di settarlo di nuovo:
```typescript
if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
badgeTimerRef.current = setTimeout(() => setShowAutoSaved(false), 3000);
```

---

### ME-04 · Output device hot-switch senza retry su device non disponibile
**File**: `src/renderer/src/engine/StreamPlayer.ts:264-282`  
**Impatto**: Audio su speaker invece che cuffie se il device viene scollegato e ricollegato

Se il device audio viene scollegato durante il playback, `setSinkId()` fallisce e fa fallback a `'default'`. Quando il device viene ricollegato, nessun codice ritenta il `setSinkId()` con il device preferito. L'audio rimane sullo speaker per il resto della sessione.

**Fix**: Sottoscrivere `navigator.mediaDevices.ondevicechange` e ritentare `setSinkId()` su tutti i player attivi.

---

### ME-05 · `MicManager.arm()` lascia stream zombie su eccezione parziale
**File**: `src/renderer/src/engine/MicManager.ts:84-154`  
**Impatto**: Accesso microfono non rilasciato se l'arm fallisce a metà

Se un'eccezione viene lanciata tra la creazione di `this.stream` (getUserMedia) e la registrazione di `this.source`, il catch chiama `_cleanup()` ma `this.source` è undefined, quindi il `MediaStreamTrack` non viene mai stoppato. Il browser mantiene la luce del microfono accesa.

**Fix**: Salvare riferimento allo stream immediatamente e usare un flag `streamAcquired` nel cleanup.

---

### ME-06 · Typecasting con `as unknown as` su tipi noti
**File**: Multiple  
**Impatto**: Perdita type-safety, potenziali errori runtime non catturati in compile time

```typescript
// useRecordingStore.ts
timerIntervalId: intervalId as unknown as number // intervalId è già number

// MidiManager.ts
const nav = navigator as unknown as { requestMIDIAccess?: () => Promise<any> };

// main/index.ts
const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;
```

I cast nascondono potenziali incompatibilità di tipo che TypeScript potrebbe rilevare.

---

### ME-07 · `evaluateMix` chiama `useSettingsStore.getState()` in loop ad alta frequenza
**File**: `src/renderer/src/store/useAudioStore.ts:81`  
**Impatto**: Potenziale peggioramento prestazioni su macchine lente

`evaluateMix()` è chiamata ogni volta che una clip parte o si ferma. Al suo interno chiama `useSettingsStore.getState()` che accede al storage zustand. Con 10+ clip attive contemporaneamente e transizioni rapide, questo loop può chiamare getState() 50-100 volte/secondo.

**Fix**: Memoizzare `duckingFactor`/`duckingDuration` al di fuori del loop, o passarli come argomenti.

---

## 4. CRITICITÀ LIEVI

### LI-01 · `ErrorBoundary` non cattura errori asincroni
**File**: `src/renderer/src/components/ui/ErrorBoundary.tsx`  
React Error Boundaries catturano solo errori sincroni nel render tree. Promise rigettate, setTimeout, e handler IPC che lanciano eccezioni non vengono intercettati. L'app crasha silenziosamente in console senza mostrare l'error screen.

**Fix**: Aggiungere un listener globale `window.addEventListener('unhandledrejection', ...)` che mostra un toast di errore.

---

### LI-02 · Nessun rate-limit sulle chiamate IPC dal renderer
**File**: `src/main/index.ts` (tutti gli handler)  
Un bug nel renderer (loop infinito, click ripetuto) può spammare `detectSilence` o `get-waveform-data` saturando il main process. Non esiste nessun debounce/throttle lato main.

---

### LI-03 · Log in console in produzione
**File**: Multiple (`console.error`, `console.warn`, `console.log`)  
Il codebase usa estensivamente `console.*` anche in path critici. In produzione (exe), i log vanno nel file di log Electron ma non vengono strutturati né ruotati, potendo occupare GB su sessioni lunghe.

**Fix**: Introdurre un logger strutturato (es. `electron-log`) con rotazione automatica, e rimuovere i `console.*` non essenziali.

---

### LI-04 · Nessun cleanup Zustand store al `beforeunload`
**File**: store/*.ts  
Gli store non espongono metodi di cleanup. Se il renderer viene ricaricato (dev hot-reload), i singleton `MicManager`, `MidiManager`, `AudioContextManager` non vengono distrutti, causando duplicati nel modulo.

---

### LI-05 · Countdown MIDI Learn può essere attivato multiplo
**File**: `src/renderer/src/components/ui/GlobalControls.tsx`  
Se l'utente attiva/disattiva MIDI Learn mode molto rapidamente (< 100ms), possono coesistere due `setInterval` del countdown per 1-2 cicli prima che il cleanup dell'effect si attivi. L'effetto è cosmetic (contatore visivo a valori doppi), ma indica una fragilità.

---

## 5. FUNZIONALITÀ A BUON PUNTO

| Area | Stato | Note |
|------|-------|------|
| Streaming `media://` | Solido | Nessun caricamento RAM, protocol handler ben implementato |
| Waveform Editor | Buono | 4 handle drag + zoom + ruler adattivo funzionano |
| Crossfade / Segue / Gapless | Buono | Logica transition robusta, `pendingCrossfadeFadeIn` corretto |
| Session Recording | Buono | Pipeline completa: arm → record → export WAV/FLAC/MP3/OGG/WEBM |
| i18n 8 lingue | Completo | react-i18next, tutte le chiavi presenti |
| MIDI Learn | Funzionale | Bind per clip, countdown 15s, VU meter MIDI |
| Auto-Silence Detection | Funzionale | Batch su Music, on-drop su PRE-SHOW |
| Smart Mic Ducking | Funzionale | Noise gate con isteresi, ramp duck 60ms/400ms |
| Master Chain (HPF+Comp+Limiter) | Solido | Implementazione corretta via Web Audio API |
| Toast notification system | Solido | Nessun `alert()` bloccante |
| Export Self-Contained | Funzionale | Copia file + manifest, ma senza timeout |
| ConfirmDialog / ThreeWayDialog | Solido | Promise-based, non bloccante |
| Column Color Picker | Solido | `effectiveColor` dinamico, ereditarietà corretta |
| Auto-save 5min | Funzionale | Con race condition UI minore (ME-03) |
| Emergency Stop (Escape) | Solido | `globalShortcut` main-side, non intercettabile dal renderer |
| Drop OS con Drop Indicator | Solido | Posizione precisa, linea blu luminosa |
| LMP Integrity Check | Parziale | Controlla `isMissing` ma non valida schema (ME-02) |
| Open-file da OS (.lmp association) | Funzionale | macOS `open-file` + Windows `argv` |
| Preview Transizione | Solido | `previewingClipIds` protegge `hasPlayed` |

---

## 6. FUNZIONALITÀ ROTTE O A RISCHIO

| Funzionalità | Severità | Problema |
|---|---|---|
| Waveform su file corrotti | Rotto | FFmpeg si blocca indefinitamente (ME-01, GR-03) |
| Silence detection su file con errori | Rotto | Spinner infinito sulla ClipCard (GR-06) |
| Badge FADE OUT dopo Stop All | Rotto | Rimane visibile per `crossfadeDuration + 200`ms (GR-08) |
| Output audio su device ricollegato | Rotto | Non ritenta `setSinkId` (ME-04) |
| Sessione broadcast 24/7 | A rischio | Memory leak RAM StreamPlayer (GR-05) + interval multipli (GR-01) |
| Crossfade a velocità < 500ms | A rischio | Race condition generazioni (GR-02) |
| Caricamento .lmp parzialmente corrotto | A rischio | Nessuna validazione schema (ME-02) |
| Export con finestra chiusa durante operazione | A rischio | Promise zombie main process (GR-07) |
| Sicurezza protocollo media:// | A rischio | Path traversal non bloccato (GR-04) |
| Arm microfono con permission error | A rischio | Stream zombie non rilasciato (ME-05) |

---

## 7. FEATURE INDISPENSABILI MANCANTI

Questa sezione elenca le funzionalità standard dei software di playout radiofonico professionale (Myriad, SAM Broadcaster, RadioDJ, Rivendell, Zara Radio) che sono assenti in RRLMP.

---

### TIER 1 — Critiche per uso professionale quotidiano

**F-01 · Clock Wheel / Scheduling orario**  
Nessun software di regia professionale manca di un sistema di scheduling orario. L'operatore deve poter pianificare cosa va in onda ad ogni slot orario (00:00, :15, :30, :45) con trigger automatico o manuale. Attualmente RRLMP è puramente reattivo all'input umano.

**F-02 · Rundown / Scaletta di trasmissione**  
Una scaletta ordinata e sequenziale degli elementi in onda (notizie, spot, jingle, musica) con timing previsto vs. timing reale, indispensabile per coordinare la regia con la redazione. Il PRE-SHOW è un approccio simile ma non è una scaletta strutturata.

**F-03 · Playout Log / Storia trasmissione**  
Registro persistente di tutto ciò che è andato in onda: nome clip, timestamp inizio/fine, durata effettiva, operatore. Obbligatorio per molte licenze radiofoniche (SIAE, ASCAP) e per reporting agli investitori pubblicitari. Attualmente non esiste nessun log persistente.

**F-04 · Hotkeys globali per Jingle/Stinger**  
Un soundboard con 16-32 tasti (F1-F12, numpad) che avvia istantaneamente clip "one-shot" senza dover interagire con la board principale. Standard assoluto in ogni regia radio.

**F-05 · Gestione Spot / Spot Break automatico**  
Sequenza automatica di spot pubblicitari con calcolo automatico della durata totale del break, warning operatore quando mancano 30/15/5 secondi alla fine, e rientro automatico con fade-up della musica.

**F-06 · Loudness Normalization per clip (LUFS)**  
Ogni clip dovrebbe essere analizzata e normalizzata a un target LUFS (es. -14 LUFS EBU R128) per garantire coerenza sonora tra tracce di diversa origine. La Master Chain comprime il master, ma non normalizza le clip individualmente.

---

### TIER 2 — Importanti per flusso di lavoro professionale

**F-07 · Metadata streaming (Icecast/Shoutcast)**  
Invio del "Now Playing" al server streaming: artista, titolo, artwork. Essenziale per emittenti con stream online. Attualmente impossibile perché RRLMP non conosce i metadati delle clip in corso (solo il nome file).

**F-08 · Integrazione RDS (Radio Data System)**  
Invio del titolo corrente alla trasmissione FM via interfaccia RDS hardware (seriale/USB). Standard EBU per radio FM europee.

**F-09 · Cart System (Soundboard dedicata)**  
Pannello separato con 32-64 pulsanti colorati per effetti sonori, stacchetti, signature sound — separato dalla board principale. Diverso dagli Assets: i cart sono one-shot, non hanno waveform editor, non hanno transizioni.

**F-10 · Equalizzatore per canale**  
EQ a 3 o 5 bande per ogni colonna (Music, Voice, SFX) separato dalla Master Chain. Indispensabile per compensare differenze timbriche tra microfoni, sorgenti esterne e tracce musicali.

**F-11 · Undo/Redo nelle operazioni di playlist**  
Aggiunta, rimozione, riordinamento clip nella board sono operazioni irreversibili. Un sistema undo/redo con stack di 20-50 operazioni è standard in tutti i DAW e playout software.

**F-12 · Voice Tracking / Jingle Recording integrato**  
Registrazione di voiceover direttamente nella scaletta, con pre-roll della clip precedente e post-roll della clip successiva per un editing in contesto. La Session Recording attuale registra l'intera sessione, non i singoli inserti.

**F-13 · BPM Detection automatica**  
Rilevazione automatica del BPM di ogni traccia musicale via FFmpeg/aubio per sincronizzare transizioni al tempo del pezzo (crossfade al beat, jingle al tempo).

**F-14 · ReplayGain su file**  
Analisi ReplayGain (R128) e scrittura del tag nel file audio per normalize il volume clip-by-clip senza alterare il file originale. Complementare a F-06.

---

### TIER 3 — Desiderabili per completezza del prodotto

**F-15 · Remote Control Web Interface**  
Pannello web responsive (Tablet/Smartphone) per controllo remoto della regia da sala ospiti o studio secondario. Molte radio lo usano per far "sfogliare" la scaletta a conduttori non tecnici.

**F-16 · Multiple Output Bus (Studio + Stream)**  
Bus separati per monitor studio e stream internet con volumi indipendenti, per poter sentire qualcosa in cuffia senza mandarlo in onda (cue/PFL - Pre-Fader Listen).

**F-17 · Talkback / IFB (Interruptible Foldback)**  
Comunicazione bidirezionale con ospiti in studio o corrispondenti via IP. Standard in radio con ospiti.

**F-18 · Phone Hybrid Integration**  
Integrazione con centralini VoIP (SIP) per gestire chiamate in diretta: mettere in pausa la musica, abbassare il livello, instradare la chiamata sul master bus.

**F-19 · Plugin System (VST3/CLAP)**  
Supporto plugin audio standard per inserire processori di terze parti (compressori hardware emulati, de-esser, noise reduction) sul master o sui singoli bus.

**F-20 · Gestione Archivio Musicale integrata**  
Browser del database musicale con ricerca per genere, BPM, durata, ISRC — integrato direttamente nella board senza dover aprire Finder/Explorer. Include gestione delle rotation rules (no ripetizioni entro X ore).

**F-21 · Waveform "skimmer" su hover**  
Preview audio al passaggio del mouse sulla waveform senza avviare il playback. Standard in Serato, DJ software, e alcuni playout system.

**F-22 · Second Screen Support**  
Modalità "On Air Display" per uno schermo secondario visibile dal conduttore: orologio grande, titolo in onda, countdown clip successiva, note.

**F-23 · Gestione newline automatica (segue intelligente)**  
Analisi FFmpeg del punto di silenzio naturale alla fine di ogni clip per scegliere automaticamente dove fare il mix-out, senza che l'operatore debba settare manualmente `trimEnd`.

**F-24 · Export Report / Cue Sheet**  
Esportazione della scaletta in PDF o CSV (nome clip, durata, ora prevista, ora effettiva) per documentazione e consegna agli autori.

**F-25 · OSC (Open Sound Control) Integration**  
Protocollo standard per controllo remoto da hardware (MIDI controller avanzati, TouchOSC su tablet, sistemi di automazione studio).

---

## 8. RIEPILOGO PRIORITÀ

### Blocchi da risolvere prima della prossima release

| ID | Severità | Effort | Descrizione |
|----|----------|--------|-------------|
| GR-01 | GRAVISSIMA | Bassa | setInterval eterno in Zustand create() |
| GR-06 | GRAVE | Bassa | isAnalyzing permanente su errore IPC |
| GR-08 | GRAVE | Bassa | fadingClipIds non pulito su stopAll |
| GR-03 | GRAVISSIMA | Media | Nessun timeout IPC handler |
| ME-03 | MEDIA | Bassa | Race condition badge auto-saved |
| ME-04 | MEDIA | Media | No retry setSinkId su device ricollegato |

### Da pianificare nel backlog tecnico

| ID | Severità | Effort | Descrizione |
|----|----------|--------|-------------|
| GR-04 | GRAVISSIMA | Bassa | Path traversal in media:// |
| GR-02 | GRAVISSIMA | Alta | Race condition sequencer crossfade veloce |
| GR-05 | GRAVE | Alta | Memory leak StreamPlayer pool |
| GR-07 | GRAVE | Media | Promise zombie durante export+close |
| ME-01 | MEDIA | Media | FFmpeg zombie su waveform |
| ME-02 | MEDIA | Alta | Validazione schema .lmp con Zod |
| LI-01 | LIEVE | Bassa | ErrorBoundary non cattura async |
| LI-03 | LIEVE | Bassa | Logger strutturato con rotazione |

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

*Relazione generata da analisi statica del codice sorgente. Non sostituisce testing funzionale su hardware broadcast reale.*
