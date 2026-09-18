import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, X, ExternalLink } from 'lucide-react';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import { whatsNewFor, releasePageUrl } from '../../constants/whatsNew';

interface Props {
    isOpen: boolean;
    version: string;
    previousVersion: string | null;
    onClose: () => void;
}

// v1.15.34 — schermata «Novità» mostrata una sola volta dopo un aggiornamento
// (la decisione è del main: src/main/whatsNew.ts). Stessa veste della
// UpdateModal, di cui è il seguito naturale.
export const WhatsNewModal: React.FC<Props> = ({ isOpen, version, previousVersion, onClose }) => {
    const { t, i18n } = useTranslation();
    useEscapeToClose(isOpen, onClose);

    if (!isOpen) return null;

    const notes = whatsNewFor(version, i18n.language);

    return (
        <div className="ov" style={{ zIndex: 200 }}>
            <div className="ov-panel anim-in w-full max-w-xl" role="dialog" aria-labelledby="whats-new-title">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-emerald-900/60 to-zinc-800 px-5 py-4 border-b border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                            <Sparkles size={16} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 id="whats-new-title" className="text-sm font-bold text-white">
                                {t('modal.whatsNew.title', 'Novità della versione {{v}}', { v: version })}
                            </h2>
                            {previousVersion && (
                                <p className="text-[10px] text-emerald-400 font-mono">
                                    {t('modal.whatsNew.updatedFrom', 'Aggiornato dalla v{{from}}', { from: previousVersion })}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label={t('modal.whatsNew.close', 'Ho capito')}
                        className="text-zinc-500 hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="p-5">
                    {notes ? (
                        <ul className="space-y-3 text-sm text-zinc-300 leading-relaxed list-disc pl-5 marker:text-emerald-500">
                            {notes.map((line, i) => <li key={i}>{line}</li>)}
                        </ul>
                    ) : (
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            {t('modal.whatsNew.fallback', "RRLMP è stato aggiornato. L'elenco completo delle modifiche è nelle note di rilascio.")}
                        </p>
                    )}
                </div>

                {/* FOOTER */}
                <div className="ov-foot">
                    <button
                        onClick={() => void window.electron.openExternal(releasePageUrl(version))}
                        className="btn btn-ghost flex items-center gap-2"
                    >
                        <ExternalLink size={13} />
                        {t('modal.whatsNew.fullNotes', 'Note di rilascio complete')}
                    </button>
                    <button onClick={onClose} className="btn btn-green" autoFocus>
                        {t('modal.whatsNew.close', 'Ho capito')}
                    </button>
                </div>
            </div>
        </div>
    );
};
