# Kapitel 8 – Hardware, Tastatur und MIDI

---

Runtime Live Machine Pro fügt sich ohne aufwendige Konfiguration in die vorhandene Hardware des Studios ein. Dieses Kapitel zeigt, wie Sie den Audioausgang leiten, die Computertastatur als Controller nutzen und physische MIDI-Geräte für eine taktile Steuerung der Regie anschließen.

---

## 8.1 Audio-Routing

### Das Ausgabegerät wählen

Standardmäßig gibt RLMP über das Standard-Audiogerät des Betriebssystems aus. In einem professionellen oder semiprofessionellen Umfeld – mit USB-Mixern, externen Soundkarten oder Mehrspursystemen – lohnt es sich, das Ziel des Signals ausdrücklich festzulegen.

1. Öffnen Sie die **Einstellungen** aus dem Menü Werkzeuge.
2. Öffnen Sie im Reiter *Audio & Mix* das Menü des Ausgabegeräts: Dort steht die Liste aller auf dem System verfügbaren Audiogeräte.
3. Wählen Sie das gewünschte Gerät.

Wird das gewählte Gerät getrennt, greift RLMP automatisch auf das Systemgerät zurück; die App überwacht die Verbindungen und reagiert auf das Ein- oder Ausstecken von USB-Geräten.

### USB-Mixer und Mehrkanal-Setup

USB-Mixer wie der Rødecaster Pro, der RØDECaster Duo oder das Focusrite Scarlett stellen dem Betriebssystem typischerweise mehrere USB-Kanäle bereit (Main Mix, Sounds/Chat, Monitor usw.). RLMP tritt dabei als eine einzige Stereoquelle auf; welchem USB-Kanal Sie es zuweisen, entscheiden Sie selbst.

**Empfohlenes Setup mit USB-Mixer.** Weisen Sie RLMP einem sekundären Kanal des Mixers zu (etwa „Sounds“ am Rødecaster Pro) statt dem Hauptkanal. So steuern Sie die Lautstärke von RLMP über einen eigenen physischen Fader, trennen es vom Signal des physischen Mikrofons und wenden eventuelles Hardware-Processing nur auf diesen einen Kanal an.

### Latenz und Buffer

RLMP nutzt die nativen Audio-APIs des Betriebssystems. Die Ausgangslatenz bestimmt der Buffer des Audiogeräts, nicht die Software. Mit professionellen Soundkarten liegt sie im Bereich weniger Millisekunden – im Playout-Kontext nicht wahrnehmbar.

Fallen Ihnen Audio-Artefakte auf, etwa Knistern oder Dropouts, steht der Buffer-Wert des Geräts wahrscheinlich zu niedrig. Erhöhen Sie ihn im Bedienfeld der Soundkarte selbst, nicht in RLMP, das den Treiber nicht direkt verwaltet: Ein Buffer von 256 oder 512 Samples trifft meist den besten Ausgleich zwischen Latenz und Stabilität.

---

## 8.2 Tastatursteuerung

Die Computertastatur ist der schnellste Controller, den Sie während der Sendung zur Hand haben: Sie braucht keine Hand-Auge-Koordination, funktioniert im Dunkeln und liegt immer griffbereit. RLMP bietet dafür eine Reihe globaler Kürzel sowie die Möglichkeit, einzelnen Clips eigene Tasten zuzuweisen.

### Globale Kürzel

| Taste | Aktion |
|---|---|
| **Esc** | STOP ALL – stoppt alle aktiven Clips |
| **Entf / Backspace** | Löscht die ausgewählten Clips |
| **Ctrl+Z** | Macht die letzte Änderung der Playlist rückgängig |
| **Ctrl+Y** (oder **Ctrl+Shift+Z**) | Wiederholt die rückgängig gemachte Änderung |
| **Ctrl+Shift+D** | Blendet das Debug-Overlay ein/aus |
| **Ctrl+Shift+M** | Öffnet den MIDI-Simulator (zum Testen ohne Controller) |

`Esc` wirkt als STOP ALL, sobald RLMP das aktive Fenster ist – auch wenn der Cursor gerade in einem Textfeld steht. Auf Betriebssystemebene ist das Kürzel allerdings nicht mehr registriert: Läuft die App im Hintergrund, holen Sie das Fenster zuerst in den Vordergrund.

> **Hinweis.** Funktionstasten (F1–F5) sind dem Start der Spalten nicht vorab zugewiesen. Wer einen bestimmten Clip schnell starten will, weist ihm wie unten beschrieben eine eigene Taste zu.

### Individuelle Tasten je Clip

Über die globalen Kürzel hinaus kann jeder Clip eine eigene Taste bekommen. Das zugehörige Badge erscheint dann auf der Karte.

**Um eine Taste zuzuweisen:**
1. Öffnen Sie die Clip-Einstellungen (Rechtsklick auf die Karte) oder das Fenster **Tastenbelegung** aus dem Menü Werkzeuge.
2. Klicken Sie in das Tastenfeld.
3. Drücken Sie die gewünschte Taste.

**Verfügbare Tasten.** Nahezu jede Taste steht offen: Buchstaben (A–Z), Zahlen (0–9), Ziffernblock, Leertaste, freie Funktionstasten. Ist eine Taste bereits vergeben, meldet die Software den Konflikt, bevor sie überschreibt – so entstehen keine unsichtbaren Dopplungen.

**Sicherheit während der Eingabe.** Sobald Sie im Texteingabemodus sind – etwa beim Umbenennen eines Clips oder beim Schreiben einer Notiz –, deaktivieren sich die individuellen Tasten automatisch. Versehentliche Starts während des Tippens sind damit ausgeschlossen.

---

## 8.3 MIDI-Controller

MIDI ist die professionelle Wahl, wenn Steuerung physisch, taktil und zuverlässig sein soll. RLMP unterstützt USB-MIDI-Controller: Tastaturen, Pads (etwa das Novation Launchpad), Fader-Controller (etwa das Korg nanoKONTROL2), hybride Steuerungsflächen.

### Anschluss

Schließen Sie den USB-Controller an den Computer an und starten Sie RLMP. Die Software erkennt die Geräte über die Web MIDI API des Systems und registriert Anschließen und Trennen eines Controllers in Echtzeit. Die meisten USB-MIDI-Controller sind *class-compliant* und brauchen keine Treiber; bei professionellen Flächen mit proprietären Treibern installieren Sie diesen, bevor Sie das Gerät anschließen.

### MIDI Learn

Weder die Nummerierung der MIDI-Noten müssen Sie kennen, noch die Nachrichten von Hand konfigurieren. Das Lernen übernimmt der Modus **MIDI Learn**, erreichbar über das Menü Werkzeuge oder das Fenster Tastenbelegung.

**Um einen Clip einer Taste/einem Pad zuzuordnen:**
1. Aktivieren Sie MIDI Learn. Die Karten gehen in den Wartezustand.
2. Wählen Sie den zuzuordnenden Clip (oder die Zelle des pad FX).
3. Spielen Sie die Note, drücken Sie das Pad oder die Taste am Controller. Auf der Karte erscheint das Badge `M` mit der Notennummer.

**Um die globalen Funktionen zuzuordnen:**
- Wählen Sie **STOP ALL** und drücken Sie eine Taste am Controller – diese führt fortan Stop All aus.
- Wählen Sie die **Master-Lautstärke** und bewegen Sie einen Fader oder ein Drehrad – dieses Steuerelement regelt danach die Master-Lautstärke stufenlos.

Zum Abschluss deaktivieren Sie MIDI Learn wieder, um in den Betriebsmodus zurückzukehren.

### Unterstützte Nachrichtentypen

**Note On** – Nachrichten von Tasten, Pads und Klaviaturtasten, ideal für den Start von Clips und globalen Aktionen. RLMP reagiert auf den Tastendruck und erkennt alle MIDI-Kanäle; Note-Off-Nachrichten werden ignoriert.

**Control Change (CC)** – Nachrichten von Fadern und Potentiometern, mit stufenlosem Wert von 0 bis 127. Ideal für die Master-Lautstärke: Ein physischer, auf den Master gelegter Fader bietet die natürlichste Kontrolle über den Ausgangspegel.

### Portabilität der Zuordnungen

Die MIDI-Zuordnungen der **Clips** speichert die Projektdatei `.lmp`: Wandert das Projekt auf einen anderen Computer mit demselben Controller, funktionieren sie ohne Neukonfiguration. Die Zuordnungen der **globalen Funktionen** (Stop All, Master-Lautstärke) sind dagegen an den Computer gebunden – gespeichert in den lokalen Voreinstellungen der Anwendung – und bleiben für alle Projekte auf dieser Maschine gültig.
