import { useState, useEffect } from 'react';
import { MainGrid } from './components/layout/MainGrid';
import DebugOverlay from './components/debug/DebugOverlay';
import { useDebugStore } from './store/useDebugStore';
import { useProjectStore } from './store/useProjectStore';
import { GlobalControls } from './components/ui/GlobalControls';
import { DigitalClock } from './components/ui/DigitalClock';
import MidiManager from './engine/MidiManager';
import { useAudioStore } from './store/useAudioStore';
import { useSettingsStore } from './store/useSettingsStore';
import AudioContextManager from './engine/AudioContextManager';
import { WelcomeScreen } from './components/modals/WelcomeScreen';
import { OnAirTimer } from './components/ui/OnAirTimer';
import { NoteBoard } from './components/ui/NoteBoard';
import { ToastContainer } from './components/ui/ToastContainer';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { toast } from './store/useToastStore';
import { confirm, confirmThree } from './store/useConfirmStore';


import appLogo from './assets/logo.png';

function App() {
    const [showWelcome, setShowWelcome] = useState(true);
    const masterChain = useSettingsStore((s) => s.masterChain);

    // v0.16.2 — Sincronizzazione Master Chain con AudioContextManager
    useEffect(() => {
        AudioContextManager.getInstance().applyMasterChainSettings(masterChain);
    }, [masterChain]);

    // GR5 Fix: Ripristino dispositivo audio all'avvio.
    // useSettingsStore persiste outputDeviceId in localStorage tramite Zustand persist.
    // Senza questo useEffect, il dispositivo salvato viene ignorato al riavvio:
    // i player vengono creati con il device di sistema anche se l'utente aveva scelto
    // un'uscita diversa (es. Rødecaster Pro).
    // GR3 Fix: listener ondevicechange per rilevare disconnessione USB del device audio.
    // Se il device corrente non è più disponibile, fa fallback automatico a 'default'
    // e aggiorna lo store per consistenza.
    useEffect(() => {
        const { outputDeviceId, setOutputDeviceId } = useSettingsStore.getState();
        // Applica il device salvato (attiverà setSinkId sui nuovi player al momento del play)
        if (outputDeviceId && outputDeviceId !== 'default') {
            useAudioStore.getState().updateOutputDevice(outputDeviceId);
        }

        // GR3: listener disconnessione dispositivo
        const handleDeviceChange = async () => {
            const currentId = useSettingsStore.getState().outputDeviceId;
            if (!currentId || currentId === 'default') return;
            // Verifica se il device corrente è ancora disponibile
            const devices = await navigator.mediaDevices.enumerateDevices();
            const stillAvailable = devices.some(
                d => d.kind === 'audiooutput' && d.deviceId === currentId
            );
            if (!stillAvailable) {
                console.warn(`GR3: Device ${currentId} disconnesso. Fallback a 'default'.`);
                setOutputDeviceId('default');
                useAudioStore.getState().updateOutputDevice('default');
                useDebugStore.getState().log(`⚠️ Device audio disconnesso — fallback a sistema`, 'error');
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
                            audioStore.playClip(foundClip);
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
                                if (parsed.project && parsed.project.columns) {
                                    store.loadProject(parsed.project, result.filePath);
                                    useAudioStore.getState().stopAll();
                                    store.setDirty(false);
                                    setShowWelcome(false);
                                } else {
                                    toast('File LMP non valido o corrotto.', 'error');
                                }
                            } catch (e) {
                                toast('Errore lettura file.', 'error');
                            }
                        }
                    }}
                />
            )}

            {/* GLOBAL HEADER (Top Bar) */}
            <header className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <img src={appLogo} alt="Logo" className="h-8 w-auto mr-2" />
                    <h1 className="font-bold text-lg tracking-tight">Runtime <span className="text-zinc-500 font-normal">Live Machine</span></h1>

                    {/* GLOBAL CONTROLS */}

                    <GlobalControls />
                </div>

                <div className="flex items-center gap-4">
                    <OnAirTimer />
                    <DigitalClock />
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-hidden">
                    <MainGrid />
                </div>
                <NoteBoard />
            </div>
        </div>
    );
}

export default App;
