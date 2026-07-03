import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { RotationConfig } from '../../types';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

interface RotationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULTS: RotationConfig = { jingleEnabled: false, jingleEvery: 4, promoEnabled: false, promoEvery: 6 };

/**
 * v1.3.21 — Config rotazione Jingle&Promo della PRE-SHOW.
 * NON è automazione dello show (vedi docs/VISION.md): la rotazione vive solo nella
 * fase di riempitivo PRE-SHOW. Ogni X brani inserisce a caso un jingle, ogni Y un
 * promo, a fine brano seguendo le transizioni esistenti, mai sovrapposti. I due
 * contatori sono indipendenti; la config è persistita su col-preshow.rotation.
 */
export const RotationSettingsModal = ({ isOpen, onClose }: RotationSettingsModalProps) => {
    const { t } = useTranslation();
    const columns = useProjectStore((s) => s.columns);
    const setColumnRotation = useProjectStore((s) => s.setColumnRotation);
    const preshow = columns.find((c) => c.id === 'col-preshow');

    const [cfg, setCfg] = useState<RotationConfig>(preshow?.rotation ?? DEFAULTS);

    // Risincronizza dallo stato del progetto a ogni apertura (es. dopo load .lmp).
    useEffect(() => {
        if (isOpen) setCfg(preshow?.rotation ?? DEFAULTS);
    }, [isOpen, preshow?.rotation]);

    // v1.4.13 (ESC-01): ESC chiude la modale invece di innescare lo STOP ALL.
    useEscapeToClose(isOpen, onClose);

    if (!isOpen) return null;

    const apply = (patch: Partial<RotationConfig>) => {
        const next = { ...cfg, ...patch };
        // Clamp difensivo: intervallo minimo 1 brano.
        next.jingleEvery = Math.max(1, Math.floor(next.jingleEvery) || 1);
        next.promoEvery = Math.max(1, Math.floor(next.promoEvery) || 1);
        setCfg(next);
        setColumnRotation('col-preshow', next);
    };

    const row = (
        label: string,
        accent: string,
        enabled: boolean,
        every: number,
        onToggle: (v: boolean) => void,
        onEvery: (v: number) => void
    ) => (
        <div className="card !p-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onToggle(e.target.checked)}
                    className="w-4 h-4 accent-current"
                    style={{ color: accent }}
                />
                <span className="font-bold text-sm" style={{ color: accent }}>{label}</span>
            </label>
            <div className={`flex items-center gap-2 mt-2.5 text-xs transition-opacity ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <span className="text-zinc-400">{t('modal.rotation.insertEvery', 'Inserisci uno ogni')}</span>
                <input
                    type="number"
                    min={1}
                    max={999}
                    value={every}
                    disabled={!enabled}
                    onChange={(e) => onEvery(Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-16 text-white font-mono text-sm text-center focus:outline-none focus:border-violet-500"
                />
                <span className="text-zinc-400">{t('modal.rotation.songsUnit', 'brani')}</span>
            </div>
        </div>
    );

    return (
        <div
            className="ov"
            style={{ zIndex: 110 }}
            onClick={onClose}
        >
            <div
                className="ov-panel anim-in p-6 w-[440px] relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-2 mb-1">
                    <RefreshCw size={18} className="text-violet-400" />
                    <h2 className="text-lg font-bold text-white">{t('modal.rotation.title', 'Rotazione PRE-SHOW')}</h2>
                </div>
                <p className="text-[11px] text-zinc-500 mb-5 leading-relaxed">
                    {t('modal.rotation.intro', 'Durante la PRE-SHOW inserisce a caso clip dalle colonne Jingle/Promo, a fine brano e mai sovrapposte. Non tocca lo show, solo il riempitivo.')}
                </p>

                <div className="space-y-3">
                    {row('JINGLE', '#F59E0B', cfg.jingleEnabled, cfg.jingleEvery,
                        (v) => apply({ jingleEnabled: v }),
                        (v) => apply({ jingleEvery: v }))}
                    {row('PROMO', '#06B6D4', cfg.promoEnabled, cfg.promoEvery,
                        (v) => apply({ promoEnabled: v }),
                        (v) => apply({ promoEvery: v }))}
                </div>

                <p className="mt-5 text-[11px] text-zinc-500 leading-relaxed">
                    {t('modal.rotation.help', 'I contatori ripartono a ogni STOP ALL. Una colonna vuota viene saltata. Se jingle e promo coincidono sullo stesso brano vengono riprodotti in sequenza.')}
                </p>
            </div>
        </div>
    );
};
