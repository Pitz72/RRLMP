# KAPITEL 3: AUDIO-MANAGEMENT (BASIS-WORKFLOW)

Jetzt, da Sie die Oberfläche kennen, ist es Zeit, die "Maschine zu laden".
In diesem Kapitel lernen Sie, wie Sie Audiodateien importieren, die Wiedergabe steuern und Ihre Playlist geordnet halten.

---

## 3.1 Import (Drag & Drop)

Runtime Live Machine Pro verwendet keine komplexen "Datei > Importieren"-Menüs. Es ist so konzipiert, dass es direkt mit den Ordnern Ihres Computers arbeitet.

### Wie man Dateien lädt
1.  Öffnen Sie den Ordner auf Ihrem Computer (Datei-Explorer unter Windows oder Finder auf dem Mac), in dem Sie Ihre Audiodateien aufbewahren.
2.  Klicken Sie auf die gewünschte Datei und **ziehen** Sie sie mit gedrückter Maustaste in eine der 5 Software-Spalten.
3.  Lassen Sie die Maus los.

Der Clip erscheint sofort als neue Karte.

### Import-Details
*   **Mehrfach-Laden**: Sie können 10, 20 oder 50 Dateien gleichzeitig aus Ihrem Ordner auswählen und alle zusammen ziehen. Die Software erstellt für jede nacheinander eine Karte.
*   **Unterstützte Formate**: Dank der nativen Engine unterstützt RRLMP fast alle Standard-Audioformate: **MP3, WAV, AAC (m4a), OGG, FLAC**.
*   **Performance**: Es spielt keine Rolle, ob Sie einen 2-Sekunden-Jingle oder ein 2-Stunden-DJ-Set im unkomprimierten WAV-Format laden. Das Laden erfolgt **sofort** und verbraucht keinen RAM des Computers, dank der *Direct Disk Streaming*-Technologie.

> **Hinweis**: Die Software speichert den "Pfad" der Datei (z. B. C:\Musik\Song.mp3). Wenn Sie die Originaldatei auf Ihrem Computer verschieben oder umbenennen, kann RRLMP sie nicht mehr finden (die Karte wird rot/inaktiv). Um dieses Problem beim Wechsel des PCs zu vermeiden, verwenden Sie die Funktion "Export Package" (siehe Kap. 7).

---

## 3.2 Wiedergabe (Play & Stop)

Das Wiedergabesystem ist optimiert, um Fehler auf Sendung zu vermeiden.

### Einen Clip starten (Play)
*   **Linksklick**: Klicken Sie einmal auf eine Karte, um sie zu starten.
*   **Feedback**: Der Rand der Karte wird **Hellgrün**, das "Play"-Symbol pulsiert und der Timer beginnt herunterzuzählen.
*   **Leertaste**: Wenn Sie dem Clip eine benutzerdefinierte Taste zugewiesen haben (siehe Kap. 6), können Sie diese drücken, um ihn ohne Maus zu starten.

### Einen Clip stoppen (Stop / Fade)
*   **Klick auf aktiven Clip**: Wenn Sie auf einen Clip klicken, der bereits spielt, stoppt er.
    *   *Standardverhalten*: Der Clip führt ein schnelles **Fade Out** (Ausblenden) durch, anstatt abrupt abzubrechen, für einen professionelleren Effekt. (Fade-Zeiten sind anpassbar, siehe Kap. 4).
*   **Stop All**: Um alles sofort zu stoppen (ohne Fades), drücken Sie die **Leertaste** (falls konfiguriert), die **ESC**-Taste oder den roten **STOP ALL**-Knopf oben.

### Die Spaltenregel (Ausschluss)
In einer Radioregie möchten Sie normalerweise nicht, dass zwei Songs gleichzeitig übereinander spielen.
*   **Regel**: Wenn in der Spalte "SONGS" *Song A* spielt und Sie auf *Song B* (in derselben Spalte) klicken, stoppt *Song A* automatisch (blendet aus) und *Song B* startet.
*   **Ausnahme**: Diese Regel gilt nicht für die Spalte "SFX" oder für Clips, die als "Unterbrechung" (Stacco) eingestellt sind, da diese über anderen spielen können.

---

## 3.3 Organisation der Playlist

Während einer Show ändern sich die Bedürfnisse. RRLMP ermöglicht es Ihnen, das Raster spontan neu zu organisieren.

### Clips verschieben (Reordering)
Playlist geladen, aber Sie entscheiden sich, die Reihenfolge der Songs zu ändern?
*   Klicken Sie auf einen Clip und **ziehen** Sie ihn mit gedrückter Maustaste nach oben oder unten. Eine Hilfslinie zeigt Ihnen, wo er landen wird.
*   **Verschieben zwischen Spalten**: Sie können einen Clip von einer Spalte in eine andere ziehen (z. B. von "Pre-Show" in die Spalte "Musik").
    *   *Achtung*: Wenn Sie einen Clip verschieben, **erbt er die Regeln der neuen Spalte**. Wenn Sie einen Jingle in die Musik-Spalte verschieben, beginnt er sich wie ein Song zu verhalten (er wird durch Stimmen geduckt usw.).

### Mehrfachauswahl und Löschen
Um schnell aufzuräumen:
1.  **Einzelauswahl**: Strg + Klick (Windows) oder Cmd + Klick (Mac) auf einen Clip wählt ihn aus (blauer Rand), ohne ihn abzuspielen.
2.  **Mehrfachauswahl**: Halten Sie Strg gedrückt und klicken Sie auf verschiedene Clips, um alle hervorzuheben.
3.  **Löschen**: Drücken Sie die ENTF-Taste (oder Del / Backspace) auf der Tastatur.
    *   Die Software wird Sie um Bestätigung bitten, wenn Sie viele Clips löschen, um versehentliche Fehler zu vermeiden.

> **Profi-Tipp**: Verwenden Sie die Mehrfachauswahl, um die Spalte "Pre-Show" schnell zu leeren, sobald die eigentliche Live-Sendung begonnen hat, um eine sauberere Oberfläche zu haben.
