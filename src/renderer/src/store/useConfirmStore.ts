import { create } from 'zustand';
import i18n from '../i18n';

interface ConfirmRequest {
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    resolve: (value: boolean) => void;
}

interface ThreeWayRequest {
    message: string;
    confirmLabel: string;  // es. "Salva"
    thirdLabel: string;    // es. "Non Salvare"
    cancelLabel: string;   // es. "Annulla"
    resolve: (value: 'confirm' | 'third' | 'cancel') => void;
}

interface ConfirmStore {
    request: ConfirmRequest | null;
    threeWayRequest: ThreeWayRequest | null;
    confirm: (message: string, confirmLabel?: string, cancelLabel?: string) => Promise<boolean>;
    respond: (value: boolean) => void;
    confirmThree: (message: string, confirmLabel: string, thirdLabel: string, cancelLabel: string) => Promise<'confirm' | 'third' | 'cancel'>;
    respondThree: (value: 'confirm' | 'third' | 'cancel') => void;
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
    request: null,
    threeWayRequest: null,

    confirm: (message, confirmLabel, cancelLabel) => {
        // Default risolti a runtime (non nei parametri) così seguono la lingua corrente
        const okLabel = confirmLabel ?? i18n.t('confirm.defaultOk', 'Conferma');
        const koLabel = cancelLabel ?? i18n.t('modal.dialog.cancel', 'Annulla');
        return new Promise<boolean>((resolve) => {
            set({ request: { message, confirmLabel: okLabel, cancelLabel: koLabel, resolve } });
        });
    },
    respond: (value) => {
        const { request } = get();
        if (request) {
            request.resolve(value);
            set({ request: null });
        }
    },

    confirmThree: (message, confirmLabel, thirdLabel, cancelLabel) => {
        return new Promise<'confirm' | 'third' | 'cancel'>((resolve) => {
            set({ threeWayRequest: { message, confirmLabel, thirdLabel, cancelLabel, resolve } });
        });
    },
    respondThree: (value) => {
        const { threeWayRequest } = get();
        if (threeWayRequest) {
            threeWayRequest.resolve(value);
            set({ threeWayRequest: null });
        }
    },
}));

// Helpers callable da qualsiasi file senza hook React
export const confirm = (message: string, confirmLabel?: string, cancelLabel?: string) => {
    return useConfirmStore.getState().confirm(message, confirmLabel, cancelLabel);
};

export const confirmThree = (message: string, confirmLabel: string, thirdLabel: string, cancelLabel: string) => {
    return useConfirmStore.getState().confirmThree(message, confirmLabel, thirdLabel, cancelLabel);
};
