#import "../lib/manuale-template.typ": *

= Installazione e primo avvio

L'installazione di Runtime Live Machine Pro è progettata per richiedere
il minimo di interazione: pochi click, nessuna configurazione manuale,
nessun prerequisito da installare separatamente. Il motore audio
(FFmpeg) è integrato nel pacchetto di installazione e non richiede alcun
intervento da parte tua.

== 2.1 Requisiti di sistema
Prima di procedere, verifica che il tuo computer soddisfi i requisiti
minimi. Le specifiche consigliate garantiscono la migliore esperienza
durante sessioni lunghe o con molte clip caricate simultaneamente.

#figure(
  align(center)[#table(
    columns: (33.33%, 33.33%, 33.33%),
    align: (auto,auto,auto,),
    table.header([], [Minimo], [Consigliato],),
    table.hline(),
    [#strong[Sistema operativo (Windows)]], [Windows 10
    64-bit], [Windows 11 64-bit],
    [#strong[Sistema operativo (macOS)]], [macOS 11 Big Sur], [macOS 13
    Ventura o successivi],
    [#strong[Sistema operativo (Linux)]], [Ubuntu 20.04 / Debian
    11], [Ubuntu 22.04 LTS],
    [#strong[RAM]], [4 GB], [8 GB o più],
    [#strong[Spazio su disco]], [300 MB (applicazione)], [1 GB + spazio
    per i file audio],
    [#strong[CPU]], [Qualsiasi dual-core moderno], [Quad-core o
    superiore],
  )]
  , kind: table
  )

Il software è ottimizzato per Apple Silicon (M1, M2, M3) e gira in modo
nativo su entrambe le architetture macOS senza emulazione Rosetta.

Non è richiesta una scheda audio dedicata: RLMP funziona con qualsiasi
periferica audio riconosciuta dal sistema operativo, dalla scheda audio
integrata ai mixer USB professionali come il Rødecaster Pro o
l'RØDECaster Duo.

== 2.2 Installazione su Windows
+ Scarica il file `Runtime-Live-Machine-Pro-1.15.15.exe` dal canale di
  distribuzione ufficiale.
+ Fai doppio click sull'eseguibile. L'installer NSIS si avvierà e
  copierà i file nelle directory appropriate.
+ Al termine, un collegamento verrà creato sul Desktop e nel menu Start.
+ L'applicazione si avvia automaticamente al completamento
  dell'installazione.

#strong[Nota su Windows SmartScreen.] Poiché il software viene
aggiornato con frequenza, il certificato di firma digitale potrebbe non
avere ancora accumulato la «reputazione» sufficiente per la whitelist
automatica di SmartScreen. Se compare l'avviso «Il PC è stato protetto
da Windows», clicca su #emph[Ulteriori informazioni] e poi su
#emph[Esegui comunque]. Il software è privo di malware; gli installer
ufficiali sono pubblicati esclusivamente attraverso i canali di
distribuzione dell'autore.

== 2.3 Installazione su macOS
+ Scarica il file `.dmg` dal canale ufficiale.
+ Apri il file immagine e trascina l'icona di Runtime Live Machine Pro
  nella cartella #emph[Applicazioni].
+ Al primo avvio, macOS potrebbe mostrare un avviso Gatekeeper («App non
  può essere aperta perché proviene da uno sviluppatore non
  identificato»). Per procedere, apri #emph[Preferenze di Sistema] →
  #emph[Sicurezza e Privacy] → #emph[Generali] e clicca su #emph[Apri
  comunque] accanto al nome dell'applicazione.

Dalla versione macOS 15 (Sequoia) in poi, il percorso è
#emph[Impostazioni di Sistema] → #emph[Privacy e sicurezza] → scorri
fino alla sezione #emph[Sicurezza].

#nota[
L'applicazione macOS non è firmata con un certificato
Apple Developer. Questo influisce anche sul modo in cui vengono gestiti
gli aggiornamenti, come spiegato nel Capitolo 12.
]

== 2.4 Installazione su Linux
Sono disponibili due formati di distribuzione:

- #strong[AppImage] --- eseguibile portabile, non richiede
  installazione. Rendi il file eseguibile (`chmod +x`) e avvialo
  direttamente.
- #strong[Pacchetto \.deb] --- per distribuzioni Debian/Ubuntu/Mint.
  Installa con `sudo dpkg -i nomefile.deb` oppure aprilo con il gestore
  pacchetti grafico.

Su alcune distribuzioni potrebbe essere necessario installare il
pacchetto `libasound2` per il supporto audio ALSA. Consulta la
documentazione della tua distribuzione se l'applicazione non si avvia.

== 2.5 La schermata di benvenuto
#figure(image("../screenshots/schermata-benvenuto.png", alt: "Figura 2.1 — La schermata di benvenuto: identità del software, stato dell’aggiornamento, azioni principali e selettore di lingua."),
  caption: [
    Figura 2.1 --- La schermata di benvenuto: identità del software,
    stato dell'aggiornamento, azioni principali e selettore di lingua.
  ]
)

Al primo avvio --- e a ogni avvio successivo, finché non apri un
progetto --- RLMP presenta la #strong[schermata di benvenuto], il punto
di accesso a tutte le operazioni preliminari. Il pannello è diviso in
due zone.

#strong[Zona sinistra --- Identità e azioni.] Il logo del software (le
barre di un VU meter con il simbolo di play) identifica la versione Pro.
Sotto il titolo e lo slogan compare il numero di versione installata,
accompagnato dallo stato del sistema di aggiornamento:

- #strong[«Aggiornato»] (verde) --- stai usando l'ultima versione
  disponibile.
- #strong[«Aggiornamento disponibile»] (ambra, lampeggiante) --- è un
  pulsante: cliccalo per aprire la finestra di aggiornamento (Capitolo
  12).
- #strong[«OFFLINE»] (rosso tenue) --- non è stato possibile contattare
  il servizio di aggiornamento; il software funziona ugualmente.

Sotto trovi le azioni principali:

- #emph[Nuovo Progetto] --- crea una sessione vuota con le colonne
  pronte al caricamento.
- #emph[Carica Progetto] --- apre un file `.lmp` esistente. Prima di
  renderlo operativo, RLMP esegue un #strong[controllo di integrità]:
  verifica che ogni file audio referenziato esista ancora nel percorso
  memorizzato. I file mancanti vengono immediatamente segnalati con un
  bordo rosso sulla rispettiva clip.
- #emph[Manuale] --- la voce è presente ma al momento disattivata: la
  documentazione consultabile dall'interno del software arriverà in una
  prossima versione via web.

#strong[Zona destra --- Selettore lingua.] RLMP supporta otto lingue
dell'interfaccia: Inglese, Italiano, Francese, Tedesco, Spagnolo,
Portoghese, Russo e Cinese semplificato. La lingua attiva è evidenziata
con un bordo ciano e un segno di spunta. La selezione ha effetto
immediato e viene memorizzata tra una sessione e l'altra.

== 2.6 Il primo avvio: cosa aspettarsi
Alla prima apertura di un progetto, noterai nell'header il logo con il
badge #strong[PRO] dal gradiente iridescente. Dietro l'interfaccia,
l'apertura del progetto avvia il motore audio in background: FFmpeg
viene inizializzato e il protocollo di streaming `media://` si mette in
ascolto, pronto a servire i file dal disco senza caricarli in memoria.

Il software si avvia preferibilmente in modalità a tutto schermo. Se la
finestra dovesse aprirsi ridimensionata, premi `F11` (Windows/Linux) o
`Ctrl+Cmd+F` (macOS) per portarla a schermo intero --- condizione
ottimale per il lavoro di regia.

Il #strong[Timer On Air] nell'header rimarrà a `--:--:--` finché non
viene lanciata la prima clip della sessione. Da quel momento inizierà a
contare il tempo trascorso in diretta: un riferimento utile per chi
lavora con scalette a tempo fisso.
