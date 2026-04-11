# CAPITOLO 3: GESTIONE AUDIO (WORKFLOW BASE)

Ora che conosci l'interfaccia, è il momento di "caricare la macchina".
In questo capitolo imparerai come importare i file audio, come controllare la riproduzione e come mantenere la tua scaletta ordinata.

---

## 3.1 Importazione (Drag & Drop)

Runtime Live Machine Pro non utilizza complessi menu "File > Importa". È progettato per lavorare direttamente con le cartelle del tuo computer.

### Come caricare i file
1.  Apri la cartella del tuo computer (Esplora Risorse su Windows o Finder su Mac) dove tieni i tuoi file audio.
2.  Clicca sul file desiderato e, tenendo premuto, **trascinalo** dentro una delle 5 colonne del software.
3.  Rilascia il mouse.

La clip apparirà istantaneamente come una nuova Card.

### Dettagli Importazione
*   **Caricamento Multiplo**: Puoi selezionare 10, 20 o 50 file contemporaneamente dalla tua cartella e trascinarli tutti insieme. Il software creerà una card per ognuno di essi in sequenza.
*   **Formati Supportati**: Grazie al motore nativo, RRLMP supporta quasi tutti i formati audio standard: **MP3, WAV, AAC (m4a), OGG, FLAC**.
*   **Performance**: Non importa se carichi un jingle di 2 secondi o un DJ Set di 2 ore in formato WAV non compresso. Il caricamento è **istantaneo** e non consuma la memoria RAM del computer, grazie alla tecnologia *Direct Disk Streaming*.

> **Nota**: Il software memorizza il "percorso" del file (es. `C:\Musica\Song.mp3`). Se sposti o rinomini il file originale sul tuo computer, RRLMP non riuscirà più a trovarlo (la card diventerà rossa/inattiva). Per evitare questo problema se cambi PC, usa la funzione "Export Package" (vedi Cap. 7).

---

## 3.2 Riproduzione (Play & Stop)

Il sistema di riproduzione è ottimizzato per evitare errori in diretta.

### Avviare una Clip (Play)
*   **Click Sinistro**: Clicca una volta su una card per avviarla.
*   **Feedback**: Il bordo della card diventa **Verde Luminoso**, l'icona "Play" pulsa e il timer inizia il conto alla rovescia.
*   **Barra Spaziatrice**: Se hai assegnato un tasto personalizzato alla clip (vedi Cap. 6), puoi premerlo per avviarla senza usare il mouse.

### Fermare una Clip (Stop / Fade)
*   **Click su Clip Attiva**: Se clicchi su una clip che sta già suonando, questa si fermerà.
    *   *Comportamento Standard*: La clip esegue un **Fade Out** rapido (sfumatura) invece di troncarsi di colpo, per un effetto più professionale. (I tempi di fade sono personalizzabili, vedi Cap. 4).
*   **Stop All**: Per fermare tutto immediatamente (senza sfumature), premi la **Barra Spaziatrice** (se configurata) o il tasto **ESC** o il pulsante rosso **STOP ALL** in alto.

### La Regola della Colonna (Esclusione)
In una regia radiofonica, di solito non vuoi che due canzoni suonino contemporaneamente l'una sopra l'altra.
*   **Regola**: Se nella colonna "CANZONI" sta suonando il *Brano A* e tu clicchi sul *Brano B* (nella stessa colonna), il *Brano A* si ferma automaticamente (sfumando) e parte il *Brano B*.
*   **Eccezione**: Questa regola non vale per la colonna "SFX" o per le clip impostate come "Stacco", che possono suonare sopra le altre.

---

## 3.3 Organizzazione della Scaletta

Durante uno show, le esigenze cambiano. RRLMP ti permette di riorganizzare la griglia al volo.

### Spostare le Clip (Reordering)
Hai caricato la scaletta ma decidi di cambiare l'ordine dei brani?
*   Clicca su una clip e, tenendo premuto, **trascinala** verso l'alto o il basso. Una linea guida ti mostrerà dove atterrerà.
*   **Spostamento tra Colonne**: Puoi trascinare una clip da una colonna all'altra (es. dal "Pre-Show" alla colonna "Musica").
    *   *Attenzione*: Quando sposti una clip, questa **eredita le regole della nuova colonna**. Se sposti un jingle nella colonna Musica, inizierà a comportarsi come una canzone (subirà il ducking dalle voci, ecc.).

### Selezione Multipla e Cancellazione
Per fare pulizia rapidamente:
1.  **Selezione Singola**: `Ctrl + Click` (Windows) o `Cmd + Click` (Mac) su una clip la seleziona (bordo Blu) senza farla suonare.
2.  **Selezione Multipla**: Tieni premuto `Ctrl` e clicca su diverse clip per evidenziarle tutte.
3.  **Cancellazione**: Premi il tasto `CANC` (o `Del` / `Backspace`) sulla tastiera.
    *   Il software ti chiederà conferma se stai cancellando molte clip, per evitare errori accidentali.

> **Consiglio Pro**: Usa la selezione multipla per svuotare rapidamente la colonna "Pre-Show" una volta iniziata la diretta vera e propria, per avere un'interfaccia più pulita.

