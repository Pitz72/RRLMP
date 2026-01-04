import { IAudioPlayer } from './AudioPlayer.interface';
import AudioContextManager from './AudioContextManager';
import { toFileUrl } from '../utils/pathUtils';

export class StreamPlayer implements IAudioPlayer {
    private audio: HTMLAudioElement;
    private sourceNode: MediaElementAudioSourceNode | null = null;
    private isLoaded: boolean = false;

    constructor() {
        this.audio = new Audio();
        this.audio.onerror = (e) => {
            // Ignora errore se src è vuoto (accade durante cleanup)
            if (this.audio.src === '' || this.audio.src.endsWith('media:///')) return;
            console.error("StreamPlayer Error", e, this.audio.error);
        };
    }

    public async load(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Usa protocollo media://
            this.audio.src = toFileUrl(path);

            this.audio.addEventListener('canplaythrough', () => {
                this.initAudioGraph();
                this.isLoaded = true;
                resolve();
            }, { once: true });

            this.audio.addEventListener('error', (e) => reject(e));

            // Importante: settare crossorigin se necessario, ma con protocollo custom di solito non serve se bypassCSP è true
            this.audio.load();
        });
    }

    private currentBus: GainNode | null = null;

    private initAudioGraph() {
        if (!this.sourceNode) {
            const context = AudioContextManager.getInstance().getContext();
            this.sourceNode = context.createMediaElementSource(this.audio);
        }

        // Ensure we are connected to the correct bus (or Master if none set)
        // If play() is called, we expect 'currentBus' to be set, otherwise default to Master
        this.reconnectToBus();
    }

    public setBus(bus: GainNode) {
        this.currentBus = bus;
        if (this.sourceNode) {
            this.reconnectToBus();
        }
    }

    private reconnectToBus() {
        if (!this.sourceNode) return;

        // Disconnect from everything
        this.sourceNode.disconnect();

        // Connect to selected bus or Master default
        const target = this.currentBus || AudioContextManager.getInstance().getOutput();
        this.sourceNode.connect(target);
    }

    public play(): void {
        if (!this.isLoaded) return;
        AudioContextManager.getInstance().resume();
        this.audio.play();
    }

    public stop(): void {
        this.audio.pause();
        this.audio.currentTime = 0;
    }

    public seek(time: number): void {
        this.audio.currentTime = time;
    }

    public setVolume(value: number): void {
        this.audio.volume = value;
    }

    public getCurrentTime(): number {
        return this.audio.currentTime;
    }

    public getDuration(): number {
        return this.audio.duration;
    }

    public cleanup(): void {
        this.stop();
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        this.audio.src = '';
    }
}
