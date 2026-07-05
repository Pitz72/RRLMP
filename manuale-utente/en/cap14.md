# Chapter 14 — Troubleshooting and FAQ

---

This chapter collects the most common problems in the daily use of Runtime Live Machine Pro, with their solutions. Each section describes the symptom, the most likely cause and the procedure to resolve it.

---

## 14.1 Audio problems

### The timer runs and the VU meters move, but nothing is heard

The software is playing correctly (the signal is present on the internal bus), but it isn’t reaching the monitoring device.

**Check in order:**

1. **Master Volume.** Is the slider in the header at zero? Bring it to 100%.
2. **Output device.** Open Settings → *Audio & Mix* and check which device is selected. Windows and macOS can change the identifier of USB devices when they are unplugged and reconnected. If the name doesn’t match the one physically connected, select it again.
3. **External mixer.** If the signal reaches a hardware mixer, check that the channel fader isn’t down or muted, and that the mixer output is connected to the monitors or the broadcast chain.

### The audio skips, crackles or has dropouts

Under normal conditions the audio engine doesn’t produce these artefacts. If they occur, the cause is almost always external to the software.

- **CPU under extreme load.** Close heavy applications running at the same time (video editing, rendering, intensive backups).
- **Audio buffer too low.** With a professional sound card, check the buffer value in the driver’s control panel. A value of 256 or 512 samples is the right balance; below 128 samples, dropouts can appear.
- **Slow or stressed disk.** RLMP streams the audio from disk. A slow mechanical disk, or an almost-full SSD, can cause interruptions on large files.

### The audio level is too low or too high

- **Per-clip Gain.** Adjust the Gain in the clip properties (right-click → Volume section).
- **Master Volume.** If the overall level is wrong, act on the slider in the header.
- **Levelling and Master Chain.** Volume levelling brings the clips’ levels closer to a common reference; the Master Chain glue can make the sound more compact. If a result doesn’t convince you, you can adjust or disable these stages in Settings → Master Chain.

---

## 14.2 Red clips and missing files

### A card has turned red (“MISSING FILE”) and doesn’t respond to the click

The red border indicates that the audio file isn’t reachable at the path stored in the project.

**Possible causes:**

- The file was moved or renamed on disk.
- The file was on an external disk or a USB stick that is now disconnected.
- The project was opened on a different computer, where the paths don’t match.

**Solutions:**

1. **Reconnect the disk.** If the file was on an external drive, plug it back in.
2. **Return the file to its original location.** If it was moved, put it back at the original path.
3. **Replace the clip.** Drag the correct file into the grid again and delete the red card.
4. **Use Export project with audio in future.** The most effective prevention is to consolidate the audio into the project before moving or transferring it (Chapter 10).

---

## 14.3 MIDI problems

### The controller isn’t detected

1. **Connection.** Check that the controller is connected and recognized by the operating system. RLMP detects the connection and disconnection of devices in real time; if it doesn’t appear, unplug and reconnect the USB cable.
2. **Driver.** Most USB-MIDI controllers are *class-compliant* and need no driver. For professional surfaces with proprietary drivers, check that the driver is installed.
3. **Check in Learn mode.** Enable MIDI Learn and press a key on the controller: if the card receives the mapping, the controller is detected.

### The mapped clips don’t respond to the controller keys

- **MIDI Learn mode is still active.** In MIDI Learn the controller keys register new mappings instead of triggering the clips. Disable the mode from the Tools menu.
- **The mapping was lost.** The clip mappings are in the `.lmp` file; check that the project was saved after the MIDI Learn session. The global-function mappings are instead tied to the individual computer.

---

## 14.4 Startup problems

### The application won’t start on macOS (Gatekeeper warning)

See section 2.3: unblock via *System Settings → Privacy & Security*.

### The application won’t start on Windows (SmartScreen warning)

See section 2.2. Click *More info* and then *Run anyway*.

### Abnormal behaviour at startup

If the software behaves unexpectedly on opening, close and reopen RLMP. If the problem persists, check that the installation path doesn’t contain special characters that might interfere with loading the FFmpeg components.

---

## 14.5 Frequently asked questions

**Can RLMP run a radio station unattended for 24 hours?**
No. RLMP is designed for live production: shows attended by an operator. It has no hourly scheduling and no automatic playlist rotation. The Automix view offers a limited, voluntary automation of the music flow only, active while the view is open (Chapter 7). For 24/7 automation there are dedicated tools (Zara Radio, PlayIt Live, Rivendell): they answer different needs.

**What’s the difference between Save and Save As?**
*Save Project* overwrites the open `.lmp` file, silently. *Save As…* always opens the dialog box and creates a new file, without touching the current one.

**Can I use RLMP on an iPad or on mobile devices?**
Not as the main application: RLMP is desktop software for Windows, macOS and Linux. A tablet or a phone can, however, act as a **remote** via the browser, through Remote Control (Chapter 11).

**Are `.lmp` files from earlier versions compatible with 1.15.10?**
Yes. When you open a project created with an earlier version, RLMP automatically updates its structure, including the columns added in the meantime, without modifying the file until you perform a save.

**How do I update RLMP to a new version?**
The software checks for updates at startup and notifies you. On Windows and Linux AppImage the installation is automatic from the update window; on macOS and Linux `.deb` the browser is opened on the download page. All the details are in Chapter 12.

**Where are the automatic backups saved?**
In the `autosaves` folder inside the application data directory (`%APPDATA%\runtime-live-machine-pro\autosaves\` on Windows; equivalent paths on macOS and Linux, Chapter 10). The ten most recent snapshots are kept.

**Does the software work offline?**
Yes, completely. RLMP doesn’t require an internet connection to work. The network is used only for the update check (optional) and for Remote Control on the local network (optional).

**Remote Control won’t connect. Why?**
Check that the remote device is on the **same network** as the computer, that you entered the **correct PIN** (it changes at every launch), and that you’re using the address shown in the Settings. Remember that Remote Control starts off at every launch of the application (Chapter 11).
