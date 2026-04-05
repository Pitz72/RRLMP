import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';
import { toFileUrl } from '../../utils/pathUtils';
import { debugLog } from '../../store/useDebugStore';

interface WaveformEditorProps {
    path: string;
    trimStart: number;
    trimEnd: number;
    introMarker: number;
    outroMarker: number;
    onChange: (updates: { trimStart?: number; trimEnd?: number; introMarker?: number; outroMarker?: number }) => void;
}

export const WaveformEditor: React.FC<WaveformEditorProps> = ({
    path, trimStart, trimEnd, introMarker, outroMarker, onChange
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [zoom, setZoom] = useState(0); // 0 = Auto-fit (prevents massive canvas crash)
    const [wsDuration, setWsDuration] = useState(0);

    // Initialization
    useEffect(() => {
        if (!containerRef.current || !timelineRef.current) return;

        const fileUrl = toFileUrl(path);
        
        // Memory Fix: Use HTML5 Audio element instead of full WebAudio decoding for playback
        const audioElement = new Audio();
        audioElement.src = fileUrl;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#71717a', // zinc-500
            progressColor: '#10b981', // emerald-500
            cursorColor: '#10b981',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 120,
            normalize: true,
            media: audioElement, // Attach HTML5 audio
            // minPxPerSec is omitted here so it defaults to auto-fit container
        });

        wavesurferRef.current = ws;

        // Plugins
        const timeline = ws.registerPlugin(TimelinePlugin.create({
            container: timelineRef.current,
            height: 20,
            timeInterval: 1,
            primaryLabelInterval: 5,
            style: {
                fontSize: '10px',
                color: '#a1a1aa' // zinc-400
            }
        }));

        const wsRegions = ws.registerPlugin(RegionsPlugin.create());
        regionsRef.current = wsRegions;

        ws.on('ready', () => {
            setIsReady(true);
            setWsDuration(ws.getDuration());
            
            // Initialize regions when ready
            updateRegions(ws.getDuration());
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));

        // Handle Region Dragging
        wsRegions.on('region-updated', (region) => {
            const id = region.id;
            
            if (id === 'trim') {
                onChange({ 
                    trimStart: parseFloat(region.start.toFixed(3)), 
                    // trimEnd is from end of file, so we subtract from total duration
                    trimEnd: parseFloat((ws.getDuration() - region.end).toFixed(3)) 
                });
            } else if (id === 'intro') {
                onChange({ introMarker: parseFloat(region.end.toFixed(3)) });
            } else if (id === 'outro') {
                onChange({ outroMarker: parseFloat(region.start.toFixed(3)) });
            }
        });

        return () => {
            ws.destroy();
        };
    }, [path]); // Re-init if path changes

    // Update zoom
    useEffect(() => {
        if (wavesurferRef.current && isReady) {
            wavesurferRef.current.zoom(zoom);
        }
    }, [zoom, isReady]);

    // Keep regions in sync if external inputs change them
    const updateRegions = (totalDuration: number) => {
        if (!regionsRef.current) return;
        
        regionsRef.current.clearRegions();

        // 1. Trim Region (Blue)
        const tStart = trimStart || 0;
        const tEndSec = Math.max(0, totalDuration - (trimEnd || 0));
        if (tEndSec > tStart) {
            regionsRef.current.addRegion({
                id: 'trim',
                start: tStart,
                end: tEndSec,
                color: 'rgba(59, 130, 246, 0.2)', // blue-500 with opacity
                drag: true,
                resize: true,
                content: 'Playable Area'
            });
        }

        // 2. Intro Region (Emerald) - Start to Intro Marker
        if (introMarker > 0) {
            regionsRef.current.addRegion({
                id: 'intro',
                start: 0,
                end: introMarker,
                color: 'rgba(16, 185, 129, 0.3)', // emerald-500
                drag: true,
                resize: true,
                content: 'Intro'
            });
        }

        // 3. Outro Region (Orange) - Outro Marker to End
        if (outroMarker > 0 && outroMarker < totalDuration) {
            regionsRef.current.addRegion({
                id: 'outro',
                start: outroMarker,
                end: totalDuration,
                color: 'rgba(249, 115, 22, 0.3)', // orange-500
                drag: true,
                resize: true,
                content: 'Outro'
            });
        }
    };

    // Watch for external state changes to re-draw regions (only if ready)
    useEffect(() => {
        if (isReady && wsDuration > 0) {
            updateRegions(wsDuration);
        }
    }, [trimStart, trimEnd, introMarker, outroMarker, isReady, wsDuration]);

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={togglePlay}
                        disabled={!isReady}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                            isReady ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>
                    {!isReady && <span className="text-xs text-zinc-500 animate-pulse">Rendering Waveform...</span>}
                </div>

                <div className="flex items-center gap-2 bg-zinc-900 rounded p-1 border border-zinc-800">
                    <button onClick={() => setZoom(zoom === 0 ? 10 : Math.max(10, zoom - 20))} className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800">
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-xs text-zinc-500 font-mono w-12 text-center">{zoom === 0 ? 'AUTO' : `${zoom}px`}</span>
                    <button onClick={() => setZoom(zoom === 0 ? 30 : Math.min(500, zoom + 20))} className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800">
                        <ZoomIn size={16} />
                    </button>
                </div>
            </div>

            {/* Waveform Canvas */}
            <div className="relative w-full rounded overflow-hidden bg-zinc-900/50 border border-zinc-800/50">
                <div ref={containerRef} className="w-full" />
                <div ref={timelineRef} className="w-full border-t border-zinc-800/50" />
            </div>

            <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                <span>Total Length: {wsDuration.toFixed(2)}s</span>
                <span>Playable Length: {Math.max(0, wsDuration - trimStart - trimEnd).toFixed(2)}s</span>
            </div>
        </div>
    );
};