import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioStore } from '../../store/useAudioStore';
import { AudioClip } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { AlertTriangle, ClipboardList } from 'lucide-react';
import { inkFor, prefersLightInk } from '../../utils/colorInk';

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
    const columns = useProjectStore((state) => state.columns);

    // v1.1.6 — Colore dinamico: segue il colore corrente della colonna (customColor || color).
    // clip.customColor (scelta esplicita utente per singola clip) ha la priorità assoluta.
    const parentColumn = React.useMemo(() => columns.find(c => c.clips.some(cl => cl.id === clip.id)), [columns, clip.id]);
    const effectiveColor = clip.customColor || (parentColumn ? (parentColumn.customColor || parentColumn.color) : clip.color);

    // v1.15.35 (M4): ogni card era abbonata all'INTERA mappa delle clip in onda, che
    // cambia 10 volte al secondo con il progresso: durante la riproduzione TUTTE le
    // card della board si ridisegnavano di continuo (con 100 clip, mille ridisegni al
    // secondo). Alla card serve solo sapere se la clip che la precede è in onda.
    const prevClipIdForNextUp = React.useMemo(() => {
        if (!parentColumn) return null;
        const clipIdx = parentColumn.clips.findIndex(c => c.id === clip.id);
        if (clipIdx <= 0) return null;
        const prevClip = parentColumn.clips[clipIdx - 1];
        return prevClip.nextAction === 'play_next' ? prevClip.id : null;
    }, [parentColumn, clip.id]);
    const isNextUp = useAudioStore((state) => prevClipIdForNextUp !== null && !!state.activeClips[prevClipIdForNextUp]);

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

    // v1.15.36 (tema Pad luminosi): in onda il pad si accende del colore della
    // colonna; il testo diventa scuro o bianco secondo la tinta (utils/colorInk).
    const lightInk = prefersLightInk(effectiveColor);
    // Una cue in corso prende il posto dei tasti assegnati nella riga in basso:
    // nelle colonne strette tasto + cue + timer non ci starebbero insieme.
    const cueActive = inIntro || inOutroPre || inOutroActive;

    return (
        <div
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            className={`clip
                ${isPlaying ? 'live' : ''}
                ${isPlaying && lightInk ? 'ink-light' : ''}
                ${isNextUp && !isPlaying ? 'upnext' : ''}
                ${(clip.hasPlayed && clip.type === 'preshow' && !isPlaying) ? 'played' : ''}
                ${clip.isMissing ? 'missing' : ''}
                ${isSelected ? 'picked' : ''}
                ${isMidiLearnMode ? 'learn' : ''}
            `}
            style={{
                // override per-clip del colore colonna (preserva il colore custom della clip)
                '--col-color': effectiveColor,
                '--col-ink': inkFor(effectiveColor),
            } as React.CSSProperties}
        >
            {/* LED in alto nel colore della colonna (bianco in onda, verde se è il prossimo) */}
            <span className="clip-led" />

            {/* Riga badge: altezza fissa anche vuota (anti-scatto) */}
            <div className="clip-badges">
                {/* Missing File (v0.14.2): primo badge, rosso pieno; il pad diventa rosso scuro */}
                {clip.isMissing && (
                    <span className="badge b-missing">
                        <AlertTriangle />
                        {t('card.missingFile', 'FILE MANCANTE')}
                    </span>
                )}
                {isPlaying && (
                    <span className="badge b-air">
                        <span className="led r pulse" style={{ width: 6, height: 6 }} />
                        {t('card.onAirBadge', 'IN ONDA')}
                    </span>
                )}
                {isNextUp && <span className="badge b-upnext pulse">{t('card.upNextBadge', '▶ UP NEXT')}</span>}
                {isFading && <span className="badge b-fade pulse">{t('card.fadeOutBadge', 'FADE OUT')}</span>}
                {clip.isAnalyzing && (
                    <span className="badge b-trim">
                        <span className="led a pulse" style={{ width: 6, height: 6 }} />
                        {t('card.trimmingBadge', 'TRIM…')}
                    </span>
                )}
                {clip.isLooping && <span className="badge b-loop">{t('card.loopBadge', 'LOOP')}</span>}
                {clip.nextAction === 'play_next' && !isNextUp && <span className="badge b-next">{t('card.nextBadge', 'NEXT')}</span>}
                {clip.duckingRole === 'source' && <span className="badge b-prio">{t('card.priorityBadge', 'PRIORITY')}</span>}
                {/* 2026-07-04 — Intro: stesso colore del marker Intro nel Waveform Editor (ciano) */}
                {clip.introMarker !== undefined && clip.introMarker > 0 && (
                    <span className="badge b-intro" title={t('card.introTip', 'Fine intro (ingresso voce)')}>
                        I {Math.round(clip.introMarker)}s
                    </span>
                )}
                {/* 2026-07-01 — BPM stimato (solo colonna Music, solo visualizzazione) */}
                {clip.type === 'music' && clip.bpm !== undefined && (
                    <span className="badge b-bpm" title={t('card.bpmTip', 'BPM stimato (analisi automatica)')}>
                        {clip.bpm} BPM
                    </span>
                )}
                {clip.notes && (
                    <span className="badge b-note" title={clip.notes}>
                        <ClipboardList />
                    </span>
                )}
            </div>

            <div className="clip-title">
                {clip.isMissing ? clip.name : (clip.title || clip.name)}
            </div>
            {/* v0.16.4: artista (solo clip music con tag ID3), su una riga sua */}
            {clip.type === 'music' && clip.artist && (
                <div className="clip-artist">{clip.artist}</div>
            )}

            {/* Riga in basso: tasti assegnati (o la cue in corso) + timer, altezza fissa */}
            <div className="clip-meta">
                <span className="clip-chips">
                    {!cueActive && clip.keybind && (
                        <span className="kbd" title={`Keybind: ${clip.keybind}`}>
                            {clip.keybind.replace('Key', '').replace('Digit', '')}
                        </span>
                    )}
                    {!cueActive && clip.midiBind && (
                        <span className="midi">{clip.midiBind.replace('NOTE:', 'M')}</span>
                    )}
                    {/* Visual Cues Real-Time (v0.12.0) */}
                    {inIntro && (
                        <span className="cue c-intro pulse">INTRO -{formatTime(introRemaining)}</span>
                    )}
                    {inOutroPre && (
                        <span className="cue c-outro pulse">OUTRO IN -{formatTime(outroRemainingPre)}</span>
                    )}
                    {inOutroActive && (
                        <span className="cue c-outro">OUTRO</span>
                    )}
                </span>
                <span className={`clip-time ${isNearEnd ? 'warn pulse' : ''}`}>
                    {isPlaying ? `-${formatTime(remaining)}` : formatTime(duration)}
                </span>
            </div>

            {/* Avanzamento: barra in basso, solo in onda */}
            {isPlaying && (
                <div className="clip-gauge">
                    <i style={{ width: `${progress * 100}%` }} />
                </div>
            )}
        </div>
    );
};
