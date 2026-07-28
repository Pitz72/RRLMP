# Revisione totale del codice — 2026-07-28

**Versione revisionata:** 1.15.15 (HEAD `4e795c0`, master, sync con origin)
**Baseline verificata prima della revisione:** `tsc --noEmit` 0 errori × 3 progetti (renderer/main/preload) · Vitest **172/172 verdi** · nessuna regressione nota.

**Metodo:** lettura integrale del motore audio (`useAudioStore.ts` 1651 righe), del processo main (`index.ts` 1307 righe), dello store progetto, del server di controllo remoto, di `StreamPlayer`/`AudioContextManager`/`MidiManager`, di `App.tsx` e degli hotkey di `MainGrid`; più `npm audit` sulle dipendenze di produzione. La classificazione usa il criterio della regia: **quanto è probabile che si manifesti in diretta e quanto costa quando accade**.

**Esito sintetico:** 0 gravissime · **4 gravi** · **8 medie** · **10 lievi**.
Il codice è in buono stato: la storia di audit precedenti si vede (guardie su NaN, atomic write, clamp dei Range, whitelist IPC, rate-limiter, run-ID anti-race). I reperti gravi sono tutti su **percorsi già toccati da fix parziali**, dove la protezione è stata messa su una via e non sull'altra.

> ## ✅ STATO: TUTTI I REPERTI SONO STATI CHIUSI (2026-07-28, stessa giornata)
>
> Su richiesta dell'operatore i fix sono stati applicati **uno per versione**, in patch atomiche dalla **1.15.16** alla **1.15.29** — ciascuna con il proprio changelog, la riga in `relazione.md` e un commit isolabile.
>
> | Reperto | Versione | Note |
> |---|---|---|
> | **G1** fade-out annullato | 1.15.16 | +3 test |
> | **G2** pruning export distruttivo | 1.15.17 | marcatore `.rrlmp-archive` |
> | **M4** `isDirty` da scritture runtime | 1.15.18 | +3 test · prerequisito di G3 |
> | **G3** update senza salvataggio | 1.15.19 | gate a tre vie |
> | **G4** percorsi UNC | 1.15.20 | nuovo modulo puro `mediaPath.ts`, +34 test, difetto latente POSIX incluso |
> | **M2** backpressure registrazione | 1.15.21 | |
> | **M3** salvataggio azzera `isMissing` | 1.15.22 | +1 test |
> | **M5+M6** sicurezza controllo remoto | 1.15.23 | +6 test |
> | **M7** trim incoerenti | 1.15.24 | nuovo `validateLmp.test.ts` |
> | **M8** server remoto su porta occupata | 1.15.25 | |
> | **M1** hotkey colonne | 1.15.26 | `playColumn` per ID · F6 = PRE-SHOW |
> | **L1,L2,L3,L5,L6,L7,L8** | 1.15.27 | blocco unico, +3 test |
> | **L4** rimozione `suppressedClips` | 1.15.28 | versione a sé, isolabile |
> | **L10** dipendenze | 1.15.29 | `js-yaml` via override; 2 rinviate con motivazione |
>
> **Baseline finale: typecheck 0 errori × 3 progetti · Vitest 224/224 (era 172, +52) · `vite build` completata.**
>
> Restano **due verifiche sul campo**, non riproducibili in test automatico: la riproduzione da una share di rete reale (1.15.20) e il distacco di un supporto durante una registrazione lunga (1.15.21). Vedi [ROADMAP](../ROADMAP.md).

---

## GRAVISSIME

Nessuna. Non sono stati trovati crash certi, esecuzione di codice arbitrario, né condizioni che producano dead-air garantito.

---

## GRAVI

### G1 — Il fade-out di fine clip viene annullato da qualunque play/stop concorrente
**File:** `src/renderer/src/engine/StreamPlayer.ts:380-408` (`fadeTo`) + `src/renderer/src/store/useAudioStore.ts:144-210` (`evaluateMix`)

`StreamPlayer.setVolume()` è protetto (`if (this.volumeGainNode && !this.fadeOutTriggered)`, riga 269): non tocca il gain mentre una dissolvenza finale è in corso. **`fadeTo()` non ha quella guardia** — e `evaluateMix` usa esclusivamente `fadeTo`. Verificato: `fadeOutTriggered` è letto solo alla riga 269, in tutto il renderer.

`evaluateMix` salta le clip in `fadingClipIds`, ma quel set contiene solo le transizioni orchestrate dallo store (crossfade/segue/automix). La dissolvenza **naturale** armata da `ontimeupdate` (`StreamPlayer.ts:112-119`) non ci finisce mai.

**Scenario di fallimento:** un brano della colonna CANZONI (fadeOut di default 2000 ms) è negli ultimi 2 secondi e sta sfumando. L'operatore lancia un effetto FX, una voce, o ne ferma un'altra → `evaluateMix` gira → per la clip in dissolvenza calcola `targetVolume = clip.volume` e chiama `fadeTo(volume, 500)` (duckingDuration di default) → `cancelScheduledValues` **cancella la rampa verso 0** e il brano **risale al volume pieno** in mezzo secondo, per poi essere tagliato di netto alla fine del file.

Non è un caso di laboratorio: lanciare voce o jingle mentre la musica sfuma è il gesto più normale di una regia.

**Perché i test non lo prendono:** `evaluateMix.test.ts` (20 test) usa player mock senza stato di dissolvenza.

**Fix proposto:** aggiungere `isFadingOut(): boolean` a `IAudioPlayer` (ritorna `fadeOutTriggered`) e in `evaluateMix` saltare quei player come già si fa per `fadingClipIds`. Alternativa più contenuta: guardia dentro `fadeTo` — se `fadeOutTriggered` è attivo e il volume richiesto è superiore al gain corrente, ignorare la richiesta.

---

### G2 — L'export cancella file non suoi nella cartella `audio/`
**File:** `src/main/index.ts:642-658`

Il pruning rimuove con `fs.unlinkSync` **ogni** file presente in `<cartella del .lmp>/audio/` che non compaia fra i nomi di destinazione di quell'export. Non c'è conferma, non c'è marcatore che dichiari la cartella "di proprietà dell'app", non si passa dal cestino.

**Scenario di fallimento:** l'operatore salva `show.lmp` in una cartella che contiene già una sottocartella `audio/` con materiale proprio (archivio, take, materiale di un altro progetto). Al primo "Esporta progetto con audio" tutto ciò che non è referenziato dal progetto corrente **viene eliminato definitivamente**.

Il comportamento è intenzionale e sensato *finché la cartella è stata creata dall'export* — il problema è che non c'è modo di sapere se lo è stata.

**Fix proposto:** scrivere un marcatore (es. `audio/.rrlmp-archive`) alla creazione della cartella e prunare **solo** se il marcatore è presente; se manca, saltare il pruning e segnalarlo nel risultato dell'export. In alternativa, conferma esplicita la prima volta con l'elenco dei file da rimuovere.

---

### G3 — "Riavvia e installa" chiude l'app senza salvare né avvisare
**File:** `src/main/index.ts:959-974` (handler `quit-and-install`)

Il fix v1.15.10 (giusto nel merito: l'app non si chiudeva) distrugge le finestre con `BrowserWindow.destroy()`, che **per progetto** bypassa `close` e `beforeunload`. Nessuno però controlla `isDirty` prima. Il progetto in memoria viene perso senza un prompt.

**Aggravante:** vedi M4 — `updateClip` marca `isDirty` anche per le scritture puramente runtime (analisi silenzio, loudness, BPM, `hasPlayed`), quindi un progetto aperto è quasi sempre "sporco" anche se l'operatore non ha toccato nulla di intenzionale.

**Attenuante:** il popup di aggiornamento è gated sull'on-air (`App.tsx:213-235`), quindi non compare durante la diretta — compare appena finisce, che è però esattamente il momento in cui il progetto della serata è ancora aperto.

**Fix proposto:** nel renderer, prima di `window.electron.quitAndInstall()`, riusare il gate a tre vie di `handleCloseIntent` (Salva / Non salvare / Annulla). In subordine, un salvataggio silenzioso automatico lato main prima di `destroy()`.

---

### G4 — I file su share di rete (UNC) non si riproducono, e la clip sembra sana
**File:** `src/renderer/src/utils/pathUtils.ts:1-15` + `src/main/index.ts:1096-1134`

`toFileUrl('\\\\NAS\\musica\\brano.mp3')` produce `media:////NAS/musica/brano.mp3`. Nel main, `request.url.replace(/^media:\/\/+/, '')` consuma **tutti** gli slash iniziali → resta `NAS/musica/brano.mp3` → dopo la conversione dei separatori `isAbsolute()` è falso → **403 Forbidden**.

**Perché è insidioso:** `fs.existsSync` su un path UNC funziona regolarmente, quindi l'integrity check **non** marca la clip come mancante. In griglia la clip appare perfettamente normale; alla pressione semplicemente non parte.

Il reperto era già stato individuato in un audit precedente (annotato come "rinviato per rischio/costo", giugno 2026) e non è mai stato chiuso. Per una radio che tiene la libreria su un NAS è un intero caso d'uso precluso.

**Fix proposto:** intervento coordinato renderer + main — encoding esplicito dell'host UNC nell'URL e ricostruzione di `\\host\share\...` lato main prima di `normalize`, con `isAbsolute` che accetti la forma UNC. Richiede test su una share reale prima del rilascio.

---

## MEDIE

### M1 — Hotkey F1–F5 su indici assoluti di colonna
**File:** `src/renderer/src/components/layout/MainGrid.tsx:141-147` + `src/renderer/src/store/useAudioStore.ts:1247-1264`

`playColumn(fKey - 1)` indicizza `useProjectStore.getState().columns`, l'array **completo e non filtrato**. Dalla v1.3.21 le colonne sono 7 (assets, jingle, promo, music, voice, sfx, preshow) ma il range è rimasto `1..5`: **PRE-SHOW e SFX non hanno hotkey**, mentre la preferenza "colonne nascoste" (v1.9.8) non rimappa nulla — la corrispondenza fra ciò che si vede e ciò che parte si rompe appena si nasconde una colonna.

In più **F1 lancia la prima clip di SHOW ASSETS**, che dalla v1.4.14 è un *take-over*: ferma tutto tranne gli FX. Un tasto non documentato con l'effetto più massivo dell'applicazione.

**Fix proposto:** far corrispondere le F alle colonne **visibili** (stessa lista filtrata di `MainGrid`) ed estendere il range a quante ne sono mostrate; oppure rimuovere del tutto le F-key, dato che i keybind per-clip coprono già il caso d'uso.

### M2 — La registrazione può appendere l'IPC per sempre in backpressure
**File:** `src/main/index.ts:772-778`

```js
await new Promise<void>((resolve) => { stream.once('drain', resolve); });
```
Nessun handler su `error`/`close` e nessun timeout. Se il disco si riempie o la chiavetta USB viene staccata **mentre il buffer interno è pieno**, l'evento `drain` non arriva mai: l'`invoke` del renderer resta appeso indefinitamente e il chunk successivo non viene mai processato.

**Fix proposto:** `Promise.race` fra `drain`, `error`/`close` e un timeout, con ritorno di `{success:false, error}` così il renderer può fermare la sessione in modo pulito (la logica di stop pulito esiste già, riga 763-765).

### M3 — "Salva con nome" azzera lo stato "file mancante" di tutte le clip
**File:** `src/renderer/src/components/ui/GlobalControls.tsx:417` → `src/renderer/src/store/useProjectStore.ts:472-503`

Dopo un salvataggio con dialog, `handleSaveProject` chiama `loadProject({ columns }, result.filePath, { preserveUiState: true })` per aggiornare `currentFilePath`. Ma `loadProject` forza **`isMissing: false` su ogni clip** (riga 482): un salvataggio fa sparire tutti i badge rossi finché non gira un integrity check. In regia significa vedere "tutto a posto" su clip che non suoneranno.

**Secondo effetto:** `columns` arriva dalla closure del componente. Le scritture runtime completate *durante* il dialog di salvataggio (analisi silenzio, loudness, BPM) vengono sovrascritte dallo snapshot precedente.

**Fix proposto:** introdurre in `useProjectStore` un'azione dedicata `setCurrentFilePath(path)` invece di riusare `loadProject` per un compito che non è un caricamento.

### M4 — `isDirty` inquinato dalle scritture di runtime
**File:** `src/renderer/src/store/useProjectStore.ts:459-469`

`updateClip` imposta sempre `isDirty: true`, anche quando l'aggiornamento è puramente automatico (`silenceCheckedV2`, `loudnessLufs`, `bpm`, `hasPlayed`, `isMissing`, `isAnalyzing`). L'undo è invece pulito (queste vie non passano da `_snapshot`, scelta corretta e documentata), ma il flag di "modifiche non salvate" no.

**Conseguenze:** il prompt di salvataggio alla chiusura compare anche se l'operatore non ha toccato nulla; l'autosave da 5 minuti si attiva sempre; e soprattutto amplifica il rischio di **G3**.

**Fix proposto:** parametro `opts.runtime` su `updateClip` (o una lista di campi "non sporcanti") che salta l'aggiornamento di `isDirty`.

### M5 — Il PIN del controllo remoto viene da `Math.random()`
**File:** `src/main/RemoteControlServer.ts:92-94`

`Math.random()` non è un generatore crittografico e il suo stato è ricostruibile da output osservati. Quel PIN è **l'unica credenziale** del canale che comanda l'audio in onda.

**Fix proposto:** una riga — `crypto.randomInt(100000, 1000000)` da `node:crypto`.

### M6 — WebSocket remoto senza validazione dell'header `Origin`
**File:** `src/main/RemoteControlServer.ts:186-229`

Le connessioni WebSocket non sono soggette alla same-origin policy: una pagina web qualsiasi aperta su un dispositivo della stessa LAN può aprire `ws://<ip-regia>:8787/ws` e tentare l'autenticazione. Il rate-limiter (10 tentativi / 5 min per IP, `pinRateLimiter.ts`) rende il brute-force impraticabile su 900.000 combinazioni, ma il controllo di `Origin` è la difesa standard che qui manca.

**Fix proposto:** in `verifyClient` / all'evento `connection`, rifiutare le connessioni con `Origin` presente e diverso da quello della pagina servita dal server stesso (un client "vero" aperto sulla pagina locale ha `Origin: http://<ip>:8787`).

### M7 — `trimEnd ≥ duration` non è validato
**File:** `src/renderer/src/store/useProjectStore.ts:59-78` + `src/renderer/src/engine/StreamPlayer.ts:80-97`

Il validatore `.lmp` clampa `trimEnd` solo a `min 0`, mentre per `outroMarker` fa già il controllo di coerenza con trim e durata (righe 71-78). Con `trimEnd ≥ duration`, `effectiveDuration` diventa 0: la condizione `currentTime >= effectiveDuration` è sempre vera → la clip termina immediatamente, e **se è in loop si entra in un ciclo di `restartLoop()` a ogni `ontimeupdate`**.

**Fix proposto:** estendere il blocco di sanificazione già presente: se `duration > 0 && trimStart + trimEnd >= duration`, azzerare i trim.

### M8 — Stato incoerente del server remoto se la porta 8787 è occupata
**File:** `src/main/RemoteControlServer.ts:179-183, 239-251`

L'handler `error` azzera `server` e `currentPin`, ma **lascia `wss` assegnato** e non notifica il renderer. Poi `stopRemoteControlServer` esce subito su `if (!server) return`, lasciando il `WebSocketServer` orfano. Lato UI il toggle risulta acceso e non compare alcun messaggio d'errore.

**Fix proposto:** nell'handler `error` chiudere anche `wss`, e propagare l'errore al renderer con lo stesso canale già usato per lo stato.

---

## LIEVI

| # | Reperto | File |
|---|---------|------|
| L1 | Undo/Redo (Ctrl+Z/Y) e Delete/Backspace restano attivi con i modali aperti: l'Input Guard copre solo `INPUT`/`TEXTAREA`, non il focus su `<select>` o bottoni dentro una modale. La conferma su Delete attenua, l'undo no. | `App.tsx:274-302` |
| L2 | `_preloadedNext` non viene scartato quando la clip in onda è fermata a mano: un player con file caricato resta in memoria fino al preload successivo o a STOP ALL. | `useAudioStore.ts:383-403` |
| L3 | `seek()` non azzera `introReached`/`outroReached`: dopo un seek all'indietro i marker non riscattano nel giro corrente. | `StreamPlayer.ts:238-240` |
| L4 | `suppressedClips` è codice morto dalla v1.15.15 (mai più scritto) ma sopravvive nell'interfaccia dello store, in `evaluateMix`, `playClip` e `stopClip`. Da rimuovere in una pulizia dedicata. | `useAudioStore.ts:34,196,1306-1313` |
| L5 | CSP: `connect-src` include `ws:` senza host — consentirebbe WebSocket verso qualunque destinazione. | `main/index.ts:216` |
| L6 | `start-recording` chiude lo stream precedente ma non rimuove il file temporaneo orfano in `%TEMP%`. | `main/index.ts:735-738` |
| L7 | Logica di validazione del path temp-recording duplicata in due punti con lo stesso identico contenuto. | `main/index.ts:65-78` e `896-924` |
| L8 | `validateLmpProjectData` non valida `col.title`: un `.lmp` senza titolo produce un'intestazione di colonna vuota. | `useProjectStore.ts:36-42` |
| L9 | `_rotationDecisions` e `_transitionFiredFor` crescono per tutta la sessione (ripuliti solo da STOP ALL). Dimensione ≈ numero di clip: nessun impatto pratico, solo igiene. | `useAudioStore.ts:432,446` |
| L10 | Dipendenze: `npm audit --omit=dev` segnala 4 vulnerabilità (2 high). Nessuna raggiungibile da input non fidato nell'uso reale dell'app. | vedi sotto |

**Dettaglio L10:**
- `js-yaml 4.0.0-4.2.0` — DoS quadratico su merge key ripetute (arriva da `electron-updater`; l'input è il nostro `latest.yml`). **`npm audit fix` risolve senza breaking change.**
- `file-type` / `music-metadata` — usato per i tag ID3 di file audio locali scelti dall'operatore.
- `uuid <11.1.1` — bounds check mancante nelle v3/v5/v6 con `buf` esplicito; l'app usa `crypto.randomUUID()` nativo, la dipendenza è transitiva. Il fix richiede un major (`uuid@14`): **da non forzare**.

---

## Verifiche fatte che NON hanno prodotto reperti

Le annoto perché sono i punti dove si sarebbe portati a cercare per primi:

- **Command injection FFmpeg** — `AudioProcessor` usa sempre `spawn(path, [array])`, mai `shell: true` né interpolazione in stringa di comando. Pulito.
- **Note On con velocity 0** (che molti controller usano al posto del Note Off) — `MidiManager.ts:121` filtra già correttamente `status === 0x90 && velocity > 0`. Nessun rischio di clip lanciata a volume zero o fermata al rilascio del tasto.
- **Protocollo `media://`** — whitelist estensioni, `normalize()` contro il path traversal, `isAbsolute()`, clamp dei Range con 416 sui range invalidi, adapter di stream idempotente. Solido (salvo il caso UNC, G4).
- **IPC di scrittura su disco** — `save-project-direct`, `convert-recording`, `delete-temp-recording` validano tutti il path renderer-controlled. Scritture atomiche via `.tmp` + `rename`.
- **Single-instance lock** — presente e corretto: niente doppio output audio.
- **Rate-limiter IPC FFmpeg** — è una coda FIFO reale (fix v1.7.1), non un limitatore a scarto. Confermato.
- **Race condition su `playClip`** — il meccanismo dei run-ID + invalidazione da `stopClip`/`stopAll` regge; anche i timeout del sequencer e i player precaricati vengono cancellati da STOP ALL.
- **Motore automix** (`automixEngine.ts`) — matematica pura, tutti i percorsi di dati mancanti/deboli degradano esplicitamente a crossfade classico. 26 test. Nessun rilievo.

---

## Ordine di intervento consigliato

Ragionato sul rapporto fra rischio in diretta e costo/rischio della modifica:

1. **G1** (fade-out annullato) — impatto udibile a ogni diretta, fix di poche righe e circoscritto, copribile con un test unitario nuovo su `evaluateMix`.
2. **G3** (perdita progetto all'update) + **M4** (`isDirty` inquinato) — vanno affrontati insieme: sistemare M4 riduce di suo la frequenza con cui G3 morde.
3. **G2** (pruning export) — perdita di dati irreversibile; il fix con marcatore è semplice e non tocca il percorso audio.
4. **M5** + **M6** (sicurezza controllo remoto) — due interventi minimi su un modulo isolato, nessun rischio per il motore.
5. **M2**, **M3**, **M7**, **M8** — robustezza, indipendenti fra loro.
6. **M1** (hotkey F1-F5) — richiede una decisione di prodotto prima del codice: rimappare sulle colonne visibili o rimuovere le F-key.
7. **G4** (UNC) — il più costoso: modifica coordinata renderer+main e test su share di rete reale. Da trattare come sessione dedicata, come già deciso a suo tempo.
8. **Lievi** — accorpabili in un unico blocco di pulizia (L4 e L7 in particolare sono debito residuo di rimozioni precedenti).

---

*Revisione eseguita con Claude Code il 2026-07-28. Nessuna modifica al codice applicata: solo documentazione.*
