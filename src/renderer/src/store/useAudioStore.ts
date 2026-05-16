import { create } from 'zustand';
import { IAudioPlayer } from '../engine/AudioPlayer.interface';
import { StreamPlayer } from '../engine/StreamPlayer';
import { AudioClip, PlayoutLogEntry } from '../types';
import AudioContextManager from '../engine/AudioContextManager';
import { debugLog } from './useDebugStore';
import { useProjectStore } from './useProjectStore';
import { useSettingsStore } from './useSettingsStore';
import * as AUDIO_CONST from '../constants/audioConstants';

// v1.2.19 (NEW-GR-04): cap FIFO sul playoutLog per evitare degrado progressivo
// in memoria su sessioni broadcast lunghe (8h+ con jingle/SFX su tasti rapidi
// possono superare 5–10k entry). 2000 entry coprono ampiamente una diretta
// tipica; le più vecchie vengono droppate silenziosamente.
const MAX_PLAYOUT_LOG_ENTRIES = 2000;
const capPlayoutLog = (log: PlayoutLogEntry[]): PlayoutLogEntry[] =>
    log.length > MAX_PLAYOUT_LOG_ENTRIES ? log.slice(-MAX_PLAYOUT_LOG_ENTRIES) : log;

interface ActiveClipState {
    player: IAudioPlayer;
    isPlaying: boolean;
    progress: number;
    clip: AudioClip; // Init with full clip
}

interface AudioStore {
    activeClips: Record<string, ActiveClipState>;
    suppressedClips: Record<string, number>; // ID -> Original Volume

    // v0.14.5 — Timer On Air
    onAirStartTime: number | null; // timestamp ms del primo play, null quando idle

    // v0.14.9 — Clip in fade-out per transizione (crossfade/segue)
    fadingClipIds: string[];

    // v0.16.5 — Preview Transition: set di clip ID avviate in modalità preview
    previewingClipIds: string[];

    // v0.17.0 — Smart Mic: il microfono hardware è rilevato come voce attiva
    isMicActive: boolean;

    // Playout Log
    playoutLog: PlayoutLogEntry[];
    clearPlayoutLog: () => void;

    // Actions
    playClip: (clip: AudioClip, velocityGain?: number) => Promise<void>;
    loadClip: (clip: AudioClip) => Promise<void>;
    playColumn: (colIndex: number) => Promise<void>;
    updateOutputDevice: (deviceId: string) => void;
    stopClip: (clipId: string) => void;
    previewTransition: (clip: AudioClip) => Promise<void>;
    stopPreviewTransition: (clipId: string) => void;
    stopAll: () => void;
    setMicActive: (active: boolean) => void;

    // Internal loop
    _syncProgress: () => void;
}

const getBusForType = (type: string) => {
    const mgr = AudioContextManager.getInstance();
    switch (type) {
        case 'music': return mgr.getMusicBus();
        case 'preshow': return mgr.getMusicBus(); // Map Preshow to Music
        case 'voice': return mgr.getVoiceBus();
        case 'asset': return mgr.getAssetsBus(); // Assets usually voice-overs
        case 'sfx': return mgr.getSfxBus();
        default: return mgr.getMusicBus();
    }
};

/**
 * CENTRALIZED MIXING ENGINE (L4: Logic Documentation)
 * 
 * This function is the "brain" of the audio engine. It is called every time
 * a clip starts or stops to recalculate the target volume of all active clips.
 * 
 * Logic follows a hierarchy of priority:
 * 1. VOICE: Always 100% volume.
 * 2. STACCO: High priority jingles that mute other assets and duck music.
 * 3. MUSIC: Standard background, ducks when Voice or Stacco is active.
 * 4. ASSETS: Beds/Jingles that duck on voice or mute on music dominance.
 */
/**
 * newClipId (opzionale) — ID della clip appena avviata.
 * Per quella clip il gain viene applicato istantaneamente (duration=0) per evitare
 * il glitch "parte a pieno volume poi scende" quando il ducking è attivo.
 * Per tutte le altre clip già in play si usa duckingDuration (smooth).
 */
const evaluateMix = (activeClips: Record<string, ActiveClipState>, newClipId?: string, overrideDuration?: number) => {
    const activeValues = Object.values(activeClips);
    const duckingFactor = _duckingFactor;
    const duckingDuration = _duckingDuration;

    // 1. ANALYSIS: Scan for high-priority types currently playing
    // v0.17.0: isMicActive (Smart Mic) ha la stessa priorità di una clip voice
    const isVoiceActive = activeValues.some(c => c.clip.type === 'voice') || _isMicActiveGlobal;
    const isMusicActive = activeValues.some(c => c.clip.type === 'music');
    // Active Stacco defined as: An asset that is playing and has behavior 'stacco'
    const activeStacco = activeValues.find(c =>
        getColumnForClip(c.clip.id) === 'col-assets' && c.clip.behavior === 'stacco'
    );

    debugLog(`MIX EVAL: MusicActive=${isMusicActive}, VoiceActive=${isVoiceActive}, Stacco=${activeStacco ? activeStacco.clip.name : 'None'}`, 'info');

    activeValues.forEach(ac => {
        const { clip, player } = ac;
        let targetVolume = clip.volume; // Start with nominal volume set by user

        if (clip.type === 'voice') {
            // VOICE: Always nominal (never ducked)
            targetVolume = clip.volume;
        }
        else if (clip.type === 'music' || clip.type === 'preshow') {
            // MUSIC: Ducks if Voice or Stacco is active
            if (isVoiceActive || activeStacco) {
                targetVolume = clip.volume * duckingFactor;
            } else {
                targetVolume = clip.volume;
            }
        }
        else if (clip.type === 'asset' || getColumnForClip(clip.id) === 'col-assets') {
            // ASSETS (Beds, Jingles, Stacchi)
            // Rule 1: Self-Preservation (If I am the active Stacco, I stay full)
            if (activeStacco && activeStacco.clip.id === clip.id) {
                targetVolume = clip.volume;
            }
            // Rule 2: Stacco Suppression (If another Stacco is active, I mute)
            else if (activeStacco) {
                targetVolume = 0;
            }
            // Rule 3: Music Dominance (If Music active, assets/beds mute to avoid mud)
            else if (isMusicActive) {
                targetVolume = 0;
            }
            // Rule 4: Voice Ducking (If Voice active, I duck)
            else if (isVoiceActive) {
                targetVolume = clip.volume * duckingFactor;
            }
            // Rule 5: Normal
            else {
                targetVolume = clip.volume;
            }
        }
        else {
            // SFX / Others: Default behavior (duck half-way on voice)
            if (isVoiceActive) targetVolume = clip.volume * 0.5;
        }

        // APPLY: istantaneo per la clip appena avviata (evita glitch ducking),
        // smooth per le clip già in play. overrideDuration usato per mic-ducking rapido.
        const applyDuration = (newClipId && clip.id === newClipId) ? 0 : (overrideDuration ?? duckingDuration);
        player.fadeTo(targetVolume, applyDuration);
    });
};

const getNextClipInColumn = (currentClipId: string): AudioClip | null => {
    // Access Project Store directly
    const state = useProjectStore.getState();
    if (!state || !state.columns) {
        debugLog('AudioStore: ProjectStore invalid state', 'error');
        return null;
    }

    const { columns } = state;

    for (const col of columns) {
        const idx = col.clips.findIndex((c: AudioClip) => c.id === currentClipId);
        if (idx !== -1) {
            // Found column
            debugLog(`AudioStore: Found current clip in col ${col.id} index ${idx}`, 'info');
            if (idx + 1 < col.clips.length) {
                const nextClip = col.clips[idx + 1];
                debugLog(`AudioStore: Next clip identified: ${nextClip.name}`, 'event');
                return nextClip;
            }
            debugLog(`AudioStore: No next clip (End of list)`, 'info');
            return null; // End of list
        }
    }
    debugLog(`AudioStore: Current clip ${currentClipId} not found in any column`, 'error');
    return null;
};

// Helper to find column ID for a clip
const getColumnForClip = (clipId: string): string | null => {
    const { columns } = useProjectStore.getState();
    for (const col of columns) {
        if (col.clips.find(c => c.id === clipId)) return col.id;
    }
    return null;
}

// GR-02 Fix: Mappa run-ID per evitare race condition in playClip.
// Ogni invocazione di playClip genera un UUID unico per clipId;
// se al ritorno dell'await load() il run-ID non corrisponde più,
// l'operazione è obsoleta (superata da un play successivo) e viene scartata.
const playRunIds = new Map<string, string>();

// v0.13.2 — Transition System
// Clip in fade-out per transizione: gestito come stato Zustand (v0.14.9)
// Esposto come fadingClipIds[] per permettere a ClipCard di mostrare il badge "FADING OUT".

// Durata fadeIn da applicare alla PROSSIMA clip avviata come parte di un crossfade.
// Viene letta una sola volta da playClip e poi azzerata (pattern one-shot).
let pendingCrossfadeFadeIn: number | null = null;

// v0.17.0 — Smart Mic: stato globale microfono, aggiornato da setMicActive().
// Variabile module-level (come pendingCrossfadeFadeIn) per essere accessibile
// da evaluateMix() che è definita fuori dal create() callback.
let _isMicActiveGlobal = false;

// GR-01 Fix: flag module-level che garantisce un solo interval attivo,
// anche con React 18 StrictMode (double-invoke in dev) o hot reload multipli.
let _progressLoopStarted = false;
// v1.2.27 (NEW-LI-03): handle al loop globale per consentire teardown deterministico
// in scenari di test/E2E (Vitest, Playwright) — vedi `destroyAudioStoreLoop()`.
let _progressLoopHandle: ReturnType<typeof setInterval> | null = null;

/** v1.2.27 (NEW-LI-03): teardown esplicito del loop di progress globale.
 *  Usato dai test e dall'unmount finale di App.tsx (idempotente). */
export function destroyAudioStoreLoop(): void {
    if (_progressLoopHandle !== null) {
        clearInterval(_progressLoopHandle);
        _progressLoopHandle = null;
    }
    _progressLoopStarted = false;
}

// ME-07 Fix: cache module-level per i parametri ducking di useSettingsStore.
// evaluateMix() è definita fuori da create() — non può usare hooks né chiamare
// getState() ad ogni invocazione. Subscribe aggiorna i valori ad ogni cambio settings.
let _duckingFactor = useSettingsStore.getState().duckingFactor;
let _duckingDuration = useSettingsStore.getState().duckingDuration;
useSettingsStore.subscribe((state) => {
    _duckingFactor = state.duckingFactor;
    _duckingDuration = state.duckingDuration;
});

export const useAudioStore = create<AudioStore>((set, get) => {

    // GR-01 Fix: avvia il loop di progresso una sola volta per lifetime del modulo.
    if (!_progressLoopStarted) {
        _progressLoopStarted = true;
        _progressLoopHandle = setInterval(() => {
            if (Object.keys(get().activeClips).length > 0) {
                get()._syncProgress();
            }
        }, 100);
    }

    return {
        activeClips: {},
        suppressedClips: {},
        onAirStartTime: null,
        fadingClipIds: [],
        previewingClipIds: [],
        isMicActive: false,
        playoutLog: [],
        clearPlayoutLog: () => set({ playoutLog: [] }),

        playClip: async (clipArg: AudioClip, velocityGain?: number) => {
            const currentStore = get();

            // FRESH DATA FETCH
            const { columns } = useProjectStore.getState();
            const freshClip = columns.flatMap(col => col.clips).find(c => c.id === clipArg.id) || clipArg;
            const columnId = getColumnForClip(freshClip.id);

            // MIDI velocity scaling: scale volume without modifying the store
            const effectiveVolume = velocityGain !== undefined
                ? Math.max(0, Math.min(1.5, freshClip.volume * velocityGain))
                : freshClip.volume;
            const effectiveClip = effectiveVolume !== freshClip.volume
                ? { ...freshClip, volume: effectiveVolume }
                : freshClip;

            // Integrity Guard (v0.14.2): blocca playback per file mancanti
            if (freshClip.isMissing) {
                debugLog(`AudioStore: PlayClip bloccato — file mancante: ${freshClip.path}`, 'error');
                return;
            }

            // v1.2.23 (NEW-ME-02): se la clip è già attiva, comportati come "toggle stop"
            // e ritorna SUBITO, prima della conflict resolution di colonna. Senza questo
            // check anticipato, una chiamata doppia (doppio-click o MIDI Note duplicata)
            // fermava prima le clip in conflitto della colonna, lasciandola silenziosa.
            if (currentStore.activeClips[freshClip.id]) {
                debugLog(`AudioStore: PlayClip toggle-stop su ${freshClip.name} (già attiva)`, 'info');
                currentStore.stopClip(freshClip.id);
                return;
            }

            debugLog(`AudioStore: PlayClip ${freshClip.name} (Next: ${freshClip.nextAction}, Behavior: ${freshClip.behavior})`, 'event');

            // PRE-SHOW LOGIC: Stop Pre-Show if starting Show Assets
            if (columnId === 'col-assets') {
                const preShowClips = Object.values(currentStore.activeClips).filter(ac =>
                    getColumnForClip(ac.clip.id) === 'col-preshow'
                );
                if (preShowClips.length > 0) {
                    debugLog('AudioStore: Automatically stopping Pre-Show for Show Asset', 'info');
                    // G7 Fix: usa get() invece di currentStore (riferimento potenzialmente stale)
                    preShowClips.forEach(ac => get().stopClip(ac.clip.id));
                }
            }

            // Handle Intra-Column Conflict
            if (columnId) {
                // Find active clips in same column
                const sameColumnClips = Object.values(currentStore.activeClips).filter(ac => {
                    const acColId = getColumnForClip(ac.clip.id);
                    return acColId === columnId && ac.clip.id !== freshClip.id;
                });

                if (freshClip.behavior === 'stacco') {
                    // DUCK existing clips, don't stop them
                    sameColumnClips.forEach(ac => {
                        debugLog(`AudioStore: Suppressing ${ac.clip.name} for Stacco`, 'info');
                        // Store original volume if not already suppressed
                        const isAlreadySuppressed = currentStore.suppressedClips[ac.clip.id] !== undefined;
                        if (!isAlreadySuppressed) {
                            set(state => ({
                                suppressedClips: { ...state.suppressedClips, [ac.clip.id]: ac.clip.volume }
                            }));
                        }
                        ac.player.fadeTo(0, AUDIO_CONST.STACCO_FADE_DURATION); // Fast fade to silence
                    });
                } else {
                    // NORMAL behavior: Stop others in same column.
                    // v0.13.2: le clip in transizione (crossfade/segue) vengono saltate —
                    // il loro fade-out e stopClip sono già schedulati dal transition handler.
                    sameColumnClips
                        .filter(ac => !get().fadingClipIds.includes(ac.clip.id))
                        .forEach(ac => {
                            currentStore.stopClip(ac.clip.id);
                        });
                }
            }

            // GR-02 Fix: registra run-ID univoco prima del load asincrono.
            // v1.2.27 (NEW-LI-04): crypto.randomUUID per evitare collisioni rare su sessioni lunghe
            const runId = crypto.randomUUID();
            playRunIds.set(freshClip.id, runId);

            let player: IAudioPlayer = new StreamPlayer();

            try {
                // Audio Routing
                const targetBus = getBusForType(freshClip.type);
                player.setBus(targetBus);

                // Apply Settings
                // v0.13.2: se è stato richiesto un crossfade, sovrascriamo il fadeIn
                // della clip entrante con la durata del crossfade (one-shot, poi reset).
                const fadeInOverride = pendingCrossfadeFadeIn;
                pendingCrossfadeFadeIn = null;
                player.updateSettings(
                    fadeInOverride !== null
                        ? { ...effectiveClip, fadeIn: fadeInOverride }
                        : effectiveClip
                );

                // v0.13.2 — Helper per applicare la transizione corretta tra clip in sequenza.
                // Legge il tipo di transizione dalla clip corrente (override) o dal default globale.
                const applyTransitionAndPlayNext = (clipId: string) => {
                    const currentClip = get().activeClips[clipId]?.clip;
                    if (!currentClip || currentClip.nextAction !== 'play_next') return;

                    const nextClip = getNextClipInColumn(currentClip.id);
                    if (!nextClip) return;

                    // v0.16.5: se la clip corrente è in preview, anche la clip successiva
                    // viene tracciata come preview (hasPlayed non deve essere settato).
                    if (get().previewingClipIds.includes(clipId)) {
                        set(state => ({ previewingClipIds: [...state.previewingClipIds, nextClip.id] }));
                    }

                    const { defaultPreshowTransition, crossfadeDuration, segueDuration } = useSettingsStore.getState();
                    const colId = getColumnForClip(currentClip.id);
                    const isPreshow = colId === 'col-preshow';
                    const effectiveType = currentClip.transitionType
                        ?? (isPreshow ? defaultPreshowTransition : 'gapless');

                    debugLog(`AudioStore: Transition [${effectiveType}] ${currentClip.name} → ${nextClip.name}`, 'event');

                    if (effectiveType === 'crossfade') {
                        const currentPlayer = get().activeClips[clipId]?.player;
                        if (currentPlayer) {
                            set(state => ({ fadingClipIds: [...state.fadingClipIds, clipId] }));
                            currentPlayer.fadeTo(0, crossfadeDuration);
                            setTimeout(() => {
                                get().stopClip(clipId);
                                set(state => ({ fadingClipIds: state.fadingClipIds.filter(id => id !== clipId) }));
                            }, crossfadeDuration + 200);
                        }
                        // Imposta il fadeIn one-shot per la clip entrante
                        pendingCrossfadeFadeIn = crossfadeDuration;
                        get().playClip(nextClip);

                    } else if (effectiveType === 'segue') {
                        const currentPlayer = get().activeClips[clipId]?.player;
                        if (currentPlayer) {
                            set(state => ({ fadingClipIds: [...state.fadingClipIds, clipId] }));
                            // Segue usa la propria durata (fade-out rapido, entrante a pieno volume subito)
                            currentPlayer.fadeTo(0, segueDuration);
                            setTimeout(() => {
                                get().stopClip(clipId);
                                set(state => ({ fadingClipIds: state.fadingClipIds.filter(id => id !== clipId) }));
                            }, segueDuration + 200);
                        }
                        // La clip entrante parte subito a volume pieno (nessun fade-in forzato)
                        get().playClip(nextClip);

                    } else {
                        // gapless: comportamento esistente — la clip precedente viene fermata
                        // dalla conflict resolution di playClip in modo immediato.
                        get().playClip(nextClip);
                    }
                };

                // Sequencer Logic
                player.onPreEnd((clipId) => {
                    // Gapless: la clip termina naturalmente, onEnded gestirà il play_next
                    if (freshClip.nextAction !== 'play_next') return;
                    // Se c'è un Outro Marker, onOutroReached gestirà la transizione
                    if ((freshClip.outroMarker || 0) > 0) return;
                    applyTransitionAndPlayNext(clipId);
                });

                player.onIntroReached((clipId) => {
                    const clipName = get().activeClips[clipId]?.clip.name || 'Unknown';
                    debugLog(`🎤 Intro Ended for ${clipName} (Markers)`, 'event');
                });

                player.onOutroReached((clipId) => {
                    const currentClip = get().activeClips[clipId]?.clip;
                    if (!currentClip) return;
                    debugLog(`🔊 Outro Reached for ${currentClip.name}`, 'info');
                    if (currentClip.nextAction === 'play_next') {
                        applyTransitionAndPlayNext(clipId);
                    }
                });

                player.onEnded(() => {
                    debugLog(`AudioStore: Ended ${freshClip.name}`, 'info');
                    get().stopClip(freshClip.id);

                    if (freshClip.nextAction === 'play_next') {
                        const transition = freshClip.transitionType
                            ?? useSettingsStore.getState().defaultPreshowTransition;

                        // Gapless o Fallback: Se non è ancora partita la prossima clip, falla partire ora
                        const nextClip = getNextClipInColumn(freshClip.id);
                        if (nextClip) {
                            const isNextAlreadyActive = Object.values(get().activeClips).some(ac => ac.clip.id === nextClip.id);
                            if (!isNextAlreadyActive) {
                                debugLog(`AudioStore: Sequencer Play Next (${transition} at End)`, 'event');
                                setTimeout(() => get().playClip(nextClip), 20);
                            }
                        }
                    }
                });

                await player.load(freshClip.path);

                // GR-02 Fix: verifica che questa operazione di load sia ancora la più recente.
                if (playRunIds.get(freshClip.id) !== runId) {
                    debugLog(`AudioStore: Load obsoleto scartato per ${freshClip.name} (runId ${runId})`, 'info');
                    player.cleanup();
                    return;
                }

                // v0.14.10: imposta fadeOut dinamico per clip con play_next così onPreEnd scatta
                // al momento giusto per crossfade/segue (crossfadeDuration o segueDuration ms prima della fine).
                // v0.16.4: esteso a Music e Assets (rimosso guard type === 'preshow')
                if (freshClip.nextAction === 'play_next' && (freshClip.outroMarker || 0) <= 0) {
                    const { defaultPreshowTransition, crossfadeDuration, segueDuration } = useSettingsStore.getState();
                    const transType = freshClip.transitionType ?? defaultPreshowTransition;
                    if (transType === 'crossfade') {
                        player.updateSettings({ ...effectiveClip, fadeOut: crossfadeDuration });
                    } else if (transType === 'segue') {
                        player.updateSettings({ ...effectiveClip, fadeOut: segueDuration });
                    }
                }

                player.play();

                const logEntry: PlayoutLogEntry = {
                    id: crypto.randomUUID(), // v1.2.27 (NEW-LI-04)
                    clipId: freshClip.id,
                    clipName: freshClip.name,
                    artist: freshClip.artist,
                    title: freshClip.title,
                    clipType: freshClip.type,
                    startTime: Date.now(),
                };

                set((state) => {
                    // v0.14.5: avvia il timer On Air al primo play dopo idle
                    const wasIdle = Object.keys(state.activeClips).length === 0;
                    const newState = {
                        activeClips: {
                            ...state.activeClips,
                            [freshClip.id]: {
                                player,
                                isPlaying: true,
                                progress: 0,
                                clip: effectiveClip
                            }
                        },
                        onAirStartTime: wasIdle ? Date.now() : state.onAirStartTime,
                        playoutLog: capPlayoutLog([...state.playoutLog, logEntry]),
                    };
                    evaluateMix(newState.activeClips, freshClip.id);
                    return newState;
                });

            } catch (error: unknown) {
                // Standardized L2 error handling
                const errorMsg = error instanceof Error ? error.message : String(error);
                debugLog(`AudioStore: Failed to play ${freshClip.name} - ${errorMsg}`, 'error');
                console.error("Failed to play clip:", freshClip, error);
            }
        },

        loadClip: async (clip: AudioClip) => {
            let player: IAudioPlayer = new StreamPlayer();
            try {
                await player.load(clip.path);
                const duration = player.getDuration();
                // Silence detection for PRE-SHOW is handled via IPC in MainGrid.tsx (handleNativeDrop).
                // loadClip saves only the duration; trimStart/trimEnd come from the IPC result.
                const trimStart = clip.trimStart || 0;
                const trimEnd = clip.trimEnd || 0;

                // v0.16.4: estrai metadati ID3 (artist, title) se la clip è di tipo music
                let artist: string | undefined;
                let title: string | undefined;
                if (clip.type === 'music' && !clip.artist && !clip.title) {
                    try {
                        const meta = await window.electron.getAudioMetadata(clip.path);
                        if (meta.success && meta.data) {
                            const data = meta.data as Record<string, unknown>;
                            const tags = (data.common as Record<string, unknown>) || {};
                            if (typeof tags.artist === 'string' && tags.artist) artist = tags.artist;
                            if (typeof tags.title === 'string' && tags.title) title = tags.title;
                        }
                    } catch {
                        // non fatale: i tag ID3 sono opzionali
                    }
                }

                const { useProjectStore } = await import('./useProjectStore');
                useProjectStore.getState().updateClip(
                    clip.type === 'asset' ? 'col-assets' : `col-${clip.type}`,
                    clip.id,
                    { duration, trimStart, trimEnd, ...(artist !== undefined ? { artist } : {}), ...(title !== undefined ? { title } : {}) }
                );
                player.cleanup();
            } catch (e) {
                // Standardized error handling
                debugLog(`AudioStore: Failed to load metadata for ${clip.name}`, 'error');
                console.error("Failed to load clip metadata", clip.path, e);
                player.cleanup();
            }
        },

        playColumn: async (colIndex: number) => {
            const { columns } = useProjectStore.getState();
            if (colIndex < 0 || colIndex >= columns.length) return;

            const targetCol = columns[colIndex];
            const currentStore = get();

            // Find first available clip (not currently playing)
            const availableClip = targetCol.clips.find(clip => !currentStore.activeClips[clip.id]);

            if (availableClip) {
                await get().playClip(availableClip);
            } else if (targetCol.clips.length > 0) {
                debugLog(`AudioStore: playColumn(${colIndex}) -> All clips in column are already playing`, 'info');
            }
        },

        updateOutputDevice: (deviceId: string) => {
            debugLog(`AudioStore: Update Audio Graph Output Device -> ${deviceId}`, 'info');
            // GR2/GR11 Fix: Il routing usa Web Audio API, cambiamo sinkId sul Context principale.
            AudioContextManager.getInstance().setOutputDevice(deviceId);
        },

        stopClip: (clipId: string) => {
            set((state) => {
                const active = state.activeClips[clipId];
                if (active) {
                    active.player.stop();
                    active.player.cleanup();

                    const newActiveClips = { ...state.activeClips };
                    delete newActiveClips[clipId];

                    // G4 Fix: gestione di suppressedClips.
                    // Se la clip fermata era uno STACCO, svuotiamo completamente
                    // suppressedClips così evaluateMix può ripristinare liberamente
                    // i volumi di tutte le clip rimaste attive.
                    // Se era una clip normale soppressa, rimuoviamo solo la sua entry.
                    const wasStacco = active.clip.behavior === 'stacco';
                    const newSuppressedClips = wasStacco
                        ? {}
                        : Object.fromEntries(
                            Object.entries(state.suppressedClips).filter(([id]) => id !== clipId)
                        );

                    evaluateMix(newActiveClips);

                    // v0.14.12: marca come suonata le clip PRE-SHOW a fine riproduzione
                    // v0.16.5: skip se la clip era in modalità preview (non deve diventare grigia)
                    const isPreviewClip = state.previewingClipIds.includes(clipId);
                    if (active.clip.type === 'preshow' && !isPreviewClip) {
                        const colId = getColumnForClip(clipId);
                        if (colId) {
                            useProjectStore.getState().updateClip(colId, clipId, { hasPlayed: true });
                        }
                    }

                    const newPreviewingClipIds = state.previewingClipIds.filter(id => id !== clipId);

                    // Aggiorna endTime nell'ultima entry del log per questa clip
                    const now = Date.now();
                    const lastIdx = state.playoutLog.reduce((acc, e, i) =>
                        e.clipId === clipId && !e.endTime ? i : acc, -1);
                    const newPlayoutLog = lastIdx !== -1
                        ? state.playoutLog.map((e, i) => i === lastIdx ? { ...e, endTime: now } : e)
                        : state.playoutLog;

                    return { activeClips: newActiveClips, suppressedClips: newSuppressedClips, previewingClipIds: newPreviewingClipIds, playoutLog: newPlayoutLog };
                }
                return state;
            });
        },

        stopAll: () => {
            set((state) => {
                Object.values(state.activeClips).forEach(ac => {
                    ac.player.stop();
                    ac.player.cleanup();
                });
                // Reset completo: mix, timer, preview e fading orphans
                return { activeClips: {}, suppressedClips: {}, onAirStartTime: null, fadingClipIds: [], previewingClipIds: [] };
            });
        },

        // v0.15.0 — Preview Transizione
        // Riproduce gli ultimi N secondi della clip corrente così la transizione
        // (crossfade/segue/gapless) scatta naturalmente, permettendo di testare
        // il punto di giunzione senza aspettare tutta la durata della canzone.
        // v0.16.5: traccia l'ID in previewingClipIds → hasPlayed non viene settato.
        previewTransition: async (clip: AudioClip) => {
            const nextClip = getNextClipInColumn(clip.id);
            if (!nextClip) return;

            const { defaultPreshowTransition, crossfadeDuration, segueDuration } = useSettingsStore.getState();
            const transType = clip.transitionType ?? defaultPreshowTransition;

            // Quanti secondi prima della fine vogliamo far scattare la preview
            // (durata transizione + 3 secondi di ascolto pre-fade)
            const fadeSec = transType === 'crossfade' ? crossfadeDuration / 1000
                : transType === 'segue' ? segueDuration / 1000
                : 0;
            const previewLead = fadeSec + 3;

            const effectiveDuration = (clip.duration || 0) - (clip.trimEnd || 0);
            const seekTo = Math.max(clip.trimStart || 0, effectiveDuration - previewLead);

            // Marca il clip come "in preview" PRIMA di avviarlo
            set(state => ({
                previewingClipIds: state.previewingClipIds.includes(clip.id)
                    ? state.previewingClipIds
                    : [...state.previewingClipIds, clip.id]
            }));

            // Se già in play: seek diretto
            const alreadyActive = get().activeClips[clip.id];
            if (alreadyActive) {
                alreadyActive.player.seek(seekTo);
                return;
            }

            // Altrimenti: avvia la clip e poi seek appena il player è pronto
            await get().playClip(clip);
            // Piccolo delay per lasciar caricare il player prima del seek
            setTimeout(() => {
                const active = get().activeClips[clip.id];
                if (active) active.player.seek(seekTo);
            }, 200);
        },

        // v0.16.5 — Ferma tutti i clip attualmente in modalità preview
        stopPreviewTransition: (clipId: string) => {
            const { previewingClipIds, activeClips } = get();
            // Ferma la clip richiesta + tutte le clip in preview attualmente attive
            const toStop = previewingClipIds.filter(id => activeClips[id]);
            // Assicuriamoci di includere anche il clipId esplicitamente passato
            if (!toStop.includes(clipId) && activeClips[clipId]) toStop.push(clipId);

            toStop.forEach(id => get().stopClip(id));

            // Svuota completamente il set preview dopo lo stop
            set({ previewingClipIds: [] });
        },

        // v0.17.0 — Smart Mic: aggiorna lo stato mic e re-valuta il mix
        setMicActive: (active: boolean) => {
            _isMicActiveGlobal = active;
            set({ isMicActive: active });
            const { activeClips } = get();
            // Duck-down (mic attivo): ramp 60ms — deve sentirsi immediato, nessun lag
            // Duck-up (mic silenzioso): ramp 400ms — sfumatura graduale, evita lo scalino netto
            evaluateMix(activeClips, undefined, active ? 60 : 400);
        },

        _syncProgress: () => {
            // ... existing implementation
            set((state) => {
                const updates: Record<string, ActiveClipState> = {};
                let hasUpdates = false;

                Object.entries(state.activeClips).forEach(([id, clipState]) => {
                    const time = clipState.player.getCurrentTime();
                    const duration = clipState.player.getDuration();
                    const progress = duration > 0 ? time / duration : 0;

                    if (progress !== clipState.progress) {
                        updates[id] = { ...clipState, progress };
                        hasUpdates = true;
                    }
                });

                if (hasUpdates) {
                    return { activeClips: { ...state.activeClips, ...updates } };
                }
                return state;
            });
        }
    };
});
