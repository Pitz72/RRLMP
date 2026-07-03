/**
 * devMock — SOLO per screenshot/anteprima nel browser (Vite), MAI in Electron.
 * Se window.electron esiste (build Electron reale) questo file è inerte.
 * Fornisce un finto bridge IPC così il renderer si monta fuori da Electron,
 * più un dataset demo (window.__seedDemo) per popolare la griglia a scopo manuale.
 */
const w = window as unknown as Record<string, any>;

if (import.meta.env.DEV && !w.electron) {
    const noop = () => {};
    const cleanup = () => noop;

    const fakeWave = Array.from({ length: 180 }, (_, i) => {
        const env = Math.sin((i / 180) * Math.PI);
        return Math.min(1, Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)) * (0.35 + 0.65 * env) + 0.05);
    });

    w.electron = {
        getFilePath: (f: File) => (f as any).path || f.name || '',
        getAudioMetadata: async () => ({ duration: 210, title: '', artist: '', bpm: 0 }),
        measureLoudness: async () => ({ lufs: -16 }),
        getWaveformData: async () => ({ success: true, data: fakeWave }),
        detectSilence: async () => ({ trimStart: 0.4, trimEnd: 1.2, thresholdUsed: -40 }),
        detectSmartCues: async () => ({ introCue: 8.5, outroCue: 190.0 }),
        detectBpm: async () => ({ bpm: 120 }),
        remoteControlStart: async () => ({ running: true, pin: '482913', port: 8787, addresses: ['192.168.1.42'] }),
        remoteControlStop: async () => ({ running: false }),
        remoteControlStatus: async () => ({ running: false, pin: '', port: 8787, addresses: [] as string[] }),
        onRemoteCommand: cleanup,
        publishRemoteState: noop,
        checkFilesExist: async (paths: string[]) => paths.map((p) => ({ path: p, exists: true })),
        restoreDefaultSfx: async () => [],
        saveProject: async () => ({ success: false }),
        loadProject: async () => ({ success: false }),
        exportProject: async () => ({ success: false }),
        onExportProgress: cleanup,
        saveProjectSilent: async () => ({ success: true }),
        saveProjectDirect: async () => ({ success: true }),
        showCloseDialog: async () => 1,
        forceClose: noop,
        onCheckCloseIntent: cleanup,
        showCloseDialogI18n: async () => 1,
        importM3u: async () => ({ canceled: true }),
        onEmergencyStop: cleanup,
        openExternal: noop,
        getPlatform: () => 'win32',
        checkForUpdates: async () => {},
        downloadUpdate: async () => {},
        quitAndInstall: async () => {},
        onUpdaterStatus: (cb: (s: any) => void) => { setTimeout(() => cb({ type: 'not-available' }), 300); return noop; },
        loadProjectFromPath: async () => ({ success: false }),
        onOpenFile: cleanup,
        showSaveDialogRecording: async () => ({ canceled: true }),
        saveRecordingBuffer: async () => ({ success: true, path: '' }),
        convertRecording: async () => ({ success: true }),
        deleteTempRecording: async () => ({ success: true }),
        savePlayoutLog: async () => ({ success: true }),
    };

    let uid = 0;
    const clip = (over: Record<string, any>) => ({
        id: `demo-${uid++}`,
        name: 'Clip',
        path: `C:/Demo/${over.name || 'clip'}.mp3`,
        type: 'asset',
        color: '#10B981',
        volume: 1,
        pan: 0,
        isLooping: false,
        isPlaying: false,
        duration: 200,
        currentTime: 0,
        nextAction: 'stop',
        behavior: 'normal',
        duckingRole: 'none',
        startMarker: 0,
        endMarker: 0,
        introMarker: 0,
        outroMarker: 0,
        fadeIn: 0,
        fadeOut: 2000,
        ...over,
    });

    const DEMO = [
        { id: 'col-assets', title: 'SHOW ASSETS', type: 'asset', color: '#10B981', isLocked: false, clips: [
            clip({ name: 'SIGLA APERTURA', color: '#10B981', duration: 24, isLooping: true }),
            clip({ name: 'BED SOTTOFONDO', color: '#10B981', duration: 180, isLooping: true }),
            clip({ name: 'STACCO ISTITUZIONALE', color: '#10B981', duration: 6, behavior: 'stacco' }),
        ] },
        { id: 'col-jingle', title: 'JINGLE', type: 'asset', color: '#F59E0B', isLocked: false, clips: [
            clip({ name: 'JINGLE ID RADIO', color: '#F59E0B', type: 'asset', duration: 5 }),
            clip({ name: 'JINGLE WEEKEND', color: '#F59E0B', type: 'asset', duration: 7 }),
        ] },
        { id: 'col-promo', title: 'PROMO', type: 'asset', color: '#06B6D4', isLocked: false, clips: [
            clip({ name: 'PROMO EVENTO LIVE', color: '#06B6D4', type: 'asset', duration: 30 }),
            clip({ name: 'PROMO PODCAST', color: '#06B6D4', type: 'asset', duration: 25 }),
        ] },
        { id: 'col-music', title: 'CANZONI DELL’EPISODIO', type: 'music', color: '#EF4444', isLocked: false, clips: [
            clip({ name: 'Midnight City', artist: 'M83', color: '#EF4444', type: 'music', duration: 244, bpm: 105, keybind: 'Digit1' }),
            clip({ name: 'Blinding Lights', artist: 'The Weeknd', color: '#EF4444', type: 'music', duration: 200, bpm: 171, keybind: 'Digit2' }),
            clip({ name: 'Redbone', artist: 'Childish Gambino', color: '#EF4444', type: 'music', duration: 327, bpm: 80, keybind: 'Digit3' }),
        ] },
        { id: 'col-voice', title: 'VOCI / PREREGISTRAZIONI', type: 'voice', color: '#F97316', isLocked: false, clips: [
            clip({ name: 'INTERVISTA OSPITE', color: '#F97316', type: 'voice', duration: 420, keybind: 'KeyV', notes: 'Domande ospite:\n1) Gli esordi in radio\n2) Il nuovo disco\n3) Le date del tour', introMarker: 4, outroMarker: 410 }),
            clip({ name: 'MESSAGGIO ASCOLTATORE', color: '#F97316', type: 'voice', duration: 38, keybind: 'KeyM' }),
        ] },
        { id: 'col-sfx', title: 'SFX / CARTWALL', type: 'sfx', color: '#64748B', isLocked: false, clips: [
            clip({ name: 'Applausi', color: '#64748B', type: 'sfx', duration: 6, keybind: 'KeyA' }),
            clip({ name: 'Risata', color: '#64748B', type: 'sfx', duration: 3, keybind: 'KeyR' }),
            clip({ name: 'Ding', color: '#64748B', type: 'sfx', duration: 1 }),
            clip({ name: 'Gong', color: '#64748B', type: 'sfx', duration: 4 }),
            clip({ name: 'Woosh', color: '#64748B', type: 'sfx', duration: 2 }),
            clip({ name: 'Buzzer', color: '#64748B', type: 'sfx', duration: 2 }),
        ] },
        { id: 'col-preshow', title: 'PRE-SHOW', type: 'preshow', color: '#8B5CF6', isLocked: false, clips: [
            clip({ name: 'Warm-up 01', color: '#8B5CF6', type: 'preshow', duration: 180, nextAction: 'play_next' }),
            clip({ name: 'Warm-up 02', color: '#8B5CF6', type: 'preshow', duration: 210, nextAction: 'play_next' }),
        ] },
    ];

    w.__seedDemo = () => {
        import('./store/useProjectStore').then((m) => {
            m.useProjectStore.getState().loadProject({ columns: DEMO as any });
        });
    };

    console.info('[devMock] bridge Electron simulato attivo. window.__seedDemo() per i dati demo.');
}
