import React, { useEffect, useState } from 'react';
import { useDebugStore } from '../../store/useDebugStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import AudioContextManager from '../../engine/AudioContextManager';

const DebugOverlay: React.FC = () => {
    const { isVisible, logs, clear } = useDebugStore();
    const activeClips = useAudioStore((state) => state.activeClips);
    // v1.4.4 — AUDIO MONITOR: stato omologazione + readout live (polling solo a overlay aperto)
    const loudnessNormEnabled = useSettingsStore((s) => s.loudnessNormEnabled);
    const loudnessTargetLufs = useSettingsStore((s) => s.loudnessTargetLufs);
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!isVisible) return;
        const id = setInterval(() => setTick((t) => (t + 1) % 1_000_000), 100);
        return () => clearInterval(id);
    }, [isVisible]);

    if (!isVisible) return null;

    // Gain reduction live dalla Master Chain (negativo = sta comprimendo; ~0 = gentile/inattivo)
    let glueGR = 0, limiterGR = 0;
    try {
        const acm = AudioContextManager.getInstance();
        glueGR = acm.getCompressorReduction();
        limiterGR = acm.getLimiterReduction();
    } catch { /* contesto non ancora pronto */ }

    const loudnessInfo = (clip: { loudnessLufs?: number }): string => {
        if (clip.loudnessLufs === undefined || !isFinite(clip.loudnessLufs)) return 'non misurata';
        if (!loudnessNormEnabled) return `${clip.loudnessLufs.toFixed(1)} LUFS (omolog. OFF)`;
        const g = Math.max(-9, Math.min(9, loudnessTargetLufs - clip.loudnessLufs));
        return `${clip.loudnessLufs.toFixed(1)} LUFS → ${g >= 0 ? '+' : ''}${g.toFixed(1)} dB`;
    };

    // v1.4.1: copia robusta del log. navigator.clipboard può rigettare (permesso,
    // focus) → try/catch + fallback execCommand su textarea temporanea, così il
    // bottone COPY non genera più "error" e copia comunque. Nessun throw all'utente.
    const copyLogs = async (): Promise<void> => {
        const text = logs.map(l => `[${l.time}] ${l.type.toUpperCase()}: ${l.msg}`).join('\n');
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return;
            }
            throw new Error('clipboard API non disponibile');
        } catch {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            } catch {
                // ultima istanza: non bloccare l'utente, il log resta visibile a schermo
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-row font-mono text-xs">
            {/* Left Panel: State Dump */}
            <div className="w-1/2 h-full bg-black/80 text-green-400 p-4 overflow-auto pointer-events-auto border-r border-green-800">
                <h3 className="font-bold mb-2 border-b border-green-800 pb-1">STATE INSPECTOR</h3>

                {/* v1.4.4 — AUDIO MONITOR: verifica live Glue Multibanda + Omologazione */}
                <div className="mb-4">
                    <h4 className="text-white bg-green-900/50 px-1">Audio Monitor</h4>
                    <div className="mt-1 space-y-0.5">
                        <div>Glue Multibanda GR: <span className={glueGR < -0.1 ? 'text-cyan-300' : 'text-gray-500'}>{glueGR.toFixed(1)} dB</span></div>
                        <div>Limiter GR: <span className={limiterGR < -0.1 ? 'text-amber-300' : 'text-gray-500'}>{limiterGR.toFixed(1)} dB</span></div>
                        <div>Omologazione: <span className={loudnessNormEnabled ? 'text-cyan-300' : 'text-gray-500'}>{loudnessNormEnabled ? `ON (target ${loudnessTargetLufs} LUFS)` : 'OFF'}</span></div>
                        <div className="text-gray-500 text-[10px] italic">GR negativo = sta lavorando; ~0 = gentile/inattivo</div>
                        {Object.entries(activeClips).map(([id, state]) => (
                            <div key={id} className="text-green-300">• {state.clip.name}: {loudnessInfo(state.clip)}</div>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="text-white bg-green-900/50 px-1">Active Clips ({Object.keys(activeClips).length})</h4>
                    <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(
                            Object.entries(activeClips).reduce((acc, [id, state]) => ({
                                ...acc,
                                [id]: {
                                    name: state.clip.name,
                                    isPlaying: state.isPlaying,
                                    progress: state.progress.toFixed(2),
                                    nextAction: state.clip.nextAction,
                                    fadeOut: state.clip.fadeOut,
                                    fadeIn: state.clip.fadeIn
                                }
                            }), {}),
                            null, 2
                        )}
                    </pre>
                </div>
            </div>

            {/* Right Panel: Logs */}
            <div className="w-1/2 h-full bg-black/80 text-gray-300 p-4 overflow-auto pointer-events-auto">
                <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
                    <h3 className="font-bold text-white">LOG STREAM</h3>
                    <div>
                        <button onClick={() => { void copyLogs(); }} className="bg-blue-900/50 hover:bg-blue-900 text-blue-200 px-2 py-0.5 rounded text-xs border border-blue-800 mr-2">
                            COPY
                        </button>
                        <button onClick={clear} className="bg-red-900/50 hover:bg-red-900 text-red-200 px-2 py-0.5 rounded text-xs border border-red-800">
                            CLEAR
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    {logs.map((log, idx) => (
                        <div key={idx} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' :
                            log.type === 'event' ? 'text-yellow-400' : 'text-gray-400'
                            }`}>
                            <span className="opacity-50 select-none">[{log.time}]</span>
                            <span>{log.msg}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DebugOverlay;
