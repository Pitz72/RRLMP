import React, { useState, useEffect } from 'react';
import { AudioClip } from '../../types';
import { debugLog } from '../../store/useDebugStore';
import { Wand2, Settings2, Scissors } from 'lucide-react';
import { WaveformEditor } from '../ui/WaveformEditor';


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
    const [activeTab, setActiveTab] = useState<'general' | 'markers'>('general');
    
    const [name, setName] = useState(clip.name);
    const [volume, setVolume] = useState(clip.volume);
    const [isLooping, setIsLooping] = useState(clip.isLooping);
    const [nextAction, setNextAction] = useState<AudioClip['nextAction']>(clip.nextAction);
    const [duckingRole, setDuckingRole] = useState<AudioClip['duckingRole']>(clip.duckingRole);
    const [customColor, setCustomColor] = useState(clip.customColor || clip.color);
    const [behavior, setBehavior] = useState<AudioClip['behavior']>(clip.behavior || 'normal');
    const [fadeIn, setFadeIn] = useState(clip.fadeIn || 0);
    const [fadeOut, setFadeOut] = useState(clip.fadeOut || 0);
    const [keybind, setKeybind] = useState(clip.keybind || '');
    const [trimStart, setTrimStart] = useState(clip.trimStart || 0);
    const [trimEnd, setTrimEnd] = useState(clip.trimEnd || 0);
    const [introMarker, setIntroMarker] = useState(clip.introMarker || 0);
    const [outroMarker, setOutroMarker] = useState(clip.outroMarker || 0);

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
            setKeybind(clip.keybind || '');
            setTrimStart(clip.trimStart || 0);
            setTrimEnd(clip.trimEnd || 0);
            setIntroMarker(clip.introMarker || 0);
            setOutroMarker(clip.outroMarker || 0);
            setActiveTab('general'); // Reset tab
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
            behavior,
            keybind,
            trimStart: Number(trimStart),
            trimEnd: Number(trimEnd),
            introMarker: Number(introMarker),
            outroMarker: Number(outroMarker),
        };
        debugLog(`Saving Clip: ${clip.name} Intro=${updatedClip.introMarker} Outro=${updatedClip.outroMarker}`, 'info');
        onSave(clip.id, updatedClip);
        onClose();
    };

    const handleDelete = () => {
        if (confirm('Sei sicuro di voler eliminare questa clip?')) {
            onDelete(clip.id);
            onClose();
        }
    };

    const detectSilence = async () => {
        try {
            debugLog('Smart Trim: decoding...', 'info');
            let fetchPath = clip.path;
            if (!fetchPath.startsWith('http') && !fetchPath.startsWith('file:')) {
                fetchPath = `media://${fetchPath}`; // Use our custom protocol
            }

            const response = await fetch(fetchPath);
            const arrayBuffer = await response.arrayBuffer();
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            const rawData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;
            const threshold = 0.01; // -40dB roughly

            let startFrame = 0;
            let endFrame = rawData.length - 1;

            // Find Start
            for (let i = 0; i < rawData.length; i++) {
                if (Math.abs(rawData[i]) > threshold) {
                    startFrame = i;
                    break;
                }
            }

            // Find End
            for (let i = rawData.length - 1; i >= 0; i--) {
                if (Math.abs(rawData[i]) > threshold) {
                    endFrame = i;
                    break;
                }
            }

            const margin = 0.1;
            const suggestedStart = Math.max(0, (startFrame / sampleRate) - margin);
            const suggestedEndCut = Math.max(0, audioBuffer.duration - (endFrame / sampleRate) - margin);

            // Degenerate case protection
            if (audioBuffer.duration - suggestedEndCut <= suggestedStart + 0.1) {
                alert('Silence detection failed: The entire file appears to be silence or volume is too low.');
                return;
            }

            setTrimStart(parseFloat(suggestedStart.toFixed(3)));
            setTrimEnd(parseFloat(suggestedEndCut.toFixed(3)));

            debugLog(`Smart Trim: Start=${suggestedStart.toFixed(3)}, EndCut=${suggestedEndCut.toFixed(3)}`, 'info');
            alert(`Silence Detected!\nTrim Start: ${suggestedStart.toFixed(3)}s\nTrim End: ${suggestedEndCut.toFixed(3)}s`);

        } catch (e) {
            console.error(e);
            alert('Error analyzing audio for silence.');
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 rounded-lg border border-zinc-700 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER & TABS */}
                <div className="border-b border-zinc-800 bg-zinc-950/50 rounded-t-lg">
                    <div className="p-4 flex justify-between items-center border-b border-zinc-800">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: customColor }}></span>
                            {clip.name}
                        </h2>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                    </div>
                    <div className="flex px-4 gap-4">
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Settings2 size={16} /> General Settings
                        </button>
                        <button 
                            onClick={() => setActiveTab('markers')}
                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'markers' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Scissors size={16} /> Trim & Markers
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* LEFT COLUMN: Visual & Basic */}
                            <div className="space-y-6">
                                {/* NAME */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Clip Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>

                                {/* COLORS */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Color Label</label>
                                    <div className="flex flex-wrap gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setCustomColor(c)}
                                                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${customColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* VOLUME */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Volume Gain</label>
                                        <span className="text-xs font-mono text-emerald-400">{(volume * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.05"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>

                                {/* KEYBIND */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Global Keybind</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={keybind}
                                            readOnly
                                            placeholder="Click to Record..."
                                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-yellow-400 font-mono text-center cursor-pointer hover:border-yellow-500/50 focus:border-yellow-500 outline-none"
                                            onKeyDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (e.key === 'Escape' || e.key === 'Backspace') {
                                                    setKeybind('');
                                                } else {
                                                    setKeybind(e.code);
                                                }
                                            }}
                                            onClick={(e) => (e.currentTarget as HTMLInputElement).focus()}
                                        />
                                        {keybind && (
                                            <button
                                                onClick={() => setKeybind('')}
                                                className="px-3 bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-700"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Behavior & Mixing */}
                            <div className="space-y-6">
                                {/* BEHAVIOR */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Playback Behavior</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setBehavior('normal')}
                                            className={`p-2 rounded border text-sm transition-all ${behavior === 'normal' ? 'bg-zinc-800 border-emerald-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            Normal
                                        </button>
                                        <button
                                            onClick={() => setBehavior('stacco')}
                                            className={`p-2 rounded border text-sm transition-all ${behavior === 'stacco' ? 'bg-purple-900/20 border-purple-500 text-purple-200' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            Stacco (Jingle)
                                        </button>
                                    </div>
                                </div>

                                {/* TOGGLES */}
                                <div className="space-y-3 bg-zinc-950 p-3 rounded border border-zinc-800">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">Loop Playback</span>
                                        <input
                                            type="checkbox"
                                            checked={isLooping}
                                            onChange={(e) => setIsLooping(e.target.checked)}
                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-emerald-500"
                                        />
                                    </label>

                                    <div className="h-px bg-zinc-900 my-1" />

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">Autoplay Next</span>
                                        <select
                                            value={nextAction}
                                            onChange={(e) => setNextAction(e.target.value as AudioClip['nextAction'])}
                                            className="bg-zinc-900 border border-zinc-800 rounded text-xs p-1 text-white outline-none focus:border-emerald-500"
                                        >
                                            <option value="stop">Stop</option>
                                            <option value="play_next">Play Next</option>
                                        </select>
                                    </label>

                                    {isLooping && nextAction === 'play_next' && (
                                        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-start gap-2">
                                            <span className="text-yellow-500 text-xs">⚠️</span>
                                            <p className="text-[10px] text-yellow-200/80 leading-tight">
                                                <strong>Conflict:</strong> Looping has priority. "Autoplay Next" will be ignored.
                                            </p>
                                        </div>
                                    )}

                                    <div className="h-px bg-zinc-900 my-1" />

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">Ducking Role</span>
                                        <select
                                            value={duckingRole}
                                            onChange={(e) => setDuckingRole(e.target.value as any)}
                                            className="bg-zinc-900 border border-zinc-800 rounded text-xs p-1 text-white outline-none focus:border-emerald-500"
                                        >
                                            <option value="none">None</option>
                                            <option value="source">Source (Speaker)</option>
                                            <option value="target">Target (Music)</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'markers' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                            {/* Waveform Visual Editor */}
                            <WaveformEditor 
                                path={clip.path}
                                trimStart={trimStart}
                                trimEnd={trimEnd}
                                introMarker={introMarker}
                                outroMarker={outroMarker}
                                onChange={(updates) => {
                                    if (updates.trimStart !== undefined) setTrimStart(updates.trimStart);
                                    if (updates.trimEnd !== undefined) setTrimEnd(updates.trimEnd);
                                    if (updates.introMarker !== undefined) setIntroMarker(updates.introMarker);
                                    if (updates.outroMarker !== undefined) setOutroMarker(updates.outroMarker);
                                }}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* FADES */}
                                <div className="space-y-4 bg-zinc-950 p-4 rounded border border-zinc-800">
                                    <h3 className="text-xs uppercase text-zinc-500 font-bold border-b border-zinc-800 pb-2">Smooth Fades</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Fade In (ms)</label>
                                            <input
                                                type="number"
                                                value={fadeIn}
                                                onChange={(e) => setFadeIn(parseInt(e.target.value) || 0)}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Fade Out (ms)</label>
                                            <input
                                                type="number"
                                                value={fadeOut}
                                                onChange={(e) => setFadeOut(parseInt(e.target.value) || 0)}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* MANUAL MARKERS INPUTS */}
                                <div className="space-y-4 bg-zinc-950 p-4 rounded border border-zinc-800">
                                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                        <h3 className="text-xs uppercase text-zinc-500 font-bold">Manual Inputs</h3>
                                        <button
                                            onClick={detectSilence}
                                            className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors border border-purple-500/30 rounded px-2 py-0.5 bg-purple-500/10"
                                        >
                                            <Wand2 size={10} /> Auto-Trim
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Trim Start (s)</label>
                                            <input type="number" step="0.1" value={trimStart} onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Trim End (s)</label>
                                            <input type="number" step="0.1" value={trimEnd} onChange={(e) => setTrimEnd(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Intro End (s)</label>
                                            <input type="number" step="0.1" value={introMarker} onChange={(e) => setIntroMarker(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center text-emerald-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Outro Start (s)</label>
                                            <input type="number" step="0.1" value={outroMarker} onChange={(e) => setOutroMarker(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center text-orange-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="bg-zinc-800 p-4 border-t border-zinc-700 flex justify-between shrink-0 rounded-b-lg">
                    <button
                        onClick={handleDelete}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded text-sm font-bold transition-all border border-transparent hover:border-red-500/50"
                    >
                        DELETE CLIP
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white px-4 py-2 rounded text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                        >
                            SAVE CHANGES
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
