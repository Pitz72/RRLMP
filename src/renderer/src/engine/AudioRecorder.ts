import AudioContextManager from './AudioContextManager';

// REC-03 (v1.3.1): cap FIFO chunks per evitare OOM su sessioni broadcast molto lunghe.
// 14400 chunk × 1s = 4h di registrazione massima. Oltre il cap viene emesso un evento
// che il store usa per interrompere la sessione in modo pulito (no drop di audio).
const MAX_RECORDING_CHUNKS = 14400;

export class AudioRecorder {
    private static instance: AudioRecorder | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private chunks: BlobPart[] = [];
    private destinationNode: MediaStreamAudioDestinationNode | null = null;
    private isInitialized = false;
    private capReached = false;

    private constructor() {
        // Singleton
    }

    public static getInstance(): AudioRecorder {
        if (!AudioRecorder.instance) {
            AudioRecorder.instance = new AudioRecorder();
        }
        return AudioRecorder.instance;
    }

    /**
     * Initializes the recorder by connecting a MediaStreamDestination to the master output.
     */
    public initialize(): void {
        if (this.isInitialized) return;

        const manager = AudioContextManager.getInstance();
        const ctx = manager.getContext();

        this.destinationNode = ctx.createMediaStreamDestination();
        // v1.2.2: tap sul recordingBus (limiter output + mic diretto se mixEnabled=false)
        manager.getRecordingBus().connect(this.destinationNode);

        this.isInitialized = true;
        console.log('[AudioRecorder] Initialized and connected to RecordingBus');
    }

    public start(): void {
        if (!this.isInitialized || !this.destinationNode) {
            throw new Error('AudioRecorder not initialized. Call initialize() first.');
        }

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            console.warn('[AudioRecorder] Already recording');
            return;
        }

        this.chunks = [];
        this.capReached = false;

        // Broadcast quality settings: 320kbps Opus in WebM container
        const options: MediaRecorderOptions = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 320000 
        };

        try {
            this.mediaRecorder = new MediaRecorder(this.destinationNode.stream, options);
        } catch (e) {
            console.error('[AudioRecorder] MediaRecorder creation failed with options, trying default', e);
            this.mediaRecorder = new MediaRecorder(this.destinationNode.stream);
        }

        // REC-08 (v1.3.1): try/catch difensivo — un chunk malformato non deve uccidere il recorder.
        // REC-03 (v1.3.1): cap FIFO + evento di stop pulito su overflow.
        this.mediaRecorder.ondataavailable = (e) => {
            try {
                if (e.data && e.data.size > 0) {
                    if (this.chunks.length >= MAX_RECORDING_CHUNKS) {
                        if (!this.capReached) {
                            this.capReached = true;
                            console.error(`[AudioRecorder] Cap chunks raggiunto (${MAX_RECORDING_CHUNKS}). Stop forzato per evitare OOM.`);
                            try {
                                window.dispatchEvent(new CustomEvent('audiorecorder:cap-reached'));
                            } catch { /* noop */ }
                        }
                        return;
                    }
                    this.chunks.push(e.data);
                }
            } catch (err) {
                console.error('[AudioRecorder] ondataavailable error:', err);
            }
        };

        this.mediaRecorder.start(1000); // chunk every 1 second
        console.log('[AudioRecorder] Recording started');
    }

    public stop(): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            // GRAVE #5 (audit 2026-05-29): se il recorder è già fermo (doppio-stop, oppure
            // cap-reached che ha già scatenato uno stop), NON rigettare scartando l'audio:
            // restituisci i chunk raccolti finora. Evita di perdere la registrazione della puntata.
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                if (this.chunks.length > 0) {
                    const blob = new Blob(this.chunks, { type: 'audio/webm' });
                    blob.arrayBuffer()
                        .then(ab => { this.chunks = []; resolve(ab); })
                        .catch(reject);
                    return;
                }
                return reject('Recorder not active');
            }

            this.mediaRecorder.onstop = async () => {
                console.log(`[AudioRecorder] Recording stopped. Chunks collected: ${this.chunks.length}`);
                const blob = new Blob(this.chunks, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                this.chunks = []; // Clear memory
                resolve(arrayBuffer);
            };

            this.mediaRecorder.stop();
        });
    }

    public isRecording(): boolean {
        return this.mediaRecorder?.state === 'recording';
    }

    public getStatus(): 'inactive' | 'recording' | 'paused' {
        return this.mediaRecorder ? this.mediaRecorder.state : 'inactive';
    }
}

export default AudioRecorder;
