import React, { useEffect, useRef, useState } from 'react';
import { Column } from '../../types';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ColumnHeaderProps {
    column: Column;
}

const COLUMN_COLORS = [
    '#10B981', '#22C55E', '#EF4444', '#F97316', '#F59E0B',
    '#8B5CF6', '#3B82F6', '#06B6D4', '#EC4899', '#64748B',
    '#A78BFA', '#FB923C',
];

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column }) => {
    const { t } = useTranslation();
    const activeClips = useAudioStore((state) => state.activeClips);
    const setColumnColor = useProjectStore((s) => s.setColumnColor);
    const [isDeadAirWarning, setIsDeadAirWarning] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const effectiveColor = column.customColor || column.color;

    // Chiudi il picker cliccando fuori
    useEffect(() => {
        if (!showPicker) return;
        const handleOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [showPicker]);

    useEffect(() => {
        const activeInColumn = Object.values(activeClips).find(ac =>
            column.clips.some(c => c.id === ac.clip.id)
        );

        if (!activeInColumn) { setIsDeadAirWarning(false); return; }

        const { clip, player, isPlaying } = activeInColumn;
        if (!isPlaying) { setIsDeadAirWarning(false); return; }

        const clipIndex = column.clips.findIndex(c => c.id === clip.id);
        const isLastClip = clipIndex === column.clips.length - 1;
        if (clip.isLooping) { setIsDeadAirWarning(false); return; }

        const duration = player.getDuration();
        const currentTime = player.getCurrentTime();
        const remaining = duration - currentTime;

        if (isLastClip && remaining < 20 && remaining > 0) {
            setIsDeadAirWarning(true);
        } else {
            setIsDeadAirWarning(false);
        }
    }, [activeClips, column.clips, column.type]);

    return (
        <div
            className={`p-3 font-bold text-sm tracking-widest border-b border-zinc-800 flex justify-between items-center transition-all duration-500
                ${isDeadAirWarning ? 'bg-amber-900/50 animate-pulse border-amber-500' : ''}
            `}
            style={{
                backgroundColor: isDeadAirWarning ? undefined : `${effectiveColor}20`,
                color: isDeadAirWarning ? '#f59e0b' : effectiveColor,
                borderColor: isDeadAirWarning ? '#f59e0b' : undefined
            }}
        >
            <div className="flex items-center gap-2">
                {isDeadAirWarning && <AlertTriangle size={16} className="animate-bounce" />}
                <span>{t(`columns.${column.id}`, column.title)}</span>
            </div>

            <div className="flex items-center gap-2 relative" ref={pickerRef}>
                {isDeadAirWarning && (
                    <span className="text-[10px] bg-amber-500 text-black px-1 rounded font-bold">END</span>
                )}
                <div className={`text-xs opacity-50 ${isDeadAirWarning ? 'text-amber-200 opacity-100' : ''}`}>
                    {column.type.toUpperCase()}
                </div>

                {/* Color Picker Trigger */}
                {!isDeadAirWarning && (
                    <button
                        onClick={() => setShowPicker(v => !v)}
                        className="w-3.5 h-3.5 rounded-full border border-white/20 hover:border-white/60 transition-all shrink-0 shadow-sm"
                        style={{ backgroundColor: effectiveColor }}
                        title="Cambia colore colonna"
                    />
                )}

                {/* Color Picker Popover */}
                {showPicker && (
                    <div className="absolute top-6 right-0 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
                        <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Colore Colonna</p>
                        <div className="grid grid-cols-4 gap-1.5">
                            {COLUMN_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => { setColumnColor(column.id, c); setShowPicker(false); }}
                                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                                    style={{
                                        backgroundColor: c,
                                        borderColor: effectiveColor === c ? 'white' : 'transparent'
                                    }}
                                />
                            ))}
                        </div>
                        {/* Reset al colore di default */}
                        {column.customColor && (
                            <button
                                onClick={() => { setColumnColor(column.id, column.color); setShowPicker(false); }}
                                className="mt-2 w-full text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                ↺ Ripristina default
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
