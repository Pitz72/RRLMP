import { create } from 'zustand';
import AudioRecorder from '../engine/AudioRecorder';

interface RecordingState {
    isRecording: boolean;
    startTime: number | null;
    elapsedSeconds: number;
    outputPath: string | null;
    timerIntervalId: number | null;

    startRecording: () => Promise<void>;
    stopRecording: () => Promise<{ success: boolean; path?: string; error?: string }>;
    reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
    isRecording: false,
    startTime: null,
    elapsedSeconds: 0,
    outputPath: null,
    timerIntervalId: null,

    startRecording: async () => {
        const recorder = AudioRecorder.getInstance();
        
        // Ensure it's initialized (connected to master output)
        recorder.initialize();

        // Generate default filename
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const defaultName = `RRLMP_REC_${dateStr}_${timeStr}.webm`;

        // Ask for path
        const result = await window.electron.showSaveDialogRecording(defaultName);
        if (result.canceled || !result.filePath) {
            return;
        }

        try {
            recorder.start();
            
            const intervalId = window.setInterval(() => {
                set((state) => ({ 
                    elapsedSeconds: state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0 
                }));
            }, 1000);

            set({
                isRecording: true,
                startTime: Date.now(),
                elapsedSeconds: 0,
                outputPath: result.filePath,
                timerIntervalId: intervalId as unknown as number
            });

        } catch (error) {
            console.error('[RecordingStore] Failed to start recording:', error);
            throw error;
        }
    },

    stopRecording: async () => {
        const { isRecording, outputPath, timerIntervalId } = get();
        if (!isRecording || !outputPath) return { success: false, error: 'Not recording' };

        const recorder = AudioRecorder.getInstance();

        if (timerIntervalId) {
            window.clearInterval(timerIntervalId);
        }

        try {
            const arrayBuffer = await recorder.stop();
            const result = await window.electron.saveRecording(arrayBuffer, outputPath);

            set({
                isRecording: false,
                startTime: null,
                elapsedSeconds: 0,
                outputPath: null,
                timerIntervalId: null
            });

            return result;
        } catch (error) {
            console.error('[RecordingStore] Failed to stop/save recording:', error);
            set({ isRecording: false, timerIntervalId: null });
            return { success: false, error: String(error) };
        }
    },

    reset: () => {
        const { timerIntervalId } = get();
        if (timerIntervalId) window.clearInterval(timerIntervalId);
        set({
            isRecording: false,
            startTime: null,
            elapsedSeconds: 0,
            outputPath: null,
            timerIntervalId: null
        });
    }
}));

export default useRecordingStore;
