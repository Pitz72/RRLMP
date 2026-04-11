# KAPITEL 8: FEHLERBEHEBUNG UND HÄUFIG GESTELLTE FRAGEN (FAQ)

Selbst bei der stabilsten Software können unvorhergesehene Ereignisse aufgrund der Hardware oder des Betriebssystems auftreten. Hier finden Sie Lösungen für die häufigsten Probleme.

---

## 8.1 Audio-Probleme

### Der Timer läuft und die VU-Meter bewegen sich, aber ich höre nichts.
Die Software spielt das Audio korrekt ab (Sie sehen es an den farbigen Balken oben), aber das Signal erreicht Ihre Lautsprecher/Kopfhörer nicht.
1.  **Master-Lautstärke prüfen**: Stellen Sie sicher, dass der Lautstärkeregler oben nicht auf Null steht.
2.  **Ausgang überprüfen (Routing)**:
    *   Klicken Sie auf das **Zahnrad**-Symbol (Einstellungen).
    *   Überprüfen Sie, welches Gerät unter "Audio Output Device" ausgewählt ist.
    *   Manchmal ändert Windows die ID von USB-Geräten, wenn sie aus- und wieder eingesteckt werden. Versuchen Sie, Ihre Soundkarte (z. B. *Rødecaster Pro* oder *Kopfhörer*) erneut aus der Liste auszuwählen.
3.  **Externer Mixer**: Wenn Sie über einen USB-Mixer ausgeben, überprüfen Sie, ob der physische Fader für diesen Kanal nicht heruntergeregelt oder auf "Mute" gestellt ist.

### Das Audio "knistert" oder springt.
Dies geschieht dank der nativen Engine selten, kann aber vorkommen, wenn die CPU des Computers unter extremer Belastung steht.
*   Schließen Sie andere schwere Anwendungen (Videobearbeitung, Spiele).
*   Wenn Sie eine professionelle Soundkarte verwenden, überprüfen Sie, ob die *Puffergröße (Buffer Size)* in den Kartentreibern nicht zu niedrig ist (empfohlen: 256 oder 512 Samples).

---

## 8.2 Dateiverwaltung und Rote Clips

### Ein Clip ist rot geworden und spielt nicht mehr.
Eine **Rote Karte** zeigt an, dass die Software die Audiodatei nicht mehr auf der Festplatte finden kann.
*   **Ursache**: Sie haben die ursprüngliche MP3/WAV-Datei verschoben, umbenannt oder gelöscht. Oder die Datei befand sich auf einem USB-Stick/einer externen Festplatte, die jetzt getrennt ist.
*   **Lösung**:
    1.  Schließen Sie die externe Festplatte wieder an.
    2.  Verschieben Sie die Datei zurück an ihren ursprünglichen Speicherort.
    3.  Oder ziehen Sie die Datei erneut in das Raster (wodurch eine neue Karte erstellt wird) und löschen Sie die alte rote.

> **Prävention**: Um dieses Problem zu vermeiden, verwenden Sie die Funktion **Export Package** (Kap. 7), die alle Dateien zusammen mit dem Projekt in einen sicheren Ordner kopiert.

---

## 8.3 MIDI-Probleme

### Mein MIDI-Controller funktioniert nicht / wird nicht erkannt.
1.  **Goldene MIDI-Regel**: Der Controller muss **VOR** dem Start von Runtime Live Machine Pro an den Computer angeschlossen werden.
    *   Wenn Sie ihn anschließen, während die Software geöffnet ist, sieht der interne Browser ihn möglicherweise nicht. Schließen Sie RRLMP und öffnen Sie es erneut.
2.  **Learn-Modus**: Überprüfen Sie, ob Sie den Modus "MIDI Learn" nicht aktiv gelassen haben (Cyanfarbenes Symbol). In diesem Modus dient das Drücken von Tasten nur zum Zuweisen, nicht zum Spielen.
3.  **Treiber**: Einige fortgeschrittene Controller erfordern spezielle Treiber. Überprüfen Sie, ob Windows ihn korrekt erkennt.

---

## 8.4 Häufig gestellte Fragen (FAQ)

**F: Kann ich RRLMP verwenden, um das Radio rund um die Uhr zu automatisieren?**
A: Nein. RRLMP ist für die *Live*-Regie konzipiert (Shows, die von einer Person betreut werden). Es verfügt über keine Funktionen für stündliche Planung oder unendliche automatische Musikrotation.

**F: Welche Audioformate werden unterstützt?**
A: Es unterstützt nativ **MP3, WAV, AAC, OGG, FLAC**. Wir empfehlen die Verwendung von WAV für maximale Qualität oder MP3 320kbps, um Platz zu sparen.

**F: Funktioniert die Software auf dem iPad oder Android?**
A: Nein, Runtime Live Machine Pro ist eine professionelle Desktop-Software für **Windows** und **macOS**. Sie erfordert die Dateiverwaltungsleistung eines echten Computers.

**F: Wie aktualisiere ich die Software?**
A: Beim Start benachrichtigt Sie der Welcome Screen, wenn eine neue Version verfügbar ist (Gelb/Oranger Indikator). Besuchen Sie die offizielle Website, um das aktualisierte Installationsprogramm herunterzuladen. Ihre gespeicherten .lmp-Projekte sind mit neuen Versionen kompatibel.

**F: Wo finde ich die automatischen Speicherdateien?**
A: Wenn Sie an einer gespeicherten Datei arbeiten, befindet sich das .bak-Backup im selben Ordner wie das Projekt. Wenn Sie an einem "Unbenannten" Projekt gearbeitet haben und der PC heruntergefahren ist, überprüfen Sie den Systemanwendungsdatenordner (unter Windows: %APPDATA%\runtime-live-machine\).
