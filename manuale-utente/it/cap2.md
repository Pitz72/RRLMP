# CAPITOLO 2: L'INTERFACCIA DI LAVORO

L'interfaccia di **Runtime Live Machine** è progettata per essere scura, ad alto contrasto e priva di distrazioni. Ogni elemento è posizionato per essere raggiunto rapidamente durante una diretta.

L'area di lavoro si divide in due zone principali: la **Barra di Controllo (Header)** in alto e la **Griglia di Regia** centrale.

---

## 2.1 La Barra di Controllo (Header)

La parte superiore dello schermo è il centro nevralgico del software. Qui trovi gli strumenti per gestire il progetto, l'hardware e il monitoraggio globale.

### Informazioni e Monitoraggio
*   **ℹ️ Info & About**: Cliccando sull'icona delle informazioni (o sul logo), si apre il pannello dei crediti che mostra la versione installata e lo stato degli aggiornamenti.
*   **⏱️ Orologio di Studio**: Un grande orologio digitale (HH:MM:SS) sincronizzato con il sistema. È il tuo riferimento temporale assoluto per la messa in onda.
*   **🔊 Master Volume**: Lo slider orizzontale controlla il volume generale di uscita del software.
    *   *Nota*: Questo volume agisce su tutte le clip. Se lo porti a zero, il software è muto, anche se le clip stanno suonando.
*   **📊 VU Meters (L/R)**: Due barre colorate (Verde/Giallo/Rosso) accanto al volume.
    *   Indicano il livello audio reale in uscita.
    *   **Verde**: Segnale ottimale.
    *   **Rosso**: Segnale troppo alto (Saturazione/Clipping). Abbassa il Master Volume se vedi spesso il rosso.

### Il Pulsante Panico
*   **🟥 STOP ALL**: Il pulsante rosso centrale è il comando di emergenza. Cliccandolo (o premendo `ESC` sulla tastiera), **tutte** le clip attive si fermano istantaneamente e i riverberi vengono troncati. Usalo per chiudere tutto in caso di errore o imprevisto.

### Le Icone Funzionali (Toolbar)
A destra del pulsante Stop, trovi una serie di icone grigie raggruppate per funzione.

#### Gruppo Progetto (Gestione File)
1.  **📄 Nuovo Progetto (File Plus)**: Pulisce interamente la griglia per iniziare un nuovo show da zero. Se hai modifiche non salvate, ti chiederà conferma.
2.  **💾 Salva (Floppy Disk)**: Salvataggio rapido. Sovrascrive il file `.lmp` attuale. Usalo frequentemente durante il lavoro.
3.  **🖊️ Salva con Nome (Floppy con Penna)**: Apre sempre la finestra di dialogo per salvare una *nuova copia* del progetto con un nome diverso. Utile per creare versioni (es. "Show_v1", "Show_v2").
4.  **📂 Carica (Cartella)**: Apre un progetto esistente dal disco.
5.  **📦 Export Package (Scatola/Archivio)**: Una funzione vitale per la portabilità.
    *   Crea una copia completa del progetto in una cartella a tua scelta.
    *   **Copia fisicamente tutti i file audio** (MP3, WAV) utilizzati nella cartella di destinazione.
    *   Ti permette di spostare lo show su una chiavetta USB ed eseguirlo su un altro computer senza perdere i collegamenti ai file.

#### Gruppo Hardware
6.  **🎹 MIDI Learn (Connettore DIN)**: Attiva/Disattiva la modalità di apprendimento MIDI.
    *   Quando è **acceso (Ciano)**: Clicca una clip e premi un tasto sul tuo controller esterno per assegnarlo.
    *   Quando è **spento (Grigio)**: I tasti del controller lanciano le clip.
7.  **⚙️ Impostazioni (Ingranaggio)**: Apre il pannello delle preferenze globali, dove puoi selezionare la **Scheda Audio di Uscita** (Routing). Fondamentale se usi mixer USB come Rødecaster Pro o schede esterne.

---

## 2.2 La Griglia a 5 Colonne (Swimlanes)

Il cuore operativo è diviso in 5 colonne verticali fisse. Ogni colonna ha un colore e una logica di comportamento specifica per aiutarti a organizzare lo show.

1.  **SHOW ASSETS (Verde)**
    *   *Contenuto*: Sigle, Basi, Sottofondi, Stacchi istituzionali.
    *   *Comportamento*: Elementi strutturali dello show. Spesso agiscono come "Sorgente" per abbassare il volume della musica (Ducking).
2.  **CANZONI DELL'EPISODIO (Rosso)**
    *   *Contenuto*: La tua playlist musicale.
    *   *Comportamento*: Subisce il Ducking (si abbassa) quando parlano le voci. Ha la priorità sugli Assets (Music Dominance).
3.  **VOCI / PREREGISTRAZIONI (Arancione)**
    *   *Contenuto*: Interviste, Vocali WhatsApp, Blocchi parlati preregistrati.
    *   *Comportamento*: **Priorità Massima**. Quando suona una clip qui, tutto il resto si abbassa.
4.  **SFX / CARTWALL (Grigio)**
    *   *Contenuto*: Effetti sonori brevi, applausi, rumori, jingles veloci.
    *   *Comportamento*: Suoni "Shot" che si sovrappongono a tutto senza influenzare i volumi altrui.
5.  **PRE-SHOW (Viola)**
    *   *Contenuto*: Musica di attesa prima della diretta.
    *   *Comportamento*: Playlist di riscaldamento.

### Avviso "Dead Air" (Fine Playlist)
L'intestazione delle colonne è intelligente. Se una colonna sta suonando l'ultima traccia disponibile e mancano meno di **20 secondi** alla fine, l'intestazione inizierà a **lampeggiare** (Giallo/Rosso) visualizzando l'avviso **DEAD AIR**.
Questo ti avverte visivamente che sta per calare il silenzio, dandoti il tempo di preparare la traccia successiva.

---

## 2.3 La Card Audio (Clip)

Ogni file audio caricato diventa una "Card" rettangolare nella griglia.

### Informazioni Visive
*   **Titolo**: Il nome del file (o il nome personalizzato assegnato).
*   **Timer**:
    *   *A riposo*: Mostra la durata totale (es. `03:45`).
    *   *In Play*: Mostra un **Countdown** (es. `-01:20`).
    *   *Alert*: Quando mancano meno di 15 secondi, il timer diventa **ROSSO** per segnalare la chiusura imminente.

### Badge e Simboli
Sulla card possono apparire diverse etichette che indicano come si comporterà la clip:
*   **[LOOP]**: La clip ricomincerà da capo automaticamente alla fine.
*   **[NEXT]**: Alla fine della clip, partirà automaticamente quella successiva (Crossfade).
*   **[STACCO]**: La clip non ferma il sottofondo, ma lo zittisce temporaneamente per sovrapporsi.
*   **[Q] / [SPACE]**: Indica il tasto della tastiera assegnato per il lancio rapido.
*   **[M:60]**: Indica che la clip è mappata su un controller MIDI esterno.

### Selezione e Interazione
*   **Click Sinistro**: Avvia (Play) o Ferma (Stop/Fade Out) la clip.
*   **Ctrl + Click**: Seleziona la clip senza suonarla (bordo Blu). Utile per selezionare più clip contemporaneamente ed eliminarle in blocco con il tasto `CANC`.
*   **Drag & Drop**: Puoi trascinare le clip per riordinarle o spostarle da una colonna all'altra.

