import { create } from 'zustand';
import AudioRecorder from '../engine/AudioRecorder';

interface RecordingState {
    isRecording: boolean;
    isConverting: boolean;
    startTime: number | null;
    elapsedSeconds: number;
    tempPath: string | null;
    timerIntervalId: number | null;

    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    exportRecording: (format: 'wav' | 'webm') => Promise<{ success: boolean; path?: string; error?: string }>;
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
                timerIntervalId: intervalId as unknown as number
            });

        } catch (error) {
            console.error('[RecordingStore] Failed to start recording:', error);
            throw error;
        }
    },

    stopRecording: async () => {
        const { isRecording, timerIntervalId } = get();
        if (!isRecording) return;

        const recorder = AudioRecorder.getInstance();

        if (timerIntervalId) {
            window.clearInterval(timerIntervalId);
        }

        try {
            const tempPath = await recorder.stop();
            set({
                isRecording: false,
                startTime: null,
                tempPath: tempPath,
                timerIntervalId: null
            });
        } catch (error) {
            console.error('[RecordingStore] Failed to stop recording:', error);
            set({ isRecording: false, timerIntervalId: null });
        }
    },

    exportRecording: async (format: 'wav' | 'webm') => {
        const { tempPath } = get();
        if (!tempPath) return { success: false, error: 'No recording to export' };

        // 1. Chiedi all'utente dove salvare
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const defaultName = `RRLMP_REC_${dateStr}_${timeStr}.${format}`;

        const result = await window.electron.showSaveDialogRecording(defaultName, format);
        if (result.canceled || !result.filePath) {
            return { success: false, error: 'Canceled by user' };
        }

        set({ isConverting: true });

        try {
            // 2. Avvia conversione via IPC
            const convResult = await window.electron.convertRecording(
                tempPath, 
                result.filePath, 
                { format, bitrate: 320000 }
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
