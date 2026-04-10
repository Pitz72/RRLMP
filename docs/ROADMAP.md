# RRLMP — Roadmap & Issue Backlog

Versione corrente: **0.17.0**
Ultimo aggiornamento: 2026-04-10

---

## Indice

- [✅ Criticità Risolte](#-criticità-risolte)
- [🚀 Evoluzione e Nuove Funzionalità](#-evoluzione-e-nuove-funzionalità)
- [🔧 Debito Tecnico Noto](#-debito-tecnico-noto)
- [📊 Riepilogo Stato Avanzamento](#-riepilogo-stato-avanzamento)
- [✅ Archivio Interventi Completati](#-archivio-interventi-completati)

---

## ✅ Criticità Risolte

- [✅] **Renderer Crash (Access Violation / 0xC0000005)**
  - **RISOLTO in v0.11.0**: Completata la migrazione "Main-Side-Heavy". Decodifica e file pesanti gestiti dal proxy Node.js via FFmpeg.

- [✅] **UI Micro-Stutter / Buffer Streaming**
  - **RISOLTO in v0.11.0**: Ottimizzato protocollo `media://`, HighWaterMark portato a 1MB. Buffer iniziale 128KB per latenza zero.

- [✅] **Build e Compilazione TypeScript**
  - **RISOLTO in v0.11.0**: Chiusi conflitti TS1259. Build `.exe` verificata. ASAR unpack per FFmpeg.

- [✅] **OOM Crash su Auto-Trim file grandi (White Screen)**
  - **RISOLTO in v0.13.2** (documentato in v0.14.0): Moved silence detection dal renderer al main process via IPC `detect-silence`. FFmpeg `silencedetect` sostituisce `arrayBuffer()` + `decodeAudioData()` nel renderer.

---

## 🚀 Evoluzione e Nuove Funzionalità

### 🎵 Audio Engine

- [✅] **Main-Process Decoding (Main-Side-Heavy)**: FFmpeg + music-metadata nel Main. ✅ v0.11.0
- [✅] **Sistema Transizioni Pre-Show**: Gapless / Segue / Crossfade con override per-clip. ✅ v0.13.2
- [✅] **Auto-Silence Detection al Drop**: Silence detection automatica al drag di file nel PRE-SHOW. ✅ v0.13.2
- [✅] **Marker Drag & Drop Visivo**: Handle trascinabili per Trim Start/End, Intro, Outro con drag globale e anti-stale ref pattern. ✅ v0.14.1
- [✅] **Master Chain Audio** — HPF + Compressor broadcast + Limiter brickwall sul master bus. ✅ v0.16.2
- [✅] **Fix Ducking Bug** — la base musicale parte al volume duckato corretto (evaluateMix con newClipId). ✅ v0.16.4
- [✅] **Transizioni per Music e Assets** — crossfade/segue/gapless non più solo PRE-SHOW. ✅ v0.16.4
- [✅] **Metadati ID3 su clip Music** — artist/title estratti in loadClip(), visualizzati in ClipCard. ✅ v0.16.4
- [✅] **Smart Mic Auto-Ducking** — MicManager.ts, noise gate, integrazione evaluateMix, ARM button UI. ✅ v0.17.0
- [ ] **Native Audio Module**: Investigare moduli nativi C++/Rust per playback ultra-stabile su file WAV 24-bit / 96kHz.
- [ ] **Advanced Markers Pre-Calcolati**: Ottimizzare marker da metadati pre-calcolati nel Main (metadata embedding in .lmp).

### 🖥️ Interfaccia e Workflow

- [✅] **Clip Settings Redesign (Tabs)**: Schede separate General / Trim & Markers. ✅ v0.10.0
- [✅] **Precise Trimming & Markers UI**: Mini-editor con Waveform visiva e player locale. ✅ v0.10.7
- [✅] **Real-Time Board Cues**: Countdown Intro (`INTRO: -Xs`), pre-cue Outro (`OUTRO IN: -Xs`), alert finale (`🚨 OUTRO`). ✅ v0.12.0–v0.12.1
- [✅] **MIDI Learn Mode**: Mapping note MIDI/CC a clip e azioni globali (Stop All, Master Volume). Countdown 15s, badge controller, Escape. ✅ (archivio)
- [✅] **Internazionalizzazione (i18n)**: react-i18next, supporto IT/EN e multi-lingua. ✅ (archivio)
- [✅] **Export Progetto (self-contained)**: Copia file audio + .lmp in cartella esportata con progress modal. ✅ (archivio)
- [✅] **Save/Load .lmp / Auto-Backup**: Persistenza progetto, salvataggio diretto, auto-backup ogni 5 minuti. ✅ (archivio)
- [✅] **Output Device Switching**: Selezione scheda audio hot-switch. ✅ (archivio)
- [✅] **Ducking Sidechain Dinamico**: Volume reduction automatico (duckingFactor / duckingDuration configurabili). ✅ (archivio)
- [ ] **Layout Regia 5.0**: Espansione / customizzazione griglia (colonne configurabili, rinomina colonne).
- [✅] **Pannello Keymapping Centralizzato** ✅ v0.14.6+
- [✅] **LMP Integrity Check**: Check automatico all'apertura progetto. Clip mancanti → rosse + ⚠️ + playback bloccato. ✅ v0.14.2
- [✅] **Feedback Visivo Auto-Silence** — badge TRIM… su ClipCard durante analisi (isAnalyzing). ✅ v0.14.6
- [✅] **Drop OS a posizione precisa** ✅ v0.15.x
- [✅] **Preview Transizione con Stop** — pulsante Stop + hasPlayed protetto. ✅ v0.16.5
- [✅] **Column Color Picker** — 30 colori, customColor persistito. ✅ v0.16.1–0.16.3
- [✅] **WelcomeScreen redesign** — layout orizzontale, slogan, bandiere. ✅ v0.16.5
- [✅] **GeneralSettingsModal a Tab** — 3 tab con Language switcher. ✅ v0.16.5

### 🛡️ Stabilità e Manutenibilità

- [✅] **Rimozione wavesurfer.js** ✅ v0.16.4
- [✅] **i18n Estensione Modali** ✅ v0.16.1
- [✅] **Error Boundaries React** ✅ v0.16.4
- [ ] **Test Audio Engine**: Nessun test automatizzato sull'engine. Considerare test di integrazione per playClip/stopClip/transition.

---

## 🔧 Debito Tecnico Noto

| Priorità | Item | Dettaglio | Stato |
|----------|------|-----------|-------|
| ~~🔴 Alta~~ | ~~`wavesurfer.js` / `waveform-data` in package.json~~ | ~~Mai importati dal v0.10.7~~ | ✅ Rimossi 2026-04-06 |
| ~~🟡 Media~~ | ~~Drag & drop marker waveform~~ | ~~Promesso in v0.10.0, mai implementato~~ | ✅ Implementato v0.14.1 |
| ~~🟡 Media~~ | ~~Testi hardcoded in IT nei modali~~ | ~~ClipSettingsModal, GeneralSettingsModal hanno testi non i18n.~~ | ✅ Risolti in v0.16.1 |
| 🟡 Media | Feedback Auto-Silence su drop | Nessun indicatore visivo mentre FFmpeg gira in background. | 📋 Aperto |
| ~~🟢 Bassa~~ | ~~`crossfadeDuration` usato anche per segue~~ | ~~Nome variabile impreciso: usato per entrambi segue e crossfade.~~ | ✅ Risolto con `segueDuration` separata in v0.14.8 |
| ~~🟢 Bassa~~ | ~~`alert()` come error handling~~ | ~~Alcuni errori usano `alert()` invece di notifiche non-bloccanti.~~ | ✅ Toast + ConfirmDialog in v0.14.7 |

---

## 📊 Riepilogo Stato Avanzamento

| Gravità / Tipo | Risolti | Totali | Stato |
| --- | --- | --- | --- |
| 🔴 Criticità (Tutte) | 4 | 4 | **100%** ✅ |
| 🚀 Nuove Feature Core | 25 | 27 | **93%** 🚀 |
| 🔧 Debito Tecnico | 5 | 6 | **83%** 🔧 |
| **TOTALE PROGETTO** | **34** | **37** | **92% COMPLETATO** |

---

## ✅ Archivio Interventi Completati

### Engine Audio
- **Main-Side-Heavy Architecture** ✅ v0.11.0
- **AudioProcessor (FFmpeg + music-metadata)** ✅ v0.10.5
- **IPC Bridge detect-silence** ✅ v0.13.2
- **Auto-Silence Detection al Drop** ✅ v0.13.2
- **Sistema Transizioni Pre-Show (Gapless/Segue/Crossfade)** ✅ v0.13.2
- **Ducking Sidechain Dinamico** ✅ (archivio)
- **Output Device Hot-Switch** ✅ (archivio)
- **Streaming Buffer 128KB + 1MB** ✅ v0.10.8 / v0.12.0

### UI & Workflow
- **Waveform Editor Integrato (Peak-based)** ✅ v0.10.7
- **Clip Settings Tabs** ✅ v0.10.0
- **Real-Time Cues Board (Intro/Outro countdown)** ✅ v0.12.0–v0.12.1
- **MIDI Learn Mode** ✅ (archivio)
- **Internazionalizzazione i18n** ✅ (archivio)
- **Save/Load .lmp** ✅ (archivio)
- **Auto-Backup 5 minuti** ✅ v0.10.3
- **Export Progetto Self-Contained** ✅ (archivio)
- **VU Meter** ✅ (archivio)
- **Digital Clock** ✅ (archivio)
- **Welcome Screen** ✅ (archivio)
- **LMP Integrity Check (IPC check-files-exist + ClipCard visual state)** ✅ v0.14.2

### Stabilità
- **CSP & White Screen Startup Fix** ✅ v0.10.3
- **ASAR Unpack FFmpeg/FFprobe** ✅ v0.11.2
- **music-metadata downgrade CJS-safe** ✅ v0.11.1
- **Electron pinned version (builder fix)** ✅ v0.13.2

### v0.16.x — UI & UX Release
- **Volume Master MIDI reattivo + Badge Auto-saved** ✅ v0.16.0
- **Column Color Picker (12 → 30 colori), ConfirmDialog Promise-based, i18n ClipSettingsModal + GeneralSettingsModal** ✅ v0.16.1
- **Testo clip schiarito (lightenHex), Drop Indicator, Master Chain Audio (HPF+Compressor+Limiter)** ✅ v0.16.2
- **Fix colori clip PRE-SHOW in play, Color Picker esteso a 30 colori, GeneralSettingsModal redesign orizzontale** ✅ v0.16.3
- **Fix ducking bug, Transizioni per Music e Assets, Metadati ID3, Error Boundaries React, rimozione wavesurfer.js** ✅ v0.16.4
- **Preview Transizione con Stop button, GeneralSettingsModal a 3 tab, WelcomeScreen redesign orizzontale** ✅ v0.16.5

### v0.17.0
- **Smart Mic Auto-Ducking** ✅ v0.17.0

---
*Documento aggiornato il 2026-04-10 — versione 0.17.0.*
