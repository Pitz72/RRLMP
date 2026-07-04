import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import appLogo from '../../assets/logo.png';
import { FlagIcon } from '../ui/FlagIcon';
import { UpdaterStatusPayload } from '../../types';
import { getManualUrl } from '../../utils/manualLinks';
import { toast } from '../../store/useToastStore';
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
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
    { code: 'zh', label: '中文' },
];

export const WelcomeScreen = ({ onNewProject, onLoadProject, updaterStatus, onOpenUpdateModal }: WelcomeScreenProps) => {
    const { t, i18n } = useTranslation();
    const [isQuickGuideOpen, setIsQuickGuideOpen] = useState(false);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLang = i18n.language?.slice(0, 2) || 'en';

    const handleOpenManual = async () => {
        const result = await window.electron?.openExternal(getManualUrl(currentLang));
        if (!result?.success) {
            toast(t('modal.about.openError'), 'error');
        }
    };

    return (
        <div className="ov" style={{ zIndex: 100 }}>
            <div className="ov-panel anim-in !flex-row" style={{ width: 720, maxHeight: '90vh' }}>

                {/* ── LEFT PANEL: Branding + Actions ── */}
                <div className="flex flex-col items-center text-center p-10 flex-1">

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
                    <div className="flex flex-col gap-3 w-full mb-auto">
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
                    <div className="text-xs text-zinc-600 mt-6 space-y-1">
                        <p>{t('welcome.developedBy')}</p>
                        <p>{t('welcome.copyright')}</p>
                    </div>
                </div>

                {/* ── RIGHT PANEL: Language Selector ── */}
                <div className="w-56 bg-zinc-950/70 border-l border-zinc-800 flex flex-col p-5">
                    <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-4">
                        {t('welcome.selectLanguage')}
                    </h3>
                    <div className="flex flex-col gap-1.5 flex-1">
                        {LANGUAGES.map((lng) => {
                            const isActive = currentLang === lng.code;
                            return (
                                <button
                                    key={lng.code}
                                    onClick={() => changeLanguage(lng.code)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                                        isActive
                                            ? 'border-cyan-500 bg-cyan-500/10 text-white'
                                            : 'border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800/60'
                                    }`}
                                >
                                    <FlagIcon code={lng.code} className="rounded-[2px] shadow-sm flex-shrink-0" />
                                    <span className="text-sm">{lng.label}</span>
                                    {isActive && <span className="ml-auto text-cyan-400 text-xs font-bold">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>

            <QuickGuideModal isOpen={isQuickGuideOpen} onClose={() => setIsQuickGuideOpen(false)} />
        </div>
    );
};
