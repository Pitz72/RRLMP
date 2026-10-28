import { useState, useEffect, useRef } from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import AudioContextManager from '../../engine/AudioContextManager';
import MicManager from '../../engine/MicManager';
import { Square, FileCheck2, FolderInput, SlidersHorizontal, FilePlus2, HardDriveDownload, FileOutput, BookOpen, Command, ListMusic, Check, MicOff, Undo2, Redo2, Files, ChevronDown, Wrench, Cable } from 'lucide-react';
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
import { populateDefaultFxIfPadEmpty } from '../../utils/defaultSfx';
import { MIC_ARM_ENABLED } from '../../utils/featureFlags';
import { UpdaterStatusPayload } from '../../types';



import { useSettingsStore } from '../../store/useSettingsStore';
import MidiManager from '../../engine/MidiManager';

interface GlobalControlsProps {
    /** Step 3 (UI regia): stato/azione del minipad FX, gestiti in App.tsx. */
    fxPadOpen?: boolean;
    onToggleFxPad?: () => void;
    /** Automix Section (Fase C1, v1.10.22): stato/azione della vista full-screen. */
    automixOpen?: boolean;
    onToggleAutomix?: () => void;
    /** Auto-Updater (2026-07-02): stato centralizzato in App.tsx, inoltrato ad AboutModal. */
    updaterStatus: UpdaterStatusPayload;
    onOpenUpdateModal: () => void;
    onCheckUpdatesNow: () => void;
}

export const GlobalControls = ({ fxPadOpen, onToggleFxPad, automixOpen, onToggleAutomix, updaterStatus, onOpenUpdateModal, onCheckUpdatesNow }: GlobalControlsProps) => {
    const { t } = useTranslation();
    // v1.15.35 (M4): selettore singolo. `useAudioStore()` senza selettore abbonava la
    // barra comandi all'INTERO store audio, che durante la riproduzione cambia 10 volte
    // al secondo (progresso delle clip): la topbar si ridisegnava di continuo.
    const stopAll = useAudioStore((s) => s.stopAll);
    const loadClip = useAudioStore((s) => s.loadClip);
    const { columns, isDirty, setDirty, loadProject, resetProject, currentFilePath, isMidiLearnMode, setIsMidiLearnMode, runIntegrityCheck, updateClip, addClipFromPath, applyArchivedPaths, setCurrentFilePath } = useProjectStore();
    const { globalMidiBinds, setGlobalMidiBind, masterVolume, setMasterVolume: setStoredVolume,
        micInputDeviceId, micThresholdDb, micActivationHoldMs, micReleaseHoldMs, micEnabled, micMixEnabled, micVolume, micBypassProcessing, setMicSettings } = useSettingsStore();
    const setMicActive = useAudioStore(s => s.setMicActive);
    const isMicActive = useAudioStore(s => s.isMicActive);
    // v1.10.5: badge FX attivi sul toggle — a pad chiuso un effetto in onda
    // (loop/lungo) non aveva NESSUN riscontro visivo in regia.
    // v1.15.35 (M4): il selettore restituisce direttamente il conteggio (un numero
    // stabile), non la mappa delle clip in onda.
    const sfxCol = columns.find((c) => c.type === 'sfx');
    const sfxActiveCount = useAudioStore((s) => (sfxCol ? sfxCol.clips.filter((c) => !!s.activeClips[c.id]).length : 0));
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
            // v1.15.35 (L1): tutti i 16 canali, come il riconoscimento in App.tsx
            // (che maschera il canale dal 2026-05-29). Qui si confrontava ancora
            // `command === 144/176`: un controller che trasmette su un canale diverso
            // dall'1 veniva riconosciuto in onda ma non si lasciava assegnare.
            const status = command & 0xf0;
            const type = status === 0x90 ? 'NOTE' : (status === 0xb0 ? 'CC' : null);
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
                // v1.15.35 (L3): prima l'errore finiva solo in console — in regia il
                // pulsante ARM semplicemente non si accendeva (microfono scollegato,
                // dispositivo cambiato, accesso negato), senza alcuna spiegazione.
                toast(t('controls.micArmFailed', 'Microfono non disponibile: {{err}}', { err: e instanceof Error ? e.message : String(e) }), 'error', 7000);
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
        if (isDirty && !await confirm(t('confirm.newProject', 'Nuovo Progetto: le modifiche non salvate andranno perse. Continuare?'), t('confirm.newProjectOk', 'Nuovo Progetto'), t('modal.dialog.cancel', 'Annulla'))) return;
        stopAll();
        resetProject();
        // v1.10.9: reset → colonna FX vuota → ripopola i default
        void populateDefaultFxIfPadEmpty();
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
            // v1.15.22: salvato con dialog → registra il nuovo percorso, e basta.
            // Prima si passava da loadProject(preserveUiState), che è l'azione di
            // CARICAMENTO: azzerava isMissing su tutte le clip (badge rossi spariti
            // dopo un salvataggio) e reimpostava le colonne da uno snapshot anteriore
            // al dialog, perdendo le analisi completate nel frattempo.
            if (result.filePath) {
                setCurrentFilePath(result.filePath);
            }
        } else {
            if (result.error) toast(t('controls.saveFailed', 'Salvataggio fallito: {{err}}', { err: result.error }), 'error');
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
            setCurrentFilePath(result.filePath); // v1.15.22, vedi handleSaveProject
        }
    };

    const handleLoadProject = async () => {
        if (isDirty && !await confirm(t('confirm.loadProject', 'Hai modifiche non salvate. Caricare un nuovo progetto le sovrascriverà. Continuare?'), t('confirm.loadProjectOk', 'Carica comunque'), t('modal.dialog.cancel', 'Annulla'))) return;

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
                    // v1.11.2: .lmp senza clip FX → pad popolato coi default
                    void populateDefaultFxIfPadEmpty();
                    // Integrity check (v0.14.2)
                    runIntegrityCheck().then(missing => {
                        if (missing > 0) console.warn(`[Integrity] ${missing} file mancante/i nel progetto caricato.`);
                    });
                    // v2026-07-01: il rilevamento silenzio PRE-SHOW è ora AUTOMATICO
                    // (batch in MainGrid, parte al cambio di currentFilePath) → niente più
                    // prompt qui. Vale per ogni via di caricamento, incluse le clip già caricate.
                }

            } catch (e) {
                toast(t('app.invalidLmp', 'File LMP non valido: {{err}}', { err: e instanceof Error ? e.message : t('app.unknownStructure', 'struttura non riconosciuta') }), 'error');
            }
        }
    };

    const handleImportM3u = async () => {
        if (!window.electron?.importM3u) return;
        const result = await window.electron.importM3u();
        if (!result.success || !result.paths || result.paths.length === 0) {
            if (result.success) toast(t('controls.m3uEmpty', 'Nessun file audio trovato nella playlist.'), 'warning');
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
                    updateClip(preshowColId, newClip.id, { isAnalyzing: true }, { runtime: true });
                    window.electron.detectSilence(filePath).then(r => {
                        const c = classifySilenceResult(r);
                        if (c.checked) {
                            updateClip(preshowColId, newClip.id, {
                                ...(c.trimStart !== undefined ? { trimStart: c.trimStart, trimEnd: c.trimEnd } : {}),
                                isAnalyzing: false,
                                silenceCheckedV2: true
                            }, { runtime: true });
                        } else {
                            updateClip(preshowColId, newClip.id, { isAnalyzing: false }, { runtime: true });
                        }
                    }).catch(() => updateClip(preshowColId, newClip.id, { isAnalyzing: false }, { runtime: true }));
                }
            }
        }
        toast(t('controls.m3uImported', 'M3U importata — {{count}} tracce aggiunte a PRE-SHOW', { count: added }), 'success');
    };

    const handleExportProject = async () => {
        // v1.4.14 (#4a): l'export è legato al file di salvataggio aperto.
        // Senza progetto salvato non c'è una cartella di riferimento → si
        // chiede prima di salvare (l'archivio audio/ vive accanto al .lmp).
        if (!currentFilePath) {
            toast(t('controls.exportNeedsSave', 'Salva prima il progetto: l’archivio audio viene creato accanto al file di salvataggio.'), 'error', 6000);
            return;
        }
        if (isDirty && !await confirm(t('confirm.exportUnsaved', 'Ci sono modifiche non salvate. Si consiglia di salvare prima di esportare. Continuare comunque?'), t('confirm.exportUnsavedOk', 'Esporta comunque'), t('modal.dialog.cancel', 'Annulla'))) return;

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
            setExportProgress({ isOpen: true, current: 0, total: 0, filename: t('controls.exportStarting', 'Avvio...') });

            const result = await window.electron.exportProject(json, currentFilePath);

            // Close Modal
            setExportProgress(prev => ({ ...prev, isOpen: false }));

            if (result.success) {
                // v1.15.9: l'archivio DIVENTA il riferimento. Ripuntiamo le clip alle
                // copie in audio/ (path assoluto) e ri-salviamo il .lmp, così cancellare
                // i file originali è sicuro (la sessione e il salvataggio usano la copia).
                if (currentFilePath && result.remap && result.remap.length > 0) {
                    const projectDir = currentFilePath.replace(/[\\/][^\\/]*$/, '');
                    applyArchivedPaths(projectDir, result.remap);
                    const fresh = useProjectStore.getState().columns;
                    const persistJson = JSON.stringify({
                        version: __APP_VERSION__,
                        timestamp: Date.now(),
                        project: { columns: fresh }
                    }, null, 2);
                    const saveRes = await window.electron.saveProjectDirect(persistJson, currentFilePath);
                    if (saveRes.success) setDirty(false);
                    else toast(t('controls.exportRepointSaveFailed', 'Archivio creato, ma il salvataggio dei nuovi riferimenti è fallito: {{err}}', { err: saveRes.error || '' }), 'error', 7000);
                }
                // v1.4.14 (#4): archivio sincronizzato col banco regia
                // (copiati i nuovi/cambiati, rimossi gli orfani).
                const s = result.stats;
                const parts = [t('controls.exportCopied', '{{count}} copiati', { count: s?.copied || 0 })];
                if (s?.pruned) parts.push(t('controls.exportPruned', '{{count}} rimossi', { count: s.pruned }));
                toast(t('controls.exportSynced', 'Archivio audio sincronizzato — {{parts}} in:\n{{path}}\\audio', { parts: parts.join(', '), path: result.path }), 'success', 7000);
                // v1.15.17 (G2): la cartella audio/ esisteva già e non era un archivio
                // dell'app — i file estranei sono stati lasciati intatti. Va detto:
                // dal prossimo export quella cartella sarà considerata nostra e
                // ripulita, quindi l'operatore deve sapere che cosa c'è dentro.
                if (s?.kept) {
                    toast(t('controls.exportKept',
                        '{{count}} file già presenti in audio/ non fanno parte del progetto e sono stati lasciati intatti. Dalla prossima esportazione questa cartella sarà gestita da RRLMP: sposta altrove ciò che vuoi conservare.',
                        { count: s.kept }), 'error', 12000);
                }
            } else {
                if (result.error) toast(t('controls.exportError', 'Errore esportazione: {{err}}', { err: result.error }), 'error');
            }
        } catch (e) {
            setExportProgress(prev => ({ ...prev, isOpen: false }));
            toast(t('controls.exportIpcError', 'Errore chiamando Export IPC'), 'error');
        }
    };

    // v1.15.36 (tema Pad luminosi): mini VU del microfono, 8 LED (soglie invariate:
    // −60 dBFS + 6,25 dB per LED, giallo il sesto, rossi gli ultimi due).
    const micLeds = Array.from({ length: 8 }).map((_, i) => {
        const isLit = micLevel >= -60 + i * 6.25;
        const tone = i >= 6 ? 'o' : i === 5 ? 'y' : 'g';
        return <i key={i} className={isLit ? tone : ''} style={{ height: `${40 + i * 7}%` }} />;
    });

    // v1.15.36: GlobalControls restituisce i figli direttamente nella topbar (App.tsx).
    // A sinistra i due menu (FILE, Strumenti): comandi che non servono in onda.
    // Dopo lo spaziatore, i controlli da diretta: microfono, VU, master, FX, MIX, STOP ALL.
    return (
        <>
            {/* FILE MENU (v1.10.19; v1.10.27 subito dopo titolo+versione). Il pallino
                ambra segnala le modifiche non salvate. */}
            <div className="relative" ref={fileMenuRef}>
                <button
                    className={`kbtn ${showFileMenu ? 'open' : ''}`}
                    title={t('controls.fileMenuTip', 'Menu file — nuovo/salva/carica/M3U/esporta')}
                    aria-haspopup="menu"
                    aria-expanded={showFileMenu}
                    onClick={(e) => {
                        // v1.10.3: blur anti-retrigger (Space/Enter non deve riaprire il menu)
                        e.currentTarget.blur();
                        setShowFileMenu(v => !v);
                    }}
                >
                    <Files size={16} />
                    <span>{t('controls.fileMenu', 'FILE')}</span>
                    <ChevronDown className="chev" />
                    {isDirty && <span className="kdot pulse" />}
                </button>
                {showFileMenu && (
                    <div className="menu" style={{ left: 0 }} role="menu">
                        <button className="menu-item" onClick={() => { setShowFileMenu(false); void handleNewProject(); }}>
                            <FilePlus2 size={16} /> {t('welcome.newProject')}
                        </button>
                        <button className={`menu-item ${isDirty ? 'warn' : ''}`} onClick={() => { setShowFileMenu(false); void handleSaveProject(); }}>
                            <FileCheck2 size={16} className={isDirty ? 'pulse' : ''} /> {t('controls.save')}
                        </button>
                        <button className="menu-item" onClick={() => { setShowFileMenu(false); void handleSaveAs(); }}>
                            <FileOutput size={16} /> {t('controls.saveAs')}
                        </button>
                        {/* v1.15.9: Export subito sotto Salva/Salva come (è un salvataggio
                            con audio incluso, richiesta utente). */}
                        <button className="menu-item" onClick={() => { setShowFileMenu(false); void handleExportProject(); }}>
                            <HardDriveDownload size={16} /> {t('controls.export')}
                        </button>
                        <button className="menu-item" onClick={() => { setShowFileMenu(false); void handleLoadProject(); }}>
                            <FolderInput size={16} /> {t('welcome.loadProject')}
                        </button>
                        <div className="menu-sep" />
                        <button className="menu-item" onClick={() => { setShowFileMenu(false); void handleImportM3u(); }}>
                            <ListMusic size={16} /> {t('controls.importM3u')}
                        </button>
                    </div>
                )}
                {/* AUTO-SAVED BADGE (v0.16.0) — appare 3s dopo ogni auto-backup riuscito.
                    Flottante sotto il menu FILE: zero larghezza occupata in topbar. */}
                <span className={`autosaved ${showAutoSaved ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ left: 0, right: 'auto' }}>
                    <Check size={12} strokeWidth={2.5} />
                    {t('controls.autoSaved', 'Salvataggio automatico')}
                </span>
            </div>

            {/* STRUMENTI (v1.10.27) — annulla/ripeti, MIDI Learn, tastiera, impostazioni,
                info: stessa logica del menu FILE. */}
            <div className="relative" ref={toolsMenuRef}>
                <button
                    className={`kbtn icon ${showToolsMenu ? 'open' : ''}`}
                    title={t('controls.toolsTip', 'Strumenti — annulla/ripeti, MIDI, tastiera, impostazioni, info')}
                    aria-label={t('controls.toolsTip', 'Strumenti — annulla/ripeti, MIDI, tastiera, impostazioni, info')}
                    aria-haspopup="menu"
                    aria-expanded={showToolsMenu}
                    onClick={(e) => {
                        e.currentTarget.blur();
                        setShowToolsMenu(v => !v);
                    }}
                >
                    <Wrench size={16} />
                    <ChevronDown className="chev" />
                    {/* Stato MIDI visibile anche a menu chiuso: countdown learn */}
                    {isMidiLearnMode && (
                        <span className="kmark pulse">
                            {midiLearnCountdown !== null ? `${midiLearnCountdown}s` : 'MIDI'}
                        </span>
                    )}
                    {/* v1.15.9: niente pallino "MIDI non disponibile" (era statico e
                        fuorviante). Lo stato MIDI resta DENTRO il menu, accanto a "MIDI Learn". */}
                </button>
                {showToolsMenu && (
                    <div className="menu" style={{ left: 0 }} role="menu">
                        <button className="menu-item" disabled={!canUndo} onClick={() => { setShowToolsMenu(false); undo(); }}>
                            <Undo2 size={16} /> {t('controls.undo', 'Annulla')}
                            <span className="mk">Ctrl+Z</span>
                        </button>
                        <button className="menu-item" disabled={!canRedo} onClick={() => { setShowToolsMenu(false); redo(); }}>
                            <Redo2 size={16} /> {t('controls.redo', 'Ripeti')}
                            <span className="mk">Ctrl+Y</span>
                        </button>
                        <div className="menu-sep" />
                        <button
                            className={`menu-item ${isMidiLearnMode ? 'active' : ''}`}
                            disabled={!midiSupported}
                            onClick={() => { setShowToolsMenu(false); setIsMidiLearnMode(!isMidiLearnMode); }}
                        >
                            <Cable size={16} />
                            {isMidiLearnMode ? t('controls.midiLearnActive', 'MIDI Learn — attivo (esci)') : t('controls.midiLearn')}
                            {!midiSupported
                                ? <span className="mk no">✕ n/d</span>
                                : <span className={`mk ${midiInputCount > 0 ? 'ok' : ''}`}>{midiInputCount} ctrl</span>}
                        </button>
                        <button className="menu-item" onClick={() => { setShowToolsMenu(false); setShowKeymapping(true); }}>
                            <Command size={16} /> {t('controls.keybinds')}
                        </button>
                        <div className="menu-sep" />
                        <button className="menu-item" onClick={() => { setShowToolsMenu(false); setShowSettings(true); }}>
                            <SlidersHorizontal size={16} /> {t('controls.settings')}
                        </button>
                        <button className="menu-item" onClick={() => { setShowToolsMenu(false); setShowAbout(true); }}>
                            <BookOpen size={16} /> {t('controls.info')}
                        </button>
                    </div>
                )}
            </div>

            <span className="tb-spacer" />

            {/* POZZETTO AUDIO: SMART MIC (ARM + VU mic + Mic Vol) · VU master · MASTER */}
            <div className="audio-well">
                {/* v1.11.1: dietro MIC_ARM_ENABLED (vedi utils/featureFlags.ts). */}
                {MIC_ARM_ENABLED && (
                    <>
                        <button
                            onClick={handleArmToggle}
                            title={isArmed ? t('controls.micDisarm', 'Disarma microfono') : t('controls.micArm', 'Arma microfono (Smart Ducking + Mix Input)')}
                            className={`kbtn ${isArmed ? (isMicActive ? 'arm-hot pulse' : 'arm-on on') : ''}`}
                        >
                            {isArmed
                                ? <span className="mic-ladder" title={`${micLevel.toFixed(1)} dBFS`}>{micLeds}</span>
                                : <MicOff size={15} />}
                            <span>ARM</span>
                            {/* Badge indicatore Mix attivo */}
                            {isArmed && micMixEnabled && (
                                <span className="arm-badge">{t('controls.onMixBadge', 'On Mix')}</span>
                            )}
                        </button>
                        {/* Mic Volume (visibile solo se armato) */}
                        {isArmed && (
                            <div className="fader sm">
                                <div className="fader-lbl">
                                    <span>{t('controls.micVolBadge', 'Mic Vol')}</span>
                                    <span className="num">{Math.round(micVolume * 100)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={micVolume}
                                    onChange={handleMicVolumeChange}
                                    className="fader-rng red"
                                    aria-label={t('controls.micVolBadge', 'Mic Vol')}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* VU METER master */}
                <VUMeter />

                {/* MASTER VOLUME — in MIDI Learn un clic lo prepara all'assegnazione */}
                <div
                    className={`fader ${isMidiLearnMode ? 'learn' : ''}`}
                    onClick={() => {
                        if (isMidiLearnMode) setPendingBind('masterVolume');
                    }}
                >
                    <div className="fader-lbl">
                        <span>{t('controls.masterVol')}</span>
                        {globalMidiBinds['masterVolume']
                            ? <span className="bind num">{globalMidiBinds['masterVolume'].replace('CC:', 'C')}</span>
                            : <span className="num">{Math.round(masterVolume * 100)}</span>}
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={masterVolume}
                        onChange={handleVolumeChange}
                        disabled={isMidiLearnMode}
                        className={`fader-rng ${isMidiLearnMode ? 'pointer-events-none' : ''}`}
                        aria-label={t('controls.masterVol')}
                    />
                    {isMidiLearnMode && pendingBind === 'masterVolume' && (
                        <div className="fader-learn pulse">MOVE FADER...</div>
                    )}
                </div>
            </div>

            {/* FX PAD (Step 3 UI regia) — toggle del minipad FX 5×5. Il LED acceso dice
                che il pad è aperto; il numero verde quanti effetti sono in onda (v1.10.5). */}
            {onToggleFxPad && (
                <button
                    onClick={(e) => {
                        // v1.10.3: blur — un toggle focused verrebbe ri-attivato da
                        // Space/Enter, aprendo/chiudendo il pad a sorpresa in diretta.
                        e.currentTarget.blur();
                        onToggleFxPad();
                    }}
                    className={`kbtn ${fxPadOpen ? 'on' : ''}`}
                    title={t('controls.fxTip', 'Pad FX (5×5) — mostra/nascondi')}
                    aria-pressed={!!fxPadOpen}
                >
                    <span className={`led ${fxPadOpen ? 'g' : ''}`} />
                    <span>FX</span>
                    {sfxActiveCount > 0 && <span className="kcount pulse">{sfxActiveCount}</span>}
                </button>
            )}

            {/* AUTOMIX (Fase C1, v1.10.22) — toggle della vista full-screen, accanto a FX */}
            {onToggleAutomix && (
                <button
                    onClick={(e) => {
                        // v1.10.3: blur anti-retrigger (come FX)
                        e.currentTarget.blur();
                        onToggleAutomix();
                    }}
                    className={`kbtn ${automixOpen ? 'on' : ''}`}
                    title={t('controls.automixTip', 'Automix — mix automatico sui BPM (colonna Music)')}
                    aria-pressed={!!automixOpen}
                >
                    <span className={`led ${automixOpen ? 'g' : ''}`} />
                    <span>MIX</span>
                </button>
            )}

            {/* GLOBAL STOP — v1.10.27: etichetta compatta "ALL" (richiesta utente). In
                MIDI Learn diventa il bersaglio dell'assegnazione (contorno ciano). */}
            <button
                onClick={() => {
                    if (isMidiLearnMode) {
                        setPendingBind('stopAll');
                    } else {
                        handleStopAll();
                    }
                }}
                title={`${t('controls.stopAll')} — ${t('controls.stopAllTipSuffix', 'ferma tutto (Emergency Stop)')}`}
                className={isMidiLearnMode ? `kbtn ${pendingBind === 'stopAll' ? 'learn-on pulse' : 'learn'}` : 'stop'}
            >
                <Square fill="currentColor" size={13} />
                <span>ALL</span>
                {globalMidiBinds['stopAll'] && (
                    <span className="kmark">
                        {globalMidiBinds['stopAll'].replace('NOTE:', 'N').replace('CC:', 'C')}
                    </span>
                )}
            </button>

            <GeneralSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
            <AboutModal
                isOpen={showAbout}
                onClose={() => setShowAbout(false)}
                updaterStatus={updaterStatus}
                onOpenUpdateModal={onOpenUpdateModal}
                onCheckUpdatesNow={onCheckUpdatesNow}
            />
            <KeymappingModal isOpen={showKeymapping} onClose={() => setShowKeymapping(false)} />
            <ExportProgressModal
                isOpen={exportProgress.isOpen}
                current={exportProgress.current}
                total={exportProgress.total}
                filename={exportProgress.filename}
            />
        </>
    );
};
