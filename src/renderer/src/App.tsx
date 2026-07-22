import { useState, useEffect, useRef } from 'react';
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
import { NowPlayingHero } from './components/ui/NowPlayingHero';
import { RecordingButton } from './components/ui/RecordingButton';
import { PlayoutLogModal } from './components/modals/PlayoutLogModal';
import { MidiSimulatorModal } from './components/modals/MidiSimulatorModal';
import { NoteBoard } from './components/ui/NoteBoard';
import { ToastContainer } from './components/ui/ToastContainer';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { toast } from './store/useToastStore';
import { confirm, confirmThree } from './store/useConfirmStore';
import { ListChecks } from 'lucide-react';
import { FxPadOverlay } from './components/ui/FxPadOverlay';
import { AutomixView } from './components/automix/AutomixView';
import { populateDefaultFxIfPadEmpty } from './utils/defaultSfx';
import { UpdateModal } from './components/modals/UpdateModal';
import { UpdaterStatusPayload } from './types';
// i18n: qui si usa i18n.t diretto (non l'hook) — i gestori vivono in closure di
// useEffect con deps vuote e l'istanza i18n risolve sempre la lingua corrente.
import i18n from './i18n';


import appLogo from './assets/logo.png';

function App() {
    const [showWelcome, setShowWelcome] = useState(true);
    const [showPlayoutLog, setShowPlayoutLog] = useState(false);
    const [showMidiSim, setShowMidiSim] = useState(false);
    const [showFxPad, setShowFxPad] = useState(false);
    // Automix Section (Fase C1, v1.10.22) — vista full-screen alternativa alla
    // board, stesso pattern del pad FX (nessun routing nell'app).
    const [showAutomix, setShowAutomix] = useState(false);
    const masterChain = useSettingsStore((s) => s.masterChain);

    // Auto-Updater (2026-07-02) — stato centralizzato qui: un solo listener sul
    // canale IPC 'updater:status', un solo UpdateModal renderizzato in tutta
    // l'app. WelcomeScreen/AboutModal ricevono solo lo stato in lettura + un
    // trigger per aprire il popup manualmente.
    const [updaterStatus, setUpdaterStatus] = useState<UpdaterStatusPayload>({ type: 'not-available' });
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    // true quando l'aggiornamento in arrivo è stato richiesto a mano (pulsante
    // "Controlla aggiornamenti ora") — in quel caso il popup va mostrato SUBITO,
    // ignorando il gating on-air (richiesta esplicita dell'utente).
    const manualUpdateCheckRef = useRef(false);
    // true quando un aggiornamento è disponibile ma la diretta è in corso —
    // il popup resta in coda finché onAirStartTime non torna a null.
    const pendingUpdateNoticeRef = useRef(false);
    const onAirStartTime = useAudioStore((s) => s.onAirStartTime);

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

    // v1.10.8/v1.10.9/v1.11.2: FX di default a pad vuoto — logica in
    // utils/defaultSfx.ts (populateDefaultFxIfPadEmpty), chiamata anche dopo
    // "Nuovo Progetto" (qui sotto e in GlobalControls) e dopo ogni load .lmp.
    // Il ritardo all'avvio lascia passare un eventuale open-file da doppio click.
    useEffect(() => {
        const t = setTimeout(() => { void populateDefaultFxIfPadEmpty(); }, 800);
        return () => clearTimeout(t);
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
                        i18n.t('app.unsavedBeforeOpen', 'Ci sono modifiche non salvate. Cosa vuoi fare prima di aprire il nuovo progetto?'),
                        i18n.t('modal.dialog.save', 'Salva'),
                        i18n.t('modal.dialog.discard', 'Non Salvare'),
                        i18n.t('modal.dialog.cancel', 'Annulla')
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
                            toast(i18n.t('app.saveFailed', 'Salvataggio non riuscito: {{err}}', { err: saveRes.error ?? i18n.t('app.canceled', 'annullato') }), 'error');
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
                        // v1.11.2: .lmp senza clip FX → pad popolato coi default
                        void populateDefaultFxIfPadEmpty();
                        // v1.15.14: check integrità + riparazione path (archivio spostato/
                        // altra macchina) — prima girava solo dal pulsante Carica.
                        void useProjectStore.getState().runIntegrityCheck();
                    } catch (e) {
                        toast(i18n.t('app.invalidLmp', 'File LMP non valido: {{err}}', { err: e instanceof Error ? e.message : i18n.t('app.unknownStructure', 'struttura non riconosciuta') }), 'error');
                    }
                } else {
                    toast(i18n.t('app.cannotOpenFile', 'Impossibile aprire il file: {{err}}', { err: result.error ?? i18n.t('app.unknownError', 'errore sconosciuto') }), 'error');
                }
            } catch (e) {
                toast(i18n.t('app.lmpReadError', 'Errore lettura file LMP.'), 'error');
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

    // Auto-Updater — sottoscrizione unica allo stato pubblicato dal main
    // process (src/main/updateManager.ts). Il popup si apre subito se la
    // regia non è live (onAirStartTime null) o se il check era manuale;
    // altrimenti resta accodato — vedi l'effetto successivo.
    useEffect(() => {
        const unsub = window.electron.onUpdaterStatus((status) => {
            setUpdaterStatus(status);
            if (status.type === 'available' || status.type === 'ready') {
                const isLive = useAudioStore.getState().onAirStartTime !== null;
                if (manualUpdateCheckRef.current || !isLive) {
                    manualUpdateCheckRef.current = false;
                    setShowUpdateModal(true);
                } else {
                    pendingUpdateNoticeRef.current = true;
                }
            }
        });
        return unsub;
    }, []);

    // Apre il popup accodato non appena la diretta finisce (stopAll → onAirStartTime null).
    useEffect(() => {
        if (onAirStartTime === null && pendingUpdateNoticeRef.current) {
            pendingUpdateNoticeRef.current = false;
            setShowUpdateModal(true);
        }
    }, [onAirStartTime]);

    const handleCheckUpdatesNow = () => {
        manualUpdateCheckRef.current = true;
        void window.electron.checkForUpdates();
    };

    useEffect(() => {
        const handleDrag = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleKeyDown = async (e: KeyboardEvent) => {
            // v1.4.13 (ESC-01): Emergency Stop spostato QUI dal globalShortcut del main.
            // Il globalShortcut intercettava ESC a livello OS prima del DOM: i modali
            // non potevano consumarlo → STOP ALL anche con una modale aperta. Questo
            // listener è in fase BUBBLE: i modali (hook useEscapeToClose / MODAL-02,
            // capture + stopPropagation) lo neutralizzano e si chiudono. Scatta solo
            // ad app in primo piano, come il guard isFocused del v1.2.12.
            // PRIMA dell'Input Guard: l'Emergency Stop deve funzionare anche con il
            // focus in un campo di testo (parità col comportamento precedente).
            if (e.key === 'Escape') {
                if (e.repeat || e.defaultPrevented) return;
                useAudioStore.getState().stopAll();
                return;
            }

            // Complex Toggle: Ctrl + Shift + D
            if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
                useDebugStore.getState().toggle();
            }

            // Simulatore MIDI (strumento di test, no hardware): Ctrl + Shift + M
            if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
                setShowMidiSim(prev => !prev);
            }

            // Input Guard
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            // v1.5.0: Undo / Redo playlist. Dopo l'Input Guard, così l'undo nativo
            // dei campi di testo non viene intercettato. Ctrl/Cmd+Z = undo;
            // Ctrl/Cmd+Y oppure Ctrl/Cmd+Shift+Z = redo.
            if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                if (e.shiftKey) useProjectStore.getState().redo();
                else useProjectStore.getState().undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                useProjectStore.getState().redo();
                return;
            }

            // Global Delete (Multi-Select)
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const { selectedClipIds, removeSelectedClips } = useProjectStore.getState();
                if (selectedClipIds.length > 0) {
                    e.preventDefault();
                    if (await confirm(i18n.t('app.deleteSelectedConfirm', 'Eliminare {{count}} clip selezionate?', { count: selectedClipIds.length }), i18n.t('app.deleteLabel', 'Elimina'), i18n.t('modal.dialog.cancel', 'Annulla'))) {
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
                i18n.t('modal.dialog.unsaved', 'Ci sono modifiche non salvate. Cosa vuoi fare?'),
                i18n.t('modal.dialog.save', 'Salva'),
                i18n.t('modal.dialog.discard', 'Non Salvare'),
                i18n.t('modal.dialog.cancel', 'Annulla')
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
                    else toast(i18n.t('app.saveError', 'Errore salvataggio: {{err}}', { err: result.error }), 'error');
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


        const handleMidiMessage = (rawNote: number, rawVelocity: number, command: number) => {
            // MIDI-02 (v1.3.2): guard sui valori MIDI grezzi prima di qualsiasi calcolo
            // (velocity/127 per masterVolume, velocityGain per playClip). Un device fuori
            // spec o un pacchetto corrotto potrebbe inviare valori > 127 o negativi: senza
            // clamp a monte, `velocityGain` salterebbe il check di Math.min(1.5, ...) a valle
            // (perché il clamp è solo sul prodotto finale, non sul moltiplicatore in ingresso).
            const note = Math.max(0, Math.min(127, Math.floor(rawNote))) | 0;
            const velocity = Math.max(0, Math.min(127, Math.floor(rawVelocity))) | 0;

            const state = useProjectStore.getState();
            const { isMidiLearnMode, selectedClipIds, assignMidiToClip, columns } = state;
            const { globalMidiBinds } = useSettingsStore.getState();

            // GLOBAL CHECK
            // AUDIT-ME (2026-05-29): maschera il nibble alto per riconoscere Note On (0x9n)
            // e CC (0xBn) su tutti i 16 canali, non solo il canale 1 (144/176). Il bind
            // resta channel-agnostic (`NOTE:<note>` / `CC:<note>`).
            const status = command & 0xf0;
            const type = status === 0x90 ? 'NOTE' : (status === 0xb0 ? 'CC' : null);
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
                // Ignore CC for Clip Assignment (Only Note On, qualsiasi canale)
                if (status !== 0x90) return;

                if (selectedClipIds.length === 1) {
                    assignMidiToClip(selectedClipIds[0], note);
                } else {
                    // MIDI-03 (v1.3.2): debugLog strutturato invece di console.warn (pattern LI-03).
                    useDebugStore.getState().log('MIDI Learn: seleziona una sola clip per assegnare il MIDI', 'event');
                }
            } else {
                // Trigger (Only Note On, qualsiasi canale)
                if (status !== 0x90) return;

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

        // v1.4.13 (ESC-01): il canale IPC 'emergency-stop' non viene più emesso dal
        // main (globalShortcut rimosso) — ESC è gestito in handleKeyDown qui sopra.
        // L'API preload onEmergencyStop resta esposta ma inutilizzata.

        // Controllo Remoto (2026-07-01, Step 3-4/N) — comandi dal tablet/PC secondario
        // inoltrati dal main via IPC. Whitelist lato server (RemoteControlServer.ts,
        // ALLOWED_COMMANDS): qui gestiamo solo i comandi abilitati per ora, limitati
        // alla colonna Music (playClip/stopClip) + STOP ALL globale.
        const unsubscribeRemoteCommand = window.electron.onRemoteCommand?.((data) => {
            if (data.name === 'stopAll') {
                useAudioStore.getState().stopAll();
            } else if (data.name === 'stopClip' && data.clipId) {
                useAudioStore.getState().stopClip(data.clipId);
            } else if (data.name === 'playClip' && data.clipId) {
                const musicCol = useProjectStore.getState().columns.find(c => c.type === 'music');
                const clip = musicCol?.clips.find(c => c.id === data.clipId);
                if (clip) useAudioStore.getState().playClip(clip);
            }
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
            if (unsubscribeRemoteCommand) unsubscribeRemoteCommand();
        };
    }, []);



    return (
        <div className="h-screen w-screen flex flex-col select-none theme-spectrum">
            {/* DEBUG OVERLAY */}
            <DebugOverlay />
            <ToastContainer />
            <ConfirmDialog />
            {showPlayoutLog && <PlayoutLogModal onClose={() => setShowPlayoutLog(false)} />}
            <MidiSimulatorModal isOpen={showMidiSim} onClose={() => setShowMidiSim(false)} />
            <FxPadOverlay isOpen={showFxPad} onClose={() => setShowFxPad(false)} />
            <AutomixView isOpen={showAutomix} onClose={() => setShowAutomix(false)} />
            <UpdateModal
                isOpen={showUpdateModal}
                status={updaterStatus}
                currentVersion={__APP_VERSION__}
                onClose={() => setShowUpdateModal(false)}
                onDownload={() => void window.electron.downloadUpdate()}
                onInstall={() => void window.electron.quitAndInstall()}
            />

            {showWelcome && (
                <WelcomeScreen
                    updaterStatus={updaterStatus}
                    onOpenUpdateModal={() => setShowUpdateModal(true)}
                    onNewProject={() => {
                        useProjectStore.getState().resetProject();
                        useAudioStore.getState().stopAll();
                        setShowWelcome(false);
                        // v1.10.9: reset → colonna FX vuota → ripopola i default
                        void populateDefaultFxIfPadEmpty();
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
                                // v1.11.2: .lmp senza clip FX → pad popolato coi default
                                void populateDefaultFxIfPadEmpty();
                                // v1.15.14: check integrità + riparazione path (archivio
                                // spostato/altra macchina) anche da questa via di carico.
                                void store.runIntegrityCheck();
                            } catch (e) {
                                toast(i18n.t('app.invalidLmp', 'File LMP non valido: {{err}}', { err: e instanceof Error ? e.message : i18n.t('app.unknownStructure', 'struttura non riconosciuta') }), 'error');
                            }
                        }
                    }}
                />
            )}

            {/* GLOBAL HEADER (Top Bar) */}
            <header className="tb flex items-center justify-between shrink-0 relative z-10">
                <div className="flex items-center gap-2 min-w-0">
                    {/* BRAND (Spectrum) */}
                    <div className="brand mr-2">
                        <img src={appLogo} alt="Logo" className="brand-logo" title={`Runtime Live Machine PRO · v${__APP_VERSION__}`} />
                        {/* v1.10.27 (rifiniture utente): versione allineata alla BASELINE del
                            nome (prima self-end approssimativo) e "PRO" iridescente con la
                            classe .pro del tema (prima verde fisso hardcoded). */}
                        <div className="flex items-baseline gap-1.5">
                            <span className="brand-name">RLM <span className="pro">PRO</span></span>
                            {/* v1.10.7: versione leggibile a colpo d'occhio (triage regia) */}
                            <span className="text-[9px] font-mono text-zinc-600">v{__APP_VERSION__}</span>
                        </div>
                    </div>

                    {/* GLOBAL CONTROLS */}

                    <GlobalControls
                        fxPadOpen={showFxPad}
                        onToggleFxPad={() => setShowFxPad((v) => !v)}
                        automixOpen={showAutomix}
                        onToggleAutomix={() => setShowAutomix((v) => !v)}
                        updaterStatus={updaterStatus}
                        onOpenUpdateModal={() => setShowUpdateModal(true)}
                        onCheckUpdatesNow={handleCheckUpdatesNow}
                    />
                </div>

                {/* v1.10.27 (rifiniture): gap-4→gap-2 e Log icon-only — spazio topbar */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowPlayoutLog(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-cyan-300 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-cyan-600/50 rounded transition-all"
                        title={i18n.t('app.openPlayoutLog', 'Apri Playout Log')}
                    >
                        <ListChecks size={13} />
                    </button>
                    <RecordingButton />
                    <OnAirTimer />
                    <DigitalClock />
                </div>
            </header>

            {/* NOW PLAYING HERO (Spectrum) */}
            <ErrorBoundary zone="NowPlayingHero">
                <NowPlayingHero />
            </ErrorBoundary>

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
