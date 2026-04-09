# RRLMP — Stato Progetto per Sessioni Claude

**Aggiornato**: 2026-04-09
**Versione corrente**: 0.14.12
**Build verificata**: ✅ `builds/v0.14.12/Runtime Live Machine Setup 0.14.12.exe`
**Branch attivo**: `master`

---

## Struttura Repository

- **Repo principale**: `C:\Users\Utente\Documents\GitHub\RRLMP\`
- **Branch attivo**: `master` (unica fonte di verità)
- **Remote origin**: GitLab — `https://gitlab.com/pizzisimone1972/RRLMP.git`
- **Remote github**: GitHub — `https://github.com/Pitz72/RRLMP.git` (privato)
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
| `import-m3u` | `importM3u` | Importa playlist M3U → PRE-SHOW — v0.14.12 |
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
- ✅ Transizioni PRE-SHOW: Gapless / Segue / Crossfade per-clip (v0.13.2) — **fixate v0.14.10**
- ✅ Durate separate Crossfade (2000ms) e Segue (800ms) (v0.14.8)
- ✅ Auto-Silence Detection al Drop in PRE-SHOW via IPC FFmpeg (v0.13.2, fix v0.14.10)
- ✅ Prompt analisi silenzio al caricamento di vecchi progetti (v0.14.10)
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
- ✅ Clip PRE-SHOW già suonate: opacity-50 visiva (v0.14.12)
- ✅ KeymappingModal potenziato — per colonna + Emergency Stop (v0.14.6)
- ✅ Keybind globali verificate: F1–F12, Numpad, window keydown (v0.14.11)
- ✅ Toast Notification System — no più alert() bloccanti (v0.14.7)
- ✅ ConfirmDialog non-bloccante promise-based (v0.14.7)
- ✅ Import Playlist M3U/M3U8 → PRE-SHOW (v0.14.12)
- ✅ Icone toolbar aggiornate + tooltip fixati (v0.14.11)
- ✅ Real-Time Board Cues: INTRO countdown, OUTRO pre-cue + alert
- ✅ MIDI Learn Mode + KeymappingModal
- ✅ Save/Load .lmp + Auto-Backup + Export Self-Contained
- ✅ i18n (IT/EN), VU Meter, Digital Clock, Welcome Screen
- ✅ Drag & Drop + multi-selezione

## Campi AudioClip (persistiti nel .lmp)

| Campo | Tipo | Persistito | Note |
|-------|------|-----------|------|
| `silenceChecked` | boolean | ✅ | True se analisi IPC già eseguita |
| `hasPlayed` | boolean | ✅ | True se clip PRE-SHOW già suonata |
| `isMissing` | boolean | ❌ runtime | File mancante su disco |
| `isAnalyzing` | boolean | ❌ runtime | Analisi silenzio in corso |

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
{ "version": "0.14.12", "timestamp": "ISO8601", "project": { "columns": [] } }
```

## Debito Tecnico Aperto

| Priorità | Item |
|----------|------|
| 🟡 Media | Preview Transizione "Test →" ultimi N sec clip corrente + inizio prossima (4h) |
| 🟢 Bassa | Column Color Picker (2h) |
| 🟢 Bassa | Volume Master MIDI CC fader continuo (2h) |
| 🟢 Bassa | Badge "Auto-saved" nell'header (30min) |
| 🟢 Bassa | i18n modali (testi IT hardcoded) (2h) |
| 🟢 Bassa | Error Boundaries React (1h) |
| ⏸️ Sospesa | Colonne Configurabili (fuori scope) |

## Errori TS Pre-Esistenti (non impattano build)
- `DebugOverlay.tsx`: import inutilizzati (TS6133)
- `BufferPlayer.ts`: interfaccia IAudioPlayer incompleta (TS2420)
- `ClipSettingsModal.tsx`: tipo `'default'` non assegnabile a `TransitionType` (TS2345)

## Comandi Build

```bash
npm run build:main && npm run build:preload && npx vite build && npx electron-builder
# exe → builds/v{version}/Runtime Live Machine Setup {version}.exe
```

## Push Multi-Remote

```bash
git push origin master   # GitLab
git push github master   # GitHub
```

---

*Documento aggiornato il 2026-04-09 — fine sessione v0.14.12.*
