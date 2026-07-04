# Kapitel 4 – Der grundlegende Arbeitsablauf: laden und abspielen

---

Der grundlegende Betriebszyklus von Runtime Live Machine Pro gliedert sich in drei Phasen: die Audiodateien importieren, sie im Raster organisieren, sie während der Sendung abspielen. Dieses Kapitel beschreibt jede Phase mit der Genauigkeit, die nötig ist, um auch unter Druck sicher zu arbeiten.

---

## 4.1 Die Audiodateien importieren

RLMP verfügt weder über einen internen Browser noch über eine zentrale Bibliothek. Der Import erfolgt per **Drag & Drop** direkt aus dem Dateimanager des Betriebssystems (Explorer unter Windows, Finder unter macOS, Nautilus oder Vergleichbares unter Linux). Alternativ können Sie aus dem Menü FILE eine **M3U**-Playlist importieren und in eine Clip-Sequenz verwandeln.

### Die Grundgeste

1. Öffnen Sie den Ordner auf Ihrem Computer, in dem die Audiodateien liegen.
2. Wählen Sie eine oder mehrere Dateien aus. Für die Auswahl mehrerer Dateien: `Ctrl+Klick` für eine unzusammenhängende Auswahl, `Shift+Klick` für eine zusammenhängende Auswahl.
3. Ziehen Sie die ausgewählten Dateien über eine der Spalten des Rasters und lassen Sie los. Soundeffekte ziehen Sie direkt auf das pad FX (Kapitel 7).

Jede Datei erzeugt eine Karte in der Zielspalte. Wenn Sie mehrere Dateien gleichzeitig ziehen, werden die Karten in der Reihenfolge erstellt, in der die Dateien im Dateimanager erscheinen, von oben nach unten.

**Einfügeanzeige.** Während des Ziehens läuft eine leuchtende blaue Linie entlang der Spalte und zeigt die genaue Position an, an der die Karten eingefügt werden. Sie können neue Clips oben, unten oder an einer beliebigen Zwischenposition präzise einfügen.

### Unterstützte Formate

Die integrierte FFmpeg-Engine garantiert Kompatibilität mit einer breiten Palette von Audioformaten:

| Format | Erweiterung | Anmerkungen |
|---|---|---|
| MP3 | `.mp3` | Alle Bitraten |
| WAV | `.wav` | PCM unkomprimiert, jede Bittiefe |
| FLAC | `.flac` | Lossless, jede Sample-Rate |
| AAC / M4A | `.aac`, `.m4a` | Umfasst Dateien aus iTunes/Apple Music |
| OGG Vorbis | `.ogg` | |
| Opus | `.opus` | |
| WMA | `.wma` | Windows Media Audio |
| WebM / MP4 | `.webm`, `.mp4` | In diesen Containern enthaltene Audiospuren |

**Ein Wort zur Performance.** Das Streaming-Protokoll `media://` sorgt dafür, dass die Audiodateien beim Import nicht in den Arbeitsspeicher geladen werden. Eine unkomprimierte WAV-Datei von 2 GB verhält sich genau wie eine MP3 von 5 MB: Das Laden ist augenblicklich und die Auswirkung auf den Systemspeicher vernachlässigbar. Die CPU-Ressourcen werden nur während der aktiven Dekodierung beansprucht, also während der Wiedergabe.

### Der Pfad der Dateien

RLMP speichert den **absoluten Pfad** der Datei auf der Festplatte, nicht eine Kopie der Datei selbst. Wenn Sie die Originaldatei verschieben, umbenennen oder löschen, wird die zugehörige Karte rot und ist nicht mehr abspielbar. Um an mehreren Computern zu arbeiten oder portable Archive zu erstellen, nutzen Sie die Funktion **Export Package** aus Kapitel 10.

---

## 4.2 Wiedergabe: Clips starten und stoppen

### Einen Clip starten

Ein **Linksklick** auf die Karte genügt, um die Wiedergabe zu starten. Das Feedback ist sofortig: Die Karte leuchtet im Grün des aktiven Zustands auf, der Timer wechselt zum Countdown, und die VU meter im Header spiegeln das Ausgangssignal wider.

Wurde dem Clip eine Tastaturtaste zugewiesen (siehe Kapitel 8), funktioniert diese Taste als Alternative zum Klick – nützlich, wenn Sie gerade an einem anderen Teil der Oberfläche arbeiten und die Maus nicht bewegen möchten.

### Einen Clip stoppen

**Klick auf den aktiven Clip** – der Clip tritt in die **Fade-Out**-Phase ein und stoppt innerhalb der in seinen Eigenschaften konfigurierten Zeit (siehe Kapitel 5).

**Taste `Esc`** – stoppt alle aktiven Clips augenblicklich. Es ist der Notfallbefehl. Er funktioniert, wenn RLMP das aktive Fenster ist, auch während Sie in ein Textfeld schreiben.

**Schaltfläche STOP ALL** im Header – identisch mit `Esc`, per Maus erreichbar.

### Die Ausschlusslogik je Spalte

In den meisten Spalten wendet RLMP die Regel **„ein Clip auf einmal“** an: Wenn Sie *Titel A* in der Spalte Musik abspielen und auf *Titel B* in derselben Spalte klicken, stoppt *Titel A* (mit Fade Out) und *Titel B* startet. Sie müssen den laufenden Clip nicht manuell stoppen, bevor Sie einen anderen starten.

Die **Effekte des pad FX** sind die wichtigste Ausnahme: Sie legen sich über alles, auch über andere Effekte, und unterbrechen nicht, was gerade läuft. Ein Applaus kann starten, während ein Song läuft, ohne dessen Wiedergabe zu unterbrechen.

Auch Clips mit dem Verhalten **Stacco** (Trenner, in den Eigenschaften konfigurierbar, siehe Kapitel 5) legen sich über die anderen Clips der Spalte, ohne sie zu stoppen, ganz gleich, wo sie sich befinden.

---

## 4.3 Die Playlist organisieren

### Clips umsortieren

Während der Vorbereitung der Show, oder auch während sie läuft, können Sie die Reihenfolge der Clips jederzeit umorganisieren.

**Internes Ziehen.** Klicken Sie auf eine Karte, halten Sie gedrückt und ziehen Sie sie in derselben Spalte nach oben oder unten. Die blaue Hilfslinie zeigt die Einfügeposition. Der Clip fügt sich an der neuen Position ein, ohne laufende Wiedergaben zu unterbrechen.

**Verschieben zwischen Spalten.** Sie können einen Clip von einer Spalte in eine andere ziehen. Dabei **erbt der Clip die Regeln der Zielspalte**: eine vorproduzierte Stimme, in die Spalte Musik verschoben, beginnt genau wie ein Musiktitel dem Ducking zu unterliegen.

Clips zwischen Spalten zu verschieben ist ein wirkungsvoller, bewusster Vorgang. Nutzen Sie die Funktion mit Bedacht, besonders während der Sendung.

### Mehrfachauswahl und Löschen

Um mehrere Clips in einem einzigen Vorgang aus dem Raster zu entfernen:

1. `Ctrl+Klick` (Windows/Linux) oder `Cmd+Klick` (macOS) auf jeden zu wählenden Clip. Der Rahmen wird blau.
2. Drücken Sie `Entf` oder `Delete`. Die Software fragt nach, wenn mehr als ein Clip ausgewählt ist.

Das Löschen aus dem Raster entfernt die Clips aus dem aktuellen Projekt, nicht die Audiodateien von der Festplatte. Wenn Sie sich vertun, macht `Ctrl+Z` den Vorgang rückgängig.

> **Praxis-Tipp.** Ist die Sendung erst gestartet, ist das Leeren der Spalte Pre-Show per Mehrfachauswahl und `Entf` der schnellste Weg, visuellen Platz in der Oberfläche zu schaffen und in den Betriebsmodus überzugehen.

---

## 4.4 Struktur-Cues: INTRO und OUTRO

Jeder Clip kann zwei **strukturelle Marker** haben, die im Waveform-Editor konfiguriert werden (Kapitel 5):

- **Intro Marker** – der Punkt, an dem die Hauptmelodie des Titels tatsächlich einsetzt, nach dem instrumentalen Vorspann. Nützlich, um genau zu wissen, wann man über dem Intro zu sprechen beginnen kann.
- **Outro Marker** – der Punkt, an dem das Schluss-Outro des Titels beginnt. Signalisiert den richtigen Moment, um den Übergang zum nächsten Titel vorzubereiten.

Wenn sich die Wiedergabe eines Clips diesen Punkten nähert, erscheint auf der Karte ein visueller Hinweis:

- **INTRO: −MM:SS** – Countdown bis zum Intro Marker.
- **OUTRO IN: −MM:SS** – Countdown bis zum Outro Marker, gefolgt von **🚨 OUTRO**, wenn das Outro begonnen hat.

Diese Hinweise erscheinen nur, wenn die Marker konfiguriert wurden. Auf Clips ohne Marker zeigt die Karte lediglich den Standard-Countdown zum Ende des Titels.
