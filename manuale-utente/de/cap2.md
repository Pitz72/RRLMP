# Kapitel 2 – Installation und erster Start

---

Die Installation von Runtime Live Machine Pro ist so ausgelegt, dass sie ein Minimum an Interaktion verlangt: wenige Klicks, keine manuelle Konfiguration, keine separat zu installierenden Voraussetzungen. Die Audio-Engine (FFmpeg) ist im Installationspaket enthalten und erfordert keinerlei Eingriff Ihrerseits.

---

## 2.1 Systemanforderungen

Prüfen Sie vor dem Fortfahren, ob Ihr Computer die Mindestanforderungen erfüllt. Die empfohlenen Spezifikationen sorgen für die beste Erfahrung bei langen Sessions oder wenn viele Clips gleichzeitig geladen sind.

| | Minimum | Empfohlen |
|---|---|---|
| **Betriebssystem (Windows)** | Windows 10 64-bit | Windows 11 64-bit |
| **Betriebssystem (macOS)** | macOS 11 Big Sur | macOS 13 Ventura oder neuer |
| **Betriebssystem (Linux)** | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| **RAM** | 4 GB | 8 GB oder mehr |
| **Speicherplatz** | 300 MB (Anwendung) | 1 GB + Platz für die Audiodateien |
| **CPU** | Beliebiger moderner Dual-Core | Quad-Core oder besser |

Die Software ist für Apple Silicon (M1, M2, M3) optimiert und läuft nativ auf beiden macOS-Architekturen, ohne Rosetta-Emulation.

Eine dedizierte Soundkarte ist nicht erforderlich: RLMP arbeitet mit jedem vom Betriebssystem erkannten Audiogerät, von der integrierten Soundkarte bis zu professionellen USB-Mixern wie dem Rødecaster Pro oder dem RØDECaster Duo.

---

## 2.2 Installation unter Windows

1. Laden Sie die Datei `Runtime-Live-Machine-Pro-1.11.5.exe` aus dem offiziellen Vertriebskanal herunter.
2. Doppelklicken Sie auf die ausführbare Datei. Der NSIS-Installer startet und kopiert die Dateien in die passenden Verzeichnisse.
3. Zum Abschluss wird eine Verknüpfung auf dem Desktop und im Startmenü angelegt.
4. Die Anwendung startet nach Abschluss der Installation automatisch.

**Hinweis zu Windows SmartScreen.** Da die Software häufig aktualisiert wird, hat das digitale Signaturzertifikat womöglich noch nicht genügend „Reputation“ für die automatische Whitelist von SmartScreen angesammelt. Erscheint die Meldung „Der Computer wurde durch Windows geschützt“, klicken Sie auf *Weitere Informationen* und dann auf *Trotzdem ausführen*. Die Software ist frei von Malware; die offiziellen Installer werden ausschließlich über die Vertriebskanäle des Autors veröffentlicht.

---

## 2.3 Installation unter macOS

1. Laden Sie die `.dmg`-Datei aus dem offiziellen Kanal herunter.
2. Öffnen Sie die Image-Datei und ziehen Sie das Symbol von Runtime Live Machine Pro in den Ordner *Programme*.
3. Beim ersten Start zeigt macOS möglicherweise eine Gatekeeper-Warnung („Das Programm kann nicht geöffnet werden, da es von einem nicht verifizierten Entwickler stammt“). Um fortzufahren, öffnen Sie *Systemeinstellungen* → *Sicherheit* → *Allgemein* und klicken Sie auf *Trotzdem öffnen* neben dem Namen der Anwendung.

Ab macOS 15 (Sequoia) lautet der Pfad *Systemeinstellungen* → *Datenschutz & Sicherheit* → weiter nach unten bis zum Abschnitt *Sicherheit*.

> **Hinweis.** Die macOS-Anwendung ist nicht mit einem Apple-Developer-Zertifikat signiert. Das wirkt sich auch darauf aus, wie Aktualisierungen gehandhabt werden, wie in Kapitel 12 erläutert.

---

## 2.4 Installation unter Linux

Es stehen zwei Vertriebsformate zur Verfügung:

- **AppImage** – portable ausführbare Datei, keine Installation nötig. Machen Sie die Datei ausführbar (`chmod +x`) und starten Sie sie direkt.
- **.deb-Paket** – für Debian/Ubuntu/Mint-Distributionen. Installieren Sie es mit `sudo dpkg -i dateiname.deb` oder öffnen Sie es mit der grafischen Paketverwaltung.

Auf manchen Distributionen kann es nötig sein, das Paket `libasound2` für die ALSA-Audiounterstützung zu installieren. Ziehen Sie die Dokumentation Ihrer Distribution zu Rate, falls die Anwendung nicht startet.

---

## 2.5 Der Begrüßungsbildschirm

![Der Begrüßungsbildschirm von Runtime Live Machine Pro, mit den Hauptaktionen und dem Sprachwähler.](../screenshots-de/schermata-benvenuto.png)

*Abbildung 2.1 – Der Begrüßungsbildschirm: Identität der Software, Update-Status, Hauptaktionen und Sprachwähler.*

Beim ersten Start – und bei jedem weiteren Start, solange Sie kein Projekt öffnen – zeigt RLMP den **Begrüßungsbildschirm**, den Einstiegspunkt für alle vorbereitenden Handlungen. Der Bereich ist in zwei Zonen geteilt.

**Linke Zone – Identität und Aktionen.**
Das Logo der Software (die Balken eines VU meter mit dem Play-Symbol) kennzeichnet die Pro-Version. Unter Titel und Slogan erscheint die Nummer der installierten Version, begleitet vom Status des Update-Systems:

- **„Neueste Version“** (grün) – Sie verwenden die aktuellste verfügbare Version.
- **„Update verfügbar“** (Bernstein, blinkend) – es ist eine Schaltfläche: Klicken Sie darauf, um das Update-Fenster zu öffnen (Kapitel 12).
- **„OFFLINE“** (gedämpftes Rot) – der Update-Dienst konnte nicht erreicht werden; die Software funktioniert trotzdem.

Darunter finden Sie die Hauptaktionen:

- *Neues Projekt* – legt eine leere Session an, mit ladebereiten Spalten.
- *Projekt laden* – öffnet eine bestehende `.lmp`-Datei. Bevor sie einsatzbereit wird, führt RLMP eine **Integritätsprüfung** durch: Es überprüft, ob jede referenzierte Audiodatei noch am gespeicherten Pfad vorhanden ist. Fehlende Dateien werden sofort mit einem roten Rahmen am jeweiligen Clip signalisiert.
- *Handbuch* – der Eintrag ist vorhanden, aber derzeit deaktiviert: Die aus der Software heraus abrufbare Dokumentation kommt in einer künftigen Version über das Web.

**Rechte Zone – Sprachwähler.**
RLMP unterstützt acht Oberflächensprachen: Englisch, Italienisch, Französisch, Deutsch, Spanisch, Portugiesisch, Russisch und vereinfachtes Chinesisch. Die aktive Sprache ist mit einem cyanfarbenen Rahmen und einem Häkchen hervorgehoben. Die Auswahl wirkt sofort und bleibt über die Sessions hinweg gespeichert.

---

## 2.6 Der erste Start: was Sie erwartet

Beim ersten Öffnen eines Projekts bemerken Sie im Header das Logo mit dem **PRO**-Badge im schillernden Farbverlauf. Hinter der Oberfläche startet das Öffnen des Projekts die Audio-Engine im Hintergrund: FFmpeg wird initialisiert, und das Streaming-Protokoll `media://` geht in Bereitschaft, um die Dateien von der Festplatte auszuliefern, ohne sie in den Speicher zu laden.

Die Software startet bevorzugt im Vollbildmodus. Sollte sich das Fenster verkleinert öffnen, drücken Sie `F11` (Windows/Linux) oder `Ctrl+Cmd+F` (macOS), um es in den Vollbildmodus zu bringen – die optimale Bedingung für die Regiearbeit.

Der **On-Air-Timer** im Header bleibt auf `--:--:--`, bis der erste Clip der Session gestartet wird. Ab diesem Moment beginnt er, die vergangene Sendezeit zu zählen: eine nützliche Referenz für alle, die mit fest getakteten Playlists arbeiten.
