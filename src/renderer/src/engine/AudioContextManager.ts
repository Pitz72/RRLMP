/**
 * AudioContextManager (Singleton)
 * 
 * Manages the global Web Audio API context and the main routing graph.
 * 
 * Audio Graph Topology (GR2):
 * Bus (Music/Voice/SFX/Assets) → masterGain → ChannelSplitter → AnalyserL, AnalyserR
 *                                            ↘ destination
 */
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
        const WindowContext = window as unknown as { webkitAudioContext: typeof AudioContext };
        const AudioContextClass = (window.AudioContext || WindowContext.webkitAudioContext) as typeof AudioContext;
        this.context = new AudioContextClass();

        // 1. Master Gain (Single source for destination and analysis)
        this.masterGain = this.context.createGain();

        // 2. Routing to Output
        this.masterGain.connect(this.context.destination);

        // 3. Routing to Metering (Parallel to Destination)
        this.splitter = this.context.createChannelSplitter(2);
        this.analyserL = this.context.createAnalyser();
        this.analyserR = this.context.createAnalyser();

        // M4: Optimization - 64 is enough for VU meters
        this.analyserL.fftSize = 64;
        this.analyserR.fftSize = 64;
        this.analyserL.smoothingTimeConstant = 0.8;
        this.analyserR.smoothingTimeConstant = 0.8;

        this.masterGain.connect(this.splitter);
        this.splitter.connect(this.analyserL, 0);
        this.splitter.connect(this.analyserR, 1);

        // 4. Initialize Buses
        this.musicBus = this.context.createGain();
        this.voiceBus = this.context.createGain();
        this.sfxBus = this.context.createGain();
        this.assetsBus = this.context.createGain();

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

    public async setOutputDevice(deviceId: string): Promise<void> {
        // GR11: La topologia prevede routing tramite Web Audio API, non HTMLAudioElement,
        // quindi dobbiamo impostare il sinkId sull'intero AudioContext.
        const ctxExt = this.context as AudioContext & { setSinkId?: (id: string) => Promise<void> };
        if (typeof ctxExt.setSinkId === 'function') {
            try {
                await ctxExt.setSinkId(deviceId);
            } catch (err) {
                console.warn(`AudioContext setSinkId failed for ${deviceId}`, err);
            }
        }
    }
}

export default AudioContextManager;
