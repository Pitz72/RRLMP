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

    const DEMO_IT = [
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

    // Dataset inglese — riferimento globale per gli screenshot di tutti i manuali
    // tranne l'italiano. Stessa struttura di DEMO_IT: cambiano solo le stringhe.
    const DEMO_EN = [
        { id: 'col-assets', title: 'SHOW ASSETS', type: 'asset', color: '#10B981', isLocked: false, clips: [
            clip({ name: 'OPENING THEME', color: '#10B981', duration: 24, isLooping: true }),
            clip({ name: 'BACKGROUND BED', color: '#10B981', duration: 180, isLooping: true }),
            clip({ name: 'STATION STINGER', color: '#10B981', duration: 6, behavior: 'stacco' }),
        ] },
        { id: 'col-jingle', title: 'JINGLE', type: 'asset', color: '#F59E0B', isLocked: false, clips: [
            clip({ name: 'RADIO ID JINGLE', color: '#F59E0B', type: 'asset', duration: 5 }),
            clip({ name: 'WEEKEND JINGLE', color: '#F59E0B', type: 'asset', duration: 7 }),
        ] },
        { id: 'col-promo', title: 'PROMO', type: 'asset', color: '#06B6D4', isLocked: false, clips: [
            clip({ name: 'LIVE EVENT PROMO', color: '#06B6D4', type: 'asset', duration: 30 }),
            clip({ name: 'PODCAST PROMO', color: '#06B6D4', type: 'asset', duration: 25 }),
        ] },
        { id: 'col-music', title: 'EPISODE SONGS', type: 'music', color: '#EF4444', isLocked: false, clips: [
            clip({ name: 'Midnight City', artist: 'M83', color: '#EF4444', type: 'music', duration: 244, bpm: 105, keybind: 'Digit1' }),
            clip({ name: 'Blinding Lights', artist: 'The Weeknd', color: '#EF4444', type: 'music', duration: 200, bpm: 171, keybind: 'Digit2' }),
            clip({ name: 'Redbone', artist: 'Childish Gambino', color: '#EF4444', type: 'music', duration: 327, bpm: 80, keybind: 'Digit3' }),
        ] },
        { id: 'col-voice', title: 'VOICE / PRE-RECORDED', type: 'voice', color: '#F97316', isLocked: false, clips: [
            clip({ name: 'GUEST INTERVIEW', color: '#F97316', type: 'voice', duration: 420, keybind: 'KeyV', notes: 'Guest questions:\n1) Early radio days\n2) The new album\n3) Tour dates', introMarker: 4, outroMarker: 410 }),
            clip({ name: 'LISTENER MESSAGE', color: '#F97316', type: 'voice', duration: 38, keybind: 'KeyM' }),
        ] },
        { id: 'col-sfx', title: 'SFX / CARTWALL', type: 'sfx', color: '#64748B', isLocked: false, clips: [
            clip({ name: 'Applause', color: '#64748B', type: 'sfx', duration: 6, keybind: 'KeyA' }),
            clip({ name: 'Laugh', color: '#64748B', type: 'sfx', duration: 3, keybind: 'KeyR' }),
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

    // Factory per le lingue aggiuntive: stessa struttura di DEMO_IT/DEMO_EN,
    // cambiano solo le stringhe traducibili. Brani/artisti/BPM/keybind e i nomi
    // SFX neutri (Ding/Gong/Woosh/Buzzer/Warm-up) restano invariati.
    const buildDemo = (t: Record<string, string>) => [
        { id: 'col-assets', title: t.assets, type: 'asset', color: '#10B981', isLocked: false, clips: [
            clip({ name: t.openingTheme, color: '#10B981', duration: 24, isLooping: true }),
            clip({ name: t.backgroundBed, color: '#10B981', duration: 180, isLooping: true }),
            clip({ name: t.stationStinger, color: '#10B981', duration: 6, behavior: 'stacco' }),
        ] },
        { id: 'col-jingle', title: t.jingle, type: 'asset', color: '#F59E0B', isLocked: false, clips: [
            clip({ name: t.radioIdJingle, color: '#F59E0B', type: 'asset', duration: 5 }),
            clip({ name: t.weekendJingle, color: '#F59E0B', type: 'asset', duration: 7 }),
        ] },
        { id: 'col-promo', title: t.promo, type: 'asset', color: '#06B6D4', isLocked: false, clips: [
            clip({ name: t.liveEventPromo, color: '#06B6D4', type: 'asset', duration: 30 }),
            clip({ name: t.podcastPromo, color: '#06B6D4', type: 'asset', duration: 25 }),
        ] },
        { id: 'col-music', title: t.music, type: 'music', color: '#EF4444', isLocked: false, clips: [
            clip({ name: 'Midnight City', artist: 'M83', color: '#EF4444', type: 'music', duration: 244, bpm: 105, keybind: 'Digit1' }),
            clip({ name: 'Blinding Lights', artist: 'The Weeknd', color: '#EF4444', type: 'music', duration: 200, bpm: 171, keybind: 'Digit2' }),
            clip({ name: 'Redbone', artist: 'Childish Gambino', color: '#EF4444', type: 'music', duration: 327, bpm: 80, keybind: 'Digit3' }),
        ] },
        { id: 'col-voice', title: t.voice, type: 'voice', color: '#F97316', isLocked: false, clips: [
            clip({ name: t.guestInterview, color: '#F97316', type: 'voice', duration: 420, keybind: 'KeyV', notes: t.guestNotes, introMarker: 4, outroMarker: 410 }),
            clip({ name: t.listenerMessage, color: '#F97316', type: 'voice', duration: 38, keybind: 'KeyM' }),
        ] },
        { id: 'col-sfx', title: t.sfx, type: 'sfx', color: '#64748B', isLocked: false, clips: [
            clip({ name: t.applause, color: '#64748B', type: 'sfx', duration: 6, keybind: 'KeyA' }),
            clip({ name: t.laugh, color: '#64748B', type: 'sfx', duration: 3, keybind: 'KeyR' }),
            clip({ name: 'Ding', color: '#64748B', type: 'sfx', duration: 1 }),
            clip({ name: 'Gong', color: '#64748B', type: 'sfx', duration: 4 }),
            clip({ name: 'Woosh', color: '#64748B', type: 'sfx', duration: 2 }),
            clip({ name: 'Buzzer', color: '#64748B', type: 'sfx', duration: 2 }),
        ] },
        { id: 'col-preshow', title: t.preshow, type: 'preshow', color: '#8B5CF6', isLocked: false, clips: [
            clip({ name: 'Warm-up 01', color: '#8B5CF6', type: 'preshow', duration: 180, nextAction: 'play_next' }),
            clip({ name: 'Warm-up 02', color: '#8B5CF6', type: 'preshow', duration: 210, nextAction: 'play_next' }),
        ] },
    ];

    const DEMO_STRINGS: Record<string, Record<string, string>> = {
        fr: {
            assets: "ÉLÉMENTS D'ANTENNE", jingle: 'JINGLE', promo: 'PROMO', music: "TITRES DE L'ÉPISODE",
            voice: 'VOIX / PRÉENREGISTRÉ', sfx: 'SFX / CARTWALL', preshow: 'PRE-SHOW',
            openingTheme: "GÉNÉRIQUE D'OUVERTURE", backgroundBed: 'TAPIS SONORE', stationStinger: 'STINGER STATION',
            radioIdJingle: 'JINGLE ID RADIO', weekendJingle: 'JINGLE WEEK-END',
            liveEventPromo: 'PROMO ÉVÉNEMENT LIVE', podcastPromo: 'PROMO PODCAST',
            guestInterview: 'INTERVIEW INVITÉ', listenerMessage: 'MESSAGE AUDITEUR',
            guestNotes: "Questions invité :\n1) Les débuts à la radio\n2) Le nouvel album\n3) Les dates de tournée",
            applause: 'Applaudissements', laugh: 'Rire',
        },
        de: {
            assets: 'SENDUNGS-ELEMENTE', jingle: 'JINGLE', promo: 'PROMO', music: 'TITEL DER EPISODE',
            voice: 'STIMME / VORPRODUZIERT', sfx: 'SFX / CARTWALL', preshow: 'PRE-SHOW',
            openingTheme: 'ERKENNUNGSMELODIE', backgroundBed: 'HINTERGRUND-BED', stationStinger: 'SENDER-STINGER',
            radioIdJingle: 'RADIO-ID-JINGLE', weekendJingle: 'WOCHENEND-JINGLE',
            liveEventPromo: 'PROMO LIVE-EVENT', podcastPromo: 'PODCAST-PROMO',
            guestInterview: 'GAST-INTERVIEW', listenerMessage: 'HÖRERNACHRICHT',
            guestNotes: 'Fragen an den Gast:\n1) Die Anfänge im Radio\n2) Das neue Album\n3) Die Tourdaten',
            applause: 'Applaus', laugh: 'Lachen',
        },
        es: {
            assets: 'ELEMENTOS DEL PROGRAMA', jingle: 'JINGLE', promo: 'PROMO', music: 'CANCIONES DEL EPISODIO',
            voice: 'VOZ / PREGRABADO', sfx: 'SFX / CARTWALL', preshow: 'PRE-SHOW',
            openingTheme: 'SINTONÍA DE APERTURA', backgroundBed: 'BED DE FONDO', stationStinger: 'STINGER DE EMISORA',
            radioIdJingle: 'JINGLE ID RADIO', weekendJingle: 'JINGLE FIN DE SEMANA',
            liveEventPromo: 'PROMO EVENTO EN VIVO', podcastPromo: 'PROMO PODCAST',
            guestInterview: 'ENTREVISTA INVITADO', listenerMessage: 'MENSAJE DEL OYENTE',
            guestNotes: 'Preguntas al invitado:\n1) Los inicios en la radio\n2) El nuevo disco\n3) Las fechas de la gira',
            applause: 'Aplausos', laugh: 'Risa',
        },
        pt: {
            assets: 'ELEMENTOS DO PROGRAMA', jingle: 'JINGLE', promo: 'PROMO', music: 'TEMAS DO EPISÓDIO',
            voice: 'VOZ / PRÉ-GRAVADO', sfx: 'SFX / CARTWALL', preshow: 'PRE-SHOW',
            openingTheme: 'GENÉRICO DE ABERTURA', backgroundBed: 'BED DE FUNDO', stationStinger: 'STINGER DA ESTAÇÃO',
            radioIdJingle: 'JINGLE ID RÁDIO', weekendJingle: 'JINGLE FIM DE SEMANA',
            liveEventPromo: 'PROMO EVENTO AO VIVO', podcastPromo: 'PROMO PODCAST',
            guestInterview: 'ENTREVISTA CONVIDADO', listenerMessage: 'MENSAGEM DO OUVINTE',
            guestNotes: 'Perguntas ao convidado:\n1) Os inícios na rádio\n2) O novo álbum\n3) As datas da digressão',
            applause: 'Aplausos', laugh: 'Riso',
        },
        ru: {
            assets: 'ЭЛЕМЕНТЫ ЭФИРА', jingle: 'ДЖИНГЛ', promo: 'ПРОМО', music: 'ТРЕКИ ВЫПУСКА',
            voice: 'ГОЛОС / ЗАПИСЬ', sfx: 'SFX / CARTWALL', preshow: 'PRE-SHOW',
            openingTheme: 'ЗАСТАВКА ОТКРЫТИЯ', backgroundBed: 'ФОНОВЫЙ БЭД', stationStinger: 'СТАНЦИОННЫЙ СТИНГЕР',
            radioIdJingle: 'ДЖИНГЛ ID РАДИО', weekendJingle: 'ДЖИНГЛ ВЫХОДНЫХ',
            liveEventPromo: 'ПРОМО LIVE-СОБЫТИЯ', podcastPromo: 'ПРОМО ПОДКАСТА',
            guestInterview: 'ИНТЕРВЬЮ С ГОСТЕМ', listenerMessage: 'СООБЩЕНИЕ СЛУШАТЕЛЯ',
            guestNotes: 'Вопросы гостю:\n1) Начало на радио\n2) Новый альбом\n3) Даты тура',
            applause: 'Аплодисменты', laugh: 'Смех',
        },
        zh: {
            assets: '节目素材', jingle: 'JINGLE', promo: 'PROMO', music: '本期歌曲',
            voice: '人声 / 预录', sfx: 'SFX / CARTWALL', preshow: 'PRE-SHOW',
            openingTheme: '开场主题曲', backgroundBed: '背景垫乐', stationStinger: '电台短音效',
            radioIdJingle: '电台标识 JINGLE', weekendJingle: '周末 JINGLE',
            liveEventPromo: '现场活动 PROMO', podcastPromo: '播客 PROMO',
            guestInterview: '嘉宾访谈', listenerMessage: '听众留言',
            guestNotes: '嘉宾提问：\n1) 电台生涯的起步\n2) 全新专辑\n3) 巡演日期',
            applause: '掌声', laugh: '笑声',
        },
    };

    w.__seedDemo = (lang?: string) => {
        const columns = lang === 'en' ? DEMO_EN
            : lang && DEMO_STRINGS[lang] ? buildDemo(DEMO_STRINGS[lang])
            : DEMO_IT;
        import('./store/useProjectStore').then((m) => {
            m.useProjectStore.getState().loadProject({ columns: columns as any });
        });
    };

    console.info('[devMock] bridge Electron simulato attivo. window.__seedDemo() per i dati demo.');
}
