# Kapitel 7 — Das pad FX und die Automix-Ansicht

---

Zwei Arbeitsflächen leben über dem Raster, per Tastendruck abrufbar und für zwei gegensätzliche Momente der Regie gedacht: das **pad FX**, um Effekte und Stacchi (Trenner) treffsicher zu starten, ohne irgendetwas zu unterbrechen, und die **Automix-Ansicht**, um den Musikfluss zu steuern, wie es ein DJ tun würde. Keine der beiden nimmt dem Raster Platz weg: Sie öffnen sich, wenn sie gebraucht werden, und schließen sich mit einem Klick.


---

## 7.1 Das pad FX: die jingle machine

![Das pad FX „jingle machine“, geöffnet über dem Regie-Raster.](../screenshots-de/pad-fx.png)

*Abbildung 7.1 — Das pad FX: die jingle machine 5×5 der Soundeffekte, mit überlagerndem Start.*

Die Soundeffekte haben keine Spalte im Raster. Sie leben im **pad FX**, einem Panel aus einem Zellenraster (einer *jingle machine*), das sich über die Schaltfläche **FX** im Header öffnet und schwebend in einer Ecke des Bildschirms bleibt.

Das Pad ist ein **nicht blockierendes Overlay**: Es verdeckt das Board nicht und fängt Klicks anderswo nicht ab. Sie können einen Effekt starten und im selben Moment weiter an den Spalten oder den Header-Befehlen arbeiten. Aus diesem Grund schließt die Taste `Esc` das Pad nicht: Sie bleibt der STOP-ALL-Befehl, immer verfügbar. Das Pad schließt sich über seine Schließen-Schaltfläche oder erneut über den FX-Umschalter.

### Effekte laden und starten

Das Pad startet mit einem Raster von 25 Zellen (5×5) und wächst um Zeilen, wenn Sie weitere Effekte hinzufügen. Um es zu füllen, **ziehen Sie die Audiodateien direkt auf die Zellen** des Pads, genau wie Sie es mit einer Spalte des Rasters tun würden.

Ein Klick auf eine Zelle **startet den Effekt**. Die Effekte des Pads sind polyphon und überlagern sich: Mehrere Zellen können zusammen erklingen, über allem, was on air ist, ohne es zu stoppen. Das Audio-Verhalten ist identisch mit dem eines normalen Clips: Es ändert sich nur die Startfläche. Ein Zähler neben der Schaltfläche FX im Header zeigt an, wie viele Effekte gerade erklingen.

### Einen Effekt konfigurieren

Die Effekte werden auf zwei Ebenen konfiguriert, gedacht für zwei verschiedene Bedürfnisse:

- **Schnelleinstellungen** — der übliche Fall für eine jingle machine: Name, Farbe, Lautstärke, loop. Wenige Sekunden genügen.
- **Vollständige Einstellungen** — dasselbe Fenster wie bei den Raster-Clips (Waveform-Editor, Trim, Marker, Fade, Tastenzuweisung), erreichbar über den Eintrag „Vollständige Einstellungen…“ innerhalb der Schnelleinstellungen.

### Position des Pads

Das Pad kann in der unteren linken oder unteren rechten Ecke des Bildschirms sitzen: Die Vorliebe wird mit den Pfeilen am Pad selbst eingestellt und über die Sessions hinweg gemerkt. Rechts verdeckt es die NoteBoard und die letzte Spalte; wählen Sie die Seite danach, wie Sie Ihre Playlist angeordnet haben.

> **Hinweis.** Im Modus MIDI Learn **wählt** ein Klick auf eine Zelle des Pads den Effekt für die Zuweisung aus, statt ihn abzuspielen — so senden Sie keinen Jingle on air, während Sie die Steuerungen zuordnen (siehe Kapitel 8).

---

## 7.2 Die Automix-Ansicht

![Die Automix-Ansicht mit dem Deck der Spalte Musik und den BPM-Kompatibilitätspunkten.](../screenshots-de/vista-automix.png)

*Abbildung 7.2 — Die Automix-Ansicht: das Deck der Spalte Musik, die BPM-Kompatibilität und der Automatikmodus am Titelende.*

Die **Automix-Ansicht** ist das Deck der Spalte Musik: eine bildschirmfüllende Ansicht, abgerufen über die Schaltfläche **MIX** im Header, die die Musik-Playlist wie eine DJ-Konsole präsentiert. Sie öffnet sich über dem Board, aber unter dem pad FX, sodass die Effekte auch bei geöffnetem Automix nutzbar bleiben. Wie beim Pad schließt `Esc` sie nicht: Es bleibt der Notfallbefehl, und die Schaltfläche STOP ALL bleibt im Header erreichbar.

### Das Deck

In der Mitte finden Sie den **on air** laufenden Titel und, in der Warteschlange, den **nächsten** Titel der Spalte Musik, mit der verbleibenden Zeit. Von hier aus können Sie eine Spur starten und den Wechsel von einem Titel zum nächsten mit einem einzigen Befehl steuern: Die große Übergangs-Schaltfläche wendet denselben crossfade an, den Sie aus dem Raster nutzen würden, aber mit der zusätzlichen Sorgfalt des rhythmischen Andockens.

### Kompatibilität und beat-matched Übergänge

Neben jedem Titel zeigt ein **Kompatibilitätspunkt** die rhythmische Affinität zum vorherigen Titel an:

- **Grün** — die beiden Tempi docken gut aneinander an: Der Übergang kann beat-matched sein.
- **Gelb** — Andocken möglich, aber mit gewissen Vorbehalten.
- **Rot** — die Tempi liegen zu weit auseinander für ein sauberes Andocken.

Wenn das rhythmische Andocken nicht praktikabel ist (BPM nicht erkannt, Beat unsicher, Tempi zu unterschiedlich), erklärt die Software dies und greift automatisch auf einen **klassischen crossfade** zurück, ohne Überraschungen in der Sendung.

### Der Automatikmodus

Am unteren Rand der Ansicht gibt es einen Schalter für die **Automatik am Titelende**. Wenn er aktiv ist, startet RLMP den Wechsel zum nächsten Titel von selbst, wenn sich die on air laufende Spur dem Ende nähert.

Dieser Modus ist eine bewusste Ausnahme von der Philosophie der Software, die die Show absichtlich nicht automatisiert. Deshalb ist er **standardmäßig deaktiviert** und funktioniert **nur, solange die Automix-Ansicht geöffnet ist**: Das Schließen der Ansicht deaktiviert die Automatik. Es ist das richtige Werkzeug für einen durchgehenden Musikblock, die halbe Stunde reiner Musik, bevor man wieder ans Mikrofon geht — nicht für die gesamte Sendung.
