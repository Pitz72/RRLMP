# Design brief / Prompt di riferimento — Colonne Jingle&Promo + rotazione PRE-SHOW

> Documento preparato il 2026-06-05 (a valle di v1.3.19) per la prossima sessione di lavoro. Contiene il **prompt di avvio** + il **contesto tecnico** già raccolto, così la sessione parte allineata.

---

## PROMPT DA INCOLLARE A INIZIO SESSIONE

> Carica la memoria. Lavoriamo al design (e poi all'implementazione) delle **colonne Jingle&Promo con rotazione automatica nella sola colonna PRE-SHOW**.
>
> Vincolo di filosofia (vedi `docs/VISION.md`): NON è automazione dello show. La rotazione vive **solo in PRE-SHOW**, la fase di riempitivo che gira finché lo speaker non fa partire la sigla. Lo show resta 100% manuale.
>
> Comportamento voluto (modello AzuraCast "once per X songs", intervallo CONTINUO): la PRE-SHOW suona come playlist (come ora); ogni **X brani** pesca **a caso** una clip dalla colonna Jingle&Promo e la inserisce. Il jingle/promo parte **a fine brano** seguendo le **regole di transizione** esistenti, **mai sovrapposto**. Variante da decidere: una sola colonna "Jingle&Promo" oppure due colonne separate (Jingle ogni X, Promo ogni Y).
>
> Procedi così: (1) leggi i file chiave qui sotto e confermami lo stato reale del codice; (2) proponimi un design con le scelte aperte risolte; (3) dopo la mia approvazione, implementa seguendo il metodo del progetto (bump versione + changelog + relazione + commit). Stabilità > funzionalità: niente refactoring non richiesto, leggi prima di modificare.

---

## CONTESTO TECNICO (già verificato in sessione 2026-06-05)

### Punto d'aggancio del motore di rotazione
- La progressione della playlist PRE-SHOW passa da **`getNextClipInColumn(currentClipId)`** in `src/renderer/src/store/useAudioStore.ts` (~riga 166), chiamata da **`applyTransitionAndPlayNext(clipId)`** (~riga 391) negli handler `onPreEnd` / `onOutroReached` / `onEnded` quando `nextAction === 'play_next'`.
- Le clip PRE-SHOW nascono con `nextAction: 'play_next'` (playlist sequenziale).
- **Qui** si innesta la rotazione: ogni X avanzamenti, invece della prossima clip sequenziale, scegliere a caso una clip dalla colonna Jingle&Promo, suonarla, poi riprendere la sequenza. Il **contatore** va tenuto nello store (stato runtime, non per forza persistito).

### Modello colonne (`src/renderer/src/store/useProjectStore.ts`)
- `DEFAULT_COLUMNS` (~riga 80): 5 colonne fisse — `col-assets` (type `asset`), `col-music` (`music`), `col-voice` (`voice`), `col-sfx` (`sfx`), `col-preshow` (`preshow`).
- `VALID_CLIP_TYPES` (~riga 4): `['asset','music','voice','sfx','preshow']` — **aggiungere un nuovo type** (es. `jingle`/`promo`) impatta questa whitelist e `validateLmpProjectData`.
- I default per tipo colonna sono in `addClip`/`addClipAtIndex`/`addClipFromPath` (~righe 207-308): la colonna `asset` dà già il profilo tipo-jingle → `nextAction:'stop'`, `behavior:'normal'`, `duckingRole:'none'`, `fadeOut:500ms`. Buona base per Jingle&Promo.
- Colori default per colonna assegnati in `DEFAULT_COLUMNS`.

### Persistenza `.lmp`
- `validateLmpProjectData(raw)` (~riga 22) valida/sanitizza in apertura. **Aggiungere colonne/type richiede valutare la migrazione**: i `.lmp` esistenti hanno 5 colonne fisse; all'apertura andrà iniettata la/le nuova/e colonna/e se assente/i (con id stabile) senza rompere i progetti vecchi.
- L'ordine/numero colonne è attualmente fisso. La feature "Layout Regia 5.0" (colonne configurabili/rinominabili) è correlata ma più ampia — qui basta aggiungere colonne fisse in posizione definita (2ª posizione, a destra di assets, come da richiesta utente).

### UI
- Rendering colonne in `src/renderer/src/components/layout/MainGrid.tsx`; header in `ColumnHeader.tsx`; card in `ClipCard.tsx`.
- La configurazione della regola di rotazione va in una **modale sulla colonna PRE-SHOW** (quanti brani tra un jingle/promo). Pattern modali esistenti: `GeneralSettingsModal`, `ClipSettingsModal`, ecc.
- ⚠️ Nota leggibilità: 2 colonne extra restringono lo spazio orizzontale — l'utente è consapevole, "lo sistemeremo dopo".

## SCELTE APERTE DA RISOLVERE NEL DESIGN
1. **Una colonna "Jingle&Promo" o due separate (Jingle / Promo)?** L'utente ha proposto entrambe; due colonne = due contatori indipendenti ("ogni X un jingle, ogni Y un promo") ma più ingombro.
2. **Nuovo `type` colonna** (`jingle`/`promo`) o riuso di `asset` con un flag `role`? Impatta whitelist + persistenza + default.
3. **Contatore**: runtime-only (riparte ad ogni avvio PRE-SHOW) o persistito? Probabile runtime.
4. **Selezione random**: pura random, o evitare ripetizione immediata dell'ultimo jingle? (anti-repeat consigliato).
5. **Cosa succede a fine lista Jingle&Promo / colonna vuota**: salta l'inserimento e prosegue la playlist.
6. **Regole di transizione**: il jingle usa le proprie (default tipo-asset) e poi il ritorno alla musica usa la transizione della clip successiva — confermare il flusso esatto in `applyTransitionAndPlayNext`.
7. **Migrazione `.lmp`**: come iniettare la/le nuova/e colonna/e nei progetti salvati senza perdere dati.

## VINCOLI DI METODO
- **Stabilità > funzionalità**: leggere i file prima di toccarli; niente refactoring non richiesto; non rompere i `.lmp` esistenti.
- **Metodo progetto**: design approvato → implementazione → bump versione + changelog in `docs/changelogs/current/` + riga in `relazione.md` (header + tabella) + commit (`git commit -F`) + push multi-remote (`git push origin master && git push github master`).
- Typecheck baseline: main/preload/renderer tutti **0 errori** — mantenere.
