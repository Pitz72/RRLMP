# Kapitel 14 – Problembehebung und FAQ

---

Dieses Kapitel versammelt die häufigsten Probleme im täglichen Umgang mit Runtime Live Machine Pro, mit den jeweiligen Lösungen. Jeder Abschnitt beschreibt das Symptom, die wahrscheinlichste Ursache und den Weg zur Behebung.

---

## 14.1 Audio-Probleme

### Der Timer läuft und die VU meter bewegen sich, aber es ist nichts zu hören

Die Software gibt korrekt wieder (das Signal ist im internen Bus vorhanden), aber es erreicht das Abhörgerät nicht.

**Prüfen Sie der Reihe nach:**

1. **Master-Lautstärke.** Steht der Schieberegler im Header auf null? Bringen Sie ihn auf 100 %.
2. **Ausgabegerät.** Öffnen Sie die Einstellungen → *Audio & Mix* und kontrollieren Sie, welches Gerät ausgewählt ist. Windows und macOS können den Bezeichner von USB-Geräten ändern, wenn sie getrennt und wieder angeschlossen werden. Stimmt der Name nicht mit dem physisch verbundenen überein, wählen Sie es erneut aus.
3. **Externer Mixer.** Erreicht das Signal einen Hardware-Mixer, kontrollieren Sie, ob der Fader des Kanals nicht abgesenkt oder auf Mute steht und ob der Ausgang des Mixers mit den Monitoren oder der Sendekette verbunden ist.

### Das Audio springt, knistert oder hat Aussetzer

Im Normalzustand ist die Audio-Engine robust gegenüber diesen Artefakten. Treten sie auf, liegt die Ursache fast immer außerhalb der Software.

- **CPU unter extremer Last.** Schließen Sie schwere gleichzeitig laufende Anwendungen (Videoschnitt, Rendering, intensive Backups).
- **Audio-Buffer zu niedrig.** Kontrollieren Sie bei einer professionellen Soundkarte den Buffer-Wert im Bedienfeld des Treibers. Ein Wert von 256 oder 512 Samples ist der richtige Ausgleich; unter 128 Samples können Dropouts auftreten.
- **Langsame oder ausgelastete Festplatte.** RLMP streamt das Audio von der Festplatte. Eine langsame mechanische Festplatte oder eine fast volle SSD kann bei großen Dateien Aussetzer verursachen.

### Der Audiopegel ist zu niedrig oder zu hoch

- **Gain je Clip.** Regeln Sie den Volume Gain in den Eigenschaften des Clips (Rechtsklick → Abschnitt Volume Gain).
- **Master-Lautstärke.** Ist der Gesamtpegel falsch, wirken Sie auf den Schieberegler im Header ein.
- **Angleichung und Master Chain.** Die Lautstärke-Angleichung nähert die Pegel der Clips einer gemeinsamen Referenz an; der glue der Master Chain kann den Klang kompakter machen. Wenn ein Ergebnis Sie nicht überzeugt, können Sie diese Stufen in den Einstellungen → Master Chain regeln oder deaktivieren.

---

## 14.2 Rote Clips und fehlende Dateien

### Eine Karte ist rot geworden („DATEI FEHLT“) und reagiert nicht auf den Klick

Der rote Rahmen zeigt an, dass die Audiodatei am im Projekt gespeicherten Pfad nicht erreichbar ist.

**Mögliche Ursachen:**

- Die Datei wurde auf der Festplatte verschoben oder umbenannt.
- Die Datei lag auf einer externen Festplatte oder einem USB-Stick, der nun getrennt ist.
- Das Projekt wurde auf einem anderen Computer geöffnet, wo die Pfade nicht übereinstimmen.

**Lösungen:**

1. **Festplatte wieder anschließen.** Lag die Datei auf einem externen Laufwerk, schließen Sie es wieder an.
2. **Datei an die ursprüngliche Position zurückbringen.** Wurde sie verschoben, legen Sie sie wieder an den ursprünglichen Pfad.
3. **Clip ersetzen.** Ziehen Sie die korrekte Datei erneut ins Raster und löschen Sie die rote Karte.
4. **Künftig Eigenständiges Archiv exportieren nutzen.** Die wirksamste Vorbeugung ist, ein Archiv zu erstellen, bevor Sie das Projekt verschieben oder übertragen (Kapitel 10).

---

## 14.3 MIDI-Probleme

### Der Controller wird nicht erkannt

1. **Anschluss.** Prüfen Sie, ob der Controller angeschlossen und vom Betriebssystem erkannt ist. RLMP erkennt das Anschließen und Trennen der Geräte in Echtzeit; erscheint er nicht, trennen Sie das USB-Kabel und schließen Sie es wieder an.
2. **Treiber.** Die meisten USB-MIDI-Controller sind *class-compliant* und benötigen keine Treiber. Prüfen Sie bei professionellen Flächen mit proprietären Treibern, ob der Treiber installiert ist.
3. **Prüfung im Learn-Modus.** Aktivieren Sie MIDI Learn und drücken Sie eine Taste am Controller: Empfängt die Karte die Zuordnung, ist der Controller erkannt.

### Die zugeordneten Clips reagieren nicht auf die Tasten des Controllers

- **Der Modus MIDI Learn ist noch aktiv.** In MIDI Learn registrieren die Tasten des Controllers neue Zuordnungen, statt die Clips auszuführen. Deaktivieren Sie den Modus aus dem Menü Werkzeuge.
- **Die Zuordnung ist verloren gegangen.** Die Zuordnungen der Clips liegen in der `.lmp`-Datei; prüfen Sie, ob das Projekt nach der MIDI-Learn-Session gespeichert wurde. Die Zuordnungen der globalen Funktionen sind hingegen an den einzelnen Computer gebunden.

---

## 14.4 Startprobleme

### Die Anwendung startet nicht unter macOS (Gatekeeper-Warnung)

Siehe Abschnitt 2.3: Freigabe über *Systemeinstellungen → Datenschutz & Sicherheit*.

### Die Anwendung startet nicht unter Windows (SmartScreen-Warnung)

Siehe Abschnitt 2.2. Klicken Sie auf *Weitere Informationen* und dann auf *Trotzdem ausführen*.

### Ungewöhnliches Verhalten beim Start

Wenn sich die Software beim Öffnen unerwartet verhält, schließen Sie RLMP und öffnen Sie es erneut. Besteht das Problem fort, prüfen Sie, ob der Installationspfad keine Sonderzeichen enthält, die das Laden der FFmpeg-Komponenten stören könnten.

---

## 14.5 Häufige Fragen

**Kann RLMP ein Radio 24 Stunden lang unbeaufsichtigt automatisieren?**
Nein. RLMP ist für die Live-Regie ausgelegt: von einem Operator betreute Shows. Es verfügt weder über eine zeitliche Programmplanung noch über eine automatische Rotation der Playlist. Die Automix-Ansicht bietet eine begrenzte, freiwillige Automatisierung allein des Musikflusses, aktiv, solange die Ansicht geöffnet ist (Kapitel 7). Für die 24/7-Automatisierung gibt es dedizierte Software (Zara Radio, PlayIt Live, Rivendell): Sie beantworten andere Bedürfnisse.

**Was ist der Unterschied zwischen Speichern und Speichern unter?**
*Projekt speichern* überschreibt die geöffnete `.lmp`-Datei, still. *Speichern unter…* öffnet stets den Dialog und erstellt eine neue Datei, ohne die aktuelle anzutasten.

**Kann ich RLMP auf einem iPad oder auf Mobilgeräten nutzen?**
Nicht als Hauptanwendung: RLMP ist eine Desktop-Software für Windows, macOS und Linux. Ein Tablet oder ein Telefon kann jedoch über den Browser als **Fernbedienung** dienen, mittels Controllo Remoto (Kapitel 11).

**Sind die `.lmp`-Dateien früherer Versionen mit 1.11.5 kompatibel?**
Ja. Beim Öffnen eines mit einer früheren Version erstellten Projekts aktualisiert RLMP automatisch dessen Struktur, einschließlich der zwischenzeitlich hinzugefügten Spalten, ohne die Datei zu verändern, bis Sie ein Speichern ausführen.

**Wie aktualisiere ich RLMP auf eine neue Version?**
Die Software prüft die Aktualisierungen beim Start und weist Sie darauf hin. Unter Windows und Linux AppImage erfolgt die Installation automatisch aus dem Update-Fenster; unter macOS und Linux `.deb` wird der Browser auf der Download-Seite geöffnet. Alle Details in Kapitel 12.

**Wo werden die automatischen Backups gespeichert?**
Im Ordner `autosaves` innerhalb des Datenverzeichnisses der Anwendung (`%APPDATA%\runtime-live-machine-pro\autosaves\` unter Windows; entsprechende Pfade unter macOS und Linux, Kapitel 10). Es werden die zehn jüngsten Momentaufnahmen aufbewahrt.

**Funktioniert die Software offline?**
Ja, vollständig. RLMP benötigt keine Internetverbindung, um zu funktionieren. Das Netzwerk wird nur für die Update-Prüfung (optional) und für das Controllo Remoto im lokalen Netzwerk (optional) verwendet.

**Das Controllo Remoto verbindet sich nicht. Warum?**
Prüfen Sie, ob das entfernte Gerät im **selben Netzwerk** wie der Computer ist, ob Sie den **korrekten PIN** eingegeben haben (er ändert sich bei jedem Start) und ob Sie die in den Einstellungen angezeigte Adresse verwenden. Denken Sie daran, dass das Controllo Remoto bei jedem Start der Anwendung ausgeschaltet neu startet (Kapitel 11).
