import React from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';

export const NoteBoard: React.FC = () => {
    const activeClips = useAudioStore((state) => state.activeClips);
    const columns = useProjectStore((state) => state.columns);

    // Trova la prima clip in play che ha note
    const activeNote = React.useMemo(() => {
        for (const col of columns) {
            for (const clip of col.clips) {
                if (activeClips[clip.id] && clip.notes?.trim()) {
                    return { clip, col };
                }
            }
        }
        return null;
    }, [activeClips, columns]);

    if (!activeNote) return null;

    const { clip, col } = activeNote;
    const color = clip.customColor || col.color;

    return (
        <div
            className="shrink-0 border-t overflow-y-auto custom-scrollbar"
            style={{
                borderColor: color,
                backgroundColor: 'rgba(0,0,0,0.85)',
                maxHeight: '160px',
            }}
        >
            {/* Header strip */}
            <div
                className="px-4 py-1.5 flex items-center gap-2 sticky top-0"
                style={{ backgroundColor: `${color}18`, borderBottom: `1px solid ${color}30` }}
            >
                <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                    NOTE REGIA
                </span>
                <span className="text-[10px] text-zinc-400 truncate">— {clip.name}</span>
            </div>

            {/* Testo note */}
            <pre
                className="px-4 py-3 text-sm text-white/90 font-mono leading-relaxed whitespace-pre-wrap break-words"
            >
                {clip.notes}
            </pre>
        </div>
    );
};
