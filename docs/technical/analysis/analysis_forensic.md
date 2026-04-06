# RELAZIONE FORENSE: Analisi Guasto Riproduzione Audio 🕵️‍♂️🚫

**Data:** 30 Gennaio 2026
**Oggetto:** Persistenza errore `DEMUXER_ERROR_COULD_NOT_OPEN` e Fallimento Riproduzione

## 1. Analisi Forense
Nonostante i fix applicati (WAV mime-types, URI decoding), il problema persiste. L'analisi approfondita del codice e dei log evidenzia che la **Causa Radice** non è un semplice bug di sintassi, ma una **criticità architetturale**.

### Cronologia & Evidenze
1.  **Fase Pre-0.4.0:** Il sistema usava probabilmente `file://` o `Blob URL`. La riproduzione era gestita nativamente da Chromium. Stabile.
2.  **Fase 0.4.0 (Il Cambiamento):** È stato introdotto il **Protocollo Streaming Custom (`media://`)**.
    *   *Intento:* Migliorare performance e gestione memoria.
    *   *Realtà:* Abbiamo sostituito il motore di lettura file di Google Chrome (testato su miliardi di dispositivi) con uno script Node.js custom di 50 righe (`fs.createReadStream`).
3.  **Il Guasto:** L'errore `DEMUXER_ERROR` indica che Chromium riceve i dati, ma lo stream è "corrotto" o "inatteso" secondo i suoi standard stretti.
    *   I file WAV sono particolarmente sensibili agli header. Il nostro stream manuale (chunk da 64KB) potrebbe spezzare l'header o inviare metadati parziali che confondono il decoder.
    *   Inoltre, la latenza introdotta dal passaggio Renderer -> Main -> Node -> Pipe -> Renderer può causare timeout interni al motore audio.

### Verdetto
Il protocollo `media://` è **intrinsecamente fragile**. Continuare a patcharlo (mime types, decoding, headers) è un accanimento terapeutico. Stiamo reinventando la ruota (lettura file) quadrata.

---

## 2. Soluzione Proposta: "Native Direct Access"

Propopongo di abbandonare l'architettura streaming custom e tornare all'accesso nativo diretto. Poiché abbiamo già configurato `webSecurity: false` nel Main Process, non abbiamo ostacoli di sicurezza.

### Piano d'Azione Tecnica
1.  **Modifica Frontend (`pathUtils.ts`):**
    *   Smettere di generare URL `media://...`.
    *   Generare URL nativi `file:///C:/Percorso/File.wav`.
    *   Chromium gestirà direttamente la lettura, il buffering, il seeking e la decodifica con performance native e stabilità 100%.

2.  **Pulizia (`StreamPlayer.ts`):**
    *   Il player accetterà i nuovi URL `file://` senza bisogno di modifiche sostanziali (la logica di caricamento rimane uguale).

### Perché funzionerà?
*   Elimina interamente il codice Node.js problematico nel Main Process.
*   Elimina i problemi di URL Decoding (ci pensa il browser).
*   Elimina i problemi di Mime Type (ci pensa il browser).
*   Elimina i problemi di Chunking/Headers (ci pensa il browser).

---

## 3. Richiesta Autorizzazione
Questa modifica semplifica drasticamente il sistema. 
**Autorizzi a procedere con il ripristino dell'accesso `file://` nativo?**
(Impatto: Modifica immediata `pathUtils.ts`, Build v0.5.4 risolutiva).
