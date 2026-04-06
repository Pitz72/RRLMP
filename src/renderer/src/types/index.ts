export type ClipType = 'asset' | 'music' | 'voice' | 'sfx' | 'preshow';

export type PlaybackMode = 'oneshot' | 'loop' | 'sequence';

declare global {
    interface Window {
        electron: {
            getFilePath: (file: File) => string;
            getAudioMetadata: (filePath: string) => Promise<{success: boolean, data?: any, error?: string}>;
            getWaveformData: (filePath: string) => Promise<{success: boolean, data?: any, error?: string}>;
            saveProject: (content: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
            loadProject: () => Promise<{ success: boolean; data?: string; filePath?: string; error?: string }>;
            exportProject: (projectJsonString: string) => Promise<{ success: boolean; path?: string; stats?: { copied: number; skipped: number }; error?: string }>;
            saveProjectSilent: (content: string, filePath?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
            saveProjectDirect: (content: string, filePath: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;

            showCloseDialog: () => Promise<number>;
            showCloseDialogI18n?: (labels: {
                btnSave: string; btnDiscard: string; btnCancel: string;
                title: string; message: string;
            }) => Promise<number>;
            forceClose: () => void;

            onExportProgress: (callback: (event: any, data: { current: number; total: number; filename: string }) => void) => () => void;
            onCheckCloseIntent: (callback: () => void) => () => void;
        }





    }
}

/**
 * Essential data structure for an audio clip in the RRLMP project.
 */
export interface AudioClip {
    /** Unique identifier (UUID) */
    id: string;
    /** Display name of the clip */
    name: string;
    /** Native file system path */
    path: string; 
    /** Broadcast type (affects color and bus routing) */
    type: ClipType;
    /** Base color inherited from column or project */
    color: string;
    /** Volume gain multiplier. Default: 1.0 (Unity Gain). Range: 0.0 to 1.5 */
    volume: number; 
    /** Stereo panning. Default: 0.0 (Center). Range: -1.0 to 1.0 */
    pan: number;    
    /** Whether the clip should loop automatically. Default: false */
    isLooping: boolean; 

    // Audio Logic
    /** Dynamic state: is currently playing */
    isPlaying: boolean;
    /** Duration in seconds (loaded from metadata) */
    duration: number;
    /** Current playback position in seconds */
    currentTime: number;

    // Advanced Broadcast Features
    /** Intro start position (skip silence). Default: 0 */
    startMarker?: number; 
    /** Countdown end (vocal start marker) */
    introMarker?: number; 
    /** Mix point (outro transition start) */
    outroMarker?: number; 
    /** Early stop position (end marker) */
    endMarker?: number;   

    // Behavioral Logic
    /** Sequencer action after completion. Default: 'stop' */
    nextAction: 'stop' | 'play_next' | 'loop'; 
    /** Mixer behavior. 'stacco' triggers ducking on other clips. Default: 'normal' */
    behavior: 'normal' | 'stacco'; 

    // Regole di ingaggio
    /** Ducking priority. Default: 'none' */
    duckingRole: 'source' | 'target' | 'none'; 

    // Transizioni
    /** Fade In duration in milliseconds. Default: 0 */
    fadeIn: number; 
    /** Fade Out duration in milliseconds. Default: 0 */
    fadeOut: number; 

    // Metadati visuali
    /** Manual color override for this specific clip */
    customColor?: string; 
    /** Keyboard shortcut (e.g., "KeyQ", "Numpad1") */
    keybind?: string; 
    /** MIDI Note/Control Bind (e.g., "NOTE:60") */
    midiBind?: string; 

    // Cue Points
    /** Pre-play offset (skip seconds from start). Default: 0 */
    trimStart?: number; 
    /** Post-play offset (stop seconds before end). Default: 0 */
    trimEnd?: number;   
}


export interface Column {
    id: string;
    title: string;
    type: ClipType;
    clips: AudioClip[];
    color: string; // Colore base della colonna
    isLocked: boolean; // Impedisce modifiche accidentali
}
