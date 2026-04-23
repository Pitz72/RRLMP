# Capitolo 2 — Installazione e primo avvio

---

L'installazione di Runtime Live Machine Pro è progettata per richiedere il minimo di interazione: pochi click, nessuna configurazione manuale, nessun prerequisito da installare separatamente. Il motore audio (FFmpeg) è integrato nel pacchetto di installazione e non richiede alcun intervento da parte tua.

---

## 2.1 Requisiti di sistema

Prima di procedere, verifica che il tuo computer soddisfi i requisiti minimi. Le specifiche consigliate garantiscono la migliore esperienza durante sessioni lunghe o con molte clip caricate simultaneamente.

| | Minimo | Consigliato |
|---|---|---|
| **Sistema operativo (Windows)** | Windows 10 64-bit | Windows 11 64-bit |
| **Sistema operativo (macOS)** | macOS 11 Big Sur | macOS 13 Ventura o successivi |
| **Sistema operativo (Linux)** | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| **RAM** | 4 GB | 8 GB o più |
| **Spazio su disco** | 300 MB (applicazione) | 1 GB + spazio per i file audio |
| **CPU** | Qualsiasi dual-core moderno | Quad-core o superiore |

Il software è ottimizzato per Apple Silicon (M1, M2, M3) e gira in modo nativo su entrambe le architetture macOS senza emulazione Rosetta.

Non è richiesta una scheda audio dedicata: RLMP funziona con qualsiasi periferica audio riconosciuta dal sistema operativo, dalla scheda audio integrata ai mixer USB professionali come il Rødecaster Pro o l'RØDECaster Duo.

---

## 2.2 Installazione su Windows

1. Scarica il file `Runtime Live Machine Pro Setup 1.2.0.exe` dal sito ufficiale.
2. Fai doppio click sull'eseguibile. L'installer NSIS si avvierà e copierà i file nelle directory appropriate.
3. Al termine, un collegamento verrà creato sul Desktop e nel menu Start.
4. L'applicazione si avvia automaticamente al completamento dell'installazione.

**Nota su Windows SmartScreen.** Poiché il software viene aggiornato con frequenza, il certificato di firma digitale potrebbe non avere ancora accumulato la «reputazione» sufficiente per la whitelist automatica di SmartScreen. Se compare l'avviso «Il PC è stato protetto da Windows», clicca su *Ulteriori informazioni* e poi su *Esegui comunque*. Il software è privo di malware e il codice sorgente è disponibile pubblicamente.

---

## 2.3 Installazione su macOS

1. Scarica il file `.dmg` dal sito ufficiale.
2. Apri il file immagine e trascina l'icona di Runtime Live Machine Pro nella cartella *Applicazioni*.
3. Al primo avvio, macOS potrebbe mostrare un avviso Gatekeeper («App non può essere aperta perché proviene da uno sviluppatore non identificato»). Per procedere, apri *Preferenze di Sistema* → *Sicurezza e Privacy* → *Generali* e clicca su *Apri comunque* accanto al nome dell'applicazione.

Dalla versione macOS 15 (Sequoia) in poi, il percorso è *Impostazioni di Sistema* → *Privacy e sicurezza* → scorri fino alla sezione *Sicurezza*.

---

## 2.4 Installazione su Linux

Sono disponibili due formati di distribuzione:

- **AppImage** — eseguibile portabile, non richiede installazione. Rendi il file eseguibile (`chmod +x`) e avvialo direttamente.
- **Pacchetto .deb** — per distribuzioni Debian/Ubuntu/Mint. Installa con `sudo dpkg -i nomefile.deb` oppure aprilo con il gestore pacchetti grafico.

Su alcune distribuzioni potrebbe essere necessario installare il pacchetto `libasound2` per il supporto audio ALSA. Consulta la documentazione della tua distribuzione se l'applicazione non si avvia.

---

## 2.5 La schermata di benvenuto

Al primo avvio — e a ogni avvio successivo, finché non apri un progetto — RLMP presenta la **Welcome Screen**, il punto di accesso a tutte le operazioni preliminari.

Il layout è orizzontale e comprende tre zone funzionali.

**Zona sinistra — Identità e stato.**
Il logo del software (cinque barre di VU meter con il simbolo di play) identifica visivamente la versione Pro. Sotto il logo è riportato il numero di versione installata, accompagnato da un indicatore cromatico di aggiornamento:

- **Verde** — il software è aggiornato all'ultima versione disponibile.
- **Giallo/Arancione** — è disponibile un aggiornamento. Visita il sito ufficiale per scaricarlo.

**Zona centrale — Azioni principali.**

- *Nuovo Progetto* — crea una sessione vuota con le cinque colonne pronte al caricamento.
- *Carica Progetto* — apre un file `.lmp` esistente. Prima di renderlo operativo, RLMP esegue un **controllo di integrità**: verifica che ogni file audio referenziato esista ancora nel percorso memorizzato. I file mancanti vengono immediatamente segnalati con un bordo rosso sulla rispettiva clip.
- *Manuale* — apre la documentazione nel browser predefinito.

**Zona destra — Selettore lingua.**
RLMP supporta otto lingue dell'interfaccia: Italiano, Inglese, Francese, Tedesco, Spagnolo, Portoghese, Russo e Cinese semplificato. La bandiera corrispondente alla lingua attiva è evidenziata. La selezione viene memorizzata nel profilo utente e persiste tra una sessione e l'altra.

---

## 2.6 Il primo avvio: cosa aspettarsi

Alla prima apertura di un progetto, noterai nell'header il badge **PRO** in ciano acceso. Non è un elemento decorativo: conferma che il motore audio in background è attivo e operativo, che FFmpeg è stato inizializzato correttamente e che il protocollo di streaming `media://` è in ascolto.

Il software si avvia preferibilmente in modalità a tutto schermo. Se la finestra dovesse aprirsi ridimensionata, premi `F11` (Windows/Linux) o `Ctrl+Cmd+F` (macOS) per portarla a schermo intero — condizione ottimale per il lavoro di regia.

Il **Timer On Air** nell'header rimarrà a zero finché non viene lanciata la prima clip della sessione. Da quel momento inizierà a contare il tempo trascorso in diretta: uno strumento di riferimento utile per chi lavora con scalette a tempo fisso.

