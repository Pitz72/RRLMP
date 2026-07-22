# Regole Colonna 1 — SHOW ASSETS

> Documento di riferimento **canonico** sul comportamento delle clip nella colonna Assets.
> Scopo: fissare su carta regole codificate, senza più fraintendimenti.
> Ogni regola riporta **dove vive nel codice** così da poterla verificare/aggiornare.
>
> Versione software di riferimento: **v1.5.1** — ultima verifica codice: 2026-06-30.

---

## 1. Identità della colonna

| Proprietà | Valore |
|---|---|
| Titolo | **SHOW ASSETS** |
| ID interno | `col-assets` |
| Tipo (`type`) | `asset` |
| Colore | Verde Emerald `#10B981` |
| Posizione | 1ª colonna (la più a sinistra) |
| Bloccata? | No (accetta file trascinati dall'OS come tutte le colonne) |

> Codice: `DEFAULT_COLUMNS` in `src/renderer/src/store/useProjectStore.ts`.

**Nota importante.** Le colonne **JINGLE** (`col-jingle`) e **PROMO** (`col-promo`) usano lo **stesso tipo `asset`** e quindi lo **stesso identico profilo** descritto qui. Una clip di Jingle o Promo lanciata **da sola, a mano** si comporta esattamente come un asset. La differenza è solo che Jingle/Promo sono anche sorgenti della rotazione PRE-SHOW (documentata a parte).

---

## 2. Cosa diventa una clip quando la metti negli Assets

Appena trascini un file nella colonna, la clip nasce con questi **valori di default**:

| Parametro | Valore di default | Significato |
|---|---|---|
| `nextAction` | **`stop`** | A fine riproduzione si ferma. **NON** fa partire la clip successiva. |
| `behavior` | **`normal`** | Campo LEGACY: dal v1.15.15 il motore lo ignora (vedi §4). Resta nel `.lmp` per compatibilità. |
| `duckingRole` | **`none`** | Non abbassa nessuno e non viene abbassata *per ruolo* (vedi §4 per le eccezioni di mix). |
| `isLooping` | **`false`** | Non va in loop (può essere attivato a mano → diventa un "sottofondo/bed"). |
| `fadeIn` | **0 ms** | Parte secca, senza dissolvenza in entrata. |
| `fadeOut` | **500 ms** | Sfuma in mezzo secondo quando finisce o viene fermata. |
| `volume` | **1.0** | Volume nominale pieno. |
| `pan` | **0** | Centrato. |
| `color` | colore della colonna | Eredita il verde Assets (o il colore custom se impostato). |

> Codice: `addClip` / `addClipAtIndex` / `addClipFromPath` in `useProjectStore.ts`.
> Il fadeOut a 500 ms è specifico del tipo `asset` (la musica usa 2000 ms, la PRE-SHOW 0 ms).

Tutti questi valori sono **modificabili per la singola clip** dalla finestra Impostazioni Clip. I default servono solo come punto di partenza sensato.

---

## 3. Come si comporta una clip Assets quando la lanci A MANO — il "TAKE-OVER"

Questa è la regola più importante e quella che storicamente generava confusione.

Quando l'operatore lancia **a mano** (clic / tasto / MIDI) una clip Assets che **non è in loop**, scatta il **TAKE-OVER**: la clip "prende il comando" della regia.

**Cosa succede:** tutto ciò che è in onda viene **fermato di colpo**, e l'asset prende il volume pieno.

**UNICA ECCEZIONE — cosa SOPRAVVIVE al take-over e continua a suonare sotto l'asset:**

1. **La colonna SFX / Cartwall** (`col-sfx`) — gli effetti non vengono mai fermati.
2. **La clip stessa** (ovviamente).

> ⚠️ **REGOLA 2026-06-30 (sottofondi in loop).** La **SIGLA FINALE** lanciata da SHOW ASSETS **ferma** i sottofondi in loop (li chiude davvero): è l'azione con cui l'operatore conclude il bed. Resta in onda solo la colonna SFX.
>
> Diverso il caso di **JINGLE/PROMO** (colonne 2 e 3): un jingle/spot **non ferma** il loop, lo **abbassa a zero** e lo fa **tornare** con rialzo sfumato a fine jingle (vedi [02-JINGLE.md](02-JINGLE.md) e §4 del mix). Riassunto della gerarchia del loop: si avvia a mano, non annulla nulla, si abbassa sotto canzoni e jingle e poi rientra, e viene chiuso solo dalla sigla finale (SHOW ASSET) o da uno STOP.

**Condizioni perché il take-over scatti (tutte e tre necessarie):**

- Il lancio è **manuale** (un gesto dell'operatore), **non** automatico.
- La clip parte da `col-assets`, `col-jingle` o `col-promo`.
- La clip **non è in loop**.

> Codice: variabile `isTakeover` in `playClip`, `useAudioStore.ts`.

**Conseguenze del take-over:**
- Azzera il preload del prossimo brano (`discardPreloadedNext`).
- Azzera la rotazione PRE-SHOW (`resetPreshowRotation`): l'operatore ha preso il comando.

### Cosa NON attiva il take-over
- I lanci **automatici** della macchina: rotazione PRE-SHOW e transizioni `play_next`. Questi continuano a seguire le loro regole normali (un inserto jingle in rotazione rientra regolarmente nella playlist).
- Un asset **in loop** (sottofondo/bed): non scatena il take-over, si limita a entrare nel mix.

### Caso particolare: lanciare un Asset mentre gira la PRE-SHOW
Anche fuori dal take-over, lanciare una clip Assets **ferma le clip della PRE-SHOW** in onda e azzera la rotazione: far partire una sigla significa che lo show prende il comando, quindi il riempitivo PRE-SHOW non deve ripartire sotto lo show.

> Codice: ramo `!isTakeover && columnId === 'col-assets'` in `playClip`.

---

## 4. Come una clip Assets si comporta NEL MIX (volume automatico)

Mentre suona, il volume reale di una clip Assets è deciso dinamicamente in base a cosa c'è in onda. Le regole sono applicate **in quest'ordine** (la prima che si verifica vince):

1. **Dominanza della musica** — se è attiva una clip Musica → gli asset/bed vanno a **muto** (per non "impastare" il suono).
1b. **Sottofondo sotto jingle/sigla** — se *questa* clip è un **sottofondo in loop** ed è in onda un **asset/jingle/promo NON in loop** → va a **muto**, e **torna** al suo volume con rialzo sfumato appena quello finisce (decisione A3, 2026-06-30).
2. **Ducking voce** — se è attiva una Voce (o il microfono Smart) → questa clip si **abbassa** (ducking).
3. **Normale** — in tutti gli altri casi → **volume pieno**.

> Codice: ramo `clip.type === 'asset'` in `evaluateMix`, `useAudioStore.ts`.

### ⚠️ RIMOSSO in v1.15.15: il comportamento `stacco`
Fino alla v1.15.14 una clip poteva essere marcata `behavior: 'stacco'` (auto-preservazione a volume pieno, ducking su musica/PRE-SHOW, azzeramento degli altri asset). Dal modello **take-over + regole-per-colonna** (2026-06-30) quel flag era diventato ridondante e fuorviante: **lo scopo della clip lo determina la colonna in cui sta**, non un flag per-clip.

- Per uno "stacchetto **sopra** la musica" → mettilo nella colonna **FX** (esente dalla dominanza musica) o **VOCE** (in più ducka tutto il resto).
- Il campo `behavior` resta nel modello dati solo per compatibilità `.lmp` (come `duckingRole`): il motore lo **ignora** e la UI non lo mostra più.

---

## 5. Riepilogo in una frase

> Una clip degli **Assets** nasce come **sigla one-shot**: parte secca, sfuma in 500 ms, si ferma da sola. Lanciata **a mano** prende il comando della regia (**take-over**) fermando tutto tranne gli **SFX** (inclusi i sottofondi in loop, che vengono chiusi). Nel mix cede il passo alla musica e si abbassa sotto la voce.

---

## 6. Riferimenti rapidi al codice

| Regola | File | Punto |
|---|---|---|
| Definizione colonna + colore | `useProjectStore.ts` | `DEFAULT_COLUMNS` |
| Default della clip (nextAction/fade/ducking) | `useProjectStore.ts` | `addClip*` |
| Take-over manuale + eccezioni | `useAudioStore.ts` | `isTakeover` in `playClip` |
| Stop PRE-SHOW al lancio asset | `useAudioStore.ts` | ramo `col-assets` in `playClip` |
| Volume automatico nel mix | `useAudioStore.ts` | ramo `asset` in `evaluateMix` |
| Tipi ammessi (`behavior`, `nextAction`) | `types/index.ts` | interfaccia `AudioClip` |
