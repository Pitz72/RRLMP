# Revisione del codice — 2026-10-28

**Versione revisionata:** 1.15.34 (HEAD `95231a1`, master)
**Baseline prima della revisione:** `tsc --noEmit` 0 errori × 4 progetti (renderer/main/preload/node) · Vitest **246/246**.
**Vincolo dell'operatore:** nessuna nuova funzione; solo comprensione del software e correzione delle criticità.

## Che cos'è il programma e come si usa

Runtime Live Machine Pro è una **regia audio per show condotti da una persona**: podcast, eventi, web radio. Applicazione desktop Electron (processo main in Node, interfaccia React, motore audio Web Audio nel renderer, FFmpeg nel main per le analisi). Niente automazione 24 ore: l'unica parte automatica è la rotazione della colonna PRE-SHOW.

L'operatore lavora su una **board a colonne** (SHOW ASSETS, JINGLE, PROMO, CANZONI, VOCI, PRE-SHOW) più un **pad FX 5×5**. Ogni colonna ha regole proprie di mix: la sigla prende il comando e ferma tutto (take-over), la voce abbassa la musica (ducking), i sottofondi in loop si abbassano sotto jingle e brani, gli FX suonano in polifonia. Si lancia con clic, tasti assegnati, F1…Fn, controller MIDI o tablet in rete locale (PIN). Intorno: master chain (filtro, Glue multibanda, limiter), Smart Mic (ducking dal microfono), registrazione della sessione, playout log, Automix con aggancio dei BPM, esportazione del progetto con archivio `audio/` portabile, aggiornamenti automatici da GitHub.

## Metodo

Lettura integrale di `main/index.ts`, `useAudioStore.ts`, `useProjectStore.ts`, `StreamPlayer.ts`, `AudioContextManager.ts`, `MicManager.ts`, `MidiManager.ts`, `AudioRecorder.ts`, `useRecordingStore.ts`, `App.tsx`, `GlobalControls.tsx`, `MainGrid.tsx`, `ClipCard.tsx`, `RemoteControlServer.ts`, `updateManager.ts`, `AudioProcessor.ts`, preload e componenti collegati. Le ipotesi sul comportamento di Electron sono state **verificate con uno script Electron isolato** (stesso binario 28.3.3 del progetto, finestra nascosta, nessun contatto con l'app installata):

| Domanda | Esito sulla 1.15.34 | Dopo la correzione |
|---|---|---|
| Esiste un menu dell'app? | Sì, quello di serie: File, Edit, View, Window, Help | Nessuno |
| Ctrl+R ricarica la pagina? | **Sì** (`did-start-loading`, variabili di pagina azzerate) | No, nemmeno Ctrl+Shift+R |
| `navigator.requestMIDIAccess()` | **`SecurityError`**, permesso `midi` negato | OK (1 ingresso visto); SysEx ancora negato |
| IPC di un buffer da 300 MB (registrazione lunga) | OK | — (nessun intervento) |

Le correzioni del renderer sono state provate anche nell'anteprima Vite: render delle card misurati, avviso di clip non riproducibile, Ctrl+tasto che non lancia più la clip.

**Esito:** 1 gravissima · 4 gravi · 4 medie · 10 lievi. **Tutte corrette nella 1.15.35.**
**Baseline finale:** tsc 0 errori × 4 · Vitest **265/265** (+19) · `vite build` completata.

---

## GRAVISSIMA

### GV1 — Ctrl+R ricarica l'interfaccia in diretta
**File:** `src/main/index.ts` (nessuna chiamata a `Menu.setApplicationMenu`) → corretto a `index.ts:1380`

Senza un menu dell'app, Electron monta quello di serie. `autoHideMenuBar` lo nasconde ma **non ne spegne le scorciatoie**. Ctrl+R e Ctrl+Shift+R ricaricano il renderer: AudioContext distrutto (silenzio), progetto non salvato perso (con progetto "pulito" la ricarica avviene senza domande), microfono disarmato, registrazione in RAM persa, ritorno alla schermata di benvenuto. Restavano attivi anche Ctrl+Shift+I e lo zoom.
Ctrl+R è un riflesso comune ("aggiorna") quando qualcosa sembra bloccato: probabilità non trascurabile, costo massimo.

**Correzione:** nelle build installate `Menu.setApplicationMenu(null)` su Windows/Linux; su macOS menu minimo (app, Modifica, Finestra) perché senza il menu Modifica Cmd+C/V nei campi di testo non funzionano. In sviluppo il menu di serie resta.

---

## GRAVI

### G1 — MIDI hardware sempre negato dalla 0.17.0
**File:** `src/main/index.ts:1412` (gestore `setPermissionRequestHandler`)

Il gestore approva `media` (microfono) e `clipboard-sanitized-write`, nega tutto il resto. Electron gli chiede anche il permesso `midi`: `requestMIDIAccess()` falliva con `SecurityError`. MIDI Learn, lanci da controller, velocity e comandi globali (STOP ALL, master) non funzionavano con un controller reale. Il Simulatore MIDI chiama `simulateMessage` senza passare dal browser e mascherava il difetto; il "pallino rosso MIDI sempre acceso" rimosso nella 1.15.9 era il sintomo.
**Correzione:** `midi` concesso, `midiSysex` resta negato.

### G2 — Registrazione persa chiudendo o aggiornando
**File:** `src/renderer/src/App.tsx:46` (`confirmExitWithRecording`), usata da `handleCloseIntent` e `confirmSaveBeforeUpdate`

La registrazione vive in RAM (`AudioRecorder.chunks`) fino allo stop, poi in `%TEMP%` fino all'export. La chiusura controllava solo `isDirty`: con progetto salvato la X chiudeva subito; "Riavvia e installa" distrugge le finestre. In entrambi i casi la registrazione dello show andava persa senza avviso.
**Correzione:** conferma se la registrazione è in corso o non ancora esportata, prima del controllo sul progetto.

### G3 — L'export sovrascriveva i file già archiviati
**File:** `src/main/index.ts:636` + nuovo modulo puro `src/main/archivePlan.ts`

I nomi in `audio/` venivano assegnati in ordine di scaletta senza sapere quali file erano già archiviati. Scenario: clip A già archiviata (`audio/intro.mp3`, originale cancellato come l'export consente dalla 1.15.9); l'operatore aggiunge C con lo stesso nome file, in una colonna precedente. All'export C prende `intro.mp3` e **sovrascrive la copia di A**; poi A viene "copiata" da quel file in `intro_1.mp3`. L'audio di A è perso e due clip suonano lo stesso brano. Con dimensioni uguali la copia veniva invece saltata e C puntava all'audio di A.
**Correzione:** piano dei nomi in due passate — prima si riservano i file già nell'archivio, poi si assegnano i nomi liberi; una stessa sorgente riceve un solo nome. 11 test (`archivePlan.test.ts`), Windows e POSIX.

### G4 — Una clip non decodificabile interrompeva la catena, in silenzio
**File:** `src/renderer/src/store/useAudioStore.ts:1228` (catch di `playClip`)

Se `load()` falliva (formato che Chromium non decodifica — `.wma` è accettato al drop perché FFmpeg lo analizza — o file rovinato):
1. nelle catene `play_next` (PRE-SHOW, scalette) la clip precedente era già stata fermata/sfumata e non si avanzava: **dead air**;
2. nessun avviso, solo una riga nel Debug Overlay;
3. il run-ID restava registrato: il clic successivo sulla clip veniva preso per "annulla il caricamento" e ignorato.

**Correzione:** run-ID liberato; avviso con il nome della clip; per i lanci della macchina (non per i clic, non per gli inserti che hanno il loro recupero) avanzamento alla clip successiva con la stessa regola già usata per gli errori a riproduzione in corso. Nessuna azione se nel frattempo è arrivato STOP ALL. 4 test (`playClipFailure.test.ts`), che falliscono sul codice della 1.15.34.

---

## MEDIE

### M1 — JINGLE e PROMO senza durata
**File:** `useAudioStore.ts:1295` (`loadClip`) e `:1139` (riparazione in `playClip`)

`loadClip` scriveva su `col-${type}`, con `asset` → `col-assets`: per JINGLE e PROMO (anche loro di tipo `asset`) la scrittura andava a vuoto. In onda il banner mostrava −00:00 rosso lampeggiante per tutto il jingle, la card 00:00, i controlli di coerenza trim/outro erano disattivati.
**Correzione:** colonna reale via `getColumnForClip`; le clip già esistenti si riparano al primo play (scrittura di runtime, il progetto non diventa "da salvare"). 2 test.

### M2 — Doppio clic su un `.lmp` durante la diretta
**File:** `App.tsx:142`

La protezione NEW-GR-02 scattava solo con modifiche non salvate. Dalla 1.15.18 il progetto in regia è quasi sempre "pulito": un `.lmp` aperto da Esplora risorse (o passato a una seconda istanza) fermava tutto senza domande.
**Correzione:** con audio in onda si chiede sempre conferma.

### M3 — Ctrl/Alt + tasto lanciava anche la clip
**File:** `MainGrid.tsx:131`

I keybind registrano solo `e.code` e il confronto ignorava i modificatori: Ctrl+Z (annulla) lanciava anche il jingle su Z, Ctrl+Y quello su Y, Ctrl+Shift+D quello su D, Alt+F4 la colonna di F4.
**Correzione:** con Ctrl, Alt o Cmd premuti non si lanciano clip né colonne, salvo che il tasto premuto sia esso stesso un modificatore (bind su Ctrl destro).

### M4 — Ridisegno continuo di tutta la board in riproduzione
**File:** `ClipCard.tsx:46`, `MainGrid.tsx:88-96`, `GlobalControls.tsx:47,59`

Lo store audio cambia 10 volte al secondo (progresso). Ogni `ClipCard` era abbonata all'intera mappa `activeClips` (solo per il badge UP NEXT), `MainGrid` usava un selettore a oggetto (nuovo a ogni giro) e la mappa intera, `GlobalControls` l'intero store. **Misurato nell'anteprima con 14 card e un brano simulato: 560 render in 2 s prima, 40 dopo** (solo la card in onda). Con 100 clip il rapporto è 100 a 1. In più lo stato al tablet veniva ripubblicato via IPC e WebSocket 10 volte al secondo.
**Correzione:** selettori mirati (booleano per UP NEXT, conteggio per il badge FX, chiave stabile degli ID in onda per il remoto).

---

## LIEVI

| # | File | Difetto | Correzione |
|---|---|---|---|
| L1 | `GlobalControls.tsx:239`, `KeymappingModal.tsx:62` | Learn MIDI dei comandi globali e della finestra Tastiera/MIDI solo dal canale 1 (`command === 144/176`), mentre il lancio accetta tutti i canali | Mascheramento `& 0xf0` |
| L2 | `useAudioStore.ts:396` | Due preload in volo: il primo player restava orfano (elemento `<audio>` e nodi mai rilasciati); uno scarto arrivato durante il caricamento era ignorato | Numero di sequenza: il preload superato si libera |
| L3 | `GlobalControls.tsx:338` | ARM fallito (microfono assente, accesso negato) solo in console | Avviso con il motivo |
| L4 | `FxPadOverlay.tsx:166` | Messaggi di «Ripristina» in italiano fisso | Chiavi i18n IT/EN |
| L5 | `index.ts:823` | Canali `start-recording` / `append-record-chunk` / `stop-recording` non esposti dal preload: codice non attivo, su cui la 1.15.21 aveva aperto una "verifica sul campo" che non può avvenire | Commento esplicito; roadmap corretta |
| L6 | `index.ts:493` | Le due vie di apertura `.lmp` duplicavano il controllo dei file mancanti con regole diverse e senza controllo di struttura: una colonna senza `clips` → TypeError → "file corrotto" | Funzione unica `markMissingClips`, tollerante; il validatore del renderer spiega l'errore |
| L7 | `index.ts:340` | `check-files-exist` senza validazione dell'input | Solo stringhe, mai eccezioni |
| L8 | `index.ts:777` | `save-project-silent` scriveva `<qualunque>.bak` senza la validazione di `save-project-direct`; con `.lmp` spostato la rotazione degli autosave non scattava (accumulo senza limite) | Validazione + rotazione legata alla cartella effettiva |
| L9 | `index.ts:247` | Nessuna guardia `will-navigate` (difesa in profondità) | Navigazione verso altre pagine bloccata in produzione |
| L10 | `RemoteControlServer.ts:131` | `isAllowedWsOrigin` controllava solo la porta: `http://sito-esterno:8787` passava | Confronto Origin/Host quando l'Host è presente; 2 test |

---

## Limiti noti, non toccati (decisione motivata)

- **Formati non riproducibili accettati al drop** (`.wma`, `.m4a` ALAC, WAV non PCM): FFmpeg li analizza, Chromium non li riproduce. Toglierli dall'elenco sarebbe un cambio di comportamento; con G4 l'errore ora è visibile e non blocca la catena. Consiglio operativo: convertirli in MP3/FLAC.
- **Registrazione in RAM**: un crash del renderer la perde ancora. Il passaggio alla scrittura progressiva su disco (i canali main esistono già, vedi L5) è un cambio di architettura da fare in una sessione dedicata. L'IPC del buffer allo stop regge (300 MB verificati).
- **ColumnHeader e NoteBoard** restano abbonati alla mappa `activeClips`: 7 componenti leggeri, impatto trascurabile rispetto alle card.

## Verifiche sul campo (non riproducibili in test)

1. Ctrl+R / Ctrl+Shift+R / Ctrl+Shift+I nell'**exe installato**: non devono fare nulla.
2. Controller MIDI reale: MIDI Learn su una clip, lancio, STOP ALL da controller.
3. Chiusura con REC acceso e con registrazione fermata ma non esportata: deve chiedere conferma.
4. Export con due file omonimi da cartelle diverse, uno già archiviato.
5. Una clip `.wma` in PRE-SHOW tra due brani: avviso e passaggio al brano successivo.
