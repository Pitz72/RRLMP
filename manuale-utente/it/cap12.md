# Capitolo 12 — Risoluzione problemi e FAQ

---

Questo capitolo raccoglie i problemi più comuni che possono presentarsi nell'uso quotidiano di Runtime Live Machine Pro, con le rispettive soluzioni. Ogni sezione descrive il sintomo, la causa più probabile e la procedura di risoluzione.

---

## 12.1 Problemi audio

### Il timer scorre e i VU meter si muovono, ma non si sente nulla

Il software sta riproducendo correttamente — il segnale è presente nel bus interno — ma non raggiunge la periferica di ascolto.

**Verifica in ordine:**

1. **Master Volume.** Lo slider nell'header è a zero? Portalo al 100%.
2. **Periferica di uscita.** Apri le Impostazioni (Ingranaggio) e controlla quale periferica è selezionata in *Audio Output Device*. Windows e macOS possono cambiare l'identificativo delle periferiche USB quando vengono scollegate e ricollegate. Se il nome della periferica non corrisponde a quella fisicamente connessa, selezionala di nuovo dalla lista.
3. **Mixer esterno.** Se il segnale arriva a un mixer hardware, controlla che il fader del canale corrispondente non sia abbassato o in mute, e che l'uscita del mixer sia collegata ai monitor o alla scheda trasmissione.

### L'audio salta, gracchia o ha interruzioni

In condizioni normali, il motore audio di RLMP è robusto rispetto a questo tipo di artefatti. Se si verificano, la causa è quasi sempre esterna al software.

- **CPU sotto carico estremo.** Chiudi le applicazioni pesanti in esecuzione in contemporanea (montaggio video, rendering 3D, backup intensivi).
- **Buffer audio troppo basso.** Se usi una scheda audio professionale con driver ASIO (Windows) o Core Audio (macOS), controlla il valore di buffer nel pannello di controllo del driver. Un valore di 256 o 512 campioni è l'equilibrio corretto tra latenza e stabilità; valori inferiori a 128 campioni possono causare dropout su sistemi non ottimizzati.
- **Disco lento o sotto stress.** RLMP streamma l'audio direttamente dal disco. Un disco meccanico lento, o un SSD quasi pieno, può causare interruzioni su file di grandi dimensioni. Verifica che il disco su cui si trovano i file audio non sia congestionato da altre operazioni di lettura/scrittura simultanee.

### Il livello audio è troppo basso o troppo alto rispetto alle aspettative

- **Gain per clip.** Se una singola clip è troppo bassa o troppo alta rispetto alle altre, regola il Gain nelle sue proprietà (click destro → Edit → slider Volume).
- **Master Volume.** Se il livello complessivo è scorretto, agisci sullo slider Master Volume nell'header.
- **Master Chain attiva/disattiva.** Se il compressore del Master Chain sta applicando una compressione forte, potresti percepire un livello generale più compresso del previsto. Considera di ridurre il Gain delle clip più «calde» invece di disabilitare la catena.

---

## 12.2 Clip rosse e file mancanti

### Una card è diventata rossa e non risponde al click

Il bordo rosso indica che il file audio referenziato non è raggiungibile al percorso memorizzato nel progetto.

**Cause possibili:**

- Il file è stato spostato o rinominato sul disco.
- Il file si trovava su un disco esterno o una chiavetta USB che ora è scollegata.
- Il progetto è stato aperto su un computer diverso dove i percorsi non corrispondono.

**Soluzioni:**

1. **Riconnetti il disco.** Se il file era su un disco esterno, ricollegalo. Al successivo accesso alla griglia, RLMP verificherà nuovamente il percorso.
2. **Riporta il file nella posizione originale.** Se il file è stato spostato, rimettilo nel percorso originale.
3. **Sostituisci la clip.** Trascina di nuovo il file corretto nella griglia (nella stessa posizione) e cancella la card rossa. Dovrai riconfigurare le proprietà della nuova clip se erano state personalizzate.
4. **Usa Export Package in futuro.** La prevenzione più efficace è creare un Export Package prima di spostare o trasferire il progetto (vedi Capitolo 10).

---

## 12.3 Problemi MIDI

### Il controller non viene rilevato

1. **Ordine di connessione.** Il controller deve essere collegato al computer **prima** di avviare RLMP. Il rilevamento MIDI avviene all'inizializzazione del software; se il controller viene collegato dopo l'avvio, chiudi e riapri RLMP.
2. **Driver.** La maggior parte dei controller USB-MIDI moderni è class-compliant e non richiede driver. Per controller professionali o superfici di controllo avanzate che usano driver proprietari, verifica che il driver sia installato e che il sistema operativo riconosca il dispositivo prima di avviare il software.
3. **Verifica in modalità Learn.** Attiva la modalità MIDI Learn (icona ciano nell'header): le card assumono l'aspetto tratteggiato d'attesa. Premi un tasto sul controller. Se la card corrispondente riceve la mappatura, il controller è rilevato correttamente.

### Le clip mappate non rispondono ai tasti del controller

**La modalità MIDI Learn è ancora attiva.** Quando l'icona MIDI è ciana, i tasti del controller registrano nuove mappature invece di eseguire le clip. Clicca di nuovo sull'icona per tornare alla modalità operativa (icona grigia).

**La mappatura è andata persa.** Se hai aperto il progetto su un altro computer o hai reinstallato il software, le mappature MIDI sono nel file `.lmp` e dovrebbero essere preservate. Verifica che il progetto sia stato salvato dopo la sessione di MIDI Learn.

---

## 12.4 Problemi di avvio

### L'applicazione non si avvia su macOS (avviso Gatekeeper)

Vedi la sezione 2.3 di questo manuale per la procedura di sblocco tramite Preferenze di Sistema → Sicurezza e Privacy.

### L'applicazione non si avvia su Windows (avviso SmartScreen)

Vedi la sezione 2.2. Clicca su *Ulteriori informazioni* e poi su *Esegui comunque*.

### Il badge PRO non è visibile dopo l'apertura di un progetto

Il badge PRO indica che il motore audio è inizializzato correttamente. La sua assenza può indicare un problema di avvio del Main Process. Chiudi e riapri RLMP. Se il problema persiste, verifica che il percorso di installazione non contenga caratteri speciali (spazi, accenti, simboli) che potrebbero interferire con il caricamento dei componenti FFmpeg.

---

## 12.5 Domande frequenti

**RLMP può automatizzare una radio per 24 ore senza presidio?**
No. RLMP è progettato per la regia live: show presidiati da un operatore. Non dispone di funzioni di schedulazione oraria, rotazione automatica della playlist o selezione intelligente dei brani. Per l'automazione H24 esistono software dedicati (Zara Radio, PlayIt Live, Rivendell). RLMP e quei software non sono concorrenti: rispondono a esigenze diverse.

**Qual è la differenza tra Salva e Salva con Nome?**
*Salva* sovrascrive il file `.lmp` attualmente aperto, silenziosamente e istantaneamente. *Salva con Nome* apre sempre la finestra di dialogo e crea un nuovo file, senza toccare quello corrente.

**Posso usare RLMP su iPad o su dispositivi mobile?**
No. RLMP è un'applicazione desktop per Windows, macOS e Linux. Richiede il sistema operativo completo e l'accesso diretto al file system per il caricamento e lo streaming dei file audio.

**I file `.lmp` delle versioni precedenti sono compatibili con la versione 1.2?**
Sì. Il formato `.lmp` mantiene la compatibilità con le versioni precedenti. Aprendo un progetto creato con una versione precedente, RLMP migra automaticamente le impostazioni al formato corrente. Il file originale non viene modificato finché non esegui un salvataggio.

**Come aggiorno RLMP a una nuova versione?**
La Welcome Screen indica la disponibilità di una nuova versione tramite l'indicatore cromatico (giallo/arancione). Scarica il nuovo installer dal sito ufficiale ed eseguilo: sovrascrive la versione esistente, preservando tutti i tuoi progetti e file `.lmp`.

**Dove vengono salvati i backup automatici se il progetto non è mai stato salvato?**
Nella cartella dei dati applicativi:
- **Windows:** `%APPDATA%\runtime-live-machine\backup\`
- **macOS:** `~/Library/Application Support/runtime-live-machine/backup/`
- **Linux:** `~/.config/runtime-live-machine/backup/`

**Posso usare più istanze di RLMP contemporaneamente?**
Tecnicamente possibile, ma non consigliato. Due istanze che accedono agli stessi file audio e alla stessa periferica audio possono generare conflitti di accesso al file e artefatti nell'output audio. Se hai necessità di gestire show paralleli, usa un mixer hardware esterno e due computer separati.

**Il software funziona offline?**
Sì, completamente. RLMP non richiede connessione internet per funzionare. La connessione viene usata esclusivamente per il controllo degli aggiornamenti all'avvio (operazione opzionale e non bloccante).

