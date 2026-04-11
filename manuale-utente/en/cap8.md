# CHAPTER 8: TROUBLESHOOTING AND FAQ

Even in the most stable software, unexpected events due to hardware or the operating system can occur. Here you will find solutions to the most common problems.

---

## 8.1 Audio Problems

### The Timer runs and the VU Meters move, but I hear nothing.
The software is playing the audio correctly (you can see it from the colored bars at the top), but the signal is not reaching your speakers/headphones.
1.  **Check the Master Volume**: Make sure the volume slider at the top is not at zero.
2.  **Verify the Output (Routing)**:
    *   Click the **Gear** (Settings) icon.
    *   Check which device is selected in "Audio Output Device".
    *   Sometimes Windows changes the ID of USB devices if they are unplugged and replugged. Try reselecting your sound card (e.g., *Rødecaster Pro* or *Headphones*) from the list.
3.  **External Mixer**: If you output to a USB mixer, check that the physical fader for that channel is not lowered or on "Mute".

### The audio "crackles" or skips.
This rarely happens thanks to the native engine, but it can happen if the computer's CPU is under extreme stress.
*   Close other heavy applications (video editing, games).
*   If you use a professional sound card, check that the *Buffer Size* in the card drivers is not too low (recommended: 256 or 512 samples).

---

## 8.2 File Management and Red Clips

### A Clip has turned Red and no longer plays.
A **Red Card** indicates that the software can no longer find the audio file on the disk.
*   **Cause**: You moved, renamed, or deleted the original MP3/WAV file. Or the file was on a USB drive/External Disk that is now disconnected.
*   **Solution**:
    1.  Reconnect the external disk.
    2.  Move the file back to its original location.
    3.  Or, drag the file back into the grid (creating a new card) and delete the old red one.

> **Prevention**: To avoid this problem, use the **Export Package** function (Chap. 7) which copies all files into a safe folder along with the project.

---

## 8.3 MIDI Problems

### My MIDI controller is not working / is not detected.
1.  **Golden Rule of MIDI**: The controller must be connected to the computer **BEFORE** starting Runtime Live Machine Pro.
    *   If you connect it while the software is open, the internal browser might not see it. Close and reopen RRLMP.
2.  **Learn Mode**: Check that you haven't left "MIDI Learn" mode active (Cyan Icon). In this mode, pressing keys serves only to map, not to play.
3.  **Drivers**: Some advanced controllers require specific drivers. Verify that Windows recognizes it correctly.

---

## 8.4 Frequently Asked Questions (FAQ)

**Q: Can I use RRLMP to automate radio 24/7?**
A: No. RRLMP is designed for *Live* directing (shows manned by a person). It has no hourly scheduling or infinite automatic music rotation functions.

**Q: Which audio formats are supported?**
A: It natively supports **MP3, WAV, AAC, OGG, FLAC**. We recommend using WAV for maximum quality or MP3 320kbps to save space.

**Q: Does the software work on iPad or Android?**
A: No, Runtime Live Machine Pro is professional Desktop software for **Windows** and **macOS**. It requires the file management power of a real computer.

**Q: How do I update the software?**
A: At startup, the Welcome Screen will notify you if a new version is available (Yellow/Orange indicator). Visit the official website to download the updated installer. Your saved .lmp projects will be compatible with new versions.

**Q: Where can I find the auto-save files?**
A: If you are working on a saved file, the .bak backup is in the same folder as the project. If you were working on an "Untitled" project and the PC shut down, check the system application data folder (on Windows: %APPDATA%\runtime-live-machine\).
