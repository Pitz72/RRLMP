# Chapter 10 — Project management and data safety

---

Preparing a show takes time: selecting the files, organizing them in the columns, configuring the volumes, setting the fades, assigning the keys. That work is an operational asset that must survive any mishap: a system crash, a move to another computer, the return to an episode archived months earlier.

RLMP addresses data safety on several levels, each designed to cover a specific risk.

---

## 10.1 The project file (.lmp)

The entire state of a show (the layout of clips in the columns, the custom names, the volumes and fades, the editor cue points, the NoteBoard notes, the MIDI and keyboard mappings, the column colours) is saved in a file with the **`.lmp`** extension (Live Machine Project).

The format is JSON: a structured text file, readable by any editor, non-proprietary. If RLMP were one day unavailable, the project data would remain accessible.

**What the `.lmp` file contains:** all the settings listed above, including the absolute paths to the referenced audio files.

**What it doesn’t contain:** the audio files themselves. The `.lmp` stores where the files are on disk, it doesn’t copy their content. A project file is typically in the order of kilobytes, regardless of how many or how large the audio files it references are.

On opening, RLMP validates the file: it rebuilds any duplicate identifiers, brings out-of-range values back within sane limits, and, if you open a project created with an earlier version, automatically adds the columns introduced in the meantime (Jingle, Promo) without touching the existing data.

---

## 10.2 Saving

### Quick save

The *Save Project* entry in the FILE menu performs an immediate save to the open `.lmp` file. The save is silent: no dialog box. The entry turns yellow when there are unsaved changes, a visual reminder at a glance. Use it often while preparing the show.

The save is **atomic**: the file is first written to a temporary copy and then renamed on the fly. If the computer shuts down during the write, the original `.lmp` is never left half-written.

### Save As

The *Save As…* entry always opens the dialog box, even if the project already has a name. Use it to:

- Create progressive versions of the same show (`Ep47_draft.lmp`, `Ep47_v2.lmp`, `Ep47_final.lmp`).
- Save a variant with different configurations.
- Create a new file without overwriting the current one.

### Protection on close

RLMP continuously monitors the state of changes. If you try to close the software (or open a new project) with unsaved changes, the operation is suspended and a confirmation request appears with three choices: save, discard the changes, or cancel. It is not possible to lose work through an accidental click on the window close.

---

## 10.3 Auto-Backup and autosave

Beyond the saves you decide on, the software maintains an automatic safety net.

**Project backup copy.** Every time an already-saved project is updated in the background, RLMP keeps a `.bak` copy alongside the `.lmp` with the last valid state.

**Rotating autosave.** In parallel, RLMP writes snapshots of the current state to a dedicated application folder, `autosaves`, with a name based on date and time. The **ten most recent snapshots** are kept: the oldest are deleted as new ones are made. This net also captures work on an “untitled” project that was never saved to disk.

The `autosaves` folder is in the application data directory:

- **Windows:** `%APPDATA%\runtime-live-machine-pro\autosaves\`
- **macOS:** `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- **Linux:** `~/.config/runtime-live-machine-pro/autosaves/`

**How to recover.** If the main `.lmp` file has become corrupted or the computer shut down unexpectedly, open the `autosaves` folder, find the snapshot with the date and time closest to the moment of the interruption, and load it in RLMP like a normal project file. Alternatively, rename the `.bak` file next to the project to `.lmp` and open it.

---

## 10.4 Export Package: complete portability

Because the `.lmp` file contains only the paths to the audio files, not the files themselves, carrying the project to another computer takes care: if the destination machine doesn’t have the files at the same absolute paths, the clips turn red. The **Export Self-Contained Archive** feature (Export Package), in the FILE menu, solves this at the root.

### How it works

RLMP analyses all the audio-file paths in the project, creates an `audio/` subfolder, and **physically copies** every referenced file into it. Files already present and identical are not re-copied; any name duplicates are renamed so they don’t overwrite each other, and orphan files (no longer referenced) are removed from the folder.

The operation has two modes:

- **Next to the project** — if you export to the folder where the `.lmp` already lives, RLMP synchronizes the `audio/` subfolder next to it.
- **Free folder** — if you choose a new folder (a USB stick, a NAS), RLMP writes a `project.lmp` there with the paths already updated to point to the local `audio/` subfolder.

### The result

The destination folder becomes self-contained: it holds everything needed to run the show on any computer with RLMP installed, regardless of that machine’s folder structure.

> **Recommended practice.** Use Export Self-Contained Archive at the end of preparing each show to create a “master” to take into the studio or to archive. In case of last-minute technical trouble, you’ll always have a complete, portable copy ready.

### Integrity check on opening

Every time you open a `.lmp` file, RLMP runs an automatic **integrity check**: it verifies that each referenced audio file is reachable. Missing files are flagged with a red border and the MISSING FILE label on the corresponding card. The rest of the project — all the clips with reachable files — stays fully functional.
