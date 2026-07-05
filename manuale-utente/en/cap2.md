# Chapter 2 — Installation and first launch

---

Installing Runtime Live Machine Pro is designed to require the least possible interaction: a few clicks, no manual configuration, no prerequisites to install separately. The audio engine (FFmpeg) is bundled into the installation package and requires nothing from you.

---

## 2.1 System requirements

Before proceeding, check that your computer meets the minimum requirements. The recommended specifications ensure the best experience during long sessions or with many clips loaded at once.

| | Minimum | Recommended |
|---|---|---|
| **Operating system (Windows)** | Windows 10 64-bit | Windows 11 64-bit |
| **Operating system (macOS)** | macOS 11 Big Sur | macOS 13 Ventura or later |
| **Operating system (Linux)** | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| **RAM** | 4 GB | 8 GB or more |
| **Disk space** | 300 MB (application) | 1 GB + space for audio files |
| **CPU** | Any modern dual-core | Quad-core or better |

The software is optimized for Apple Silicon (M1, M2, M3) and runs natively on both macOS architectures without Rosetta emulation.

A dedicated sound card is not required: RLMP works with any audio device recognized by the operating system, from the built-in sound card up to professional USB mixers such as the Rødecaster Pro or the RØDECaster Duo.

---

## 2.2 Installation on Windows

1. Download the file `Runtime-Live-Machine-Pro-1.15.10.exe` from the official distribution channel.
2. Double-click the executable. The NSIS installer starts and copies the files to the appropriate directories.
3. When it finishes, a shortcut is created on the Desktop and in the Start menu.
4. The application launches automatically once installation is complete.

**A note on Windows SmartScreen.** Because the software is updated frequently, the code-signing certificate may not yet have built up enough “reputation” for SmartScreen’s automatic whitelist. If the warning “Windows protected your PC” appears, click *More info* and then *Run anyway*. The software is free of malware; the official installers are published exclusively through the author’s distribution channels.

---

## 2.3 Installation on macOS

1. Download the `.dmg` file from the official channel.
2. Open the image file and drag the Runtime Live Machine Pro icon into the *Applications* folder.
3. On first launch, macOS may show a Gatekeeper warning (“App can’t be opened because it is from an unidentified developer”). To proceed, open *System Preferences* → *Security & Privacy* → *General* and click *Open Anyway* next to the application name.

From macOS 15 (Sequoia) onward, the path is *System Settings* → *Privacy & Security* → scroll down to the *Security* section.

> **Note.** The macOS application is not signed with an Apple Developer certificate. This also affects how updates are handled, as explained in Chapter 12.

---

## 2.4 Installation on Linux

Two distribution formats are available:

- **AppImage** — a portable executable, no installation required. Make the file executable (`chmod +x`) and launch it directly.
- **.deb package** — for Debian/Ubuntu/Mint distributions. Install with `sudo dpkg -i filename.deb` or open it with the graphical package manager.

On some distributions you may need to install the `libasound2` package for ALSA audio support. Consult your distribution’s documentation if the application won’t start.

---

## 2.5 The welcome screen

![The Runtime Live Machine Pro welcome screen, with the main actions and the language selector.](../screenshots-en/schermata-benvenuto.png)

*Figure 2.1 — The welcome screen: software identity, update status, main actions and language selector.*

On first launch — and at every subsequent launch, until you open a project — RLMP presents the **welcome screen**, the gateway to all preliminary operations. The panel is split into two zones.

**Left zone — Identity and actions.**
The software logo (the bars of a VU meter with the play symbol) identifies the Pro edition. Below the title and slogan is the installed version number, accompanied by the status of the update system:

- **“Latest Version”** (green) — you are running the most recent version available.
- **“Update Available”** (amber, flashing) — this is a button: click it to open the update window (Chapter 12).
- **“OFFLINE”** (dim red) — the update service could not be reached; the software works all the same.

Below that are the main actions:

- *New Project* — creates an empty session with the columns ready to load.
- *Load Project* — opens an existing `.lmp` file. Before making it operational, RLMP runs an **integrity check**: it verifies that every referenced audio file still exists at the stored path. Missing files are flagged immediately with a red border on their clip.
- *Manual* — the entry is present but currently disabled: documentation viewable from inside the software will arrive in a future version, over the web.

**Right zone — Language selector.**
RLMP supports eight interface languages: English, Italian, French, German, Spanish, Portuguese, Russian and Simplified Chinese. The active language is highlighted with a cyan border and a check mark. The selection takes effect immediately and is remembered from one session to the next.

---

## 2.6 The first launch: what to expect

When you first open a project, you’ll notice in the header the logo with the **PRO** badge and its iridescent gradient. Behind the interface, opening the project starts the audio engine in the background: FFmpeg is initialized and the `media://` streaming protocol begins listening, ready to serve files from disk without loading them into memory.

The software starts preferably in full-screen mode. If the window opens resized, press `F11` (Windows/Linux) or `Ctrl+Cmd+F` (macOS) to bring it full screen — the ideal condition for production work.

The **On Air timer** in the header stays at `--:--:--` until the first clip of the session is launched. From that moment it starts counting the time elapsed on air: a useful reference for anyone working with fixed-time running orders.
