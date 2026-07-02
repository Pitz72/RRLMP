import React, { useState } from 'react';
import { X, Zap, Upload, Music4, Settings2 } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAudioStore } from '../../store/useAudioStore';
import { confirm } from '../../store/useConfirmStore';
import { ClipSettingsModal } from '../modals/ClipSettingsModal';
import type { AudioClip } from '../../types';

interface FxPadOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

// Estensioni audio accettate dal drop nativo (allineate a MainGrid.handleNativeDrop
// e ad ALLOWED_MEDIA_EXTENSIONS nel main).
const SUPPORTED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'wma', 'webm', 'mp4'];

/**
 * Step 3 (UI regia) — Minipad FX 5×5 "jingle machine".
 *
 * Overlay NON-bloccante: pannello flottante in basso a destra, senza backdrop a
 * schermo intero, così i click fuori dal pannello raggiungono la board e le
 * hotkey continuano a funzionare. Sostituisce la vecchia colonna FX nella griglia.
 *
 * La colonna `col-sfx` resta nel modello dati (bus SFX, polifonia, esenzione
 * take-over/ducking invariate nel motore audio): qui è solo una superficie di
 * presentazione. Lanciare un pad chiama `playClip(clip)` esattamente come faceva
 * la ClipCard → comportamento audio identico.
 *
 * ESC NON chiude il pad di proposito: ESC resta l'Emergency Stop globale. Si
 * chiude dal pulsante × o dal toggle nella topbar.
 */
export const FxPadOverlay: React.FC<FxPadOverlayProps> = ({ isOpen, onClose }) => {
    const columns = useProjectStore((s) => s.columns);
    const addClip = useProjectStore((s) => s.addClip);
    const removeClip = useProjectStore((s) => s.removeClip);
    const updateClip = useProjectStore((s) => s.updateClip);
    const activeClips = useAudioStore((s) => s.activeClips);
    const playClip = useAudioStore((s) => s.playClip);
    const stopClip = useAudioStore((s) => s.stopClip);
    const loadClip = useAudioStore((s) => s.loadClip);

    const [isDragOver, setIsDragOver] = useState(false);
    // v1.10.1: impostazioni clip FX dal pad (⚙ su hover) — con la colonna FX fuori
    // dalla griglia, questa è l'unica superficie da cui aprire ClipSettingsModal
    // per un effetto (volume/fade/trim/nome/colore/keybind).
    const [editingClip, setEditingClip] = useState<AudioClip | null>(null);

    const sfxCol = columns.find((c) => c.type === 'sfx');

    if (!isOpen) return null;

    const clips = sfxCol?.clips ?? [];
    // Pad minimo 5×5 = 25 celle; se ci sono più FX il pad cresce in righe (scroll).
    const cellCount = Math.max(25, Math.ceil(clips.length / 5) * 5);
    const cells = Array.from({ length: cellCount }, (_, i) => clips[i] as (typeof clips)[number] | undefined);

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (!sfxCol) return;
        if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
        const files = Array.from(e.dataTransfer.files).filter((file) => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            return ext && SUPPORTED_AUDIO_EXTENSIONS.includes(ext);
        });
        for (const file of files) {
            const newClip = addClip(sfxCol.id, file);
            if (newClip) await loadClip(newClip);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
    };

    const handleRemove = async (e: React.MouseEvent, clipId: string, label: string) => {
        e.stopPropagation();
        if (!sfxCol) return;
        if (await confirm(`Rimuovere l'effetto "${label}" dal pad?`, 'Rimuovi', 'Annulla')) {
            if (activeClips[clipId]) stopClip(clipId);
            removeClip(sfxCol.id, clipId);
        }
    };

    // Parità con MainGrid.handleSaveClip: snapshot undo PRIMA della modifica
    // (updateClip è condivisa con le scritture runtime che NON devono entrare
    // nella cronologia) + riallineamento live del player se la clip è in onda.
    const handleSaveClip = (clipId: string, updates: Partial<AudioClip>) => {
        if (!sfxCol) return;
        useProjectStore.getState()._snapshot();
        updateClip(sfxCol.id, clipId, updates);
        useAudioStore.getState().syncActiveClipSettings(clipId);
    };

    const handleDeleteClip = (clipId: string) => {
        if (!sfxCol) return;
        if (activeClips[clipId]) stopClip(clipId);
        removeClip(sfxCol.id, clipId);
    };

    const handleEdit = (e: React.MouseEvent, clip: AudioClip) => {
        e.stopPropagation();
        setEditingClip(clip);
    };

    const midiLabel = (bind?: string) => bind?.replace('NOTE:', 'N').replace('CC:', 'C');

    return (
        <>
        <div
            className={`fixed bottom-4 right-4 z-[150] w-[560px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col rounded-2xl border shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-colors ${
                isDragOver ? 'border-emerald-500' : 'border-zinc-700'
            }`}
            style={{ background: 'rgba(13,13,15,0.96)' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-slate-300" />
                    <span className="text-sm font-bold tracking-wider text-zinc-100">FX / CARTWALL</span>
                    <span className="text-[10px] font-mono text-zinc-500">{clips.length}</span>
                </div>
                <button
                    onClick={onClose}
                    title="Nascondi il pad FX"
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* BODY — griglia pad 5 colonne */}
            <div className="p-3 overflow-y-auto min-h-0">
                {!sfxCol ? (
                    <div className="h-40 flex items-center justify-center text-zinc-600 text-xs">
                        Nessuna colonna FX nel progetto.
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {cells.map((clip, idx) => {
                            if (!clip) {
                                return (
                                    <div
                                        key={`empty-${idx}`}
                                        className="h-20 rounded-lg border border-dashed border-zinc-800 flex items-center justify-center text-zinc-700"
                                    >
                                        <Music4 size={16} className="opacity-40" />
                                    </div>
                                );
                            }
                            const isPlaying = !!activeClips[clip.id];
                            const label = clip.title || clip.name;
                            const disabled = !!clip.isMissing;
                            return (
                                <button
                                    key={clip.id}
                                    disabled={disabled}
                                    onClick={() => (isPlaying ? stopClip(clip.id) : playClip(clip))}
                                    title={disabled ? `File mancante: ${label}` : label}
                                    className={`group relative h-20 rounded-lg border p-2 text-left flex flex-col justify-between transition-all overflow-hidden ${
                                        disabled
                                            ? 'border-red-800/60 bg-red-950/30 text-red-400/70 cursor-not-allowed'
                                            : isPlaying
                                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200 shadow-[0_0_18px_-4px_rgba(34,197,94,0.6)]'
                                                : 'border-zinc-700 bg-zinc-800/40 text-zinc-200 hover:border-slate-400 hover:bg-zinc-800'
                                    }`}
                                >
                                    <span className="text-[11px] font-semibold leading-tight line-clamp-2 pr-4">{label}</span>
                                    <div className="flex items-center gap-1">
                                        {clip.keybind && (
                                            <span className="text-[8px] font-bold font-mono px-1 py-0.5 rounded bg-black/40 text-slate-300">
                                                {clip.keybind.replace('Key', '').replace('Digit', '').replace('Numpad', 'N')}
                                            </span>
                                        )}
                                        {clip.midiBind && (
                                            <span className="text-[8px] font-bold font-mono px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                                                {midiLabel(clip.midiBind)}
                                            </span>
                                        )}
                                        {isPlaying && (
                                            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        )}
                                    </div>
                                    {/* Impostazioni clip (⚙ su hover, v1.10.1) */}
                                    <span
                                        role="button"
                                        tabIndex={-1}
                                        onClick={(e) => handleEdit(e, clip)}
                                        title="Impostazioni clip"
                                        className="absolute top-1 right-6 w-4 h-4 rounded flex items-center justify-center bg-black/50 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-cyan-300 transition-opacity"
                                    >
                                        <Settings2 size={11} />
                                    </span>
                                    {/* Rimuovi (× su hover) */}
                                    <span
                                        role="button"
                                        tabIndex={-1}
                                        onClick={(e) => handleRemove(e, clip.id, label)}
                                        title="Rimuovi dal pad"
                                        className="absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center bg-black/50 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                                    >
                                        <X size={11} />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FOOTER — hint */}
            <div className="px-4 py-2 border-t border-zinc-800 shrink-0 flex items-center gap-2 text-[10px] text-zinc-500">
                <Upload size={11} />
                <span>Trascina qui i file audio per aggiungere effetti · click per suonare/fermare · ESC = STOP ALL globale</span>
            </div>
        </div>

        {/* SETTINGS MODAL (v1.10.1) — stesso guscio della griglia (.ov z-200, sopra il pad) */}
        {editingClip && (
            <ClipSettingsModal
                clip={editingClip}
                isOpen={true}
                onClose={() => setEditingClip(null)}
                onSave={handleSaveClip}
                onDelete={handleDeleteClip}
            />
        )}
        </>
    );
};
