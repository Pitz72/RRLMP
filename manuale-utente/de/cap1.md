# KAPITEL 1: EINFÜHRUNG UND SETUP

Willkommen bei **Runtime Live Machine Pro (RRLMP)**.
Dieses Kapitel führt Sie durch die ersten Schritte: vom Verständnis der Softwarephilosophie bis zum ersten Start.

## 1.1 Was ist Runtime Live Machine Pro (RRLMP)

**Runtime Live Machine Pro** ist eine professionelle "Pro-Grade" Audio-Architektur, die für die Regie von **einzelnen Live-Shows**, Podcasts, Events und Webradios entwickelt wurde.

Im Gegensatz zu komplexer 24/7-Radioautomationssoftware (die Musik tagelang in Rotation spielt), ist RRLMP ein **Performance**-Tool. Es ist darauf ausgelegt, in Echtzeit von einem Regisseur oder Sprecher "gespielt" zu werden und bietet chirurgische Kontrolle über jeden Übergang.

### Warum RRLMP wählen?
*   **"Single Show"-Philosophie**: Jedes Projekt ist ein isolierter Container, der alles enthält, was für diese spezifische Episode oder Veranstaltung benötigt wird.
*   **Main-Side-Heavy Architektur**: Verwendet einen Node.js-Proxy für die schwere Audiodekodierung (FFmpeg), wodurch die Oberfläche (Renderer) auch bei großen WAV-Dateien flüssig und absturzfrei bleibt.
*   **Totale Sicherheit**: Enthält Auto-Backup-Systeme, Integritätsprüfungen für .lmp-Dateien und visuelle Warnungen für Intro/Outro-Cues.
*   **Physische Kontrolle**: Unterstützt nativ MIDI-Controller (mit MIDI Learn) und Keyboards für eine taktile und reaktionsschnelle Regie.

---

## 1.2 Installation

### Systemanforderungen
*   **Windows**: Windows 10 oder Windows 11 (64-Bit).
*   **macOS**: macOS 11 (Big Sur) oder neuer (Nativer Apple Silicon & Intel Support).
*   **Linux**: AppImage und .deb-Pakete unterstützt (Ubuntu/Debian/Mint).
*   **RAM**: Mindestens 4 GB (8 GB empfohlen).
*   **Festplattenspeicher**: 200 MB für die Anwendung + Platz für Ihre Audiodateien.

### Installation unter Windows
1.  Laden Sie die Datei `Runtime Live Machine Pro Setup 1.0.0.exe` von der offiziellen Website oder dem Repository herunter.
2.  Doppelklicken Sie auf die ausführbare Datei.
3.  Das automatische Installationsprogramm kopiert die Dateien und erstellt eine Verknüpfung auf dem Desktop.
4.  Nach Abschluss startet die Anwendung automatisch.

> **Sicherheitshinweis**: Da die Software häufig aktualisiert wird, zeigt Windows SmartScreen möglicherweise eine Warnung "Der Computer wurde durch Windows geschützt" an. Klicken Sie auf **"Weitere Informationen"** und dann auf **"Trotzdem ausführen"**. Die Software ist sicher, signiert und frei von Malware.

### Installation unter macOS
1.  Laden Sie die `.dmg`-Datei herunter.
2.  Öffnen Sie die Image-Datei und ziehen Sie das Symbol von **Runtime Live Machine Pro** in den Ordner **Programme**.
3.  Beim ersten Start müssen Sie die Anwendung möglicherweise in *Systemeinstellungen > Sicherheit & Datenschutz* autorisieren.

---

## 1.3 Der Willkommensbildschirm (Welcome Screen)

Beim ersten Start werden Sie vom neuen **Welcome Screen** im horizontalen Layout begrüßt. Dies ist Ihr Start-Dashboard, das entwickelt wurde, damit Sie in wenigen Sekunden mit der Arbeit beginnen können.

### Bildschirmelemente
1.  **Neues Logo**: Das Pro-Logo (5 VU-Meter-Balken mit Wiedergabe-Dreieck) kennzeichnet die stabile Version der Software.
2.  **Versionsstatus**: Unter dem Logo sehen Sie die aktuelle Versionsnummer (z. B. `v1.0.0`).
    *   ✅ **Grün**: Sie haben die neueste Version.
    *   ⬇️ **Gelb/Orange**: Ein Update ist verfügbar.
3.  **Sprachauswahl**: Oben rechts finden Sie Flaggen (8 unterstützte Sprachen), um die Oberfläche sofort zu ändern.
    *   *Sprachen*: IT, EN, FR, DE, ES, PT, RU, ZH.
    *   Ihre Wahl wird im Benutzerprofil gespeichert.

### Verfügbare Aktionen
*   **Neues Projekt (New Project)**: Erstellt eine leere Sitzung. Alle 5 Spalten (Assets, Music, Voice, SFX, PRE-SHOW) sind bereit zum Laden von Dateien.
*   **Projekt laden (Load Project)**: Öffnet eine vorhandene `.lmp`-Datei. RRLMP führt eine Integritätsprüfung durch: Wenn Audiodateien fehlen, werden diese rot markiert.
*   **Online-Handbuch**: Öffnet die aktualisierte Dokumentation in Ihrem Browser.

> **Erster Start**: RRLMP startet vorzugsweise im Vollbildmodus. Sobald ein Projekt geladen ist, bemerken Sie das cyanfarbene **PRO**-Badge in der Kopfzeile, das die Lizenz und die Stabilität der Audio-Engine bestätigt.
