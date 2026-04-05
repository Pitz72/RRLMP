# CHAPTER 4: ADVANCED CLIP EDITING (PROPERTIES)

Every audio file is different: some have long initial silences, others have too low volume, and others need to repeat endlessly.
To access the advanced configuration panel, **Right-Click** on any clip and select **"Edit"**.

A modal window will open divided into two main sections: **Visual & Basic** (Left) and **Behavior & Timing** (Right).

---

## 4.1 Basic Settings (Visual & Audio)

In this section, you control the appearance and raw volume of the clip.

*   **Clip Name**: You can rename the clip as you like (e.g., from 	rack_01_final.mp3 to OPENING THEME). This only changes the label in the software, not the original file name on the disk.
*   **Volume (Gain)**: A slider ranging from 0% to 150%.
    *   If you have a low recording (e.g., a WhatsApp voice message), you can push it beyond 100% to align it with the rest of the show.
*   **Custom Color**: By default, the clip inherits the color of its column (e.g., Green for Assets). Here you can force a different color to make it stand out (e.g., color an important jingle Red in the Gray column).

---

## 4.2 Surgical Precision: Cue Points & Trim

Often audio files are not "ready for air": they have seconds of silence at the start or tails that are too long. Instead of using an external audio editor, you can fix them here. These changes are **non-destructive** (the original file remains intact).

### Manual Controls
*   **Trim Start**: Sets how many seconds to skip at the beginning.
    *   *Example*: If you set 2.5, when you press Play the clip will start instantly from second 2.5, skipping the initial silence ("on beat").
*   **Trim End**: Sets how many seconds to cut from the end.
    *   *Example*: If the song has 20 seconds of useless final applause, increase this value until the "New Duration" satisfies you.

### 🪄 The Magic Wand (Smart Trim / Auto-Detect)
To speed up work, RLM includes a basic artificial intelligence algorithm.
1.  Click the button with the **Magic Wand** icon next to the Trim controls.
2.  The software scans the file in a fraction of a second.
3.  Automatically detects where the real sound begins and ends (above the -40dB threshold).
4.  Automatically fills in the *Start* and *End* fields for you.

> **Tip**: Always use the Magic Wand on voice recordings or interviews to clean them up instantly.

---

## 4.3 Behaviors (Behaviors & Logic)

Here you define the intelligence of the clip: what it should do when it starts and what it should do when it ends.

### Behavior (Overlay Mode)
*   **Normal (Default)**: When you launch this clip, any other clip playing **in the same column** is stopped. This is the standard behavior for songs (one excludes the other).
*   **Stacco** (Break/Overlay): When you launch this clip, it **does NOT stop** other clips in the column, but "silences" them temporarily (or overlays).
    *   *Typical Use*: A sound effect or a vocal jingle you want to play over a music bed located in the same column, without interrupting the bed.

### Next Action (Final Automation)
What happens when the clip ends?
*   **Stop**: The clip ends and stops. (Standard behavior).
*   **Loop**: The clip restarts from the beginning endlessly. Useful for beds and backgrounds. A **[LOOP]** badge will appear on the card.
*   **Play Next**: As soon as this clip starts fading (Fade Out), the software automatically launches the next clip in the column.
    *   *Crossfade*: The transition is smooth, with no gaps of silence. A **[NEXT]** badge will appear on the card.

---

## 4.4 Fades

Each column has defaults (e.g., Music fades in 2 seconds, Jingles are dry), but here you can override them.

*   **Fade In (ms)**: How long it takes for the volume to reach maximum when you press Play. (e.g., 2000ms = 2 seconds of gradual rise).
*   **Fade Out (ms)**: How long it takes to fade out when you press Stop or when the clip ends naturally.
    *   *Note*: A long Fade Out is useful for songs. A Fade Out at 0 is mandatory for dry cuts.

---

## 4.5 Control Assignment (Input)

At the bottom of the panel, you find references for external control:
*   **Trigger Keybind**: Click here and press a key on the keyboard (e.g., "Q") to assign it to this clip.
*   **MIDI Bind**: Shows the assigned MIDI note (e.g., NOTE:60). To modify it, use the "MIDI Learn" mode from the main screen (see Chap. 6).
