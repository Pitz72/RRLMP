import React, { useState } from 'react';
import { X, Zap, Upload, Music4, Settings2, ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { confirm } from '../../store/useConfirmStore';
import { toast } from '../../store/useToastStore';
import { ClipSettingsModal } from '../modals/ClipSettingsModal';
import { FxQuickSettingsModal } from '../modals/FxQuickSettingsModal';
import { hasSupportedAudioExtension } from '../../utils/audioExtensions';
import type { AudioClip } from '../../types';

interface FxPadOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

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
    // v1.10.4: MIDI Learn — in learn mode il click sul pad SELEZIONA la clip
    // (per l'assegnazione in App.handleMidiMessage) invece di suonarla,
    // parità con la ClipCard (AUDIT-LI v1.3.11: mai audio in onda durante il learn).
    const isMidiLearnMode = useProjectStore((s) => s.isMidiLearnMode);
    const selectedClipIds = useProjectStore((s) => s.selectedClipIds);
    const selectClip = useProjectStore((s) => s.selectClip);
    const activeClips = useAudioStore((s) => s.activeClips);
    const playClip = useAudioStore((s) => s.playClip);
    const stopClip = useAudioStore((s) => s.stopClip);
    const loadClip = useAudioStore((s) => s.loadClip);

    // v1.10.6: angolo del pad (sinistra/destra), preferenza globale persistita —
    // a destra copre NoteBoard/ultima colonna e l'angolo dei toast (z-200).
    const fxPadSide = useSettingsStore((s) => s.fxPadSide);
    const setFxPadSide = useSettingsStore((s) => s.setFxPadSide);

    const [isDragOver, setIsDragOver] = useState(false);
    // v1.10.1: impostazioni clip FX dal pad — con la colonna FX fuori dalla
    // griglia, il pad è l'unica superficie da cui configurare un effetto.
    // v1.10.11: due livelli — `quickClip` apre la modale RAPIDA (nome/colore/
    // volume/loop, il caso comune per una jingle machine); `editingClip` apre
    // la ClipSettingsModal completa (trim/marker/fade/keybind), raggiungibile
    // da "Impostazioni complete…" dentro la rapida.
    const [quickClip, setQuickClip] = useState<AudioClip | null>(null);
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
        // v1.10.7: whitelist centralizzata in utils/audioExtensions.ts
        const files = Array.from(e.dataTransfer.files).filter((file) => hasSupportedAudioExtension(file.name));
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
        // v1.10.3: il click sulla × focalizza il button-cella genitore → blur
        // per evitare che Space/Enter (es. durante il ConfirmDialog) lo ri-attivi.
        (e.currentTarget as HTMLElement).closest('button')?.blur();
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
        // v1.10.3: come handleRemove — niente focus residuo sul pad sotto la modale.
        (e.currentTarget as HTMLElement).closest('button')?.blur();
        // v1.10.11: ⚙/tasto destro aprono la modale rapida (la completa è linkata da lì)
        setQuickClip(clip);
    };

    // v1.10.8: libreria FX di default (CC0/PD, bundlata con l'app) — aggiunge al
    // pad i suoni di default MANCANTI (confronto per path in userData); gli FX
    // personali e i default già presenti non vengono toccati.
    const handleRestoreDefaults = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur();
        if (!sfxCol) return;
        if (!window.electron?.restoreDefaultSfx) return;
        if (!(await confirm(
            'Aggiungere al pad gli effetti di default mancanti (libreria inclusa nel software)? Gli FX già presenti non vengono toccati.',
            'Ripristina', 'Annulla'
        ))) return;
        const res = await window.electron.restoreDefaultSfx();
        if (!res.success || !res.sounds) {
            toast(`Libreria FX di default non disponibile: ${res.error ?? 'errore sconosciuto'}`, 'error');
            return;
        }
        const fresh = useProjectStore.getState();
        const freshSfx = fresh.columns.find((c) => c.type === 'sfx');
        if (!freshSfx) return;
        const existingPaths = new Set(freshSfx.clips.map((c) => c.path));
        let added = 0;
        for (const s of res.sounds) {
            if (existingPaths.has(s.path)) continue;
            const clip = fresh.addClipFromPath(freshSfx.id, s.path);
            if (clip) {
                added++;
                await loadClip(clip);
            }
        }
        toast(added > 0 ? `${added} effetti di default aggiunti al pad` : 'Tutti gli effetti di default sono già nel pad', added > 0 ? 'success' : 'info');
    };

    const midiLabel = (bind?: string) => bind?.replace('NOTE:', 'N').replace('CC:', 'C');

    return (
        <>
        {/* v1.10.6: z-150→z-40 — il pad deve stare SOTTO tutte le modali
            (KeymappingModal è la più bassa, z-50; .ov standard 200, Confirm 300).
            Prima, a z-150, galleggiava sopra la KeymappingModal. */}
        <div
            className={`fixed bottom-4 ${fxPadSide === 'left' ? 'left-4' : 'right-4'} z-40 w-[560px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col rounded-2xl border shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-colors ${
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
                <div className="flex items-center gap-1.5">
                    {/* v1.10.8: ripristino libreria FX di default (CC0) */}
                    <button
                        onClick={handleRestoreDefaults}
                        title="Ripristina gli FX di default (libreria CC0 inclusa nel software)"
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                        <Sparkles size={15} />
                    </button>
                    {/* v1.10.6: snap sinistra/destra — per liberare NoteBoard/colonna coperte */}
                    <button
                        onClick={(e) => {
                            e.currentTarget.blur();
                            setFxPadSide(fxPadSide === 'left' ? 'right' : 'left');
                        }}
                        title={fxPadSide === 'left' ? 'Sposta il pad a destra' : 'Sposta il pad a sinistra'}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                        {fxPadSide === 'left' ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                    </button>
                    <button
                        onClick={onClose}
                        title="Nascondi il pad FX"
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
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
                            const isSelected = selectedClipIds.includes(clip.id);
                            // v1.10.10/13: un colore assegnato dalle impostazioni riempie il
                            // pad. Solo customColor esplicito (clip.color è il colore di
                            // colonna, uguale per tutti). Da fermo = colore "spento" (velo +
                            // glow tenue); IN RIPRODUZIONE = ACCESO a colore pieno con tutto
                            // il pulsante illuminato (prima diventava verde come i pad neutri
                            // — riscontro dev). Mancante (rosso) e MIDI Learn (cyan) restano
                            // prioritari.
                            const fxColor = !disabled && !isMidiLearnMode ? clip.customColor : undefined;
                            // v1.10.2: NIENTE attributo `disabled` — Chromium sopprime i click
                            // anche sui discendenti di un button disabled, rendendo ⚙ e ×
                            // irraggiungibili (una clip col file mancante non era più né
                            // rimovibile né editabile). Il blocco del play è nel guard del
                            // onClick; lo stato è comunicato con aria-disabled + stili.
                            return (
                                <button
                                    key={clip.id}
                                    aria-disabled={disabled}
                                    style={fxColor ? (isPlaying ? {
                                        // ACCESO: colore pieno, bordo schiarito, glow forte
                                        // esterno + luce interna — tutto il pulsante illuminato.
                                        backgroundColor: fxColor,
                                        borderColor: `color-mix(in srgb, ${fxColor} 45%, #fff)`,
                                        boxShadow: `0 0 30px 1px ${fxColor}e6, inset 0 0 22px rgba(255,255,255,0.30)`,
                                        color: '#fff',
                                    } : {
                                        // SPENTO: velo del colore + glow tenue (v1.10.12)
                                        backgroundColor: `${fxColor}47`,
                                        borderColor: fxColor,
                                        boxShadow: `0 0 18px -2px ${fxColor}b3, inset 0 0 26px -14px ${fxColor}`,
                                        color: '#fff',
                                    }) : undefined}
                                    onContextMenu={(e) => {
                                        // v1.10.10: tasto destro = impostazioni clip (come la ⚙)
                                        e.preventDefault();
                                        e.currentTarget.blur();
                                        setQuickClip(clip);
                                    }}
                                    onClick={(e) => {
                                        // v1.10.3: togli il focus al pad appena cliccato — un button
                                        // focused viene ri-attivato da Space/Enter (attivazione nativa),
                                        // e in diretta significherebbe ri-sparare l'effetto in onda
                                        // premendo un tasto (stessa classe di incidente di ASSET-02).
                                        e.currentTarget.blur();
                                        // v1.10.4: in MIDI Learn il click seleziona (anche clip mancanti,
                                        // come la ClipCard: il ramo learn precede il check isMissing).
                                        if (isMidiLearnMode) {
                                            selectClip(clip.id, e.ctrlKey || e.metaKey ? 'toggle' : 'single');
                                            return;
                                        }
                                        if (disabled) return;
                                        if (isPlaying) stopClip(clip.id);
                                        else playClip(clip);
                                    }}
                                    title={disabled ? `File mancante: ${label}` : label}
                                    className={`group relative h-20 rounded-lg border p-2 text-left flex flex-col justify-between transition-all overflow-hidden ${
                                        disabled
                                            ? 'border-red-800/60 bg-red-950/30 text-red-400/70 cursor-not-allowed'
                                            : fxColor
                                                ? '' /* v1.10.13: pad colorato → stile tutto inline (spento/ACCESO) */
                                                : isPlaying
                                                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200 shadow-[0_0_18px_-4px_rgba(34,197,94,0.6)]'
                                                    : 'border-zinc-700 bg-zinc-800/40 text-zinc-200 hover:border-slate-400 hover:bg-zinc-800'
                                    } ${
                                        /* v1.10.4: feedback MIDI Learn — stesse classi della ClipCard */
                                        isMidiLearnMode && isSelected ? 'ring-2 ring-cyan-400 ring-dashed' : ''
                                    } ${
                                        isMidiLearnMode && !isSelected ? 'border-dashed border-cyan-800 opacity-80' : ''
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
                                            <span className={`ml-auto w-2 h-2 rounded-full animate-pulse ${fxColor ? 'bg-white' : 'bg-emerald-400'}`} />
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

        {/* QUICK SETTINGS (v1.10.11) — nome/colore/volume/loop, il caso comune FX */}
        {quickClip && (
            <FxQuickSettingsModal
                clip={quickClip}
                onClose={() => setQuickClip(null)}
                onSave={handleSaveClip}
                onOpenFull={(clip) => setEditingClip(clip)}
            />
        )}

        {/* SETTINGS MODAL COMPLETA (v1.10.1) — da "Impostazioni complete…" della rapida */}
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
