# Regole Colonna 6 — SFX / CARTWALL (Sfx)

> Documento di riferimento **canonico** sul comportamento delle clip nella colonna SFX.
> Versione software di riferimento: **v1.5.1** — ultima verifica codice: 2026-06-30.

---

## 1. Identità della colonna

| Proprietà | Valore |
|---|---|
| Titolo | **SFX / CARTWALL** |
| ID interno | `col-sfx` |
| Tipo (`type`) | `sfx` |
| Colore | Grigio Slate `#64748B` |
| Posizione | 6ª colonna |
| Bus audio | **SFX bus** |

> Codice: `DEFAULT_COLUMNS` in `useProjectStore.ts`; routing in `getBusForType`.

---

## 2. Default della clip al caricamento

| Parametro | Valore | Significato |
|---|---|---|
| `nextAction` | **`stop`** | A fine effetto si ferma. Non concatena. |
| `behavior` | **`normal`** | — |
| `duckingRole` | **`none`** | — |
| `isLooping` | **`false`** | — |
| `fadeIn` | **0 ms** | Parte secco (un effetto deve essere immediato). |
| `fadeOut` | **0 ms** | **Taglio netto** a fine/stop. |
| `volume` | **1.0** | — |

> Codice: `addClip*` in `useProjectStore.ts` (ramo "else", tipi non music/preshow/asset → fade 0).

---

## 3. Comportamento nel mix

Gli SFX sono "indipendenti": il mix li tocca poco.

- **Voce attiva** → l'SFX si abbassa **a metà** (×0.5). *(Nota: è un fattore fisso 0.5, diverso dal `duckingFactor` usato per musica/asset.)*
- **Musica o stacco attivi** → **nessun effetto**: l'SFX resta a volume pieno (non viene mutato dalla Music Dominance).
- Altrimenti → volume pieno.

> Codice: ramo "else" (SFX/Others) in `evaluateMix`.

---

## 4. La regola speciale: gli SFX SOPRAVVIVONO al take-over

La colonna SFX è l'**unica eccezione** al take-over. Quando l'operatore lancia a mano un Asset/Jingle/Promo (che ferma tutto il resto, sottofondi in loop inclusi), **gli SFX continuano a suonare**.

> Codice: `getColumnForClip(...) === 'col-sfx'` esclusa dal ciclo `isTakeover` in `playClip`.

Rationale: gli effetti (jingle corti, stinger, applausi) devono poter coprire una sigla o uno stacco senza essere tagliati.

---

## 5. Riepilogo in una frase

> Gli **SFX** sono effetti immediati e indipendenti: partono e finiscono secchi, si abbassano solo sotto la voce (a metà), ignorano la musica, e **sopravvivono al take-over** (unica colonna che non viene mai fermata da una sigla/asset).

---

## 6. POLIFONIA — più effetti insieme (deciso 2026-06-30)

La colonna SFX è **esente dalla gestione conflitto intra-colonna**: più effetti possono suonare **contemporaneamente** (applauso + risata + stinger). Lanciare un secondo SFX **non ferma** il primo.

> Codice: condizione `columnId !== 'col-sfx'` nel blocco "Intra-Column Conflict" di `playClip`, `useAudioStore.ts`.

È l'unica colonna con questo comportamento: tutte le altre fermano la clip precedente nella stessa colonna quando ne parte una nuova.
