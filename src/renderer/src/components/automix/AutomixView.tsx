import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../store/useProjectStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { assessCompatibility, crossfadeDurationSec } from '../../engine/automixEngine';
import { toast } from '../../store/useToastStore';
import { debugLog } from '../../store/useDebugStore';
import { Square, X, Disc3, Music2, Play, Shuffle } from 'lucide-react';

// AUTOMIX SECTION — Fase C1 (v1.10.22) + C2 deck/transizione (v1.10.23) +
// auto a fine brano (v1.10.24). v1.10.25: restyling in linguaggio Spectrum
// (riscontro utente: "manca un po' di estetica in linea con Spectrum Live") —
// SOLO markup/classi, logica invariata. Le classi .amx-* vivono in spectrum.css
// e riusano il vocabolario del tema: deck IN ONDA = .hero, righe = .clip,
// pulsantone = .btn-green, toggle = .tgl, chiusura = .ov-x, STOP ALL = .stop.
//
// Scelte deliberate (invariate):
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
const CompatDot: React.FC<{ level: 'green' | 'yellow' | 'red'; label: string }> = ({ level, label }) => (
    <span className="amx-compat" title={label}>
        <span className={`amx-dot ${level === 'green' ? 'g' : level === 'yellow' ? 'y' : 'r'}`} />
        <span>{label}</span>
    </span>
);

// Mappa reason → [chiave i18n, default IT]. Risolta con t() ai punti d'uso
// (dentro il componente), perché a livello di modulo t non è in scope.
const REASON_LABEL: Record<string, [string, string]> = {
    'missing-bpm': ['automix.reason.missingBpm', 'BPM mancante → crossfade classico'],
    'missing-offset': ['automix.reason.noBeat', 'beat non rilevato → crossfade classico'],
    'low-confidence': ['automix.reason.lowConfidence', 'beat incerto → crossfade classico'],
    'rate-cap': ['automix.reason.rateCap', 'tempi troppo diversi → crossfade classico'],
    'no-beat-available': ['automix.reason.noBeatAvailable', 'aggancio non disponibile → crossfade classico'],
};

export const AutomixView: React.FC<AutomixViewProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
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
                    toast(t('automix.autoTransitionSkipped', 'Auto-transizione non eseguita: {{v}}', { v: result.reason ?? t('automix.invalidState', 'stato non valido') }), 'warning');
                }
            });
        }
    }, [isOpen, autoMode, currentClip, nextClip, remaining, currentDuration, currentTime, automixTransition]);

    if (!isOpen) return null;

    // Colore della colonna Music → border-left delle righe (stesso linguaggio .clip della board)
    const colColor = musicCol?.customColor ?? musicCol?.color ?? '#EF4444';

    const nextCompat = currentClip && nextClip ? assessCompatibility(currentClip, nextClip) : null;
    const nextCompatLabel = nextCompat
        ? (nextCompat.rate !== undefined
            ? t('automix.mixInTempo', 'mix a tempo (rate {{v}})', { v: nextCompat.rate.toFixed(3) })
            : (REASON_LABEL[nextCompat.reason ?? '']
                ? t(REASON_LABEL[nextCompat.reason!][0], REASON_LABEL[nextCompat.reason!][1])
                : t('automix.classicCrossfade', 'crossfade classico')))
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
            toast(t('automix.transitionSkipped', 'Transizione non eseguita: {{v}}', { v: result.reason ?? t('automix.invalidState', 'stato non valido') }), 'warning');
        }
    };

    return (
        <div className="amx" style={{ '--col-color': colColor } as React.CSSProperties}>
            {/* HEADER */}
            <div className="amx-head">
                <div className="amx-brand">
                    <div className="amx-ico"><Disc3 size={20} /></div>
                    <div>
                        <div className="amx-name">AUTOMIX</div>
                        <div className="amx-sub">{t('automix.autoMixOnBpm', 'Mix automatico sui BPM')} · {musicCol?.title ?? 'Music'}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={stopAll}
                        className="stop"
                        title={t('automix.stopAllTitle', "Ferma tutto (come in board — ESC resta l'Emergency Stop)")}
                    >
                        <Square fill="currentColor" /> STOP ALL
                    </button>
                    <button onClick={onClose} className="ov-x" title={t('automix.backToBoard', 'Torna alla board')}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* DECK — IN ONDA | TRANSIZIONE | PROSSIMO */}
            <div className="amx-deckrow">
                {/* IN ONDA (linguaggio .hero) */}
                <div className={`amx-deck ${currentClip ? 'onair' : ''}`}>
                    <div className="amx-deck-label">{t('automix.onAir', 'IN ONDA')}</div>
                    {currentClip ? (
                        <>
                            <div className="amx-deck-title">{currentClip.name}</div>
                            <div className="amx-deck-meta">
                                <span className={`amx-bpm ${currentClip.bpm ? '' : 'off'}`}>{currentClip.bpm ? `${currentClip.bpm} BPM` : 'NO BPM'}</span>
                                <span>{formatTime(currentTime)} / {formatTime(currentDuration)}</span>
                                <span className={`amx-remain ${remaining < 20 ? 'warn' : ''}`}>-{formatTime(remaining)}</span>
                            </div>
                            <div className="amx-prog">
                                <i style={{ width: `${currentDuration > 0 ? Math.min(100, (currentTime / currentDuration) * 100) : 0}%` }} />
                            </div>
                        </>
                    ) : (
                        <p className="amx-deck-empty">{t('automix.nothingOnAir', 'Niente in onda — premi START per partire dal primo brano.')}</p>
                    )}
                </div>

                {/* PULSANTONE + AUTO */}
                <div className="amx-center">
                    {currentClip ? (
                        <>
                            <button
                                onClick={() => void handleTransition()}
                                disabled={!nextClip || nextClip.isMissing}
                                className="amx-big"
                                title={nextClip ? t('automix.mixTowards', 'Mixa verso: {{v}}', { v: nextClip.name }) : t('automix.endOfPlaylist', 'Fine scaletta')}
                            >
                                <Shuffle size={18} /> TRANSIZIONE
                            </button>
                            <p className="amx-hint">
                                {nextClip ? (nextClip.isMissing ? t('automix.nextFileMissing', 'prossimo file MANCANTE') : nextCompatLabel) : t('automix.endOfPlaylistLower', 'fine scaletta')}
                            </p>
                        </>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={clips.every(c => c.isMissing)}
                            className="amx-big"
                        >
                            <Play size={18} fill="currentColor" /> START
                        </button>
                    )}
                    {/* AUTO A FINE BRANO (default OFF, attiva solo a vista aperta) — toggle .tgl del tema */}
                    <label className="tgl" title={t('automix.autoEndTitle', 'Quando il brano sta per finire, la transizione parte da sola (stessa logica del pulsante). Si disattiva chiudendo la vista.')}>
                        <span className="tgl-lbl" style={autoMode ? { color: '#4ade80', fontWeight: 700 } : undefined}>{t('automix.autoAtEnd', 'Auto a fine brano')}</span>
                        <div onClick={() => setAutoMode(v => !v)} className={`tgl-track ${autoMode ? 'on' : ''}`}>
                            <div className="tgl-knob" />
                        </div>
                    </label>
                </div>

                {/* PROSSIMO (linguaggio .hero-next) */}
                <div className="amx-deck next">
                    <div className="amx-deck-label">{t('automix.next', 'PROSSIMO')}</div>
                    {nextClip ? (
                        <>
                            <div className="amx-deck-title">{nextClip.name}</div>
                            <div className="amx-deck-meta">
                                <span className={`amx-bpm ${nextClip.bpm ? '' : 'off'}`}>{nextClip.bpm ? `${nextClip.bpm} BPM` : 'NO BPM'}</span>
                                <span>{formatTime(nextClip.duration || 0)}</span>
                            </div>
                            {nextCompat && (
                                <div style={{ marginTop: 10 }}>
                                    <CompatDot level={nextCompat.level} label={nextCompatLabel} />
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="amx-deck-empty">{currentClip ? t('automix.endNoTrackAfter', 'Fine scaletta — nessun brano dopo questo.') : t('automix.nextAppearsHere', 'Il prossimo brano compare qui a playlist avviata.')}</p>
                    )}
                </div>
            </div>

            {/* SCALETTA (righe in linguaggio .clip) */}
            <div className="amx-list">
                {clips.length === 0 ? (
                    <div className="amx-empty">
                        <Music2 size={40} />
                        <p style={{ fontSize: 13 }}>{t('automix.noTracksInPlaylist', 'Nessun brano in scaletta.')}</p>
                        <p style={{ fontSize: 11 }}>{t('automix.dragTracksHint', "Trascina i brani nella colonna Music della board: l'elenco compare qui nello stesso ordine.")}</p>
                    </div>
                ) : (
                    <div className="amx-list-inner">
                        {clips.map((clip, i) => {
                            const isPlaying = !!activeClips[clip.id] && !fadingClipIds.includes(clip.id);
                            const prev = i > 0 ? clips[i - 1] : null;
                            const compat = prev ? assessCompatibility(prev, clip) : null;
                            const compatLabel = compat
                                ? (compat.rate !== undefined
                                    ? t('automix.mixInTempo', 'mix a tempo (rate {{v}})', { v: compat.rate.toFixed(3) })
                                    : (REASON_LABEL[compat.reason ?? '']
                                        ? t(REASON_LABEL[compat.reason!][0], REASON_LABEL[compat.reason!][1])
                                        : t('automix.classicCrossfade', 'crossfade classico')))
                                : t('automix.firstTrack', 'primo brano');
                            return (
                                <div key={clip.id} className={`amx-row ${isPlaying ? 'live' : ''}`}>
                                    <span className="amx-num">{i + 1}</span>
                                    <div className="amx-row-main">
                                        <div className="amx-row-title">{clip.name}</div>
                                        {compat
                                            ? <CompatDot level={compat.level} label={compatLabel} />
                                            : <div className="amx-compat"><span>{t('automix.firstTrackStart', '▶ primo brano — parte con START')}</span></div>}
                                    </div>
                                    <span className="amx-time">{formatTime(clip.duration || 0)}</span>
                                    <span
                                        className={`amx-bpm ${clip.bpm ? '' : 'off'}`}
                                        title={clip.bpm ? t('automix.confidence', 'Confidence {{v}}', { v: clip.bpmConfidence ?? '—' }) : t('automix.bpmNotDetected', 'BPM non rilevato')}
                                    >
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
