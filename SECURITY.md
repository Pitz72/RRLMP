# Politica di sicurezza

## Segnalare una vulnerabilità

**Non aprire una issue pubblica.** Scrivere a **info@runtimeradio.it** con oggetto
`[SECURITY] Live Machine Pro`, includendo:

- una descrizione del problema e del suo impatto;
- i passi per riprodurlo;
- la versione dell'applicazione e il sistema operativo.

Il progetto è mantenuto da una persona sola: aspettati una prima risposta entro pochi giorni, non
entro poche ore. Una volta confermata, la correzione viene pubblicata in una release e la
segnalazione accreditata nel changelog, salvo richiesta contraria.

## Versioni supportate

Riceve correzioni solo l'ultima versione pubblicata. L'applicazione controlla da sé la disponibilità
di aggiornamenti e chiede sempre conferma prima di scaricare e prima di installare.

## Modello di sicurezza

Cosa protegge l'applicazione e cosa no.

### I file audio e il protocollo `media://`

Il renderer — la parte dell'applicazione che disegna l'interfaccia — **non legge mai i file dal
disco**. L'audio arriva attraverso un protocollo interno, `media://`, servito dal processo
principale: il percorso richiesto viene interpretato come URL (non manipolato come testo) e deve
essere un percorso assoluto, locale o di rete (`\\server\cartella` su Windows). La decodifica e
l'analisi pesante (forma d'onda, silenzi, loudness, BPM) girano con FFmpeg nel processo principale,
mai nel renderer.

### I progetti `.lmp`

Un progetto è un file JSON che contiene **percorsi** ai file audio, non l'audio stesso. All'apertura
la struttura viene validata: campi mancanti o di tipo sbagliato vengono corretti o respinti, i tagli
incoerenti (più lunghi del brano) vengono azzerati invece di mandare in loop la riproduzione.
Un progetto ricevuto da altri può quindi puntare a percorsi qualsiasi del tuo disco, ma
l'applicazione li usa solo per **leggerli come audio**.

L'**esportazione con audio** copia i file in una cartella `audio/` accanto al progetto e rimuove i
file non più usati **solo** dalle cartelle che porta il proprio marcatore `.rrlmp-archive`: una
cartella `audio/` preesistente non viene mai svuotata.

### Il processo principale e l'interfaccia

- **Isolamento del renderer**: `contextIsolation` attivo, nessun accesso diretto a Node; le capacità
  passano da un ponte IPC esplicito.
- **Content Security Policy** applicata a ogni risposta; in produzione senza `unsafe-eval`.
- **Link esterni**: le finestre che l'interfaccia prova ad aprire vanno nel browser di sistema solo
  se sono `http`/`https`. La richiesta esplicita di aprire un link (manuale, pagina del progetto,
  contatti) è limitata a `https` verso un **elenco chiuso di host**; qualunque altro indirizzo viene
  rifiutato.
- **File temporanei**: l'applicazione cancella solo file temporanei creati da sé, riconosciuti da
  una regola unica.

### Il controllo remoto

Spento di serie e da attivare a mano; riparte spento a ogni avvio.

- **Solo rete locale**: il server ascolta sulla porta 8787 e non passa da internet.
- **PIN a sei cifre** generato dal generatore crittografico del sistema, **nuovo a ogni avvio** e
  mai salvato; il confronto avviene a tempo costante.
- **Limite ai tentativi**: 10 ogni 5 minuti per dispositivo.
- **Controllo dell'origine**: le connessioni WebSocket aperte da pagine web di altri siti vengono
  chiuse prima ancora di poter chiedere il PIN.
- **Comandi su lista bianca**: avviare e fermare una clip della colonna Musica, Stop All. Nient'altro.

**Limite dichiarato:** la pagina e i comandi viaggiano in **HTTP in chiaro** sulla rete locale. Chi
può intercettare il traffico di quella rete può leggere il PIN. Usalo su una rete di cui ti fidi.

### Gli aggiornamenti

- Controllati su GitHub Releases; il download **non parte mai da solo** e l'installazione avviene
  solo su conferma.
- `electron-updater` verifica l'impronta **SHA-512** di ogni pacchetto contro `latest.yml` prima di
  installarlo.
- Le note di rilascio mostrate nella finestra di aggiornamento sono l'HTML che GitHub genera dal
  corpo della release, scritto dal manutentore.

### Il microfono

Viene aperto **solo quando lo armi** (pulsante ARM). Serve a rilevare la voce per abbassare la
musica; entra nel mix di uscita (e quindi in un'eventuale registrazione) solo se attivi il *Canale
Mix Microfono*. Non viene inviato in rete.

### I dati

- Progetti, salvataggi automatici, registrazioni e preferenze **restano sulla tua macchina**.
  Nessun account, nessuna telemetria, nessun analytics.
- Le uniche connessioni in uscita sono verso GitHub (controllo aggiornamenti e PDF dei manuali) e,
  se lo attivi, il server del controllo remoto sulla rete locale.

## Limiti noti

- **Lettura dei tag audio**: la libreria `music-metadata` in uso ha una vulnerabilità nota (ciclo
  infinito su file `.wma`/`.asf` costruiti ad arte). La correzione richiede un aggiornamento maggiore
  della libreria, pianificato. Attenuazione presente: la lettura dei tag è interrotta dopo 10 secondi.
- **Binari non firmati** con un certificato commerciale: su Windows SmartScreen mostrerà un avviso al
  primo avvio. Chi vuole la certezza di cosa sta eseguendo può compilare dal sorgente.
- **macOS** non ha un installer ufficiale: si compila dal sorgente (vedi `CONTRIBUTING.md`).

## Cosa il programma non fa

- Non esegue codice proveniente dai progetti o dai file audio.
- Non richiede privilegi di amministratore per funzionare.
- Non apre automaticamente i file che registra o esporta.
