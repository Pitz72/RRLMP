import { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { MainGrid } from './components/layout/MainGrid';
import DebugOverlay from './components/debug/DebugOverlay';
import { useDebugStore } from './store/useDebugStore';
import { useProjectStore, validateLmpProjectData } from './store/useProjectStore';
import { GlobalControls } from './components/ui/GlobalControls';
import { DigitalClock } from './components/ui/DigitalClock';
import MidiManager from './engine/MidiManager';
import MicManager from './engine/MicManager';
import { useAudioStore } from './store/useAudioStore';
import { useRecordingStore } from './store/useRecordingStore';
import { useSettingsStore } from './store/useSettingsStore';
import AudioContextManager from './engine/AudioContextManager';
import { WelcomeScreen } from './components/modals/WelcomeScreen';
import { OnAirTimer } from './components/ui/OnAirTimer';
import { RecordingButton } from './components/ui/RecordingButton';
import { PlayoutLogModal } from './components/modals/PlayoutLogModal';
import { NoteBoard } from './components/ui/NoteBoard';
import { ToastContainer } from './components/ui/ToastContainer';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { toast } from './store/useToastStore';
import { confirm, confirmThree } from './store/useConfirmStore';
import { ListChecks } from 'lucide-react';


import appLogo from './assets/logo.png';

function App() {
    const [showWelcome, setShowWelcome] = useState(true);
    const [showPlayoutLog, setShowPlayoutLog] = useState(false);
    const masterChain = useSettingsStore((s) => s.masterChain);

    // LI-04: cleanup singleton audio/MIDI all'unmount (hot-reload dev + ricarica pagina)
    // v1.2.27 (NEW-LI-01): chiamata esplicita a setMicActive(false) PRIMA di destroy()
    // per garantire che `_isMicActiveGlobal` in useAudioStore venga azzerato anche se
    // i listener MicManager non riescono a propagare il false in tempo.
    useEffect(() => {
        return () => {
            try { useAudioStore.getState().setMicActive(false); } catch { /* noop */ }
            // REC-06 (v1.3.1): reset esplicito del recording store — chiude timerIntervalId
            // se la finestra viene chiusa durante una registrazione attiva.
            try { useRecordingStore.getState().reset(); } catch { /* noop */ }
            MicManager.destroy();
            MidiManager.destroy();
            AudioContextManager.destroy();
        };
    }, []);

    // REC-03 (v1.3.1): se il recorder raggiunge il cap chunks, interrompi la sessione
    // in modo pulito tramite lo store (no perdita di audio: ferma + salva quanto raccolto).
    useEffect(() => {
        const onCap = () => {
            try {
                if (useRecordingStore.getState().isRecording) {
                    void useRecordingStore.getState().stopRecording();
                }
            } catch { /* noop */ }
        };
        window.addEventListener('audiorecorder:cap-reached', onCap);
        return () => window.removeEventListener('audiorecorder:cap-reached', onCap);
    }, []);

    // v0.16.2 — Sincronizzazione Master Chain con AudioContextManager
    useEffect(() => {
        AudioContextManager.getInstance().applyMasterChainSettings(masterChain);
    }, [masterChain]);

    // v1.2.3 — Apertura diretta file .lmp da doppio click / file association OS
    // v1.2.17 (NEW-GR-02): se c'è un progetto sporco, chiedi conferma PRIMA di stopAll()/load.
    // Un doppio-click accidentale durante una diretta non deve fermare l'audio in onda.
    useEffect(() => {
        const unsub = window.electron.onOpenFile(async (filePath: string) => {
            try {
                // Gate isDirty: salva / non salvare / annulla, identico a handleCloseIntent
                const state = useProjectStore.getState();
                if (state.isDirty) {
                    const response = await confirmThree(
                        'Ci sono modifiche non salvate. Cosa vuoi fare prima di aprire il nuovo progetto?',
                        'Salva',
                        'Non Salvare',
                        'Annulla'
                    );
                    if (response === 'cancel') return;
                    if (response === 'confirm') {
                        const projectData = {
                            version: __APP_VERSION__,
                            timestamp: Date.now(),
                            project: { columns: state.columns }
                        };
                        const json = JSON.stringify(projectData, null, 2);
                        const saveRes = state.currentFilePath
                            ? await window.electron.saveProjectDirect(json, state.currentFilePath)
                            : await window.electron.saveProject(json);
                        if (!saveRes.success) {
                            toast('Salvataggio non riuscito: ' + (saveRes.error ?? 'annullato'), 'error');
                            return;
                        }
                    }
                    // 'third' (Non Salvare) → prosegue senza salvare
                }

                const result = await window.electron.loadProjectFromPath(filePath);
                if (result.success && result.data) {
                    try {
                        const parsed = JSON.parse(result.data);
                        const projectData = validateLmpProjectData(parsed.project);
                        useAudioStore.getState().stopAll();
                        useProjectStore.getState().loadProject(projectData, filePath);
                        useProjectStore.getState().setDirty(false);
                        setShowWelcome(false);
                    } catch (e) {
                        toast('File LMP non valido: ' + (e instanceof Error ? e.message : 'struttura non riconosciuta'), 'error');
                    }
                } else {
                    toast('Impossibile aprire il file: ' + (result.error ?? 'errore sconosciuto'), 'error');
                }
            } catch (e) {
                toast('Errore lettura file LMP.', 'error');
            }
        });
        return unsub;
    }, []);

    // GR5 Fix: Ripristino dispositivo audio all'avvio.
    // useSettingsStore persiste outputDeviceId in localStorage tramite Zustand persist.
    // Senza questo useEffect, il dispositivo salvato viene ignorato al riavvio:
    // i player vengono creati con il device di sistema anche se l'utente aveva scelto
    // un'uscita diversa (es. Rødecaster Pro).
    // GR3 Fix: listener ondevicechange per rilevare disconnessione USB del device audio.
    // Se il device corrente non è più disponibile, fa fallback automatico a 'default'
    // e aggiorna lo store per consistenza.
    useEffect(() => {
        const { outputDeviceId } = useSettingsStore.getState();
        // Applica il device salvato (attiverà setSinkId sui nuovi player al momento del play)
        if (outputDeviceId && outputDeviceId !== 'default') {
            useAudioStore.getState().updateOutputDevice(outputDeviceId);
        }

        // GR3 + ME-04: listener devicechange per disconnect E reconnect.
        // Non sovrascriviamo outputDeviceId su disconnect — preserviamo la preferenza
        // in modo che al reconnect il device venga ripristinato automaticamente.
        const handleDeviceChange = async () => {
            const preferredId = useSettingsStore.getState().outputDeviceId;
            if (!preferredId || preferredId === 'default') return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const available = devices.some(d => d.kind === 'audiooutput' && d.deviceId === preferredId);
            if (!available) {
                console.warn(`[GR3] Device ${preferredId} disconnesso. Fallback a sistema.`);
                useAudioStore.getState().updateOutputDevice('default');
                useDebugStore.getState().log(`⚠️ Device audio disconnesso — fallback a sistema`, 'error');
            } else {
                // Device ancora disponibile o appena riconnesso — ri-applica la preferenza
                useAudioStore.getState().updateOutputDevice(preferredId);
                useDebugStore.getState().log(`Device audio ripristinato: ${preferredId}`, 'info');
            }
        };

        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
        };
    }, []);

    useEffect(() => {
        const handleDrag = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleKeyDown = async (e: KeyboardEvent) => {
            // Complex Toggle: Ctrl + Shift + D
            if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
                useDebugStore.getState().toggle();
            }

            // Input Guard
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            // Global Delete (Multi-Select)
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const { selectedClipIds, removeSelectedClips } = useProjectStore.getState();
                if (selectedClipIds.length > 0) {
                    e.preventDefault();
                    if (await confirm(`Eliminare ${selectedClipIds.length} clip selezionate?`, 'Elimina', 'Annulla')) {
                        removeSelectedClips();
                    }
                }
            }
        };

        const handleCloseIntent = async () => {
            const state = useProjectStore.getState();
            if (!state.isDirty) {
                window.electron.forceClose();
                return;
            }

            // v0.16.1: dialog completamente custom (non più nativo Windows)
            const response = await confirmThree(
                'Ci sono modifiche non salvate. Cosa vuoi fare?',
                'Salva',
                'Non Salvare',
                'Annulla'
            );

            if (response === 'confirm') { // SAVE
                // Logic mostly duplicated from controls, strictly we should reuse but imports are tricky with closure.
                // We'll reimplement cleanly.
                const projectData = {
                    version: __APP_VERSION__,
                    timestamp: Date.now(),
                    project: { columns: state.columns }
                };
                const json = JSON.stringify(projectData, null, 2);

                if (state.currentFilePath) {
                    const result = await window.electron.saveProjectDirect(json, state.currentFilePath);
                    if (result.success) window.electron.forceClose();
                    else toast('Errore salvataggio: ' + result.error, 'error');
                } else {
                    const result = await window.electron.saveProject(json);
                    if (result.success) window.electron.forceClose();
                    // If canceled, do nothing
                }
            } else if (response === 'third') { // DON'T SAVE
                window.electron.forceClose();
            }
            // 'cancel' = Annulla (non chiudere)
        };


        const handleMidiMessage = (note: number, velocity: number, command: number) => {

            const state = useProjectStore.getState();
            const { isMidiLearnMode, selectedClipIds, assignMidiToClip, columns } = state;
            const { globalMidiBinds } = useSettingsStore.getState();

            // GLOBAL CHECK
            const type = command === 144 ? 'NOTE' : (command === 176 ? 'CC' : null);
            if (!type) return;
            const bindKey = `${type}:${note}`;

            // Check if this key is bound to a global action
            const globalAction = Object.keys(globalMidiBinds).find(key => globalMidiBinds[key] === bindKey);

            if (globalAction && !isMidiLearnMode) {
                if (globalAction === 'stopAll') {
                    useAudioStore.getState().stopAll();
                    return;
                }
                if (globalAction === 'masterVolume') {
                    const vol = Math.min(1.0, velocity / 127);
                    AudioContextManager.getInstance().setMasterVolume(vol);
                    useSettingsStore.getState().setMasterVolume(vol); // v0.16.0: slider UI segue il fader MIDI
                    return;
                }
            }


            if (isMidiLearnMode) {
                // Ignore CC for Clip Assignment (Only Note On)
                if (command !== 144) return;

                if (selectedClipIds.length === 1) {
                    assignMidiToClip(selectedClipIds[0], note);
                } else {
                    console.warn("Seleziona una clip per assegnare il MIDI");
                }
            } else {
                // Trigger (Only Note On)
                if (command !== 144) return;

                const bindKeyNote = `NOTE:${note}`;

                for (const col of columns) {
                    const foundClip = col.clips.find(c => c.midiBind === bindKeyNote);
                    if (foundClip) {
                        const audioStore = useAudioStore.getState();
                        const isActive = audioStore.activeClips[foundClip.id];

                        if (isActive) {
                            audioStore.stopClip(foundClip.id);
                        } else {
                            audioStore.playClip(foundClip, velocity / 127);
                        }
                        return;
                    }
                }
            }
        };

        const unsubscribeMidi = MidiManager.getInstance().addListener(handleMidiMessage);

        const unsubscribeClose = window.electron.onCheckCloseIntent(handleCloseIntent);

        // v0.14.3 — Emergency Stop globale: Escape → stopAll
        const unsubscribeEmergencyStop = window.electron.onEmergencyStop(() => {
            useAudioStore.getState().stopAll();
        });

        window.addEventListener('dragover', handleDrag);
        window.addEventListener('drop', handleDrag);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('dragover', handleDrag);
            window.removeEventListener('drop', handleDrag);
            window.removeEventListener('keydown', handleKeyDown);
            if (unsubscribeClose) unsubscribeClose();
            if (unsubscribeMidi) unsubscribeMidi();
            if (unsubscribeEmergencyStop) unsubscribeEmergencyStop();
        };
    }, []);



    return (
        <div className="h-screen w-screen flex flex-col bg-black text-white select-none">
            {/* DEBUG OVERLAY */}
            <DebugOverlay />
            <ToastContainer />
            <ConfirmDialog />
            {showPlayoutLog && <PlayoutLogModal onClose={() => setShowPlayoutLog(false)} />}

            {showWelcome && (
                <WelcomeScreen
                    onNewProject={() => {
                        useProjectStore.getState().resetProject();
                        useAudioStore.getState().stopAll();
                        setShowWelcome(false);
                    }}
                    onLoadProject={async () => {
                        const result = await window.electron.loadProject();
                        if (result.success && result.data) {
                            const store = useProjectStore.getState();
                            try {
                                const parsed = JSON.parse(result.data);
                                const projectData = validateLmpProjectData(parsed.project);
                                store.loadProject(projectData, result.filePath);
                                useAudioStore.getState().stopAll();
                                store.setDirty(false);
                                setShowWelcome(false);
                            } catch (e) {
                                toast('File LMP non valido: ' + (e instanceof Error ? e.message : 'struttura non riconosciuta'), 'error');
                            }
                        }
                    }}
                />
            )}

            {/* GLOBAL HEADER (Top Bar) */}
            <header className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <img src={appLogo} alt="Logo" className="h-8 w-auto mr-2" />
                    <h1 className="font-bold text-lg tracking-tight">Runtime <span className="text-zinc-500 font-normal">Live Machine</span> <span className="text-cyan-500 font-bold text-sm">PRO</span></h1>

                    {/* GLOBAL CONTROLS */}

                    <GlobalControls />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowPlayoutLog(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-cyan-300 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-cyan-600/50 rounded transition-all"
                        title="Apri Playout Log"
                    >
                        <ListChecks size={13} />
                        Log
                    </button>
                    <RecordingButton />
                    <OnAirTimer />
                    <DigitalClock />
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-hidden">
                    <ErrorBoundary zone="MainGrid">
                        <MainGrid />
                    </ErrorBoundary>
                </div>
                <NoteBoard />
            </div>
        </div>
    );
}

export default App;
