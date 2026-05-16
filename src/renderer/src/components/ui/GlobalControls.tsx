import { useState, useEffect, useRef } from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import AudioContextManager from '../../engine/AudioContextManager';
import MicManager from '../../engine/MicManager';
import { Button } from './Button';
import { Square, Volume2, FileCheck2, FolderInput, SlidersHorizontal, FilePlus2, HardDriveDownload, FileOutput, BookOpen, Command, ListMusic, Check, Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';


import { useProjectStore, validateLmpProjectData } from '../../store/useProjectStore';
import { GeneralSettingsModal } from '../modals/GeneralSettingsModal';
import { KeymappingModal } from '../modals/KeymappingModal';
import { VUMeter } from './VUMeter';
import { ExportProgressModal } from '../modals/ExportProgressModal';
import { debugLog } from '../../store/useDebugStore';
import { AboutModal } from '../modals/AboutModal';
import { toast } from '../../store/useToastStore';
import { confirm } from '../../store/useConfirmStore';



import { useSettingsStore } from '../../store/useSettingsStore';
import MidiManager from '../../engine/MidiManager';

export const GlobalControls = () => {
    const { t } = useTranslation();
    const { stopAll } = useAudioStore();
    const loadClip = useAudioStore((s) => s.loadClip);
    const { columns, isDirty, setDirty, loadProject, resetProject, currentFilePath, isMidiLearnMode, setIsMidiLearnMode, runIntegrityCheck, updateClip, addClipFromPath } = useProjectStore();
    const { globalMidiBinds, setGlobalMidiBind, masterVolume, setMasterVolume: setStoredVolume,
        micInputDeviceId, micThresholdDb, micActivationHoldMs, micReleaseHoldMs, micEnabled, micMixEnabled, micVolume, micBypassProcessing, setMicSettings } = useSettingsStore();
    const setMicActive = useAudioStore(s => s.setMicActive);
    const isMicActive = useAudioStore(s => s.isMicActive);

    const [pendingBind, setPendingBind] = useState<string | null>(null); // 'stopAll' | 'masterVolume'
    const [showAutoSaved, setShowAutoSaved] = useState(false);

    // Smart Mic state (v0.17.0)
    const [isArmed, setIsArmed] = useState(false);
    const [micLevel, setMicLevel] = useState(-100);
    const micArmingRef = useRef(false); // evita doppio arm in StrictMode
    const autoSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const midiLearnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // M2 Fix: stato MIDI per badge visivo
    const [midiInputCount, setMidiInputCount] = useState(0);
    const [midiSupported, setMidiSupported] = useState(true);

    // M3 Fix: countdown MIDI Learn
    const [midiLearnCountdown, setMidiLearnCountdown] = useState<number | null>(null);


    const [showSettings, setShowSettings] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showKeymapping, setShowKeymapping] = useState(false);

    // Export Progress State
    const [exportProgress, setExportProgress] = useState({ isOpen: false, current: 0, total: 0, filename: '' });

    // M2 Fix: sottoscrive le notifiche di stato MIDI
    useEffect(() => {
        const unsub = MidiManager.getInstance().addStatusListener((supported, count) => {
            setMidiSupported(supported);
            setMidiInputCount(count);
            if (!supported) {
                debugLog('⚠️ MIDI non disponibile — controller non connesso o permesso negato', 'error');
            }
        });
        return () => unsub();
    }, []);

    // Export Progress Listener
    useEffect(() => {
        if (!window.electron || !window.electron.onExportProgress) return;
        const unsubscribe = window.electron.onExportProgress((_e, data) => {
            setExportProgress(prev => ({ ...prev, current: data.current, total: data.total, filename: data.filename }));
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Auto-Backup Timer (5 minutes)
    // BUGFIX v0.10.3: Decoupled from columns dependency to avoid resetting the timer on every change.
    useEffect(() => {
        const timer = setInterval(async () => {
            const { columns, currentFilePath, isDirty } = useProjectStore.getState();

            // PERSIST-01 (v1.3.3): gate vero su isDirty.
            // Prima il check era solo `columns.length > 0` → un progetto caricato e
            // mai modificato veniva riscritto in autosave ogni 5 min (I/O inutile +
            // rotazione che cancella backup utenti più vecchi). Ora salta se pulito.
            if (columns.length > 0 && isDirty) {
                const projectData = {
                    version: __APP_VERSION__,
                    timestamp: Date.now(),
                    project: { columns }
                };
                const json = JSON.stringify(projectData, null, 2);
                
                if (window.electron && window.electron.saveProjectSilent) {
                    const result = await window.electron.saveProjectSilent(json, currentFilePath || undefined);

                    if (result.success) {
                        debugLog(`Auto-backup completed: ${result.path?.split(/[\\/]/).pop()}`, 'info');
                        setShowAutoSaved(true);
                        if (autoSavedTimerRef.current) clearTimeout(autoSavedTimerRef.current);
                        autoSavedTimerRef.current = setTimeout(() => {
                            setShowAutoSaved(false);
                            autoSavedTimerRef.current = null;
                        }, 3000);
                    } else {
                        debugLog(`Auto-backup failed: ${result.error}`, 'error');
                    }
                }
            }
        }, 300000); // 5 minutes

        return () => {
            clearInterval(timer);
            if (autoSavedTimerRef.current) clearTimeout(autoSavedTimerRef.current);
        };
    }, []); // Run once on mount

    // Unsaved Changes Alert (Close Protection)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Trigger standard browser/electron dialog
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);


    // Global MIDI Learn Listener
    useEffect(() => {
        if (!isMidiLearnMode || !pendingBind) return;

        const handleMidi = (note: number, _velocity: number, command: number) => {
            const type = command === 144 ? 'NOTE' : (command === 176 ? 'CC' : null);
            if (!type) return;

            const bindString = `${type}:${note}`;
            setGlobalMidiBind(pendingBind, bindString);
            setPendingBind(null);
        };

        const unsubscribe = MidiManager.getInstance().addListener(handleMidi);
        return () => unsubscribe();
    }, [isMidiLearnMode, pendingBind]);

    // M3 Fix: timeout automatico MIDI Learn (15s) con countdown visivo
    // LI-05 Fix: ref-based interval per prevenire doppio setInterval su toggle rapido
    useEffect(() => {
        if (midiLearnIntervalRef.current !== null) {
            clearInterval(midiLearnIntervalRef.current);
            midiLearnIntervalRef.current = null;
        }
        if (!isMidiLearnMode) {
            setMidiLearnCountdown(null);
            return;
        }
        const TIMEOUT_SEC = 15;
        setMidiLearnCountdown(TIMEOUT_SEC);
        midiLearnIntervalRef.current = setInterval(() => {
            setMidiLearnCountdown(prev => {
                if (prev === null || prev <= 1) {
                    if (midiLearnIntervalRef.current !== null) {
                        clearInterval(midiLearnIntervalRef.current);
                        midiLearnIntervalRef.current = null;
                    }
                    setIsMidiLearnMode(false);
                    setPendingBind(null);
                    debugLog('MIDI Learn: timeout — modalità disattivata automaticamente', 'info');
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (midiLearnIntervalRef.current !== null) {
                clearInterval(midiLearnIntervalRef.current);
                midiLearnIntervalRef.current = null;
            }
        };
    }, [isMidiLearnMode]);

    // M3 Fix: Escape per uscire da MIDI Learn
    useEffect(() => {
        if (!isMidiLearnMode) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMidiLearnMode(false);
                setPendingBind(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isMidiLearnMode]);

    // Initial sync: applica il volume persistito allo store → AudioContextManager all'avvio
    useEffect(() => {
        AudioContextManager.getInstance().setMasterVolume(masterVolume);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // v0.17.0 — Smart Mic: gestisce arm/disarm e i listener di livello e attività
    const handleArmToggle = async () => {
        const mic = MicManager.getInstance();
        if (isArmed) {
            mic.disarm();
            setIsArmed(false);
            setMicLevel(-100);
            setMicActive(false);
        } else {
            if (micArmingRef.current) return;
            micArmingRef.current = true;
            try {
                // Passa le opzioni di mix all'arm (v1.0.0+), hold times v1.2.14
                await mic.arm(micInputDeviceId, micThresholdDb, {
                    enabled: micMixEnabled,
                    volume: micVolume,
                    bypass: micBypassProcessing
                }, {
                    activationMs: micActivationHoldMs,
                    releaseMs: micReleaseHoldMs
                });
                setIsArmed(true);
            } catch (e) {
                console.error('[SmartMic] Arm failed:', e);
                micArmingRef.current = false;
                return;
            }
            micArmingRef.current = false;
        }
    };

    // v1.0.0+ — Sincronizza le impostazioni di mix a caldo quando cambiano nello store
    useEffect(() => {
        if (isArmed) {
            MicManager.getInstance().updateMixSettings({
                enabled: micMixEnabled,
                volume: micVolume,
                bypass: micBypassProcessing
            });
        }
    }, [isArmed, micMixEnabled, micVolume, micBypassProcessing]);

    // Sottoscrive ai livelli e agli eventi di attività una volta armato
    useEffect(() => {
        if (!isArmed) return;
        const mic = MicManager.getInstance();
        const unsubLevel    = mic.addLevelListener(db => setMicLevel(db));
        const unsubActivity = mic.addActivityListener(active => setMicActive(active));
        return () => {
            unsubLevel();
            unsubActivity();
        };
    }, [isArmed]); // eslint-disable-line react-hooks/exhaustive-deps

    // Disarma il mic se micEnabled viene disattivato dalle impostazioni
    useEffect(() => {
        if (!micEnabled && isArmed) {
            MicManager.getInstance().disarm();
            setIsArmed(false);
            setMicLevel(-100);
            setMicActive(false);
        }
    }, [micEnabled]); // eslint-disable-line react-hooks/exhaustive-deps




    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = parseFloat(e.target.value);
        setStoredVolume(newVal);
        AudioContextManager.getInstance().setMasterVolume(newVal);
    };

    const handleMicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = parseFloat(e.target.value);
        setMicSettings({ volume: newVal });
        // L'useEffect sopra si occuperà di chiamare MicManager.updateMixSettings
    };

    const handleStopAll = () => {
        stopAll();
    };

    return (
        <div className="flex items-center gap-4 border-l border-zinc-800 pl-4 ml-4">

            {/* SMART MIC — ARM button + mini VU + Mic Mix Vol (v1.0.0+) */}
            <div className="flex items-center gap-3 border-r border-zinc-800 pr-4 mr-2">
                <div className="flex flex-col gap-1">
                    <button
                        onClick={handleArmToggle}
                        title={isArmed ? 'Disarma microfono' : 'Arma microfono (Smart Ducking + Mix Input)'}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            isArmed
                                ? isMicActive
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse'
                                    : 'bg-red-900/60 text-red-400 border border-red-700'
                                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 border border-zinc-700'
                        }`}
                    >
                        {isArmed ? <Mic size={12} /> : <MicOff size={12} />}
                        <span>ARM</span>
                    </button>
                    {/* Badge indicatore Mix attivo */}
                    {isArmed && micMixEnabled && (
                        <span className="text-[8px] text-center font-bold text-emerald-500 uppercase tracking-tighter">On Mix</span>
                    )}
                </div>

                {/* Mini VU mic — 8 barre verticali */}
                <div className="flex items-end gap-px h-6 w-10" title={`${micLevel.toFixed(1)} dBFS`}>
                    {isArmed ? (
                        Array.from({ length: 8 }).map((_, i) => {
                            const barThreshold = -60 + i * 6.25;
                            const isLit = micLevel >= barThreshold;
                            const isRed = i >= 6;
                            const isYellow = i === 5;
                            return (
                                <div
                                    key={i}
                                    className={`w-1 rounded-sm transition-all duration-75 ${
                                        isLit
                                            ? isRed    ? 'bg-red-500'
                                            : isYellow ? 'bg-yellow-400'
                                                       : 'bg-emerald-400'
                                            : 'bg-zinc-700'
                                    }`}
                                    style={{ height: `${40 + i * 7}%` }}
                                />
                            );
                        })
                    ) : (
                        <div className="w-full h-px bg-zinc-800 self-center" />
                    )}
                </div>

                {/* Mic Volume Slider (visibile solo se armato) */}
                {isArmed && (
                    <div className="flex flex-col w-20 animate-in fade-in slide-in-from-left-2">
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase">Mic Vol</span>
                            <span className="text-[9px] text-red-400 font-mono">{Math.round(micVolume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={micVolume}
                            onChange={handleMicVolumeChange}
                            className="h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 w-full"
                        />
                    </div>
                )}
            </div>

            {/* VU METER */}
            <VUMeter />

            {/* MASTER VOLUME */}
            <div className={`flex items-center gap-2 group relative ${isMidiLearnMode ? 'cursor-pointer hover:ring-1 ring-cyan-500 rounded p-1' : ''}`}
                onClick={() => {
                    if (isMidiLearnMode) setPendingBind('masterVolume');
                }}
            >
                <Volume2 size={16} className={`${pendingBind === 'masterVolume' ? 'text-cyan-400 animate-bounce' : 'text-zinc-500 group-hover:text-white'} transition-colors`} />
                <div className="flex flex-col w-32">
                    <div className="flex justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">{t('controls.masterVol')}</span>
                        {globalMidiBinds['masterVolume'] && (
                            <span className="text-[9px] text-cyan-500 font-mono">{globalMidiBinds['masterVolume'].replace('CC:', 'C')}</span>
                        )}
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={masterVolume}
                        onChange={handleVolumeChange}
                        disabled={isMidiLearnMode} // Disable slider dragging in learn mode to prevent conflicts? Or allow? Prompt says "Rendi cliccabile".
                        className={`h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-emerald-400 w-full ${isMidiLearnMode ? 'pointer-events-none' : ''}`}
                    />
                </div>
                {isMidiLearnMode && pendingBind === 'masterVolume' && (
                    <div className="absolute inset-0 bg-cyan-900/80 flex items-center justify-center text-[10px] text-cyan-200 font-bold backdrop-blur-sm rounded">
                        MOVE FADER...
                    </div>
                )}
            </div>

            {/* GLOBAL STOP */}
            <Button
                onClick={() => {
                    if (isMidiLearnMode) {
                        setPendingBind('stopAll');
                    } else {
                        handleStopAll();
                    }
                }}
                className={`${isMidiLearnMode
                    ? (pendingBind === 'stopAll' ? 'bg-cyan-600 text-white animate-pulse' : 'bg-zinc-800 text-cyan-500 border-cyan-500/50 hover:bg-zinc-700')
                    : 'bg-red-500/10 hover:bg-red-500 hover:text-white border-red-500/50 text-red-500'} mr-4 relative`}
                size="sm"
            >
                <div className="flex items-center gap-2">
                    <Square fill="currentColor" size={14} />
                    <span className="font-bold">{t('controls.stopAll')}</span>
                </div>
                {globalMidiBinds['stopAll'] && (
                    <span className="absolute -top-2 -right-1 text-[8px] bg-zinc-900 border border-zinc-700 text-cyan-500 px-1 rounded">
                        {globalMidiBinds['stopAll'].replace('NOTE:', 'N').replace('CC:', 'C')}
                    </span>
                )}
            </Button>


            {/* PERSISTENCE */}
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    title={t('welcome.newProject')}
                    onClick={async () => {
                        if (isDirty && !await confirm('Nuovo Progetto: le modifiche non salvate andranno perse. Continuare?', 'Nuovo Progetto', 'Annulla')) return;
                        stopAll();
                        resetProject();
                    }}
                >
                    <FilePlus2 size={16} />
                </Button>
                <Button
                    size="sm"
                    className={`${isDirty ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 hover:bg-yellow-500 hover:text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'} transition-all`}
                    title={t('controls.save')}
                    onClick={async () => {
                        const projectData = {
                            version: __APP_VERSION__,
                            timestamp: Date.now(),
                            project: { columns }
                        };
                        const json = JSON.stringify(projectData, null, 2);

                        let result;
                        if (currentFilePath) {
                            result = await window.electron.saveProjectDirect(json, currentFilePath);
                        } else {
                            result = await window.electron.saveProject(json);
                        }

                        if (result.success) {
                            setDirty(false);
                            if (result.filePath) {
                                // If we did a saveProject (dialog), update path. 
                                // Direct save preserves path, so no change needed unless we want to be safe.
                                // But loadProject signature is clumsy.
                                // IF result.filePath is returned, update it.
                                loadProject({ columns }, result.filePath, { preserveUiState: true });
                            }
                        } else {
                            if (result.error) toast('Salvataggio fallito: ' + result.error, 'error');
                        }
                    }}
                >
                    <FileCheck2 size={16} className={isDirty ? "animate-pulse" : ""} />
                </Button>

                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 ml-1"
                    title={t('controls.saveAs')}
                    onClick={async () => {
                        const projectData = {
                            version: __APP_VERSION__,
                            timestamp: Date.now(),
                            project: { columns }
                        };
                        const json = JSON.stringify(projectData, null, 2);
                        const result = await window.electron.saveProject(json);

                        if (result.success && result.filePath) {
                            setDirty(false);
                            loadProject({ columns }, result.filePath, { preserveUiState: true });
                        }
                    }}
                >
                    <FileOutput size={16} />

                </Button>

                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    title={t('welcome.loadProject')}
                    onClick={async () => {
                        if (isDirty && !await confirm('Hai modifiche non salvate. Caricare un nuovo progetto le sovrascriverà. Continuare?', 'Carica comunque', 'Annulla')) return;

                        const result = await window.electron.loadProject();
                        // PERSIST-04 (v1.3.3): il main ora torna success:false con error
                        // esplicito se il file non è JSON valido. Surfacciamo all'utente.
                        if (!result.success && (result as { error?: string }).error) {
                            toast((result as { error: string }).error, 'error');
                            return;
                        }
                        if (result.success && result.data) {
                            try {
                                const parsed = JSON.parse(result.data);
                                const projectData = validateLmpProjectData(parsed.project);
                                {
                                    loadProject(projectData, result.filePath);
                                    stopAll();
                                    setDirty(false);
                                    // Integrity check (v0.14.2)
                                    runIntegrityCheck().then(missing => {
                                        if (missing > 0) console.warn(`[Integrity] ${missing} file mancante/i nel progetto caricato.`);
                                    });
                                    // Silence check (v0.14.10): chiede se analizzare le clip PRE-SHOW mai analizzate
                                    const preshowCol = parsed.project.columns?.find((c: { type: string }) => c.type === 'preshow');
                                    const unanalyzed = (preshowCol?.clips ?? []).filter((c: { silenceChecked?: boolean; isMissing?: boolean }) => !c.silenceChecked && !c.isMissing);
                                    if (unanalyzed.length > 0 && window.electron?.detectSilence) {
                                        confirm(
                                            `${unanalyzed.length} clip PRE-SHOW non sono mai state analizzate per il silenzio automatico. Eseguire l'analisi ora?`,
                                            'Analizza',
                                            'Salta'
                                        ).then(yes => {
                                            if (!yes) return;
                                            toast(`Analisi silenzio: ${unanalyzed.length} clip in coda…`, 'info');
                                            unanalyzed.forEach((clip: { id: string; path: string; name: string }) => {
                                                updateClip('col-preshow', clip.id, { isAnalyzing: true });
                                                window.electron.detectSilence(clip.path).then(result => {
                                                    if (result.success && result.data && !result.data.noSilence) {
                                                        updateClip('col-preshow', clip.id, { trimStart: result.data.trimStart, trimEnd: result.data.trimEnd, isAnalyzing: false, silenceChecked: true });
                                                    } else {
                                                        updateClip('col-preshow', clip.id, { isAnalyzing: false, silenceChecked: true });
                                                    }
                                                }).catch(() => {
                                                    updateClip('col-preshow', clip.id, { isAnalyzing: false, silenceChecked: true });
                                                });
                                            });
                                        });
                                    }
                                }

                            } catch (e) {
                                toast('File LMP non valido: ' + (e instanceof Error ? e.message : 'struttura non riconosciuta'), 'error');
                            }
                        }
                    }}
                >
                    <FolderInput size={16} />
                </Button>
                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    title={t('controls.importM3u')}
                    onClick={async () => {
                        if (!window.electron?.importM3u) return;
                        const result = await window.electron.importM3u();
                        if (!result.success || !result.paths || result.paths.length === 0) {
                            if (result.success) toast('Nessun file audio trovato nella playlist.', 'warning');
                            return;
                        }
                        const preshowColId = 'col-preshow';
                        let added = 0;
                        for (const filePath of result.paths) {
                            const newClip = addClipFromPath(preshowColId, filePath);
                            if (newClip) {
                                added++;
                                loadClip(newClip);
                                // Auto-silence detection
                                if (window.electron?.detectSilence) {
                                    updateClip(preshowColId, newClip.id, { isAnalyzing: true });
                                    window.electron.detectSilence(filePath).then(r => {
                                        if (r.success && r.data && !r.data.noSilence) {
                                            updateClip(preshowColId, newClip.id, { trimStart: r.data.trimStart, trimEnd: r.data.trimEnd, isAnalyzing: false, silenceChecked: true });
                                        } else {
                                            updateClip(preshowColId, newClip.id, { isAnalyzing: false, silenceChecked: true });
                                        }
                                    }).catch(() => updateClip(preshowColId, newClip.id, { isAnalyzing: false, silenceChecked: true }));
                                }
                            }
                        }
                        toast(`M3U importata — ${added} tracce aggiunte a PRE-SHOW`, 'success');
                    }}
                >
                    <ListMusic size={16} />
                </Button>
                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 ml-1"
                    title={t('controls.export')}
                    onClick={async () => {
                        if (isDirty && !await confirm('Ci sono modifiche non salvate. Si consiglia di salvare prima di esportare. Continuare comunque?', 'Esporta comunque', 'Annulla')) return;

                        const projectData = {
                            version: __APP_VERSION__,
                            timestamp: Date.now(),
                            project: { columns }
                        };
                        const json = JSON.stringify(projectData, null, 2);

                        // User feedback: Loading state? 
                        // For now detailed alerts.
                        try {
                            // Reset and Open Modal
                            setExportProgress({ isOpen: true, current: 0, total: 0, filename: 'Starting...' });

                            const result = await window.electron.exportProject(json);

                            // Close Modal
                            setExportProgress(prev => ({ ...prev, isOpen: false }));

                            if (result.success) {
                                toast(`Esportazione completata — ${result.stats?.copied || 0} file copiati in:\n${result.path}`, 'success', 7000);
                            } else {
                                if (result.error) toast(`Errore esportazione: ${result.error}`, 'error');
                            }
                        } catch (e) {
                            setExportProgress(prev => ({ ...prev, isOpen: false }));
                            toast('Errore chiamando Export IPC', 'error');
                        }
                    }}

                >
                    <HardDriveDownload size={16} />
                </Button>

                <Button
                    size="sm"
                    className={`${
                        !midiSupported
                            ? 'bg-red-900/40 text-red-500 border border-red-500/40'
                            : isMidiLearnMode
                                ? 'bg-cyan-500 text-white animate-pulse'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    } ml-2 relative`}
                    title={!midiSupported ? 'MIDI non disponibile' : t('controls.midiLearn')}
                    onClick={() => setIsMidiLearnMode(!isMidiLearnMode)}
                >
                    <div className="flex items-center gap-1 font-bold text-[10px]">
                        <span>MIDI</span>
                        {/* M2: badge numero controller */}
                        {midiSupported && midiInputCount > 0 && (
                            <span className="text-[8px] bg-emerald-600 text-white px-1 rounded-full">{midiInputCount}</span>
                        )}
                        {!midiSupported && (
                            <span className="text-[8px] text-red-400">✕</span>
                        )}
                    </div>
                    {/* M3: countdown visivo */}
                    {isMidiLearnMode && midiLearnCountdown !== null && (
                        <span className="absolute -top-2 -right-1 text-[8px] bg-zinc-900 border border-cyan-500 text-cyan-400 px-1 rounded">
                            {midiLearnCountdown}s
                        </span>
                    )}
                </Button>

                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 ml-1"
                    title={t('controls.keybinds')}
                    onClick={() => setShowKeymapping(true)}
                >
                    <Command size={16} />
                </Button>

                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 ml-2"
                    title={t('controls.settings')}

                    onClick={() => setShowSettings(true)}
                >
                    <SlidersHorizontal size={16} />
                </Button>

                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 ml-1"
                    title={t('controls.info')}
                    onClick={() => setShowAbout(true)}
                >
                    <BookOpen size={16} />
                </Button>

                {/* AUTO-SAVED BADGE (v0.16.0) — appare 3s dopo ogni auto-backup riuscito */}
                <span
                    className={`flex items-center gap-1 text-[10px] font-medium text-emerald-400 ml-2 transition-opacity duration-500 ${showAutoSaved ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    <Check size={11} strokeWidth={2.5} />
                    Auto-saved
                </span>
            </div>

            <GeneralSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
            <KeymappingModal isOpen={showKeymapping} onClose={() => setShowKeymapping(false)} />
            <ExportProgressModal
                isOpen={exportProgress.isOpen}
                current={exportProgress.current}
                total={exportProgress.total}
                filename={exportProgress.filename}
            />
        </div>

    );
};
