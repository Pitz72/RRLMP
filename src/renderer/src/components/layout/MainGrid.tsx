import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAudioStore } from '../../store/useAudioStore';
import { ClipCard } from './ClipCard';
import { Upload } from 'lucide-react';

export const MainGrid: React.FC = () => {
    const { columns, addClip } = useProjectStore();
    // playClip moved to ClipCard
    const loadClip = useAudioStore((state) => state.loadClip);

    const handleDrop = async (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);

        for (const file of files) {
            const newClip = addClip(colId, file);
            if (newClip) {
                await loadClip(newClip);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessario per permettere il drop
    };

    return (
        <div className="flex h-full w-full bg-zinc-950 text-white overflow-hidden">
            {columns.map((col) => (
                <div
                    key={col.id}
                    className="flex-1 flex flex-col border-r border-zinc-800 min-w-[200px]"
                    onDrop={(e) => handleDrop(e, col.id)}
                    onDragOver={handleDragOver}
                >
                    {/* HEADER COLONNA */}
                    <div
                        className="p-3 font-bold text-sm tracking-widest border-b border-zinc-800 flex justify-between items-center"
                        style={{ backgroundColor: `${col.color}20`, color: col.color }} // 20 = 12% opacity
                    >
                        <span>{col.title}</span>
                        <div className="text-xs opacity-50">{col.type.toUpperCase()}</div>
                    </div>

                    {/* AREA CLIP (SCROLLABLE) */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">

                        {/* Lista delle Clip */}
                        {/* Lista delle Clip */}
                        {col.clips.map((clip) => (
                            <ClipCard key={clip.id} clip={clip} />
                        ))}

                        {/* Empty State / Drop Zone Hint */}
                        {col.clips.length === 0 && (
                            <div className="h-32 border-2 border-dashed border-zinc-800 rounded flex flex-col items-center justify-center text-zinc-600 m-2">
                                <Upload size={24} className="mb-2 opacity-50" />
                                <span className="text-xs">Drop Audio Here</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
