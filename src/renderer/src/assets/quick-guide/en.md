# Runtime Live Machine Pro — Quick Start Guide

**Version 1.15.33 · English**

Welcome to Runtime Live Machine Pro (RLMP), the audio playout software for radio, live shows, and events. This guide gets you from installation to your first play in a few minutes. For full documentation, see the User Manual (*User Manual* button). RLMP is free software released under the MIT licence: the code is at `github.com/Pitz72/RRLMP`.

---

## What's new in this version

- **Free software** — Runtime Live Machine Pro is no longer for sale: it is released under the MIT licence and the source code is public. Updates and downloads come from the project repository on GitHub.
- **ON AIR banner always visible** — the track on air is shown with progress, a phased timer and UP NEXT, without shifting the columns any more.
- **Italian and English** — the interface comes in two languages, picked from the drop-down in the top-right corner of the welcome screen.
- **Smart Mic** — with a USB microphone plugged into the computer, the music dips on its own when you speak (ARM button).
- **macOS** — no official installer: if you have a Mac, you build the program from source.

---

## 1. System Requirements

| | Minimum | Recommended |
|---|---|---|
| Windows | 10 64-bit | 11 64-bit |
| macOS (from source) | 11 Big Sur | 13 Ventura or later |
| Linux | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| RAM | 4 GB | 8 GB or more |
| Disk | 300 MB | 1 GB + space for audio files |

No dedicated sound card required: RLMP works with any device recognized by your system, from built-in outputs to professional USB mixers (Rødecaster Pro, Rødecaster Duo, etc.).

---

## 2. Installation

**Windows**
1. Open the downloaded `.exe` file.
2. If you see *"Windows protected your PC"*, click **More info** → **Run anyway**. This is normal for frequently updated software — there is no malware, and the source code is publicly available.
3. Follow the setup wizard. A shortcut is created on the Desktop and in the Start menu once it's done.

**macOS**
There is no official installer: the program is built from source. Instructions are in the User Manual (section 2.3) and in the project’s `CONTRIBUTING.md` file on GitHub.

**Linux**
- **AppImage** (portable, no installation): make the file executable with `chmod +x` and run it.
- **.deb** (Debian/Ubuntu/Mint): install with `sudo dpkg -i filename.deb` or via your graphical package manager.
- If the app doesn't launch, make sure the `libasound2` package is installed for ALSA support.

---

## 3. First Launch

On startup you'll see the **Welcome Screen**: from here you can create a new project, load an existing one (`.lmp`), download the User Manual, or open this Quick Start Guide. In the top-right corner you can pick the interface language: English or Italian.

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

*Runtime Live Machine Pro is a Runtime Radio project — free software, MIT licence — © 2026 Simone Pizzi.*
