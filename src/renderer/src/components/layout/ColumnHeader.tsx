import React, { useEffect, useState } from 'react';
import { Column } from '../../types';
import { useAudioStore } from '../../store/useAudioStore';

import { AlertTriangle } from 'lucide-react';

interface ColumnHeaderProps {
    column: Column;
}

import { useTranslation } from 'react-i18next';

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column }) => {
    const { t } = useTranslation();
    const activeClips = useAudioStore((state) => state.activeClips);
    const [isDeadAirWarning, setIsDeadAirWarning] = useState(false);


    useEffect(() => {
        // Refined search: Find an active clip that belongs to this column
        const activeInColumn = Object.values(activeClips).find(ac =>
            column.clips.some(c => c.id === ac.clip.id)
        );

        if (!activeInColumn) {
            setIsDeadAirWarning(false);
            return;
        }

        const { clip, player, isPlaying } = activeInColumn;

        if (!isPlaying) {
            setIsDeadAirWarning(false);
            return;
        }

        // 2. Check if it's the LAST clip
        const clipIndex = column.clips.findIndex(c => c.id === clip.id);
        const isLastClip = clipIndex === column.clips.length - 1;

        // 3. Check Loop status
        // Warining only if NOT looping
        if (clip.isLooping) {
            setIsDeadAirWarning(false);
            return;
        }

        // 4. Check Time Remaining < 20s
        const duration = player.getDuration();
        const currentTime = player.getCurrentTime();
        const remaining = duration - currentTime;

        // TRIGGER CONDITION: Last Clip + Not Looping + Near End
        if (isLastClip && remaining < 20 && remaining > 0) {
            setIsDeadAirWarning(true);
        } else {
            setIsDeadAirWarning(false);
        }

    }, [activeClips, column.clips, column.type]); // updates on 100ms sync from store usually triggers re-render of useAudioStore hook

    return (
        <div
            className={`p-3 font-bold text-sm tracking-widest border-b border-zinc-800 flex justify-between items-center transition-all duration-500
                ${isDeadAirWarning ? 'bg-amber-900/50 animate-pulse border-amber-500' : ''}
            `}
            style={{
                backgroundColor: isDeadAirWarning ? undefined : `${column.color}20`,
                color: isDeadAirWarning ? '#f59e0b' : column.color,
                borderColor: isDeadAirWarning ? '#f59e0b' : undefined
            }}
        >
            <div className="flex items-center gap-2">
                {isDeadAirWarning && <AlertTriangle size={16} className="animate-bounce" />}
                <span>{t(`columns.${column.id}`, column.title)}</span>

            </div>

            <div className="flex items-center gap-2">
                {isDeadAirWarning && (
                    <span className="text-[10px] bg-amber-500 text-black px-1 rounded font-bold">END</span>
                )}
                <div className={`text-xs opacity-50 ${isDeadAirWarning ? 'text-amber-200 opacity-100' : ''}`}>
                    {column.type.toUpperCase()}
                </div>
            </div>
        </div>
    );
};
