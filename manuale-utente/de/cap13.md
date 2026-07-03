# Kapitel 13 — Erweiterte Funktionen

---

Dieses Kapitel versammelt die Funktionen, die nicht zum grundlegenden Arbeitsablauf gehören, die aber, einmal entdeckt, fest in die Praxis derjenigen eingehen, die Shows mit Sorgfalt und Regelmäßigkeit produzieren: die NoteBoard, die farbliche Verwaltung der Spalten, die Übergänge, die allgemeinen Einstellungen, das Startprotokoll und die Änderungshistorie.

---

## 13.1 NoteBoard: das Regie-Skript

Die **NoteBoard** ist das System der in die Clips integrierten Notizen. Es erlaubt es, jedem Clip einen geschriebenen Text zuzuordnen (Betriebsanweisungen, Ablaufpläne, Notizen zu einem Interview, den vollständigen Text eines Spots) und ihn automatisch auf dem Bildschirm erscheinen zu lassen, in dem Moment, in dem dieser Clip in die Wiedergabe eintritt.

### Eine Notiz einfügen

1. Öffnen Sie die Clip-Einstellungen (Rechtsklick auf die Karte) und gehen Sie zum Abschnitt *Notizen*.
2. Schreiben Sie den Text in das freie Feld. Es gibt keine Längenbegrenzung.

Clips mit einer Notiz zeigen das Badge 📋 auf der Karte.

### Das Panel während der Sendung

Wenn ein Clip mit Notizen in die Wiedergabe eintritt, erscheint das **NoteBoard-Panel** im unteren Teil des Bildschirms mit dem zugehörigen Text, überschrieben mit Name und Farbe des Clips. Das Panel bleibt für die gesamte Dauer der Wiedergabe sichtbar und schließt sich von selbst, wenn der Clip endet. Wenn mehrere Clips mit Notizen zusammen erklingen, zeigt das Panel den mit der höheren Priorität.

### Anwendungsfälle

- **Gesprochene Regie.** Ordnen Sie jeder Kennung die ersten Zeilen des folgenden gesprochenen Blocks zu: Wenn die Kennung startet, ist der Text schon vor Augen.
- **Vorzulesender Inhalt.** Ein Werbespot mit dem vollständigen Text in der Notiz: Sobald er startet, liest man ihn.
- **Betriebsanweisungen.** „Monitor absenken“, „Kopfhörerpegel des Gastes prüfen“, „Aufnahme starten“.
- **Interviews.** Die Fragen an den Gast bleiben für die gesamte Dauer des Clips sichtbar.

---

## 13.2 Farbliche Anpassung der Spalten

Die Standardfarben haben eine gefestigte Bedeutung (Grün für die Assets, Rot für die Musik und so weiter), aber jede Spalte ist anpassbar. Klicken Sie auf den **farbigen Punkt** in der Kopfzeile der Spalte: Es öffnet sich eine Palette mit **30 Farben**. Wählen Sie eine, und die Spalte (Kopfzeile, Karten, Anzeigen) nimmt sofort die neue Farbe an. Die Auswahl wird in der Projektdatei gespeichert.

Die Karten erben dynamisch die Farbe der Spalte: In Ruhe erscheinen sie in einem gedämpften Ton, in der Wiedergabe in der vollen Farbe. So kann jedes Projekt eine eigene farbliche Identität haben.

---

## 13.3 Übergänge zwischen Clips

Wenn ein Clip auf *Play Next* eingestellt ist, erfolgt der Wechsel zum nächsten Clip der Spalte gemäß dem konfigurierten Übergangsmodus:

- **Crossfade.** Der ausgehende Clip blendet aus, während der eingehende ansteigt, überlappend. Standarddauer: 2 Sekunden.
- **Segue.** Der ausgehende Clip blendet aus, während der nächste sofort auf voller Lautstärke startet. Standarddauer der Blende: 0,8 Sekunden.
- **Gapless (harter Schnitt).** Der ausgehende Clip stoppt schlagartig und der nächste startet sofort, ohne Blende.

Sie können einen Übergang auf Ebene des einzelnen Clips einstellen oder **Globaler Standard** belassen, was die in den Einstellungen definierte allgemeine Wahl anwendet. Die Spalte Pre-Show verwendet den Crossfade als Standardeinstellung. Alle Modi lassen sich über die Schaltfläche „Test →“ im Editor ausprobieren, ohne on air zu gehen (Kapitel 5).

---

## 13.4 Das Fenster Allgemeine Einstellungen

Die **Einstellungen** (Menü Werkzeuge) versammeln die globalen Voreinstellungen der Software, in Reitern organisiert.

### Allgemein

- **Sprache.** Wählen Sie die Oberflächensprache unter den acht verfügbaren. Die Änderung wirkt sofort.
- **Controllo Remoto (Beta).** Aktiviert die Fernbedienung über den Browser und zeigt PIN, Port und Adressen (Kapitel 11).
- **Regie-Layout.** Blendet die Spalten des Rasters einzeln ein oder aus. Eine Spalte auszublenden löscht ihre Clips nicht: Sie bleiben im Projekt. Es ist eine globale Voreinstellung, für alle Projekte gültig.

### Audio & Mix

- **Ausgabegerät.** Das Audioziel (Kapitel 8).
- **Mix-Intelligenz.** Das Ausmaß des Ducking (um wie viel die Musik sinkt, wenn eine Stimme spricht, Standard 20 %) und seine Geschwindigkeit (Standard 500 ms).
- **Übergänge.** Der Standard-Übergangsmodus und die Dauern von Crossfade und Segue.

### Aufnahme

Zusammenfassung des Erfassungspunkts (nach dem Limiter) und Wahl des im Export vorgeschlagenen Standardformats (Kapitel 9).

### Master Chain

- **Lautstärke-Angleichung.** Aktiviert/deaktiviert die loudness-Normalisierung und stellt ihr Ziel ein (Standard −16 LUFS).
- **Master Chain.** Aktiviert oder umgeht die gesamte Kette und regelt die einzelnen Stufen: Frequenz des HPF, Stil des multiband glue, Schwelle des limiter. Eine Schaltfläche stellt die Standardwerte wieder her (Kapitel 6).

---

## 13.5 Playout Log

Das **Playout Log** (Symbol im Header) ist das chronologische Startprotokoll: Es hält fest, was on air ging und wann, bis zu den letzten tausenden Ereignissen. Es ist nützlich, um eine Playlist im Nachhinein zu rekonstruieren, zu überprüfen, was gesendet wurde, oder einen Bericht der Sendung zusammenzustellen.

---

## 13.6 Rückgängig und Wiederholen

Die Änderungen an der Playlist (Hinzufügen, Verschieben, Löschen) sind umkehrbar. `Ctrl+Z` macht den letzten Vorgang rückgängig, `Ctrl+Y` (oder `Ctrl+Shift+Z`) wiederholt ihn, mit einer mehrere Dutzend Schritte tiefen Historie. Dieselben Einträge sind im Menü Werkzeuge verfügbar. Es ist das Sicherheitsnetz für Vorgänge, die während der Vorbereitung in Eile ausgeführt werden.

---

## 13.7 Toast-Benachrichtigungssystem

RLMP verwendet für Routine-Mitteilungen keine blockierenden Fenster. Die unkritischen Benachrichtigungen erscheinen als **Toasts**: kleine, unaufdringliche Banner in einer Ecke des Bildschirms, die einige Sekunden bleiben und von selbst verschwinden, ohne die Wiedergabe zu unterbrechen. Sie dienen dazu, ein Speichern, das Ende eines Exports, einen Vorgang von MIDI Learn zu bestätigen oder auf fehlende Dateien hinzuweisen.

Die **Bestätigungsfenster**, nötig, wenn eine Aktion unumkehrbar ist (das Löschen von Clips, das Schließen eines nicht gespeicherten Projekts), sind hingegen modal und verlangen eine Antwort, sind aber so gestaltet, dass sie die laufende Wiedergabe nicht abschneiden: Das Audio läuft weiter, während Sie entscheiden.
