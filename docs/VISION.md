# RRLMP — Documento di Visione Tecnica
**Versione**: 1.0.0 | **Data**: 2026-04-10

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
| Fix ducking bug (base musicale parte al volume corretto) | 0.16.4 | evaluateMix(newClipId) + fadeTo duration=0 |
| Transizioni Crossfade/Segue/Gapless estese a Music e Assets | 0.16.4 | Guard type=preshow rimosso |
| Master Chain Audio (HPF + Compressor + Limiter) | 0.16.2 | Sul master bus, persisted in useSettingsStore |
| Smart Mic Auto-Ducking | 0.17.0 | MicManager.ts: getUserMedia → AnalyserNode monitor-only → noise gate → evaluateMix(). Opt-in via ARM button |

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
| Drop Indicator (linea blu glow inserimento) | 0.16.2 | Durante drag da OS |
| Column Color Picker esteso | 0.16.1–0.16.3 | 30 colori, customColor su Column |
| Testo clip schiarito (lightenHex) | 0.16.2 | 65% blend verso bianco |
| Import Playlist M3U → PRE-SHOW | 0.14.12 | auto-silence detection |
| Badge Auto-saved | 0.16.0 | Fade-in/out 3s |
| WelcomeScreen redesign orizzontale | 0.16.5 | 720px, 2 pannelli, slogan, bandiere |
| ARM Button + VU Mic | 0.17.0 | Pulsante ARM nell'header con mini VU meter 8 barre. Tre stati: off/armato silenzio/armato voce |
| Rebranding "Runtime Live Machine Pro" + nuovo logo | 1.0.0 | Logo 5 barre VU + play triangle. Badge PRO nell'header. Banner nel README. |

### Clip Settings Modal
| Feature | Versione | Note |
|---------|----------|------|
| Tab General: volume, behavior, ducking, transizione | ≤0.9.x | |
| Tab Trim & Markers: WaveformEditor + manual inputs | 0.14.1 | |
| Tab Notes / Script: textarea monospace, contatori | 0.14.4 | Persistito nel .lmp |
| Preview Transizione con Stop button | 0.16.5 | hasPlayed protetto da previewingClipIds |

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
| Internazionalizzazione i18n (8 lingue complete) | 1.0.0 | react-i18next — IT, EN, FR, DE, ES, PT, RU, ZH |
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
  "version": "0.16.5",
  "timestamp": "ISO8601",
  "project": { "columns": [ /* Column[] */ ] }
}
```
Campi **runtime-only** (non serializzati): `isMissing`, `isAnalyzing`

Campi aggiuntivi su `AudioClip` (v0.16.4):
- `artist?: string` — metadato ID3 artist estratto da music-metadata
- `title?: string` — metadato ID3 title estratto da music-metadata

---

## 3. BACKLOG — Cosa Resta da Fare

### 🔴 Alta Priorità

~~**Shortcut tastiera clip — verifica globale**~~ ✅ **Verificato e chiuso in v0.14.10**
Il listener è in `MainGrid.tsx` su `window` (non `App.tsx`). Usa `e.code` (tasto fisico). Guard corretto per input/textarea/modal. F1–F5 mappano le colonne; clip keybind ha priorità. Escape rimosso dal renderer (già gestito da `globalShortcut` Electron nel main process).

---

~~**Drop da OS file manager a posizione precisa**~~ ✅ **Implementato in v0.15.x**
`addClipAtIndex(columnId, file, index)` in `useProjectStore` con `splice`. `SortableClip` espone `data-clip-id`. `handleNativeDrop` in `MainGrid` calcola l'indice dal `clientY` confrontando il midpoint Y di ogni card. Drop multiplo incrementa l'indice progressivamente.

---

### 🟡 Media Priorità

~~**Playlist Import M3U → colonna PRE-SHOW**~~ ✅ **Implementato in v0.14.12**
IPC handler `import-m3u`, parsing M3U/M3U8, path relativi/assoluti, silence detection automatica, `addClipFromPath` nel project store.

~~**Preview Transizione**~~ ✅ **Completato in v0.16.5**
Pulsante Stop rosso nel modal. Clip in anteprima non marcate hasPlayed (previewingClipIds[] nel store).

---

### 🟡 Media Priorità — Nuovi Item (2026-04-10)

---

~~**Master Chain Audio**~~ ✅ **Implementato in v0.16.2**
HPF 80Hz + Compressor broadcast + Limiter -1dBFS. UI in GeneralSettingsModal (tab Master Chain da v0.16.5).

---

~~**Smart Mic — Auto-Ducking da Input Hardware**~~ ✅ **Implementato in v0.17.0** — MicManager singleton, noise gate con isteresi, integrazione evaluateMix, UI ARM button + VU meter, selettore device in Settings.

---

**Session Recording**

Possibilità di registrare l'intera sessione broadcast su file audio per archivio o revisione.

**Architettura proposta**: catturare il master bus Web Audio API tramite `MediaRecorder` (tutto nel renderer, nessun IPC con FFmpeg).

```
AudioContext.createMediaStreamDestination()
        ↓
[MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })]
        ↓
[chunks[]] → Blob → IPC → main process → writeFile()
```

**Perché non FFmpeg**: la registrazione con FFmpeg del device audio fisico è platform-dependent (diverso su Windows/Linux/macOS) e cattura tutto il sistema, non solo il software. Con `MediaStreamDestination` si cattura esattamente il master bus del progetto — indipendente dal dispositivo di output selezionato.

**Funzionalità**:
- Pulsante `[⏺ REC]` nell'header (rosso pulsante quando attivo).
- Timer durata registrazione.
- Al click Stop: dialogo salvataggio file `.webm` (Opus) o conversione in `.wav` via FFmpeg IPC se si vuole compatibilità universale.
- Nome file default: `RRLMP_Recording_YYYY-MM-DD_HH-MM.webm`.
- Possibilità di avviare/fermare la registrazione indipendentemente dalla riproduzione.

**Limitazione nota**: `MediaRecorder` su Chromium Electron produce WebM/Opus — qualità broadcast-grade ma non WAV nativo. La conversione post-registrazione via FFmpeg è immediata se richiesta.

Stimato: 8h.

---

### 🟢 Bassa Priorità

~~**Column Color Picker**~~ ✅ **Implementato in v0.16.1**
`customColor` aggiunto a `Column`, persistito nel .lmp. Picker con 12 colori nel ColumnHeader, ripristino al default. Testo clip idle tinto con colore colonna (opacità ~67%).

~~**i18n modali**~~ ✅ **Implementato in v0.16.1**
`ClipSettingsModal` e `GeneralSettingsModal` ora usano `react-i18next`. Aggiunte chiavi in `it.json` e `en.json` per tab, etichette ducking, transizioni, dialog conferma.

~~**Volume Master MIDI CC fader continuo**~~ ✅ **Implementato in v0.16.0**
`masterVolume` ora persiste in `useSettingsStore` (localStorage). Lo slider UI segue il fader MIDI in tempo reale. Il volume sopravvive al riavvio.

~~**Badge "Auto-saved" nell'header**~~ ✅ **Implementato in v0.16.0**
Badge "✓ Auto-saved" verde, fade-in/out in 3 secondi dopo ogni auto-backup riuscito. Implementato con stato locale `showAutoSaved` in `GlobalControls`.

**i18n modali** — Testi IT hardcoded in ClipSettingsModal e GeneralSettingsModal. Stimato: 2h.

~~**Error Boundaries React**~~ ✅ **Implementato in v0.16.4**

---

## 4. LIMITI STRUTTURALI NOTI

- Playback su Chromium ha overhead vs app native C++ (accettabile per streaming/web radio)
- Web Audio API non supporta sample rate > 48kHz nativamente
- MIDI latency su Web MIDI API: ~10–30ms (accettabile broadcast, non studio-grade)
- Errori TS pre-esistenti non critici: `DebugOverlay.tsx` (import inutilizzati), `BufferPlayer.ts` (interfaccia incompleta)

---

*Documento aggiornato il 2026-04-10 — allineato a v1.0.0.*
