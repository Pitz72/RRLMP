#import "../lib/manuale-template.typ": *

= Controllo Remoto

Non sempre chi conduce sta seduto davanti al computer. A volte il
conduttore è dall'altra parte dello studio, dietro un vetro, oppure si
muove con un ospite. Il #strong[Controllo Remoto] di Runtime Live
Machine Pro trasforma un telefono, un tablet o un secondo computer in
una piccola console collegata alla regia: i #strong[pad degli effetti]
(applausi, risate, gong…), la #strong[colonna Musica] con la
#strong[modalità MIX], e i due tasti di arresto, #strong[STOP FX] e
#strong[STOP ALL]. Basta il browser: sul dispositivo remoto non si
installa nulla.

== 11.1 Come funziona
Quando lo attivi, RLMP avvia al proprio interno un piccolo
#strong[server web locale]. Il dispositivo remoto apre un indirizzo nel
browser e riceve una pagina di controllo che rispecchia la regia in
tempo reale: quello che parte o si ferma sul computer principale si vede
subito sul telefono, e viceversa.

Tutto avviene #strong[dentro la rete locale]: il server è raggiungibile
dagli apparecchi collegati alla stessa rete Wi-Fi o via cavo dello
studio, e non passa da internet. Il server ascolta sulla porta
#strong[8787].

== 11.2 Attivazione
+ Apri le #strong[Impostazioni] dal menu Strumenti e resta nella scheda
  #emph[Generali].
+ Nella sezione #strong[Controllo Remoto] porta l'interruttore su
  #strong[Attivo].
+ Compare un riquadro con il #strong[QR code], il #strong[PIN] a sei
  cifre, l'#strong[indirizzo] da aprire sul dispositivo remoto e il
  numero di #strong[dispositivi collegati].

#figure(image("../screenshots/remoto-impostazioni.png", alt: "Figura 11.1 — La sezione Controllo Remoto delle Impostazioni: QR code, PIN, indirizzo, dispositivi collegati, «Copia link» e «Nuovo PIN»."),
  caption: [
    Figura 11.1 --- La sezione Controllo Remoto delle Impostazioni: QR
    code, PIN, indirizzo, dispositivi collegati, «Copia link» e «Nuovo
    PIN».
  ]
)

Nel riquadro trovi:

- #strong[QR code.] Inquadrato con la fotocamera del telefono, apre la
  pagina di controllo già collegata: non serve digitare né l'indirizzo
  né il PIN. Il PIN viaggia nella parte del link dopo il simbolo `#`,
  che il browser non invia mai in rete.
- #strong[PIN.] Sei cifre. #strong[Resta lo stesso fra un avvio e
  l'altro]: il telefono che l'ha usato una volta si ricollega da solo
  anche dopo aver chiuso e riaperto RLMP.
- #strong[Indirizzo.] Nella forma
  `http://<indirizzo-del-computer>:8787`. RLMP mette per primo
  l'indirizzo della rete vera (Wi-Fi o cavo) e in fondo quelli delle
  schede virtuali (WSL, Hyper-V, VirtualBox). Se il computer ne ha più
  d'uno, sotto compaiono gli #strong[altri indirizzi], da provare se il
  primo non risponde.
- #strong[Dispositivi collegati.] Si aggiorna in tempo reale ed è verde
  quando c'è almeno un dispositivo: conferma che il telefono è
  agganciato alla regia, senza bisogno di provare un pad in diretta.
- #strong[Copia link.] Copia negli appunti l'indirizzo (senza PIN), per
  esempio per mandarlo al telefono via Telegram o WhatsApp.
- #strong[Nuovo PIN.] Genera un PIN diverso, per esempio dopo averlo
  mostrato a qualcuno. I dispositivi collegati vengono scollegati e
  dovranno inserire il nuovo PIN o inquadrare di nuovo il QR code: se ce
  n'è almeno uno, RLMP chiede conferma.

Sotto l'interruttore c'è la casella #strong[Attiva il Controllo Remoto
all'apertura dell'app]. È #strong[spenta di default]: in quel caso il
server resta spento finché non lo accendi a mano, e nessun servizio di
rete è attivo senza una tua scelta. Accendila se usi il telefono a ogni
trasmissione.

Se l'avvio non riesce, tipicamente perché la porta 8787 è già occupata
da un'altra copia di RLMP rimasta aperta o da un altro programma,
l'interruttore torna su spento e compare un messaggio con il motivo.

== 11.3 Collegare il telefono o il tablet
Il modo più rapido è #strong[inquadrare il QR code] con la fotocamera
del telefono e toccare il link che compare. La pagina si apre già
collegata.

In alternativa, apri il browser del dispositivo, digita l'indirizzo
mostrato nelle Impostazioni e inserisci il #strong[PIN]: alla sesta
cifra la pagina si collega da sola. Da quel momento il PIN resta
memorizzato sul dispositivo, e la volta dopo basta riaprire la pagina.

La pagina segue la #strong[lingua del browser] del dispositivo: italiano
o inglese.

In alto c'è la riga di stato, con un pallino colorato e una scritta:
#strong[Collegato] in verde, seguito dal ritardo del collegamento in
millisecondi (andata e ritorno). A destra ci sono due tasti:

- #strong[⛶ (schermo intero)] --- toglie la barra del browser e lascia
  tutto lo spazio ai pulsanti. Non compare dove il browser non lo
  permette, per esempio su iPhone.
- #strong[PIN] --- dimentica il PIN memorizzato e torna alla schermata
  di inserimento. Serve per collegarsi a un'altra regia o con un altro
  PIN.

#suggerimento[
In una rete locale il browser non può
impedire al telefono di spegnere lo schermo. La pagina si ricollega da
sola al risveglio, ma in diretta conviene allungare il tempo di
spegnimento dello schermo, o tenere il telefono in carica.
]

== 11.4 La scheda FX: i pad dal telefono
#figure(image("../screenshots/remoto-fx.png", alt: "Figura 11.2 — La scheda FX sul telefono: due effetti in onda, accesi del loro colore, e in basso STOP FX e STOP ALL."),
  caption: [
    Figura 11.2 --- La scheda FX sul telefono: due effetti in onda,
    accesi del loro colore, e in basso STOP FX e STOP ALL.
  ]
)

La scheda #strong[FX] è quella che si apre per prima. Mostra tutti gli
effetti del pad FX della regia (Capitolo 7), con gli stessi nomi e gli
stessi colori, disposti in una griglia che riempie lo schermo senza
scorrere. Se gli effetti sono tanti, compaiono più pagine, da sfogliare
con i tasti #strong[◀] e #strong[▶].

- #strong[Il pad parte alla pressione del dito], non al rilascio, come
  un pad hardware: il tempo fra il tocco e l'effetto in onda è quello
  della rete, di solito pochi millesimi di secondo.
- #strong[Toccare di nuovo] un effetto in onda lo ferma, esattamente
  come il click sul pad in regia.
- #strong[Più effetti suonano insieme]: un applauso non ferma una
  risata.
- Un effetto in onda si #strong[accende del suo colore] con la scritta
  #strong[▶ IN ONDA], e si spegne da solo quando finisce.
- Un effetto il cui file non si trova ha il bordo tratteggiato rosso e
  la scritta #strong[FILE MANCANTE]: toccarlo non fa nulla.

#strong[Ogni tocco viene confermato dalla regia.] Se la conferma non
arriva entro un secondo e mezzo, il pad diventa rosso con la scritta
#strong[NON ARRIVATO] e il telefono vibra (dove la vibrazione è
disponibile): sai subito che l'effetto non è partito.

In fondo alla pagina ci sono due tasti grandi:

- #strong[■ STOP FX] --- ferma solo gli effetti. La musica e il resto
  restano in onda.
- #strong[■ STOP ALL] --- ferma tutto, come il pulsante ALL o il tasto
  `Esc` in regia.

Questi due tasti, a differenza dei pad, partono al #strong[rilascio] del
dito: stanno dove poggia il pollice, e uno STOP ALL partito per sbaglio
lascerebbe la diretta muta.

== 11.5 La scheda MUSICA e la modalità MIX
<la-scheda-musica-e-la-modalità-mix>
#figure(image("../screenshots/remoto-musica.png", alt: "Figura 11.3 — La scheda MUSICA con il MIX acceso: PROSSIMO con il titolo del brano dopo, il brano IN USCITA durante il mix e quello IN ONDA."),
  caption: [
    Figura 11.3 --- La scheda MUSICA con il MIX acceso: PROSSIMO con il
    titolo del brano dopo, il brano IN USCITA durante il mix e quello IN
    ONDA.
  ]
)

La scheda #strong[MUSICA] riporta la colonna Musica della regia. In cima
ci sono i comandi della #strong[modalità MIX] (Capitolo 7):

- #strong[MIX ACCESO / MIX SPENTO] --- accende e spegne la modalità MIX.
  Accenderla dal telefono apre la vista MIX anche sullo schermo della
  regia. Accanto, una riga ricorda cosa succede cambiando brano: «mix a
  tempo» con il MIX acceso, «taglio netto» con il MIX spento. Quando il
  MIX è acceso, la scheda si chiama #strong[MUSICA · MIX].
- #strong[▶▶ PROSSIMO] --- il pulsante grande. Mostra il titolo del
  brano successivo e come ci si arriverà: #strong[mix a tempo] o
  #strong[crossfade classico]. Toccandolo, la regia passa a quel brano
  con il mix, anche se il MIX è spento: è il comando dei passaggi
  rapidi. I brani il cui file non si trova vengono saltati. Se non c'è
  niente in onda, il pulsante diventa #strong[▶ START] e fa partire il
  primo brano; a scaletta finita diventa #strong[FINE SCALETTA] e non fa
  nulla.
- #strong[Ultimo passaggio] --- una riga dice com'è andato l'ultimo
  cambio: mix a tempo (in verde), crossfade classico o non eseguito (in
  ambra).

Sotto c'è l'elenco dei brani. Il brano in onda ha la scritta #strong[▶
IN ONDA]\; durante un mix, quello che sta uscendo ha la scritta
#strong[IN USCITA] e il bordo ambra. Ogni riga ha un pulsante:

- #strong[▶ PLAY] --- fa partire il brano. Con il MIX acceso e un brano
  in onda diventa #strong[MIX ▶]: la regia ci arriva con un mix invece
  di tagliare.
- #strong[■ STOP] --- ferma il brano in onda o in uscita.

STOP ALL resta in fondo alla pagina; STOP FX compare solo nella scheda
FX.

#suggerimento[
Per una classifica veloce o per un
medley in attesa del televoto: in regia scegli la durata del mix
#strong[CORTO] nella vista MIX (Capitolo 7), poi dal telefono accendi il
MIX, premi #strong[▶ START] e, quando vuoi passare al brano dopo,
#strong[▶▶ PROSSIMO]. Le mani restano libere per il microfono.
]

== 11.6 Collegamento e stato
La pagina sorveglia il collegamento da sola. Ogni tre secondi controlla
che la regia risponda e mostra il ritardo nella riga di stato. Se
qualcosa va storto lo dice:

- #strong[Ricollegamento…] (ambra) --- il collegamento è caduto e la
  pagina sta riprovando. I pad diventano grigi finché non torna.
- #strong[Non collegato --- riprovo…] --- la regia non risponde
  (computer spento, rete assente, RLMP chiuso). La pagina continua a
  riprovare e si ricollega appena può, senza chiedere di nuovo il PIN.
- #strong[Controllo remoto spento in regia --- in attesa…] --- in regia
  qualcuno ha spento il Controllo Remoto. La pagina si ricollega quando
  viene riacceso.
- #strong[Non collegato: il comando non è partito.] --- hai toccato un
  pad mentre il collegamento era assente.

I tocchi fatti senza collegamento #strong[non vengono messi in coda]: un
applauso che parte dieci secondi dopo è peggio di un applauso che non
parte.

Quando riaccendi lo schermo del telefono o torni sulla pagina, il
collegamento viene controllato subito. Se in regia è stato generato un
#strong[nuovo PIN], la pagina torna alla schermata del PIN con la
scritta «Il PIN è stato cambiato in regia: inserisci quello nuovo». Se
la pagina è già aperta, basta inquadrare il nuovo QR code: si ricollega
da sola.

== 11.7 Sicurezza e limiti
- #strong[PIN obbligatorio.] Nessun dispositivo può inviare comandi
  senza il PIN a sei cifre. Il PIN è generato con il generatore
  crittografico del sistema.
- #strong[Protezione dai tentativi.] Dopo dieci tentativi sbagliati in
  cinque minuti da uno stesso apparecchio, l'accesso da
  quell'apparecchio viene bloccato temporaneamente.
- #strong[Solo dalla pagina del controllo remoto.] Il server accetta
  collegamenti soltanto dalla pagina che serve lui stesso: una pagina
  web di un altro sito, aperta su un dispositivo della stessa rete,
  viene respinta prima ancora di poter chiedere il PIN.
- #strong[Comandi su lista chiusa.] Il server accetta solo i comandi
  previsti: lancio e arresto dei pad FX, STOP FX, avvio e arresto dei
  brani della colonna Musica, PROSSIMO, accensione e spegnimento della
  modalità MIX, STOP ALL. Ogni pad o brano comandato deve esistere in
  regia; qualsiasi altra richiesta viene rifiutata.
- #strong[Cosa resta in regia.] Le altre colonne, l'editor delle clip,
  le impostazioni, la registrazione e la gestione dei progetti si usano
  solo dal computer principale.
- #strong[Solo rete locale.] Il server è pensato per la rete dello
  studio. Il PIN non cambia da solo: se la rete è aperta o condivisa,
  valuta chi può raggiungerla e usa #strong[Nuovo PIN] quando serve.
- #strong[Spegnimento.] Il server si ferma alla chiusura
  dell'applicazione.

== 11.8 Se il telefono non trova la regia
+ #strong[Stessa rete.] Telefono e computer devono essere sulla stessa
  rete Wi-Fi, #strong[non sulla rete ospiti]: le reti ospiti di molti
  router isolano i dispositivi fra loro.
+ #strong[Firewall di Windows.] Al primo avvio del server, Windows
  chiede se consentire a Runtime Live Machine Pro l'accesso alla rete.
  Va consentito. Se la rete di casa o dello studio è impostata come
  «Pubblica», l'accesso va consentito anche sulle reti pubbliche.
+ #strong[Altro indirizzo.] Se il primo indirizzo non risponde, prova
  gli altri elencati nelle Impostazioni.
+ #strong[Porta occupata.] Se l'interruttore si spegne da solo con un
  messaggio, la porta 8787 è usata da un'altra copia di RLMP o da un
  altro programma: chiudila e riattiva il Controllo Remoto.
