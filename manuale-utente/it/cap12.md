# Capitolo 12 — Aggiornamenti

---

Runtime Live Machine Pro si aggiorna da solo, ma mai a tuo discapito. Due regole reggono tutto: nessun aggiornamento deve interferire con una diretta, e nessun download parte senza il tuo consenso. Questo capitolo spiega come il software controlla la presenza di nuove versioni, come le installa e perché a volte si comporta in modo diverso a seconda del sistema operativo.

---

## 12.1 Il controllo all'avvio

Poco dopo l'avvio (circa tre secondi), RLMP verifica in modo silenzioso se esiste una versione più recente. L'esito compare nella schermata di benvenuto, accanto al numero di versione:

- **«Aggiornato»** (verde) — stai usando l'ultima versione.
- **«Aggiornamento disponibile»** (ambra) — è disponibile una versione più recente. È un pulsante: cliccalo per aprire la finestra di aggiornamento.
- **«OFFLINE»** — non è stato possibile contattare il servizio; riprova più tardi. Il software funziona normalmente.

Il controllo è opzionale e non bloccante: se sei offline, RLMP parte e lavora senza problemi.

---

## 12.2 La finestra di aggiornamento

Quando un aggiornamento è disponibile, la finestra dedicata mostra la versione corrente, la nuova versione e le **note di rilascio**: l'elenco reale delle novità di quella versione (lo stesso changelog di questo software), formattato e leggibile, non un semplice elenco di file. Le note restano visibili anche a download completato, subito prima di installare, così sai sempre cosa stai per applicare. Da qui decidi tu:

- **Più tardi** — chiude la finestra senza fare nulla. Potrai riaprirla quando vuoi.
- **Scarica** — avvia il download della nuova versione. Il download **non parte mai da solo**: comincia solo quando premi questo pulsante. Una barra di avanzamento ne mostra il progresso.
- **Riavvia e installa** — compare quando il download è completo: chiude l'applicazione e applica l'aggiornamento. Se il progetto aperto ha modifiche non salvate, prima di installare RLMP chiede cosa fare, con le stesse scelte della chiusura: **Salva** (salva, poi installa), **Non Salvare** (installa scartando le modifiche) o **Annulla** (non installa nulla e l'app resta aperta). Se il salvataggio non va a buon fine, l'installazione non parte. Superata questa domanda, la chiusura è pulita e immediata e il software non resta aperto dietro l'installer.

---

## 12.3 La regola «mai durante la diretta»

Il controllo automatico può trovare un aggiornamento proprio mentre sei in onda. In quel caso, RLMP **non ti interrompe**: la finestra di aggiornamento resta in attesa e si apre da sola soltanto quando la diretta è finita (quando fermi tutto). La priorità è sempre lo show in corso.

C'è una sola eccezione, ed è voluta: il pulsante **Controlla aggiornamenti ora**, nel pannello *Info* (menu Strumenti), è un'azione esplicita tua e apre subito la finestra, anche in diretta. Se lo premi, è perché lo vuoi.

---

## 12.4 Differenze tra le piattaforme

Il modo in cui l'aggiornamento viene installato dipende dal sistema operativo.

**Windows e Linux (AppImage).**
L'aggiornamento è completamente integrato: scarichi la nuova versione dalla finestra e il software la installa al successivo riavvio, senza passaggi manuali.

**macOS e Linux (pacchetto .deb).**
Su questi sistemi RLMP non può installare l'aggiornamento in modo affidabile. Al posto dell'installazione automatica, la finestra ti avvisa e apre il browser sulla pagina di download della nuova versione: da lì scarichi il pacchetto e lo installi come faresti per una nuova installazione (Capitolo 2). I tuoi progetti e i file `.lmp` restano intatti.

> **Nota.** In tutti i casi, aggiornare RLMP non comporta la perdita dei progetti: i file `.lmp` sono compatibili tra le versioni e non richiedono migrazione manuale.
