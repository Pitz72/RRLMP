import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';
import { AudioClip } from '../../types';

// Hero "IN ONDA" — banner ON AIR del tema Spectrum.
// SOLA LETTURA dello stato esistente (activeClips dello store): non modifica nulla,
// non avvia/ferma clip. Replica fedele del markup .hero del prototipo.
//
// v1.15.31 — hero FISSA: resta sempre montata (a riposo in stato OFF AIR) e ogni
// sua zona ha un ingombro costante. Prima compariva/spariva con la clip in onda
// e spingeva giù le colonne; cue OUTRO, UP NEXT e titoli di lunghezza diversa ne
// cambiavano altezza e larghezza durante il brano.

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

// Tra la fine di un brano e l'avvio del successivo (play_next con load asincrono)
// activeClips può restare vuoto per un istante: la hero tiene l'ultimo brano per
// questo tempo invece di lampeggiare su OFF AIR.
const IDLE_HOLD_MS = 600;

type ActiveEntry = ReturnType<typeof useAudioStore.getState>['activeClips'][string];

export const NowPlayingHero: React.FC = () => {
    const { t } = useTranslation();
    const activeClips = useAudioStore((s) => s.activeClips);
    const columns = useProjectStore((s) => s.columns);

    // Esclusi gli FX anche dal fallback "prima clip attiva".
    const actives = Object.values(activeClips).filter((a) => a.clip.type !== 'sfx');
    // Scegli la clip da mostrare: music > preshow > voice > altro; fallback alla prima attiva.
    let current: ActiveEntry | null = null;
    for (const type of TYPE_PRIORITY) {
        const found = actives.find((a) => a.clip.type === type);
        if (found) { current = found; break; }
    }
    if (!current && actives.length > 0) current = actives[0];

    // Tenuta anti-lampeggio (vedi IDLE_HOLD_MS).
    const heldRef = React.useRef<ActiveEntry | null>(null);
    const [, forceRender] = React.useReducer((x: number) => x + 1, 0);
    if (current) heldRef.current = current;
    const hasCurrent = !!current;
    React.useEffect(() => {
        if (hasCurrent || !heldRef.current) return;
        const id = setTimeout(() => { heldRef.current = null; forceRender(); }, IDLE_HOLD_MS);
        return () => clearTimeout(id);
    }, [hasCurrent]);

    const onAir = current ?? heldRef.current;
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
    const inOutroPre = !!clip && outroT > 0 && elapsed < outroT && (outroT - elapsed) <= 15;

    // Timer a fasi (solo visualizzazione):
    //  - intro (azzurro): conto alla rovescia alla FINE dell'intro;
    //  - corpo (bianco): tempo reale ESATTO a fine brano (durata − trascorso);
    //  - outro (arancione): dal marker di outro in poi;
    //  - ultimi 10s (rosso lampeggiante) hanno priorità.
    const rem = remaining ?? 0;
    const final10 = !!clip && !loop && rem <= 10;
    let timerColor = '#ffffff';
    let timerText: string;
    if (!clip) {
        timerColor = '#52525b';
        timerText = '--:--';
    } else if (loop) {
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
        <div className={`hero ${clip ? '' : 'idle'}`}>
            <div className="hero-onair">
                <span className={`dot ${clip ? 'pulse' : ''}`} />
                <span>{t('nowPlaying.onAir', 'ON AIR')}</span>
            </div>

            <div className="hero-info">
                <span className="hero-label">{clip ? `${t('nowPlaying.onAirLabel', 'IN ONDA')} · ${col?.title ?? ''}` : t('nowPlaying.offAir', 'OFF AIR')}</span>
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
                {/* Slot della cue sempre presente: comparendo non allunga la hero. */}
                <div className={`hero-cue ${inOutroPre ? 'pulse' : 'off'}`} aria-hidden={!inOutroPre}>
                    {t('nowPlaying.outroIn', 'OUTRO IN {{time}}', { time: fmt(Math.max(0, outroT - elapsed)) })}
                </div>
            </div>

            {/* Slot UP NEXT sempre presente e a larghezza fissa: comparendo non stringe l'onda. */}
            <div className={`hero-next ${nextClip ? '' : 'off'}`}>
                <span className="nlbl">{t('nowPlaying.upNext', 'UP NEXT')}</span>
                <span className="ntitle">{nextClip ? (nextClip.title || nextClip.name) : '—'}</span>
            </div>
        </div>
    );
};
