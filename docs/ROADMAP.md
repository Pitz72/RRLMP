# RRLMP — Roadmap & Issue Backlog

Versione corrente: **0.13.2**
Ultimo aggiornamento: 2026-04-06

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
- [ ] **Marker Drag & Drop Visivo**: Aggiungere handle trascinabili sulla waveform per Trim Start/End, Intro, Outro. (Pianificato da v0.10.0, mai implementato — sostituito da pulsanti click-based)
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
- [ ] **Pannello Keymapping Centralizzato**: Gestione MIDI e Keyboard Bind in un pannello dedicato, separato dalle impostazioni singola clip.
- [ ] **LMP Integrity Check**: Diagnostica all'apertura progetto per rilevare file mancanti (Clip Rosse), con opzione re-link.
- [ ] **Feedback Visivo Auto-Silence in Background**: Spinner / badge "analisi in corso" sulla clip durante il processo di silence detection automatico.

### 🛡️ Stabilità e Manutenibilità

- [ ] **Rimozione wavesurfer.js da package.json**: Dipendenza installata ma mai usata dal v0.10.7. Da rimuovere per pulizia build.
- [ ] **i18n Estensione Modali**: Alcuni testi nei modali (ClipSettings, GeneralSettings) ancora hardcoded in italiano.
- [ ] **Error Boundaries React**: Aggiungere error boundary per prevenire white screen da eccezioni non gestite nel renderer.
- [ ] **Test Audio Engine**: Nessun test automatizzato sull'engine. Considerare test di integrazione per playClip/stopClip/transition.

---

## 🔧 Debito Tecnico Noto

| Priorità | Item | Dettaglio |
|----------|------|-----------|
| 🔴 Alta | `wavesurfer.js` in package.json | Installato, mai importato da v0.10.7. Rimuovere. |
| 🟡 Media | Drag & drop marker waveform | Promesso in v0.10.0, mai implementato. UX usa pulsanti. |
| 🟡 Media | Testi hardcoded in IT nei modali | ClipSettingsModal, GeneralSettingsModal hanno testi non i18n. |
| 🟡 Media | Feedback Auto-Silence su drop | L'operazione è silenziosa: nessun indicatore visivo mentre FFmpeg gira. |
| 🟢 Bassa | `crossfadeDuration` usato anche per segue | Il nome della variabile è impreciso: usato per entrambi segue e crossfade. |
| 🟢 Bassa | `alert()` come error handling | Alcuni errori usano `alert()` invece di notifiche non-bloccanti in-app. |

---

## 📊 Riepilogo Stato Avanzamento

| Gravità / Tipo | Risolti | Totali | Stato |
| --- | --- | --- | --- |
| 🔴 Criticità (Tutte) | 4 | 4 | **100%** ✅ |
| 🚀 Nuove Feature Core | 12 | 17 | **71%** 🚀 |
| 🔧 Debito Tecnico | 0 | 6 | **0%** 📋 |
| **TOTALE PROGETTO** | **16** | **27** | **59% COMPLETATO** |

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

### Stabilità
- **CSP & White Screen Startup Fix** ✅ v0.10.3
- **ASAR Unpack FFmpeg/FFprobe** ✅ v0.11.2
- **music-metadata downgrade CJS-safe** ✅ v0.11.1
- **Electron pinned version (builder fix)** ✅ v0.13.2

---
*Documento aggiornato il 2026-04-06 — versione 0.13.2.*
