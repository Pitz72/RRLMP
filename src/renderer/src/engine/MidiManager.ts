import { debugLog } from '../store/useDebugStore';

export type MidiMessageCallback = (note: number, velocity: number, command: number) => void;
export type MidiStatusCallback = (supported: boolean, inputCount: number) => void;

// Local interface to avoid 'any' and handle missing @types/webmidi
// We use a safe cast below to access WebMidi API without polluting Navigator
interface MidiEvent extends Event {
    data: Uint8Array;
}

interface MidiPort extends EventTarget {
    type: 'input' | 'output';
    state: 'connected' | 'disconnected';
    onmidimessage: ((event: MidiEvent) => void) | null;
}

interface MidiAccess extends EventTarget {
    inputs: Map<string, MidiPort>;
    onstatechange: ((event: { port: MidiPort }) => void) | null;
}

class MidiManager {
    private static instance: MidiManager | null = null;
    private listeners: MidiMessageCallback[] = [];
    private statusListeners: MidiStatusCallback[] = [];
    private access: MidiAccess | null = null;
    private _supported = false;
    private _inputCount = 0;

    private constructor() {
        const nav = navigator as unknown as { requestMIDIAccess?: () => Promise<any> };
        if (nav.requestMIDIAccess) {
            this.init();
        } else {
            // M2 Fix: segnala anche visualmente che MIDI non è disponibile.
            // MIDI-03 (v1.3.2): debugLog strutturato invece di console.warn (pattern LI-03).
            debugLog('MIDI API non disponibile in questo ambiente', 'error');
            this._notifyStatus(false, 0);
        }
    }

    public static getInstance(): MidiManager {
        if (!MidiManager.instance) {
            MidiManager.instance = new MidiManager();
        }
        return MidiManager.instance;
    }

    public static destroy(): void {
        if (MidiManager.instance) {
            if (MidiManager.instance.access) {
                MidiManager.instance.access.inputs.forEach((input: MidiPort) => {
                    input.onmidimessage = null;
                });
                MidiManager.instance.access.onstatechange = null;
                MidiManager.instance.access = null;
            }
            MidiManager.instance.listeners = [];
            MidiManager.instance.statusListeners = [];
        }
        MidiManager.instance = null;
    }

    private async init() {
        try {
            const nav = navigator as unknown as { requestMIDIAccess?: () => Promise<any> };
            this.access = await nav.requestMIDIAccess!();
            if (this.access) {
                // Listen to existing inputs
                this.access.inputs.forEach((input: MidiPort) => {
                    input.onmidimessage = this.handleMidiMessage.bind(this);
                });

                // Listen for new connections
                this.access.onstatechange = (e: { port: MidiPort }) => {
                    if (e.port.type === 'input') {
                        if (e.port.state === 'connected') {
                            e.port.onmidimessage = this.handleMidiMessage.bind(this);
                        } else if (e.port.state === 'disconnected') {
                            // MIDI-01 (v1.3.2): azzera onmidimessage sulla porta disconnessa.
                            // Senza questo, alla riconnessione della STESSA porta il browser può
                            // mantenere il listener precedente E aggiungere il nuovo bind → ogni
                            // nota MIDI verrebbe processata due volte (trigger duplicato).
                            e.port.onmidimessage = null;
                        }
                    }
                    // Aggiorna il conteggio ad ogni cambio di stato
                    if (this.access) {
                        this._inputCount = this.access.inputs.size;
                        this._notifyStatus(true, this._inputCount);
                    }
                };

                this._supported = true;
                this._inputCount = this.access.inputs.size;
                // M2 Fix: notifica listeners (incluso UI)
                this._notifyStatus(true, this._inputCount);
            }
        } catch (err) {
            // MIDI-03 (v1.3.2): debugLog strutturato invece di console.error (pattern LI-03).
            debugLog(`MIDI Init Failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
            this._notifyStatus(false, 0);
        }
    }

    private _notifyStatus(supported: boolean, inputCount: number) {
        this._supported = supported;
        this._inputCount = inputCount;
        this.statusListeners.forEach(fn => fn(supported, inputCount));
    }

    private handleMidiMessage(event: MidiEvent) {
        const [command, note, velocity] = event.data;
        // AUDIT-ME (2026-05-29): il nibble basso del command byte è il CANALE MIDI (1-16).
        // Prima si confrontava `command === 144`/`176` = solo canale 1 → controller su
        // qualsiasi altro canale venivano ignorati. Ora si maschera il nibble alto
        // (& 0xF0) per riconoscere Note On (0x9n) e Control Change (0xBn) su tutti i 16
        // canali. Note Off (0x8n) e Note On con velocity 0 restano filtrati (no trigger).
        const status = command & 0xf0;
        if ((status === 0x90 && velocity > 0) || status === 0xb0) {
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
