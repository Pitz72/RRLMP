# Capitolo 4 — Il workflow base: caricare e riprodurre

---

Il ciclo operativo fondamentale di Runtime Live Machine Pro si articola in tre fasi: importare i file audio, organizzarli nella griglia, riprodurli durante la diretta. Questo capitolo descrive ciascuna fase con la precisione necessaria per lavorare in modo sicuro anche sotto pressione.

---

## 4.1 Importare i file audio

RLMP non dispone di un browser interno né di una libreria centralizzata. L'importazione avviene esclusivamente tramite **drag & drop** diretto dal file manager del sistema operativo — Esplora risorse su Windows, Finder su macOS, Nautilus o equivalenti su Linux.

### Il gesto base

1. Apri la cartella del tuo computer dove si trovano i file audio.
2. Seleziona uno o più file. Per selezionare più file: `Ctrl+Click` per selezione discontinua, `Shift+Click` per selezione continua.
3. Trascina i file selezionati sopra una delle cinque colonne della griglia e rilascia.

Ogni file genera una card nella colonna di destinazione. Se trascini più file contemporaneamente, le card vengono create nell'ordine in cui i file compaiono nel file manager, in sequenza dall'alto verso il basso.

**Indicatore di inserimento.** Durante il trascinamento, una linea blu luminosa scorre lungo la colonna indicando la posizione esatta in cui le card verranno inserite. Puoi scegliere di inserire nuove clip in cima alla colonna, in fondo o in una posizione intermedia con precisione.

### Formati supportati

Il motore FFmpeg integrato garantisce compatibilità con i principali formati audio:

| Formato | Estensione | Note |
|---|---|---|
| MP3 | `.mp3` | Tutti i bitrate da 32 a 320 kbps |
| WAV | `.wav` | PCM non compresso, qualsiasi profondità di bit |
| AAC / M4A | `.aac`, `.m4a` | Include file da iTunes/Apple Music |
| OGG Vorbis | `.ogg` | |
| FLAC | `.flac` | Lossless, qualsiasi sample rate |

**Una nota sulle prestazioni.** Il protocollo di streaming `media://` garantisce che i file audio non vengano caricati in memoria RAM al momento dell'importazione. Un file WAV non compresso da 2 GB si comporta esattamente come un MP3 da 5 MB: il caricamento è istantaneo e l'impatto sulla memoria di sistema è trascurabile. Le risorse della CPU vengono impegnate solo durante la decodifica attiva, cioè durante la riproduzione.

### Il percorso dei file

RLMP memorizza il **percorso assoluto** del file sul disco, non una copia del file stesso. Se sposti, rinomini o cancelli il file originale, la card corrispondente diventerà rossa e non sarà più riproducibile. Per lavorare su più computer o creare archivi portabili, utilizza la funzione **Export Package** descritta nel Capitolo 10.

---

## 4.2 Riproduzione: avviare e fermare le clip

### Avviare una clip

Un **click sinistro** sulla card è sufficiente per avviare la riproduzione. Il feedback è immediato: il bordo della card si illumina nel colore della colonna, il timer passa al conto alla rovescia e i VU meter nell'header riflettono il segnale in uscita.

Se alla clip è stato assegnato un tasto della tastiera (vedi Capitolo 8), quel tasto funziona come alternativa al click — utile quando stai operando su un'altra parte dell'interfaccia e non vuoi spostare il mouse.

### Fermare una clip

**Click sulla clip attiva** — la clip entra nella fase di **fade out** e si ferma entro il tempo configurato nelle sue proprietà (vedi Capitolo 5). Il comportamento predefinito prevede una dissolvenza di 1–2 secondi per le canzoni e gli assets, e uno stop secco per gli SFX.

**Tasto `Esc`** — ferma tutte le clip attive istantaneamente, senza fade. È il comando di emergenza. Funziona anche quando il software non è la finestra in primo piano.

**Pulsante STOP ALL** nell'header — identico a `Esc`, accessibile con il mouse.

### La logica di esclusione per colonna

Nella maggior parte delle colonne, RLMP applica la regola **«una clip alla volta»**: se stai riproducendo il *Brano A* nella colonna Canzoni e clicchi sul *Brano B* nella stessa colonna, il *Brano A* si ferma (con fade out) e il *Brano B* parte. Non è necessario fermare manualmente la clip in corso prima di avviarne un'altra.

La colonna **SFX** è l'eccezione principale: gli effetti sonori si sovrappongono a tutto, inclusi altri effetti della stessa colonna, e non interrompono ciò che sta suonando altrove. Un applauso può partire mentre una canzone è in corso senza interromperne la riproduzione.

Le clip con il comportamento **Stacco** (configurabile nelle proprietà, vedi Capitolo 5) si comportano come gli SFX rispetto alla logica di esclusione, indipendentemente dalla colonna di appartenenza.

---

## 4.3 Organizzare la scaletta

### Riordinare le clip

Durante la preparazione dello show, o anche mentre lo show è in corso, puoi riorganizzare l'ordine delle clip in qualsiasi momento.

**Trascinamento interno.** Clicca su una card, tieni premuto e trascinala verso l'alto o verso il basso nella stessa colonna. La linea guida blu indica la posizione di inserimento. La clip si inserisce nella nuova posizione senza interrompere le riproduzioni in corso.

**Spostamento tra colonne.** Puoi trascinare una clip da una colonna all'altra. Quando lo fai, la clip **eredita le regole della colonna di destinazione**: una voce preregistrata spostata nella colonna Canzoni inizierà a subire il ducking esattamente come un brano musicale; un jingle spostato nella colonna SFX acquisirà il comportamento di sovrapposizione libera.

Spostare le clip tra colonne è un'operazione potente e intenzionale. Usa la funzione in modo consapevole, specialmente durante la diretta.

### Selezione multipla e cancellazione

Per rimuovere più clip dalla griglia in una sola operazione:

1. `Ctrl+Click` (Windows/Linux) o `Cmd+Click` (macOS) su ciascuna clip da selezionare. Il bordo diventa blu.
2. Premi `Canc` o `Delete`. Il software chiede conferma se il numero di clip selezionate è superiore a una.

La cancellazione dalla griglia rimuove le clip dal progetto corrente, non i file audio dal disco.

> **Suggerimento operativo.** A diretta iniziata, svuotare la colonna Pre-Show con una selezione multipla e `Canc` è il modo più rapido per liberare spazio visivo nell'interfaccia e passare alla modalità operativa.

---

## 4.4 Cue di struttura: INTRO e OUTRO

Ogni clip può avere due **marker strutturali** configurati nell'editor della forma d'onda (Capitolo 5):

- **Intro Marker** — il punto in cui la melodia principale del brano entra effettivamente, dopo l'introduzione strumentale. Utile per sapere esattamente quando iniziare a parlare sopra l'intro.
- **Outro Marker** — il punto in cui inizia la coda finale del brano. Segnala il momento giusto per preparare la transizione alla traccia successiva.

Quando la riproduzione di una clip si avvicina a questi punti, sulla card compare un avviso visivo:

- **INTRO: −Xs** — conto alla rovescia in secondi all'Intro Marker.
- **OUTRO: −Xs** — conto alla rovescia in secondi all'Outro Marker.

Questi avvisi vengono visualizzati solo se i marker sono stati configurati. Sulle clip senza marker, la card mostra solo il conto alla rovescia standard al termine del brano.

