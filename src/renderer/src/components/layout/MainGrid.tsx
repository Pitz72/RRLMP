import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAudioStore } from '../../store/useAudioStore';
import { ClipCard } from './ClipCard';
import { Upload } from 'lucide-react';
import { ClipSettingsModal } from '../modals/ClipSettingsModal';
import { AudioClip } from '../../types';

export const MainGrid: React.FC = () => {
    const { columns, addClip, updateClip, removeClip } = useProjectStore();
    const loadClip = useAudioStore((state) => state.loadClip);

    const [editingClip, setEditingClip] = useState<AudioClip | null>(null);

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
        e.preventDefault();
    };

    const handleSaveClip = (clipId: string, updates: Partial<AudioClip>) => {
        if (!editingClip) return;
        const colId = columns.find(c => c.clips.some(clip => clip.id === clipId))?.id;
        if (colId) {
            updateClip(colId, clipId, updates);
        }
    };

    const handleDeleteClip = (clipId: string) => {
        if (!editingClip) return;
        const colId = columns.find(c => c.clips.some(clip => clip.id === clipId))?.id;
        if (colId) {
            removeClip(colId, clipId);
        }
    };

    return (
        <div className="flex h-full w-full bg-zinc-950 text-white overflow-hidden relative">
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
                        style={{ backgroundColor: `${col.color}20`, color: col.color }}
                    >
                        <span>{col.title}</span>
                        <div className="text-xs opacity-50">{col.type.toUpperCase()}</div>
                    </div>

                    {/* AREA CLIP (SCROLLABLE) */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">

                        {col.clips.map((clip) => (
                            <ClipCard
                                key={clip.id}
                                clip={clip}
                                onEdit={(clip) => setEditingClip(clip)}
                            />
                        ))}

                        {col.clips.length === 0 && (
                            <div className="h-32 border-2 border-dashed border-zinc-800 rounded flex flex-col items-center justify-center text-zinc-600 m-2">
                                <Upload size={24} className="mb-2 opacity-50" />
                                <span className="text-xs">Drop Audio Here</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* SETTINGS MODAL */}
            {editingClip && (
                <ClipSettingsModal
                    clip={editingClip}
                    isOpen={true}
                    onClose={() => setEditingClip(null)}
                    onSave={handleSaveClip}
                    onDelete={handleDeleteClip}
                />
            )}
        </div>
    );
};
