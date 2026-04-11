# CAPITOLO 1: INTRODUZIONE E SETUP

Benvenuto in **Runtime Live Machine Pro (RRLMP)**.
Questo capitolo ti guiderà nei primi passi: dalla comprensione della filosofia del software fino al primo avvio.

## 1.1 Cos'è Runtime Live Machine Pro (RRLMP)

**Runtime Live Machine Pro** è un'architettura audio professionale di classe "Pro" progettata per la regia di **singoli show dal vivo**, podcast, eventi e web radio.

A differenza dei complessi software di automazione radiofonica H24 (che suonano musica a rotazione per giorni), RRLMP è uno strumento di **Performance**. È pensato per essere "suonato" in tempo reale da un regista o da uno speaker, offrendo un controllo chirurgico su ogni transizione.

### Perché scegliere RRLMP?
*   **Filosofia "Single Show"**: Ogni progetto è un contenitore isolato che racchiude tutto ciò che serve per quella specifica puntata o evento.
*   **Architettura Main-Side-Heavy**: Utilizza un proxy Node.js per la decodifica audio pesante (FFmpeg), garantendo che l'interfaccia (Renderer) rimanga fluida e priva di crash anche con file WAV di grandi dimensioni.
*   **Sicurezza Totale**: Include sistemi di Auto-Backup, integrità dei file .lmp e avvisi visivi per i cue di Intro/Outro.
*   **Controllo Fisico**: Supporta nativamente controller MIDI (con MIDI Learn) e tastiere per una regia tattile e reattiva.

---

## 1.2 Installazione

### Requisiti di Sistema
*   **Windows**: Windows 10 o Windows 11 (64-bit).
*   **macOS**: macOS 11 (Big Sur) o successivi (Supporto nativo Apple Silicon & Intel).
*   **Linux**: AppImage e pacchetti .deb supportati (Ubuntu/Debian/Mint).
*   **RAM**: Minimo 4GB (Consigliati 8GB).
*   **Spazio Disco**: 200MB per l'applicazione + spazio per i tuoi file audio.

### Installazione su Windows
1.  Scarica il file `Runtime Live Machine Pro Setup 1.0.0.exe` dal sito ufficiale o dal repository.
2.  Fai doppio click sull'eseguibile.
3.  Il programma di installazione automatico copierà i file e creerà un collegamento sul Desktop.
4.  Al termine, l'applicazione si avvierà automaticamente.

> **Nota di Sicurezza**: Poiché il software è aggiornato frequentemente, Windows SmartScreen potrebbe mostrare un avviso "PC protetto da Windows". Clicca su **"Ulteriori informazioni"** e poi su **"Esegui comunque"**. Il software è sicuro, firmato e privo di malware.

### Installazione su macOS
1.  Scarica il file `.dmg`.
2.  Apri il file immagine e trascina l'icona di **Runtime Live Machine Pro** nella cartella **Applications**.
3.  Al primo avvio, potresti dover autorizzare l'applicazione nelle *Preferenze di Sistema > Sicurezza e Privacy*.

---

## 1.3 La Schermata di Benvenuto (Welcome Screen)

Al primo avvio, verrai accolto dalla nuova **Welcome Screen** in layout orizzontale. Questa è la tua dashboard di partenza, progettata per farti iniziare a lavorare in pochi secondi.

### Elementi della Schermata
1.  **Nuovo Logo**: Il logo Pro (5 barre VU meter con triangolo di play) identifica la versione stabile del software.
2.  **Stato Versione**: Sotto il logo, vedrai il numero della versione attuale (es. `v1.0.0`).
    *   ✅ **Verde**: Hai l'ultima versione disponibile.
    *   ⬇️ **Giallo/Arancione**: È disponibile un aggiornamento.
3.  **Selettore Lingua**: In alto a destra trovi le bandiere (8 lingue supportate) per cambiare istantaneamente l'interfaccia.
    *   *Lingue*: IT, EN, FR, DE, ES, PT, RU, ZH.
    *   La scelta viene memorizzata nel profilo utente.

### Azioni Disponibili
*   **Nuovo Progetto (New Project)**: Crea una sessione vuota. Tutte le 5 colonne (Assets, Music, Voice, SFX, PRE-SHOW) saranno pronte per il caricamento dei file.
*   **Carica Progetto (Load Project)**: Apre un file `.lmp` esistente. RRLMP eseguirà un controllo di integrità: se mancano dei file audio, verranno evidenziati in rosso.
*   **Manuale Online**: Apre la documentazione aggiornata nel tuo browser.

> **Primo Avvio**: RRLMP si avvia preferibilmente a tutto schermo. Una volta caricato un progetto, noterai il badge **PRO** ciano nell'header, a conferma della licenza e della stabilità del motore audio.

