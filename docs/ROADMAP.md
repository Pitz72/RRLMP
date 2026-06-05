# RRLMP — Roadmap & Backlog

**Versione corrente:** 1.3.18
**Ultimo aggiornamento:** 2026-06-05

> Fonte canonica della roadmap attiva: la tabella in `relazione.md` (sezione "FEATURE IN SCOPE"). Questo documento la riassume e la contestualizza. La filosofia di prodotto è in `VISION.md`.

---

## 📊 Stato attuale

| Area | Stato |
|------|-------|
| Criticità aperte | **0** (32+ fix dal 2026-05-16; audit globale 2026-05-29 chiuso a blocchi v1.3.9→1.3.16) |
| Typecheck (main/preload/renderer) | **0 errori** (baseline 0) |
| Ultima versione | 1.3.18 (fix drop colonna SHOW ASSETS) |

---

## 🚀 Roadmap attiva (feature in scope)

Scope: **regia umana per show finiti** (podcast, eventi, web radio). Nessuna automazione 24h. Vedi `VISION.md` per i confini di scopo e l'eccezione PRE-SHOW.

### TIER 1 — Utili al flusso di lavoro
| ID | Effort | Descrizione |
|----|--------|-------------|
| F-06 | Basso | **Loudness Normalization LUFS per clip** — analisi FFmpeg offline (EBU R128) per coerenza di volume tra clip di fonti diverse. Solo un IPC `loudnorm` aggiuntivo. |
| F-04 | Basso | **Soundboard rapida Jingle/Stinger** — pannello one-shot sempre visibile (F1–F12/numpad). Da valutare se la colonna Assets + keybind basta. |
| F-07 | Medio | **Metadata streaming (Icecast/Shoutcast)** — "Now Playing" via HTTP al mount point. ID3 già estratti, manca configurazione URL + HTTP. |
| F-12 | Alto | **Voice Tracking / Jingle Recording** — registrazione inserti voce con pre/post-roll delle clip adiacenti; file standalone pronti per la board. |
| F-25 | Medio | **OSC Integration** — controllo remoto (TouchOSC, surface controller) complementare al MIDI Learn. |

### TIER 2 — Qualità d'uso
| ID | Effort | Descrizione |
|----|--------|-------------|
| F-11 | Medio | **Undo/Redo playlist** — stack 20–30 operazioni (snapshot immutabili colonne Zustand). Riduce errori in setup pre-show. |
| F-13 | Medio | **BPM Detection automatica** — via FFmpeg, per crossfade beat-aligned. Utile per show musicali. |

---

## 🏗️ Lavori strutturali da progettare (sessioni dedicate)

### PRE-SHOW: colonne Jingle/Promo + rotazione controllata
Richiesta utente (2026-06-05). **Confinata alla sola colonna PRE-SHOW** (la fase di attesa prima che lo speaker faccia partire la sigla) → coerente con la filosofia (vedi `VISION.md`).
- Colonna/e dedicata/e **Jingle&Promo** (eventualmente Jingle e Promo separate). La colonna tipo `asset` dà già default tipo-jingle (`nextAction:'stop'`, `behavior:'normal'`, `duckingRole:'none'`, `fadeOut:500ms`).
- **Motore di rotazione su PRE-SHOW** in stile AzuraCast "once per X songs" (intervallo continuo): ogni X brani della playlist di attesa, pesca a caso 1 clip da Jingle&Promo. Parte **a fine brano** seguendo le regole di transizione, **mai sovrapposto**. Variante: due contatori distinti (ogni X un jingle, ogni Y un promo).
- Impatti: modello dati colonna, persistenza `.lmp` (possibile migrazione), UI configurazione (modale su PRE-SHOW), motore di scheduling. Nota: 2 colonne extra restringono la leggibilità → da sistemare nel layout.
- Collegato a **F-04** (soundboard) e a "Layout Regia 5.0" (colonne configurabili/rinominabili).

### Device/Routing audio + Mic Ducking (test hardware + cross-platform)
- **Problema noto**: con mic muto sul mixer il ducking percepisce comunque suono, perché l'ingresso USB del Rødecaster presenta a Windows il **mix principale** (non il solo microfono); `getUserMedia` legge quel device → l'analyser RMS rileva il programma in onda. È un limite di **routing del device**, non un bug software puro.
- **Hardware di riferimento**:
  - **Rødecaster Pro (modello I)** — una sola fonte USB, NON multitraccia: **escluso dalla compatibilità piena**. Usabile solo manualmente (ducking mic OFF, registrazione software OFF; mixaggio a mano dal banco).
  - **Rødecaster Pro II** — mixer **di riferimento**: volendo multitraccia, **2 canali input USB** (forse anche output). Su questo va costruita la gestione avanzata. ⚠️ Quando si affronta: **verificare via ricerca web tecnica** le specifiche reali (canali USB in/out, isolamento mic dal mix, multitraccia su Win/Linux/Mac).
- **Direzioni**: selezione di un input isolato/mix-minus dal banco; combinare il livello hardware con lo **stato interno del mix** (`evaluateMix` sa già quali clip sono attive) per ridurre i falsi positivi; ridefinizione gestione periferiche tenendo conto di **Win/Linux/Mac**.
- Comprende anche **Output Device multi-routing** (uscite separate Main/Cue/Monitor/Recording, scheda multitraccia, hot-swap USB) — area già marcata come da-fare-con-test-hardware.

### Test Audio Engine (debito tecnico)
Copertura Vitest per `useAudioStore`/`evaluateMix` (resa possibile da `destroyAudioStoreLoop()`). Nessun test automatizzato sull'engine ad oggi.

---

## 🔎 Enhancement minori (note)
- **Export progetto**: il sync (copia in `audio/` + pruning orfani) è **già implementato e corretto** (`export-project`, v1.3.8). Possibile miglioramento: **ricordare la cartella di export** legata al progetto, così la ri-esportazione sincronizza sempre la stessa senza richiederla ogni volta.

---

## ✅ Archivio sintetico
- **v1.3.18** — fix drop file colonna SHOW ASSETS (regressione DND-04 v1.3.4).
- **v1.3.17** — Simulatore MIDI (test tool) + fix script `dev`.
- **v1.3.9–1.3.16** — audit globale 2026-05-29 chiuso a blocchi (MEDIE/LIEVI + cleanup + types).
- **v1.3.0** — Milestone Zero Criticità (18 criticità 2026-05-16 chiuse in v1.2.17–v1.2.27).
- **v1.2.0** — Session Recording completo · UI redesign · colori dinamici.
- **v1.0.0** — i18n 8 lingue · Master Chain · Smart Mic · Waveform Editor.

---
*Documento aggiornato il 2026-06-05 — allineato a v1.3.18. Roadmap attiva sincronizzata con `relazione.md`.*
