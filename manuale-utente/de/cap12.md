# Kapitel 12 – Aktualisierungen

---

Runtime Live Machine Pro aktualisiert sich selbst, aber niemals zu Ihrem Nachteil. Zwei Regeln tragen das Ganze: Kein Update darf eine Sendung stören, und kein Download startet ohne Ihre Zustimmung. Dieses Kapitel erklärt, wie die Software das Vorhandensein neuer Versionen prüft, wie sie sie installiert und warum sie sich je nach Betriebssystem manchmal unterschiedlich verhält.

---

## 12.1 Die Prüfung beim Start

Kurz nach dem Start (etwa drei Sekunden) prüft RLMP still, ob eine neuere Version existiert. Das Ergebnis erscheint im Begrüßungsbildschirm, neben der Versionsnummer:

- **„Neueste Version“** (grün) – Sie verwenden die aktuellste Version.
- **„Update verfügbar“** (Bernstein) – eine neuere Version ist verfügbar. Es ist eine Schaltfläche: Klicken Sie darauf, um das Update-Fenster zu öffnen.
- **„OFFLINE“** – der Dienst konnte nicht erreicht werden; versuchen Sie es später erneut. Die Software funktioniert normal.

Die Prüfung ist optional und nicht blockierend: Wenn Sie offline sind, startet und arbeitet RLMP ohne Probleme.

---

## 12.2 Das Update-Fenster

Wenn ein Update verfügbar ist, zeigt das dedizierte Fenster die aktuelle Version, die neue Version und die Release Notes. Von hier aus entscheiden Sie:

- **Später** – schließt das Fenster, ohne etwas zu tun. Sie können es jederzeit wieder öffnen.
- **Herunterladen** – startet den Download der neuen Version. Der Download **startet nie von selbst**: Er beginnt erst, wenn Sie diese Schaltfläche drücken. Ein Fortschrittsbalken zeigt den Verlauf.
- **Neu starten und installieren** – erscheint, wenn der Download abgeschlossen ist: startet die Anwendung neu und wendet das Update an.

---

## 12.3 Die Regel „niemals während der Sendung“

Die automatische Prüfung kann ein Update ausgerechnet dann finden, während Sie on air sind. In diesem Fall **unterbricht RLMP Sie nicht**: Das Update-Fenster wartet und öffnet sich erst dann von selbst, wenn die Sendung beendet ist (wenn Sie alles stoppen). Die Priorität ist immer die laufende Show.

Es gibt nur eine Ausnahme, und sie ist gewollt: Die Schaltfläche **Auf Updates prüfen**, im Bereich *Info* (Menü Werkzeuge), ist eine ausdrückliche Handlung von Ihnen und öffnet das Fenster sofort, auch während der Sendung. Wenn Sie sie drücken, dann weil Sie es wollen.

---

## 12.4 Unterschiede zwischen den Plattformen

Die Art, wie das Update installiert wird, hängt vom Betriebssystem ab.

**Windows und Linux (AppImage).**
Das Update ist vollständig integriert: Sie laden die neue Version aus dem Fenster herunter, und die Software installiert sie beim nächsten Neustart, ohne manuelle Schritte.

**macOS und Linux (.deb-Paket).**
Auf diesen Systemen kann RLMP das Update nicht zuverlässig installieren. Statt der automatischen Installation weist Sie das Fenster darauf hin und öffnet den Browser auf der Download-Seite der neuen Version: Von dort laden Sie das Paket herunter und installieren es, wie Sie es bei einer Neuinstallation tun würden (Kapitel 2). Ihre Projekte und die `.lmp`-Dateien bleiben unangetastet.

> **Hinweis.** In allen Fällen bringt ein Update von RLMP keinen Verlust der Projekte mit sich: Die `.lmp`-Dateien sind zwischen den Versionen kompatibel und erfordern keine manuelle Migration.
