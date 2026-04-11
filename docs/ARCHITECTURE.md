# Architecture & Development Reference (v1.2.2)

Ultimo aggiornamento: 2026-04-11

---

## 1. Core Architecture

### Process Model

```
┌─────────────────────────────────────────────────────────┐
│  MAIN PROCESS (Node.js)                                 │
│  ├── AudioProcessor.ts   (FFmpeg, metadata, silence)    │
│  ├── index.ts            (IPC handlers, media:// proto) │
│  └── MidiManager (via Renderer — Web MIDI API)          │
├─────────────────────────────────────────────────────────┤
│  PRELOAD (contextBridge)                                │
│  └── preload/index.ts    (window.electron API)          │
├─────────────────────────────────────────────────────────┤
│  RENDERER PROCESS (Chromium + React)                    │
│  ├── engine/             (AudioContextManager, MIDI)    │
│  ├── store/              (Zustand stores)               │
│  └── components/         (UI React)                     │
└─────────────────────────────────────────────────────────┘
```

- **Main Process (`src/main/`)**: Gestisce il ciclo di vita dell'app, window management, e tutto il processing audio pesante.
  - **Protocollo `media://`**: Custom protocol con streaming a blocchi (128KB iniziale, 1MB in corsa) per riproduzione fluida senza saturare la memoria.
  - **Sicurezza (CSP)**: Policy granulare per supportare file locali, WebSockets (dev), blob: e media:.
- **Renderer Process (`src/renderer/`)**: Applicazione React (Vite) — pura **Interfaccia Grafica**. Non fa mai operazioni CPU/memoria intensive.
- **Bridge (`src/preload/`)**: `contextBridge` sicuro che espone `window.electron` con API tipizzate.

---

### Audio Engine: Strategia "Main-Side-Heavy"

**Regola fondamentale**: Il Renderer non tocca mai file audio pesanti direttamente.

| Layer | Responsabilità | VIETATO |
|-------|---------------|---------|
| Main (Node.js) | Lettura file, FFmpeg, metadata, waveform peaks, silence detection | — |
| Renderer (React) | Playback via `<audio>` HTML5 + Web Audio API gain nodes | `arrayBuffer()`, `decodeAudioData()`, FFmpeg |
| IPC | Trasporto dati (JSON/Buffer) Main ↔ Renderer | Buffer audio grezzi |

**Motivo**: I crash `0xC0000005` (Access Violation) su file WAV grandi erano causati dall'allocazione di AudioBuffer nel processo Chromium. La migrazione "Main-Side-Heavy" (v0.10.4–v0.11.0) ha risolto definitivamente il problema.

---

## 2. State Management (Zustand)

### Store Separation

```
useProjectStore      → Struttura board, clip, colonne, persistenza .lmp
useAudioStore        → Playback engine, mixing, ducking, transizioni
useSettingsStore     → Preferenze persistite (localStorage: 'rrlmp-settings')
useDebugStore        → Log transitori per overlay debug in-app
```

#### useProjectStore
- Gestisce `columns[]` e `clips[]` per ogni colonna
- Persistenza: `saveProject` / `loadProject` / `saveProjectDirect` / `saveProjectSilent`
- Selection logic (`selectedClipIds`, Ctrl+click multi-select)
- MIDI Learn Mode (`isMidiLearnMode`)
- Auto-Backup ogni 5 minuti (timer indipendente da React render)

#### useAudioStore
- `activeClips: Record<string, ActiveClip>` — player attivi per clip ID
- `playClip(clip)` — start + conflict resolution (stop same-column clips, skip transitioning)
- `stopClip(id)` / `stopAll()` — stop con fade-out se configurato
- `evaluateMix(activeClips, newClipId?, overrideDuration?)` — ducking sidechain; newClipId riceve fadeTo istantaneo; overrideDuration override del ramp (es. 60ms per mic ducking)
- `applyTransitionAndPlayNext(clipId)` — orchestrazione Gapless/Segue/Crossfade
- `fadingClipIds: string[]` (Zustand state, reattivo) — clip in fade-out per transizione
- `previewingClipIds: string[]` — clip in modalità preview transizione (hasPlayed protetto)
- `stopPreviewTransition(clipId)` — ferma i clip in preview
- `isMicActive: boolean` — true quando il noise gate rileva voce dal microfono hardware (v0.17.0)
- `setMicActive(active)` — aggiorna `_isMicActiveGlobal` e re-valuta `evaluateMix()` (v0.17.0)
- `pendingCrossfadeFadeIn: number | null` (module-level) — one-shot per fade-in clip entrante

#### useSettingsStore
- `outputDeviceId` — scheda audio selezionata
- `duckingFactor` (default 0.2) + `duckingDuration` (default 500ms)
- `preshowTransitionType: TransitionType` (default `'gapless'`)
- `crossfadeDuration: number` (default 2000ms)
- `segueDuration: number` (default 800ms)
- `masterChain: MasterChainSettings` — HPF+Compressor+Limiter config, persistito
- `micInputDeviceId: string` (default 'default') — device audioinput selezionato
- `micThresholdDb: number` (default -30) — soglia noise gate in dBFS
- `micEnabled: boolean` (default false) — abilitazione Smart Mic
- Persistito in localStorage con chiave `rrlmp-settings`

---

## 3. Audio Playback Engine

### StreamPlayer

Ogni clip attiva ha un'istanza `StreamPlayer` che wrappa:
- `<audio>` HTML5 con `src` = `media:///path/to/file.mp3`
- **Web Audio API GainNode** per volume/fade
- **Callback system**: `onProgress`, `onPreEnd`, `onEnd`, `onOutroReached`

Metodi chiave:
- `fadeTo(targetVolume, durationMs)` — rampa lineare del gain
- `updateSettings(clip)` — aggiorna fadeIn/fadeOut/markers runtime
- `getCurrentTime()` — posizione corrente in secondi

### Sistema di Transizioni (v0.13.2 — esteso a tutti i tipi in v0.16.4)

Disponibile per tutti i clip con `play_next`, non più solo colonna PRE-SHOW. Il guard `type=preshow` è stato rimosso in v0.16.4.

```
applyTransitionAndPlayNext(clipId)
│
├── legge: clip.transitionType (override) || settings.preshowTransitionType (default)
│
├── GAPLESS: playClip(nextClip) immediato (taglio netto)
│
├── SEGUE:   fadingClipIds.push(clipId)
│           fadeTo(0, duration) su clip corrente
│           setTimeout(stopClip, duration)
│           playClip(nextClip) immediato a volume pieno
│
└── CROSSFADE: fadingClipIds.push(clipId)
              fadeTo(0, duration) su clip corrente
              setTimeout(stopClip, duration)
              pendingCrossfadeFadeIn = duration
              playClip(nextClip) → updateSettings applica fadeIn override
```

Conflict resolution in `playClip`: le clip in `fadingClipIds` vengono **saltate** invece di essere stoppate bruscamente.

---

## 4. AudioProcessor (Main Process)

File: `src/main/AudioProcessor.ts`

```typescript
class AudioProcessor {
    static async extractMetadata(filePath): Promise<{ success, data: { duration, channels, bitrate } }>
    static async generateWaveformData(filePath): Promise<{ success, data: number[] }>  // max 200 peaks
    static async detectSilence(filePath): Promise<{ success, data: { trimStart, trimEnd, noSilence? } }>
}
```

- `extractMetadata`: usa `music-metadata@7.14.0` (CJS-safe, downgraded da v11 per compatibilità ASAR)
- `generateWaveformData`: FFmpeg `spawn`, filtro `aresample=100`, parse PCM raw → array max 200 barre
- `detectSilence`: FFmpeg `spawn`, filtro `silencedetect=noise=-40dB:d=0.1`, parse stderr

**Path FFmpeg in produzione**: sostituisce `app.asar` con `app.asar.unpacked` per accesso binari estratti.

---

## 5. Master Chain (v0.16.2 → v1.2.2)

Topology:

```
masterGain → HPF → Compressor → Limiter → destination
                                         → splitter → analysers
                                         → recordingBus → MediaStreamDestinationNode (recording)
                                                        ↑ micRecordingGain (quando mic armato e mixEnabled=false)
```

Parametri broadcast:
- **HPF**: `type: 'highpass'`, `frequency: 80Hz` — taglia rumore sub-bass DC
- **Compressor**: `threshold: -18dBFS`, `ratio: 4:1`, `knee: 6dB`, `attack: 10ms`, `release: 200ms`
- **Limiter**: `threshold: -1dBFS`, `ratio: 20:1`, `knee: 0`, `attack: 1ms`, `release: 100ms`

Persisted via `MasterChainSettings` in `useSettingsStore`. UI configurabile nel tab "Master Chain" di `GeneralSettingsModal` (da v0.16.5).

---

## 6. IPC API (window.electron)

Esposta da `src/preload/index.ts` via `contextBridge`:

| Metodo | Direzione | Canale IPC |
|--------|-----------|------------|
| `getFilePath(file)` | sync | — (file.path nativo) |
| `getAudioMetadata(path)` | async | `get-audio-metadata` |
| `getWaveformData(path)` | async | `get-waveform-data` |
| `detectSilence(path)` | async | `detect-silence` |
| `saveProject(json)` | async | `save-project` |
| `saveProjectDirect(json, path)` | async | `save-project-direct` |
| `saveProjectSilent(json, path?)` | async | `save-project-silent` |
| `loadProject()` | async | `load-project` |
| `exportProject(json)` | async | `export-project` |
| `showCloseDialog()` | async | `show-close-dialog` |
| `forceClose()` | fire-and-forget | `force-close` |
| `onExportProgress(cb)` | listener | `export-progress` |
| `onCheckCloseIntent(cb)` | listener | `check-close-intent` |

---

## 7. Sistema MIDI

- **`MidiManager`** (`src/renderer/src/engine/MidiManager.ts`): Singleton, Web MIDI API
  - `addListener(cb)` — sottoscrizione a note MIDI in ingresso
  - `addStatusListener(cb)` — notifiche connessione/disconnessione controller
- **Clip Bind**: campo `midiBind?: string` su `AudioClip` (es. `"NOTE:60"`)
- **Global Bind**: `globalMidiBinds` in `useSettingsStore` (es. `"stopAll": "NOTE:36"`)
- **MIDI Learn Mode**: 15s countdown, Escape per uscire, badge controller connessi
- **Supported**: Note On (command 144) e CC (command 176)

---

## 7b. MicManager (v0.17.0 → v1.2.2)

File: `src/renderer/src/engine/MicManager.ts` — Singleton, pattern identico a MidiManager.

Flusso:
```
getUserMedia({ echoCancellation: false }) → MediaStreamAudioSourceNode
    → AnalyserNode (fftSize=1024, smoothing=0.10) [MAI connesso all'output]
    → getFloatTimeDomainData() ogni 40ms → RMS → dBFS
    → Noise Gate: attivazione -30dBFS/10ms, rilascio -42dBFS/200ms (isteresi 12dB)
    → activityListeners → useAudioStore.setMicActive(active, overrideDuration=60ms)
    → levelListeners → GlobalControls VU meter
```

Routing grafo audio (v1.0.0+):
```
source → micGain (monitoring) → masterGain    [solo se mixEnabled=true]
       → micRecordingGain     → recordingBus  [sempre quando armato, gain=0 se mixEnabled=true]
```

- `micGain`: monitoring attraverso master chain. gain=0 se mixEnabled=false.
- `micRecordingGain`: sempre collegato a `AudioContextManager.getRecordingBus()`.
  gain=1 se mixEnabled=false (Rodecaster/hardware monitor: mic catturata solo nel recording).
  gain=0 se mixEnabled=true (mic già nel recording via master chain, evita doppiaggio).

Il contesto AudioContext usato è quello di AudioContextManager (nessun contesto aggiuntivo).

Permission handler in main/index.ts: `session.defaultSession.setPermissionRequestHandler` approva automaticamente i permessi `'media'` (richiesto per getUserMedia microfono in Electron 28).

---

## 8. Internazionalizzazione (i18n)

- **Libreria**: `react-i18next` + `i18next-browser-languagedetector`
- **Lingue supportate**: 8 lingue con bandiere SVG — IT, EN, FR, ES, DE, PT, RU, ZH-CN
- **File locale**: tutti e 8 i file JSON sono completi (89+ chiavi ciascuno) da v1.0.0
  - `en.json` ✅ completo (≤0.9.x)
  - `it.json` ✅ completo (≤0.9.x)
  - `fr.json` ✅ completo (v1.0.0)
  - `de.json` ✅ completo (v1.0.0)
  - `es.json` ✅ completo (v1.0.0)
  - `pt.json` ✅ completo (v1.0.0)
  - `ru.json` ✅ completo (v1.0.0)
  - `zh.json` ✅ completo (v1.0.0)
- **Utilizzo**: `useTranslation()` hook + `t('key')` nei componenti
- **Language switcher**: presente in WelcomeScreen (bandiere dirette) e in GeneralSettingsModal (tab Lingua, da v0.16.5)
- **Copertura**: ClipSettingsModal e GeneralSettingsModal completamente i18n da v0.16.1

---

## 9. Formato File .lmp

Formato JSON:
```json
{
  "version": "0.16.5",
  "timestamp": 1234567890,
  "project": {
    "columns": [/* Column[] */]
  }
}
```

**Export progetto self-contained**: copia tutti i file audio referenziati + il file .lmp in una cartella dedicata, aggiornando i path relativi. Progress modal con notifiche IPC per file di grandi dimensioni.

---

## 10. Tipi Core

```typescript
type ClipType = 'asset' | 'music' | 'voice' | 'sfx' | 'preshow'
type TransitionType = 'gapless' | 'segue' | 'crossfade'
type PlaybackMode = 'oneshot' | 'loop' | 'sequence'

interface AudioClip {
    // Identità
    id, name, path, type, color
    // Playback
    volume, pan, isLooping, isPlaying, duration, currentTime
    // Markers
    startMarker?, introMarker?, outroMarker?, endMarker?
    trimStart?, trimEnd?
    // Comportamento
    nextAction: 'stop' | 'play_next' | 'loop'
    behavior: 'normal' | 'stacco'
    duckingRole: 'source' | 'target' | 'none'
    // Fades
    fadeIn, fadeOut
    // Override transizione (v0.13.2)
    transitionType?: TransitionType
    // Bindings
    keybind?, midiBind?, customColor?
    // Testo / Note
    notes?: string
    // Metadati ID3 (v0.16.4)
    artist?: string
    title?: string
    // Stato runtime (non serializzati nel .lmp)
    hasPlayed?: boolean
    silenceChecked?: boolean
    isMissing?: boolean
    isAnalyzing?: boolean
}
```

---

## 11. Colonne Predefinite

| ID | Titolo | Tipo | Behavior Default | customColor? |
|----|--------|------|-----------------|--------------|
| `col-assets` | SHOW ASSETS | `asset` | stop, duckingRole: none, locked | ✅ (v0.16.1) |
| `col-music` | CANZONI DELL'EPISODIO | `music` | stop, fadeOut: 2000ms, duckingRole: target | ✅ (v0.16.1) |
| `col-voice` | VOCI / PREREGISTRAZIONI | `voice` | stop, duckingRole: source | ✅ (v0.16.1) |
| `col-sfx` | SFX / CARTWALL | `sfx` | stop, duckingRole: none | ✅ (v0.16.1) |
| `col-preshow` | PRE-SHOW | `preshow` | play_next, fadeOut: 0 (gapless default), duckingRole: target | ✅ (v0.16.1) |

`customColor?: string` — colore hex personalizzato per il ColumnHeader. Persistito nel .lmp. Il color picker offre 30 colori (5×6 grid) + ripristino default (v0.16.3).

---

## 12. Terminologia

- **Clip**: L'unità audio fondamentale.
- **Column**: Contenitore verticale di clip (logica playlist).
- **Stacco**: Jingle ad alta priorità che fa ducking sugli altri contenuti.
- **Ducking**: Riduzione automatica del volume (effetto Sidechain).
- **Pre-Show**: Colonna in modalità sequenza automatica con transizioni configurabili.
- **Gapless**: Transizione a taglio netto tra clip consecutive.
- **Segue**: La clip precedente sfuma mentre la nuova parte a pieno volume.
- **Crossfade**: Sovrapposizione bilanciata: la vecchia sfuma E la nuova sale simultaneamente.
- **LMP**: Formato file progetto RRLMP (`.lmp`, JSON).
- **IPC**: Inter-Process Communication (Electron Main ↔ Renderer).

---

## 13. Standard di Sviluppo

### TypeScript
- Strict mode attivo
- No `any` salvo casi legacy Electron/Window
- Tutti i tipi definiti in `src/renderer/src/types/index.ts`

### Pattern Architetturali
- Business logic **solo negli Store** (mai nei componenti)
- Componenti **funzionali e hook-based**
- Un componente per file
- Heavy processing **solo nel Main Process**

### Design System
- **Background**: `zinc-950` / `zinc-900`
- **Accenti**: `emerald-500` (play/OK), `red-500` (stop/music), `violet-500` (preshow), `cyan-500` (MIDI)
- **Icons**: `lucide-react`
- **CSS**: Tailwind CSS utility-first

### Errori da Non Ripetere
1. `arrayBuffer()` + `decodeAudioData()` nel renderer → OOM su WAV grandi
2. `"^x.y.z"` (caret) per electron in package.json → electron-builder non compila
3. `media://C:/...` (doppio slash) invece di `media:///C:/...` su Windows
4. FFmpeg stream senza `.on('error', ...)` → crash silenzioso del main process
