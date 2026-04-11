# KAPITEL 5: DIE MISCH-ENGINE (DAS GEHIRN)

Runtime Live Machine Pro ist kein einfacher Player, der Audiodateien zufällig abspielt. In seinem Inneren befindet sich ein immer aktives **Misch-"Gehirn"**.
Die Software agiert wie ein unsichtbarer virtueller Tontechniker: Sie hört zu, was Sie tun, und passt automatisch die Lautstärke der anderen Spuren an, um sicherzustellen, dass das Endergebnis immer sauber und verständlich ist.

Sie müssen sich nicht darum kümmern, die Musik manuell leiser zu machen, wenn ein Interview beginnt: RRLMP kümmert sich darum.

---

## 5.1 Die Audio-Hierarchie (Die Pyramide)

Um zu verstehen, wie es funktioniert, stellen Sie sich die Spalten als eine Pyramide der Wichtigkeit vor. Wer oben steht, "befiehlt" über die Lautstärke dessen, der darunter steht.

1.  **EBENE 1 (Oberste Bosse): STIMMEN / VORAUFGEZEICHNETES** (Orange Spalte)
    *   Sie haben immer absolute Priorität. Niemand kann ihre Lautstärke senken. Wenn sie sprechen, werden alle anderen still.
2.  **EBENE 2 (Mittelschicht): EPISODEN-SONGS** (Rote Spalte)
    *   Sie werden von Stimmen abgesenkt. Aber sie befehlen über Assets.
3.  **EBENE 3 (Hintergrund): SHOW ASSETS** (Grüne Spalte)
    *   Das sind die Betten und Klangteppiche. Sie werden von fast allem anderen stummgeschaltet.

> **Wohlgemerkt**: Die Spalte **SFX / CARTWALL** (Grau) ist "außerhalb des Systems". Soundeffekte spielen immer mit maximaler Lautstärke und überlagern alles, ohne andere zu beeinflussen oder von ihnen beeinflusst zu werden. Ein Applaus muss laut zu hören sein, auch über einer Stimme.

---

## 5.2 Das automatische Ducking (Radio-Effekt)

Dies ist die im Radio am häufigsten verwendete Funktion. "Ducking" ist das automatische Absenken der Musik, wenn jemand spricht.

*   **Wie es funktioniert**:
    1.  Sie haben einen Song oder ein Bett in Wiedergabe (Lautstärke 100%).
    2.  Sie starten einen Clip aus der Spalte **STIMMEN** (z. B. ein Interview oder eine Sprachnachricht).
    3.  Die Software senkt den Song/das Bett sofort und sanft auf einen Hintergrundpegel (ca. 20% der Lautstärke oder -14dB).
    4.  Die Stimme klingt klar über der Musik.
    5.  Sobald der Stimmen-Clip endet, steigt die Musik automatisch wieder auf 100%.

*   **Vorteil**: Sie müssen nicht die Maus verwenden, um Fader zu senken, während Sie versuchen, das Interview zu starten. Es ist alles automatisch.

---

## 5.3 Musik-Dominanz (Intelligentes Betten-Management)

Ein klassischer Fehler von Anfänger-Regisseuren ist es, einen Song *über* ein rhythmisches Bett zu spielen, was ein klangliches Chaos erzeugt (Schlagzeug gegen Schlagzeug). RRLMP löst dieses Problem mit der **Musik-Dominanz**.

*   **Das Szenario**:
    Sie haben ein Bett (Show Asset) im Loop unter der Stimme des Sprechers. Irgendwann starten Sie eine Platte (Song).
*   **Was RRLMP tut**:
    Anstatt das Bett zu stoppen (das Sie nach dem Song bereit brauchen könnten), bringt die Software es auf **Lautstärke 0 (Stumm)**, lässt es aber "geisterhaft" weiterlaufen.
*   **Das Ergebnis**:
    Man hört nur den Song. Das Bett ist verschwunden.
*   **Die Rückkehr**:
    Wenn der Song endet (oder Sie Stop auf dem Song drücken), taucht das Bett automatisch wieder auf (Fade In).

Dies ermöglicht Ihnen einen kontinuierlichen Fluss "Bett -> Song -> Bett", ohne jemals ein zweites Mal auf "Play" auf dem Bett klicken zu müssen.

---

## 5.4 Ausnahmen: Die "Stacchi" (Unterbrechungen/Überlagerungen)

Was passiert, wenn Sie einen Radio-Jingle *über* das Bett spielen wollen, ohne dass das Bett ganz verschwindet?
Hier kommt die Einstellung **Behavior: Stacco** ins Spiel (siehe Kap. 4).

*   Wenn ein Clip in der Assets-Spalte auf "Normal" eingestellt ist, stoppt er andere Betten.
*   Wenn er als **"Stacco"** eingestellt ist, überlagert er die anderen Betten und senkt sie leicht ab, ohne sie jedoch zu stoppen. Es ist ideal für Station-IDs ("Sie hören Runtime Radio..."), die über das Intro eines Titels oder eines Bettes "reiten" müssen.
