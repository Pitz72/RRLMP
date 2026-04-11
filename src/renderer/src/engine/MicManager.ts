/**
 * MicManager (Singleton) — v0.17.0
 *
 * Gestisce il monitoraggio dell'ingresso microfono via getUserMedia.
 * Il segnale viene analizzato (AnalyserNode) ma NON instradato all'output:
 * nessun rischio di feedback o echo.
 *
 * Noise Gate:
 *  - Attivazione:  livello > activationThresholdDb per activationHoldMs → isMicActive = true
 *  - Rilascio:     livello < releaseThresholdDb   per releaseHoldMs      → isMicActive = false
 *  - Isteresi:     la soglia di rilascio è più bassa di quella di attivazione
 *                  per evitare chattering su voci intermittenti
 *
 * Integrazione ducking:
 *  Il callback onActivityChange (chiamato quando isMicActive cambia)
 *  è collegato a useAudioStore.setMicActive() → re-valuta evaluateMix()
 *  esattamente come farebbe una clip voice con duckingRole: 'source'.
 */

export type MicActivityCallback = (isMicActive: boolean) => void;
export type MicLevelCallback = (dbFS: number) => void;

class MicManager {
    private static instance: MicManager;

    private stream: MediaStream | null = null;
    private analyser: AnalyserNode | null = null;
    private audioCtx: AudioContext | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private micGain: GainNode | null = null;
    private pollHandle: ReturnType<typeof setInterval> | null = null;

    private activityListeners: MicActivityCallback[] = [];
    private levelListeners: MicLevelCallback[] = [];

    private _isArmed = false;
    private _isMicActive = false;
    private _currentLevel = -100; // dBFS

    // Routing state (v1.0.0+)
    private _mixEnabled = false;
    private _bypassProcessing = false;
    private _volume = 0.8;

    // Noise gate state machine
    private _activationTimer: ReturnType<typeof setTimeout> | null = null;
    private _releaseTimer: ReturnType<typeof setTimeout> | null = null;

    // v1.2.2 — Nodo dedicato per la registrazione (indipendente dal mix monitoring)
    private micRecordingGain: GainNode | null = null;

    // Configurable noise gate parameters
    public activationThresholdDb = -30;  // sopra questa soglia per holdMs → active
    public releaseThresholdDb    = -42;  // sotto questa soglia per holdMs → inactive (isteresi)
    public activationHoldMs      = 10;   // ms per cui il segnale deve superare la soglia (broadcast: reattivo)
    public releaseHoldMs         = 200;  // ms di silenzio prima del rilascio (broadcast: evita pompa ma resta veloce)

    private static readonly POLL_INTERVAL_MS = 40; // ~25fps
    private static readonly FFT_SIZE          = 1024;

    private constructor() {}

    // ─────────────────────────────────────────────────────────────
    //  Singleton
    // ─────────────────────────────────────────────────────────────

    public static getInstance(): MicManager {
        if (!MicManager.instance) {
            MicManager.instance = new MicManager();
        }
        return MicManager.instance;
    }

    // ─────────────────────────────────────────────────────────────
    //  Arm / Disarm
    // ─────────────────────────────────────────────────────────────

    /**
     * Arma il microfono: richiede accesso a getUserMedia e inizia il monitoraggio.
     * @param deviceId  ID dispositivo audio di input (default = 'default')
     * @param threshold Soglia di attivazione in dBFS (default = activationThresholdDb)
     * @param mixOptions Opzioni opzionali per il mix (volume, enable, bypass)
     */
    public async arm(deviceId = 'default', threshold?: number, mixOptions?: { enabled: boolean, volume: number, bypass: boolean }): Promise<void> {
        if (this._isArmed) this._cleanup(); // reset se già armato

        if (threshold !== undefined) this.activationThresholdDb = threshold;
        this.releaseThresholdDb = this.activationThresholdDb - 12; // isteresi fissa 12dB

        if (mixOptions) {
            this._mixEnabled = mixOptions.enabled;
            this._volume = mixOptions.volume;
            this._bypassProcessing = mixOptions.bypass;
        }

        try {
            const constraints: MediaStreamConstraints = {
                audio: {
                    deviceId: deviceId !== 'default' ? { exact: deviceId } : undefined,
                    echoCancellation: false,  // non modificare il segnale
                    noiseSuppression: false,  // vogliamo il segnale raw per il gate
                    autoGainControl:  false,
                },
                video: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Usa il contesto AudioContext già esistente dell'app (evita un secondo context)
            const { default: AudioContextManager } = await import('./AudioContextManager');
            const manager = AudioContextManager.getInstance();
            this.audioCtx = manager.getContext();

            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = MicManager.FFT_SIZE;
            this.analyser.smoothingTimeConstant = 0.1; // basso: risposta rapida per il gate

            this.source = this.audioCtx.createMediaStreamSource(this.stream);
            this.source.connect(this.analyser);

            // v1.0.0+ — Routing al mix master (monitoring)
            this.micGain = this.audioCtx.createGain();
            this.micGain.gain.value = this._mixEnabled ? this._volume : 0;

            this.source.connect(this.micGain);

            if (this._mixEnabled) {
                this._connectToMix();
            }

            // v1.2.2 — Routing al recording bus (sempre attivo quando armato)
            // gain = 0 se mixEnabled (il mic arriva al recording già via master chain)
            // gain = 1 se mixEnabled = false (Rodecaster/hardware monitor: mic solo nel recording)
            const { default: AudioContextManager } = await import('./AudioContextManager');
            const acmForRec = AudioContextManager.getInstance();
            this.micRecordingGain = this.audioCtx.createGain();
            this.micRecordingGain.gain.value = this._mixEnabled ? 0 : 1;
            this.source.connect(this.micRecordingGain);
            this.micRecordingGain.connect(acmForRec.getRecordingBus());

            this._isArmed = true;
            this._isMicActive = false;
            this._currentLevel = -100;

            this.pollHandle = setInterval(() => this._poll(), MicManager.POLL_INTERVAL_MS);
            console.log('[MicManager] Armed —', deviceId, 'Mix:', this._mixEnabled ? 'ON' : 'OFF');

        } catch (err) {
            console.error('[MicManager] arm() failed:', err);
            this._cleanup();
            throw err;
        }
    }

    private async _connectToMix() {
        if (!this.micGain || !this.audioCtx) return;
        
        const { default: AudioContextManager } = await import('./AudioContextManager');
        const manager = AudioContextManager.getInstance();

        try { this.micGain.disconnect(); } catch { /* noop */ }

        if (this._bypassProcessing) {
            // Direct to hardware output (Zero latency, no master effects)
            this.micGain.connect(this.audioCtx.destination);
        } else {
            // Through Master Chain (HPF + Comp + Limiter)
            this.micGain.connect(manager.getOutput());
        }
    }

    /** Aggiorna i parametri di mix a caldo senza riavviare il monitoraggio. */
    public async updateMixSettings(options: { enabled?: boolean, volume?: number, bypass?: boolean }) {
        if (options.enabled !== undefined) this._mixEnabled = options.enabled;
        if (options.volume !== undefined) this._volume = options.volume;
        
        const bypassChanged = options.bypass !== undefined && options.bypass !== this._bypassProcessing;
        if (options.bypass !== undefined) this._bypassProcessing = options.bypass;

        if (this._isArmed && this.micGain) {
            // Applica volume monitoring (rampa fluida 50ms)
            const targetGain = this._mixEnabled ? this._volume : 0;
            this.micGain.gain.setTargetAtTime(targetGain, this.audioCtx!.currentTime, 0.05);

            // Se il bypass è cambiato, ricollega il nodo monitoring
            if (bypassChanged && this._mixEnabled) {
                this._connectToMix();
            } else if (this._mixEnabled && !this.micGain.numberOfOutputs) {
                this._connectToMix();
            }

            // v1.2.2 — Aggiorna il recording gain: diretto se non in monitoring mix
            if (this.micRecordingGain) {
                const recGain = this._mixEnabled ? 0 : 1;
                this.micRecordingGain.gain.setTargetAtTime(recGain, this.audioCtx!.currentTime, 0.05);
            }
        }
    }

    /**
     * Disarma il microfono: ferma il monitoraggio e rilascia il MediaStream.
     */
    public disarm(): void {
        this._cleanup();
        if (this._isMicActive) {
            this._isMicActive = false;
            this.activityListeners.forEach(cb => cb(false));
        }
        this._currentLevel = -100;
        console.log('[MicManager] Disarmed');
    }

    private _cleanup(): void {
        if (this.pollHandle !== null) {
            clearInterval(this.pollHandle);
            this.pollHandle = null;
        }
        if (this._activationTimer !== null) {
            clearTimeout(this._activationTimer);
            this._activationTimer = null;
        }
        if (this._releaseTimer !== null) {
            clearTimeout(this._releaseTimer);
            this._releaseTimer = null;
        }
        if (this.source) {
            try { this.source.disconnect(); } catch { /* noop */ }
            this.source = null;
        }
        if (this.micGain) {
            try { this.micGain.disconnect(); } catch { /* noop */ }
            this.micGain = null;
        }
        if (this.micRecordingGain) {
            try { this.micRecordingGain.disconnect(); } catch { /* noop */ }
            this.micRecordingGain = null;
        }
        if (this.analyser) {
            try { this.analyser.disconnect(); } catch { /* noop */ }
            this.analyser = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        this._isArmed = false;
    }

    // ─────────────────────────────────────────────────────────────
    //  Polling & Noise Gate
    // ─────────────────────────────────────────────────────────────

    private _poll(): void {
        if (!this.analyser) return;

        const buf = new Float32Array(this.analyser.fftSize);
        this.analyser.getFloatTimeDomainData(buf);

        // RMS → dBFS
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        const db  = rms > 0.0000001 ? 20 * Math.log10(rms) : -100;

        this._currentLevel = db;
        this.levelListeners.forEach(cb => cb(db));

        // Noise Gate — macchina a stati
        if (!this._isMicActive) {
            // Stato: SILENZIO — aspetta attivazione
            if (db > this.activationThresholdDb) {
                if (!this._activationTimer) {
                    this._activationTimer = setTimeout(() => {
                        this._activationTimer = null;
                        this._setActive(true);
                    }, this.activationHoldMs);
                }
            } else {
                if (this._activationTimer) {
                    clearTimeout(this._activationTimer);
                    this._activationTimer = null;
                }
            }
        } else {
            // Stato: VOCE ATTIVA — aspetta rilascio
            if (db < this.releaseThresholdDb) {
                if (!this._releaseTimer) {
                    this._releaseTimer = setTimeout(() => {
                        this._releaseTimer = null;
                        this._setActive(false);
                    }, this.releaseHoldMs);
                }
            } else {
                // Segnale sopra soglia di rilascio: cancella il timer di release
                if (this._releaseTimer) {
                    clearTimeout(this._releaseTimer);
                    this._releaseTimer = null;
                }
            }
        }
    }

    private _setActive(active: boolean): void {
        if (this._isMicActive === active) return;
        this._isMicActive = active;
        this.activityListeners.forEach(cb => cb(active));
    }

    // ─────────────────────────────────────────────────────────────
    //  Listeners
    // ─────────────────────────────────────────────────────────────

    /** Sottoscrive alla variazione di stato voce (attiva/silenziosa). */
    public addActivityListener(cb: MicActivityCallback): () => void {
        this.activityListeners.push(cb);
        return () => { this.activityListeners = this.activityListeners.filter(l => l !== cb); };
    }

    /** Sottoscrive al livello dBFS in tempo reale (~25fps). */
    public addLevelListener(cb: MicLevelCallback): () => void {
        this.levelListeners.push(cb);
        return () => { this.levelListeners = this.levelListeners.filter(l => l !== cb); };
    }

    // ─────────────────────────────────────────────────────────────
    //  Getters
    // ─────────────────────────────────────────────────────────────

    public isArmed(): boolean       { return this._isArmed;      }
    public isMicSpeaking(): boolean { return this._isMicActive;  }
    public getCurrentLevel(): number { return this._currentLevel; }
}

export default MicManager;
