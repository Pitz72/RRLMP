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

    // Smart Mic (v0.17.0)
    micInputDeviceId: string;        // 'default' o deviceId specifico
    micThresholdDb: number;          // soglia di attivazione noise gate (dBFS), default -30
    micEnabled: boolean;             // se false, il mic non viene armato anche se disponibile
    micMixEnabled: boolean;          // se true, la voce entra nel master bus (canale mix)
    micVolume: number;               // guadagno del canale mix (0.0 a 1.0), default 0.8
    micBypassProcessing: boolean;    // se true, invia a destination saltando la catena master
    micFeedbackAcknowledged: boolean; // v1.1.2 — utente ha confermato uso cuffie/mixer pro

    // Session Recording (v1.0.0+)
    recordingFormat: 'webm' | 'wav';
    recordingBitrate: number;        // bps, default 320000

    setOutputDeviceId: (id: string) => void;
    setGlobalMidiBind: (actionKey: string, midiMessage: string) => void;
    setMasterVolume: (v: number) => void;
    setDuckingSettings: (updates: { factor?: number; duration?: number }) => void;
    setDefaultPreshowTransition: (transition: 'crossfade' | 'segue' | 'gapless') => void;
    setPreshowTransition: (updates: { type?: TransitionType; duration?: number }) => void;
    setSegueDuration: (ms: number) => void;
    setMasterChain: (updates: Partial<MasterChainSettings>) => void;
    setMicSettings: (updates: {
        inputDeviceId?: string;
        thresholdDb?: number;
        enabled?: boolean;
        mixEnabled?: boolean;
        volume?: number;
        bypassProcessing?: boolean;
        feedbackAcknowledged?: boolean;
    }) => void;
    setRecordingSettings: (updates: { format?: 'webm' | 'wav'; bitrate?: number }) => void;
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

            // Smart Mic defaults (v0.17.0)
            micInputDeviceId: 'default',
            micThresholdDb: -30,
            micEnabled: false,
            micMixEnabled: false,
            micVolume: 0.8,
            micBypassProcessing: false,
            micFeedbackAcknowledged: false,

            // Recording defaults
            recordingFormat: 'webm',
            recordingBitrate: 320000,

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
            setMicSettings: (updates) => set((state) => ({
                micInputDeviceId: updates.inputDeviceId ?? state.micInputDeviceId,
                micThresholdDb:   updates.thresholdDb   ?? state.micThresholdDb,
                micEnabled:       updates.enabled       ?? state.micEnabled,
                micMixEnabled:    updates.mixEnabled    ?? state.micMixEnabled,
                micVolume:        updates.volume        ?? state.micVolume,
                micBypassProcessing: updates.bypassProcessing ?? state.micBypassProcessing,
                micFeedbackAcknowledged: updates.feedbackAcknowledged ?? state.micFeedbackAcknowledged,
            })),
            setRecordingSettings: (updates) => set((state) => ({
                recordingFormat: updates.format ?? state.recordingFormat,
                recordingBitrate: updates.bitrate ?? state.recordingBitrate,
            })),
        }),

        {
            name: 'rrlmp-settings', // saved in localStorage
        }
    )
);
