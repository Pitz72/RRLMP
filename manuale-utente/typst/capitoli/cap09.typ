#import "../lib/manuale-template.typ": *

= Registrazione della sessione

La registrazione della sessione trasforma Runtime Live Machine Pro da
strumento di playout a strumento di produzione completa. Invece di
richiedere un software di registrazione separato o una catena di routing
virtuale, RLMP cattura direttamente il #strong[master mix
post-processato], ovvero tutto ciò che esce dall'applicazione, inclusi
gli effetti del Master Chain, in un file audio sul disco.

== 9.1 Avviare la registrazione
Il controllo della registrazione si trova nell'header, identificato
dall'icona di registrazione.

#strong[Avvio.] Clicca sul pulsante di registrazione. Un indicatore
rosso e un contatore mostrano che la cattura è in corso. La
registrazione parte immediatamente: tutto ciò che esce dall'output del
software da quel momento viene catturato.

Non è necessario avere clip in riproduzione per avviare la
registrazione: puoi avviare la cattura in anticipo rispetto all'inizio
dello show, per non perdere i primi secondi in caso di partenza
anticipata.

#strong[Cosa viene registrato.] Il segnale catturato è il #strong[master
dopo il limiter]: include il mix di tutte le clip in riproduzione e il
processing dell'intero Master Chain (HPF, glue multibanda, limiter). È
esattamente il segnale che raggiunge la periferica audio di uscita.

#strong[Il formato interno.] Durante la cattura, RLMP scrive un flusso
compresso Opus (in container WebM) a 320 kbps: leggerissimo sul disco e
trasparente all'ascolto. La registrazione continua ha un limite di
sicurezza di circa #strong[quattro ore]\; oltre quella durata la cattura
si ferma automaticamente per non saturare la memoria.

#strong[Overhead di sistema.] La cattura avviene a valle del motore
audio, senza gravare sul Renderer. Puoi registrare sessioni di ore senza
preoccuparti del consumo di risorse.

== 9.2 Fermare la registrazione e scegliere il formato
Quando clicchi di nuovo sul pulsante per fermare la registrazione, si
apre la #strong[finestra di esportazione]. È il momento in cui scegli in
quale formato salvare il file: la conversione dal flusso interno al
formato finale è affidata a FFmpeg.

=== Formati disponibili
#figure(
  align(center)[#table(
    columns: (33.33%, 33.33%, 33.33%),
    align: (auto,auto,auto,),
    table.header([Formato], [Estensione], [Caratteristiche],),
    table.hline(),
    [#strong[WAV]], [`.wav`], [Lossless non compresso. Massima qualità,
    file grandi. Ideale per archivio e post-produzione.],
    [#strong[FLAC]], [`.flac`], [Lossless compresso. Stessa qualità del
    WAV, dimensioni ridotte. Ideale per archivio.],
    [#strong[MP3]], [`.mp3`], [Lossy. Bitrate selezionabile. Ideale per
    distribuzione e podcast.],
    [#strong[OGG]], [`.ogg`], [Lossy open-source. Buon rapporto
    qualità/dimensione.],
    [#strong[WEBM]], [`.webm`], [Lossy, ottimizzato per il web.
    Corrisponde al formato interno di cattura.],
  )]
  , kind: table
  )

=== Opzioni di qualità
<opzioni-di-qualità>
Per i formati lossless (WAV e FLAC) puoi selezionare la
#strong[profondità di bit]: 16 bit (standard CD), 24 bit (standard
professionale broadcast, valore predefinito) o 32 bit float (massima
precisione, se la registrazione verrà masterizzata in seguito).

Per i formati lossy (MP3, OGG, WEBM) puoi selezionare il
#strong[bitrate] tra 128, 192, 256 e 320 kbps. Per un podcast destinato
alla distribuzione online, 192 kbps stereo è il minimo consigliato; 256
kbps è lo standard corrente per la qualità «trasparente».

=== Selezione del percorso di salvataggio
Nella finestra di esportazione scegli la cartella di destinazione e il
nome del file. Se non specifichi un nome, RLMP ne genera uno basato su
data e ora della sessione. Al termine della conversione, un toast di
conferma mostra il percorso del file salvato.

== 9.3 Considerazioni pratiche
=== Sincronizzazione con lo show
La registrazione cattura tutto il tempo trascorso tra Start e Stop,
inclusi i silenzi. Se hai avviato la cattura 30 secondi prima
dell'inizio effettivo dello show, il file risultante includerà quei 30
secondi iniziali. Per un risultato pronto alla distribuzione senza
post-editing, avvia la registrazione esattamente quando inizia lo show.

=== Registrazione e backup contemporanei
Il sistema di autosave del progetto (vedi Capitolo 10) e la
registrazione della sessione operano in modo indipendente. Puoi
registrare uno show mentre l'autosave salva silenziosamente lo stato del
progetto: le due operazioni non interferiscono.

=== Formato consigliato per contesti diversi
#strong[Podcast] --- MP3 256 kbps stereo o FLAC 16 bit. Il primo se
distribuisci direttamente il file, il secondo se passerai per un editor.

#strong[Archivio storico] --- WAV 24 bit o FLAC 24 bit. Dimensioni
generose, massima flessibilità per eventuali rimaster futuri.

#strong[Radio / Streaming] --- verifica i requisiti della tua
piattaforma. La maggior parte accetta MP3 128--192 kbps; alcune
richiedono WAV non compresso. RLMP esporta nei formati più diffusi per
coprire ogni scenario.
