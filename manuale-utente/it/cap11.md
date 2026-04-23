# Capitolo 11 — Funzioni avanzate

---

Questo capitolo raccoglie le funzionalità di RLMP che non appartengono al flusso di lavoro quotidiano di base, ma che — una volta scoperte — entrano stabilmente nella prassi di chi produce show con cura e regolarità. NoteBoard, la gestione cromatica delle colonne e le opzioni di personalizzazione dell'interfaccia sono strumenti per chi vuole costruire un ambiente di regia su misura.

---

## 11.1 NoteBoard: il copione in regia

La **NoteBoard** è il sistema di note integrate alle clip. Consente di associare a qualsiasi clip un testo scritto — dalle istruzioni operative alle scalette, dagli appunti sui personaggi di un'intervista al testo completo di uno spot — e di farlo comparire automaticamente sullo schermo nel momento in cui quella clip entra in riproduzione.

### Inserire note in una clip

1. Apri il pannello di configurazione della clip (click destro → *Edit*).
2. Nella sezione *Note* (NoteBoard), inserisci il testo nel campo di testo libero.
3. Non c'è limite di lunghezza.
4. Salva.

### Il pannello NoteBoard in diretta

Quando una clip con note entra in riproduzione, il **pannello NoteBoard** si apre automaticamente nella parte inferiore dello schermo, visualizzando il testo associato. Il pannello rimane visibile per tutta la durata della riproduzione della clip. Quando la clip termina — o viene fermata — il pannello si chiude automaticamente.

Se più clip con note sono in riproduzione simultanea, il pannello mostra le note della clip con priorità più alta nella gerarchia audio (cap. 6).

### Casi d'uso

**Regia parlata.** Il conduttore o il regista associa a ogni sigla o stacco musicale le prime righe del blocco parlato che segue. Quando la sigla parte, il testo compare in basso: prontamente consultabile senza cercare fogli sulla scrivania.

**Contenuto da leggere.** Un jingle pubblicitario o uno spot ha il testo completo nella NoteBoard: appena parte, il testo è davanti agli occhi del lettore.

**Istruzioni operative.** Note tecniche per il regista: «Abbassare il monitor», «Controllare livello cuffie ospite», «Ricordare di avviare la registrazione».

**Interviste e scalette.** Le domande da porre a un ospite possono essere associate alla clip dell'intervista. Il pannello le mostra durante tutta la durata della registrazione.

---

## 11.2 Personalizzazione cromatica delle colonne

L'interfaccia di RLMP è progettata con colori predefiniti che hanno un significato semantico consolidato (verde per gli Asset, rosso per le Canzoni, ecc.). Tuttavia, ogni colonna è personalizzabile: a ogni versione del progetto puoi assegnare una palette cromatica su misura.

### Come cambiare il colore di una colonna

Clicca con il **tasto destro sull'intestazione** della colonna. Si apre una palette di **30 colori** predefiniti. Clicca sul colore desiderato: la colonna — intestazione, card, indicatori di stato — assume immediatamente il nuovo colore.

La scelta è salvata nel file di progetto. Ogni progetto può avere una propria identità cromatica: puoi usare rosso/arancione per gli show mattutini, blu/viola per i notturni, verde/teal per i talk show.

Le card nella colonna **ereditano dinamicamente** il colore della colonna in tempo reale: una card a riposo appare in una tinta attenuata del colore della colonna; durante la riproduzione, il colore è pieno e luminoso. Questa progressione è coerente su tutti i 30 colori disponibili.

---

## 11.3 Transizioni tra clip

RLMP supporta tre modalità di transizione tra clip consecutive nella stessa colonna, configurabili nelle proprietà della clip uscente (sezione *Next Action*):

**Crossfade.** La clip uscente sfuma in uscita mentre la clip entrante sale in dissolvenza. Le due si sovrappongono per la durata del fade. La durata del crossfade è determinata dal Fade Out della clip uscente.

**Segue (Gapless).** La clip uscente finisce al suo punto naturale e la clip entrante parte immediatamente, senza sovrapposizione e senza silenzio. Usalo quando vuoi che le clip si susseguano in modo preciso, senza né il taglio secco né la sovrapposizione.

**Hard Cut.** La clip uscente viene troncata (Fade Out = 0 ms) e la clip entrante parte immediatamente. Non è strettamente una «transizione» ma la modalità più rapida per cambiare brano senza effetti.

Tutte e tre le modalità sono testabili nell'editor della forma d'onda tramite il pulsante *Preview Transition*, senza dover tornare alla griglia principale.

---

## 11.4 La finestra Impostazioni generali

Le **Impostazioni generali** (icona Ingranaggio → *General Settings*) raccolgono tutte le preferenze globali del software che non appartengono a un singolo progetto.

### Audio

**Periferica di uscita.** Seleziona la destinazione audio (trattato nel Capitolo 8).

**Master Chain.** Toggle per abilitare/disabilitare l'intera catena HPF + Compressore + Limiter. Quando disabilitata, il segnale passa direttamente al driver audio senza processing aggiuntivo.

### Microfono

**Periferica di ingresso.** Seleziona il microfono per Smart Mic e Mic-in-Mix.

**Soglia noise gate.** Il livello in dBFS sotto cui il software considera il segnale come silenzio.

**Smart Mic Auto-Ducking.** Toggle on/off per il rilevamento automatico della voce.

**Mic-in-Mix.** Toggle on/off per l'instradamento del microfono nel master bus. Slider di volume dedicato.

**Bypass Master Chain per Mic.** Toggle che esclude il processing del Master Chain per il solo segnale del microfono.

### Interfaccia

**Lingua.** Seleziona la lingua dell'interfaccia tra le otto disponibili. La modifica è immediata e non richiede riavvio.

**Avvio a tutto schermo.** Se attivo, RLMP si apre sempre in modalità a schermo intero, indipendentemente dalle dimensioni della finestra all'ultima chiusura.

---

## 11.5 Sistema di notifiche toast

RLMP non usa finestre di dialogo bloccanti per le comunicazioni di routine. Tutte le notifiche non critiche vengono presentate come **toast**: piccoli banner non intrusivi che compaiono nell'angolo dello schermo, rimangono visibili per alcuni secondi e scompaiono automaticamente senza interrompere la riproduzione.

Le notifiche toast vengono usate per:
- Conferma di salvataggio completato.
- Completamento dell'Export Package.
- Rilevamento di un aggiornamento disponibile.
- Avvisi di file mancanti al caricamento del progetto.
- Feedback di operazioni MIDI Learn.

Le **finestre di dialogo di conferma** — necessarie quando un'azione è irreversibile, come la cancellazione di clip o la chiusura di un progetto non salvato — sono invece modali e richiedono una risposta, ma sono progettate in modo da non troncare la riproduzione in corso: l'audio continua mentre aspetti di rispondere.

