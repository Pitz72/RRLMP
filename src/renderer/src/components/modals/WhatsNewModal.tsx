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
                <div className="ov-head">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#101114', boxShadow: 'inset 0 2px 6px rgba(0,0,0,.75), 0 1px 0 rgba(255,255,255,.05)' }}>
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
                        className="ov-x"
                    >
                        <X size={18} />
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
