import React, { useState } from 'react';
import { Circle, StopCircle, FileAudio, XCircle, Loader2 } from 'lucide-react';
import { useRecordingStore } from '../../store/useRecordingStore';
import { toast } from '../../store/useToastStore';
import { RecordingExportModal } from '../modals/RecordingExportModal';
import { useTranslation } from 'react-i18next';

export const RecordingButton: React.FC = () => {
    const { t } = useTranslation();
    const { isRecording, isConverting, elapsedSeconds, tempPath, startRecording, stopRecording, cancelExport } = useRecordingStore();
    const [showExportModal, setShowExportModal] = useState(false);

    const handleStart = async () => {
        try {
            await startRecording();
        } catch (error) {
            toast(t('recording.startError', 'Errore avvio registrazione: {{error}}', { error: String(error) }), 'error');
        }
    };

    const handleStop = async () => {
        await stopRecording();
        setShowExportModal(true);
    };

    const handleCancelExport = async () => {
        await cancelExport();
    };

    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return (
        <>
            {/* STATO: CONVERSIONE IN CORSO */}
            {isConverting && (
                <div className="kbtn busy" aria-busy="true">
                    <Loader2 size={15} className="animate-spin" />
                    <span>{t('recording.converting', 'Conversione...')}</span>
                </div>
            )}

            {/* STATO: REGISTRAZIONE TERMINATA (in attesa di export) */}
            {!isConverting && tempPath && (
                <div className="rec-split">
                    <button
                        onClick={() => setShowExportModal(true)}
                        title={t('recording.openExportTip', 'Apri finestra di esportazione')}
                        className="kbtn sm on"
                    >
                        <FileAudio size={15} />
                        <span>{t('recording.exportLabel', 'ESPORTA')}</span>
                    </button>
                    <button
                        onClick={handleCancelExport}
                        title={t('recording.deleteTempTip', 'Elimina registrazione temporanea')}
                        aria-label={t('recording.deleteTempTip', 'Elimina registrazione temporanea')}
                        className="kbtn sm icon"
                    >
                        <XCircle size={15} />
                    </button>
                </div>
            )}

            {/* STATO: IN REGISTRAZIONE */}
            {!isConverting && !tempPath && isRecording && (
                <button
                    onClick={handleStop}
                    title={t('recording.stopTip', 'Ferma registrazione')}
                    className="kbtn rec-live"
                >
                    <StopCircle size={15} className="blink" />
                    <span className="lcd-stack">
                        <span className="k">{t('recording.recBadge', 'REC')}</span>
                        <span className="v">{timeString}</span>
                    </span>
                </button>
            )}

            {/* STATO: IDLE (PRONTO) */}
            {!isConverting && !tempPath && !isRecording && (
                <button
                    onClick={handleStart}
                    title={t('recording.startTip', 'Avvia registrazione sessione (Master Mix)')}
                    className="kbtn group"
                >
                    <Circle size={13} className="text-[#FF6B5A] fill-[#5A1D17] group-hover:fill-[#FF4D3D] transition-colors" />
                    <span>{t('recording.recBadge', 'REC')}</span>
                </button>
            )}

            {/* MODAL DI ESPORTAZIONE */}
            <RecordingExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />
        </>
    );
};

export default RecordingButton;
