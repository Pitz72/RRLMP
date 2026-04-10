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
    onNativeDragOver: (e: React.DragEvent, colId: string) => void;
    onNativeDragLeave: (e: React.DragEvent) => void;
}

import { ColumnHeader } from './ColumnHeader';

const SortableColumn: React.FC<SortableColumnProps> = ({ column, children, onNativeDrop, onNativeDragOver, onNativeDragLeave }) => {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    return (
        <div
            ref={setNodeRef}
            className="flex-1 flex flex-col border-r border-zinc-800 min-w-[200px]"
            onDrop={(e) => onNativeDrop(e, column.id)}
            onDragOver={(e) => onNativeDragOver(e, column.id)}
            onDragLeave={onNativeDragLeave}
        >
            <ColumnHeader column={column} />
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">
                {children}
            </div>
        </div>
    );
};


export const MainGrid: React.FC = () => {
    const { columns, addClip, addClipAtIndex, updateClip, removeClip, moveClip } = useProjectStore();
    const { loadClip, playColumn, stopAll } = useAudioStore((state) => ({
        loadClip: state.loadClip,
        playColumn: state.playColumn,
        stopAll: state.stopAll
    }));

    const [editingClip, setEditingClip] = useState<AudioClip | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [preshowAnalyzingCount, setPreshowAnalyzingCount] = useState(0);
    // Drop indicator: colonna + indice di inserimento durante il drag da OS
    const [dropIndicator, setDropIndicator] = useState<{ colId: string; index: number } | null>(null);

    // GLOBAL HOTKEYS
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 1. Modal Guard
            if (editingClip) return;

            // 2. Input Guard
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            // 3. Custom Keybinds (Priority)
            // Nota: Escape è gestito dal globalShortcut Electron (main process) — non serve qui.
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

        // Calcola l'indice di inserimento dal punto di drop (Y) rispetto alle clip esistenti.
        // Ogni SortableClip ha data-clip-id, li interroghiamo per trovare il "slot" corretto.
        const clipEls = e.currentTarget.querySelectorAll('[data-clip-id]');
        let insertIndex = clipEls.length; // default: in fondo
        for (let i = 0; i < clipEls.length; i++) {
            const rect = clipEls[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                insertIndex = i;
                break;
            }
        }

        setDropIndicator(null);

        for (const file of files) {
            const newClip = addClipAtIndex(colId, file, insertIndex);
            insertIndex++; // ogni file inserito sposta l'array di 1
            if (newClip) {
                await loadClip(newClip);

                // Auto-Silence Detection per la colonna Pre-Show via IPC (v0.13.2, fix v0.14.10)
                const col = columns.find(c => c.id === colId);
                if (col?.type === 'preshow' && window.electron?.detectSilence) {
                    updateClip(colId, newClip.id, { isAnalyzing: true });
                    setPreshowAnalyzingCount(n => n + 1);
                    window.electron.detectSilence(newClip.path).then(result => {
                        if (result.success && result.data && !result.data.noSilence) {
                            updateClip(colId, newClip.id, {
                                trimStart: result.data.trimStart,
                                trimEnd: result.data.trimEnd,
                                isAnalyzing: false,
                                silenceChecked: true
                            });
                            debugLog(`AutoSilence [${newClip.name}]: trimStart=${result.data.trimStart}s, trimEnd=${result.data.trimEnd}s`, 'info');
                        } else {
                            updateClip(colId, newClip.id, { isAnalyzing: false, silenceChecked: true });
                        }
                    }).catch(() => {
                        updateClip(colId, newClip.id, { isAnalyzing: false, silenceChecked: true });
                    }).finally(() => {
                        setPreshowAnalyzingCount(n => Math.max(0, n - 1));
                    });
                }
            }
        }
    };

    const handleNativeDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        // Calcola l'indice di inserimento in tempo reale per il drop indicator
        const clipEls = e.currentTarget.querySelectorAll('[data-clip-id]');
        let insertIndex = clipEls.length;
        for (let i = 0; i < clipEls.length; i++) {
            const rect = clipEls[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                insertIndex = i;
                break;
            }
        }
        setDropIndicator({ colId, index: insertIndex });
    };

    const handleNativeDragLeave = (e: React.DragEvent) => {
        // Cancella l'indicatore solo se il puntatore esce davvero dalla colonna
        // (non quando transita tra figli interni)
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDropIndicator(null);
        }
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
                        onNativeDragLeave={handleNativeDragLeave}
                    >
                        {col.type === 'preshow' && preshowAnalyzingCount > 0 && (
                            <div className="mx-2 mb-1 px-2 py-1.5 bg-amber-950/60 border border-amber-500/40 rounded text-amber-300 text-[10px] flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                <span>Rilevamento silenzio… {preshowAnalyzingCount} {preshowAnalyzingCount === 1 ? 'file' : 'file'} in analisi</span>
                            </div>
                        )}
                        <SortableContext
                            items={col.clips.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {col.clips.map((clip, idx) => (
                                <React.Fragment key={clip.id}>
                                    {dropIndicator?.colId === col.id && dropIndicator.index === idx && (
                                        <div className="h-0.5 rounded mx-0.5 shadow-[0_0_8px_rgba(96,165,250,0.9)] pointer-events-none" style={{ backgroundColor: '#60a5fa' }} />
                                    )}
                                    <SortableClip
                                        clip={clip}
                                        onEdit={(clip) => setEditingClip(clip)}
                                    />
                                </React.Fragment>
                            ))}
                            {dropIndicator?.colId === col.id && dropIndicator.index === col.clips.length && (
                                <div className="h-0.5 rounded mx-0.5 shadow-[0_0_8px_rgba(96,165,250,0.9)] pointer-events-none" style={{ backgroundColor: '#60a5fa' }} />
                            )}
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
