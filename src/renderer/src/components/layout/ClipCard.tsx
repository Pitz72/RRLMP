import React from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import { AudioClip } from '../../types';
import { Repeat } from 'lucide-react';

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

    const isPlaying = !!activeState;
    const progress = activeState?.progress || 0;

    const handleClick = () => {
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
            className={`p-3 rounded border cursor-pointer transition-all group relative overflow-hidden select-none
                ${isPlaying
                    ? 'bg-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                }
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

            <div className="relative z-10 flex justify-between items-center">
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
                    {clip.isLooping && <Repeat size={12} className="text-zinc-500" />}
                    {clip.duckingRole === 'source' && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded">PRIORITY</span>
                    )}
                </div>
            </div>

            {/* Debug/Info Info (Optional, visible on hover) */}
            <div className="relative z-10 text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between mt-1">
                <span>{clip.type} {clip.volume !== 1 ? `(${(clip.volume * 100).toFixed(0)}%)` : ''}</span>
                <span>{(activeState?.player.getCurrentTime() || 0).toFixed(1)}s</span>
            </div>
        </div>
    );
};
