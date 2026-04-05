export type MidiMessageCallback = (note: number, velocity: number, command: number) => void;
export type MidiStatusCallback = (supported: boolean, inputCount: number) => void;


class MidiManager {
    private static instance: MidiManager;
    private listeners: MidiMessageCallback[] = [];
    private statusListeners: MidiStatusCallback[] = [];
    private access: any = null;
    private _supported = false;
    private _inputCount = 0;

    private constructor() {
        // @ts-ignore
        if (navigator.requestMIDIAccess) {
            this.init();
        } else {
            // M2 Fix: segnala anche visualmente che MIDI non è disponibile
            console.warn("MIDI API not supported in this environment.");
            this._notifyStatus(false, 0);
        }
    }

    public static getInstance(): MidiManager {
        if (!MidiManager.instance) {
            MidiManager.instance = new MidiManager();
        }
        return MidiManager.instance;
    }

    private async init() {
        try {
            // @ts-ignore
            this.access = await navigator.requestMIDIAccess();
            if (this.access) {
                // Listen to existing inputs
                this.access.inputs.forEach((input: any) => {
                    input.onmidimessage = this.handleMidiMessage.bind(this);
                });

                // Listen for new connections
                this.access.onstatechange = (e: any) => {
                    if (e.port.type === 'input' && e.port.state === 'connected') {
                        e.port.onmidimessage = this.handleMidiMessage.bind(this);
                    }
                    // Aggiorna il conteggio ad ogni cambio di stato
                    this._inputCount = this.access.inputs.size;
                    this._notifyStatus(true, this._inputCount);
                };

                this._supported = true;
                this._inputCount = this.access.inputs.size;
                console.log("MIDI System Initialized. Inputs found:", this._inputCount);
                // M2 Fix: notifica listeners (incluso UI)
                this._notifyStatus(true, this._inputCount);
            }
        } catch (err) {
            // M2 Fix: log nel debug store visibile in UI + console
            console.error("MIDI Init Failed:", err);
            this._notifyStatus(false, 0);
        }
    }

    private _notifyStatus(supported: boolean, inputCount: number) {
        this._supported = supported;
        this._inputCount = inputCount;
        this.statusListeners.forEach(fn => fn(supported, inputCount));
    }

    private handleMidiMessage(event: any) {
        const [command, note, velocity] = event.data;
        // Command 144 (0x90) is Note On.
        // Some devices send Note On with 0 velocity as Note Off. We filter those.
        if ((command === 144 && velocity > 0) || command === 176) {
            this.listeners.forEach(fn => fn(note, velocity, command));
        }
    }

    public addListener(callback: MidiMessageCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /** M2: sottoscrive a notifiche di stato MIDI (supportato/non supportato, n. input) */
    public addStatusListener(callback: MidiStatusCallback) {
        this.statusListeners.push(callback);
        // Se già inizializzato, notifica subito lo stato attuale
        if (this._supported !== undefined) {
            callback(this._supported, this._inputCount);
        }
        return () => {
            this.statusListeners = this.statusListeners.filter(l => l !== callback);
        };
    }

    public isSupported(): boolean { return this._supported; }
    public getInputCount(): number { return this._inputCount; }
}

export default MidiManager;
