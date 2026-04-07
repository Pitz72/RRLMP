import React from 'react';
import { useToastStore, Toast, ToastType } from '../../store/useToastStore';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} className="shrink-0 text-emerald-400" />,
    error:   <AlertCircle size={16} className="shrink-0 text-red-400" />,
    warning: <AlertTriangle size={16} className="shrink-0 text-amber-400" />,
    info:    <Info size={16} className="shrink-0 text-cyan-400" />,
};

const STYLES: Record<ToastType, string> = {
    success: 'border-emerald-500/40 bg-emerald-950/80',
    error:   'border-red-500/40 bg-red-950/80',
    warning: 'border-amber-500/40 bg-amber-950/80',
    info:    'border-cyan-500/40 bg-cyan-950/80',
};

const BAR_COLORS: Record<ToastType, string> = {
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    warning: 'bg-amber-500',
    info:    'bg-cyan-500',
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
    const removeToast = useToastStore(s => s.removeToast);

    return (
        <div className={`relative flex items-start gap-3 px-4 py-3 rounded-lg border shadow-2xl backdrop-blur-sm min-w-[280px] max-w-[420px] overflow-hidden ${STYLES[toast.type]}`}>
            {/* Auto-dismiss progress bar */}
            <div
                className={`absolute bottom-0 left-0 h-0.5 ${BAR_COLORS[toast.type]} opacity-60`}
                style={{
                    animation: `toast-shrink ${toast.duration}ms linear forwards`,
                }}
            />
            {ICONS[toast.type]}
            <p className="text-sm text-white/90 leading-snug flex-1 whitespace-pre-wrap">{toast.message}</p>
            <button
                onClick={() => removeToast(toast.id)}
                className="text-white/40 hover:text-white/80 transition-colors shrink-0 mt-0.5"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const toasts = useToastStore(s => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <>
            <style>{`
                @keyframes toast-shrink {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
            `}</style>
            <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 items-end">
                {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
            </div>
        </>
    );
};
