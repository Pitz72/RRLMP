# RRLMP — Roadmap & Issue Backlog

Generato il: 2026-04-05  
Aggiornato il: 2026-04-05 (Major UI: Waveform Editor)  
Versione corrente: 0.10.0  
Analisi condotta su: tutto il sorgente in `src/`, `package.json`, file di configurazione

---

## Indice

- [🟢 Criticità Aperte](#-criticità-aperte)
- [🚀 Evoluzione e Nuove Funzionalità](#-evoluzione-e-nuove-funzionalità)
- [Riepilogo Stato Avanzamento](#riepilogo-stato-avanzamento)
- [✅ Archivio Interventi Completati](#-archivio-interventi-completati)

---

## 🟢 Criticità Aperte (In Progress - v0.10.3+)

- [🔴] **Renderer Crash (Access Violation)**: Risolvere definitivamente il crash `0xC0000005` nell'editor del Trim.
  - **STRATEGIA**: Abbandonare la decodifica audio nel Renderer. Spostare calcolo picchi e Waveform nel processo Main (Node.js).
  - **RE-DESIGN**: Implementare un sistema di "Waveform Proxy" dove il Main invia i dati pre-generati al frontend.

---

## 🚀 Evoluzione e Nuove Funzionalità

Dalle analisi tecniche e dai commenti nel codice sorgente, sono state identificate le seguenti direzioni di sviluppo per la finalizzazione del prodotto RRLMP:

### 🎼 Audio Engine Pro (Riprogettazione Professionale)

- [🔥] **Main-Process Decoding**: Migrazione della decodifica file pesanti nel Main process per stabilità assoluta.
- [⚠️] **Librerie Native Audio**: Investigare l'uso di moduli nativi (C++/Rust) per il playback, distaccandosi dalle Web Audio API.
- [ ] **Advanced Markers Support**: Ottimizzare Intro/Outro markers basandoli su metadati pre-calcolati.
- [ ] **Ducking Sidechain Dinamico**: Espansione del sistema `stacco` per supportare parametri di ducking configurabili dall'utente.

### 🖥️ Interfaccia e Workflow

- [✅] **Clip Settings Redesign (Tabs)**: Riorganizzare la configurazione clip in schede separate per pulizia visiva. ✅ v0.10.0
- [✅] **Precise Trimming & Markers UI**: Mini-editor con **Waveform visiva** e player locale. Permette di definire `trimStart/End` e `intro/outro` trascinando i marker sull'onda sonora. ✅ v0.10.0
- [ ] **Layout Regia 5.0**: Espansione della griglia a 5 colonne per ospitare asset di servizio aggiuntivi.
- [ ] **Pannello Keymapping**: Interfaccia per la gestione centralizzata di Keybind e MIDI Bind per ogni singola clip.
- [ ] **Export Package 2.0**: Consolidamento della funzione di export per includere tutti i metadati e garantire la portabilità assoluta del progetto.

### 🛡️ Stabilità e Manutenibilità

- [ ] **Audio Engine Hardening**: Migrazione completa a `media:///` e rimozione definitiva di ogni riferimento a `file://` instabili.
- [ ] **LMP Integrity Check**: Diagnostica all'apertura del progetto per rilevare file mancanti (Clip Rosse) e suggerire il ricollegamento.

## Riepilogo Stato Avanzamento

| Gravità / Tipo | Risolti | Totali | Stato |
| --- | --- | --- | --- |
| 🔴 Criticità (Tutte) | 35 | 35 | **100%** ✅ |
| 🚀 Nuove Feature | 5 | 11 | **45%** 🚀 |
| **TOTALE PROGETTO** | **40** | **46** | **87% COMPLETATO** |

**Il software ha raggiunto lo stato di "Feature Rich" e si avvia verso il consolidamento UI.**

---

## ✅ Archivio Interventi Completati

... *(Vedere versioni precedenti per dettagli completi su G, GR, M, L)*

#### L1 — L7 ✅ v0.9.19
#### Advanced Markers Support ✅ v0.9.20
#### Ducking Sidechain Dinamico ✅ v0.9.20
#### Waveform Editor Integrato ✅ v0.10.0

---
*Documento aggiornato il 2026-04-05.*
