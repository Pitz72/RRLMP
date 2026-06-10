# Relazione Tecnica — Runtime Live Machine Pro

**Ultima analisi**: 10 giugno 2026 — **Revisione completa logiche di regia** (manuale / semiautomatica / automatica PRE-SHOW, 4 agenti + verifica empirica Vitest): 6 GRAVISSIME, 8 GRAVI, 11 MEDIE, 8 LIEVI → cura a cluster (A fade/mix, D semantica transizioni, C rotazione, B stop/race, MEDIE, LIEVI)  
**Versione corrente**: 1.4.12 — revisione regia 2026-06-10 CHIUSA (33 reperti, v1.4.6→v1.4.11) + fix MEDIA-05 (uncaught exception main su media://)  
**Stack**: Electron 28.3.3 · React 18.2.0 · TypeScript 5.3.3 · Zustand · Web Audio API · FFmpeg · Vitest (test motore audio)

---

## STORICO FIX

| Versione | Commit | Modifiche |
| ---------- | -------- | --------- |
| **v1.4.12** | — | **Fix MEDIA-05 — uncaught exception nel main dal protocollo `media://`** (segnalato in regia caricando molti brani in PRE-SHOW: dialog "Controller is already closed", app non crashata). Causa: race nota di `Readable.toWeb` — il client che annulla la richiesta a stream in corso (loadClip di massa con cleanup immediato, preload v1.4.10 scartato, cambio src) chiude il controller web e l'evento `close` del ReadStream prova a richiuderlo → `ERR_INVALID_STATE` uncaught. Fix: adapter manuale `toSafeWebStream` (close/enqueue/error idempotenti, `cancel()` distrugge il ReadStream, backpressure pause/resume) in entrambi i rami Range/full; risposte HTTP invariate. Typecheck main 0, 58/58 verdi, exe `builds/v1.4.12/`. |
| **v1.4.11** | — | **Blocco LIEVI + chiusura revisione regia 2026-06-10.** **#27**: il loop vince su play_next (niente fadeOut di transizione né transizioni mentre `isLooping`; prima il timeout del crossfade uccideva il loop al 2° giro). **#28**: `onAirStartTime` azzerato da stopClip quando non resta nulla in onda (timer ON AIR non conta più nel silenzio). **#29**: semantica `suppressedClips` documentata (valore=flag, ripristino dal volume corrente — deliberato). **#30**: `BufferPlayer.ts` RIMOSSO (orfano, zero import; il playout usa solo StreamPlayer dal fix OOM). Documentate decisioni design: #31 anti-repeat deterministico con 2 clip, #32 fine playlist PRE-SHOW senza wrap-around (riempitivo NON infinito), #33 anti-repeat cross-progetto innocuo. **Revisione chiusa: 33/33 reperti curati** (6 GRAVISSIME, 8 GRAVI, 11 MEDIE, 8 LIEVI in v1.4.6→v1.4.11). 58/58 test verdi (+14 vs v1.4.5), typecheck 0, vite build OK. ⚠️ Verifica in regia: transizioni (curve reali per la prima volta), clip "Default Globale", STOP ALL, comportamenti rotazione, doppio click, gapless preload. |
| **v1.4.10** | — | **Blocco MEDIE residue (revisione regia 2026-06-10) — 5 reperti.** **#17**: preload della next (`_preloadedNext`, max 1 player) — il gapless non carica più da disco al momento della transizione (gap udibile su storage lento); scartato su stopAll/cambio successore. **#20**: nuovo callback `onPlaybackError` su StreamPlayer/IAudioPlayer — errore media a metà brano (drive scollegato) ora fa stop pulito + avanzamento automatico della catena (con recupero rotazione se era l'inserto); prima clip "zombie" e dead air. **#18**: `player.cleanup()` nel catch di playClip (nodi Web Audio orfani su load falliti). **#19**: `playColumn` salta le clip `isMissing` (hotkey colonna non più muta). **#16**: outro marker incoerente con trim/durata azzerato con avviso in ClipSettingsModal + sanificazione `.lmp` in `validateLmpProjectData`. 58/58 verdi, typecheck 0. |
| **v1.4.9** | — | **Cluster B Stop/Race (revisione regia 2026-06-10) — 1 GRAVISSIMA + 1 MEDIA.** **#3**: stop/Emergency Stop non invalidavano i `playClip` in volo (load asincrono) né i setTimeout 20ms del sequencer → audio che partiva DOPO lo stop (catena PRE-SHOW che ripartiva sotto la sigla, clip dopo l'Emergency Stop). Fix: `stopClip` fa `playRunIds.delete`, `stopAll` fa `playRunIds.clear()` + cancella i timeout del sequencer (`_sequencerTimeouts`/`scheduleSequencerPlay` su tutti gli avvii differiti). **#21**: doppio click/hotkey/MIDI durante il load ora ANNULLA il lancio (prima la clip partiva comunque); nuovo `opts.machine` su `playClip` — i lanci del sequencer/rotazione non annullano un load operatore in volo. 58/58 verdi, typecheck 0. |
| **v1.4.8** | — | **Cluster C Rotazione PRE-SHOW (revisione regia 2026-06-10) — 2 GRAVISSIME + 5 GRAVI + 3 MEDIE.** La parte esecuzione/ripristino della rotazione v1.4.0 dipendeva solo dall'`onEnded` naturale. **#4**: stop manuale dell'inserto → stato stale + "ghost resume" (PRE-SHOW che ripartiva sotto lo show al rilancio dello stesso jingle); ora `stopClip` dell'inserto azzera lo stato (`clearPendingInsertState`), la fine naturale resta gestita (onEnded cattura lo stato PRIMA di stopClip). **#2-rot**: inserto fallito al load → `recoverFromInsertFailure` (drain coda o ripresa playlist) da Integrity Guard e catch. **#9**: guardia inserto in onPreEnd/onOutroReached (clip spostate in JINGLE con play_next → doppio avvio). **#10**: marcatore `_transitionFiredFor` — il fallback onEnded non rilancia un next già transizionato (inserto/brano corto suonato 2 volte). **#11**: lancio music/voice = takeover → ripresa pendente annullata (SFX/jingle manuali no). **#12**: lancio manuale PRE-SHOW durante inserto → inserto fermato, playlist dal punto scelto. **#13**: `pickRandomFromColumn` esclude le clip in onda (toggle-stop troncava il jingle attivo). **#23**: contatore azzerato solo a pesca riuscita (slot non più bruciato su colonna vuota). **#24**: `_pendingResumeSourceId` → fallback di ripresa se la clip è stata cancellata. **#25**: drain coda con re-check config per categoria + skip mancanti. +2 test (58/58 verdi), typecheck 0. |
| **v1.4.7** | — | **Cluster D Semantica transizioni (revisione regia 2026-06-10) — 2 GRAVISSIME + 3 GRAVI + 1 LIEVE.** Nuovo helper centralizzato `resolveTransitionType(clip,colId)` usato da tutti i lettori. **#7**: la voce "Default Globale" persisteva la stringa `'default'` → si comportava sempre come gapless; fix in `handleSave` ('default'→undefined) + **migrazione `.lmp`** in `validateLmpProjectData` (rimuove transitionType non validi). **#8**: fallback incoerente play-setup vs transizione → brani concatenati fuori PRE-SHOW troncati di `crossfadeDuration`; ora entrambi risolvono gapless fuori PRE-SHOW. **#5**: next già in onda → `playClip` toggle-stop la spegneva (dead air); guardia anche in `applyTransitionAndPlayNext`. **#6**: `getNextClipInColumn` salta le clip `isMissing` (prima: catena morta con la corrente già sfumata a zero). **#14**: nuova azione `syncActiveClipSettings` (chiamata dal salvataggio modale) riallinea il player in onda: fadeOut transizione ricalcolato, trim/marker, volume+loudness, evaluateMix. **#26**: fadeOut di transizione armato solo se esiste un successore (l'ultima clip finisce col finale naturale). Bonus: il 2° `updateSettings` post-load non sovrascrive più il crossfade-in one-shot. Preview transizione allineata all'on-air. +8 test (`resolveTransitionType.test.ts`, 56/56 verdi), typecheck 0. |
| **v1.4.6** | — | **Cluster A Fade/Mix (revisione regia 2026-06-10) — 2 GRAVISSIME + 2 MEDIE.** **#1**: `evaluateMix` annullava le rampe delle transizioni — la clip uscente in crossfade/segue risaliva a volume pieno (riapplicazione del volume nominale via `fadeTo`+`cancelScheduledValues`) e la clip entrante perdeva il fade-in (applicazione istantanea `fadeTo(target,0)` che cancellava la rampa di `play()`): i crossfade erano di fatto sovrapposizioni a volume pieno. Fix: `evaluateMix` **salta le clip in `fadingClipIds`** (nuovo param `mixState`, i chiamanti in `set()` passano lo stato post-update) + `StreamPlayer.fadeInUntil`: `fadeTo(v,0)` durante un fade-in ri-traccia la rampa verso il nuovo target invece di cancellarla. **#2**: `stopClip` non rimuoveva la clip da `fadingClipIds` e cancellava il timeout che l'avrebbe fatto → id fantasma a OGNI crossfade completato naturalmente (badge FADING permanente + doppio audio al replay per skip della conflict resolution). Fix: rimozione sempre, anche nel ramo non-attiva. **#15**: `pendingCrossfadeFadeIn` consumato in cima a `playClip` (prima degli early-return) — non "sporca" più la prossima clip qualsiasi con un fade-in 2s. **#22**: clip soppresse da stacco tenute a 0 da `evaluateMix` anche fuori da col-assets (prima "rimbalzavano" su); l'avvio manuale rimuove la soppressione. ⚠️ **Le transizioni ora suonano come configurate per la prima volta — verifica d'ascolto in regia necessaria.** +4 test (48/48 verdi), typecheck 0. |
| **v1.4.5** | — | **Test automatici del motore audio (Vitest).** Introdotta suite di test unitari sul renderer (priorità roadmap). Toolchain isolata dal build (**Vitest 2 + jsdom 25**, `vitest.config.ts` env jsdom, `test/setup.ts` con stub `AudioContext`/`window.electron`, script `test`/`test:watch`). **44 test, 5 file, tutti verdi**: `capPlayoutLog` (3), `computeLoudnessGain` (9, omologazione+clamp ±9 dB), `evaluateMix` (14, ducking/stacco/mic/guardia NaN/durata), `resolvePreshowNext` (9, rotazione PRE-SHOW: intervalli, memoizzazione anti doppio-incremento, collisione jingle+promo, preview, fine-lista), `pickRandomFromColumn`+`getColumnForClip` (9, anti-repeat/skip mancanti/lookup). Unica modifica di produzione: **keyword `export`** su 7 helper finora privati di `useAudioStore.ts` (zero cambi di logica), per testarli come unità. Sfrutta `destroyAudioStoreLoop()` (v1.2.27) per il teardown. Typecheck renderer **0 errori**, nessun impatto su audio/`.lmp`/impostazioni. |
| **v1.4.4** | — | **Audio Monitor nel Debug Overlay (verifica in regia).** Nuovo blocco "Audio Monitor" nel Debug Overlay (Ctrl+Shift+D), readout live (polling 100ms solo a overlay aperto): **Glue Multibanda GR** (`getCompressorReduction`, max tra le 3 bande), **Limiter GR** (`getLimiterReduction`), stato **Omologazione** (ON/OFF + target), e per ogni clip in onda **loudness LUFS → guadagno applicato** (clamp ±9 dB) o "non misurata". Rende osservabili in regia le novità v1.4.2/v1.4.3. Sfrutta funzioni `AudioContextManager` già presenti ma non consumate. Hook prima dell'early-return, intervallo ripulito alla chiusura. Strumento diagnostico: **nessun impatto su audio/.lmp/impostazioni**. Typecheck 0, `vite build` OK. |
| **v1.4.3** | — | **Omologazione Volume Clip (loudness EBU R128).** Le clip vengono allineate a un target di loudness comune con un **guadagno statico per clip** (modello ReplayGain) — niente compressione/pompaggio, niente re-encode. Nuova `AudioProcessor.measureLoudness` (FFmpeg `ebur128`, read-only) → IPC `measure-loudness` (concurrency 2, timeout 65s) → preload `measureLoudness`. Valore cachato su `AudioClip.loudnessLufs` (persistito `.lmp`, additivo), misurato una volta in `loadClip` (on-add, background) + fallback fire-and-forget in `playClip` (self-healing per `.lmp` vecchi), guardato per-path. Applicazione in `playClip`: `computeLoudnessGain` = target − LUFS **clampato a ±9 dB**, composto con volume utente e MIDI velocity in `effectiveVolume` (clamp 0–1.5), alimenta StreamPlayer + evaluateMix (ducking coerente); store/.lmp `volume` manuale non toccato. **Fail-safe**: disattivo o non misurato → guadagno 1.0 (comportamento invariato). UI tab Master Chain: sezione "Omologazione Volume Clip" (toggle default ON + slider target −23…−12, default −16 LUFS). Persist localStorage. Typecheck 0, `vite build` OK. Verifica in regia consigliata. |
| **v1.4.2** | — | **Master Glue Multibanda (calore/morbidezza) + fine ricompressione aggressiva.** Sospetto regia "audio ricompresso" verificato oggettivamente (OfflineAudioContext + EBU R128): non è re-encode di codec e il resample 44.1→48k è trasparente; la causa era la Master Chain mono-banda di default (comp −18/4:1 + **makeup gain implicito** della `DynamicsCompressorNode` di Chromium) che portava un master −14 LUFS a **−10.6 LUFS (+3.5 LU)** schiacciando la dinamica (crest −1.46 dB) e boostava i quieti +5.75 dB. **Sostituita con Glue Multibanda 3 bande** (crossover LR4 200/2500 Hz, preset gentile tarato offline: low −30/2:1, mid −26/2:1, high −30/1.6:1) con routing **dry/wet**: i compressori restano sempre nel grafo col preset glue e si **aggirano** azzerando `wetGain`/aprendo `dryGain` (mai messi a ratio 1 — verificato che a ratio 1 il makeup di Chromium dà comunque +4 LU e **clipping**). `mbSum=0.47` neutralizza il makeup. Misure: glue ON = livello **neutro** (±0.5 LU) + LRA 3.2→2.6 (glue gentile) + true peak ≤ −1; chain OFF identico al bypass. HPF default 30 Hz (calore bassi, era 80). UI: sezione "Glue Multibanda — Calore & Morbidezza" (rimossi slider soglia/ratio, preset fisso). `MasterChainSettings` shape invariata (compat persistenza). Nessun impatto `.lmp`. Typecheck 0, `vite build` OK. Verifica in regia ancora consigliata. |
| **v1.4.1** | — | **Fix bottone COPY del LOG STREAM (Debug Overlay)** — dava errore e non copiava. Causa: `setPermissionRequestHandler` (main) negava tutto tranne `media` (NEW-ME-05 v1.2.26) → `navigator.clipboard.writeText` richiede `clipboard-sanitized-write`, negato → Promise rigettata. Fix: handler concede SOLO `clipboard-sanitized-write` (scrittura testo su gesto utente, basso rischio; webcam e resto restano negati) + `DebugOverlay.copyLogs()` reso async con try/catch e fallback `execCommand('copy')`. Typecheck 0 errori. |
| **v1.4.0** | — | **Colonne Jingle&Promo + rotazione automatica PRE-SHOW** (feature — bump MINOR, lavorata come 1.3.21 e promossa a 1.4.0). Due nuove colonne fisse JINGLE/PROMO (2ª/3ª posizione, riusano `type:'asset'` — id stabili `col-jingle`/`col-promo`, nessun nuovo ClipType: una clip lanciata da sola resta un normale asset). Motore di rotazione **confinato alla sola PRE-SHOW** (modello AzuraCast, NON automazione dello show — vedi VISION): ogni X brani un jingle a caso, ogni Y un promo, a fine brano con le transizioni esistenti, **mai sovrapposti**, poi ripresa playlist. Due contatori indipendenti (collisione → jingle poi promo in sequenza). `resolvePreshowNext` con **decisione memoizzata per clip-sorgente** (coerenza tra `onPreEnd` ~50ms e fallback `onEnded` in gapless: niente doppio incremento/avvio). Anti-repeat, colonna vuota saltata. Config persistita su `col-preshow.rotation` (**default spenta** → comportamento invariato), contatori runtime (reset su STOP ALL e su lancio Show Asset). **Migrazione `.lmp`**: colonne iniettate a destra di assets se assenti, rotation sanitizzata; progetti a 5 colonne restano validi. Nuovo `RotationSettingsModal` + trigger in `ColumnHeader` (solo PRE-SHOW). Typecheck 0 errori, `vite build` OK. |
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
| **v1.3.5** | — | **MODAL-02/03/04/05/08** (cumulativa Modali): ESC chiude `GeneralSettingsModal` e `KeymappingModal` senza propagare a Emergency Stop · timeout 5s su `enumerateDevices` · timeout 5s su `checkForUpdates` (AbortController) · MIDI Learn valida esistenza clip prima di scrivere bind. |
| **v1.3.6** | — | **ASSET-02/06/07** (cumulativa Asset): **ASSET-02 GRAVE** `e.repeat` ignorato → autorepeat OS lanciava jingle 30×/s in diretta; ora bloccato · KeymappingModal detect conflitto keybind con `confirm()` Promise-based (no `window.confirm` che freezerebbe l'audio) · `validateLmpProjectData` normalizza `keybind`/`midiBind` undefined → `''` per `.lmp` v1.2.x. |
| **v1.3.7** | — | **BUILD-01/02/05** (cumulativa Build): **BUILD-02 GRAVE** `requestSingleInstanceLock` + handler `second-instance` (con focus + restore + inoltro `.lmp` argv) — niente più doppia istanza audio in diretta · `setAppUserModelId('com.antigravity.rrlmp')` allineato a build.appId · cache localStorage 24h su `checkForUpdates` (param `force` per bypass). |
| **v1.3.8** | — | **AUDIT-GR-01..06 + 3 feature** (cumulativa audit 2026-05-29): **6 GRAVI** — validazione path `save-project-direct` (.lmp assoluto) · `convert-recording` valida input (temp recording) + output (estensione audio) prima di convertire/unlink · `open-external`/`setWindowOpenHandler` solo http/https (helper `isSafeExternalUrl`) · recording stream con handler `'error'` + backpressure + guard doppio-start · `AudioRecorder.stop()` idempotente + flag `_stopInFlight` (no perdita registrazione su doppio-stop/cap) · setTimeout crossfade/segue tracciati in `_transitionTimeouts` e cancellati in stopClip/stopAll. **3 FEATURE** — sync archivio audio in `export-project` (pruning orfani, no accumulo) · `moveClip` cross-colonna usa `destCol.customColor` e preserva proprietà clip · nextAction/transitionType LIVE su clip in esecuzione (`getFreshClipById`). |
| **v1.3.9** | — | **Audit MEDIE — Blocco 1 Audio Engine** (`useAudioStore`): **progress NaN** in `_syncProgress` (NaN ≠ NaN → re-render ogni 100ms + ClipCard rotta) ora calcolato con `time` finito e clampato a [0,1] · **volume guardia finita** in `evaluateMix` — clamp difensivo `Number.isFinite` → [0,1.5] prima di `fadeTo` (no GainNode in stato indefinito da volume/duckingFactor NaN). Verificati non-issue: mic-disable (disarm già completo), evaluateMix/suppressedClips (stato inerte, non azionato per stabilità). |
| **v1.3.10** | — | **Audit MEDIE/LIEVI — Blocco 2 Waveform/Editor**: **peaks stale** in `WaveformEditor` — guardia `cancelled` anti-race su `getWaveformData` (cambio clip rapido non sovrascrive più con la waveform del file sbagliato) · **marker/trim senza clamp** — i Quick Set Trim Start/End ora clampano come il drag (no regione di taglio invalida) · **optimizeTime no guard** (`helpers.ts`) — formatter mm:ss normalizza input NaN/negativo a 0 (niente più "NaN:NaN"). |
| **v1.3.11** | — | **Audit MEDIE/LIEVI — Blocco 3 MIDI**: **canale/Note-Off/modificatori** — `MidiManager` e `App.tsx` mascherano il nibble alto (`command & 0xF0`) per riconoscere Note On/CC su tutti i 16 canali (prima solo canale 1: `144`/`176`); Note Off e Note On vel-0 restano filtrati; bind channel-agnostic invariato · **click MIDI-Learn suona** (`ClipCard`) — in Learn mode il click semplice ora fa selezione singola invece di `playClip` (niente più clip in onda durante l'assegnazione). |
| **v1.3.12** | — | **Audit MEDIE/LIEVI — Blocco 4 Recording**: **recording stato globale** (`useRecordingStore`) — `_stopInFlight` ora azzerato anche in `startRecording`/`reset` (un flag bloccato da uno stop appeso o hot-reload non impedisce più di fermare le sessioni successive) · **RecordingExportModal `?.` mancante** — optional chaining su `data` nel listener `onExportProgress` (no crash su payload IPC assente). |
| **v1.3.13** | — | **Audit MEDIE — Blocco 5 Project/Grid**: **moveClip same-column fragile** (`useProjectStore`) — il riordino intra-colonna riusa l'array già privato di `oldIndex` invece di ri-derivare da `sourceCol` originale (logica unificata, risultato identico) · **id clip duplicati** — dedup al load in `validateLmpProjectData` (id ripetuti rigenerati con `crypto.randomUUID`, la prima occorrenza vince) · **MainGrid hotkey deps** — `columns` letto via `getState()`, deps ridotte a `[editingClip, playColumn]` (no ri-registrazione del listener a ogni mutazione), rimosso `stopAll` inutilizzato. |
| **v1.3.14** | — | **Audit MEDIE/LIEVI — Blocco 6 Utils/Misc** (ultimo): **updateChecker non-semver** — `compareSemver` (no prompt di downgrade su versione remota più vecchia) · **useVUMeter analyser stale** — analyser ri-letti a ogni frame + buffer dinamici (no livelli congelati al cambio device) · **toast timer leak** — timer auto-remove tracciati e cancellati in `removeToast` · **PlayoutLog clear senza confirm** — conferma Promise-based prima dello svuotamento · **console.log path in prod** (`AudioProcessor`) — 5 log path → `logger.info` dev-gated. **Rinviati con motivazione:** pathUtils UNC (richiede coord. main+renderer + test rete), DragHandle inline (micro-perf senza impatto). |
| **v1.3.15** | — | **Blocco Cleanup (post-audit)** — basso rischio, nessun cambio comportamento runtime: **DragHandle estratto a componente top-level** (`WaveformEditor`) con props esplicite (`duration`/`dragging`/`startDrag` + leftPct/marker/color/label/show) — niente più remount dei 4 handle a ogni render (chiude il rinvio "DragHandle inline" di v1.3.14) · **rimozione simboli morti** — `DebugOverlay` (import `useProjectStore`/`useEffect`/`useState` + var `audioStoreState`), `MainGrid` (destrutturazione `addClip` mai usata): renderer da 13 → 8 errori TS, 0 aggiunti. **Non eseguito:** rimozione `suppressedClips` — verificato attivamente scritto/letto nel path `stacco` del mix, NON è codice morto. **Rinviato:** pathUtils UNC (invariato). |
| **v1.3.20** | — | **Design brief Jingle&Promo + nota hardware Rødecaster** (solo doc, zero codice): nuovo `docs/design/jingle-promo-preshow.md` (prompt di riferimento + contesto tecnico per la prossima sessione: rotazione jingle/promo nella sola PRE-SHOW, modello AzuraCast, punto d'aggancio `applyTransitionAndPlayNext`/`getNextClipInColumn`). ROADMAP: distinzione Rødecaster I (1 USB, escluso da compatibilità piena, solo manuale) vs II (riferimento, 2 input USB, multitraccia — da verificare via ricerca web). |
| **v1.3.19** | — | **Consolidamento documentazione roadmap** (solo doc, zero codice): `ROADMAP.md` e `VISION.md` erano fermi a v1.2.0 → riscritti e allineati a v1.3.18 + alla roadmap canonica di questo file. VISION: aggiunto confine di scopo esplicito + eccezione controllata PRE-SHOW (rotazione jingle/promo confinata alla fase di attesa pre-sigla, lo show resta manuale) + obiettivo multi-piattaforma Win/Linux/Mac. ROADMAP: stato 0 criticità, TIER 1/2 sincronizzati, sezione lavori strutturali (PRE-SHOW Jingle/Promo, Device/Routing+Mic Ducking Rødecaster con root-cause, Test Audio Engine). |
| **v1.3.18** | — | **Fix: colonna SHOW ASSETS rifiutava i file trascinati dall'OS** — la clip "spariva" al rilascio (sembrava persa). Causa: assets aveva `isLocked:true` hardcoded + il guard DND-04 (v1.3.4) rifiutava il drop nativo su colonne locked, mentre il `dragover` mostrava comunque l'indicatore (UX ingannevole) e non esisteva alcuna UI per sbloccare. Regressione rispetto a pre-v1.3.4, dove assets accettava i file. **Fix:** rimosso il guard `isLocked` in `MainGrid.handleNativeDrop` (copre anche i `.lmp` già salvati con assets locked, che il validatore non normalizza) + `DEFAULT_COLUMNS` assets `isLocked: true → false`. Il campo `isLocked` resta nel modello ma non blocca più nulla (nessuna UI lo attiva). Assets ora accetta i file come tutte le colonne. |
| **v1.3.17** | — | **Simulatore MIDI (strumento di test) + fix script `dev`** — abilita la verifica del MIDI senza hardware. **`MidiManager.simulateMessage(data)`** — inietta una terzina raw `[command, note, velocity]` nello stesso `handleMidiMessage` di un device fisico (esercita il masking dei 16 canali `& 0xF0` e il fan-out ai listener). **`MidiSimulatorModal.tsx`** — modale dietro hotkey **Ctrl+Shift+M** (coerente col Debug Overlay su Ctrl+Shift+D): tipo Note On/Note Off/CC, canale 1-16, nota, velocity. Solo superficie di test, nessun impatto sul path audio in onda. **Fix script `dev` (package.json)** — `set NODE_ENV=development && electron .` catturava lo spazio prima di `&&` → `NODE_ENV="development "` (spazio finale) → il check `=== 'development'` in `main/index.ts` falliva → Electron caricava il renderer **compilato (stale)** invece del server Vite live. Corretto con `set "NODE_ENV=development"` (forma quotata che elimina lo spazio). **Test verificati in regia:** MIDI canali ≠1 ✅, MIDI Learn (click seleziona + assegna nota) ✅, PlayoutLog "Svuota" con conferma ✅. |
| **v1.3.16** | — | **Blocco Types `window.electron`** — solo tipi, zero modifiche runtime: renderer typecheck **8 → 0 errori** (nuova baseline 0). **`types/index.ts`** — aggiunti `openExternal`, `getPlatform`, `saveRecordingBuffer` (handler già esposti dal preload ma mai dichiarati); `showSaveDialogRecording.format` ampliato a `webm\|wav\|mp3\|flac\|ogg`; `convertRecording.options` aggiunge `sampleDepth?: number`. **`BufferPlayer.ts`** — stub no-op `onIntroReached`/`onOutroReached` coerenti con altri callback non supportati (era TS2420 incompleto rispetto a `IAudioPlayer`). **`ClipSettingsModal.tsx`** — type alias locale `TransitionUIChoice = TransitionType \| 'default'` per lo state della dropdown (il valore `'default'` è sentinel UI, non un `TransitionType`); cast esplicito `as AudioClip['transitionType']` nel `handleSave` per preservare il comportamento runtime corrente. **Rinviato:** pathUtils UNC (invariato). |

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
✅ **MODAL-02** · GeneralSettingsModal ESC propagava a Emergency Stop — risolto in v1.3.5  
✅ **MODAL-03** · KeymappingModal ESC propagava a Emergency Stop — risolto in v1.3.5  
✅ **MODAL-04** · `enumerateDevices` senza timeout (modal freezeato su USB hang) — risolto in v1.3.5  
✅ **MODAL-05** · `checkForUpdates` senza timeout (Promise pendente fino a TCP timeout) — risolto in v1.3.5  
✅ **MODAL-08** · MIDI Learn senza validazione clip esistente — risolto in v1.3.5  
✅ **ASSET-02** · keydown global senza `e.repeat` guard → autorepeat OS = jingle balbettante — risolto in v1.3.6  
✅ **ASSET-06** · KeymappingModal accettava silenziosamente conflitti keybind — risolto in v1.3.6  
✅ **ASSET-07** · `validateLmpProjectData` non sanitizzava `keybind`/`midiBind` undefined — risolto in v1.3.6  
✅ **BUILD-01** · `setAppUserModelId` placeholder `'com.electron'` ≠ build.appId — risolto in v1.3.7  
✅ **BUILD-02** · no single-instance lock → doppia istanza audio in diretta — risolto in v1.3.7  
✅ **BUILD-05** · `checkForUpdates` no rate-limit (fetch ad ogni mount) — risolto in v1.3.7  

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

**0** — Blocco 1 (11) + Blocco 2 Persistenza (5) + Blocco 3 DnD+Media (5) + Modali (5) + Asset (3) + Build (3 in v1.3.7) chiusi. **Cumulative 32 fix dal 2026-05-16.** Le 18 della revisione globale precedente restano tutte chiuse. Unica area skippata deliberatamente: Output Device multi-routing (richiede test hardware su scheda audio esterna).

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

*Aggiornato a v1.3.7 (cumulativa Build BUILD-01/02/05; 3/3 selezionati) — totale 32 fix dal 2026-05-16. Scope: regia umana per show finiti (podcast, eventi, web radio). Funzionalità di automazione 24h, scheduling orario, cart automation, RDS, archivio musicale a rotazione non rientrano nel perimetro del progetto.*
