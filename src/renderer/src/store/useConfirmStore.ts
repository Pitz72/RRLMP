import { create } from 'zustand';

interface ConfirmRequest {
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    resolve: (value: boolean) => void;
}

interface ConfirmStore {
    request: ConfirmRequest | null;
    confirm: (message: string, confirmLabel?: string, cancelLabel?: string) => Promise<boolean>;
    respond: (value: boolean) => void;
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
    request: null,
    confirm: (message, confirmLabel = 'Conferma', cancelLabel = 'Annulla') => {
        return new Promise<boolean>((resolve) => {
            set({ request: { message, confirmLabel, cancelLabel, resolve } });
        });
    },
    respond: (value) => {
        const { request } = get();
        if (request) {
            request.resolve(value);
            set({ request: null });
        }
    },
}));

// Helper callable da qualsiasi file senza hook React
export const confirm = (message: string, confirmLabel?: string, cancelLabel?: string) => {
    return useConfirmStore.getState().confirm(message, confirmLabel, cancelLabel);
};
