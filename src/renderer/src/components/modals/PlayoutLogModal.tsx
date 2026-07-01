import React from 'react';
import { X, Download, Trash2, Clock, Radio } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { PlayoutLogEntry } from '../../types';
import { toast } from '../../store/useToastStore';
import { confirm } from '../../store/useConfirmStore';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

interface PlayoutLogModalProps {
    onClose: () => void;
}

const fmt = (ts: number) => new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('it-IT');

const durationSec = (entry: PlayoutLogEntry): string => {
    if (!entry.endTime) return '—';
    return ((entry.endTime - entry.startTime) / 1000).toFixed(1) + 's';
};

const clipTypeLabel: Record<string, string> = {
    music: 'Music', voice: 'Voice', asset: 'Asset', sfx: 'SFX', preshow: 'Pre-Show'
};

export const PlayoutLogModal: React.FC<PlayoutLogModalProps> = ({ onClose }) => {
    const { playoutLog, clearPlayoutLog } = useAudioStore();

    // v1.4.13 (ESC-01): ESC chiude la modale invece di innescare lo STOP ALL.
    // (Il componente è montato solo quando la modale è visibile.)
    useEscapeToClose(true, onClose);

    const handleExport = async () => {
        if (playoutLog.length === 0) return;
        const date = fmtDate(playoutLog[0].startTime);
        const lines = [
            `# RRLMP Playout Log — ${date}`,
            `# Generato il ${new Date().toLocaleString('it-IT')}`,
            ``,
            `N,Ora Inizio,Ora Fine,Durata (s),Nome Clip,Artista,Titolo,Tipo`,
        ];
        playoutLog.forEach((e, i) => {
            const dur = e.endTime ? ((e.endTime - e.startTime) / 1000).toFixed(1) : '';
            const esc = (s?: string) => s ? `"${s.replace(/"/g, '""')}"` : '';
            lines.push(`${i + 1},${fmt(e.startTime)},${e.endTime ? fmt(e.endTime) : ''},${dur},${esc(e.clipName)},${esc(e.artist)},${esc(e.title)},${e.clipType}`);
        });
        const csv = lines.join('\r\n');
        const suggestedName = `playout_log_${new Date().toISOString().slice(0, 10)}.csv`;
        // v1.2.27 (NEW-LI-06): distinguere cancel (silenzioso) da errore (toast)
        const res = await window.electron.savePlayoutLog(csv, suggestedName);
        if (res.success) {
            toast('Playout log esportato.', 'success');
        } else if (res.error) {
            toast('Errore export: ' + res.error, 'error');
        }
        // else: utente ha annullato il dialog — nessun toast
    };

    // AUDIT-LI (2026-05-29): lo svuotamento del playout log era immediato e irreversibile.
    // In diretta il log è la prova di ciò che è andato in onda (export SIAE/scaletta): un
    // click accidentale lo cancellava senza appello. Conferma Promise-based (mai window.confirm,
    // che bloccherebbe il thread audio).
    const handleClear = async () => {
        if (playoutLog.length === 0) return;
        const ok = await confirm(
            `Svuotare il Playout Log? ${playoutLog.length} element${playoutLog.length === 1 ? 'o' : 'i'} verranno eliminati definitivamente. Esporta il CSV prima, se ti serve la scaletta.`,
            'Svuota',
            'Annulla'
        );
        if (ok) clearPlayoutLog();
    };

    return (
        <div className="ov" style={{ zIndex: 200 }}>
            <div className="ov-panel anim-in w-full max-w-3xl max-h-[80vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Radio size={16} className="text-cyan-400" />
                        <h2 className="text-sm font-bold text-zinc-100">Playout Log</h2>
                        <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-2 py-0.5 rounded">
                            {playoutLog.length} elementi
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExport}
                            disabled={playoutLog.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-700/50 text-cyan-300 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Download size={12} /> Export CSV
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={playoutLog.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-400 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Trash2 size={12} /> Svuota
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded transition-all">
                            <X size={16} className="text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-y-auto flex-1">
                    {playoutLog.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-zinc-600">
                            <Clock size={28} />
                            <span className="text-sm">Nessuna clip suonata in questa sessione</span>
                        </div>
                    ) : (
                        <table className="w-full text-[11px]">
                            <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                                <tr className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">
                                    <th className="px-4 py-2 text-left w-8">#</th>
                                    <th className="px-4 py-2 text-left">Inizio</th>
                                    <th className="px-4 py-2 text-left">Fine</th>
                                    <th className="px-4 py-2 text-right">Durata</th>
                                    <th className="px-4 py-2 text-left">Nome</th>
                                    <th className="px-4 py-2 text-left">Artista / Titolo</th>
                                    <th className="px-4 py-2 text-left">Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {playoutLog.map((entry, i) => (
                                    <tr key={entry.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-2 text-zinc-600 font-mono">{i + 1}</td>
                                        <td className="px-4 py-2 text-zinc-400 font-mono">{fmt(entry.startTime)}</td>
                                        <td className="px-4 py-2 text-zinc-500 font-mono">
                                            {entry.endTime ? fmt(entry.endTime) : (
                                                <span className="text-emerald-400 animate-pulse">● ON AIR</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right text-zinc-400 font-mono">{durationSec(entry)}</td>
                                        <td className="px-4 py-2 text-zinc-200 font-medium max-w-[160px] truncate" title={entry.clipName}>
                                            {entry.clipName}
                                        </td>
                                        <td className="px-4 py-2 text-zinc-500 max-w-[160px] truncate">
                                            {entry.artist && entry.title
                                                ? `${entry.artist} — ${entry.title}`
                                                : entry.artist || entry.title || '—'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                                {clipTypeLabel[entry.clipType] ?? entry.clipType}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
