import { IAudioPlayer } from './AudioPlayer.interface';
import AudioContextManager from './AudioContextManager';
import { toFileUrl } from '../utils/pathUtils';
import { debugLog } from '../store/useDebugStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { AudioClip } from '../types';

// Extended HTMLAudioElement to include experimental setSinkId
interface HTMLAudioElementWithSinkId extends HTMLAudioElement {
    setSinkId(deviceId: string): Promise<void>;
}

export class StreamPlayer implements IAudioPlayer {
    private audioElement: HTMLAudioElementWithSinkId;
    private onFadeOutStartCallback: (() => void) | null = null;
    private onPreEndCallback: ((clipId: string) => void) | null = null;
    private onIntroReachedCallback: ((clipId: string) => void) | null = null;
    private onOutroReachedCallback: ((clipId: string) => void) | null = null;
    private onPlaybackErrorCallback: ((clipId: string) => void) | null = null;
    private fadeOutTriggered: boolean = false;
    private preEndTriggered: boolean = false;
    private introReached: boolean = false;
    private outroReached: boolean = false;
    private fadeInDuration: number = 0;
    private fadeOutDuration: number = 0;
    private targetVolume: number = 1.0;
    private trimStart: number = 0;
    private trimEnd: number = 0;
    private introMarker: number = 0;
    private outroMarker: number = 0;
    private isLooping: boolean = false;
    // v1.4.6 (#1): istante (ctx.currentTime) in cui termina la rampa di fade-in
    // schedulata da play(). Serve a fadeTo() per NON cancellare la salita quando
    // riceve un'applicazione istantanea (evaluateMix sulla clip appena avviata).
    private fadeInUntil: number = 0;

    private currentClipId: string = '';
    private volumeGainNode: GainNode;

    private onEndedCallback: (() => void) | null = null;
    private sourceNode: MediaElementAudioSourceNode | null = null;

    constructor() {
        const ctx = AudioContextManager.getInstance().getContext();
        this.audioElement = new Audio() as HTMLAudioElementWithSinkId;
        this.audioElement.loop = false; // Always manual for trim support
        
        const deviceId = useSettingsStore.getState().outputDeviceId;
        if (deviceId && deviceId !== 'default') {
            this.setOutputDevice(deviceId);
        }

        // Setup internal volume gain (allows > 1.0)
        this.volumeGainNode = ctx.createGain();

        // Setup MediaElementSource
        this.sourceNode = ctx.createMediaElementSource(this.audioElement);
        this.sourceNode.connect(this.volumeGainNode);

        // Connect to Master by default
        this.volumeGainNode.connect(AudioContextManager.getInstance().getOutput());

        this.audioElement.onended = () => {
            if (this.isLooping) {
                debugLog(`StreamPlayer: Natural Loop Restart for ${this.currentClipId}`, 'event');
                this.restartLoop();
            } else if (this.onEndedCallback) {
                this.onEndedCallback();
            }
        };

        this.audioElement.ontimeupdate = () => {
            const { currentTime, duration } = this.audioElement;
            const effectiveDuration = Math.max(0, duration - this.trimEnd);

            // --- L4 Logic Documentation ---
            // 0. Trim End Trigger (Manual or Loop)
            if (this.trimEnd > 0 && duration > 0 && currentTime >= effectiveDuration) {
                if (this.isLooping) {
                    debugLog(`StreamPlayer: Trim Loop Restart for ${this.currentClipId}`, 'event');
                    this.restartLoop();
                    return;
                }
                
                if (!this.audioElement.paused) {
                    debugLog(`StreamPlayer: Trim End Triggered (${this.trimEnd}s offset)`, 'event');
                    this.audioElement.pause();
                    if (this.onEndedCallback) this.onEndedCallback();
                }
                return;
            }

            // 1. Intro Marker Reached
            if (this.introMarker > 0 && !this.introReached && currentTime >= this.introMarker) {
                this.introReached = true;
                if (this.onIntroReachedCallback) this.onIntroReachedCallback(this.currentClipId);
            }

            // 2. Outro Marker Reached
            if (this.outroMarker > 0 && !this.outroReached && currentTime >= this.outroMarker) {
                this.outroReached = true;
                if (this.onOutroReachedCallback) this.onOutroReachedCallback(this.currentClipId);
            }

            // 3. Fade Out Logic
            if (this.fadeOutDuration > 0 && !this.fadeOutTriggered && duration > 0) {
                const remaining = effectiveDuration - currentTime;
                if (remaining <= (this.fadeOutDuration / 1000)) {
                    this.fadeOutTriggered = true;
                    if (this.onFadeOutStartCallback) this.onFadeOutStartCallback();
                    this.startFadeOut();
                }
            }

            // 4. PreEnd Logic
            if (duration > 0 && !this.preEndTriggered && this.onPreEndCallback) {
                const threshold = (this.fadeOutDuration > 0) ? (this.fadeOutDuration / 1000) : 0.05;
                const remaining = effectiveDuration - currentTime;
                if (remaining <= threshold) {
                    this.preEndTriggered = true;
                    debugLog(`StreamPlayer: PreEnd Triggered for ${this.currentClipId}`, 'event');
                    this.onPreEndCallback(this.currentClipId);
                }
            }
        };

        this.audioElement.onerror = (e: Event | string) => {
            if (this.audioElement.src === '') return;
            // L2 Fix: Uniform error handling
            console.error("StreamPlayer Global Error", e, this.audioElement.error);
            const errorMsg = this.audioElement.error ? `Code ${this.audioElement.error.code} - ${this.audioElement.error.message}` : String(e);
            debugLog(`StreamPlayer: Error ${errorMsg}`, 'error');
            // v1.4.10 (#20): notifica lo store — clip zombie e catena ferma altrimenti.
            // Gli errori in fase di load sono già gestiti dal reject di load(); lo store
            // ignora la notifica se la clip non è (ancora) attiva.
            if (this.onPlaybackErrorCallback) this.onPlaybackErrorCallback(this.currentClipId);
        };
    }

    private restartLoop(): void {
        // Reset markers for the next cycle
        this.introReached = false;
        this.outroReached = false;
        this.fadeOutTriggered = false;
        this.preEndTriggered = false;

        // Reset volume to target (if it was fading out)
        const ctx = AudioContextManager.getInstance().getContext();
        this.volumeGainNode.gain.cancelScheduledValues(ctx.currentTime);
        this.volumeGainNode.gain.setValueAtTime(this.targetVolume, ctx.currentTime);
        this.fadeInUntil = 0; // v1.4.6 (#1): nessun fade-in sul giro di loop

        // Restart from trim point
        this.audioElement.currentTime = this.trimStart;
        this.audioElement.play().catch(e => {
            debugLog(`StreamPlayer: Loop play failed ${e.message}`, 'error');
        });
    }

    async load(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Memory Leak Fix: FORCE usage of Streaming Protocol
            // Never use URL.createObjectURL(file) here.
            const url = toFileUrl(path);

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

        // Trim Start Logic
        if (this.trimStart > 0) {
            this.audioElement.currentTime = this.trimStart;
        }

        this.volumeGainNode.gain.cancelScheduledValues(ctx.currentTime);
        if (this.fadeInDuration > 0) {
            this.volumeGainNode.gain.setValueAtTime(0, ctx.currentTime);
            this.volumeGainNode.gain.linearRampToValueAtTime(this.targetVolume, ctx.currentTime + (this.fadeInDuration / 1000));
            // Ensure volume stays set after ramp
            this.volumeGainNode.gain.setValueAtTime(this.targetVolume, ctx.currentTime + (this.fadeInDuration / 1000) + 0.1);
            this.fadeInUntil = ctx.currentTime + (this.fadeInDuration / 1000);
        } else {
            this.volumeGainNode.gain.setValueAtTime(this.targetVolume, ctx.currentTime);
            this.fadeInUntil = 0;
        }

        debugLog(`StreamPlayer: Play ${this.currentClipId} (FadeIn: ${this.fadeInDuration}ms, Trim: ${this.trimStart}s)`, 'info');
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
        // GR-05 Fix: disabilita il loop prima di pausare per impedire che onended/ontimeupdate
        // richiamino restartLoop() se l'evento arriva in concorrenza con cleanup().
        this.isLooping = false;

        this.audioElement.pause();
        this.audioElement.removeAttribute('src');
        this.audioElement.load();

        // GR-05 Fix: nulla TUTTI i callback per rilasciare le chiusure e permettere al GC
        // di raccogliere lo scope circostante (in precedenza intro/outro mancavano).
        this.onEndedCallback = null;
        this.onFadeOutStartCallback = null;
        this.onPreEndCallback = null;
        this.onIntroReachedCallback = null;
        this.onOutroReachedCallback = null;
        this.onPlaybackErrorCallback = null;
        this.audioElement.onended = null;
        this.audioElement.ontimeupdate = null;
        this.audioElement.onerror = null;

        // G2 Fix: disconnetti TUTTI i nodi Web Audio per evitare memory leak.
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        if (this.volumeGainNode) {
            this.volumeGainNode.disconnect();
        }
    }

    setOutputDevice(deviceId: string) {
        if (!deviceId) return;
        
        if (typeof this.audioElement.setSinkId === 'function') {
            // GR3 Fix: in caso di errore (device disconnesso/non disponibile),
            // logga nel debug store visible in UI e tenta fallback a 'default'.
            this.audioElement.setSinkId(deviceId).catch((err: Error) => {
                console.warn(`StreamPlayer: setSinkId(${deviceId}) fallito:`, err.message);
                // Import dinamico per evitare dipendenza circolare
                import('../store/useDebugStore').then(({ debugLog }) => {
                    debugLog(`⚠️ Device audio non disponibile (${deviceId.substring(0, 8)}…) — fallback a sistema`, 'error');
                });
                // Fallback automatico al dispositivo di sistema
                if (deviceId !== 'default') {
                    this.audioElement.setSinkId('default').catch(() => {});
                }
            });
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

    onIntroReached(callback: (clipId: string) => void): void {
        this.onIntroReachedCallback = callback;
    }

    onOutroReached(callback: (clipId: string) => void): void {
        this.onOutroReachedCallback = callback;
    }

    onPlaybackError(callback: (clipId: string) => void): void {
        this.onPlaybackErrorCallback = callback;
    }

    updateSettings(clip: AudioClip): void {
        if (clip.id) this.currentClipId = clip.id;
        if (clip.volume !== undefined) this.targetVolume = clip.volume;
        if (clip.isLooping !== undefined) {
            this.isLooping = clip.isLooping;
            this.audioElement.loop = false; // We handle loop manually to support Trims
        }
        if (clip.fadeIn !== undefined) this.fadeInDuration = clip.fadeIn;
        if (clip.fadeOut !== undefined) this.fadeOutDuration = clip.fadeOut;
        if (clip.trimStart !== undefined) this.trimStart = clip.trimStart;
        if (clip.trimEnd !== undefined) this.trimEnd = clip.trimEnd;
        if (clip.introMarker !== undefined) this.introMarker = clip.introMarker;
        if (clip.outroMarker !== undefined) this.outroMarker = clip.outroMarker;
    }

    fadeTo(volume: number, duration: number): void {
        if (!this.volumeGainNode) return;
        debugLog(`StreamPlayer: FadeTo ${volume} in ${duration}ms`, 'event');
        const ctx = AudioContextManager.getInstance().getContext();
        const now = ctx.currentTime;

        this.volumeGainNode.gain.cancelScheduledValues(now);
        if (duration <= 0) {
            if (now < this.fadeInUntil) {
                // v1.4.6 (#1): fade-in ancora in corso (rampa schedulata da play()).
                // Un set istantaneo qui (evaluateMix sulla clip appena avviata) la
                // cancellerebbe → attacco secco a volume pieno, crossfade-in e fadeIn
                // utente mai udibili. Si ri-traccia invece la salita dal valore corrente
                // verso il NUOVO target (eventualmente già duckato), preservando la
                // durata residua del fade-in.
                this.volumeGainNode.gain.setValueAtTime(this.volumeGainNode.gain.value, now);
                this.volumeGainNode.gain.linearRampToValueAtTime(volume, this.fadeInUntil);
            } else {
                // Istantaneo — evita linearRamp con durata zero che può causare glitch
                this.volumeGainNode.gain.setValueAtTime(volume, now);
            }
        } else {
            this.volumeGainNode.gain.setValueAtTime(this.volumeGainNode.gain.value, now);
            this.volumeGainNode.gain.linearRampToValueAtTime(volume, now + (duration / 1000));
        }
    }
}
