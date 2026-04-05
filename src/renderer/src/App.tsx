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


import appLogo from './assets/logo.png';

function App() {
    const [showWelcome, setShowWelcome] = useState(true);

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

        const handleKeyDown = (e: KeyboardEvent) => {
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
                    if (confirm(`Eliminare ${selectedClipIds.length} clip selezionate?`)) {
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

            // M1 Fix: usa il dialog i18n con stringhe localizzate invece di hardcoded IT
            const { t } = await import('i18next');
            const response = await (window.electron.showCloseDialogI18n
                ? window.electron.showCloseDialogI18n({
                    btnSave: t('dialog.save', 'Salva'),
                    btnDiscard: t('dialog.discard', 'Non Salvare'),
                    btnCancel: t('dialog.cancel', 'Annulla'),
                    title: t('dialog.unsavedTitle', 'Modifiche non salvate'),
                    message: t('dialog.unsavedMessage', 'Ci sono modifiche non salvate. Cosa vuoi fare?'),
                })
                : window.electron.showCloseDialog()); // fallback legacy

            if (response === 0) { // SAVE
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
                    else alert('Errore salvataggio: ' + result.error);
                } else {
                    const result = await window.electron.saveProject(json);
                    if (result.success) window.electron.forceClose();
                    // If canceled, do nothing
                }
            } else if (response === 1) { // DON'T SAVE
                window.electron.forceClose();
            }
            // Response 2 = CANCEL (Do nothing)
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

        window.addEventListener('dragover', handleDrag);
        window.addEventListener('drop', handleDrag);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('dragover', handleDrag);
            window.removeEventListener('drop', handleDrag);
            window.removeEventListener('keydown', handleKeyDown);
            if (unsubscribeClose) unsubscribeClose();
            if (unsubscribeMidi) unsubscribeMidi();
        };
    }, []);



    return (
        <div className="h-screen w-screen flex flex-col bg-black text-white select-none">
            {/* DEBUG OVERLAY */}
            <DebugOverlay />

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
                                    alert('File LMP non valido o corrotto.');
                                }
                            } catch (e) {
                                alert('Errore lettura file.');
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
                    <DigitalClock />
                    <div className="text-xs text-zinc-500">
                        Audio Engine: <span className="text-green-500">READY</span>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-hidden">
                <MainGrid />
            </div>
        </div>
    );
}

export default App;
