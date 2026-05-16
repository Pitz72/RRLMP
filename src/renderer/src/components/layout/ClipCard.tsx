import React from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import { AudioClip } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';

// Schiarisce un colore hex miscelando verso il bianco (amount 0..1, 1 = bianco puro)
const lightenHex = (hex: string, amount = 0.65): string => {
    if (!hex || hex.length < 4) return hex;
    const h = hex.startsWith('#') ? hex : `#${hex}`;
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    const nr = Math.round(r + (255 - r) * amount);
    const ng = Math.round(g + (255 - g) * amount);
    const nb = Math.round(b + (255 - b) * amount);
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
};

interface ClipCardProps {
    clip: AudioClip;
    onEdit: (clip: AudioClip) => void;
}

export const ClipCard: React.FC<ClipCardProps> = ({ clip, onEdit }) => {
    // Correct usage: Hooks are called at the top level of this component
    // independent of the list length in parent
    const activeState = useAudioStore((state) => state.activeClips[clip.id]);
    const playClip = useAudioStore((state) => state.playClip);
    const stopClip = useAudioStore((state) => state.stopClip);
    const isFading = useAudioStore((state) => state.fadingClipIds.includes(clip.id));
    const { selectClip, selectedClipIds, clearSelection, isMidiLearnMode } = useProjectStore(); // Selection & MIDI


    const isPlaying = !!activeState;
    const isSelected = selectedClipIds.includes(clip.id); // Selection State
    const progress = activeState?.progress || 0;

    // v0.14.4 — UP NEXT badge: la clip immediatamente successiva a quella in play (stessa colonna, nextAction = play_next)
    const activeClips = useAudioStore((state) => state.activeClips);
    const columns = useProjectStore((state) => state.columns);

    // v1.1.6 — Colore dinamico: segue il colore corrente della colonna (customColor || color).
    // clip.customColor (scelta esplicita utente per singola clip) ha la priorità assoluta.
    const parentColumn = React.useMemo(() => columns.find(c => c.clips.some(cl => cl.id === clip.id)), [columns, clip.id]);
    const effectiveColor = clip.customColor || (parentColumn ? (parentColumn.customColor || parentColumn.color) : clip.color);

    const isNextUp = React.useMemo(() => {
        if (!parentColumn) return false;
        const clipIdx = parentColumn.clips.findIndex(c => c.id === clip.id);
        if (clipIdx <= 0) return false;
        const prevClip = parentColumn.clips[clipIdx - 1];
        return prevClip.nextAction === 'play_next' && !!activeClips[prevClip.id];
    }, [parentColumn, activeClips, clip.id]);

    // v1.2.25 (NEW-ME-04): currentTime derivato dal progress globale dello store
    // (aggiornato a 10fps da _syncProgress). Elimina il setInterval per-ClipCard:
    // con 30+ clip attive (cartwall) avevamo 30 timer da 200ms paralleli — ora 0.
    // Il prezzo è una latenza max 100ms vs il player reale, accettabile per display.
    const currentTime = React.useMemo(() => {
        if (!isPlaying || !activeState?.player) return 0;
        const dur = activeState.player.getDuration() || clip.duration || 0;
        return activeState.progress * dur;
    }, [isPlaying, activeState, clip.duration]);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const duration = clip.duration || 0;
    const remaining = Math.max(0, duration - currentTime);
    const isNearEnd = isPlaying && remaining < 15;

    // Intro/Outro Board Feedback Logic
    const introTime = clip.introMarker || 0;
    const outroTime = clip.outroMarker || 0;
    const inIntro = isPlaying && introTime > 0 && currentTime < introTime;
    const inOutroPre = isPlaying && outroTime > 0 && currentTime < outroTime && (outroTime - currentTime) <= 15; // Ultime battute prima dell'outro
    const inOutroActive = isPlaying && outroTime > 0 && currentTime >= outroTime && remaining > 0;
    
    const introRemaining = Math.max(0, introTime - currentTime);
    const outroRemainingPre = Math.max(0, outroTime - currentTime);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Selection Logic
        if (e.ctrlKey || e.metaKey) {
            selectClip(clip.id, 'toggle');
            return;
        }

        // Standard Click: Clear Selection AND Play
        clearSelection();

        // Block playback for missing files (v0.14.2)
        if (clip.isMissing) return;

        if (isPlaying) {
            stopClip(clip.id);
        } else {
            playClip(clip);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        onEdit(clip);
    };

    return (
        <div
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            className={`p-2 rounded border transition-all group relative overflow-hidden select-none
                ${clip.isMissing
                    ? 'bg-red-950/60 border-red-800 cursor-not-allowed opacity-80'
                    : isPlaying
                        ? 'bg-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer'
                        : clip.hasPlayed && clip.type === 'preshow'
                            ? 'bg-zinc-950 border-zinc-800/50 hover:border-zinc-600 cursor-pointer opacity-50'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 cursor-pointer'
                }
                ${isSelected ? 'ring-2 ring-blue-500 z-10' : ''}
                ${isMidiLearnMode && isSelected ? 'ring-2 ring-cyan-400 ring-dashed' : ''}
                ${isMidiLearnMode && !isSelected ? 'border-dashed border-cyan-800 opacity-80' : ''}
            `}
            style={{
                borderColor: clip.isMissing ? undefined : (isPlaying ? effectiveColor : undefined)
            }}
        >
            {/* Progress Bar Background */}
            <div
                className="absolute left-0 top-0 bottom-0 transition-all duration-100 ease-linear pointer-events-none opacity-20"
                style={{
                    width: `${progress * 100}%`,
                    backgroundColor: effectiveColor
                }}
            />

            {/* Missing File Banner (v0.14.2) */}
            {clip.isMissing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/70 pointer-events-none">
                    <span className="text-red-400 text-lg leading-none">⚠️</span>
                    <span className="text-red-300 text-[9px] font-bold tracking-widest mt-0.5">FILE MANCANTE</span>
                </div>
            )}

            {/* Visual Tags Overlay (Top Left) */}
            <div className="relative z-10 flex gap-1 mb-1 flex-wrap">
                {clip.behavior === 'stacco' && <span className="text-[9px] bg-purple-600/90 text-white px-1 rounded font-bold tracking-wider">STACCO</span>}
                {clip.isLooping && <span className="text-[9px] bg-blue-600/90 text-white px-1 rounded font-bold tracking-wider">LOOP</span>}
                {clip.nextAction === 'play_next' && !isNextUp && <span className="text-[9px] bg-emerald-600/90 text-white px-1 rounded font-bold tracking-wider">NEXT</span>}
                {isNextUp && <span className="text-[9px] bg-violet-500 text-white px-1.5 rounded font-bold tracking-wider animate-pulse shadow-[0_0_6px_rgba(139,92,246,0.7)]">▶ UP NEXT</span>}
                {clip.notes && <span className="text-[9px] bg-zinc-700 text-zinc-300 px-1 rounded" title={clip.notes}>📋</span>}
                {clip.isAnalyzing && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 rounded font-bold tracking-wider flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
                        TRIM…
                    </span>
                )}
                {isFading && (
                    <span className="text-[9px] bg-violet-500/20 text-violet-300 border border-violet-500/40 px-1.5 rounded font-bold tracking-wider flex items-center gap-1 animate-pulse">
                        <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
                        FADE OUT
                    </span>
                )}
            </div>

            <div className="relative z-10 flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 overflow-hidden">
                    {isPlaying && (
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: effectiveColor }}
                        />
                    )}
                    <span
                        className={`font-medium truncate text-sm`}
                        style={{ color: clip.isMissing ? '#ef4444' : (isPlaying ? effectiveColor : lightenHex(effectiveColor)) }}
                    >
                        {clip.isMissing ? `⚠️ ${clip.name} (File Non Trovato)` : (clip.title || clip.name)}
                    </span>
                    {/* v0.16.4: artista (solo clip music con tag ID3) */}
                    {clip.type === 'music' && clip.artist && (
                        <span
                            className="text-[10px] truncate leading-tight"
                            style={{ color: lightenHex(effectiveColor, 0.6) + 'bb' }}
                        >
                            {clip.artist}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {clip.midiBind && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded font-bold shadow-sm border border-cyan-900/50">
                            {clip.midiBind.replace('NOTE:', 'M')}
                        </span>
                    )}
                    {clip.keybind && (
                        <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-bold shadow-sm" title={`Keybind: ${clip.keybind}`}>
                            {clip.keybind.replace('Key', '').replace('Digit', '')}
                        </span>
                    )}
                    {clip.duckingRole === 'source' && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded">PRIORITY</span>
                    )}
                </div>
            </div>


            {/* TIMER ROW */}
            <div className="relative z-10 flex justify-between items-baseline text-[10px] font-mono mt-1">
                <span className="text-zinc-500 flex items-center gap-2">
                    {clip.type.toUpperCase()}
                    
                    {/* Visual Cues Real-Time: Sponsorizzato tramite Implementation Plan v0.12.0 */}
                    {inIntro && (
                        <span className="text-cyan-400 font-bold animate-pulse font-sans bg-cyan-950/80 px-1.5 py-0.5 rounded shadow-sm border border-cyan-500/30">
                            INTRO: -{formatTime(introRemaining)}
                        </span>
                    )}
                    {inOutroPre && (
                        <span className="text-orange-400 font-bold animate-pulse font-sans bg-orange-950/80 px-1.5 py-0.5 rounded shadow-sm border border-orange-500/30">
                            OUTRO IN: -{formatTime(outroRemainingPre)}
                        </span>
                    )}
                    {inOutroActive && (
                        <span className="text-orange-400 font-bold font-sans bg-orange-950/80 px-1.5 py-0.5 rounded shadow-sm border border-orange-500/30">
                            🚨 OUTRO
                        </span>
                    )}
                </span>
                
                <span className={`font-bold transition-colors ${isNearEnd ? 'text-red-500 animate-pulse' : (isPlaying ? 'text-white' : 'text-zinc-500')}`}>
                    {isPlaying ? `-${formatTime(remaining)}` : formatTime(duration)}
                </span>
            </div>
        </div>
    );
};
