# CHAPTER 3: AUDIO MANAGEMENT (BASIC WORKFLOW)

Now that you know the interface, it's time to "load the machine".
In this chapter, you will learn how to import audio files, control playback, and keep your playlist organized.

---

## 3.1 Importing (Drag & Drop)

Runtime Live Machine does not use complex "File > Import" menus. It is designed to work directly with your computer's folders.

### How to load files
1.  Open the folder on your computer (File Explorer on Windows or Finder on Mac) where you keep your audio files.
2.  Click on the desired file and, holding it, **drag** it into one of the 5 software columns.
3.  Release the mouse.

The clip will instantly appear as a new Card.

### Import Details
*   **Multiple Loading**: You can select 10, 20, or 50 files simultaneously from your folder and drag them all together. The software will create a card for each of them in sequence.
*   **Supported Formats**: Thanks to the native engine, RLM supports almost all standard audio formats: **MP3, WAV, AAC (m4a), OGG, FLAC**.
*   **Performance**: It doesn't matter if you load a 2-second jingle or a 2-hour DJ Set in uncompressed WAV format. Loading is **instant** and does not consume the computer's RAM, thanks to *Direct Disk Streaming* technology.

> **Note**: The software stores the "path" of the file (e.g., C:\Music\Song.mp3). If you move or rename the original file on your computer, RLM will no longer be able to find it (the card will turn red/inactive). To avoid this issue if you change PCs, use the "Export Package" function (see Chap. 7).

---

## 3.2 Playback (Play & Stop)

The playback system is optimized to avoid errors on air.

### Starting a Clip (Play)
*   **Left Click**: Click once on a card to start it.
*   **Feedback**: The card border becomes **Bright Green**, the "Play" icon pulses, and the timer starts counting down.
*   **Spacebar**: If you assigned a custom key to the clip (see Chap. 6), you can press it to start it without using the mouse.

### Stopping a Clip (Stop / Fade)
*   **Click on Active Clip**: If you click on a clip that is already playing, it will stop.
    *   *Standard Behavior*: The clip performs a quick **Fade Out** (fading) instead of cutting off abruptly, for a more professional effect. (Fade times are customizable, see Chap. 4).
*   **Stop All**: To stop everything immediately (without fades), press the **Spacebar** (if configured), the **ESC** key, or the red **STOP ALL** button at the top.

### The Column Rule (Exclusion)
In radio directing, you usually don't want two songs playing simultaneously on top of each other.
*   **Rule**: If *Song A* is playing in the "SONGS" column and you click on *Song B* (in the same column), *Song A* automatically stops (fading out) and *Song B* starts.
*   **Exception**: This rule does not apply to the "SFX" column or clips set as "Break" (Stacco), which can play over others.

---

## 3.3 Playlist Organization

During a show, needs change. RLM allows you to rearrange the grid on the fly.

### Moving Clips (Reordering)
Loaded the playlist but decide to change the song order?
*   Click on a clip and, holding it, **drag** it up or down. A guideline will show you where it will land.
*   **Moving between Columns**: You can drag a clip from one column to another (e.g., from "Pre-Show" to the "Music" column).
    *   *Warning*: When you move a clip, it **inherits the rules of the new column**. If you move a jingle into the Music column, it will start behaving like a song (it will undergo ducking from voices, etc.).

### Multiple Selection and Deletion
To clean up quickly:
1.  **Single Selection**: Ctrl + Click (Windows) or Cmd + Click (Mac) on a clip selects it (Blue border) without playing it.
2.  **Multiple Selection**: Hold Ctrl and click on different clips to highlight them all.
3.  **Deletion**: Press the DEL (or Backspace) key on the keyboard.
    *   The software will ask for confirmation if you are deleting many clips, to avoid accidental errors.

> **Pro Tip**: Use multiple selection to quickly empty the "Pre-Show" column once the actual live broadcast has started, to have a cleaner interface.
