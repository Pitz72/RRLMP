import React from 'react';
import { Circle, StopCircle } from 'lucide-react';
import { useRecordingStore } from '../../store/useRecordingStore';
import { toast } from '../../store/useToastStore';

export const RecordingButton: React.FC = () => {
    const { isRecording, elapsedSeconds, startRecording, stopRecording } = useRecordingStore();

    const handleToggle = async () => {
        if (isRecording) {
            const result = await stopRecording();
            if (result.success) {
                toast(`Registrazione salvata:\n${result.path}`, 'success', 5000);
            } else if (result.error) {
                toast(`Errore salvataggio: ${result.error}`, 'error');
            }
        } else {
            try {
                await startRecording();
            } catch (error) {
                toast(`Errore avvio registrazione: ${error}`, 'error');
            }
        }
    };

    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    if (!isRecording) {
        return (
            <button
                onClick={handleToggle}
                title="Avvia registrazione sessione (Master Mix)"
                className="group flex items-center gap-2 px-3 py-1 rounded border border-zinc-800/60 hover:border-red-500/40 hover:bg-red-950/20 transition-all cursor-pointer"
            >
                <Circle size={12} className="text-zinc-500 group-hover:text-red-500 transition-colors fill-zinc-800 group-hover:fill-red-900/40" />
                <span className="font-mono text-xs font-bold tracking-widest text-zinc-500 group-hover:text-red-400 uppercase">REC</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            title="Ferma registrazione e salva"
            className="flex items-center gap-2 px-3 py-1 rounded border border-red-500/60 bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse transition-all cursor-pointer"
        >
            <StopCircle size={12} className="fill-white" />
            <span className="font-mono text-xs font-bold tracking-widest uppercase">REC {timeString}</span>
        </button>
    );
};

export default RecordingButton;
