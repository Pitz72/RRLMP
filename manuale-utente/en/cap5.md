# CHAPTER 5: THE MIXING ENGINE (THE BRAIN)

Runtime Live Machine is not a simple player that plays audio files randomly. Inside it, there is an always-active **Mixing "Brain"**.
The software acts like an invisible virtual sound engineer: it listens to what you are doing and automatically adjusts the volumes of other tracks to ensure that the final result is always clean and intelligible.

You don't have to worry about manually lowering the music when an interview starts: RLM takes care of it.

---

## 5.1 The Audio Hierarchy (The Pyramid)

To understand how it works, imagine the columns as a pyramid of importance. Who is at the top "commands" the volume of who is below.

1.  **LEVEL 1 (Supreme Bosses): VOICES / PRERECORDED** (Orange Column)
    *   They always have absolute priority. No one can lower their volume. When they speak, everyone else quiets down.
2.  **LEVEL 2 (Middle Class): EPISODE SONGS** (Red Column)
    *   They are lowered by Voices. But they command over Assets.
3.  **LEVEL 3 (Background): SHOW ASSETS** (Green Column)
    *   These are the beds and sound carpets. They are silenced by almost everything else.

> **Note**: The **SFX / CARTWALL** column (Gray) is "outside the system". Sound effects always play at maximum volume and overlay everything without influencing or being influenced by others. Applause must be heard loud, even over a voice.

---

## 5.2 Automatic Ducking (Radio Effect)

This is the most used function in radio. "Ducking" is the automatic lowering of music when someone speaks.

*   **How it works**:
    1.  You have a Song or a Bed playing (Volume 100%).
    2.  You launch a clip from the **VOICES** column (e.g., an interview or a voice message).
    3.  The software immediately and smoothly lowers the Song/Bed to a background level (about 20% volume, or -14dB).
    4.  The Voice sounds clear over the music.
    5.  As soon as the Voice clip ends, the music automatically rises back to 100%.

*   **Advantage**: You don't have to use the mouse to lower faders while trying to launch the interview. It's all automatic.

---

## 5.3 Music Dominance (Smart Bed Management)

A classic mistake of rookie directors is playing a song *over* a rhythmic bed, creating sonic chaos (drums against drums). RLM solves this problem with **Music Dominance**.

*   **The Scenario**:
    You have a Bed (Show Asset) looping under the speaker's voice. At some point, you launch a record (Song).
*   **What RLM does**:
    Instead of stopping the bed (which you might need ready after the song), the software brings it to **Volume 0 (Mute)** but keeps it running "ghosted".
*   **The Result**:
    Only the Song is heard. The bed is gone.
*   **The Return**:
    When the Song ends (or you press Stop on the song), the Bed automatically re-emerges fading in.

This allows you to have a continuous flow "Bed -> Song -> Bed" without ever having to click "Play" on the bed a second time.

---

## 5.4 Exceptions: "Stacchi" (Breaks/Overlays)

What happens if you want to play a radio Jingle *over* the bed, without the bed disappearing completely?
Here comes the **Behavior: Stacco** setting (see Chap. 4).

*   If a clip in the Assets column is set to "Normal", it will stop other beds.
*   If it is set as **"Stacco"**, it will overlay the other beds, lowering them slightly, but without stopping them. It is ideal for Station IDs ("You are listening to Runtime Radio...") that need to "ride" the intro of a track or a bed.
