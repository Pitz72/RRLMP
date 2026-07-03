# Kapitel 6 — Die Mixing-Engine

---

Das Grundproblem der manuellen Radioregie ist die Vervielfachung gleichzeitiger Handlungen: einen Titel starten, die Musik absenken, ins Mikrofon sprechen, den nächsten Clip vorbereiten, die Uhr im Blick behalten. Jede zusätzliche Aktion ist eine Gelegenheit zum Fehler, in einem Kontext, in dem der Fehler öffentlich und sofort ist.

Die Mixing-Engine von Runtime Live Machine Pro beseitigt den Großteil dieser Zwischenhandlungen, indem sie sie an die Software delegiert. Es geht nicht um Automatisierung im Sinne von „die Software macht die Dinge an deiner Stelle, ohne dass du es weißt“, sondern um die Automatisierung der Regeln, die Sie selbst anwenden würden, wenn Sie genug Hände hätten, um sie alle auszuführen.

---

## 6.1 Die Audio-Hierarchie

Das automatische Mixing-System beruht auf einer **Prioritätshierarchie** zwischen den Clip-Typen. Am einfachsten versteht man sie, wenn man sie sich als Rangfolge des „Rederechts“ vorstellt.

**Stimme / Aufnahmen — absolute Priorität.**
Wenn ein Sprach-Clip läuft, bleibt er auf seiner Nennlautstärke und alles andere wird abgesenkt. Kein anderes Signal kann diese Regel außer Kraft setzen.

**Episoden-Musik.**
Sie räumt der Stimme den Platz, hat aber Vorrang vor den Beds der Assets. Wenn ein Song einsetzt, werden die Musikbetten der Assets auf null gebracht (sie stoppen nicht: Sie laufen still weiter, bereit für die Rückkehr). Das ist die Music Dominance, weiter unten beschrieben.

**Show Assets, Jingle und Promo — die Service-Beds.**
Sie werden von den Stimmen abgesenkt und von der Musik stummgeschaltet. Ist ein Asset jedoch ein **Stacco** (Trenner), übernimmt es die Führung (siehe §6.4).

**Effekte des pad FX.**
Die Soundeffekte bleiben außerhalb der Hierarchie: Sie erklingen auf ihrer eigenen Lautstärke, legen sich über das, was on air ist, und werden nicht stummgeschaltet. Es gibt nur eine Höflichkeit gegenüber dem Gesprochenen: Wenn eine Stimme aktiv ist, sinken die Effekte auf halbe Lautstärke (50 %), um sie nicht zu überdecken, und steigen dann von selbst wieder an.


---

## 6.2 Automatisches Ducking

Das **Ducking** ist der Mechanismus, mit dem ein Signal abgesenkt wird, wenn ein höher priorisiertes Signal in die Wiedergabe eintritt.

Der häufigste Fall: Ein Song läuft in voller Dynamik; Sie starten ein vorproduziertes Interview aus der Spalte Stimme. In diesem Moment bringt RLMP den Song auf etwa **20 % der Lautstärke** (eine Reduktion von rund 14 dB) mit einer weichen Blende von einer halben Sekunde, sodass die Stimme den Klangraum verständlich einnimmt. Sobald das Interview endet, steigt der Song mit einem ebenso flüssigen Fade In wieder auf die ursprüngliche Lautstärke.

Der Operator berührt nichts. Die ausgeführte Geste war ein einziger Klick: das Interview zu starten. Das Ausmaß der Reduktion und ihre Geschwindigkeit sind in den Einstellungen regelbar (Kapitel 13).

---

## 6.3 Music Dominance: intelligente Verwaltung der Beds

Ein klassischer klanglicher Fehler ist der Moment, in dem sich ein Song und ein Musikbett (*bed*) überlagern: zwei rhythmische Elemente, die aufeinanderprallen, zwei Kick-Drums, die nicht zusammenfallen — das Ergebnis ist wirr.

RLMP handhabt dieses Szenario mit der **Music Dominance**.

**Das typische Szenario.** Ein Bed läuft in loop in der Spalte Assets, unter der Stimme des Moderators. Der Moderator startet einen Titel aus der Spalte Musik.

**Was RLMP tut.** Es stoppt das Bed nicht, denn es zu stoppen würde bedeuten, es danach von Hand neu starten zu müssen. Stattdessen bringt es das Bed still auf **Lautstärke null** und hält es „im Phantom“ in der Wiedergabe: Die Datei läuft weiter, der loop läuft weiter, aber es ist nichts zu hören.

**Das klangliche Ergebnis.** Man hört nur den Song. Das Bed ist verschwunden, ohne dass der Operator etwas getan hat.

**Die Rückkehr.** Wenn der Song endet, taucht das Bed mit einem automatischen Fade In wieder auf und setzt an dem Punkt fort, an dem es sich im loop befand. Der Fluss (Bed → Song → Bed) läuft ohne einen einzigen zusätzlichen Klick ab.

---

## 6.4 Stacchi: die Ausnahme von der Regel

Das Verhalten **Stacco** (Trenner, in den Eigenschaften jedes Clips konfigurierbar, siehe Kapitel 5) kehrt die Hierarchie vorübergehend um: Der Clip, der es trägt, wird zum vorrangigen. Er blendet die anderen Assets seiner Spalte stumm und senkt die Musik ab, stoppt aber nichts. Die angewandte Blende ist schneller als die des gewöhnlichen Ducking, für einen perkussiveren, klareren Einstieg.

Der typische Einsatz ist die gesprochene *Station-ID* („Sie hören…“): Sie muss klar hörbar sein, während das Bed darunter weiterläuft. Für ein gepflegteres Ergebnis kombinieren Sie den Stacco mit einem kurzen Fade In (300–500 ms): Der Einstieg wird weich, nicht abrupt.

---

## 6.5 Lautstärke-Angleichung (loudness)

Clips unterschiedlicher Herkunft kommen fast immer mit unterschiedlichen Pegeln an: eine ordentlich gemasterte Kennung, eine leise aufgenommene Telefonstimme, ein Titel, der zu seiner ganz eigenen Lautstärke heruntergeladen wurde. Um ständige manuelle Gain-Anpassungen zu vermeiden, wendet RLMP standardmäßig eine **Lautstärke-Angleichung** an, die auf dem loudness-Standard EBU R128 basiert, mit einem Ziel von **−16 LUFS**.

In der Praxis bewertet die Software die wahrgenommene Lautheit jedes Clips und nähert sie einer gemeinsamen Referenz an, sodass Songs, Stimmen und Beds bereits auf einer stimmigen Ebene starten. Die Funktion ist standardmäßig aktiv, und der Zielwert ist in den Einstellungen → Master Chain regelbar.

---

## 6.6 Master Chain: die Prozessorkette auf dem Master-Bus

![Der Reiter Master-Kette im Fenster Einstellungen.](../screenshots-de/impostazioni-master-chain.png)

*Abbildung 6.1 — Die Master Chain: Lautstärke-Angleichung (−16 LUFS), HPF bei 30 Hz, multiband glue und Limiter Brickwall.*

Das kombinierte Signal aller laufenden Clips durchläuft nach der Master-Lautstärke eine **Prozessorkette** auf dem Master-Bus, bevor es das Ausgabegerät erreicht. Die Kette ist standardmäßig aktiv und auf einen broadcast-tauglichen Klang ausgelegt, ohne dass eine aufwendige Konfiguration nötig ist.

Sie umfasst drei in Reihe geschaltete Stufen.

**High-Pass Filter (HPF) bei 30 Hz.**
Beseitigt die unnötigen Sub-Bass-Frequenzen, die Headroom verbrauchen und die Wiedergabesysteme verschmutzen können, mit einer sanften Flankensteilheit. Die Grenzfrequenz ist regelbar (20–200 Hz). Bei Deaktivierung wird die Stufe vollständig transparent.

**Multiband glue.**
Kein einzelner Kompressor, sondern drei „sanfte“ Kompressoren, die parallel auf drei Frequenzbändern (Bässe, Mitten, Höhen) arbeiten, getrennt durch einen Crossover. Jedes Band hat kalibrierte Schwellen und Verhältnisse, um den Mix zu „verkleben“, ohne ihn zu quetschen, und die dynamische Varianz zwischen Clips unterschiedlichen Pegels einzudämmen. Der Stil ist unter einigen Presets wählbar (Neutral, Rock, Jazz, Elektronisch); das Standard-Preset ist Neutral.

**Limiter Brickwall.**
Schwelle bei −1 dBFS, mit hohem Limiting-Verhältnis und blitzschneller Reaktion. Er garantiert, dass das Signal nie den maximal zulässigen Pegel überschreitet, und verhindert digitale Verzerrung (Clipping), ganz gleich, was davor geschieht.

Die gesamte Kette, und jede einzelne Stufe, ist konfigurierbar und über die Einstellungen → Master Chain abschaltbar, wo Sie auch eine Schaltfläche finden, um die Standardwerte wiederherzustellen. In einem Kontext, in dem das Signal bereits von einem Hardware-Mixer oder einer externen Kette verarbeitet wird, können Sie sie abschalten, um doppelte Bearbeitungen zu vermeiden.
