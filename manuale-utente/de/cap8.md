# Kapitel 8 – Hardware, Tastatur und MIDI

---

Runtime Live Machine Pro ist darauf ausgelegt, sich ohne aufwendige Konfigurationen in die vorhandene Hardware des Studios einzufügen. Dieses Kapitel beschreibt, wie Sie den Audioausgang leiten, wie Sie die Computertastatur als Controller nutzen und wie Sie physische MIDI-Geräte für eine taktile Steuerung der Regie anschließen.

---

## 8.1 Audio-Routing

### Das Ausgabegerät wählen

Standardmäßig gibt RLMP über das Standard-Audiogerät des Betriebssystems aus. In einem professionellen oder semiprofessionellen Umfeld, mit USB-Mixern, externen Soundkarten oder Mehrspursystemen, ist es sinnvoll, das Ziel des Signals ausdrücklich zu wählen.

1. Öffnen Sie die **Einstellungen** aus dem Menü Werkzeuge.
2. Öffnen Sie im Reiter *Audio & Mix* das Menü des Ausgabegeräts: Dort finden Sie die Liste der auf dem System verfügbaren Audiogeräte.
3. Wählen Sie das gewünschte Gerät.

Wird das gewählte Gerät getrennt, greift RLMP automatisch auf das des Systems zurück; die App überwacht die Verbindungen und reagiert auf das Ein- oder Ausstecken von USB-Geräten.

### USB-Mixer und Mehrkanal-Setup

USB-Mixer wie der Rødecaster Pro, der RØDECaster Duo oder das Focusrite Scarlett stellen dem Betriebssystem typischerweise mehrere USB-Kanäle bereit (Main Mix, Sounds/Chat, Monitor usw.). RLMP erscheint als eine einzige Stereoquelle; die Wahl des USB-Kanals, auf den es geleitet wird, liegt in Ihrer Hand.

**Empfohlenes Setup mit USB-Mixer.** Weisen Sie RLMP einem sekundären Kanal des Mixers zu (z. B. „Sounds“ am Rødecaster Pro) statt dem Hauptkanal. So steuern Sie die Lautstärke von RLMP mit einem eigenen physischen Fader, trennen es vom Signal des physischen Mikrofons und wenden eventuelles Hardware-Processing nur auf diesen Kanal an.

### Latenz und Buffer

RLMP nutzt die nativen Audio-APIs des Betriebssystems. Die Ausgangslatenz wird vom Buffer des Audiogeräts bestimmt, nicht von der Software. Mit professionellen Soundkarten liegt die Latenz in der Größenordnung weniger Millisekunden, in einem Playout-Kontext nicht wahrnehmbar.

Wenn Sie Audio-Artefakte bemerken (Knistern, Dropouts), ist der Buffer-Wert des Geräts wahrscheinlich zu niedrig. Erhöhen Sie ihn im Bedienfeld der Soundkarte (nicht in RLMP, das den Treiber nicht direkt verwaltet): Ein Buffer von 256 oder 512 Samples ist der ideale Ausgleichspunkt zwischen Latenz und Stabilität.

---

## 8.2 Tastatursteuerung

Die Computertastatur ist der schnellste in der Sendung verfügbare Controller: Sie erfordert keine Hand-Auge-Koordination, funktioniert im Dunkeln und ist immer griffbereit. RLMP sieht eine Reihe globaler Kürzel vor sowie die Möglichkeit, den einzelnen Clips Tasten zuzuweisen.

### Globale Kürzel

| Taste | Aktion |
|---|---|
| **Esc** | STOP ALL – stoppt alle aktiven Clips |
| **Entf / Backspace** | Löscht die ausgewählten Clips |
| **Ctrl+Z** | Macht die letzte Änderung der Playlist rückgängig |
| **Ctrl+Y** (oder **Ctrl+Shift+Z**) | Wiederholt die rückgängig gemachte Änderung |
| **Ctrl+Shift+D** | Blendet das Debug-Overlay ein/aus |
| **Ctrl+Shift+M** | Öffnet den MIDI-Simulator (zum Testen ohne Controller) |

`Esc` wirkt als STOP ALL, wenn RLMP das aktive Fenster ist, auch während der Cursor in einem Textfeld steht. Es ist kein auf Betriebssystemebene registriertes Kürzel mehr: Ist die App im Hintergrund, holen Sie das Fenster erst in den Vordergrund.

> **Hinweis.** Es gibt keine Funktionstasten (F1–F5), die dem Start der Spalten vorab zugewiesen wären. Um einen bestimmten Clip schnell zu starten, weisen Sie ihm eine eigene Taste zu, wie unten beschrieben.

### Individuelle Tasten je Clip

Über die globalen Kürzel hinaus kann jeder Clip eine eigene Taste haben. Das zugehörige Badge erscheint auf der Karte.

**Um eine Taste zuzuweisen:**
1. Öffnen Sie die Clip-Einstellungen (Rechtsklick auf die Karte) oder das Fenster **Tastenbelegung** aus dem Menü Werkzeuge.
2. Klicken Sie in das Tastenfeld.
3. Drücken Sie die gewünschte Taste.

**Verfügbare Tasten.** Nahezu jede Taste: Buchstaben (A–Z), Zahlen (0–9), Ziffernblock, Leertaste, freie Funktionstasten. Ist die Taste bereits einem anderen Clip zugewiesen, meldet die Software den Konflikt, bevor sie überschreibt, sodass Sie keine unsichtbaren Dopplungen erzeugen.

**Sicherheit während der Eingabe.** Die individuellen Tasten werden automatisch deaktiviert, wenn Sie sich im Texteingabemodus befinden (Sie benennen einen Clip um oder schreiben eine Notiz). Das verhindert versehentliche Starts während des Tippens.

---

## 8.3 MIDI-Controller

MIDI ist die professionelle Wahl für eine physische, taktile und zuverlässige Steuerung. RLMP unterstützt USB-MIDI-Controller: Tastaturen, Pads (z. B. Novation Launchpad), Fader-Controller (z. B. Korg nanoKONTROL2), hybride Steuerungsflächen.

### Anschluss

Schließen Sie den USB-Controller an den Computer an und starten Sie RLMP. Die Software erkennt die Geräte über die Web MIDI API des Systems und erkennt in Echtzeit das Anschließen und Trennen eines Controllers. Die meisten USB-MIDI-Controller sind *class-compliant* und benötigen keine Treiber; für professionelle Flächen mit proprietären Treibern installieren Sie den Treiber, bevor Sie das Gerät anschließen.

### MIDI Learn

RLMP verlangt weder, die Nummerierung der MIDI-Noten zu kennen, noch die Nachrichten von Hand zu konfigurieren. Das Lernen erfolgt über den Modus **MIDI Learn**, aus dem Menü Werkzeuge (oder aus dem Fenster Tastenbelegung).

**Um einen Clip einer Taste/einem Pad zuzuordnen:**
1. Aktivieren Sie MIDI Learn. Die Karten gehen in den Wartezustand.
2. Wählen Sie den zuzuordnenden Clip (oder die Zelle des pad FX).
3. Spielen Sie die Note, drücken Sie das Pad oder die Taste am Controller. Das Badge `M` mit der Notennummer erscheint auf der Karte.

**Um die globalen Funktionen zuzuordnen:**
- Wählen Sie **STOP ALL** und drücken Sie eine Taste am Controller: Diese Taste führt dann Stop All aus.
- Wählen Sie die **Master-Lautstärke** und bewegen Sie einen Fader oder ein Drehrad: Dieses Steuerelement regelt dann die Master-Lautstärke stufenlos.

Deaktivieren Sie zum Abschluss MIDI Learn, um in den Betriebsmodus zurückzukehren.

### Unterstützte Nachrichtentypen

**Note On** – Nachrichten von Tasten, Pads und Klaviaturtasten. Ideal für den Start der Clips und der globalen Aktionen; RLMP reagiert auf den Tastendruck und erkennt alle MIDI-Kanäle. Note-Off-Nachrichten werden ignoriert.

**Control Change (CC)** – Nachrichten von Fadern und Potentiometern, mit stufenlosem Wert von 0 bis 127. Ideal für die Master-Lautstärke: Ein auf den Master gelegter physischer Fader bietet die natürlichste Kontrolle über den Ausgangspegel.

### Portabilität der Zuordnungen

Die MIDI-Zuordnungen der **Clips** werden in der Projektdatei `.lmp` gespeichert: Bringen Sie das Projekt auf einen anderen Computer mit demselben Controller, funktionieren sie ohne Neukonfiguration. Die Zuordnungen der **globalen Funktionen** (Stop All, Master-Lautstärke) sind hingegen an den Computer gebunden, in den lokalen Voreinstellungen der Anwendung gespeichert, und bleiben für alle Projekte auf dieser Maschine gültig.
