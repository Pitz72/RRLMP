#import "../lib/manuale-template.typ": *

= Project management and data safety

Preparing a show takes time: selecting the files, organizing them in the
columns, configuring the volumes, setting the fades, assigning the keys.
That work is an operational asset that must survive any mishap: a system
crash, a move to another computer, the return to an episode archived
months earlier.

RLMP addresses data safety on several levels, each designed to cover a
specific risk.

== 10.1 The project file (.lmp)
<the-project-file-.lmp>
The entire state of a show (the layout of clips in the columns, the
custom names, the volumes and fades, the editor cue points, the
NoteBoard notes, the MIDI and keyboard mappings, the column colours) is
saved in a file with the #strong[`.lmp`] extension (Live Machine
Project).

The format is JSON: a structured text file, readable by any editor,
non-proprietary. If RLMP were one day unavailable, the project data
would remain accessible.

#strong[What the `.lmp` file contains:] all the settings listed above,
including the absolute paths to the referenced audio files.

#strong[What it doesn't contain:] the audio files themselves. The `.lmp`
stores where the files are on disk, it doesn't copy their content. A
project file is typically in the order of kilobytes, regardless of how
many or how large the audio files it references are.

On opening, RLMP validates the file: it rebuilds any duplicate
identifiers, brings out-of-range values back within sane limits, and, if
you open a project created with an earlier version, automatically adds
the columns introduced in the meantime (Jingle, Promo) without touching
the existing data.

== 10.2 Saving
=== Quick save
The #emph[Save Project] entry in the FILE menu performs an immediate
save to the open `.lmp` file. The save is silent: no dialog box. The
entry turns yellow when there are unsaved changes, a visual reminder at
a glance. Use it often while preparing the show.

The save is #strong[atomic]: the file is first written to a temporary
copy and then renamed on the fly. If the computer shuts down during the
write, the original `.lmp` is never left half-written.

=== Save As
The #emph[Save As…] entry always opens the dialog box, even if the
project already has a name. Use it to:

- Create progressive versions of the same show (`Ep47_draft.lmp`,
  `Ep47_v2.lmp`, `Ep47_final.lmp`).
- Save a variant with different configurations.
- Create a new file without overwriting the current one.

=== Protection on close
RLMP continuously monitors the state of changes. If you try to close the
software (or open a new project) with unsaved changes, the operation is
suspended and a confirmation request appears with three choices: save,
discard the changes, or cancel. It is not possible to lose work through
an accidental click on the window close.

== 10.3 Auto-Backup and autosave
Beyond the saves you decide on, the software maintains an automatic
safety net.

#strong[Project backup copy.] Every time an already-saved project is
updated in the background, RLMP keeps a `.bak` copy alongside the `.lmp`
with the last valid state.

#strong[Rotating autosave.] In parallel, RLMP writes snapshots of the
current state to a dedicated application folder, `autosaves`, with a
name based on date and time. The #strong[ten most recent snapshots] are
kept: the oldest are deleted as new ones are made. This net also
captures work on an "untitled" project that was never saved to disk.

The `autosaves` folder is in the application data directory:

- #strong[Windows:] `%APPDATA%\runtime-live-machine-pro\autosaves\`
- #strong[macOS:]
  `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- #strong[Linux:] `~/.config/runtime-live-machine-pro/autosaves/`

#strong[How to recover.] If the main `.lmp` file has become corrupted or
the computer shut down unexpectedly, open the `autosaves` folder, find
the snapshot with the date and time closest to the moment of the
interruption, and load it in RLMP like a normal project file.
Alternatively, rename the `.bak` file next to the project to `.lmp` and
open it.

== 10.4 Export project with audio
Because the `.lmp` file contains only the paths to the audio files, not
the files themselves, a project is fragile: if you move, rename or
delete even a single one of the source files, the corresponding clip
turns red. The #strong[Export project with audio] feature, in the FILE
menu (right below #emph[Save As…]), solves the problem at the root by
consolidating all the audio inside the project.

=== How it works
RLMP analyses all the audio-file paths in the project, creates an
`audio/` subfolder next to the `.lmp` file, and #strong[physically
copies] every referenced file into it. Files already present and
identical are not re-copied; any name duplicates are renamed so they
don't overwrite each other, and orphan files (no longer referenced) are
removed from the folder.

The difference from a simple backup is what happens #strong[after] the
copy: RLMP #strong[repoints every clip to the new copy] inside `audio/`
and #strong[re-saves the project]. From that moment on, the `audio/`
folder is not a spare archive sitting next to the project, but the
source the session actually reads its audio from.

=== The result: you can delete the originals
Because the project now points to the copies in `audio/`, #strong[the
audio files in their original location are no longer needed] and you can
safely delete them: the show keeps working by reading from the archive.
This is the difference from earlier versions, where the `audio/` folder
stayed an orphan duplicate and deleting the originals broke the clips.

The project folder thus becomes self-contained: the `.lmp` plus the
`audio/` subfolder, everything needed to run the show, ready to archive,
copy, or carry to another computer with RLMP installed.

A few useful details:

- The operation is #strong[repeatable]: if you add new clips and export
  again, RLMP copies only the new files and realigns the project,
  without duplicating the ones already archived.
- RLMP #strong[only deletes files inside `audio/` folders it created
  itself]: the first export leaves a small text file, `.rrlmp-archive`,
  in the folder to mark it as an archive. If an `audio/` folder of your
  own already sits next to the project (or one created by versions up to
  1.15.16), RLMP removes nothing: it tells you how many files are not
  part of the project and marks the folder, which it will manage
  normally from the next export. Move elsewhere anything you want to
  keep. If you delete `.rrlmp-archive`, RLMP stops treating the folder
  as its own.
- Repointing to the archive #strong[does not enter the Undo/Redo
  history]: an #emph[Undo] would send the clips back to the originals,
  which you may already have deleted.
- The project folder (`.lmp` + `audio/`) can be #strong[moved, renamed,
  zipped and taken to another computer]: on opening, any file that isn't
  found at its old location is automatically searched for in the
  `audio/` folder next to the `.lmp` and relinked by itself. The project
  is marked as #emph[modified]: the next save consolidates the new
  paths.

#suggerimento[
Use #emph[Export project with audio] at
the end of preparing each show to consolidate the audio inside the
project. You'll have a compact, portable "master", and you can free up
space by deleting the scattered files you imported from.
]

=== Integrity check on opening
Every time you open a `.lmp` file, RLMP runs an automatic
#strong[integrity check]: it verifies that each referenced audio file is
reachable. Missing files are flagged with a red border and the MISSING
FILE label on the corresponding card. The rest of the project --- all
the clips with reachable files --- stays fully functional.
