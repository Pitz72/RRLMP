import { create } from 'zustand';
import { IAudioPlayer } from '../engine/AudioPlayer.interface';
import { StreamPlayer } from '../engine/StreamPlayer';
import { AudioClip } from '../types';
import AudioContextManager from '../engine/AudioContextManager';
import { debugLog } from './useDebugStore';
import { useProjectStore } from './useProjectStore';

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
    loadClip: (clip: AudioClip, fileObject?: File) => Promise<void>;
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

// --- CENTRALIZED MIXING ENGINE (v0.1.2) ---
const evaluateMix = (activeClips: Record<string, ActiveClipState>) => {
    const activeValues = Object.values(activeClips);

    // 1. ANALYSIS
    const isVoiceActive = activeValues.some(c => c.clip.type === 'voice');
    const isMusicActive = activeValues.some(c => c.clip.type === 'music');
    // Active Stacco defined as: An asset that is playing and has behavior 'stacco'
    const activeStacco = activeValues.find(c =>
        getColumnForClip(c.clip.id) === 'col-assets' && c.clip.behavior === 'stacco'
    );

    debugLog(`MIX EVAL: MusicActive=${isMusicActive}, VoiceActive=${isVoiceActive}, Stacco=${activeStacco ? activeStacco.clip.name : 'None'}`, 'info');

    activeValues.forEach(ac => {
        const { clip, player } = ac;
        let targetVolume = clip.volume; // Start with nominal volume

        if (clip.type === 'voice') {
            // VOICE: Always nominal
            targetVolume = clip.volume;
        }
        else if (clip.type === 'music' || clip.type === 'preshow') {
            // MUSIC: Ducks if Voice is active
            if (isVoiceActive) {
                targetVolume = clip.volume * 0.2; // -14dB approx
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
            // Rule 3: Music Dominance (If Music active, I mute)
            else if (isMusicActive) {
                targetVolume = 0;
            }
            // Rule 4: Voice Ducking (If Voice active, I duck)
            else if (isVoiceActive) {
                targetVolume = clip.volume * 0.2;
            }
            // Rule 5: Normal
            else {
                targetVolume = clip.volume;
            }
        }
        else {
            // SFX / Others: Default behavior (maybe duck on voice?)
            if (isVoiceActive) targetVolume = clip.volume * 0.5;
        }

        // APPLY
        player.fadeTo(targetVolume, 500);
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

export const useAudioStore = create<AudioStore>((set, get) => {

    setInterval(() => {
        get()._syncProgress();
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
                            // Use current target volume? Or clip volume? 
                            // Let's use clip settings volume.
                            set(state => ({
                                suppressedClips: { ...state.suppressedClips, [ac.clip.id]: ac.clip.volume }
                            }));
                        }
                        ac.player.fadeTo(0, 200); // Fast fade to silence
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

            let player: IAudioPlayer = new StreamPlayer();

            try {
                // Audio Routing
                const targetBus = getBusForType(freshClip.type);
                player.setBus(targetBus);

                // Apply Settings
                player.updateSettings(freshClip);

                // Sequencer Logic
                player.onPreEnd((clipId) => {
                    debugLog(`AudioStore: PreEnd Event for ${freshClip.name}`, 'info');
                    const currentClip = get().activeClips[clipId]?.clip;
                    if (!currentClip) return;

                    if (currentClip.nextAction === 'play_next') {
                        const nextClip = getNextClipInColumn(currentClip.id);
                        if (nextClip) {
                            debugLog(`AudioStore: Sequencer Play Next -> ${nextClip.name}`, 'event');
                            get().playClip(nextClip);
                        }
                    }
                });

                player.onEnded(() => {
                    debugLog(`AudioStore: Ended ${freshClip.name}`, 'info');
                    currentStore.stopClip(freshClip.id);

                    if (freshClip.nextAction === 'loop') {
                        debugLog(`AudioStore: Looping ${freshClip.name}`, 'event');
                        setTimeout(() => get().playClip(freshClip), 50);
                    }
                    else if (freshClip.nextAction === 'play_next' && (freshClip.fadeOut || 0) <= 0) {
                        const nextClip = getNextClipInColumn(freshClip.id);
                        if (nextClip) {
                            debugLog(`AudioStore: Play Next Fallback -> ${nextClip.name}`, 'event');
                            setTimeout(() => get().playClip(nextClip), 50);
                        }
                    }
                });

                await player.load(freshClip.path);
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

            } catch (error) {
                console.error("Failed to play clip:", freshClip, error);
            }
        },

        loadClip: async (clip: AudioClip, fileObject?: File) => {
            // ... existing implementation
            let player: IAudioPlayer = new StreamPlayer();
            try {
                const source = fileObject || clip.path;
                await player.load(source);
                const duration = player.getDuration();
                const { useProjectStore } = await import('./useProjectStore');
                useProjectStore.getState().updateClip(
                    clip.type === 'asset' ? 'col-assets' : `col-${clip.type}`,
                    clip.id,
                    { duration }
                );
                player.cleanup();
            } catch (e) {
                console.error("Failed to load clip metadata", clip.path, e);
                player.cleanup();
            }
        },

        stopClip: (clipId: string) => {
            set((state) => {
                const active = state.activeClips[clipId];
                if (active) {
                    active.player.stop();
                    active.player.cleanup();

                    const newActiveClips = { ...state.activeClips };
                    delete newActiveClips[clipId];

                    // Logic to Restore Suppressed Clips
                    // In v0.1.2, evaluateMix handles restoration automatically.

                    evaluateMix(newActiveClips);
                    return { activeClips: newActiveClips };
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
