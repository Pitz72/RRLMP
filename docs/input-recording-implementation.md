# Implementazione Input Audio & Session Recording — Analisi Tecnica

**Data analisi:** 2026-04-11  
**Versione di riferimento:** v1.0.0  
**Ambito:** Periferica di input audio (canale mix) + Registrazione sessione su singola traccia

---

## 1. SINTESI ESECUTIVA

RRLMP ha già un sistema di monitoring del microfono hardware (Smart Mic, v0.17.0): legge il livello RMS dall'input per attivare il ducking automatico. Tuttavia il segnale mic **non entra nel mix** e **non viene registrato**. Mancano due feature distinte:

1. **Input Audio come canale** — il microfono viene inserito nel master bus come sorgente audio vera (non solo come sensore). L'operatore parla al microfono e la sua voce va in uscita.
2. **Session Recording** — registrazione della singola traccia master bus su file (WebM/Opus o WAV) per archivio post-broadcast.

**Stima complessiva:** 14–20h di sviluppo, zero modifiche al motore FFmpeg.

---

## 2. STATO ATTUALE — Cosa c'è già

### 2.1 Smart Mic (v0.17.0) — solo monitoring

```
getUserMedia(micInputDeviceId)
    → MediaStream
    → AnalyserNode (monitor)   ← NON connesso a destination
    → getFloatTimeDomainData() → RMS → dBFS → noise gate → setMicActive()
```

Il segnale audio del microfono **non raggiunge mai `AudioContext.destination`**. Questa è una decisione di sicurezza corretta (zero rischio feedback), ma significa che la voce non va in output.

### 2.2 Topologia master bus attuale

```
[Clip Players]
    → masterGain
    → HPF (BiquadFilter 80Hz)
    → Compressor (broadcast -18dBFS, 4:1)
    → Limiter (brickwall -1dBFS, 20:1)
    → AudioContext.destination  (output hardware)
    → ChannelSplitter → VU Meter analyser
```

### 2.3 Persistenza Settings già pronti

In `useSettingsStore`:
- `micInputDeviceId: string` — ID dispositivo audioinput selezionato
- `micEnabled: boolean` — flag abilitazione
- `micThresholdDb: number` — soglia noise gate

Questi campi sono sufficienti per entrambe le feature nuove, senza migrazioni .lmp.

---

## 3. FEATURE 1 — Microfono come canale audio nel mix

### 3.1 Architettura target

Il microfono deve entrare nel master bus **dopo** il masterGain (per essere soggetto alla catena di processing broadcast) ma con il proprio GainNode per il volume indipendente:

```
getUserMedia(micInputDeviceId)
    → MediaStream
    ┌──────────────────────────────────┐
    │ micSourceNode (MediaStreamSource) │
    │ → micAnalyserNode (monitor RMS)  │  ← già esistente in MicManager
    │ → micGainNode (volume mic)       │  ← NUOVO
    │ → masterGain                     │  ← inserimento nel bus principale
    └──────────────────────────────────┘

[Clip Players] → masterGain → HPF → Compressor → Limiter → destination
                     ↑
               micGainNode ─────────────────────────────────┘
```

> **Anti-feedback critico**: questa topologia è sicura **solo se l'operatore usa cuffie** (monitor IEM o cuffia chiusa). Con monitor aperti in studio il feedback è inevitabile. L'UI deve mostrare un avviso esplicito "Usare cuffie — rischio feedback".

### 3.2 Modifiche a MicManager.ts

```typescript
// Nuovi nodi da aggiungere all'arm()
private micSourceNode: MediaStreamAudioSourceNode | null = null;
private micGainNode: GainNode | null = null;

arm(options: { enableMix: boolean; micVolume: number }) {
  // ... esistente: getUserMedia → analyserNode
  
  if (options.enableMix) {
    this.micSourceNode = audioCtx.createMediaStreamSource(stream);
    this.micGainNode = audioCtx.createGain();
    this.micGainNode.gain.value = options.micVolume; // 0.0–1.0

    // AnalyserNode resta come prima (monitoring)
    this.micSourceNode.connect(this.analyserNode);

    // NUOVA connessione al mix
    this.micSourceNode.connect(this.micGainNode);
    this.micGainNode.connect(AudioContextManager.getInstance().getContext().destination);
    // Oppure: .connect(masterGainNode) se vogliamo che passi per HPF+Compressor+Limiter
  }
}
```

> **Nota architetturale**: connettere il mic a `masterGain` (prima del processing) è preferibile — la voce beneficia del compressore broadcast e del limiter come tutto il resto del mix. Alternativa: GainNode diretto a `destination` (bypass processing) per situazioni "transparent talkback".

### 3.3 Nuovi campi useSettingsStore

| Campo | Tipo | Default | Note |
|-------|------|---------|------|
| `micMixEnabled` | boolean | `false` | Attiva il canale mic nel mix (distinto da `micEnabled` che è il ducking) |
| `micVolume` | number | `0.8` | Gain del canale mic (0.0–1.0) |
| `micBypassProcessing` | boolean | `false` | Se true, micGainNode → destination (bypass HPF/Comp/Limiter) |

### 3.4 Modifiche UI — GlobalControls + GeneralSettingsModal

**GlobalControls.tsx (header):**
- Il pulsante ARM esistente rimane invariato
- Aggiungere: slider volume mic accanto al mini VU meter (visibile solo se ARM attivo)
- Tooltip "⚠️ Usare cuffie" on hover quando micMixEnabled=true

**GeneralSettingsModal — tab Output & Mix:**
- Nuova riga "Canale Mix Mic" con toggle + slider volume
- Toggle "Bypass processing (talkback)"
- Alert box arancione: "Attivare solo con cuffie. Con monitor aperti il feedback è inevitabile."

### 3.5 Stima effort

| Task | Ore |
|------|-----|
| Modifiche MicManager.ts (routing audio) | 2h |
| Nuovi campi useSettingsStore | 0.5h |
| UI GlobalControls (slider volume) | 1.5h |
| UI GeneralSettingsModal (sezione mix mic) | 1.5h |
| Test feedback/anti-feedback, gain staging | 2h |
| **Totale Feature 1** | **~7–8h** |

---

## 4. FEATURE 2 — Session Recording (singola traccia master bus)

### 4.1 Architettura target

La registrazione avviene sul master bus **dopo** la catena di processing (HPF+Compressor+Limiter) ma **prima** del `ChannelSplitter` del VU meter. Il segnale registrato è identico a ciò che l'ascoltatore sente.

```
... → Limiter → MediaStreamDestinationNode  ← NUOVO (tap point)
                     |                → destination (output)
                     |                → VU analyser
                     ↓
               MediaRecorder (chunks)
                     ↓
               ArrayBuffer[] in memoria
                     ↓
               IPC: saveRecording(chunks, path)
                     ↓
               main process → fs.writeFile (WebM/Opus o WAV)
```

### 4.2 Componenti renderer: AudioRecorder.ts

```typescript
// src/renderer/src/engine/AudioRecorder.ts
export class AudioRecorder {
  private static instance: AudioRecorder | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  static getInstance(): AudioRecorder { ... }

  /**
   * Deve essere chiamato DOPO che AudioContextManager ha inizializzato il contesto.
   * Crea il MediaStreamDestinationNode e lo inserisce nella topologia.
   */
  initialize(limiterOutput: AudioNode): void {
    const ctx = AudioContextManager.getInstance().getContext();
    this.destinationNode = ctx.createMediaStreamDestination();
    
    // Tap: limiter → mediaStreamDest + (destination e VU già connessi)
    limiterOutput.connect(this.destinationNode);
  }

  startRecording(): void {
    if (!this.destinationNode) throw new Error('AudioRecorder not initialized');
    
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.destinationNode.stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 320000  // 320kbps Opus — broadcast quality
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start(1000); // chunk ogni 1 secondo
  }

  async stopRecording(outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject('Not recording');
      
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        await window.electron.saveRecording(arrayBuffer, outputPath);
        this.chunks = [];
        resolve();
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
```

### 4.3 Compatibilità formato

| Formato | Pro | Contro | Raccomandazione |
|---------|-----|--------|-----------------|
| WebM/Opus | Nativo WebAudio, ~50MB/ora | Non editabile in tutti i DAW | Default per archivio rapido |
| WAV PCM | Editabile universalmente | ~630MB/ora a 44.1kHz 16bit | Export post-sessione opzionale |
| MP3 | Piccolo | Richiede LAME (non incluso) | Non supportato |

**Strategia:** registra sempre in WebM/Opus (MediaRecorder nativo). Aggiungere opzione "Export WAV" post-stop via FFmpeg main-side (già disponibile, zero lavoro aggiuntivo).

### 4.4 IPC: main process

```typescript
// In src/main/index.ts

ipcMain.handle('save-recording', async (_event, arrayBuffer: ArrayBuffer, outputPath: string) => {
  const buffer = Buffer.from(arrayBuffer);
  await fs.promises.writeFile(outputPath, buffer);
  return { success: true, path: outputPath, size: buffer.length };
});

// Opzionale: export WAV post-recording via FFmpeg
ipcMain.handle('convert-recording-to-wav', async (_event, srcPath: string) => {
  const dstPath = srcPath.replace('.webm', '.wav');
  await ffmpegExec(['-i', srcPath, '-acodec', 'pcm_s16le', dstPath]);
  return dstPath;
});
```

```typescript
// In preload: contextBridge.exposeInMainWorld
saveRecording: (arrayBuffer: ArrayBuffer, path: string) => 
  ipcRenderer.invoke('save-recording', arrayBuffer, path),
convertRecordingToWav: (path: string) => 
  ipcRenderer.invoke('convert-recording-to-wav', path),
```

### 4.5 Store: useRecordingStore.ts (nuovo)

```typescript
interface RecordingState {
  isRecording: boolean;
  startTime: number | null;
  outputPath: string | null;
  elapsedSeconds: number;
  
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;  // ritorna il path del file salvato
  setOutputPath: (path: string) => void;
}
```

### 4.6 UI — Controllo REC

**Header (GlobalControls.tsx):**
- Pulsante REC (cerchio rosso) affianco al timer ON AIR
- Stati: idle (grigio) / armed (rosso lampeggiante) / recording (rosso fisso + timer)
- Click: se idle → dialog "Scegli percorso salvataggio" → start; se recording → stop + toast "Registrazione salvata: [path]"

**Nomenclatura file automatica:**
```
RRLMP_REC_2026-04-11_14-35-22.webm
```

**GeneralSettingsModal — tab Output & Mix:**
- Sezione "Session Recording": formato dropdown (WebM/Opus / WAV via FFmpeg), cartella predefinita, qualità bitrate

### 4.7 Gestione memoria / sicurezza

- I chunk WebM vengono accumulati in `chunks: BlobPart[]` nel renderer — per sessioni molto lunghe (>4h) può crescere significativamente
- **Safeguard**: ogni 30 minuti (o 500MB stimati) fare un flush intermedio via IPC append-mode
- Alternative: usare `MediaRecorder` in streaming mode con IPC `appendChunk()` e `fs.createWriteStream` nel main — più robusto per sessioni lunghe
- **Per v1.x**: buffer semplice (chunks in memoria) è sufficiente per 99% delle sessioni broadcast (30–90 min)

### 4.8 Stima effort

| Task | Ore |
|------|-----|
| AudioRecorder.ts (nuovo singleton) | 2h |
| Tap point nella topologia master bus | 1h |
| IPC handlers (main + preload) | 1.5h |
| useRecordingStore.ts | 1h |
| UI header (pulsante REC + timer) | 2h |
| UI settings (sezione recording) | 1h |
| Dialog scelta path + nomenclatura automatica | 1h |
| Test end-to-end (WebM playback + WAV export) | 2h |
| **Totale Feature 2** | **~11–12h** |

---

## 5. DIPENDENZE TRA LE DUE FEATURE

Le due feature sono **indipendenti** e possono essere implementate separatamente:

| | Feature 1 (Mic nel mix) | Feature 2 (Recording) |
|--|--------------------------|----------------------|
| Richiede MicManager.ts | Sì (estende) | No |
| Richiede nuovi IPC | No | Sì |
| Richiede nuovo store | No (estende useSettingsStore) | Sì (useRecordingStore) |
| Richiede nuovi nodi AudioContext | Sì (micGainNode) | Sì (MediaStreamDestinationNode) |
| Rischio regressioni | Medio (routing audio) | Basso (solo tap, non modifica il flusso) |

**Ordine consigliato**: Feature 2 (Recording) prima — rischio zero sul motore audio esistente, ritorno immediato ad alto valore. Feature 1 (Mic nel mix) seconda — richiede attenzione al gain staging e ai test anti-feedback.

---

## 6. INTEGRAZIONI CON IL DESIGN SYSTEM STITCH

Entrambe le feature si integrano naturalmente nel design "Precision Cockpit":

**Pulsante REC:**
- Stile: `surface_container_highest` base + bordo inferiore 2px `tertiary` (#ff716a)
- Stato recording: background solido `tertiary` + glow rosso `box-shadow: 0 0 15px rgba(255, 113, 106, 0.4)`
- Timer recording: font `JetBrains Mono`, `Label-SM`, `tertiary` color

**Slider volume mic:**
- Stesso stile degli slider esistenti (thumb `primary`, track `surface_container_highest`)
- Label: `JetBrains Mono` per il valore dB

**Indicatore "⚠️ FEEDBACK RISK":**
- Banner `error_dim` (#d7383b) con testo `on_surface` — visibile solo quando `micMixEnabled=true && !headphonesConfirmed`

---

## 7. PIANO DI IMPLEMENTAZIONE (FASI)

### Fase 1 — Preparazione (1h)
- Audit topologia master bus in `AudioContextManager.ts`: identificare il nodo Limiter e il ChannelSplitter
- Definire i punti di tap per MediaStreamDestinationNode e micGainNode
- Estendere i tipi in `preload/index.d.ts`

### Fase 2 — Session Recording (11–12h)
- `AudioRecorder.ts` singleton
- Tap point nel master bus (1 riga di connect())
- IPC: `save-recording`, `convert-recording-to-wav`
- `useRecordingStore.ts`
- UI: pulsante REC in GlobalControls, sezione Settings

### Fase 3 — Mic nel Mix (7–8h)
- Estensione `MicManager.ts`: `micGainNode` + routing condizionale
- Nuovi campi `useSettingsStore` (`micMixEnabled`, `micVolume`, `micBypassProcessing`)
- UI: slider volume in header, sezione Settings, avviso feedback

### Fase 4 — Test e QA (2h)
- Test recording sessione completa (>30 min) — verifica crescita memoria chunks
- Test feedback: mic → output → mic (ambiente controllato con cuffie)
- Test output device switch durante recording
- Test export WAV via FFmpeg

**Totale stimato: 21–23h**

---

## 8. DECISIONI ARCHITETTURALI CRITICHE

### 8.1 MediaRecorder vs FFmpeg recording
**Decisione: MediaRecorder (renderer)**  
FFmpeg nel main process non ha accesso all'AudioContext — registrerebbe l'input microfono grezzo, non il master mix post-processing. MediaRecorder è l'unico modo per catturare l'output della Web Audio API chain completa.

### 8.2 Tap point: prima o dopo il Limiter?
**Decisione: dopo il Limiter**  
La registrazione deve essere fedele all'ascolto. Il Limiter è l'ultimo stadio di processing broadcast — registrare prima significherebbe un archivio con picchi non limitati, non rappresentativo dell'onda su antenna.

### 8.3 Mic nel mix: masterGain o destination?
**Decisione: connessione a masterGain**  
La voce dell'operatore deve passare per HPF (80Hz) + Compressor + Limiter. Questo garantisce coerenza timbrica con il resto del mix e protezione dai picchi. Eccezione: `micBypassProcessing=true` per situazioni "talkback puro".

### 8.4 Formato storage: WebM/Opus
**Decisione: WebM/Opus come default**  
MediaRecorder su Electron supporta `audio/webm;codecs=opus` nativamente — zero dipendenze esterne. WAV export è disponibile via FFmpeg già incluso, on-demand.
