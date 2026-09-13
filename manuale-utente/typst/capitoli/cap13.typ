#import "../lib/manuale-template.typ": *

= Funzioni avanzate

Questo capitolo raccoglie le funzionalità che non appartengono al flusso
di lavoro di base, ma che, una volta scoperte, entrano stabilmente nella
prassi di chi produce show con cura e regolarità: la NoteBoard, la
gestione cromatica delle colonne, le transizioni, le impostazioni
generali, il registro dei lanci e la cronologia delle modifiche.

== 13.1 NoteBoard: il copione in regia
La #strong[NoteBoard] è il sistema di note integrate alle clip. Consente
di associare a qualsiasi clip un testo scritto (istruzioni operative,
scalette, appunti su un'intervista, il testo completo di uno spot) e di
farlo comparire automaticamente sullo schermo nel momento in cui quella
clip entra in riproduzione.

=== Inserire una nota
+ Apri le impostazioni della clip (tasto destro sulla card) e vai alla
  sezione #emph[Note].
+ Scrivi il testo nel campo libero. Non c'è limite di lunghezza.

Le clip con una nota mostrano il badge 📋 sulla card.

=== Il pannello in diretta
Quando una clip con note entra in riproduzione, il #strong[pannello
NoteBoard] appare nella parte inferiore dello schermo con il testo
associato, intestato dal nome e dal colore della clip. Il pannello resta
visibile per tutta la durata della riproduzione e si chiude da solo
quando la clip termina. Se più clip con note suonano insieme, il
pannello mostra quella con priorità più alta.

=== Casi d'uso
- #strong[Regia parlata.] Associa a ogni sigla le prime righe del blocco
  parlato che segue: quando la sigla parte, il testo è già davanti agli
  occhi.
- #strong[Contenuto da leggere.] Uno spot pubblicitario con il testo
  completo nella nota: appena parte, si legge.
- #strong[Istruzioni operative.] «Abbassare il monitor», «Controllare il
  livello cuffie ospite», «Avviare la registrazione».
- #strong[Interviste.] Le domande per l'ospite restano visibili per
  tutta la durata della clip.

== 13.2 Personalizzazione cromatica delle colonne
I colori predefiniti hanno un significato consolidato (verde per gli
Assets, rosso per le Canzoni, e così via), ma ogni colonna è
personalizzabile. Clicca sul #strong[pallino colorato] nell'intestazione
della colonna: si apre una palette di #strong[30 colori]. Scegline uno e
la colonna (intestazione, card, indicatori) assume immediatamente il
nuovo colore. La scelta è salvata nel file di progetto.

Le card ereditano dinamicamente il colore della colonna: a riposo
appaiono in una tinta attenuata, in riproduzione nel colore pieno. Ogni
progetto può così avere una propria identità cromatica.

== 13.3 Transizioni tra clip
Quando una clip è impostata su #emph[Play Next], il passaggio alla clip
successiva della colonna avviene secondo la modalità di transizione
configurata:

- #strong[Crossfade.] La clip uscente sfuma mentre la entrante sale,
  sovrapposte. Durata predefinita: 2 secondi.
- #strong[Segue.] La clip uscente sfuma in uscita mentre la successiva
  parte subito a pieno volume. Durata predefinita della dissolvenza: 0,8
  secondi.
- #strong[Gapless (taglio netto).] La clip uscente si ferma di colpo e
  la successiva parte immediatamente, senza dissolvenza.

Puoi impostare una transizione a livello di singola clip oppure lasciare
#strong[Default Globale], che applica la scelta generale definita nelle
Impostazioni. La colonna Pre-Show usa il crossfade come impostazione
predefinita. Tutte le modalità sono provabili senza andare in onda
tramite il pulsante «Test →» nell'editor (Capitolo 5).

== 13.4 La finestra Impostazioni generali
Le #strong[Impostazioni] (menu Strumenti) raccolgono le preferenze
globali del software, organizzate in schede.

=== Generali
- #strong[Lingua.] Seleziona la lingua dell'interfaccia: italiano o
  inglese. La modifica è immediata.
- #strong[Controllo Remoto (Beta).] Attiva il telecomando via browser e
  mostra PIN, porta e indirizzi (Capitolo 11).
- #strong[Layout regia.] Mostra o nasconde singolarmente le colonne
  della griglia. Nascondere una colonna non ne elimina le clip: restano
  nel progetto. È una preferenza globale, valida per tutti i progetti.

=== Audio & Mix
- #strong[Periferica di uscita.] La destinazione audio (Capitolo 8).
- #strong[Intelligenza di mix.] L'entità del ducking (di quanto scende
  la musica quando parla una voce, predefinito 20%) e la sua rapidità
  (predefinito 500 ms).
- #strong[Transizioni.] La modalità di transizione predefinita e le
  durate di crossfade e segue.

=== Microfono
- #strong[Smart Mic --- Auto-Ducking.] Abilita il microfono che abbassa
  la musica quando parli (Capitolo 6). In cima alla scheda un avviso
  ricorda che la funzione è pensata per i microfoni USB collegati
  direttamente al computer, non per i mixer USB.
- #strong[Dispositivo di Input.] Il microfono da ascoltare: i microfoni
  USB e le interfacce audio compaiono qui automaticamente.
- #strong[Soglia di attivazione.] Il livello oltre il quale la voce fa
  scattare il ducking (predefinito −30 dBFS); il rilascio avviene 12 dB
  più in basso.
- #strong[Hold di attivazione e di rilascio.] Per quanti millisecondi la
  voce deve restare sopra la soglia prima che la musica scenda, e sotto
  la soglia prima che risalga.
- #strong[Canale Mix Microfono.] Con #emph[In Mix] la tua voce entra
  anche nell'uscita di RLMP, con il suo #strong[Volume Microfono].
  L'opzione #strong[Bypass Master Chain] decide come esce: spenta, la
  voce passa per filtro passa-alto, compressore e limiter; accesa, esce
  così com'è, senza latenza aggiuntiva. Un avviso sul rischio di
  #strong[feedback] (fischi), da confermare, ricorda di usare le cuffie
  o un mixer professionale: con le casse accese la voce può rientrare
  nel microfono.

=== Registrazione
Riepilogo del punto di cattura (dopo il limiter) e scelta del formato
predefinito proposto in esportazione (Capitolo 9).

=== Master Chain
- #strong[Omologazione del volume.] Attiva/disattiva la normalizzazione
  loudness e ne imposta l'obiettivo (predefinito −16 LUFS).
- #strong[Master Chain.] Attiva o bypassa l'intera catena, e regola i
  singoli stadi: frequenza dell'HPF, stile del glue multibanda, soglia
  del limiter. Un pulsante ripristina i valori predefiniti (Capitolo 6).

== 13.5 Playout Log
Il #strong[Playout Log] (icona nell'header) è il registro cronologico
dei lanci: tiene traccia di ciò che è andato in onda e quando, fino alle
ultime migliaia di eventi. È utile per ricostruire una scaletta a
posteriori, verificare cosa è stato trasmesso o compilare un resoconto
della diretta.

== 13.6 Annulla e Ripeti
Le modifiche alla scaletta (aggiunte, spostamenti, cancellazioni) sono
reversibili. `Ctrl+Z` annulla l'ultima operazione, `Ctrl+Y` (o
`Ctrl+Shift+Z`) la ripete, con una cronologia profonda diverse decine di
passi. Le stesse voci sono disponibili nel menu Strumenti. È la rete di
sicurezza per le operazioni fatte in fretta durante la preparazione.

== 13.7 Sistema di notifiche toast
RLMP non usa finestre bloccanti per le comunicazioni di routine. Le
notifiche non critiche compaiono come #strong[toast]: piccoli banner non
intrusivi in un angolo dello schermo, che restano per alcuni secondi e
scompaiono da soli senza interrompere la riproduzione. Vengono usati per
confermare un salvataggio, la fine di un'esportazione, un'operazione di
MIDI Learn o per avvisare di file mancanti.

Le #strong[finestre di conferma], necessarie quando un'azione è
irreversibile (la cancellazione di clip, la chiusura di un progetto non
salvato), sono invece modali e richiedono una risposta, ma sono
progettate per non troncare la riproduzione in corso: l'audio continua
mentre decidi.
