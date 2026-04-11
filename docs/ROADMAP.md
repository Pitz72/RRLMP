# RRLMP — Roadmap & Issue Backlog

Versione corrente: **1.2.0**
Ultimo aggiornamento: 2026-04-11

---

## Indice

- [✅ Criticità Risolte](#-criticità-risolte)
- [🚀 Evoluzione Post-v1.0.0](#-evoluzione-post-v100)
- [🔬 Specifiche Tecniche Future](#-specifiche-tecniche-future)
- [🔧 Debito Tecnico Noto](#-debito-tecnico-noto)
- [📊 Riepilogo Stato Avanzamento](#-riepilogo-stato-avanzamento)
- [✅ Archivio Interventi Completati](#-archivio-interventi-completati)

---

## ✅ Criticità Risolte

- [✅] **Renderer Crash (Access Violation / 0xC0000005)**
  - **RISOLTO**: Migrazione "Main-Side-Heavy". Decodifica gestita dal proxy Node.js via FFmpeg.
- [✅] **OOM Crash su Auto-Trim file grandi**
  - **RISOLTO**: Spostata silence detection nel main process via IPC `detect-silence`.
- [✅] **Smart Mic Auto-Ducking**
  - **RISOLTO in v0.17.0**: MicManager.ts con noise gate e integrazione `evaluateMix`.

---

## 🚀 Evoluzione Post-v1.0.0

### 🟡 Priorità Alta (Prossimi Step)

- [✅] **Session Recording (Master Mix)** — **COMPLETATO in v1.1.x–v1.2.0**
  - Export WAV/FLAC/MP3/OGG/WEBM con selezione bitrate e bit depth. Bug IPC critici risolti.
- [ ] **Test Audio Engine (Copertura)**
  - Implementazione di Vitest + @testing-library/react per testare `useAudioStore` e `evaluateMix`.
- [ ] **Advanced Markers Pre-Calcolati**
  - Suggerimento automatico di Intro/Outro basato sull'analisi energetica del file.

### 🟢 Priorità Media/Bassa

- [ ] **Native Audio Module**: Investigare moduli nativi C++/Rust solo se necessari per latenza ultra-bassa (ASIO). Attualmente lo streaming `media://` è sufficiente.
- [ ] **Layout Regia 5.0**: Colonne configurabili e rinominabili (richiede migrazione .lmp).

---

## 🔬 Specifiche Tecniche Future

### 1. Session Recording (Singola Traccia WAV)
- **Architettura**: Utilizzo di `AudioContext.createMediaStreamDestination()` collegato al master bus.
- **Workflow**: `MediaRecorder` cattura il flusso (WebM/Opus) → IPC → Main Process → Conversione WAV via FFmpeg.
- **Vantaggi**: Indipendente dalla scheda audio fisica; cattura esattamente ciò che viene trasmesso.

### 2. Advanced Markers
- **Analisi**: Eseguire `ebur128` (loudness) e analisi di onset nel Main Process durante il caricamento.
- **UI**: Visualizzazione di handle tratteggiati nel Waveform Editor per i marker suggeriti, con pulsante "Accetta".

---

## 🔧 Debito Tecnico Noto

| Priorità | Item | Dettaglio | Stato |
|----------|------|-----------|-------|
| 🟡 Media | Sync Documentazione | Allineare tutte le 8 lingue del manuale utente al brand "Pro". | 📋 In corso |
| 🟡 Media | Test Audio Engine | Nessun test automatizzato sull'engine audio. | 📋 Aperto |

---

## 📊 Riepilogo Stato Avanzamento

| Gravità / Tipo | Risolti | Totali | Stato |
| --- | --- | --- | --- |
| 🔴 Criticità (Tutte) | 4 | 4 | **100%** ✅ |
| 🚀 Feature Core v1.0 | 28 | 28 | **100%** ✅ |
| 🔧 Debito Tecnico | 6 | 8 | **75%** 🔧 |

---

## ✅ Archivio Interventi Completati

### v1.2.0 — Recording · UI Redesign · Dynamic Colors (2026-04-11)
- **Session Recording completo**: Export WAV/FLAC/MP3/OGG/WEBM con modal selezione formato/bitrate/bit-depth.
- **Fix critico recording**: 3 bug IPC che impedivano il salvataggio WAV (type mismatch, preload incompleto, argomento mancante).
- **Settings Modal redesign**: 5 tab tematiche (Generali/Audio & Mix/Microfono/Registrazione/Master Chain), 75vw×80vh.
- **Colori clip dinamici**: le clip seguono il colore corrente della colonna in tempo reale.
- **Feedback warning dismissable**: checkbox per utenti con cuffie/mixer professionale.

### v1.0.0 — Major Release (2026-04-10)
- **i18n Completa**: 8 lingue localizzate al 100%.
- **Rebranding Pro**: Nuovo logo, badge PRO, nuova Welcome Screen.
- **Master Chain Audio**: HPF + Compressor + Limiter sul master bus.
- **Smart Mic**: Monitoraggio hardware microfono con auto-ducking.
- **Waveform Editor**: Zoom 1x-8x e handle drag & drop.

---
*Documento aggiornato il 2026-04-11 — allineato a v1.2.0.*
