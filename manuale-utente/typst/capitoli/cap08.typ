#import "../lib/manuale-template.typ": *

= Hardware, keyboard and MIDI

Runtime Live Machine Pro is designed to integrate with the hardware
already in the studio without requiring elaborate configurations. This
chapter describes how to route the audio output, how to use the computer
keyboard as a controller, and how to connect physical MIDI devices for
tactile control of the production.

== 8.1 Audio routing
=== Selecting the output device
By default, RLMP outputs to the operating system's default audio device.
In a professional or semi-professional setting, with USB mixers,
external sound cards or multitrack systems, it's useful to select the
signal destination explicitly.

+ Open the #strong[Settings] from the Tools menu.
+ On the #emph[Audio & Mix] tab, open the output-device menu: you'll
  find the list of audio devices available on the system.
+ Select the device you want.

If the chosen device is unplugged, RLMP falls back automatically to the
system default; the app monitors connections and reacts to the insertion
or removal of USB devices.

=== USB mixers and multichannel setups
USB mixers such as the Rødecaster Pro, the RØDECaster Duo or the
Focusrite Scarlett typically expose several USB channels to the
operating system (Main Mix, Sounds/Chat, Monitor, and so on). RLMP
appears as a single stereo source; the choice of which USB channel to
route it to is in your hands.

#strong[Recommended setup with a USB mixer.] Assign RLMP to a secondary
channel of the mixer (e.g.~"Sounds" on the Rødecaster Pro) rather than
to the main channel. This way you control RLMP's volume with a dedicated
physical fader, keep it separate from the physical microphone signal,
and apply any hardware processing to that channel only.

=== Latency and buffer
RLMP uses the operating system's native audio APIs. The output latency
is determined by the audio device's buffer, not by the software. With
professional sound cards the latency is in the order of a few
milliseconds, imperceptible in a playout context.

If you notice audio artefacts (crackles, dropouts), the device's buffer
value is probably too low. Raise it from the sound card's control panel
(not from RLMP, which doesn't manage the driver directly): a buffer of
256 or 512 samples is the ideal balance between latency and stability.

== 8.2 Keyboard control
The computer keyboard is the fastest controller available on air: it
works in the dark and is always within reach. RLMP provides a set of
global shortcuts and lets you assign keys to individual clips.

=== Global shortcuts
#figure(
  align(center)[#table(
    columns: (50%, 50%),
    align: (auto,auto,),
    table.header([Key], [Action],),
    table.hline(),
    [#strong[Esc]], [STOP ALL --- stops all active clips],
    [#strong[Delete / Backspace]], [Delete the selected clips],
    [#strong[Ctrl+Z]], [Undo the last change to the running order],
    [#strong[Ctrl+Y] (or #strong[Ctrl+Shift+Z])], [Redo the undone
    change],
    [#strong[Ctrl+Shift+D]], [Show/hide the Debug Overlay],
    [#strong[Ctrl+Shift+M]], [Open the MIDI simulator (for testing
    without a controller)],
    [#strong[F1, F2, F3…]], [Launch the matching column, counting the
    visible columns from the left],
  )]
  , kind: table
  )

`Esc` acts as STOP ALL when RLMP is the active window, even while the
cursor is in a text field. It is no longer a shortcut registered at the
operating-system level: if the app is in the background, bring the
window to the foreground first.

The other shortcuts are suspended while a window is open (Settings, the
clip editor and the like), so `Ctrl+Z` or `Delete` don't touch the
running order while you work elsewhere. With a window open, `Esc` closes
it without stopping the live show.

=== Function keys: one column per key
The #strong[F1], #strong[F2], #strong[F3]… keys launch the first
available clip of the columns #strong[visible] in the grid, in the order
you see them from left to right. With the default layout: F1 Show Assets
· F2 Jingle · F3 Promo · F4 Episode Songs · F5 Voice · F6 Pre-Show. If
you hide a column from the Settings (Chapter 13), the keys shift
accordingly: F1 is always the first column you see. If you have assigned
a function key to a specific clip, that assignment takes precedence.

#attenzione[
F1 normally launches Show Assets, and a clip from that
column launched by hand stops everything on air except the pad FX
effects, exactly like clicking the same clip.
]

=== Custom keys per clip
In addition to the global shortcuts, every clip can have a dedicated
key. The corresponding badge appears on the card.

#strong[To assign a key:] 1. Open the clip settings (right-click the
card) or the #strong[Keybinds] window from the Tools menu. 2. Click in
the key field. 3. Press the key you want.

#strong[Available keys.] Almost any key: letters (A--Z), numbers (0--9),
numeric keypad, spacebar, unused function keys. If the key is already
assigned to another clip, the software reports the conflict before
overwriting, so you don't create invisible duplicates.

#strong[Safety while typing.] Custom keys are disabled automatically
when you're in text-entry mode (renaming a clip or writing a note). This
prevents accidental launches while you type.

== 8.3 MIDI controllers
MIDI is the professional choice when you want physical, reliable control
under your fingers. RLMP supports USB-MIDI controllers: keyboards, pads
(e.g.~Novation Launchpad), fader controllers (e.g.~Korg nanoKONTROL2),
hybrid control surfaces.

=== Connecting
Connect the USB controller to the computer and start RLMP. The software
detects devices through the system's Web MIDI API and recognizes the
connection and disconnection of a controller in real time. Most USB-MIDI
controllers are #emph[class-compliant] and need no driver; for
professional surfaces with proprietary drivers, install the driver
before connecting the device.

=== MIDI Learn
RLMP doesn't require you to know MIDI note numbering or to configure
messages by hand. Learning is done through #strong[MIDI Learn] mode,
from the Tools menu (or from the Keybinds window).

#strong[To map a clip to a key/pad:] 1. Enable MIDI Learn. The cards
enter a waiting state. 2. Select the clip (or the pad FX cell) to map.
\3. Play the note, press the pad or the key on the controller. The `M`
badge with the note number appears on the card.

#strong[To map the global functions:] - Select #strong[STOP ALL] and
press a key on the controller: that key will perform the Stop All. -
Select the #strong[Master Volume] and move a fader or a knob: that
control will manage the master volume continuously.

When finished, disable MIDI Learn to return to operating mode.

=== Supported message types
#strong[Note On] --- messages generated by buttons, pads and keys. Ideal
for launching clips and global actions; RLMP responds to the key press
and recognizes all MIDI channels. Note Off messages are ignored.

#strong[Control Change (CC)] --- messages generated by faders and
potentiometers, with a continuous value from 0 to 127. Ideal for the
Master Volume: a physical fader mapped to the master offers the most
natural control of the output level.

=== Portability of the mappings
The MIDI mappings of the #strong[clips] are saved in the `.lmp` project
file: carry the project to another computer with the same controller and
they will work without reconfiguration. The mappings of the
#strong[global functions] (Stop All, Master Volume) are instead tied to
the computer, saved in the application's local preferences, and remain
valid for all projects on that machine.
