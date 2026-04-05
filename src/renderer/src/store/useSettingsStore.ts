import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    outputDeviceId: string;
    globalMidiBinds: Record<string, string>;
    setOutputDeviceId: (id: string) => void;
    setGlobalMidiBind: (actionKey: string, midiMessage: string) => void;
}


export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            outputDeviceId: 'default',
            globalMidiBinds: {},
            setOutputDeviceId: (id) => set({ outputDeviceId: id }),
            setGlobalMidiBind: (actionKey, midiMessage) => set((state) => ({
                globalMidiBinds: { ...state.globalMidiBinds, [actionKey]: midiMessage }
            })),
        }),

        {
            name: 'rrlmp-settings', // saved in localStorage
        }
    )
);
