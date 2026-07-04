# Kapitel 1 – Runtime Live Machine Pro: eine Philosophie

---

*Vorwort des Autors*

Fünfzehn Jahre am offenen Mikrofon hinterlassen ihre Spuren. Ich habe Podcasts betreut, Talks moderiert, ein Webradio am Laufen gehalten – meistens ganz allein, mit Playlist, Musik, Interviews, Pegeln und Timing gleichzeitig im Kopf. Ich kenne das Gefühl, mitten in der Sendung zu merken, dass der Song gleich endet, während der eigene Gedanke noch nicht fertig gesprochen ist. Mit der einen Hand zieht man den Fader herunter, mit der anderen sucht man schon den richtigen Clip – und eigentlich bräuchte man eine dritte Hand, um zugleich den roten Faden des Gesprächs festzuhalten.

Aus genau dieser Frustration ist Runtime Live Machine Pro entstanden, dazu aus einer einfachen Überzeugung: Audio-Regie sollte kein eigenständiger Job sein, sondern möglichst unsichtbar bleiben. Wer nachts allein einen Talk moderiert, ohne Tontechniker an seiner Seite, muss sich auf das konzentrieren können, was er wirklich kann: reden, denken, die Verbindung zu den Hörern halten. Um den Rest kümmert sich die Software.

In RLMP steckt das Regelwerk, das ein guter Tonregisseur ganz automatisch anwendet: die Hierarchie zwischen den Audio-Ereignissen, das Ducking beim Einsatz der Stimme, die Musik, die im richtigen Moment stoppt und ebenso zuverlässig wieder einsetzt. Diese Komplexität verbirgt sich hinter einer Oberfläche, die nur eines verlangt: im richtigen Moment auf den richtigen Clip zu klicken.

Gedacht ist die Software vor allem für alle, die kleine und mittlere Talk-Radios betreiben, für Podcaster mit professionellem Anspruch und für alle, die einen Livestream ohne Technik-Team im Rücken senden. Ausschließlich für diese Gruppe ist sie deshalb aber nicht: Auch wer in stärker strukturierten Umgebungen arbeitet, findet hier passende Werkzeuge. Das Ziel bleibt dabei immer dasselbe – den Sprecher unabhängig zu machen von unterstützenden Rollen, die nicht immer verfügbar sind und nicht immer gebraucht werden.

---

Jedes Werkzeug antwortet auf etwas. Runtime Live Machine Pro antwortet auf ein konkretes Problem: Live-Audio-Regie – bei Radio, Podcast, Events oder Theater – ist eine Performance-Disziplin und keine Automatisierungsaufgabe. Gefragt sind sofortige Kontrolle, ruhige Nerven und eine Software, die im falschen Moment nicht im Stich lässt.

Was auf Ihrem Computer installiert ist, ist deshalb kein System zur 24/7-Musikplanung, kein DAW für die Postproduktion und auch kein simpler Player mit Warteschlange. Es ist etwas Eigenständiges: eine **Echtzeit-Regiemaschine**, die davon ausgeht, dass jede Show ein einmaliger, unwiederholbarer Akt mit eigenem Rahmen ist – und die dafür chirurgisch genaue Kontrolle über jeden einzelnen Übergang bietet.

---

## 1.1 Für wen es gebaut wurde

Runtime Live Machine Pro richtet sich an zwei Nutzergruppen, die trotz unterschiedlicher Kontexte dasselbe Grundbedürfnis teilen.

Für den **Broadcast-Profi** – den Regisseur eines kommerziellen Radios, den Tontechniker eines Audio- oder Video-Livestreams, den Sprecher, der seine eigene Show verantwortet – bietet RLMP ein System auf Augenhöhe mit professionellen Werkzeugen der oberen Klasse, ohne deren operative Schwerfälligkeit zu übernehmen.

Der **Content Creator** dagegen – der unabhängige Podcaster, der Moderator eines Webradios, der Veranstalter von Live-Events – bekommt ein Werkzeug an die Hand, das keine jahrelange technische Ausbildung verlangt und bei der Ergebnisqualität dennoch keine Kompromisse eingeht.

Beiden Gruppen steht eine Oberfläche zur Verfügung, die sofort auf den Tastendruck reagiert, dazu eine stabile Audio-Engine und ein Speichersystem, das nichts vergisst.

---

## 1.2 Die Philosophie „Single Show“

Das Grundkonzept von Runtime Live Machine Pro ist das **isolierte Projekt**. Jede Show, die Sie realisieren – eine Podcast-Folge, eine Radiosendung, eine Theateraufführung –, lebt in einer eigenständigen `.lmp`-Datei mit allem Nötigen darin: der Anordnung der Clips, den Lautstärken, den MIDI-Zuordnungen, den Cue-Punkten, den Regie-Notizen. Laden Sie diese Datei, finden Sie die Show genau so vor, wie Sie sie verlassen haben.

Dieser Ansatz hat handfeste Vorteile. Die Software muss nicht bei jedem Wechsel von einer Show zur nächsten neu eingerichtet werden. Ein Projekt lässt sich über die Funktion Export Package auf jeden beliebigen Computer mitnehmen, und es funktioniert dort zuverlässig. Vergangene Folgen können Sie archivieren und Monate später ohne böse Überraschungen wieder öffnen.

Die `.lmp`-Datei enthält nicht die physischen Audiodateien: Sie speichert die Pfade auf der Festplatte. Für den Wechsel zwischen Computern kopiert die Funktion **Export Package** alles Notwendige physisch in einen in sich geschlossenen Ordner.

---

## 1.3 Die Architektur Main-Side-Heavy

Um die Software zu nutzen, muss man die interne Architektur nicht verstehen. Wer sie kennt, versteht aber leichter, warum Probleme, die bei anderen Playern auftreten, hier ausbleiben.

Runtime Live Machine Pro baut auf **Electron** auf, einer Plattform, die den Hauptprozess (*Main Process*, in Node.js) klar vom Rendering-Prozess der Oberfläche (*Renderer Process*) trennt. Diese Trennung ist kein Zufall, sondern Absicht.

Alle rechenintensiven Aufgaben – Audio-Dekodierung über FFmpeg, das Lesen der Dateien von der Festplatte, die Analyse der Wellenformen, die Verwaltung der Backups – laufen im Main Process. Der Renderer kümmert sich ausschließlich um die Oberfläche: Clips anzeigen, VU-Meter animieren, auf Klicks reagieren. So bleibt die Oberfläche auch bei intensiven Vorgängen flüssig, während die Audio-Engine nicht mit den Bildschirmpixeln um Ressourcen konkurrieren muss.

Das eigene Protokoll `media://` sorgt dafür, dass Audiodateien nie vollständig in den Arbeitsspeicher wandern: Sie werden direkt von der Festplatte an den Player gestreamt. Selbst stundenlange, unkomprimierte WAV-Dateien lassen sich verwalten, ohne dass der Speicherverbrauch der Anwendung merklich steigt.

---

## 1.4 Das Regie-Raster: eine visuelle Grammatik

Die Arbeitsoberfläche von RLMP gliedert sich in senkrechte Spalten, jede mit einer klaren, eigenen semantischen Rolle. Diese Grammatik lohnt es sich zu verinnerlichen, noch bevor Sie die Software zum ersten Mal starten.

Im Hauptraster sind sechs Spalten sichtbar. Eine siebte Fläche kommt hinzu: das **pad FX**, die *jingle machine* der Effekte. Sie lebt außerhalb des Rasters, in einem eigenen Bereich, der in Kapitel 7 beschrieben wird.

| Spalte | Farbe | Funktion |
|---|---|---|
| **Show Assets** | Grün | Kennungen, Beds, strukturelle Untermalungen der Show |
| **Jingle** | Bernstein | Wiederkehrende, identitätsstiftende Jingles und Stacchi (Trenner) |
| **Promo** | Cyan | Promos, Eigenwerbung, geplante Ansagen |
| **Episoden-Musik** | Rot | Die Musik-Playlist |
| **Stimme / Aufnahmen** | Orange | Interviews, Sprachaufnahmen, gesprochene Blöcke |
| **Pre-Show** | Violett | Wartemusik vor der Sendung, mit Rotation von Jingles und Promos |

Die ersten drei Spalten – Show Assets, Jingle und Promo – teilen dieselbe Audio-Natur: Struktur- und Serviceelemente, die die Mixing-Engine gleich behandelt. Der Unterschied liegt in der Organisation: Kennungen von Jingles und Promos getrennt zu halten, macht die Playlist auch dann noch lesbar, wenn sie voll ist.

Jede Spalte bringt ihr eigenes Audio-Verhalten mit – Priorität im Mix, Ausschlussregeln, Fade-Werte –, das Kapitel 6 im Detail behandelt. Fürs Erste genügt zu wissen: Die Position eines Clips im Raster ist nicht dekorativ, sondern bestimmt, wie die Software ihn während der Sendung behandelt. Spalten, die Sie nicht brauchen, blenden Sie einfach aus (Einstellungen → Allgemein → Regie-Layout), ohne dass die darin enthaltenen Clips verloren gehen.

---

## 1.5 Aktuelle Version und Aktualisierungen

Dieses Handbuch beschreibt Version **1.11.5** von Runtime Live Machine Pro. Beim Start prüft die Software im Hintergrund, ob eine neuere Version verfügbar ist, und öffnet gegebenenfalls einen Update-Hinweis – niemals während einer Sendung. Das Update-System beschreibt Kapitel 12. Die Projektdateien `.lmp` bleiben mit späteren Versionen kompatibel: Ein Software-Update bringt weder Datenverlust noch manuelle Migration bestehender Projekte mit sich.
