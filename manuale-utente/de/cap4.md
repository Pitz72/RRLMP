# KAPITEL 4: ERWEITERTE CLIP-BEARBEITUNG (EIGENSCHAFTEN)

Jede Audiodatei ist anders: Einige haben lange anfängliche Stille, andere haben eine zu geringe Lautstärke, wieder andere müssen sich endlos wiederholen.
Um auf das erweiterte Konfigurationsfeld zuzugreifen, machen Sie einen **Rechtsklick** auf einen beliebigen Clip und wählen Sie **"Edit"** (Bearbeiten).

Es öffnet sich ein modales Fenster, das in zwei Hauptbereiche unterteilt ist: **Visual & Basic** (Links) und **Behavior & Timing** (Rechts).

---

## 4.1 Grundeinstellungen (Visuell & Audio)

In diesem Abschnitt steuern Sie das Erscheinungsbild und die Roh-Lautstärke des Clips.

*   **Clip-Name**: Sie können den Clip nach Belieben umbenennen (z. B. von 	rack_01_final.mp3 in ERÖFFNUNGSTHEMA). Dies ändert nur das Etikett in der Software, nicht den ursprünglichen Dateinamen auf der Festplatte.
*   **Lautstärke (Gain)**: Ein Schieberegler von 0% bis 150%.
    *   Wenn Sie eine leise Aufnahme haben (z. B. eine WhatsApp-Sprachnachricht), können Sie sie über 100% schieben, um sie an den Rest der Show anzupassen.
*   **Benutzerdefinierte Farbe**: Standardmäßig erbt der Clip die Farbe seiner Spalte (z. B. Grün für Assets). Hier können Sie eine andere Farbe erzwingen, um ihn hervorzuheben (z. B. einen wichtigen Jingle in der grauen Spalte rot färben).

---

## 4.2 Chirurgische Präzision: Cue-Punkte & Trimmen

Oft sind Audiodateien nicht "sendebereit": Sie haben Sekunden der Stille am Anfang oder zu lange Ausläufe. Anstatt einen externen Audio-Editor zu verwenden, können Sie sie hier korrigieren. Diese Änderungen sind **nicht-destruktiv** (die Originaldatei bleibt intakt).

### Manuelle Steuerung
*   **Trim Start (Anfang)**: Legt fest, wie viele Sekunden am Anfang übersprungen werden sollen.
    *   *Beispiel*: Wenn Sie 2.5 einstellen, startet der Clip beim Drücken von Play sofort ab Sekunde 2.5 und überspringt die anfängliche Stille ("auf Schlag").
*   **Trim End (Ende)**: Legt fest, wie viele Sekunden am Ende abgeschnitten werden sollen.
    *   *Beispiel*: Wenn der Song 20 Sekunden unnötigen Schlussapplaus hat, erhöhen Sie diesen Wert, bis die "Neue Dauer" Sie zufriedenstellt.

### 🪄 Der Zauberstab (Smart Trim / Auto-Detect)
Um die Arbeit zu beschleunigen, enthält RLM einen grundlegenden Algorithmus für künstliche Intelligenz.
1.  Klicken Sie auf die Schaltfläche mit dem **Zauberstab**-Symbol neben den Trim-Steuerelementen.
2.  Die Software scannt die Datei in Sekundenbruchteilen.
3.  Erkennt automatisch, wo der eigentliche Ton beginnt und endet (über dem Schwellenwert von -40dB).
4.  Füllt die Felder *Start* und *End* automatisch für Sie aus.

> **Tipp**: Verwenden Sie den Zauberstab immer bei Sprachaufnahmen oder Interviews, um sie sofort zu bereinigen.

---

## 4.3 Verhalten (Behaviors & Logic)

Hier definieren Sie die Intelligenz des Clips: was er tun soll, wenn er startet, und was er tun soll, wenn er endet.

### Behavior (Überlagerungsmodus)
*   **Normal (Standard)**: Wenn Sie diesen Clip starten, wird jeder andere Clip, der **in derselben Spalte** spielt, gestoppt. Dies ist das Standardverhalten für Songs (einer schließt den anderen aus).
*   **Stacco** (Unterbrechung): Wenn Sie diesen Clip starten, stoppt er andere Clips in der Spalte **NICHT**, sondern schaltet sie vorübergehend "stumm" (oder überlagert sie).
    *   *Typische Verwendung*: Ein Soundeffekt oder ein Sprach-Jingle, den Sie über ein Musikbett in derselben Spalte spielen möchten, ohne das Bett zu unterbrechen.

### Next Action (Finale Automation)
Was passiert, wenn der Clip endet?
*   **Stop**: Der Clip endet und stoppt. (Standardverhalten).
*   **Loop**: Der Clip startet endlos von vorne. Nützlich für Betten und Hintergründe. Ein **[LOOP]**-Badge erscheint auf der Karte.
*   **Play Next**: Sobald dieser Clip zu verblassen beginnt (Fade Out), startet die Software automatisch den nächsten Clip in der Spalte.
    *   *Crossfade*: Der Übergang ist fließend, ohne Stille-Lücken. Ein **[NEXT]**-Badge erscheint auf der Karte.

---

## 4.4 Fades (Überblendungen)

Jede Spalte hat Standardwerte (z. B. Musik blendet in 2 Sekunden ein, Jingles sind trocken), aber hier können Sie diese überschreiben.

*   **Fade In (ms)**: Wie lange die Lautstärke benötigt, um das Maximum zu erreichen, wenn Sie Play drücken. (z. B. 2000ms = 2 Sekunden allmählicher Anstieg).
*   **Fade Out (ms)**: Wie lange es dauert, bis ausgeblendet wird, wenn Sie Stop drücken oder wenn der Clip natürlich endet.
    *   *Hinweis*: Ein langes Fade Out ist für Songs nützlich. Ein Fade Out bei 0 ist für harte Schnitte obligatorisch.

---

## 4.5 Zuweisung von Steuerungen (Input)

Am unteren Rand des Panels finden Sie die Referenzen für die externe Steuerung:
*   **Trigger Keybind**: Klicken Sie hier und drücken Sie eine Taste auf der Tastatur (z. B. "Q"), um sie diesem Clip zuzuweisen.
*   **MIDI Bind**: Zeigt die zugewiesene MIDI-Note an (z. B. NOTE:60). Um sie zu ändern, verwenden Sie den Modus "MIDI Learn" vom Hauptbildschirm aus (siehe Kap. 6).
