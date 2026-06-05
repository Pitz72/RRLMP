import { useState } from 'react';
import { X, Send, Music } from 'lucide-react';
import MidiManager from '../../engine/MidiManager';

interface MidiSimulatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type MsgType = 'noteOn' | 'noteOff' | 'cc';

const TYPE_STATUS: Record<MsgType, number> = {
    noteOn: 0x90,
    noteOff: 0x80,
    cc: 0xb0,
};

/**
 * STRUMENTO DI TEST (no hardware MIDI). Inietta messaggi MIDI grezzi via
 * MidiManager.simulateMessage(), che passa per lo stesso handleMidiMessage di un
 * device fisico. Permette di verificare senza dispositivo:
 *  - Note On su qualsiasi canale 1-16 (fix audit canali ≠1)
 *  - completamento del flusso MIDI Learn (nota in arrivo dopo selezione clip)
 * Aperto con Ctrl+Shift+M (coerente col Debug Overlay su Ctrl+Shift+D).
 */
export const MidiSimulatorModal = ({ isOpen, onClose }: MidiSimulatorModalProps) => {
    const [channel, setChannel] = useState(1);   // 1-16 (UI), -1 nel byte
    const [note, setNote] = useState(60);          // 0-127 (nota o CC number)
    const [velocity, setVelocity] = useState(100); // 0-127 (velocity o CC value)
    const [type, setType] = useState<MsgType>('noteOn');
    const [lastSent, setLastSent] = useState<string | null>(null);

    if (!isOpen) return null;

    const send = () => {
        const ch = Math.max(1, Math.min(16, channel | 0));
        const n = Math.max(0, Math.min(127, note | 0));
        const v = Math.max(0, Math.min(127, velocity | 0));
        const command = TYPE_STATUS[type] | (ch - 1);
        MidiManager.getInstance().simulateMessage([command, n, v]);
        const label = type === 'cc' ? 'CC' : type === 'noteOff' ? 'Note Off' : 'Note On';
        setLastSent(
            `${label}  ch${ch}  ${type === 'cc' ? 'CC#' : 'nota'} ${n}  ` +
            `${type === 'cc' ? 'val' : 'vel'} ${v}  ·  raw [${command}, ${n}, ${v}]`
        );
    };

    const numField = (
        label: string,
        value: number,
        setter: (v: number) => void,
        min: number,
        max: number
    ) => (
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span>{label} <span className="text-zinc-600">({min}-{max})</span></span>
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
        </label>
    );

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-[420px] shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-2 mb-1">
                    <Music size={18} className="text-emerald-400" />
                    <h2 className="text-lg font-bold text-white">Simulatore MIDI</h2>
                </div>
                <p className="text-[11px] text-amber-500/80 mb-5 uppercase tracking-wide">
                    Strumento di test · nessun dispositivo richiesto
                </p>

                {/* TIPO MESSAGGIO */}
                <div className="flex gap-1.5 mb-4">
                    {([
                        ['noteOn', 'Note On'],
                        ['noteOff', 'Note Off'],
                        ['cc', 'Control Change'],
                    ] as [MsgType, string][]).map(([val, lab]) => (
                        <button
                            key={val}
                            onClick={() => setType(val)}
                            className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors border ${
                                type === val
                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white'
                            }`}
                        >
                            {lab}
                        </button>
                    ))}
                </div>

                {/* CAMPI */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {numField('Canale', channel, setChannel, 1, 16)}
                    {numField(type === 'cc' ? 'CC #' : 'Nota', note, setNote, 0, 127)}
                    {numField(type === 'cc' ? 'Valore' : 'Velocity', velocity, setVelocity, 0, 127)}
                </div>

                <button
                    onClick={send}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
                >
                    <Send size={15} />
                    Invia messaggio
                </button>

                {lastSent && (
                    <div className="mt-4 bg-zinc-950/70 border border-zinc-800 rounded p-2.5 text-[11px] font-mono text-zinc-400">
                        <span className="text-zinc-600">Ultimo inviato:</span><br />
                        <span className="text-emerald-400">{lastSent}</span>
                    </div>
                )}

                <p className="mt-4 text-[11px] text-zinc-500 leading-relaxed">
                    Note Off e Note On con velocity 0 vengono filtrati a monte (nessun
                    trigger) — comportamento atteso. Per testare il <b>MIDI Learn</b>:
                    attiva la modalità, seleziona una clip, poi invia una <b>Note On</b>.
                </p>
            </div>
        </div>
    );
};
