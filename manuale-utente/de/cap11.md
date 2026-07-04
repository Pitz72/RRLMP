# Kapitel 11 – Controllo Remoto (Fernsteuerung)

---

Nicht immer sitzt der Moderator vor dem Computer. Manchmal befindet er sich auf der anderen Seite des Studios, hinter einer Scheibe, oder bewegt sich mit einem Gast durch den Raum. Mit dem **Controllo Remoto** (der Fernsteuerung) von Runtime Live Machine Pro lassen sich die wesentlichen Abläufe der Show von einem zweiten Gerät aus steuern – einem Tablet, einem Telefon, einem Laptop –, sofern es sich im selben lokalen Netzwerk befindet. Der Browser genügt; auf dem entfernten Gerät muss nichts installiert werden.

Die Funktion trägt derzeit den Status **Beta**.

---

## 11.1 Wie es funktioniert

Bei der Aktivierung startet RLMP intern einen kleinen **lokalen Webserver**. Das entfernte Gerät verbindet sich mit diesem Server über eine im Browser geöffnete Adresse. Dort erscheint eine Steuerungsseite, die den Zustand der Spalte Musik abbildet und darauf einwirken lässt.

Das Ganze bleibt **innerhalb des lokalen Netzwerks**: Erreichbar ist der Server nur für Geräte im selben WLAN oder LAN des Studios, nicht über das Internet.

---

## 11.2 Aktivierung

1. Öffnen Sie die **Einstellungen** über das Menü Werkzeuge und wechseln Sie zum Reiter *Allgemein*.
2. Aktivieren Sie den Umschalter **Controllo Remoto (Beta)**.
3. Es erscheinen ein **sechsstelliger PIN**, der **Port** des Servers sowie die **Netzwerkadressen**, über die sich das entfernte Gerät verbinden kann.
4. Die Schaltfläche **Link kopieren** legt die einsatzbereite Adresse in die Zwischenablage (in der Form `http://<Adresse-des-Computers>:8787`).

Der Server lauscht auf Port **8787**. Der PIN wird bei jedem Anwendungsstart **neu erzeugt** und nirgends gespeichert – schließen und erneutes Öffnen von RLMP erzeugt also stets einen neuen PIN. Auch das Controllo Remoto selbst ist nach jedem Start zunächst deaktiviert und muss bei Bedarf wieder eingeschaltet werden.

---

## 11.3 Vom entfernten Gerät aus verbinden

1. Öffnen Sie auf dem Tablet oder Telefon den Browser und geben Sie die in den Einstellungen angezeigte Adresse ein – oder fügen Sie den kopierten Link ein.
2. Es erscheint eine Seite mit einem Tastenfeld. Geben Sie den **sechsstelligen PIN** ein.
3. Bei korrektem PIN zeigt die Seite die Liste der Clips aus der Spalte **Musik** mit den Wiedergabebefehlen sowie eine Schaltfläche **Stop All**. Eine eigene Schaltfläche versetzt die Seite in den Vollbildmodus – praktisch auf dem Tablet.

Von hier aus lassen sich die Titel der Spalte Musik starten und stoppen, und falls nötig alles auf einmal anhalten. Der Zustand aktualisiert sich in Echtzeit: Was am Hauptcomputer startet oder stoppt, erscheint sofort auf der entfernten Seite – und umgekehrt.

---

## 11.4 Was sich aus der Ferne steuern lässt

Das Controllo Remoto ist bewusst auf das Wesentliche beschränkt. Aus der Ferne lässt sich Folgendes tun:

- einen Clip der Spalte Musik **starten**,
- einen Clip der Spalte Musik **stoppen**,
- ein **Stop All** ausführen.

Mehr ist nicht vorgesehen. Der Rest der Regie – die anderen Spalten, das pad FX, der Editor, die Einstellungen – bleibt dem Hauptcomputer vorbehalten. Dahinter steckt eine bewusste Sicherheitsentscheidung: Die Fernbedienung soll den Musikfluss aus der Distanz steuerbar machen, nicht den Regieplatz ersetzen.

---

## 11.5 Sicherheit und Grenzen

- **PIN obligatorisch.** Ohne bestandene Prüfung des sechsstelligen PIN kann kein Gerät Befehle senden.
- **Schutz vor Brute-Force-Versuchen.** Die PIN-Eingabe ist zeitlich begrenzt: Nach mehreren fehlgeschlagenen Versuchen in kurzer Folge wird der Zugriff von diesem Gerät vorübergehend gesperrt.
- **Befehle auf der Whitelist.** Der Server akzeptiert ausschließlich die drei vorgesehenen Befehle – Start, Stopp, Stop All. Jede andere Anfrage wird verworfen.
- **Nur im lokalen Netzwerk.** Der Server ist für das Studionetzwerk gedacht. Bei offenem oder geteiltem WLAN sollten Sie genau abwägen, wer darauf zugreifen kann.
- **Keine Persistenz.** PIN und Aktivierungszustand werden nicht gespeichert; nach jedem Neustart beginnen Sie mit einer sauberen Konfiguration.

> **Hinweis.** Da es sich um eine Beta-Funktion handelt, kann der Umfang der verfügbaren Befehle in künftigen Versionen wachsen. Vorerst ist er auf den häufigsten Anwendungsfall zugeschnitten: die Musik während der Moderation aus der Distanz zu steuern.
