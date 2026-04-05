import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Scissors, Timer, Flag, Music } from 'lucide-react';
import { toFileUrl } from '../../utils/pathUtils';

interface WaveformEditorProps {
    path: string;
    trimStart: number;
    trimEnd: number;
    introMarker: number;
    outroMarker: number;
    onChange: (updates: { trimStart?: number; trimEnd?: number; introMarker?: number; outroMarker?: number }) => void;
}

/**
 * SAFE WAVEFORM EDITOR (Draft Mode)
 * Questo componente sostituisce Wavesurfer con un player standard HTML5 
 * per prevenire i crash di memoria (Access Violation) su file WAV di grandi dimensioni.
 */
export const WaveformEditor: React.FC<WaveformEditorProps> = ({
    path, trimStart, trimEnd, introMarker, outroMarker, onChange
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    const fileUrl = toFileUrl(path);

    // Sync audio state
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoaded(true);
        };
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, [path]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !audioRef.current || duration === 0) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        audioRef.current.currentTime = percentage * duration;
    };

    // Helper per convertire pixel in secondi
    const getPosFromTime = (time: number) => (time / duration) * 100;

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-6 select-none">
            <audio ref={audioRef} src={fileUrl} />
            
            {/* Header / Controls */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={togglePlay}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>
                    <div>
                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Status</div>
                        <div className="text-sm font-mono text-emerald-400">
                            {isLoaded ? 'PRONTO (Streaming Mode)' : 'CARICAMENTO...'}
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Position</div>
                    <div className="text-lg font-mono text-zinc-300">
                        {currentTime.toFixed(2)}s / <span className="text-zinc-500">{duration.toFixed(2)}s</span>
                    </div>
                </div>
            </div>

            {/* Simulated Waveform (The "Draft") */}
            <div className="space-y-2">
                <div 
                    ref={progressBarRef}
                    onClick={handleSeek}
                    className="relative h-24 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden cursor-pointer group"
                >
                    {/* Background "Fake" Waveform - Semplici barre per dare l'idea */}
                    <div className="absolute inset-0 flex items-center justify-around px-2 opacity-20 group-hover:opacity-30 transition-opacity">
                        {[...Array(40)].map((_, i) => (
                            <div key={i} className="w-1 bg-zinc-500 rounded-full" style={{ height: `${20 + Math.random() * 60}%` }} />
                        ))}
                    </div>

                    {/* Progress Fill */}
                    <div 
                        className="absolute inset-y-0 left-0 bg-emerald-500/10 border-r border-emerald-500/50 z-10"
                        style={{ width: `${getPosFromTime(currentTime)}%` }}
                    />

                    {/* TRIM START Area */}
                    <div 
                        className="absolute inset-y-0 left-0 bg-red-950/40 border-r-2 border-red-500 z-20 pointer-events-none"
                        style={{ width: `${getPosFromTime(trimStart)}%` }}
                    >
                        <span className="absolute top-1 right-1 text-[8px] text-red-400 font-bold bg-zinc-950 px-1 rounded">START</span>
                    </div>

                    {/* TRIM END Area */}
                    <div 
                        className="absolute inset-y-0 right-0 bg-red-950/40 border-l-2 border-red-500 z-20 pointer-events-none"
                        style={{ width: `${getPosFromTime(trimEnd)}%` }}
                    >
                        <span className="absolute top-1 left-1 text-[8px] text-red-400 font-bold bg-zinc-950 px-1 rounded">END</span>
                    </div>

                    {/* INTRO Marker Line */}
                    {introMarker > 0 && (
                        <div 
                            className="absolute inset-y-0 w-0.5 bg-cyan-400 z-30 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                            style={{ left: `${getPosFromTime(introMarker)}%` }}
                        >
                            <span className="absolute bottom-1 left-1 text-[8px] text-cyan-400 font-bold bg-zinc-950 px-1 rounded">INTRO</span>
                        </div>
                    )}

                    {/* OUTRO Marker Line */}
                    {outroMarker > 0 && (
                        <div 
                            className="absolute inset-y-0 w-0.5 bg-orange-400 z-30 shadow-[0_0_10px_rgba(251,146,60,0.5)]"
                            style={{ left: `${getPosFromTime(outroMarker)}%` }}
                        >
                            <span className="absolute bottom-1 right-1 text-[8px] text-orange-400 font-bold bg-zinc-950 px-1 rounded">OUTRO</span>
                        </div>
                    )}
                </div>
                
                <div className="flex justify-between text-[9px] text-zinc-600 font-bold uppercase">
                    <span>0.00s</span>
                    <span>Clicca sulla barra per navigare</span>
                    <span>{duration.toFixed(2)}s</span>
                </div>
            </div>

            {/* Quick Actions / Info */}
            <div className="grid grid-cols-4 gap-2">
                <button 
                    onClick={() => onChange({ trimStart: currentTime })}
                    className="flex flex-col items-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors group"
                >
                    <Scissors size={14} className="text-zinc-500 group-hover:text-red-400 mb-1" />
                    <span className="text-[9px] text-zinc-500 uppercase">Set Trim Start</span>
                </button>
                <button 
                    onClick={() => onChange({ trimEnd: Math.max(0, duration - currentTime) })}
                    className="flex flex-col items-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors group"
                >
                    <Scissors size={14} className="text-zinc-500 group-hover:text-red-400 mb-1" />
                    <span className="text-[9px] text-zinc-500 uppercase">Set Trim End</span>
                </button>
                <button 
                    onClick={() => onChange({ introMarker: currentTime })}
                    className="flex flex-col items-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors group"
                >
                    <Flag size={14} className="text-zinc-500 group-hover:text-cyan-400 mb-1" />
                    <span className="text-[9px] text-zinc-500 uppercase">Set Intro</span>
                </button>
                <button 
                    onClick={() => onChange({ outroMarker: currentTime })}
                    className="flex flex-col items-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors group"
                >
                    <Flag size={14} className="text-zinc-500 group-hover:text-orange-400 mb-1" />
                    <span className="text-[9px] text-zinc-500 uppercase">Set Outro</span>
                </button>
            </div>

            <div className="bg-emerald-950/10 border border-emerald-900/30 rounded p-3 flex items-center gap-3">
                <Music size={18} className="text-emerald-500" />
                <div className="text-[10px] text-emerald-300/80 leading-tight">
                    <strong>MODALITÀ STABILITÀ ATTIVA:</strong> La waveform visiva è stata disabilitata per gestire file di grandi dimensioni senza crash. I marker funzionano in tempo reale durante l'ascolto.
                </div>
            </div>
        </div>
    );
};
