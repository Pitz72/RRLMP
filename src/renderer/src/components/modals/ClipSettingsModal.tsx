import React, { useState, useEffect, useMemo } from 'react';
import { AudioClip, TransitionType } from '../../types';

// v1.3.16 — Sentinel UI: il valore 'default' nella dropdown rappresenta "usa il default globale".
// Non è un TransitionType valido (modello: 'gapless' | 'segue' | 'crossfade'). Il widening del
// tipo dello state separa la scelta UI dal valore persistito senza alterare il comportamento runtime.
type TransitionUIChoice = TransitionType | 'default';
import { debugLog } from '../../store/useDebugStore';
import { Wand2, Settings2, Scissors, FileText, PlayCircle, StopCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '../../store/useToastStore';
import { confirm } from '../../store/useConfirmStore';
import { WaveformEditor } from '../ui/WaveformEditor';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';


interface ClipSettingsModalProps {
    clip: AudioClip;
    isOpen: boolean;
    onClose: () => void;
    onSave: (clipId: string, updates: Partial<AudioClip>) => void;
    onDelete: (clipId: string) => void;
}

// 30 colori — stessa palette di ColumnHeader (5 righe x 6 colonne)
// v1.10.11: esportata per FxQuickSettingsModal (stessa palette, stessa semantica)
export const COLUMN_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#FB923C', '#DC2626', '#B45309',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#65A30D', '#059669',
    '#06B6D4', '#3B82F6', '#6366F1', '#0EA5E9', '#1D4ED8', '#0369A1',
    '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E', '#7C3AED', '#BE185D',
    '#64748B', '#78716C', '#9CA3AF', '#D97706', '#A78BFA', '#FBBF24',
];

export const ClipSettingsModal: React.FC<ClipSettingsModalProps> = ({ clip, isOpen, onClose, onSave, onDelete }) => {
    const { t } = useTranslation();
    const previewTransition = useAudioStore(s => s.previewTransition);
    const stopPreviewTransition = useAudioStore(s => s.stopPreviewTransition);
    const previewingClipIds = useAudioStore(s => s.previewingClipIds);
    const isPreviewingThisClip = previewingClipIds.includes(clip.id);
    const columns = useProjectStore(s => s.columns);

    const clipColumn = useMemo(() => columns.find(c => c.clips.some(cl => cl.id === clip.id)), [clip.id, columns]);

    const hasNextClip = useMemo(() => {
        if (!clipColumn) return false;
        const idx = clipColumn.clips.findIndex(cl => cl.id === clip.id);
        return idx >= 0 && idx < clipColumn.clips.length - 1;
    }, [clip.id, clipColumn]);

    const [activeTab, setActiveTab] = useState<'general' | 'markers' | 'notes'>('general');
    
    const [name, setName] = useState(clip.name);
    const [volume, setVolume] = useState(clip.volume);
    const [isLooping, setIsLooping] = useState(clip.isLooping);
    const [nextAction, setNextAction] = useState<AudioClip['nextAction']>(clip.nextAction);
    const [duckingRole, setDuckingRole] = useState<AudioClip['duckingRole']>(clip.duckingRole);
    const [customColor, setCustomColor] = useState<string | null>(clip.customColor ?? null);
    const [behavior, setBehavior] = useState<AudioClip['behavior']>(clip.behavior || 'normal');
    const [fadeIn, setFadeIn] = useState(clip.fadeIn || 0);
    const [fadeOut, setFadeOut] = useState(clip.fadeOut || 0);
    const [keybind, setKeybind] = useState(clip.keybind || '');
    const [trimStart, setTrimStart] = useState(clip.trimStart || 0);
    const [trimEnd, setTrimEnd] = useState(clip.trimEnd || 0);
    const [introMarker, setIntroMarker] = useState(clip.introMarker || 0);
    const [outroMarker, setOutroMarker] = useState(clip.outroMarker || 0);
    const [transitionType, setTransitionType] = useState<TransitionUIChoice>(clip.transitionType || 'default');
    const [notes, setNotes] = useState(clip.notes || '');

    // Colore effettivo da mostrare: custom clip > custom colonna > colore colonna > fallback
    const effectiveDisplayColor = customColor ?? clipColumn?.customColor ?? clipColumn?.color ?? '#3B82F6';

    // Reset state when clip changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setName(clip.name);
            setVolume(clip.volume);
            setIsLooping(clip.isLooping || false);
            setNextAction(clip.nextAction || 'stop');
            setDuckingRole(clip.duckingRole || 'none');
            setCustomColor(clip.customColor ?? null);
            setFadeIn(clip.fadeIn || 0);
            setFadeOut(clip.fadeOut || 0);
            setBehavior(clip.behavior || 'normal');
            setKeybind(clip.keybind || '');
            setTrimStart(clip.trimStart || 0);
            setTrimEnd(clip.trimEnd || 0);
            setIntroMarker(clip.introMarker || 0);
            setOutroMarker(clip.outroMarker || 0);
            setTransitionType((clip.transitionType as TransitionUIChoice) || 'default');
            setNotes(clip.notes || '');
            setActiveTab('general'); // Reset tab
        }
    }, [clip, isOpen]);

    // v1.4.13 (ESC-01): ESC chiude la modale (senza salvare) invece di innescare
    // l'Emergency Stop globale. L'input keybind (data-keybind-input) è escluso:
    // lì ESC azzera il bind.
    useEscapeToClose(isOpen, onClose);

    if (!isOpen) return null;

    const handleSave = () => {
        // v1.4.10 (revisione 2026-06-10, #16): coerenza outro marker / trim. Un outro
        // oltre la fine effettiva (duration − trimEnd) non scatterebbe MAI (la
        // transizione configurata degrada in silenzio); un outro ≤ trimStart
        // scatterebbe ALL'AVVIO (transizione immediata sulla clip appena partita).
        // In entrambi i casi il marker viene azzerato (= disattivato) con avviso.
        let safeOutro = Number(outroMarker);
        const knownDuration = clip.duration || 0;
        if (safeOutro > 0 && knownDuration > 0) {
            const effectiveEnd = knownDuration - Number(trimEnd);
            if (safeOutro >= effectiveEnd || safeOutro <= Number(trimStart)) {
                toast(t('modal.clip.outroIncoherent', 'Outro marker incoerente con trim/durata — disattivato.'), 'warning');
                safeOutro = 0;
            }
        }
        const updatedClip: Partial<AudioClip> = {
            name,
            volume: Number(volume),
            isLooping,
            nextAction,
            duckingRole,
            customColor: customColor ?? undefined,
            fadeIn: Number(fadeIn),
            fadeOut: Number(fadeOut),
            behavior,
            keybind,
            trimStart: Number(trimStart),
            trimEnd: Number(trimEnd),
            introMarker: Number(introMarker),
            outroMarker: safeOutro,
            // v1.4.7 (revisione 2026-06-10, #7): 'default' = "usa il default globale" →
            // NON si persiste più la stringa. Fino a v1.4.6 la stringa 'default' finiva nel
            // .lmp e i lettori (`clip.transitionType ?? fallback`) non facevano scattare il
            // fallback: la voce "Default Globale" si comportava sempre come gapless.
            // undefined rimuove l'override; i .lmp vecchi sono sanati in validateLmpProjectData.
            transitionType: transitionType === 'default' ? undefined : transitionType,
            notes,
        };
        debugLog(`Saving Clip: ${clip.name} Intro=${updatedClip.introMarker} Outro=${updatedClip.outroMarker}`, 'info');
        onSave(clip.id, updatedClip);
        onClose();
    };

    const handleDelete = async () => {
        if (await confirm(t('modal.clip.deleteConfirm'), t('modal.clip.deleteLabel'), t('modal.dialog.cancel', 'Annulla'))) {
            onDelete(clip.id);
            onClose();
        }
    };

    const detectSilence = async () => {
        if (!window.electron?.detectSilence) return;
        try {
            debugLog('Smart Trim: rilevamento silenzio via FFmpeg...', 'info');
            const result = await window.electron.detectSilence(clip.path);
            if (!result.success || !result.data) {
                // v1.2.22 (NEW-ME-01): distinguere rate-limit dagli errori reali
                if (result.error === 'IPC_RATE_LIMITED') {
                    toast(t('modal.clip.analysisQueued', 'Analisi in coda — troppe operazioni FFmpeg parallele. Riprova tra qualche secondo.'), 'warning');
                } else {
                    toast(t('modal.clip.autoTrimError', 'Auto-Trim: errore durante l\'analisi FFmpeg.'), 'error');
                }
                return;
            }
            if (result.data.noSilence) {
                toast(t('modal.clip.autoTrimNoSilence', 'Auto-Trim: nessun silenzio rilevato ai bordi del file.'), 'warning');
                return;
            }
            setTrimStart(parseFloat(result.data.trimStart.toFixed(3)));
            setTrimEnd(parseFloat(result.data.trimEnd.toFixed(3)));
            toast(t('modal.clip.autoTrimApplied', 'Auto-Trim applicato — Start: {{start}}s / End cut: {{end}}s', { start: result.data.trimStart.toFixed(3), end: result.data.trimEnd.toFixed(3) }), 'success');
            debugLog(`Smart Trim: Start=${result.data.trimStart.toFixed(3)}, EndCut=${result.data.trimEnd.toFixed(3)}`, 'info');
        } catch (e) {
            console.error(e);
            toast(t('modal.clip.silenceAnalysisError', 'Errore durante l\'analisi del silenzio.'), 'error');
        }
    };


    return (
        <div className="ov">
            <div className="ov-panel anim-in clipset w-full">

                {/* HEADER & TABS */}
                <div>
                    <div className="ov-head">
                        <h2 className="ov-title">
                            <span className="cs-swatch" style={{ backgroundColor: effectiveDisplayColor }}></span>
                            {clip.name}
                        </h2>
                        <button onClick={onClose} className="ov-x">✕</button>
                    </div>
                    <div className="tabbar">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`tab ${activeTab === 'general' ? 'on' : ''}`}
                        >
                            <Settings2 size={15} className="ti" /> {t('modal.clip.tab.general')}
                        </button>
                        <button
                            onClick={() => setActiveTab('markers')}
                            className={`tab ${activeTab === 'markers' ? 'on' : ''}`}
                        >
                            <Scissors size={15} className="ti" /> {t('modal.clip.tab.markers')}
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`tab ${activeTab === 'notes' ? 'on' : ''}`}
                        >
                            <FileText size={15} className="ti" /> {t('modal.clip.tab.notes')}
                            {notes && <span className="text-[9px] bg-violet-600/80 text-white px-1.5 py-0.5 rounded font-bold">●</span>}
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="ov-body p-6 custom-scrollbar">

                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* LEFT COLUMN: Visual & Basic */}
                            <div className="space-y-6">
                                {/* NAME */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('modal.clip.nameLabel', 'Nome Clip')}</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="sel"
                                    />
                                </div>

                                {/* COLORS */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('modal.clip.colorLabel', 'Etichetta Colore')}</label>
                                    <div className="card !p-3 space-y-2">
                                        <div className="grid grid-cols-6 gap-1.5">
                                            {COLUMN_COLORS.map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => setCustomColor(c)}
                                                    className={`sw ${customColor === c ? 'on' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                    title={c}
                                                />
                                            ))}
                                        </div>
                                        {customColor && (
                                            <button
                                                onClick={() => setCustomColor(null)}
                                                className="w-full text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors py-1 border border-zinc-800 hover:border-zinc-600 rounded"
                                            >
                                                {t('modal.clip.inheritColor', '↺ Eredita colore dalla colonna')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* VOLUME */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('modal.clip.volumeGain', 'Guadagno Volume')}</label>
                                        <span className="text-xs font-mono text-emerald-400">{(volume * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.05"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="rng green"
                                    />
                                </div>

                                {/* KEYBIND */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('modal.clip.globalKeybind', 'Scorciatoia Globale')}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={keybind}
                                            readOnly
                                            data-keybind-input
                                            placeholder={t('modal.clip.recordKeyPlaceholder', 'Clicca e premi un tasto...')}
                                            className="flex-1 sel mono text-center cursor-pointer"
                                            style={{ color: '#facc15' }}
                                            onKeyDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (e.key === 'Escape' || e.key === 'Backspace') {
                                                    setKeybind('');
                                                } else {
                                                    setKeybind(e.code);
                                                }
                                            }}
                                            onClick={(e) => (e.currentTarget as HTMLInputElement).focus()}
                                        />
                                        {keybind && (
                                            <button
                                                onClick={() => setKeybind('')}
                                                className="px-3 bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-700"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Behavior & Mixing */}
                            <div className="space-y-6">
                                {/* BEHAVIOR */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('modal.clip.behaviorLabel', 'Comportamento di Riproduzione')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setBehavior('normal')}
                                            className={`seg ${behavior === 'normal' ? 'on' : ''}`}
                                        >
                                            {t('modal.clip.behaviorNormal', 'Normale')}
                                        </button>
                                        <button
                                            onClick={() => setBehavior('stacco')}
                                            className={`seg ${behavior === 'stacco' ? 'on-violet' : ''}`}
                                        >
                                            {t('modal.clip.behaviorStacco', 'Stacco (Jingle)')}
                                        </button>
                                    </div>
                                </div>

                                {/* TOGGLES */}
                                <div className="card space-y-3">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{t('modal.clip.loopPlayback', 'Riproduzione in Loop')}</span>
                                        <input
                                            type="checkbox"
                                            checked={isLooping}
                                            onChange={(e) => setIsLooping(e.target.checked)}
                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-emerald-500"
                                        />
                                    </label>

                                    <div className="h-px bg-zinc-900 my-1" />

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{t('modal.clip.autoplayNext', 'Avanzamento Automatico')}</span>
                                        <select
                                            value={nextAction}
                                            onChange={(e) => setNextAction(e.target.value as AudioClip['nextAction'])}
                                            className="bg-zinc-900 border border-zinc-800 rounded text-xs p-1 text-white outline-none focus:border-emerald-500"
                                        >
                                            <option value="stop">{t('modal.clip.nextStop', 'Stop')}</option>
                                            <option value="play_next">{t('modal.clip.nextPlayNext', 'Riproduci successiva')}</option>
                                        </select>
                                    </label>

                                    <div className="h-px bg-zinc-900 my-1" />

                                    {/* A1 (2026-06-30): controllo "duckingRole" rimosso dalla UI — non era
                                        letto dal motore di mix (campo non funzionante). Il livello di
                                        ducking si regola globalmente in Impostazioni → Riduzione ducking.
                                        Il campo resta nel modello (inizializzato/salvato) per compatibilità
                                        coi .lmp esistenti, ma non è più editabile. */}
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{t('modal.clip.transitionType')}</span>
                                        <select
                                            value={transitionType}
                                            onChange={(e) => setTransitionType(e.target.value as TransitionUIChoice)}
                                            className="bg-zinc-900 border border-zinc-800 rounded text-xs p-1 text-white outline-none focus:border-emerald-500"
                                        >
                                            <option value="default">{t('modal.clip.trans.default')}</option>
                                            <option value="crossfade">{t('modal.clip.trans.crossfade')}</option>
                                            <option value="segue">{t('modal.clip.trans.segue')}</option>
                                            <option value="gapless">{t('modal.clip.trans.gapless')}</option>
                                        </select>
                                    </label>

                                    {hasNextClip && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">{t('modal.clip.previewTransition')}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => previewTransition(clip)}
                                                    className={`flex items-center gap-1.5 px-3 py-1 text-white text-xs rounded font-medium transition-colors ${isPreviewingThisClip ? 'bg-violet-800 cursor-default opacity-60' : 'bg-violet-600 hover:bg-violet-500'}`}
                                                    title={t('modal.clip.previewTip', 'Riproduce gli ultimi secondi di questa clip — la transizione scatta naturalmente')}
                                                    disabled={isPreviewingThisClip}
                                                >
                                                    <PlayCircle size={13} />
                                                    {t('modal.clip.testTransition', 'Test →')}
                                                </button>
                                                {isPreviewingThisClip && (
                                                    <button
                                                        onClick={() => stopPreviewTransition(clip.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-xs rounded font-medium transition-colors"
                                                        title={t('modal.clip.stopPreviewTip', "Ferma l'anteprima")}
                                                    >
                                                        <StopCircle size={13} />
                                                        {t('modal.clip.stopPreview', 'Stop')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'markers' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                            {/* Waveform Visual Editor */}
                            <WaveformEditor 
                                path={clip.path}
                                trimStart={trimStart}
                                trimEnd={trimEnd}
                                introMarker={introMarker}
                                outroMarker={outroMarker}
                                onChange={(updates) => {
                                    if (updates.trimStart !== undefined) setTrimStart(updates.trimStart);
                                    if (updates.trimEnd !== undefined) setTrimEnd(updates.trimEnd);
                                    if (updates.introMarker !== undefined) setIntroMarker(updates.introMarker);
                                    if (updates.outroMarker !== undefined) setOutroMarker(updates.outroMarker);
                                }}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* FADES */}
                                <div className="card space-y-4">
                                    <h3 className="text-xs uppercase text-zinc-500 font-bold border-b border-zinc-800 pb-2">{t('modal.clip.smoothFades', 'Dissolvenze')}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">{t('modal.clip.fadeInMs', 'Fade In (ms)')}</label>
                                            <input
                                                type="number"
                                                value={fadeIn}
                                                onChange={(e) => setFadeIn(parseInt(e.target.value) || 0)}
                                                className="sel text-center"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">{t('modal.clip.fadeOutMs', 'Fade Out (ms)')}</label>
                                            <input
                                                type="number"
                                                value={fadeOut}
                                                onChange={(e) => setFadeOut(parseInt(e.target.value) || 0)}
                                                className="sel text-center"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* MANUAL MARKERS INPUTS */}
                                <div className="card space-y-4">
                                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                        <h3 className="text-xs uppercase text-zinc-500 font-bold">{t('modal.clip.manualInputs', 'Valori Manuali')}</h3>
                                        <button
                                            onClick={detectSilence}
                                            className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors border border-purple-500/30 rounded px-2 py-0.5 bg-purple-500/10"
                                        >
                                            <Wand2 size={10} /> {t('modal.clip.autoTrim', 'Auto-Trim')}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">{t('modal.clip.trimStartS', 'Trim Start (s)')}</label>
                                            <input type="number" step="0.1" value={trimStart} onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)} className="sel text-center !text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">{t('modal.clip.trimEndS', 'Trim End (s)')}</label>
                                            <input type="number" step="0.1" value={trimEnd} onChange={(e) => setTrimEnd(parseFloat(e.target.value) || 0)} className="sel text-center !text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">{t('modal.clip.introEndS', 'Intro End (s)')}</label>
                                            <input type="number" step="0.1" value={introMarker} onChange={(e) => setIntroMarker(parseFloat(e.target.value) || 0)} className="sel text-center !text-emerald-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">{t('modal.clip.outroStartS', 'Outro Start (s)')}</label>
                                            <input type="number" step="0.1" value={outroMarker} onChange={(e) => setOutroMarker(parseFloat(e.target.value) || 0)} className="sel text-center !text-orange-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'notes' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{t('modal.clip.notesTitle', 'Script / Cue Sheet / Note di Regia')}</p>
                                    <p className="text-[10px] text-zinc-600 mt-0.5">{t('modal.clip.notesHint', 'Testo libero — salvato nel progetto .lmp')}</p>
                                </div>
                                {notes && (
                                    <button
                                        onClick={() => setNotes('')}
                                        className="text-[10px] text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-500/40 rounded px-2 py-1 transition-colors"
                                    >
                                        {t('modal.clip.clearNotes', 'Cancella')}
                                    </button>
                                )}
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t('modal.clip.notesPlaceholder', 'Inserisci qui lo script, le note di produzione, i cue...')}
                                rows={16}
                                className="sel mono resize-none leading-relaxed custom-scrollbar placeholder:text-zinc-700"
                                spellCheck={false}
                            />
                            <div className="flex justify-between text-[10px] text-zinc-600">
                                <span>{t('modal.clip.charCount', '{{count}} caratteri', { count: notes.length })}</span>
                                <span>{t('modal.clip.nonEmptyLines', '{{count}} righe non vuote', { count: notes.split('\n').filter(l => l.trim()).length })}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="ov-foot" style={{ justifyContent: 'space-between' }}>
                    <button onClick={handleDelete} className="btn btn-danger">
                        {t('modal.clip.deleteClipBtn', 'ELIMINA CLIP')}
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="btn btn-ghost">
                            {t('modal.dialog.cancel', 'Annulla')}
                        </button>
                        <button onClick={handleSave} className="btn btn-green">
                            {t('modal.clip.saveChanges', 'SALVA MODIFICHE')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
