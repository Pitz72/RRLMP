# Runtime Live Machine Pro

**Professional broadcast audio playout software for radio, live events, and stage productions.**

Built with Electron + React + TypeScript. Designed for operators who need rock-solid reliability under pressure.

---

## What it does

Runtime Live Machine Pro is a multi-column audio playout system. You load audio clips into columns, assign behaviors, and trigger them during a live broadcast — with full control over transitions, cues, and timing.

It replaces the chaotic "play from folder" workflow with a structured, visual board where every clip has its place, its markers, its notes, and its behavior defined *before* you go on air.

---

## Key Features

### Audio Engine
- **Main-Side-Heavy Architecture** — FFmpeg runs in the Node.js main process. The renderer never loads audio files into memory. No OOM crashes, even on large files.
- **Streaming via custom `media://` protocol** — files are streamed, not buffered. Works on files of any size.
- **Transition engine for all columns** — crossfade/segue/gapless now available for Music and Assets columns, not only PRE-SHOW
- **Auto-Silence Detection** — drop a file into PRE-SHOW and the app automatically detects and trims leading/trailing silence via FFmpeg
- **Ducking Sidechain** — voice columns can automatically duck music columns
- **Smart Mic Auto-Ducking** — hardware microphone monitoring via Web Audio API (USB mic, Rødecaster, any audio input). Voice detected by noise gate → automatic music ducking, no button required. Fully opt-in.
- **Master Chain Audio** — broadcast-grade processing on master bus: HPF 80Hz, Dynamics Compressor (-18dBFS, 4:1), Brickwall Limiter (-1dBFS). Configurable in Settings.
- **Output Device Hot-Switch** — change audio output device without restarting
- **Emergency Stop** — global `Escape` key (via Electron `globalShortcut`) stops all playback instantly, even when the app is not focused

### Board & Workflow
- **5 fixed columns**: Assets, Music, Voice, SFX, PRE-SHOW — each with configurable behavior, color-coded, keybind-mapped
- **Smart Mic ARM button** — arm/disarm microphone monitoring from the header with real-time mini VU meter
- **Column color customization** — each column has its own color picker (30 colors), persisted in project
- **Real-Time Board Cues** — INTRO countdown (`INTRO: -5s`) and OUTRO pre-cue alert on each ClipCard
- **UP NEXT badge** — dynamically shows which clip fires next in the queue
- **FADE OUT badge** — violet pulsing indicator on the outgoing clip during Crossfade/Segue transitions
- **Drop indicator** — glowing blue line shows exact insert position when dragging files from OS
- **Timer On Air** — elapsed time counter since first play of the session
- **NoteBoard** — when a clip with notes goes live, a panel appears at the bottom of the screen showing the director's script. Auto-shows and auto-hides.
- **Preview Transition** — test any crossfade/segue/gapless transition from ClipSettingsModal with a dedicated Stop button
- **Toast Notification System** — no blocking `alert()` dialogs. All notifications are non-intrusive toasts. Confirm dialogs are Promise-based — audio keeps playing while you decide.

### Waveform Editor
- **Interactive waveform** with 4 draggable handles: Trim Start, Trim End, Intro Marker, Outro Marker
- **Horizontal zoom** from 1x to 8x with adaptive ruler
- **Auto-Trim via IPC** — one button to detect and apply silence trim without touching the renderer memory
- **Playhead** tracking in real time during preview playback

### Project Management
- **Save/Load `.lmp` projects** (JSON format) with full clip state
- **Auto-backup** every 5 minutes, silent
- **LMP Integrity Check** — on project load, all file paths are verified. Missing files are flagged red instantly.
- **Export Self-Contained** — copies all audio files alongside the project for archiving or transfer
- **MIDI Learn** + per-clip keybindings (F1-F12, Numpad, custom keys)
- **i18n** — UI available in 8 languages: Italian, English, French, German, Spanish, Portuguese, Russian, Chinese

---

## Stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron 28 |
| UI | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS |
| State | Zustand |
| Audio processing | FFmpeg / FFprobe (main process, ASAR unpacked) |
| Packaging | electron-builder -> NSIS installer (Windows) |
| i18n | react-i18next |

---

## Getting Started

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build:main && npm run build:preload && npx vite build && npx electron-builder
# Output: builds/v{version}/Runtime Live Machine Setup {version}.exe
```

---

## Project Structure

```
src/
├── main/                   # Electron main process — IPC handlers, FFmpeg, file I/O
├── preload/                # contextBridge — secure IPC bridge to renderer
└── renderer/src/
    ├── engine/             # StreamPlayer, AudioContextManager, MidiManager
    ├── store/              # Zustand stores (audio, project, settings, toast, confirm)
    ├── components/
    │   ├── layout/         # MainGrid, ClipCard, NoteBoard
    │   ├── modals/         # ClipSettingsModal, GeneralSettingsModal, KeymappingModal
    │   └── ui/             # WaveformEditor, ToastContainer, ConfirmDialog, OnAirTimer
    └── i18n/               # Translation files (IT/EN)
```

---

## Documentation

- [`docs/VISION.md`](./docs/VISION.md) — complete feature inventory, architecture decisions, and prioritized backlog
- [`docs/changelogs/current/`](./docs/changelogs/current/) — per-version changelogs from v0.14.3 onward

---

## Current Version

**v0.17.0** — *Feature Release: Smart Mic — Auto-Ducking da Input Hardware*

See [`docs/changelogs/current/0.17.0.md`](./docs/changelogs/current/0.17.0.md) for details.

---

## License

ISC — Antigravity
