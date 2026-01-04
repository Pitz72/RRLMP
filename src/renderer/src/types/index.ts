export type ClipType = 'asset' | 'music' | 'voice' | 'sfx' | 'preshow';

export type PlaybackMode = 'oneshot' | 'loop' | 'sequence';

declare global {
    interface Window {
        electron: {
            getFilePath: (file: File) => string;
        }
    }
}

export interface AudioClip {
    id: string;
    name: string;
    path: string; // File system path
    type: ClipType;
    color: string;
    volume: number; // 0.0 to 1.5 (Gain, default 1.0)
    pan: number;    // -1.0 to 1.0
    isLooping: boolean; // Default false

    // Audio Logic
    isPlaying: boolean;
    duration: number;
    currentTime: number;

    // Advanced Broadcast Features
    startMarker?: number; // Intro start (skip silence)
    introMarker?: number; // Countdown end (vocal start)
    outroMarker?: number; // Mix point
    endMarker?: number;   // Early stop

    // Behavioral Logic
    nextAction: 'stop' | 'play_next' | 'loop'; // Default 'stop'
    behavior: 'normal' | 'stacco'; // Default 'normal' This allows intra-column ducking

    // Regole di ingaggio
    duckingRole: 'source' | 'target' | 'none'; // Default basato su colonna

    // Transizioni
    fadeIn: number; // ms
    fadeOut: number; // ms

    // Metadati visuali
    customColor?: string; // Override colore colonna
}

export interface Column {
    id: string;
    title: string;
    type: ClipType;
    clips: AudioClip[];
    color: string; // Colore base della colonna
    isLocked: boolean; // Impedisce modifiche accidentali
}
