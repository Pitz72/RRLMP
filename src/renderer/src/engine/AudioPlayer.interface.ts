import { AudioClip } from '../types';

export interface IAudioPlayer {
    load(path: string): Promise<void>;
    play(): void;
    stop(): void;
    seek(time: number): void;
    setVolume(value: number): void;
    getCurrentTime(): number;
    getDuration(): number;
    cleanup(): void;

    // Routing
    setOutputDevice(deviceId: string): void;
    setBus(bus: GainNode): void;
    onEnded(callback: () => void): void;
    onFadeOutStart(callback: () => void): void;
    onPreEnd(callback: (clipId: string) => void): void;
    onIntroReached(callback: (clipId: string) => void): void;
    onOutroReached(callback: (clipId: string) => void): void;
    updateSettings(clip: AudioClip): void;
    fadeTo(volume: number, duration: number): void;
}
