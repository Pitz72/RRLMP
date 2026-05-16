# Relazione Tecnica — Runtime Live Machine Pro

**Ultima analisi**: 16 maggio 2026 — Blocco 1 revisione esaustiva (Recording + MIDI) post-v1.3.0  
**Versione corrente**: 1.3.4  
**Stack**: Electron 28.3.3 · React 18.2.0 · TypeScript 5.3.3 · Zustand · Web Audio API · FFmpeg

---

## STORICO FIX

| Versione | Commit | Modifiche |
| ---------- | -------- | --------- |
| v1.2.6 | 7cfefe2 | GR-01, GR-02, GR-03, GR-04, GR-08 (bonus) |
| v1.2.7 | d7fe551 | GR-05, GR-07 (GR-06 già risolto nel codebase) |
| v1.2.8 | 061f41b | ME-01, ME-05 |
| v1.2.9 | 177aa98 | ME-03, ME-07 |
| v1.2.10 | 12dc386 | ME-02, ME-04, ME-06 |
| v1.2.11 | 8b3bf7d | LI-01, LI-02, LI-03, LI-04, LI-05 |
| v1.2.12 | ab4cbd4 | ESC Focus Guard — bugfix |
| v1.2.13 | 238de31 | Relazione: Waveform Editor, MIDI, Voice Tracking, ESC aggiornati — documentazione |
| v1.2.14 | e2c235c | Smart Mic Ducking: hold times configurabili + nota loopback USB mixer — miglioramento |
| v1.2.15 | c3b1bf6 | Auto-Silence Detection: soglia dinamica da volumedetect — miglioramento |
| v1.2.16 | e9a9df3 | **MIDI Velocity**: `playClip(velocityGain?)` scala volume per riproduzione, evaluateMix usa valore scalato per ducking · **Smart Cues**: `detectSmartCues()` silencedetect con soglia mean−3dB, bottone Auto in WaveformEditor · **Playout Log**: store runtime `playoutLog[]`, modal con badge ON AIR live, Export CSV · **Open-file OS**: NSIS `oneClick:false` + argv parsing con `fs.existsSync` guard |
| v1.2.17 | 5c31078 | **NEW-GR-01** `convertAudio()` con registro globale + hard timeout 30 min + kill su window-close/before-quit · **NEW-GR-02** `onOpenFile` (apertura `.lmp` da OS) ora gate `isDirty` con confirmThree Salva/Non Salvare/Annulla — niente più stopAll() accidentale in onda |
| v1.2.18 | f4b70c8 | **NEW-GR-03** timeout IPC `detect-smart-cues` 35s → 50s — copre sub-timeout FFmpeg interni (10s+30s=40s) + 10s grace, no più IPC_RATE_LIMITED a catena |
| v1.2.19 | 4d53ef4 | **NEW-GR-04** cap FIFO `playoutLog` a 2000 entry — niente più degrado memoria su sessioni broadcast lunghe |
| v1.2.20 | 0628c42 | **NEW-GR-05** MicManager session token su `_poll`/`_setActive`/timer callbacks — re-arm rapido non lascia più `isMicActive=true` fantasma |
| v1.2.21 | 6a7f78d | **NEW-GR-06** CSP `'unsafe-eval'` rimosso in produzione — superficie XSS ridotta, fast-refresh Vite preservato in dev |
| v1.2.22 | 40784eb | **NEW-ME-01** toast dedicato per `IPC_RATE_LIMITED` su WaveformEditor (Smart Cues) e ClipSettingsModal (Auto-Trim); toast success/warning quando Smart Cues va a buon fine |
| v1.2.23 | 38b7156 | **NEW-ME-02** `playClip` ora controlla `activeClips[id]` PRIMA della conflict resolution di colonna — doppio-click/MIDI duplicato non silenzia più la colonna |
| v1.2.24 | 05b9dfd | **NEW-ME-03** sanitize numerici in `validateLmpProjectData` (volume/pan/trim/marker/fade/duration) — niente più bus muto da volume=NaN |
| v1.2.25 | cc9460e | **NEW-ME-04** ClipCard `currentTime` derivato da `activeState.progress` invece di `setInterval` 200ms locale — niente più 30 timer paralleli su cartwall pieno |
| v1.2.26 | b2dc97a | **NEW-ME-05** `setPermissionRequestHandler` ora nega `mediaTypes.video` — webcam non concessa anche se richiesta da terze parti |
| v1.2.27 | 5de2756 | **NEW-LI-01..07** (cumulativa): reset `_isMicActiveGlobal` su cleanup App · `import-m3u` normalize path · `destroyAudioStoreLoop()` esportato · `crypto.randomUUID()` su runId/playoutLog · `PlayoutLogModal` distingue cancel/error · `unhandledrejection` listener a module-load. NEW-LI-05 già coperta da v1.2.22 |
| **v1.3.0** | — | **Milestone Zero Criticità** — promozione di versione minore. Tutte le 18 criticità della revisione globale 2026-05-16 chiuse in v1.2.17–v1.2.27. Nessuna modifica codice rispetto a v1.2.27. |
| **v1.3.1** | — | **REC-01..08** (cumulativa Recording): validazione path `delete-temp-recording` (allow-list dir+regex basename) · `convert-recording` con `withIpcTimeout` 30 min · cap FIFO chunks 14400 + auto-stop pulito · reset esplicito store su start/stop fallito · cleanup difensivo `onExportProgress` · reset store su unmount App · sanitize filename Windows · try/catch su `ondataavailable`. |
| **v1.3.2** | — | **MIDI-01..03** (cumulativa MIDI): `onstatechange` azzera `onmidimessage` su disconnect (no doppio trigger su riconnessione) · clamp `note`/`velocity` a `[0,127]` in `handleMidiMessage` · `console.warn/error` → `debugLog()` strutturato in MidiManager e App.tsx. **Blocco 1 completo: 11/11 chiuse.** |
| **v1.3.3** | — | **PERSIST-01/02/04/06/09** (cumulativa Persistenza): auto-backup ora gate `isDirty` (no I/O su progetto pulito) · save atomico via `writeFileAtomicSync` (tmp+rename) su tutti i 3 handler · load JSON malformato torna ora errore esplicito + toast · log esplicito errori rotazione autosave · `loadProject` azzera selezione e MIDI Learn (con `preserveUiState` per Save/Save As). |
| **v1.3.4** | — | **DND-02/04/05 + MEDIA-03/04** (cumulativa DnD + media://): `moveClip` bounds check `oldIndex` + clamp `newIndex` · drop nativo rifiutato su colonna locked · filter renderer allineato a main (aggiunto webm/mp4) · Range header validato (416 su invalid) + clamp `end` a `fileSize-1` · `nodeStream.destroy(err)` su errore stream per propagare cancellazione al client. |

---

## CRITICITÀ RISOLTE

✅ **GR-01** · `setInterval` eterno nel corpo di `create()` Zustand — risolto in v1.2.6  
✅ **GR-02** · Race condition nel sequencer con generazioni di caricamento — risolto in v1.2.6  
✅ **GR-03** · Nessun timeout sugli IPC handler asincroni — risolto in v1.2.6  
✅ **GR-04** · Path traversal non validato nel protocollo `media://` — risolto in v1.2.6  
✅ **GR-05** · StreamPlayer: chiusure orfane e loop post-cleanup — risolto in v1.2.7  
✅ **GR-06** · `isAnalyzing: true` permanente su errore IPC silence detection — già risolto nel codebase  
✅ **GR-07** · Export zombie: loop continua dopo chiusura finestra — risolto in v1.2.7  
✅ **GR-08** · Stato `fadingClipIds` e `previewingClipIds` non puliti su `stopAll` — risolto in v1.2.6  
✅ **ME-01** · FFmpeg zombie in `AudioProcessor.ts` — risolto in v1.2.8  
✅ **ME-02** · Nessuna validazione struttura `.lmp` al caricamento — risolto in v1.2.10  
✅ **ME-03** · Auto-backup: race condition badge "Auto-saved" — risolto in v1.2.9  
✅ **ME-04** · Output device hot-switch senza retry su device ricollegato — risolto in v1.2.10  
✅ **ME-05** · `MicManager.arm()` lascia stream zombie su eccezione parziale — risolto in v1.2.8  
✅ **ME-06** · Typecast `as unknown as` su tipi noti — risolto in v1.2.10  
✅ **ME-07** · `evaluateMix` accede allo store ad ogni chiamata — risolto in v1.2.9  
✅ **LI-01** · `ErrorBoundary` non cattura errori asincroni — risolto in v1.2.11  
✅ **LI-02** · Nessun rate-limit sugli IPC handler dal renderer — risolto in v1.2.11  
✅ **LI-03** · `console.*` non strutturato in produzione — risolto in v1.2.11  
✅ **LI-04** · Singleton audio non distrutti su ricarica webview — risolto in v1.2.11  
✅ **LI-05** · Countdown MIDI Learn attivabile in doppio — risolto in v1.2.11  
✅ **ESC** · Emergency Stop globale attivo anche fuori focus — risolto in v1.2.12  
✅ **NEW-GR-01** · `convertAudio()` senza timeout/kill su finestra chiusa — risolto in v1.2.17  
✅ **NEW-GR-02** · Apertura `.lmp` da OS bypassava il gate `isDirty` — risolto in v1.2.17  
✅ **NEW-GR-03** · Timeout IPC `detect-smart-cues` troppo stretto — risolto in v1.2.18  
✅ **NEW-GR-04** · `playoutLog` array senza cap → degrado memoria sessioni lunghe — risolto in v1.2.19  
✅ **NEW-GR-05** · `MicManager._poll` callback dopo cleanup (race re-arm) — risolto in v1.2.20  
✅ **NEW-GR-06** · CSP `'unsafe-eval'` in produzione — risolto in v1.2.21  
✅ **NEW-ME-01** · `IPC_RATE_LIMITED` senza toast dedicato — risolto in v1.2.22  
✅ **NEW-ME-02** · `playClip` race su chiamata doppia — risolto in v1.2.23  
✅ **NEW-ME-03** · `validateLmpProjectData` non sanitizzava numerici — risolto in v1.2.24  
✅ **NEW-ME-04** · `ClipCard` setInterval per-clip ridondante — risolto in v1.2.25  
✅ **NEW-ME-05** · `setPermissionRequestHandler` approvava anche video — risolto in v1.2.26  
✅ **NEW-LI-01** · `_isMicActiveGlobal` non resettato su cleanup App — risolto in v1.2.27  
✅ **NEW-LI-02** · `import-m3u` non normalizzava path — risolto in v1.2.27  
✅ **NEW-LI-03** · Loop progress useAudioStore non distruttibile — risolto in v1.2.27  
✅ **NEW-LI-04** · UUID via `Math.random()` (runId/playoutLog) — risolto in v1.2.27  
✅ **NEW-LI-05** · Smart Cues senza toast su `success:false` — risolto in v1.2.22  
✅ **NEW-LI-06** · `PlayoutLogModal.handleExport` cancel vs error — risolto in v1.2.27  
✅ **NEW-LI-07** · `unhandledrejection` listener post-bootstrap — risolto in v1.2.27  
✅ **REC-01** · `delete-temp-recording` senza validazione path — risolto in v1.3.1  
✅ **REC-02** · `convert-recording` IPC senza timeout — risolto in v1.3.1  
✅ **REC-03** · `AudioRecorder.chunks[]` senza cap — risolto in v1.3.1  
✅ **REC-04** · `useRecordingStore` stato corrotto su stop fallito — risolto in v1.3.1  
✅ **REC-05** · `onExportProgress` cleanup non difensivo — risolto in v1.3.1  
✅ **REC-06** · `timerIntervalId` non clearato su window-close — risolto in v1.3.1  
✅ **REC-07** · `defaultName` non sanitizza caratteri Windows — risolto in v1.3.1  
✅ **REC-08** · `ondataavailable` senza try/catch — risolto in v1.3.1  
✅ **MIDI-01** · `onstatechange` non azzerava `onmidimessage` su disconnect (doppio trigger) — risolto in v1.3.2  
✅ **MIDI-02** · `velocity` MIDI non validata a monte (`[0,127]`) — risolto in v1.3.2  
✅ **MIDI-03** · `console.warn/error` invece di `debugLog()` strutturato — risolto in v1.3.2  
✅ **PERSIST-01** · auto-backup ignorava `isDirty` (I/O su progetto pulito) — risolto in v1.3.3  
✅ **PERSIST-02** · save non-atomico (crash mid-write = file corrotto) — risolto in v1.3.3  
✅ **PERSIST-04** · load JSON malformato tornava `success:true` con raw string — risolto in v1.3.3  
✅ **PERSIST-06** · rotazione autosave silenziava errori `unlinkSync` — risolto in v1.3.3  
✅ **PERSIST-09** · `loadProject` non azzerava `selectedClipIds` / `isMidiLearnMode` — risolto in v1.3.3  
✅ **DND-02** · `moveClip` no bounds check su `oldIndex`/`newIndex` — risolto in v1.3.4  
✅ **DND-04** · drop nativo bypassava `isLocked` colonna — risolto in v1.3.4  
✅ **DND-05** · filter renderer mancava `webm`/`mp4` (incoerente con main) — risolto in v1.3.4  
✅ **MEDIA-03** · Range header `end` non clampato a `fileSize-1` — risolto in v1.3.4  
✅ **MEDIA-04** · errore stream non propagato al client (solo log) — risolto in v1.3.4  

---

## CRITICITÀ APERTE

**0 criticità aperte.** Blocco 1 (11/11), Blocco 2 Persistenza (5/5), Blocco 3 prima ondata DnD+Media (5/5) chiusi. Le 18 della revisione globale precedente restano tutte chiuse.

### Aree non ispezionate (secondo passaggio consigliato per future iterazioni)

Modali residui, output device multi-routing, asset library, build/distribution.

### Aree pulite confermate nel Blocco 1

- Race playClip (`playRunIds` con `crypto.randomUUID()` — NEW-LI-04 OK)
- MIDI Learn doppio countdown (LI-05 OK)
- Validazione struttura mapping (`validateLmpProjectData` con sanitize — NEW-ME-03 OK)
- Singleton `MidiManager.destroy()` chiamato in `App.tsx` cleanup
- IPC concurrency limiting (`withConcurrencyLimit`) per FFmpeg-heavy
- Tracking `activeConversions` + cleanup on window-close (NEW-GR-01 OK)
- Path validation `media://` whitelist (GR-04 OK)

---

## 2. FEATURE IN SCOPE — ROADMAP

> **Nota di scopo**: RRLMP è uno strumento per conduttori umani in sessioni finite — show live, podcast, eventi, web radio. Non è un sistema di playout automatizzato 24h. L'elenco seguente è stato ripulito da tutto ciò che appartiene all'automazione radio (scheduling orario, cart automation, RDS, archivio musicale a rotazione, spot break automatici) e riflette solo funzionalità utili nel contesto di un operatore in regia durante uno show.

---

### TIER 1 — Utili per il flusso di lavoro di show

**F-04 · Soundboard rapida per Jingle/Stinger**  
Pannello one-shot con tasti rapidi (F1–F12, numpad) che avvia clip senza interagire con la board principale. La colonna Assets con keybind copre già il caso base, ma un pannello dedicato sempre visibile ridurrebbe il tempo di reazione durante lo show. Da valutare se la board esistente è sufficiente con una mappatura più aggressiva.

**F-06 · Loudness Normalization per clip (LUFS)**  
Analisi FFmpeg offline (non real-time) a target EBU R128 per garantire coerenza sonora tra clip di origine diversa. La Master Chain gestisce il master ma non le differenze di gain clip-by-clip. Richiede solo un IPC FFmpeg aggiuntivo su `loudnorm` — effort basso.

**F-07 · Metadata streaming (Icecast/Shoutcast)**  
Invio "Now Playing" al server di streaming: artista, titolo della clip corrente via HTTP al mount point Icecast/Shoutcast. Rilevante per chi fa web radio. I metadati ID3 sono già estratti dalle clip music — l'integrazione è principalmente configurazione URL + HTTP.

**F-12 · Voice Tracking / Jingle Recording**  
Registrazione di inserti voce singoli con pre-roll della clip precedente e post-roll della successiva. Distinto dal Session Recording (che cattura l'intera sessione): produce file standalone pronti per essere inseriti nella board. Nello scope podcast/web radio.

**F-25 · OSC Integration**  
Controllo remoto da hardware fisico (MIDI-to-OSC bridge, TouchOSC, surface controller) per show con più operatori o setup scenici. Complementare al MIDI Learn esistente.

---

### TIER 2 — Miglioramenti qualità d'uso

**F-11 · Undo/Redo operazioni playlist**  
Aggiunta, rimozione e riordinamento clip sono irreversibili. Uno stack undo da 20–30 operazioni ridurrebbe il rischio di errori durante il setup pre-show. Effort medio (richiede snapshot immutabili delle colonne in Zustand).

**F-13 · BPM Detection automatica**  
Rilevazione BPM via FFmpeg per sincronizzare crossfade al beat della traccia. Utile per show musicali; marginale per podcast. Effort medio.

---

## 3. RIEPILOGO

### Criticità aperte

**0** — Blocco 1 (11) + Blocco 2 Persistenza (5) + Blocco 3 prima ondata DnD+Media (5) chiusi tra v1.3.1 e v1.3.4. Cumulative 21 fix dal 2026-05-16. Le 18 della revisione globale precedente (GR-01..LI-05 + NEW-*) restano tutte chiuse. Da ispezionare: aree minori (modali residui, output device multi-routing, asset library, build/distribution).

### Roadmap attiva

| ID | Effort | Descrizione |
| -- | ------ | ----------- |
| F-04 | Basso | Soundboard rapida Jingle/Stinger (valutare se keybind esistente è sufficiente) |
| F-06 | Basso | Loudness normalization LUFS per clip (FFmpeg `loudnorm`) |
| F-07 | Medio | Metadata streaming Icecast/Shoutcast |
| F-12 | Alto | Voice Tracking — registrazione inserti voce con pre/post-roll |
| F-25 | Medio | OSC Integration |
| F-11 | Medio | Undo/Redo operazioni playlist |
| F-13 | Medio | BPM Detection automatica |

---

*Aggiornato a v1.3.4 (cumulativa DnD+Media DND-02/04/05+MEDIA-03/04; Blocco 3 prima ondata 5/5) — totale 21 fix dal 2026-05-16. Scope: regia umana per show finiti (podcast, eventi, web radio). Funzionalità di automazione 24h, scheduling orario, cart automation, RDS, archivio musicale a rotazione non rientrano nel perimetro del progetto.*
