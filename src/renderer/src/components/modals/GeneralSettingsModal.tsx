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
    const { outputDeviceId, setOutputDeviceId } = useSettingsStore();
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
                <div className="p-6 space-y-4">
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
                </div>
                <div className="bg-zinc-800 p-4 border-t border-zinc-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};
