import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAudioStore } from '../../store/useAudioStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

interface AudioDevice {
    deviceId: string;
    label: string;
}

export const GeneralSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { outputDeviceId, setOutputDeviceId, duckingFactor, duckingDuration, setDuckingSettings, defaultPreshowTransition, setDefaultPreshowTransition } = useSettingsStore();
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
                    <h2 className="text-lg font-bold text-white">General Settings</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">&times;</button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* AUDIO OUTPUT */}
                    <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Audio Output Device</label>
                        <select
                            value={outputDeviceId}
                            onChange={handleChange}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                        >
                            <option value="default">System Default</option>
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
                        <h3 className="text-xs uppercase text-emerald-500 font-bold tracking-wider">Mixing Intelligence</h3>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-zinc-400">Ducking Reduction</label>
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
                                <label className="text-xs text-zinc-400">Ducking Fade Speed</label>
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
                            <label className="text-xs text-zinc-400">Default Continuous-Play (Pre-Show)</label>
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
                    </div>
                </div>

                <div className="bg-zinc-800 p-4 border-t border-zinc-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm shadow-lg shadow-emerald-500/20"
                    >
                        DONE
                    </button>
                </div>
            </div>
        </div>
    );
};
