import React, { useState, useEffect } from 'react';
import { FileAudio, FileVideo, XCircle, Loader2 } from 'lucide-react';
import { useRecordingStore } from '../../store/useRecordingStore';
import { toast } from '../../store/useToastStore';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

type ExportFormat = 'wav' | 'mp3' | 'flac' | 'ogg' | 'webm';

interface FormatOption {
    id: ExportFormat;
    label: string;
    description: string;
    supportsDepth: boolean;
    supportsBitrate: boolean;
    icon: React.ReactNode;
}

const FORMAT_OPTIONS: FormatOption[] = [
    { id: 'wav',  label: 'WAV',  description: 'Lossless — ideale per editing e archivio',      supportsDepth: true,  supportsBitrate: false, icon: <FileAudio size={16} /> },
    { id: 'flac', label: 'FLAC', description: 'Lossless compresso — archivio di qualità',      supportsDepth: true,  supportsBitrate: false, icon: <FileAudio size={16} /> },
    { id: 'mp3',  label: 'MP3',  description: 'Lossy — massima compatibilità',                  supportsDepth: false, supportsBitrate: true,  icon: <FileAudio size={16} /> },
    { id: 'ogg',  label: 'OGG',  description: 'Lossy / Vorbis — open source, buona qualità',   supportsDepth: false, supportsBitrate: true,  icon: <FileAudio size={16} /> },
    { id: 'webm', label: 'WEBM', description: 'Opus — formato nativo della registrazione',     supportsDepth: false, supportsBitrate: true,  icon: <FileVideo size={16} /> },
];

const BITRATE_OPTIONS = [128000, 192000, 256000, 320000];
const DEPTH_OPTIONS: Array<16 | 24 | 32> = [16, 24, 32];

export const RecordingExportModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { exportRecording, cancelExport, isConverting } = useRecordingStore();
    const [format, setFormat] = useState<ExportFormat>('wav');
    const [bitrate, setBitrate] = useState(320000);
    const [sampleDepth, setSampleDepth] = useState<16 | 24 | 32>(24);
    const [exportProgress, setExportProgress] = useState<number | null>(null);

    useEffect(() => {
        if (!isConverting) {
            setExportProgress(null);
            return;
        }
        // REC-05 (v1.3.1): cleanup difensivo — se onExportProgress restituisce undefined/null
        // (preload non aggiornato, mock test, ecc.), un cleanup non-function farebbe crashare React.
        const unsub = window.electron.onExportProgress((_event, data) => {
            // AUDIT-LI (2026-05-29): optional chaining su `data`. Un evento IPC senza payload
            // (preload non aggiornato / pacchetto malformato) faceva crashare la callback su
            // `data.total`. Ora il progresso si aggiorna solo con payload valido.
            if (data?.total && data.total > 0) {
                setExportProgress(Math.round((data.current / data.total) * 100));
            }
        });
        return () => {
            if (typeof unsub === 'function') {
                try { unsub(); } catch { /* noop */ }
            }
        };
    }, [isConverting]);

    // v1.4.13 (ESC-01): ESC chiude la modale invece di innescare lo STOP ALL
    // (equivale al bottone ×; con conversione in corso resta possibile annullare
    // dalla UI dedicata).
    useEscapeToClose(isOpen, onClose);

    const selectedFmt = FORMAT_OPTIONS.find(f => f.id === format)!;

    if (!isOpen) return null;

    const handleExport = async () => {
        const result = await exportRecording({
            format,
            bitrate: selectedFmt.supportsBitrate ? bitrate : undefined,
            sampleDepth: selectedFmt.supportsDepth ? sampleDepth : undefined,
        });

        if (result.success) {
            toast(`Esportazione completata:\n${result.path}`, 'success', 5000);
            onClose();
        } else if (result.error !== 'Canceled by user') {
            toast(`Errore esportazione: ${result.error}`, 'error');
        }
    };

    const handleCancel = async () => {
        await cancelExport();
        onClose();
    };

    if (isConverting) {
        return (
            <div className="ov" style={{ zIndex: 50 }}>
                <div className="ov-panel anim-in w-full max-w-md">
                    <div className="bg-zinc-800 px-5 py-4 border-b border-zinc-700">
                        <h2 className="text-sm font-bold text-white">Esporta Registrazione</h2>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Conversione audio in corso…</p>
                    </div>
                    <div className="p-6 flex flex-col items-center gap-4">
                        <Loader2 size={28} className="text-emerald-400 animate-spin" />
                        <p className="text-sm text-zinc-300 font-medium">
                            {exportProgress !== null ? `Conversione… ${exportProgress}%` : 'Conversione in corso…'}
                        </p>
                        {exportProgress !== null && (
                            <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${exportProgress}%` }}
                                />
                            </div>
                        )}
                        <p className="text-[10px] text-zinc-600">Non chiudere la finestra durante la conversione.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ov" style={{ zIndex: 50 }}>
            <div className="ov-panel anim-in w-full max-w-md">

                {/* HEADER */}
                <div className="bg-zinc-800 px-5 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-white">Esporta Registrazione</h2>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Scegli formato e qualità, poi seleziona dove salvare.</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors">&times;</button>
                </div>

                <div className="p-5 space-y-5">

                    {/* FORMATO */}
                    <div className="space-y-2">
                        <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Formato</span>
                        <div className="grid grid-cols-5 gap-1.5">
                            {FORMAT_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setFormat(opt.id)}
                                    className={`flex flex-col items-center gap-1 seg !py-2.5 !px-1 ${format === opt.id ? 'on' : ''}`}
                                >
                                    {opt.icon}
                                    <span className="text-[10px] font-bold">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-zinc-600 italic">{selectedFmt.description}</p>
                    </div>

                    {/* BIT DEPTH (WAV / FLAC) */}
                    {selectedFmt.supportsDepth && (
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Profondità di Bit</span>
                            <div className="flex gap-2">
                                {DEPTH_OPTIONS.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setSampleDepth(d)}
                                        className={`flex-1 seg !py-1.5 font-mono ${sampleDepth === d ? 'on' : ''}`}
                                    >
                                        {d}-bit
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-600 italic">
                                {sampleDepth === 16 ? 'Standard CD — massima compatibilità.'
                                    : sampleDepth === 24 ? '24-bit — standard broadcast, consigliato.'
                                    : '32-bit float — per post-produzione professionale (file grandi).'}
                            </p>
                        </div>
                    )}

                    {/* BITRATE (MP3 / OGG / WEBM) */}
                    {selectedFmt.supportsBitrate && (
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Bitrate</span>
                            <div className="flex gap-2">
                                {BITRATE_OPTIONS.map(b => (
                                    <button
                                        key={b}
                                        onClick={() => setBitrate(b)}
                                        className={`flex-1 seg !py-1.5 font-mono ${bitrate === b ? 'on' : ''}`}
                                    >
                                        {b / 1000}k
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="ov-foot">
                    <button
                        onClick={handleCancel}
                        className="btn btn-danger flex items-center gap-1.5"
                    >
                        <XCircle size={12} />
                        Elimina Registrazione
                    </button>
                    <button
                        onClick={handleExport}
                        className="btn btn-green flex items-center gap-1.5"
                    >
                        <FileAudio size={12} />
                        Scegli Destinazione…
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordingExportModal;
