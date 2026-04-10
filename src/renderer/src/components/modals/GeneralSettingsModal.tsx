import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useTranslation } from 'react-i18next';
import { DEFAULT_MASTER_CHAIN } from '../../engine/AudioContextManager';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

interface AudioDevice {
    deviceId: string;
    label: string;
}

export const GeneralSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { outputDeviceId, setOutputDeviceId, duckingFactor, duckingDuration, setDuckingSettings, defaultPreshowTransition, setDefaultPreshowTransition, crossfadeDuration, segueDuration, setPreshowTransition, setSegueDuration, masterChain, setMasterChain } = useSettingsStore();
    const updateOutputDevice = useAudioStore(s => s.updateOutputDevice);
    const [devices, setDevices] = useState<AudioDevice[]>([]);

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
            });
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        setOutputDeviceId(newId);
        updateOutputDevice(newId); // Hot switch
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">{t('modal.settings.title')}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* AUDIO OUTPUT */}
                    <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">{t('modal.settings.outputDevice')}</label>
                        <select
                            value={outputDeviceId}
                            onChange={handleChange}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                        >
                            <option value="default">{t('modal.settings.systemDefault')}</option>
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-zinc-500 mt-1">
                            Seleziona la scheda audio (es. Rødecaster). L'audio si sposterà immediatamente.
                        </p>
                    </div>

                    <div className="h-px bg-zinc-800" />

                    {/* MIXING INTELLIGENCE */}
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase text-emerald-500 font-bold tracking-wider">{t('modal.settings.mixingIntelligence')}</h3>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-zinc-400">{t('modal.settings.duckingReduction')}</label>
                                <span className="text-xs font-mono text-emerald-400">{Math.round(duckingFactor * 100)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={duckingFactor}
                                onChange={(e) => setDuckingSettings({ factor: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <p className="text-[10px] text-zinc-500 italic">
                                Volume della musica quando lo speaker parla. 20% è lo standard radiofonico.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-zinc-400">{t('modal.settings.duckingSpeed')}</label>
                                <span className="text-xs font-mono text-emerald-400">{duckingDuration}ms</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="2000" 
                                step="50" 
                                value={duckingDuration}
                                onChange={(e) => setDuckingSettings({ duration: parseInt(e.target.value) })}
                                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <p className="text-[10px] text-zinc-500 italic">
                                Tempo di transizione del volume. Più è alto, più il mix è "morbido".
                            </p>
                        </div>
                        
                        <div className="space-y-1 mt-4">
                            <label className="text-xs text-zinc-400">{t('modal.settings.defaultTransition')}</label>
                            <select
                                value={defaultPreshowTransition}
                                onChange={(e) => setDefaultPreshowTransition(e.target.value as 'crossfade' | 'segue' | 'gapless')}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded text-xs p-1.5 text-white outline-none focus:border-emerald-500"
                            >
                                <option value="crossfade">Crossfade (Sfumatura Incrociata)</option>
                                <option value="segue">Segue / Cold Start (Subito Pieno, Prec. Sfuma)</option>
                                <option value="gapless">Gapless (Taglio Netto / No Fade)</option>
                            </select>
                            <p className="text-[10px] text-zinc-500 italic">
                                Transizione automatica quando colonna Preshow passa alla clip successiva.
                            </p>
                        </div>

                        <div className="space-y-2 mt-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-zinc-400">{t('modal.settings.crossfadeDuration')}</label>
                                <span className="text-xs font-mono text-emerald-400">{crossfadeDuration}ms</span>
                            </div>
                            <input
                                type="range"
                                min="200"
                                max="6000"
                                step="100"
                                value={crossfadeDuration}
                                onChange={(e) => setPreshowTransition({ duration: parseInt(e.target.value) })}
                                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <p className="text-[10px] text-zinc-500 italic">
                                Durata fade-out + fade-in per la transizione Crossfade.
                            </p>
                        </div>

                        <div className="space-y-2 mt-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-zinc-400">{t('modal.settings.segueDuration')}</label>
                                <span className="text-xs font-mono text-orange-400">{segueDuration}ms</span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="3000"
                                step="100"
                                value={segueDuration}
                                onChange={(e) => setSegueDuration(parseInt(e.target.value))}
                                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <p className="text-[10px] text-zinc-500 italic">
                                Durata del fade-out della clip uscente nel Segue. La clip entrante parte subito a volume pieno.
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-800" />

                    {/* MASTER CHAIN */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs uppercase text-sky-400 font-bold tracking-wider">Master Chain</h3>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <span className="text-xs text-zinc-400">{masterChain.enabled ? 'Attiva' : 'Bypass'}</span>
                                <div
                                    onClick={() => setMasterChain({ enabled: !masterChain.enabled })}
                                    className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${masterChain.enabled ? 'bg-sky-500' : 'bg-zinc-700'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${masterChain.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                </div>
                            </label>
                        </div>
                        <p className="text-[10px] text-zinc-500 -mt-2 italic">
                            Pipeline broadcast-grade: HPF → Compressore → Limiter brickwall sul master bus.
                        </p>

                        {/* HPF */}
                        <div className={`space-y-2 transition-opacity ${masterChain.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-zinc-400">HPF (High-Pass Filter)</label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <span className="text-[10px] text-zinc-500">{masterChain.hpfEnabled ? 'On' : 'Off'}</span>
                                    <div
                                        onClick={() => setMasterChain({ hpfEnabled: !masterChain.hpfEnabled })}
                                        className={`w-7 h-4 rounded-full transition-colors cursor-pointer ${masterChain.hpfEnabled ? 'bg-sky-600' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${masterChain.hpfEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                    </div>
                                </label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="20"
                                    max="200"
                                    step="5"
                                    value={masterChain.hpfFrequency}
                                    disabled={!masterChain.hpfEnabled}
                                    onChange={(e) => setMasterChain({ hpfFrequency: parseInt(e.target.value) })}
                                    className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-40"
                                />
                                <span className="text-xs font-mono text-sky-400 w-12 text-right">{masterChain.hpfFrequency} Hz</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 italic">
                                Taglia frequenze sotto il limite — elimina rumble, fruscio basso, DC offset. Standard: 80 Hz.
                            </p>
                        </div>

                        {/* COMPRESSOR */}
                        <div className={`space-y-2 transition-opacity ${masterChain.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-zinc-400">Compressore Broadcast</label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <span className="text-[10px] text-zinc-500">{masterChain.compressorEnabled ? 'On' : 'Off'}</span>
                                    <div
                                        onClick={() => setMasterChain({ compressorEnabled: !masterChain.compressorEnabled })}
                                        className={`w-7 h-4 rounded-full transition-colors cursor-pointer ${masterChain.compressorEnabled ? 'bg-sky-600' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${masterChain.compressorEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                    </div>
                                </label>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-zinc-500 w-16">Soglia</span>
                                <input
                                    type="range"
                                    min="-40"
                                    max="-6"
                                    step="1"
                                    value={masterChain.compressorThreshold}
                                    disabled={!masterChain.compressorEnabled}
                                    onChange={(e) => setMasterChain({ compressorThreshold: parseInt(e.target.value) })}
                                    className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-40"
                                />
                                <span className="text-xs font-mono text-sky-400 w-14 text-right">{masterChain.compressorThreshold} dBFS</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-zinc-500 w-16">Ratio</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    step="1"
                                    value={masterChain.compressorRatio}
                                    disabled={!masterChain.compressorEnabled}
                                    onChange={(e) => setMasterChain({ compressorRatio: parseInt(e.target.value) })}
                                    className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-40"
                                />
                                <span className="text-xs font-mono text-sky-400 w-14 text-right">{masterChain.compressorRatio}:1</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 italic">
                                Livella i picchi del mix. Impostazione broadcast tipica: -18 dBFS / 4:1, 5 ms att. / 200 ms rel.
                            </p>
                        </div>

                        {/* LIMITER */}
                        <div className={`space-y-2 transition-opacity ${masterChain.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-zinc-400">Limiter Brickwall</label>
                                <span className="text-[10px] text-zinc-600 italic">Sempre attivo se chain abilitata</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="-6"
                                    max="-0.1"
                                    step="0.1"
                                    value={masterChain.limiterThreshold}
                                    onChange={(e) => setMasterChain({ limiterThreshold: parseFloat(e.target.value) })}
                                    className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                                <span className="text-xs font-mono text-red-400 w-14 text-right">{masterChain.limiterThreshold.toFixed(1)} dBFS</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 italic">
                                Blocco assoluto per la protezione trasmittente. 20:1, 1 ms att. / 100 ms rel. Default: -1 dBFS.
                            </p>
                        </div>

                        {/* RESET */}
                        <button
                            onClick={() => setMasterChain({ ...DEFAULT_MASTER_CHAIN })}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
                        >
                            ↺ Ripristina default Master Chain
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-800 p-4 border-t border-zinc-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm shadow-lg shadow-emerald-500/20"
                    >
                        {t('modal.settings.done')}
                    </button>
                </div>
            </div>
        </div>
    );
};
