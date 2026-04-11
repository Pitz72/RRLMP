import AudioContextManager from './AudioContextManager';

export class AudioRecorder {
    private static instance: AudioRecorder | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private chunks: BlobPart[] = [];
    private destinationNode: MediaStreamAudioDestinationNode | null = null;
    private isInitialized = false;

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
        const masterOutput = manager.getMasterOutput();

        this.destinationNode = ctx.createMediaStreamDestination();
        masterOutput.connect(this.destinationNode);
        
        this.isInitialized = true;
        console.log('[AudioRecorder] Initialized and connected to Master Output');
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

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data);
            }
        };

        this.mediaRecorder.start(1000); // chunk every 1 second
        console.log('[AudioRecorder] Recording started');
    }

    public stop(): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
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
