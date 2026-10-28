import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { inkFor } from '../../utils/colorInk';

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
    const { t } = useTranslation();
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
        if (await confirm(t('fxPad.removeConfirm', 'Rimuovere l\'effetto "{{label}}" dal pad?', { label }), t('fxPad.removeOk', 'Rimuovi'), t('modal.dialog.cancel', 'Annulla'))) {
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
            t('fxPad.restoreConfirm', 'Aggiungere al pad gli effetti di default mancanti (libreria inclusa nel software)? Gli FX già presenti non vengono toccati.'),
            t('fxPad.restoreOk', 'Ripristina'), t('modal.dialog.cancel', 'Annulla')
        ))) return;
        const res = await window.electron.restoreDefaultSfx();
        if (!res.success || !res.sounds) {
            toast(t('fxPad.libUnavailable', 'Libreria FX di default non disponibile: {{err}}', { err: res.error ?? t('app.unknownError', 'errore sconosciuto') }), 'error');
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
        // v1.15.35 (L4): messaggi tradotti (erano in italiano fisso anche con l'app in inglese).
        toast(added > 0
            ? t('fxPad.defaultsAdded', '{{count}} effetti di default aggiunti al pad', { count: added })
            : t('fxPad.defaultsAllPresent', 'Tutti gli effetti di default sono già nel pad'), added > 0 ? 'success' : 'info');
    };

    const midiLabel = (bind?: string) => bind?.replace('NOTE:', 'N').replace('CC:', 'C');

    return (
        <>
        {/* v1.10.6: z-40 — il pad deve stare SOTTO tutte le modali (KeymappingModal
            è la più bassa, z-50; .ov standard 200, Confirm 300).
            v1.15.36 (tema Pad luminosi): una piccola superficie hardware con 25 tasti. */}
        <div
            className={`fxp ${fxPadSide === 'left' ? 'left' : 'right'} ${isDragOver ? 'drag' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* HEADER */}
            <div className="fxp-head">
                <div className="fxp-title">
                    <Zap size={16} className="text-[#FFB547]" />
                    <span>{t('fxPad.title', 'FX / CARTWALL')}</span>
                    <span className="num">{clips.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* v1.10.8: ripristino libreria FX di default (CC0) */}
                    <button
                        onClick={handleRestoreDefaults}
                        title={t('fxPad.restoreDefaultsTip', 'Ripristina gli FX di default (libreria CC0 inclusa nel software)')}
                        aria-label={t('fxPad.restoreDefaultsTip', 'Ripristina gli FX di default (libreria CC0 inclusa nel software)')}
                        className="kbtn sm icon"
                    >
                        <Sparkles size={15} />
                    </button>
                    {/* v1.10.6: snap sinistra/destra — per liberare NoteBoard/colonna coperte */}
                    <button
                        onClick={(e) => {
                            e.currentTarget.blur();
                            setFxPadSide(fxPadSide === 'left' ? 'right' : 'left');
                        }}
                        title={fxPadSide === 'left' ? t('fxPad.moveRightTip', 'Sposta il pad a destra') : t('fxPad.moveLeftTip', 'Sposta il pad a sinistra')}
                        aria-label={fxPadSide === 'left' ? t('fxPad.moveRightTip', 'Sposta il pad a destra') : t('fxPad.moveLeftTip', 'Sposta il pad a sinistra')}
                        className="kbtn sm icon"
                    >
                        {fxPadSide === 'left' ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                    </button>
                    <button
                        onClick={onClose}
                        title={t('fxPad.hideTip', 'Nascondi il pad FX')}
                        aria-label={t('fxPad.hideTip', 'Nascondi il pad FX')}
                        className="kbtn sm icon"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* BODY — griglia pad 5 colonne */}
            <div className="fxp-body">
                {!sfxCol ? (
                    <div className="h-40 flex items-center justify-center text-[#8F949E] text-sm">
                        {t('fxPad.noColumn', 'Nessuna colonna FX nel progetto.')}
                    </div>
                ) : (
                    <div className="fxp-grid">
                        {cells.map((clip, idx) => {
                            if (!clip) {
                                return (
                                    <div key={`empty-${idx}`} className="fxp-empty">
                                        <Music4 size={16} />
                                    </div>
                                );
                            }
                            const isPlaying = !!activeClips[clip.id];
                            const label = clip.title || clip.name;
                            const disabled = !!clip.isMissing;
                            const isSelected = selectedClipIds.includes(clip.id);
                            // v1.10.10/13: un colore assegnato dalle impostazioni tinge il pad
                            // (solo customColor esplicito: clip.color è il colore di colonna,
                            // uguale per tutti). Da fermo = tinta spenta; IN RIPRODUZIONE = il
                            // tasto si accende del suo colore (senza colore: verde LED).
                            // Mancante (rosso) e MIDI Learn (ciano) restano prioritari.
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
                                    style={fxColor ? ({ '--fx-color': fxColor, '--fx-ink': inkFor(fxColor) } as React.CSSProperties) : undefined}
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
                                    title={disabled ? t('fxPad.missingFileTip', 'File mancante: {{label}}', { label }) : label}
                                    className={`fxp-cell group ${disabled ? 'missing' : ''} ${!disabled && isPlaying ? 'live' : ''} ${fxColor ? 'tinted' : ''} ${isMidiLearnMode ? 'learn' : ''} ${isMidiLearnMode && isSelected ? 'picked' : ''}`}
                                >
                                    <span className="fx-led" />
                                    <span className="fx-name">{label}</span>
                                    <div className="fx-foot">
                                        {clip.keybind && (
                                            <span className="fx-k">
                                                {clip.keybind.replace('Key', '').replace('Digit', '').replace('Numpad', 'N')}
                                            </span>
                                        )}
                                        {clip.midiBind && (
                                            <span className="fx-k m">{midiLabel(clip.midiBind)}</span>
                                        )}
                                        {isPlaying && !disabled && (
                                            <span className="led ml-auto pulse" style={{ background: '#fff', boxShadow: '0 0 8px #fff' }} />
                                        )}
                                    </div>
                                    {/* Impostazioni clip (⚙ su hover, v1.10.1) */}
                                    <span
                                        role="button"
                                        tabIndex={-1}
                                        onClick={(e) => handleEdit(e, clip)}
                                        title={t('fxPad.settingsTip', 'Impostazioni clip')}
                                        className="fx-act e"
                                    >
                                        <Settings2 size={12} />
                                    </span>
                                    {/* Rimuovi (× su hover) */}
                                    <span
                                        role="button"
                                        tabIndex={-1}
                                        onClick={(e) => handleRemove(e, clip.id, label)}
                                        title={t('fxPad.removeTip', 'Rimuovi dal pad')}
                                        className="fx-act x"
                                    >
                                        <X size={12} />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FOOTER — hint */}
            <div className="fxp-foot">
                <Upload size={13} className="shrink-0" />
                <span>{t('fxPad.hint', 'Trascina qui i file audio per aggiungere effetti · click per suonare/fermare · ESC = STOP ALL globale')}</span>
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
