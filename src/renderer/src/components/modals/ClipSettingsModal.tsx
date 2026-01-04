import React, { useState, useEffect } from 'react';
import { AudioClip } from '../../types';
import { debugLog } from '../../store/useDebugStore';

interface ClipSettingsModalProps {
    clip: AudioClip;
    isOpen: boolean;
    onClose: () => void;
    onSave: (clipId: string, updates: Partial<AudioClip>) => void;
    onDelete: (clipId: string) => void;
}

const COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#64748B', // Slate
];

export const ClipSettingsModal: React.FC<ClipSettingsModalProps> = ({ clip, isOpen, onClose, onSave, onDelete }) => {
    const [name, setName] = useState(clip.name);
    const [volume, setVolume] = useState(clip.volume);
    const [isLooping, setIsLooping] = useState(clip.isLooping);
    const [nextAction, setNextAction] = useState<AudioClip['nextAction']>(clip.nextAction);
    const [duckingRole, setDuckingRole] = useState<AudioClip['duckingRole']>(clip.duckingRole);
    const [customColor, setCustomColor] = useState(clip.customColor || clip.color);
    const [behavior, setBehavior] = useState<AudioClip['behavior']>(clip.behavior || 'normal');
    const [fadeIn, setFadeIn] = useState(clip.fadeIn || 0);
    const [fadeOut, setFadeOut] = useState(clip.fadeOut || 0);

    // Reset state when clip changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setName(clip.name);
            setVolume(clip.volume);
            setIsLooping(clip.isLooping || false);
            setNextAction(clip.nextAction || 'stop');
            setDuckingRole(clip.duckingRole || 'none');
            setCustomColor(clip.customColor || clip.color);
            setFadeIn(clip.fadeIn || 0);
            setFadeOut(clip.fadeOut || 0);
            setBehavior(clip.behavior || 'normal');
        }
    }, [clip, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        const updatedClip: Partial<AudioClip> = {
            name,
            volume: Number(volume),
            isLooping,
            nextAction,
            duckingRole,
            customColor,
            fadeIn: Number(fadeIn),
            fadeOut: Number(fadeOut),
            behavior
        };
        debugLog(`Saving Clip: ${clip.name} FadeOut=${updatedClip.fadeOut}`, 'info');
        onSave(clip.id, updatedClip);
        onClose();
    };

    const handleDelete = () => {
        if (confirm('Sei sicuro di voler eliminare questa clip?')) {
            onDelete(clip.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Clip Settings</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">&times;</button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Name Input */}
                    <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Audio Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Volume: {(volume * 100).toFixed(0)}%</label>
                            <input
                                type="range"
                                min="0"
                                max="1.5"
                                step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            {/* Fade Settings */}
                            <div className="flex gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-zinc-400">Fade In (ms)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-zinc-800 border border-zinc-700 p-2 rounded text-sm text-white focus:outline-none focus:border-zinc-500"
                                        value={fadeIn}
                                        onChange={(e) => setFadeIn(Number(e.target.value))}
                                        step={100}
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-zinc-400">Fade Out (ms)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-zinc-800 border border-zinc-700 p-2 rounded text-sm text-white focus:outline-none focus:border-zinc-500"
                                        value={fadeOut}
                                        onChange={(e) => setFadeOut(Number(e.target.value))}
                                        step={100}
                                        min={0}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer bg-zinc-800 p-2 rounded border border-zinc-700">
                                <input
                                    type="checkbox"
                                    checked={isLooping}
                                    onChange={(e) => setIsLooping(e.target.checked)}
                                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-900"
                                />
                                <span className="text-sm font-medium text-zinc-300">Loop Playback</span>
                            </label>
                        </div>
                    </div>

                    {/* Broadcast Logic Section */}
                    <div className="grid grid-cols-2 gap-4 bg-zinc-950/50 p-4 rounded border border-zinc-800">
                        <div>
                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Next Action</label>
                            <select
                                value={nextAction}
                                onChange={(e) => setNextAction(e.target.value as any)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                            >
                                <option value="stop">Stop</option>
                                <option value="play_next">Play Next</option>
                                <option value="loop">Loop</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Ducking Role</label>
                            <select
                                value={duckingRole}
                                onChange={(e) => setDuckingRole(e.target.value as any)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                            >
                                <option value="none">None</option>
                                <option value="source">Source (Priority)</option>
                                <option value="target">Target (Ducked)</option>
                            </select>
                        </div>
                    </div>

                    {/* Behavior Section */}
                    <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Behavior (Intra-Column)</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="behavior"
                                    value="normal"
                                    checked={behavior === 'normal'}
                                    onChange={() => setBehavior('normal')}
                                    className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-zinc-300">Normal (Stops Others)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="behavior"
                                    value="stacco"
                                    checked={behavior === 'stacco'}
                                    onChange={() => setBehavior('stacco')}
                                    className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-zinc-300">Stacco (Ducks Others)</span>
                            </label>
                        </div>
                    </div>

                    {/* Color Section */}
                    <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-2">Custom Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCustomColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${customColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-zinc-800 p-4 border-t border-zinc-700 flex justify-between">
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors text-sm font-medium"
                    >
                        Elimina Clip
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-zinc-300 hover:text-white text-sm font-medium"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium shadow-lg shadow-blue-500/20 transition-all"
                        >
                            Salva
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};
