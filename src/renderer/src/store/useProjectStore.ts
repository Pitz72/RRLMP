import { create } from 'zustand';
import { Column, AudioClip } from '../types';

interface ProjectState {
    columns: Column[];
    addClip: (columnId: string, file: File) => AudioClip | undefined;
    removeClip: (columnId: string, clipId: string) => void;
    updateClip: (columnId: string, clipId: string, updates: Partial<AudioClip>) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    columns: [
        {
            id: 'col-assets',
            title: 'SHOW ASSETS',
            type: 'asset',
            color: '#10B981', // Emerald-500 (Green)
            isLocked: true,
            clips: []
        },
        {
            id: 'col-music',
            title: 'MUSIC PLAYLIST',
            type: 'music',
            color: '#EF4444', // Red-500
            isLocked: false,
            clips: []
        },
        {
            id: 'col-voice',
            title: 'VOICE / GUESTS',
            type: 'voice',
            color: '#F97316', // Orange-500
            isLocked: false,
            clips: []
        },
        {
            id: 'col-sfx',
            title: 'SFX / CARTWALL',
            type: 'sfx',
            color: '#64748B', // Slate-500 (Grey)
            isLocked: false,
            clips: []
        },
        {
            id: 'col-preshow',
            title: 'PRE-SHOW',
            type: 'preshow',
            color: '#8B5CF6', // Violet-500
            isLocked: false,
            clips: []
        }
    ],

    addClip: (columnId, file) => {
        let createdClip: AudioClip | undefined;

        set((state) => ({
            columns: state.columns.map((col) => {
                if (col.id !== columnId) return col;

                const newClip: AudioClip = {
                    id: crypto.randomUUID(),
                    name: file.name.replace(/\.[^/.]+$/, ""), // Rimuove estensione
                    path: window.electron ? window.electron.getFilePath(file) : '', // Secure Path Retrieval
                    type: col.type,
                    color: col.color,
                    volume: 1.0,
                    pan: 0,
                    isPlaying: false,
                    duration: 0, // Da calcolare dopo
                    currentTime: 0,
                    // Default Logic basata sul tipo di colonna
                    duckingSource: col.type === 'voice' || col.type === 'asset',
                    duckingTarget: col.type === 'music' || col.type === 'preshow',
                };
                createdClip = newClip;

                return { ...col, clips: [...col.clips, newClip] };
            })
        }));

        return createdClip;
    },

    removeClip: (columnId, clipId) => set((state) => ({
        columns: state.columns.map((col) =>
            col.id === columnId
                ? { ...col, clips: col.clips.filter((c) => c.id !== clipId) }
                : col
        )
    })),

    updateClip: (columnId, clipId, updates) => set((state) => ({
        columns: state.columns.map((col) =>
            col.id === columnId
                ? {
                    ...col,
                    clips: col.clips.map((c) => c.id === clipId ? { ...c, ...updates } : c)
                }
                : col
        )
    })),
}));
