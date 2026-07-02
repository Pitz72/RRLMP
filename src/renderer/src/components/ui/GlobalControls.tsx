import { useState, useEffect, useRef } from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import AudioContextManager from '../../engine/AudioContextManager';
import MicManager from '../../engine/MicManager';
import { Button } from './Button';
import { Square, Volume2, FileCheck2, FolderInput, SlidersHorizontal, FilePlus2, HardDriveDownload, FileOutput, BookOpen, Command, ListMusic, Check, Mic, MicOff, Undo2, Redo2, Grid3x3, Files, ChevronDown, Disc3, Wrench } from 'lucide-react';
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
import { classifySilenceResult } from '../../utils/silenceDetection';
import { populateDefaultFxIfVirgin } from '../../utils/defaultSfx';
import { MIC_ARM_ENABLED } from '../../utils/featureFlags';



import { useSettingsStore } from '../../store/useSettingsStore';
import MidiManager from '../../engine/MidiManager';

interface GlobalControlsProps {
    /** Step 3 (UI regia): stato/azione del minipad FX, gestiti in App.tsx. */
    fxPadOpen?: boolean;
    onToggleFxPad?: () => void;
    /** Automix Section (Fase C1, v1.10.22): stato/azione della vista full-screen. */
    automixOpen?: boolean;
    onToggleAutomix?: () => void;
}

export const GlobalControls = ({ fxPadOpen, onToggleFxPad, automixOpen, onToggleAutomix }: GlobalControlsProps) => {
    const { t } = useTranslation();
    const { stopAll } = useAudioStore();
    const loadClip = useAudioStore((s) => s.loadClip);
    const { columns, isDirty, setDirty, loadProject, resetProject, currentFilePath, isMidiLearnMode, setIsMidiLearnMode, runIntegrityCheck, updateClip, addClipFromPath } = useProjectStore();
    const { globalMidiBinds, setGlobalMidiBind, masterVolume, setMasterVolume: setStoredVolume,
        micInputDeviceId, micThresholdDb, micActivationHoldMs, micReleaseHoldMs, micEnabled, micMixEnabled, micVolume, micBypassProcessing, setMicSettings } = useSettingsStore();
    const setMicActive = useAudioStore(s => s.setMicActive);
    const isMicActive = useAudioStore(s => s.isMicActive);
    // v1.10.5: badge FX attivi sul toggle — a pad chiuso un effetto in onda
    // (loop/lungo) non aveva NESSUN riscontro visivo in regia.
    const activeClips = useAudioStore((s) => s.activeClips);
    const sfxCol = columns.find((c) => c.type === 'sfx');
    const sfxActiveCount = sfxCol ? sfxCol.clips.filter((c) => !!activeClips[c.id]).length : 0;
    // v1.5.0: Undo/Redo playlist (selettori reattivi per abilitare/disabilitare i pulsanti)
    const canUndo = useProjectStore((s) => s.undoStack.length > 0);
    const canRedo = useProjectStore((s) => s.redoStack.length > 0);
    const undo = useProjectStore((s) => s.undo);
    const redo = useProjectStore((s) => s.redo);

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

    // v1.10.19 (Task 2 sessione Automix, deciso con l'utente): i 6 pulsanti file
    // (nuovo/salva/salva-come/carica/M3U/export) raggruppati in un menu a tendina —
    // a 1366px la topbar traboccava (misura empirica: pulsanti sopra REC/orologio).
    const [showFileMenu, setShowFileMenu] = useState(false);
    const fileMenuRef = useRef<HTMLDivElement | null>(null);

    // v1.10.27 (rifiniture utente): anche i comandi non-immediati (annulla/ripeti,
    // MIDI Learn, tastiera, impostazioni, info) vanno in un menu a tendina come
    // FILE — in topbar restano solo i controlli da diretta (ARM/VU/Master/STOP/
    // FX/MIX). Il caso scatenante: col mic armato compare il Mic Vol e la barra
    // non aveva più spazio.
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const toolsMenuRef = useRef<HTMLDivElement | null>(null);

    // Chiusura del menu file: click fuori, o ESC in capture (stopPropagation come
    // le modali — ESC-01 v1.4.13: chiudere il menu NON deve innescare l'Emergency Stop).
    useEffect(() => {
        if (!showFileMenu) return;
        const onDown = (e: MouseEvent) => {
            if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
                setShowFileMenu(false);
            }
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                setShowFileMenu(false);
            }
        };
        window.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onEsc, true);
        return () => {
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onEsc, true);
        };
    }, [showFileMenu]);

    // v1.10.27: stessa chiusura (click fuori / ESC in capture) per il menu strumenti.
    useEffect(() => {
        if (!showToolsMenu) return;
        const onDown = (e: MouseEvent) => {
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
                setShowToolsMenu(false);
            }
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                setShowToolsMenu(false);
            }
        };
        window.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onEsc, true);
        return () => {
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onEsc, true);
        };
    }, [showToolsMenu]);

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
    // v1.4.13 (ESC-01): capture + stopPropagation/preventDefault — uscire dal
    // MIDI Learn con ESC non deve più innescare anche l'Emergency Stop globale
    // (listener bubble in App.tsx).
    useEffect(() => {
        if (!isMidiLearnMode) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                setIsMidiLearnMode(false);
                setPendingBind(null);
            }
        };
        window.addEventListener('keydown', handleEsc, true);
        return () => window.removeEventListener('keydown', handleEsc, true);
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

    // v1.10.19: handler dei 6 comandi file, estratti VERBATIM dai vecchi pulsanti
    // della topbar (ora voci del menu a tendina) — zero cambi di logica.
    const handleNewProject = async () => {
        if (isDirty && !await confirm('Nuovo Progetto: le modifiche non salvate andranno perse. Continuare?', 'Nuovo Progetto', 'Annulla')) return;
        stopAll();
        resetProject();
        // v1.10.9: reset → colonna FX vuota → ripopola i default
        void populateDefaultFxIfVirgin();
    };

    const handleSaveProject = async () => {
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
    };

    const handleSaveAs = async () => {
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
    };

    const handleLoadProject = async () => {
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
                    // v2026-07-01: il rilevamento silenzio PRE-SHOW è ora AUTOMATICO
                    // (batch in MainGrid, parte al cambio di currentFilePath) → niente più
                    // prompt qui. Vale per ogni via di caricamento, incluse le clip già caricate.
                }

            } catch (e) {
                toast('File LMP non valido: ' + (e instanceof Error ? e.message : 'struttura non riconosciuta'), 'error');
            }
        }
    };

    const handleImportM3u = async () => {
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
                // Auto-silence detection (v1.7.1: vedi classifySilenceResult —
                // un fallimento/rate-limit NON viene più segnato come "controllato")
                if (window.electron?.detectSilence) {
                    updateClip(preshowColId, newClip.id, { isAnalyzing: true });
                    window.electron.detectSilence(filePath).then(r => {
                        const c = classifySilenceResult(r);
                        if (c.checked) {
                            updateClip(preshowColId, newClip.id, {
                                ...(c.trimStart !== undefined ? { trimStart: c.trimStart, trimEnd: c.trimEnd } : {}),
                                isAnalyzing: false,
                                silenceCheckedV2: true
                            });
                        } else {
                            updateClip(preshowColId, newClip.id, { isAnalyzing: false });
                        }
                    }).catch(() => updateClip(preshowColId, newClip.id, { isAnalyzing: false }));
                }
            }
        }
        toast(`M3U importata — ${added} tracce aggiunte a PRE-SHOW`, 'success');
    };

    const handleExportProject = async () => {
        // v1.4.14 (#4a): l'export è legato al file di salvataggio aperto.
        // Senza progetto salvato non c'è una cartella di riferimento → si
        // chiede prima di salvare (l'archivio audio/ vive accanto al .lmp).
        if (!currentFilePath) {
            toast('Salva prima il progetto: l’archivio audio viene creato accanto al file di salvataggio.', 'error', 6000);
            return;
        }
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

            const result = await window.electron.exportProject(json, currentFilePath);

            // Close Modal
            setExportProgress(prev => ({ ...prev, isOpen: false }));

            if (result.success) {
                // v1.4.14 (#4): archivio sincronizzato col banco regia
                // (copiati i nuovi/cambiati, rimossi gli orfani).
                const s = result.stats;
                const parts = [`${s?.copied || 0} copiati`];
                if (s?.pruned) parts.push(`${s.pruned} rimossi`);
                toast(`Archivio audio sincronizzato — ${parts.join(', ')} in:\n${result.path}\\audio`, 'success', 7000);
            } else {
                if (result.error) toast(`Errore esportazione: ${result.error}`, 'error');
            }
        } catch (e) {
            setExportProgress(prev => ({ ...prev, isOpen: false }));
            toast('Errore chiamando Export IPC', 'error');
        }
    };

    return (
        <div className="flex items-center gap-2 border-l border-zinc-800 pl-3 ml-2">

            {/* FILE MENU (v1.10.19, spostato in testa in v1.10.27 su richiesta utente:
                subito dopo titolo+versione). Trigger a larghezza STABILE tra chiuso e
                aperto: prima lo stato aperto perdeva la width fissa di .tool → shift
                di layout e "STOP ALL su due righe" (bug segnalato). */}
            <div className="relative" ref={fileMenuRef}>
                <Button
                    size="sm"
                    className={`${showFileMenu ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-white/5 text-zinc-300 hover:bg-white/10 border-white/10'} border relative whitespace-nowrap`}
                    title="Menu file — nuovo/salva/carica/M3U/esporta"
                    onClick={(e) => {
                        // v1.10.3: blur anti-retrigger (Space/Enter non deve riaprire il menu)
                        e.currentTarget.blur();
                        setShowFileMenu(v => !v);
                    }}
                >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Files size={14} />
                        <span>FILE</span>
                        <ChevronDown size={12} className={`transition-transform ${showFileMenu ? 'rotate-180' : ''}`} />
                    </div>
                    {/* Indicatore modifiche non salvate (prima era il pulsante Salva giallo) */}
                    {isDirty && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse pointer-events-none" />
                    )}
                </Button>
                {showFileMenu && (
                    <div className="absolute left-0 top-full mt-2 w-60 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 py-1">
                        <button
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                            onClick={() => { setShowFileMenu(false); void handleNewProject(); }}
                        >
                            <FilePlus2 size={15} className="shrink-0" /> {t('welcome.newProject')}
                        </button>
                        <button
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${isDirty ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                            onClick={() => { setShowFileMenu(false); void handleSaveProject(); }}
                        >
                            <FileCheck2 size={15} className={`shrink-0 ${isDirty ? 'animate-pulse' : ''}`} /> {t('controls.save')}
                        </button>
                        <button
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                            onClick={() => { setShowFileMenu(false); void handleSaveAs(); }}
                        >
                            <FileOutput size={15} className="shrink-0" /> {t('controls.saveAs')}
                        </button>
                        <button
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                            onClick={() => { setShowFileMenu(false); void handleLoadProject(); }}
                        >
                            <FolderInput size={15} className="shrink-0" /> {t('welcome.loadProject')}
                        </button>
                        <div className="h-px bg-zinc-800 my-1" />
                        <button
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                            onClick={() => { setShowFileMenu(false); void handleImportM3u(); }}
                        >
                            <ListMusic size={15} className="shrink-0" /> {t('controls.importM3u')}
                        </button>
                        <button
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                            onClick={() => { setShowFileMenu(false); void handleExportProject(); }}
                        >
                            <HardDriveDownload size={15} className="shrink-0" /> {t('controls.export')}
                        </button>
                    </div>
                )}
            </div>

            {/* SMART MIC — ARM button + mini VU + Mic Mix Vol (v1.0.0+).
                v1.11.1: dietro MIC_ARM_ENABLED (vedi utils/featureFlags.ts) —
                inaffidabile coi mixer USB che espongono il mix, non il solo mic. */}
            {MIC_ARM_ENABLED && (
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-2">
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
                    <div className="flex flex-col w-16 animate-in fade-in slide-in-from-left-2">
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
            )}

            {/* VU METER */}
            <VUMeter />

            {/* MASTER VOLUME */}
            <div className={`flex items-center gap-2 group relative ${isMidiLearnMode ? 'cursor-pointer hover:ring-1 ring-cyan-500 rounded p-1' : ''}`}
                onClick={() => {
                    if (isMidiLearnMode) setPendingBind('masterVolume');
                }}
            >
                <Volume2 size={16} className={`${pendingBind === 'masterVolume' ? 'text-cyan-400 animate-bounce' : 'text-zinc-500 group-hover:text-white'} transition-colors`} />
                {/* v1.10.27: w-32 → w-24, guadagno spazio topbar (rifiniture utente) */}
                <div className="flex flex-col w-24">
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

            {/* GLOBAL STOP — v1.10.27: etichetta compatta "ALL" (richiesta utente:
                "solo ALL accanto al pulsante stop dentro l'etichetta rossa, lascia
                intendere che stoppa tutto") + whitespace-nowrap anti-wrap. */}
            <Button
                onClick={() => {
                    if (isMidiLearnMode) {
                        setPendingBind('stopAll');
                    } else {
                        handleStopAll();
                    }
                }}
                title={`${t('controls.stopAll')} — ferma tutto (Emergency Stop)`}
                className={`${isMidiLearnMode
                    ? (pendingBind === 'stopAll' ? 'bg-cyan-600 text-white animate-pulse' : 'bg-zinc-800 text-cyan-500 border-cyan-500/50 hover:bg-zinc-700')
                    : 'stop'} relative whitespace-nowrap`}
                size="sm"
            >
                <div className="flex items-center gap-2">
                    <Square fill="currentColor" size={14} />
                    <span className="font-bold">ALL</span>
                </div>
                {globalMidiBinds['stopAll'] && (
                    <span className="absolute -top-2 -right-1 text-[8px] bg-zinc-900 border border-zinc-700 text-cyan-500 px-1 rounded">
                        {globalMidiBinds['stopAll'].replace('NOTE:', 'N').replace('CC:', 'C')}
                    </span>
                )}
            </Button>

            {/* FX PAD (Step 3 UI regia) — toggle del minipad FX 5×5, accanto a STOP ALL
                per essere sempre ben visibile e a portata durante la diretta. */}
            {onToggleFxPad && (
                <Button
                    size="sm"
                    onClick={(e) => {
                        // v1.10.3: blur — un toggle focused verrebbe ri-attivato da
                        // Space/Enter, aprendo/chiudendo il pad a sorpresa in diretta.
                        e.currentTarget.blur();
                        onToggleFxPad();
                    }}
                    className={`${fxPadOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-white/5 text-zinc-300 hover:bg-white/10 border-white/10'} border relative whitespace-nowrap`}
                    title="Pad FX (5×5) — mostra/nascondi"
                >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Grid3x3 size={14} />
                        <span>FX</span>
                    </div>
                    {/* v1.10.5: badge effetti in onda (visibile anche a pad chiuso) */}
                    {sfxActiveCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center animate-pulse pointer-events-none">
                            {sfxActiveCount}
                        </span>
                    )}
                </Button>
            )}

            {/* AUTOMIX (Fase C1, v1.10.22) — toggle della vista full-screen, accanto a FX */}
            {onToggleAutomix && (
                <Button
                    size="sm"
                    onClick={(e) => {
                        // v1.10.3: blur anti-retrigger (come FX)
                        e.currentTarget.blur();
                        onToggleAutomix();
                    }}
                    className={`${automixOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-white/5 text-zinc-300 hover:bg-white/10 border-white/10'} border whitespace-nowrap`}
                    title="Automix — mix automatico sui BPM (colonna Music)"
                >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Disc3 size={14} />
                        <span>MIX</span>
                    </div>
                </Button>
            )}

            {/* STRUMENTI (v1.10.27) — menu a tendina per i comandi non-immediati
                (annulla/ripeti, MIDI Learn, tastiera, impostazioni, info), stessa
                logica del menu FILE. Richiesta utente: in topbar restano solo i
                controlli da diretta; il caso scatenante era il Mic Vol che compare
                ad ARM attivo e faceva traboccare la barra. */}
            <div className="relative flex items-center gap-2 border-l border-zinc-800 pl-3">
                <div className="relative" ref={toolsMenuRef}>
                    <Button
                        size="sm"
                        className={`${showToolsMenu ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-white/5 text-zinc-300 hover:bg-white/10 border-white/10'} border relative whitespace-nowrap`}
                        title="Strumenti — annulla/ripeti, MIDI, tastiera, impostazioni, info"
                        onClick={(e) => {
                            e.currentTarget.blur();
                            setShowToolsMenu(v => !v);
                        }}
                    >
                        <div className="flex items-center gap-1.5 font-bold text-[11px]">
                            <Wrench size={14} />
                            <ChevronDown size={12} className={`transition-transform ${showToolsMenu ? 'rotate-180' : ''}`} />
                        </div>
                        {/* Stato MIDI visibile anche a menu chiuso: countdown learn / errore */}
                        {isMidiLearnMode && (
                            <span className="absolute -top-2 -right-1 text-[8px] bg-zinc-900 border border-cyan-500 text-cyan-400 px-1 rounded animate-pulse pointer-events-none">
                                {midiLearnCountdown !== null ? `${midiLearnCountdown}s` : 'MIDI'}
                            </span>
                        )}
                        {!isMidiLearnMode && !midiSupported && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 pointer-events-none" title="MIDI non disponibile" />
                        )}
                    </Button>
                    {showToolsMenu && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 py-1">
                            <button
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                disabled={!canUndo}
                                onClick={() => { setShowToolsMenu(false); undo(); }}
                            >
                                <Undo2 size={15} className="shrink-0" /> Annulla
                                <span className="ml-auto text-[9px] font-mono text-zinc-600">Ctrl+Z</span>
                            </button>
                            <button
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                disabled={!canRedo}
                                onClick={() => { setShowToolsMenu(false); redo(); }}
                            >
                                <Redo2 size={15} className="shrink-0" /> Ripeti
                                <span className="ml-auto text-[9px] font-mono text-zinc-600">Ctrl+Y</span>
                            </button>
                            <div className="h-px bg-zinc-800 my-1" />
                            <button
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed ${isMidiLearnMode ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                                disabled={!midiSupported}
                                onClick={() => { setShowToolsMenu(false); setIsMidiLearnMode(!isMidiLearnMode); }}
                            >
                                <span className="shrink-0 font-bold text-[10px] w-[15px]">M</span>
                                {isMidiLearnMode ? 'MIDI Learn — attivo (esci)' : t('controls.midiLearn')}
                                <span className="ml-auto text-[9px] font-mono">
                                    {!midiSupported
                                        ? <span className="text-red-400">✕ n/d</span>
                                        : midiInputCount > 0
                                            ? <span className="text-emerald-400">{midiInputCount} ctrl</span>
                                            : <span className="text-zinc-600">0 ctrl</span>}
                                </span>
                            </button>
                            <button
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                                onClick={() => { setShowToolsMenu(false); setShowKeymapping(true); }}
                            >
                                <Command size={15} className="shrink-0" /> {t('controls.keybinds')}
                            </button>
                            <div className="h-px bg-zinc-800 my-1" />
                            <button
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                                onClick={() => { setShowToolsMenu(false); setShowSettings(true); }}
                            >
                                <SlidersHorizontal size={15} className="shrink-0" /> {t('controls.settings')}
                            </button>
                            <button
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                                onClick={() => { setShowToolsMenu(false); setShowAbout(true); }}
                            >
                                <BookOpen size={15} className="shrink-0" /> {t('controls.info')}
                            </button>
                        </div>
                    )}
                </div>

                {/* AUTO-SAVED BADGE (v0.16.0) — appare 3s dopo ogni auto-backup riuscito.
                    v1.10.27: FLOTTANTE sotto la topbar (absolute) → zero larghezza
                    occupata, niente shift di layout quando compare/scompare. */}
                <span
                    className={`absolute right-0 top-full mt-1 z-40 flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-zinc-900/90 border border-emerald-500/30 rounded px-2 py-0.5 transition-opacity duration-500 whitespace-nowrap ${showAutoSaved ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
