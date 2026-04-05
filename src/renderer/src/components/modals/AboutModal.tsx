import { useState, useEffect } from 'react';
import appLogo from '../../assets/logo.png';
import { X, BookOpen, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { checkForUpdates } from '../../utils/updateChecker';

// APP_VERSION injected by Vite



interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
    const { t } = useTranslation();
    const [updateStatus, setUpdateStatus] = useState<'checking' | 'available' | 'latest' | 'error'>('checking');
    const [remoteVer, setRemoteVer] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUpdateStatus('checking');
            checkForUpdates(__APP_VERSION__).then((info) => {
                if (info.hasUpdate) {
                    setUpdateStatus('available');
                    setRemoteVer(info.remoteVersion);
                } else {
                    setUpdateStatus('latest');
                }
            }).catch(() => setUpdateStatus('error'));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-[400px] shadow-2xl relative" onClick={e => e.stopPropagation()}>

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
                        {updateStatus === 'checking' && <RefreshCw size={12} className="text-zinc-600 animate-spin" />}

                        {updateStatus === 'latest' && <span className="text-[10px] text-emerald-500 border border-emerald-500/30 px-1.5 rounded bg-emerald-500/10">{t('welcome.latest')}</span>}
                        {updateStatus === 'available' && <span className="text-[10px] text-amber-500 border border-amber-500/30 px-1.5 rounded bg-amber-500/10 animate-pulse">{t('welcome.updateAvailable', { version: remoteVer })}</span>}
                        {updateStatus === 'error' && <span className="text-[10px] text-red-900">OFFLINE</span>}
                    </div>

                    <div className="bg-zinc-950/50 rounded-lg p-4 w-full text-sm text-zinc-400 space-y-2 mb-4 border border-zinc-800">
                        <p>{t('modal.about.description')}</p>
                        <hr className="border-zinc-800 my-2" />
                        <p className="text-xs">{t('welcome.developedBy')}</p>
                    </div>

                    {/* NEW ACTIONS */}
                    <div className="flex flex-col w-full gap-2 mb-4">
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
