#import "../lib/manuale-template.typ": *

= Hardware, tastiera e MIDI

Runtime Live Machine Pro è progettato per integrarsi con l'hardware
esistente nello studio senza richiedere configurazioni elaborate. Questo
capitolo descrive come indirizzare l'uscita audio, come usare la
tastiera del computer come controller e come collegare dispositivi MIDI
fisici per un controllo tattile della regia.

== 8.1 Routing audio
=== Selezionare la periferica di uscita
Per impostazione predefinita, RLMP esce sulla periferica audio
predefinita del sistema operativo. In un contesto professionale o
semiprofessionale, con mixer USB, schede audio esterne o sistemi
multitraccia, è utile selezionare esplicitamente la destinazione del
segnale.

+ Apri le #strong[Impostazioni] dal menu Strumenti.
+ Nella scheda #emph[Audio & Mix], apri il menu della periferica di
  uscita: trovi l'elenco delle periferiche audio disponibili sul
  sistema.
+ Seleziona la periferica desiderata.

Se la periferica scelta viene scollegata, RLMP ripiega automaticamente
su quella di sistema; l'app monitora le connessioni e reagisce
all'inserimento o alla rimozione di dispositivi USB.

=== Mixer USB e setup multicanale
I mixer USB come il Rødecaster Pro, l'RØDECaster Duo o il Focusrite
Scarlett espongono tipicamente più canali USB al sistema operativo (Main
Mix, Sounds/Chat, Monitor, ecc.). RLMP appare come una singola sorgente
stereo; la scelta del canale USB su cui dirigerlo è nelle tue mani.

#strong[Setup consigliato con mixer USB.] Assegna RLMP a un canale
secondario del mixer (es. «Sounds» sul Rødecaster Pro) invece che al
canale principale. In questo modo controlli il volume di RLMP con un
fader fisico dedicato, lo separi dal segnale del microfono fisico e
applichi eventuale processing hardware solo a quel canale.

=== Latenza e buffer
RLMP utilizza le API audio native del sistema operativo. La latenza di
uscita è determinata dal buffer della periferica audio, non dal
software. Con schede audio professionali la latenza è nell'ordine di
pochi millisecondi, non percepibile in un contesto di playout.

Se noti artefatti audio (crepitii, dropout), il valore di buffer della
periferica è probabilmente troppo basso. Aumentalo dal pannello di
controllo della scheda audio (non da RLMP, che non gestisce direttamente
il driver): un buffer di 256 o 512 campioni è il punto di equilibrio
ideale tra latenza e stabilità.

== 8.2 Controllo da tastiera
La tastiera del computer è il controller più rapido disponibile in
diretta: non richiede coordinazione oculo-manuale, funziona al buio ed è
sempre a portata di mano. RLMP prevede un insieme di scorciatoie globali
e la possibilità di assegnare tasti alle singole clip.

=== Scorciatoie globali
#figure(
  align(center)[#table(
    columns: (50%, 50%),
    align: (auto,auto,),
    table.header([Tasto], [Azione],),
    table.hline(),
    [#strong[Esc]], [STOP ALL --- ferma tutte le clip attive],
    [#strong[Canc / Backspace]], [Elimina le clip selezionate],
    [#strong[Ctrl+Z]], [Annulla l'ultima modifica alla scaletta],
    [#strong[Ctrl+Y] (o #strong[Ctrl+Shift+Z])], [Ripeti la modifica
    annullata],
    [#strong[Ctrl+Shift+D]], [Mostra/nascondi il Debug Overlay],
    [#strong[Ctrl+Shift+M]], [Apri il simulatore MIDI (per test senza
    controller)],
    [#strong[F1, F2, F3…]], [Lancia la colonna corrispondente, contando
    le colonne visibili da sinistra],
  )]
  , kind: table
  )

`Esc` agisce come STOP ALL quando RLMP è la finestra attiva, anche
mentre il cursore è in un campo di testo. Non è più una scorciatoia
registrata a livello di sistema operativo: se l'app è in background,
riporta prima la finestra in primo piano.

Le altre scorciatoie restano sospese finché è aperta una finestra
(Impostazioni, editor della clip e simili): così `Ctrl+Z` o `Canc` non
toccano la scaletta mentre lavori altrove. `Esc`, con una finestra
aperta, la chiude senza fermare la diretta.

=== Tasti funzione: una colonna per tasto
I tasti #strong[F1], #strong[F2], #strong[F3]… lanciano la prima clip
disponibile delle colonne #strong[visibili] in griglia, nell'ordine in
cui le vedi da sinistra a destra. Con la disposizione predefinita: F1
Show Assets · F2 Jingle · F3 Promo · F4 Canzoni · F5 Voci · F6 Pre-Show.
Se nascondi una colonna dalle Impostazioni (Capitolo 13), i tasti si
spostano di conseguenza: F1 è sempre la prima colonna che vedi. Se hai
assegnato un tasto funzione a una clip specifica, quell'assegnazione ha
la precedenza.

#attenzione[
F1 lancia di norma Show Assets, e una clip di
quella colonna lanciata a mano ferma tutto ciò che è in onda tranne gli
effetti del pad FX, esattamente come il click sulla stessa clip.
]

=== Tasti personalizzati per singola clip
Oltre alle scorciatoie globali, ogni clip può avere un tasto dedicato.
Il badge corrispondente compare sulla card.

#strong[Per assegnare un tasto:] 1. Apri le impostazioni della clip
(tasto destro sulla card) oppure la finestra #strong[Keybinds] dal menu
Strumenti. 2. Clicca nel campo del tasto. 3. Premi il tasto desiderato.

#strong[Tasti disponibili.] Quasi qualsiasi tasto: lettere (A--Z),
numeri (0--9), tastierino numerico, barra spaziatrice, tasti funzione
liberi. Se il tasto è già assegnato a un'altra clip, il software segnala
il conflitto prima di sovrascrivere, così non crei doppioni invisibili.

#strong[Sicurezza durante la digitazione.] I tasti personalizzati
vengono disabilitati automaticamente quando sei in modalità di
inserimento testo (stai rinominando una clip o scrivendo una nota).
Questo previene lanci accidentali mentre digiti.

== 8.3 Controller MIDI
Il MIDI è la scelta professionale per un controllo fisico, tattile e
affidabile. RLMP supporta i controller USB-MIDI: tastiere, pad (es.
Novation Launchpad), controller a fader (es. Korg nanoKONTROL2),
superfici di controllo ibride.

=== Collegamento
Collega il controller USB al computer e avvia RLMP. Il software rileva i
dispositivi tramite la Web MIDI API del sistema e riconosce in tempo
reale la connessione e la disconnessione di un controller. La maggior
parte dei controller USB-MIDI è #emph[class-compliant] e non richiede
driver; per superfici professionali con driver proprietari, installa il
driver prima di collegare il dispositivo.

=== MIDI Learn
RLMP non richiede di conoscere la numerazione delle note MIDI né di
configurare i messaggi a mano. L'apprendimento avviene tramite la
modalità #strong[MIDI Learn], dal menu Strumenti (o dalla finestra
Keybinds).

#strong[Per mappare una clip a un tasto/pad:] 1. Attiva MIDI Learn. Le
card entrano in stato di attesa. 2. Seleziona la clip (o la cella del
pad FX) da mappare. 3. Suona la nota, premi il pad o il tasto sul
controller. Il badge `M` con il numero di nota compare sulla card.

#strong[Per mappare le funzioni globali:] - Seleziona #strong[STOP ALL]
e premi un tasto sul controller: quel tasto eseguirà lo Stop All. -
Seleziona il #strong[Master Volume] e muovi un fader o una manopola:
quel controllo gestirà il volume master in modo continuo.

Al termine, disattiva MIDI Learn per tornare alla modalità operativa.

=== Tipi di messaggi supportati
#strong[Note On] --- messaggi generati da pulsanti, pad e tasti. Ideali
per il lancio delle clip e delle azioni globali; RLMP risponde alla
pressione del tasto e riconosce tutti i canali MIDI. I messaggi Note Off
vengono ignorati.

#strong[Control Change (CC)] --- messaggi generati da fader e
potenziometri, con valore continuo da 0 a 127. Ideali per il Master
Volume: un fader fisico mappato sul master offre il controllo più
naturale del livello di uscita.

=== Portabilità delle mappature
<portabilità-delle-mappature>
Le mappature MIDI delle #strong[clip] sono salvate nel file di progetto
`.lmp`: portando il progetto su un altro computer con lo stesso
controller, funzioneranno senza riconfigurazione. Le mappature delle
#strong[funzioni globali] (Stop All, Master Volume) sono invece legate
al computer, salvate nelle preferenze locali dell'applicazione, e
restano valide per tutti i progetti su quella macchina.
