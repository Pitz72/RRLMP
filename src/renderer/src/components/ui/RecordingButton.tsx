import React from 'react';
import { Circle, StopCircle, FileAudio, FileVideo, XCircle, Loader2 } from 'lucide-react';
import { useRecordingStore } from '../../store/useRecordingStore';
import { toast } from '../../store/useToastStore';

export const RecordingButton: React.FC = () => {
    const { isRecording, isConverting, elapsedSeconds, tempPath, startRecording, stopRecording, exportRecording, cancelExport } = useRecordingStore();

    const handleStart = async () => {
        try {
            await startRecording();
        } catch (error) {
            toast(`Errore avvio registrazione: ${error}`, 'error');
        }
    };

    const handleStop = async () => {
        await stopRecording();
        toast('Registrazione terminata. Scegli il formato per esportare.', 'info');
    };

    const handleExport = async (format: 'wav' | 'webm') => {
        const result = await exportRecording(format);
        if (result.success) {
            toast(`Esportazione completata:\n${result.path}`, 'success', 5000);
        } else if (result.error !== 'Canceled by user') {
            toast(`Errore esportazione: ${result.error}`, 'error');
        }
    };

    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    // 1. STATO: CONVERSIONE IN CORSO
    if (isConverting) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 rounded border border-sky-500/60 bg-sky-600/20 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]">
                <Loader2 size={12} className="animate-spin" />
                <span className="font-mono text-[10px] font-bold tracking-widest uppercase">Converting...</span>
            </div>
        );
    }

    // 2. STATO: REGISTRAZIONE TERMINATA (SCELTA FORMATO)
    if (tempPath) {
        return (
            <div className="flex items-center gap-1 p-0.5 rounded border border-zinc-700 bg-zinc-900 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={() => handleExport('wav')}
                    title="Esporta in WAV (Lossless / Editing)"
                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-emerald-500 hover:text-white text-emerald-500 transition-all cursor-pointer"
                >
                    <FileAudio size={14} />
                    <span className="font-mono text-[10px] font-bold">WAV</span>
                </button>
                <div className="w-px h-4 bg-zinc-800" />
                <button
                    onClick={() => handleExport('webm')}
                    title="Esporta in WebM (Opus / Web)"
                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-sky-500 hover:text-white text-sky-400 transition-all cursor-pointer"
                >
                    <FileVideo size={14} />
                    <span className="font-mono text-[10px] font-bold">WEBM</span>
                </button>
                <div className="w-px h-4 bg-zinc-800" />
                <button
                    onClick={cancelExport}
                    title="Elimina registrazione temporanea"
                    className="flex items-center px-2 py-1 rounded hover:bg-red-500 hover:text-white text-zinc-500 transition-all cursor-pointer"
                >
                    <XCircle size={14} />
                </button>
            </div>
        );
    }

    // 3. STATO: IN REGISTRAZIONE
    if (isRecording) {
        return (
            <button
                onClick={handleStop}
                title="Ferma registrazione"
                className="flex items-center gap-2 px-3 py-1 rounded border border-red-500/60 bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse transition-all cursor-pointer"
            >
                <StopCircle size={12} className="fill-white" />
                <span className="font-mono text-xs font-bold tracking-widest uppercase">REC {timeString}</span>
            </button>
        );
    }

    // 4. STATO: IDLE (PRONTO)
    return (
        <button
            onClick={handleStart}
            title="Avvia registrazione sessione (Master Mix)"
            className="group flex items-center gap-2 px-3 py-1 rounded border border-zinc-800/60 hover:border-red-500/40 hover:bg-red-950/20 transition-all cursor-pointer"
        >
            <Circle size={12} className="text-zinc-500 group-hover:text-red-500 transition-colors fill-zinc-800 group-hover:fill-red-900/40" />
            <span className="font-mono text-xs font-bold tracking-widest text-zinc-500 group-hover:text-red-400 uppercase">REC</span>
        </button>
    );
};

export default RecordingButton;
