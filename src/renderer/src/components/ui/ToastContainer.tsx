import React from 'react';
import { useToastStore, Toast, ToastType } from '../../store/useToastStore';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// v1.15.36 (tema Pad luminosi): pannello in rilievo; tipo indicato da icona e
// colore LED (verde, rosso, ambra, ciano), barra di scadenza nello stesso colore.
const LED_COLORS: Record<ToastType, string> = {
    success: '#3DFF7A',
    error:   '#FF4D3D',
    warning: '#FFB547',
    info:    '#5AD8FF',
};

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} className="shrink-0 mt-px" style={{ color: LED_COLORS.success }} />,
    error:   <AlertCircle size={18} className="shrink-0 mt-px" style={{ color: LED_COLORS.error }} />,
    warning: <AlertTriangle size={18} className="shrink-0 mt-px" style={{ color: LED_COLORS.warning }} />,
    info:    <Info size={18} className="shrink-0 mt-px" style={{ color: LED_COLORS.info }} />,
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
    const removeToast = useToastStore(s => s.removeToast);

    return (
        <div className="toast" role="status" style={{ boxShadow: `inset 3px 0 0 ${LED_COLORS[toast.type]}, inset 0 1px 0 rgba(255,255,255,.07), 0 16px 36px -8px rgba(0,0,0,.8)` }}>
            {/* Auto-dismiss progress bar */}
            <div
                className="t-bar"
                style={{
                    background: LED_COLORS[toast.type],
                    animation: `toast-shrink ${toast.duration}ms linear forwards`,
                }}
            />
            {ICONS[toast.type]}
            <p>{toast.message}</p>
            <button
                onClick={() => removeToast(toast.id)}
                className="t-x"
                aria-label="×"
            >
                <X size={15} />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const toasts = useToastStore(s => s.toasts);

    if (toasts.length === 0) return null;

    return (
        // 2026-07-04: z-index sopra qualunque modale/overlay (max attuale 300, ConfirmDialog) —
        // il toast deve restare visibile anche sopra i dialog di conferma (.toasts, z 9999).
        <div className="toasts">
            {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
        </div>
    );
};
