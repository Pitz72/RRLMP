import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type, duration) => {
        const id = uuidv4();
        const d = duration ?? (type === 'error' ? 6000 : 4000);
        set(state => ({
            toasts: [...state.toasts.slice(-4), { id, message, type, duration: d }]
        }));
        setTimeout(() => {
            set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
        }, d);
    },
    removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));

// Helper callable da qualsiasi file senza hook React
export const toast = (message: string, type: ToastType = 'info', duration?: number) => {
    useToastStore.getState().addToast(message, type, duration);
};
