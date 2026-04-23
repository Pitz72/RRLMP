# Capitolo 7 — Il microfono in regia

---

Fino alla versione 1.0, Runtime Live Machine Pro gestiva esclusivamente file audio preregistrati. Dalla versione 1.1, il software integra un canale microfono diretto nel flusso di regia, con due funzionalità distinte: il **ducking automatico tramite voce rilevata** (Smart Mic Auto-Ducking) e il **canale microfono nel mix** (Mic-in-Mix Channel).

Queste due funzioni rispondono a esigenze diverse e possono essere usate separatamente o in combinazione.

---

## 7.1 Smart Mic Auto-Ducking

### Cos'è e quando usarla

Lo Smart Mic Auto-Ducking è una funzione **completamente opt-in**: è disattivata per impostazione predefinita e deve essere abilitata esplicitamente. Non intercetta né registra l'audio del microfono: lo analizza in tempo reale per rilevare la presenza di voce, dopodiché agisce sui livelli del mix esattamente come farebbe una clip della colonna Voci.

Il caso d'uso principale è il conduttore che parla al microfono live: quando il software rileva che sta parlando, abbassa automaticamente la musica in sottofondo senza che il conduttore debba premere nessun pulsante.

### Configurazione

1. Apri le **Impostazioni generali** (icona Ingranaggio nell'header).
2. Nella sezione *Microfono*, seleziona la periferica di ingresso dal menu a tendina. Vengono elencati tutti i dispositivi audio riconosciuti dal sistema operativo come sorgenti di input: microfono integrato, microfono USB, ingressi di mixer come il Rødecaster Pro.
3. Regola la **soglia del noise gate** (Threshold). Questo valore determina a quale livello di pressione sonora il software considera la voce come «attiva». Un valore troppo basso causerà ducking falsi positivi (il software reagisce a rumori di fondo); un valore troppo alto potrebbe non rilevare voci a bassa intensità. Il livello consigliato è tra −30 dB e −20 dB, da adattare all'acustica dell'ambiente.
4. Abilita il toggle *Smart Mic Auto-Ducking*.

### Il pulsante ARM nell'header

Una volta configurata la periferica, il pulsante **ARM** nell'header consente di abilitare e disabilitare rapidamente il monitoraggio senza accedere alle impostazioni. Quando ARM è attivo, il pulsante si illumina e un mini VU meter accanto ad esso mostra in tempo reale il livello del segnale in ingresso — utile per verificare che il microfono stia ricevendo segnale prima di andare in onda.

ARM attivo non significa che il microfono è in uscita: significa che il software sta ascoltando il microfono per il rilevamento della voce. L'audio del microfono nel mix è una funzione separata (vedi sezione 7.2).

### Comportamento del ducking

Quando il noise gate rileva segnale sopra la soglia configurata, il software applica lo stesso ducking che applicherebbe a una clip della colonna Voci: la musica scende a circa il 20% del volume con una transizione in dissolvenza. Quando il segnale torna sotto la soglia (il conduttore smette di parlare), la musica risale gradualmente al volume originale.

I tempi di risposta del gate (attack e release) sono ottimizzati per un comportamento naturale: la discesa è rapida (qualche decina di millisecondi), la risalita è più lenta (circa 1–2 secondi) per evitare che brevi pause nella voce provochino variazioni continue di volume.

---

## 7.2 Canale Microfono nel Mix (Mic-in-Mix)

Questa funzione indirizza l'audio del microfono fisico direttamente nel **master bus** di RLMP: il segnale del microfono si somma all'output del software e raggiunge la periferica audio di uscita insieme a tutti gli altri suoni in riproduzione.

Il Mic-in-Mix è progettato per setup in cui il conduttore non dispone di un mixer hardware esterno e vuole che la propria voce faccia parte del mix registrato o trasmesso direttamente dall'output di RLMP.

### Configurazione

1. Nelle **Impostazioni generali**, sezione *Microfono*, seleziona la periferica di ingresso (la stessa usata per lo Smart Mic, se entrambe le funzioni sono attive).
2. Abilita il toggle *Mic-in-Mix*.
3. Regola lo **slider di volume** del canale microfono per bilanciarlo con gli altri segnali nel mix.

**Avviso feedback.** Quando Mic-in-Mix è attivo, il software monitora il rischio di feedback acustico. Se rileva condizioni potenzialmente pericolose (es. il microfono è nella stessa stanza dei diffusori di uscita), visualizza un avviso di feedback nell'header. Questa funzione è particolarmente utile in contesti di streaming o trasmissione dove l'operatore non usa cuffie.

### Bypass della Master Chain

Quando il Mic-in-Mix è attivo, il segnale del microfono può essere configurato per bypassare la Master Chain (HPF, compressore, limiter) ed essere inserito direttamente nel bus di uscita. Questa opzione è presente nelle impostazioni ed è pensata per chi gestisce il processing del microfono esternamente (es. tramite un pre-ampificatore hardware con processori integrati).

### Differenza tra Smart Mic e Mic-in-Mix

| | Smart Mic Auto-Ducking | Mic-in-Mix |
|---|---|---|
| **Funzione** | Rileva la voce per applicare il ducking al mix | Porta l'audio del mic nell'output del software |
| **L'audio del mic è nell'output?** | No | Sì |
| **Richiede cuffie?** | No (ma consigliato) | Sì (per evitare feedback) |
| **Uso tipico** | Conduttore che parla live e vuole che la musica si abbassi automaticamente | Podcast o streaming senza mixer hardware |

Le due funzioni possono essere attive simultaneamente. In questo caso, il software rileva la voce del microfono *e* la include nell'output, applicando il ducking alle altre tracce mentre il microfono è aperto.

