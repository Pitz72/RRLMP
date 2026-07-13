/**
 * AudioContextManager (Singleton)
 *
 * Manages the global Web Audio API context and the main routing graph.
 *
 * Audio Graph Topology (v1.4.2 — Master Glue Multibanda):
 *
 *   Bus (Music/Voice/SFX/Assets)
 *       → masterGain
 *           → HPF (HighPassFilter, 30 Hz, bypass via 'allpass')
 *               ├─ WET: crossover LR4 (3 bande) → 3 compressori gentili → mbSum(0.47) → wetGain
 *               └─ DRY: passthrough pulito                                            → dryGain
 *                       (wetGain/dryGain in mutua esclusione: glue ON = wet, glue OFF = dry)
 *                   → preLimiter
 *                       → Limiter (brickwall: -1 dBFS, 20:1, 2 ms / 100 ms)
 *                           → destination
 *                           → ChannelSplitter → AnalyserL, AnalyserR
 *                           → recordingBus
 *
 * NOTA DI PROGETTO (v1.4.2): il `DynamicsCompressorNode` di Chromium applica un
 * makeup gain implicito anche a ratio 1 → mettere i compressori in "pass-through"
 * NON è neutro (verificato: +4 LU e clipping). Per questo i 3 compressori di banda
 * sono SEMPRE configurati con i parametri glue e SEMPRE nel grafo; quando il glue è
 * disattivo si AGGIRANO azzerando `wetGain` e aprendo `dryGain` (passthrough reale),
 * non toccando mai i loro parametri quando il glue è spento. Il preset multibanda
 * di default ('neutro') è tarato offline (livello neutro ±0.5 LU, riduzione LRA
 * gentile ~0.6 LU, true peak sicuro). Da v1.7.0 è selezionabile uno stile diverso
 * (rock/jazz/elettronico, vedi MB_STYLE_PRESETS) che applica live altri parametri
 * ai 3 compressori — 'neutro' resta il default, zero regressione per chi non lo cambia.
 *
 * Quando masterChainEnabled = false: HPF→allpass, dry path attivo, limiter→passthrough
 * (ratio 1 / threshold 0, knee 0) → catena trasparente, identica al segnale d'ingresso.
 */

export type CompressorStyle = 'neutro' | 'rock' | 'jazz' | 'elettronico';

export interface MasterChainSettings {
    enabled: boolean;
    hpfEnabled: boolean;
    hpfFrequency: number;        // Hz  — default 30
    compressorEnabled: boolean;  // abilita il Glue Multibanda (wet path)
    compressorThreshold: number; // dBFS — vestigiale (preset multibanda fisso), mantenuto per compat persistenza
    compressorRatio: number;     // vestigiale (preset multibanda fisso)
    compressorStyle: CompressorStyle; // colore del Glue Multibanda (v1.7.0), default 'neutro'
    limiterThreshold: number;    // dBFS — default -1
}

export const DEFAULT_MASTER_CHAIN: MasterChainSettings = {
    enabled: true,
    hpfEnabled: true,
    hpfFrequency: 30,
    compressorEnabled: true,
    compressorThreshold: -24,
    compressorRatio: 2,
    compressorStyle: 'neutro',
    limiterThreshold: -1,
};

type MbBand = { threshold: number; ratio: number; knee: number; attack: number; release: number };

// --- Preset Glue Multibanda ---
// 'neutro' è il preset ORIGINALE (v1.4.2/v1.4.3), tarato offline con misura oggettiva
// (test A/B loudness/LUFS, vedi audit qualità audio 2026-06-05/06): è il default e resta
// invariato, zero rischio di regressione per chi non tocca la nuova selezione stile.
// rock/jazz/elettronico (v1.7.0) sono varianti additive DA VERIFICARE IN REGIA con
// ascolto reale prima di considerarle definitive — valori di partenza plausibili
// (più densità/attack per rock ed elettronico, più trasparenza/release lento per jazz),
// NON ancora misurati con lo stesso rigore oggettivo del preset neutro.
const MB_STYLE_PRESETS: Record<CompressorStyle, { outGain: number; low: MbBand; mid: MbBand; high: MbBand }> = {
    neutro: {
        outGain: 0.47,
        low:  { threshold: -30, ratio: 2.0, knee: 12, attack: 0.012, release: 0.25 },
        mid:  { threshold: -26, ratio: 2.0, knee: 14, attack: 0.015, release: 0.20 },
        high: { threshold: -30, ratio: 1.6, knee: 14, attack: 0.006, release: 0.15 },
    },
    rock: {
        outGain: 0.42,
        low:  { threshold: -26, ratio: 2.8, knee: 8,  attack: 0.008, release: 0.18 },
        mid:  { threshold: -22, ratio: 2.6, knee: 10, attack: 0.010, release: 0.14 },
        high: { threshold: -26, ratio: 2.0, knee: 10, attack: 0.004, release: 0.10 },
    },
    jazz: {
        outGain: 0.50,
        low:  { threshold: -32, ratio: 1.6, knee: 16, attack: 0.020, release: 0.35 },
        mid:  { threshold: -28, ratio: 1.5, knee: 16, attack: 0.020, release: 0.30 },
        high: { threshold: -32, ratio: 1.3, knee: 16, attack: 0.010, release: 0.25 },
    },
    elettronico: {
        outGain: 0.40,
        low:  { threshold: -24, ratio: 3.0, knee: 6, attack: 0.006, release: 0.12 },
        mid:  { threshold: -20, ratio: 2.8, knee: 8, attack: 0.008, release: 0.10 },
        high: { threshold: -24, ratio: 2.2, knee: 8, attack: 0.003, release: 0.08 },
    },
};

const MB_PRESET = {
    xLow: 200,        // Hz — crossover basse/medie (condiviso da tutti gli stili)
    xHigh: 2500,       // Hz — crossover medie/alte (condiviso da tutti gli stili)
    smooth: 0.02,     // costante di tempo per switch wet/dry e cambio stile, click-free
    ...MB_STYLE_PRESETS.neutro,
};

class AudioContextManager {
    private static instance: AudioContextManager | null = null;
    private context: AudioContext;
    private masterGain: GainNode;
    private hpf: BiquadFilterNode;

    // Glue multibanda (wet)
    private compLow: DynamicsCompressorNode;
    private compMid: DynamicsCompressorNode;
    private compHigh: DynamicsCompressorNode;
    private mbSum: GainNode;
    private wetGain: GainNode;
    private dryGain: GainNode;
    private preLimiter: GainNode;

    private limiter: DynamicsCompressorNode;
    private analyserL: AnalyserNode;
    private analyserR: AnalyserNode;
    private splitter: ChannelSplitterNode;
    private recordingBus: GainNode; // v1.2.2 — tap point per recording (clips + mic direct)

    // Buses
    private musicBus: GainNode;
    private voiceBus: GainNode;
    private sfxBus: GainNode;
    private assetsBus: GainNode;

    private constructor() {
        const WindowContext = window as unknown as { webkitAudioContext: typeof AudioContext };
        const AudioContextClass = (window.AudioContext || WindowContext.webkitAudioContext) as typeof AudioContext;
        this.context = new AudioContextClass();
        const ctx = this.context;

        // --- 1. Master Gain ---
        this.masterGain = ctx.createGain();
        this.masterGain.gain.value = 1.0;

        // --- 2. HPF (High-Pass Filter) ---
        this.hpf = ctx.createBiquadFilter();
        this.hpf.type = 'highpass';
        this.hpf.frequency.value = DEFAULT_MASTER_CHAIN.hpfFrequency;
        this.hpf.Q.value = 0.7;

        // --- 3. Crossover LR4 (cascata di 2 biquad Q=0.7071 per ramo) ---
        const lr = (type: BiquadFilterType, freq: number): [BiquadFilterNode, BiquadFilterNode] => {
            const a = ctx.createBiquadFilter(); const b = ctx.createBiquadFilter();
            a.type = type; b.type = type; a.frequency.value = freq; b.frequency.value = freq;
            a.Q.value = 0.7071; b.Q.value = 0.7071; a.connect(b);
            return [a, b];
        };
        const [lowLPa, lowLPb] = lr('lowpass', MB_PRESET.xLow);
        const [highHPa, highHPb] = lr('highpass', MB_PRESET.xHigh);
        const [midHPa, midHPb] = lr('highpass', MB_PRESET.xLow);
        const [midLPa, midLPb] = lr('lowpass', MB_PRESET.xHigh);
        midHPb.connect(midLPa); // banda media: HP(xLow) → LP(xHigh)

        // --- 4. Compressori di banda (gentili, SEMPRE configurati glue) ---
        const mkComp = (p: { threshold: number; ratio: number; knee: number; attack: number; release: number }) => {
            const c = ctx.createDynamicsCompressor();
            c.threshold.value = p.threshold; c.ratio.value = p.ratio; c.knee.value = p.knee;
            c.attack.value = p.attack; c.release.value = p.release;
            return c;
        };
        this.compLow = mkComp(MB_PRESET.low);
        this.compMid = mkComp(MB_PRESET.mid);
        this.compHigh = mkComp(MB_PRESET.high);

        // --- 5. Somma bande (wet) + gain calibrazione ---
        this.mbSum = ctx.createGain();
        this.mbSum.gain.value = MB_PRESET.outGain;
        lowLPb.connect(this.compLow);   this.compLow.connect(this.mbSum);
        midLPb.connect(this.compMid);   this.compMid.connect(this.mbSum);
        highHPb.connect(this.compHigh); this.compHigh.connect(this.mbSum);

        // --- 6. Mix wet/dry (mutua esclusione) ---
        this.wetGain = ctx.createGain();
        this.dryGain = ctx.createGain();
        this.preLimiter = ctx.createGain();
        // default chain attiva + glue attivo
        this.wetGain.gain.value = 1.0;
        this.dryGain.gain.value = 0.0;
        this.mbSum.connect(this.wetGain);
        this.wetGain.connect(this.preLimiter);
        this.dryGain.connect(this.preLimiter);

        // --- 7. Brickwall Limiter ---
        this.limiter = ctx.createDynamicsCompressor();
        this.limiter.threshold.value = DEFAULT_MASTER_CHAIN.limiterThreshold;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.002;  // 2 ms
        this.limiter.release.value = 0.100; // 100 ms

        // --- 8. Metering ---
        this.splitter = ctx.createChannelSplitter(2);
        this.analyserL = ctx.createAnalyser();
        this.analyserR = ctx.createAnalyser();
        // v1.15.13: 64 → 2048. Con fftSize 64 la finestra RMS del VU meter era
        // di ~1.3 ms (e il hook ne leggeva metà): su una nota bassa il valore
        // rimbalzava a caso secondo la fase campionata. 2048 campioni ≈ 43 ms
        // @48kHz: balistica da VU reale. NB: smoothingTimeConstant agisce SOLO
        // sui dati in frequenza (per specifica Web Audio), non sul time-domain
        // letto dal meter.
        this.analyserL.fftSize = 2048;
        this.analyserR.fftSize = 2048;
        this.analyserL.smoothingTimeConstant = 0.8;
        this.analyserR.smoothingTimeConstant = 0.8;

        // v1.2.2 — Recording bus: riceve il segnale dal limiter + mic diretto (quando mixEnabled=false)
        this.recordingBus = ctx.createGain();
        this.recordingBus.gain.value = 1.0;

        // --- Wiring principale ---
        this.masterGain.connect(this.hpf);
        // WET branch
        this.hpf.connect(lowLPa);
        this.hpf.connect(highHPa);
        this.hpf.connect(midHPa);
        // DRY branch
        this.hpf.connect(this.dryGain);
        // preLimiter → limiter → destination + splitter + recordingBus
        this.preLimiter.connect(this.limiter);
        this.limiter.connect(ctx.destination);
        this.limiter.connect(this.splitter);
        this.limiter.connect(this.recordingBus);
        this.splitter.connect(this.analyserL, 0);
        this.splitter.connect(this.analyserR, 1);

        // --- 9. Buses ---
        this.musicBus = ctx.createGain();
        this.voiceBus = ctx.createGain();
        this.sfxBus = ctx.createGain();
        this.assetsBus = ctx.createGain();
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

    public static destroy(): void {
        if (AudioContextManager.instance) {
            try { AudioContextManager.instance.context.close(); } catch { /* noop */ }
        }
        AudioContextManager.instance = null;
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

    /** Restituisce l'ultimo nodo della catena master (Limiter), utile per il tap point della registrazione.
     * @deprecated Usa getRecordingBus() per il tap della registrazione (include mic diretto).
     */
    public getMasterOutput(): AudioNode {
        return this.limiter;
    }

    /** v1.2.2 — Recording bus: mix di limiter output + mic diretto (quando mixEnabled=false).
     * Questo è il punto di tap corretto per AudioRecorder. */
    public getRecordingBus(): GainNode {
        return this.recordingBus;
    }

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

    /** Applica in blocco tutte le impostazioni della chain, incluso lo stile del
     * Glue Multibanda (v1.7.0): i parametri dei 3 compressori di banda vengono
     * aggiornati live via setTargetAtTime (stesso smoothing del wet/dry switch,
     * transizione click-free) in base a `s.compressorStyle`. */
    public applyMasterChainSettings(s: MasterChainSettings): void {
        const now = this.context.currentTime;
        const t = MB_PRESET.smooth;
        const chainOn = s.enabled;
        const glueOn = s.enabled && s.compressorEnabled;

        // HPF
        if (!chainOn || !s.hpfEnabled) {
            this.hpf.type = 'allpass'; // pass-through neutro
        } else {
            this.hpf.type = 'highpass';
            this.hpf.frequency.setTargetAtTime(s.hpfFrequency, now, 0.05);
        }

        // Glue Multibanda — stile (v1.7.0)
        const style = MB_STYLE_PRESETS[s.compressorStyle] ?? MB_STYLE_PRESETS.neutro;
        const applyBand = (comp: DynamicsCompressorNode, p: MbBand) => {
            comp.threshold.setTargetAtTime(p.threshold, now, t);
            comp.ratio.setTargetAtTime(p.ratio, now, t);
            comp.knee.setTargetAtTime(p.knee, now, t);
            comp.attack.setTargetAtTime(p.attack, now, t);
            comp.release.setTargetAtTime(p.release, now, t);
        };
        applyBand(this.compLow, style.low);
        applyBand(this.compMid, style.mid);
        applyBand(this.compHigh, style.high);
        this.mbSum.gain.setTargetAtTime(style.outGain, now, t);

        // Glue Multibanda — wet/dry in mutua esclusione (click-free)
        this.wetGain.gain.setTargetAtTime(glueOn ? 1 : 0, now, t);
        this.dryGain.gain.setTargetAtTime(glueOn ? 0 : 1, now, t);

        // Limiter — sempre presente quando la chain è attiva (sicurezza broadcast)
        if (!chainOn) {
            this.limiter.threshold.setTargetAtTime(0, now, 0.05);
            this.limiter.ratio.setTargetAtTime(1, now, 0.05);
        } else {
            this.limiter.threshold.setTargetAtTime(s.limiterThreshold, now, 0.05);
            this.limiter.ratio.setTargetAtTime(20, now, 0.05);
        }
    }

    /** Legge la massima riduzione (gain reduction) tra i 3 compressori di banda in dB. */
    public getCompressorReduction(): number {
        return Math.min(this.compLow.reduction, this.compMid.reduction, this.compHigh.reduction);
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
