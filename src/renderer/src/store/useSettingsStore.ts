import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TransitionType } from '../types';
import { MasterChainSettings, DEFAULT_MASTER_CHAIN } from '../engine/AudioContextManager';

interface SettingsState {
    outputDeviceId: string;
    globalMidiBinds: Record<string, string>;

    // Master Volume (v0.16.0) — persisted so it survives restarts; synced with AudioContextManager
    masterVolume: number; // 0.0 to 1.0

    // Mixing Settings
    duckingFactor: number; // 0.0 to 1.0
    duckingDuration: number; // ms
    defaultPreshowTransition: 'crossfade' | 'segue' | 'gapless'; // Effetto Continuous-Play

    // Pre-Show Transition Settings (v0.13.2 / v0.14.8)
    preshowTransitionType: TransitionType;
    crossfadeDuration: number; // ms — durata fade-out + fade-in per Crossfade
    segueDuration: number;     // ms — durata fade-out per Segue (clip entrante parte subito a pieno volume)

    // Master Chain (v0.16.2)
    masterChain: MasterChainSettings;

    setOutputDeviceId: (id: string) => void;
    setGlobalMidiBind: (actionKey: string, midiMessage: string) => void;
    setMasterVolume: (v: number) => void;
    setDuckingSettings: (updates: { factor?: number; duration?: number }) => void;
    setDefaultPreshowTransition: (transition: 'crossfade' | 'segue' | 'gapless') => void;
    setPreshowTransition: (updates: { type?: TransitionType; duration?: number }) => void;
    setSegueDuration: (ms: number) => void;
    setMasterChain: (updates: Partial<MasterChainSettings>) => void;
}


export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            outputDeviceId: 'default',
            globalMidiBinds: {},
            masterVolume: 1.0,
            masterChain: { ...DEFAULT_MASTER_CHAIN },

            // Defaults mixing
            duckingFactor: 0.2,
            duckingDuration: 500,
            defaultPreshowTransition: 'crossfade',

            // Defaults preshow transition (v0.13.2 / v0.14.8)
            preshowTransitionType: 'gapless',
            crossfadeDuration: 2000,
            segueDuration: 800,

            setOutputDeviceId: (id) => set({ outputDeviceId: id }),
            setGlobalMidiBind: (actionKey, midiMessage) => set((state) => ({
                globalMidiBinds: { ...state.globalMidiBinds, [actionKey]: midiMessage }
            })),
            setMasterVolume: (v) => set({ masterVolume: Math.max(0, Math.min(1, v)) }),
            setDuckingSettings: (updates) => set((state) => ({
                duckingFactor: updates.factor ?? state.duckingFactor,
                duckingDuration: updates.duration ?? state.duckingDuration
            })),
            setDefaultPreshowTransition: (transition: 'crossfade' | 'segue' | 'gapless') => set({ defaultPreshowTransition: transition }),
            setPreshowTransition: (updates) => set((state) => ({
                preshowTransitionType: updates.type ?? state.preshowTransitionType,
                crossfadeDuration: updates.duration ?? state.crossfadeDuration
            })),
            setSegueDuration: (ms) => set({ segueDuration: ms }),
            setMasterChain: (updates) => set((state) => ({
                masterChain: { ...state.masterChain, ...updates }
            })),
        }),

        {
            name: 'rrlmp-settings', // saved in localStorage
        }
    )
);
