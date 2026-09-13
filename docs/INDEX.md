# RRLMP — Centro Documentazione

**Software:** Runtime Live Machine Pro · **versione corrente 1.15.15**
**Repo codice:** `Ecosystem-Runtime/RRLMP` · **Repo rilasci pubblici:** `Ecosystem-Runtime/RRLMP-Releases`
*Indice aggiornato: 2026-07-28*

Punto di ingresso unico alla documentazione del progetto. Ogni voce dice **a cosa serve** e **quanto è aggiornata**, così non serve aprire un file per scoprire che è fermo a due anni fa.

---

## 🚦 Da leggere per primo

| Documento | A cosa serve | Stato |
|---|---|---|
| [Revisione codice 2026-07-28](./technical/REVISIONE-CODICE-2026-07-28.md) | Criticità aperte del codice, classificate per gravità con file:riga e fix proposto | ✅ **allineato a 1.15.15** |
| [Roadmap & Backlog](./ROADMAP.md) | Cosa c'è da fare adesso, cosa è sospeso, cosa è chiuso | ✅ **allineato a 1.15.15** |
| [Regole per colonna](./regole-colonne/README.md) | Il comportamento di ogni colonna in regia — **fonte di verità del motore** | ✅ allineato a 1.15.15 |
| [Relazione tecnica](../relazione.md) | Storico fix versione per versione | ⚠️ intestazione ferma a 1.11.5 |

---

## 🛠️ Area tecnica (sviluppo)

### Architettura e visione
- **[Architettura](./ARCHITECTURE.md)** — modello dei processi (main/preload/renderer), strategia "Main-Side-Heavy", store Zustand, motore di playback, API IPC.
  ⚠️ Il corpo del documento è scritto sulla v1.2.2; in testa c'è la **mappa dei sottosistemi aggiunti dopo** (fino alla 1.15.15) con i file di riferimento.
- **[Visione tecnica](./VISION.md)** — filosofia del progetto e pilastri tecnologici. Contenuto ancora valido (la regola "nessuna automazione dello show, eccezione controllata PRE-SHOW" è tuttora il principio guida).

### Comportamento del motore
- **[Regole per colonna](./regole-colonne/)** — un documento per colonna (`01-ASSETS` … `07-PRESHOW`) più il [README](./regole-colonne/README.md) di riepilogo. Fissano su carta take-over, ducking, polifonia FX, loop e rotazione. **Da consultare prima di toccare `useAudioStore.ts`.**
- **[Design Jingle & Promo / rotazione PRE-SHOW](./design/jingle-promo-preshow.md)** — progettazione della rotazione in stile "once per X songs".
- **[Automix — validazione A3](./automix/VALIDAZIONE-A3.md)** — misure di rilevamento BPM su musica reale, da cui viene la soglia di confidence 0.5 del motore automix.

### Storico
- **[Changelog](./changelogs/README.md)** — come è organizzato l'archivio dei changelog (**leggere il README prima di cercare un file**: la cartella `current/` non contiene solo le versioni recenti) e il vincolo con la CI di rilascio.
- **[Archivio documenti strategici](./archive/)** — piani e analisi storiche conservati per contesto, **non più validi come riferimento operativo**:
  - `roadtov1.0.0.md` — piano verso la 1.0.0
  - `piano-post-release-v1.2.2.md` — piano post-release (ex "RUNTIME LIVE MACHINE PRO - POST REL")
  - `test-regia-v1.11.4.md` — checklist di test della 1.11.4
  - `integrazione-interfaccia-v1.0.0.md` — analisi del prototipo di interfaccia
  - `input-recording-implementation-v1.0.0.md` — analisi input audio e registrazione di sessione
- **[Analisi e report tecnici](./technical/)** — revisioni del codice, analisi forensi dei crash, report di build.
- `automix/PROMPT-SESSIONE-AUTOMIX.md` — documento di lavoro della feature Automix (fasi A-D, ormai completate). Storico: resta al suo posto perché citato dai changelog 1.10.14/1.10.15/1.11.0.

---

## 📖 Area utente (operatori broadcast)

Il **manuale utente** esiste in **due lingue: italiano e inglese** (decisione del 2026-07-22 — le altre sei lingue sono state rimosse; dalla 1.15.32 anche l'interfaccia dell'app e la guida rapida in-app sono solo in italiano e inglese).

- **Sorgenti markdown:** [`manuale-utente/it/`](../manuale-utente/it/) · [`manuale-utente/en/`](../manuale-utente/en/) — 14 capitoli + INDICE
- **PDF compilati:** `manuale-utente/typst/Manuale-Utente-IT.pdf` · `manuale-utente/typst/User-Manual-EN.pdf`
- **Pubblicati per il download in-app:** `RRLMP-Releases/manuals/` (branch `master`), raggiunti dal pulsante "Manuale" tramite `utils/manualLinks.ts`
- **Guida rapida in-app:** `src/renderer/src/assets/quick-guide/` — **italiano e inglese**, mostrata dalla `QuickGuideModal`

Build del manuale: `manuale-utente/typst/build.ps1 -All` (rigenera i capitoli e compila entrambi i PDF); copertine da `branding/build-cover.py`.

---

## 🚀 Avvio rapido per sviluppatori

```bash
npm install
npm run dev
```

Prima di modificare il motore audio, leggere **[Architettura](./ARCHITECTURE.md)** e **[Regole per colonna](./regole-colonne/)**.

**Controlli obbligatori prima di ogni commit** (baseline attuale: tutti verdi):

```bash
npx tsc --noEmit -p tsconfig.json && npx tsc --noEmit -p tsconfig.main.json && npx tsc --noEmit -p tsconfig.preload.json && npx vitest run
```

Baseline di riferimento: **0 errori TypeScript sui 3 progetti** e **172/172 test Vitest verdi**.

### Convenzioni di progetto

- **SemVer stretto**: PATCH per ogni build di test e ogni step atomico; MINOR solo a feature dichiarata completa; MAJOR riservato al salto Tauri/Rust. Il numero di versione **non si abbassa mai** (l'updater confronta `remoto > corrente`).
- **Un commit per step**, con changelog in `docs/changelogs/current/<versione>.md` e riga corrispondente in `relazione.md`.
- **Il changelog della versione diventa le note di rilascio**: `.github/workflows/build.yml` legge `docs/changelogs/current/<versione>.md` e lo usa come corpo della release — quindi va scritto per l'utente finale, non solo per lo sviluppatore.
- **Ciclo di rilascio**: eliminare la release precedente (`gh release delete vX.Y.Z --cleanup-tag --yes`) **prima** di pubblicare la nuova; poi `gh workflow run build.yml -f publish_release=true`.
- `builds/`, `node_modules/`, `distribuzione/` non si committano mai.
