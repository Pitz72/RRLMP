# Kapitel 4 – Der grundlegende Arbeitsablauf: laden und abspielen

---

Der grundlegende Betriebszyklus von Runtime Live Machine Pro gliedert sich in drei Phasen: Audiodateien importieren, im Raster organisieren, während der Sendung abspielen. Dieses Kapitel beschreibt jede Phase so genau, dass Sie auch unter Druck sicher arbeiten können.

---

## 4.1 Die Audiodateien importieren

RLMP verfügt weder über einen internen Browser noch über eine zentrale Bibliothek. Der Import läuft per **Drag & Drop** direkt aus dem Dateimanager des Betriebssystems (Explorer unter Windows, Finder unter macOS, Nautilus oder Vergleichbares unter Linux). Alternativ importieren Sie über das Menü FILE eine **M3U**-Playlist und verwandeln sie in eine Clip-Sequenz.

### Die Grundgeste

1. Öffnen Sie den Ordner auf Ihrem Computer, in dem die Audiodateien liegen.
2. Wählen Sie eine oder mehrere Dateien aus: `Ctrl+Klick` für eine unzusammenhängende Auswahl, `Shift+Klick` für eine zusammenhängende.
3. Ziehen Sie die ausgewählten Dateien über eine der Spalten des Rasters und lassen Sie los. Soundeffekte ziehen Sie direkt auf das pad FX (Kapitel 7).

Jede Datei erzeugt eine Karte in der Zielspalte. Ziehen Sie mehrere Dateien gleichzeitig, entstehen die Karten in der Reihenfolge, in der die Dateien im Dateimanager erscheinen, von oben nach unten.

**Einfügeanzeige.** Während des Ziehens läuft eine leuchtende blaue Linie entlang der Spalte und markiert genau die Position, an der die Karten landen. So lassen sich neue Clips oben, unten oder an jeder beliebigen Zwischenposition präzise einfügen.

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

**Ein Wort zur Performance.** Das Streaming-Protokoll `media://` sorgt dafür, dass Audiodateien beim Import nicht in den Arbeitsspeicher wandern. Eine unkomprimierte WAV-Datei von 2 GB verhält sich genau wie eine MP3 von 5 MB: Das Laden geschieht augenblicklich, die Auswirkung auf den Systemspeicher bleibt vernachlässigbar. CPU-Ressourcen beansprucht nur die aktive Dekodierung, also die Wiedergabe selbst.

### Der Pfad der Dateien

RLMP speichert den **absoluten Pfad** der Datei auf der Festplatte, nicht die Datei selbst als Kopie. Verschieben, benennen Sie um oder löschen Sie die Originaldatei, färbt sich die zugehörige Karte rot und lässt sich nicht mehr abspielen. Für die Arbeit an mehreren Computern oder portable Archive nutzen Sie die Funktion **Projekt mit Audio exportieren** aus Kapitel 10.

---

## 4.2 Wiedergabe: Clips starten und stoppen

### Einen Clip starten

Ein **Linksklick** auf die Karte genügt, um die Wiedergabe zu starten. Das Feedback folgt augenblicklich: Die Karte leuchtet im Grün des aktiven Zustands auf, der Timer wechselt zum Countdown, und die VU-Meter im Header spiegeln das Ausgangssignal wider.

Wurde dem Clip eine Tastaturtaste zugewiesen (siehe Kapitel 8), funktioniert sie als Alternative zum Klick – praktisch, wenn Sie gerade an einem anderen Teil der Oberfläche arbeiten und die Maus lieber nicht bewegen möchten.

### Einen Clip stoppen

**Klick auf den aktiven Clip** – der Clip tritt in die **Fade-Out**-Phase ein und stoppt innerhalb der in seinen Eigenschaften konfigurierten Zeit (siehe Kapitel 5).

**Taste `Esc`** – stoppt augenblicklich alle aktiven Clips. Der Notfallbefehl schlechthin: Er funktioniert, sobald RLMP das aktive Fenster ist, auch während Sie gerade in ein Textfeld schreiben.

**Schaltfläche STOP ALL** im Header – identisch mit `Esc`, nur per Maus erreichbar.

### Die Ausschlusslogik je Spalte

In den meisten Spalten gilt die Regel **„ein Clip auf einmal“**: Spielen Sie *Titel A* in der Spalte Musik ab und klicken auf *Titel B* in derselben Spalte, stoppt *Titel A* (mit Fade Out), und *Titel B* startet. Den laufenden Clip vorher manuell zu stoppen ist nicht nötig.

Die wichtigste Ausnahme bilden die **Effekte des pad FX**: Sie legen sich über alles, auch über andere Effekte, ohne zu unterbrechen, was gerade läuft. Ein Applaus kann also starten, während ein Song läuft, ohne dessen Wiedergabe zu stören.

Auch Clips mit dem Verhalten **Stacco** (Trenner, konfigurierbar in den Eigenschaften, siehe Kapitel 5) legen sich über die anderen Clips der Spalte, ohne sie zu stoppen – ganz gleich, an welcher Position sie sich befinden.

---

## 4.3 Die Playlist organisieren

### Clips umsortieren

Egal ob während der Vorbereitung oder mitten in der laufenden Show – die Reihenfolge der Clips lässt sich jederzeit umorganisieren.

**Internes Ziehen.** Klicken Sie auf eine Karte, halten Sie gedrückt und ziehen Sie sie in derselben Spalte nach oben oder unten. Die blaue Hilfslinie zeigt die Einfügeposition. Der Clip setzt sich an der neuen Position fest, ohne laufende Wiedergaben zu unterbrechen.

**Verschieben zwischen Spalten.** Ein Clip lässt sich auch von einer Spalte in eine andere ziehen. Dabei **erbt er die Regeln der Zielspalte**: Eine vorproduzierte Stimme, in die Spalte Musik verschoben, unterliegt fortan genau wie ein Musiktitel dem Ducking.

Clips zwischen Spalten zu verschieben ist ein wirkungsvoller Eingriff. Setzen Sie ihn bewusst ein, besonders während der Sendung.

### Mehrfachauswahl und Löschen

So entfernen Sie mehrere Clips in einem einzigen Vorgang aus dem Raster:

1. `Ctrl+Klick` (Windows/Linux) oder `Cmd+Klick` (macOS) auf jeden gewünschten Clip. Der Rahmen wird blau.
2. Drücken Sie `Entf` oder `Delete`. Bei mehr als einem ausgewählten Clip fragt die Software vorher nach.

Das Löschen aus dem Raster entfernt die Clips nur aus dem aktuellen Projekt, nicht die Audiodateien von der Festplatte. Bei einem Versehen macht `Ctrl+Z` den Vorgang rückgängig.

> **Praxis-Tipp.** Läuft die Sendung bereits, ist das Leeren der Spalte Pre-Show per Mehrfachauswahl und `Entf` der schnellste Weg, um visuellen Platz zu schaffen und in den Betriebsmodus überzugehen.

---

## 4.4 Struktur-Cues: INTRO und OUTRO

Jeder Clip kann zwei **strukturelle Marker** tragen, konfigurierbar im Waveform-Editor (Kapitel 5):

- **Intro Marker** – der Punkt, an dem nach dem instrumentalen Vorspann die eigentliche Hauptmelodie einsetzt. Nützlich, um genau zu wissen, wann man über dem Intro zu sprechen beginnen darf.
- **Outro Marker** – der Punkt, an dem das Schluss-Outro beginnt. Er signalisiert den richtigen Moment, um den Übergang zum nächsten Titel vorzubereiten.

Nähert sich die Wiedergabe eines Clips diesen Punkten, erscheint auf der Karte ein visueller Hinweis:

- **INTRO: −MM:SS** – Countdown bis zum Intro Marker.
- **OUTRO IN: −MM:SS** – Countdown bis zum Outro Marker, gefolgt von **🚨 OUTRO**, sobald das Outro begonnen hat.

Diese Hinweise erscheinen nur bei konfigurierten Markern. Ohne Marker zeigt die Karte lediglich den Standard-Countdown bis zum Ende des Titels.
