# Runtime Live Machine Pro — Quick Start Guide

**Version 1.15.10 · English**

Welcome to Runtime Live Machine Pro (RLMP), the audio playout software for radio, live shows, and events. This guide gets you from installation to your first play in a few minutes. For full documentation, see the User Manual (downloadable from the software via the "Manual" button).

---

## What's new in this version

- **Export project with audio** — this FILE menu item (below *Save As…*) consolidates all audio into an `audio/` subfolder and re-points the clips to it: from that moment on, the archive is the project's reference and **you can safely delete the original files**. It used to be called "Export Archive".
- **Clear column** — the trash-can icon in each column header removes all of its clips in one go, with a confirmation prompt (undoable with `Ctrl+Z`).
- **Intro badge on cards** — if a clip has an Intro point configured, a cyan `I` badge with the number of seconds stays permanently visible; the BPM badge is now high-visibility fluorescent yellow.
- **Improved in-app updates** — the update window is larger and shows the real release notes (the changelog); when you choose "Restart and install", the app closes cleanly and the installation runs without a hitch.

---

## 1. System Requirements

| | Minimum | Recommended |
|---|---|---|
| Windows | 10 64-bit | 11 64-bit |
| macOS | 11 Big Sur | 13 Ventura or later |
| Linux | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| RAM | 4 GB | 8 GB or more |
| Disk | 300 MB | 1 GB + space for audio files |

No dedicated sound card required: RLMP works with any device recognized by your system, from built-in outputs to professional USB mixers (Rødecaster Pro, Rødecaster Duo, etc.). Natively optimized for Apple Silicon (M1/M2/M3).

---

## 2. Installation

**Windows**
1. Open the downloaded `.exe` file.
2. If you see *"Windows protected your PC"*, click **More info** → **Run anyway**. This is normal for frequently updated software — there is no malware, and the source code is publicly available.
3. Follow the setup wizard. A shortcut is created on the Desktop and in the Start menu once it's done.

**macOS**
1. Open the downloaded `.dmg` file.
2. Drag the Runtime Live Machine Pro icon into the **Applications** folder.
3. On first launch, if macOS shows a Gatekeeper warning, go to **System Settings → Privacy & Security** and click **Open Anyway** next to the app name.

**Linux**
- **AppImage** (portable, no installation): make the file executable with `chmod +x` and run it.
- **.deb** (Debian/Ubuntu/Mint): install with `sudo dpkg -i filename.deb` or via your graphical package manager.
- If the app doesn't launch, make sure the `libasound2` package is installed for ALSA support.

---

## 3. First Launch

On startup you'll see the **Welcome Screen**: from here you can create a new project, load an existing one (`.lmp`), download the User Manual, or open this Quick Start Guide. In the top-right corner you can pick the interface language from the eight available.

Once a project is open, the cyan **PRO** badge in the header confirms the audio engine is active. Press `F11` (Windows/Linux) or `Ctrl+Cmd+F` (macOS) to switch to full screen — the recommended mode for live directing.

---

## 4. The Six Columns

RLMP organizes everything into six fixed columns, each with its own dedicated behavior:

| Column | Color | Behavior |
|---|---|---|
| **Show Assets** | Green | Station IDs, music beds, institutional stingers |
| **Jingle** | Amber | Identity jingles |
| **Promo** | Cyan | Promos and self-promotion spots |
| **Songs** | Red | Music playlist, subject to ducking, BPM detection |
| **Voices** | Orange | Highest priority: lowers everything else |
| **Pre-Show** | Purple | Warm-up music before going live, with optional rotation |

Each column header has a colored dot: click it to choose a different color from 30 available shades.

---

## 5. FX Pad and Automix

Besides the six columns, the header offers two quick tools:

- **FX** — opens the sound effects pad: free-overlay triggering, ideal for stingers, applause, and sound transitions.
- **MIX** — opens the Automix view, the deck dedicated to the Songs column: BPM compatibility, beat-matched transitions, and automatic mode.

---

## 6. Load and Play Your First File

1. Drag an audio file (MP3, WAV, AAC/M4A, OGG, FLAC) from File Explorer / Finder directly onto a column.
2. **Left-click** the card to start playback.
3. **Click again** on the active card to stop it with a fade out, or press `Esc` for an immediate emergency stop of all clips.

In most columns the rule is "one clip at a time": starting a new one automatically stops whatever else is playing in that column. The FX pad is the exception: effects overlay freely.

---

## 7. Where to Get Help

- **Full User Manual** — downloadable directly from the software (the "Manual" button on the Info screen), covering every feature in detail (waveform editor, ducking, MIDI, recording, project management, remote control).
- **Official website and updates** — the color next to the version number on the Welcome Screen shows whether an update is available (green = up to date, yellow/orange = new version available).

Enjoy the show.

*Runtime Live Machine Pro is an Ecosystem.Runtime project — © Simone Pizzi.*
