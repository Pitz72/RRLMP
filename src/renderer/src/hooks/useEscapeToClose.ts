import { useEffect } from 'react';

/**
 * v1.4.13 (ESC-01): ESC su una modale aperta CHIUDE la modale e NON deve
 * raggiungere l'Emergency Stop globale (window keydown in bubble, vedi App.tsx).
 *
 * Listener in CAPTURE phase su window: scatta prima di qualunque handler bubble;
 * stopPropagation interrompe la propagazione (il listener bubble di Emergency
 * Stop sullo stesso window non viene più invocato).
 *
 * Eccezione: gli input di registrazione keybind (es. ClipSettingsModal) usano
 * ESC per azzerare il bind — si marcano con `data-keybind-input` e gestiscono
 * ESC da soli (con stopPropagation/preventDefault propri).
 *
 * Stesso pattern di MODAL-02 (v1.3.5) su GeneralSettingsModal/KeymappingModal,
 * estratto a hook per tutte le altre modali.
 */
export function useEscapeToClose(active: boolean, onClose: () => void): void {
    useEffect(() => {
        if (!active) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            const target = e.target as HTMLElement | null;
            if (target?.dataset?.keybindInput !== undefined) return; // l'input gestisce ESC da sé
            e.stopPropagation();
            e.preventDefault();
            onClose();
        };
        window.addEventListener('keydown', handler, true); // capture phase
        return () => window.removeEventListener('keydown', handler, true);
    }, [active, onClose]);
}
