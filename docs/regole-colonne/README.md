# Regole delle Colonne — Indice

Documenti di riferimento **canonici** sul comportamento delle clip in ogni colonna di Runtime Live Machine Pro. Servono a fissare su carta regole codificate e verificate sul codice, per evitare fraintendimenti tra ciò che il software fa e ciò che ci si aspetta.

Ogni documento riporta i riferimenti puntuali al codice (`useProjectStore.ts`, `useAudioStore.ts`, ecc.) così da poter verificare e aggiornare ogni regola.

> Versione software di riferimento: **v1.5.1** — ultima verifica codice: 2026-06-30.

## Le 7 colonne (da sinistra a destra)

| # | Documento | Colonna | ID | Tipo | Regola in una riga |
|---|---|---|---|---|---|
| 1 | [01-ASSETS.md](01-ASSETS.md) | SHOW ASSETS | `col-assets` | `asset` | Stacco/sigla one-shot. A mano fa take-over (ferma tutto tranne SFX, **chiude** anche i loop). |
| 2 | [02-JINGLE.md](02-JINGLE.md) | JINGLE | `col-jingle` | `asset` | Solo regola jingle, pre-configurato. A mano = take-over, **ma abbassa** i loop (non li chiude). Sorgente rotazione PRE-SHOW. |
| 3 | [03-PROMO.md](03-PROMO.md) | PROMO | `col-promo` | `asset` | Identica a JINGLE. Seconda sorgente della rotazione PRE-SHOW. |
| 4 | [04-MUSIC.md](04-MUSIC.md) | CANZONI DELL'EPISODIO | `col-music` | `music` | Non si concatena (show manuale), fadeOut 2 s, si abbassa sotto voce/stacco, azzera i sottofondi. |
| 5 | [05-VOICE.md](05-VOICE.md) | VOCI / PREREGISTRAZIONI | `col-voice` | `voice` | Sempre a volume pieno, abbassa tutto il resto. Il microfono Smart = voce. |
| 6 | [06-SFX.md](06-SFX.md) | SFX / CARTWALL | `col-sfx` | `sfx` | **Polifonia** (più effetti insieme), si abbassa solo sotto voce (a metà), **sopravvive al take-over**. |
| 7 | [07-PRESHOW.md](07-PRESHOW.md) | PRE-SHOW | `col-preshow` | `preshow` | Unica colonna automatica: playlist gapless + rotazione jingle/promo (default spenta). |

## Concetti trasversali

- **Take-over** — il lancio *a mano* (gesto operatore, non automatico) di un asset/jingle/promo non-loop ha priorità su tutto. Ferma ciò che è in onda tranne gli **SFX**. Sui **sottofondi in loop**: la **sigla SHOW ASSET li chiude**, mentre **jingle/promo li abbassano** e li fanno tornare a fine clip.
- **Gerarchia del mix (ducking)** — Voce/microfono in cima (abbassa tutti), poi musica/PRE-SHOW, poi asset/sottofondi. Lo "stacco" (asset con `behavior: stacco`) abbassa musica e azzera gli altri asset. Il **livello** di ducking è globale: Impostazioni → *Riduzione ducking*.
- **Sottofondo in loop** — l'ultimo gradino: si avvia a mano, non annulla nulla, si abbassa a zero sotto canzoni e jingle e poi **rientra con rialzo sfumato**, e si chiude solo con la sigla finale (SHOW ASSET) o con uno STOP.
- **Filosofia "show manuale"** — solo la PRE-SHOW si auto-concatena (riempitivo). Tutte le altre colonne richiedono il lancio dell'operatore.
