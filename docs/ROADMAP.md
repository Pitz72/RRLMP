# RRLMP — Roadmap & Issue Backlog

Versione corrente: **0.12.1**
Ultimo aggiornamento: 2026-04-06

---

## Indice

- [🟢 Criticità Aperte](#-criticità-aperte)
- [🚀 Evoluzione e Nuove Funzionalità](#-evoluzione-e-nuove-funzionalità)
- [📊 Riepilogo Stato Avanzamento](#-riepilogo-stato-avanzamento)
- [✅ Archivio Interventi Completati](#-archivio-interventi-completati)

---

## 🟢 Criticità (Risolte in v0.11.0)

- [✅] **Renderer Crash (Access Violation)**
  - **RISOLTO in v0.11.0**: Completata la migrazione "Main-Side-Heavy". La decodifica e i file pesanti sono gestiti dal proxy Node.js e delegati a FFmpeg.

- [✅] **UI Micro-Stutter / Buffer Streaming**
  - **RISOLTO in v0.11.0**: Ottimizzato protocollo `media://` portando l'HighWaterMark a 1MB per stabilizzare read asincrone da network drive.

- [✅] **Build e Compilazione TypeScript**
  - **RISOLTO in v0.11.0**: Chiusi i conflitti TS1259 per l'architettura Main-Side-Heavy. Build `.exe` verificata e rilasciata.

---

## 🚀 Evoluzione e Nuove Funzionalità

Dalle analisi tecniche e dai feedback sulla serie 0.10.x, le prossime tappe sono:

### 🎼 Audio Engine Pro (Riprogettazione Professionale)

- [🔥] **Main-Process Decoding**: Spostamento della decodifica file pesanti nel Main process per stabilità assoluta. (Alta Priorità)
- [⚠️] **Librerie Native Audio**: Investigare l'uso di moduli nativi (C++/Rust) per il playback, distaccandosi dalle Web Audio API se necessario.
- [ ] **Advanced Markers Support**: Ottimizzare Intro/Outro markers basandoli su metadati pre-calcolati dal Main.

### 🖥️ Interfaccia e Workflow

- [✅] **Clip Settings Redesign (Tabs)**: Riorganizzare la configurazione clip in schede separate. ✅ v0.10.0
- [✅] **Precise Trimming & Markers UI**: Mini-editor con Waveform visiva e player locale. ✅ v0.10.0
- [ ] **Layout Regia 5.0**: Espansione della griglia a 5 colonne.
- [ ] **Pannello Keymapping**: Gestione centralizzata di Keybind e MIDI Bind.

### 🛡️ Stabilità e Manutenibilità

- [ ] **LMP Integrity Check**: Diagnostica all'apertura del progetto per rilevare file mancanti (Clip Rosse).

---

## 📊 Riepilogo Stato Avanzamento

| Gravità / Tipo | Risolti | Totali | Stato |
| --- | --- | --- | --- |
| 🔴 Criticità (Tutte) | 36 | 37 | **97%** 🛠️ |
| 🚀 Nuove Feature | 6 | 12 | **50%** 🚀 |
| **TOTALE PROGETTO** | **42** | **49** | **85% COMPLETATO** |

---

## ✅ Archivio Interventi Completati

- **Waveform Editor Integrato** ✅ v0.10.0
- **Ducking Sidechain Dinamico** ✅ v0.10.0
- **CSP & White Screen Startup Fix** ✅ v0.10.3
- **Infinite Loop Prevention (Waveform)** ✅ v0.10.3
- **Streaming Buffer Optimization (128KB)** ✅ v0.10.3

---
*Documento aggiornato automaticamente il 2026-04-06.*
