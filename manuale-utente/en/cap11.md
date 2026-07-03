# Chapter 11 — Remote Control

---

The person presenting isn’t always seated at the computer. Sometimes the host is on the other side of the studio, behind glass, or moving around with a guest. The **Remote Control** in Runtime Live Machine Pro lets you drive the show’s essential moves from a second device (a tablet, a phone, a laptop) connected to the same local network, straight from the browser. Nothing needs to be installed on the remote device.

The feature is currently marked as **Beta**.

---

## 11.1 How it works

When you enable it, RLMP starts a small **local web server** inside itself. The remote device connects to this server by opening an address in the browser: from there a control page appears that mirrors the state of the Music column and lets you act on it.

Everything happens **inside the local network**: the server is reachable from devices connected to the studio’s same Wi-Fi or LAN, and it doesn’t go through the internet.

---

## 11.2 Activation

1. Open the **Settings** from the Tools menu and go to the *General* tab.
2. Turn on the **Remote Control (Beta)** toggle.
3. A **six-digit PIN**, the server **port** and the **network addresses** the remote device can connect to appear.
4. The **Copy link** button copies the ready-to-use address to the clipboard (in the form `http://<computer-address>:8787`).

The server listens on port **8787**. The PIN is **regenerated on every launch** of the application and is not stored: closing and reopening RLMP produces a new PIN. Remote Control itself also always starts off at every launch, to be re-enabled when needed.

---

## 11.3 Connecting from the remote device

1. On the tablet or phone, open the browser and type the address shown in the Settings (or paste it from the copied link).
2. A page with a keypad appears: enter the **six-digit PIN**.
3. Once the PIN is correct, the page shows the list of clips in the **Music** column, with the playback controls, and a **Stop All** button. A dedicated button takes the page full screen, handy on a tablet.

From here you can start and stop the tracks in the Music column and, if needed, stop everything. The state updates in real time: whatever starts or stops on the main computer is reflected on the remote page, and vice versa.

---

## 11.4 What you control remotely

Remote Control is deliberately minimal. From the remote device you can:

- **Start** a clip in the Music column.
- **Stop** a clip in the Music column.
- Perform a **Stop All**.

These are the only actions allowed. The rest of the production (the other columns, the pad FX, the editor, the settings) stays on the main computer. It’s a safety choice: the remote is there to manage the music flow from a distance, not to replace the production desk.

---

## 11.5 Security and limits

- **PIN required.** No device can send commands without passing the six-digit PIN check.
- **Attempt protection.** PIN entry attempts are rate-limited: after several failed attempts in quick succession, access from that device is temporarily blocked.
- **Whitelisted commands.** The server accepts only the three intended commands (start, stop, Stop All): any other request is ignored.
- **Local network only.** The server is meant for the studio network. If your Wi-Fi is open or shared, consider carefully who can reach it.
- **No persistence.** The PIN and the activation state are not saved: at every restart you begin from a clean configuration.

> **Note.** As a Beta feature, the set of available commands may expand in future versions. For now it is tuned to the most frequent use case: managing the music from a distance during hosting.
