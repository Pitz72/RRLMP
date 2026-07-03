# Kapitel 3 — Die Arbeitsoberfläche

---

Die Oberfläche von Runtime Live Machine Pro ist für den anspruchsvollsten Betriebskontext gebaut: die Live-Sendung. Jede visuelle Entscheidung — das dunkle Thema, der hohe Kontrast, die Größe der Bedienelemente — erfüllt eine funktionale Anforderung. Es ist keine Ästhetik um der Ästhetik willen, sondern Ergonomie.

Wenn Sie ein Projekt öffnen, teilt sich der Bildschirm in zwei klar getrennte Zonen: die **Steuerleiste** oben, die Projekt und System verwaltet, und das zentrale **Regie-Raster**, in dem die eigentliche Arbeit stattfindet.

---

## 3.1 Die Steuerleiste (Header)

Der Header nimmt die gesamte Bildschirmbreite ein. Von links nach rechts vereint er die Identität der Software, die Datei-Befehle, das Monitoring und die Transportsteuerung, das Werkzeug-Menü und die Session-Anzeigen.

### Identität

**Logo und PRO-Badge.** Links steht das Logo neben dem Schriftzug **RLM PRO** — das Wort „PRO“ ist mit einem schillernden Farbverlauf umgesetzt, der von Cyan über Grün und Bernstein zu Rot wechselt. Daneben steht in Monospace-Schrift die installierte Version (`v1.11.5`). Wenn Sie mit der Maus über das Logo fahren, erscheint der vollständige Name der Software mit der Versionsnummer.

### Menü Datei

Die Schaltfläche **FILE** öffnet ein Menü mit den Projekt-Operationen:

- *Neues Projekt* — öffnet eine leere Session. Gibt es ungespeicherte Änderungen, fragt die Software nach.
- *Projekt speichern* — schnelles Speichern in die aktuelle `.lmp`-Datei. Der Eintrag hebt sich gelb hervor, wenn es ungespeicherte Änderungen gibt.
- *Speichern unter…* — öffnet stets den Dialog, um fortlaufende Versionen zu erstellen (z. B. `Ep47_entwurf.lmp`, `Ep47_final.lmp`).
- *Projekt laden* — öffnet ein `.lmp`-Projekt von der Festplatte.
- *M3U importieren* — importiert eine Playlist im M3U-Format als Clip-Sequenz.
- *Eigenständiges Archiv exportieren* — erstellt eine in sich geschlossene Kopie des Projekts, samt Audiodateien. Beschrieben in Kapitel 10.

### Monitoring und Transport

**Stereo-VU-Meter (L/R).** Zwei waagerechte Balken zeigen den tatsächlichen Ausgangspegel nach der Master-Lautstärke. Die Farbskala ist intuitiv: grün bis etwa 85 % des Wegs, dann gelb, schließlich rot in der Nähe des Endanschlags. Dauerhaftes Rot signalisiert Clipping: Senken Sie den Pegel.

**Master-Lautstärke.** Der Fader steuert die Gesamt-Ausgangslautstärke der Software, von 0 bis 100 %. Er wirkt wie ein Master-Fader: auf null gestellt, kommt kein Ton heraus, unabhängig vom Zustand der einzelnen Clips. Wenn Sie ein MIDI-Steuerelement auf die Master-Lautstärke gelegt haben, zeigt ein kleines Badge die Zuordnung an.

**STOP ALL (rote Schaltfläche „ALL“).** Stoppt sofort alle aktiven Clips und setzt laufende Fades zurück. Es ist der Notfallbefehl des Systems. Die Taste `Esc` auf der Tastatur führt dieselbe Funktion aus, wenn die Anwendung im Fokus ist — auch während Sie in ein Textfeld schreiben.

> **Hinweis.** Anders als in früheren Versionen ist `Esc` nicht mehr als systemweites Kürzel registriert: Es wirkt, wenn RLMP das aktive Fenster ist. Diese Entscheidung erlaubt es Dialogfenstern, `Esc` zum Schließen zu nutzen, ohne die Sendung zu stoppen.

**FX.** Öffnet und schließt das pad FX, die *jingle machine* der Effekte (Kapitel 7). Ein kleiner Zähler zeigt an, wie viele Effekte gerade wiedergegeben werden.

**MIX.** Öffnet und schließt die Automix-Ansicht, das dedizierte Deck der Spalte Musik (Kapitel 7).

### Werkzeuge

Das Menü **Werkzeuge** (Schraubenschlüssel-Symbol) vereint:

- *Rückgängig* und *Wiederholen* — die Änderungshistorie der Playlist (`Ctrl+Z` / `Ctrl+Y`).
- *MIDI Learn* — aktiviert den MIDI-Lernmodus (Kapitel 8).
- *Tastenbelegung* — das Fenster zur Zuweisung von Tasten an Clips.
- *Einstellungen* — die globalen Voreinstellungen der Software (Kapitel 13).
- *Info* — Version, Credits und manuelle Update-Prüfung.

Kurz unter dem Menü erscheint für einen Moment die Anzeige *Auto-saved* als Bestätigung, dass das Projekt automatisch gespeichert wurde.

![Die Steuerleiste mit geöffnetem Menü Werkzeuge.](../screenshots-de/barra-controllo.png)

*Abbildung 3.1 — Die Steuerleiste und das geöffnete Menü Werkzeuge (Rückgängig/Wiederholen, MIDI Learn, Tastenbelegung, Allgemeine Einstellungen, Info).*

### Session-Anzeigen

Auf der rechten Seite des Headers finden die Schaltfläche des **Playout Log** (das chronologische Startprotokoll, Kapitel 13), die **Aufnahme**-Schaltfläche (Kapitel 9), der **On-Air-Timer** (der während der Sendung `ON AIR HH:MM:SS` auf rotem Grund zeigt) und die digitale **Studiouhr** im 24-Stunden-Format ihren Platz, synchronisiert mit der Systemuhr.

Im Bereich des Headers können außerdem unaufdringliche Benachrichtigungen (**Toasts**) zu abgeschlossenen Vorgängen oder Systemhinweisen erscheinen. Anders als blockierende Dialoge verschwinden Toasts nach wenigen Sekunden von selbst und unterbrechen die Wiedergabe nicht.

---

## 3.2 Das Raster mit sechs Spalten

![Das Regie-Raster mit sechs Spalten, Beispiel-Clips und den zugehörigen Status-Badges.](../screenshots-de/interfaccia-principale.png)

*Abbildung 3.2 — Die Arbeitsoberfläche: das Raster mit sechs Spalten und den Audio-Karten.*

Das Raster ist das Betriebszentrum der Software: sechs nebeneinanderliegende senkrechte Spalten, jede mit einer eigenen farbigen Kopfzeile und einer eigenen Logik des Audio-Verhaltens. Die Soundeffekte haben keine Spalte im Raster: Sie leben im pad FX (Kapitel 7).

### Spaltenkopfzeilen

Jede Kopfzeile nennt den Namen der Spalte, ihren Typ und dient als Statusanzeige. Im Normalzustand ist sie statisch und im charakteristischen Ton der Spalte gefärbt. Wenn der laufende Clip der letzte verfügbare der Spalte ist, nicht in loop läuft und weniger als **20 Sekunden** bis zum Ende verbleiben, geht die Kopfzeile in den **DEAD-AIR**-Alarm: Sie pulsiert, wechselt zu Bernstein, zeigt ein Warnsymbol und das Badge **END**. Es ist die Vorwarnung, die Ihnen die Zeit gibt, den nächsten Titel vor der Stille vorzubereiten.

Die Farbe jeder Spalte ist anpassbar: Klicken Sie auf den farbigen Punkt in der Kopfzeile, um eine Palette mit **30 Farbtönen** zu öffnen. Die Auswahl wird in der Projektdatei gespeichert.

Auf der Kopfzeile der Spalte **Pre-Show** erscheint zusätzlich eine **Rotations**-Schaltfläche: Wenn sie aktiv ist, fügt die Warteschlange vor der Sendung automatisch Jingles und Promos in regelmäßigen Abständen ein (Kapitel 13).

### Die sechs Spalten

**Show Assets (Grün)**
Die strukturellen Elemente der Show: Kennungen, Musikbetten, Untermalungen (*bed*), institutionelle Stacchi (Trenner). Sie verhalten sich wie Elemente im Hintergrund: Sie räumen den Platz, wenn Stimmen oder Songs hinzukommen, behalten aber ihre interne Rotation, bis sie gestoppt werden.

**Jingle (Bernstein)** und **Promo (Cyan)**
Zwei eigene Spalten, jeweils für die identitätsstiftenden Jingles und für Promos oder Eigenwerbung. Auf der Audio-Ebene verhalten sie sich exakt wie die Show Assets (sie gehören zur selben Familie), aber getrennt zu halten hält die Playlist geordnet und lesbar.

**Episoden-Musik (Rot)**
Die Musik-Playlist. Die Clips dieser Spalte nehmen aktiv am automatischen Mix teil: Sie werden abgesenkt, wenn Stimmen erklingen, und senken ihrerseits die Beds der Assets, wenn sie in die Wiedergabe eintreten (Kapitel 6). Auf den Musik-Clips erkennt die Software automatisch die **BPM**, angezeigt mit einem eigenen Badge.

**Stimme / Aufnahmen (Orange)**
Interviews, vorproduzierte gesprochene Blöcke, Sprachnachrichten. Diese Spalte hat die **höchste Priorität** im Mixing-System: Wenn ein Clip hier läuft, werden alle anderen Signale auf einen Hintergrundpegel abgesenkt.

**Pre-Show (Violett)**
Die Aufwärm-Playlist vor der Sendung. Sie funktioniert wie eine eigenständige Musik-Warteschlange, mit optionaler Rotation von Jingles und Promos. Wenn die eigentliche Sendung beginnt, wird diese Spalte typischerweise geleert oder deaktiviert.

---

## 3.3 Die Audio-Karte (Clip)

Jede importierte Audiodatei materialisiert sich im Raster als rechteckige **Karte**. Die Karte ist die operative Einheit des Systems: Sie sehen sie, Sie starten sie, Sie konfigurieren sie, Sie verschieben sie.

### Aufbau einer Karte

**Titel und Interpret.** Der Dateiname oder der in den Eigenschaften vergebene individuelle Name. Der individuelle Titel ändert nur das Etikett in der Software; die Originaldatei auf der Festplatte bleibt unangetastet. Bei Musik-Clips kann unter dem Titel der Name des Interpreten erscheinen.

**Timer.** In Ruhe zeigt er die Gesamtdauer des Clips im Format `MM:SS`. Während der Wiedergabe wechselt er zum **Countdown**, mit negativem Vorzeichen (z. B. `−01:20`). Wenn weniger als 15 Sekunden bis zum Ende verbleiben, wird der Timer **rot**.

**Status-Badges.** Kleine Etiketten teilen sofort die konfigurierten Eigenschaften mit:

- **STACCO** — der Clip ist so eingestellt, dass er sich über die anderen legt, ohne sie zu stoppen.
- **LOOP** — der Clip startet am Ende der Wiedergabe wieder von vorn.
- **NEXT** — am Ende dieses Clips startet automatisch der nächste in der Spalte.
- **▶ UP NEXT** — hebt hervor, welcher Clip als nächster in der automatischen Sequenz startet.
- **### BPM** — das erkannte Tempo, auf Musik-Clips.
- **TRIM…** — laufende Stilleanalyse (Auto-Trim).
- **FADE OUT** — erscheint auf dem ausgehenden Clip während eines crossfade oder einer Blende.
- **📋** — der Clip hat eine Notiz in der NoteBoard (Kapitel 13).

**Zuweisungen.** Hat der Clip eine Tastaturtaste zugewiesen, erscheint der Buchstabe in einem Badge in der Farbe der Spalte; hat er ein MIDI-Binding, erscheint das Etikett `M` gefolgt von der Notennummer (z. B. `M60`).

**Struktur-Cues.** Sind die Marker konfiguriert, erscheinen während der Wiedergabe die Countdowns `INTRO: −MM:SS` (in Cyan) und `OUTRO IN: −MM:SS` (in Orange), bis zur Warnung `🚨 OUTRO`, wenn das Outro begonnen hat.

**Wiedergabeanzeige.** Wenn ein Clip läuft, leuchtet die Karte auf: grüner Rahmen, Hintergrund mit einem leuchtenden Schein, ein pulsierender Punkt und der hervorgehobene Titel. Der Fortschrittsbalken läuft über den Hintergrund der Karte.

### Interaktion mit den Karten

- **Linksklick** — startet den Clip, wenn er steht; stoppt ihn (mit Fade Out), wenn er läuft.
- **Ctrl + Klick** (Windows/Linux) oder **Cmd + Klick** (macOS) — wählt den Clip aus, ohne ihn zu starten. Der Rahmen wird blau. Nützlich für die Mehrfachauswahl und das Löschen im Block.
- **Taste Entf** (oder *Delete* / *Backspace*) — löscht die ausgewählten Clips aus dem Raster. Sind mehrere Clips ausgewählt, fragt die Software nach.
- **Rechtsklick** — öffnet die **Clip-Einstellungen**: Eigenschaften, Waveform-Editor, Notizen (Kapitel 5).
- **Drag & Drop** — ziehen Sie eine Karte, um sie innerhalb der Spalte umzusortieren oder in eine andere zu verschieben. Ein leuchtender blauer Indikator zeigt während des Ziehens die Einfügeposition.

### Karten im Fehlerzustand

Eine Karte mit dem Hinweis **DATEI FEHLT** und rotem Rahmen zeigt an, dass die referenzierte Audiodatei nicht mehr erreichbar ist: Sie wurde verschoben, umbenannt oder liegt auf einer nicht angeschlossenen externen Festplatte. Der Clip ist nicht abspielbar, bis die Datei wieder am ursprünglichen Pfad verfügbar ist. Der Umgang mit Pfadfehlern wird in Kapitel 14 behandelt.
