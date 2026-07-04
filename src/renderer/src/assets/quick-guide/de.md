# Runtime Live Machine Pro — Kurzanleitung

**Version 1.15.6 · Deutsch**

Willkommen bei Runtime Live Machine Pro (RLMP), der Audio-Playout-Software für Radio, Live-Sendungen und Events. Diese Anleitung führt Sie in wenigen Minuten von der Installation bis zum ersten Play. Die vollständige Dokumentation finden Sie im Benutzerhandbuch (aus der Software herunterladbar über die Schaltfläche „Handbuch").

---

## 1. Systemanforderungen

| | Minimum | Empfohlen |
|---|---|---|
| Windows | 10 64-Bit | 11 64-Bit |
| macOS | 11 Big Sur | 13 Ventura oder neuer |
| Linux | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| RAM | 4 GB | 8 GB oder mehr |
| Speicher | 300 MB | 1 GB + Speicherplatz für Audiodateien |

Eine dedizierte Soundkarte ist nicht erforderlich: RLMP funktioniert mit jedem vom System erkannten Gerät, vom integrierten Ausgang bis zu professionellen USB-Mixern (Rødecaster Pro, Rødecaster Duo usw.). Nativ optimiert für Apple Silicon (M1/M2/M3).

---

## 2. Installation

**Windows**
1. Öffnen Sie die heruntergeladene `.exe`-Datei.
2. Falls die Meldung „Der PC wurde durch Windows geschützt" erscheint, klicken Sie auf **Weitere Informationen** → **Trotzdem ausführen**. Das ist bei häufig aktualisierter Software normal: Es handelt sich um keine Schadsoftware, der Quellcode ist öffentlich einsehbar.
3. Folgen Sie dem Einrichtungsassistenten. Am Ende werden eine Verknüpfung auf dem Desktop und im Startmenü angelegt.

**macOS**
1. Öffnen Sie die heruntergeladene `.dmg`-Datei.
2. Ziehen Sie das Symbol von Runtime Live Machine Pro in den Ordner **Programme**.
3. Falls macOS beim ersten Start die Gatekeeper-Warnung anzeigt, gehen Sie zu **Systemeinstellungen → Datenschutz & Sicherheit** und klicken Sie neben dem App-Namen auf **Dennoch öffnen**.

**Linux**
- **AppImage** (portabel, keine Installation nötig): Machen Sie die Datei mit `chmod +x` ausführbar und starten Sie sie.
- **.deb** (Debian/Ubuntu/Mint): Installation mit `sudo dpkg -i dateiname.deb` oder über die grafische Paketverwaltung.
- Startet die App nicht, stellen Sie sicher, dass das Paket `libasound2` für die ALSA-Unterstützung installiert ist.

---

## 3. Erster Start

Beim Start sehen Sie den **Welcome Screen**: Hier können Sie ein neues Projekt anlegen, ein bestehendes laden (`.lmp`), das Benutzerhandbuch herunterladen oder diese Kurzanleitung öffnen. Oben rechts wählen Sie die Interfacesprache aus den acht verfügbaren Sprachen.

Sobald ein Projekt geöffnet ist, bestätigt das cyanfarbene **PRO**-Badge im Header, dass die Audio-Engine aktiv ist. Drücken Sie `F11` (Windows/Linux) oder `Ctrl+Cmd+F` (macOS), um in den Vollbildmodus zu wechseln — der empfohlene Arbeitsmodus für die Live-Regie.

---

## 4. Die sechs Spalten

RLMP organisiert alles in sechs festen Spalten, jede mit einem eigenen Verhalten:

| Spalte | Farbe | Verhalten |
|---|---|---|
| **Show Assets** | Grün | Erkennungsmelodien, Musikbetten, institutionelle Trenner |
| **Jingle** | Bernstein | Erkennungs-Jingles |
| **Promo** | Cyan | Promos und Eigenwerbung |
| **Songs** | Rot | Musik-Playlist, unterliegt dem Ducking, BPM-Erkennung |
| **Stimmen** | Orange | Höchste Priorität: senkt alles andere ab |
| **Pre-Show** | Violett | Warm-up-Musik vor Sendebeginn, mit optionaler Rotation |

Jede Spalte hat einen farbigen Punkt in der Kopfzeile: Klicken Sie darauf, um aus 30 verfügbaren Farbtönen eine andere Farbe zu wählen.

---

## 5. FX-Pad und Automix

Zusätzlich zu den sechs Spalten bietet der Header zwei schnelle Werkzeuge:

- **FX** — öffnet das Soundeffekt-Pad: frei überlappende Wiedergabe, ideal für Stinger, Applaus, klangliche Übergänge.
- **MIX** — öffnet die Automix-Ansicht, das der Songs-Spalte gewidmete Deck: BPM-Kompatibilität, beat-synchrone Übergänge und Automatikmodus.

---

## 6. Erste Datei laden und abspielen

1. Ziehen Sie eine Audiodatei (MP3, WAV, AAC/M4A, OGG, FLAC) direkt aus dem Explorer / Finder auf eine Spalte.
2. **Linksklick** auf die Karte, um die Wiedergabe zu starten.
3. **Erneuter Klick** auf die aktive Karte stoppt sie mit Fade-out, oder drücken Sie `Esc` für einen sofortigen Notstopp aller Clips.

In den meisten Spalten gilt die Regel „ein Clip nach dem anderen": Der Start eines neuen Clips stoppt automatisch den laufenden Clip in derselben Spalte. Das FX-Pad sowie Clips im Stacco-Modus bilden die Ausnahme und überlagern sich frei.

---

## 7. Wo Sie Hilfe finden

- **Vollständiges Benutzerhandbuch** — direkt aus der Software herunterladbar (Schaltfläche „Handbuch" im Info-Bildschirm), deckt jede Funktion im Detail ab (Waveform-Editor, Ducking, MIDI, Aufnahme, Projektverwaltung, Fernsteuerung).
- **Offizielle Website und Updates** — die Farbe neben der Versionsnummer im Welcome Screen zeigt an, ob ein Update verfügbar ist (grün = aktuell, gelb/orange = neue Version verfügbar).

Gute Sendung.

*Runtime Live Machine Pro ist ein Ecosystem.Runtime-Projekt — © Simone Pizzi.*
