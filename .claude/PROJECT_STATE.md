# RRLMP — Stato Progetto per Sessioni Claude

**Aggiornato**: 2026-04-10
**Versione corrente**: 0.16.2
**Build verificata**: ✅ `builds/v0.16.2/Runtime Live Machine Setup 0.16.2.exe` (locale, non in git — builds/ è in .gitignore)
**Branch attivo**: `master`

---

## Struttura Repository

- **Repo principale**: `C:\Users\Utente\Documents\GitHub\RRLMP\`
- **Branch attivo**: `master` (unica fonte di verità)
- **Remote origin**: GitLab — `https://gitlab.com/pizzisimone1972/RRLMP.git`
- **Remote github**: GitHub — `https://github.com/Pitz72/RRLMP.git` (privato)
- **Build output**: `builds/v{version}/` nel repo principale (in .gitignore — non committare l'exe, supera 100MB)
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
| `import-m3u` | `importM3u` | Importa playlist M3U → PRE-SHOW — v0.14.12 |
| `emergency-stop` (push) | `onEmergencyStop` | Emergency Stop globale — v0.14.3 |
| `dialog:save-project` | `saveProject` | Salva .lmp con dialog |
| `save-project-direct` | `saveProjectDirect` | Salva .lmp su path noto |
| `save-project-silent` | `saveProjectSilent` | Auto-backup silenzioso |
| `dialog:load-project` | `loadProject` | Apre .lmp con dialog |
| `export-project` | `exportProject` | Esporta progetto self-contained |
| `force-close` | `forceClose` | Chiude finestra forzato |

> ⚠️ `show-close-dialog-i18n` rimosso in v0.16.1 — sostituito da dialog React custom (`confirmThree`)

## Feature Implementate (Complete)

### Engine Audio
- ✅ Main-Side-Heavy Architecture (v0.11.0)
- ✅ Streaming media:// protocol (v0.11.0)
- ✅ Transizioni PRE-SHOW: Gapless / Segue / Crossfade per-clip (v0.13.2) — **fixate v0.14.10**
- ✅ Durate separate Crossfade (2000ms) e Segue (800ms) (v0.14.8)
- ✅ Auto-Silence Detection al Drop in PRE-SHOW via IPC FFmpeg (v0.13.2, fix v0.14.10)
- ✅ Prompt analisi silenzio al caricamento di vecchi progetti (v0.14.10)
- ✅ Ducking Sidechain dinamico
- ✅ Output Device Hot-Switch
- ✅ Emergency Stop globale Escape → stopAll (v0.14.3)
- ✅ Preview Transizione PRE-SHOW: pulsante "Test →" nel ClipSettingsModal (v0.15.0) ⚠️ da raffinare (manca Stop nel modal)
- ✅ Volume Master MIDI reattivo: `masterVolume` in `useSettingsStore` (persistito), slider segue fader CC (v0.16.0)

### UI & Workflow
- ✅ Waveform Editor interattivo: 4 handle drag, playhead, Auto-Trim IPC (v0.14.1)
- ✅ Zoom orizzontale waveform 1x–8x con ruler adattivo (v0.14.8)
- ✅ LMP Integrity Check (v0.14.2)
- ✅ UP NEXT badge dinamico (v0.14.4)
- ✅ Note/Script per clip + NoteBoard live (v0.14.4 / v0.14.6)
- ✅ Timer On Air (v0.14.5)
- ✅ Badge TRIM… durante Auto-Silence (v0.14.6)
- ✅ Badge FADE OUT durante transizioni Crossfade/Segue (v0.14.9)
- ✅ Clip PRE-SHOW già suonate: opacity-50 visiva — campo `hasPlayed` (v0.14.12)
- ✅ KeymappingModal potenziato — per colonna + Emergency Stop (v0.14.6)
- ✅ Keybind globali verificate: F1–F12, Numpad, window keydown (v0.14.11)
- ✅ Toast Notification System — no più alert() bloccanti (v0.14.7)
- ✅ ConfirmDialog non-bloccante promise-based — esteso a 3 pulsanti in v0.16.1 (v0.14.7)
- ✅ Import Playlist M3U/M3U8 → PRE-SHOW (v0.14.12)
- ✅ Drop da OS file manager a posizione precisa: `addClipAtIndex`, `data-clip-id`, indice da `clientY` (v0.15.x)
- ✅ Badge "Auto-saved": appare 3s dopo ogni auto-backup riuscito (v0.16.0)
- ✅ Column Color Picker: `customColor` su Column, picker nel ColumnHeader, persistito nel .lmp (v0.16.1)
- ✅ Testo clip idle tinto con colore colonna (`lightenHex(clip.color)`, ~65% blend verso bianco) (v0.16.1/v0.16.2)
- ✅ Dialog chiusura uniforme: custom React a 3 pulsanti (Salva / Non Salvare / Annulla) (v0.16.1)
- ✅ i18n ClipSettingsModal: tab, ducking role, transition type, delete confirm (v0.16.1)
- ✅ i18n GeneralSettingsModal: titolo, output device, mixing, durate, done (v0.16.1)
- ✅ Drop indicator: linea blu luminosa nella colonna durante drag da OS (v0.16.2)
- ✅ Master Chain Audio: HPF 80Hz + Compressore broadcast + Limiter brickwall sul master bus (v0.16.2)
- ✅ Master Chain Settings: persisted in useSettingsStore, controlli in GeneralSettingsModal (v0.16.2)
- ✅ Icone toolbar aggiornate + tooltip fixati (v0.14.11)
- ✅ Real-Time Board Cues: INTRO countdown, OUTRO pre-cue + alert
- ✅ MIDI Learn Mode + KeymappingModal
- ✅ Save/Load .lmp + Auto-Backup + Export Self-Contained
- ✅ i18n (IT/EN), VU Meter, Digital Clock, Welcome Screen
- ✅ Drag & Drop tra colonne + multi-selezione

## Campi AudioClip (persistiti nel .lmp)

| Campo | Tipo | Persistito | Note |
|-------|------|-----------|------|
| `silenceChecked` | boolean | ✅ | True se analisi IPC già eseguita |
| `hasPlayed` | boolean | ✅ | True se clip PRE-SHOW già suonata |
| `isMissing` | boolean | ❌ runtime | File mancante su disco |
| `isAnalyzing` | boolean | ❌ runtime | Analisi silenzio in corso |

## Campi Column (persistiti nel .lmp)

| Campo | Tipo | Persistito | Note |
|-------|------|-----------|------|
| `color` | string | ✅ | Colore base (immutabile, default) |
| `customColor` | string? | ✅ | Override colore utente (v0.16.1) |

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
{ "version": "0.16.2", "timestamp": "ISO8601", "project": { "columns": [] } }
```

## Debito Tecnico Aperto

| Priorità | Item |
|----------|------|
| 🟡 Media | Preview Transizione: aggiungere pulsante Stop nel ClipSettingsModal (2h) |
| ✅ Done | Master Chain Audio: implementato in v0.16.2 |
| 🟡 Media | Smart Mic Auto-Ducking: getUserMedia → AnalyserNode → noise gate → evaluateMix (10h) |
| 🟡 Media | Session Recording: MediaRecorder sul master bus → WebM/Opus → IPC writeFile (8h) |
| 🟢 Bassa | Error Boundaries React (1h) |
| ⏸️ Sospesa | Colonne Configurabili (fuori scope) |

## Errori TS Pre-Esistenti (non impattano build)
- `DebugOverlay.tsx`: import inutilizzati (TS6133)
- `BufferPlayer.ts`: interfaccia IAudioPlayer incompleta (TS2420)

## Comandi Build

```bash
npm run build:main && npm run build:preload && npx vite build && npx electron-builder
# exe → builds/v{version}/Runtime Live Machine Setup {version}.exe (NON committare — >100MB)
```

## Push Multi-Remote

```bash
git push origin master   # GitLab
git push github master   # GitHub
```

---

*Documento aggiornato il 2026-04-10 — fine sessione v0.16.2.*
