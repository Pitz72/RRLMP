# Kapitel 11 – Controllo Remoto (Fernsteuerung)

---

Nicht immer sitzt der Moderator vor dem Computer. Manchmal ist er auf der anderen Seite des Studios, hinter einer Scheibe, oder bewegt sich mit einem Gast. Das **Controllo Remoto** (die Fernsteuerung) von Runtime Live Machine Pro erlaubt es, die wesentlichen Abläufe der Show von einem zweiten Gerät (einem Tablet, einem Telefon, einem Laptop) aus zu steuern, das mit demselben lokalen Netzwerk verbunden ist, einfach über den Browser. Auf dem entfernten Gerät muss nichts installiert werden.

Die Funktion ist derzeit als **Beta** gekennzeichnet.

---

## 11.1 Wie es funktioniert

Wenn Sie es aktivieren, startet RLMP in seinem Inneren einen kleinen **lokalen Webserver**. Das entfernte Gerät verbindet sich mit diesem Server, indem es eine Adresse im Browser öffnet: Von dort erscheint eine Steuerungsseite, die den Zustand der Spalte Musik widerspiegelt und es erlaubt, auf sie einzuwirken.

Alles geschieht **innerhalb des lokalen Netzwerks**: Der Server ist von den Geräten erreichbar, die mit demselben WLAN oder LAN des Studios verbunden sind, und läuft nicht über das Internet.

---

## 11.2 Aktivierung

1. Öffnen Sie die **Einstellungen** aus dem Menü Werkzeuge und gehen Sie zum Reiter *Allgemein*.
2. Aktivieren Sie den Umschalter **Controllo Remoto (Beta)**.
3. Es erscheinen ein **sechsstelliger PIN**, der **Port** des Servers und die **Netzwerkadressen**, mit denen sich das entfernte Gerät verbinden kann.
4. Die Schaltfläche **Link kopieren** kopiert die einsatzbereite Adresse in die Zwischenablage (in der Form `http://<Adresse-des-Computers>:8787`).

Der Server lauscht auf dem Port **8787**. Der PIN wird bei jedem Start der Anwendung **neu erzeugt** und nicht gespeichert: RLMP zu schließen und wieder zu öffnen erzeugt einen neuen PIN. Auch das Controllo Remoto selbst startet bei jedem Start immer ausgeschaltet und muss bei Bedarf neu aktiviert werden.

---

## 11.3 Vom entfernten Gerät aus verbinden

1. Öffnen Sie auf dem Tablet oder Telefon den Browser und geben Sie die in den Einstellungen angezeigte Adresse ein (oder fügen Sie sie aus dem kopierten Link ein).
2. Es erscheint eine Seite mit einem Tastenfeld: Geben Sie den **sechsstelligen PIN** ein.
3. Bei korrektem PIN zeigt die Seite die Liste der Clips der Spalte **Musik**, mit den Wiedergabebefehlen, und eine Schaltfläche **Stop All**. Eine eigene Schaltfläche bringt die Seite in den Vollbildmodus, praktisch auf dem Tablet.

Von hier aus können Sie die Titel der Spalte Musik starten und stoppen und, falls nötig, alles stoppen. Der Zustand aktualisiert sich in Echtzeit: Was am Hauptcomputer startet oder stoppt, spiegelt sich auf der entfernten Seite, und umgekehrt.

---

## 11.4 Was sich aus der Ferne steuern lässt

Das Controllo Remoto ist bewusst minimal gehalten. Aus der Ferne können Sie:

- Einen Clip der Spalte Musik **starten**.
- Einen Clip der Spalte Musik **stoppen**.
- Ein **Stop All** ausführen.

Das sind die einzigen zugelassenen Aktionen. Der Rest der Regie (die anderen Spalten, das pad FX, der Editor, die Einstellungen) bleibt am Hauptcomputer. Es ist eine Sicherheitsentscheidung: Die Fernbedienung dient dazu, den Musikfluss aus der Distanz zu steuern, nicht dazu, den Regieplatz zu ersetzen.

---

## 11.5 Sicherheit und Grenzen

- **PIN obligatorisch.** Kein Gerät kann Befehle senden, ohne die Prüfung des sechsstelligen PIN bestanden zu haben.
- **Schutz vor Versuchen.** Die Versuche zur PIN-Eingabe sind zeitlich begrenzt: Nach einigen fehlgeschlagenen Versuchen in kurzer Folge wird der Zugriff von diesem Gerät vorübergehend blockiert.
- **Befehle auf Whitelist.** Der Server akzeptiert nur die drei vorgesehenen Befehle (starten, stoppen, Stop All): Jede andere Anfrage wird ignoriert.
- **Nur lokales Netzwerk.** Der Server ist für das Netzwerk des Studios gedacht. Ist Ihr WLAN offen oder geteilt, überlegen Sie genau, wer es erreichen kann.
- **Keine Persistenz.** PIN und Aktivierungszustand werden nicht gespeichert: Bei jedem Neustart beginnen Sie mit einer sauberen Konfiguration.

> **Hinweis.** Da es sich um eine Beta-Funktion handelt, kann sich der Satz der verfügbaren Befehle in künftigen Versionen erweitern. Vorerst ist er auf den häufigsten Anwendungsfall abgestimmt: die Musik während der Moderation aus der Distanz zu steuern.
