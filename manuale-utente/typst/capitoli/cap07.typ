#import "../lib/manuale-template.typ": *

= Il Pad FX e la vista Automix

Due superfici di lavoro vivono sopra la griglia, richiamabili con un
tasto e pensate per due momenti opposti della regia: il #strong[pad FX],
per lanciare effetti e stacchi a colpo sicuro senza interrompere nulla,
e la #strong[vista Automix], per gestire il flusso musicale come farebbe
un DJ. Nessuna delle due sottrae spazio alla griglia: si aprono quando
servono e si chiudono con un click.

== 7.1 Il pad FX: la jingle machine
#figure(image("../screenshots/pad-fx.png", alt: "Figura 7.1 — Il pad FX: la jingle machine 5×5 degli effetti sonori, con lancio a sovrapposizione."),
  caption: [
    Figura 7.1 --- Il pad FX: la jingle machine 5×5 degli effetti
    sonori, con lancio a sovrapposizione.
  ]
)

Gli effetti sonori non hanno una colonna nella griglia. Vivono nel
#strong[pad FX], un pannello a griglia di celle (una #emph[jingle
machine]) che si apre dal pulsante #strong[FX] nell'header (il LED del
pulsante diventa verde) e resta flottante in un angolo dello schermo.

Il pad è un #strong[overlay non bloccante]: non oscura la board e non
intercetta i click diretti altrove. Puoi lanciare un effetto e, nello
stesso istante, continuare a operare sulle colonne o sui comandi
dell'header. Per questa ragione il tasto `Esc` non chiude il pad: resta
il comando di STOP ALL, sempre disponibile. Il pad si chiude dal suo
pulsante di chiusura o di nuovo dal toggle FX.

=== Caricare e lanciare gli effetti
Il pad nasce con una griglia di 25 celle (5×5) e cresce in righe quando
aggiungi altri effetti. Per popolarlo, #strong[trascina i file audio
direttamente sulle celle] del pad, esattamente come faresti con una
colonna della griglia.

Un click su una cella #strong[lancia l'effetto]. Gli effetti del pad
sono polifonici e si sovrappongono: più celle possono suonare insieme,
sopra qualsiasi cosa sia in onda, senza fermarla. Il comportamento audio
è identico a quello di una clip normale: cambia soltanto la superficie
di lancio. La cella dell'effetto in onda si accende del suo colore, e un
contatore sul pulsante FX nell'header indica quanti effetti stanno
suonando in quel momento.

=== Configurare un effetto
Gli effetti si configurano su due livelli, pensati per due esigenze
diverse:

- #strong[Impostazioni rapide] --- il caso comune per una jingle
  machine: nome, colore, volume, loop. Bastano pochi secondi.
- #strong[Impostazioni complete] --- la stessa finestra delle clip di
  griglia (editor della forma d'onda, trim, marker, fade, assegnazione
  tasti), raggiungibile dalla voce «Impostazioni complete…» all'interno
  delle rapide.

=== Posizione del pad
Il pad può stare nell'angolo in basso a sinistra o in basso a destra
dello schermo: la preferenza si imposta con il tasto a freccia nella
testata del pad e viene ricordata tra le sessioni. A destra copre la
NoteBoard e l'ultima colonna; scegli il lato in base a come hai disposto
la tua scaletta.

#nota[
In modalità MIDI Learn, un click su una cella del pad
#strong[seleziona] l'effetto per l'assegnazione invece di suonarlo ---
così non mandi in onda un jingle mentre stai mappando i controlli (vedi
Capitolo 8).
]

== 7.2 La vista Automix
#figure(image("../screenshots/vista-automix.png", alt: "Figura 7.2 — La vista Automix: il deck della colonna Musica, la compatibilità BPM e la modalità automatica a fine brano."),
  caption: [
    Figura 7.2 --- La vista Automix: il deck della colonna Musica, la
    compatibilità BPM e la modalità automatica a fine brano.
  ]
)

La #strong[vista Automix] è il deck della colonna Musica: una schermata
a tutto campo, richiamata dal pulsante #strong[MIX] nell'header, che
presenta la scaletta musicale come una console da DJ. Si apre sopra la
board ma sotto il pad FX, così gli effetti restano utilizzabili anche
mentre l'Automix è aperto. Come per il pad, `Esc` non la chiude: resta
il comando di emergenza, e il pulsante STOP ALL rimane raggiungibile
nell'header.

=== Il deck
In alto ci sono due display. A sinistra il brano #strong[in onda]:
titolo, BPM, tempo trascorso e durata, tempo rimanente e una barra di
avanzamento a LED. A destra il #strong[prossimo] brano della colonna
Musica, con BPM, durata e compatibilità. In mezzo c'è il pulsantone
verde #strong[TRANSIZIONE]: con un solo comando applica lo stesso
crossfade che useresti dalla griglia, ma con l'attenzione in più
dell'aggancio ritmico. Se non c'è niente in onda, al suo posto trovi
#strong[START], che fa partire il primo brano.

Sotto i display c'è la scaletta della colonna Musica, una riga per brano
con numero, titolo, durata e BPM. La riga del brano in onda è accesa del
colore della colonna.

=== Compatibilità e transizioni beat-matched
<compatibilità-e-transizioni-beat-matched>
Sotto il titolo di ogni brano, un #strong[pallino di compatibilità] con
il brano precedente ne indica l'affinità ritmica, seguito da una breve
spiegazione (per esempio «beat non rilevato → crossfade classico»):

- #strong[Verde] --- i due tempi si agganciano bene: la transizione può
  essere beat-matched.
- #strong[Giallo] --- aggancio possibile ma con qualche riserva.
- #strong[Rosso] --- tempi troppo distanti per un aggancio pulito.

Quando l'aggancio ritmico non è praticabile (BPM non rilevato, beat
incerto, tempi troppo diversi), il software lo dichiara e ripiega
automaticamente su un #strong[crossfade classico], senza sorprese in
diretta.

=== La modalità automatica
<la-modalità-automatica>
Sotto il pulsante di transizione c'è l'interruttore #strong[Auto a fine
brano]. Quando è attivo la scritta diventa verde e RLMP fa partire da
solo il passaggio al brano successivo quando la traccia in onda si
avvicina alla fine.

Questa modalità è un'eccezione deliberata alla filosofia del software,
che per scelta non automatizza lo show. Per questo è #strong[disattivata
di default] e funziona #strong[solo mentre la vista Automix è aperta]:
chiudere la vista disattiva l'automazione. È lo strumento giusto per un
blocco musicale continuo, la mezz'ora di sola musica prima di rientrare
in voce, non per l'intera diretta.
