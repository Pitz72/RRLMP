import AudioContextManager from './AudioContextManager';
import { IAudioPlayer } from './AudioPlayer.interface';
import { toFileUrl } from '../utils/pathUtils';

export class BufferPlayer implements IAudioPlayer {
    private buffer: AudioBuffer | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private gainNode: GainNode;
    private isPlaying: boolean = false;
    private startTime: number = 0;
    private pauseTime: number = 0;
    private duration: number = 0;

    constructor() {
        const ctx = AudioContextManager.getInstance().getContext();
        this.gainNode = ctx.createGain();
        this.gainNode.connect(AudioContextManager.getInstance().getOutput());
    }

    async load(path: string): Promise<void> {
        const ctx = AudioContextManager.getInstance().getContext();

        try {
            // Usa protocollo media://
            const url = toFileUrl(path);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio file: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();

            // Decodifica
            this.buffer = await ctx.decodeAudioData(arrayBuffer);
            this.duration = this.buffer.duration;
        } catch (err) {
            console.error("CRITICAL: BufferPlayer load failed", err);
            throw err;
        }
    }

    play(): void {
        if (!this.buffer) return;
        const ctx = AudioContextManager.getInstance().getContext();

        if (this.isPlaying) this.stop();

        this.sourceNode = ctx.createBufferSource();
        this.sourceNode.buffer = this.buffer;
        this.sourceNode.connect(this.gainNode);

        // Resume context
        AudioContextManager.getInstance().resume();

        // Handle offset
        const offset = this.pauseTime % this.buffer.duration;
        this.sourceNode.start(0, offset);
        this.startTime = ctx.currentTime - offset;
        this.isPlaying = true;

        this.sourceNode.onended = () => {
            this.isPlaying = false;
            this.pauseTime = 0;
            if (this.onEndedCallback) this.onEndedCallback();
        };
    }

    stop(): void {
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
                this.sourceNode.disconnect();
            } catch (e) { /* ignore */ }
            this.sourceNode = null;
        }
        this.isPlaying = false;
        this.pauseTime = 0;
    }

    seek(time: number): void {
        const wasPlaying = this.isPlaying;
        this.stop();
        this.pauseTime = time;
        if (wasPlaying) {
            this.play();
        }
    }

    setVolume(value: number): void {
        this.gainNode.gain.setValueAtTime(value, AudioContextManager.getInstance().getContext().currentTime);
    }

    getCurrentTime(): number {
        if (!this.isPlaying) return this.pauseTime;
        const ctx = AudioContextManager.getInstance().getContext();
        const elapsed = ctx.currentTime - this.startTime;
        return this.buffer ? elapsed % this.buffer.duration : 0;
    }

    getDuration(): number {
        return this.buffer?.duration || this.duration || 0;
    }

    cleanup(): void {
        this.stop();
        this.gainNode.disconnect();
        this.buffer = null;
    }

    setBus(bus: GainNode): void {
        this.gainNode.disconnect();
        this.gainNode.connect(bus);
    }

    private onEndedCallback: (() => void) | null = null;

    onEnded(callback: () => void): void {
        this.onEndedCallback = callback;
    }

    onFadeOutStart(_callback: () => void): void {
        // BufferPlayer functionality limited for now
        // Could implement similar time check in getCurrentTime or via setTimeout
    }

    updateSettings(clip: any): void {
        // BufferPlayer uses AudioBufferSourceNode which is one-time use.
        // Changing 'loop' here only affects if we are created/playing?
        // Actually we can set gain anytime.
        if (clip.volume !== undefined) this.setVolume(clip.volume);

        // Looping must be set on the active source node
        if (this.sourceNode && clip.isLooping !== undefined) {
            this.sourceNode.loop = clip.isLooping;
        }
        // Also store it for next play() ? BufferPlayer usually recreates sourceNode
        // We'd need to store 'isLooping' state.
        // Let's add that prop if we want full support, but for interface strictness:
    }
}
