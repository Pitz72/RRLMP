# Chapter 13 — Advanced features

---

This chapter gathers the features that sit outside the basic workflow but tend to stick once you find them: the NoteBoard, column colour management, transitions, the general settings, the launch log and the edit history.

---

## 13.1 NoteBoard: the script in the control room

The **NoteBoard** is the note system built into the clips. It lets you attach written text to any clip (operating instructions, running orders, notes on an interview, the full script of a spot) and have it appear automatically on screen the moment that clip starts playing.

### Adding a note

1. Open the clip settings (right-click the card) and go to the *Notes* section.
2. Write the text in the free field. There is no length limit.

Clips with a note show the 📋 badge on the card.

### The panel during the live show

When a clip with notes starts playing, the **NoteBoard panel** appears at the bottom of the screen with the associated text, headed by the clip’s name and colour. The panel stays visible for the whole duration of playback and closes on its own when the clip ends. If several clips with notes play together, the panel shows the one with the highest priority.

### Use cases

- **Spoken production.** Attach to each ident the first lines of the spoken block that follows: when the ident starts, the text is already in front of your eyes.
- **Content to read.** An advertising spot with the full text in the note: as soon as it starts, you read it.
- **Operating instructions.** “Lower the monitor”, “Check the guest’s headphone level”, “Start the recording”.
- **Interviews.** The questions for the guest stay visible for the whole duration of the clip.

---

## 13.2 Column colour customization

The default colours have an established meaning (green for Assets, red for Songs, and so on), but every column is customizable. Click the **coloured dot** in the column header: a palette of **30 colours** opens. Choose one and the column (header, cards, indicators) takes on the new colour immediately. The choice is saved in the project file.

The cards inherit the column’s colour dynamically: at rest they appear in a muted shade, in playback in the full colour. Each project can thus have its own colour identity.

---

## 13.3 Transitions between clips

When a clip is set to *Play Next*, the passage to the next clip in the column happens according to the configured transition mode:

- **Crossfade.** The outgoing clip fades while the incoming one rises, overlapping. Default duration: 2 seconds.
- **Segue.** The outgoing clip fades out while the next one starts immediately at full volume. Default fade duration: 0.8 seconds.
- **Gapless (hard cut).** The outgoing clip stops abruptly and the next starts immediately, with no fade.

You can set a transition at the level of a single clip or leave **Global Default**, which applies the general choice defined in the Settings. The Pre-Show column uses crossfade as its default. All the modes can be tried out without going on air, using the “Test →” button in the editor (Chapter 5).

---

## 13.4 The General Settings window

The **Settings** (Tools menu) gather the software’s global preferences, organized into tabs.

### General

- **Language.** Select the interface language among the eight available. The change is immediate.
- **Remote Control (Beta).** Enables the browser remote and shows PIN, port and addresses (Chapter 11).
- **Broadcast layout.** Shows or hides the grid columns individually. Hiding a column doesn’t delete its clips: they stay in the project. It’s a global preference, valid for all projects.

### Audio & Mix

- **Output device.** The audio destination (Chapter 8).
- **Mixing intelligence.** The amount of ducking (how far the music drops when a voice speaks, default 20%) and its speed (default 500 ms).
- **Transitions.** The default transition mode and the crossfade and segue durations.

### Recording

A summary of the capture point (after the limiter) and the choice of default format proposed at export (Chapter 9).

### Master Chain

- **Volume levelling.** Enables/disables loudness normalization and sets its target (default −16 LUFS).
- **Master Chain.** Enables or bypasses the whole chain, and adjusts the individual stages: HPF frequency, multiband glue style, limiter threshold. A button restores the defaults (Chapter 6).

---

## 13.5 Playout Log

The **Playout Log** (icon in the header) is the chronological launch log: it tracks what went on air and when, up to the last several thousand events. It’s useful for reconstructing a running order after the fact, verifying what was broadcast, or compiling a report of the live show.

---

## 13.6 Undo and Redo

Changes to the running order (additions, moves, deletions) are reversible. `Ctrl+Z` undoes the last operation, `Ctrl+Y` (or `Ctrl+Shift+Z`) redoes it, with a history several dozen steps deep. The same entries are available in the Tools menu. It’s the safety net for operations done in a hurry during preparation.

---

## 13.7 Toast notification system

RLMP doesn’t use blocking windows for routine communications. Non-critical notifications appear as **toasts**: small, unobtrusive banners in a corner of the screen that stay for a few seconds and disappear on their own without interrupting playback. They are used to confirm a save, the end of an export, a MIDI Learn operation, or to warn of missing files.

The **confirmation windows**, needed when an action is irreversible (deleting clips, closing an unsaved project), are instead modal and require a response, but they are designed not to cut off the playback in progress: the audio continues while you decide.
