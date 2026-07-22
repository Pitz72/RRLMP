import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioStore } from '../../store/useAudioStore';
import { AudioClip } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';

interface ClipCardProps {
    clip: AudioClip;
    onEdit: (clip: AudioClip) => void;
}

export const ClipCard: React.FC<ClipCardProps> = ({ clip, onEdit }) => {
    const { t } = useTranslation();
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

        // AUDIT-LI (2026-05-29): in MIDI Learn mode un click normale faceva clearSelection()
        // + playClip() → la clip andava in onda durante l'assegnazione del MIDI. Ora un click
        // semplice seleziona la clip (selezione singola, richiesta da handleMidiMessage per
        // assegnare la nota) senza riprodurla. ctrl/cmd-click resta il toggle multi-selezione.
        if (isMidiLearnMode) {
            if (e.ctrlKey || e.metaKey) {
                selectClip(clip.id, 'toggle');
            } else {
                selectClip(clip.id, 'single');
            }
            return;
        }

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
            className={`clip group transition-all
                ${isPlaying ? 'live' : ''}
                ${(clip.hasPlayed && clip.type === 'preshow' && !isPlaying) ? 'played' : ''}
                ${clip.isMissing ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                ${isSelected ? 'ring-2 ring-blue-500 z-10' : ''}
                ${isMidiLearnMode && isSelected ? 'ring-2 ring-cyan-400 ring-dashed' : ''}
                ${isMidiLearnMode && !isSelected ? 'border-dashed border-cyan-800 opacity-80' : ''}
            `}
            style={{
                // override per-clip del colore colonna (preserva il colore custom della clip)
                '--col-color': effectiveColor,
                ...(clip.isMissing ? { borderColor: '#991b1b', background: 'rgba(69,10,10,0.6)' } : {}),
            } as React.CSSProperties}
        >
            {/* Progress Bar Background */}
            <div
                className="clip-prog transition-all duration-100 ease-linear"
                style={{ width: `${progress * 100}%` }}
            />

            {/* Missing File Banner (v0.14.2) */}
            {clip.isMissing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/70 pointer-events-none">
                    <span className="text-red-400 text-lg leading-none">⚠️</span>
                    <span className="text-red-300 text-[9px] font-bold tracking-widest mt-0.5">{t('card.missingFile', 'FILE MANCANTE')}</span>
                </div>
            )}

            {/* Visual Tags Overlay (Top Left) */}
            <div className="clip-row clip-badges">
                {clip.isLooping && <span className="badge b-loop">{t('card.loopBadge', 'LOOP')}</span>}
                {clip.nextAction === 'play_next' && !isNextUp && <span className="badge b-next">{t('card.nextBadge', 'NEXT')}</span>}
                {isNextUp && <span className="badge b-upnext animate-pulse">{t('card.upNextBadge', '▶ UP NEXT')}</span>}
                {clip.notes && <span className="badge bg-zinc-700 text-zinc-300" title={clip.notes}>📋</span>}
                {clip.isAnalyzing && (
                    <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
                        {t('card.trimmingBadge', 'TRIM…')}
                    </span>
                )}
                {/* 2026-07-01 — BPM stimato (solo colonna Music, solo visualizzazione: non ancora usato dal mix) */}
                {clip.type === 'music' && clip.bpm !== undefined && (
                    <span className="badge bg-[#eaff00] text-black font-bold" title={t('card.bpmTip', 'BPM stimato (analisi automatica)')}>
                        {clip.bpm} BPM
                    </span>
                )}
                {/* 2026-07-04 — Intro: stesso colore del marker/segnalino Intro nel Waveform Editor (#22d3ee, cyan-400) */}
                {clip.introMarker !== undefined && clip.introMarker > 0 && (
                    <span className="badge bg-cyan-400/20 text-cyan-400 border border-cyan-400/40" title={t('card.introTip', 'Fine intro (ingresso voce)')}>
                        I {Math.round(clip.introMarker)}s
                    </span>
                )}
                {isFading && (
                    <span className="badge bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center gap-1 animate-pulse">
                        <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
                        {t('card.fadeOutBadge', 'FADE OUT')}
                    </span>
                )}
            </div>

            <div className="clip-row clip-head">
                <div className="clip-id">
                    {isPlaying && <span className="clip-live-dot animate-pulse" />}
                    <span
                        className="clip-title"
                        style={clip.isMissing ? { color: '#ef4444' } : undefined}
                    >
                        {clip.isMissing ? t('card.missingTitle', '⚠️ {{name}} (File Non Trovato)', { name: clip.name }) : (clip.title || clip.name)}
                    </span>
                    {/* v0.16.4: artista (solo clip music con tag ID3) */}
                    {clip.type === 'music' && clip.artist && (
                        <span className="clip-artist">{clip.artist}</span>
                    )}
                </div>
                <div className="clip-binds">
                    {clip.midiBind && (
                        <span className="midi">
                            {clip.midiBind.replace('NOTE:', 'M')}
                        </span>
                    )}
                    {clip.keybind && (
                        <span className="kbd" title={`Keybind: ${clip.keybind}`}>
                            {clip.keybind.replace('Key', '').replace('Digit', '')}
                        </span>
                    )}
                    {clip.duckingRole === 'source' && (
                        <span className="pri">{t('card.priorityBadge', 'PRIORITY')}</span>
                    )}
                </div>
            </div>


            {/* TIMER ROW */}
            <div className="clip-row clip-meta">
                <span className="clip-type">
                    {clip.type.toUpperCase()}

                    {/* Visual Cues Real-Time: Sponsorizzato tramite Implementation Plan v0.12.0 */}
                    {inIntro && (
                        <span className="cue c-intro font-bold animate-pulse">
                            INTRO: -{formatTime(introRemaining)}
                        </span>
                    )}
                    {inOutroPre && (
                        <span className="cue c-outro font-bold animate-pulse">
                            OUTRO IN: -{formatTime(outroRemainingPre)}
                        </span>
                    )}
                    {inOutroActive && (
                        <span className="cue c-outro font-bold">
                            🚨 OUTRO
                        </span>
                    )}
                </span>

                <span
                    className={`clip-time ${isNearEnd ? 'animate-pulse' : ''}`}
                    style={isNearEnd ? { color: '#ef4444' } : undefined}
                >
                    {isPlaying ? `-${formatTime(remaining)}` : formatTime(duration)}
                </span>
            </div>
        </div>
    );
};
