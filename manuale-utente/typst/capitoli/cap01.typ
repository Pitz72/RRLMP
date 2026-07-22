#import "../lib/manuale-template.typ": *

= Runtime Live Machine Pro: una filosofia

#emph[Nota dell'autore]

Quindici anni di microfoni aperti lasciano un'impronta precisa su chi li
ha vissuti. Ho gestito podcast, ho condotto talk, ho tenuto in piedi una
web radio, e per buona parte di quel tempo ho fatto tutto da solo: la
scaletta, la musica, le interviste, i volumi, il timing. So cosa
significa accorgersi in diretta che la canzone sta per finire mentre
stai ancora formulando il pensiero da esprimere. So cosa vuol dire dover
abbassare il fader con una mano e trovare la clip giusta con l'altra,
mentre la terza mano --- quella che non hai --- dovrebbe tenerti il filo
del discorso.

Runtime Live Machine Pro nasce da quella frustrazione, e da una
convinzione semplice: la regia audio non dovrebbe essere un lavoro a sé.
Dovrebbe essere trasparente. Lo speaker, il podcaster, il content
creator che conduce da solo una talk di notte --- senza un fonico che
gli fa da spalla --- deve poter concentrarsi su ciò che sa fare:
parlare, pensare, costruire il rapporto con chi ascolta. Il software si
occupa del resto.

Ho messo in RLMP le regole che un buon regista del suono applica
automaticamente: la gerarchia tra gli eventi audio, il ducking che
scatta quando parli, la musica che si ferma e riprende al momento
giusto. Regole complesse, nascoste sotto un'interfaccia che chiede un
solo gesto: cliccare la clip giusta al momento giusto.

Questo software è pensato soprattutto per chi gestisce piccole e medie
talk radio, per chi produce podcast con ambizione professionale, per chi
manda in onda un live streaming senza una squadra tecnica intorno. Ma la
sua natura non è esclusiva: chi lavora in contesti più strutturati
troverà strumenti adeguati alle proprie esigenze. L'obiettivo è uno
solo: rendere lo speaker indipendente da figure di supporto che non
sempre ci sono, e non sempre servono.

Ogni strumento nasce da una risposta. Runtime Live Machine Pro risponde
a un problema preciso: la regia audio dal vivo (radio, podcast, eventi,
teatro) è un'attività di performance, non di automazione. Richiede
controllo istantaneo, nervi saldi e un software che non tradisca nel
momento sbagliato.

Il software che trovi installato sul tuo computer non è un sistema di
schedulazione musicale H24, né un DAW per la post-produzione, né un
semplice player con coda. È qualcosa di diverso: una #strong[macchina da
regia in tempo reale], costruita attorno all'idea che ogni show è un
atto unico, irripetibile, che merita un contenitore dedicato e un
controllo chirurgico su ogni transizione.

== 1.1 Per chi è stato costruito
<per-chi-è-stato-costruito>
Runtime Live Machine Pro si rivolge a due tipologie di utenti che,
nonostante le differenze di contesto, condividono la stessa esigenza
fondamentale.

Il #strong[professionista broadcast] --- il regista di una radio
commerciale, il fonico di un live streaming audio o video, lo speaker
che gestisce il proprio show --- troverà in RLMP un sistema all'altezza
degli strumenti professionali di fascia alta, con l'agilità operativa
che quei sistemi spesso sacrificano sull'altare della complessità.

Il #strong[content creator] --- il podcaster indipendente, il conduttore
di una web radio, l'organizzatore di eventi dal vivo --- troverà uno
strumento che non richiede anni di formazione tecnica per essere
padroneggiato, ma che non scende a compromessi sulla qualità del
risultato.

Entrambi troveranno un'interfaccia che risponde al tasto
istantaneamente, un motore audio stabile e un sistema di salvataggio che
non dimentica.

== 1.2 La filosofia «Single Show»
Il concetto fondante di Runtime Live Machine Pro è il #strong[progetto
isolato]. Ogni show che realizzi --- una puntata di podcast, una diretta
radio, uno spettacolo teatrale --- vive in un file `.lmp` autonomo che
contiene tutto: la disposizione delle clip, i volumi, i mapping MIDI, i
punti di cue, le note di regia. Quando carichi quel file, ritrovi
esattamente lo show così come lo hai lasciato.

Questo approccio ha conseguenze concrete. Non devi riconfigurare il
software ogni volta che passi da uno show all'altro. Puoi portare un
progetto su qualsiasi computer --- tramite la funzione Esporta progetto
con audio --- e sapere che funzionerà. Puoi archiviare le puntate
passate e riaprirle mesi dopo senza sorprese.

Il file `.lmp` non contiene i file audio fisici: memorizza i percorsi
sul disco. Per lo spostamento tra computer, la funzione #strong[Esporta
progetto con audio] copia fisicamente tutto il necessario in una
cartella autocontenuta.

== 1.3 L'architettura Main-Side-Heavy
Capire l'architettura interna non è indispensabile per usare il
software, ma aiuta a comprendere perché certi problemi comuni ad altri
player qui non si verificano.

Runtime Live Machine Pro è costruito su #strong[Electron], una
piattaforma che separa nettamente il processo principale (#emph[Main
Process], in Node.js) dal processo di rendering dell'interfaccia
(#emph[Renderer Process]). Questa separazione è sfruttata in modo
intenzionale.

Tutte le operazioni pesanti --- decodifica audio tramite FFmpeg, lettura
dei file dal disco, analisi delle forme d'onda, gestione dei backup ---
sono delegate al Main Process. Il Renderer si occupa esclusivamente
dell'interfaccia: visualizzare le clip, animare i VU meter, rispondere
ai click. Il risultato è un'interfaccia che rimane fluida anche durante
operazioni intensive, e un motore audio che non compete per le risorse
con i pixel sullo schermo.

Il protocollo custom `media://` garantisce che i file audio non vengano
mai caricati interamente nella memoria RAM: vengono trasmessi in
streaming direttamente dal disco al player. Puoi gestire file WAV non
compressi di ore di durata senza che il consumo di memoria
dell'applicazione cambi in modo apprezzabile.

== 1.4 La griglia di regia: una grammatica visiva
L'interfaccia operativa di RLMP è organizzata in colonne verticali,
ciascuna con un ruolo semantico preciso. Prima ancora di avviare il
software, vale la pena fissare questa grammatica.

Sei colonne sono visibili nella griglia principale. Una settima
superficie --- il #strong[pad FX], la #emph[jingle machine] degli
effetti --- vive fuori dalla griglia, in un pannello dedicato descritto
al Capitolo 7.

#figure(
  align(center)[#table(
    columns: (33.33%, 33.33%, 33.33%),
    align: (auto,auto,auto,),
    table.header([Colonna], [Colore], [Funzione],),
    table.hline(),
    [#strong[Show Assets]], [Verde], [Sigle, basi, sottofondi
    strutturali dello show],
    [#strong[Jingle]], [Ambra], [Jingle e stacchi identificativi
    ricorrenti],
    [#strong[Promo]], [Ciano], [Promo, autopromozioni, annunci
    programmati],
    [#strong[Canzoni dell'episodio]], [Rosso], [La playlist musicale],
    [#strong[Voci / Preregistrazioni]], [Arancione], [Interviste,
    vocali, blocchi parlati],
    [#strong[Pre-Show]], [Viola], [Musica d'attesa prima della diretta,
    con rotazione di jingle e promo],
  )]
  , kind: table
  )

Le prime tre colonne (Show Assets, Jingle e Promo) condividono la stessa
natura audio: sono elementi di struttura e servizio, trattati allo
stesso modo dal motore di mixaggio. La distinzione è organizzativa:
separare le sigle dai jingle e dalle promo tiene la scaletta leggibile
anche quando è affollata.

Ogni colonna ha comportamenti audio distinti --- priorità nel mixaggio,
regole di esclusione, valori di fade --- che verranno dettagliati nel
Capitolo 6. Per ora è sufficiente sapere che la posizione di una clip
nella griglia non è decorativa: determina come il software la tratterà
durante la messa in onda. Le colonne che non ti servono possono essere
nascoste dalla vista (Impostazioni → Generali → Layout regia) senza
perdere le clip che contengono.

== 1.5 Versione corrente e aggiornamenti
Questo manuale descrive la versione #strong[1.15.15] di Runtime Live
Machine Pro. All'avvio, il software verifica in modo silenzioso la
disponibilità di una versione più recente e, se ne trova una, apre un
avviso di aggiornamento, mai durante una diretta. Il sistema di
aggiornamento è descritto nel Capitolo 12. I file di progetto `.lmp`
sono compatibili con le versioni successive: aggiornare il software non
comporta la perdita o la migrazione manuale dei progetti esistenti.
