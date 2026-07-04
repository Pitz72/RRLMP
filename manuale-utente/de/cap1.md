# Kapitel 1 – Runtime Live Machine Pro: eine Philosophie

---

*Vorwort des Autors*

Fünfzehn Jahre mit offenen Mikrofonen hinterlassen deutliche Spuren bei denen, die sie durchlebt haben. Ich habe Podcasts betreut, Talks moderiert, ein Webradio am Laufen gehalten, und einen Großteil dieser Zeit habe ich alles allein gemacht: die Playlist, die Musik, die Interviews, die Pegel, das Timing. Ich weiß, wie es ist, mitten in der Sendung zu merken, dass der Song gleich zu Ende geht, während man den Gedanken, den man ausdrücken will, noch nicht einmal fertig formuliert hat. Ich weiß, was es heißt, mit der einen Hand den Fader herunterziehen und mit der anderen den richtigen Clip suchen zu müssen, während die dritte Hand – die man nicht hat – den roten Faden des Gesprächs halten sollte.

Runtime Live Machine Pro ist aus dieser Frustration entstanden und aus einer schlichten Überzeugung: Audio-Regie sollte keine eigenständige Arbeit sein. Sie sollte transparent sein. Der Sprecher, der Podcaster, der Content Creator, der nachts allein einen Talk moderiert – ohne einen Tontechniker an seiner Seite – muss sich auf das konzentrieren können, was er beherrscht: reden, denken, die Verbindung zu den Hörern aufbauen. Um den Rest kümmert sich die Software.

In RLMP stecken die Regeln, die ein guter Tonregisseur automatisch anwendet: die Hierarchie zwischen den Audio-Ereignissen, das Ducking, das einsetzt, wenn man spricht, die Musik, die im richtigen Moment stoppt und wieder einsetzt. Komplexe Regeln, verborgen hinter einer Oberfläche, die nur eine einzige Handlung verlangt: den richtigen Clip zum richtigen Zeitpunkt anzuklicken.

Diese Software richtet sich vor allem an alle, die kleine und mittlere Talk-Radios betreiben, an alle, die Podcasts mit professionellem Anspruch produzieren, an alle, die einen Live-Stream ohne Technik-Team im Rücken senden. Ausschließlich ist ihr Wesen aber nicht: Wer in stärker strukturierten Umgebungen arbeitet, findet ebenso Werkzeuge, die seinen Anforderungen gerecht werden. Das Ziel bleibt eines: den Sprecher unabhängig zu machen von unterstützenden Rollen, die nicht immer da sind und nicht immer gebraucht werden.

---

Jedes Werkzeug entsteht als Antwort. Runtime Live Machine Pro antwortet auf ein konkretes Problem: Live-Audio-Regie (Radio, Podcast, Events, Theater) ist eine Performance-Tätigkeit, keine Automatisierung. Sie verlangt sofortige Kontrolle, ruhige Nerven und eine Software, die einen im falschen Moment nicht im Stich lässt.

Die Software, die auf Ihrem Computer installiert ist, ist kein System zur 24/7-Musikplanung, kein DAW für die Postproduktion und auch kein einfacher Player mit Warteschlange. Sie ist etwas anderes: eine **Echtzeit-Regiemaschine**, gebaut um die Idee, dass jede Show ein einmaliger, unwiederholbarer Akt ist, der einen eigenen Rahmen und eine chirurgisch genaue Kontrolle über jeden Übergang verdient.

---

## 1.1 Für wen es gebaut wurde

Runtime Live Machine Pro wendet sich an zwei Nutzergruppen, die trotz unterschiedlicher Kontexte dasselbe Grundbedürfnis teilen.

Der **Broadcast-Profi** – der Regisseur eines kommerziellen Radios, der Tontechniker eines Audio- oder Video-Live-Streams, der Sprecher, der seine eigene Show verantwortet – findet in RLMP ein System auf Augenhöhe mit den professionellen Werkzeugen der oberen Klasse, dazu die operative Wendigkeit, die jene Systeme oft auf dem Altar der Komplexität opfern.

Der **Content Creator** – der unabhängige Podcaster, der Moderator eines Webradios, der Veranstalter von Live-Events – findet ein Werkzeug, das keine jahrelange technische Ausbildung erfordert, um es zu beherrschen, das aber bei der Qualität des Ergebnisses keine Kompromisse eingeht.

Beide finden eine Oberfläche, die sofort auf den Tastendruck reagiert, eine stabile Audio-Engine und ein Speichersystem, das nichts vergisst.

---

## 1.2 Die Philosophie „Single Show“

Das Grundkonzept von Runtime Live Machine Pro ist das **isolierte Projekt**. Jede Show, die Sie realisieren – eine Podcast-Folge, eine Radiosendung, eine Theateraufführung –, lebt in einer eigenständigen `.lmp`-Datei, die alles enthält: die Anordnung der Clips, die Lautstärken, die MIDI-Zuordnungen, die Cue-Punkte, die Regie-Notizen. Wenn Sie diese Datei laden, finden Sie die Show genau so vor, wie Sie sie verlassen haben.

Dieser Ansatz hat konkrete Folgen. Sie müssen die Software nicht jedes Mal neu einrichten, wenn Sie von einer Show zur nächsten wechseln. Sie können ein Projekt auf jeden beliebigen Computer mitnehmen – über die Funktion Export Package – und sich darauf verlassen, dass es funktioniert. Sie können vergangene Folgen archivieren und Monate später ohne Überraschungen wieder öffnen.

Die `.lmp`-Datei enthält nicht die physischen Audiodateien: Sie speichert die Pfade auf der Festplatte. Für den Wechsel zwischen Computern kopiert die Funktion **Export Package** alles Notwendige physisch in einen in sich geschlossenen Ordner.

---

## 1.3 Die Architektur Main-Side-Heavy

Die interne Architektur zu verstehen ist für die Nutzung der Software nicht zwingend nötig, hilft aber zu begreifen, warum bestimmte Probleme anderer Player hier nicht auftreten.

Runtime Live Machine Pro baut auf **Electron** auf, einer Plattform, die den Hauptprozess (*Main Process*, in Node.js) klar vom Rendering-Prozess der Oberfläche (*Renderer Process*) trennt. Diese Trennung wird bewusst genutzt.

Alle rechenintensiven Aufgaben – Audio-Dekodierung über FFmpeg, das Lesen der Dateien von der Festplatte, die Analyse der Wellenformen, die Verwaltung der Backups – sind an den Main Process delegiert. Der Renderer kümmert sich ausschließlich um die Oberfläche: die Clips anzeigen, die VU meter animieren, auf Klicks reagieren. Das Ergebnis ist eine Oberfläche, die auch während intensiver Vorgänge flüssig bleibt, und eine Audio-Engine, die nicht mit den Pixeln auf dem Bildschirm um die Ressourcen konkurriert.

Das eigene Protokoll `media://` sorgt dafür, dass die Audiodateien nie vollständig in den Arbeitsspeicher geladen werden: Sie werden direkt von der Festplatte an den Player gestreamt. Sie können stundenlange, unkomprimierte WAV-Dateien verwalten, ohne dass sich der Speicherverbrauch der Anwendung merklich ändert.

---

## 1.4 Das Regie-Raster: eine visuelle Grammatik

Die Arbeitsoberfläche von RLMP ist in senkrechte Spalten gegliedert, jede mit einer eigenen, klaren semantischen Rolle. Noch bevor Sie die Software starten, lohnt es sich, diese Grammatik zu verinnerlichen.

Im Hauptraster sind sechs Spalten sichtbar. Eine siebte Fläche – das **pad FX**, die *jingle machine* der Effekte – lebt außerhalb des Rasters, in einem eigenen Bereich, der in Kapitel 7 beschrieben wird.

| Spalte | Farbe | Funktion |
|---|---|---|
| **Show Assets** | Grün | Kennungen, Beds, strukturelle Untermalungen der Show |
| **Jingle** | Bernstein | Wiederkehrende, identitätsstiftende Jingles und Stacchi (Trenner) |
| **Promo** | Cyan | Promos, Eigenwerbung, geplante Ansagen |
| **Episoden-Musik** | Rot | Die Musik-Playlist |
| **Stimme / Aufnahmen** | Orange | Interviews, Sprachaufnahmen, gesprochene Blöcke |
| **Pre-Show** | Violett | Wartemusik vor der Sendung, mit Rotation von Jingles und Promos |

Die ersten drei Spalten (Show Assets, Jingle und Promo) teilen dieselbe Audio-Natur: Es sind Struktur- und Service-Elemente, die von der Mixing-Engine gleich behandelt werden. Die Unterscheidung ist organisatorisch: Kennungen von Jingles und Promos zu trennen hält die Playlist auch dann lesbar, wenn sie voll ist.

Jede Spalte hat eigenes Audio-Verhalten – Priorität im Mix, Ausschlussregeln, Fade-Werte –, das in Kapitel 6 im Detail behandelt wird. Für den Moment genügt es zu wissen, dass die Position eines Clips im Raster nicht dekorativ ist: Sie bestimmt, wie die Software ihn während der Sendung behandelt. Spalten, die Sie nicht brauchen, lassen sich aus der Ansicht ausblenden (Einstellungen → Allgemein → Regie-Layout), ohne die darin enthaltenen Clips zu verlieren.

---

## 1.5 Aktuelle Version und Aktualisierungen

Dieses Handbuch beschreibt die Version **1.11.5** von Runtime Live Machine Pro. Beim Start prüft die Software still, ob eine neuere Version verfügbar ist, und öffnet, falls sie eine findet, einen Update-Hinweis – niemals während einer Sendung. Das Update-System wird in Kapitel 12 beschrieben. Die Projektdateien `.lmp` sind mit den nachfolgenden Versionen kompatibel: Ein Update der Software bringt weder Verlust noch manuelle Migration bestehender Projekte mit sich.
