# RRLMP — Documento di Visione Tecnica
**Versione**: 1.0.0 | **Data**: 2026-04-10

Questo documento sintetizza la filosofia di **Runtime Live Machine Pro (RRLMP)**, le scelte architettoniche fondamentali e la visione a lungo termine del progetto.

---

## 1. FILOSOFIA: "On Air. Al Tuo Controllo."

RRLMP non è un software di automazione H24. È uno strumento di **performance broadcast**. È progettato per il regista che vuole "suonare" lo show, garantendo:
- **Latenza Zero**: Risposta immediata al trigger (MIDI/Tastiera).
- **Stabilità Professionale**: Nessun crash durante il live (Architettura Main-Side-Heavy).
- **Fluidità Visiva**: Feedback in tempo reale (Cues, Countdown, VU Meter).

---

## 2. PILASTRI ARCHITETTONICI

### Main-Side-Heavy Architecture
Abbiamo separato la **UI (Renderer)** dal **Motore di Processing (Main Process)**. Tutti i compiti pesanti (FFmpeg, analisi audio, gestione file) sono delegati a Node.js. Il Renderer rimane leggero, garantendo un'interfaccia sempre reattiva a 60fps.

### Streaming Nativo via `media://`
Non carichiamo i file audio nella RAM. Utilizziamo un protocollo custom che streamma i dati direttamente dal disco al player HTML5, permettendo di gestire librerie audio di centinaia di gigabyte con un consumo di memoria minimo e costante.

### Safety First (Broadcast Grade)
- **Auto-Backup**: Ogni 5 minuti il progetto viene salvato silenziosamente.
- **Integrity Check**: Ogni caricamento verifica l'esistenza fisica dei file.
- **Emergency Stop**: Un unico tasto (Escape) per il silenzio immediato in caso di emergenza.

---

## 3. ROADMAP EVOLUTIVA (Post-v1.0.0)

La versione 1.0.0 ha stabilizzato il core. Il futuro di RRLMP si muove verso l'automazione intelligente e l'integrazione hardware:

1.  **Session Recording**: Registrazione nativa del master mix per podcasting immediato.
2.  **Smart Cues**: Analisi IA (via FFmpeg) per suggerire automaticamente i punti di Intro e Outro.
3.  **Hardware Expansion**: Supporto esteso a protocolli OSC e integrazione profonda con mixer digitali (ASIO).

---

*Documento aggiornato il 2026-04-10 — allineato a v1.0.0.*
