import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import MidiManager from '../../engine/MidiManager';
import { Keyboard, X, Info } from 'lucide-react';

interface KeymappingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface BindTarget {
    id: string; // 'stopAll', 'masterVolume', or clip.id
    type: 'global' | 'clip';
    name: string;
    colId?: string;
    keybind: string;
    midiBind: string;
}

export const KeymappingModal: React.FC<KeymappingModalProps> = ({ isOpen, onClose }) => {
    const { columns, updateClip } = useProjectStore();
    const { globalMidiBinds, setGlobalMidiBind } = useSettingsStore();

    const [pendingMidiTarget, setPendingMidiTarget] = useState<BindTarget | null>(null);

    // Filter and prepare binds
    const globalTargets: BindTarget[] = [
        {
            id: 'stopAll',
            type: 'global',
            name: 'GLOBAL: Stop All',
            keybind: '', // No keybinds for global yet, maybe later
            midiBind: globalMidiBinds['stopAll'] || ''
        },
        {
            id: 'masterVolume',
            type: 'global',
            name: 'GLOBAL: Master Volume',
            keybind: '',
            midiBind: globalMidiBinds['masterVolume'] || ''
        }
    ];

    const clipTargets: BindTarget[] = columns.flatMap(col => 
        col.clips
            // Only show clips that have at least one bind, or show all? 
            // Better to show ALL clips to allow central assignment, or just bound ones?
            // "Gestione centralizzata" implies we should list all clips so we can map them here.
            .map(clip => ({
                id: clip.id,
                colId: col.id,
                type: 'clip' as const,
                name: clip.name,
                keybind: clip.keybind || '',
                midiBind: clip.midiBind || ''
            }))
    );

    const allTargets = [...globalTargets, ...clipTargets];

    // MIDI Learn Listener for the Modal
    useEffect(() => {
        if (!isOpen || !pendingMidiTarget) return;

        const handleMidi = (note: number, _velocity: number, command: number) => {
            const type = command === 144 ? 'NOTE' : (command === 176 ? 'CC' : null);
            if (!type) return;

            const bindString = `${type}:${note}`;
            
            if (pendingMidiTarget.type === 'global') {
                setGlobalMidiBind(pendingMidiTarget.id, bindString);
            } else if (pendingMidiTarget.type === 'clip' && pendingMidiTarget.colId) {
                // If CC is bound to a clip, it won't trigger in App.tsx (App.tsx ignores CC for clips), 
                // but we let them map it. Actually App.tsx says: "if (command !== 144) return" for clips. 
                // We'll map it as NOTE: or CC:, but let's be flexible.
                updateClip(pendingMidiTarget.colId, pendingMidiTarget.id, { midiBind: bindString });
            }
            
            setPendingMidiTarget(null);
        };

        const unsubscribe = MidiManager.getInstance().addListener(handleMidi);
        return () => unsubscribe();
    }, [isOpen, pendingMidiTarget, setGlobalMidiBind, updateClip]);

    // Cleanup pending state on close
    useEffect(() => {
        if (!isOpen) {
            setPendingMidiTarget(null);
        }
    }, [isOpen]);


    if (!isOpen) return null;

    const handleClearKey = (target: BindTarget) => {
        if (target.type === 'clip' && target.colId) {
            updateClip(target.colId, target.id, { keybind: '' });
        }
    };

    const handleClearMidi = (target: BindTarget) => {
        if (target.type === 'global') {
            setGlobalMidiBind(target.id, '');
        } else if (target.type === 'clip' && target.colId) {
            updateClip(target.colId, target.id, { midiBind: '' });
        }
    };

    const handleKeydownCapture = (e: React.KeyboardEvent, target: BindTarget) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (target.type === 'global') {
            // Global keybinds not supported in App.tsx yet, so we ignore or show alert
            return;
        }

        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Delete') {
            handleClearKey(target);
        } else {
            if (target.type === 'clip' && target.colId) {
                updateClip(target.colId, target.id, { keybind: e.code });
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 rounded-lg border border-zinc-700 w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                
                {/* HEADER */}
                <div className="p-4 flex justify-between items-center border-b border-zinc-800 bg-zinc-950/50 rounded-t-lg shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Keyboard className="text-cyan-400" /> Keybinds & MIDI Dashboard
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* INFO BOARD */}
                <div className="bg-cyan-950/20 border-b border-cyan-900/30 p-3 shrink-0 flex items-start gap-3">
                    <Info className="text-cyan-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-cyan-200/70 leading-relaxed">
                        Clicca negli input <strong className="text-white">Keyboard</strong> e premi un vero tasto per assegnarlo al volo alla clip. 
                        Clicca sul pulsante <strong className="text-white">MIDI Learn</strong> e premi un controller fisico per associare funzionalità globali o clip.
                        Per rimuovere un'associazione, premi la <strong className="text-red-400">X</strong> rossa o usa Backspace.
                    </p>
                </div>

                {/* SCROLLABLE LIST */}
                <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-950/80 sticky top-0 z-10 border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-3 font-bold text-zinc-400 text-xs uppercase">Target Name</th>
                                <th className="px-6 py-3 font-bold text-zinc-400 text-xs uppercase">Type</th>
                                <th className="px-6 py-3 font-bold text-zinc-400 text-xs uppercase w-64">Keyboard Bind</th>
                                <th className="px-6 py-3 font-bold text-zinc-400 text-xs uppercase w-64">MIDI Bind</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {allTargets.map(target => (
                                <tr key={target.id} className="hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-6 py-3">
                                        <span className={`font-semibold ${target.type === 'global' ? 'text-purple-400' : 'text-zinc-200'}`}>
                                            {target.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        {target.type === 'global' ? (
                                            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">System</span>
                                        ) : (
                                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Clip</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        {target.type === 'global' ? (
                                            <span className="text-zinc-600 text-xs italic">Not Supported</span>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={target.keybind}
                                                    readOnly
                                                    placeholder="Click to set..."
                                                    className={`w-32 bg-zinc-950 border rounded p-1.5 text-xs text-yellow-400 font-mono text-center cursor-pointer outline-none transition-all
                                                        ${target.keybind ? 'border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.1)]' : 'border-zinc-800 opacity-50 hover:opacity-100 hover:border-zinc-600'}`
                                                    }
                                                    onKeyDown={(e) => handleKeydownCapture(e, target)}
                                                    onClick={(e) => (e.currentTarget as HTMLInputElement).focus()}
                                                />
                                                {target.keybind && (
                                                    <button onClick={() => handleClearKey(target)} className="text-zinc-600 hover:text-red-500">
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            {pendingMidiTarget?.id === target.id ? (
                                                <div className="w-32 bg-cyan-950 border border-cyan-500 text-cyan-400 rounded p-1.5 text-xs text-center font-bold animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                                                    LISTENING...
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setPendingMidiTarget(target)}
                                                    className={`w-32 rounded p-1.5 text-xs font-mono text-center transition-all border
                                                        ${target.midiBind 
                                                            ? 'bg-zinc-950 border-cyan-500/50 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.1)] hover:border-cyan-400' 
                                                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 opacity-50 hover:opacity-100 hover:border-zinc-600'
                                                        }`}
                                                >
                                                    {target.midiBind ? target.midiBind.replace('NOTE:', 'Note ').replace('CC:', 'CC ') : 'Learn MIDI'}
                                                </button>
                                            )}

                                            {target.midiBind && pendingMidiTarget?.id !== target.id && (
                                                <button onClick={() => handleClearMidi(target)} className="text-zinc-600 hover:text-red-500">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {allTargets.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-zinc-500 italic">
                                        Nessun elemento da mappare. Aggiungi delle clip al progetto.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER */}
                <div className="bg-zinc-950 p-4 border-t border-zinc-800 flex justify-end shrink-0 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded text-sm font-bold transition-all border border-zinc-700 hover:border-zinc-600"
                    >
                        Chiudi Pannello
                    </button>
                </div>
            </div>
        </div>
    );
};
