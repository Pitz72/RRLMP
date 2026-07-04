# Kapitel 10 – Projektverwaltung und Datensicherheit

---

Eine Show vorzubereiten kostet Zeit: die Dateien auswählen, sie in den Spalten organisieren, die Lautstärken konfigurieren, die Fades einstellen, die Tasten zuweisen. Diese Arbeit ist ein operatives Kapital, das jeden Zwischenfall überstehen muss: einen Systemabsturz, einen Computerwechsel, die Rückkehr zu einer Monate zuvor archivierten Folge.

RLMP geht die Datensicherheit auf mehreren Ebenen an, jede darauf ausgelegt, ein bestimmtes Risiko abzudecken.

---

## 10.1 Die Projektdatei (.lmp)

Der gesamte Zustand einer Show (die Anordnung der Clips in den Spalten, die individuellen Namen, die Lautstärken und Fades, die Cue-Punkte des Editors, die Notizen der NoteBoard, die MIDI- und Tastatur-Zuordnungen, die Farbe der Spalten) wird in einer Datei mit der Erweiterung **`.lmp`** (Live Machine Project) gespeichert.

Das Format ist JSON: eine strukturierte Textdatei, von jedem Editor lesbar, nicht proprietär. Sollte RLMP eines Tages nicht verfügbar sein, blieben die Projektdaten zugänglich.

**Was die `.lmp`-Datei enthält:** alle oben aufgeführten Einstellungen, einschließlich der absoluten Pfade zu den referenzierten Audiodateien.

**Was sie nicht enthält:** die Audiodateien selbst. Die `.lmp` speichert, wo die Dateien auf der Festplatte liegen, kopiert aber nicht ihren Inhalt. Eine Projektdatei liegt typischerweise in der Größenordnung von Kilobyte, unabhängig davon, wie viele oder wie große Audiodateien sie referenziert.

Beim Öffnen validiert RLMP die Datei: Es rekonstruiert eventuell doppelte Bezeichner, bringt außerhalb der Skala liegende Werte in vernünftige Grenzen zurück und fügt, wenn Sie ein mit einer früheren Version erstelltes Projekt öffnen, automatisch die zwischenzeitlich eingeführten Spalten hinzu (Jingle, Promo), ohne die bestehenden Daten anzutasten.

---

## 10.2 Speichern

### Schnellspeichern

Der Eintrag *Projekt speichern* im Menü FILE führt ein sofortiges Speichern in die geöffnete `.lmp`-Datei aus. Das Speichern ist still: kein Dialogfenster. Der Eintrag hebt sich gelb hervor, wenn es ungespeicherte Änderungen gibt, eine visuelle Erinnerung auf einen Blick. Nutzen Sie es häufig während der Vorbereitung der Show.

Das Speichern ist **atomar**: Die Datei wird zunächst in eine temporäre Kopie geschrieben und dann im laufenden Betrieb umbenannt. Fällt der Computer während des Schreibens aus, wird die ursprüngliche `.lmp` niemals halbfertig hinterlassen.

### Speichern unter

Der Eintrag *Speichern unter…* öffnet stets den Dialog, auch wenn das Projekt bereits einen Namen hat. Nutzen Sie ihn, um:

- Fortlaufende Versionen derselben Show zu erstellen (`Ep47_entwurf.lmp`, `Ep47_v2.lmp`, `Ep47_final.lmp`).
- Eine Variante mit anderen Konfigurationen zu speichern.
- Eine neue Datei zu erstellen, ohne die aktuelle zu überschreiben.

### Schutz beim Schließen

RLMP überwacht laufend den Zustand der Änderungen. Wenn Sie versuchen, die Software zu schließen (oder ein neues Projekt zu öffnen), während ungespeicherte Änderungen vorliegen, wird der Vorgang ausgesetzt und es erscheint eine Rückfrage mit drei Optionen: speichern, die Änderungen verwerfen oder abbrechen. Es ist nicht möglich, durch einen versehentlichen Klick auf das Schließen des Fensters Arbeit zu verlieren.

---

## 10.3 Auto-Backup und Autosave

Über die von Ihnen ausgelösten Speicherungen hinaus unterhält die Software ein automatisches Sicherheitsnetz.

**Sicherungskopie des Projekts.** Jedes Mal, wenn ein bereits gespeichertes Projekt im Hintergrund aktualisiert wird, hält RLMP neben der `.lmp` eine `.bak`-Kopie mit dem letzten gültigen Zustand bereit.

**Rotierendes Autosave.** Parallel dazu schreibt RLMP Momentaufnahmen des aktuellen Zustands in einen dedizierten Ordner der Anwendung, `autosaves`, mit einem Namen aus Datum und Uhrzeit. Es werden die **zehn jüngsten Momentaufnahmen** aufbewahrt: Die ältesten werden nach und nach gelöscht. Dieses Netz erfasst auch die Arbeit an einem „unbenannten“, nie auf die Festplatte gespeicherten Projekt.

Der Ordner `autosaves` befindet sich im Datenverzeichnis der Anwendung:

- **Windows:** `%APPDATA%\runtime-live-machine-pro\autosaves\`
- **macOS:** `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- **Linux:** `~/.config/runtime-live-machine-pro/autosaves/`

**Wie man wiederherstellt.** Wenn die Haupt-`.lmp`-Datei beschädigt ist oder der Computer plötzlich ausgefallen ist, öffnen Sie den Ordner `autosaves`, suchen Sie die Momentaufnahme mit Datum und Uhrzeit, die dem Zeitpunkt der Unterbrechung am nächsten liegt, und laden Sie sie in RLMP wie eine normale Projektdatei. Alternativ benennen Sie die `.bak`-Datei neben dem Projekt in `.lmp` um und öffnen sie.

---

## 10.4 Export Package: vollständige Portabilität

Da die `.lmp`-Datei nur die Pfade zu den Audiodateien enthält, nicht die Dateien selbst, erfordert das Mitnehmen des Projekts auf einen anderen Computer Aufmerksamkeit: Hat die Zielmaschine die Dateien nicht an denselben absoluten Pfaden, werden die Clips rot. Die Funktion **Eigenständiges Archiv exportieren** (Export Package), im Menü FILE, löst das Problem an der Wurzel.

### Wie es funktioniert

RLMP analysiert alle Pfade zu den Audiodateien des Projekts, erstellt einen Unterordner `audio/` und **kopiert physisch** jede referenzierte Datei hinein. Bereits vorhandene, identische Dateien werden nicht erneut kopiert; eventuelle Namensdopplungen werden umbenannt, um sich nicht zu überschreiben, und verwaiste Dateien (nicht mehr referenziert) werden aus dem Ordner entfernt.

Der Vorgang hat zwei Modi:

- **Neben dem Projekt** – wenn Sie in den Ordner exportieren, in dem die `.lmp` bereits liegt, synchronisiert RLMP den Unterordner `audio/` daneben.
- **Freier Ordner** – wenn Sie einen neuen Ordner wählen (einen USB-Stick, ein NAS), schreibt RLMP dorthin eine `project.lmp` mit bereits aktualisierten Pfaden, die auf den lokalen Unterordner `audio/` zeigen.

### Das Ergebnis

Der Zielordner wird in sich geschlossen: Er enthält alles Nötige, um die Show auf jedem Computer mit installiertem RLMP auszuführen, unabhängig von der Ordnerstruktur dieser Maschine.

> **Empfohlene Vorgehensweise.** Nutzen Sie Eigenständiges Archiv exportieren am Ende der Vorbereitung jeder Show, um einen „Master“ zum Mitnehmen ins Studio oder zum Archivieren zu erstellen. Bei technischen Problemen in letzter Minute haben Sie stets eine vollständige, portable Kopie bereit.

### Integritätsprüfung beim Öffnen

Jedes Mal, wenn Sie eine `.lmp`-Datei öffnen, führt RLMP eine automatische **Integritätsprüfung** durch: Es überprüft, ob jede referenzierte Audiodatei erreichbar ist. Fehlende Dateien werden mit rotem Rahmen und dem Etikett DATEI FEHLT auf der zugehörigen Karte signalisiert. Der Rest des Projekts, alle Clips mit erreichbaren Dateien, bleibt voll funktionsfähig.
