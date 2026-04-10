import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useTranslation } from 'react-i18next';
import { DEFAULT_MASTER_CHAIN } from '../../engine/AudioContextManager';
import { FlagIcon } from '../ui/FlagIcon';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

interface AudioDevice {
    deviceId: string;
    label: string;
}

type SettingsTab = 'output' | 'chain' | 'language';

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

// Toggle switch riutilizzabile
const Toggle: React.FC<{ enabled: boolean; onToggle: () => void; labelOn?: string; labelOff?: string }> = ({
    enabled, onToggle, labelOn = 'On', labelOff = 'Off'
}) => (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <span className="text-[10px] text-zinc-500 w-6">{enabled ? labelOn : labelOff}</span>
        <div onClick={onToggle} className={`w-8 h-4 rounded-full transition-colors cursor-pointer flex items-center ${enabled ? 'bg-sky-500' : 'bg-zinc-700'}`}>
            <div className={`w-3 h-3 bg-white rounded-full mx-0.5 transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
    </label>
);

// Slider con label e valore
const LabeledSlider: React.FC<{
    label: string; value: number; min: number; max: number; step: number;
    display: string; accent?: string; disabled?: boolean;
    onChange: (v: number) => void;
}> = ({ label, value, min, max, step, display, accent = 'accent-emerald-500', disabled, onChange }) => (
    <div className="space-y-1">
        <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-400">{label}</span>
            <span className={`text-xs font-mono ${disabled ? 'text-zinc-600' : accent.includes('sky') ? 'text-sky-400' : accent.includes('red') ? 'text-red-400' : accent.includes('orange') ? 'text-orange-400' : 'text-emerald-400'}`}>{display}</span>
        </div>
        <input
            type="range" min={min} max={max} step={step} value={value} disabled={disabled}
            onChange={(e) => onChange(step % 1 !== 0 ? parseFloat(e.target.value) : parseInt(e.target.value))}
            className={`w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer ${accent} disabled:opacity-30 disabled:cursor-not-allowed`}
        />
    </div>
);

export const GeneralSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const {
        outputDeviceId, setOutputDeviceId,
        duckingFactor, duckingDuration, setDuckingSettings,
        defaultPreshowTransition, setDefaultPreshowTransition,
        crossfadeDuration, segueDuration, setPreshowTransition, setSegueDuration,
        masterChain, setMasterChain,
        micInputDeviceId, micThresholdDb, micEnabled, setMicSettings
    } = useSettingsStore();
    const updateOutputDevice = useAudioStore(s => s.updateOutputDevice);
    const [devices, setDevices] = useState<AudioDevice[]>([]);
    const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
    const [activeTab, setActiveTab] = useState<SettingsTab>('output');

    useEffect(() => {
        if (isOpen) {
            navigator.mediaDevices.enumerateDevices().then(devs => {
                const audioOuts = devs
                    .filter(d => d.kind === 'audiooutput')
                    .map(d => ({
                        deviceId: d.deviceId,
                        label: d.label || `Device ${d.deviceId.substring(0, 5)}...`
                    }));
                setDevices(audioOuts);
                const audioIns = devs
                    .filter(d => d.kind === 'audioinput')
                    .map(d => ({
                        deviceId: d.deviceId,
                        label: d.label || `Input ${d.deviceId.substring(0, 5)}...`
                    }));
                setInputDevices(audioIns);
            });
        }
    }, [isOpen]);

    const handleChangeDevice = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        setOutputDeviceId(newId);
        updateOutputDevice(newId);
    };

    if (!isOpen) return null;

    const tabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: 'output', label: t('modal.settings.tab.output'), icon: '🎚️' },
        { id: 'chain', label: t('modal.settings.tab.chain'), icon: '⛓️' },
        { id: 'language', label: t('modal.settings.tab.language'), icon: '🌐' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col" style={{ maxHeight: '88vh' }}>

                {/* HEADER */}
                <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex justify-between items-center shrink-0">
                    <h2 className="text-base font-bold text-white tracking-wide">{t('modal.settings.title')}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors">&times;</button>
                </div>

                {/* TAB BAR */}
                <div className="flex border-b border-zinc-800 bg-zinc-900 shrink-0 px-2 pt-2 gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                                activeTab === tab.id
                                    ? 'border-emerald-500 text-white bg-zinc-800'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto min-h-0">

                    {/* ── TAB: Output & Mix ── */}
                    {activeTab === 'output' && (
                        <div className="p-6 space-y-6">

                            {/* AUDIO OUTPUT */}
                            <section>
                                <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-3">{t('modal.settings.outputDevice')}</h3>
                                <select
                                    value={outputDeviceId}
                                    onChange={handleChangeDevice}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                                >
                                    <option value="default">{t('modal.settings.systemDefault')}</option>
                                    {devices.map(d => (
                                        <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-zinc-600 mt-1">Seleziona la scheda audio (es. Rødecaster). L'audio si sposta immediatamente.</p>
                            </section>

                            <div className="h-px bg-zinc-800" />

                            {/* SMART MIC — Audio Input */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] uppercase text-red-400 font-bold tracking-wider">Smart Mic — Auto-Ducking</h3>
                                    <Toggle
                                        enabled={micEnabled}
                                        onToggle={() => setMicSettings({ enabled: !micEnabled })}
                                        labelOn="Abilitato"
                                        labelOff="Off"
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-600 italic">Il microfono monitora il parlato e abbassa automaticamente la musica, senza passare da una clip voce.</p>

                                <div className={`space-y-3 transition-opacity ${micEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">Dispositivo di Input</span>
                                        <select
                                            value={micInputDeviceId}
                                            onChange={e => setMicSettings({ inputDeviceId: e.target.value })}
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none"
                                        >
                                            <option value="default">Microfono Predefinito</option>
                                            {inputDevices.map(d => (
                                                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-zinc-600 mt-1">Microfono USB, Rødecaster, Zoom LiveTrak, Focusrite ecc. appaiono qui automaticamente.</p>
                                    </div>
                                    <LabeledSlider
                                        label="Soglia Attivazione Noise Gate"
                                        value={micThresholdDb}
                                        min={-60} max={-10} step={1}
                                        display={`${micThresholdDb} dBFS`}
                                        accent="accent-red-500"
                                        onChange={v => setMicSettings({ thresholdDb: v })}
                                    />
                                    <p className="text-[10px] text-zinc-600 -mt-2 italic">
                                        Voce sopra questa soglia per 80ms → ducking attivo. Rilascio a {micThresholdDb - 12} dBFS per 1.5s. Default: -30 dBFS.
                                    </p>
                                </div>
                            </section>

                            <div className="h-px bg-zinc-800" />

                            {/* MIXING INTELLIGENCE */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] uppercase text-emerald-500 font-bold tracking-wider">{t('modal.settings.mixingIntelligence')}</h3>

                                <LabeledSlider
                                    label={t('modal.settings.duckingReduction')}
                                    value={duckingFactor} min={0} max={1} step={0.05}
                                    display={`${Math.round(duckingFactor * 100)}%`}
                                    accent="accent-emerald-500"
                                    onChange={(v) => setDuckingSettings({ factor: v })}
                                />
                                <p className="text-[10px] text-zinc-600 -mt-2 italic">Volume musica quando lo speaker parla. 20% è lo standard radiofonico.</p>

                                <LabeledSlider
                                    label={t('modal.settings.duckingSpeed')}
                                    value={duckingDuration} min={0} max={2000} step={50}
                                    display={`${duckingDuration}ms`}
                                    accent="accent-emerald-500"
                                    onChange={(v) => setDuckingSettings({ duration: v })}
                                />
                                <p className="text-[10px] text-zinc-600 -mt-2 italic">Più alto = transizione più morbida.</p>
                            </section>

                            <div className="h-px bg-zinc-800" />

                            {/* TRANSIZIONI */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] uppercase text-emerald-500 font-bold tracking-wider">{t('modal.settings.defaultTransition')}</h3>

                                <select
                                    value={defaultPreshowTransition}
                                    onChange={(e) => setDefaultPreshowTransition(e.target.value as 'crossfade' | 'segue' | 'gapless')}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded text-xs p-2 text-white outline-none focus:border-emerald-500"
                                >
                                    <option value="crossfade">Crossfade (Sfumatura Incrociata)</option>
                                    <option value="segue">Segue / Cold Start (Subito Pieno, Prec. Sfuma)</option>
                                    <option value="gapless">Gapless (Taglio Netto / No Fade)</option>
                                </select>
                                <p className="text-[10px] text-zinc-600 -mt-2 italic">Transizione automatica tra clip consecutive con play_next.</p>

                                <LabeledSlider
                                    label={t('modal.settings.crossfadeDuration')}
                                    value={crossfadeDuration} min={200} max={6000} step={100}
                                    display={`${crossfadeDuration}ms`}
                                    accent="accent-emerald-500"
                                    onChange={(v) => setPreshowTransition({ duration: v })}
                                />

                                <LabeledSlider
                                    label={t('modal.settings.segueDuration')}
                                    value={segueDuration} min={100} max={3000} step={100}
                                    display={`${segueDuration}ms`}
                                    accent="accent-orange-500"
                                    onChange={(v) => setSegueDuration(v)}
                                />
                            </section>
                        </div>
                    )}

                    {/* ── TAB: Master Chain ── */}
                    {activeTab === 'chain' && (
                        <div className="p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] uppercase text-sky-400 font-bold tracking-wider">Master Chain</h3>
                                    <p className="text-[10px] text-zinc-600 mt-0.5 italic">Pipeline broadcast-grade: HPF → Compressore → Limiter brickwall sul master bus.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-400">{masterChain.enabled ? 'Attiva' : 'Bypass'}</span>
                                    <Toggle enabled={masterChain.enabled} onToggle={() => setMasterChain({ enabled: !masterChain.enabled })} />
                                </div>
                            </div>

                            {/* HPF */}
                            <div className={`space-y-3 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 transition-opacity ${masterChain.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-zinc-300">HPF — High-Pass Filter</span>
                                    <Toggle enabled={masterChain.hpfEnabled} onToggle={() => setMasterChain({ hpfEnabled: !masterChain.hpfEnabled })} />
                                </div>
                                <LabeledSlider
                                    label="Frequenza di taglio"
                                    value={masterChain.hpfFrequency} min={20} max={200} step={5}
                                    display={`${masterChain.hpfFrequency} Hz`}
                                    accent="accent-sky-500"
                                    disabled={!masterChain.hpfEnabled}
                                    onChange={(v) => setMasterChain({ hpfFrequency: v })}
                                />
                                <p className="text-[10px] text-zinc-600 italic">Elimina rumble, fruscio basso, DC offset. Standard: 80 Hz.</p>
                            </div>

                            {/* COMPRESSOR */}
                            <div className={`space-y-3 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 transition-opacity ${masterChain.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-zinc-300">Compressore Broadcast</span>
                                    <Toggle enabled={masterChain.compressorEnabled} onToggle={() => setMasterChain({ compressorEnabled: !masterChain.compressorEnabled })} />
                                </div>
                                <LabeledSlider
                                    label="Soglia"
                                    value={masterChain.compressorThreshold} min={-40} max={-6} step={1}
                                    display={`${masterChain.compressorThreshold} dBFS`}
                                    accent="accent-sky-500"
                                    disabled={!masterChain.compressorEnabled}
                                    onChange={(v) => setMasterChain({ compressorThreshold: v })}
                                />
                                <LabeledSlider
                                    label="Ratio"
                                    value={masterChain.compressorRatio} min={1} max={20} step={1}
                                    display={`${masterChain.compressorRatio}:1`}
                                    accent="accent-sky-500"
                                    disabled={!masterChain.compressorEnabled}
                                    onChange={(v) => setMasterChain({ compressorRatio: v })}
                                />
                                <p className="text-[10px] text-zinc-600 italic">Standard broadcast: -18 dBFS / 4:1, 5 ms att. / 200 ms rel.</p>
                            </div>

                            {/* LIMITER */}
                            <div className={`space-y-3 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 transition-opacity ${masterChain.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-zinc-300">Limiter Brickwall</span>
                                    <span className="text-[10px] text-zinc-600 italic">Sempre attivo se chain abilitata</span>
                                </div>
                                <LabeledSlider
                                    label="Soglia massima"
                                    value={masterChain.limiterThreshold} min={-6} max={-0.1} step={0.1}
                                    display={`${masterChain.limiterThreshold.toFixed(1)} dBFS`}
                                    accent="accent-red-500"
                                    onChange={(v) => setMasterChain({ limiterThreshold: v })}
                                />
                                <p className="text-[10px] text-zinc-600 italic">Blocco assoluto per protezione trasmittente. 20:1, 1 ms att. Default: -1 dBFS.</p>
                            </div>

                            <button
                                onClick={() => setMasterChain({ ...DEFAULT_MASTER_CHAIN })}
                                className="text-[10px] text-zinc-600 hover:text-zinc-300 underline transition-colors"
                            >
                                ↺ Ripristina default Master Chain
                            </button>
                        </div>
                    )}

                    {/* ── TAB: Lingua / Language ── */}
                    {activeTab === 'language' && (
                        <div className="p-6 space-y-5">
                            <div>
                                <h3 className="text-[10px] uppercase text-violet-400 font-bold tracking-wider mb-1">{t('modal.settings.tab.language')}</h3>
                                <p className="text-[10px] text-zinc-600 italic">Seleziona la lingua dell'interfaccia. La modifica è immediata.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {LANGUAGES.map((lng) => {
                                    const isActive = i18n.language === lng.code || i18n.language.startsWith(lng.code);
                                    return (
                                        <button
                                            key={lng.code}
                                            onClick={() => i18n.changeLanguage(lng.code)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                                                isActive
                                                    ? 'border-violet-500 bg-violet-500/10 text-white'
                                                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                                            }`}
                                        >
                                            <FlagIcon code={lng.code} className="rounded-sm shadow-sm flex-shrink-0" />
                                            <span className="text-sm font-medium">{lng.label}</span>
                                            {isActive && <span className="ml-auto text-violet-400 text-xs">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>

                {/* FOOTER */}
                <div className="bg-zinc-800 px-6 py-3 border-t border-zinc-700 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-8 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm shadow-lg shadow-emerald-500/20 transition-colors"
                    >
                        {t('modal.settings.done')}
                    </button>
                </div>
            </div>
        </div>
    );
};
