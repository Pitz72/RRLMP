import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    outputDeviceId: string;
    globalMidiBinds: Record<string, string>;
    
    // Mixing Settings
    duckingFactor: number; // 0.0 to 1.0
    duckingDuration: number; // ms
    defaultPreshowTransition: 'crossfade' | 'segue' | 'gapless'; // Effetto Continuous-Play

    setOutputDeviceId: (id: string) => void;
    setGlobalMidiBind: (actionKey: string, midiMessage: string) => void;
    setDuckingSettings: (updates: { factor?: number; duration?: number }) => void;
    setDefaultPreshowTransition: (transition: 'crossfade' | 'segue' | 'gapless') => void;
}


export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            outputDeviceId: 'default',
            globalMidiBinds: {},
            
            // Defaults (L1 fallback)
            duckingFactor: 0.2,
            duckingDuration: 500,
            defaultPreshowTransition: 'crossfade',

            setOutputDeviceId: (id) => set({ outputDeviceId: id }),
            setGlobalMidiBind: (actionKey, midiMessage) => set((state) => ({
                globalMidiBinds: { ...state.globalMidiBinds, [actionKey]: midiMessage }
            })),
            setDuckingSettings: (updates) => set((state) => ({
                duckingFactor: updates.factor ?? state.duckingFactor,
                duckingDuration: updates.duration ?? state.duckingDuration
            })),
            setDefaultPreshowTransition: (transition: 'crossfade' | 'segue' | 'gapless') => set({ defaultPreshowTransition: transition }),
        }),

        {
            name: 'rrlmp-settings', // saved in localStorage
        }
    )
);
