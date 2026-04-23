# Capitolo 3 — L'interfaccia di lavoro

---

L'interfaccia di Runtime Live Machine Pro è costruita per il contesto operativo più esigente: la diretta. Ogni scelta visiva — il tema scuro, l'alto contrasto, le dimensioni dei controlli — risponde a un requisito funzionale. Non è estetica per l'estetica, ma ergonomia.

Quando apri un progetto, lo schermo si divide in due zone distinte: la **Barra di Controllo** in alto, che gestisce il progetto e il sistema, e la **Griglia di Regia** centrale, dove si svolge il lavoro effettivo.

---

## 3.1 La Barra di Controllo (Header)

L'header occupa l'intera larghezza dello schermo ed è suddiviso in quattro gruppi funzionali, disposti da sinistra a destra.

### Gruppo Identità e informazioni

**Logo e badge PRO.** Il logo a sinistra è anche un pulsante: cliccalo per aprire il pannello *Info & About*, che mostra la versione installata, lo stato degli aggiornamenti e i crediti del software.

Il badge **PRO** in ciano conferma che il motore audio è attivo. In condizioni normali è sempre visibile; la sua assenza indicherebbe un problema di inizializzazione.

**Timer On Air.** Il contatore a destra del logo mostra il tempo trascorso dall'avvio della prima clip della sessione corrente. Si azzera aprendo un nuovo progetto. È il tuo riferimento per la durata complessiva della trasmissione.

**Orologio di studio.** Un orologio digitale in formato HH:MM:SS, sincronizzato con l'orologio di sistema. Durante la diretta, è il riferimento assoluto per la messa in onda.

### Gruppo Monitoraggio audio

**Master Volume.** Lo slider orizzontale controlla il volume generale di uscita del software. Agisce come un fader master: porta a zero questo controllo e nessun suono uscirà, indipendentemente dallo stato delle singole clip. Il valore predefinito è il 100%.

**VU Meter stereo (L/R).** Due barre verticali mostrano il livello audio reale in uscita dopo il Master Volume. La scala cromatica è intuitiva:

- *Verde* — il segnale è a un livello ottimale per la trasmissione.
- *Giallo* — il segnale si avvicina alla saturazione; attenzione ai picchi.
- *Rosso* — clipping. Riduci il Master Volume o abbassa le clip che stanno contribuendo eccessivamente al mix.

### Gruppo Controllo (Toolbar)

Al centro dell'header si trova la toolbar principale, con il **pulsante STOP ALL** in posizione centrale per garantire il massimo accesso visivo in caso di emergenza.

**STOP ALL (pulsante rosso).** Ferma istantaneamente tutte le clip attive, tronca le code di riverbero, azzera i fade in corso. È il comando di emergenza del sistema. Il tasto `Esc` sulla tastiera esegue la stessa funzione — e lo fa anche quando il software non è in primo piano, grazie alla registrazione globale del tasto tramite Electron. Non occorre fare click sulla finestra prima di premere `Esc`: il comando è sempre attivo.

A destra del pulsante STOP ALL, le icone della toolbar sono raggruppate per funzione.

**Gestione file:**

- *Nuovo Progetto* — cancella la griglia corrente e apre una sessione vuota. Se sono presenti modifiche non salvate, il software chiede conferma prima di procedere.
- *Salva* — salvataggio rapido sul file `.lmp` corrente. Usalo con frequenza durante la preparazione dello show.
- *Salva con Nome* — apre sempre la finestra di dialogo, indipendentemente dal fatto che il progetto abbia già un nome. Utile per creare versioni progressive (es. `Ep47_bozza.lmp`, `Ep47_finale.lmp`).
- *Carica* — apre un progetto `.lmp` dal disco.
- *Export Package* — crea una copia autocontenuta del progetto, comprensiva di tutti i file audio. Descritto in dettaglio nel Capitolo 10.

**Hardware:**

- *MIDI Learn* — attiva la modalità di apprendimento MIDI (icona ciano = attiva). Descritta nel Capitolo 8.
- *Impostazioni* (ingranaggio) — apre il pannello delle preferenze globali: selezione della periferica audio di uscita, configurazione del Master Chain, impostazioni del microfono. Descritto nei Capitoli 7 e 8.
- *ARM Microfono* — abilita il monitoraggio del microfono collegato. Il pulsante è accompagnato da un mini VU meter in tempo reale. Descritto nel Capitolo 7.

### Gruppo Stato sessione

Nell'area destra dell'header possono comparire notifiche non intrusive (**toast**) relative a operazioni completate o avvisi di sistema. A differenza dei dialog bloccanti, i toast scompaiono automaticamente dopo pochi secondi e non interrompono la riproduzione.

---

## 3.2 La Griglia a cinque colonne

La griglia è il centro operativo del software. Cinque colonne verticali affiancate, ciascuna con una propria intestazione cromatica e una propria logica di comportamento audio.

### Intestazioni di colonna

Ogni intestazione riporta il nome della colonna e funge da indicatore di stato. In condizioni normali è statica e colorata nel tono caratteristico della colonna. Quando la clip in riproduzione si avvicina alla fine e la colonna non ha tracce successive disponibili, l'intestazione inizia a **lampeggiare** alternando giallo e rosso con la dicitura **DEAD AIR**. Questo avviso anticipa di circa 20 secondi il silenzio imminente, dando il tempo di preparare la traccia successiva.

Il colore di ogni colonna è personalizzabile tramite una palette di 30 tinte, accessibile cliccando con il tasto destro sull'intestazione. La scelta viene salvata nel file di progetto.

### Le cinque colonne

**Show Assets (Verde)**
Contiene gli elementi strutturali dello show: sigle, basi musicali, sottofondi (*bed*), stacchi istituzionali. Le clip in questa colonna si comportano come elementi di secondo piano: sono pronte a cedere spazio quando sopraggiungono voci o canzoni, ma mantengono la rotazione interna finché non vengono esplicitamente fermate.

**Canzoni dell'episodio (Rosso)**
La playlist musicale. Le clip in questa colonna partecipano attivamente al sistema di mixaggio automatico: vengono abbassate quando suonano le voci, e a loro volta abbassano le basi degli Assets quando entrano in riproduzione. Il Capitolo 6 illustra in dettaglio la gerarchia audio.

**Voci / Preregistrazioni (Arancione)**
Interviste, blocchi parlati preregistrati, messaggi vocali. Questa colonna ha la **priorità massima** nel sistema di mixaggio: quando una clip qui è in riproduzione, tutti gli altri segnali vengono automaticamente abbassati a un livello di sottofondo.

**SFX / Cartwall (Grigio)**
Effetti sonori brevi, applausi, jingle, stacchi. Le clip di questa colonna sono fuori dalla gerarchia di ducking: suonano sempre al volume pieno, si sovrappongono a qualsiasi altra cosa stia suonando senza essere influenzate né influenzare i livelli delle altre colonne. Un colpo di gong deve sentirsi forte anche sopra una voce.

**Pre-Show (Viola)**
La playlist di riscaldamento pre-diretta. Funziona come una coda musicale autonoma: le tracce si succedono nell'ordine in cui sono caricate. Quando inizia la diretta vera e propria, questa colonna viene svuotata o disattivata.

---

## 3.3 La Card Audio (Clip)

Ogni file audio importato si materializza nella griglia come una **card** rettangolare. La card è l'unità operativa del sistema: la vedi, la lanci, la configuri, la sposti.

### Anatomia di una card

**Titolo.** Il nome del file o il nome personalizzato assegnato nel pannello di modifica. Il titolo personalizzato cambia solo l'etichetta nel software; il file originale sul disco rimane intatto.

**Timer.** A riposo, mostra la durata totale della clip nel formato `MM:SS`. Durante la riproduzione, passa al **conto alla rovescia**: il tempo residuo è indicato con il prefisso negativo (es. `−01:20`). Quando mancano meno di 15 secondi alla fine, il timer diventa **rosso** — segnale che la clip si avvicina alla chiusura.

**Badge di stato.** Piccole etichette sovraimposte alla card comunicano in modo immediato le proprietà configurate:

- **[LOOP]** — la clip ripartirà dall'inizio al termine della riproduzione.
- **[NEXT]** — al termine di questa clip, partirà automaticamente quella successiva nella colonna (crossfade).
- **[STACCO]** — la clip è impostata per sovrapporsi alle altre senza fermarle.
- **[Q]** / **[SPACE]** o qualsiasi lettera — indica il tasto della tastiera assegnato per il lancio rapido.
- **[M:60]** — indica la nota MIDI assegnata al lancio della clip.
- **UP NEXT** — evidenzia quale clip sarà la prossima a partire nella sequenza automatica.
- **FADE OUT** (viola, pulsante) — appare sulla clip uscente durante un crossfade o una transizione in dissolvenza.
- **INTRO: −5s** — conto alla rovescia del punto di Intro, se configurato nell'editor della forma d'onda.

**Indicatore di riproduzione.** Quando una clip è in play, il bordo della card si illumina nel colore caratteristico della colonna. Il colore pieno indica la riproduzione attiva; il tono attenuato indica lo stato di riposo.

### Interazione con le card

- **Click sinistro** — avvia la clip se è ferma; la ferma (con fade out) se è in riproduzione.
- **Ctrl + Click** (Windows/Linux) o **Cmd + Click** (macOS) — seleziona la clip senza avviarla. Il bordo diventa blu. Utile per la selezione multipla e la cancellazione in blocco.
- **Tasto Canc** (o *Delete* / *Backspace*) — cancella le clip selezionate dalla griglia. Se sono selezionate più clip, il software chiede conferma.
- **Tasto destro** — apre il menu contestuale con le opzioni *Edit* (modifica proprietà) e *Remove* (rimozione dalla griglia).
- **Drag & Drop** — trascina una card per riordinarla all'interno della colonna o spostarla in un'altra. Un indicatore luminoso blu mostra la posizione di inserimento durante il trascinamento.

### Card in stato di errore

Una card con il **bordo rosso** indica che il file audio referenziato non è più raggiungibile: è stato spostato, rinominato o si trova su un disco esterno non collegato. La clip non è riproducibile finché il file non torna disponibile nel percorso originale. La gestione degli errori di percorso è trattata nel Capitolo 12.

