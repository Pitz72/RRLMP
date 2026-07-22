export type ClipType = 'asset' | 'music' | 'voice' | 'sfx' | 'preshow';

export interface PlayoutLogEntry {
    id: string;
    clipId: string;
    clipName: string;
    artist?: string;
    title?: string;
    clipType: string;
    startTime: number;  // Unix ms
    endTime?: number;   // Unix ms — undefined mentre ancora in play
}

/**
 * Tipo di transizione tra clip in sequenza (v0.13.2).
 * - gapless:   la nuova parte esattamente alla fine della precedente, taglio netto.
 * - segue:     la nuova parte mentre la precedente sfuma (fade out → start).
 * - crossfade: sovrapposizione bilanciata, la vecchia sfuma e la nuova sale contemporaneamente.
 */
export type TransitionType = 'gapless' | 'segue' | 'crossfade';

export type PlaybackMode = 'oneshot' | 'sequence';

/** Controllo Remoto (2026-07-01, Step 1/N) — stato del server LAN locale opt-in. */
export interface RemoteControlStatus {
    running: boolean;
    port?: number;
    pin?: string;
    addresses?: string[];
}

/** Auto-Updater (2026-07-02) — speculare a UpdaterStatusPayload in src/main/updateManager.ts. */
export type UpdaterStatusPayload =
    | { type: 'checking' }
    | { type: 'not-available' }
    | { type: 'available'; version: string; canAutoInstall: boolean; downloadUrl?: string; releaseNotes?: string }
    | { type: 'downloading'; percent: number }
    | { type: 'ready'; version: string; canAutoInstall: boolean; releaseNotes?: string }
    | { type: 'error'; message: string };

declare global {
    interface Window {
        electron: {
            getFilePath: (file: File) => string;
            getAudioMetadata: (filePath: string) => Promise<{success: boolean, data?: unknown, error?: string}>;
            measureLoudness: (filePath: string) => Promise<{success: boolean, data?: {integratedLufs: number}, error?: string}>;
            getWaveformData: (filePath: string) => Promise<{success: boolean, data?: number[], error?: string}>;
            detectSilence: (filePath: string, thresholdDb?: number) => Promise<{success: boolean, data?: {trimStart: number, trimEnd: number, noSilence?: boolean, thresholdUsed?: number}, error?: string}>;
            detectSmartCues: (filePath: string) => Promise<{success: boolean, data?: {introCue: number, outroCue: number}, error?: string}>;
            // 2026-07-01 — BPM Detection automatica (rilevamento + persistenza)
            detectBpm: (filePath: string) => Promise<{success: boolean, data?: {bpm: number, confidence: number, detected: boolean, beatOffsetSec?: number}, error?: string}>;
            // Controllo Remoto (2026-07-01, Step 1/N) — server LAN locale opt-in
            remoteControlStart: () => Promise<RemoteControlStatus>;
            remoteControlStop: () => Promise<RemoteControlStatus>;
            remoteControlStatus: () => Promise<RemoteControlStatus>;
            onRemoteCommand: (callback: (data: { name: string; clipId?: string }) => void) => () => void;
            publishRemoteState: (clips: Array<{ id: string; name: string; isPlaying: boolean }>) => void;
            checkFilesExist: (paths: string[]) => Promise<{ missing: string[] }>;
            restoreDefaultSfx: () => Promise<{ success: boolean; sounds?: Array<{ title: string; path: string }>; error?: string }>;
            saveProject: (content: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
            loadProject: () => Promise<{ success: boolean; data?: string; filePath?: string; error?: string }>;
            exportProject: (projectJsonString: string, lmpPath?: string) => Promise<{ success: boolean; path?: string; stats?: { copied: number; skipped: number; pruned?: number }; remap?: { id: string; path: string }[]; error?: string }>;
            saveProjectSilent: (content: string, filePath?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
            saveProjectDirect: (content: string, filePath: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;

            showCloseDialog: () => Promise<number>;
            /** i18n (2026-07-03) — sincronizza la lingua col processo main (dialoghi nativi, errori IPC) */
            setAppLanguage?: (lang: string) => void;
            showCloseDialogI18n?: (labels: {
                btnSave: string; btnDiscard: string; btnCancel: string;
                title: string; message: string;
            }) => Promise<number>;
            forceClose: () => void;

            onExportProgress: (callback: (event: unknown, data: { current: number; total: number; filename: string }) => void) => () => void;
            onCheckCloseIntent: (callback: () => void) => () => void;
            onEmergencyStop: (callback: () => void) => () => void;
            // v1.2.3 — Apertura diretta file .lmp da file association OS
            loadProjectFromPath: (filePath: string) => Promise<{ success: boolean; data?: string; filePath?: string; error?: string }>;
            onOpenFile: (callback: (filePath: string) => void) => () => void;
            // Playout Log export
            savePlayoutLog: (csvContent: string, suggestedName: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
            importM3u: () => Promise<{ success: boolean; paths?: string[]; error?: string }>;
            // v1.1.1+ — Session Recording (Chunk-based)
            startRecording: () => Promise<{ success: boolean; path?: string; error?: string }>;
            appendRecordChunk: (arrayBuffer: ArrayBuffer) => Promise<{ success: boolean; error?: string }>;
            stopRecording: () => Promise<{ success: boolean; path?: string; error?: string }>;
            // v1.3.16 — formato esteso allineato a exportRecording (wav/mp3/flac/ogg/webm)
            showSaveDialogRecording: (defaultName: string, format: 'webm' | 'wav' | 'mp3' | 'flac' | 'ogg') => Promise<{ canceled: boolean; filePath?: string }>;
            // v1.3.16 — sampleDepth esposto (già presente nel preload), allinea convertRecording all'opzione passata da exportRecording
            convertRecording: (inputPath: string, outputPath: string, options: { bitrate?: number; format?: string; sampleDepth?: number }) => Promise<{ success: boolean; error?: string }>;
            deleteTempRecording: (path: string) => Promise<{ success: boolean; error?: string }>;
            // v1.3.16 — handler IPC già esposti dal preload, qui dichiarati per allineare i tipi (nessun cambio runtime).
            saveRecordingBuffer: (arrayBuffer: ArrayBuffer) => Promise<{ success: boolean; path?: string; error?: string }>;
            // Utilities (esposte dal preload da tempo, mai dichiarate)
            openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
            getPlatform: () => string;
            // Auto-Updater (2026-07-02)
            checkForUpdates: () => Promise<{ success: boolean }>;
            downloadUpdate: () => Promise<{ success: boolean }>;
            quitAndInstall: () => Promise<{ success: boolean }>;
            onUpdaterStatus: (callback: (status: UpdaterStatusPayload) => void) => () => void;
        }





    }
}

/**
 * Essential data structure for an audio clip in the RRLMP project.
 */
export interface AudioClip {
    /** Unique identifier (UUID) */
    id: string;
    /** Display name of the clip */
    name: string;
    /** Native file system path */
    path: string; 
    /** Broadcast type (affects color and bus routing) */
    type: ClipType;
    /** Base color inherited from column or project */
    color: string;
    /** Volume gain multiplier. Default: 1.0 (Unity Gain). Range: 0.0 to 1.5 */
    volume: number; 
    /** Stereo panning. Default: 0.0 (Center). Range: -1.0 to 1.0 */
    pan: number;    
    /** Whether the clip should loop automatically. Default: false */
    isLooping: boolean; 

    // Audio Logic
    /** Dynamic state: is currently playing */
    isPlaying: boolean;
    /** Duration in seconds (loaded from metadata) */
    duration: number;
    /** Current playback position in seconds */
    currentTime: number;

    // Advanced Broadcast Features
    /** Intro start position (skip silence). Default: 0 */
    startMarker?: number; 
    /** Countdown end (vocal start marker) */
    introMarker?: number; 
    /** Mix point (outro transition start) */
    outroMarker?: number; 
    /** Early stop position (end marker) */
    endMarker?: number;   

    // Behavioral Logic
    /** Sequencer action after completion. Default: 'stop' */
    nextAction: 'stop' | 'play_next' | 'loop'; 
    /** LEGACY (v1.15.15): il motore ignora questo campo — lo scopo della clip lo
     *  determina la colonna (take-over + regole-per-colonna). Mantenuto solo per
     *  compatibilità .lmp, come duckingRole. Default: 'normal' */
    behavior: 'normal' | 'stacco';

    // Regole di ingaggio
    /** Ducking priority. Default: 'none' */
    duckingRole: 'source' | 'target' | 'none'; 

    // Transizioni
    /** Fade In duration in milliseconds. Default: 0 */
    fadeIn: number; 
    /** Fade Out duration in milliseconds. Default: 0 */
    fadeOut: number; 

    // Metadati visuali
    /** Manual color override for this specific clip */
    customColor?: string; 
    /** Keyboard shortcut (e.g., "KeyQ", "Numpad1") */
    keybind?: string; 
    /** MIDI Note/Control Bind (e.g., "NOTE:60") */
    midiBind?: string; 

    // Cue Points
    /** Pre-play offset (skip seconds from start). Default: 0 */
    trimStart?: number;
    /** Post-play offset (stop seconds before end). Default: 0 */
    trimEnd?: number;

    // Transizione sequencer (v0.13.2)
    /** Override del tipo di transizione per questa clip. Se assente, usa il default globale. */
    transitionType?: TransitionType;

    // Integrity (v0.14.2) — runtime only, non persistito nel .lmp
    /** True se il file non esiste su disco al momento del caricamento progetto. */
    isMissing?: boolean;

    // Auto-Silence feedback (v0.14.6) — runtime only, non persistito nel .lmp
    /** True mentre FFmpeg sta analizzando il silenzio in background. */
    isAnalyzing?: boolean;

    // Silence analysis tracking (v0.14.10) — persistito nel .lmp
    /** @deprecated v1.7.1: sostituito da silenceCheckedV2 (bug rate-limiter, vedi sotto).
     * Mantenuto solo per compat strutturale dei .lmp vecchi, non più letto dalla logica. */
    silenceChecked?: boolean;
    // v1.7.1 — FIX bug regia: il vecchio silenceChecked poteva risultare true anche
    // quando l'analisi NON era mai realmente avvenuta (richiesta scartata dal
    // rate-limiter IPC, trattata per errore come "nessun silenzio trovato" — vedi
    // withConcurrencyLimit in main/index.ts). Nuovo campo con nome diverso: nei .lmp
    // esistenti nessuna clip lo possiede ancora, quindi al primo caricamento dopo
    // l'aggiornamento OGNI clip viene ricontrollata per davvero una volta sola
    // (controllo/reimpostazione generale); da quel momento in poi silenceCheckedV2
    // viene impostato SOLO su un esito reale (successo o fallimento esplicito
    // dell'analisi), mai su un errore/timeout — che invece lascia la clip "da
    // ricontrollare" al prossimo caricamento.
    /** True solo se il rilevamento silenzio è realmente avvenuto con esito valido. */
    silenceCheckedV2?: boolean;

    // Audio metadata (v0.16.4) — estratti da tag ID3/Vorbis, persistiti nel .lmp
    /** Artista/Autore dal tag ID3 */
    artist?: string;
    /** Titolo dal tag ID3 (distinto da clip.name che è il filename) */
    title?: string;

    // Played tracking (v0.14.12) — persistito nel .lmp
    /** True se la clip è già stata suonata almeno una volta nella sessione corrente. */
    hasPlayed?: boolean;

    // Note/Script (v0.14.4)
    /** Testo libero: cue sheet, script, note di regia. Persistito nel .lmp. */
    notes?: string;

    // Loudness homologation (v1.4.3) — persistito nel .lmp
    /** Loudness integrata misurata (EBU R128, LUFS). Usata per omologare il volume tra clip
     *  applicando un guadagno statico a runtime verso il target. Misurata una volta e cachata. */
    loudnessLufs?: number;

    // BPM Detection (2026-07-01) — persistito nel .lmp
    /** BPM stimato tramite analisi FFmpeg (onset detection + autocorrelazione). Solo
     *  rilevamento + visualizzazione in questo step: non ancora usato dal motore mix. */
    bpm?: number;
    /** True solo se il rilevamento BPM è realmente avvenuto con esito valido (successo
     *  o "non rilevabile" esplicito). Un fallimento (rate-limit/timeout) NON lo imposta,
     *  per essere ritentato al prossimo caricamento — stesso pattern di silenceCheckedV2.
     *  ⚠️ LEGACY dal v1.10.17: il gate attivo è bpmCheckedV2 (analisi con beat-offset);
     *  questo campo resta solo nei .lmp salvati prima e non viene più scritto. */
    bpmChecked?: boolean;

    // Automix Fase A (v1.10.17) — persistito nel .lmp
    /** Fase della griglia dei beat: offset in secondi del PRIMO beat dall'inizio del
     *  file (non del trim). Con bpm + beatOffsetSec ogni beat è t_k = offset + k·(60/bpm).
     *  Assente se non stimabile → il motore automix degraderà a crossfade classico. */
    beatOffsetSec?: number;
    /** Confidence 0..1 della stima BPM. Segnale di fallback della Fase D: la validazione
     *  A3 su musica reale (docs/automix/VALIDAZIONE-A3.md) ha mostrato che i brani a
     *  tempo variabile escono a ~0.3-0.45 e quelli buoni a 0.53+ → soglia automix ≥0.5. */
    bpmConfidence?: number;
    /** Gate versionato dell'analisi BPM (come silenceCheckedV2): true solo se l'analisi
     *  v1.10.17+ (con beat-offset) è realmente avvenuta. Le clip con il solo bpmChecked
     *  legacy vengono rianalizzate al prossimo caricamento per ottenere l'offset (e la
     *  precisione dell'interpolazione parabolica v1.10.14). */
    bpmCheckedV2?: boolean;
}


/**
 * Configurazione rotazione automatica Jingle&Promo (v1.3.21).
 * Persistita SOLO sulla colonna PRE-SHOW. Governa l'inserimento periodico di
 * clip prese a caso dalle colonne `col-jingle` / `col-promo` durante la
 * riproduzione sequenziale della PRE-SHOW. NON è automazione dello show:
 * vive solo nella fase di riempitivo PRE-SHOW (vedi docs/VISION.md).
 * Il jingle/promo parte a fine brano seguendo le transizioni esistenti, mai
 * sovrapposto. Due contatori indipendenti (jingle ogni X, promo ogni Y).
 */
export interface RotationConfig {
    /** Inserimento jingle attivo */
    jingleEnabled: boolean;
    /** Un jingle ogni N brani PRE-SHOW (>=1) */
    jingleEvery: number;
    /** Inserimento promo attivo */
    promoEnabled: boolean;
    /** Un promo ogni N brani PRE-SHOW (>=1) */
    promoEvery: number;
}

export interface Column {
    id: string;
    title: string;
    type: ClipType;
    clips: AudioClip[];
    color: string;          // Colore base della colonna (immutabile, default)
    customColor?: string;   // Override colore scelto dall'utente (v0.16.1)
    isLocked: boolean;      // Impedisce modifiche accidentali
    /** Solo PRE-SHOW (v1.3.21): config rotazione Jingle&Promo. Persistita nel .lmp. */
    rotation?: RotationConfig;
}
