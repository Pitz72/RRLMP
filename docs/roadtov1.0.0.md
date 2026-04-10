# RRLMP — Road to v1.0.0
**Data**: 2026-04-10 | **Versione corrente**: 0.16.5

Questo documento analizza ogni feature in attesa di valutazione per la v1.0.0: stato reale, dettagli tecnici, difficoltà stimata e classificazione di priorità. Serve come base per decidere cosa entra nella release stabile e in quale ordine affrontarlo.

---

## Scala di Difficoltà

| Simbolo | Significato | Ore stimate |
|---------|-------------|-------------|
| ⭐ | Banale — modifica localizzata | < 2h |
| ⭐⭐ | Semplice — piccola feature o fix | 2–6h |
| ⭐⭐⭐ | Media — feature autonoma con UI | 6–15h |
| ⭐⭐⭐⭐ | Alta — subsistema nuovo o integrazione complessa | 15–30h |
| ⭐⭐⭐⭐⭐ | Estrema — riscrittura architettonica o ricerca | 30h+ |

---

## Classificazione per v1.0.0

| Classe | Significato |
|--------|-------------|
| 🔴 BLOCCANTE | Non si può chiamare "1.0.0" senza questa |
| 🟡 IMPORTANTE | Migliora significativamente il prodotto, consigliata |
| 🟢 NICE-TO-HAVE | Valore aggiunto, non bloccante per la release stabile |
| ⏸️ SOSPESA | Da rivalutare in futuro, fuori scope v1.0 |

---

## 1. i18n Completa — Traduzioni Lingue Extra

**Priorità**: 🔴 BLOCCANTE | **Difficoltà**: ⭐⭐ per lingua

### Stato reale

Questo è il problema più urgente e più **sottovalutato** in termini di impatto utente.

L'architettura i18n è completa e funzionante (react-i18next, file JSON per lingua, language switcher con bandiere in WelcomeScreen e GeneralSettingsModal). **Ma le traduzioni effettive sono quasi inesistenti**:

| Lingua | Chiavi presenti | Chiavi totali necessarie | Stato |
|--------|----------------|--------------------------|-------|
| 🇮🇹 Italiano | ~90/90 | ~90 | ✅ Completo |
| 🇬🇧 English | ~90/90 | ~90 | ✅ Completo |
| 🇫🇷 Français | **2/90** | ~90 | ❌ Quasi vuoto |
| 🇩🇪 Deutsch | **2/90** | ~90 | ❌ Quasi vuoto |
| 🇪🇸 Español | **2/90** | ~90 | ❌ Quasi vuoto |
| 🇵🇹 Português | **2/90** | ~90 | ❌ Quasi vuoto |
| 🇷🇺 Русский | **2/90** | ~90 | ❌ Quasi vuoto |
| 🇨🇳 中文 | **2/90** | ~90 | ❌ Quasi vuoto |

Le 2 chiavi presenti nelle lingue incomplete sono solo `welcome.newProject` e `welcome.loadProject`. Tutto il resto — colonne, controlli, modali, clip settings, dialogs — cade in fallback inglese. Un utente che seleziona il tedesco vede l'interfaccia quasi interamente in inglese.

### Cosa va fatto

Per ogni lingua (×6): tradurre tutte le ~90 chiavi partendo da `en.json` come template. Aggiungere anche le nuove chiavi introdotte in v0.16.x che mancano anche in alcune lingue (`slogan`, `description`, `selectLanguage`, `modal.settings.tab.*`).

### Tecnica

Nessuna modifica al codice. Solo file JSON. L'architettura i18n regge già tutto: fallback chain, rilevamento lingua browser, persistenza scelta utente. Con assistenza AI (GPT/Claude per traduzione + revisione madrelingua) stimato **4–6h per lingua** inclusa revisione terminologia broadcast.

### Perché è BLOCCANTE

Offrire un language switcher con 8 bandiere e poi mostrare l'interfaccia in inglese per 6 di esse è peggio che non averle. Un software v1.0.0 con internazionalizzazione dichiarata deve averla funzionante.

---

## 2. Feedback Visivo Auto-Silence su Drop

**Priorità**: ✅ GIÀ IMPLEMENTATO — **non è un todo**

### Stato reale

Questo item compare ancora come aperto nella Roadmap originale, ma è un **bug di documentazione**. Il feedback visivo è già presente:

- Campo `isAnalyzing: boolean` su `AudioClip` (runtime-only, non persistito)
- In `ClipCard.tsx` (riga 158): quando `clip.isAnalyzing === true`, la card mostra il badge **"TRIM…"** animato
- Il badge appare durante l'analisi FFmpeg in background al drop di un file nel PRE-SHOW
- Al termine dell'analisi, `isAnalyzing` torna a `false` e il badge sparisce

**Azione necessaria**: aggiornare la Roadmap per marcarlo completato. Zero sviluppo richiesto.

---

## 3. Advanced Markers Pre-Calcolati

**Priorità**: 🟡 IMPORTANTE | **Difficoltà**: ⭐⭐⭐

### Stato reale

Attualmente i marker (Trim Start, Trim End, Intro Marker, Outro Marker) vengono impostati **manualmente** dall'utente nel WaveformEditor. È preciso ma richiede tempo per ogni clip.

La feature propone di **suggerire automaticamente** i marker basandosi sull'analisi audio del file, calcolata nel Main process con FFmpeg (già disponibile) e salvata nel `.lmp`.

### Cosa va fatto

1. **Analisi più ricca in `loadClip()`**: oltre a durata e metadati ID3, eseguire:
   - Silence detection già esistente (`detectSilence`) → suggerisce `trimStart` e `trimEnd`
   - Analisi loudness per trovare "onset" vocale → suggerisce `introMarker` (dove inizia il testo della canzone)
   - Analisi energetica per trovare il "mix point" → suggerisce `outroMarker`

2. **Differenziare marker "confermati" da "suggeriti"**: aggiungere `suggestedTrimStart?`, `suggestedIntroMarker?` ecc. come campi runtime non persistiti; solo quando l'utente li "accetta" nel WaveformEditor diventano i campi ufficiali.

3. **UI nel WaveformEditor**: handle tratteggiati o di colore diverso per i marker suggeriti, con pulsante "Accetta / Ignora" vicino a ciascun handle.

### Difficoltà tecnica

L'infrastruttura IPC, FFmpeg e WaveformEditor esiste già. La difficoltà principale sta nel trovare algoritmi affidabili per il rilevamento onset vocale e mix point su generi musicali diversi. FFmpeg non ha un filtro "introMarker" nativo: si può approssimare con analisi di loudness (`ebur128`) e zero-crossing rate, ma il risultato sarà approssimativo su musica elettronica vs classica.

**Realistica aspettativa**: Trim Start/End automatici sono precisi (già funzionano). Intro/Outro automatici sono indicativi, richiedono quasi sempre conferma manuale.

**Stima**: 8–12h (analisi FFmpeg + campi nuovi + UI WaveformEditor).

---

## 4. Test Audio Engine

**Priorità**: 🟡 IMPORTANTE | **Difficoltà**: ⭐⭐⭐⭐

### Stato reale

Zero test automatizzati sull'engine audio. Ogni modifica a `useAudioStore`, `StreamPlayer`, `evaluateMix`, `applyTransitionAndPlayNext` viene verificata solo manualmente.

### Cosa va fatto — e perché è difficile

Il problema centrale: **Web Audio API non esiste in Node.js**. `AudioContext`, `GainNode`, `BiquadFilterNode` ecc. sono API browser. I test in Vitest/Jest girano in Node.js (o jsdom che non implementa Web Audio).

**Approccio consigliato**: testare la **logica di stato** separata dall'audio reale.

1. **Mock di StreamPlayer**: creare un `MockStreamPlayer` che implementa `IAudioPlayer` con tutti i metodi come no-op / callback manuali. Non produce suono, ma permette di testare lo store.

2. **Test di `useAudioStore` con Vitest + @testing-library/react**: 
   - `playClip()` → verifica che `activeClips[id]` esista e abbia i valori corretti
   - `stopClip()` → verifica che `activeClips[id]` venga rimosso e `hasPlayed` sia settato correttamente
   - `evaluateMix()` → verifica che i volumi calcolati siano quelli attesi con diverse combinazioni di clip
   - `applyTransitionAndPlayNext()` → verifica che la clip giusta sia avviata nel tipo di transizione corretto

3. **Test E2E con Playwright + Electron**: test "reali" che aprono l'app vera, droppano un file, verificano che il badge TRIM appaia e scompaia. Più costosi ma verificano il comportamento end-to-end.

### Difficoltà tecnica

- Setup Vitest in un progetto Electron/Vite richiede configurazione dedicata (tsconfig separato, alias resolve)
- MockStreamPlayer deve simulare `onPreEnd`, `onEnded`, `onOutroReached` callback timing
- `evaluateMix` ha dipendenze implicite da `useSettingsStore` e `useProjectStore` → serve setup corretto degli store per ogni test
- I test E2E Playwright richiedono un secondo processo Electron solo per i test

**Valore**: altissimo per la stabilità a lungo termine. Una volta che `evaluateMix` ha copertura test, nessuna modifica futura romperà silenziosamente la logica di ducking o transizione.

**Stima**: 20–30h (setup infrastruttura + test coverage minima su engine + CI).

---

## 5. Smart Mic — Auto-Ducking da Input Hardware

**Priorità**: 🟡 IMPORTANTE | **Difficoltà**: ⭐⭐⭐⭐

### Stato reale

Non implementato. Il software usa il ducking sidechain esistente (`duckingRole: 'source'`) per abbassare la musica quando una clip voce va in play — ma questo richiede che l'utente prema manualmente il tasto della clip voce. Se il presentatore parla nel microfono senza passare da una clip, il ducking non scatta.

### Come funziona l'hardware

Microfoni USB, Rødecaster Pro, Zoom LiveTrak, Focusrite ecc. si presentano al sistema operativo come **dispositivi audio standard** (`MediaDeviceInfo` con `kind: 'audioinput'`). Non richiedono driver speciali. `navigator.mediaDevices.getUserMedia()` li cattura normalmente, esattamente come `enumerateDevices()` già fa per gli output. Nessuna dipendenza speciale da installare.

**Nota Rødecaster**: il Rødecaster espone ogni canale separatamente come device audio (Main Mix, Fader 1, Fader 2...). L'utente può scegliere quale ascoltare. Il driver è ASIO/WDM standard — trasparente per Web Audio.

### Architettura proposta

```
[Hardware Input (USB mic / Rødecaster)]
    ↓ getUserMedia({ audio: { deviceId, echoCancellation: false } })
    ↓ MediaStream
[MicAnalyserNode] ← AnalyserNode monitor-only, NON connesso all'output
    ↓ getByteFrequencyData() ogni 50ms (polling)
[Noise Gate Logic]
    threshold: -30dBFS per 80ms → isMicActive = true
    threshold: -45dBFS per 1500ms → isMicActive = false
    ↓
[evaluateMix() esistente]
    ↙ isMicActive trattato come clip con duckingRole: 'source'
```

Il segnale del microfono **non viene mai mandato in output** (no feedback, no echo). Va solo all'AnalyserNode per il rilevamento.

### Cosa va fatto

1. **`MicManager.ts`** — singleton simile a MidiManager:
   - `arm(deviceId)` / `disarm()` — avvia/ferma `getUserMedia`
   - `onMicActivity(cb)` — callback chiamata quando lo stato cambia
   - Noise gate con soglia configurabile

2. **Permessi Electron** — `getUserMedia` richiede che il main process approvi la richiesta:
   ```typescript
   session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
       if (permission === 'media') callback(true);
   });
   ```

3. **Integrazione con `evaluateMix()`** — aggiungere `isMicActive: boolean` al calcolo del ducking, con stessa logica delle clip `source`.

4. **UI**:
   - Pulsante `[🎤 ARM]` in `GlobalControls` (rosso pulsante quando attivo)
   - VU meter minimale del livello mic (visibile solo quando armato)
   - Selettore dispositivo input in `GeneralSettingsModal` (tab Output & Mix)
   - Soglia del noise gate configurabile in impostazioni

5. **Opzionale by design**: il sistema funziona anche senza microfono configurato. Se l'utente non arma il mic, il comportamento è identico a oggi.

### Difficoltà tecnica

La parte algoritmicamente più delicata è il noise gate: una soglia fissa produce falsi positivi (un colpo di tosse abbassa la musica per 1.5 secondi) e falsi negativi (voce sommessa non abbassa niente). Il gate deve avere isteresi (soglia di attivazione più alta di quella di rilascio) e un hold time per evitare pump.

**Stima**: 12–16h (MicManager + permessi + integrazione evaluateMix + UI).

---

## 6. Session Recording

**Priorità**: 🟡 IMPORTANTE | **Difficoltà**: ⭐⭐⭐ (singola traccia) / ⭐⭐⭐⭐ (multitraccia)

### Stato reale

Non implementato. Oggi non è possibile registrare l'output del software su file.

### Architettura proposta (singola traccia)

Web Audio API offre `AudioContext.createMediaStreamDestination()` che crea un nodo connettibile al grafo audio. Il nodo espone un `MediaStream` che `MediaRecorder` può registrare direttamente nel renderer, senza toccare il main process.

```
[masterGain → HPF → Compressor → Limiter → destination]
                                    ↓ (connessione parallela)
                    [MediaStreamDestinationNode]
                                    ↓
                    [MediaRecorder(stream)]
                                    ↓
                    [chunks: Blob[]] → Uint8Array
                                    ↓ IPC
                    [main process → writeFile()]
```

**Formato nativo**: WebM/Opus (`audio/webm;codecs=opus`) — qualità broadcast, ma non WAV nativo. Per avere **16-bit 44.1kHz WAV**:
- Al termine della registrazione, passare il WebM a FFmpeg via IPC
- `ffmpeg -i input.webm -ar 44100 -acodec pcm_s16le output.wav`
- Tempo di conversione: quasi istantaneo per sessioni < 3h

### Multitraccia

Ogni bus (Music, Voice, SFX, Assets, PRE-SHOW) ha un proprio GainNode in `AudioContextManager`. Sarebbe possibile collegare un `MediaStreamDestinationNode` separato per ogni bus → 5 `MediaRecorder` paralleli → 5 file separati al termine. Questo permette il mix in post-produzione.

**Complicazione**: sincronizzazione temporale. I 5 recorder devono partire esattamente nello stesso momento. `MediaRecorder.start()` non è deterministic al millisecondo. Si usa un timestamp comune e poi si allineano i file in post.

**Formato multitraccia**: o 5 file WAV separati (semplice) o un file multitrack (richiederebbe libreria esterna tipo `audiobuffer-to-wav` + encoding custom).

**Raccomandazione per v1.0.0**: implementare singola traccia (master mix, qualità WAV 16-bit 44.1kHz via FFmpeg). La multitraccia è una feature v1.x.

### Cosa va fatto (singola traccia)

1. **`RecordingManager.ts`** — singleton:
   - `start()` → collega `MediaStreamDestinationNode` al master bus, avvia `MediaRecorder`
   - `stop()` → finalizza recording, invia chunks via IPC
2. **IPC handler** `save-recording` nel main process — riceve Uint8Array WebM, salva temp, lancia FFmpeg per conversione WAV, ritorna path file finale
3. **UI in `GlobalControls`**:
   - Pulsante `[⏺ REC]` rosso pulsante quando attivo
   - Timer durata registrazione
   - Dialog salvataggio al termine (nome file, percorso)
4. **Integrazione con `AudioContextManager`** — esporre il nodo `masterGain` (già pubblico) per il collegamento al recorder

**Stima**: 8–12h singola traccia con conversione WAV. 25–35h multitraccia.

---

## 7. Native Audio Module (C++/Rust)

**Priorità**: ⏸️ SOSPESA — non necessaria per v1.0.0 | **Difficoltà**: ⭐⭐⭐⭐⭐

### Stato reale

Questa feature era nella roadmap come "da investigare" per il playback ultra-stabile di WAV 24-bit/96kHz. Dopo un'analisi più approfondita, la conclusione è:

**Non è necessaria.**

### Perché non serve

Electron 28 usa Chromium 120, che supporta nativamente:
- WAV 8/16/24/32-bit (PCM, float) ✓
- Sample rate fino a 192kHz ✓
- FLAC, MP3, AAC, OGG ✓

L'architettura Main-Side-Heavy già mitiga i crash OOM (il renderer non decodifica mai il file intero in memoria). Lo streaming via `media://` funziona per file di qualsiasi dimensione.

**L'unico scenario dove un modulo nativo avrebbe senso** è la latenza sub-millisecondo con ASIO su Windows (richiede driver ASIO, usato in ambienti studio professionale). Per broadcast radio la latenza attuale (< 20ms) è abbondantemente accettabile — nessuna stazione FM usa latenza inferiore.

### Costo di implementazione

Per completezza: un modulo nativo C++/Rust in Electron richiederebbe:
- Addon N-API / `napi-rs` collegato a PortAudio o WASAPI direttamente
- Rewrite completo di `StreamPlayer` — tutta la logica fade, seek, callback `onPreEnd`/`onEnded` dovrebbe essere reimplementata in C++ con comunicazione thread-safe verso il renderer
- Mantenimento cross-platform (Windows: WASAPI/ASIO, macOS: CoreAudio, Linux: ALSA/PulseAudio)
- Testing su hardware ASIO diversi

**Rapporto sforzo/beneficio**: pessimo. ~40–60h di lavoro per un beneficio non percepibile nel contesto broadcast radio.

**Decisione**: chiudere questo item come "non pertinente per il target d'uso". Riaprire solo se emerge un caso d'uso reale che giustifichi la complessità.

---

## 8. Test Audio Engine

*(Già analizzato al punto 4 — incluso qui per completezza dell'indice)*

**Priorità**: 🟡 IMPORTANTE | **Difficoltà**: ⭐⭐⭐⭐

Vedi sezione 4 per il dettaglio completo.

---

## Riepilogo — Ordine consigliato per v1.0.0

| # | Feature | Priorità | Difficoltà | Stima |
|---|---------|----------|------------|-------|
| 1 | **i18n Completa** (6 lingue ×~90 chiavi) | 🔴 BLOCCANTE | ⭐⭐ per lingua | ~30h totali |
| 2 | **Session Recording** (singola traccia WAV) | 🟡 IMPORTANTE | ⭐⭐⭐ | 8–12h |
| 3 | **Smart Mic Auto-Ducking** | 🟡 IMPORTANTE | ⭐⭐⭐⭐ | 12–16h |
| 4 | **Test Audio Engine** (copertura minima) | 🟡 IMPORTANTE | ⭐⭐⭐⭐ | 20–30h |
| 5 | **Advanced Markers Pre-Calcolati** | 🟢 NICE-TO-HAVE | ⭐⭐⭐ | 8–12h |
| — | Feedback Auto-Silence | ✅ FATTO | — | 0h |
| — | Native Audio Module | ⏸️ SOSPESA | ⭐⭐⭐⭐⭐ | ~50h |

**Stima totale per v1.0.0** (priorità 1–4): **~70–90h di sviluppo**

---

## Note sul path

- L'i18n va fatta **prima della release pubblica** perché determina l'immagine del prodotto. Un software con 6 lingue rotte è peggio di un software monolingua dichiarato.
- Il Session Recording è la feature più richiesta dagli operatori broadcast (archivio + monitoraggio legale in molti paesi).
- Lo Smart Mic può essere consegnato come **beta opt-in** nella v1.0.0 e stabilizzato in v1.1.0.
- I test possono crescere organicamente post-1.0.0, ma almeno la copertura di `evaluateMix` è consigliata prima.
- Il Native Audio Module è de facto rimosso dal backlog fino a prova contraria.

---

*Documento creato il 2026-04-10 — versione 0.16.5*
