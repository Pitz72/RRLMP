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
    id: string;
    type: 'global' | 'clip';
    name: string;
    colId?: string;
    keybind: string;
    midiBind: string;
    systemKeybind?: string; // keybind fisso di sistema (non modificabile)
}

export const KeymappingModal: React.FC<KeymappingModalProps> = ({ isOpen, onClose }) => {
    const { columns, updateClip } = useProjectStore();
    const { globalMidiBinds, setGlobalMidiBind } = useSettingsStore();

    const [pendingMidiTarget, setPendingMidiTarget] = useState<BindTarget | null>(null);

    const globalTargets: BindTarget[] = [
        {
            id: '__emergency_stop',
            type: 'global',
            name: 'Emergency Stop (tutti i player)',
            keybind: '',
            midiBind: '',
            systemKeybind: 'Escape'
        },
        {
            id: 'stopAll',
            type: 'global',
            name: 'Stop All (MIDI)',
            keybind: '',
            midiBind: globalMidiBinds['stopAll'] || ''
        },
        {
            id: 'masterVolume',
            type: 'global',
            name: 'Master Volume (MIDI CC)',
            keybind: '',
            midiBind: globalMidiBinds['masterVolume'] || ''
        }
    ];

    // MIDI Learn Listener
    useEffect(() => {
        if (!isOpen || !pendingMidiTarget) return;

        const handleMidi = (note: number, _velocity: number, command: number) => {
            const type = command === 144 ? 'NOTE' : (command === 176 ? 'CC' : null);
            if (!type) return;

            const bindString = `${type}:${note}`;

            if (pendingMidiTarget.type === 'global') {
                setGlobalMidiBind(pendingMidiTarget.id, bindString);
            } else if (pendingMidiTarget.type === 'clip' && pendingMidiTarget.colId) {
                // MODAL-08 (v1.3.5): valida che colonna e clip esistano ancora prima
                // di scrivere. Se l'utente rimuove la clip in un'altra UI (selezione +
                // Canc) mentre il countdown Learn è attivo, `updateClip` su id orfano
                // sarebbe un no-op silenzioso, ma il bind verrebbe perso senza segnale.
                const col = columns.find(c => c.id === pendingMidiTarget.colId);
                const stillExists = col?.clips.some(cl => cl.id === pendingMidiTarget.id);
                if (stillExists) {
                    updateClip(pendingMidiTarget.colId, pendingMidiTarget.id, { midiBind: bindString });
                }
            }

            setPendingMidiTarget(null);
        };

        const unsubscribe = MidiManager.getInstance().addListener(handleMidi);
        return () => unsubscribe();
    }, [isOpen, pendingMidiTarget, setGlobalMidiBind, updateClip, columns]);

    // MODAL-03 (v1.3.5): ESC chiude la modale senza propagare al globalShortcut
    // Emergency Stop. Il `handleKeydownCapture` interno (sui cell input) gestisce
    // ESC come "clear keybind" e fa già stopPropagation: questo handler quindi
    // si attiva solo quando la modale è aperta ma nessun input cell ha focus.
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) setPendingMidiTarget(null);
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
        if (target.type !== 'clip' || !target.colId) return;

        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Delete') {
            handleClearKey(target);
        } else {
            updateClip(target.colId, target.id, { keybind: e.code });
        }
    };

    // ---- Render helpers ----

    const renderMidiCell = (target: BindTarget) => {
        // Sistema fisso (Emergency Stop) — nessun MIDI assegnabile
        if (target.id === '__emergency_stop') {
            return <span className="text-zinc-600 text-xs italic">—</span>;
        }

        return (
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
        );
    };

    const renderKeyCell = (target: BindTarget) => {
        if (target.systemKeybind) {
            return (
                <span className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-600 px-2 py-1 rounded font-mono">
                    {target.systemKeybind}
                </span>
            );
        }
        if (target.type === 'global') {
            return <span className="text-zinc-600 text-xs italic">—</span>;
        }
        return (
            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    value={target.keybind}
                    readOnly
                    placeholder="Click to set..."
                    className={`w-32 bg-zinc-950 border rounded p-1.5 text-xs text-yellow-400 font-mono text-center cursor-pointer outline-none transition-all
                        ${target.keybind ? 'border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.1)]' : 'border-zinc-800 opacity-50 hover:opacity-100 hover:border-zinc-600'}`}
                    onKeyDown={(e) => handleKeydownCapture(e, target)}
                    onClick={(e) => (e.currentTarget as HTMLInputElement).focus()}
                />
                {target.keybind && (
                    <button onClick={() => handleClearKey(target)} className="text-zinc-600 hover:text-red-500">
                        <X size={14} />
                    </button>
                )}
            </div>
        );
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
                        Clicca negli input <strong className="text-white">Keyboard</strong> e premi un tasto per assegnarlo alla clip.
                        Clicca <strong className="text-white">Learn MIDI</strong> e premi un controller fisico.
                        Per rimuovere usa la <strong className="text-red-400">X</strong> rossa o <kbd className="text-[10px] bg-zinc-800 px-1 rounded">Backspace</kbd>.
                        I binding <strong className="text-zinc-300">Sistema</strong> sono fissi e non modificabili.
                    </p>
                </div>

                {/* SCROLLABLE TABLE */}
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-950/80 sticky top-0 z-10 border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-3 font-bold text-zinc-400 text-xs uppercase">Target</th>
                                <th className="px-6 py-3 font-bold text-zinc-400 text-xs uppercase">Tipo</th>
                                <th className="px-6 py-3 font-bold text-zinc-400 text-xs uppercase w-52">Keyboard</th>
                                <th className="px-6 py-3 font-bold text-zinc-400 text-xs uppercase w-52">MIDI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">

                            {/* GLOBAL SECTION */}
                            <tr className="bg-zinc-950/60">
                                <td colSpan={4} className="px-6 py-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                                    — Azioni Globali di Sistema —
                                </td>
                            </tr>
                            {globalTargets.map(target => (
                                <tr key={target.id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-3">
                                        <span className="font-semibold text-purple-300">{target.name}</span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                            {target.systemKeybind ? 'Sistema' : 'Globale'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">{renderKeyCell(target)}</td>
                                    <td className="px-6 py-3">{renderMidiCell(target)}</td>
                                </tr>
                            ))}

                            {/* PER-COLUMN CLIP SECTIONS */}
                            {columns.map(col => (
                                <React.Fragment key={col.id}>
                                    <tr className="bg-zinc-950/60">
                                        <td colSpan={4} className="px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                                            style={{ color: col.color }}>
                                            — {col.title} ({col.clips.length} clip) —
                                        </td>
                                    </tr>
                                    {col.clips.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-2 text-xs text-zinc-600 italic">
                                                Nessuna clip in questa colonna
                                            </td>
                                        </tr>
                                    )}
                                    {col.clips.map(clip => {
                                        const target: BindTarget = {
                                            id: clip.id,
                                            colId: col.id,
                                            type: 'clip',
                                            name: clip.name,
                                            keybind: clip.keybind || '',
                                            midiBind: clip.midiBind || ''
                                        };
                                        return (
                                            <tr key={clip.id} className="hover:bg-zinc-800/30 transition-colors group">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: clip.customColor || col.color }} />
                                                        <span className="font-medium text-zinc-200 truncate max-w-[200px]">{clip.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Clip</span>
                                                </td>
                                                <td className="px-6 py-3">{renderKeyCell(target)}</td>
                                                <td className="px-6 py-3">{renderMidiCell(target)}</td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}

                            {columns.every(c => c.clips.length === 0) && globalTargets.length > 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-zinc-500 italic text-xs">
                                        Aggiungi clip al progetto per mapparle qui.
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
