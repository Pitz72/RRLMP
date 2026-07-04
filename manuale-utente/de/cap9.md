# Kapitel 9 – Aufnahme der Session

---

Die Aufnahme der Session macht aus Runtime Live Machine Pro mehr als nur ein Playout-Werkzeug: ein vollwertiges Produktionswerkzeug. RLMP verlangt weder eine separate Aufnahme-Software noch eine virtuelle Routing-Kette, sondern zeichnet direkt den **nachbearbeiteten Master-Mix** auf – alles, was die Anwendung verlässt, samt den Effekten der Master Chain, als Audiodatei auf der Festplatte.

---

## 9.1 Die Aufnahme starten

Die Aufnahmesteuerung befindet sich im Header, gekennzeichnet durch das Aufnahmesymbol.

**Start.**
Klicken Sie auf die Aufnahme-Schaltfläche. Ein roter Indikator und ein Zähler zeigen an, dass die Aufnahme läuft. Sie beginnt sofort: Ab diesem Moment wird alles erfasst, was am Ausgang der Software ankommt.

Zum Starten der Aufnahme müssen keine Clips laufen. Sie können die Aufnahme also schon vor Showbeginn aktivieren, damit bei einem verfrühten Start keine Sekunde verloren geht.

**Was aufgenommen wird.**
Erfasst wird der **Master nach dem Limiter**: der Mix sämtlicher laufender Clips samt dem Processing der gesamten Master Chain (HPF, Multiband-Glue, Limiter) – exakt das Signal, das am Audioausgabegerät ankommt.

**Das interne Format.**
Während der Aufnahme schreibt RLMP einen komprimierten Opus-Stream im WebM-Container mit 320 kbps: platzsparend auf der Festplatte und beim Abhören klanglich transparent. Die durchgehende Aufnahme ist aus Sicherheitsgründen auf etwa **vier Stunden** begrenzt; danach stoppt die Erfassung automatisch, damit der Speicher nicht überläuft.

**Systemlast.**
Die Erfassung läuft der Audio-Engine nachgelagert, ohne den Renderer zu belasten. Auch stundenlange Sessions lassen sich also aufnehmen, ohne dass der Ressourcenverbrauch zum Problem wird.

---

## 9.2 Die Aufnahme stoppen und das Format wählen

Klicken Sie erneut auf die Schaltfläche, um die Aufnahme zu stoppen: Es öffnet sich das **Exportfenster**. Hier legen Sie fest, in welchem Format die Datei gespeichert wird; die Konvertierung vom internen Stream in das Zielformat übernimmt FFmpeg.

### Verfügbare Formate

| Format | Erweiterung | Eigenschaften |
|---|---|---|
| **WAV** | `.wav` | Lossless, unkomprimiert. Höchste Qualität, große Dateien. Ideal für Archiv und Postproduktion. |
| **FLAC** | `.flac` | Lossless, komprimiert. Gleiche Qualität wie WAV, geringere Größe. Ideal fürs Archiv. |
| **MP3** | `.mp3` | Lossy. Wählbare Bitrate. Ideal für Verteilung und Podcast. |
| **OGG** | `.ogg` | Lossy, Open Source. Gutes Verhältnis von Qualität und Größe. |
| **WEBM** | `.webm` | Lossy, für das Web optimiert. Entspricht dem internen Aufnahmeformat. |

### Qualitätsoptionen

Bei den verlustfreien Formaten WAV und FLAC lässt sich die **Bittiefe** wählen: 16 Bit (CD-Standard), 24 Bit (professioneller Broadcast-Standard und Vorgabewert) oder 32-Bit-Float für maximale Präzision, falls die Aufnahme später noch gemastert wird.

Bei den verlustbehafteten Formaten MP3, OGG und WEBM stehen als **Bitrate** 128, 192, 256 oder 320 kbps zur Wahl. Für einen Podcast, der online vertrieben werden soll, gelten 192 kbps Stereo als empfohlenes Minimum; 256 kbps hat sich mittlerweile als Standard für „transparente“ Qualität etabliert.

### Speicherort wählen

Im Exportfenster legen Sie Zielordner und Dateinamen fest. Ohne eigene Angabe erzeugt RLMP einen Namen aus Datum und Uhrzeit der Session. Nach abgeschlossener Konvertierung zeigt ein Bestätigungs-Toast den Pfad der gespeicherten Datei an.

---

## 9.3 Praktische Überlegungen

### Synchronisation mit der Show

Die Aufnahme erfasst die gesamte Zeit zwischen Start und Stopp – auch die Stille. Starten Sie die Erfassung etwa 30 Sekunden vor dem tatsächlichen Showbeginn, enthält die resultierende Datei diese 30 Sekunden am Anfang mit. Wollen Sie ein sofort verteilfertiges Ergebnis ohne Nachbearbeitung, starten Sie die Aufnahme genau im Moment des Showbeginns.

### Aufnahme und Backup gleichzeitig

Das Autosave-System des Projekts (siehe Kapitel 10) und die Aufnahme der Session laufen unabhängig voneinander. Während das Autosave still den Projektzustand sichert, können Sie parallel eine Show aufnehmen: Beide Vorgänge kommen sich nicht in die Quere.

### Empfohlenes Format je nach Einsatzzweck

**Podcast** – MP3 256 kbps Stereo oder FLAC 16 Bit: Ersteres für die direkte Verteilung, Letzteres, wenn die Datei noch durch einen Editor läuft.

**Historisches Archiv** – WAV 24 Bit oder FLAC 24 Bit. Die großzügigen Dateigrößen zahlen sich bei einem späteren Remaster aus.

**Radio/Streaming** – prüfen Sie die Anforderungen Ihrer Plattform. Die meisten akzeptieren MP3 128–192 kbps, manche verlangen unkomprimiertes WAV. RLMP deckt mit seinen Exportformaten praktisch jedes Szenario ab.
