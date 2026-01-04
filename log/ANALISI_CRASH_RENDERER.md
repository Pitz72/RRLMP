# Analisi Forense: Crash del Renderer (Schermo Bianco / DevTools Disconnected)

## 1. Il Sintomo
Il messaggio "DevTools disconnected" accompagnato da uno schermo bianco/grigio in Electron (specialmente in build di produzione) indica inequivocabilmente un **Crash del Processo Renderer**.
Non è un errore JavaScript (che verrebbe catturato dal try/catch o mostrerebbe un stack trace). Il processo che disegna l'interfaccia è "morto" improvvisamente (Segmentation Fault, Out of Memory, o violazione di accesso nativo).

## 2. Simulazione del Codice (Trace Virtuale)
Tracciamo cosa accade al momento del drop nella versione `0.0.5fix7`:

1.  **Evento Drop**: L'utente rilascia il file.
2.  **Interceptor (App.tsx / index.html)**: `preventDefault()` viene chiamato. La navigazione nativa è bloccata. **OK**.
3.  **Handler (MainGrid.tsx)**:
    - `Array.from(e.dataTransfer.files)`: Crea un array di oggetti `File`.
    - In Electron, questi oggetti sono wrapper speciali C++ che contengono il `path`.
    - `addClip()`: Aggiunge la clip allo store (solo dati). React renderizza la card. **OK**.
    - `loadClip(clip, file)`: Avvia il caricamento audio.
4.  **Bivio del Caricamento**:
    - **Caso A (BufferPlayer)**: Chiama `file.arrayBuffer()`.
        - Questo forza Electron a leggere l'intero file dal disco e caricarlo nella memoria V8 (JS Heap).
        - Poi chiama `ctx.decodeAudioData()`. Questa funzione opera su un thread separato, MA...
        - **Punto di Rottura**: Se il file è grande o se c'è un problema di permessi di lettura sul filesystem nativo (che l'oggetto File di Electron cerca di astrarre), il tentativo di allocare quel buffer o passarlo al decoder nativo può causare un **Segfault** immediato.
    - **Caso B (StreamPlayer)**: Chiama `URL.createObjectURL(file)`.
        - Crea un blob pointer interno. Assegna a `audio.src`.
        - **Punto di Rottura**: Electron (in modalità `contextIsolation: true` + `sandbox: false`) ha avuto storicamente bug critici nel gestire `blob:` URL generati da oggetti `File` nativi trascinati, specialmente se il Garbage Collector elimina il riferimento al File originale troppo presto, portando a una dereferenziazione di puntatore nullo lato C++.

## 3. La Causa Radice (Diagnosi)
Il crash è causato dall'approccio "Web-Like" in un contesto Desktop.
Trattare i file locali come `Blob` in memoria (come farebbe un sito web per un upload) è fragile in Electron per i file multimediali, perché:
1.  **Pressione sulla Memoria**: Caricare file audio come ArrayBuffer satura l'heap del renderer velocemente.
2.  **Instabilità Blob**: L'uso di ObjectURL su file nativi è instabile nelle build di produzione packed (ASAR) o con certe policy di sicurezza.

## 4. Soluzione Definitiva Proposta: "Protocollo Main-Process"
Dobbiamo smettere di leggere i file nel Renderer. Il Renderer deve solo chiedere al Main Process di servirgli il file.

**La Strategia (Architettura Solida):**
1.  **Main Process**: Registra un protocollo personalizzato sicuro `media://`.
    - Esempio: Il Renderer chiede `media://C:/Music/song.mp3`.
    - Il Main Process (Node.js) legge il file in stream e lo serve con i corretti header MIME.
2.  **Renderer**:
    - Al Drop, estrae solo il **Path** (gestito via IPC, non accesso diretto property).
    - Assegna `src="media://path/to/file"`.
    - Non carica mai il file in RAM. Lascia che sia il motore audio di Chromium a fare lo streaming dal protocollo custom.

Questa soluzione:
- **Zero Crash Memory**: Il file non entra mai nel JS Heap.
- **Sicurezza Totale**: Il Renderer non tocca il FileSystem.
- **Performance**: Streaming nativo ottimizzato da Chromium.

## Piano di Azione
1.  Cancellare la logica `BufferPlayer` basata su `File` object.
2.  Implementare `protocol.handle('media')` in `src/main/index.ts`.
3.  Modificare `toFileUrl` per generare url `media://`.
4.  Esporre una funzione via `preload` per ottenere il path assoluto di un file droppato (unica parte "tricky" in quanto l'oggetto File standard ha `.path` vuoto se security è alta, ma Electron fornisce `Electron.File` che va gestito nel preload).
