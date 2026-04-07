import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useProjectStore } from '../../store/useProjectStore';
import { useAudioStore } from '../../store/useAudioStore';
import { debugLog } from '../../store/useDebugStore';
import { ClipCard } from './ClipCard';
import { SortableClip } from './SortableClip'; // New component
import { Upload } from 'lucide-react';
import { ClipSettingsModal } from '../modals/ClipSettingsModal';
import { AudioClip, Column } from '../../types';

// Helper component for Drop Area (Column)
interface SortableColumnProps {
    column: Column;
    children: React.ReactNode;
    onNativeDrop: (e: React.DragEvent, colId: string) => void;
    onNativeDragOver: (e: React.DragEvent) => void;
}

import { ColumnHeader } from './ColumnHeader';

const SortableColumn: React.FC<SortableColumnProps> = ({ column, children, onNativeDrop, onNativeDragOver }) => {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    return (
        <div
            ref={setNodeRef}
            className="flex-1 flex flex-col border-r border-zinc-800 min-w-[200px]"
            onDrop={(e) => onNativeDrop(e, column.id)}
            onDragOver={onNativeDragOver}
        >
            <ColumnHeader column={column} />
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">
                {children}
            </div>
        </div>
    );
};


export const MainGrid: React.FC = () => {
    const { columns, addClip, updateClip, removeClip, moveClip } = useProjectStore();
    const { loadClip, playColumn, stopAll } = useAudioStore((state) => ({
        loadClip: state.loadClip,
        playColumn: state.playColumn,
        stopAll: state.stopAll
    }));

    const [editingClip, setEditingClip] = useState<AudioClip | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    // GLOBAL HOTKEYS
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 1. Modal Guard
            if (editingClip) return;

            // 2. Input Guard
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            // 3. Command Mapping
            if (e.key === 'Escape') {
                e.preventDefault();
                stopAll();
                return;
            }

            // 3.1 Custom Keybinds (Priority)
            const allClips = columns.flatMap(col => col.clips);
            const bindMatch = allClips.find(c => c.keybind === e.code);

            if (bindMatch) {
                e.preventDefault();
                // Toggle Logic matching ClipCard click
                const isActive = useAudioStore.getState().activeClips[bindMatch.id];
                if (isActive) {
                    useAudioStore.getState().stopClip(bindMatch.id);
                } else {
                    useAudioStore.getState().playClip(bindMatch);
                }
                return;
            }

            if (e.key.startsWith('F')) {
                const fKey = parseInt(e.key.substring(1));
                if (!isNaN(fKey) && fKey >= 1 && fKey <= 5) {
                    e.preventDefault();
                    playColumn(fKey - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingClip, playColumn, stopAll, columns]); // Added columns to dependency

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start drag, allowing clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // NATIVE FILE DROP HANDLER
    const handleNativeDrop = async (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        // Allow only files
        if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

        // GR12 Fix: filtra solo file audio supportati.
        // File non audio (immagini, PDF, exe...) vengono ignorati silenziosamente
        // invece di essere aggiunti e fallire al momento del caricamento.
        const SUPPORTED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'wma'];
        const files = Array.from(e.dataTransfer.files).filter(file => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            return ext && SUPPORTED_AUDIO_EXTENSIONS.includes(ext);
        });

        for (const file of files) {
            const newClip = addClip(colId, file);
            if (newClip) {
                await loadClip(newClip);

                // Auto-Silence Detection per la colonna Pre-Show (v0.13.2)
                // v0.14.6: feedback visivo isAnalyzing durante la detection
                const col = columns.find(c => c.id === colId);
                if (col?.type === 'preshow' && window.electron?.detectSilence) {
                    updateClip(colId, newClip.id, { isAnalyzing: true });
                    window.electron.detectSilence(newClip.path).then(result => {
                        if (result.success && result.data && !result.data.noSilence) {
                            updateClip(colId, newClip.id, {
                                trimStart: result.data.trimStart,
                                trimEnd: result.data.trimEnd,
                                isAnalyzing: false
                            });
                            debugLog(`AutoSilence [${newClip.name}]: trimStart=${result.data.trimStart}s, trimEnd=${result.data.trimEnd}s`, 'info');
                        } else {
                            updateClip(colId, newClip.id, { isAnalyzing: false });
                        }
                    }).catch(() => {
                        updateClip(colId, newClip.id, { isAnalyzing: false });
                    });
                }
            }
        }
    };

    const handleNativeDragOver = (e: React.DragEvent) => {
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

    // DND-KIT HANDLERS
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find source column and index
        const sourceCol = columns.find(col => col.clips.some(c => c.id === activeId));
        if (!sourceCol) return;
        const oldIndex = sourceCol.clips.findIndex(c => c.id === activeId);

        // Find dest column (could be a Column ID or a Clip ID)
        let destCol = columns.find(col => col.id === overId);
        let newIndex = 0;

        if (destCol) {
            // Dropped on a column container (likely empty or at end)
            newIndex = destCol.clips.length;
        } else {
            // Dropped on another clip
            destCol = columns.find(col => col.clips.some(c => c.id === overId));
            if (!destCol) return;
            const overIndex = destCol.clips.findIndex(c => c.id === overId);
            // If dropping below the halfway point of the target, insert after
            // But dnd-kit sortable usually handles index calculation via closestCenter/Corners
            // Simple approach: Use array index
            newIndex = overIndex;
            // Check if we are moving down in same column to adjust index?
            // moveClip logic handles splice, so we just need target index as intended position.
            // If source same as dest and oldIndex < newIndex, typical array move logic applies.
            // But let's trust dnd-kit visual feedback to guide user.
            // Usually for Sortable, if active.id !== over.id, we allow move.
        }

        if (activeId !== overId || sourceCol.id !== destCol.id) {
            moveClip(sourceCol.id, destCol.id, oldIndex, newIndex);
        }
    };

    // Find the clip object for the DragOverlay
    const activeClip = activeId ? columns.flatMap(c => c.clips).find(c => c.id === activeId) : null;

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.4',
                },
            },
        }),
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full w-full bg-zinc-950 text-white overflow-hidden relative">
                {columns.map((col) => (
                    <SortableColumn
                        key={col.id}
                        column={col}
                        onNativeDrop={handleNativeDrop}
                        onNativeDragOver={handleNativeDragOver}
                    >
                        <SortableContext
                            items={col.clips.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {col.clips.map((clip) => (
                                <SortableClip
                                    key={clip.id}
                                    clip={clip}
                                    onEdit={(clip) => setEditingClip(clip)}
                                />
                            ))}
                        </SortableContext>

                        {col.clips.length === 0 && (
                            <div className="h-32 border-2 border-dashed border-zinc-800 rounded flex flex-col items-center justify-center text-zinc-600 m-2 pointer-events-none">
                                <Upload size={24} className="mb-2 opacity-50" />
                                <span className="text-xs">Drop Audio Here</span>

                            </div>
                        )}
                    </SortableColumn>
                ))}

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeClip ? (
                        <ClipCard clip={activeClip} onEdit={() => { }} />
                    ) : null}
                </DragOverlay>

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
        </DndContext>
    );
};
