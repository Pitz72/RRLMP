# Kapitel 9 – Aufnahme der Session

---

Die Aufnahme der Session macht aus Runtime Live Machine Pro von einem Playout-Werkzeug ein vollwertiges Produktionswerkzeug. Statt eine separate Aufnahme-Software oder eine virtuelle Routing-Kette zu verlangen, nimmt RLMP direkt den **nachbearbeiteten Master-Mix** auf, also alles, was die Anwendung verlässt, einschließlich der Effekte der Master Chain, in eine Audiodatei auf der Festplatte.

---

## 9.1 Die Aufnahme starten

Die Aufnahmesteuerung befindet sich im Header, gekennzeichnet durch das Aufnahmesymbol.

**Start.**
Klicken Sie auf die Aufnahme-Schaltfläche. Ein roter Indikator und ein Zähler zeigen, dass die Aufnahme läuft. Die Aufnahme startet sofort: Alles, was ab diesem Moment aus dem Ausgang der Software kommt, wird erfasst.

Es müssen keine Clips laufen, um die Aufnahme zu starten: Sie können die Aufnahme vor dem Beginn der Show starten, um bei einem verfrühten Start die ersten Sekunden nicht zu verlieren.

**Was aufgenommen wird.**
Das erfasste Signal ist der **Master nach dem Limiter**: Es umfasst den Mix aller laufenden Clips und das Processing der gesamten Master Chain (HPF, multiband glue, limiter). Es ist exakt das Signal, das das Audioausgabegerät erreicht.

**Das interne Format.**
Während der Erfassung schreibt RLMP einen komprimierten Opus-Stream (im WebM-Container) mit 320 kbps: extrem leicht auf der Festplatte und beim Abhören transparent. Die durchgehende Aufnahme hat ein Sicherheitslimit von etwa **vier Stunden**; darüber hinaus stoppt die Erfassung automatisch, um den Speicher nicht zu überfüllen.

**System-Overhead.**
Die Erfassung erfolgt hinter der Audio-Engine, ohne den Renderer zu belasten. Sie können stundenlange Sessions aufnehmen, ohne sich um den Ressourcenverbrauch zu sorgen.

---

## 9.2 Die Aufnahme stoppen und das Format wählen

Wenn Sie erneut auf die Schaltfläche klicken, um die Aufnahme zu stoppen, öffnet sich das **Exportfenster**. Es ist der Moment, in dem Sie wählen, in welchem Format die Datei gespeichert wird: Die Konvertierung vom internen Stream in das Zielformat übernimmt FFmpeg.

### Verfügbare Formate

| Format | Erweiterung | Eigenschaften |
|---|---|---|
| **WAV** | `.wav` | Lossless, unkomprimiert. Höchste Qualität, große Dateien. Ideal für Archiv und Postproduktion. |
| **FLAC** | `.flac` | Lossless, komprimiert. Gleiche Qualität wie WAV, geringere Größe. Ideal fürs Archiv. |
| **MP3** | `.mp3` | Lossy. Wählbare Bitrate. Ideal für Verteilung und Podcast. |
| **OGG** | `.ogg` | Lossy, Open Source. Gutes Verhältnis von Qualität und Größe. |
| **WEBM** | `.webm` | Lossy, für das Web optimiert. Entspricht dem internen Aufnahmeformat. |

### Qualitätsoptionen

Für die Lossless-Formate (WAV und FLAC) können Sie die **Bittiefe** wählen: 16 bit (CD-Standard), 24 bit (professioneller Broadcast-Standard, Standardwert) oder 32 bit float (höchste Präzision, falls die Aufnahme später gemastert wird).

Für die Lossy-Formate (MP3, OGG, WEBM) können Sie die **Bitrate** zwischen 128, 192, 256 und 320 kbps wählen. Für einen zur Online-Verteilung bestimmten Podcast ist 192 kbps Stereo das empfohlene Minimum; 256 kbps ist der aktuelle Standard für „transparente“ Qualität.

### Wahl des Speicherorts

Im Exportfenster wählen Sie den Zielordner und den Dateinamen. Wenn Sie keinen Namen angeben, erzeugt RLMP einen aus Datum und Uhrzeit der Session. Nach Abschluss der Konvertierung zeigt ein Bestätigungs-Toast den Pfad der gespeicherten Datei.

---

## 9.3 Praktische Überlegungen

### Synchronisation mit der Show

Die Aufnahme erfasst die gesamte Zeit zwischen Start und Stopp, einschließlich der Stille. Wenn Sie die Erfassung 30 Sekunden vor dem tatsächlichen Beginn der Show gestartet haben, enthält die resultierende Datei diese 30 Sekunden am Anfang. Für ein verteilfertiges Ergebnis ohne Nachbearbeitung starten Sie die Aufnahme genau dann, wenn die Show beginnt.

### Aufnahme und Backup gleichzeitig

Das Autosave-System des Projekts (siehe Kapitel 10) und die Aufnahme der Session arbeiten unabhängig voneinander. Sie können eine Show aufnehmen, während das Autosave still den Zustand des Projekts speichert: Die beiden Vorgänge stören sich nicht.

### Empfohlenes Format für verschiedene Kontexte

**Podcast** – MP3 256 kbps Stereo oder FLAC 16 bit. Ersteres, wenn Sie die Datei direkt verteilen, Letzteres, wenn Sie noch durch einen Editor gehen.

**Historisches Archiv** – WAV 24 bit oder FLAC 24 bit. Großzügige Größen, höchste Flexibilität für eventuelle spätere Remaster.

**Radio / Streaming** – prüfen Sie die Anforderungen Ihrer Plattform. Die meisten akzeptieren MP3 128–192 kbps; manche verlangen unkomprimiertes WAV. RLMP exportiert in die gängigsten Formate, um jedes Szenario abzudecken.
