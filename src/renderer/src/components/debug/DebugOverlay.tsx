import React, { useEffect, useState } from 'react';
import { useDebugStore } from '../../store/useDebugStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';

const DebugOverlay: React.FC = () => {
    const { isVisible, logs, clear } = useDebugStore();
    const activeClips = useAudioStore((state) => state.activeClips);
    const audioStoreState = useAudioStore.getState(); // Static check setup
    // Fetch a relevant clip for inspection? Maybe just show active ones.

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-row font-mono text-xs">
            {/* Left Panel: State Dump */}
            <div className="w-1/2 h-full bg-black/80 text-green-400 p-4 overflow-auto pointer-events-auto border-r border-green-800">
                <h3 className="font-bold mb-2 border-b border-green-800 pb-1">STATE INSPECTOR</h3>

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
                    <button onClick={clear} className="bg-red-900/50 hover:bg-red-900 text-red-200 px-2 py-0.5 rounded text-xs border border-red-800">
                        CLEAR
                    </button>
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
