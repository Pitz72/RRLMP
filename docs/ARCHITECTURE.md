# Architecture & Development Reference (v0.13.2)

Ultimo aggiornamento: 2026-04-06

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
- `evaluateMix()` — ducking sidechain (source → ducka i target)
- `applyTransitionAndPlayNext(clipId)` — orchestrazione Gapless/Segue/Crossfade
- `transitioningClips: Set<string>` (module-level) — clip in fade-out per transizione
- `pendingCrossfadeFadeIn: number | null` (module-level) — one-shot per fade-in clip entrante

#### useSettingsStore
- `outputDeviceId` — scheda audio selezionata
- `duckingFactor` (default 0.2) + `duckingDuration` (default 500ms)
- `preshowTransitionType: TransitionType` (default `'gapless'`)
- `crossfadeDuration: number` (default 2000ms)
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

### Sistema di Transizioni (v0.13.2)

```
applyTransitionAndPlayNext(clipId)
│
├── legge: clip.transitionType (override) || settings.preshowTransitionType (default)
│
├── GAPLESS: playClip(nextClip) immediato (taglio netto)
│
├── SEGUE:   transitioningClips.add(clipId)
│           fadeTo(0, duration) su clip corrente
│           setTimeout(stopClip, duration)
│           playClip(nextClip) immediato a volume pieno
│
└── CROSSFADE: transitioningClips.add(clipId)
              fadeTo(0, duration) su clip corrente
              setTimeout(stopClip, duration)
              pendingCrossfadeFadeIn = duration
              playClip(nextClip) → updateSettings applica fadeIn override
```

Conflict resolution in `playClip`: le clip in `transitioningClips` vengono **saltate** invece di essere stoppate bruscamente.

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

## 5. IPC API (window.electron)

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

## 6. Sistema MIDI

- **`MidiManager`** (`src/renderer/src/engine/MidiManager.ts`): Singleton, Web MIDI API
  - `addListener(cb)` — sottoscrizione a note MIDI in ingresso
  - `addStatusListener(cb)` — notifiche connessione/disconnessione controller
- **Clip Bind**: campo `midiBind?: string` su `AudioClip` (es. `"NOTE:60"`)
- **Global Bind**: `globalMidiBinds` in `useSettingsStore` (es. `"stopAll": "NOTE:36"`)
- **MIDI Learn Mode**: 15s countdown, Escape per uscire, badge controller connessi
- **Supported**: Note On (command 144) e CC (command 176)

---

## 7. Internazionalizzazione (i18n)

- **Libreria**: `react-i18next` + `i18next-browser-languagedetector`
- **Lingue documentate**: IT, EN, FR, ES, DE, PT, RU, ZH-CN
- **Utilizzo**: `useTranslation()` hook + `t('key')` nei componenti
- **Gap noto**: Alcuni testi nei modali (ClipSettingsModal, GeneralSettingsModal) ancora hardcoded in italiano.

---

## 8. Formato File .lmp

Formato JSON:
```json
{
  "version": "0.13.2",
  "timestamp": 1234567890,
  "project": {
    "columns": [/* Column[] */]
  }
}
```

**Export progetto self-contained**: copia tutti i file audio referenziati + il file .lmp in una cartella dedicata, aggiornando i path relativi. Progress modal con notifiche IPC per file di grandi dimensioni.

---

## 9. Tipi Core

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
}
```

---

## 10. Colonne Predefinite

| ID | Titolo | Tipo | Behavior Default |
|----|--------|------|-----------------|
| `col-assets` | SHOW ASSETS | `asset` | stop, duckingRole: none, locked |
| `col-music` | CANZONI DELL'EPISODIO | `music` | stop, fadeOut: 2000ms, duckingRole: target |
| `col-voice` | VOCI / PREREGISTRAZIONI | `voice` | stop, duckingRole: source |
| `col-sfx` | SFX / CARTWALL | `sfx` | stop, duckingRole: none |
| `col-preshow` | PRE-SHOW | `preshow` | play_next, fadeOut: 0 (gapless default), duckingRole: target |

---

## 11. Terminologia

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

## 12. Standard di Sviluppo

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
