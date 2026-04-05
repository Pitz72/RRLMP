import { useState, useEffect } from 'react';
import appLogo from '../../assets/logo.png';
import { checkForUpdates } from '../../utils/updateChecker';
import { useTranslation } from 'react-i18next';
import { FlagIcon } from '../ui/FlagIcon';
import { Globe } from 'lucide-react';

// Vite can expose specific env vars.
// APP_VERSION injected by Vite


interface WelcomeScreenProps {
    onNewProject: () => void;
    onLoadProject: () => void;
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

export const WelcomeScreen = ({ onNewProject, onLoadProject }: WelcomeScreenProps) => {
    const { t, i18n } = useTranslation();
    const [updateStatus, setUpdateStatus] = useState<'checking' | 'available' | 'latest' | 'error'>('checking');
    const [remoteVer, setRemoteVer] = useState('');
    const [isLangOpen, setIsLangOpen] = useState(false);

    useEffect(() => {
        checkForUpdates(__APP_VERSION__).then((info) => {
            if (info.hasUpdate) {
                setUpdateStatus('available');
                setRemoteVer(info.remoteVersion);
            } else {
                setUpdateStatus('latest');
            }
        }).catch(() => setUpdateStatus('error'));
    }, []);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsLangOpen(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-[500px] shadow-2xl flex flex-col items-center text-center relative">

                {/* LANGUAGE SWITCHER - Top Right */}
                <div className="absolute top-4 right-4">
                    <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className="text-zinc-400 hover:text-white transition-transform p-2 bg-zinc-800/50 rounded-full hover:bg-zinc-700"
                        title="Change Language"
                    >
                        <Globe size={18} />
                    </button>

                    {isLangOpen && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 py-1">
                            {LANGUAGES.map((lng) => (
                                <button
                                    key={lng.code}
                                    onClick={() => changeLanguage(lng.code)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 flex items-center gap-2 ${i18n.language === lng.code ? 'text-cyan-400 font-bold bg-zinc-700/50' : 'text-zinc-300'}`}
                                >
                                    <FlagIcon code={lng.code} className="w-5 h-3 rounded-[1px]" />
                                    <span>{lng.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* LOGO */}
                <img src={appLogo} alt="Runtime Live Machine" className="w-24 h-auto mb-6 drop-shadow-lg" />

                {/* TITLE */}
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-2">
                    {t('welcome.title')}
                </h1>

                {/* VERSION & UPDATE */}
                <div className="flex items-center gap-2 mb-6">
                    <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-mono border border-zinc-700">
                        v{__APP_VERSION__}
                    </span>
                    {updateStatus === 'checking' && <span className="text-xs text-zinc-500 animate-pulse">{t('welcome.checking')}</span>}
                    {updateStatus === 'latest' && <span className="text-xs text-emerald-500 font-medium">{t('welcome.latest')}</span>}
                    {updateStatus === 'available' && <span className="text-xs text-amber-500 font-bold animate-bounce">{t('welcome.updateAvailable', { version: remoteVer })}</span>}
                </div>

                {/* ACTIONS */}
                <div className="flex flex-col gap-3 w-full mb-8">
                    <button
                        onClick={onNewProject}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-cyan-900/20"
                    >
                        {t('welcome.newProject')}
                    </button>
                    <button
                        onClick={onLoadProject}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-lg border border-zinc-700 transition-colors"
                    >
                        {t('welcome.loadProject')}
                    </button>
                    <button
                        disabled
                        className="bg-transparent text-zinc-600 font-medium py-2 text-sm cursor-not-allowed flex items-center justify-center gap-2"
                        title="Coming Soon via Web"
                    >
                        {t('welcome.manual')}
                    </button>
                </div>

                {/* FOOTER / CREDITS */}
                <div className="text-xs text-zinc-600 mt-auto space-y-1">
                    <p>{t('welcome.developedBy')}</p>
                    <p>{t('welcome.copyright')}</p>
                </div>

            </div>
        </div>
    );
};
