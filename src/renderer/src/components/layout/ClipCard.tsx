import React from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import { AudioClip } from '../../types';

interface ClipCardProps {
    clip: AudioClip;
}

export const ClipCard: React.FC<ClipCardProps> = ({ clip }) => {
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

    return (
        <div
            onClick={handleClick}
            className={`p-3 rounded border cursor-pointer transition-all group relative overflow-hidden select-none
                ${isPlaying
                    ? 'bg-zinc-800 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                }
            `}
        >
            {/* Progress Bar Background */}
            <div
                className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all duration-100 ease-linear pointer-events-none"
                style={{ width: `${progress * 100}%` }}
            />

            <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-2 overflow-hidden">
                    {isPlaying && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                    <span className={`font-medium truncate text-sm ${isPlaying ? 'text-green-400' : 'text-zinc-200'}`}>
                        {clip.name}
                    </span>
                </div>
                {clip.duckingSource && <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded">PRIORITY</span>}
            </div>

            {/* Debug/Info Info (Optional, visible on hover) */}
            <div className="relative z-10 text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between mt-1">
                <span>{clip.type}</span>
                <span>{(activeState?.player.getCurrentTime() || 0).toFixed(1)}s</span>
            </div>
        </div>
    );
};
