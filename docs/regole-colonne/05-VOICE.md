# Regole Colonna 5 — VOCI / PREREGISTRAZIONI (Voice)

> Documento di riferimento **canonico** sul comportamento delle clip nella colonna Voci.
> Versione software di riferimento: **v1.5.1** — ultima verifica codice: 2026-06-30.

---

## 1. Identità della colonna

| Proprietà | Valore |
|---|---|
| Titolo | **VOCI / PREREGISTRAZIONI** |
| ID interno | `col-voice` |
| Tipo (`type`) | `voice` |
| Colore | Arancione `#F97316` |
| Posizione | 5ª colonna |
| Bus audio | **Voice bus** |

> Codice: `DEFAULT_COLUMNS` in `useProjectStore.ts`; routing in `getBusForType`.

---

## 2. Default della clip al caricamento

| Parametro | Valore | Significato |
|---|---|---|
| `nextAction` | **`stop`** | A fine clip si ferma. Non concatena. |
| `behavior` | **`normal`** | — |
| `duckingRole` | **`source`** | È la sorgente del ducking: la sua presenza abbassa gli altri (vedi ⚠️ A1: oggi il *type* `voice` fa già questo, il campo in sé non agisce). |
| `isLooping` | **`false`** | — |
| `fadeIn` | **0 ms** | Parte secca. |
| `fadeOut` | **0 ms** | **Taglio netto** a fine/stop (nessuna dissolvenza). |
| `volume` | **1.0** | — |

> Codice: `addClip*` in `useProjectStore.ts` (ramo `type === 'voice'`).

---

## 3. Comportamento nel mix — la voce comanda

La Voce è in cima alla gerarchia del ducking.

- **La voce è SEMPRE a volume pieno**, non viene mai abbassata da nessuno.
- Quando una clip Voce è in onda, **abbassa**: la musica, la PRE-SHOW, gli asset/sottofondi (ducking) e gli **SFX** (a metà, ×0.5).

> Codice: ramo `clip.type === 'voice'` in `evaluateMix` (sempre nominale); `isVoiceActive` pilota il ducking di tutti gli altri rami.

**Microfono Smart = voce.** Quando il microfono Smart Ducking è attivo, vale come una clip Voce (`isVoiceActive` include `_isMicActiveGlobal`): abbassa musica/asset/SFX esattamente come una preregistrazione vocale.

> Codice: `setMicActive` / `_isMicActiveGlobal` in `useAudioStore.ts`; nota in `MicManager.ts`.

---

## 4. Lancio e interazioni

- **Lancio a mano**: ferma l'eventuale altra clip Voce in onda nella stessa colonna (gestione conflitto intra-colonna "normale").
- **NON fa take-over**: lanciare una voce non azzera la regia (la musica/asset si abbassano, non si fermano).
- **Annulla la ripresa PRE-SHOW**: come la musica, lanciare una voce = lo show prende il comando → ripresa rotazione PRE-SHOW pendente annullata.

---

## 5. Riepilogo in una frase

> La **Voce** è la regina del mix: sempre a volume pieno, taglio netto in chiusura, e mentre parla abbassa tutto il resto (musica, sottofondi, SFX). Il microfono Smart si comporta come una voce.

---

## 6. Note di mix risolte (2026-06-30)
- **A1 (chiuso)** — il campo `duckingRole` è stato **rimosso dalla UI** (non era letto dal mix; la priorità della voce deriva dal `type`). Il livello di ducking si regola **globalmente** in Impostazioni → *Riduzione ducking*.
