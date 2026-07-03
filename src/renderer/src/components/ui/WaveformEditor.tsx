import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Scissors, Flag, Music, ZoomIn, ZoomOut, Zap } from 'lucide-react';
import { toFileUrl } from '../../utils/pathUtils';
import { toast } from '../../store/useToastStore';
import { useTranslation } from 'react-i18next';

type DraggingMarker = 'trimStart' | 'trimEnd' | 'intro' | 'outro' | null;

/**
 * Handle trascinabile sulla waveform (Trim Start/End, Intro, Outro).
 *
 * v1.3.15: estratto a componente top-level (prima era definito INLINE nel body di
 * WaveformEditor → nuova identità a ogni render → React remontava i 4 handle).
 * Stateless: riceve duration/dragging/startDrag come props esplicite.
 */
interface DragHandleProps {
    leftPct: number;
    marker: Exclude<DraggingMarker, null>;
    color: string;
    label: string;
    show?: boolean;
    duration: number;
    dragging: DraggingMarker;
    startDrag: (marker: DraggingMarker) => (e: React.MouseEvent) => void;
}

const DragHandle: React.FC<DragHandleProps> = ({
    leftPct, marker, color, label, show = true, duration, dragging, startDrag,
}) => {
    if (!show || duration === 0) return null;
    const isActive = dragging === marker;
    return (
        <div
            className="absolute inset-y-0 z-40 flex items-center justify-center"
            style={{ left: `${leftPct}%`, width: '20px', marginLeft: '-10px', cursor: 'ew-resize' }}
            onMouseDown={startDrag(marker)}
            title={`Trascina per spostare ${label}`}
        >
            {/* Grip bar */}
            <div
                className="flex flex-col items-center justify-center gap-[3px] rounded-sm transition-all duration-75"
                style={{
                    width:   isActive ? '8px' : '6px',
                    height:  '40px',
                    backgroundColor: color,
                    opacity: isActive ? 1 : 0.75,
                    boxShadow: isActive ? `0 0 10px ${color}` : 'none',
                }}
            >
                <div style={{ width: '2px', height: '10px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '1px' }} />
                <div style={{ width: '2px', height: '10px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '1px' }} />
            </div>
            {/* Label */}
            <span
                className="absolute text-[7px] font-bold whitespace-nowrap px-1 rounded pointer-events-none select-none"
                style={{
                    bottom: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color,
                    backgroundColor: '#09090b',
                    border: `1px solid ${color}30`,
                }}
            >
                {label}
            </span>
        </div>
    );
};

interface WaveformEditorProps {
    path: string;
    trimStart: number;
    trimEnd: number;
    introMarker: number;
    outroMarker: number;
    onChange: (updates: { trimStart?: number; trimEnd?: number; introMarker?: number; outroMarker?: number }) => void;
}

/**
 * WAVEFORM EDITOR v2 — Drag & Drop Interattivo (v0.14.1)
 *
 * Architettura "Main-Side-Heavy": i Peak Data sono generati via FFmpeg nel processo
 * Node.js (IPC) e inviati al renderer come array di float normalizzati (max 200 barre).
 * Il renderer NON decodifica mai file audio pesanti — nessun rischio di Access Violation.
 *
 * I 4 handle (Trim Start, Trim End, Intro, Outro) sono trascinabili direttamente sulla
 * waveform. I listener mousemove/mouseup sono registrati su document per seguire il
 * cursore anche fuori dai bordi del container.
 *
 * Refs sono usati per i valori "live" nelle closure del drag, evitando stale values
 * senza dover includere tutto nelle dependencies degli useEffect.
 */
export const WaveformEditor: React.FC<WaveformEditorProps> = ({
    path, trimStart, trimEnd, introMarker, outroMarker, onChange
}) => {
    const { t } = useTranslation();
    const audioRef    = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Refs per valori "live" nelle closure di drag (evita stale closure senza re-registrare listeners)
    const onChangeRef    = useRef(onChange);
    const trimStartRef   = useRef(trimStart);
    const trimEndRef     = useRef(trimEnd);
    const durationRef    = useRef(0);
    onChangeRef.current  = onChange;
    trimStartRef.current = trimStart;
    trimEndRef.current   = trimEnd;

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [isPlaying,         setIsPlaying]         = useState(false);
    const [duration,          setDuration]          = useState(0);
    const [currentTime,       setCurrentTime]       = useState(0);
    const [isLoaded,          setIsLoaded]          = useState(false);
    const [peaks,             setPeaks]             = useState<number[]>([]);
    const [isAnalyzing,       setIsAnalyzing]       = useState(true);
    const [dragging,          setDragging]          = useState<DraggingMarker>(null);
    const [zoom,              setZoom]              = useState(1);
    const [isDetectingCues,   setIsDetectingCues]   = useState(false);

    const fileUrl = toFileUrl(path);

    // Aggiorna durationRef in sync con lo stato
    useEffect(() => { durationRef.current = duration; }, [duration]);

    // ─── Waveform peaks dal Main Process (FFmpeg) ───────────────────────────────
    useEffect(() => {
        // AUDIT-ME (2026-05-29): guardia anti-race. Cambiando clip rapidamente, una
        // getWaveformData() precedente poteva risolversi DOPO quella nuova e
        // sovrascrivere i peaks con la waveform del file sbagliato. Il flag `cancelled`
        // scarta i risultati di effetti ormai superati.
        let cancelled = false;
        setIsAnalyzing(true);
        setPeaks([]);
        if (window.electron?.getWaveformData) {
            window.electron.getWaveformData(path)
                .then(res => {
                    if (cancelled) return;
                    if (res.success && res.data) setPeaks(res.data);
                    setIsAnalyzing(false);
                })
                .catch(() => { if (!cancelled) setIsAnalyzing(false); });
        } else {
            setIsAnalyzing(false);
        }
        return () => { cancelled = true; };
    }, [path]);

    // ─── Sync stato audio ───────────────────────────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onLoaded = () => { setDuration(audio.duration); setIsLoaded(true); };
        const onTime   = () => setCurrentTime(audio.currentTime);
        const onPlay   = () => setIsPlaying(true);
        const onPause  = () => setIsPlaying(false);
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('timeupdate',     onTime);
        audio.addEventListener('play',           onPlay);
        audio.addEventListener('pause',          onPause);
        return () => {
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('timeupdate',     onTime);
            audio.removeEventListener('play',           onPlay);
            audio.removeEventListener('pause',          onPause);
        };
    }, [path]);

    // ─── Drag listeners globali (seguono il cursore anche fuori dal container) ──
    useEffect(() => {
        if (!dragging) return;

        const getTime = (clientX: number): number => {
            if (!containerRef.current || durationRef.current === 0) return 0;
            const rect  = containerRef.current.getBoundingClientRect();
            const ratio = (clientX - rect.left) / rect.width;
            return Math.max(0, Math.min(durationRef.current, ratio * durationRef.current));
        };

        const onMove = (e: MouseEvent) => {
            e.preventDefault();
            const t   = getTime(e.clientX);
            const dur = durationRef.current;
            const ts  = trimStartRef.current;
            const te  = trimEndRef.current;

            if (dragging === 'trimStart') {
                // Non può superare il punto finale della clip (duration - trimEnd)
                const max = dur - te - 0.05;
                onChangeRef.current({ trimStart: Math.max(0, Math.min(t, max > 0 ? max : 0)) });

            } else if (dragging === 'trimEnd') {
                // trimEnd = secondi tagliati dalla FINE. Handle è a (duration - trimEnd) dalla sx.
                const newTrimEnd = Math.max(0, dur - t);
                const max = dur - ts - 0.05;
                onChangeRef.current({ trimEnd: Math.min(newTrimEnd, max > 0 ? max : 0) });

            } else if (dragging === 'intro') {
                onChangeRef.current({ introMarker: t });

            } else if (dragging === 'outro') {
                onChangeRef.current({ outroMarker: t });
            }
        };

        const onUp = () => setDragging(null);

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onUp);
        };
    }, [dragging]); // Solo dragging — tutti i valori live acceduti via ref

    // ─── Smart Cues ─────────────────────────────────────────────────────────────
    const handleSmartCues = async () => {
        if (!window.electron?.detectSmartCues || isDetectingCues) return;
        setIsDetectingCues(true);
        try {
            const res = await window.electron.detectSmartCues(path);
            if (res.success && res.data) {
                const updates: Parameters<typeof onChange>[0] = {};
                if (res.data.introCue > 0) updates.introMarker = res.data.introCue;
                if (res.data.outroCue > 0) updates.outroMarker = res.data.outroCue;
                if (Object.keys(updates).length > 0) {
                    onChange(updates);
                    toast(t('waveform.smartCuesDone', 'Smart Cues — Intro: {{intro}}s · Outro: {{outro}}s', { intro: res.data.introCue.toFixed(2), outro: res.data.outroCue.toFixed(2) }), 'success');
                } else {
                    toast(t('waveform.smartCuesNone', 'Smart Cues: nessun cue significativo rilevato.'), 'warning');
                }
            } else {
                // v1.2.22 (NEW-ME-01): distinguere rate-limit dagli errori reali
                if (res.error === 'IPC_RATE_LIMITED') {
                    toast(t('waveform.smartCuesBusy', 'Smart Cues in coda — troppe operazioni FFmpeg parallele. Riprova tra qualche secondo.'), 'warning');
                } else {
                    toast(t('waveform.smartCuesError', 'Smart Cues: {{err}}', { err: res.error ?? t('waveform.smartCuesAnalysisErr', 'errore durante l\'analisi FFmpeg') }), 'error');
                }
            }
        } finally {
            setIsDetectingCues(false);
        }
    };

    // ─── Handlers ───────────────────────────────────────────────────────────────
    const togglePlay = () => {
        if (!audioRef.current) return;
        isPlaying ? audioRef.current.pause() : audioRef.current.play();
    };

    const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (dragging || !containerRef.current || !audioRef.current || duration === 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
    };

    const startDrag = (marker: DraggingMarker) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Non triggera handleSeekClick
        setDragging(marker);
    };

    // ─── Helpers posizione (%) ───────────────────────────────────────────────────
    const pct = (t: number): number => duration > 0 ? Math.max(0, Math.min(100, (t / duration) * 100)) : 0;
    // Posizione dell'handle Trim End: da sx = (duration - trimEnd) / duration
    const trimEndPct = duration > 0 ? Math.max(0, Math.min(100, ((duration - trimEnd) / duration) * 100)) : 100;

    // ─── Zoom helpers ────────────────────────────────────────────────────────────
    const ZOOM_STEPS = [1, 2, 3, 4, 6, 8];
    const zoomIn  = () => setZoom(z => ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, ZOOM_STEPS.indexOf(z) + 1)]);
    const zoomOut = () => setZoom(z => ZOOM_STEPS[Math.max(0, ZOOM_STEPS.indexOf(z) - 1)]);

    // Ruler ticks: più dettaglio con zoom alto
    const rulerTicks = React.useMemo(() => {
        const count = zoom <= 1 ? 3 : zoom <= 2 ? 5 : zoom <= 4 ? 9 : 13;
        if (duration === 0) return [];
        return Array.from({ length: count }, (_, i) => (duration * i) / (count - 1));
    }, [zoom, duration]);

    // ─── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 select-none">
            <audio ref={audioRef} src={fileUrl} preload="metadata" />

            {/* ── Header: player + position ── */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={togglePlay}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                    >
                        {isPlaying
                            ? <Pause size={18} fill="currentColor" />
                            : <Play  size={18} fill="currentColor" className="ml-0.5" />
                        }
                    </button>
                    <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t('waveform.statusLabel', 'Stato')}</div>
                        <div className="text-xs font-mono text-emerald-400">
                            {isLoaded ? t('waveform.ready', 'PRONTO') : t('waveform.loading', 'CARICAMENTO...')}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t('waveform.position', 'Posizione')}</div>
                    <div className="text-sm font-mono text-zinc-300">
                        {currentTime.toFixed(2)}s <span className="text-zinc-600">/ {duration.toFixed(2)}s</span>
                    </div>
                </div>
            </div>

            {/* ── Waveform zone ── */}
            <div className="space-y-1">

                {/* Legenda */}
                <div className="flex items-center gap-4 mb-1 flex-wrap">
                    <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 uppercase">
                        <span className="inline-block w-2 h-2 rounded-sm bg-red-500" /> Trim
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 uppercase">
                        <span className="inline-block w-0.5 h-3 bg-cyan-400" /> Intro
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-orange-400 uppercase">
                        <span className="inline-block w-0.5 h-3 bg-orange-400" /> Outro
                    </span>
                    <span className="ml-auto text-[9px] text-zinc-600 italic normal-case">
                        {t('waveform.hint', 'Click → Seek · Trascina handle → Sposta marker')}
                    </span>
                    <div className="flex items-center gap-1 ml-3">
                        <button
                            onClick={zoomOut}
                            disabled={zoom === ZOOM_STEPS[0]}
                            className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-all"
                            title={t('waveform.zoomOut', 'Zoom Out')}
                        >
                            <ZoomOut size={11} className="text-zinc-400" />
                        </button>
                        <span className="text-[9px] font-mono text-zinc-500 w-5 text-center">{zoom}x</span>
                        <button
                            onClick={zoomIn}
                            disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                            className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-all"
                            title={t('waveform.zoomIn', 'Zoom In')}
                        >
                            <ZoomIn size={11} className="text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/*
                 * OUTER container: cattura eventi click/drag, NON ha overflow-hidden
                 * così gli handle possono sporgere leggermente dai bordi visivi.
                 * INNER container: ha overflow-hidden per clippare peaks e fill areas.
                 */}
                <div ref={scrollContainerRef} className="overflow-x-auto rounded-lg">
                <div
                    ref={containerRef}
                    onClick={handleSeekClick}
                    className="relative h-24"
                    style={{
                        width: zoom > 1 ? `${zoom * 100}%` : '100%',
                        cursor: dragging ? 'ew-resize' : 'pointer'
                    }}
                >
                    {/* ── INNER: visual layer clippato ── */}
                    <div className="absolute inset-0 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden pointer-events-none">

                        {/* Peaks */}
                        <div className="absolute inset-0 flex items-center justify-between px-0.5 opacity-50">
                            {isAnalyzing ? (
                                <div className="w-full flex justify-center items-center h-full">
                                    <span className="text-zinc-500 font-mono text-[10px] animate-pulse">
                                        {t('waveform.analyzing', 'Analisi waveform (Node.js)...')}
                                    </span>
                                </div>
                            ) : peaks.length > 0 ? (
                                peaks.map((p, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-emerald-500 mx-[0.5px] rounded-full"
                                        style={{ height: `${Math.max(2, p * 100)}%` }}
                                    />
                                ))
                            ) : (
                                <div className="w-full text-center text-zinc-600 text-[10px]">
                                    {t('waveform.unavailable', 'Waveform non disponibile — riproduzione standard')}
                                </div>
                            )}
                        </div>

                        {/* Progress fill (playhead area) */}
                        <div
                            className="absolute inset-y-0 left-0 bg-emerald-500/10 border-r border-emerald-400/40 z-10"
                            style={{ width: `${pct(currentTime)}%` }}
                        />

                        {/* Playhead line */}
                        {currentTime > 0 && duration > 0 && (
                            <div
                                className="absolute inset-y-0 w-px bg-white/40 z-15"
                                style={{ left: `${pct(currentTime)}%` }}
                            />
                        )}

                        {/* Trim Start: zona rossa sinistra */}
                        <div
                            className="absolute inset-y-0 left-0 bg-red-950/60 border-r-2 border-red-500 z-20"
                            style={{ width: `${pct(trimStart)}%` }}
                        >
                            {trimStart > 0 && (
                                <span className="absolute top-1 right-1 text-[7px] text-red-400 font-bold bg-zinc-950/90 px-1 rounded">
                                    CUT
                                </span>
                            )}
                        </div>

                        {/* Trim End: zona rossa destra */}
                        <div
                            className="absolute inset-y-0 right-0 bg-red-950/60 border-l-2 border-red-500 z-20"
                            style={{ width: `${100 - trimEndPct}%` }}
                        >
                            {trimEnd > 0 && (
                                <span className="absolute top-1 left-1 text-[7px] text-red-400 font-bold bg-zinc-950/90 px-1 rounded">
                                    CUT
                                </span>
                            )}
                        </div>

                        {/* Intro marker line */}
                        {introMarker > 0 && (
                            <div
                                className="absolute inset-y-0 w-0.5 bg-cyan-400 z-30"
                                style={{
                                    left: `${pct(introMarker)}%`,
                                    boxShadow: '0 0 8px rgba(34,211,238,0.6)',
                                }}
                            />
                        )}

                        {/* Outro marker line */}
                        {outroMarker > 0 && (
                            <div
                                className="absolute inset-y-0 w-0.5 bg-orange-400 z-30"
                                style={{
                                    left: `${pct(outroMarker)}%`,
                                    boxShadow: '0 0 8px rgba(251,146,60,0.6)',
                                }}
                            />
                        )}
                    </div>

                    {/* ── OUTER: drag handles (non clippati) ── */}
                    <DragHandle
                        leftPct={pct(trimStart)}
                        marker="trimStart"
                        color="#ef4444"
                        label="TRIM S"
                        duration={duration}
                        dragging={dragging}
                        startDrag={startDrag}
                    />
                    <DragHandle
                        leftPct={trimEndPct}
                        marker="trimEnd"
                        color="#ef4444"
                        label="TRIM E"
                        duration={duration}
                        dragging={dragging}
                        startDrag={startDrag}
                    />
                    <DragHandle
                        leftPct={pct(introMarker)}
                        marker="intro"
                        color="#22d3ee"
                        label="INTRO"
                        show={introMarker > 0}
                        duration={duration}
                        dragging={dragging}
                        startDrag={startDrag}
                    />
                    <DragHandle
                        leftPct={pct(outroMarker)}
                        marker="outro"
                        color="#fb923c"
                        label="OUTRO"
                        show={outroMarker > 0}
                        duration={duration}
                        dragging={dragging}
                        startDrag={startDrag}
                    />
                </div>
                </div>

                {/* Ruler — si adatta al livello di zoom */}
                <div className="overflow-x-auto">
                <div
                    className="flex justify-between text-[9px] text-zinc-600 font-mono"
                    style={{ width: zoom > 1 ? `${zoom * 100}%` : '100%' }}
                >
                    {rulerTicks.length > 0
                        ? rulerTicks.map((t, i) => (
                            <span key={i} className={i === 0 || i === rulerTicks.length - 1 ? '' : 'text-zinc-700'}>
                                {t.toFixed(t < 10 ? 2 : 1)}s
                            </span>
                        ))
                        : <><span>0.00s</span><span>—</span></>
                    }
                </div>
                </div>
            </div>

            {/* ── Smart Cues ── */}
            <button
                onClick={handleSmartCues}
                disabled={isDetectingCues || !isLoaded}
                className="w-full flex items-center justify-center gap-2 p-2 bg-zinc-900 hover:bg-violet-900/40 border border-zinc-800 hover:border-violet-500/60 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={t('waveform.smartCuesTip', 'Analizza il brano e suggerisce automaticamente Intro e Outro Cue tramite FFmpeg')}
            >
                <Zap size={13} className={isDetectingCues ? 'text-violet-400 animate-pulse' : 'text-zinc-500'} />
                <span className="text-[9px] font-bold uppercase text-zinc-500 hover:text-zinc-300 transition-colors">
                    {isDetectingCues ? t('waveform.smartCuesAnalyzing', 'Analisi Smart Cues...') : t('waveform.smartCuesAuto', 'Smart Cues (Auto)')}
                </span>
            </button>

            {/* ── Quick Set Buttons ── */}
            <div className="grid grid-cols-4 gap-2">
                <button
                    onClick={() => onChange({ trimStart: Math.max(0, Math.min(currentTime, Math.max(0, duration - trimEnd - 0.05))) })}
                    className="flex flex-col items-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/50 rounded transition-all group"
                    title={t('waveform.trimStartTip', 'Imposta Trim Start alla posizione corrente')}
                >
                    <Scissors size={14} className="text-zinc-500 group-hover:text-red-400 mb-1 transition-colors" />
                    <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 uppercase transition-colors">{t('waveform.btnTrimStart', 'Trim Start')}</span>
                </button>
                <button
                    onClick={() => onChange({ trimEnd: Math.min(Math.max(0, duration - currentTime), Math.max(0, duration - trimStart - 0.05)) })}
                    className="flex flex-col items-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/50 rounded transition-all group"
                    title={t('waveform.trimEndTip', 'Imposta Trim End alla posizione corrente')}
                >
                    <Scissors size={14} className="text-zinc-500 group-hover:text-red-400 mb-1 transition-colors" />
                    <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 uppercase transition-colors">{t('waveform.btnTrimEnd', 'Trim End')}</span>
                </button>
                <button
                    onClick={() => onChange({ introMarker: currentTime })}
                    className="flex flex-col items-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 rounded transition-all group"
                    title={t('waveform.setIntroTip', 'Imposta Intro alla posizione corrente')}
                >
                    <Flag size={14} className="text-zinc-500 group-hover:text-cyan-400 mb-1 transition-colors" />
                    <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 uppercase transition-colors">{t('waveform.btnSetIntro', 'Set Intro')}</span>
                </button>
                <button
                    onClick={() => onChange({ outroMarker: currentTime })}
                    className="flex flex-col items-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500/50 rounded transition-all group"
                    title={t('waveform.setOutroTip', 'Imposta Outro alla posizione corrente')}
                >
                    <Flag size={14} className="text-zinc-500 group-hover:text-orange-400 mb-1 transition-colors" />
                    <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 uppercase transition-colors">{t('waveform.btnSetOutro', 'Set Outro')}</span>
                </button>
            </div>

            {/* ── Banner architettura ── */}
            <div className="bg-emerald-950/10 border border-emerald-900/30 rounded p-3 flex items-center gap-3">
                <Music size={16} className="text-emerald-500 shrink-0" />
                <div className="text-[10px] text-emerald-300/70 leading-tight">
                    <strong>MAIN-SIDE-HEAVY:</strong> {t('waveform.engineBanner', 'Waveform generata da FFmpeg (Node.js) — Chromium non carica mai il file audio in memoria. Crash prevention attivo.')}
                </div>
            </div>
        </div>
    );
};
