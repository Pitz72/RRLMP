# Capitolo 10 — Gestione progetti e sicurezza dei dati

---

Preparare uno show richiede tempo: selezionare i file, organizzarli nelle colonne, configurare i volumi, impostare i fade, assegnare i tasti. Questo lavoro è un patrimonio operativo che deve sopravvivere a qualsiasi imprevisto — un crash del sistema, uno spostamento di computer, il ritorno a una puntata archiviata mesi prima.

RLMP affronta la questione della sicurezza dei dati a più livelli, ciascuno progettato per coprire un rischio specifico.

---

## 10.1 Il file di progetto (.lmp)

Tutto lo stato di uno show — la disposizione delle clip nelle cinque colonne, i nomi personalizzati, i volumi e i fade, i cue point dell'editor, le note NoteBoard, le mappature MIDI e tastiera, il colore delle colonne — è salvato in un file con estensione **`.lmp`** (Live Machine Project).

Il formato è JSON: un file di testo strutturato, leggibile da qualsiasi editor di testo, non proprietario. Se un giorno RLMP non dovesse essere disponibile, i dati del progetto rimangono accessibili.

**Cosa contiene il file `.lmp`:** tutte le impostazioni sopra elencate, inclusi i percorsi assoluti ai file audio referenziati.

**Cosa non contiene:** i file audio stessi. Il `.lmp` memorizza dove si trovano i file sul disco, non copia il loro contenuto. Un file di progetto è tipicamente nell'ordine dei kilobyte, indipendentemente da quanti o quanto grandi siano i file audio che referenzia.

---

## 10.2 Salvataggio

### Salva rapido

L'icona **Floppy Disk** nell'header esegue un salvataggio immediato, sovrascrivendo il file `.lmp` aperto. Non compare nessuna finestra di dialogo: il salvataggio è silenzioso e istantaneo. Usalo con frequenza durante la preparazione dello show — ogni modifica significativa (aggiunta di clip, cambio di volume, configurazione dei fade) merita un salvataggio.

La scorciatoia da tastiera **`Ctrl+S`** (Windows/Linux) o **`Cmd+S`** (macOS) esegue lo stesso salvataggio rapido.

### Salva con Nome

L'icona **Floppy con matita** apre sempre la finestra di dialogo di salvataggio, anche se il progetto ha già un nome. Usala per:

- Creare versioni progressive dello stesso show (`Ep47_bozza.lmp`, `Ep47_v2.lmp`, `Ep47_finale.lmp`).
- Salvare una variante del progetto con configurazioni diverse (es. versione con scaletta ridotta per uno show più breve).
- Creare un nuovo file senza sovrascrivere quello corrente.

### Protezione alla chiusura

RLMP monitora in continuo lo stato delle modifiche. Se provi a chiudere il software — o ad aprire un nuovo progetto — con modifiche non salvate, il software blocca l'operazione e mostra una finestra di conferma: *«Il progetto corrente ha modifiche non salvate. Salvare prima di continuare?»*

Questa protezione vale anche per lo Escape: non è possibile perdere lavoro per un click accidentale sulla X della finestra.

---

## 10.3 Auto-Backup

Il sistema di backup automatico opera silenziosamente in background, senza interruzioni alla sessione.

**Frequenza.** Ogni cinque minuti, RLMP salva una copia di sicurezza dello stato corrente del progetto.

**Posizione del file di backup.** Il file di backup viene creato nella stessa cartella del progetto aperto, con il nome del file originale e l'estensione aggiuntiva `.bak`:

```
MioShow.lmp
MioShow.lmp.bak   ← backup automatico
```

**Come recuperare da un backup.** Se il file `.lmp` principale si è corrotto o il computer si è spento improvvisamente:

1. Vai nella cartella del progetto.
2. Rinomina il file `.bak` in `.lmp` (es. `MioShow.lmp.bak` → `MioShow_recuperato.lmp`).
3. Apri il file rinominato con RLMP.

Il backup rappresenta lo stato del progetto fino agli ultimi cinque minuti prima dell'interruzione.

**Nota su progetti nuovi non salvati.** Se stavi lavorando su un progetto «Senza titolo» che non è mai stato salvato su disco, e il computer si è spento, il backup viene scritto nella cartella dei dati applicativi del sistema:

- **Windows:** `%APPDATA%\runtime-live-machine\backup\`
- **macOS:** `~/Library/Application Support/runtime-live-machine/backup/`
- **Linux:** `~/.config/runtime-live-machine/backup/`

---

## 10.4 Export Package: portabilità completa

Poiché il file `.lmp` contiene solo i percorsi ai file audio — non i file stessi — portare il progetto su un altro computer richiede attenzione: se il computer di destinazione non ha i file audio negli stessi percorsi assoluti, le clip diventano rosse e il progetto non è utilizzabile.

La funzione **Export Package** risolve questo problema in modo definitivo.

### Come funziona

1. Clicca sull'icona **Export Package** (scatola/archivio) nell'header.
2. Seleziona una cartella di destinazione vuota — può essere una cartella sul disco locale, su un NAS o direttamente la root di una chiavetta USB.
3. RLMP esegue le seguenti operazioni in sequenza:
   - Analizza tutti i percorsi ai file audio presenti nel progetto.
   - Crea una sottocartella `audio/` nella destinazione.
   - **Copia fisicamente** ogni file audio referenziato dentro `audio/`.
   - Scrive un nuovo file `project.lmp` nella cartella radice della destinazione, con tutti i percorsi aggiornati per puntare alla sottocartella `audio/` locale.

### Il risultato

La cartella di destinazione diventa autocontenuta: contiene tutto il necessario per eseguire lo show su qualsiasi computer con RLMP installato. Puoi consegnare quella cartella a un collega, spostarla su una chiavetta USB, archiviarla su un disco esterno — il progetto funzionerà esattamente come sull'originale, indipendentemente dalla struttura di cartelle del computer di destinazione.

> **Prassi consigliata.** Usa Export Package al termine della preparazione di ogni show per creare un «master» da portare in studio o da archiviare. In caso di problemi tecnici all'ultimo momento, avrai sempre una copia completa e portabile pronta.

### Controllo di integrità all'apertura

Ogni volta che apri un file `.lmp`, RLMP esegue un **controllo di integrità** automatico: verifica che ciascun file audio referenziato sia raggiungibile nel percorso memorizzato. I file mancanti vengono segnalati immediatamente con il bordo rosso sulla card corrispondente, prima ancora che il progetto diventi operativo. Il resto del progetto — tutte le clip con file raggiungibili — è pienamente funzionale.

