# Kapitel 10 – Projektverwaltung und Datensicherheit

---

Eine Show vorzubereiten kostet Zeit: Dateien auswählen, in Spalten organisieren, Lautstärken konfigurieren, Fades einstellen, Tasten zuweisen. Diese Arbeit ist ein operatives Kapital, das jeden Zwischenfall überstehen muss – einen Systemabsturz, einen Computerwechsel oder die Rückkehr zu einer Monate zuvor archivierten Folge.

RLMP sichert die Daten deshalb auf mehreren Ebenen ab, jede auf ein bestimmtes Risiko zugeschnitten.

---

## 10.1 Die Projektdatei (.lmp)

Der gesamte Zustand einer Show – die Anordnung der Clips in den Spalten, die individuellen Namen, Lautstärken und Fades, die Cue-Punkte des Editors, die Notizen der NoteBoard, die MIDI- und Tastatur-Zuordnungen sowie die Farbe der Spalten – wird in einer Datei mit der Erweiterung **`.lmp`** (Live Machine Project) gespeichert.

Das Format ist JSON: eine strukturierte, nicht proprietäre Textdatei, die sich mit jedem Editor öffnen lässt. Sollte RLMP eines Tages nicht mehr verfügbar sein, blieben die Projektdaten trotzdem zugänglich.

**Was die `.lmp`-Datei enthält:** sämtliche oben genannten Einstellungen, einschließlich der absoluten Pfade zu den referenzierten Audiodateien.

**Was sie nicht enthält:** die Audiodateien selbst. Die `.lmp` speichert lediglich, wo die Dateien auf der Festplatte liegen, ohne deren Inhalt zu kopieren. Eine Projektdatei bewegt sich daher meist im Kilobyte-Bereich, unabhängig davon, wie viele oder wie große Audiodateien sie referenziert.

Beim Öffnen validiert RLMP die Datei: Es bereinigt doppelte Bezeichner, korrigiert außerhalb der Skala liegende Werte und ergänzt bei einem mit einer früheren Version erstellten Projekt automatisch die zwischenzeitlich eingeführten Spalten (Jingle, Promo) – ohne die bestehenden Daten anzutasten.

---

## 10.2 Speichern

### Schnellspeichern

Der Eintrag *Projekt speichern* im Menü FILE speichert sofort in die geöffnete `.lmp`-Datei – ganz ohne Dialogfenster. Gibt es ungespeicherte Änderungen, hebt sich der Eintrag gelb hervor: eine visuelle Erinnerung auf einen Blick. Nutzen Sie diese Funktion während der Showvorbereitung ruhig oft.

Gespeichert wird **atomar**: Die Datei wird zunächst in eine temporäre Kopie geschrieben und erst dann im laufenden Betrieb umbenannt. Fällt der Computer währenddessen aus, bleibt die ursprüngliche `.lmp` nie halbfertig zurück.

### Speichern unter

Der Eintrag *Speichern unter…* öffnet immer den Dialog, auch wenn das Projekt bereits einen Namen trägt. Nutzen Sie ihn, um:

- fortlaufende Versionen derselben Show zu erstellen (`Ep47_entwurf.lmp`, `Ep47_v2.lmp`, `Ep47_final.lmp`),
- eine Variante mit abweichenden Einstellungen zu sichern,
- eine neue Datei anzulegen, ohne die aktuelle zu überschreiben.

### Schutz beim Schließen

RLMP überwacht den Änderungsstatus fortlaufend. Versuchen Sie, die Software mit ungespeicherten Änderungen zu schließen oder ein neues Projekt zu öffnen, wird der Vorgang angehalten und eine Rückfrage mit drei Optionen erscheint: speichern, Änderungen verwerfen oder abbrechen. Ein versehentlicher Klick auf das Schließen des Fensters kann so keine Arbeit mehr kosten.

---

## 10.3 Auto-Backup und Autosave

Über die selbst ausgelösten Speicherungen hinaus unterhält die Software ein automatisches Sicherheitsnetz.

**Sicherungskopie des Projekts.** Wird ein bereits gespeichertes Projekt im Hintergrund aktualisiert, legt RLMP neben der `.lmp` jedes Mal eine `.bak`-Kopie mit dem zuletzt gültigen Zustand an.

**Rotierendes Autosave.** Parallel dazu schreibt RLMP Momentaufnahmen des aktuellen Zustands in einen eigenen Anwendungsordner namens `autosaves`, benannt nach Datum und Uhrzeit. Aufbewahrt werden die **zehn jüngsten Momentaufnahmen**; ältere werden nach und nach gelöscht. Dieses Netz fängt auch die Arbeit an einem „unbenannten“, nie auf die Festplatte gespeicherten Projekt auf.

Der Ordner `autosaves` befindet sich im Datenverzeichnis der Anwendung:

- **Windows:** `%APPDATA%\runtime-live-machine-pro\autosaves\`
- **macOS:** `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- **Linux:** `~/.config/runtime-live-machine-pro/autosaves/`

**Wie Sie wiederherstellen.** Ist die Haupt-`.lmp`-Datei beschädigt oder der Computer plötzlich ausgefallen, öffnen Sie den Ordner `autosaves` und suchen die Momentaufnahme, deren Datum und Uhrzeit dem Zeitpunkt der Unterbrechung am nächsten liegen. Laden Sie sie anschließend in RLMP wie eine gewöhnliche Projektdatei. Alternativ benennen Sie die `.bak`-Datei neben dem Projekt in `.lmp` um und öffnen sie.

---

## 10.4 Projekt mit Audio exportieren

Da die `.lmp`-Datei nur die Pfade zu den Audiodateien enthält, nicht die Dateien selbst, ist ein Projekt zerbrechlich: Verschieben, benennen oder löschen Sie auch nur eine der Quelldateien, wird der zugehörige Clip rot. Die Funktion **Projekt mit Audio exportieren** im Menü FILE (direkt unter *Speichern unter…*) löst das Problem an der Wurzel, indem sie das gesamte Audio innerhalb des Projekts konsolidiert.

### Wie es funktioniert

RLMP analysiert sämtliche Pfade zu den Audiodateien des Projekts, legt einen Unterordner `audio/` neben der `.lmp`-Datei an und **kopiert physisch** jede referenzierte Datei hinein. Bereits vorhandene, identische Dateien werden dabei nicht erneut kopiert; Namensdopplungen werden umbenannt, damit nichts überschrieben wird, und verwaiste, nicht mehr referenzierte Dateien werden aus dem Ordner entfernt.

Der Unterschied zu einem einfachen Backup liegt in dem, was **nach** dem Kopieren geschieht: RLMP **verweist jeden Clip auf die neue Kopie** innerhalb von `audio/` und **speichert das Projekt erneut**. Von diesem Moment an ist der Ordner `audio/` kein Reserve-Archiv neben dem Projekt mehr, sondern die Quelle, aus der die Session das Audio tatsächlich liest.

### Das Ergebnis: Sie können die Originale löschen

Da das Projekt nun auf die Kopien in `audio/` verweist, **werden die Audiodateien an ihrem ursprünglichen Ort nicht mehr benötigt**, und Sie können sie gefahrlos löschen: Die Show läuft weiter und liest aus dem Archiv. Das ist der Unterschied zu den früheren Versionen, in denen der Ordner `audio/` ein verwaistes Duplikat blieb und das Löschen der Originale die Clips zerstörte.

Der Projektordner wird so autark: `.lmp` samt Unterordner `audio/`, alles Nötige, um die Show auszuführen – bereit zum Archivieren, Kopieren oder Mitnehmen auf einen anderen Computer mit installiertem RLMP.

Einige nützliche Details:

- Der Vorgang ist **wiederholbar**: Fügen Sie neue Clips hinzu und exportieren erneut, kopiert RLMP nur die neuen Dateien und richtet das Projekt neu aus, ohne die bereits archivierten zu duplizieren.
- Das Anbinden an das Archiv **fließt nicht in die Historie Rückgängig/Wiederholen ein**: Ein *Rückgängig* würde die Clips auf die Originale zurückführen, die Sie womöglich schon gelöscht haben.
- Der Verweis auf das Archiv ist ein **absoluter Pfad**. Solange der Projektordner an seinem Platz bleibt, funktioniert alles; verschieben Sie ihn woanders hin, müssen die Pfade mit einem neuen Export von der neuen Position aus neu erzeugt werden.

> **Empfohlene Vorgehensweise.** Nutzen Sie *Projekt mit Audio exportieren* am Ende jeder Showvorbereitung, um das Audio im Projekt zu konsolidieren. So erhalten Sie einen kompakten, portablen „Master“ und können Speicherplatz freigeben, indem Sie die verstreuten Dateien löschen, aus denen Sie importiert hatten.

### Integritätsprüfung beim Öffnen

Beim Öffnen einer `.lmp`-Datei führt RLMP automatisch eine **Integritätsprüfung** durch und überprüft, ob jede referenzierte Audiodatei erreichbar ist. Fehlende Dateien werden auf der zugehörigen Karte mit rotem Rahmen und dem Etikett DATEI FEHLT markiert. Der Rest des Projekts – alle Clips mit erreichbaren Dateien – bleibt voll funktionsfähig.
