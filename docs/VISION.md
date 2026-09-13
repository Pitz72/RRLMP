# RRLMP — Documento di Visione Tecnica
**Software alla versione**: 1.15.32 | **Documento rivisto**: 2026-09-13 per piattaforme e apertura del sorgente (scritto per la 1.3.18 il 2026-06-05, verificato il 2026-07-28)

> Contenuto **verificato e tuttora valido**: la filosofia "nessuna automazione dello show, eccezione controllata sulla sola PRE-SHOW" continua a governare le decisioni di prodotto (è la ragione per cui il behavior `Stacco` è stato rimosso nella 1.15.15 e per cui il Voice Tracking resta sospeso). Per la mappa dei sottosistemi aggiunti dopo la 1.3 vedi [ARCHITECTURE.md](./ARCHITECTURE.md); per lo stato dei lavori [ROADMAP.md](./ROADMAP.md).

Questo documento sintetizza la filosofia di **Runtime Live Machine Pro (RRLMP)**, le scelte architettoniche fondamentali e la visione a lungo termine del progetto.

---

## 1. FILOSOFIA: "On Air. Al Tuo Controllo."

RRLMP non è un software di automazione H24. È uno strumento di **performance broadcast** per **conduttori umani in sessioni finite** — show live, podcast, eventi, web radio. È progettato per il regista che vuole "suonare" lo show, garantendo:
- **Latenza Zero**: Risposta immediata al trigger (MIDI/Tastiera).
- **Stabilità Professionale**: Nessun crash durante il live (Architettura Main-Side-Heavy).
- **Fluidità Visiva**: Feedback in tempo reale (Cues, Countdown, VU Meter).

### Confine di scopo (cosa NON è)
Restano **fuori perimetro**: scheduling orario 24h, cart automation generalizzata, RDS, archivio musicale a rotazione continua, spot break automatici. Lo **show** è sempre guidato dall'operatore.

### Eccezione controllata: la colonna PRE-SHOW
La colonna **PRE-SHOW** è l'unica fase "che suona da sola": è il riempitivo che gira **prima** che inizi la diretta, finché lo speaker non fa partire manualmente la sigla dello show. In questa specifica fase è ammessa una **rotazione semi-automatica controllata** (es. inserire jingle/promo ogni X brani della playlist di attesa). Questo **non** contraddice la filosofia: non è automazione dello show, è solo rendere più professionale l'attesa pre-diretta. Appena lo speaker entra, il controllo è di nuovo 100% umano.

---

## 2. PILASTRI ARCHITETTONICI

### Main-Side-Heavy Architecture
La **UI (Renderer)** è separata dal **Motore di Processing (Main Process)**. Tutti i compiti pesanti (FFmpeg, analisi audio, gestione file) sono delegati a Node.js. Il Renderer resta leggero, garantendo un'interfaccia reattiva a 60fps.

### Streaming Nativo via `media://`
I file audio non vengono caricati in RAM. Un protocollo custom streamma i dati dal disco al player HTML5, gestendo librerie audio di centinaia di GB con consumo di memoria minimo e costante.

### Safety First (Broadcast Grade)
- **Auto-Backup**: il progetto viene salvato silenziosamente (gate `isDirty`).
- **Integrity Check**: ogni caricamento verifica l'esistenza fisica dei file.
- **Emergency Stop**: un unico tasto (Escape) per il silenzio immediato in emergenza.
- **Save atomico** (tmp+rename) + validazione/sanitizzazione `.lmp` in apertura.

### Piattaforme
Pacchetti ufficiali per **Windows** e **Linux** (AppImage, .deb). **macOS** si compila dal sorgente: con l'apertura del codice sotto licenza MIT (settembre 2026) non c'è più un installer ufficiale. La gestione delle periferiche audio (input/output, routing) dovrà essere ridefinita tenendo conto delle differenze di driver fra le piattaforme (vedi ROADMAP — area Device/Routing).

---

## 3. DIREZIONE EVOLUTIVA (Post-v1.3.x)

Lo stato del codice è stabile (0 criticità aperte, baseline typecheck 0). La direzione:

1. **Coerenza sonora & sicurezza d'uso** — Loudness LUFS per clip (F-06), Undo/Redo playlist (F-11).
2. **PRE-SHOW più ricca** — colonne dedicate Jingle/Promo + rotazione controllata in PRE-SHOW (vedi ROADMAP, design strutturale).
3. **Produzione contenuti** — Voice Tracking (F-12).
4. **Integrazioni** — Metadata streaming Icecast/Shoutcast (F-07), OSC (F-25), BPM (F-13).
5. **Device/Routing audio** — ridefinizione gestione periferiche (mic ducking, multi-routing output) con test hardware e cross-platform.

> L'elenco operativo dettagliato, con effort e stato, vive in **`ROADMAP.md`** ed è allineato alla tabella in `relazione.md`.

---

*Documento aggiornato il 2026-06-05 — allineato a v1.3.18.*
