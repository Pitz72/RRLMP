import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAudioStore } from '../../store/useAudioStore';
import { assessCompatibility } from '../../engine/automixEngine';
import { Square, X, Disc3, Music2 } from 'lucide-react';

// AUTOMIX SECTION — Fase C1 (v1.10.22).
// Vista a schermo pieno ALTERNATIVA alla board (l'app non ha routing: toggle in
// topbar, stato in App.tsx — stesso pattern concettuale del pad FX ma full-screen).
// In C1 la vista è di sola lettura: elenco completo della colonna Music
// (ordine = ordine colonna) con BPM/confidence e indicatore di compatibilità
// col brano precedente. Deck IN ONDA/PROSSIMO e pulsantone TRANSIZIONE
// arrivano con C2.
//
// Scelte deliberate:
// - z-30: sopra la board, SOTTO pad FX (40) / Keymapping (50) / modali .ov (200)
//   → gli FX restano utilizzabili anche dentro l'automix.
// - ESC NON chiude la vista: resta Emergency Stop globale (criterio 4 del piano).
// - STOP ALL sempre raggiungibile nell'header.

interface AutomixViewProps {
    isOpen: boolean;
    onClose: () => void;
}

const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds <= 0) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/** Pallino di compatibilità col brano PRECEDENTE in scaletta (semantica C1). */
const CompatDot: React.FC<{ level: 'green' | 'yellow' | 'red'; label: string }> = ({ level, label }) => {
    const color = level === 'green' ? 'bg-emerald-500' : level === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <span className="flex items-center gap-1.5" title={label}>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
            <span className="text-[10px] text-zinc-500">{label}</span>
        </span>
    );
};

const REASON_LABEL: Record<string, string> = {
    'missing-bpm': 'BPM mancante → crossfade classico',
    'missing-offset': 'beat non rilevato → crossfade classico',
    'low-confidence': 'beat incerto → crossfade classico',
    'rate-cap': 'tempi troppo diversi → crossfade classico',
};

export const AutomixView: React.FC<AutomixViewProps> = ({ isOpen, onClose }) => {
    const columns = useProjectStore(s => s.columns);
    const activeClips = useAudioStore(s => s.activeClips);
    const stopAll = useAudioStore(s => s.stopAll);

    if (!isOpen) return null;

    const musicCol = columns.find(c => c.type === 'music');
    const clips = musicCol?.clips ?? [];

    return (
        <div className="fixed inset-0 z-30 bg-gradient-to-b from-[#101014] to-[#0a0a0c] flex flex-col text-white">
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                    <Disc3 size={22} className="text-emerald-400" />
                    <div>
                        <h2 className="font-black tracking-widest text-base">AUTOMIX</h2>
                        <p className="text-[10px] text-zinc-500">Mix automatico sui BPM — scaletta = colonna {musicCol?.title ?? 'Music'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={stopAll}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                        title="Ferma tutto (come in board — ESC resta l'Emergency Stop)"
                    >
                        <Square fill="currentColor" size={12} /> STOP ALL
                    </button>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                        title="Torna alla board"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* SCALETTA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
                {clips.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-3">
                        <Music2 size={40} />
                        <p className="text-sm">Nessun brano in scaletta.</p>
                        <p className="text-xs">Trascina i brani nella colonna Music della board: l'elenco compare qui nello stesso ordine.</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-1">
                        {clips.map((clip, i) => {
                            const isPlaying = !!activeClips[clip.id];
                            const prev = i > 0 ? clips[i - 1] : null;
                            const compat = prev ? assessCompatibility(prev, clip) : null;
                            const compatLabel = compat
                                ? (compat.rate !== undefined
                                    ? `mix a tempo (rate ${compat.rate.toFixed(3)})`
                                    : REASON_LABEL[compat.reason ?? ''] ?? 'crossfade classico')
                                : 'primo brano';
                            return (
                                <div
                                    key={clip.id}
                                    className={`flex items-center gap-4 px-4 py-2.5 rounded-lg border transition-colors ${
                                        isPlaying
                                            ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_18px_-6px_rgba(34,197,94,0.6)]'
                                            : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900'
                                    }`}
                                >
                                    <span className={`w-6 text-right text-xs font-mono ${isPlaying ? 'text-emerald-400' : 'text-zinc-600'}`}>{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${isPlaying ? 'text-emerald-300 font-bold' : 'text-zinc-200'}`}>{clip.name}</p>
                                        <div className="mt-0.5">
                                            {compat
                                                ? <CompatDot level={compat.level} label={compatLabel} />
                                                : <span className="text-[10px] text-zinc-600">▶ primo brano — parte con START</span>}
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-zinc-500 shrink-0">{formatTime(clip.duration || 0)}</span>
                                    <span className={`shrink-0 text-[10px] font-mono px-2 py-1 rounded border ${
                                        clip.bpm
                                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5'
                                            : 'border-zinc-700 text-zinc-600'
                                    }`} title={clip.bpm ? `Confidence ${clip.bpmConfidence ?? '—'}` : 'BPM non rilevato'}>
                                        {clip.bpm ? `${clip.bpm} BPM` : 'NO BPM'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
