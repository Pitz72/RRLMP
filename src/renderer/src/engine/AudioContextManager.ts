class AudioContextManager {
    private static instance: AudioContextManager;
    private context: AudioContext;
    private masterGain: GainNode;
    private analyserL: AnalyserNode;
    private analyserR: AnalyserNode;
    private splitter: ChannelSplitterNode;

    // Buses
    private musicBus: GainNode;
    private voiceBus: GainNode;
    private sfxBus: GainNode;
    private assetsBus: GainNode;

    private constructor() {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Master Gain
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);

        // Initialize Buses
        this.musicBus = this.context.createGain();
        this.voiceBus = this.context.createGain();
        this.sfxBus = this.context.createGain();
        this.assetsBus = this.context.createGain();

        // Metering Setup
        this.splitter = this.context.createChannelSplitter(2);
        this.analyserL = this.context.createAnalyser();
        this.analyserR = this.context.createAnalyser();

        this.analyserL.fftSize = 256;
        this.analyserR.fftSize = 256;
        this.analyserL.smoothingTimeConstant = 0.8;
        this.analyserR.smoothingTimeConstant = 0.8;

        // Route Master to Splitter (Parallel to Destination)
        this.masterGain.connect(this.splitter);
        this.splitter.connect(this.analyserL, 0);
        this.splitter.connect(this.analyserR, 1);

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
        return this.context;
    }

    public getOutput(): GainNode {
        return this.masterGain;
    }

    public getAnalysers() {
        return { left: this.analyserL, right: this.analyserR };
    }

    // Bus Getters
    public getMusicBus(): GainNode { return this.musicBus; }
    public getVoiceBus(): GainNode { return this.voiceBus; }
    public getSfxBus(): GainNode { return this.sfxBus; }
    public getAssetsBus(): GainNode { return this.assetsBus; }

    public async resume(): Promise<void> {
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
    }

    public setMasterVolume(value: number): void {
        const clampedValue = Math.max(0, Math.min(1, value));
        this.masterGain.gain.setTargetAtTime(clampedValue, this.context.currentTime, 0.1);
    }
}

export default AudioContextManager;
