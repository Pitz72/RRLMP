class AudioContextManager {
    private static instance: AudioContextManager;
    private audioContext: AudioContext;
    private masterGain: GainNode;

    // Buses
    private musicBus: GainNode;
    private voiceBus: GainNode;
    private sfxBus: GainNode;
    private assetsBus: GainNode;

    private constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Master Gain
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);

        // Initialize Buses
        this.musicBus = this.audioContext.createGain();
        this.voiceBus = this.audioContext.createGain();
        this.sfxBus = this.audioContext.createGain();
        this.assetsBus = this.audioContext.createGain();

        // Connect Buses to Master
        this.musicBus.connect(this.masterGain);
        this.voiceBus.connect(this.masterGain);
        this.sfxBus.connect(this.masterGain);
        this.assetsBus.connect(this.masterGain);

        // Set initial volumes
        this.masterGain.gain.value = 1.0;
        this.musicBus.gain.value = 1.0;
        this.voiceBus.gain.value = 1.0;
        this.sfxBus.gain.value = 1.0;
        this.assetsBus.gain.value = 1.0;
    }

    public static getInstance(): AudioContextManager {
        if (!AudioContextManager.instance) {
            AudioContextManager.instance = new AudioContextManager();
        }
        return AudioContextManager.instance;
    }

    public getContext(): AudioContext {
        return this.audioContext;
    }

    public getOutput(): GainNode {
        return this.masterGain;
    }

    // Bus Getters
    public getMusicBus(): GainNode { return this.musicBus; }
    public getVoiceBus(): GainNode { return this.voiceBus; }
    public getSfxBus(): GainNode { return this.sfxBus; }
    public getAssetsBus(): GainNode { return this.assetsBus; }

    public async resume(): Promise<void> {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    public setMasterVolume(value: number): void {
        const clampedValue = Math.max(0, Math.min(1, value));
        this.masterGain.gain.setTargetAtTime(clampedValue, this.audioContext.currentTime, 0.1);
    }
}

export default AudioContextManager;
