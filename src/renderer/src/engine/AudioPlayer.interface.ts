export interface IAudioPlayer {
    load(path: string | File): Promise<void>;
    play(): void;
    stop(): void;
    seek(time: number): void;
    setVolume(value: number): void;
    getCurrentTime(): number;
    getDuration(): number;
    cleanup(): void;
    setBus(bus: GainNode): void;
}
