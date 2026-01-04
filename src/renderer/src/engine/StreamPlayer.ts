import { IAudioPlayer } from './AudioPlayer.interface';
import AudioContextManager from './AudioContextManager';
import { toFileUrl } from '../utils/pathUtils';
import { debugLog } from '../store/useDebugStore';

export class StreamPlayer implements IAudioPlayer {
    private audioElement: HTMLAudioElement;
    private onFadeOutStartCallback: (() => void) | null = null;
    private onPreEndCallback: ((clipId: string) => void) | null = null;
    private fadeOutTriggered: boolean = false;
    private preEndTriggered: boolean = false;
    private fadeInDuration: number = 0;
    private fadeOutDuration: number = 0;
    private targetVolume: number = 1.0;
    private currentClipId: string = '';
    private volumeGainNode: GainNode;

    private onEndedCallback: (() => void) | null = null;
    private sourceNode: MediaElementAudioSourceNode | null = null;

    constructor() {
        const ctx = AudioContextManager.getInstance().getContext();
        this.audioElement = new Audio();

        // Setup internal volume gain (allows > 1.0)
        this.volumeGainNode = ctx.createGain();

        // Setup MediaElementSource
        this.sourceNode = ctx.createMediaElementSource(this.audioElement);
        this.sourceNode.connect(this.volumeGainNode);

        // Connect to Master by default
        this.volumeGainNode.connect(AudioContextManager.getInstance().getOutput());

        this.audioElement.onended = () => {
            if (this.onEndedCallback) this.onEndedCallback();
        };

        this.audioElement.ontimeupdate = () => {
            const { currentTime, duration } = this.audioElement;

            // 1. Fade Out Logic
            if (this.fadeOutDuration > 0 && !this.fadeOutTriggered && duration > 0) {
                const remaining = duration - currentTime;
                if (remaining <= (this.fadeOutDuration / 1000)) {
                    this.fadeOutTriggered = true;
                    if (this.onFadeOutStartCallback) this.onFadeOutStartCallback();
                    this.startFadeOut();
                }
            }

            // 2. PreEnd Logic
            if (duration > 0 && !this.preEndTriggered && this.onPreEndCallback) {
                const threshold = (this.fadeOutDuration > 0) ? (this.fadeOutDuration / 1000) : 0.05;
                const remaining = duration - currentTime;
                if (remaining <= threshold) {
                    this.preEndTriggered = true;
                    debugLog(`StreamPlayer: PreEnd Triggered for ${this.currentClipId}`, 'event');
                    this.onPreEndCallback(this.currentClipId);
                }
            }
        };

        this.audioElement.onerror = (e: Event | string) => {
            if (this.audioElement.src === '' || this.audioElement.src.endsWith('media:///')) return;
            console.error("StreamPlayer Error", e, this.audioElement.error);
            const errorType = (typeof e === 'string') ? e : e.type;
            debugLog(`StreamPlayer: Error ${errorType}`, 'error');
        };
    }

    async load(path: string | File): Promise<void> {
        return new Promise((resolve, reject) => {
            let url: string;
            if (path instanceof File) {
                url = URL.createObjectURL(path);
            } else {
                url = toFileUrl(path);
            }

            const handleCanPlay = () => {
                this.audioElement.removeEventListener('canplaythrough', handleCanPlay);
                this.audioElement.removeEventListener('error', handleError);
                resolve();
            };

            const handleError = (_e: Event) => {
                this.audioElement.removeEventListener('canplaythrough', handleCanPlay);
                this.audioElement.removeEventListener('error', handleError);
                reject(new Error(`Failed to load: ${path}`));
            };

            this.audioElement.addEventListener('canplaythrough', handleCanPlay);
            this.audioElement.addEventListener('error', handleError);

            this.audioElement.src = url;
            this.audioElement.load();
        });
    }

    play(): void {
        const ctx = AudioContextManager.getInstance().getContext();
        AudioContextManager.getInstance().resume();

        this.fadeOutTriggered = false;
        this.preEndTriggered = false;

        this.volumeGainNode.gain.cancelScheduledValues(ctx.currentTime);
        if (this.fadeInDuration > 0) {
            this.volumeGainNode.gain.setValueAtTime(0, ctx.currentTime);
            this.volumeGainNode.gain.linearRampToValueAtTime(this.targetVolume, ctx.currentTime + (this.fadeInDuration / 1000));
            this.volumeGainNode.gain.setValueAtTime(this.targetVolume, ctx.currentTime + (this.fadeInDuration / 1000) + 0.1);
        } else {
            this.volumeGainNode.gain.setValueAtTime(this.targetVolume, ctx.currentTime);
        }

        debugLog(`StreamPlayer: Play ${this.currentClipId} (FadeIn: ${this.fadeInDuration})`, 'info');
        this.audioElement.play().catch(e => {
            console.error("Play failed", e);
            debugLog(`StreamPlayer: Play failed ${e.message}`, 'error');
        });
    }

    stop(): void {
        debugLog(`StreamPlayer: Stop ${this.currentClipId}`, 'info');
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.fadeOutTriggered = false;
        this.preEndTriggered = false;
    }

    seek(time: number): void {
        this.audioElement.currentTime = time;
    }

    startFadeOut(): void {
        if (!this.volumeGainNode) return;
        debugLog(`StreamPlayer: Starting FadeOut (${this.fadeOutDuration}ms)`, 'event');
        const ctx = AudioContextManager.getInstance().getContext();
        this.volumeGainNode.gain.cancelScheduledValues(ctx.currentTime);
        this.volumeGainNode.gain.setValueAtTime(this.volumeGainNode.gain.value, ctx.currentTime);
        this.volumeGainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + (this.fadeOutDuration / 1000));
    }

    setVolume(value: number): void {
        this.targetVolume = Math.max(0, value);
        if (this.volumeGainNode && !this.fadeOutTriggered) {
            this.volumeGainNode.gain.cancelScheduledValues(AudioContextManager.getInstance().getContext().currentTime);
            this.volumeGainNode.gain.value = this.targetVolume;
        }
    }

    getCurrentTime(): number {
        return this.audioElement.currentTime;
    }

    getDuration(): number {
        return this.audioElement.duration || 0;
    }

    cleanup(): void {
        this.audioElement.pause();
        this.audioElement.removeAttribute('src');
        this.audioElement.load();

        this.onEndedCallback = null;
        this.onFadeOutStartCallback = null;
        this.onPreEndCallback = null;
        this.audioElement.onended = null;
        this.audioElement.ontimeupdate = null;
        this.audioElement.onerror = null;

        if (this.volumeGainNode) {
            this.volumeGainNode.disconnect();
        }
    }

    setBus(bus: GainNode): void {
        if (this.volumeGainNode) {
            this.volumeGainNode.disconnect();
            this.volumeGainNode.connect(bus);
        }
    }

    onEnded(callback: () => void): void {
        this.onEndedCallback = callback;
    }

    onFadeOutStart(callback: () => void): void {
        this.onFadeOutStartCallback = callback;
    }

    onPreEnd(callback: (clipId: string) => void): void {
        this.onPreEndCallback = callback;
    }

    updateSettings(clip: any): void {
        if (clip.id) this.currentClipId = clip.id;
        if (clip.volume !== undefined) this.targetVolume = clip.volume;
        if (clip.isLooping !== undefined) this.audioElement.loop = clip.isLooping;
        if (clip.fadeIn !== undefined) this.fadeInDuration = clip.fadeIn;
        if (clip.fadeOut !== undefined) this.fadeOutDuration = clip.fadeOut;
    }

    fadeTo(volume: number, duration: number): void {
        if (!this.volumeGainNode) return;
        debugLog(`StreamPlayer: FadeTo ${volume} in ${duration}ms`, 'event');
        const ctx = AudioContextManager.getInstance().getContext();
        const now = ctx.currentTime;

        // Force a value set to ensure ramp has a starting point, even if strictly 0.
        // Web Audio API sometimes ignores ramps if starting value is 0 or scheduled at same time.
        this.volumeGainNode.gain.cancelScheduledValues(now);
        this.volumeGainNode.gain.setValueAtTime(this.volumeGainNode.gain.value, now);

        // Use exponential ramp for natural sound? No, linear is safer for 0 handling usually.
        // But for music ducking linear is fine.
        this.volumeGainNode.gain.linearRampToValueAtTime(volume, now + (duration / 1000));
    }
}
