# Kapitel 5 — Clip-Eigenschaften und Waveform-Editor

---

Jede Audiodatei hat ihre eigene Geschichte, bevor sie ins Raster gelangt: Aufnahmen mit Sekunden anfänglicher Stille, Titel mit endlosen Outros, Interviews mit einem Pegel, der viel zu niedrig ist im Vergleich zum Rest der Show. Statt bei jeder Datei, die nicht „sendefertig“ ist, auf einen externen Audio-Editor zurückzugreifen, stellt RLMP für jeden Clip ein Konfigurationspanel bereit, dazu einen visuellen Waveform-Editor mit Schnitt- und Markierungsfunktionen.

Alle über diese Werkzeuge vorgenommenen Änderungen sind **nicht destruktiv**: Die Originaldatei auf der Festplatte bleibt unverändert. RLMP speichert die Einstellungen in der Projektdatei `.lmp` und wendet sie während der Wiedergabe im laufenden Betrieb an.

Um die Einstellungen eines Clips zu öffnen, klicken Sie mit der **rechten Maustaste** auf die Karte.

---

## 5.1 Grundeigenschaften

![Das Fenster mit den Clip-Einstellungen, Reiter General.](../screenshots-de/impostazioni-clip.png)

*Abbildung 5.1 — Die Clip-Einstellungen: Clip Name, Color Label, Volume Gain, Playback Behavior, Next Action und Tastenzuweisung.*

### Name und Erscheinung

**Clip Name.** Sie können dem Clip einen individuellen Namen zuweisen, unabhängig vom Namen der Originaldatei. Der Name wird auf der Karte im Raster angezeigt. Verwenden Sie Namen, die beschreibend und im laufenden Betrieb nützlich sind: „ERÖFFNUNGS-KENNUNG“ ist besser lesbar als `kennung_rev3_final_def.mp3`, wenn Sie drei Sekunden haben, um den richtigen Clip zu finden.

**Color Label.** Standardmäßig erbt der Clip die Farbe der Spalte, zu der er gehört. Hier können Sie eine bestimmte Farbe zuweisen, damit er sich visuell abhebt. Nützlich, um kritische Clips zu kennzeichnen (z. B. die Schlusskennung) oder um thematische Gruppen innerhalb derselben Spalte zu unterscheiden.

### Volume Gain

Der Schieberegler Volume Gain reicht von 0 % bis 150 % und wirkt als Pre-Fader auf den einzelnen Clip, vor der globalen Master-Lautstärke.

Der häufigste Anwendungsfall ist die Pegelanpassung: Wenn Sie eine leise aufgenommene Sprachaufnahme haben (z. B. eine WhatsApp-Nachricht oder eine Telefonaufnahme), können Sie sie über 100 % anheben, um sie an die Lautstärke der anderen Spuren anzugleichen. Umgekehrt können Sie einen besonders „heißen“ Clip absenken, ohne die Master-Lautstärke anzutasten.

---

## 5.2 Der Waveform-Editor

![Der Waveform-Editor mit den Trim-Handles und den Struktur-Markern.](../screenshots-de/waveform-editor.png)

*Abbildung 5.2 — Der Waveform-Editor: Trim-Handles, Intro- und Outro-Marker, Auto-Trim, Smart Cues und Blenden.*

Der visuelle Editor ist die stärkste Funktion des Konfigurationspanels. Er nimmt die Mitte des Panels ein und zeigt die grafische Darstellung des Audios des gesamten Clips.

### Navigation im Editor

**Horizontaler Zoom.** Sie können die Ansicht der Wellenform von 1× (vollständige Ansicht) bis 8× vergrößern, mit Zwischenstufen (1×, 2×, 3×, 4×, 6×, 8×), über den Zoom-Schieberegler oder das Mausrad über dem Editor. Bei hohem Zoom folgt die Ansicht der aktuellen Position.

**Adaptives Lineal.** Die Zeitachse im oberen Teil des Editors passt sich automatisch dem Zoom an: In der vollständigen Ansicht zeigt sie grobe Bezugsmarken, bei maximalem Zoom verdichtet sie sie bis auf die Sekunden.

**Playhead.** Während der Vorschau-Wiedergabe läuft ein weißer senkrechter Indikator in Echtzeit entlang der Wellenform und zeigt die aktuelle Position. Ein Klick auf die Wellenform verschiebt die Wiedergabe an diese Stelle.

### Die vier Handles

Im Editor gibt es vier ziehbare **Handles**, jedes mit einer eigenen Funktion und Farbe:

**Trim Start (rotes Handle, links).** Legt den tatsächlichen Startpunkt des Clips fest. Alles, was sich links davon befindet, wird während der Wiedergabe übersprungen. Ziehen Sie es nach rechts, um Stille oder unerwünschte Teile am Anfang zu entfernen.

**Trim End (rotes Handle, rechts).** Legt den tatsächlichen Endpunkt fest. Alles, was rechts davon liegt, wird ignoriert. Ziehen Sie es nach links, um das Outro zu kürzen. Trim Start und Trim End dürfen sich nicht überschneiden.

**Intro Marker (cyanfarbenes Handle).** Markiert den strukturellen Punkt, an dem die Hauptmelodie des Titels einsetzt, nach dem eventuellen Vorspann. Einmal gesetzt, erscheint auf der laufenden Karte der Countdown **INTRO: −MM:SS**.

**Outro Marker (oranges Handle).** Markiert den Punkt, an dem das Outro des Titels beginnt, typischerweise der Moment, in dem man zu sprechen beginnt, um den Übergang zu füllen. Auf der Karte erscheint der Countdown **OUTRO IN: −MM:SS**. Ist der Wert mit dem Trim oder der Dauer nicht stimmig, deaktiviert die Software ihn und weist Sie darauf hin.

Neben dem Ziehen setzen vier *Set*-Schaltflächen jedes Handle auf die aktuelle Position des Playhead, für ein Markieren im laufenden Betrieb während des Abhörens. Die Werte bleiben in den jeweiligen Feldern präzise editierbar.

### Auto-Trim (Zauberstab)

Die Schaltfläche mit dem **Zauberstab**-Symbol startet die automatische Stilleerkennung über FFmpeg. Die Schwelle ist nicht fest: Die Software schätzt zuerst den mittleren Pegel der Datei und setzt die Stilleschwelle etwa 25 dB unter diesen Pegel (innerhalb eines Sicherheitsbereichs zwischen −55 und −20 dB; fehlt eine Schätzung, greift sie auf −40 dB zurück). Trim Start und Trim End werden so automatisch gesetzt und beseitigen anfängliche Stille und stumme Outros ohne manuellen Eingriff.

Diese Funktion ist besonders nützlich für unbearbeitete Sprachaufnahmen: Telefonate, Sprachnachrichten, auf Mobilgeräten aufgenommene Interviews. Auto-Trim auf die gesamte Spalte Stimme vor einer Show anzuwenden dauert weniger als eine Minute und verbessert die Sauberkeit der Übergänge.

> **Technischer Hinweis.** Die Analyse läuft im Main Process über FFmpeg, ohne die Datei im Renderer in den Speicher zu laden. Bei großen Dateien bleibt die Analysezeit in der Größenordnung weniger Sekunden.

### Smart Cues (automatische Markererkennung)

Neben Auto-Trim schlägt die Funktion **Smart Cues** automatisch die Intro- und Outro-Marker vor. Mit einer aggressiveren Schwelle erkennt sie den Punkt, an dem das Audio die volle Energie erreicht (Intro), und jenen, an dem die Schlussblende beginnt (Outro), und platziert die beiden Marker, ohne dass Sie sie nach Gehör suchen müssen.

### Vorschau des Übergangs

Gibt es einen **nachfolgenden** Clip in derselben Spalte, spielt die Schaltfläche **„Test →“** die letzten Sekunden des aktuellen Clips ab und lässt den Übergang zum nächsten auslösen, direkt im Editor. Während der Vorschau bricht eine *Stop*-Schaltfläche den Test ab.

---

## 5.3 Verhaltensweisen und Automatisierung

### Playback Behavior (Überlagerungsmodus)

**Normal** — das Standardverhalten. Wenn dieser Clip gestartet wird, unterbricht er jeden anderen laufenden Clip in derselben Spalte (mit Fade Out). Es ist das richtige Verhalten für Songs und Beds: ein Song schließt die anderen aus.

**Stacco (Jingle)** — der Clip wird gestartet, ohne die anderen zu unterbrechen. Er hat hohe Priorität: Er blendet die anderen Assets der Spalte stumm und senkt die Musik ab, stoppt aber nichts. Der typische Anwendungsfall ist eine *Station-ID* („Sie hören…“), die über dem Intro eines Titels „reiten“ soll, oder ein kurzer Jingle über einem Bed in loop.

### Next Action (Automatisierung am Ende)

Legt fest, was geschieht, wenn der Clip den Punkt Trim End erreicht.

**Stop** — das Standardverhalten für Musik, Stimme und Assets. Der Clip endet und stoppt.

**Play Next** — wenn sich der Clip dem Ende nähert, startet er automatisch den nächsten Clip der Spalte mit dem konfigurierten Übergang. Das Badge **NEXT** erscheint auf der Karte. Es ist das Standardverhalten der Spalte Pre-Show und erzeugt de facto eine automatische Playlist: Sie können es über mehrere aufeinanderfolgende Clips einstellen, um Blöcke zu bauen, die ohne Unterbrechung durchlaufen.

Die Wiedergabe in **loop** ist eine eigene Option: Wenn sie aktiv ist, beginnt der Clip nahtlos von vorn (ab Trim Start), und auf der Karte erscheint das Badge **LOOP**. Nutzen Sie sie für Musikbetten, Klangumgebungen oder Hintergrundkennungen, die laufen sollen, bis sie ausdrücklich gestoppt werden. Die Übergangsmodi — Crossfade, Segue, Gapless — sind in Kapitel 13 beschrieben.

---

## 5.4 Blenden (Fade In und Fade Out)

Das Panel erlaubt es, für den einzelnen Clip die Dauer der Ein- und Ausblenden festzulegen. Die Werte reichen von 0 bis 60.000 Millisekunden (60 Sekunden), und die angewandte Kurve ist linear.

**Fade In.** Die Zeit, die die Lautstärke ab dem Start braucht, um den Maximalpegel zu erreichen. Ein Wert von 2000 ms erzeugt einen sanften Anstieg von zwei Sekunden. Nutzen Sie ihn bei Musikbetten, die weich hervortreten sollen; halten Sie ihn bei 0 für Stimmen und Effekte, die sofort hörbar sein müssen.

**Fade Out.** Die Blendzeit beim Schließen — sowohl beim Klick auf einen aktiven Clip als auch bei den Übergängen. Typische Werte: 2000–3000 ms für Songs, 500–1000 ms für Beds, 0 ms für harte Stacchi.

Ein Fade Out von 0 ms erzeugt ein sofortiges Schließen („hard cut“). Bei einem Musiktitel in der Sendung kann das wie ein technischer Fehler wirken: Überlegen Sie genau, wann es angebracht ist.

---

## 5.5 Steuerungszuweisung

Jeder Clip kann auch über eine Tastaturtaste oder einen MIDI-Controller gestartet werden.

**Global Keybind.** Die dem Clip zugewiesene Tastaturtaste. Sie können sie über das eigene Feld in den Clip-Einstellungen festlegen (klicken und die gewünschte Taste drücken) oder über das Fenster **Tastenbelegung**, erreichbar aus dem Menü Werkzeuge. Das zugehörige Badge erscheint auf der Karte. Ist die Taste bereits einem anderen Clip zugewiesen, meldet die Software den Konflikt, bevor sie überschreibt.

**MIDI Bind.** Die zugewiesene MIDI-Note (z. B. `NOTE:60`). Die Zuweisung erfolgt über den Modus **MIDI Learn** (siehe Kapitel 8), nicht durch händisches Eintippen der Nummer.

Die Bindings der Clips werden in der Projektdatei gespeichert: Bringen Sie das Projekt auf einen anderen Computer mit demselben MIDI-Controller, funktionieren die Zuordnungen ohne Neukonfiguration.
