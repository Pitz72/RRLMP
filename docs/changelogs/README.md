# Changelog — come è organizzato questo archivio

*Aggiornato: 2026-07-28 — versione corrente 1.15.15*

La cartella si è stratificata nel tempo e i nomi non dicono più quello che sembrano dire. Questa è la mappa reale.

## ⚠️ Il nome `current/` è storico, non descrittivo

`current/` **non** contiene "solo le versioni recenti": contiene **un file per versione dalla 0.10.0 in poi**, incluse tutte le 1.x. È l'archivio principale e completo del progetto moderno.

| Percorso | Cosa contiene davvero |
|---|---|
| `current/<versione>.md` | Un file per versione, **dalla 0.10.0 alla 1.15.15**. ~250 file. È qui che si scrive il changelog di ogni nuova versione. |
| `archive/<versione>.md` | Un file per versione, **dalla 0.0.1 alla 0.9.20** (incluse le build `0.0.5fix1`…`fix13`). Preistoria del progetto. |
| `0.0.md` … `0.15.md` | Riepiloghi **aggregati per minor**, scritti a suo tempo in parallelo ai file per-versione. Si sovrappongono in parte al contenuto di `archive/` e `current/`. Storici, non si aggiornano più. |

## 🔗 Vincolo con la CI — non spostare i file di `current/`

`.github/workflows/build.yml` costruisce le note di rilascio leggendo:

```
docs/changelogs/current/<numero-versione>.md
```

Il file viene concatenato nel corpo della release pubblicata su `RRLMP-Releases`, ed è **esattamente il testo che l'auto-updater mostra nel popup di aggiornamento agli utenti**.

Conseguenze pratiche:

1. **Il percorso `docs/changelogs/current/` non va cambiato** senza aggiornare il workflow.
2. **Il file va scritto per l'utente finale**, non solo per lo sviluppatore: è il testo che legge chi riceve l'aggiornamento.
3. Se una versione viene sviluppata ma **non rilasciata**, il changelog della versione successiva deve essere **cumulativo** — includere anche le novità di quella saltata, altrimenti chi si aggiorna non le vede mai. È il pattern usato per 1.15.13 (che includeva 1.15.11-12) e per 1.15.15 (che include 1.15.14).

## Come si scrive un changelog nuovo

1. Creare `current/<nuova-versione>.md` (stesso formato dei file recenti: titolo, sezioni per fix/feature, "File modificati").
   **Dalla 1.15.31 le note di rilascio sono bilingui:** creare anche `current/<nuova-versione>.en.md`, traduzione inglese dello stesso file. La CI la accoda dopo l'italiano; se manca, la release esce solo in italiano con un warning nel log.
2. Aggiungere la riga corrispondente nella tabella storica di [`relazione.md`](../../relazione.md).
3. Aggiornare `package.json` **prima** della build (mai due build di test con lo stesso numero).

## Riorganizzazione non fatta, e perché

Unificare i tre livelli (aggregati / `archive` / `current`) sarebbe ordinato ma comporterebbe: rompere i link interni presenti in decine di changelog storici, rompere `relazione.md`, e soprattutto toccare un percorso da cui dipende la pipeline di rilascio. Il costo supera il beneficio: **questo README è la riorganizzazione**, il resto resta dov'è.
