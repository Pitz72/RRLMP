import React, { useEffect, useRef, useState } from 'react';
import { Column } from '../../types';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RotationSettingsModal } from '../modals/RotationSettingsModal';

interface ColumnHeaderProps {
    column: Column;
}

// Palette 30 colori — 5 righe x 6 colonne
// Riga 1: Rossi / Caldi
// Riga 2: Gialli / Verdi
// Riga 3: Blu / Freddi
// Riga 4: Viola / Rosa
// Riga 5: Neutri / Speciali
const COLUMN_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#FB923C', '#DC2626', '#B45309',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#65A30D', '#059669',
    '#06B6D4', '#3B82F6', '#6366F1', '#0EA5E9', '#1D4ED8', '#0369A1',
    '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E', '#7C3AED', '#BE185D',
    '#64748B', '#78716C', '#9CA3AF', '#D97706', '#A78BFA', '#FBBF24',
];

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column }) => {
    const { t } = useTranslation();
    const activeClips = useAudioStore((state) => state.activeClips);
    const setColumnColor = useProjectStore((s) => s.setColumnColor);
    const [isDeadAirWarning, setIsDeadAirWarning] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [showRotation, setShowRotation] = useState(false); // v1.3.21
    const pickerRef = useRef<HTMLDivElement>(null);

    const effectiveColor = column.customColor || column.color;
    const isPreshow = column.type === 'preshow'; // v1.3.21: bottone rotazione
    const rotationActive = !!(column.rotation && (column.rotation.jingleEnabled || column.rotation.promoEnabled));

    // Chiudi il picker cliccando fuori
    useEffect(() => {
        if (!showPicker) return;
        const handleOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [showPicker]);

    useEffect(() => {
        const activeInColumn = Object.values(activeClips).find(ac =>
            column.clips.some(c => c.id === ac.clip.id)
        );

        if (!activeInColumn) { setIsDeadAirWarning(false); return; }

        const { clip, player, isPlaying } = activeInColumn;
        if (!isPlaying) { setIsDeadAirWarning(false); return; }

        const clipIndex = column.clips.findIndex(c => c.id === clip.id);
        const isLastClip = clipIndex === column.clips.length - 1;
        if (clip.isLooping) { setIsDeadAirWarning(false); return; }

        const duration = player.getDuration();
        const currentTime = player.getCurrentTime();
        const remaining = duration - currentTime;

        if (isLastClip && remaining < 20 && remaining > 0) {
            setIsDeadAirWarning(true);
        } else {
            setIsDeadAirWarning(false);
        }
    }, [activeClips, column.clips, column.type]);

    return (
        <div
            className={`col-head transition-all duration-500 ${isDeadAirWarning ? 'animate-pulse' : ''}`}
            style={isDeadAirWarning ? {
                background: 'rgba(120,53,15,0.5)',
                color: '#f59e0b',
                borderColor: '#f59e0b'
            } : undefined}
        >
            <div className="col-title" style={isDeadAirWarning ? { color: '#f59e0b', textShadow: 'none' } : undefined}>
                {isDeadAirWarning && <AlertTriangle size={16} className="animate-bounce" />}
                {/* Il titolo è dato di progetto (l'utente può rinominarlo): si mostra
                    com'è salvato. I default vengono localizzati alla CREAZIONE del
                    progetto (getDefaultColumns in useProjectStore) — un lookup per id
                    qui sovrascriverebbe i titoli rinominati. */}
                <span>{column.title}</span>
            </div>

            <div className="col-meta relative" ref={pickerRef}>
                {isDeadAirWarning && (
                    <span className="text-[10px] bg-amber-500 text-black px-1 rounded font-bold">{t('column.endBadge', 'END')}</span>
                )}
                <div className={`col-type ${isDeadAirWarning ? 'text-amber-200 opacity-100' : ''}`}>
                    {t(`column.type.${column.type}`, column.type.toUpperCase())}
                </div>

                {/* v1.3.21 — Rotazione PRE-SHOW (Jingle&Promo) */}
                {isPreshow && !isDeadAirWarning && (
                    <button
                        onClick={() => setShowRotation(true)}
                        className={`shrink-0 transition-all hover:scale-110 ${rotationActive ? 'text-violet-300' : 'text-white/40 hover:text-white/80'}`}
                        title={rotationActive ? t('column.rotationActiveTip', 'Rotazione Jingle&Promo attiva') : t('column.rotationConfigTip', 'Configura rotazione Jingle&Promo')}
                    >
                        <RefreshCw size={14} className={rotationActive ? 'animate-[spin_4s_linear_infinite]' : ''} />
                    </button>
                )}

                {/* Color Picker Trigger */}
                {!isDeadAirWarning && (
                    <button
                        onClick={() => setShowPicker(v => !v)}
                        className="w-4 h-4 rounded-full border-2 border-white/30 hover:border-white/80 hover:scale-125 transition-all shrink-0 shadow-md"
                        style={{ backgroundColor: effectiveColor }}
                        title={t('column.changeColorTip', 'Cambia colore colonna')}
                    />
                )}

                {/* Color Picker Popover */}
                {showPicker && (
                    <div className="absolute top-7 right-0 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150" style={{ width: '220px' }}>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-3">{t('column.colorLabel', 'Colore Colonna')}</p>
                        <div className="grid grid-cols-6 gap-2">
                            {COLUMN_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => { setColumnColor(column.id, c); setShowPicker(false); }}
                                    className="w-7 h-7 rounded-full transition-all hover:scale-125 hover:shadow-lg focus:outline-none"
                                    style={{
                                        backgroundColor: c,
                                        boxShadow: effectiveColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined
                                    }}
                                    title={c}
                                />
                            ))}
                        </div>
                        {/* Reset al colore di default */}
                        {column.customColor && column.customColor !== column.color && (
                            <button
                                onClick={() => { setColumnColor(column.id, column.color); setShowPicker(false); }}
                                className="mt-3 w-full text-[9px] text-zinc-500 hover:text-zinc-200 transition-colors py-1 border border-zinc-800 hover:border-zinc-600 rounded"
                            >
                                {t('column.resetColor', '↺ Ripristina colore originale')}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* v1.3.21 — Modale rotazione (montata a livello root, fuori dal picker) */}
            {isPreshow && (
                <RotationSettingsModal isOpen={showRotation} onClose={() => setShowRotation(false)} />
            )}
        </div>
    );
};
