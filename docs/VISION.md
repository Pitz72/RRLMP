# RRLMP — Documento di Visione Tecnica
**Versione**: 0.14.9 | **Data**: 2026-04-07

Questo documento sintetizza lo **stato reale del software**, le feature implementate sessione per sessione, e il backlog prioritizzato per le prossime sessioni di sviluppo.

---

## 1. STATO ATTUALE — Feature Implementate (Complete)

### Engine Audio
| Feature | Versione | Note |
|---------|----------|------|
| Playback HTML5 + Web Audio API (gain nodes, bus routing) | ≤0.9.x | StreamPlayer |
| FFmpeg silence detection via IPC (Main-Side-Heavy) | 0.13.2 | `detect-silence` channel |
| Auto-Silence Detection al Drop in PRE-SHOW | 0.13.2 | Non-bloccante, background |
| Sistema Transizioni Gapless / Segue / Crossfade per-clip | 0.13.2 | Override globale + per-clip |
| Durate separate Crossfade e Segue | 0.14.8 | `crossfadeDuration` + `segueDuration` |
| Ducking Sidechain dinamico | ≤0.9.x | source → ducka i target |
| Output Device Hot-Switch | ≤0.9.x | setSinkId() |
| Sequencer play_next (colonna PRE-SHOW) | ≤0.9.x | |
| Emergency Stop globale (Escape → stopAll) | 0.14.3 | globalShortcut Electron |

### Waveform Editor
| Feature | Versione | Note |
|---------|----------|------|
| Peak rendering via FFmpeg IPC (200 barre) | 0.10.7 | Zero ArrayBuffer nel renderer |
| Mini-player HTML5 + Click-to-seek | 0.10.7 | |
| Playhead visivo al currentTime | 0.14.1 | Linea bianca |
| Handle drag Trim Start/End | 0.14.1 | Rossi, con constraint logic |
| Handle drag Intro/Outro Marker | 0.14.1 | Cyan/Arancione |
| Quick Set Buttons (set @ posizione corrente) | 0.10.7 | |
| Zoom orizzontale 1x–8x | 0.14.8 | Scroll orizzontale, ruler adattivo |
| Auto-Trim via FFmpeg IPC (pulsante nel modal) | 0.14.6 (fix) | Sostituisce vecchia impl. renderer-side che causava crash OOM |

### UI & Workflow Broadcast
| Feature | Versione | Note |
|---------|----------|------|
| ClipCard con progress bar real-time | ≤0.9.x | |
| Timer countdown remaining | ≤0.9.x | |
| Real-Time Board Cues: INTRO countdown | 0.12.0 | `INTRO: -Xs` |
| Real-Time Board Cues: OUTRO pre-cue + alert | 0.12.1 | `OUTRO IN: -Xs` + `🚨 OUTRO` |
| Badge UP NEXT dinamico (clip in coda live) | 0.14.4 | useMemo reattivo su activeClips |
| Badge FADE OUT durante transizioni | 0.14.9 | fadingClipIds[] Zustand state |
| Badge TRIM… durante Auto-Silence | 0.14.6 | isAnalyzing runtime-only |
| Timer On Air (elapsed da primo play) | 0.14.5 | onAirStartTime in useAudioStore |
| NoteBoard: note regia a schermo durante playback | 0.14.6 | Panel fisso in fondo, auto-show/hide |
| LMP Integrity Check (clip mancanti → rosse) | 0.14.2 | check-files-exist IPC |
| Toast Notification System (no più alert()) | 0.14.7 | useToastStore + useConfirmStore |
| ConfirmDialog non-bloccante | 0.14.7 | Promise-based, audio continua |

### Clip Settings Modal
| Feature | Versione | Note |
|---------|----------|------|
| Tab General: volume, behavior, ducking, transizione | ≤0.9.x | |
| Tab Trim & Markers: WaveformEditor + manual inputs | 0.14.1 | |
| Tab Notes / Script: textarea monospace, contatori | 0.14.4 | Persistito nel .lmp |

### MIDI & Keybinding
| Feature | Versione | Note |
|---------|----------|------|
| MIDI Note/CC binding per-clip | ≤0.9.x | midiBind field |
| MIDI Learn Mode 15s countdown | ≤0.9.x | |
| Global MIDI bind (Stop All, Master Volume) | ≤0.9.x | |
| Keybind per-clip (es. KeyQ, Numpad1) | ≤0.9.x | |
| KeymappingModal potenziato | 0.14.6 | Raggruppamento per colonna, Emergency Stop entry, dot colorato |
| Keybind globale verificata (F1–F12, Numpad) | 0.14.10 | window keydown su `e.code`, guard input/modal, F1–F5 → colonne, priorità clip su colonna |

### Persistenza & Progetto
| Feature | Versione | Note |
|---------|----------|------|
| Save/Load .lmp (JSON) | ≤0.9.x | |
| Save As / Direct Save | ≤0.9.x | |
| Auto-Backup ogni 5 min | 0.10.3 | Silenzioso |
| Export Self-Contained (copia file) | ≤0.9.x | Progress IPC |
| Internazionalizzazione i18n (IT/EN) | ≤0.9.x | react-i18next |
| VU Meter, Digital Clock, Welcome Screen | ≤0.9.x | |
| Drag & Drop clip tra colonne | ≤0.9.x | |
| Multi-selezione Ctrl+Click + Delete | ≤0.9.x | |

---

## 2. ARCHITETTURA — Decisioni Strutturali

### Main-Side-Heavy Pattern
Tutti i processi FFmpeg (silence detection, waveform generation, metadata) girano nel **main process (Node.js)**. Il renderer Chromium non carica mai file audio pesanti in memoria. Questo evita i crash OOM che affliggevano la versione pre-0.11.0 (documentati in 0.14.6: crash Auto-Trim da `decodeAudioData`).

### Colonne (5 fisse)
| ID | Tipo | Colore | NextAction default |
|----|------|--------|-------------------|
| col-assets | asset | #10B981 Emerald | stop |
| col-music | music | #EF4444 Red | stop |
| col-voice | voice | #F97316 Orange | stop |
| col-sfx | sfx | #64748B Slate | stop |
| col-preshow | preshow | #8B5CF6 Violet | play_next |

**Colonne Configurabili**: ⏸️ **SOSPESA** — Le 5 colonne fisse coprono i workflow broadcast correnti. La configurabilità richiederebbe migrazione `.lmp` e UI complessa. Da rivalutare in futuro.

### Formato .lmp
```json
{
  "version": "0.14.9",
  "timestamp": "ISO8601",
  "project": { "columns": [ /* Column[] */ ] }
}
```
Campi **runtime-only** (non serializzati): `isMissing`, `isAnalyzing`

---

## 3. BACKLOG — Cosa Resta da Fare

### 🔴 Alta Priorità

~~**Shortcut tastiera clip — verifica globale**~~ ✅ **Verificato e chiuso in v0.14.10**
Il listener è in `MainGrid.tsx` su `window` (non `App.tsx`). Usa `e.code` (tasto fisico). Guard corretto per input/textarea/modal. F1–F5 mappano le colonne; clip keybind ha priorità. Escape rimosso dal renderer (già gestito da `globalShortcut` Electron nel main process).

---

### 🟡 Media Priorità

**Playlist Import M3U → colonna PRE-SHOW**
Scope chiarito: import da sistemi scheduling radio (Zetta, RCS, Myriad) direttamente nella colonna PRE-SHOW con `nextAction: play_next`. Riduce setup da 20 minuti a 30 secondi. IPC handler + parsing M3U + mapping clip. Stimato: 2 giorni.

**Preview Transizione**
Pulsante "Test →" nel ClipSettingsModal che suona gli ultimi N secondi della clip corrente + i primi N della successiva. Utile per testare crossfade/segue prima di andare in onda. Stimato: 4h.

---

### 🟢 Bassa Priorità

**Column Color Picker** — `customColor` esiste per le clip, manca per la colonna stessa. Stimato: 2h.

**Volume Master MIDI CC fader continuo** — CC 0–127 → gain lineare 0.0–1.0. Già bindabile come global, non come fader analogico continuo. Stimato: 2h.

**Badge "Auto-saved" nell'header** — Feedback visivo dell'auto-backup ogni 5 min: `💾 Auto-saved` che appare per 3 secondi. Stimato: 30min.

**i18n modali** — Testi IT hardcoded in ClipSettingsModal e GeneralSettingsModal. Stimato: 2h.

**Error Boundaries React** — Prevenire white screen da eccezioni non gestite nei componenti. Stimato: 1h.

---

## 4. LIMITI STRUTTURALI NOTI

- Playback su Chromium ha overhead vs app native C++ (accettabile per streaming/web radio)
- Web Audio API non supporta sample rate > 48kHz nativamente
- MIDI latency su Web MIDI API: ~10–30ms (accettabile broadcast, non studio-grade)
- Errori TS pre-esistenti non critici: `DebugOverlay.tsx` (import inutilizzati), `BufferPlayer.ts` (interfaccia incompleta)

---

*Documento aggiornato il 2026-04-07 — allineato a v0.14.9.*
