# Chapter 4 — The basic workflow: load and play

---

The fundamental operating cycle of Runtime Live Machine Pro breaks down into three phases: importing the audio files, organizing them in the grid, playing them during the live show. This chapter describes each phase with the precision needed to work safely even under pressure.

---

## 4.1 Importing the audio files

RLMP has no internal browser and no centralized library. Importing is done by **drag & drop** directly from the operating system’s file manager (File Explorer on Windows, Finder on macOS, Nautilus or equivalents on Linux). Alternatively, from the FILE menu you can import an **M3U** playlist and turn it into a sequence of clips.

### The basic gesture

1. Open the folder on your computer where the audio files are.
2. Select one or more files. To select several files: `Ctrl+Click` for a discontinuous selection, `Shift+Click` for a continuous one.
3. Drag the selected files over one of the grid columns and drop them. For sound effects, drag them straight onto the pad FX (Chapter 7).

Each file creates a card in the destination column. If you drag several files at once, the cards are created in the order the files appear in the file manager, from top to bottom.

**Insertion indicator.** During the drag, a luminous blue line runs along the column, showing exactly where the cards will be inserted. You can add new clips at the top, at the bottom, or at an intermediate position with precision.

### Supported formats

The bundled FFmpeg engine ensures compatibility with a wide range of audio formats:

| Format | Extension | Notes |
|---|---|---|
| MP3 | `.mp3` | All bitrates |
| WAV | `.wav` | Uncompressed PCM, any bit depth |
| FLAC | `.flac` | Lossless, any sample rate |
| AAC / M4A | `.aac`, `.m4a` | Includes files from iTunes/Apple Music |
| OGG Vorbis | `.ogg` | |
| Opus | `.opus` | |
| WMA | `.wma` | Windows Media Audio |
| WebM / MP4 | `.webm`, `.mp4` | Audio tracks held in these containers |

**A note on performance.** The `media://` streaming protocol ensures that audio files are not loaded into RAM at import time. An uncompressed 2 GB WAV file behaves exactly like a 5 MB MP3: loading is instant and the impact on system memory is negligible. CPU resources are engaged only during active decoding, that is, during playback.

### The file path

RLMP stores the **absolute path** of the file on disk, not a copy of the file itself. If you move, rename or delete the original file, the corresponding card turns red and is no longer playable. To work across several computers or create portable archives, use the **Export project with audio** feature described in Chapter 10.

---

## 4.2 Playback: starting and stopping clips

### Starting a clip

A **left click** on the card is enough to start playback. The feedback is immediate: the card lights up in the green of the active state, the timer switches to a countdown, and the VU meters in the header reflect the output signal.

If a keyboard key has been assigned to the clip (see Chapter 8), that key works as an alternative to the click, handy when you are operating on another part of the interface and don’t want to move the mouse.

### Stopping a clip

**Click the active clip** — the clip enters the **fade out** phase and stops within the time set in its properties (see Chapter 5).

**`Esc` key** — stops all active clips instantly. It is the emergency command. It works when RLMP is the active window, even while you are typing in a text field.

**STOP ALL button** in the header — identical to `Esc`, accessible with the mouse.

### The per-column exclusion logic

In most columns, RLMP applies the **“one clip at a time”** rule: if you are playing *Track A* in the Songs column and click *Track B* in the same column, *Track A* stops (with a fade out) and *Track B* starts. There’s no need to manually stop the current clip before starting another.

The **pad FX effects** are the main exception: they overlap everything, including other effects, and don’t interrupt whatever is playing. A round of applause can start while a song is playing without cutting off its playback.

Clips with the **Stacco** behaviour (configurable in the properties, see Chapter 5) also overlap without stopping the other clips in the column, wherever they are.

---

## 4.3 Organizing the running order

### Reordering clips

While preparing the show, or even while it’s under way, you can rearrange the order of the clips at any time.

**Internal dragging.** Click a card, hold and drag it up or down within the same column. The blue guide line shows the insertion point. The clip slots into its new position without interrupting anything currently playing.

**Moving between columns.** You can drag a clip from one column to another. When you do, the clip **inherits the rules of the destination column**: a pre-recorded voice moved into the Songs column will start being ducked exactly like a music track.

Moving clips between columns changes their behaviour, so use it deliberately, especially during a live show.

### Multiple selection and deletion

To remove several clips from the grid in a single operation:

1. `Ctrl+Click` (Windows/Linux) or `Cmd+Click` (macOS) on each clip to select. The border turns blue.
2. Press `Delete` or `Backspace`. The software asks for confirmation if more than one clip is selected.

Deleting from the grid removes the clips from the current project, not the audio files from disk. If you make a mistake, `Ctrl+Z` undoes the operation.

> **Operational tip.** Once the show is live, emptying the Pre-Show column with a multiple selection and `Delete` is the quickest way to free up visual space in the interface and switch to operating mode.

---

## 4.4 Structure cues: INTRO and OUTRO

Every clip can have two **structural markers** configured in the waveform editor (Chapter 5):

- **Intro Marker** — the point where the track’s main melody actually enters, after the instrumental intro. Useful for knowing exactly when to start talking over the intro.
- **Outro Marker** — the point where the track’s final tail begins. It flags the right moment to prepare the transition to the next track.

When a clip’s playback approaches these points, a visual warning appears on the card:

- **INTRO: −MM:SS** — countdown to the Intro Marker.
- **OUTRO IN: −MM:SS** — countdown to the Outro Marker, followed by **🚨 OUTRO** once the tail has begun.

These warnings appear only if the markers have been configured. On clips without markers, the card shows only the standard countdown to the end of the track.
