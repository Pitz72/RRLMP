import React from 'react';
import { Download, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { UpdaterStatusPayload } from '../../types';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

interface Props {
    isOpen: boolean;
    status: UpdaterStatusPayload;
    currentVersion: string;
    onClose: () => void;
    onDownload: () => void;
    onInstall: () => void;
}

// Auto-Updater (2026-07-02) — sostituisce la vecchia UpdateModal basata su
// UpdateInfo fetchato lato renderer. Ora consuma UpdaterStatusPayload
// dall'IPC 'updater:status' (src/main/updateManager.ts). Due varianti UI in
// base a `canAutoInstall`: su Windows/Linux-AppImage il download+installazione
// avvengono davvero in-app; su macOS non firmato e Linux .deb il bottone
// "Scarica" apre semplicemente la pagina della release nel browser (stesso
// comportamento manuale del vecchio sistema).
export const UpdateModal: React.FC<Props> = ({ isOpen, status, currentVersion, onClose, onDownload, onInstall }) => {
    const isRelevant = status.type === 'available' || status.type === 'downloading' || status.type === 'ready' || status.type === 'error';
    useEscapeToClose(isOpen && isRelevant, onClose);

    if (!isOpen || !isRelevant) return null;

    const version = status.type === 'available' || status.type === 'ready' ? status.version : undefined;
    const canAutoInstall = status.type === 'available' || status.type === 'ready' ? status.canAutoInstall : false;
    const releaseNotes = status.type === 'available' ? status.releaseNotes : undefined;

    return (
        <div className="ov" style={{ zIndex: 200 }}>
            <div className="ov-panel anim-in w-full max-w-md">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-emerald-900/60 to-zinc-800 px-5 py-4 border-b border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                            {status.type === 'ready' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Download size={16} className="text-emerald-400" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">
                                {status.type === 'ready' ? 'Aggiornamento pronto' : status.type === 'error' ? 'Errore aggiornamento' : 'Aggiornamento Disponibile'}
                            </h2>
                            {version && <p className="text-[10px] text-emerald-400 font-mono">v{version}</p>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {version && (
                        <div className="flex items-center gap-3 text-sm">
                            <span className="font-mono text-zinc-500 bg-zinc-800 px-2 py-1 rounded">v{currentVersion}</span>
                            <span className="text-zinc-600">→</span>
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded">v{version}</span>
                        </div>
                    )}

                    {releaseNotes && (
                        <div className="card !p-3 max-h-32 overflow-y-auto">
                            <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line">{releaseNotes}</p>
                        </div>
                    )}

                    {status.type === 'downloading' && (
                        <div className="space-y-2">
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${status.percent}%` }} />
                            </div>
                            <p className="text-[11px] text-zinc-500 flex items-center gap-2">
                                <Loader2 size={11} className="animate-spin" /> Download in corso… {status.percent}%
                            </p>
                        </div>
                    )}

                    {status.type === 'ready' && (
                        <p className="text-[11px] text-zinc-400">
                            L'aggiornamento è stato scaricato. RRLMP si riavvierà per completare l'installazione.
                        </p>
                    )}

                    {status.type === 'error' && (
                        <div className="flex items-center gap-2 text-[11px] text-red-400">
                            <AlertCircle size={12} />
                            <span>{status.message}</span>
                        </div>
                    )}

                    {status.type === 'available' && !canAutoInstall && (
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <AlertCircle size={11} />
                            <span>Verrà aperto il browser per scaricare l'installer. Dopo il download, chiudi RRLMP e installa il nuovo pacchetto.</span>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="ov-foot">
                    <button onClick={onClose} className="btn btn-ghost">
                        Più tardi
                    </button>
                    {status.type === 'available' && (
                        <button onClick={onDownload} className="btn btn-green flex items-center gap-2">
                            <Download size={13} />
                            {canAutoInstall ? 'Scarica e installa' : 'Scarica'}
                        </button>
                    )}
                    {status.type === 'ready' && (
                        <button onClick={onInstall} className="btn btn-green flex items-center gap-2">
                            <CheckCircle2 size={13} />
                            Riavvia e installa
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
