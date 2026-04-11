# CHAPTER 1: INTRODUCTION AND SETUP

Welcome to **Runtime Live Machine Pro (RRLMP)**.
This chapter will guide you through the first steps: from understanding the software philosophy to the first launch.

## 1.1 What is Runtime Live Machine Pro (RRLMP)

**Runtime Live Machine Pro** is a professional "Pro-grade" audio architecture designed for directing **single live shows**, podcasts, events, and web radios.

Unlike complex 24/7 radio automation software (which plays rotating music for days), RRLMP is a **Performance** tool. It is designed to be "played" in real-time by a director or speaker, offering surgical control over every transition.

### Why choose RRLMP?
*   **"Single Show" Philosophy**: Each project is an isolated container holding everything needed for that specific episode or event.
*   **Main-Side-Heavy Architecture**: Uses a Node.js proxy for heavy audio decoding (FFmpeg), ensuring the interface (Renderer) remains fluid and crash-free even with large WAV files.
*   **Total Safety**: Includes Auto-Backup systems, .lmp file integrity checks, and visual warnings for Intro/Outro cues.
*   **Physical Control**: Natively supports MIDI controllers (with MIDI Learn) and keyboards for tactile and responsive directing.

---

## 1.2 Installation

### System Requirements
*   **Windows**: Windows 10 or Windows 11 (64-bit).
*   **macOS**: macOS 11 (Big Sur) or later (Native Apple Silicon & Intel Support).
*   **Linux**: AppImage and .deb packages supported (Ubuntu/Debian/Mint).
*   **RAM**: Minimum 4GB (8GB Recommended).
*   **Disk Space**: 200MB for the application + space for your audio files.

### Installation on Windows
1.  Download the `Runtime Live Machine Pro Setup 1.0.0.exe` file from the official website or repository.
2.  Double-click the executable.
3.  The automatic installer will copy the files and create a shortcut on the Desktop.
4.  Once finished, the application will launch automatically.

> **Security Note**: Since the software is frequently updated, Windows SmartScreen might show a "PC protected by Windows" warning. Click on **"More info"** and then on **"Run anyway"**. The software is safe, signed, and malware-free.

### Installation on macOS
1.  Download the `.dmg` file.
2.  Open the image file and drag the **Runtime Live Machine Pro** icon into the **Applications** folder.
3.  On first launch, you might need to authorize the application in *System Preferences > Security & Privacy*.

---

## 1.3 The Welcome Screen

On first launch, you will be greeted by the new **Welcome Screen** in a horizontal layout. This is your starting dashboard, designed to get you working in seconds.

### Screen Elements
1.  **New Logo**: The Pro logo (5 VU meter bars with a play triangle) identifies the stable version of the software.
2.  **Version Status**: Under the logo, you will see the current version number (e.g., `v1.0.0`).
    *   ? **Green**: You have the latest version available.
    *   ?? **Yellow/Orange**: An update is available.
3.  **Language Selector**: In the top right, you find flags (8 supported languages) to instantly change the interface.
    *   *Languages*: IT, EN, FR, DE, ES, PT, RU, ZH.
    *   Your choice is stored in the user profile.

### Available Actions
*   **New Project**: Creates an empty session. All 5 columns (Assets, Music, Voice, SFX, PRE-SHOW) will be ready for file loading.
*   **Load Project**: Opens an existing `.lmp` file. RRLMP will perform an integrity check: if any audio files are missing, they will be highlighted in red.
*   **Online Manual**: Opens the updated documentation in your browser.

> **First Launch**: RRLMP preferably starts in full screen. Once a project is loaded, you will notice the cyan **PRO** badge in the header, confirming the license and the stability of the audio engine.
