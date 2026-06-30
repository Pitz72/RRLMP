# Regole Colonna 2 — JINGLE

> Documento di riferimento **canonico** sul comportamento delle clip nella colonna Jingle.
> Scopo: fissare su carta regole codificate, senza più fraintendimenti.
>
> Versione software di riferimento: **v1.5.1** — ultima verifica codice: 2026-06-30.

---

## 1. Identità della colonna

| Proprietà | Valore |
|---|---|
| Titolo | **JINGLE** |
| ID interno | `col-jingle` |
| Tipo (`type`) | `asset` |
| Colore | Ambra `#F59E0B` |
| Posizione | 2ª colonna (subito a destra di SHOW ASSETS) |
| Bloccata? | No |

> Codice: `DEFAULT_COLUMNS` in `src/renderer/src/store/useProjectStore.ts`.

---

## 2. La regola unica: "SOLO regola JINGLE"

La colonna Jingle **non** è una colonna asset generica. Ha **una sola regola**: ogni clip è un **jingle**.

A differenza di SHOW ASSETS — che può ospitare stacchi, sottofondi in loop e sigle con comportamenti diversi — qui ogni clip è, e resta, un jingle. Niente bed in loop, niente versatilità da colonna asset: **solo jingle**.

---

## 3. Cosa succede quando carichi un file qui

Il file caricato nasce **già pre-configurato come jingle**, pronto all'uso, senza bisogno di impostare nulla a mano.

> **NON parte da solo.** "Pre-configurato di default" significa che la clip è già impostata con la regola jingle; **non** che si avvia automaticamente al caricamento. La lanci tu, a mano (clic / tasto / MIDI).

Valori di default della clip jingle:

| Parametro | Valore | Significato |
|---|---|---|
| `nextAction` | **`stop`** | A fine riproduzione si ferma. Non concatena la clip successiva. |
| `behavior` | **`normal`** | Mixer normale. |
| `duckingRole` | **`none`** | Nessun ruolo di ducking dedicato. |
| `isLooping` | **`false`** | Mai in loop (un jingle non è un sottofondo). |
| `fadeIn` | **0 ms** | Parte secco. |
| `fadeOut` | **500 ms** | Sfuma in mezzo secondo a fine/stop. |
| `volume` | **1.0** | Volume pieno. |

> Codice: `addClip` / `addClipAtIndex` / `addClipFromPath` in `useProjectStore.ts` (ramo `type === 'asset'`).

---

## 4. Cosa fa un jingle quando lo lanci A MANO

Lanciato a mano dall'operatore, un jingle fa il **TAKE-OVER**: ferma di colpo ciò che è in onda e prende il volume pieno.

**Eccezioni che NON vengono fermate:**
1. **La colonna SFX** (`col-sfx`) — continua a suonare.
2. **I SOTTOFONDI in LOOP** — il jingle **non li ferma**: li **abbassa a zero** mentre suona e li fa **tornare** con rialzo sfumato a fine jingle (decisione A3, 2026-06-30). È la differenza chiave rispetto alla sigla finale.

> ⚠️ Differenza con SHOW ASSETS: una **sigla** lanciata da SHOW ASSETS **ferma** anche i sottofondi in loop (li chiude). Un **jingle/promo** invece li **abbassa e li fa tornare**. Per il resto (musica, voci, altri asset non-loop) il take-over del jingle ferma tutto come quello di una sigla.

> Codice: `col-jingle` è incluso nella condizione `isTakeover` di `playClip`, con esenzione loop per le colonne non-`col-assets`; l'abbassamento del bed è la Rule 3b di `evaluateMix`.

---

## 5. Il secondo ruolo: sorgente della rotazione PRE-SHOW

Oltre all'uso manuale, la colonna Jingle è una delle due **sorgenti** della rotazione automatica della PRE-SHOW (l'altra è PROMO).

Quando la rotazione è attiva, il motore pesca **automaticamente** un jingle da questa colonna e lo inserisce tra un brano e l'altro della PRE-SHOW.

**Importante — i lanci automatici sono diversi da quelli manuali:**
- Un jingle pescato **dalla rotazione** (lancio "macchina") **NON** fa il take-over: rientra ordinatamente nella playlist PRE-SHOW seguendo le regole di transizione, senza fermare lo show.
- Solo il lancio **manuale** dell'operatore fa il take-over (§4).

> La rotazione PRE-SHOW è documentata nel file della colonna PRE-SHOW. Qui basta sapere che Jingle ne è una sorgente. La colonna è identificata per **id stabile** (`col-jingle`), non per tipo.

---

## 6. Come un jingle si comporta NEL MIX

Identico al profilo asset (vedi [01-ASSETS.md](01-ASSETS.md) §4): in ordine di priorità → muto sotto la musica, ducking sotto la voce, altrimenti volume pieno.

---

## 7. Riepilogo in una frase

> La colonna **JINGLE** ha **una sola regola**: ogni clip è un jingle, **pre-configurato** al caricamento ma **non** avviato da solo. Lanciato **a mano** si comporta come una **sigla** (take-over: ferma tutto tranne gli SFX). Lanciato **dalla rotazione PRE-SHOW** rientra invece ordinatamente nella playlist senza fermare nulla.

---

## 8. Riferimenti rapidi al codice

| Regola | File | Punto |
|---|---|---|
| Definizione colonna + colore | `useProjectStore.ts` | `DEFAULT_COLUMNS` (`col-jingle`) |
| Default clip jingle | `useProjectStore.ts` | `addClip*` (ramo `asset`) |
| Take-over al lancio manuale | `useAudioStore.ts` | `isTakeover` in `playClip` (include `col-jingle`) |
| Sorgente rotazione PRE-SHOW | `useAudioStore.ts` | `resolvePreshowNext` |
| Volume automatico nel mix | `useAudioStore.ts` | ramo `asset` in `evaluateMix` |
