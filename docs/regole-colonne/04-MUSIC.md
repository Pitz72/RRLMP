# Regole Colonna 4 — CANZONI DELL'EPISODIO (Music)

> Documento di riferimento **canonico** sul comportamento delle clip nella colonna Musica.
> Versione software di riferimento: **v1.5.1** — ultima verifica codice: 2026-06-30.

---

## 1. Identità della colonna

| Proprietà | Valore |
|---|---|
| Titolo | **CANZONI DELL'EPISODIO** |
| ID interno | `col-music` |
| Tipo (`type`) | `music` |
| Colore | Rosso `#EF4444` |
| Posizione | 4ª colonna |
| Bus audio | **Music bus** |

> Codice: `DEFAULT_COLUMNS` in `useProjectStore.ts`; routing in `getBusForType` (`useAudioStore.ts`).

---

## 2. Default della clip al caricamento

| Parametro | Valore | Significato |
|---|---|---|
| `nextAction` | **`stop`** | A fine brano **si ferma**. **NON** parte il brano successivo da solo. |
| `behavior` | **`normal`** | — |
| `duckingRole` | **`target`** | (Vedi ⚠️ Anomalia A1 in fondo: oggi questo campo non agisce sul mix.) |
| `isLooping` | **`false`** | — |
| `fadeIn` | **0 ms** | Parte secca. |
| `fadeOut` | **2000 ms** | Sfuma in **2 secondi** a fine/stop (la più morbida di tutte le colonne). |
| `volume` | **1.0** | — |

> Codice: `addClip*` in `useProjectStore.ts` (ramo `type === 'music'`).

**Conseguenza chiave — lo show è manuale.** Le canzoni **non si concatenano** automaticamente: l'operatore lancia ogni brano a mano. L'auto-avanzamento (`play_next`) è esclusivo della PRE-SHOW. Questo è coerente con la filosofia "show 100% manuale".

---

## 3. Comportamento nel mix

Una clip Musica è un **`target` di ducking**: si abbassa quando emerge qualcosa di più prioritario.

- **Voce attiva** (clip voice o microfono Smart) → la musica si **abbassa** (ducking, `volume × duckingFactor`).
- **Stacco attivo** (un asset con `behavior: stacco`) → la musica si **abbassa**.
- Altrimenti → **volume pieno**.

> Codice: ramo `clip.type === 'music' || clip.type === 'preshow'` in `evaluateMix`.

**Effetto della musica sulle altre colonne:** quando una clip Musica è in onda, gli **asset/sottofondi vanno a muto** (regola "Music Dominance" — vedi ⚠️ Anomalia A3). La voce e gli SFX non sono toccati da questo (la voce resta piena, gli SFX seguono la loro regola).

---

## 4. Lancio, transizioni e interazioni

- **Lancio a mano**: ferma l'eventuale altra clip Musica in onda nella stessa colonna (gestione conflitto intra-colonna "normale"). Una clip in crossfade/segue è esclusa (la sua transizione è già in corso).
- **NON fa take-over**: il take-over è esclusivo di Assets/Jingle/Promo. Lanciare una canzone non azzera la regia.
- **Annulla la ripresa PRE-SHOW**: lanciare una canzone significa che lo show prende il comando → un'eventuale ripresa della rotazione PRE-SHOW pendente viene annullata.
- **Transizioni**: se imposti `nextAction: play_next` su una clip, vale il tipo di transizione della clip; fuori dalla PRE-SHOW il default è **gapless**.
- **Omologazione loudness**: se attiva nelle Impostazioni, il guadagno LUFS statico viene applicato (clamp ±9 dB).

---

## 5. Riepilogo in una frase

> Le **canzoni** non si concatenano da sole (show manuale), sfumano in 2 s, si abbassano sotto voce e stacchi, e quando suonano mandano a muto i sottofondi. Non fanno take-over.

---

## 6. Note di mix risolte (2026-06-30)
- **A1 (chiuso)** — il campo `duckingRole` è stato **rimosso dalla UI** (non era letto dal mix). Il livello di ducking si regola **globalmente** in Impostazioni → *Riduzione ducking*.
- **A3 (confermato)** — sotto la musica i sottofondi vanno a **zero** e **tornano** con rialzo sfumato a fine brano. È il comportamento voluto.
