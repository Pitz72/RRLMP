import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';
import { AudioClip } from '../../types';

// Hero "IN ONDA" — banner ON AIR del tema Spectrum.
// SOLA LETTURA dello stato esistente (activeClips dello store): non modifica nulla,
// non avvia/ferma clip. Replica fedele del markup .hero del prototipo.

const fmt = (s: number): string => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
};

// Priorità di scelta del brano "in onda" da mettere in evidenza.
// v1.10.13: 'sfx' RIMOSSO — gli effetti del pad (brevi, spesso sovrapposti ad
// altro) non devono far comparire/cambiare la hero (riscontro dev). Il loro
// riscontro visivo è il pad acceso + il badge sul toggle FX.
const TYPE_PRIORITY = ['music', 'preshow', 'voice', 'asset'];

export const NowPlayingHero: React.FC = () => {
    const { t } = useTranslation();
    const activeClips = useAudioStore((s) => s.activeClips);
    const columns = useProjectStore((s) => s.columns);

    // Esclusi gli FX anche dal fallback "prima clip attiva".
    const actives = Object.values(activeClips).filter((a) => a.clip.type !== 'sfx');
    // Scegli la clip da mostrare: music > preshow > voice > altro; fallback alla prima attiva.
    let onAir: typeof actives[number] | null = null;
    for (const type of TYPE_PRIORITY) {
        const found = actives.find((a) => a.clip.type === type);
        if (found) { onAir = found; break; }
    }
    if (!onAir && actives.length > 0) onAir = actives[0];

    // Niente in onda → l'hero non si mostra (recupera spazio per le colonne).
    if (!onAir) return null;

    const clip = onAir?.clip;
    const col = clip ? columns.find((c) => c.clips.some((cl) => cl.id === clip.id)) : undefined;

    // Clip successiva (solo se la corrente concatena con play_next).
    let nextClip: AudioClip | null = null;
    if (clip && col && clip.nextAction === 'play_next') {
        const idx = col.clips.findIndex((c) => c.id === clip.id);
        for (let k = idx + 1; k < col.clips.length; k++) {
            if (!col.clips[k].isMissing) { nextClip = col.clips[k]; break; }
        }
    }

    const progress = onAir?.progress ?? 0;
    const dur = clip?.duration || 0;
    const loop = !!clip?.isLooping;
    const elapsed = progress * dur;
    const remaining = loop ? null : Math.max(0, dur - elapsed);

    // Marker intro/outro (posizioni assolute nella clip).
    const introT = clip?.introMarker || 0;
    const outroT = clip?.outroMarker || 0;
    // Cue OUTRO: come in ClipCard, nelle battute prima del marker di outro.
    const inOutroPre = outroT > 0 && elapsed < outroT && (outroT - elapsed) <= 15;

    // Timer a fasi (solo visualizzazione):
    //  - intro (azzurro): conto alla rovescia alla FINE dell'intro;
    //  - corpo (bianco): tempo reale ESATTO a fine brano (durata − trascorso);
    //  - outro (arancione): dal marker di outro in poi;
    //  - ultimi 10s (rosso lampeggiante) hanno priorità.
    const rem = remaining ?? 0;
    const final10 = !loop && rem <= 10;
    let timerColor = '#ffffff';
    let timerText: string;
    if (loop) {
        timerText = 'LOOP';
    } else if (introT > 0 && elapsed < introT) {
        timerColor = '#22d3ee';
        timerText = fmt(introT - elapsed);
    } else if (final10) {
        timerColor = '#ef4444';
        timerText = `-${fmt(rem)}`;
    } else if (outroT > 0 && elapsed >= outroT) {
        timerColor = '#fb923c';
        timerText = `-${fmt(rem)}`;
    } else {
        timerText = `-${fmt(rem)}`;
    }

    const bars = 56;
    const wave = (
        <div className="hero-wave">
            {Array.from({ length: bars }).map((_, i) => {
                const on = i / bars < progress;
                const h = 24 + Math.abs(Math.sin(i * 0.7 + elapsed * 0.6)) * 70;
                return <i key={i} className={on ? 'on' : ''} style={{ height: `${h}%` }} />;
            })}
            {dur > 0 && introT > 0 && introT < dur && (
                <span className="hero-mark intro" style={{ left: `${(introT / dur) * 100}%` }} />
            )}
            {dur > 0 && outroT > 0 && outroT < dur && (
                <span className="hero-mark outro" style={{ left: `${(outroT / dur) * 100}%` }} />
            )}
        </div>
    );

    return (
        <div className="hero">
            <div className="hero-onair">
                <span className={`dot ${clip ? 'pulse' : ''}`} style={clip ? undefined : { background: '#52525b', boxShadow: 'none' }} />
                <span>ON AIR</span>
            </div>

            <div className="hero-info">
                <span className="hero-label">{clip ? `IN ONDA · ${col?.title ?? ''}` : 'OFF AIR'}</span>
                <span className="hero-title">{clip ? (clip.title || clip.name) : '—'}</span>
                <span className="hero-artist">
                    {clip ? (clip.artist || (loop ? t('nowPlaying.inLoop', 'In loop') : ' ')) : t('nowPlaying.noTrack', 'Nessun brano in onda')}
                </span>
            </div>

            {wave}

            <div className="hero-right">
                <div className={`hero-count ${final10 ? 'pulse' : ''}`} style={{ color: timerColor }}>
                    {timerText}
                </div>
                {inOutroPre && (
                    <div className="hero-cue pulse">OUTRO IN {fmt(outroT - elapsed)}</div>
                )}
            </div>

            {nextClip && (
                <div className="hero-next">
                    <span className="nlbl">UP NEXT</span>
                    <span className="ntitle">{nextClip.title || nextClip.name}</span>
                </div>
            )}
        </div>
    );
};
