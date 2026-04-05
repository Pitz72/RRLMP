# RRLMP — Roadmap & Issue Backlog

Generato il: 2026-04-05  
Aggiornato il: 2026-04-05 (integrazione analisi indipendente — +12 criticità)  
Versione corrente: vedere package.json  
Analisi condotta su: tutto il sorgente in `src/`, `package.json`, file di configurazione

---

## Indice

- [Criticità Gravissime](#-criticità-gravissime)
- [Criticità Gravi](#-criticità-gravi)
- [Criticità Medie](#-criticità-medie)
- [Criticità Lievi](#-criticità-lievi)
- [Priorità di Intervento](#priorità-di-intervento)

---

## 🔴 Criticità Gravissime

Problemi che possono causare perdita di dati, crash in produzione, buchi di sicurezza o comportamenti audio errati durante un broadcast live. Devono essere risolti prima di qualsiasi rilascio in produzione.

---

### ~~G1 — `webSecurity: false` nel processo principale~~ ✅ RISOLTO in v0.9.13

**File**: `src/main/index.ts`  
**Impatto**: Sicurezza  
**Stima**: ~2h

**Descrizione**:  
La finestra Electron è istanziata con `webSecurity: false`, il che disabilita completamente la Content Security Policy (CSP), i controlli CORS e l'isolamento delle origini. In combinazione con l'accesso al file system locale, questa configurazione espone l'applicazione a:

- Lettura arbitraria di file locali da parte di codice renderer non autorizzato.
- Attacchi XSS se mai venisse caricato contenuto esterno.
- Bypass di tutte le policy di sicurezza del browser integrato Chromium.

**Causa**: Probabilmente necessario in origine per permettere la riproduzione di file locali tramite `file://`. La soluzione definitiva è già presente nel progetto (protocollo `media://`), rendendo `webSecurity: false` non più necessario.

**Fix proposto**:

1. Impostare `webSecurity: true`.
2. Assicurarsi che tutti i file audio vengano serviti esclusivamente tramite il protocollo `media://` già implementato.
3. Aggiungere un CSP header esplicito (vedere anche G6).

---

### ~~G2 — Memory leak: nodi Web Audio API mai disconnessi~~ ✅ RISOLTO in v0.9.11

**File**: `src/renderer/src/engine/StreamPlayer.ts`  
**Impatto**: Stabilità, performance su sessioni lunghe  
**Stima**: ~30min

**Descrizione**:  
Ogni istanza di `StreamPlayer` crea nodi Web Audio (`createMediaElementSource`, nodi gain, nodi di fade) che vengono connessi all'audio graph. Quando il player viene distrutto o rimpiazzato da un nuovo clip, questi nodi **non vengono mai disconnessi** con `.disconnect()`.

In una sessione broadcast di ore con decine di clip switchati, l'audio graph cresce indefinitamente in memoria causando:

- Degrado progressivo delle performance.
- Potenziale crash del renderer dopo molte ore di uso.
- Comportamenti imprevisti dell'audio graph (nodi zombie ancora attivi).

**Fix proposto**:  

```typescript
cleanup(): void {
    this.stop();
    if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
    }
    if (this.volumeGainNode) {
        this.volumeGainNode.disconnect();
    }
    if (this.fadeGainNode) {
        this.fadeGainNode.disconnect();
    }
    this.audioElement.src = '';
    this.audioElement.load();
}
```

Chiamare `cleanup()` in `useAudioStore` prima di riassegnare il player di un clip.

---

### ~~G3 — Race condition: clip loading asincrono senza cancellazione~~ ✅ RISOLTO in v0.9.11

**File**: `src/renderer/src/store/useAudioStore.ts` — funzione `playClip`  
**Impatto**: Audio errato durante broadcast live  
**Stima**: ~1.5h

**Descrizione**:  
La funzione `playClip` esegue `await player.load(freshClip.path)` prima di chiamare `player.play()`. Se l'operatore switcha clip rapidamente (scenario comune in broadcast), il `load()` della clip precedente può risolvere **dopo** che quella nuova è già stata selezionata, causando:

- Avvio accidentale di una clip sbagliata.
- Stato interno del store non allineato con la riproduzione effettiva.
- Bug difficili da riprodurre e diagnosticare.

**Fix proposto**:  

```typescript
let currentPlayGeneration = 0;

async function playClip(clipId: string) {
    const generation = ++currentPlayGeneration;
    const player = new StreamPlayer();
    await player.load(clip.path);
    if (generation !== currentPlayGeneration) {
        player.cleanup(); // operazione obsoleta, scartare
        return;
    }
    player.play();
}
```

In alternativa, usare `AbortController` se il loading diventa basato su `fetch`.

---

### ~~G4 — Bug critico: volume delle clip non ripristinato dopo stacco~~ ✅ RISOLTO in v0.9.10

**File**: `src/renderer/src/store/useAudioStore.ts` — funzione `evaluateMix`  
**Impatto**: Perdita audio silente durante broadcast  
**Stima**: ~1h

**Descrizione**:  
La logica "stacco" (jingle con comportamento di soppressione) porta a volume 0 le clip degli altri bus mentre lo stacco è attivo. Il dizionario `suppressedClips` traccia le clip soppresse, ma quando lo stacco termina, `evaluateMix` **non viene richiamata** per ripristinare i volumi originali.

Risultato pratico: dopo un jingle, la musica di sottofondo rimane silenziata. L'operatore deve manualmente re-avviare le clip per sentirle di nuovo — comportamento inaccettabile in un contesto broadcast live.

**Fix proposto**:  
Nell'handler di fine riproduzione dello stacco (evento `onended` del relativo `StreamPlayer`), chiamare esplicitamente `evaluateMix()` con lo stato aggiornato che non include più lo stacco attivo. Verificare che `suppressedClips` venga svuotato correttamente prima della rivalutazione.

---

### ~~G5 — Trim start/end calcolato ma non salvato~~ ✅ RISOLTO in v0.9.9

**File**: `src/renderer/src/components/modals/ClipSettingsModal.tsx`  
**Impatto**: Funzionalità completamente non funzionante  
**Stima**: ~15min

**Descrizione**:  
Il modal `ClipSettingsModal` gestisce i valori `trimStart` e `trimEnd` nello stato locale React (`useState`) e include persino una funzione `detectSilence` che calcola automaticamente i punti di trim. Tuttavia, al momento del salvataggio, l'oggetto `updatedClip` non include questi campi:

```typescript
// MANCANTE nell'updatedClip:
// trimStart: Number(trimStart),
// trimEnd: Number(trimEnd),
```

La logica di trim è invece correttamente implementata in `StreamPlayer.ts` (linee 50-62), ma non riceve mai valori aggiornati. L'intera funzionalità di trim — incluso il rilevamento automatico del silenzio — è quindi inutilizzata.

**Fix proposto**:  
Aggiungere i campi mancanti all'oggetto `updatedClip` nel handler di salvataggio del modal:

```typescript
const updatedClip = {
    ...clip,
    // ... altri campi esistenti ...
    trimStart: Number(trimStart),
    trimEnd: Number(trimEnd),
};
```

---

### ~~G6 — `pathUtils.ts` usa `file:///` — blocca la risoluzione di G1~~ ✅ RISOLTO in v0.9.13

**File**: `src/renderer/src/utils/pathUtils.ts`  
**Impatto**: Sicurezza, Architettura — dipendenza diretta da `webSecurity: false`  
**Stima**: ~3h (incluso test su tutti i formati audio)

**Descrizione**:  
La funzione `toFileUrl()`, usata da `StreamPlayer.load()` per caricare OGNI file audio, genera URL `file:///...` invece di `media://...`. Il commento nel file dice esplicitamente _"requires webSecurity: false in Main"_.

Il protocollo `media://` implementato nel main process (con supporto Range Request, streaming e gestione corretta dei path) **non viene mai usato dal player audio principale**.

Questo significa che:

- Attivare `webSecurity: true` (G1) **romperebbe TUTTA la riproduzione audio**.
- La stima nella roadmap per G1+GR6 (2h) è **gravemente sottostimata**: servono almeno 4-5h includendo test.

**Fix proposto**:

```typescript
// pathUtils.ts
export const toFileUrl = (filePath: string): string => {
    const normalized = filePath.replace(/\\/g, '/');
    return `media://${normalized}`;
};
```

Più testing completo di seeking, trim, fade su tutti i formati (mp3, wav, ogg, m4a, aac, flac).

---

### ~~G7 — `onEnded` callback usa closure stale (Stale Closure Bug)~~ ✅ RISOLTO in v0.9.10

**File**: `src/renderer/src/store/useAudioStore.ts` — funzione `playClip`, linee 236-251  
**Impatto**: Audio errato, Sequencer rotto, potenziale loop infinito  
**Stima**: ~30min

**Descrizione**:  
Il callback `player.onEnded()` cattura `freshClip` per closure e usa `currentStore.stopClip` ottenuto a inizio funzione (`const currentStore = get()` alla linea 155). Zustand `get()` a inizio funzione restituisce lo stato al momento della chiamata, non al momento in cui il clip finisce (che può essere minuti dopo).

Questo può causare:

- Rimozione di clip errate se lo stato è cambiato nel frattempo.
- `stopClip` che non trova più la clip perché è stata già rimossa.
- La stessa issue esiste alla linea 171 dove `preShowClips.forEach` usa lo store catturato all'inizio.

**Fix proposto**:  
Sostituire `currentStore.stopClip(...)` con `get().stopClip(...)` nei callback che si eseguono in momenti futuri.

---

### ~~G8 — `setInterval` globale leakato e incondizionato~~ ✅ RISOLTO in v0.9.10

**File**: `src/renderer/src/store/useAudioStore.ts` — linee 146-148  
**Impatto**: Performance, CPU burn costante  
**Stima**: ~30min

**Descrizione**:  
Un `setInterval` da 100ms viene avviato nella factory function dello store Zustand. Questo interval:

- **Non viene mai cancellato** (nessun cleanup `clearInterval`).
- Chiama `_syncProgress()` ogni 100ms, che a sua volta chiama `set()` sullo store, causando **10 re-render al secondo** di TUTTI i componenti che usano `useAudioStore`, anche quando non c'è niente in riproduzione.
- In una sessione di 8h = ~288.000 chiamate inutili a `set()`.

**Fix proposto**:

```typescript
// Usare requestAnimationFrame condizionale
const syncLoop = () => {
    const { activeClips } = useAudioStore.getState();
    if (Object.keys(activeClips).length > 0) {
        useAudioStore.getState()._syncProgress();
    }
    requestAnimationFrame(syncLoop);
};
requestAnimationFrame(syncLoop);
```

---

## 🟠 Criticità Gravi

Problemi che compromettono la robustezza, la correttezza tecnica o creano debito tecnico significativo. Non causano necessariamente crash immediati ma degradano la qualità del software in modo rilevante.

---

### ~~GR1 — Sistema di ducking duplicato: DuckingManager mai usato~~ ✅ RISOLTO in v0.9.12

**File**: `src/renderer/src/engine/DuckingManager.ts`  
**Impatto**: Debito tecnico, confusione architetturale  
**Stima**: ~1h

**Descrizione**:  
Esiste una classe `DuckingManager` dedicata alla gestione del ducking audio. Tuttavia, tutta la logica di ducking è stata reimplementata nella funzione `evaluateMix` in `useAudioStore.ts`, che è quella effettivamente in uso. `DuckingManager` viene istanziato ma i suoi metodi non vengono mai chiamati.

Questo crea:

- Codice morto che induce i developer a pensare che il ducking sia gestito lì.
- Rischio di modifiche future al modulo sbagliato.
- Massa di codice da mantenere senza valore.

**Fix proposto**:  
Eliminare completamente `DuckingManager.ts` e tutti i riferimenti all'istanza nel codebase.

---

### GR2 — Topologia audio graph potenzialmente errata

**File**: `src/renderer/src/engine/AudioContextManager.ts`  
**Impatto**: Correttezza del routing audio  
**Stima**: ~30min

**Descrizione**:  
Il `masterGain` viene connesso sia direttamente a `context.destination` che a uno `splitter` (usato per gli analyser del VU meter). L'ordine e la struttura delle connessioni può creare ambiguità nel routing: i segnali potrebbero essere sommati due volte o l'analyser potrebbe non vedere il segnale corretto.

**Fix proposto**:  
Verificare e documentare esplicitamente il grafo:

```text
Bus (Music/Voice/SFX/Assets) → masterGain → ChannelSplitter → AnalyserL, AnalyserR
                                           ↘ destination
```

Assicurarsi che le connessioni nel codice rispecchino esattamente questo schema.

---

### ~~GR3 — Disconnessione dispositivo audio silente~~ ✅ RISOLTO in v0.9.15

**File**: `src/renderer/src/engine/StreamPlayer.ts`  
**Impatto**: Perdita audio non notificata durante broadcast  
**Stima**: ~1h

**Descrizione**:  
Quando il dispositivo audio selezionato si disconnette (es. scheda audio USB staccata accidentalmente), l'errore di `setSinkId()` viene gestito solo con `console.warn()`. L'operatore non riceve alcuna notifica visiva e l'audio semplicemente smette di funzionare.

**Fix proposto**:

1. Emettere un evento verso `useAudioStore` o `useDebugStore` con la notifica dell'errore.
2. Tentare il fallback automatico al dispositivo di sistema (`deviceId = 'default'`).
3. Mostrare un toast o un warning visibile nella UI.

---

### GR4 — Type safety perforata: 42+ usi di `any` e `@ts-ignore`

**File**: Vari (useAudioStore, useProjectStore, StreamPlayer, main/index.ts)  
**Impatto**: Manutenibilità, risk di bug silenziosi  
**Stima**: ~2h

**Descrizione**:  
Il codebase contiene numerosi usi di `any` espliciti e direttive `@ts-ignore` che disabilitano localmente il type checker. Esempi:

- Import di moduli Electron tramite `require()` invece di `import type`.
- Cast a `any` per aggirare tipi incompatibili nei gestori di eventi.
- `@ts-ignore` per API Web non completamente tipizzate (es. `setSinkId`).

Ogni `@ts-ignore` è una potenziale bomba a orologeria per refactoring futuri.

**Fix proposto**:  

- Sostituire `require()` con import tipizzati dove possibile.
- Per API non tipizzate come `setSinkId`, aggiungere una dichiarazione `declare` locale piuttosto che ignorare l'errore.
- Introdurre una regola ESLint `@typescript-eslint/no-explicit-any` con `warn`.

---

### ~~GR5 — Dispositivo audio non ripristinato all'avvio~~ ✅ RISOLTO in v0.9.15

**File**: `src/renderer/src/store/useSettingsStore.ts`, `src/renderer/src/App.tsx`  
**Impatto**: UX, perdita configurazione al riavvio  
**Stima**: ~1h

**Descrizione**:  
`useSettingsStore` usa il middleware `persist` di Zustand per salvare `outputDeviceId` in `localStorage`. Tuttavia, all'avvio dell'applicazione, nessun codice in `App.tsx` o altrove legge questo valore e lo applica ai player attivi o al context audio.

**Nota dall'analisi indipendente**: `StreamPlayer` nel costruttore legge `useSettingsStore.getState().outputDeviceId` e chiama `setOutputDevice()`. Questo significa che il device viene ripristinato per ogni nuovo player creato. Tuttavia, al riavvio non esistono player attivi, quindi il fix rimane valido per garantire che il context audio globale usi il device corretto.

**Fix proposto**:  
In `App.tsx`, nell'`useEffect` di inizializzazione, leggere `outputDeviceId` da `useSettingsStore` e chiamare `updateOutputDevice(deviceId)` su `useAudioStore`.

---

### ~~GR6 — Nessun CSP header nelle risposte Electron~~ ✅ RISOLTO in v0.9.13

**File**: `src/main/index.ts`  
**Impatto**: Sicurezza  
**Stima**: ~30min

**Descrizione**:  
L'applicazione Electron non configura alcun `Content-Security-Policy` header. In assenza di CSP, il renderer può eseguire script inline, caricare risorse da origini arbitrarie e compiere azioni che una policy restrittiva impedirebbe.

**Fix proposto**:

```typescript
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
        responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
                "default-src 'self'; media-src 'self' media:; script-src 'self'; style-src 'self' 'unsafe-inline';"
            ]
        }
    });
});
```

---

### ~~GR7 — Doppia dichiarazione `Window.electron` in conflitto~~ ✅ RISOLTO in v0.9.9

**File**: `src/renderer/src/env.d.ts` + `src/renderer/src/types/index.ts`  
**Impatto**: Type safety, confusione API, potenziali bug silenziosi  
**Stima**: ~15min

**Descrizione**:  
L'interfaccia `Window.electron` è dichiarata in **due file diversi** con firme **diverse**:

- `env.d.ts` include `ipcRenderer.send/on/invoke` (accesso raw) + API di persistenza.
- `types/index.ts` include i metodi corretti (`getFilePath`, `onCheckCloseIntent`, `showCloseDialog`, `forceClose`).

Le due dichiarazioni si fondono nel tipo globale, ma `env.d.ts` **espone `ipcRenderer` raw** che non esiste nel preload reale (che non lo espone), creando un falso senso di sicurezza — `window.electron.ipcRenderer.send()` compilerebbe ma crasherebbe a runtime.

**Fix proposto**:  
Eliminare la dichiarazione ripetuta in `env.d.ts`, mantenere solo quella in `types/index.ts`.

---

### ~~GR8 — File di preload duplicato e inutilizzato~~ ✅ RISOLTO in v0.9.12

**File**: `src/main/preload.ts`  
**Impatto**: Confusione architetturale, codice morto  
**Stima**: ~5min

**Descrizione**:  
Esistono DUE file preload:

- `src/main/preload.ts` — espone oggetti vuoti `{}` per electron e api.
- `src/preload/index.ts` — il preload REALE con tutte le API.

Il file `src/main/preload.ts` è un residuo che non viene usato (il `webPreferences.preload` punta a `../preload/index.js`).

**Fix proposto**: Eliminare `src/main/preload.ts`.

---

### ~~GR9 — Export: filename duplicati sovrascrivono file silenziosamente~~ ✅ RISOLTO in v0.9.14

**File**: `src/main/index.ts` — funzione `export-project`, linee 162-169  
**Impatto**: Perdita dati silenziosa in export  
**Stima**: ~30min

**Descrizione**:  
I file audio vengono copiati nella cartella `audio/` usando il loro filename originale (`fs.copyFileSync(originalPath, destPath)`). Se due clip in colonne diverse hanno lo stesso filename (es. `intro.mp3`), il secondo file **sovrascrive silenziosamente** il primo. Il path nel progetto esportato punterà allo stesso file, corrompendo il progetto.

**Fix proposto**:

```typescript
let destFileName = fileName;
let counter = 1;
while (fs.existsSync(join(audioDir, destFileName))) {
    const ext = fileName.split('.').pop();
    const base = fileName.replace(`.${ext}`, '');
    destFileName = `${base}_${counter++}.${ext}`;
}
```

---

### ~~GR10 — Autosave senza rotazione: riempimento disco su uso prolungato~~ ✅ RISOLTO in v0.9.14

**File**: `src/main/index.ts` — funzione `save-project-silent`, linee 187-207  
**Impatto**: Spazio disco, UX degradata  
**Stima**: ~30min

**Descrizione**:  
Il sistema di autosave crea file con timestamp (`autosave_2026-04-05T...lmp`) ogni 5 minuti. Non c'è alcuna rotazione o pulizia dei vecchi autosave. In una settimana di uso quotidiano (8h/giorno), si accumulano ~672 file nella cartella `autosaves/` di `userData`.

**Fix proposto**:  
Dopo il salvataggio, leggere la cartella autosaves ed eliminare tutti i file tranne gli ultimi N (es. 10), ordinati per data.

---

### GR11 — `BufferPlayer` non implementa `setOutputDevice`

**File**: `src/renderer/src/engine/BufferPlayer.ts`  
**Impatto**: `IAudioPlayer` interface non rispettata, crash potenziale  
**Stima**: ~15min

**Descrizione**:  
L'interfaccia `IAudioPlayer` richiede il metodo `setOutputDevice(deviceId: string)`, ma `BufferPlayer` **non lo implementa**. Se `BufferPlayer` venisse usato in futuro (attualmente solo `StreamPlayer` è in uso), chiamare `updateOutputDevice()` causerebbe un crash a runtime.

**Fix proposto**: Aggiungere un metodo `setOutputDevice` vuoto o implementato in `BufferPlayer`.

---

### ~~GR12 — Nessuna validazione formato file in fase di drop~~ ✅ RISOLTO in v0.9.14

**File**: `src/renderer/src/components/layout/MainGrid.tsx` — linee 130-142  
**Impatto**: UX, potenziale crash  
**Stima**: ~15min

**Descrizione**:  
Il handler `handleNativeDrop` accetta qualsiasi file droppato (immagini, video, PDF, exe...) senza filtrare per estensione audio. Il file viene aggiunto alla colonna e il `loadClip` tenterà di decodificarlo, fallendo silenziosamente.

**Fix proposto**:

```typescript
const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
const audioFiles = files.filter(f => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    return ext && SUPPORTED_EXTENSIONS.includes(ext);
});
```

---

## 🟡 Criticità Medie

Problemi che impattano l'esperienza utente, la consistenza del prodotto o la correttezza in scenari edge case. Non causano crash ma possono creare confusione o comportamenti inaspettati.

---

### ~~M1 — Dialogs di sistema hardcoded in italiano~~ ✅ RISOLTO in v0.9.16

**File**: `src/main/index.ts` (dialogs Electron), `src/renderer/src/App.tsx` (confirm delete)  
**Impatto**: Internazionalizzazione  
**Stima**: ~2h

**Descrizione**:  
Il software supporta 8 lingue tramite i18next, ma i dialogs nativi di sistema (es. "Salva prima di uscire?") usano testo italiano hardcoded:

```typescript
buttons: ['Salva', 'Non Salvare', 'Annulla']
```

Un utente con interfaccia in inglese o tedesco vede dialogs in italiano.

**Fix proposto**:  
Passare le stringhe localizzate dal renderer al main process tramite IPC al momento della chiamata, o configurare un sistema di i18n anche nel main process.

---

### ~~M2 — Fallimento inizializzazione MIDI non notificato~~ ✅ RISOLTO in v0.9.16

**File**: `src/renderer/src/engine/MidiManager.ts`  
**Impatto**: UX, funzionalità MIDI silenziosamente assente  
**Stima**: ~1h

**Descrizione**:  
Se `navigator.requestMIDIAccess()` fallisce (browser/sistema non supporta MIDI, permessi negati), l'errore viene catturato e loggato solo in `console.error`. L'utente non riceve alcun avviso nell'interfaccia e continua a interagire con controlli MIDI non funzionanti.

**Fix proposto**:  
Emettere un messaggio verso `useDebugStore` e mostrare un warning visibile nella UI (es. badge sul tasto "MIDI Learn" o notifica toast).

---

### ~~M3 — MIDI Learn mode senza timeout né feedback di scadenza~~ ✅ RISOLTO in v0.9.16

**File**: `src/renderer/src/components/ui/GlobalControls.tsx`  
**Impatto**: UX  
**Stima**: ~1h

**Descrizione**:  
Quando viene attivata la modalità MIDI Learn, l'applicazione rimane in attesa di input MIDI indefinitamente. Se l'operatore dimentica di premere un tasto MIDI (o il controller non è connesso), l'app rimane bloccata in learn mode con effetti sulle successive interazioni MIDI.

**Fix proposto**:  
Aggiungere un timeout automatico di 10-15 secondi con feedback visivo countdown, o permettere l'uscita dalla modalità tramite `Escape`.

---

### M4 — FFT size eccessivo per VU meter

**File**: `src/renderer/src/engine/AudioContextManager.ts`  
**Impatto**: Performance CPU (minore su hardware moderno)  
**Stima**: ~15min

**Descrizione**:  
Gli analyser per il VU meter stereo sono configurati con `fftSize = 256`. Per un semplice misuratore di livello RMS/peak, un `fftSize` di 32 o 64 è completamente sufficiente e dimezza il lavoro del DSP.

**Fix proposto**:  

```typescript
this.analyserL.fftSize = 64;
this.analyserR.fftSize = 64;
```

---

### M5 — Auto-silence detection: caso degenere non gestito

**File**: `src/renderer/src/components/modals/ClipSettingsModal.tsx` — funzione `detectSilence`  
**Impatto**: Correttezza funzionale  
**Stima**: ~30min

**Descrizione**:  
La funzione `detectSilence` analizza l'audio per trovare punti di trim automatici. Se l'intero file audio è sotto la soglia di silenzio (file corrotto, volume molto basso, o silenzio totale), `suggestedStartCut` e `suggestedEndCut` convergono allo stesso valore, producendo un trim che elimina l'intera clip senza alcun avviso.

**Fix proposto**:  

```typescript
if (suggestedEndCut <= suggestedStartCut + 0.1) {
    alert(t('error.silence_detection_failed'));
    return;
}
```

---

### M6 — Dead-air warning ambiguo con looping + play_next attivi insieme

**File**: `src/renderer/src/components/layout/ColumnHeader.tsx`  
**Impatto**: UX, chiarezza comportamento  
**Stima**: ~30min

**Descrizione**:  
Una clip con sia `isLooping = true` che `nextAction = 'play_next'` ha comportamento ambiguo: il looping viene silenziosamente prioritizzato, il sequencer non avanza. Il dead-air warning viene correttamente disabilitato per le clip in loop, ma l'utente non ha feedback sul fatto che `play_next` venga ignorato.

**Fix proposto**:  
Aggiungere un tooltip o indicatore visivo nel `ClipSettingsModal` che avverta del conflitto quando entrambe le opzioni sono attive simultaneamente.

---

### ~~M7 — `bypassCSP: true` sul protocollo `media://`~~ ✅ RISOLTO in v0.9.13

**File**: `src/main/index.ts` — linea 6  
**Impatto**: Sicurezza  
**Stima**: ~15min

**Descrizione**:  
Il protocollo `media://` è registrato con `bypassCSP: true`. Questo significa che anche implementando GR6 (CSP header), qualsiasi risorsa caricata via `media://` ignorerebbe completamente la policy. Dato che il protocollo accede al filesystem locale senza restrizioni di path, un exploit potrebbe usarlo per leggere file arbitrari aggirando la CSP.

**Fix proposto**:  
Rimuovere `bypassCSP: true` dalla registrazione del protocollo e testare che la CSP consenta esplicitamente `media-src media:`.

---

### ~~M8 — Versione progetto hardcoded e disallineata nella logica di chiusura~~ ✅ RISOLTO in v0.9.9

**File**: `src/renderer/src/App.tsx` — linea 63  
**Impatto**: Correttezza dati  
**Stima**: ~5min

**Descrizione**:  
Nella logica `handleCloseIntent` di `App.tsx`, la versione del progetto è hardcoded a `"0.7.3"`, mentre altrove nel codice si usa `__APP_VERSION__` (che è `0.9.8` da `package.json`). Se l'utente salva il progetto dal dialog di chiusura, il file `.lmp` avrà versione `0.7.3`. Se salva dal pulsante Save nei GlobalControls, avrà `0.9.8`.

**Fix proposto**:  
Sostituire `"0.7.3"` con `__APP_VERSION__`.

---

## 🟢 Criticità Lievi

Problemi di qualità del codice, naming, commenti e piccole inconsistenze che non impattano il funzionamento ma abbassano la manutenibilità.

---

### L1 — Magic numbers senza costanti denominate

**File**: `src/renderer/src/store/useAudioStore.ts` e altri  
**Descrizione**: Valori numerici critici come il fattore di ducking (`0.2` = circa -14dB) sono scritti direttamente nel codice senza una costante con nome. Rende difficile capire il significato e modificare il comportamento in modo coerente.  
**Fix**: Estrarre costanti: `const DUCKING_MUSIC_FACTOR = 0.2; // -14dB approx`

---

### L2 — Error handling inconsistente nel codebase

**File**: Vari  
**Descrizione**: Alcuni errori vengono emessi verso `useDebugStore`, altri solo a `console.error`, altri vengono silenziati completamente. Non esiste una convenzione uniforme.  
**Fix**: Stabilire una policy: tutti gli errori operativi vanno a `useDebugStore.addLog()`, quelli di sviluppo a `console`.

---

### L3 — File `MainLayout.tsx` mai importato

**File**: `src/renderer/src/components/layout/MainLayout.tsx`  
**Descrizione**: Il file esiste nel repository ma non viene importato da nessun componente. È codice morto che aumenta la superficie da mantenere.  
**Fix**: Eliminare il file o verificare se era la vecchia entry point del layout e andrebbe rimosso.

---

### L4 — Commenti insufficienti sull'engine audio

**File**: `src/renderer/src/engine/StreamPlayer.ts`, `src/renderer/src/store/useAudioStore.ts`  
**Descrizione**: Le parti più complesse del codebase — la logica `evaluateMix` con le regole di ducking/stacco e la gestione del ciclo di vita dei nodi in `StreamPlayer` — sono scarsamente commentate. Un nuovo developer non può comprendere le regole di business audio senza studiare l'intero sistema.  
**Fix**: Aggiungere block comments alle funzioni critiche che spieghino il "perché" delle scelte, non il "cosa".

---

### L5 — Interfaccia `AudioClip` senza JSDoc dei valori default

**File**: `src/renderer/src/types/index.ts`  
**Descrizione**: Campi come `fadeIn`, `fadeOut`, `volume`, `trimStart`, `trimEnd` nell'interfaccia `AudioClip` non hanno documentazione sui valori default attesi. Chi crea una clip manualmente (es. nei test) non sa quali valori usare.  
**Fix**: Aggiungere JSDoc inline o un oggetto `DEFAULT_CLIP` esportato con i valori standard.

---

### L6 — Debug store: limite 500 log può causare pressione memoria in sessioni lunghe

**File**: `src/renderer/src/store/useDebugStore.ts`  
**Descrizione**: Il log store mantiene fino a 500 entries in memoria React. In sessioni broadcast di 8+ ore con eventi frequenti (MIDI, VU updates, play/stop), anche 500 oggetti possono accumularsi rapidamente se il limite non viene rispettato o se altri store duplicano il logging.  
**Fix**: Implementare una rotazione FIFO con limite fisso, e considerare di abbassare il cap a 200 entries.

---

### L7 — Codice commentato e commenti residui sparsi

**File**: Vari  
**Descrizione**: Presenza di blocchi di codice commentati e commenti TODO/FIXME non tracciati in tutto il codebase. Abbassa la leggibilità e può mascherare intenzioni non completate.  
**Fix**: Cleanup sistematico; i TODO che identificano lavoro reale vanno convertiti in issue tracciabili.

---

## Priorità di Intervento

Ordine raccomandato basato su impatto/effort:

| # | Issue | Categoria | Stima | Motivo priorità |
| :-: | --- | --- | --- | --- |
| 1 | ~~**G5** — Trim non salvato nel modal~~ ✅ | Gravissima | 15 min | **RISOLTO in v0.9.9** |
| 2 | ~~**M8** — Versione hardcoded `0.7.3` in App.tsx~~ ✅ | Media | 5 min | **RISOLTO in v0.9.9** |
| 3 | ~~**G4** — Stacco non ripristina volume~~ ✅ | Gravissima | 1h | **RISOLTO in v0.9.10** |
| 4 | ~~**G7** — Stale closure su onEnded~~ ✅ | Gravissima | 30 min | **RISOLTO in v0.9.10** |
| 5 | ~~**G8** — setInterval incondizionato~~ ✅ | Gravissima | 30 min | **RISOLTO in v0.9.10** |
| 6 | ~~**G2** — Memory leak StreamPlayer~~ ✅ | Gravissima | 30 min | **RISOLTO in v0.9.11** |
| 7 | ~~**G3** — Race condition clip loading~~ ✅ | Gravissima | 1.5h | **RISOLTO in v0.9.11** |
| 8 | ~~**GR8** — Eliminazione preload duplicato~~ ✅ | Grave | 5 min | **RISOLTO in v0.9.12** |
| 9 | ~~**GR7** — Doppia dichiarazione Window.electron~~ ✅ | Grave | 15 min | **RISOLTO in v0.9.9** |
| 10 | ~~**GR1** — Eliminazione DuckingManager~~ ✅ | Grave | 1h | **RISOLTO in v0.9.12** |
| 11 | ~~**G6 + G1 + GR6 + M7** — `file:///`→`media://` + webSecurity + CSP~~ ✅ | Gravissima + Grave | 5h | **RISOLTO in v0.9.13** |
| 12 | ~~**GR9** — Export file duplicati~~ ✅ | Grave | 30 min | **RISOLTO in v0.9.14** |
| 13 | ~~**GR10** — Autosave senza rotazione~~ ✅ | Grave | 30 min | **RISOLTO in v0.9.14** |
| 14 | ~~**GR12** — Validazione formato file drop~~ ✅ | Grave | 15 min | **RISOLTO in v0.9.14** |
| 15 | ~~**GR5** — Device audio non ripristinato~~ ✅ | Grave | 1h | **RISOLTO in v0.9.15** |
| 16 | ~~**GR3** — Device disconnect silenzioso~~ ✅ | Grave | 1h | **RISOLTO in v0.9.15** |
| 17 | ~~**M1** — Localizzazione dialogs sistema~~ ✅ | Media | 2h | **RISOLTO in v0.9.16** |
| 18 | ~~**M2 + M3** — MIDI notify + timeout~~ ✅ | Media | 1h | **RISOLTO in v0.9.16** |
| 19 | **GR4** — Type safety / any / ts-ignore | Grave | 2h | Manutenibilità long-term |
| 20 | **GR11** — BufferPlayer senza setOutputDevice | Grave | 15 min | Interface compliance |
| 21 | **GR2** — Topologia audio graph | Grave | 30 min | Correttezza audio |
| 22 | **M5** — Auto-silence degenere | Media | 30 min | Edge case correttezza |
| 23 | **L1–L7** — Lievi varie | Lieve | 3h totali | Qualità codice |

---

## Riepilogo Criticità

| Gravità | Quantità | Issue |
| --- | --- | --- |
| 🔴 Gravissime | 8 | G1, G2, G3, G4, G5, G6, G7, G8 |
| 🟠 Gravi | 12 | GR1–GR12 |
| 🟡 Medie | 8 | M1–M8 |
| 🟢 Lievi | 7 | L1–L7 |
| **TOTALE** | **35** | |

**Stima totale per portare il software a qualità production-grade: ~22–26 ore di sviluppo.**

---

_Documento generato da analisi statica manuale del sorgente e integrato con analisi indipendente del 2026-04-05. Aggiornare questo file man mano che le issue vengono risolte._
