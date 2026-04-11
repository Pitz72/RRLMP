# KAPITEL 7: PROJEKTMANAGEMENT UND SICHERHEIT

Eine Show zu konfigurieren braucht Zeit: Clips laden, Lautstärken anpassen, Trims einstellen. Diese Arbeit zu verlieren, wäre katastrophal.
Runtime Live Machine Pro verwendet ein mehrstufiges Speichersystem, um sicherzustellen, dass Ihre Daten immer sicher sind.

---

## 7.1 Die Projektdatei (.lmp)

Alle Einstellungen Ihrer Show (Clippositionen, Farben, Lautstärken, MIDI-Zuweisungen, Fade-Einstellungen) werden in einer einzigen Datei mit der Erweiterung **.lmp** (Live Machine Project) gespeichert.

> **Wichtig**: Die .lmp-Datei ist eine Textdatei (JSON), die die "Anweisungen" für die Software enthält. **Sie enthält NICHT die physischen Audiodateien**. Sie speichert nur den *Pfad*, wo sich die Dateien auf Ihrem Computer befinden (z. B. C:\Musik\Intro.mp3).

### Arbeit speichern
In der oberen Befehlsleiste haben Sie zwei verschiedene Optionen:

1.  **?? Speichern (Quick Save)**:
    *   Klicken Sie auf das Disketten-Symbol.
    *   Überschreibt sofort die aktuell geöffnete .lmp-Datei.
    *   Dies ist die Aktion, die Sie während der Arbeit regelmäßig ausführen sollten.
2.  **??? Speichern unter (Save As)**:
    *   Klicken Sie auf das Disketten-Symbol mit dem Stift.
    *   Öffnet immer ein Dialogfeld, um eine **neue Datei** zu erstellen.
    *   Verwenden Sie dies, um verschiedene Versionen der Show zu erstellen (z. B. "Podcast_Ep1.lmp", "Podcast_Ep2.lmp").

### Schließschutz (Ungespeicherte Änderungen)
Die Software überwacht ständig Ihre Aktionen. Wenn Sie ungespeicherte Änderungen vorgenommen haben (einen Clip geladen, eine Lautstärke geändert) und versuchen, das Programm zu schließen, **blockiert RRLMP das Schließen** und zeigt Ihnen eine Warnung an: *"Es gibt ungespeicherte Änderungen"*.
Sie werden Ihre Arbeit nie durch einen versehentlichen Klick auf das "X" verlieren.

---

## 7.2 Auto-Backup (Das Sicherheitsnetz)

Man denkt nicht immer daran zu speichern. Aus diesem Grund enthält RRLMP ein unsichtbares **Auto-Backup**-System, das im Hintergrund arbeitet.

*   **Häufigkeit**: Alle **5 Minuten** speichert die Software automatisch eine Sicherheitskopie des aktuellen Zustands.
*   **Wo landet das Backup?**
    *   Wenn Sie an einem bereits gespeicherten Projekt arbeiten (z. B. MeineShow.lmp), erstellt die Software eine "Schatten"-Datei im selben Ordner namens **MeineShow.lmp.bak**.
*   **Wie man es wiederherstellt**:
    *   Wenn der PC plötzlich herunterfährt oder die Hauptdatei beschädigt wird, gehen Sie in den Projektordner.
    *   Suchen Sie die .bak-Datei.
    *   Benennen Sie sie um, indem Sie das .bak entfernen (oder öffnen Sie sie direkt mit RRLMP). Sie haben die Arbeit bis zu den letzten 5 Minuten wiederhergestellt.

---

## 7.3 Collect & Save (Tragbarer Export)

Dies ist die grundlegende Funktion für diejenigen, die an mehreren Computern arbeiten oder die Show archivieren möchten.
Da die .lmp-Datei nur *Verknüpfungen* zu den Audiodateien speichert, findet die Software die Musik nicht mehr (unterbrochene Pfade), wenn Sie nur diese Datei auf einen anderen PC (oder einen USB-Stick) kopieren.

Um die Show zu verschieben, müssen Sie die Funktion **Export Package** verwenden.

### Wie man ein tragbares Paket erstellt
1.  Klicken Sie auf das Symbol **?? Export (Kiste)** in der oberen Leiste.
2.  Das System fordert Sie auf, einen leeren Ordner auszuwählen (z. B. auf Ihrem USB-Stick).
3.  **Der Kopiervorgang**:
    *   Die Software analysiert das gesamte Projekt.
    *   Erstellt einen Unterordner namens udio/ am Zielort.
    *   **Kopiert physisch** alle originalen MP3/WAV-Dateien in diesen Ordner.
    *   Erstellt eine neue Datei project.lmp, in der alle Verknüpfungen umgeschrieben wurden, um auf den lokalen Ordner udio/ zu verweisen.

### Das Ergebnis
Sie erhalten einen Ordner, der alles Notwendige enthält. Sie können den USB-Stick an jeden Computer mit installierter Runtime Live Machine Pro anschließen, die Datei project.lmp öffnen und alles wird perfekt funktionieren, unabhängig von Laufwerksbuchstaben oder Originalpfaden.

> **Empfohlene Verwendung**: Verwenden Sie diese Funktion am Ende der Vorbereitung jeder Show, um einen "Master" zu erstellen, den Sie ins Studio mitnehmen oder als vollständiges historisches Backup archivieren können.
