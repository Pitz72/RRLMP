import appLogo from '../../assets/logo.png';
import { X, BookOpen, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import { UpdaterStatusPayload } from '../../types';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Auto-Updater (2026-07-02) — stato centralizzato in App.tsx, qui solo lettura + trigger manuale. */
    updaterStatus: UpdaterStatusPayload;
    onOpenUpdateModal: () => void;
    onCheckUpdatesNow: () => void;
}

export const AboutModal = ({ isOpen, onClose, updaterStatus, onOpenUpdateModal, onCheckUpdatesNow }: AboutModalProps) => {
    const { t } = useTranslation();

    // v1.4.13 (ESC-01): ESC chiude la modale invece di innescare lo STOP ALL.
    useEscapeToClose(isOpen, onClose);

    if (!isOpen) return null;

    return (
        <div className="ov" style={{ zIndex: 100 }} onClick={onClose}>
            <div className="ov-panel anim-in p-6 w-[400px] relative" onClick={e => e.stopPropagation()}>

                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <img src={appLogo} alt="Runtime Live Machine" className="w-16 h-auto mb-4" />

                    <h2 className="text-xl font-bold text-white mb-1">{t('modal.about.title')}</h2>

                    {/* VERSION & STATUS */}
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-zinc-500 text-xs font-mono">v{__APP_VERSION__}</span>
                        {updaterStatus.type === 'checking' && <RefreshCw size={12} className="text-zinc-600 animate-spin" />}

                        {updaterStatus.type === 'not-available' && <span className="text-[10px] text-emerald-500 border border-emerald-500/30 px-1.5 rounded bg-emerald-500/10">{t('welcome.latest')}</span>}
                        {(updaterStatus.type === 'available' || updaterStatus.type === 'downloading' || updaterStatus.type === 'ready') && (
                            <button
                                onClick={onOpenUpdateModal}
                                className="text-[10px] text-amber-500 border border-amber-500/30 px-1.5 rounded bg-amber-500/10 animate-pulse hover:bg-amber-500/20 transition-colors"
                            >
                                {t('welcome.updateAvailable', { version: updaterStatus.type === 'downloading' ? '' : updaterStatus.version })}
                            </button>
                        )}
                        {updaterStatus.type === 'error' && <span className="text-[10px] text-red-900">OFFLINE</span>}
                    </div>

                    <div className="card w-full text-sm text-zinc-400 space-y-2 mb-4">
                        <p>{t('modal.about.description')}</p>
                        <hr className="border-zinc-800 my-2" />
                        <p className="text-xs">{t('welcome.developedBy')}</p>
                    </div>

                    {/* NEW ACTIONS */}
                    <div className="flex flex-col w-full gap-2 mb-4">
                        <button
                            onClick={onCheckUpdatesNow}
                            disabled={updaterStatus.type === 'checking'}
                            className="bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50 py-2 rounded flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={14} className={updaterStatus.type === 'checking' ? 'animate-spin' : ''} />
                            <span>Controlla aggiornamenti ora</span>
                        </button>
                        <button
                            disabled
                            className="bg-zinc-800/50 text-zinc-500 border border-zinc-700/50 py-2 rounded flex items-center justify-center gap-2 text-sm cursor-not-allowed opacity-70"
                            title={t('welcome.manual')}
                        >
                            <BookOpen size={14} />
                            <span>{t('modal.about.manual')}</span>
                        </button>
                    </div>

                    <div className="text-xs text-zinc-600">
                        {t('welcome.copyright')}
                    </div>
                </div>
            </div>
        </div>
    );
};
