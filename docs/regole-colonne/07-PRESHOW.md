# Regole Colonna 7 — PRE-SHOW (Preshow)

> Documento di riferimento **canonico** sul comportamento delle clip nella colonna PRE-SHOW.
> Versione software di riferimento: **v1.5.1** — ultima verifica codice: 2026-06-30.

---

## 1. Identità della colonna

| Proprietà | Valore |
|---|---|
| Titolo | **PRE-SHOW** |
| ID interno | `col-preshow` |
| Tipo (`type`) | `preshow` |
| Colore | Viola `#8B5CF6` |
| Posizione | 7ª colonna (ultima) |
| Bus audio | **Music bus** (la PRE-SHOW è mappata sul bus musica) |

> Codice: `DEFAULT_COLUMNS` in `useProjectStore.ts`; routing in `getBusForType` (`preshow → MusicBus`).

---

## 2. Default della clip al caricamento

| Parametro | Valore | Significato |
|---|---|---|
| `nextAction` | **`play_next`** | **UNICA colonna** che concatena: a fine clip parte la successiva → playlist automatica. |
| `behavior` | **`normal`** | — |
| `duckingRole` | **`target`** | Si abbassa sotto la voce (vedi ⚠️ A1). |
| `isLooping` | **`false`** | — |
| `fadeIn` | **0 ms** | — |
| `fadeOut` | **0 ms** | **Gapless** di default (attacca senza buco). |
| `volume` | **1.0** | — |

> Codice: `addClip*` in `useProjectStore.ts` (rami `type === 'preshow'`).

**Conseguenza chiave — è l'unica colonna "automatica".** La PRE-SHOW gira come una playlist (riempitivo prima dello show). È l'eccezione controllata alla regola "show manuale".

---

## 3. Transizione tra brani PRE-SHOW

Il tipo di transizione di default si legge dalle **Impostazioni** (`defaultPreshowTransition`), non è fisso a gapless come nelle altre colonne. Si può comunque sovrascrivere per singola clip.

> Codice: `resolveTransitionType` → per `col-preshow` usa `defaultPreshowTransition`.

---

## 4. La rotazione Jingle & Promo

La PRE-SHOW è l'unico punto in cui esiste un automatismo di inserimento: ogni X brani inserisce un **jingle**, ogni Y un **promo**, pescati dalle colonne `col-jingle`/`col-promo`.

- **Default: SPENTA.** Va attivata nella modale Rotazione (icona RefreshCw sull'header PRE-SHOW). Configurazione persistita su `col-preshow.rotation`.
- L'inserto parte **a fine brano**, seguendo le transizioni, **mai sovrapposto**.
- Collisione jingle+promo sullo stesso giro → sequenza (prima jingle, poi promo, poi ripresa).
- Gli inserti della rotazione sono lanci "macchina": **non** fanno take-over e rientrano ordinatamente nella playlist.
- I contatori sono runtime (ripartono ad ogni STOP ALL); gli intervalli sono persistiti.

> Codice: `resolvePreshowNext` e relativa macchina a stati (`_pendingInserts`, `_activeInsertId`, ecc.) in `useAudioStore.ts`. Dettaglio progettuale in `docs/design/jingle-promo-preshow.md`.

---

## 5. Comportamento nel mix

La PRE-SHOW è trattata **come la musica**: si abbassa (ducking) quando c'è voce attiva; altrimenti volume pieno. *(v1.15.15: rimosso il caso "stacco attivo", vedi [01-ASSETS.md](01-ASSETS.md) §4.)*

> Sottigliezza: una clip PRE-SHOW in onda **non** attiva la "Music Dominance" sugli asset (quel controllo guarda solo `type === 'music'`). Quindi sotto la PRE-SHOW un asset/bed non viene mutato come accade sotto una canzone.

---

## 6. Interazioni con il resto della regia

- **Lanciare uno SHOW ASSET** (`col-assets`) → ferma le clip PRE-SHOW in onda e **azzera la rotazione** (lo show prende il comando).
- **Lanciare Musica o Voce a mano** → annulla la ripresa rotazione pendente (l'inserto in onda finisce senza far ripartire la PRE-SHOW).
- **Lanciare a mano una clip PRE-SHOW mentre un inserto rotazione è in onda** → l'inserto viene fermato e la ripresa annullata (scegli tu il punto della playlist).
- **STOP ALL** → reset completo della rotazione.

---

## 7. Riepilogo in una frase

> La **PRE-SHOW** è l'unica colonna automatica: gira come playlist gapless (riempitivo pre-show), con rotazione opzionale di jingle/promo ogni X/Y brani. Si abbassa sotto la voce, e si ferma/cede il comando appena l'operatore lancia uno show asset, una canzone o una voce.

---

## 8. Note di mix risolte (2026-06-30)
- **A1 (chiuso)** — il campo `duckingRole` è stato **rimosso dalla UI** (non era letto dal mix). Il livello di ducking si regola **globalmente** in Impostazioni → *Riduzione ducking*.
