# Kapitel 13 – Erweiterte Funktionen

---

Dieses Kapitel versammelt Funktionen, die nicht zum Grundablauf gehören, sich aber, einmal entdeckt, fest in den Alltag derjenigen einfügen, die Shows sorgfältig und regelmäßig produzieren: die NoteBoard, die Farbverwaltung der Spalten, die Übergänge, die allgemeinen Einstellungen, das Startprotokoll und die Änderungshistorie.

---

## 13.1 NoteBoard: das Regie-Skript

Die **NoteBoard** ist das in die Clips integrierte Notizsystem. Damit lässt sich jedem Clip ein geschriebener Text zuordnen – Betriebsanweisungen, Ablaufpläne, Notizen zu einem Interview, der vollständige Text eines Spots –, der automatisch auf dem Bildschirm erscheint, sobald der Clip in die Wiedergabe eintritt.

### Eine Notiz einfügen

1. Öffnen Sie die Clip-Einstellungen per Rechtsklick auf die Karte und wechseln Sie zum Abschnitt *Notizen*.
2. Schreiben Sie den Text in das freie Feld – eine Längenbegrenzung gibt es nicht.

Clips mit einer Notiz zeigen auf der Karte das Badge 📋.

### Das Panel während der Sendung

Tritt ein Clip mit Notizen in die Wiedergabe ein, erscheint im unteren Bildschirmbereich das **NoteBoard-Panel** mit dem zugehörigen Text, überschrieben mit Name und Farbe des Clips. Es bleibt während der gesamten Wiedergabedauer sichtbar und schließt sich von selbst, sobald der Clip endet. Erklingen mehrere Clips mit Notizen gleichzeitig, zeigt das Panel denjenigen mit der höheren Priorität.

### Anwendungsfälle

- **Gesprochene Regie.** Ordnen Sie jeder Kennung die ersten Zeilen des folgenden gesprochenen Blocks zu – startet die Kennung, steht der Text bereits vor Augen.
- **Vorzulesender Inhalt.** Ein Werbespot mit vollständigem Text in der Notiz: Sobald er startet, lässt er sich ablesen.
- **Betriebsanweisungen.** „Monitor absenken“, „Kopfhörerpegel des Gastes prüfen“, „Aufnahme starten“.
- **Interviews.** Die Fragen an den Gast bleiben während der gesamten Clip-Dauer sichtbar.

---

## 13.2 Farbliche Anpassung der Spalten

Die Standardfarben tragen eine feste Bedeutung – Grün für die Assets, Rot für die Musik und so weiter –, doch jede Spalte lässt sich anpassen. Klicken Sie auf den **farbigen Punkt** in der Spaltenkopfzeile: Eine Palette mit **30 Farben** öffnet sich. Sobald Sie eine wählen, übernimmt die Spalte – Kopfzeile, Karten, Anzeigen – sofort die neue Farbe. Die Wahl wird in der Projektdatei gespeichert.

Die Karten erben die Spaltenfarbe dynamisch: im Ruhezustand in gedämpftem Ton, während der Wiedergabe in voller Farbe. So kann jedes Projekt seine eigene farbliche Identität entwickeln.

---

## 13.3 Übergänge zwischen Clips

Ist ein Clip auf *Play Next* eingestellt, erfolgt der Wechsel zum nächsten Clip der Spalte nach dem konfigurierten Übergangsmodus:

- **Crossfade.** Der auslaufende Clip blendet aus, während der einlaufende überlappend ansteigt. Standarddauer: 2 Sekunden.
- **Segue.** Der auslaufende Clip blendet aus, während der nächste sofort mit voller Lautstärke einsetzt. Standarddauer der Blende: 0,8 Sekunden.
- **Gapless (harter Schnitt).** Der auslaufende Clip stoppt abrupt, der nächste startet ohne Blende sofort.

Einen Übergang können Sie auf Ebene des einzelnen Clips festlegen oder bei **Globaler Standard** belassen, der die in den Einstellungen definierte allgemeine Wahl übernimmt. Die Spalte Pre-Show verwendet standardmäßig den Crossfade. Über die Schaltfläche „Test →“ im Editor lässt sich jeder Modus ausprobieren, ohne on air zu gehen (Kapitel 5).

---

## 13.4 Das Fenster Allgemeine Einstellungen

Die **Einstellungen** (Menü Werkzeuge) fassen die globalen Voreinstellungen der Software zusammen, in Reitern organisiert.

### Allgemein

- **Sprache.** Wählen Sie die Oberflächensprache aus den acht verfügbaren – die Änderung wirkt sofort.
- **Controllo Remoto (Beta).** Aktiviert die Fernbedienung über den Browser und zeigt PIN, Port und Adressen an (Kapitel 11).
- **Regie-Layout.** Blendet die Spalten des Rasters einzeln ein oder aus. Eine ausgeblendete Spalte verliert ihre Clips nicht – sie bleiben im Projekt erhalten. Diese Voreinstellung gilt global, für alle Projekte.

### Audio & Mix

- **Ausgabegerät.** Das Audioziel (Kapitel 8).
- **Mix-Intelligenz.** Das Ausmaß des Ducking – um wie viel die Musik absinkt, wenn eine Stimme spricht, Standard 20 % – sowie dessen Geschwindigkeit (Standard 500 ms).
- **Übergänge.** Der Standard-Übergangsmodus und die Dauern von Crossfade und Segue.

### Aufnahme

Zusammenfassung des Erfassungspunkts (nach dem Limiter) und Wahl des im Export vorgeschlagenen Standardformats (Kapitel 9).

### Master Chain

- **Lautstärke-Angleichung.** Aktiviert oder deaktiviert die Loudness-Normalisierung und legt ihr Ziel fest (Standard −16 LUFS).
- **Master Chain.** Aktiviert oder umgeht die gesamte Kette und regelt die einzelnen Stufen: Frequenz des HPF, Stil des Multiband-Glue, Schwelle des Limiters. Eine Schaltfläche stellt die Standardwerte wieder her (Kapitel 6).

---

## 13.5 Playout Log

Das **Playout Log** (Symbol im Header) ist das chronologische Startprotokoll: Es hält fest, was wann on air ging, bis zu den letzten Tausenden Ereignissen. Nützlich, um eine Playlist nachträglich zu rekonstruieren, das Gesendete zu überprüfen oder einen Sendebericht zusammenzustellen.

---

## 13.6 Rückgängig und Wiederholen

Änderungen an der Playlist – Hinzufügen, Verschieben, Löschen – lassen sich rückgängig machen. `Ctrl+Z` macht den letzten Vorgang rückgängig, `Ctrl+Y` (oder `Ctrl+Shift+Z`) stellt ihn wieder her, mit einer mehrere Dutzend Schritte tiefen Historie. Dieselben Befehle finden sich im Menü Werkzeuge. So entsteht ein Sicherheitsnetz für Vorgänge, die während der Vorbereitung in Eile ausgeführt werden.

---

## 13.7 Toast-Benachrichtigungssystem

Für Routinemeldungen verzichtet RLMP auf blockierende Fenster. Unkritische Benachrichtigungen erscheinen als **Toasts**: kleine, unaufdringliche Banner in einer Bildschirmecke, die einige Sekunden stehen bleiben und dann von selbst verschwinden, ohne die Wiedergabe zu unterbrechen. Sie bestätigen etwa ein Speichern, den Abschluss eines Exports oder einen MIDI-Learn-Vorgang, oder weisen auf fehlende Dateien hin.

Die **Bestätigungsfenster** dagegen, notwendig, wenn eine Aktion unumkehrbar ist – das Löschen von Clips, das Schließen eines nicht gespeicherten Projekts –, sind modal und verlangen eine Antwort. Dabei sind sie so gestaltet, dass die laufende Wiedergabe nicht abreißt: Das Audio läuft weiter, während Sie entscheiden.
