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

// AUDIT-LI (2026-05-29): handle dei timer di auto-rimozione per id. Senza, un toast
// rimosso manualmente (removeToast) o scartato dallo slice(-4) lasciava un setTimeout
// pendente che scattava comunque a vuoto. Tracciandoli, removeToast cancella il timer
// associato — niente callback differite orfane.
const _toastTimers = new Map<string, ReturnType<typeof setTimeout>>();
const clearToastTimer = (id: string) => {
    const h = _toastTimers.get(id);
    if (h) { clearTimeout(h); _toastTimers.delete(id); }
};

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type, duration) => {
        const id = uuidv4();
        const d = duration ?? (type === 'error' ? 6000 : 4000);
        set(state => ({
            toasts: [...state.toasts.slice(-4), { id, message, type, duration: d }]
        }));
        _toastTimers.set(id, setTimeout(() => {
            _toastTimers.delete(id);
            set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
        }, d));
    },
    removeToast: (id) => {
        clearToastTimer(id);
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    },
}));

// Helper callable da qualsiasi file senza hook React
export const toast = (message: string, type: ToastType = 'info', duration?: number) => {
    useToastStore.getState().addToast(message, type, duration);
};
