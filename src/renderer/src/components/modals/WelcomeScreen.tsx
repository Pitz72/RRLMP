import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import appLogo from '../../assets/logo.png';
import { FlagIcon } from '../ui/FlagIcon';
import { UpdaterStatusPayload } from '../../types';
import { getManualUrl } from '../../utils/manualLinks';
import { toast } from '../../store/useToastStore';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import { QuickGuideModal } from './QuickGuideModal';

interface WelcomeScreenProps {
    onNewProject: () => void;
    onLoadProject: () => void;
    /** Auto-Updater (2026-07-02) — stato centralizzato in App.tsx, qui solo lettura per il badge. */
    updaterStatus: UpdaterStatusPayload;
    onOpenUpdateModal: () => void;
}

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
];

export const WelcomeScreen = ({ onNewProject, onLoadProject, updaterStatus, onOpenUpdateModal }: WelcomeScreenProps) => {
    const { t, i18n } = useTranslation();
    const [isQuickGuideOpen, setIsQuickGuideOpen] = useState(false);

    // v1.15.32: selettore lingua a tendina in alto a destra (prima: pannello laterale).
    const [isLangOpen, setIsLangOpen] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const closeLangMenu = useCallback(() => setIsLangOpen(false), []);
    // ESC chiude la tendina senza raggiungere l'Emergency Stop globale.
    useEscapeToClose(isLangOpen, closeLangMenu);
    useEffect(() => {
        if (!isLangOpen) return;
        const onPointerDown = (e: MouseEvent) => {
            if (!langMenuRef.current?.contains(e.target as Node)) setIsLangOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [isLangOpen]);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsLangOpen(false);
    };

    const currentLang = i18n.language?.slice(0, 2) || 'en';
    const activeLanguage = LANGUAGES.find((l) => l.code === currentLang) ?? LANGUAGES[0];

    const handleOpenManual = async () => {
        const result = await window.electron?.openExternal(getManualUrl(currentLang));
        if (!result?.success) {
            toast(t('modal.about.openError'), 'error');
        }
    };

    return (
        <div className="ov" style={{ zIndex: 100 }}>
            <div className="ov-panel anim-in relative" style={{ width: 480, maxHeight: '90vh' }}>

                {/* ── LINGUA: tendina in alto a destra ── */}
                <div ref={langMenuRef} className="absolute top-4 right-4 z-10">
                    <button
                        onClick={() => setIsLangOpen((v) => !v)}
                        aria-haspopup="listbox"
                        aria-expanded={isLangOpen}
                        title={t('welcome.selectLanguage')}
                        className={`flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg border text-xs transition-colors ${
                            isLangOpen
                                ? 'border-cyan-500 bg-cyan-500/10 text-white'
                                : 'border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:border-zinc-500 hover:text-white'
                        }`}
                    >
                        <FlagIcon code={activeLanguage.code} className="rounded-[2px] shadow-sm flex-shrink-0" />
                        <span className="font-medium">{activeLanguage.label}</span>
                        <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isLangOpen && (
                        <div
                            role="listbox"
                            aria-label={t('welcome.selectLanguage')}
                            className="absolute right-0 mt-1.5 w-40 p-1 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/50"
                        >
                            {LANGUAGES.map((lng) => {
                                const isActive = currentLang === lng.code;
                                return (
                                    <button
                                        key={lng.code}
                                        role="option"
                                        aria-selected={isActive}
                                        onClick={() => changeLanguage(lng.code)}
                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left text-sm transition-colors ${
                                            isActive ? 'bg-cyan-500/10 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                        }`}
                                    >
                                        <FlagIcon code={lng.code} className="rounded-[2px] shadow-sm flex-shrink-0" />
                                        <span>{lng.label}</span>
                                        {isActive && <Check size={14} className="ml-auto text-cyan-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Branding + Azioni ── */}
                <div className="flex flex-col items-center text-center px-10 pt-12 pb-8">

                    {/* LOGO */}
                    <img src={appLogo} alt="Runtime Live Machine" className="w-20 h-auto mb-5 drop-shadow-lg" />

                    {/* TITLE */}
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-1">
                        {t('welcome.title')}
                    </h1>

                    {/* SLOGAN */}
                    <p className="text-sm text-cyan-400 font-medium tracking-wide mb-1">
                        {t('welcome.slogan')}
                    </p>

                    {/* DESCRIPTION */}
                    <p className="text-xs text-zinc-500 max-w-xs mb-5 leading-relaxed">
                        {t('welcome.description')}
                    </p>

                    {/* VERSION & UPDATE */}
                    <div className="flex items-center gap-2 mb-7">
                        <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-mono border border-zinc-700">
                            v{__APP_VERSION__}
                        </span>
                        {updaterStatus.type === 'checking' && <span className="text-xs text-zinc-500 animate-pulse">{t('welcome.checking')}</span>}
                        {updaterStatus.type === 'not-available' && <span className="text-xs text-emerald-500 font-medium">{t('welcome.latest')}</span>}
                        {(updaterStatus.type === 'available' || updaterStatus.type === 'downloading' || updaterStatus.type === 'ready') && (
                            <button
                                onClick={onOpenUpdateModal}
                                className="text-xs text-amber-500 font-bold animate-bounce hover:text-amber-400 transition-colors"
                            >
                                {t('welcome.updateAvailable', { version: updaterStatus.type === 'downloading' ? '' : updaterStatus.version })}
                            </button>
                        )}
                        {updaterStatus.type === 'error' && <span className="text-xs text-red-900">OFFLINE</span>}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                            onClick={onNewProject}
                            className="btn btn-green py-3"
                        >
                            {t('welcome.newProject')}
                        </button>
                        <button
                            onClick={onLoadProject}
                            className="btn btn-ghost py-3"
                        >
                            {t('welcome.loadProject')}
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={handleOpenManual}
                                className="flex-1 bg-transparent text-zinc-500 hover:text-zinc-300 font-medium py-2 text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {t('welcome.manual')}
                            </button>
                            <button
                                onClick={() => setIsQuickGuideOpen(true)}
                                className="flex-1 bg-transparent text-zinc-500 hover:text-zinc-300 font-medium py-2 text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {t('welcome.quickGuide')}
                            </button>
                        </div>
                    </div>

                    {/* FOOTER / CREDITS */}
                    {/* Licenza, paternità e credito ai modelli (apertura del sorgente), come in FeedDownloader e Titan. */}
                    <div className="text-xs text-zinc-600 mt-6 space-y-1">
                        <p>{t('welcome.license')} · {t('welcome.developedBy')}</p>
                        <p>{t('welcome.llm')}</p>
                        <p>{t('welcome.copyright')}</p>
                    </div>
                </div>

            </div>

            <QuickGuideModal isOpen={isQuickGuideOpen} onClose={() => setIsQuickGuideOpen(false)} />
        </div>
    );
};
