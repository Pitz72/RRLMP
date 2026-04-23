# Capitolo 5 — Proprietà della clip e Waveform Editor

---

Ogni file audio ha una sua storia prima di arrivare in griglia: registrazioni con secondi di silenzio iniziale, brani con code interminabili, interviste con il livello troppo basso rispetto al resto dello show. Invece di ricorrere a un editor audio esterno ogni volta che un file non è «pronto per la messa in onda», RLMP mette a disposizione un pannello di configurazione per ciascuna clip e un editor visivo della forma d'onda con funzionalità di taglio e marcatura.

Tutte le modifiche apportate tramite questi strumenti sono **non distruttive**: il file originale sul disco rimane invariato. RLMP memorizza le impostazioni nel file di progetto `.lmp` e le applica al volo durante la riproduzione.

Per aprire il pannello di configurazione di una clip, fai **click con il tasto destro** sulla card e seleziona *Edit* dal menu contestuale.

---

## 5.1 Proprietà di base

### Nome e apparenza

**Nome clip.** Puoi assegnare un nome personalizzato alla clip, indipendente dal nome del file originale. Il nome viene visualizzato sulla card nella griglia. Usa nomi descrittivi e operativamente utili durante la diretta: «SIGLA DI APERTURA» è più leggibile di `sigla_rev3_finale_def.mp3` quando hai tre secondi per trovare la clip giusta.

**Colore personalizzato.** Per impostazione predefinita, la clip eredita il colore della colonna di appartenenza. Qui puoi assegnare un colore specifico per farla risaltare visivamente. Utile per marcare clip critiche (es. la sigla di chiusura in rosso scuro) o per differenziare gruppi tematici all'interno della stessa colonna.

### Volume (Gain)

Lo slider di guadagno va da 0% a 150% e agisce come un pre-fader sulla clip specifica, prima del Master Volume globale.

Il caso d'uso più comune è l'allineamento dei livelli: se hai un vocale registrato a bassa intensità (es. un messaggio WhatsApp o una registrazione telefonica), puoi portarlo oltre il 100% per avvicinarlo al volume delle altre tracce. Viceversa, puoi abbassare una clip particolarmente «calda» senza toccare il Master Volume.

---

## 5.2 L'editor della forma d'onda

L'editor visivo è la funzione più potente del pannello di configurazione. Occupa la zona centrale del pannello e mostra la rappresentazione grafica dell'audio dell'intera clip.

### Navigazione nell'editor

**Zoom orizzontale.** Puoi ingrandire la vista della forma d'onda da 1× (vista completa) a 8×, tramite lo slider di zoom o la rotella del mouse sopra l'editor. A zoom elevato, la vista scorre seguendo la posizione corrente.

**Ruler adattivo.** L'asse temporale nella parte superiore dell'editor si adatta automaticamente allo zoom: a vista completa mostra i minuti, a zoom 8× mostra i secondi e i centesimi.

**Playhead.** Durante la riproduzione di anteprima (vedi oltre), un indicatore verticale scorre in tempo reale lungo la forma d'onda, mostrando la posizione corrente di riproduzione.

### Le quattro maniglie

Sull'editor sono presenti quattro **handle** trascinabili, ciascuno con una funzione specifica:

**Trim Start (maniglia verde sinistra).** Definisce il punto di inizio effettivo della clip. Tutto ciò che si trova a sinistra di questa maniglia viene saltato durante la riproduzione. Trascina la maniglia verso destra per eliminare i silenzi o le parti indesiderate dall'inizio.

**Trim End (maniglia verde destra).** Definisce il punto di fine effettivo della clip. Tutto ciò che si trova a destra di questa maniglia viene ignorato. Trascina verso sinistra per accorciare la coda.

**Intro Marker (maniglia gialla).** Segna il punto strutturale in cui la melodia principale entra nel brano, dopo l'eventuale introduzione strumentale. Una volta impostato, sulla card in riproduzione comparirà il conto alla rovescia **INTRO: −Xs** che segnala l'avvicinarsi di questo punto.

**Outro Marker (maniglia arancione).** Segna il punto in cui inizia la coda del brano — tipicamente il momento in cui il conduttore deve iniziare a parlare per riempire la transizione alla traccia successiva. Sulla card in riproduzione comparirà il conto alla rovescia **OUTRO: −Xs**.

I valori numerici di ciascuna maniglia sono leggibili e modificabili anche nei campi di testo corrispondenti, per chi preferisce l'inserimento preciso in secondi.

### Auto-Trim (Bacchetta magica)

Il pulsante con l'icona della **bacchetta magica** avvia il rilevamento automatico del silenzio tramite FFmpeg. L'algoritmo analizza il file in pochi istanti e individua i punti in cui il segnale audio emerge dalla soglia di silenzio (−40 dB). Il Trim Start e il Trim End vengono impostati automaticamente, eliminando silenzi iniziali e code mute senza alcun intervento manuale.

Questa funzione è particolarmente utile per le registrazioni vocali non elaborate: telefonate, messaggi audio, interviste registrate su dispositivi mobili. Applicare l'Auto-Trim a tutta la colonna Voci prima di uno show richiede meno di un minuto e migliora significativamente la pulizia delle transizioni.

> **Nota tecnica.** L'analisi avviene nel Main Process tramite FFprobe, senza caricare il file in memoria nel Renderer. Su file di grandi dimensioni (ore di registrazione), il tempo di analisi è comunque nell'ordine di pochi secondi.

### Anteprima della transizione

Se la clip ha configurato una **Next Action** (vedi sezione 5.3), il pulsante *Preview Transition* nel pannello consente di testare il crossfade o la transizione segue direttamente nell'editor, senza dover tornare alla griglia principale. Un pulsante Stop dedicato interrompe l'anteprima.

---

## 5.3 Comportamenti e automazione

### Behavior (modalità di sovrapposizione)

**Normal** — comportamento predefinito. Quando questa clip viene avviata, interrompe qualsiasi altra clip in riproduzione nella stessa colonna (con fade out). È il comportamento corretto per canzoni e basi: una canzone esclude le altre.

**Stacco** — la clip viene avviata senza interrompere le altre clip della colonna. Si sovrappone o affianca le altre, abbassandole leggermente se necessario ma senza fermarle. Il caso d'uso tipico è uno *station ID* («Stai ascoltando…») che deve «cavalcare» l'intro di un brano, o un jingle breve che non deve interrompere la base in loop sottostante.

### Next Action (automazione alla fine)

Definisce cosa accade quando la clip raggiunge il punto di Trim End.

**Stop** — comportamento predefinito. La clip termina e si ferma.

**Loop** — la clip ricomincia dall'inizio (dal Trim Start) senza soluzione di continuità. Il badge **[LOOP]** appare sulla card. Usalo per basi musicali, ambienti sonori o sigle di sottofondo che devono girare finché non vengono fermate esplicitamente.

**Play Next** — quando la clip si avvicina alla fine, avvia automaticamente la clip successiva nella colonna con un **crossfade** fluido. Il badge **[NEXT]** appare sulla card. La durata del crossfade è determinata dal valore di fade out della clip uscente e dal fade in della clip entrante (vedi sezione 5.4).

Il comportamento **Play Next** crea di fatto una playlist automatica all'interno della colonna. Puoi configurarlo su più clip consecutive per costruire blocchi musicali o sequenze parlate che scorrono senza interruzioni.

---

## 5.4 Dissolvenze (Fade In e Fade Out)

Ogni colonna ha valori di fade predefiniti che vengono applicati a tutte le clip al suo interno. Il pannello di modifica consente di sovrascrivere queste impostazioni per la singola clip.

**Fade In (millisecondi).** Il tempo che il volume impiega ad arrivare al livello massimo dall'avvio. Un valore di 2000 ms produce una salita graduale di due secondi. Usalo sulle basi musicali che devono emergere dolcemente; mantienilo a 0 per le voci e gli effetti sonori che devono essere uditi immediatamente.

**Fade Out (millisecondi).** Il tempo di dissolvenza alla chiusura — sia quando si clicca su una clip attiva sia quando la clip raggiunge naturalmente la fine. Valori tipici: 2000–3000 ms per le canzoni, 500–1000 ms per le basi, 0 ms per gli stacchi secchi e gli SFX.

Un fade out a 0 ms produce una chiusura immediata («hard cut»). Usarlo su un brano musicale in diretta può essere percepito come un errore tecnico: valuta con attenzione quando è appropriato.

---

## 5.5 Assegnazione controlli

La sezione inferiore del pannello elenca i controlli di input assegnati alla clip.

**Trigger Keybind.** Il campo mostra il tasto della tastiera assegnato. Per modificarlo, clicca sul campo e premi il nuovo tasto desiderato. I tasti disponibili includono: lettere (A–Z), numeri (0–9), tasti funzione (F1–F12), tastierino numerico. I tasti già utilizzati per comandi globali non possono essere riassegnati alle clip.

**MIDI Bind.** Mostra la nota o il messaggio MIDI assegnato (es. `NOTE:60`, `CC:7`). L'assegnazione avviene tramite la modalità MIDI Learn nella griglia principale, non dal pannello di modifica (vedi Capitolo 8).

I binding sono salvati nel file di progetto: portando il progetto su un altro computer con lo stesso controller MIDI, le mappature funzioneranno senza riconfigurazione.

