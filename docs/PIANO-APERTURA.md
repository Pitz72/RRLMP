# Piano di apertura del sorgente — checklist operativa

**Aperto:** 13 settembre 2026 · **Decisioni prese:** 13 settembre 2026
**Obiettivo:** ritirare Runtime Live Machine Pro dalla vendita, portarlo su `Pitz72/RRLMP` come
repository pubblico sotto licenza MIT, con le release pubblicate nello stesso repository.
**Stato:** decisioni prese · **FASE 1 CHIUSA** (13/09) · prossima: Fase 2.

> **Il modello è doppio.** Questa procedura ricalca i piani già eseguiti con successo da
> *Runtime TelegramBot Desktop Titan Edition* (12–13 agosto 2026) e *Runtime FeedDownloader Pro*
> (18 agosto 2026), entrambi in `docs/PIANO-APERTURA.md` dei rispettivi repository. Dove Live Machine
> Pro differisce è annotato.

> **Una fase per sessione.** Regola dell'utente: ogni fase si esegue in una sola sessione (anche più
> d'una, se serve); due fasi nella stessa sessione, no — salvo eccezione decisa dall'utente.

> Le voci marcate ⛔ sono blocchi veri: se le salti, qualcuno se ne accorge.

---

## Decisioni prese

| Decisione | Esito | Quando |
| :--- | :--- | :--- |
| Licenza | **MIT**, come Titan e FeedDownloader | 13/09 |
| Destinazione | **`Pitz72/RRLMP`**, il repository già esistente, **senza rinomina** | 13/09 |
| Metodo di trasferimento | **Push fast-forward** sul repository esistente: i suoi 163 commit sono tutti antenati del `master` attuale (stessa punta `9c65650`, v1.5.0). Va solo tolta l'archiviazione | 13/09 |
| Storia git | **Si conserva tutta**, senza riscrittura: il nuovo repository deve contenere lo storico completo dal 4 gennaio 2026. I file pesanti si tolgono solo dall'albero corrente, non dalla storia | 13/09 |
| Acquirenti | **Nessuno.** Il software non è mai stato venduto: lo hanno solo le persone a cui l'autore l'ha dato | 13/09 |
| Repo ponte `RRLMP-Releases` | **Traghetto obbligatorio, poi cancellata.** Le installazioni esistenti puntano lì e vanno portate sul nuovo repository | 13/09 |
| Numero di versione | **1.15.33** — nessun salto di MINOR senza motivo | 13/09 |
| macOS | **Tolto.** Nessun installer ufficiale: chi ha un Mac scarica il sorgente e compila da sé | 13/09 |
| Credito ai modelli | **Sì**, in software e documentazione (vedi sotto) | 13/09 |

### Credito ai modelli

**Elenco confermato dall'utente (13/09), in ordine di arrivo nel progetto:**

1. **Google Gemini 3.0**
2. **Google Gemini 3.1**
3. **Anthropic Claude Sonnet 4.6**
4. **Anthropic Claude Opus 4.7**
5. **Anthropic Claude Opus 4.8**
6. **Anthropic Claude Sonnet 5**
7. **Anthropic Claude Opus 5**
8. **Anthropic Claude Fable 5**

Riscontro sullo storico (trailer `Co-Authored-By`, 13/09): Sonnet 4.6 (60 commit), Opus 4.8 (40),
Fable 5 (38), Sonnet 5 (23), Opus 5 (22), Opus 4.7 (21). Gemini 3.0 e 3.1 non lasciano trailer
(fase iniziale del progetto, dal 4/1/2026). Dove lo spazio è poco (schermata di benvenuto) il
credito è abbreviato in «Gemini, Claude», come in FeedDownloader; l'elenco completo sta nel pannello
Info, nel README e nei manuali.

---

## Come l'hanno fatto Titan e FeedDownloader (verificato il 13/09)

| Aspetto | Titan / FeedDownloader | Live Machine Pro oggi |
| :--- | :--- | :--- |
| Repository | `Pitz72/<nome>` **pubblico** | `Ecosystem-Runtime/RRLMP` **privato** + `Ecosystem-Runtime/RRLMP-Releases` pubblico |
| Licenza | `LICENSE` **MIT** «© 2026 Simone Pizzi (Runtime Radio)», `license: MIT` in `package.json` | nessun `LICENSE`, `package.json` dice `ISC` |
| Release | nello **stesso repository**, `GITHUB_TOKEN` integrato (nessun PAT) | repo separata, secret `RELEASE_TOKEN` |
| File di progetto | `CONTRIBUTING.md`, `SECURITY.md`, template issue IT/EN, CI `verify` su pull request | assenti |
| README | storia + «ritirato dalla vendita e aperto sotto MIT» + stato «mantenuto per correzioni» + credito ai modelli + licenza | README tecnico |
| Licenza commerciale | EULA conservata in `docs/storico/` (Titan) | nessuna EULA; colophon dei manuali «Tutti i diritti riservati» |
| macOS | fuori | `.dmg` non firmato a ogni release → **da togliere** |
| Gumroad | chiuso (HTTP 404) | `livemachinepro` **attivo** (HTTP 200) |
| Sito Ecosystem | flag `openSource`, prezzo «Gratis», CTA → download GitHub | Live Machine Pro unico prodotto ancora a €9.99 |
| Repo ponte | Titan: traghetto poi cancellata · FeedDownloader: cancellata subito | `RRLMP-Releases`: **traghetto, poi cancellata** (come Titan) |
| Repo privata di origine | cancellata dopo backup `--mirror` | `Ecosystem-Runtime/RRLMP` |

---

## Audit preliminare (13/09, parziale)

- **Segreti nella storia: nessuno trovato.** Scansione su tutti i commit di `ghp_`, `github_pat_`,
  `gho_`, chiavi AWS e Google, chiavi private, token Slack e OpenAI: zero occorrenze. Il PAT che stava
  nell'URL del remote era solo in `.git/config` (mai committato) ed è stato spostato nel Gestore
  credenziali di Windows il 13/09.
- **Un solo autore** (`pizzisimone1972@gmail.com`, come «Pitz72» e «Simone»). Primo commit 4/1/2026.
- **Nessun tag.**
- ⚠️ **`.claude/settings.local.json` è tracciato** → togliere dal tracciamento prima di pubblicare
  (resta visibile nella storia: verificarne il contenuto nell'audit della Fase 2).
- ⚠️ **Branch stantii**: `claude/amazing-jemison` (3 commit non fusi, aprile) e `claude/eager-shockley`
  (1 commit non fuso, aprile), più 4 worktree in `.claude/worktrees/` → verificare che siano superati
  e ripulire. Si pubblica solo `master`.
- ⚠️ **`website` è un gitlink orfano** (modo 160000, nessun `.gitmodules`): in un clone pubblico
  appare come sottomodulo rotto. Il sito ha un suo repository → togliere il gitlink.
- ⚠️ **File pesanti tracciati**: `docs/assets/Runtime_Live_Machine_Pro.mp4` (31,7 MB),
  `docs/assets/Precision_Live_Control.pdf` (18,5 MB), `RRLMP.zip` (8,9 MB). Pack locale 371 MB,
  **30 PDF** distinti nella storia. Decisione: restano nella storia (storico integro), escono
  dall'albero corrente.
- ⚠️ **Testi proprietari**: colophon dei manuali in `manuale-utente/typst/lib/strings.typ`
  («Tutti i diritti riservati», «Nessuna parte… senza il previo consenso») e il vecchio
  `manuale-utente/build_manual_pdf.py`. I PDF già nella storia conservano quel colophon: è la
  testimonianza della fase commerciale, come l'EULA storica di Titan; il README lo dichiara.
- Riferimenti commerciali minori: commento Gumroad in `.gitignore`. Le altre occorrenze di
  «proprietario» nei manuali e nel codice sono usi tecnici.
- Fuori da git ma sul disco: `distribuzione/` e `DISTRIBUZIONE/` (1,2 GB, pacchetti Gumroad),
  `builds/` (17 GB).

---

## FASE 1 — Aprire formalmente il progetto ✅ CHIUSA (13/09)

- [x] ⛔ **`LICENSE`** — MIT, «Copyright (c) 2026 Simone Pizzi (Runtime Radio)», identica a Titan e
      FeedDownloader.
- [x] **`package.json`** — `license: MIT` (anche nel `package-lock.json`, prima `ISC`), `repository`
      e `homepage` → `https://github.com/Pitz72/RRLMP` (la `homepage` puntava ancora a GitLab),
      `private: true` come Titan: impedisce una pubblicazione accidentale su npm e non c'entra con la
      visibilità del repository. **`appId` volutamente invariato**: cambiarlo romperebbe
      l'aggiornamento delle installazioni esistenti.
- [x] **`SECURITY.md`** — in italiano come FeedDownloader: come segnalare, versioni supportate e
      **modello di sicurezza** (protocollo `media://`, validazione dei `.lmp`, marcatore dell'export,
      isolamento del renderer e CSP, link esterni, controllo remoto con PIN crittografico, limite
      10/5 min e controllo dell'origine, aggiornamenti con SHA-512, microfono, dati locali). Limiti
      dichiarati: controllo remoto in **HTTP in chiaro** sulla LAN, vulnerabilità nota di
      `music-metadata` con attenuazione, binari non firmati, macOS senza installer.
- [x] **`CONTRIBUTING.md`** — in inglese come FeedDownloader: setup, sviluppo su Windows e su
      Linux/macOS, regole del progetto (una patch per fix, changelog IT+EN cumulativi, due lingue,
      confine dei processi, Main-Side-Heavy, compatibilità `.lmp`, portabilità, link esterni, CRLF),
      test e typecheck, build, **compilazione su macOS**, manuale Typst, convenzioni di commit.
- [x] **Template issue** `bug_report.yml` e `feature_request.yml` in `.github/ISSUE_TEMPLATE/`, IT+EN,
      con l'avvertenza di non aprire issue pubbliche per le vulnerabilità e la nota sullo scopo
      (regia umana, non automazione 24h).
- [x] **CI** — `build.yml` accetta `pull_request` verso `master` e su quel trigger gira **solo** il nuovo
      job `verify` (typecheck ×4 + Vitest). `create-release` e le build partono solo su
      `workflow_dispatch` **e** dopo `verify` verde. Permessi del workflow ridotti a `contents: read`:
      nessun job scrive su questo repository (la pubblicazione usa il PAT verso il ponte fino alla
      Fase 3). YAML validato. Il job macOS è ancora presente: si toglie in Fase 3.
- [x] **Credito ai modelli, paternità e sostegno** — schermata di benvenuto: «Software libero · licenza
      MIT · di Simone Pizzi — Runtime Radio» e «scritto con l’ausilio di modelli linguistici (Gemini,
      Claude)» (prima: «Sviluppato da Simone Pizzi con Gemini 3.0»). Pannello **Info**: nuova sezione
      **«Il progetto»** con licenza, autore, **elenco completo degli otto modelli** e i pulsanti
      *Codice sorgente*, *Contatti*, *Offrimi un caffè*. Chiavi i18n nuove in IT ed EN (477 chiavi,
      parità verificata).
- [x] **Link esterni su elenco chiuso** — il canale IPC `open-external` accetta ora solo `https` verso
      `src/main/externalLinks.ts` (`github.com`, `raw.githubusercontent.com`,
      `simonepizzi.runtimeradio.it`, `runtimeradio.com`, `www.paypal.com`); prima accettava
      qualunque `http`/`https`. +8 test (host imitati, credenziali nell'URL, schemi pericolosi).
      Verificato in preview: i tre pulsanti aprono esattamente i tre indirizzi previsti.
      ⚠️ *Codice sorgente* sarà raggiungibile da tutti solo dopo la Fase 4.2.
- [x] **README** — riscritto in italiano sul modello di FeedDownloader: storia, ritiro dalla vendita,
      stato del progetto, caratteristiche aggiornate alla 1.15.32 (il vecchio README era fermo alla
      1.2.0), download Windows e Linux, macOS dal sorgente, stack, requisiti, sostegno, privacy,
      «Come è stato scritto» con tutti gli otto modelli, licenza.
- [x] **Igiene** — `.claude/settings.local.json` tolto dal tracciamento e aggiunto al `.gitignore`
      (il file resta sul disco). Eliminati 6 branch locali e 4 worktree: `claude/amazing-jemison`
      (v0.16.4–v0.17.0) e `claude/eager-shockley` (v1.2.1), non fusi ma superati da tutto ciò che è
      venuto dopo; gli altri quattro già contenuti in `master`. Le modifiche non committate dei
      worktree erano solo `settings.local.json` e un `package-lock.json`. Sul remoto esisteva già
      soltanto `master`.
- [x] Gate verde: `tsc` ×4 zero errori, Vitest **232/232** (+8).

> Da portare in Fase 2: restano tracciati `.claude/settings.json`, `.claude/launch.json` e
> `.claude/PROJECT_STATE.md` (quest'ultimo con indirizzi vecchi): valutarli nell'audit completo.

## FASE 2 — Documentazione, manuali e riordino

- [ ] **Colophon dei manuali** — `strings.typ` IT+EN: via «Tutti i diritti riservati», dentro MIT e
      credito ai modelli; rigenerare copertine e i due PDF, verificarli a video.
- [ ] **macOS nei manuali** — capitolo 2 (installazione): la sezione macOS diventa «compilare dal
      sorgente»; togliere i riferimenti al `.dmg` e a Gatekeeper per l'installer ufficiale (cap. 2,
      12, 14). Stessa correzione nella guida rapida in-app.
- [ ] **Guida rapida in-app** (`assets/quick-guide/it.md`, `en.md`) — riga di licenza.
- [ ] **Documentazione di progetto** — `docs/INDEX.md`, `docs/ROADMAP.md` (via le decisioni
      commerciali: Gumroad, «nessun ricarico»), `docs/VISION.md`, `relazione.md` (voce di apertura).
- [ ] **Riordino dell'albero corrente** (la storia resta intatta) — togliere il gitlink `website`,
      `RRLMP.zip`, il video e il PDF pesanti di `docs/assets/` (conservarli fuori da git se servono);
      ripulire `.gitignore` dai riferimenti Gumroad.
- [ ] **Cartelle locali commerciali** — `distribuzione/`, `DISTRIBUZIONE/`, `builds/`: eliminarle o
      archiviarle su decisione dell'utente (FeedDownloader ne ha tolti 2,56 GB).
- [ ] **Audit completo della storia** come FeedDownloader: estrazione integrale dei blob testuali di
      tutti i ref e scansione non campionaria (segreti, credenziali, dati personali). Serve a
      confermare che la storia **si pubblica così com'è**; se emergesse un segreto vero, ci si ferma e
      si decide con l'utente prima di qualunque riscrittura.

## FASE 3 — La release ponte e prima da progetto aperto (v1.15.33)

⛔ Va fatta **dopo la Fase 4.1–4.2**: `app-update.yml` nasce dalla configurazione di publish e deve già
puntare alla destinazione definitiva.

- [ ] `package.json → build.publish` → `Pitz72/RRLMP`.
- [ ] `build.yml` — release nello stesso repository con `GITHUB_TOKEN` (permessi `contents: write`
      solo nel job di release); via `RELEASE_TOKEN` e la repo esterna. Mantenere bozza → upload →
      publish. **Via il job macOS** e il `.dmg` dalla tabella download delle note.
- [ ] `src/main/updateManager.ts` — `RELEASES_API` → `Pitz72/RRLMP`.
- [ ] `src/renderer/src/utils/manualLinks.ts` — i PDF sono già versionati in
      `manuale-utente/typst/`: puntare a `github.com/Pitz72/RRLMP/raw/master/manuale-utente/typst/…`
      e verificare **HTTP 200 + SHA-256** contro le copie locali.
- [ ] Changelog `1.15.33.md` + `.en.md` aperti da **«Apertura del sorgente»**; se passa altro tempo
      dalla 1.15.32, cumulativi.
- [ ] Verificare lo **SHA-512** degli installer contro `latest.yml` / `latest-linux.yml`.
- [ ] ⛔ **Traghetto**: pubblicare **la stessa 1.15.33, con gli stessi binari, anche su
      `RRLMP-Releases`**. Le app fino alla 1.15.32 la vedono lì, la installano, e da quel momento
      cercano gli aggiornamenti su `Pitz72/RRLMP` (modello della release-ponte v1.2.4 di
      FeedDownloader). Le note sul ponte spiegano il passaggio e che macOS non ha più un installer.
- [ ] Collaudo sul campo: dalla 1.15.33 installata, la **1.15.34** deve arrivare da `Pitz72/RRLMP`.

## FASE 4 — GitHub

### 4.1 Trasferimento
- [ ] ⛔ **Backup**: `git clone --mirror` di `Ecosystem-Runtime/RRLMP` e di `Ecosystem-Runtime/RRLMP-Releases`.
- [ ] Togliere l'archiviazione a `Pitz72/RRLMP` (nessuna rinomina).
- [ ] Push di `master` **fast-forward**: lo storico completo, dal primo commit del 4/1/2026, arriva sul
      repository esistente senza forzature.
- [ ] Verifica con **clone pulito**: SHA identico al `master` locale, numero di commit, `git fsck --strict`.
- [ ] `Ecosystem-Runtime/RRLMP` resta privato e intatto come rete di sicurezza fino alla Fase 5.

### 4.2 Pubblicazione
- [ ] Repository **pubblico**; descrizione in inglese, sito, argomenti (`radio`, `broadcast`,
      `playout`, `electron`, `react`, `typescript`, `audio`, `open-source`).
- [ ] GitHub riconosce **MIT**; issue abilitate con i template.
- [ ] Nessun workflow parte con il push (trigger solo `workflow_dispatch` / `pull_request`).
- [ ] Ultimo controllo: nessun file di credenziali tracciato.

### 4.3 CI
- [ ] Matrice **Windows + Linux** (AppImage + deb), senza macOS, come Titan e FeedDownloader.

## FASE 5 — Dismissione della fase commerciale

- [ ] ⛔ **Gumroad** — chiusura di `pizzisimone.gumroad.com/l/livemachinepro` (a cura dell'utente);
      verificare HTTP 404.
- [ ] **Sito Ecosystem** (`SITI-WEB/ECOSYSTEM`): `components/LiveMachineLandingPage.tsx`,
      `constants.tsx`, `public/locales/{it,en}/translation.json`, `public/products-manifest.json`
      (prezzo 0, licenza MIT, JSON-LD), flag `openSource`, CTA d'acquisto → download da GitHub +
      «Codice sorgente». ⚠️ Con Live Machine Pro libero **non resta nessun prodotto a pagamento**:
      verificare che card del bundle e chiavi i18n commerciali si comportino bene a zero prodotti.
      Deploy via SFTP (`_SEGRETI/deploy.py`) e verifica sulla pagina live.
- [ ] Correggere sul sito i fatti scaduti (lingue: ora 2; versione; piattaforme: Windows + Linux).
- [ ] ⛔ **Repo ponte `RRLMP-Releases`** — cancellarla **solo dopo** la release traghetto e una
      finestra di migrazione: le persone a cui l'autore ha dato il programma devono aver aggiornato
      alla 1.15.33 (controllare i download sul ponte ed eventualmente chiedere). Prima: `--mirror` e
      inventario degli asset. Fino ad allora resta anche `manuals/` (lo aprono le app ≤ 1.15.32).
- [ ] **`Ecosystem-Runtime/RRLMP`** privato — cancellarlo dopo il backup, a Fase 4 verificata
      (FeedDownloader l'ha fatto il 19/08).
- [ ] Correggere i riferimenti residui a indirizzi vecchi (`.claude/PROJECT_STATE.md`,
      `compilazione-mac.txt`).
- [ ] Aggiornare lo standard `RUNTIME-DESKTOP-DISTRIBUTION-STANDARD.md` e le memorie di progetto.

---

## Cosa rende questa transizione diversa dalle altre due

- **Installazioni di terzi, anche se nessuna vendita.** Le poche persone a cui l'autore ha dato il
  programma si aggiornano da `RRLMP-Releases`: il traghetto serve (come Titan, a differenza di
  FeedDownloader).
- **macOS c'era già** come pacchetto non firmato: si toglie, e la documentazione deve dire come
  compilarlo.
- **Repository più pesante** (pack 371 MB, file binari nello storico, gitlink orfano): la storia si
  conserva per scelta, si pulisce solo l'albero corrente.
- **Integrazioni aperte** (StreamFlow, pulsante LIVE): documentate in `ROADMAP.md`; con il sorgente
  pubblico diventano visibili anche i riferimenti a Runtime Radio e AzuraCast — valutarli in Fase 2.
- **I manuali sono già a posto** (revisionati e ricompilati il 13/09 per la 1.15.32): in Fase 2 bastano
  colophon e sezione macOS.
