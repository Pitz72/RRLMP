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
    volume: number; // 0.0 to 1.0
    pan: number;    // -1.0 to 1.0

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
    nextAction?: 'stop' | 'play_next' | 'loop';
    duckingTarget?: boolean; // Se true, viene abbassato dal voice
    duckingSource?: boolean; // Se true, abbassa gli altri
}

export interface Column {
    id: string;
    title: string;
    type: ClipType;
    clips: AudioClip[];
    color: string; // Colore base della colonna
    isLocked: boolean; // Impedisce modifiche accidentali
}
