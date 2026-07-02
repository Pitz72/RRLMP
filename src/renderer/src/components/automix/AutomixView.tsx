import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { assessCompatibility, crossfadeDurationSec } from '../../engine/automixEngine';
import { toast } from '../../store/useToastStore';
import { debugLog } from '../../store/useDebugStore';
import { Square, X, Disc3, Music2, Play, Shuffle } from 'lucide-react';

// AUTOMIX SECTION — Fase C1 (v1.10.22) + C2 deck/transizione (v1.10.23).
// Vista a schermo pieno ALTERNATIVA alla board (l'app non ha routing: toggle in
// topbar, stato in App.tsx — stesso pattern concettuale del pad FX ma full-screen).
// Scaletta = colonna Music (ordine = ordine colonna); deck IN ONDA/PROSSIMO;
// pulsantone TRANSIZIONE (manuale — decisione utente 2026-07-02; l'opzione
// "auto a fine brano" arriva in uno step successivo, default OFF).
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
    'no-beat-available': 'aggancio non disponibile → crossfade classico',
};

export const AutomixView: React.FC<AutomixViewProps> = ({ isOpen, onClose }) => {
    const columns = useProjectStore(s => s.columns);
    const activeClips = useAudioStore(s => s.activeClips);
    const fadingClipIds = useAudioStore(s => s.fadingClipIds);
    const stopAll = useAudioStore(s => s.stopAll);
    const playClip = useAudioStore(s => s.playClip);
    const automixTransition = useAudioStore(s => s.automixTransition);

    // Auto a fine brano (richiesta utente 2026-07-02) — DEFAULT OFF e attiva SOLO
    // a vista aperta: chiudere la vista disattiva l'automazione (l'automix è
    // un'eccezione controllata alla filosofia NO automazione dello show).
    const [autoMode, setAutoMode] = useState(false);
    // Anti re-trigger: una sola auto-transizione per clip in onda.
    const autoFiredRef = useRef<Set<string>>(new Set());

    // NB: derivazioni PRIMA dell'early-return — gli hook sotto ne dipendono.
    const musicCol = columns.find(c => c.type === 'music');
    const clips = musicCol?.clips ?? [];

    // Deck: "in onda" = clip Music attiva NON in fade-out di transizione (durante
    // il crossfade l'uscente è in fadingClipIds → il deck mostra subito l'entrante).
    const currentClip = clips.find(c => activeClips[c.id] && !fadingClipIds.includes(c.id)) ?? null;
    const currentIndex = currentClip ? clips.findIndex(c => c.id === currentClip.id) : -1;
    const nextClip = currentIndex >= 0 && currentIndex < clips.length - 1 ? clips[currentIndex + 1] : null;
    const currentState = currentClip ? activeClips[currentClip.id] : null;

    const currentDuration = currentClip?.duration || 0;
    const currentTime = currentState ? currentState.progress * (currentState.player.getDuration() || currentDuration) : 0;
    const remaining = Math.max(0, currentDuration - currentTime);

    // Reset dell'anti re-trigger quando non c'è più nulla in onda (nuovo giro di
    // playlist → le clip possono ri-transizionare in auto).
    useEffect(() => {
        if (!currentClip) autoFiredRef.current.clear();
    }, [currentClip]);

    // AUTO A FINE BRANO: quando mancano (durata del fade + margine) secondi alla
    // fine effettiva, parte la STESSA transizione del pulsantone. Guardie: vista
    // aperta, auto ON, durata nota, prossimo presente e non mancante, one-shot per clip.
    useEffect(() => {
        if (!isOpen || !autoMode || !currentClip || !nextClip || nextClip.isMissing) return;
        if (currentDuration <= 0 || currentTime <= 0) return;
        if (autoFiredRef.current.has(currentClip.id)) return;
        const fadeSec = currentClip.bpm
            ? crossfadeDurationSec(currentClip.bpm)
            : useSettingsStore.getState().crossfadeDuration / 1000;
        // Margine 2.5s: lead di aggancio (0.5s) + fino a 1 beat di arrotondamento +
        // latenza avvio. Più stretto e il piano degrada quasi sempre a classico
        // (anchor + fade devono stare PRIMA della fine effettiva — guardia Fase D,
        // verificata empiricamente in preview con margine 1.5 → no-beat-available).
        const thresholdSec = fadeSec + 2.5;
        if (remaining <= thresholdSec) {
            autoFiredRef.current.add(currentClip.id);
            debugLog(`Automix: AUTO-transizione a fine brano — ${currentClip.name} (-${remaining.toFixed(1)}s) → ${nextClip.name}`, 'event');
            void automixTransition(currentClip.id, nextClip.id).then(result => {
                if (result.mode === 'skipped') {
                    toast(`Auto-transizione non eseguita: ${result.reason ?? 'stato non valido'}`, 'warning');
                }
            });
        }
    }, [isOpen, autoMode, currentClip, nextClip, remaining, currentDuration, currentTime, automixTransition]);

    if (!isOpen) return null;

    const nextCompat = currentClip && nextClip ? assessCompatibility(currentClip, nextClip) : null;
    const nextCompatLabel = nextCompat
        ? (nextCompat.rate !== undefined
            ? `mix a tempo (rate ${nextCompat.rate.toFixed(3)})`
            : REASON_LABEL[nextCompat.reason ?? ''] ?? 'crossfade classico')
        : '';

    const handleStart = () => {
        const first = clips.find(c => !c.isMissing);
        if (!first) return;
        void playClip(first);
    };

    const handleTransition = async () => {
        if (!currentClip || !nextClip) return;
        const result = await automixTransition(currentClip.id, nextClip.id);
        if (result.mode === 'skipped') {
            toast(`Transizione non eseguita: ${result.reason ?? 'stato non valido'}`, 'warning');
        }
    };

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

            {/* DECK — IN ONDA | TRANSIZIONE | PROSSIMO (C2, v1.10.23) */}
            <div className="px-6 py-5 border-b border-zinc-800 shrink-0">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 items-stretch">
                    {/* IN ONDA */}
                    <div className={`rounded-xl border p-4 ${currentClip ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/40'}`}>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-emerald-500 mb-2">In onda</p>
                        {currentClip ? (
                            <>
                                <p className="text-lg font-bold truncate">{currentClip.name}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs font-mono text-zinc-400">
                                    <span>{currentClip.bpm ? `${currentClip.bpm} BPM` : 'NO BPM'}</span>
                                    <span className="text-zinc-600">·</span>
                                    <span>{formatTime(currentTime)} / {formatTime(currentDuration)}</span>
                                    <span className={`ml-auto ${remaining < 20 ? 'text-orange-400' : 'text-zinc-500'}`}>-{formatTime(remaining)}</span>
                                </div>
                                <div className="h-1.5 mt-3 rounded-full bg-zinc-800 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-[width] duration-150"
                                        style={{ width: `${currentDuration > 0 ? Math.min(100, (currentTime / currentDuration) * 100) : 0}%` }}
                                    />
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-zinc-600 py-3">Niente in onda — premi START per partire dal primo brano.</p>
                        )}
                    </div>

                    {/* PULSANTONE */}
                    <div className="flex flex-col items-center justify-center gap-2 min-w-[190px]">
                        {currentClip ? (
                            <>
                                <button
                                    onClick={() => void handleTransition()}
                                    disabled={!nextClip || nextClip.isMissing}
                                    className={`w-full px-6 py-5 rounded-2xl font-black tracking-widest text-base transition-all ${
                                        nextClip && !nextClip.isMissing
                                            ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-black shadow-[0_0_30px_-8px_rgba(34,197,94,0.9)] hover:from-emerald-400 hover:to-emerald-500 active:scale-95'
                                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    }`}
                                    title={nextClip ? `Mixa verso: ${nextClip.name}` : 'Fine scaletta'}
                                >
                                    <span className="flex items-center justify-center gap-2"><Shuffle size={18} /> TRANSIZIONE</span>
                                </button>
                                <p className="text-[10px] text-zinc-500 text-center h-4">
                                    {nextClip ? (nextClip.isMissing ? 'prossimo file MANCANTE' : nextCompatLabel) : 'fine scaletta'}
                                </p>
                            </>
                        ) : (
                            <button
                                onClick={handleStart}
                                disabled={clips.every(c => c.isMissing)}
                                className={`w-full px-6 py-5 rounded-2xl font-black tracking-widest text-base transition-all ${
                                    clips.some(c => !c.isMissing)
                                        ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-black shadow-[0_0_30px_-8px_rgba(34,197,94,0.9)] hover:from-emerald-400 hover:to-emerald-500 active:scale-95'
                                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                }`}
                            >
                                <span className="flex items-center justify-center gap-2"><Play size={18} fill="currentColor" /> START</span>
                            </button>
                        )}
                        {/* AUTO A FINE BRANO (default OFF, attiva solo a vista aperta) */}
                        <label className="flex items-center gap-2 cursor-pointer text-[10px] mt-1 select-none" title="Quando il brano sta per finire, la transizione parte da sola (stessa logica del pulsante). Si disattiva chiudendo la vista.">
                            <input
                                type="checkbox"
                                checked={autoMode}
                                onChange={e => setAutoMode(e.target.checked)}
                                className="w-3.5 h-3.5 accent-emerald-500"
                            />
                            <span className={autoMode ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>Auto a fine brano</span>
                        </label>
                    </div>

                    {/* PROSSIMO */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-sky-500 mb-2">Prossimo</p>
                        {nextClip ? (
                            <>
                                <p className="text-lg font-bold truncate text-zinc-200">{nextClip.name}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs font-mono text-zinc-400">
                                    <span>{nextClip.bpm ? `${nextClip.bpm} BPM` : 'NO BPM'}</span>
                                    <span className="text-zinc-600">·</span>
                                    <span>{formatTime(nextClip.duration || 0)}</span>
                                </div>
                                {nextCompat && (
                                    <div className="mt-3">
                                        <CompatDot level={nextCompat.level} label={nextCompatLabel} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-zinc-600 py-3">{currentClip ? 'Fine scaletta — nessun brano dopo questo.' : 'Il prossimo brano compare qui a playlist avviata.'}</p>
                        )}
                    </div>
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
                            const isPlaying = !!activeClips[clip.id] && !fadingClipIds.includes(clip.id);
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
