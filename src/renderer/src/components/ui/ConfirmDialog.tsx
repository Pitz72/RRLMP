import React from 'react';
import { useConfirmStore } from '../../store/useConfirmStore';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog: React.FC = () => {
    const { request, respond } = useConfirmStore();

    if (!request) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start gap-3 mb-5">
                    <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-white/90 leading-relaxed">{request.message}</p>
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => respond(false)}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition-all"
                    >
                        {request.cancelLabel}
                    </button>
                    <button
                        onClick={() => respond(true)}
                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded border border-red-500 transition-all"
                        autoFocus
                    >
                        {request.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
