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

## 🟢 Criticità Aperte

*Tutte le criticità tecniche identificate (Gravissime, Gravi, Medie, Lievi) sono state risolte al 100%.*

---

## 🚀 Evoluzione e Nuove Funzionalità

Dalle analisi tecniche e dai commenti nel codice sorgente, sono state identificate le seguenti direzioni di sviluppo per la finalizzazione del prodotto RRLMP:

### 🎵 Audio & Playback Engine (Finalizzazione)

- [✅] **Advanced Markers Support**: Implementazione di Intro/Outro markers per l'automazione dei mix point e il countdown vocale. ✅ v0.9.20
- [✅] **Precise Trimming UI**: Mini-editor per definire `trimStart` e `trimEnd` visualmente tramite waveform. ✅ v0.10.0
- [⚠️] **PFL (Pre-Fade Listen)**: *Sospesa* — Sistema di monitoraggio audio indipendente (da valutare in futuro).
- [✅] **Ducking Sidechain Dinamico**: Espansione del sistema `stacco` per supportare parametri di ducking configurabili dall'utente. ✅ v0.9.20

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
