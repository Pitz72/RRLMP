# Kapitel 14 – Problembehebung und FAQ

---

Dieses Kapitel versammelt die häufigsten Probleme im täglichen Umgang mit Runtime Live Machine Pro samt den passenden Lösungen. Jeder Abschnitt beschreibt das Symptom, die wahrscheinlichste Ursache und den Weg zur Behebung.

---

## 14.1 Audio-Probleme

### Der Timer läuft, die VU-Meter schlagen aus, aber zu hören ist nichts

Die Software gibt korrekt wieder – das Signal liegt im internen Bus vor –, erreicht aber das Abhörgerät nicht.

**Prüfen Sie der Reihe nach:**

1. **Master-Lautstärke.** Steht der Schieberegler im Header auf null? Bringen Sie ihn auf 100 %.
2. **Ausgabegerät.** Öffnen Sie die Einstellungen → *Audio & Mix* und kontrollieren Sie, welches Gerät ausgewählt ist. Windows und macOS ändern mitunter die Bezeichnung von USB-Geräten, wenn diese getrennt und wieder angeschlossen werden. Stimmt der Name nicht mit dem physisch verbundenen Gerät überein, wählen Sie es erneut aus.
3. **Externer Mixer.** Läuft das Signal über einen Hardware-Mixer, prüfen Sie, ob der Kanalfader nicht abgesenkt oder auf Mute steht und ob der Mixer-Ausgang mit den Monitoren oder der Sendekette verbunden ist.

### Das Audio springt, knistert oder setzt aus

Im Normalbetrieb arbeitet die Audio-Engine robust gegen solche Artefakte. Treten sie dennoch auf, liegt die Ursache fast immer außerhalb der Software.

- **CPU unter extremer Last.** Schließen Sie parallel laufende, ressourcenhungrige Anwendungen wie Videoschnitt, Rendering oder umfangreiche Backups.
- **Audio-Buffer zu niedrig.** Kontrollieren Sie bei einer professionellen Soundkarte den Buffer-Wert im Bedienfeld des Treibers. 256 oder 512 Samples bilden meist den richtigen Ausgleich; unter 128 Samples drohen Dropouts.
- **Langsame oder ausgelastete Festplatte.** RLMP streamt Audio direkt von der Festplatte. Eine langsame mechanische Platte oder eine fast volle SSD kann bei großen Dateien zu Aussetzern führen.

### Der Audiopegel ist zu niedrig oder zu hoch

- **Gain je Clip.** Regeln Sie den Volume Gain in den Clip-Eigenschaften (Rechtsklick → Abschnitt Volume Gain).
- **Master-Lautstärke.** Stimmt der Gesamtpegel nicht, greifen Sie zum Schieberegler im Header.
- **Angleichung und Master Chain.** Die Lautstärke-Angleichung bringt die Clip-Pegel auf eine gemeinsame Referenz, während der Glue der Master Chain den Klang kompakter machen kann. Überzeugt Sie das Ergebnis nicht, lassen sich diese Stufen unter Einstellungen → Master Chain anpassen oder abschalten.

---

## 14.2 Rote Clips und fehlende Dateien

### Eine Karte ist rot geworden („DATEI FEHLT“) und reagiert nicht auf Klicks

Der rote Rahmen zeigt an, dass die Audiodatei unter dem im Projekt gespeicherten Pfad nicht erreichbar ist.

**Mögliche Ursachen:**

- Die Datei wurde auf der Festplatte verschoben oder umbenannt.
- Sie lag auf einer externen Festplatte oder einem USB-Stick, der inzwischen abgetrennt ist.
- Das Projekt wurde auf einem anderen Computer geöffnet, dessen Pfade nicht übereinstimmen.

**Lösungen:**

1. **Festplatte wieder anschließen.** Lag die Datei auf einem externen Laufwerk, verbinden Sie es erneut.
2. **Datei an die ursprüngliche Position zurückbringen.** Wurde sie verschoben, legen Sie sie wieder an den ursprünglichen Pfad.
3. **Clip ersetzen.** Ziehen Sie die richtige Datei erneut ins Raster und löschen Sie die rote Karte.
4. **Künftig Eigenständiges Archiv exportieren nutzen.** Am wirksamsten beugen Sie vor, indem Sie ein Archiv erstellen, bevor Sie das Projekt verschieben oder übertragen (Kapitel 10).

---

## 14.3 MIDI-Probleme

### Der Controller wird nicht erkannt

1. **Anschluss.** Prüfen Sie, ob der Controller angeschlossen und vom Betriebssystem erkannt ist. RLMP registriert das Anschließen und Trennen der Geräte in Echtzeit; bleibt die Erkennung aus, trennen Sie das USB-Kabel und stecken Sie es erneut ein.
2. **Treiber.** Die meisten USB-MIDI-Controller sind *class-compliant* und kommen ohne Treiber aus. Bei professionellen Controllern mit herstellereigenen Treibern prüfen Sie, ob dieser installiert ist.
3. **Prüfung im Learn-Modus.** Aktivieren Sie MIDI Learn und drücken Sie eine Taste am Controller – empfängt die Karte die Zuordnung, ist der Controller erkannt.

### Die zugeordneten Clips reagieren nicht auf die Tasten des Controllers

- **Der Modus MIDI Learn ist noch aktiv.** Solange MIDI Learn läuft, registrieren die Controller-Tasten neue Zuordnungen, statt Clips auszuführen. Deaktivieren Sie den Modus über das Menü Werkzeuge.
- **Die Zuordnung ist verloren gegangen.** Clip-Zuordnungen liegen in der `.lmp`-Datei – prüfen Sie, ob das Projekt nach der MIDI-Learn-Session gespeichert wurde. Zuordnungen globaler Funktionen sind dagegen an den jeweiligen Computer gebunden.

---

## 14.4 Startprobleme

### Die Anwendung startet nicht unter macOS (Gatekeeper-Warnung)

Siehe Abschnitt 2.3: Freigabe über *Systemeinstellungen → Datenschutz & Sicherheit*.

### Die Anwendung startet nicht unter Windows (SmartScreen-Warnung)

Siehe Abschnitt 2.2. Klicken Sie auf *Weitere Informationen* und dann auf *Trotzdem ausführen*.

### Ungewöhnliches Verhalten beim Start

Verhält sich die Software beim Öffnen unerwartet, schließen Sie RLMP und starten Sie es neu. Besteht das Problem fort, prüfen Sie, ob der Installationspfad Sonderzeichen enthält, die das Laden der FFmpeg-Komponenten stören könnten.

---

## 14.5 Häufige Fragen

**Kann RLMP ein Radio 24 Stunden lang unbeaufsichtigt automatisieren?**
Nein. RLMP ist für die Live-Regie ausgelegt – für Shows, die ein Operator betreut. Weder eine zeitliche Programmplanung noch eine automatische Playlist-Rotation gehören zum Funktionsumfang. Die Automix-Ansicht bietet eine begrenzte, freiwillige Automatisierung allein des Musikflusses, die nur aktiv ist, solange die Ansicht geöffnet bleibt (Kapitel 7). Für die 24/7-Automatisierung gibt es eigene Software wie Zara Radio, PlayIt Live oder Rivendell, die andere Bedürfnisse abdeckt.

**Was ist der Unterschied zwischen Speichern und Speichern unter?**
*Projekt speichern* überschreibt still die geöffnete `.lmp`-Datei. *Speichern unter…* öffnet stets einen Dialog und legt eine neue Datei an, ohne die aktuelle anzurühren.

**Kann ich RLMP auf einem iPad oder auf Mobilgeräten nutzen?**
Nicht als Hauptanwendung – RLMP ist Desktop-Software für Windows, macOS und Linux. Ein Tablet oder Smartphone kann aber über den Browser als **Fernbedienung** dienen, mittels Controllo Remoto (Kapitel 11).

**Sind die `.lmp`-Dateien früherer Versionen mit 1.11.5 kompatibel?**
Ja. Öffnen Sie ein mit einer früheren Version erstelltes Projekt, aktualisiert RLMP dessen Struktur automatisch – einschließlich zwischenzeitlich hinzugefügter Spalten –, ohne die Datei zu verändern, solange Sie nicht selbst speichern.

**Wie aktualisiere ich RLMP auf eine neue Version?**
Die Software prüft beim Start auf Aktualisierungen und macht Sie darauf aufmerksam. Unter Windows und Linux AppImage läuft die Installation direkt aus dem Update-Fenster; unter macOS und Linux `.deb` öffnet sich der Browser auf der Download-Seite. Alle Details dazu in Kapitel 12.

**Wo werden die automatischen Backups gespeichert?**
Im Ordner `autosaves` innerhalb des Datenverzeichnisses der Anwendung (`%APPDATA%\runtime-live-machine-pro\autosaves\` unter Windows, entsprechende Pfade unter macOS und Linux, Kapitel 10). Aufbewahrt werden die zehn jüngsten Momentaufnahmen.

**Funktioniert die Software offline?**
Ja, vollständig. RLMP benötigt keine Internetverbindung, um zu laufen. Das Netzwerk kommt nur für die optionale Update-Prüfung und für das optionale Controllo Remoto im lokalen Netzwerk zum Einsatz.

**Das Controllo Remoto verbindet sich nicht. Woran liegt das?**
Prüfen Sie, ob sich das entfernte Gerät im **selben Netzwerk** wie der Computer befindet, ob Sie den **korrekten PIN** eingegeben haben (er wechselt bei jedem Start) und ob Sie die in den Einstellungen angezeigte Adresse verwenden. Denken Sie daran, dass das Controllo Remoto bei jedem Anwendungsstart deaktiviert neu startet (Kapitel 11).
