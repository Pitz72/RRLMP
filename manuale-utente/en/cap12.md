# Chapter 12 — Updates

---

Runtime Live Machine Pro updates itself, but never at your expense. Two rules govern everything: no update may interfere with a live show, and no download starts without your consent. This chapter explains how the software checks for new versions, how it installs them, and why it sometimes behaves differently depending on the operating system.

---

## 12.1 The startup check

Shortly after startup (about three seconds), RLMP silently checks whether a newer version exists. The outcome appears on the welcome screen, next to the version number:

- **“Latest Version”** (green) — you are running the most recent version.
- **“Update Available”** (amber) — a newer version is available. It is a button: click it to open the update window.
- **“OFFLINE”** — the service could not be reached; try again later. The software works normally.

The check is optional and non-blocking: if you’re offline, RLMP starts and works without any trouble.

---

## 12.2 The update window

When an update is available, the dedicated window shows the current version, the new version and the **release notes**: the real list of what’s new in that version (the same changelog as this software), formatted and readable, not a bare list of files. The notes stay visible even once the download is complete, right before installing, so you always know what you’re about to apply. From here you decide:

- **Later** — closes the window without doing anything. You can reopen it whenever you like.
- **Download** — starts downloading the new version. The download **never starts on its own**: it begins only when you press this button. A progress bar shows its progress.
- **Restart and install** — appears when the download is complete: it closes the application and applies the update. If the open project has unsaved changes, RLMP asks what to do before installing, with the same choices as when closing: **Save** (save, then install), **Don’t Save** (install and discard the changes) or **Cancel** (install nothing; the app stays open). If saving fails, the installation doesn’t start. Once past this question, the shutdown is clean and immediate and the software doesn’t stay open behind the installer.

---

## 12.3 The “never during a live show” rule

The automatic check may find an update right while you’re on air. In that case, RLMP **does not interrupt you**: the update window waits and opens on its own only when the live show is over (when you stop everything). The priority is always the show in progress.

There is one exception, and it’s intentional: the **Check for updates now** button, in the *Info* panel (Tools menu), is an explicit action of yours and opens the window immediately, even live. If you press it, it’s because you want to.

---

## 12.4 Platform differences

How the update is installed depends on the operating system.

**Windows and Linux (AppImage).**
The update is fully integrated: you download the new version from the window and the software installs it at the next restart, with no manual steps.

**Linux (.deb package).**
With this format RLMP can’t install the update reliably. Instead of automatic installation, the window notifies you and opens the browser on the download page for the new version: from there you download the package and install it as you would for a fresh install (Chapter 2). Your projects and `.lmp` files stay intact.

**macOS (built from source).**
There is no official package to download: the window reports the new version and opens the project page, but to update you download the updated code and build again (section 2.3).

> **Note.** In all cases, updating RLMP doesn’t entail losing your projects: the `.lmp` files are compatible across versions and require no manual migration.
