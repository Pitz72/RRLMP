# Chapter 1 — Runtime Live Machine Pro: a philosophy

---

*Author’s note*

Fifteen years of open microphones leave a distinct mark on anyone who has lived through them. I have run podcasts, hosted talk shows, kept a web radio on the air, and for much of that time I did everything alone: the running order, the music, the interviews, the levels, the timing. I know what it feels like to realize, live, that the song is about to end while you are still shaping the thought you want to express. I know what it means to pull down a fader with one hand and find the right clip with the other, while the third hand — the one you don’t have — is supposed to hold the thread of what you are saying.

Runtime Live Machine Pro grew out of that frustration, and out of a simple conviction: audio production shouldn’t be a job in its own right. It should be transparent. The presenter, the podcaster, the content creator hosting a late-night talk show alone, with no engineer to lean on, needs to concentrate on what they do best: talking, thinking, holding a rapport with the listener. The software takes care of the rest.

I built into RLMP the rules a good sound director applies automatically: the hierarchy between audio events, the ducking that kicks in when you speak, the music that stops and resumes at the right moment. Complex rules, hidden beneath an interface that asks for a single gesture: clicking the right clip at the right time.

This software is designed above all for people running small and mid-sized talk radio, for anyone producing podcasts with professional ambition, for anyone streaming live without a technical crew around them. That said, it isn’t exclusive by nature: people working in more structured settings will find tools suited to their needs too. The goal is single-minded: to make the presenter independent of the support roles that aren’t always there, and aren’t always needed.

---

Every tool is born from an answer. Runtime Live Machine Pro answers a precise problem: live audio production (radio, podcasts, events, theatre) is a performance activity, not an automation task. It demands instant control, steady nerves and software that won’t betray you at the wrong moment.

The software installed on your computer is not a 24/7 music scheduler, nor a DAW for post-production, nor a simple player with a queue. It is a **real-time broadcast machine**, built around the idea that every show is a one-off, unrepeatable act that deserves a dedicated container and precise control over every transition.

---

## 1.1 Who it was built for

Runtime Live Machine Pro is aimed at two kinds of users who, despite their different contexts, share the same fundamental need.

The **broadcast professional** — the director of a commercial radio station, the engineer of an audio or video live stream, the presenter running their own show — will find in RLMP a system on a par with high-end professional tools, with an operational agility those systems often sacrifice on the altar of complexity.

The **content creator** — the independent podcaster, the web-radio host, the live-event organizer — will find a tool that doesn’t take years of technical training to master, yet makes no compromises on the quality of the result.

Both get an interface that responds to the key instantly, a stable audio engine, and a save system that doesn’t forget.

---

## 1.2 The “Single Show” philosophy

The founding concept of Runtime Live Machine Pro is the **isolated project**. Every show you produce — a podcast episode, a live radio broadcast, a theatre performance — lives in a self-contained `.lmp` file that holds everything: the clip layout, the volumes, the MIDI mappings, the cue points, the production notes. When you load that file, you find the show exactly as you left it.

This approach has concrete consequences. You don’t have to reconfigure the software every time you move from one show to another. You can carry a project to any computer through the Export project with audio feature and know it will work. You can archive past episodes and reopen them months later without surprises.

The `.lmp` file doesn’t contain the physical audio files: it stores their paths on disk. To move a project between computers, the **Export project with audio** feature physically copies everything needed into a self-contained folder.

---

## 1.3 The Main-Side-Heavy architecture

Understanding the internal architecture isn’t essential to using the software, but it helps explain why certain problems common to other players don’t occur here.

Runtime Live Machine Pro is built on **Electron**, a platform that cleanly separates the main process (*Main Process*, in Node.js) from the interface rendering process (*Renderer Process*). This separation is used deliberately.

All the heavy operations — audio decoding via FFmpeg, reading files from disk, analysing waveforms, managing backups — are delegated to the Main Process. The Renderer deals solely with the interface: displaying clips, animating the VU meters, responding to clicks. The result is an interface that stays fluid even during intensive operations, and an audio engine that doesn’t compete for resources with the pixels on screen.

The custom `media://` protocol keeps audio files from ever being loaded entirely into RAM: they stream straight from disk to the player. You can handle uncompressed WAV files hours long without the application’s memory footprint changing appreciably.

---

## 1.4 The broadcast grid: a visual grammar

RLMP’s operating interface is organized into vertical columns, each with a precise semantic role. Before you even launch the software, it’s worth fixing this grammar in mind.

Six columns are visible in the main grid. A seventh surface, the **pad FX** (the effects *jingle machine*), lives outside the grid, in a dedicated panel described in Chapter 7.

| Column | Colour | Function |
|---|---|---|
| **Show Assets** | Green | Idents, beds, structural backing tracks for the show |
| **Jingle** | Amber | Recurring identifying jingles and stingers |
| **Promo** | Cyan | Promos, self-promotion, scheduled announcements |
| **Episode Songs** | Red | The music playlist |
| **Voice / Recordings** | Orange | Interviews, voice messages, spoken segments |
| **Pre-Show** | Purple | Warm-up music before going live, with jingle and promo rotation |

The first three columns (Show Assets, Jingle and Promo) share the same audio nature: they are structural and service elements, treated identically by the mixing engine. The distinction is organizational: keeping idents separate from jingles and promos keeps the running order readable even when it’s crowded.

Each column has distinct audio behaviours — mixing priority, exclusion rules, fade values — detailed in Chapter 6. For now it’s enough to know that a clip’s position in the grid is not decorative: it determines how the software will treat it on air. Columns you don’t need can be hidden from view (Settings → General → Broadcast layout) without losing the clips they contain.

---

## 1.5 Current version and updates

This manual describes version **1.15.10** of Runtime Live Machine Pro. At startup, the software silently checks whether a newer version is available and, if it finds one, opens an update notice, never during a live show. The update system is described in Chapter 12. The `.lmp` project files are compatible with later versions: updating the software doesn’t entail losing or manually migrating existing projects.
