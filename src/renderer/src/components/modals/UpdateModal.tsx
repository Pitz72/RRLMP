import React from 'react';
import { Download, X, AlertCircle } from 'lucide-react';
import { UpdateInfo } from '../../utils/updateChecker';

interface Props {
    isOpen: boolean;
    info: UpdateInfo;
    currentVersion: string;
    onClose: () => void;
}

export const UpdateModal: React.FC<Props> = ({ isOpen, info, currentVersion, onClose }) => {
    if (!isOpen || !info.hasUpdate) return null;

    const handleDownload = async () => {
        if (info.downloadUrl) {
            await window.electron.openExternal(info.downloadUrl);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-emerald-500/40 rounded-xl shadow-2xl shadow-emerald-500/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-emerald-900/60 to-zinc-800 px-5 py-4 border-b border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                            <Download size={16} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">Aggiornamento Disponibile</h2>
                            <p className="text-[10px] text-emerald-400 font-mono">v{info.remoteVersion}</p>
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
                    {/* VERSIONI */}
                    <div className="flex items-center gap-3 text-sm">
                        <span className="font-mono text-zinc-500 bg-zinc-800 px-2 py-1 rounded">v{currentVersion}</span>
                        <span className="text-zinc-600">→</span>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded">v{info.remoteVersion}</span>
                        {info.releaseDate && (
                            <span className="text-[10px] text-zinc-600 ml-auto">{info.releaseDate}</span>
                        )}
                    </div>

                    {/* NOTE DI RILASCIO */}
                    {info.releaseNotes && (
                        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                            <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line">{info.releaseNotes}</p>
                        </div>
                    )}

                    {/* INFO DOWNLOAD */}
                    {info.downloadFilename && (
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <AlertCircle size={11} />
                            <span>Verrà aperto il browser per scaricare: <span className="font-mono text-zinc-400">{info.downloadFilename}</span></span>
                        </div>
                    )}

                    {/* NOTA */}
                    <p className="text-[10px] text-zinc-600 italic">
                        L'aggiornamento non è automatico. Dopo il download, chiudi RRLMP e installa il nuovo pacchetto.
                    </p>
                </div>

                {/* FOOTER */}
                <div className="bg-zinc-800/50 px-5 py-3 border-t border-zinc-700 flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-medium transition-colors"
                    >
                        Più tardi
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!info.downloadUrl}
                        className="flex items-center gap-2 px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-colors"
                    >
                        <Download size={13} />
                        Scarica v{info.remoteVersion}
                    </button>
                </div>
            </div>
        </div>
    );
};
