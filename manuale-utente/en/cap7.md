# CHAPTER 7: PROJECT MANAGEMENT AND SECURITY

Configuring a show takes time: loading clips, adjusting volumes, setting trims. Losing this work would be disastrous.
Runtime Live Machine Pro uses a multi-level saving system to ensure your data is always safe.

---

## 7.1 The Project File (.lmp)

All settings for your show (clip positions, colors, volumes, MIDI mapping, fade settings) are saved in a single file with the extension **.lmp** (Live Machine Project).

> **Important**: The .lmp file is a text file (JSON) that contains the "instructions" for the software. **It does NOT contain the physical audio files**. It only stores the *path* where the files are located on your computer (e.g., C:\Music\Intro.mp3).

### Saving Work
In the top command bar, you have two distinct options:

1.  **?? Save (Quick Save)**:
    *   Click the Floppy Disk icon.
    *   Immediately overwrites the currently open .lmp file.
    *   This is the action to perform regularly while working.
2.  **??? Save As**:
    *   Click the Floppy icon with the Pen.
    *   Always opens a dialog box to create a **new file**.
    *   Use it to create different versions of the show (e.g., "Podcast_Ep1.lmp", "Podcast_Ep2.lmp").

### Closing Protection (Unsaved Changes)
The software constantly monitors your actions. If you have made unsaved changes (loaded a clip, changed a volume) and try to close the program, RRLMP will **block the closing** and show you a warning: *"There are unsaved changes"*.
You will never lose work due to an accidental click on the "X".

---

## 7.2 Auto-Backup (The Safety Net)

One doesn't always remember to save. For this reason, RRLMP includes an invisible **Auto-Backup** system working in the background.

*   **Frequency**: Every **5 minutes**, the software automatically saves a backup copy of the current state.
*   **Where does the backup go?**
    *   If you are working on an already saved project (e.g., MyShow.lmp), the software creates a "shadow" file in the same folder called **MyShow.lmp.bak**.
*   **How to recover it**:
    *   If the PC shuts down suddenly or the main file gets corrupted, go to the project folder.
    *   Look for the .bak file.
    *   Rename it by removing the .bak (or open it directly with RRLMP). You will have recovered work up to the last 5 minutes.

---

## 7.3 Collect & Save (Portable Export)

This is the fundamental function for those working on multiple computers or wanting to archive the show.
Since the .lmp file only stores *links* to audio files, if you copy only that file to another PC (or a USB drive), the software will no longer find the music (broken paths).

To move the show, you must use the **Export Package** function.

### How to Create a Portable Package
1.  Click the **?? Export (Box)** icon in the top bar.
2.  The system will ask you to select an empty folder (e.g., on your USB drive).
3.  **The Copy Process**:
    *   The software analyzes the entire project.
    *   Creates a subfolder called udio/ in the destination.
    *   **Physically copies** all original MP3/WAV files into that folder.
    *   Creates a new project.lmp file where all links have been rewritten to point to the local udio/ folder.

### The Result
You will get a folder containing everything needed. You can plug the USB drive into any computer with Runtime Live Machine Pro installed, open the project.lmp file, and everything will work perfectly, regardless of drive letters or original paths.

> **Recommended Use**: Use this function at the end of each show's preparation to create a "Master" to take to the studio or archive as a complete historical backup.
