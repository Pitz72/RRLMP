#import "../lib/manuale-template.typ": *

= Remote Control

The person presenting isn't always seated at the computer. Sometimes the
host is on the other side of the studio, behind glass, or moving around
with a guest. The #strong[Remote Control] in Runtime Live Machine Pro
lets you drive the show's essential moves from a second device (a
tablet, a phone, a laptop) connected to the same local network, straight
from the browser. Nothing needs to be installed on the remote device.

The feature is currently marked as #strong[Beta].

== 11.1 How it works
When you enable it, RLMP starts a small #strong[local web server] inside
itself. The remote device connects to this server by opening an address
in the browser: from there a control page appears that mirrors the state
of the Music column and lets you act on it.

Everything happens #strong[inside the local network]: the server is
reachable from devices connected to the studio's same Wi-Fi or LAN, and
it doesn't go through the internet.

== 11.2 Activation
+ Open the #strong[Settings] from the Tools menu and go to the
  #emph[General] tab.
+ Turn on the #strong[Remote Control (Beta)] toggle.
+ A #strong[six-digit PIN], the server #strong[port] and the
  #strong[network addresses] the remote device can connect to appear.
+ The #strong[Copy link] button copies the ready-to-use address to the
  clipboard (in the form `http://<computer-address>:8787`).

The server listens on port #strong[8787]. The PIN is #strong[regenerated
on every launch] of the application and is not stored: closing and
reopening RLMP produces a new PIN. Remote Control itself also always
starts off at every launch, to be re-enabled when needed.

If startup fails, typically because port 8787 is already taken (by
another copy of RLMP left open or by another program), the switch turns
back off and a message shows the reason.

== 11.3 Connecting from the remote device
+ On the tablet or phone, open the browser and type the address shown in
  the Settings (or paste it from the copied link).
+ A page with a keypad appears: enter the #strong[six-digit PIN].
+ Once the PIN is correct, the page shows the list of clips in the
  #strong[Music] column, with the playback controls, and a #strong[Stop
  All] button. A dedicated button takes the page full screen, handy on a
  tablet.

From here you can start and stop the tracks in the Music column and, if
needed, stop everything. The state updates in real time: whatever starts
or stops on the main computer is reflected on the remote page, and vice
versa.

== 11.4 What you control remotely
Remote Control is deliberately minimal. From the remote device you can:

- #strong[Start] a clip in the Music column.
- #strong[Stop] a clip in the Music column.
- Perform a #strong[Stop All].

These are the only actions allowed. The rest of the production (the
other columns, the pad FX, the editor, the settings) stays on the main
computer. It's a safety choice: the remote is there to manage the music
flow from a distance, not to replace the production desk.

== 11.5 Security and limits
- #strong[PIN required.] No device can send commands without passing the
  six-digit PIN check.
- #strong[Only from the remote control page.] The server accepts
  connections only from the page it serves itself: a web page from
  another site, opened on a device on the same network, is rejected
  before it can even ask for the PIN.
- #strong[Attempt protection.] PIN entry attempts are rate-limited:
  after several failed attempts in quick succession, access from that
  device is temporarily blocked.
- #strong[Whitelisted commands.] The server accepts only the three
  intended commands (start, stop, Stop All): any other request is
  ignored.
- #strong[Local network only.] The server is meant for the studio
  network. If your Wi-Fi is open or shared, consider carefully who can
  reach it.
- #strong[No persistence.] The PIN and the activation state are not
  saved: at every restart you begin from a clean configuration.

#nota[
As a Beta feature, the set of available commands may
expand in future versions. For now it is tuned to the most frequent use
case: managing the music from a distance during hosting.
]
