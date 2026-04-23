import React, { useState, useEffect, useMemo } from 'react';
import { AudioClip } from '../../types';
import { debugLog } from '../../store/useDebugStore';
import { Wand2, Settings2, Scissors, FileText, PlayCircle, StopCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '../../store/useToastStore';
import { confirm } from '../../store/useConfirmStore';
import { WaveformEditor } from '../ui/WaveformEditor';
import { useAudioStore } from '../../store/useAudioStore';
import { useProjectStore } from '../../store/useProjectStore';


interface ClipSettingsModalProps {
    clip: AudioClip;
    isOpen: boolean;
    onClose: () => void;
    onSave: (clipId: string, updates: Partial<AudioClip>) => void;
    onDelete: (clipId: string) => void;
}

// 30 colori — stessa palette di ColumnHeader (5 righe x 6 colonne)
const COLUMN_COLORS = [
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
    const [transitionType, setTransitionType] = useState<AudioClip['transitionType']>(clip.transitionType || 'default');
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
            setTransitionType(clip.transitionType || 'default');
            setNotes(clip.notes || '');
            setActiveTab('general'); // Reset tab
        }
    }, [clip, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
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
            outroMarker: Number(outroMarker),
            transitionType,
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
                toast('Auto-Trim: errore durante l\'analisi FFmpeg.', 'error');
                return;
            }
            if (result.data.noSilence) {
                toast('Auto-Trim: nessun silenzio rilevato ai bordi del file.', 'warning');
                return;
            }
            setTrimStart(parseFloat(result.data.trimStart.toFixed(3)));
            setTrimEnd(parseFloat(result.data.trimEnd.toFixed(3)));
            toast(`Auto-Trim applicato — Start: ${result.data.trimStart.toFixed(3)}s / End cut: ${result.data.trimEnd.toFixed(3)}s`, 'success');
            debugLog(`Smart Trim: Start=${result.data.trimStart.toFixed(3)}, EndCut=${result.data.trimEnd.toFixed(3)}`, 'info');
        } catch (e) {
            console.error(e);
            toast('Errore durante l\'analisi del silenzio.', 'error');
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 rounded-lg border border-zinc-700 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER & TABS */}
                <div className="border-b border-zinc-800 bg-zinc-950/50 rounded-t-lg">
                    <div className="p-4 flex justify-between items-center border-b border-zinc-800">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: effectiveDisplayColor }}></span>
                            {clip.name}
                        </h2>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                    </div>
                    <div className="flex px-4 gap-4">
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Settings2 size={16} /> {t('modal.clip.tab.general')}
                        </button>
                        <button
                            onClick={() => setActiveTab('markers')}
                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'markers' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Scissors size={16} /> {t('modal.clip.tab.markers')}
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'notes' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <FileText size={16} /> {t('modal.clip.tab.notes')}
                            {notes && <span className="text-[9px] bg-violet-600/80 text-white px-1.5 py-0.5 rounded font-bold">●</span>}
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* LEFT COLUMN: Visual & Basic */}
                            <div className="space-y-6">
                                {/* NAME */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Clip Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>

                                {/* COLORS */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Color Label</label>
                                    <div className="space-y-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                                        <div className="grid grid-cols-6 gap-1.5">
                                            {COLUMN_COLORS.map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => setCustomColor(c)}
                                                    className="w-7 h-7 rounded-full transition-all hover:scale-125 hover:shadow-lg focus:outline-none"
                                                    style={{
                                                        backgroundColor: c,
                                                        boxShadow: customColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined
                                                    }}
                                                    title={c}
                                                />
                                            ))}
                                        </div>
                                        {customColor && (
                                            <button
                                                onClick={() => setCustomColor(null)}
                                                className="w-full text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors py-1 border border-zinc-800 hover:border-zinc-600 rounded"
                                            >
                                                ↺ Eredita colore dalla colonna
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* VOLUME */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Volume Gain</label>
                                        <span className="text-xs font-mono text-emerald-400">{(volume * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.05"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>

                                {/* KEYBIND */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Global Keybind</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={keybind}
                                            readOnly
                                            placeholder="Click to Record..."
                                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-yellow-400 font-mono text-center cursor-pointer hover:border-yellow-500/50 focus:border-yellow-500 outline-none"
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
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Playback Behavior</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setBehavior('normal')}
                                            className={`p-2 rounded border text-sm transition-all ${behavior === 'normal' ? 'bg-zinc-800 border-emerald-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            Normal
                                        </button>
                                        <button
                                            onClick={() => setBehavior('stacco')}
                                            className={`p-2 rounded border text-sm transition-all ${behavior === 'stacco' ? 'bg-purple-900/20 border-purple-500 text-purple-200' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            Stacco (Jingle)
                                        </button>
                                    </div>
                                </div>

                                {/* TOGGLES */}
                                <div className="space-y-3 bg-zinc-950 p-3 rounded border border-zinc-800">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">Loop Playback</span>
                                        <input
                                            type="checkbox"
                                            checked={isLooping}
                                            onChange={(e) => setIsLooping(e.target.checked)}
                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-emerald-500"
                                        />
                                    </label>

                                    <div className="h-px bg-zinc-900 my-1" />

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">Autoplay Next</span>
                                        <select
                                            value={nextAction}
                                            onChange={(e) => setNextAction(e.target.value as AudioClip['nextAction'])}
                                            className="bg-zinc-900 border border-zinc-800 rounded text-xs p-1 text-white outline-none focus:border-emerald-500"
                                        >
                                            <option value="stop">Stop</option>
                                            <option value="play_next">Play Next</option>
                                        </select>
                                    </label>

                                    <div className="h-px bg-zinc-900 my-1" />

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{t('modal.clip.duckingRole')}</span>
                                        <select
                                            value={duckingRole}
                                            onChange={(e) => setDuckingRole(e.target.value as 'source' | 'target' | 'none')}
                                            className="bg-zinc-900 border border-zinc-800 rounded text-xs p-1 text-white outline-none focus:border-emerald-500"
                                        >
                                            <option value="none">{t('modal.clip.duck.none')}</option>
                                            <option value="source">{t('modal.clip.duck.source')}</option>
                                            <option value="target">{t('modal.clip.duck.target')}</option>
                                        </select>
                                    </label>
                                    <div className="h-px bg-zinc-900 my-1" />

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{t('modal.clip.transitionType')}</span>
                                        <select
                                            value={transitionType}
                                            onChange={(e) => setTransitionType(e.target.value as AudioClip['transitionType'])}
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
                                                    title="Riproduce gli ultimi secondi di questa clip — la transizione scatta naturalmente"
                                                    disabled={isPreviewingThisClip}
                                                >
                                                    <PlayCircle size={13} />
                                                    Test →
                                                </button>
                                                {isPreviewingThisClip && (
                                                    <button
                                                        onClick={() => stopPreviewTransition(clip.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-xs rounded font-medium transition-colors"
                                                        title="Ferma l'anteprima"
                                                    >
                                                        <StopCircle size={13} />
                                                        Stop
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
                                <div className="space-y-4 bg-zinc-950 p-4 rounded border border-zinc-800">
                                    <h3 className="text-xs uppercase text-zinc-500 font-bold border-b border-zinc-800 pb-2">Smooth Fades</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Fade In (ms)</label>
                                            <input
                                                type="number"
                                                value={fadeIn}
                                                onChange={(e) => setFadeIn(parseInt(e.target.value) || 0)}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Fade Out (ms)</label>
                                            <input
                                                type="number"
                                                value={fadeOut}
                                                onChange={(e) => setFadeOut(parseInt(e.target.value) || 0)}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* MANUAL MARKERS INPUTS */}
                                <div className="space-y-4 bg-zinc-950 p-4 rounded border border-zinc-800">
                                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                        <h3 className="text-xs uppercase text-zinc-500 font-bold">Manual Inputs</h3>
                                        <button
                                            onClick={detectSilence}
                                            className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors border border-purple-500/30 rounded px-2 py-0.5 bg-purple-500/10"
                                        >
                                            <Wand2 size={10} /> Auto-Trim
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Trim Start (s)</label>
                                            <input type="number" step="0.1" value={trimStart} onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Trim End (s)</label>
                                            <input type="number" step="0.1" value={trimEnd} onChange={(e) => setTrimEnd(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Intro End (s)</label>
                                            <input type="number" step="0.1" value={introMarker} onChange={(e) => setIntroMarker(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center text-emerald-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Outro Start (s)</label>
                                            <input type="number" step="0.1" value={outroMarker} onChange={(e) => setOutroMarker(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-sm text-center text-orange-400" />
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
                                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Script / Cue Sheet / Note di Regia</p>
                                    <p className="text-[10px] text-zinc-600 mt-0.5">Testo libero — salvato nel progetto .lmp</p>
                                </div>
                                {notes && (
                                    <button
                                        onClick={() => setNotes('')}
                                        className="text-[10px] text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-500/40 rounded px-2 py-1 transition-colors"
                                    >
                                        Cancella
                                    </button>
                                )}
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Inserisci qui lo script, le note di produzione, i cue..."
                                rows={16}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-200 font-mono leading-relaxed resize-none focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-zinc-700 custom-scrollbar"
                                spellCheck={false}
                            />
                            <div className="flex justify-between text-[10px] text-zinc-600">
                                <span>{notes.length} caratteri</span>
                                <span>{notes.split('\n').filter(l => l.trim()).length} righe non vuote</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="bg-zinc-800 p-4 border-t border-zinc-700 flex justify-between shrink-0 rounded-b-lg">
                    <button
                        onClick={handleDelete}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded text-sm font-bold transition-all border border-transparent hover:border-red-500/50"
                    >
                        DELETE CLIP
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white px-4 py-2 rounded text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                        >
                            SAVE CHANGES
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
