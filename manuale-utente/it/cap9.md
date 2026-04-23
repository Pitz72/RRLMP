# Capitolo 9 — Registrazione della sessione

---

Session Recording è la funzione che trasforma Runtime Live Machine Pro da strumento di playout a strumento di produzione completa. Invece di richiedere un software di registrazione separato o una catena di routing virtuale, RLMP cattura direttamente il **master mix post-processato** — tutto ciò che esce dall'applicazione, inclusi gli effetti del Master Chain — in un file audio sul disco.

La funzione è stata introdotta nella versione 1.1 e completata nella versione 1.2 con il sistema di export modale che consente di scegliere formato e qualità a registrazione terminata.

---

## 9.1 Avviare la registrazione

Il controllo della registrazione si trova nella barra dell'header, identificato dall'icona di registrazione (cerchio rosso).

**Avvio.**
Clicca sul pulsante di registrazione. Un indicatore luminoso rosso e un contatore di tempo mostrano che la cattura è in corso. La registrazione parte immediatamente, in modo sincrono con la sessione: tutto ciò che esce dall'output del software da quel momento viene catturato.

Non è necessario avere clip in riproduzione per avviare la registrazione: puoi avviare la cattura in anticipo rispetto all'inizio dello show, per non perdere i primi secondi in caso di avvio anticipato.

**Cosa viene registrato.**
Il segnale catturato è il **master post-limiter**: include il mix di tutte le clip in riproduzione, il processing del Master Chain (HPF, compressore, limiter) e, se il Mic-in-Mix è attivo, anche il segnale del microfono. È esattamente il segnale che raggiunge la periferica audio di uscita.

**Overhead di sistema.**
La registrazione avviene nel Main Process tramite FFmpeg: il Renderer non è coinvolto e l'impatto sulle prestazioni dell'interfaccia è trascurabile. Puoi registrare sessioni di ore senza preoccuparti del consumo di risorse.

---

## 9.2 Fermare la registrazione e scegliere il formato

Quando clicchi sul pulsante di registrazione per fermarla, si apre automaticamente la **finestra di export**. Questo è il momento in cui scegli in quale formato salvare il file.

### Formati disponibili

| Formato | Estensione | Caratteristiche |
|---|---|---|
| **WAV** | `.wav` | Lossless non compresso. Massima qualità, file grandi. Ideale per archivio e post-produzione. |
| **FLAC** | `.flac` | Lossless compresso. Stessa qualità del WAV, dimensioni ridotte del 40–60%. Ideale per archivio. |
| **MP3** | `.mp3` | Lossy. Bitrate selezionabile. Ideale per distribuzione e podcast. |
| **OGG** | `.ogg` | Lossy open-source. Buon rapporto qualità/dimensione. |
| **WEBM** | `.webm` | Lossy, ottimizzato per streaming web. |

### Opzioni di qualità

Per i formati lossless (WAV e FLAC), puoi selezionare la **profondità di bit**: 16 bit (standard CD), 24 bit (standard professionale broadcast), 32 bit float (massima precisione, ideale se la registrazione viene masterizzata successivamente).

Per i formati lossy (MP3, OGG, WEBM), puoi selezionare il **bitrate**: da 128 kbps a 320 kbps. Per un podcast destinato alla distribuzione online, 192 kbps stereo è il minimo consigliato; 256 kbps è lo standard corrente per la qualità «trasparente».

### Selezione del percorso di salvataggio

Nella finestra di export, scegli la cartella di destinazione e il nome del file. Se non viene specificato un nome, RLMP genera automaticamente un nome basato sulla data e l'ora della sessione (es. `session_2026-04-12_21-30.wav`).

Clicca **Esporta** per avviare la conversione. FFmpeg processa il file in pochi secondi anche per registrazioni lunghe.

---

## 9.3 Considerazioni pratiche

### Sincronizzazione con lo show

Session Recording cattura tutto il tempo trascorso tra Start e Stop, inclusi i silenzi. Se hai avviato la registrazione 30 secondi prima dell'inizio effettivo dello show, il file risultante includerà quei 30 secondi iniziali di silenzio (o di eventuale audio pre-show).

Per un risultato pronto alla distribuzione senza post-editing, avvia la registrazione esattamente quando inizia lo show.

### Registrazione e backup contemporanei

Il sistema di Auto-Backup del progetto (vedi Capitolo 10) e la Session Recording operano in modo completamente indipendente. Puoi registrare uno show mentre il backup automatico ogni 5 minuti salva silenziosamente lo stato del progetto: le due operazioni non interferiscono.

### Uso con Mic-in-Mix

Se stai usando il Mic-in-Mix (Capitolo 7) e vuoi che la tua voce faccia parte della registrazione, assicurati che il Mic-in-Mix sia attivo **prima** di avviare la Session Recording. Il segnale del microfono è già presente nel master bus post-processato che viene catturato: non richiede configurazione aggiuntiva.

### Formato consigliato per contesti diversi

**Podcast** — MP3 256 kbps stereo o FLAC 16 bit. Il primo se distribuisci direttamente il file, il secondo se passerai per un editor.

**Archivio storico** — WAV 24 bit o FLAC 24 bit. Dimensioni generose, massima flessibilità per eventuali rimaster futuri.

**Radio / Streaming** — Verifica i requisiti della tua piattaforma. La maggior parte delle piattaforme di streaming audio accetta MP3 128–192 kbps o AAC; alcune richiedono WAV non compresso. RLMP esporta in tutti i formati più diffusi per coprire ogni scenario.

