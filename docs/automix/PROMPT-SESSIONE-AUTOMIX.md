# PROMPT — Sessione "Automix Section" (+ preliminari UI)

> **Come usare questo documento**: incollare/riferire a Claude a inizio sessione:
> *"Leggi docs/automix/PROMPT-SESSIONE-AUTOMIX.md e procedi secondo quel piano."*
> Scritto il 2026-07-02 (v1.10.14) al termine dell'iterazione dev sulla jingle machine.

---

## Contesto (stato al 2026-07-02)

- **Versione**: 1.10.14, master locale (⚠️ verificare se i commit della giornata sono stati pushati; al 2026-07-02 NON lo erano).
- **Suite**: Vitest 101/101, typecheck 0 su main/preload/renderer. Metodo di lavoro: **atomico** — 1 step = 1 patch SemVer + changelog in `docs/changelogs/current/` + riga in `relazione.md` (header + tabella STORICO FIX) + 1 commit (`git commit -F .git/COMMIT_MSG_TMP.txt` per gli accenti). Typecheck + Vitest verdi a OGNI step.
- **Vincolo assoluto** (memoria `stile-e-feedback`): stabilità > funzionalità; leggere SEMPRE il file prima di toccarlo; niente refactoring non richiesti.
- **Architettura**: Electron 28 (Chromium 120) + React 18 + Zustand. **Main-Side-Heavy**: FFmpeg SOLO nel main; il renderer NON decodifica mai interi file audio in memoria (storico crash OOM). Audio via protocollo `media://` + `StreamPlayer` (HTMLAudioElement → MediaElementSource → bus Web Audio).
- **BPM già disponibile** (v1.8.0 + fix precisione v1.10.14): `src/main/bpmDetection.ts` (inviluppo energia 50Hz + autocorrelazione + interpolazione parabolica del picco → errore <0.5 BPM su beat regolari), IPC `detect-bpm` (concorrenza 2, timeout 25s), campi clip `bpm`/`bpmChecked` persistiti nel `.lmp`, badge su ClipCard (solo colonna Music).
- **Esclusi da questa sessione** (decisione utente 2026-07-02): mappatura canali mixer e Controllo Remoto/Android — si fanno ALLA FINE, dopo tutto il resto.

---

## Ordine dei lavori della sessione

### Task 1 — Impostazioni e Impostazioni Clip a DUE COLONNE (solo layout)

Le modali sono già state allargate in v1.9.5 (`.settings` 1240px, `.clipset` 1000px) ma il contenuto resta a colonna singola → tanto scroll verticale e spazio orizzontale sprecato.

- **Obiettivo**: nelle tab di `GeneralSettingsModal` e nelle sezioni di `ClipSettingsModal`, disporre i campi su 2 colonne dove le opzioni sono indipendenti tra loro (grid `grid-cols-2` con `gap`); le sezioni "larghe" per natura (waveform editor, tabella colonne del layout regia) restano a colonna piena.
- **Vincoli**: SOLO presentazione, zero logica; occhio agli `useEffect`/focus esistenti; ESC e guard invariati. Verificare che a 95vw su schermi piccoli il grid collassi bene (eventuale `md:grid-cols-2`).
- 1 patch (o 2: una per modale), verifica in dev dell'utente.

### Task 2 — Verifica spazio topbar dopo "RLM PRO"

- **Obiettivo**: controllare che con brand compattato (v1.9.7) + versione (v1.10.7) + toggle FX (badge incluso) + undo/redo + 6 pulsanti file + STOP ALL + VU + timer, la topbar NON vada stretta alle risoluzioni reali di regia (utente: portatile, verificare anche ~1366px).
- Se stretta: l'idea già annotata è **raggruppare i 6 pulsanti file** (nuovo/salva/salva-come/carica/M3U/export) in un menu a tendina. Decidere CON l'utente prima di implementare.
- Possibile esito: "va bene così" → chiudere con nota, zero codice.

### Task 3 — AUTOMIX SECTION (il piatto forte)

**Visione dell'utente (parole sue, 2026-07-02)**: *"lo speaker ha un elenco di canzoni che richiedono un mix automatizzato, come una classifica di brani; serve una sezione proprio diversa del software, una sorta di nuova interfaccia simile a Mixxx dove la colonna canzoni viene riportata con l'elenco completo; lo speaker fa partire la playlist con il primo brano in elenco; quando preme per avere la transizione al brano dopo, il software fa il giusto mix per lui sulla base del tempo."* **Il mix sui BPM lo fa il software in automatico** (ribadito). Mixxx è il riferimento estetico/mentale, NON il target tecnico.

**Verdetto di fattibilità (analisi 2026-07-02)**: fattibile come "radio automix" — crossfade beat-aligned con micro tempo-match. NO sync continuo sample-accurate, NO decodifica di interi brani nel renderer.

#### Fase A — Beat-grid nel main (prerequisito)
- Estendere `src/main/bpmDetection.ts`: oltre a `{bpm, confidence}`, calcolare **`firstBeatOffsetSec`** (fase della griglia): noto il periodo (lag frazionario, v1.10.14), fare comb-filter sull'inviluppo — per ogni fase `p ∈ [0, periodo)` sommare l'energia in `p + k·periodo`; la fase col massimo è il primo beat. Considerare l'ONSET (derivata positiva dell'inviluppo, half-wave rectified) invece dell'inviluppo grezzo per picchi più netti.
- Estendere il risultato IPC `detect-bpm` (additivo, retro-compatibile) e la persistenza clip: nuovo campo `beatOffsetSec?` accanto a `bpm` (stesso schema `bpmChecked`; i .lmp esistenti si aggiornano al re-check — valutare se il gate `bpmChecked` va versionato tipo `silenceCheckedV2` per forzare il ricalcolo con offset).
- Test Vitest con inviluppi sintetici a fase nota (es. griglia che parte a 0.3s → offset atteso 0.3±tolleranza).
- ⚠️ **Validazione su musica reale**: i BPM v1.8.0 sono validati solo su toni sintetici. Prima di costruire la UI, far verificare all'utente i BPM (e gli offset) su 5-10 brani veri della sua libreria — plausibilità a orecchio.

#### Fase B — Motore di transizione beat-aligned
- Nuova logica (proposta: modulo `automixEngine.ts` nel renderer, che ORCHESTRA le API esistenti di `useAudioStore`/`StreamPlayer` senza modificarne il comportamento per il resto dell'app):
  1. Al momento del "TRANSIZIONE": leggere posizione corrente del brano in onda → calcolare il prossimo beat utile (da `bpm` + `beatOffsetSec`).
  2. **Tempo-match**: `playbackRate` del brano ENTRANTE = BPM_uscente/BPM_entrante (con `preservesPitch = true`, default in Chromium 120). **Cap ±8%**: oltre → fallback a crossfade classico.
  3. Avvio dell'entrante allineato al beat (seek a un suo beat — tipicamente il primo dopo l'eventuale trim-in — e partenza schedulata sul beat dell'uscente; compensare la latenza di `play()` misurandola empiricamente).
  4. Crossfade su N beat (configurabile, default 8) usando i fade esistenti del mixer.
  5. A uscente terminato: riportare gradualmente il rate dell'entrante a 1.0 (rampa lenta, es. 0.1%/s, inudibile) così i mix successivi non accumulano scostamento.
- Rispetto del motore esistente: bus Music, ducking, take-over, Master Chain INVARIATI. L'automix è un modo di *avviare/fondere* clip Music, non un nuovo percorso audio.
- Test: le parti pure (calcolo prossimo beat, rate, punti di fade) come funzioni esportate testabili.

#### Fase C — UI "Automix Section"
- **Vista a schermo pieno alternativa alla board** (l'app non ha routing: toggle in topbar, stato in App.tsx, stesso pattern concettuale del pad FX ma full-screen; tema Spectrum).
- Contenuto: elenco COMPLETO della colonna Music (ordine = ordine colonna; riordino via drag già esistente nella board, qui almeno visualizzato), per ogni riga: nome, durata, **BPM + confidence**, indicatore di compatibilità col precedente (verde ≤4% · giallo ≤8% · rosso >8% o BPM mancante → "sarà crossfade classico").
- Deck "IN ONDA" e "PROSSIMO" (waveform/progress riusando ciò che c'è), **pulsantone TRANSIZIONE** (grande, da diretta), pulsante START (parte dal primo), STOP ALL sempre raggiungibile, **ESC resta Emergency Stop**.
- Decidere con l'utente: transizione SOLO manuale (lui preme) o anche opzione "auto a fine brano" (rispettare la filosofia NO automazione dello show — l'automix è un'eccezione controllata come la rotazione PRE-SHOW, va discussa esplicitamente).

#### Fase D — Fallback e regole (rete di sicurezza, da progettare SUBITO non dopo)
- Confidence bassa (< soglia, es. 0.3) o BPM/offset mancanti su uno dei due brani → **crossfade classico** senza tentativi eroici.
- Delta BPM > cap → crossfade classico.
- Materiale senza beat (ballad/parlato): mai forzare. L'esito peggiore ammesso è "un crossfade normale", MAI un mix sbagliato in onda.
- Telemetria in Debug Overlay (`debugLog`): per ogni transizione loggare modalità scelta, rate applicato, beat di aggancio — servirà per la verifica in regia.

#### Ordine dei commit suggerito (SemVer: patch per step, MINOR a feature completa)
A1 beat-offset puro+test → A2 IPC/persistenza → A3 validazione musica reale (con utente) → B1 motore+test → C1 vista+lista → C2 deck+transizione → D fallback/telemetria → MINOR di consolidamento.

---

## Criteri di accettazione della feature

1. Con 2 brani a BPM compatibili e beat netto: premendo TRANSIZIONE il passaggio è a tempo (nessun "galoppo" udibile) e il tempo risultante torna a quello nativo dell'entrante entro ~30s.
2. Con brani incompatibili/non rilevabili: transizione = crossfade classico, nessun artefatto, UI che lo aveva ANNUNCIATO prima (indicatore rosso).
3. La board classica e tutto il resto dell'app funzionano IDENTICI a prima quando la sezione Automix non è in uso.
4. STOP ALL/ESC funzionano dentro la sezione. Vitest tutto verde, typecheck 0×3.

## Fuori scope esplicito
- Sync continuo stile DJ, nudge/bend manuale, EQ-mixing a 3 bande, key detection/camelot, waveform beat-grid editabile.
- Mixer channel mapping e Controllo Remoto (alla fine, decisione utente; NB quando si riprenderà il remoto: la pagina remota va riallineata a pad FX/colonne nascoste/automix).
