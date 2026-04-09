# RRLMP — Documento di Visione Tecnica
**Versione**: 0.15.0 | **Data**: 2026-04-10

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

**Drop da OS file manager a posizione precisa** — Bug UX: quando si trascina un file audio dall'explorer di sistema nell'applicazione, la clip viene sempre inserita in fondo alla colonna, ignorando il punto di rilascio.

**Causa**: il gestore `onDrop` del file OS chiama `addClip(columnId, file)` senza passare un indice di inserimento. Il drag & drop tra clip esistenti già gestisce correttamente l'inserimento per indice — è lo stesso meccanismo da riutilizzare.

**Soluzione**: nel gestore `onDrop` di `MainGrid.tsx`, calcolare l'indice di inserimento dal Y-coordinate dell'evento drop relativo alle ClipCard presenti nella colonna, quindi chiamare `addClipAtIndex(columnId, file, index)` (nuova variant di `addClip` in `useProjectStore`). Stimato: 3h.

---

### 🟡 Media Priorità

~~**Playlist Import M3U → colonna PRE-SHOW**~~ ✅ **Implementato in v0.14.12**
IPC handler `import-m3u`, parsing M3U/M3U8, path relativi/assoluti, silence detection automatica, `addClipFromPath` nel project store.

~~**Preview Transizione**~~ ✅ **Implementato in v0.15.0** — ⚠️ **Da raffinare**
Pulsante "Test →" nel ClipSettingsModal (tab General, visibile solo per clip PRE-SHOW con una prossima clip). Riproduce gli ultimi secondi della clip corrente così la transizione (crossfade/segue/gapless) scatta naturalmente.

**Problema noto**: una volta avviato il test, non è possibile fermarlo dall'interno del modal. L'utente deve chiudere il modal e stoppare la clip manualmente (click Stop sulla ClipCard) oppure premere Escape (Emergency Stop globale). Da aggiungere nella prossima sessione: pulsante "Stop" dedicato nel modal che chiama `stopClip(clip.id)`, e gestione del caso in cui il modal si chiude mentre il test è in corso.

---

### 🟡 Media Priorità — Nuovi Item (2026-04-10)

---

**Master Chain Audio (Sound Processing broadcast-grade)**

Attualmente ogni clip ha un volume normalizzato manualmente. Brani con dinamiche diverse (musica classica vs elettronica) suonano a volume disomogeneo. La soluzione non è normalizzare i file ma processare l'uscita master in tempo reale, come fa una vera console radio.

**Architettura proposta** (Web Audio API, tutto nel renderer):

```
[ClipGainNode] → [Bus Gains] → [HPF 30Hz] → [DynamicsCompressor] → [BrickwallLimiter] → destination
```

1. **High-Pass Filter (HPF)** — `BiquadFilterNode` tipo `highpass` a 30Hz. Taglia il rumore sub-bass DC che non si sente ma consuma headroom.
2. **Dynamics Compressor** — `DynamicsCompressorNode` con parametri broadcast:
   - `threshold: -18dB`, `ratio: 4:1`, `knee: 6dB`, `attack: 10ms`, `release: 200ms`
   - Effetto: compatta la dinamica, uniforma i volumi percepiti. È l'effetto "suono radio FM".
3. **Brickwall Limiter** — secondo `DynamicsCompressorNode` configurato come limiter:
   - `threshold: -1dB`, `ratio: 20:1`, `knee: 0`, `attack: 1ms`, `release: 100ms`
   - Garantisce che il segnale finale non superi mai -1dBFS. Nessuna distorsione hardware.

**Inserimento**: `AudioContextManager` già espone il master gain node — basta inserire questi 3 nodi a monte del `destination`. Zero impatto sull'architettura esistente.

**UI**: toggle on/off in `GeneralSettingsModal` ("Master Limiter") + preset broadcaste parametri avanzati per utenti esperti. Stimato: 6h.

---

**Smart Mic — Auto-Ducking da input hardware**

Il presentatore parla nel microfono → la musica si abbassa automaticamente → quando smette → la musica risale. Zero click, zero distrazione.

**Architettura proposta**:

```
[getUserMedia()] → [AnalyserNode (monitor only)] → NOT routed to output
                        ↓
              [Noise Gate Logic in JS]
                  threshold: -25dB
                  attack hold: 100ms
                  release hold: 1500ms
                        ↓
              [isMicActive: boolean]
                        ↓
              [evaluateMix() esistente] ← riutilizza il ducking già presente
```

**Dettagli tecnici**:
- Il segnale del microfono **non** viene mai mandato in uscita (nessun echo/feedback). Va solo all'`AnalyserNode` interno.
- Il noise gate usa due soglie: **-25dBFS per 100ms** per attivare, **-35dBFS per 1500ms** per rilasciare. Evita attivazioni da colpi di tosse o rumori ambientali.
- `isMicActive` si integra nel sistema ducking esistente: le colonne con `duckingRole: 'target'` vengono abbassate automaticamente come se una clip `source` stesse andando in play.
- **Permission Electron**: `getUserMedia()` richiede il flag `--enable-features=WebRTC` e `session.defaultSession.setPermissionRequestHandler()` nel main process.

**UI**:
- Pulsante `[🎤 ARM]` nell'header. Se disattivo: microfono ignorato. Se attivo (rosso pulsante): microfono monitorato.
- VU meter verticale del livello mic a fianco del pulsante ARM (visibile solo quando armato) per diagnostica.
- Menu "Audio Input Device" in `GeneralSettingsModal` (analogo all'output device già presente).

Stimato: 10h (include gestione permessi Electron + VU meter + integrazione ducking).

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

*Documento aggiornato il 2026-04-10 — allineato a v0.15.0. Aggiunti: Master Chain Audio, Smart Mic Auto-Ducking, Session Recording, Drop posizione precisa.*
