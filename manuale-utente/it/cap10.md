# Capitolo 10 — Gestione progetti e sicurezza dei dati

---

Preparare uno show richiede tempo: selezionare i file, organizzarli nelle colonne, configurare i volumi, impostare i fade, assegnare i tasti. Questo lavoro è un patrimonio operativo che deve sopravvivere a qualsiasi imprevisto: un crash del sistema, uno spostamento di computer, il ritorno a una puntata archiviata mesi prima.

RLMP affronta la sicurezza dei dati a più livelli, ciascuno progettato per coprire un rischio specifico.

---

## 10.1 Il file di progetto (.lmp)

Tutto lo stato di uno show (la disposizione delle clip nelle colonne, i nomi personalizzati, i volumi e i fade, i cue point dell'editor, le note della NoteBoard, le mappature MIDI e tastiera, il colore delle colonne) è salvato in un file con estensione **`.lmp`** (Live Machine Project).

Il formato è JSON: un file di testo strutturato, leggibile da qualsiasi editor, non proprietario. Se un giorno RLMP non fosse disponibile, i dati del progetto resterebbero accessibili.

**Cosa contiene il file `.lmp`:** tutte le impostazioni sopra elencate, inclusi i percorsi assoluti ai file audio referenziati.

**Cosa non contiene:** i file audio stessi. Il `.lmp` memorizza dove si trovano i file sul disco, non copia il loro contenuto. Un file di progetto è tipicamente nell'ordine dei kilobyte, indipendentemente da quanti o quanto grandi siano i file audio che referenzia.

All'apertura, RLMP convalida il file: ricostruisce eventuali identificativi duplicati, riporta i valori fuori scala entro limiti sani e, se apri un progetto creato con una versione precedente, aggiunge in automatico le colonne introdotte nel frattempo (Jingle, Promo), senza toccare i dati esistenti.

---

## 10.2 Salvataggio

### Salva rapido

La voce *Salva Progetto* nel menu FILE esegue un salvataggio immediato sul file `.lmp` aperto. Il salvataggio è silenzioso: nessuna finestra di dialogo. La voce si evidenzia in giallo quando ci sono modifiche non salvate, un promemoria visivo a colpo d'occhio. Usala con frequenza durante la preparazione dello show.

Il salvataggio è **atomico**: il file viene scritto prima in una copia temporanea e poi rinominato al volo. Se il computer si spegne durante la scrittura, il `.lmp` originale non viene mai lasciato a metà.

### Salva con Nome

La voce *Salva Come…* apre sempre la finestra di dialogo, anche se il progetto ha già un nome. Usala per:

- Creare versioni progressive dello stesso show (`Ep47_bozza.lmp`, `Ep47_v2.lmp`, `Ep47_finale.lmp`).
- Salvare una variante con configurazioni diverse.
- Creare un nuovo file senza sovrascrivere quello corrente.

### Protezione alla chiusura

RLMP monitora in continuo lo stato delle modifiche. Se provi a chiudere il software (o ad aprire un nuovo progetto) con modifiche non salvate, l'operazione viene sospesa e compare una richiesta di conferma con tre scelte: salvare, scartare le modifiche o annullare. Non è possibile perdere lavoro per un click accidentale sulla chiusura della finestra.

---

## 10.3 Auto-Backup e autosave

Oltre ai salvataggi che decidi tu, il software mantiene una rete di protezione automatica.

**Copia di sicurezza del progetto.** Ogni volta che un progetto già salvato viene aggiornato in background, RLMP tiene accanto al `.lmp` una copia `.bak` con l'ultimo stato valido.

**Autosave a rotazione.** In parallelo, RLMP scrive istantanee dello stato corrente in una cartella dedicata dell'applicazione, `autosaves`, con un nome basato su data e ora. Vengono conservate le **dieci istantanee più recenti**: le più vecchie vengono eliminate man mano. Questa rete cattura anche il lavoro su un progetto «senza titolo» mai salvato su disco.

La cartella `autosaves` si trova nella directory dati dell'applicazione:

- **Windows:** `%APPDATA%\runtime-live-machine-pro\autosaves\`
- **macOS:** `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- **Linux:** `~/.config/runtime-live-machine-pro/autosaves/`

**Come recuperare.** Se il file `.lmp` principale si è corrotto o il computer si è spento improvvisamente, apri la cartella `autosaves`, individua l'istantanea con data e ora più vicine al momento dell'interruzione e caricala da RLMP come un normale file di progetto. In alternativa, rinomina il file `.bak` accanto al progetto in `.lmp` e aprilo.

---

## 10.4 Esporta progetto con audio

Poiché il file `.lmp` contiene solo i percorsi ai file audio, non i file stessi, un progetto è fragile: se sposti, rinomini o cancelli anche uno solo dei file sorgente, la clip corrispondente diventa rossa. La funzione **Esporta progetto con audio**, nel menu FILE (subito sotto *Salva Come…*), risolve il problema alla radice consolidando tutto l'audio dentro il progetto.

### Come funziona

RLMP analizza tutti i percorsi ai file audio del progetto, crea una sottocartella `audio/` accanto al file `.lmp` e **copia fisicamente** ogni file referenziato al suo interno. I file già presenti e identici non vengono ricopiati; eventuali doppioni di nome vengono rinominati per non sovrascriversi, e i file orfani (non più referenziati) vengono rimossi dalla cartella.

La differenza rispetto a un semplice backup è ciò che accade **dopo** la copia: RLMP **ripunta ogni clip alla nuova copia** dentro `audio/` e **ri-salva il progetto**. Da quel momento la cartella `audio/` non è un archivio di scorta accanto al progetto, ma la fonte da cui la sessione legge davvero l'audio.

### Il risultato: puoi cancellare gli originali

Poiché il progetto ora punta alle copie in `audio/`, **i file audio nella loro posizione originale non servono più** e puoi cancellarli in sicurezza: lo show continua a funzionare leggendo dall'archivio. È la differenza rispetto alle versioni precedenti, dove la cartella `audio/` restava un doppione orfano e cancellare gli originali rompeva le clip.

La cartella del progetto diventa così autocontenuta: `.lmp` più sottocartella `audio/`, tutto il necessario per eseguire lo show, pronto da archiviare, copiare o portare su un altro computer con RLMP installato.

Alcuni dettagli utili:

- L'operazione è **ripetibile**: se aggiungi nuove clip e riesporti, RLMP copia solo i file nuovi e riallinea il progetto, senza duplicare quelli già archiviati.
- RLMP **cancella file solo nelle cartelle `audio/` create da lui**: la prima esportazione lascia nella cartella un piccolo file di testo, `.rrlmp-archive`, che la contrassegna come archivio. Se accanto al progetto esiste già una cartella `audio/` tua (o creata da versioni fino alla 1.15.16), RLMP non rimuove nulla: ti segnala quanti file non fanno parte del progetto e contrassegna la cartella, che dall'esportazione successiva gestirà normalmente. Sposta altrove ciò che vuoi conservare. Cancellando `.rrlmp-archive`, RLMP smette di considerare la cartella come propria.
- Il riaggancio all'archivio **non entra nella cronologia Annulla/Ripeti**: un *Annulla* riporterebbe le clip agli originali, che potresti avere già cancellato.
- La cartella del progetto (`.lmp` + `audio/`) si può **spostare, rinominare, zippare e portare su un altro computer**: all'apertura, ogni file che non viene trovato alla vecchia posizione viene cercato automaticamente nella cartella `audio/` accanto al `.lmp` e ricollegato da solo. Il progetto risulta *modificato*: al salvataggio successivo i nuovi percorsi vengono consolidati.

> **Prassi consigliata.** Usa *Esporta progetto con audio* al termine della preparazione di ogni show per consolidare l'audio nel progetto. Avrai un «master» compatto e portabile, e potrai liberare spazio cancellando i file sparsi da cui avevi importato.

### Controllo di integrità all'apertura

Ogni volta che apri un file `.lmp`, RLMP esegue un **controllo di integrità** automatico: verifica che ciascun file audio referenziato sia raggiungibile. I file mancanti vengono segnalati con il bordo rosso e l'etichetta FILE MANCANTE sulla card corrispondente. Il resto del progetto, tutte le clip con file raggiungibili, resta pienamente funzionale.
