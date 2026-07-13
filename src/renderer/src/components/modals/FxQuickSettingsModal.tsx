import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal, Repeat } from 'lucide-react';
import { AudioClip } from '../../types';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import { COLUMN_COLORS } from './ClipSettingsModal';
import { sliderToGain, gainToSlider, gainToDbLabel } from '../../utils/volumeTaper';

interface FxQuickSettingsModalProps {
    clip: AudioClip;
    onClose: () => void;
    onSave: (clipId: string, updates: Partial<AudioClip>) => void;
    /** Apre la ClipSettingsModal completa (trim, marker, fade, keybind…). */
    onOpenFull: (clip: AudioClip) => void;
}

/**
 * v1.10.11 — Impostazioni RAPIDE per gli FX del pad (richiesta dev 2026-07-02:
 * "servirebbe un modale più semplificato per gli FX").
 *
 * Solo l'essenziale per una jingle machine: nome, colore del pad, volume, loop.
 * Il pulsante "Impostazioni complete…" apre la ClipSettingsModal piena per
 * trim/marker/fade/keybind. Salvataggio esplicito col pulsante Salva (stesso
 * onSave del pad → _snapshot undo + sync live se la clip è in onda).
 */
export const FxQuickSettingsModal: React.FC<FxQuickSettingsModalProps> = ({ clip, onClose, onSave, onOpenFull }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(clip.name);
    const [customColor, setCustomColor] = useState<string | null>(clip.customColor ?? null);
    const [volume, setVolume] = useState(clip.volume ?? 1);
    const [isLooping, setIsLooping] = useState(!!clip.isLooping);

    // Risincronizza se si apre su una clip diversa senza smontare.
    useEffect(() => {
        setName(clip.name);
        setCustomColor(clip.customColor ?? null);
        setVolume(clip.volume ?? 1);
        setIsLooping(!!clip.isLooping);
    }, [clip.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEscapeToClose(true, onClose);

    const handleSave = () => {
        onSave(clip.id, {
            name: name.trim() || clip.name,
            customColor: customColor ?? undefined,
            volume,
            isLooping,
        });
        onClose();
    };

    return (
        <div className="ov" style={{ zIndex: 210 }} onClick={onClose}>
            <div className="ov-panel anim-in p-5 w-[420px] relative" onClick={(e) => e.stopPropagation()}>
                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3.5 h-3.5 rounded shrink-0" style={{ backgroundColor: customColor || clip.color }} />
                        <h2 className="text-sm font-bold text-zinc-100 truncate">FX — {clip.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                        title={t('modal.fxQuick.closeTip', 'Chiudi')}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* NOME */}
                <label className="block mb-4">
                    <span className="sect-h text-zinc-500 block mb-1.5">{t('modal.fxQuick.nameLabel', 'Nome sul pad')}</span>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={80}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                </label>

                {/* COLORE PAD */}
                <div className="mb-4">
                    <span className="sect-h text-zinc-500 block mb-1.5">{t('modal.fxQuick.colorLabel', 'Colore del pad')}</span>
                    <div className="grid grid-cols-10 gap-1.5">
                        {COLUMN_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setCustomColor(c)}
                                className={`h-6 rounded transition-transform ${customColor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                    </div>
                    {customColor && (
                        <button
                            onClick={() => setCustomColor(null)}
                            className="mt-2 text-[11px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
                        >
                            {t('modal.fxQuick.removeColor', 'Rimuovi colore (pad neutro)')}
                        </button>
                    )}
                </div>

                {/* VOLUME */}
                <label className="block mb-4">
                    <span className="sect-h text-zinc-500 block mb-1.5">
                        {t('modal.fxQuick.volumeLabel', 'Volume · {{v}}%', { v: Math.round(volume * 100) })}
                        <span className="text-zinc-600 normal-case"> · {gainToDbLabel(volume)}</span>
                    </span>
                    {/* v1.15.11: stesso taper percettivo di ClipSettingsModal (volumeTaper.ts),
                        qui con fondo scala 1.0 come il vecchio slider 0–100%. */}
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.005}
                        value={gainToSlider(volume, 1)}
                        onChange={(e) => setVolume(sliderToGain(Number(e.target.value), 1))}
                        className="rng w-full"
                    />
                </label>

                {/* LOOP */}
                <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={isLooping}
                        onChange={(e) => setIsLooping(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500"
                    />
                    <Repeat size={13} className="text-zinc-400" />
                    <span className="text-sm text-zinc-300">{t('modal.fxQuick.loopLabel', 'Riproduci in loop')}</span>
                </label>

                {/* FOOTER */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800">
                    <button
                        onClick={() => { onClose(); onOpenFull(clip); }}
                        className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors"
                        title={t('modal.fxQuick.fullSettingsTip', 'Trim, marker, fade, keybind e tutte le altre impostazioni')}
                    >
                        <SlidersHorizontal size={12} />
                        {t('modal.fxQuick.fullSettings', 'Impostazioni complete…')}
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors"
                        >
                            {t('modal.fxQuick.cancel', 'Annulla')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                        >
                            {t('modal.fxQuick.save', 'Salva')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
