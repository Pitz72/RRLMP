import { create } from 'zustand';
import AudioRecorder from '../engine/AudioRecorder';

// GRAVE #5 (audit 2026-05-29): flag anti-doppio-stop. Click "Stop" + evento cap-reached
// possono chiamare stopRecording() in parallelo: la seconda chiamata troverebbe il recorder
// inattivo e nel catch resetterebbe tempPath, scartando la registrazione appena conclusa.
let _stopInFlight = false;

interface RecordingState {
    isRecording: boolean;
    isConverting: boolean;
    startTime: number | null;
    elapsedSeconds: number;
    tempPath: string | null;
    timerIntervalId: number | null;

    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    exportRecording: (options: { format: 'wav' | 'mp3' | 'flac' | 'ogg' | 'webm'; bitrate?: number; sampleDepth?: 16 | 24 | 32 }) => Promise<{ success: boolean; path?: string; error?: string }>;
    cancelExport: () => Promise<void>;
    reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
    isRecording: false,
    isConverting: false,
    startTime: null,
    elapsedSeconds: 0,
    tempPath: null,
    timerIntervalId: null,

    startRecording: async () => {
        // REC-04 (v1.3.1): reset esplicito di tempPath/elapsed PRIMA di avviare —
        // evita di riusare uno stato corrotto da uno stop fallito precedente.
        // AUDIT-ME (2026-05-29): azzera anche il flag module-level _stopInFlight. Se un
        // precedente stopRecording fosse rimasto appeso (o lo store fosse stato ricreato
        // da un hot-reload), un flag bloccato impedirebbe per sempre di fermare le sessioni
        // successive. Una nuova sessione riparte sempre da stato pulito.
        _stopInFlight = false;
        const prev = get();
        if (prev.timerIntervalId) window.clearInterval(prev.timerIntervalId);
        set({
            isRecording: false,
            isConverting: false,
            startTime: null,
            elapsedSeconds: 0,
            tempPath: null,
            timerIntervalId: null
        });

        const recorder = AudioRecorder.getInstance();
        recorder.initialize();

        try {
            await recorder.start();

            const intervalId = window.setInterval(() => {
                set((state) => ({
                    elapsedSeconds: state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0
                }));
            }, 1000);

            set({
                isRecording: true,
                isConverting: false,
                startTime: Date.now(),
                elapsedSeconds: 0,
                timerIntervalId: intervalId
            });

        } catch (error) {
            console.error('[RecordingStore] Failed to start recording:', error);
            throw error;
        }
    },

    stopRecording: async () => {
        const { isRecording, timerIntervalId } = get();
        if (!isRecording || _stopInFlight) return;
        _stopInFlight = true;

        const recorder = AudioRecorder.getInstance();

        if (timerIntervalId) {
            window.clearInterval(timerIntervalId);
        }

        try {
            // stop() ritorna ArrayBuffer — lo salviamo su disco via IPC per ottenere un path
            const arrayBuffer = await recorder.stop();
            const saveResult = await window.electron.saveRecordingBuffer(arrayBuffer);
            if (!saveResult.success) throw new Error(saveResult.error || 'Failed to save buffer');
            set({
                isRecording: false,
                startTime: null,
                tempPath: saveResult.path,
                timerIntervalId: null
            });
        } catch (error) {
            // REC-04 (v1.3.1): stop fallito → reset COMPLETO di tempPath/elapsed/startTime,
            // così la sessione successiva parte pulita.
            console.error('[RecordingStore] Failed to stop recording:', error);
            set({
                isRecording: false,
                startTime: null,
                elapsedSeconds: 0,
                tempPath: null,
                timerIntervalId: null
            });
        } finally {
            _stopInFlight = false;
        }
    },

    exportRecording: async ({ format, bitrate, sampleDepth }) => {
        const { tempPath } = get();
        if (!tempPath) return { success: false, error: 'No recording to export' };

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        // REC-07 (v1.3.1): sanitize caratteri illegali Windows (: < > ? " | * / \).
        // Difesa in profondità: i template attuali non li producono, ma se in futuro si aggiungono
        // suffissi dinamici (es. nome show) il dialog non fallirà più con "filename non valido".
        const rawName = `RLMP_REC_${dateStr}_${timeStr}.${format}`;
        const defaultName = rawName.replace(/[:<>?"|*\\/]/g, '_');

        const result = await window.electron.showSaveDialogRecording(defaultName, format);
        if (result.canceled || !result.filePath) {
            return { success: false, error: 'Canceled by user' };
        }

        set({ isConverting: true });

        try {
            const convResult = await window.electron.convertRecording(
                tempPath,
                result.filePath,
                { format, bitrate, sampleDepth }
            );

            if (convResult.success) {
                set({ isConverting: false, tempPath: null, elapsedSeconds: 0 });
            } else {
                set({ isConverting: false });
            }

            return { success: convResult.success, path: result.filePath, error: convResult.error };

        } catch (error) {
            set({ isConverting: false });
            return { success: false, error: String(error) };
        }
    },

    cancelExport: async () => {
        const { tempPath } = get();
        if (tempPath) {
            await window.electron.deleteTempRecording(tempPath);
        }
        set({ isConverting: false, tempPath: null, elapsedSeconds: 0 });
    },

    reset: () => {
        // AUDIT-ME (2026-05-29): reset anche del flag anti-doppio-stop module-level.
        _stopInFlight = false;
        const { timerIntervalId } = get();
        if (timerIntervalId) window.clearInterval(timerIntervalId);
        set({
            isRecording: false,
            isConverting: false,
            startTime: null,
            elapsedSeconds: 0,
            tempPath: null,
            timerIntervalId: null
        });
    }
}));

export default useRecordingStore;
