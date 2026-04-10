import { create } from 'zustand';
import { Column, AudioClip } from '../types';

const DEFAULT_COLUMNS: Column[] = [
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
        title: "CANZONI DELL'EPISODIO",
        type: 'music',
        color: '#EF4444', // Red-500
        isLocked: false,
        clips: []
    },
    {
        id: 'col-voice',
        title: 'VOCI / PREREGISTRAZIONI',
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
];

interface ProjectState {
    // Persistence Control
    isDirty: boolean;
    setDirty: (dirty: boolean) => void;

    // Actions
    columns: Column[];
    currentFilePath: string | null; // Track file path for auto-backup

    resetProject: () => void;
    addClip: (columnId: string, file: File) => AudioClip | undefined;
    addClipAtIndex: (columnId: string, file: File, insertIndex: number) => AudioClip | undefined;
    addClipFromPath: (columnId: string, filePath: string) => AudioClip | undefined;
    removeClip: (columnId: string, clipId: string) => void;
    updateClip: (columnId: string, clipId: string, updates: Partial<AudioClip>) => void;
    loadProject: (state: ProjectState, filePath?: string) => void; // Added filePath
    moveClip: (sourceColId: string, destColId: string, oldIndex: number, newIndex: number) => void;

    /** Verifica l'esistenza su disco di tutti i file delle clip. Imposta isMissing. Ritorna il numero di file mancanti. */
    runIntegrityCheck: () => Promise<number>;

    isMidiLearnMode: boolean;
    setIsMidiLearnMode: (active: boolean) => void;

    assignMidiToClip: (clipId: string, note: number) => void;

    // Selection
    selectedClipIds: string[];


    selectClip: (clipId: string, mode: 'single' | 'toggle' | 'add') => void;
    clearSelection: () => void;
    removeSelectedClips: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    isDirty: false,
    setDirty: (dirty) => set({ isDirty: dirty }),

    columns: JSON.parse(JSON.stringify(DEFAULT_COLUMNS)),
    currentFilePath: null,
    isMidiLearnMode: false,
    setIsMidiLearnMode: (active) => set({ isMidiLearnMode: active }),
    assignMidiToClip: (clipId, note) => set((state) => ({
        isDirty: true,
        isMidiLearnMode: false, // Exit learn mode after assignment? Prompt implied behavior "Click -> Assign". Maybe user stays in learn mode? User didn't specify. I'll stay, or toggle manually? Prompt: "Se l'utente ha selezionato... assegna". Usually learn mode stays on.
        // But prompt says "Mostra un feedback".
        // Let's Keep Learn Mode ON for mapping multiple.
        // Wait, "Se l'utente ha selezionato/cliccato una clip specifica... assegna la nota".
        // User workflow: Click MIDI button (ON). Click Clip (Select). Press MIDI key. Clip gets mapped. Status stays ON.
        columns: state.columns.map((col) => ({
            ...col,
            clips: col.clips.map((c) => c.id === clipId ? { ...c, midiBind: `NOTE:${note}` } : c)
        }))
    })),

    resetProject: () => set({ columns: JSON.parse(JSON.stringify(DEFAULT_COLUMNS)), isDirty: false, currentFilePath: null, isMidiLearnMode: false }),



    addClip: (columnId, file) => {
        let createdClip: AudioClip | undefined;

        set((state) => ({
            isDirty: true,
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
                    isLooping: false,
                    isPlaying: false,
                    duration: 0,
                    currentTime: 0,

                    // Default Logic basata sul tipo di colonna
                    nextAction: (col.type === 'preshow') ? 'play_next' : 'stop',
                    behavior: 'normal',
                    duckingRole: (col.type === 'voice') ? 'source' :
                        (col.type === 'music' || col.type === 'preshow') ? 'target' : 'none',

                    // Transizioni Defaults
                    fadeIn: 0,
                    fadeOut: (col.type === 'music') ? 2000 :
                        (col.type === 'preshow') ? 0 : // Gapless for preshow
                            (col.type === 'asset' ? 500 : 0)
                };
                createdClip = newClip;

                return { ...col, clips: [...col.clips, newClip] };
            })
        }));

        return createdClip;
    },

    addClipAtIndex: (columnId, file, insertIndex) => {
        let createdClip: AudioClip | undefined;

        set((state) => ({
            isDirty: true,
            columns: state.columns.map((col) => {
                if (col.id !== columnId) return col;

                const newClip: AudioClip = {
                    id: crypto.randomUUID(),
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    path: window.electron ? window.electron.getFilePath(file) : '',
                    type: col.type,
                    color: col.color,
                    volume: 1.0,
                    pan: 0,
                    isLooping: false,
                    isPlaying: false,
                    duration: 0,
                    currentTime: 0,
                    nextAction: (col.type === 'preshow') ? 'play_next' : 'stop',
                    behavior: 'normal',
                    duckingRole: (col.type === 'voice') ? 'source' :
                        (col.type === 'music' || col.type === 'preshow') ? 'target' : 'none',
                    fadeIn: 0,
                    fadeOut: (col.type === 'music') ? 2000 :
                        (col.type === 'preshow') ? 0 :
                            (col.type === 'asset' ? 500 : 0)
                };
                createdClip = newClip;

                const clips = [...col.clips];
                const clampedIndex = Math.max(0, Math.min(insertIndex, clips.length));
                clips.splice(clampedIndex, 0, newClip);
                return { ...col, clips };
            })
        }));

        return createdClip;
    },

    addClipFromPath: (columnId, filePath) => {
        let createdClip: AudioClip | undefined;
        const fileName = filePath.split(/[\\/]/).pop() || filePath;
        const name = fileName.replace(/\.[^/.]+$/, '');
        set((state) => ({
            isDirty: true,
            columns: state.columns.map((col) => {
                if (col.id !== columnId) return col;
                const newClip: AudioClip = {
                    id: crypto.randomUUID(),
                    name,
                    path: filePath,
                    type: col.type,
                    color: col.color,
                    volume: 1.0,
                    pan: 0,
                    isLooping: false,
                    isPlaying: false,
                    duration: 0,
                    currentTime: 0,
                    nextAction: (col.type === 'preshow') ? 'play_next' : 'stop',
                    behavior: 'normal',
                    duckingRole: (col.type === 'voice') ? 'source' :
                        (col.type === 'music' || col.type === 'preshow') ? 'target' : 'none',
                    fadeIn: 0,
                    fadeOut: (col.type === 'preshow') ? 0 : (col.type === 'asset' ? 500 : 0)
                };
                createdClip = newClip;
                return { ...col, clips: [...col.clips, newClip] };
            })
        }));
        return createdClip;
    },

    removeClip: (columnId, clipId) => set((state) => ({
        isDirty: true,
        columns: state.columns.map((col) =>
            col.id === columnId
                ? { ...col, clips: col.clips.filter((c) => c.id !== clipId) }
                : col
        )
    })),

    updateClip: (columnId, clipId, updates) => set((state) => ({
        isDirty: true,
        columns: state.columns.map((col) =>
            col.id === columnId
                ? {
                    ...col,
                    clips: col.clips.map((c) => c.id === clipId ? { ...c, ...updates } : c)
                }
                : col
        )
    })),

    // Persistence
    loadProject: (stateToLoad: ProjectState, filePath?: string) => {
        // Reset isMissing on all clips before integrity check
        const cleanColumns = stateToLoad.columns.map(col => ({
            ...col,
            clips: col.clips.map(c => ({ ...c, isMissing: false }))
        }));
        set({ columns: cleanColumns, isDirty: false, currentFilePath: filePath || null });
    },

    // Integrity Check (v0.14.2)
    runIntegrityCheck: async () => {
        const state = useProjectStore.getState();
        const allClips = state.columns.flatMap(col => col.clips);
        const paths = allClips.map(c => c.path).filter(Boolean);
        if (paths.length === 0) return 0;

        const { missing } = await window.electron.checkFilesExist(paths);
        const missingSet = new Set(missing);

        set((s) => ({
            columns: s.columns.map(col => ({
                ...col,
                clips: col.clips.map(c => ({ ...c, isMissing: missingSet.has(c.path) }))
            }))
        }));

        return missing.length;
    },


    moveClip: (sourceColId: string, destColId: string, oldIndex: number, newIndex: number) => set((state) => {
        const sourceCol = state.columns.find(c => c.id === sourceColId);
        const destCol = state.columns.find(c => c.id === destColId);

        if (!sourceCol || !destCol) return state;

        // Clone columns to avoid mutation
        const newColumns = [...state.columns];
        const sourceColIndex = newColumns.findIndex(c => c.id === sourceColId);
        const destColIndex = newColumns.findIndex(c => c.id === destColId);

        // Get clip to move
        const clipToMove = { ...newColumns[sourceColIndex].clips[oldIndex] };

        // Remove from source
        newColumns[sourceColIndex] = {
            ...newColumns[sourceColIndex],
            clips: newColumns[sourceColIndex].clips.filter((_, i) => i !== oldIndex)
        };

        // Update Clip Properties if changing column type
        if (sourceColId !== destColId) {
            clipToMove.type = destCol.type;
            clipToMove.color = destCol.color;
        }

        // Insert into destination
        if (sourceColId === destColId) {
            const upClips = [...sourceCol.clips];
            const [movedItem] = upClips.splice(oldIndex, 1);
            upClips.splice(newIndex, 0, movedItem);
            newColumns[sourceColIndex] = { ...sourceCol, clips: upClips };
        } else {
            const destClips = [...newColumns[destColIndex].clips];
            destClips.splice(newIndex, 0, clipToMove);
            newColumns[destColIndex] = { ...destCol, clips: destClips };
        }

        return { columns: newColumns, isDirty: true };
    }),

    // Selection Logic
    selectedClipIds: [],

    selectClip: (clipId, mode) => set((state) => {
        let newSelection = [...state.selectedClipIds];
        if (mode === 'single') {
            newSelection = [clipId];
        } else if (mode === 'toggle') {
            if (newSelection.includes(clipId)) {
                newSelection = newSelection.filter(id => id !== clipId);
            } else {
                newSelection.push(clipId);
            }
        } else if (mode === 'add') {
            if (!newSelection.includes(clipId)) newSelection.push(clipId);
        }
        return { selectedClipIds: newSelection };
    }),

    clearSelection: () => set({ selectedClipIds: [] }),

    removeSelectedClips: () => set((state) => {
        if (state.selectedClipIds.length === 0) return state;

        const newColumns = state.columns.map(col => ({
            ...col,
            clips: col.clips.filter(clip => !state.selectedClipIds.includes(clip.id))
        }));

        return {
            columns: newColumns,
            isDirty: true,
            selectedClipIds: []
        };
    })
}));
