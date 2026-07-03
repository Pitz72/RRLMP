#import "../lib/manuale-template.typ": *

= Gestione progetti e sicurezza dei dati

Preparare uno show richiede tempo: selezionare i file, organizzarli
nelle colonne, configurare i volumi, impostare i fade, assegnare i
tasti. Questo lavoro è un patrimonio operativo che deve sopravvivere a
qualsiasi imprevisto: un crash del sistema, uno spostamento di computer,
il ritorno a una puntata archiviata mesi prima.

RLMP affronta la sicurezza dei dati a più livelli, ciascuno progettato
per coprire un rischio specifico.

== 10.1 Il file di progetto (.lmp)
<il-file-di-progetto-.lmp>
Tutto lo stato di uno show (la disposizione delle clip nelle colonne, i
nomi personalizzati, i volumi e i fade, i cue point dell'editor, le note
della NoteBoard, le mappature MIDI e tastiera, il colore delle colonne)
è salvato in un file con estensione #strong[`.lmp`] (Live Machine
Project).

Il formato è JSON: un file di testo strutturato, leggibile da qualsiasi
editor, non proprietario. Se un giorno RLMP non fosse disponibile, i
dati del progetto resterebbero accessibili.

#strong[Cosa contiene il file `.lmp`:] tutte le impostazioni sopra
elencate, inclusi i percorsi assoluti ai file audio referenziati.

#strong[Cosa non contiene:] i file audio stessi. Il `.lmp` memorizza
dove si trovano i file sul disco, non copia il loro contenuto. Un file
di progetto è tipicamente nell'ordine dei kilobyte, indipendentemente da
quanti o quanto grandi siano i file audio che referenzia.

All'apertura, RLMP convalida il file: ricostruisce eventuali
identificativi duplicati, riporta i valori fuori scala entro limiti sani
e, se apri un progetto creato con una versione precedente, aggiunge in
automatico le colonne introdotte nel frattempo (Jingle, Promo), senza
toccare i dati esistenti.

== 10.2 Salvataggio
=== Salva rapido
La voce #emph[Salva Progetto] nel menu FILE esegue un salvataggio
immediato sul file `.lmp` aperto. Il salvataggio è silenzioso: nessuna
finestra di dialogo. La voce si evidenzia in giallo quando ci sono
modifiche non salvate, un promemoria visivo a colpo d'occhio. Usala con
frequenza durante la preparazione dello show.

Il salvataggio è #strong[atomico]: il file viene scritto prima in una
copia temporanea e poi rinominato al volo. Se il computer si spegne
durante la scrittura, il `.lmp` originale non viene mai lasciato a metà.

=== Salva con Nome
La voce #emph[Salva Come…] apre sempre la finestra di dialogo, anche se
il progetto ha già un nome. Usala per:

- Creare versioni progressive dello stesso show (`Ep47_bozza.lmp`,
  `Ep47_v2.lmp`, `Ep47_finale.lmp`).
- Salvare una variante con configurazioni diverse.
- Creare un nuovo file senza sovrascrivere quello corrente.

=== Protezione alla chiusura
RLMP monitora in continuo lo stato delle modifiche. Se provi a chiudere
il software (o ad aprire un nuovo progetto) con modifiche non salvate,
l'operazione viene sospesa e compare una richiesta di conferma con tre
scelte: salvare, scartare le modifiche o annullare. Non è possibile
perdere lavoro per un click accidentale sulla chiusura della finestra.

== 10.3 Auto-Backup e autosave
Oltre ai salvataggi che decidi tu, il software mantiene una rete di
protezione automatica.

#strong[Copia di sicurezza del progetto.] Ogni volta che un progetto già
salvato viene aggiornato in background, RLMP tiene accanto al `.lmp` una
copia `.bak` con l'ultimo stato valido.

#strong[Autosave a rotazione.] In parallelo, RLMP scrive istantanee
dello stato corrente in una cartella dedicata dell'applicazione,
`autosaves`, con un nome basato su data e ora. Vengono conservate le
#strong[dieci istantanee più recenti]: le più vecchie vengono eliminate
man mano. Questa rete cattura anche il lavoro su un progetto «senza
titolo» mai salvato su disco.

La cartella `autosaves` si trova nella directory dati dell'applicazione:

- #strong[Windows:] `%APPDATA%\runtime-live-machine-pro\autosaves\`
- #strong[macOS:]
  `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- #strong[Linux:] `~/.config/runtime-live-machine-pro/autosaves/`

#strong[Come recuperare.] Se il file `.lmp` principale si è corrotto o
il computer si è spento improvvisamente, apri la cartella `autosaves`,
individua l'istantanea con data e ora più vicine al momento
dell'interruzione e caricala da RLMP come un normale file di progetto.
In alternativa, rinomina il file `.bak` accanto al progetto in `.lmp` e
aprilo.

== 10.4 Export Package: portabilità completa
<export-package-portabilità-completa>
Poiché il file `.lmp` contiene solo i percorsi ai file audio, non i file
stessi, portare il progetto su un altro computer richiede attenzione: se
la macchina di destinazione non ha i file negli stessi percorsi
assoluti, le clip diventano rosse. La funzione #strong[Esporta Archivio]
(Export Package), nel menu FILE, risolve il problema alla radice.

=== Come funziona
RLMP analizza tutti i percorsi ai file audio del progetto, crea una
sottocartella `audio/` e #strong[copia fisicamente] ogni file
referenziato al suo interno. I file già presenti e identici non vengono
ricopiati; eventuali doppioni di nome vengono rinominati per non
sovrascriversi, e i file orfani (non più referenziati) vengono rimossi
dalla cartella.

L'operazione ha due modalità:

- #strong[Accanto al progetto] --- se esporti verso la cartella dove
  risiede già il `.lmp`, RLMP sincronizza la sottocartella `audio/`
  accanto ad esso.
- #strong[Cartella libera] --- se scegli una cartella nuova (una
  chiavetta USB, un NAS), RLMP vi scrive un `project.lmp` con i percorsi
  già aggiornati per puntare alla sottocartella `audio/` locale.

=== Il risultato
La cartella di destinazione diventa autocontenuta: contiene tutto il
necessario per eseguire lo show su qualsiasi computer con RLMP
installato, indipendentemente dalla struttura di cartelle di quella
macchina.

#suggerimento[
Usa Esporta Archivio al termine della
preparazione di ogni show per creare un «master» da portare in studio o
da archiviare. In caso di problemi tecnici all'ultimo momento, avrai
sempre una copia completa e portabile pronta.
]

=== Controllo di integrità all'apertura
<controllo-di-integrità-allapertura>
Ogni volta che apri un file `.lmp`, RLMP esegue un #strong[controllo di
integrità] automatico: verifica che ciascun file audio referenziato sia
raggiungibile. I file mancanti vengono segnalati con il bordo rosso e
l'etichetta FILE MANCANTE sulla card corrispondente. Il resto del
progetto, tutte le clip con file raggiungibili, resta pienamente
funzionale.
