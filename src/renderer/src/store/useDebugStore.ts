import { create } from 'zustand';

interface LogEntry {
    time: string;
    msg: string;
    type: 'info' | 'error' | 'event';
}

interface DebugState {
    isVisible: boolean;
    logs: LogEntry[];
    toggle: () => void;
    log: (msg: string, type?: 'info' | 'error' | 'event') => void;
    clear: () => void;
}

export const useDebugStore = create<DebugState>((set) => ({
    isVisible: false,
    logs: [],
    toggle: () => set((s) => ({ isVisible: !s.isVisible })),
    log: (msg, type = 'info') => set((s) => {
        const time = new Date().toISOString().split('T')[1].slice(0, 12); // HH:MM:SS.mmm
        const newLog = { time, msg, type };
        return { logs: [newLog, ...s.logs].slice(0, 50) }; // Max 50 logs
    }),
    clear: () => set({ logs: [] })
}));

// Helper globale per loggare da ovunque senza hook
export const debugLog = (msg: string, type: 'info' | 'error' | 'event' = 'info') =>
    useDebugStore.getState().log(msg, type);
