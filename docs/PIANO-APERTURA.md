# Piano di apertura del sorgente — checklist operativa

**Aperto:** 13 settembre 2026 · **Decisioni prese:** 13 settembre 2026
**Obiettivo:** ritirare Runtime Live Machine Pro dalla vendita, portarlo su `Pitz72/RRLMP` come
repository pubblico sotto licenza MIT, con le release pubblicate nello stesso repository.
**Stato:** decisioni prese · **FASI 1, 2, 4.1 e 4.2 CHIUSE** (13/09) · **`Pitz72/RRLMP` è pubblico** · prossima: Fase 3 (release ponte 1.15.33), che chiude anche la 4.3.

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

## FASE 2 — Documentazione, manuali e riordino ✅ CHIUSA (13/09)

> Eseguita nella stessa sessione della Fase 1, su via esplicito dell'utente.

- [x] ⛔ **Audit completo della storia** — **277 commit** su tutti i ref, **2.538 blob unici**, di cui
      **2.342 testuali (49,6 MB) estratti e scansionati per intero**, non a campione.
      **Verdetto: pubblicabile senza riscrivere niente.**
      - **Zero segreti**: nessun token GitHub/GitLab, chiave AWS o Google, token Slack, Telegram,
        OpenAI/Anthropic, chiave privata, JWT, chiave Stripe, password assegnata, URL con
        credenziali o header `Authorization`, in nessuna versione di nessun file.
      - **Nessun file con nome sensibile** mai esistito (`.env`, `secret`, `credential`, `.pem`,
        `.key`, `.npmrc`…). Anche le versioni storiche di `.claude/settings.local.json` sono pulite.
      - **Email**: solo `pizzisimone1972@gmail.com` (autore) e `info@runtimeradio.it` (contatto
        pubblico); l'unica altra è l'URL finto `github.com@evil.example` del test dei link.
      - **Nessun numero di telefono.** Gli IPv4 sono indirizzi di rete locale d'esempio
        (`192.168.1.x` della demo e dei test) o numeri di versione scambiati per indirizzi.
      - **Un solo autore**, con due nomi (`Pitz72` e `Simone`) e la stessa email.
- [x] **Colophon dei manuali** — `strings.typ` IT+EN: al posto di «Tutti i diritti riservati» e del
      divieto di riproduzione, «Software libero, rilasciato sotto licenza MIT» e la licenza del
      manuale stesso; credito agli otto modelli e indirizzo del codice. Riga di copyright allineata al
      file `LICENSE`: «© 2026 Simone Pizzi (Runtime Radio)» (prima «Ecosystem.Runtime / Simone Pizzi»).
      I due PDF sono stati ricompilati (IT 49 pagine, EN 48) e verificati sul testo e a video.
- [x] **macOS nei manuali** — cap. 2: requisiti «compilando dal sorgente», via la frase su Apple
      Silicon, **nuovo paragrafo 2.3 «macOS: compilare dal sorgente»** (Node.js 20, comandi di build,
      Gatekeeper sul pacchetto non firmato, niente aggiornamenti automatici). Cap. 12: il `.deb` e
      macOS separati. Cap. 14: FAQ e avvio. INDICE aggiornato. IT ed EN.
- [x] **Distribuzione nei manuali** — cap. 2: gli installer si scaricano dalla pagina **Releases** su
      GitHub (prima «canale di distribuzione ufficiale»); la nota su SmartScreen dice ora il vero
      motivo: installer non firmati con un certificato commerciale.
- [x] **Guida rapida in-app** IT+EN — riga di licenza e indirizzo del codice, «Novità» riscritte
      (erano ferme alla 1.15.10), macOS dal sorgente, via Apple Silicon, piè di pagina «progetto di
      Runtime Radio — software libero, licenza MIT».
- [x] **Documentazione di progetto** — `docs/INDEX.md` (sezione «Progetto aperto» con LICENSE,
      SECURITY, CONTRIBUTING e README; questo piano fra i documenti da leggere per primi; comandi e
      baseline aggiornati a 4 typecheck e 232 test), `docs/ROADMAP.md` (via la riga Gumroad e la
      regola «nessun ricarico», dentro lo stato dell'apertura), `docs/VISION.md` (piattaforme).
      La voce in `relazione.md` arriva con la 1.15.33 in Fase 3, perché la tabella è per versione.
- [x] **Riordino dell'albero corrente** (la storia resta intatta):
      - via `RRLMP.zip`, `ts_error.txt` (errore di compilazione della 0.11.0), `tmp/check_binaries.js`,
        `.gitlab-ci.yml` (CI del periodo GitLab), `manuale-utente/build_manual_pdf.py` (pipeline PDF
        dismessa, conteneva il vecchio colophon) e `.claude/PROJECT_STATE.md` (fermo alla 0.16.2, con
        gli indirizzi GitLab);
      - via il **gitlink orfano `website`** (la cartella resta sul disco, ora ignorata);
      - `compilazione-mac.txt` spostato in `docs/archive/compilazione-mac-v1.0.0.txt`, superato da
        `CONTRIBUTING.md`;
      - da `docs/assets/` tolti 12 file promozionali mai citati dalla documentazione (video 31,7 MB,
        PDF 18,5 MB, immagini di marketing): copiati in `MATERIALE/docs-assets/`, fuori da git come in
        FeedDownloader. Restano `banner.png` (README) e `icon.png` (citata da un changelog);
      - `.gitignore`: via il riferimento a Gumroad, dentro `MATERIALE/` e `website/`.
      Restano tracciati `.claude/settings.json` e `.claude/launch.json`: innocui e utili a chi usa
      Claude Code sul progetto.
- [ ] **Cartelle locali commerciali** — `distribuzione/` (1,2 GB; su Windows è la stessa cartella di
      `DISTRIBUZIONE/`) e `builds/` (17 GB), fuori da git: **in attesa della decisione dell'utente**
      se eliminarle o archiviarle.
- [x] Gate verde: `tsc` ×4 zero errori, Vitest 232/232.

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

### 4.1 Trasferimento ✅ CHIUSA (13/09)
- [x] ⛔ **Backup** in `C:\Users\Utente\Documents\BACKUP-RRLMP-2026-09-13\`, tutti con `git fsck --strict`
      pulito: `Ecosystem-Runtime_RRLMP.git` (278 commit, 148 MB), `Ecosystem-Runtime_RRLMP-Releases.git`
      (3 commit, manuali inclusi, 31 MB) e `Pitz72_RRLMP.git` (278 commit). Più l'inventario degli asset
      della v1.15.32 sul ponte (`RRLMP-Releases_asset-inventario.tsv`) e le sue note di rilascio.
      I binari delle release non sono nel backup git: si rigenerano dal tag con la CI, e prima di
      cancellare il ponte (Fase 5) va deciso se scaricarli.
- [x] Tolta l'archiviazione a `Pitz72/RRLMP` (nessuna rinomina).
- [x] Push di `master` **fast-forward** `9c65650..fbe4e6f`: 115 commit nuovi in coda ai 163 già presenti.
- [x] Verifica con **clone pulito**: SHA `fbe4e6f` identico al `master` locale, 278 commit in entrambi,
      primo commit 4/1/2026, `git fsck --strict` pulito, `LICENSE` MIT presente. Nessun workflow partito.
- [x] Pulizia locale su decisione dell'utente: svuotata `builds/` (17 GB) ed eliminata `distribuzione/`
      con i pacchetti Gumroad (1,2 GB).
- [x] `Ecosystem-Runtime/RRLMP` resta privato e intatto come rete di sicurezza fino alla Fase 5.

### 4.2 Pubblicazione ✅ CHIUSA (13/09)
- [x] Repository **pubblico**. Descrizione in inglese sul modello di FeedDownloader («Live radio
      playout and show-control for podcasts, web radio and live events. Electron + React + FFmpeg.
      Free software, MIT licence.»), sito `https://runtimeradio.com`, argomenti `radio`, `broadcast`,
      `playout`, `podcast`, `live-audio`, `electron`, `react`, `typescript`, `ffmpeg`, `audio`,
      `open-source`. Wiki disattivata.
- [x] GitHub riconosce **MIT** (API `license` → `spdx_id: MIT`, dopo circa un minuto di propagazione).
- [x] **Accesso anonimo verificato**, senza nessuna credenziale: pagina del repository, `LICENSE` e PDF
      del manuale in raw (HTTP 200), `git ls-remote` e clone anonimo sullo SHA `fbe4e6f`. Nel primo
      minuto dopo il cambio di visibilità il protocollo git rispondeva ancora 401: è la propagazione.
- [x] Issue abilitate; i due moduli `.github/ISSUE_TEMPLATE/*.yml` sono pubblicati e validi. GitHub
      non li conta nel profilo della community né li elenca via GraphQL: succede identico su
      FeedDownloader (profilo al 71% in entrambi), perché quei controlli vedono solo i modelli Markdown.
      Pagina della politica di sicurezza attiva (`/security/policy`, HTTP 200).
- [x] Nessun workflow partito con il push o con il cambio di visibilità (trigger solo
      `workflow_dispatch` / `pull_request`); registrato solo `Build and Release`.
- [x] Ultimo controllo: nessun file di credenziali tracciato nell'albero pubblicato.

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
