# RRLMP — Stato Progetto per Sessioni Claude

**Aggiornato**: 2026-04-07
**Versione corrente**: 0.14.2
**Build verificata**: ✅ `builds/v0.14.2/Runtime Live Machine Setup 0.14.2.exe`
**Branch attivo**: `master` (merge worktree completato)

---

## Struttura Repository

- **Repo principale**: `C:\Users\Utente\Documents\GitHub\RRLMP\`
- **Branch attivo**: `master`
- **Build output**: `builds/v{version}/` nel repo principale
- **Worktree Claude**: `.claude/worktrees/` (in .gitignore — non committare)

## Stack Tecnologico

- **Electron** 28.3.3 + **React** + **TypeScript**
- **Vite** 5 (renderer) + **tsc** (main/preload)
- **Zustand** (state management: useAudioStore, useProjectStore, useSettingsStore, useDebugStore)
- **electron-builder** → NSIS installer Windows
- **FFmpeg/FFprobe** (ASAR unpack, main process)
- **Tailwind CSS** (UI)
- **react-i18next** (IT/EN)

## Architettura Principale (Main-Side-Heavy)

- **Main process**: FFmpeg, fs, metadata, silence detection, IPC handlers
- **Renderer (Chromium)**: UI pura, Zustand stores, Web Audio API
- **Preload** (`contextBridge`): ponte sicuro IPC main ↔ renderer
- **Engine**: `StreamPlayer` (streaming via `media://`), `AudioContextManager`, `MidiManager`

## IPC API Disponibili

| Canale IPC | Funzione Preload | Descrizione |
|------------|-----------------|-------------|
| `get-audio-metadata` | `getAudioMetadata` | Estrae metadata (music-metadata) |
| `get-waveform-data` | `getWaveformData` | Genera dati waveform (FFmpeg) |
| `detect-silence` | `detectSilence` | Rileva silenzio start/end (FFmpeg) |
| `check-files-exist` | `checkFilesExist` | Verifica esistenza file — v0.14.2 |
| `dialog:save-project` | `saveProject` | Salva .lmp con dialog |
| `save-project-direct` | `saveProjectDirect` | Salva .lmp su path noto |
| `save-project-silent` | `saveProjectSilent` | Auto-backup silenzioso |
| `dialog:load-project` | `loadProject` | Apre .lmp con dialog |
| `export-project` | `exportProject` | Esporta progetto self-contained |
| `show-close-dialog` | `showCloseDialog` | Dialog chiusura (IT hardcoded) |
| `show-close-dialog-i18n` | `showCloseDialogI18n` | Dialog chiusura (label localizzate) |
| `force-close` | `forceClose` | Chiude finestra forzato |

## Feature Implementate (Complete)

### Engine Audio
- ✅ Main-Side-Heavy Architecture (v0.11.0)
- ✅ Streaming media:// protocol (v0.11.0)
- ✅ Transizioni Pre-Show: Gapless / Segue / Crossfade per-clip (v0.13.2)
- ✅ Auto-Silence Detection al Drop in PRE-SHOW (v0.13.2)
- ✅ Ducking Sidechain dinamico (duckingFactor / duckingDuration)
- ✅ Output Device Hot-Switch

### UI & Workflow
- ✅ Waveform Editor con 4 handle drag interattivi (v0.14.1)
  - Trim Start/End (rosso), Intro Marker (cyan), Outro Marker (arancione)
  - Anti-stale closure via `useRef` inline update in render body
  - Drag globale `document.addEventListener`, outer/inner container split
  - Playhead visivo (linea bianca al `currentTime`), legenda, ruler
- ✅ LMP Integrity Check (v0.14.2)
  - IPC `check-files-exist` → `fs.existsSync` su tutti i path
  - `runIntegrityCheck(): Promise<number>` in `useProjectStore`
  - `loadProject()` resetta `isMissing: false` su tutte le clip
  - `ClipCard`: overlay ⚠️ "FILE MANCANTE", sfondo rosso, cursor-not-allowed
  - Doppia protezione: `handleClick` + `useAudioStore.playClip` guard
  - `isMissing` è **runtime only**, non serializzato nel .lmp
- ✅ Real-Time Board Cues: INTRO countdown, OUTRO pre-cue + 🚨 OUTRO alert
- ✅ MIDI Learn Mode + binding note/CC + KeymappingModal
- ✅ Keybind per clip (es. "KeyQ", "Numpad1")
- ✅ Save/Load .lmp + Auto-Backup ogni 5 minuti
- ✅ Export Progetto Self-Contained (progress modal via IPC event)
- ✅ Internazionalizzazione i18n (IT/EN, react-i18next)
- ✅ VU Meter, Digital Clock, Welcome Screen
- ✅ Drag & Drop clip tra colonne + multi-selezione (Ctrl+Click)

### Colonne Default (5 fisse)
| ID | Tipo | Colore | Default NextAction |
|----|------|--------|-------------------|
| col-assets | asset | #10B981 Emerald | stop |
| col-music | music | #EF4444 Red | stop |
| col-voice | voice | #F97316 Orange | stop |
| col-sfx | sfx | #64748B Slate | stop |
| col-preshow | preshow | #8B5CF6 Violet | play_next |

## Formato File .lmp

```json
{
  "version": "0.14.2",
  "timestamp": "ISO8601",
  "project": {
    "columns": [ /* Column[] */ ]
  }
}
```

**Nota**: `isMissing` NON viene salvato nel .lmp (flag runtime volatile).

## Debito Tecnico Aperto

| Priorità | Item |
|----------|------|
| 🟡 Media | Testi hardcoded IT in ClipSettingsModal, GeneralSettingsModal |
| 🟡 Media | Feedback visivo Auto-Silence in background (spinner sulla clip) |
| 🟢 Bassa | `crossfadeDuration` usato anche per segue (nome impreciso) |
| 🟢 Bassa | `alert()` come error handling → sostituire con toast non-blocking |
| 🟢 Bassa | Error Boundaries React (prevenire white screen da eccezioni) |

## Errori TS Pre-Esistenti (non impattano build)
- `DebugOverlay.tsx`: import inutilizzati (TS6133)
- `BufferPlayer.ts`: classe non implementa completamente IAudioPlayer (TS2420)

## Feature Essenziali Ancora Mancanti (VISION.md §4)

| # | Feature | Priorità | Effort stimato |
|---|---------|----------|----------------|
| ~~4.1~~ | ~~LMP Integrity Check~~ | ✅ v0.14.2 | — |
| 4.2 | Hotkey Globale Emergency Stop (Escape globale → stopAll) | 🔴 CRITICO | 1h |
| 4.3 | Coda Playlist Visiva (Next-Up badge PRE-SHOW) | 🟠 ALTA | 2h |
| 4.4 | Timer On Air / Elapsed (cronometro in onda) | 🟠 ALTA | 3h |
| 4.5 | Note/Script per clip (textarea nel settings) | 🟠 ALTA | 1 giorno |
| 4.6 | Waveform Zoom orizzontale | 🟡 MEDIA | 3 giorni |
| 4.7 | Pannello Keymapping Centralizzato | 🟡 MEDIA | 3 giorni |
| 4.8 | Playlist Import M3U | 🟡 MEDIA | 2 giorni |
| 4.9 | Column Color Picker | 🟢 BASSA | 2h |
| 4.10 | Volume Master Fisico (MIDI CC fader lineare 0-127) | 🟢 BASSA | 2h |

## Sequencer Transizioni — Logica

```
preshowTransitionType (settings, global default)
clip.transitionType (override per-clip, se presente)

onPreEnd  → avvia next clip se segue/crossfade e NO outro marker
onOutroReached → avvia next clip (rispetta tipo transizione)
onEnded → stopClip + eventuale loop
```

## Comandi Build (da eseguire nel repo principale o worktree)

```bash
npm run build:main      # tsc -p tsconfig.main.json
npm run build:preload   # tsc -p tsconfig.preload.json
npx vite build          # renderer → out/renderer/
npx electron-builder    # → builds/v{version}/Runtime Live Machine Setup {version}.exe
# Poi copiare l'exe in C:\Users\Utente\Documents\GitHub\RRLMP\builds\v{version}\
```

## Git Log Recente (master)

```
ea2cb1c chore: aggiungi .claude/worktrees/ a .gitignore
4a243ef merge: integra branch claude/musing-lumiere in master (v0.13.2 → v0.14.2)
8d29a6f chore: committa modifiche pre-sessione non salvate (v0.13.x work in progress)
69f0789 feat: implement ClipCard component with real-time playback and marker feedback logic
26f4ad2 chore: remove unused file from codebase
```

## Prossime Sessioni — Suggerimenti Ordine Lavori

1. **4.2 Emergency Stop hotkey** — `globalShortcut.register('Escape', stopAll)` nel main (1h, massimo impatto broadcast)
2. **Toast system** — sostituire `alert()` con notifiche non-bloccanti (4h, prerequisito per UX professionale)
3. **4.3 Next-Up badge** — indicatore visivo prossima clip PRE-SHOW (2h)
4. **4.4 Timer On Air** — cronometro elapsed in diretta (3h)
5. **Feedback Auto-Silence** — spinner/badge durante detection FFmpeg in background (1h)

---

*Documento aggiornato il 2026-04-07 — fine sessione v0.14.2.*
