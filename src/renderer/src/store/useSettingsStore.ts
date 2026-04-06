import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TransitionType } from '../types';

interface SettingsState {
    outputDeviceId: string;
    globalMidiBinds: Record<string, string>;

    // Mixing Settings
    duckingFactor: number; // 0.0 to 1.0
    duckingDuration: number; // ms

    // Pre-Show Transition Settings (v0.13.2)
    preshowTransitionType: TransitionType;
    crossfadeDuration: number; // ms — usato sia per crossfade che per segue

    setOutputDeviceId: (id: string) => void;
    setGlobalMidiBind: (actionKey: string, midiMessage: string) => void;
    setDuckingSettings: (updates: { factor?: number; duration?: number }) => void;
    setPreshowTransition: (updates: { type?: TransitionType; duration?: number }) => void;
}


export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            outputDeviceId: 'default',
            globalMidiBinds: {},

            // Defaults mixing
            duckingFactor: 0.2,
            duckingDuration: 500,

            // Defaults preshow transition (v0.13.2)
            preshowTransitionType: 'gapless',
            crossfadeDuration: 2000,

            setOutputDeviceId: (id) => set({ outputDeviceId: id }),
            setGlobalMidiBind: (actionKey, midiMessage) => set((state) => ({
                globalMidiBinds: { ...state.globalMidiBinds, [actionKey]: midiMessage }
            })),
            setDuckingSettings: (updates) => set((state) => ({
                duckingFactor: updates.factor ?? state.duckingFactor,
                duckingDuration: updates.duration ?? state.duckingDuration
            })),
            setPreshowTransition: (updates) => set((state) => ({
                preshowTransitionType: updates.type ?? state.preshowTransitionType,
                crossfadeDuration: updates.duration ?? state.crossfadeDuration
            })),
        }),

        {
            name: 'rrlmp-settings', // saved in localStorage
        }
    )
);
