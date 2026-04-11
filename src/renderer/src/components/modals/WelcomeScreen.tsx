import { useState, useEffect } from 'react';
import appLogo from '../../assets/logo.png';
import { checkForUpdates, UpdateInfo } from '../../utils/updateChecker';
import { useTranslation } from 'react-i18next';
import { FlagIcon } from '../ui/FlagIcon';
import { UpdateModal } from './UpdateModal';

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
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ hasUpdate: false, remoteVersion: '' });
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    useEffect(() => {
        checkForUpdates(__APP_VERSION__).then((info) => {
            setUpdateInfo(info);
            if (info.hasUpdate) {
                setUpdateStatus('available');
                setShowUpdateModal(true);
            } else {
                setUpdateStatus('latest');
            }
        }).catch(() => setUpdateStatus('error'));
    }, []);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLang = i18n.language?.slice(0, 2) || 'en';

    return (
        <>
        <UpdateModal
            isOpen={showUpdateModal}
            info={updateInfo}
            currentVersion={__APP_VERSION__}
            onClose={() => setShowUpdateModal(false)}
        />
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex overflow-hidden" style={{ width: 720, maxHeight: '90vh' }}>

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
                        {updateStatus === 'checking' && <span className="text-xs text-zinc-500 animate-pulse">{t('welcome.checking')}</span>}
                        {updateStatus === 'latest' && <span className="text-xs text-emerald-500 font-medium">{t('welcome.latest')}</span>}
                        {updateStatus === 'available' && (
                            <button
                                onClick={() => setShowUpdateModal(true)}
                                className="text-xs text-amber-500 font-bold animate-bounce hover:text-amber-400 transition-colors"
                            >
                                {t('welcome.updateAvailable', { version: updateInfo.remoteVersion })}
                            </button>
                        )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col gap-3 w-full mb-auto">
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
        </div>
        </>
    );
};
