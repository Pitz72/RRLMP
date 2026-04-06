import { create } from 'zustand';
import { IAudioPlayer } from '../engine/AudioPlayer.interface';
import { StreamPlayer } from '../engine/StreamPlayer';
import { AudioClip } from '../types';
import AudioContextManager from '../engine/AudioContextManager';
import { debugLog } from './useDebugStore';
import { useProjectStore } from './useProjectStore';
import { useSettingsStore } from './useSettingsStore';
import { toFileUrl } from '../utils/pathUtils';
import * as AUDIO_CONST from '../constants/audioConstants';

interface ActiveClipState {
    player: IAudioPlayer;
    isPlaying: boolean;
    progress: number;
    clip: AudioClip; // Init with full clip
}

interface AudioStore {
    activeClips: Record<string, ActiveClipState>;
    suppressedClips: Record<string, number>; // ID -> Original Volume

    // Actions
    playClip: (clip: AudioClip) => Promise<void>;
    loadClip: (clip: AudioClip) => Promise<void>;
    playColumn: (colIndex: number) => Promise<void>;
    updateOutputDevice: (deviceId: string) => void;
    stopClip: (clipId: string) => void;
    stopAll: () => void;

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
const evaluateMix = (activeClips: Record<string, ActiveClipState>) => {
    const activeValues = Object.values(activeClips);
    const { duckingFactor, duckingDuration } = useSettingsStore.getState();

    // 1. ANALYSIS: Scan for high-priority types currently playing
    const isVoiceActive = activeValues.some(c => c.clip.type === 'voice');
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

        // APPLY: Smooth transition to target volume
        player.fadeTo(targetVolume, duckingDuration);
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

// G3 Fix: Mappa generation ID per evitare race condition in playClip.
// Ogni chiamata a playClip incrementa il contatore per quella clip;
// se al ritorno dell'await load() il contatore non corrisponde più,
// l'operazione è obsoleta e va scartata.
const playGenerations = new Map<string, number>();

export const useAudioStore = create<AudioStore>((set, get) => {

    // G8 Fix: setInterval condizionale — chiama _syncProgress solo se ci sono
    // clip attive, evitando 10 set() Zustand/s inutili durante il silenzio.
    setInterval(() => {
        if (Object.keys(get().activeClips).length > 0) {
            get()._syncProgress();
        }
    }, 100);

    return {
        activeClips: {},
        suppressedClips: {},

        playClip: async (clipArg: AudioClip) => {
            const currentStore = get();

            // FRESH DATA FETCH
            const { columns } = useProjectStore.getState();
            const freshClip = columns.flatMap(col => col.clips).find(c => c.id === clipArg.id) || clipArg;
            const columnId = getColumnForClip(freshClip.id);

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
                    // NORMAL behavior: Stop others in same column
                    sameColumnClips.forEach(ac => {
                        currentStore.stopClip(ac.clip.id);
                    });
                }
            }

            if (currentStore.activeClips[freshClip.id]) {
                currentStore.stopClip(freshClip.id);
                return;
            }

            // G3 Fix: registra generation ID prima del load asincrono.
            const generation = (playGenerations.get(freshClip.id) || 0) + 1;
            playGenerations.set(freshClip.id, generation);

            let player: IAudioPlayer = new StreamPlayer();

            try {
                // Audio Routing
                const targetBus = getBusForType(freshClip.type);
                player.setBus(targetBus);

                // Apply Settings
                player.updateSettings(freshClip);

                // Sequencer Logic
                player.onPreEnd((clipId) => {
                    // SEGUENCER LOGIC: Determiniamo quando far partire la prossima clip
                    const transition = (freshClip.transitionType && freshClip.transitionType !== 'default')
                        ? freshClip.transitionType
                        : useSettingsStore.getState().defaultPreshowTransition;

                    if (freshClip.nextAction === 'play_next') {
                        // Gapless: Aspetta la fine (onEnded)
                        if (transition === 'gapless') return;

                        // Segue/Crossfade: Se non c'è Outro Marker, usiamo l'inizio del FadeOut (onPreEnd)
                        if ((freshClip.outroMarker || 0) <= 0) {
                            const nextClip = getNextClipInColumn(freshClip.id);
                            if (nextClip) {
                                debugLog(`AudioStore: Sequencer Play Next (${transition} via PreEnd) -> ${nextClip.name}`, 'event');
                                get().playClip(nextClip);
                            }
                        }
                    }
                });

                player.onIntroReached((clipId) => {
                    const clipName = get().activeClips[clipId]?.clip.name || 'Unknown';
                    debugLog(`🎤 Intro Ended for ${clipName} (Markers)`, 'event');
                });

                player.onOutroReached((clipId) => {
                    const currentClip = get().activeClips[clipId]?.clip;
                    if (!currentClip) return;
                    
                    const transition = (currentClip.transitionType && currentClip.transitionType !== 'default')
                        ? currentClip.transitionType
                        : useSettingsStore.getState().defaultPreshowTransition;

                    debugLog(`🔊 Outro Reached for ${currentClip.name} (Trans: ${transition})`, 'info');

                    if (currentClip.nextAction === 'play_next' && transition !== 'gapless') {
                        const nextClip = getNextClipInColumn(currentClip.id);
                        if (nextClip) {
                            debugLog(`AudioStore: Sequencer Play Next (${transition} via Outro Marker) -> ${nextClip.name}`, 'event');
                            get().playClip(nextClip);
                        }
                    }
                });

                player.onEnded(() => {
                    debugLog(`AudioStore: Ended ${freshClip.name}`, 'info');
                    get().stopClip(freshClip.id);

                    if (freshClip.nextAction === 'loop') {
                        debugLog(`AudioStore: Looping ${freshClip.name}`, 'event');
                        setTimeout(() => get().playClip(freshClip), 50);
                    }
                    else if (freshClip.nextAction === 'play_next') {
                        const transition = (freshClip.transitionType && freshClip.transitionType !== 'default')
                            ? freshClip.transitionType
                            : useSettingsStore.getState().defaultPreshowTransition;

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

                // G3 Fix: verifica che questa operazione di load sia ancora valida.
                if ((playGenerations.get(freshClip.id) || 0) !== generation) {
                    debugLog(`AudioStore: Load obsoleto scartato per ${freshClip.name} (gen ${generation})`, 'info');
                    player.cleanup();
                    return;
                }

                player.play();

                set((state) => {
                    const newState = {
                        activeClips: {
                            ...state.activeClips,
                            [freshClip.id]: {
                                player,
                                isPlaying: true,
                                progress: 0,
                                clip: freshClip
                            }
                        }
                    };
                    evaluateMix(newState.activeClips);
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
                
                let trimStart = clip.trimStart || 0;
                let trimEnd = clip.trimEnd || 0;

                // AUTOMATIC SILENCE DETECTION (Specific for Pre-Show or Empty Trims)
                const isPreshow = clip.type === 'preshow';
                const hasNoTrim = (trimStart === 0 && trimEnd === 0);

                if (isPreshow && hasNoTrim) {
                    try {
                        debugLog(`AudioStore: Auto-Silence Detection for ${clip.name}...`, 'info');
                        const fetchPath = toFileUrl(clip.path);
                        
                        const response = await fetch(fetchPath);
                        const arrayBuffer = await response.arrayBuffer();
                        const ctx = AudioContextManager.getInstance().getContext();
                        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                        const rawData = audioBuffer.getChannelData(0);
                        const threshold = 0.005; // -46dB
                        
                        let startFrame = 0;
                        for (let i = 0; i < rawData.length; i++) {
                            if (Math.abs(rawData[i]) > threshold) { startFrame = i; break; }
                        }
                        
                        let endFrame = rawData.length - 1;
                        for (let i = rawData.length - 1; i >= 0; i--) {
                            if (Math.abs(rawData[i]) > threshold) { endFrame = i; break; }
                        }

                        const Margin = 0.05;
                        trimStart = Math.max(0, (startFrame / audioBuffer.sampleRate) - Margin);
                        const silenceAtEnd = audioBuffer.duration - (endFrame / audioBuffer.sampleRate);
                        trimEnd = Math.max(0, silenceAtEnd - Margin);
                        
                        debugLog(`AudioStore: Auto-Trim ${clip.name} -> Start: ${trimStart.toFixed(2)}s, EndCut: ${trimEnd.toFixed(2)}s`, 'event');
                    } catch (e) {
                        console.warn("Silence detection failed during loadClip", e);
                    }
                }

                const { useProjectStore } = await import('./useProjectStore');
                useProjectStore.getState().updateClip(
                    clip.type === 'asset' ? 'col-assets' : `col-${clip.type}`,
                    clip.id,
                    { duration, trimStart, trimEnd }
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
                    return { activeClips: newActiveClips, suppressedClips: newSuppressedClips };
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
                // Reset mix (no active clips)
                return { activeClips: {}, suppressedClips: {} };
            });
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
