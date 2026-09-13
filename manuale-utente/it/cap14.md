# Capitolo 14 — Risoluzione problemi e FAQ

---

Questo capitolo raccoglie i problemi più comuni nell'uso quotidiano di Runtime Live Machine Pro, con le rispettive soluzioni. Ogni sezione descrive il sintomo, la causa più probabile e la procedura di risoluzione.

---

## 14.1 Problemi audio

### Il timer scorre e i VU meter si muovono, ma non si sente nulla

Il software sta riproducendo correttamente (il segnale è presente nel bus interno), ma non raggiunge la periferica di ascolto.

**Verifica in ordine:**

1. **Master Volume.** Lo slider nell'header è a zero? Portalo al 100%.
2. **Periferica di uscita.** Apri le Impostazioni → *Audio & Mix* e controlla quale periferica è selezionata. Windows e macOS possono cambiare l'identificativo delle periferiche USB quando vengono scollegate e ricollegate. Se il nome non corrisponde a quella fisicamente connessa, selezionala di nuovo.
3. **Mixer esterno.** Se il segnale arriva a un mixer hardware, controlla che il fader del canale non sia abbassato o in mute, e che l'uscita del mixer sia collegata ai monitor o alla catena di trasmissione.

### L'audio salta, gracchia o ha interruzioni

In condizioni normali il motore audio è robusto rispetto a questi artefatti. Se si verificano, la causa è quasi sempre esterna al software.

- **CPU sotto carico estremo.** Chiudi le applicazioni pesanti in contemporanea (montaggio video, rendering, backup intensivi).
- **Buffer audio troppo basso.** Con una scheda audio professionale, controlla il valore di buffer nel pannello di controllo del driver. Un valore di 256 o 512 campioni è l'equilibrio corretto; sotto i 128 campioni possono comparire dropout.
- **Disco lento o sotto stress.** RLMP streamma l'audio dal disco. Un disco meccanico lento, o un SSD quasi pieno, può causare interruzioni su file di grandi dimensioni.

### Il livello audio è troppo basso o troppo alto

- **Gain per clip.** Regola il Gain nelle proprietà della clip (tasto destro → sezione Volume).
- **Master Volume.** Se il livello complessivo è scorretto, agisci sullo slider nell'header.
- **Omologazione e Master Chain.** L'omologazione del volume avvicina i livelli delle clip a un riferimento comune; il glue del Master Chain può rendere il suono più compatto. Se un risultato non ti convince, puoi regolare o disattivare questi stadi nelle Impostazioni → Master Chain.

---

## 14.2 Clip rosse e file mancanti

### Una card è diventata rossa («FILE MANCANTE») e non risponde al click

Il bordo rosso indica che il file audio non è raggiungibile al percorso memorizzato nel progetto.

**Cause possibili:**

- Il file è stato spostato o rinominato sul disco.
- Il file era su un disco esterno o una chiavetta USB ora scollegata.
- Il progetto è stato aperto su un computer diverso, dove i percorsi non corrispondono.

**Soluzioni:**

1. **Riconnetti il disco.** Se il file era su un'unità esterna, ricollegala.
2. **Riporta il file nella posizione originale.** Se è stato spostato, rimettilo nel percorso originale.
3. **Sostituisci la clip.** Trascina di nuovo il file corretto nella griglia e cancella la card rossa.
4. **Usa Esporta progetto con audio in futuro.** La prevenzione più efficace è consolidare l'audio nel progetto prima di spostarlo o trasferirlo (Capitolo 10).

---

## 14.3 Problemi MIDI

### Il controller non viene rilevato

1. **Collegamento.** Verifica che il controller sia collegato e riconosciuto dal sistema operativo. RLMP rileva la connessione e la disconnessione dei dispositivi in tempo reale; se non compare, scollega e ricollega il cavo USB.
2. **Driver.** La maggior parte dei controller USB-MIDI è *class-compliant* e non richiede driver. Per superfici professionali con driver proprietari, verifica che il driver sia installato.
3. **Verifica in modalità Learn.** Attiva MIDI Learn e premi un tasto sul controller: se la card riceve la mappatura, il controller è rilevato.

### Le clip mappate non rispondono ai tasti del controller

- **La modalità MIDI Learn è ancora attiva.** In MIDI Learn i tasti del controller registrano nuove mappature invece di eseguire le clip. Disattiva la modalità dal menu Strumenti.
- **La mappatura è andata persa.** Le mappature delle clip sono nel file `.lmp`; verifica che il progetto sia stato salvato dopo la sessione di MIDI Learn. Le mappature delle funzioni globali sono invece legate al singolo computer.

---

## 14.4 Problemi di avvio

### L'applicazione non si avvia su macOS (avviso Gatekeeper)

Vedi la sezione 2.3: sblocco tramite *Impostazioni di Sistema → Privacy e sicurezza*.

### L'applicazione non si avvia su Windows (avviso SmartScreen)

Vedi la sezione 2.2. Clicca su *Ulteriori informazioni* e poi su *Esegui comunque*.

### Comportamenti anomali all'avvio

Se il software si comporta in modo inatteso all'apertura, chiudi e riapri RLMP. Se il problema persiste, verifica che il percorso di installazione non contenga caratteri speciali che potrebbero interferire con il caricamento dei componenti FFmpeg.

---

## 14.5 Domande frequenti

**RLMP può automatizzare una radio per 24 ore senza presidio?**
No. RLMP è progettato per la regia live: show presidiati da un operatore. Non dispone di schedulazione oraria né di rotazione automatica della playlist. La vista Automix offre un'automazione limitata e volontaria del solo flusso musicale, attiva finché la vista è aperta (Capitolo 7). Per l'automazione H24 esistono software dedicati (Zara Radio, PlayIt Live, Rivendell): rispondono a esigenze diverse.

**Qual è la differenza tra Salva e Salva Come?**
*Salva Progetto* sovrascrive il file `.lmp` aperto, in silenzio. *Salva Come…* apre sempre la finestra di dialogo e crea un nuovo file, senza toccare quello corrente.

**Posso usare RLMP su iPad o su dispositivi mobile?**
Non come applicazione principale: RLMP è un software desktop per Windows, macOS e Linux. Un tablet o un telefono possono però fungere da **telecomando** via browser, tramite il Controllo Remoto (Capitolo 11).

**I file `.lmp` delle versioni precedenti sono compatibili con la 1.15.32?**
Sì. Aprendo un progetto creato con una versione precedente, RLMP ne aggiorna automaticamente la struttura, comprese le colonne aggiunte nel frattempo, senza modificare il file finché non esegui un salvataggio.

**Come aggiorno RLMP a una nuova versione?**
Il software controlla gli aggiornamenti all'avvio e ti avvisa. Su Windows e Linux AppImage l'installazione è automatica dalla finestra di aggiornamento; su macOS e Linux `.deb` viene aperto il browser sulla pagina di download. Tutti i dettagli nel Capitolo 12.

**Dove vengono salvati i backup automatici?**
Nella cartella `autosaves` all'interno della directory dati dell'applicazione (`%APPDATA%\runtime-live-machine-pro\autosaves\` su Windows; percorsi equivalenti su macOS e Linux, Capitolo 10). Vengono conservate le dieci istantanee più recenti.

**Il software funziona offline?**
Sì, completamente. RLMP non richiede connessione internet per funzionare. La rete viene usata solo per il controllo degli aggiornamenti (opzionale) e per il Controllo Remoto in rete locale (opzionale).

**Il Controllo Remoto non si connette. Perché?**
Verifica che il dispositivo remoto sia sulla **stessa rete** del computer, di aver inserito il **PIN corretto** (cambia a ogni avvio) e di usare l'indirizzo mostrato nelle Impostazioni. Ricorda che il Controllo Remoto riparte spento a ogni avvio dell'applicazione (Capitolo 11). Se l'interruttore si è spento da solo mostrando un messaggio, la porta 8787 è occupata: chiudi l'altra copia di RLMP o il programma che la usa, poi riattivalo.
