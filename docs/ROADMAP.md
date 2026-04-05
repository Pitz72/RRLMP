# RRLMP — Roadmap & Issue Backlog

Generato il: 2026-04-05  
Aggiornato il: 2026-04-05 (Riorganizzazione Archivio)  
Versione corrente: vedere package.json  
Analisi condotta su: tutto il sorgente in `src/`, `package.json`, file di configurazione

---

## Indice

- [🟢 Criticità Aperte](#-criticità-aperte)
  - [Criticità Gravi](#-criticità-gravi)
  - [Criticità Medie](#-criticità-medie)
  - [Criticità Lievi](#-criticità-lievi)
- [Priorità di Intervento](#priorità-di-intervento-task-aperti)
- [🚀 Evoluzione e Nuove Funzionalità](#-evoluzione-e-nuove-funzionalità)
- [Riepilogo Stato Avanzamento](#riepilogo-stato-avanzamento)
- [✅ Archivio Interventi Completati](#-archivio-interventi-completati)

---

## 🟢 Criticità Aperte

In questa sezione sono elencati i problemi ancora da risolvere, suddivisi per gravità.

### 🔴 Criticità Gravissime

*Tutti gli interventi identificati in questa categoria sono stati risolti. Vedere l'[Archivio](#-archivio-interventi-completati).*

---

### 🟠 Criticità Gravi

Problemi che compromettono la robustezza, la correttezza tecnica o creano debito tecnico significativo.

#### GR2 — Topologia audio graph potenzialmente errata

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

#### GR4 — Type safety perforata: 42+ usi di `any` e `@ts-ignore`

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

#### GR11 — `BufferPlayer` non implementa `setOutputDevice`

**File**: `src/renderer/src/engine/BufferPlayer.ts`  
**Impatto**: `IAudioPlayer` interface non rispettata, crash potenziale  
**Stima**: ~15min

**Descrizione**:  
L'interfaccia `IAudioPlayer` richiede il metodo `setOutputDevice(deviceId: string)`, ma `BufferPlayer` **non lo implementa**. Se `BufferPlayer` venisse usato in futuro (attualmente solo `StreamPlayer` è in uso), chiamare `updateOutputDevice()` causerebbe un crash a runtime.

**Fix proposto**: Aggiungere un metodo `setOutputDevice` vuoto o implementato in `BufferPlayer`.

---

### 🟡 Criticità Medie

Problemi che impattano l'esperienza utente o la correttezza in scenari edge case.

#### M4 — FFT size eccessivo per VU meter

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

#### M5 — Auto-silence detection: caso degenere non gestito

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

#### M6 — Dead-air warning ambiguo con looping + play_next attivi insieme

**File**: `src/renderer/src/components/layout/ColumnHeader.tsx`  
**Impatto**: UX, chiarezza comportamento  
**Stima**: ~30min

**Descrizione**:  
Una clip con sia `isLooping = true` che `nextAction = 'play_next'` ha comportamento ambiguo: il looping viene silenziosamente prioritizzato, il sequencer non avanza. Il dead-air warning viene correttamente disabilitato per le clip in loop, ma l'utente non ha feedback sul fatto che `play_next` venga ignorato.

**Fix proposto**:  
Aggiungere un tooltip o indicatore visivo nel `ClipSettingsModal` che avverta del conflitto quando entrambe le opzioni sono attive simultaneamente.

---

### 🟢 Criticità Lievi

Miglioramento qualità codice e manutenibilità.

#### L1 — Magic numbers senza costanti denominate

Valori numerici critici come il fattore di ducking (`0.2` = circa -14dB) sono scritti direttamente nel codice senza una costante con nome. Rende difficile capire il significato e modificare il comportamento in modo coerente.  
**Fix**: Estrarre costanti: `const DUCKING_MUSIC_FACTOR = 0.2; // -14dB approx`

#### L2 — Error handling inconsistente nel codebase

Alcuni errori vengono emessi verso `useDebugStore`, altri solo a `console.error`, altri vengono silenziati completamente. Non esiste una convenzione uniforme.  
**Fix**: Stabilire una policy: tutti gli errori operativi vanno a `useDebugStore.addLog()`, quelli di sviluppo a `console`.

#### L3 — File `MainLayout.tsx` mai importato

Il file esiste nel repository ma non viene importato da nessun componente. È codice morto che aumenta la superficie da mantenere.  
**Fix**: Eliminare il file o verificare se era la vecchia entry point del layout e andrebbe rimosso.

#### L4 — Commenti insufficienti sull'engine audio

Le parti più complesse del codebase — la logica `evaluateMix` con le regole di ducking/stacco e la gestione del ciclo di vita dei nodi in `StreamPlayer` — sono scarsamente commentate.  
**Fix**: Aggiungere block comments alle funzioni critiche che spieghino il "perché" delle scelte.

#### L5 — Interfaccia `AudioClip` senza JSDoc dei valori default

Campi come `fadeIn`, `fadeOut`, `volume`, ecc. non hanno documentazione sui valori default attesi.  
**Fix**: Aggiungere JSDoc inline o un oggetto `DEFAULT_CLIP` esportato.

#### L6 — Debug store: limite 500 log e pressione memoria

Il log store mantiene fino a 500 entries in memoria React. In sessioni broadcast lunghe con eventi frequenti, può accumularsi rapidamente.  
**Fix**: Implementare una rotazione FIFO con limite fisso (es. 200 entries).

#### L7 — Codice commentato e commenti residui sparsi

Presenza di blocchi di codice commentati e commenti TODO/FIXME non tracciati.  
**Fix**: Cleanup sistematico; convertire lavoro reale in issue tracciabili.

---

## Priorità di Intervento (Task Aperti)

| # | Issue | Categoria | Stima | Motivo priorità |
| :-: | --- | --- | --- | --- |
| 1 | **GR4** — Type safety / any / ts-ignore | Grave | 2h | Manutenibilità long-term |
| 2 | **GR11** — BufferPlayer senza setOutputDevice | Grave | 15 min | Interface compliance |
| 3 | **GR2** — Topologia audio graph | Grave | 30 min | Correttezza audio |
| 4 | **M5** — Auto-silence degenere | Media | 30 min | Edge case correttezza |
| 5 | **M4** — FFT size eccessivo | Media | 15 min | Ottimizzazione DSP |
| 6 | **M6** — Dead-air warning ambiguo | Media | 30 min | UX clarity |
| 7 | **L1–L7** — Lievi varie | Lieve | 3h tot. | Qualità codice |

---

## 🚀 Evoluzione e Nuove Funzionalità

Dalle analisi tecniche e dai commenti nel codice sorgente, sono state identificate le seguenti direzioni di sviluppo per la finalizzazione del prodotto RRLMP:

### 🎵 Audio & Playback Engine (Finalizzazione)

- [ ] **Advanced Markers Support**: Implementazione di Intro/Outro/Next markers per l'automazione dei mix point e il countdown vocale (ref: `AudioClip` interface).
- [ ] **Precise Trimming UI**: Mini-editor per definire `trimStart` e `trimEnd` visualmente tramite waveform.
- [ ] **PFL (Pre-Fade Listen)**: Sistema di monitoraggio audio indipendente per il pre-ascolto delle clip fuori onda (richiede routing dedicato).
- [ ] **Ducking Sidechain Dinamico**: Espansione del sistema `stacco` per supportare ruoli `source/target` configurabili dall'utente.

### 🖥️ Interfaccia e Workflow

- [ ] **Layout Regia 5.0**: Espansione della griglia a 5 colonne per ospitare asset di servizio aggiuntivi (ref: `MainLayout.tsx`).
- [ ] **Pannello Keymapping**: Interfaccia per la gestione centralizzata di Keybind e MIDI Bind per ogni singola clip.
- [ ] **Export Package 2.0**: Consolidamento della funzione di export per includere tutti i metadati e garantire la portabilità assoluta del progetto (ref: Cap. 8 Manuale).

### 🛡️ Stabilità e Manutenibilità

- [ ] **Audio Engine Hardening**: Migrazione completa a `media:///` e rimozione definitiva di ogni riferimento a `file://` instabili.
- [ ] **LMP Integrity Check**: Diagnostica all'apertura del progetto per rilevare file mancanti (Clip Rosse) e suggerire il ricollegamento (ref: Cap. 8 Manuale).

## Riepilogo Stato Avanzamento

| Gravità | Risolti | Totali | Stato |
| --- | --- | --- | --- |
| 🔴 Gravissime | 8 | 8 | **100%** ✅ |
| 🟠 Gravi | 9 | 12 | **75%** 🟠 |
| 🟡 Medie | 5 | 8 | **62%** 🟡 |
| 🟢 Lievi | 0 | 7 | **0%** 🟢 |
| **TOTALE** | **22** | **35** | **63% COMPLETATO** |

**Stima residua per completamento: ~7-8 ore di sviluppo.**

---

## ✅ Archivio Interventi Completati

In questa sezione sono raccolti i dettagli degli interventi già realizzati, a scopo storico.

### Ex-Criticità Gravissime (Tutte Risolte)

#### G1 — `webSecurity: false` nel processo principale ✅ v0.9.13

La finestra Electron era istanziata senza isolamento, esponendo il file system. Risolto attivando `webSecurity` e usando il protocollo `media://`.

#### G2 — Memory leak: nodi Web Audio API ✅ v0.9.11

I nodi Web Audio non venivano disconnessi alla distruzione del player. Risolto implementando un metodo `cleanup()` completo.

#### G3 — Race condition: clip loading asincrono ✅ v0.9.11

Switch rapidi di clip causavano l'avvio della clip sbagliata. Risolto con un sistema di "generation ID".

#### G4 — Bug critico: volume non ripristinato dopo stacco ✅ v0.9.10

Dopo un jingle di soppressione, il volume delle altre clip non tornava ai valori originali. Risolto richiamando `evaluateMix()` al termine dello stacco.

#### G5 — Trim start/end calcolato ma non salvato ✅ v0.9.9

I valori di trim venivano calcolati ma non passati all'oggetto di salvataggio. Risolto integrando i campi nel modal.

#### G6 — `pathUtils.ts` usa `file:///` ✅ v0.9.13

Il player non usava il protocollo sicuro `media://`. Risolto migrando l'intera gestione URL al nuovo protocollo.

#### G7 — `onEnded` callback usa closure stale ✅ v0.9.10

Bug dovuto alla cattura di uno stato vecchio di Zustand. Risolto usando `get()` all'interno del callback.

#### G8 — `setInterval` globale leakato ✅ v0.9.10

Progress sync causava 10 re-render al secondo anche senza audio. Risolto con `requestAnimationFrame` condizionale.

---

### Ex-Criticità Gravi (Risolte)

#### GR1 — Sistema di ducking duplicato ✅ v0.9.12

Eliminato `DuckingManager.ts` in quanto la logica era stata reimplementata (meglio) nello store.

#### GR3 — Disconnessione dispositivo audio silente ✅ v0.9.15

Implementata notifica visiva e fallback al dispositivo di sistema in caso di errore `setSinkId`.

#### GR5 — Dispositivo audio non ripristinato all'avvio ✅ v0.9.15

L'impostazione salvata non veniva applicata al context audio globale al bootstrap. Risolto in `App.tsx`.

#### GR6 — Nessun CSP header nelle risposte Electron ✅ v0.9.13

Implementato `Content-Security-Policy` restrittivo per migliorare l'isolamento del renderer.

#### GR7 — Doppia dichiarazione `Window.electron` ✅ v0.9.9

Pulizia dei tipi globali in `env.d.ts` e `types/index.ts` per evitare conflitti e falsi positivi TS.

#### GR8 — File di preload duplicato ✅ v0.9.12

Eliminato `src/main/preload.ts`, un residuo non utilizzato.

#### GR9 — Export: filename duplicati ✅ v0.9.14

L'export dei progetti sovrascriveva file con lo stesso nome. Risolto con collision detection e rinomina automatica.

#### GR10 — Autosave senza rotazione ✅ v0.9.14

Gli autosave riempivano il disco. Implementata rotazione FIFO mantenendo solo gli ultimi 10 file.

#### GR12 — Validazione formato file in fase di drop ✅ v0.9.14

Accettava file non audio. Implementato filtro sulle estensioni supportate nel handler del drop.

---

### Ex-Criticità Medie (Risolte)

#### M1 — Dialogs di sistema hardcoded in italiano ✅ v0.9.16

Localizzati i pulsanti dei dialoghi nativi (Salva/Annulla) in 8 lingue.

#### M2 — Fallimento inizializzazione MIDI non notificato ✅ v0.9.16

Aggiunta notifica nel debug store e feedback visivo in caso di fallimento permessi MIDI.

#### M3 — MIDI Learn mode senza timeout ✅ v0.9.16

Aggiunto timeout di 15 secondi e uscita con `Escape` dalla modalità di apprendimento.

#### M7 — `bypassCSP: true` sul protocollo `media://` ✅ v0.9.13

Rimosso il bypass per conformità ai requisiti di sicurezza e testato con la nuova policy.

#### M8 — Versione progetto hardcoded ✅ v0.9.9

La versione era bloccata a `0.7.3` in fase di salvataggio chiusura. Allineata a `__APP_VERSION__`.

---

**Stima totale per portare il software a qualità production-grade: ~22–26 ore di sviluppo.**

---

*Documento generato da analisi statica manuale del sorgente e integrato con analisi indipendente del 2026-04-05. Aggiornare questo file man mano che le issue vengono risolte.*
