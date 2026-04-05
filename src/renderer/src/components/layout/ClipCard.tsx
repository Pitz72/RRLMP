import React from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import { AudioClip } from '../../types';

import { useProjectStore } from '../../store/useProjectStore';

interface ClipCardProps {
    clip: AudioClip;
    onEdit: (clip: AudioClip) => void;
}

export const ClipCard: React.FC<ClipCardProps> = ({ clip, onEdit }) => {
    // Correct usage: Hooks are called at the top level of this component
    // independent of the list length in parent
    const activeState = useAudioStore((state) => state.activeClips[clip.id]);
    const playClip = useAudioStore((state) => state.playClip);
    const stopClip = useAudioStore((state) => state.stopClip);
    const { selectClip, selectedClipIds, clearSelection, isMidiLearnMode } = useProjectStore(); // Selection & MIDI


    const isPlaying = !!activeState;
    const isSelected = selectedClipIds.includes(clip.id); // Selection State
    const progress = activeState?.progress || 0;

    const [currentTime, setCurrentTime] = React.useState(0);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && activeState?.player) {
            setCurrentTime(activeState.player.getCurrentTime());
            interval = setInterval(() => {
                setCurrentTime(activeState.player.getCurrentTime());
            }, 200);
        } else {
            setCurrentTime(0);
        }
        return () => clearInterval(interval);
    }, [isPlaying, activeState]);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const duration = clip.duration || 0;
    const remaining = Math.max(0, duration - currentTime);
    const isNearEnd = isPlaying && remaining < 15;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Selection Logic
        if (e.ctrlKey || e.metaKey) {
            selectClip(clip.id, 'toggle');
            return;
        }

        // Standard Click: Clear Selection AND Play
        clearSelection();

        if (isPlaying) {
            stopClip(clip.id);
        } else {
            playClip(clip);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        onEdit(clip);
    };

    return (
        <div
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            className={`p-2 rounded border cursor-pointer transition-all group relative overflow-hidden select-none
                ${isPlaying
                    ? 'bg-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                }
                ${isSelected ? 'ring-2 ring-blue-500 z-10' : ''}
                ${isMidiLearnMode && isSelected ? 'ring-2 ring-cyan-400 ring-dashed' : ''} 
                ${isMidiLearnMode && !isSelected ? 'border-dashed border-cyan-800 opacity-80' : ''}
            `}
            style={{
                borderColor: isPlaying ? (clip.customColor || '#22c55e') : undefined
            }}
        >
            {/* Progress Bar Background */}
            <div
                className="absolute left-0 top-0 bottom-0 transition-all duration-100 ease-linear pointer-events-none opacity-20"
                style={{
                    width: `${progress * 100}%`,
                    backgroundColor: clip.customColor || '#ffffff'
                }}
            />

            {/* Visual Tags Overlay (Top Left) */}
            <div className="relative z-10 flex gap-1 mb-1 flex-wrap">
                {clip.behavior === 'stacco' && <span className="text-[9px] bg-purple-600/90 text-white px-1 rounded font-bold tracking-wider">STACCO</span>}
                {clip.isLooping && <span className="text-[9px] bg-blue-600/90 text-white px-1 rounded font-bold tracking-wider">LOOP</span>}
                {clip.nextAction === 'play_next' && <span className="text-[9px] bg-emerald-600/90 text-white px-1 rounded font-bold tracking-wider">NEXT</span>}
            </div>

            <div className="relative z-10 flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 overflow-hidden">
                    {isPlaying && (
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: clip.customColor || '#22c55e' }}
                        />
                    )}
                    <span
                        className={`font-medium truncate text-sm`}
                        style={{ color: isPlaying ? (clip.customColor || '#4ade80') : '#e4e4e7' }}
                    >
                        {clip.name}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {clip.midiBind && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded font-bold shadow-sm border border-cyan-900/50">
                            {clip.midiBind.replace('NOTE:', 'M')}
                        </span>
                    )}
                    {clip.keybind && (
                        <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-bold shadow-sm" title={`Keybind: ${clip.keybind}`}>
                            {clip.keybind.replace('Key', '').replace('Digit', '')}
                        </span>
                    )}
                    {clip.duckingRole === 'source' && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded">PRIORITY</span>
                    )}
                </div>
            </div>


            {/* TIMER ROW */}
            <div className="relative z-10 flex justify-between items-baseline text-[10px] font-mono mt-1">
                <span className="text-zinc-500">
                    {clip.type.toUpperCase()}
                </span>
                <span className={`font-bold transition-colors ${isNearEnd ? 'text-red-500 animate-pulse' : (isPlaying ? 'text-white' : 'text-zinc-500')}`}>
                    {isPlaying ? `-${formatTime(remaining)}` : formatTime(duration)}
                </span>
            </div>
        </div>
    );
};
