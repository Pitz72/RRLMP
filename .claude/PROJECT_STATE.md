# RRLMP — Stato Progetto per Sessioni Claude

**Aggiornato**: 2026-04-07
**Versione corrente**: 0.14.9
**Build verificata**: ✅ `builds/v0.14.9/Runtime Live Machine Setup 0.14.9.exe`
**Branch attivo**: `master` (main repo) / `claude/elegant-tharp` (worktree attivo)

---

## Struttura Repository

- **Repo principale**: `C:\Users\Utente\Documents\GitHub\RRLMP\`
- **Branch attivo**: `master`
- **Build output**: `builds/v{version}/` nel repo principale
- **Worktree Claude**: `.claude/worktrees/` (in .gitignore — non committare)

## Stack Tecnologico

- **Electron** 28.3.3 + **React** + **TypeScript**
- **Vite** 5 (renderer) + **tsc** (main/preload)
- **Zustand** (state: useAudioStore, useProjectStore, useSettingsStore, useDebugStore, useToastStore, useConfirmStore)
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
| `get-audio-metadata` | `getAudioMetadata` | Estrae metadata |
| `get-waveform-data` | `getWaveformData` | Genera dati waveform (FFmpeg) |
| `detect-silence` | `detectSilence` | Rileva silenzio start/end (FFmpeg) |
| `check-files-exist` | `checkFilesExist` | Verifica esistenza file — v0.14.2 |
| `emergency-stop` (push) | `onEmergencyStop` | Emergency Stop globale — v0.14.3 |
| `dialog:save-project` | `saveProject` | Salva .lmp con dialog |
| `save-project-direct` | `saveProjectDirect` | Salva .lmp su path noto |
| `save-project-silent` | `saveProjectSilent` | Auto-backup silenzioso |
| `dialog:load-project` | `loadProject` | Apre .lmp con dialog |
| `export-project` | `exportProject` | Esporta progetto self-contained |
| `show-close-dialog-i18n` | `showCloseDialogI18n` | Dialog chiusura localizzato |
| `force-close` | `forceClose` | Chiude finestra forzato |

## Feature Implementate (Complete)

### Engine Audio
- ✅ Main-Side-Heavy Architecture (v0.11.0)
- ✅ Streaming media:// protocol (v0.11.0)
- ✅ Transizioni PRE-SHOW: Gapless / Segue / Crossfade per-clip (v0.13.2)
- ✅ Durate separate Crossfade (2000ms) e Segue (800ms) (v0.14.8)
- ✅ Auto-Silence Detection al Drop in PRE-SHOW (v0.13.2)
- ✅ Ducking Sidechain dinamico
- ✅ Output Device Hot-Switch
- ✅ Emergency Stop globale Escape → stopAll (v0.14.3)

### UI & Workflow
- ✅ Waveform Editor interattivo: 4 handle drag, playhead, Auto-Trim IPC (v0.14.1)
- ✅ Zoom orizzontale waveform 1x–8x con ruler adattivo (v0.14.8)
- ✅ LMP Integrity Check (v0.14.2)
- ✅ UP NEXT badge dinamico (v0.14.4)
- ✅ Note/Script per clip + NoteBoard live (v0.14.4 / v0.14.6)
- ✅ Timer On Air (v0.14.5)
- ✅ Badge TRIM… durante Auto-Silence (v0.14.6)
- ✅ Badge FADE OUT durante transizioni Crossfade/Segue (v0.14.9)
- ✅ KeymappingModal potenziato — per colonna + Emergency Stop (v0.14.6)
- ✅ Toast Notification System — no più alert() bloccanti (v0.14.7)
- ✅ ConfirmDialog non-bloccante promise-based (v0.14.7)
- ✅ Real-Time Board Cues: INTRO countdown, OUTRO pre-cue + alert
- ✅ MIDI Learn Mode + KeymappingModal
- ✅ Save/Load .lmp + Auto-Backup + Export Self-Contained
- ✅ i18n (IT/EN), VU Meter, Digital Clock, Welcome Screen
- ✅ Drag & Drop + multi-selezione

## Colonne Default (5 fisse)
| ID | Tipo | Colore | NextAction default |
|----|------|--------|-------------------|
| col-assets | asset | #10B981 Emerald | stop |
| col-music | music | #EF4444 Red | stop |
| col-voice | voice | #F97316 Orange | stop |
| col-sfx | sfx | #64748B Slate | stop |
| col-preshow | preshow | #8B5CF6 Violet | play_next |

## Formato File .lmp

```json
{ "version": "0.14.9", "timestamp": "ISO8601", "project": { "columns": [] } }
```
`isMissing`, `isAnalyzing` → runtime-only, non serializzati. `notes` → persistito.

## Debito Tecnico Aperto

| Priorità | Item |
|----------|------|
| 🔴 Alta | Shortcut tastiera clip (F1-F12/Numpad) — verifica listener globale |
| 🟡 Media | Playlist Import M3U → PRE-SHOW (2 giorni) |
| 🟡 Media | Preview Transizione "Test →" (4h) |
| 🟢 Bassa | Column Color Picker (2h) |
| 🟢 Bassa | Volume Master MIDI CC fader continuo (2h) |
| 🟢 Bassa | Badge "Auto-saved" nell'header (30min) |
| 🟢 Bassa | i18n modali (testi IT hardcoded) (2h) |
| 🟢 Bassa | Error Boundaries React (1h) |
| ⏸️ Sospesa | Colonne Configurabili (fuori scope) |

## Errori TS Pre-Esistenti (non impattano build)
- `DebugOverlay.tsx`: import inutilizzati (TS6133)
- `BufferPlayer.ts`: interfaccia IAudioPlayer incompleta (TS2420)

## Comandi Build

```bash
npm run build:main && npm run build:preload && npx vite build && npx electron-builder
# exe → builds/v{version}/Runtime Live Machine Setup {version}.exe
```

## Git Log Recente (master)

```
2baeb36 docs: aggiorna PROJECT_STATE.md a v0.14.2
ea2cb1c chore: aggiungi .claude/worktrees/ a .gitignore
4a243ef merge: integra branch claude/musing-lumiere in master (v0.13.2 → v0.14.2)
```

## Prossime Sessioni — Ordine Lavori Suggerito

1. **Merge worktree** `claude/elegant-tharp` → `master` (v0.14.3 → v0.14.9)
2. **Shortcut tastiera globali** — verifica + fix listener (priorità alta)
3. **Playlist Import M3U** → PRE-SHOW (impatto workflow reale)
4. **Preview Transizione** — Test Crossfade/Segue prima di andare in onda
5. **Column Color Picker** — piccolo, impatto visivo immediato

---

*Documento aggiornato il 2026-04-07 — fine sessione v0.14.9.*
