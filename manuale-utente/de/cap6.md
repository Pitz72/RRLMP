# KAPITEL 6: HARDWARE-STEUERUNG UND ROUTING

Eine professionelle Regie-Software lebt nicht isoliert im Computer. Sie muss mit dem Studio-Mischpult, den Kopfhörern und den Fingern des Regisseurs kommunizieren.
In diesem Kapitel sehen wir uns an, wie man den Audioausgang konfiguriert und wie man die Software steuert, ohne die Maus zu berühren.

---

## 6.1 Audio-Konfiguration (Routing)

Standardmäßig gibt RRLMP auf dem Standard-Audiogerät von Windows aus. In einem Studio (oder mit fortgeschrittenen Podcast-Setups wie dem *Rødecaster Pro*) müssen Sie jedoch die Streams trennen.

### Den Ausgang auswählen
1.  Klicken Sie auf das **Zahnrad (Einstellungen)**-Symbol in der oberen Befehlsleiste.
2.  Das Bedienfeld **General Settings** öffnet sich.
3.  Im Dropdown-Menü "Audio Output Device" sehen Sie die Liste aller an Ihren PC angeschlossenen Soundkarten.
4.  Wählen Sie das gewünschte Gerät aus (z. B. *Rødecaster Pro Stereo* oder *Focusrite USB*).

### Live-Switch (Live-Umschaltung)
Der Wechsel erfolgt sofort. Wenn Musik spielt, während Sie das Gerät wechseln, "springt" das Audio ohne Unterbrechung auf den neuen Ausgang.

> **Tipp für Rødecaster/USB-Mixer**: Wenn Ihr Mixer mehrere USB-Kanäle hat (z. B. Main und Sounds/Chat), stellen Sie RRLMP auf einen sekundären Kanal (z. B. "Sounds"), damit Sie dessen Lautstärke mit einem speziellen Fader am physischen Mixer steuern können, getrennt von den Windows-Systemsounds.

---

## 6.2 Die Tastatur (Hotkeys)

Die Computertastatur ist der schnellste Controller, den Sie haben. RRLMP enthält voreingestellte globale Befehle und anpassbare Tasten.

### Globale Befehle (F-Tasten)
Die Funktionstasten (F1-F5) sind zum Starten der Spalten zugewiesen. Sie haben eine "intelligente" Logik: Sie suchen den ersten freien Clip.
*   **F1**: Startet Spalte 1 (Assets).
*   **F2**: Startet Spalte 2 (Musik).
*   **F3**: Startet Spalte 3 (Stimmen).
*   **F4**: Startet Spalte 4 (SFX).
*   **F5**: Startet Spalte 5 (Pre-Show).
*   **ESC**: **PANIC BUTTON**. Stoppt alles sofort (Stop All).

### Benutzerdefinierte Tasten (Custom Binds)
Möchten Sie das Intro durch Drücken der Leertaste oder des Buchstabens "Q" starten?
1.  Rechtsklick auf den Clip -> **Edit**.
2.  Klicken Sie in das Feld **Trigger Keybind**.
3.  Drücken Sie die gewünschte Taste auf der Tastatur.
4.  Speichern.
5.  Ein Badge (z. B. **[Q]**) erscheint auf der Karte, um Sie an die Zuweisung zu erinnern.

> **Sicherheit**: Tastaturbefehle werden automatisch deaktiviert, wenn Sie Text schreiben (z. B. beim Umbenennen eines Clips), um zu vermeiden, dass Audio während des Tippens gestartet wird.

---

## 6.3 MIDI-Controller (Die physische Macht)

Dies ist die "Pro"-Funktion schlechthin. Sie können musikalische Tastaturen, Pads (wie *Novation Launchpad*) oder Fader-Controller (wie *Korg nanoKONTROL*) anschließen und sie zur Steuerung der Software verwenden.

### Verbindung
1.  Schließen Sie Ihren USB-MIDI-Controller an den Computer an, **bevor** Sie Runtime Live Machine Pro starten.
2.  Starten Sie die Software. Die MIDI-Engine erkennt das Gerät automatisch.

### MIDI-Learn-Modus (Einfache Zuweisung)
Sie müssen keine komplizierten Codes kennen. RRLMP lernt, indem es zusieht, was Sie tun.

1.  Klicken Sie auf das **MIDI**-Symbol (DIN-Stecker) in der oberen Leiste.
    *   Das Symbol wird **Cyan (An)**.
    *   Die Clips nehmen ein gestricheltes Aussehen an ("Wartend").
2.  **Um einen Clip zuzuweisen**:
    *   Klicken Sie mit der Maus auf den gewünschten Clip.
    *   Drücken Sie die physische Taste/das Pad auf Ihrem Controller.
    *   Ein Badge (z. B. **[M:60]**) erscheint auf dem Clip. Fertig.
3.  **Um globale Funktionen zuzuweisen**:
    *   Klicken Sie auf den roten **STOP ALL**-Knopf auf dem Bildschirm -> Drücken Sie eine große Taste auf dem Controller.
    *   Klicken Sie auf den **MASTER VOL**-Schieberegler auf dem Bildschirm -> Bewegen Sie einen Fader oder Drehregler auf dem Controller.
4.  Klicken Sie erneut auf das **MIDI**-Symbol, um den Learn-Modus zu verlassen.

### Unterstützte Befehlstypen
*   **Note On/Off**: Perfekt für Tasten und Pads (Clip-Start, Stop All).
*   **Control Change (CC)**: Perfekt für Fader und Drehregler. Verwenden Sie es, um die Master-Lautstärke analog und fließend zu steuern.

> **Portabilität**: Die MIDI-Zuweisungen der Clips werden im .lmp-Projekt gespeichert. Wenn Sie das Projekt auf einen anderen PC mit demselben Controller übertragen, funktioniert alles sofort.
