/**
 * AudioContextManager (Singleton)
 *
 * Manages the global Web Audio API context and the main routing graph.
 *
 * Audio Graph Topology (v0.16.2 — Master Chain):
 *
 *   Bus (Music/Voice/SFX/Assets)
 *       → masterGain
 *           → HPF (HighPassFilter, 80 Hz, bypass via 'allpass')
 *               → Compressor (broadcast: -18 dBFS, 4:1, 5 ms / 200 ms)
 *                   → Limiter (brickwall: -1 dBFS, 20:1, 1 ms / 100 ms)
 *                       → destination
 *                       → ChannelSplitter → AnalyserL, AnalyserR
 *
 * Quando masterChainEnabled = false ogni stadio è bypassato tramite
 * parametri neutri (HPF → allpass, Compressor/Limiter → threshold 0 / ratio 1).
 */

export interface MasterChainSettings {
    enabled: boolean;
    hpfEnabled: boolean;
    hpfFrequency: number;        // Hz  — default 80
    compressorEnabled: boolean;
    compressorThreshold: number; // dBFS — default -18
    compressorRatio: number;     // default 4
    limiterThreshold: number;    // dBFS — default -1
}

export const DEFAULT_MASTER_CHAIN: MasterChainSettings = {
    enabled: true,
    hpfEnabled: true,
    hpfFrequency: 80,
    compressorEnabled: true,
    compressorThreshold: -18,
    compressorRatio: 4,
    limiterThreshold: -1,
};

class AudioContextManager {
    private static instance: AudioContextManager;
    private context: AudioContext;
    private masterGain: GainNode;
    private hpf: BiquadFilterNode;
    private compressor: DynamicsCompressorNode;
    private limiter: DynamicsCompressorNode;
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

        // --- 1. Master Gain ---
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 1.0;

        // --- 2. HPF (High-Pass Filter) ---
        this.hpf = this.context.createBiquadFilter();
        this.hpf.type = 'highpass';
        this.hpf.frequency.value = DEFAULT_MASTER_CHAIN.hpfFrequency;
        this.hpf.Q.value = 0.7;

        // --- 3. Broadcast Compressor ---
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.value = DEFAULT_MASTER_CHAIN.compressorThreshold;
        this.compressor.knee.value = 6;
        this.compressor.ratio.value = DEFAULT_MASTER_CHAIN.compressorRatio;
        this.compressor.attack.value = 0.005;  // 5 ms
        this.compressor.release.value = 0.200; // 200 ms

        // --- 4. Brickwall Limiter ---
        this.limiter = this.context.createDynamicsCompressor();
        this.limiter.threshold.value = DEFAULT_MASTER_CHAIN.limiterThreshold;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.001;  // 1 ms
        this.limiter.release.value = 0.100; // 100 ms

        // --- 5. Metering ---
        this.splitter = this.context.createChannelSplitter(2);
        this.analyserL = this.context.createAnalyser();
        this.analyserR = this.context.createAnalyser();
        this.analyserL.fftSize = 64;
        this.analyserR.fftSize = 64;
        this.analyserL.smoothingTimeConstant = 0.8;
        this.analyserR.smoothingTimeConstant = 0.8;

        // --- Wiring: masterGain → HPF → Compressor → Limiter → destination + splitter ---
        this.masterGain.connect(this.hpf);
        this.hpf.connect(this.compressor);
        this.compressor.connect(this.limiter);
        this.limiter.connect(this.context.destination);
        this.limiter.connect(this.splitter);
        this.splitter.connect(this.analyserL, 0);
        this.splitter.connect(this.analyserR, 1);

        // --- 6. Buses ---
        this.musicBus = this.context.createGain();
        this.voiceBus = this.context.createGain();
        this.sfxBus = this.context.createGain();
        this.assetsBus = this.context.createGain();
        this.musicBus.gain.value = 1.0;
        this.voiceBus.gain.value = 1.0;
        this.sfxBus.gain.value = 1.0;
        this.assetsBus.gain.value = 1.0;

        this.musicBus.connect(this.masterGain);
        this.voiceBus.connect(this.masterGain);
        this.sfxBus.connect(this.masterGain);
        this.assetsBus.connect(this.masterGain);
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

    // -------------------------------------------------------------------------
    // Volume Master
    // -------------------------------------------------------------------------

    public setMasterVolume(value: number): void {
        const clampedValue = Math.max(0, Math.min(1, value));
        this.masterGain.gain.setTargetAtTime(clampedValue, this.context.currentTime, 0.1);
    }

    // -------------------------------------------------------------------------
    // Master Chain Controls
    // -------------------------------------------------------------------------

    /** Applica in blocco tutte le impostazioni della chain. */
    public applyMasterChainSettings(s: MasterChainSettings): void {
        // HPF
        if (!s.enabled || !s.hpfEnabled) {
            this.hpf.type = 'allpass'; // pass-through neutro
        } else {
            this.hpf.type = 'highpass';
            this.hpf.frequency.setTargetAtTime(s.hpfFrequency, this.context.currentTime, 0.05);
        }

        // Compressor
        if (!s.enabled || !s.compressorEnabled) {
            // Ratio 1:1 = pass-through; threshold a 0 per non intervenire mai
            this.compressor.threshold.setTargetAtTime(0, this.context.currentTime, 0.05);
            this.compressor.ratio.setTargetAtTime(1, this.context.currentTime, 0.05);
        } else {
            this.compressor.threshold.setTargetAtTime(s.compressorThreshold, this.context.currentTime, 0.05);
            this.compressor.ratio.setTargetAtTime(s.compressorRatio, this.context.currentTime, 0.05);
        }

        // Limiter — sempre presente quando la chain è attiva (sicurezza broadcast)
        if (!s.enabled) {
            this.limiter.threshold.setTargetAtTime(0, this.context.currentTime, 0.05);
            this.limiter.ratio.setTargetAtTime(1, this.context.currentTime, 0.05);
        } else {
            this.limiter.threshold.setTargetAtTime(s.limiterThreshold, this.context.currentTime, 0.05);
            this.limiter.ratio.setTargetAtTime(20, this.context.currentTime, 0.05);
        }
    }

    /** Legge il valore di riduzione (gain reduction) del compressor in dB. */
    public getCompressorReduction(): number {
        return this.compressor.reduction;
    }

    /** Legge il valore di riduzione (gain reduction) del limiter in dB. */
    public getLimiterReduction(): number {
        return this.limiter.reduction;
    }

    // -------------------------------------------------------------------------
    // Output Device
    // -------------------------------------------------------------------------

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
