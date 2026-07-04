# Kapitel 12 – Aktualisierungen

---

Runtime Live Machine Pro aktualisiert sich von selbst, aber nie zu Ihrem Nachteil. Zwei Regeln bestimmen den gesamten Ablauf: Ein Update darf niemals eine laufende Sendung stören, und kein Download beginnt ohne Ihre Zustimmung. Dieses Kapitel zeigt, wie die Software nach neuen Versionen sucht, wie sie diese installiert und weshalb sich das Verhalten je nach Betriebssystem unterscheidet.

---

## 12.1 Die Prüfung beim Start

Wenige Sekunden nach dem Start – etwa drei – prüft RLMP im Hintergrund, ob eine neuere Version vorliegt. Das Ergebnis erscheint auf dem Begrüßungsbildschirm neben der Versionsnummer:

- **„Neueste Version“** (grün): Sie arbeiten bereits mit der aktuellsten Fassung.
- **„Update verfügbar“** (Bernstein): Eine neuere Version wartet auf Sie. Ein Klick auf diese Schaltfläche öffnet das Update-Fenster.
- **„OFFLINE“**: Der Dienst war nicht erreichbar. Versuchen Sie es später erneut – die Software läuft davon unbeeinflusst normal weiter.

Die Prüfung ist optional und blockiert nichts: Sind Sie offline, startet RLMP trotzdem reibungslos.

---

## 12.2 Das Update-Fenster

Sobald ein Update vorliegt, zeigt ein eigenes Fenster die aktuelle Version, die neue Version und die Release Notes an. Drei Möglichkeiten stehen zur Wahl:

- **Später**: Schließt das Fenster, ohne etwas zu verändern. Sie können es jederzeit erneut öffnen.
- **Herunterladen**: Startet den Download der neuen Version. Von selbst passiert hier nichts – erst ein Klick auf diese Schaltfläche setzt den Download in Gang. Ein Fortschrittsbalken zeigt den Verlauf an.
- **Neu starten und installieren**: Erscheint, sobald der Download abgeschlossen ist, startet die Anwendung neu und wendet das Update an.

---

## 12.3 Die Regel „nie während der Sendung“

Es kann vorkommen, dass die automatische Prüfung ausgerechnet dann ein Update findet, wenn Sie on air sind. RLMP unterbricht Sie in diesem Fall **nicht**: Das Update-Fenster wartet und öffnet sich erst von selbst, sobald die Sendung beendet ist – also wenn Sie alles gestoppt haben. Vorrang hat immer die laufende Show.

Nur eine Ausnahme ist vorgesehen, und sie ist beabsichtigt: Die Schaltfläche **Auf Updates prüfen** im Bereich *Info* (Menü Werkzeuge) setzt eine bewusste Handlung Ihrerseits voraus und öffnet das Fenster sofort, selbst während der Sendung. Wer sie drückt, tut dies aus eigenem Entschluss.

---

## 12.4 Unterschiede zwischen den Plattformen

Wie das Update installiert wird, hängt vom Betriebssystem ab.

**Windows und Linux (AppImage).**
Hier ist das Update vollständig integriert: Sie laden die neue Version im Fenster herunter, und beim nächsten Neustart installiert die Software sie ohne weiteres Zutun.

**macOS und Linux (.deb-Paket).**
Auf diesen Systemen kann RLMP das Update nicht zuverlässig selbst installieren. Anstelle der automatischen Installation weist Sie das Fenster darauf hin und öffnet den Browser auf der Download-Seite der neuen Version. Von dort laden Sie das Paket herunter und installieren es wie bei einer Neuinstallation (Kapitel 2). Ihre Projekte und die `.lmp`-Dateien bleiben davon unberührt.

> **Hinweis.** In keinem Fall bedeutet ein Update von RLMP einen Verlust Ihrer Projekte: Die `.lmp`-Dateien bleiben zwischen den Versionen kompatibel, eine manuelle Migration ist nicht nötig.
