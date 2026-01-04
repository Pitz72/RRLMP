import { create } from 'zustand';
import { IAudioPlayer } from '../engine/AudioPlayer.interface';
import { StreamPlayer } from '../engine/StreamPlayer';
import { AudioClip } from '../types';
import AudioContextManager from '../engine/AudioContextManager';
import { DuckingManager } from '../engine/DuckingManager';

interface ActiveClipState {
    player: IAudioPlayer;
    isPlaying: boolean;
    progress: number;
    clip: AudioClip; // Init with full clip
}

interface AudioStore {
    activeClips: Record<string, ActiveClipState>;

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

const updateDuckingState = (activeClips: Record<string, ActiveClipState>) => {
    const priorityCount = Object.values(activeClips).filter(
        c => c.clip.duckingSource // Check if clip is a priority source
    ).length;

    DuckingManager.getInstance().updateDucking(priorityCount);
};

export const useAudioStore = create<AudioStore>((set, get) => {

    setInterval(() => {
        get()._syncProgress();
    }, 100);

    return {
        activeClips: {},

        playClip: async (clip: AudioClip) => {
            const currentStore = get();

            if (currentStore.activeClips[clip.id]) {
                currentStore.stopClip(clip.id);
                return;
            }

            let player: IAudioPlayer = new StreamPlayer();

            try {
                // Audio Routing
                const targetBus = getBusForType(clip.type);
                player.setBus(targetBus);

                await player.load(clip.path);
                player.play();

                set((state) => {
                    const newState = {
                        activeClips: {
                            ...state.activeClips,
                            [clip.id]: {
                                player,
                                isPlaying: true,
                                progress: 0,
                                clip: clip
                            }
                        }
                    };
                    // Trigger Ducking check
                    updateDuckingState(newState.activeClips);
                    return newState;
                });

            } catch (error) {
                console.error("Failed to play clip:", clip, error);
            }
        },

        loadClip: async (clip: AudioClip, fileObject?: File) => {
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

                    // Trigger Ducking update
                    updateDuckingState(newActiveClips);

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

                // Reset ducking (0 priority clips)
                DuckingManager.getInstance().updateDucking(0);

                return { activeClips: {} };
            });
        },

        _syncProgress: () => {
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

                    // Auto-stop logic if needed (handled by ended event? StreamPlayer doesn't emit it yet via interface)
                    // For now, if progress >= 1, we could stop.
                    // But StreamPlayer usually stops itself or loops.
                    // 'ended' event listener in StreamPlayer calls nothing external currently.
                    // TODO: Improve end-of-track handling.
                });

                if (hasUpdates) {
                    return { activeClips: { ...state.activeClips, ...updates } };
                }
                return state;
            });
        }
    };
});
