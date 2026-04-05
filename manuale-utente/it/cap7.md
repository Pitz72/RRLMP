# CAPITOLO 7: GESTIONE PROGETTI E SICUREZZA

Configurare uno show richiede tempo: caricare le clip, regolare i volumi, impostare i trim. Perdere questo lavoro sarebbe disastroso.
Runtime Live Machine utilizza un sistema di salvataggio a più livelli per garantire che i tuoi dati siano sempre al sicuro.

---

## 7.1 Il File Progetto (.lmp)

Tutte le impostazioni del tuo show (posizioni delle clip, colori, volumi, mapping MIDI, impostazioni di fade) vengono salvate in un unico file con estensione **`.lmp`** (Live Machine Project).

> **Importante**: Il file `.lmp` è un file di testo (JSON) che contiene le "istruzioni" per il software. **NON contiene i file audio fisici**. Memorizza solo il *percorso* dove si trovano i file sul tuo computer (es. `C:\Musica\Sigla.mp3`).

### Salvare il lavoro
Nella barra dei comandi in alto, hai due opzioni distinte:

1.  **💾 Salva (Quick Save)**:
    *   Clicca l'icona del Floppy Disk.
    *   Sovrascrive immediatamente il file `.lmp` aperto al momento.
    *   È l'azione da fare regolarmente mentre lavori.
2.  **🖊️ Salva con Nome (Save As)**:
    *   Clicca l'icona del Floppy con la Penna.
    *   Apre sempre una finestra di dialogo per creare un **nuovo file**.
    *   Usalo per creare versioni diverse dello show (es. "Podcast_Ep1.lmp", "Podcast_Ep2.lmp").

### Protezione Chiusura (Unsaved Changes)
Il software monitora costantemente le tue azioni. Se hai fatto modifiche non salvate (caricato una clip, cambiato un volume) e provi a chiudere il programma, RLM **bloccherà la chiusura** e ti mostrerà un avviso: *"Ci sono modifiche non salvate"*.
Non perderai mai il lavoro per un click accidentale sulla "X".

---

## 7.2 Auto-Backup (La Rete di Protezione)

Non sempre ci si ricorda di salvare. Per questo, RLM include un sistema di **Auto-Backup** invisibile che lavora in background.

*   **Frequenza**: Ogni **5 minuti**, il software salva automaticamente una copia di sicurezza dello stato attuale.
*   **Dove finisce il backup?**
    *   Se stai lavorando su un progetto già salvato (es. `MioShow.lmp`), il software crea un file "ombra" nella stessa cartella chiamato **`MioShow.lmp.bak`**.
*   **Come recuperarlo**:
    *   Se il PC si spegne improvvisamente o il file principale si corrompe, vai nella cartella del progetto.
    *   Cerca il file `.bak`.
    *   Rinominalo togliendo il `.bak` (o aprilo direttamente con RLM). Avrai recuperato il lavoro fino agli ultimi 5 minuti.

---

## 7.3 Collect & Save (Export Portatile)

Questa è la funzione fondamentale per chi lavora su più computer o vuole archiviare lo show.
Poiché il file `.lmp` memorizza solo i *collegamenti* ai file audio, se copi solo quel file su un altro PC (o su una chiavetta), il software non troverà più la musica (percorsi interrotti).

Per spostare lo show, devi usare la funzione **Export Package**.

### Come creare un Pacchetto Portatile
1.  Clicca sull'icona **📦 Export (Scatola)** nella barra in alto.
2.  Il sistema ti chiederà di selezionare una cartella vuota (es. sulla tua chiavetta USB).
3.  **Il processo di Copia**:
    *   Il software analizza tutto il progetto.
    *   Crea una sottocartella chiamata `audio/` nella destinazione.
    *   **Copia fisicamente** tutti i file MP3/WAV originali dentro quella cartella.
    *   Crea un nuovo file `project.lmp` in cui tutti i collegamenti sono stati riscritti per puntare alla cartella locale `audio/`.

### Il Risultato
Otterrai una cartella contenente tutto il necessario. Puoi collegare la chiavetta USB a qualsiasi computer con Runtime Live Machine installato, aprire il file `project.lmp` e tutto funzionerà perfettamente, indipendentemente dalle lettere delle unità o dai percorsi originali.

> **Uso Consigliato**: Usa questa funzione alla fine della preparazione di ogni show per creare un "Master" da portare in studio o da archiviare come backup storico completo.
