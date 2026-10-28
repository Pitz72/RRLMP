import React, { useEffect, useRef, useState } from 'react';
import { Column } from '../../types';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RotationSettingsModal } from '../modals/RotationSettingsModal';
import { confirm } from '../../store/useConfirmStore';

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
    const clearColumn = useProjectStore((s) => s.clearColumn);
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

    // v1.15.9: svuota l'intera colonna, con conferma esplicita (operazione distruttiva,
    // usabile anche in diretta → la conferma è la rete di sicurezza contro i click accidentali).
    const handleClearColumn = async () => {
        if (column.clips.length === 0) return;
        const ok = await confirm(
            t('column.clearConfirm', 'Stai per svuotare l\'intera colonna «{{title}}». Tutte le {{count}} clip verranno rimosse. Continuare?', { title: column.title, count: column.clips.length }),
            t('column.clearConfirmOk', 'Svuota colonna'),
            t('modal.dialog.cancel', 'Annulla')
        );
        if (ok) clearColumn(column.id);
    };

    // v1.15.36 (tema Pad luminosi): testata su due righe — titolo per intero sopra,
    // tipo · numero di clip e i tasti della colonna sotto. Così i titoli lunghi
    // ("VOCI / PREREGISTRAZIONI") non vanno più a capo. A fine colonna (ultima
    // clip, meno di 20 s) la testata diventa ambra con il LED che lampeggia.
    return (
        <div className={`col-head ${isDeadAirWarning ? 'deadair' : ''}`}>
            <span className={`col-strip ${isDeadAirWarning ? 'blink' : ''}`} />
            <div className="col-title">
                {isDeadAirWarning && <AlertTriangle size={15} className="shrink-0 pulse" />}
                {/* Il titolo è dato di progetto (l'utente può rinominarlo): si mostra
                    com'è salvato. I default vengono localizzati alla CREAZIONE del
                    progetto (getDefaultColumns in useProjectStore) — un lookup per id
                    qui sovrascriverebbe i titoli rinominati. */}
                <span title={column.title}>{column.title}</span>
            </div>

            <div className="col-meta" ref={pickerRef}>
                {isDeadAirWarning && (
                    <span className="end-badge pulse">{t('column.endBadge', 'END')}</span>
                )}
                <span className="lbl">
                    {t(`column.type.${column.type}`, column.type.toUpperCase())} · {column.clips.length}
                </span>
                <span className="grow" />

                {/* v1.3.21 — Rotazione PRE-SHOW (Jingle&Promo) */}
                {isPreshow && !isDeadAirWarning && (
                    <button
                        onClick={() => setShowRotation(true)}
                        className={`col-tool ${rotationActive ? 'on' : ''}`}
                        title={rotationActive ? t('column.rotationActiveTip', 'Rotazione Jingle&Promo attiva') : t('column.rotationConfigTip', 'Configura rotazione Jingle&Promo')}
                        aria-label={rotationActive ? t('column.rotationActiveTip', 'Rotazione Jingle&Promo attiva') : t('column.rotationConfigTip', 'Configura rotazione Jingle&Promo')}
                    >
                        <RefreshCw size={14} className={rotationActive ? 'animate-[spin_4s_linear_infinite]' : ''} />
                    </button>
                )}

                {/* Color Picker Trigger */}
                {!isDeadAirWarning && (
                    <button
                        onClick={() => setShowPicker(v => !v)}
                        className="col-tool"
                        title={t('column.changeColorTip', 'Cambia colore colonna')}
                        aria-label={t('column.changeColorTip', 'Cambia colore colonna')}
                        aria-expanded={showPicker}
                    >
                        <span className="sw" />
                    </button>
                )}

                {/* v1.15.9 — Svuota colonna (con conferma). Nascosto se già vuota. */}
                {!isDeadAirWarning && column.clips.length > 0 && (
                    <button
                        onClick={handleClearColumn}
                        className="col-tool danger"
                        title={t('column.clearTip', 'Svuota colonna (rimuovi tutte le clip)')}
                        aria-label={t('column.clearTip', 'Svuota colonna (rimuovi tutte le clip)')}
                    >
                        <Trash2 size={14} />
                    </button>
                )}

                {/* Color Picker Popover */}
                {showPicker && (
                    <div className="col-picker">
                        <span className="k">{t('column.colorLabel', 'Colore Colonna')}</span>
                        <div className="grid6">
                            {COLUMN_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => { setColumnColor(column.id, c); setShowPicker(false); }}
                                    className={`swb ${effectiveColor === c ? 'on' : ''}`}
                                    style={{ backgroundColor: c, color: c }}
                                    title={c}
                                    aria-label={c}
                                />
                            ))}
                        </div>
                        {/* Reset al colore di default */}
                        {column.customColor && column.customColor !== column.color && (
                            <button
                                onClick={() => { setColumnColor(column.id, column.color); setShowPicker(false); }}
                                className="reset kbtn"
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
