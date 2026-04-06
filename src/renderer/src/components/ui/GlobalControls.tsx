import { useState, useEffect } from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import AudioContextManager from '../../engine/AudioContextManager';
import { Button } from './Button';
import { Square, Volume2, Save, FolderOpen, Settings, FilePlus, Package, Edit, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';


import { useProjectStore } from '../../store/useProjectStore';
import { GeneralSettingsModal } from '../modals/GeneralSettingsModal';
import { VUMeter } from './VUMeter';
import { ExportProgressModal } from '../modals/ExportProgressModal';
import { debugLog } from '../../store/useDebugStore';
import { AboutModal } from '../modals/AboutModal';



import { useSettingsStore } from '../../store/useSettingsStore';
import MidiManager from '../../engine/MidiManager';

export const GlobalControls = () => {
    const { t } = useTranslation();
    const { stopAll } = useAudioStore();
    const { columns, isDirty, setDirty, loadProject, resetProject, currentFilePath, isMidiLearnMode, setIsMidiLearnMode, runIntegrityCheck } = useProjectStore();
    const { globalMidiBinds, setGlobalMidiBind } = useSettingsStore();

    const [volume, setVolume] = useState(1.0);
    const [pendingBind, setPendingBind] = useState<string | null>(null); // 'stopAll' | 'masterVolume'

    // M2 Fix: stato MIDI per badge visivo
    const [midiInputCount, setMidiInputCount] = useState(0);
    const [midiSupported, setMidiSupported] = useState(true);

    // M3 Fix: countdown MIDI Learn
    const [midiLearnCountdown, setMidiLearnCountdown] = useState<number | null>(null);


    const [showSettings, setShowSettings] = useState(false);
    const [showAbout, setShowAbout] = useState(false);

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
            const { columns, currentFilePath } = useProjectStore.getState();
            
            // Only auto-backup if there are changes and we have valid project data
            if (columns.length > 0) {
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
                    } else {
                        debugLog(`Auto-backup failed: ${result.error}`, 'error');
                    }
                }
            }
        }, 300000); // 5 minutes

        return () => clearInterval(timer);
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
    useEffect(() => {
        if (!isMidiLearnMode) {
            setMidiLearnCountdown(null);
            return;
        }
        const TIMEOUT_SEC = 15;
        setMidiLearnCountdown(TIMEOUT_SEC);
        const interval = setInterval(() => {
            setMidiLearnCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    setIsMidiLearnMode(false);
                    setPendingBind(null);
                    debugLog('MIDI Learn: timeout — modalità disattivata automaticamente', 'info');
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
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

    // Initial sync
    useEffect(() => {
        const mgr = AudioContextManager.getInstance();
        setVolume(mgr.getOutput().gain.value);
    }, []);




    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = parseFloat(e.target.value);
        setVolume(newVal);
        AudioContextManager.getInstance().setMasterVolume(newVal);
    };

    const handleStopAll = () => {
        stopAll();
    };

    return (
        <div className="flex items-center gap-4 border-l border-zinc-800 pl-4 ml-4">

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
                        value={volume}
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
                    onClick={() => {
                        if (isDirty && !confirm('Nuovo Progetto: Sei sicuro? Perderai le modifiche non salvate.')) return;
                        stopAll();
                        resetProject();
                    }}
                >
                    <FilePlus size={16} />
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
                                loadProject({ columns, isDirty: false } as any, result.filePath);
                            }
                        } else {
                            if (result.error) alert('Salvataggio fallito: ' + result.error);
                        }
                    }}
                >
                    <Save size={16} className={isDirty ? "animate-pulse" : ""} />
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
                            loadProject({ columns, isDirty: false } as any, result.filePath);
                        }
                    }}
                >
                    <Edit size={16} />

                </Button>

                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    title={t('welcome.loadProject')}
                    onClick={async () => {
                        if (isDirty && !confirm('Hai modifiche non salvate. Caricare un nuovo progetto le sovrascriverà. Continuare?')) return;

                        const result = await window.electron.loadProject();
                        if (result.success && result.data) {
                            try {
                                const parsed = JSON.parse(result.data);
                                if (parsed.project && parsed.project.columns) {
                                    loadProject(parsed.project, result.filePath);
                                    stopAll();
                                    setDirty(false);
                                    // Integrity check (v0.14.2): verifica file su disco dopo il caricamento
                                    runIntegrityCheck().then(missing => {
                                        if (missing > 0) {
                                            console.warn(`[Integrity] ${missing} file mancante/i nel progetto caricato.`);
                                        }
                                    });
                                } else {
                                    alert('File LMP non valido o corrotto.');
                                }

                            } catch (e) {
                                alert('Errore lettura file.');
                            }
                        }
                    }}
                >
                    <FolderOpen size={16} />
                </Button>
                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 ml-1"
                    title={t('controls.export')}
                    onClick={async () => {
                        if (isDirty && !confirm('Si consiglia di salvare il progetto corrente prima di esportare. Continuare comunque?')) return;

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
                                alert(`Esportazione completata con successo!\nSalvato in: ${result.path}\nFile copiati: ${result.stats?.copied || 0}\nFile saltati: ${result.stats?.skipped || 0}`);
                            } else {
                                if (result.error) alert(`Errore durante l'esportazione: ${result.error}`);
                            }
                        } catch (e) {
                            setExportProgress(prev => ({ ...prev, isOpen: false }));
                            alert('Errore chiamando Export IPC');
                        }
                    }}

                >
                    <Package size={16} />
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
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 ml-2"
                    title={t('controls.settings')}

                    onClick={() => setShowSettings(true)}
                >
                    <Settings size={16} />
                </Button>

                <Button
                    size="sm"
                    className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 ml-1"
                    title={t('controls.info')}
                    onClick={() => setShowAbout(true)}
                >
                    <Info size={16} />
                </Button>
            </div>

            <GeneralSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
            <ExportProgressModal
                isOpen={exportProgress.isOpen}
                current={exportProgress.current}
                total={exportProgress.total}
                filename={exportProgress.filename}
            />
        </div>

    );
};
