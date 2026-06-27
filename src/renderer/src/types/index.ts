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

declare global {
    interface Window {
        electron: {
            getFilePath: (file: File) => string;
            getAudioMetadata: (filePath: string) => Promise<{success: boolean, data?: unknown, error?: string}>;
            measureLoudness: (filePath: string) => Promise<{success: boolean, data?: {integratedLufs: number}, error?: string}>;
            getWaveformData: (filePath: string) => Promise<{success: boolean, data?: number[], error?: string}>;
            detectSilence: (filePath: string, thresholdDb?: number) => Promise<{success: boolean, data?: {trimStart: number, trimEnd: number, noSilence?: boolean, thresholdUsed?: number}, error?: string}>;
            detectSmartCues: (filePath: string) => Promise<{success: boolean, data?: {introCue: number, outroCue: number}, error?: string}>;
            checkFilesExist: (paths: string[]) => Promise<{ missing: string[] }>;
            saveProject: (content: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
            loadProject: () => Promise<{ success: boolean; data?: string; filePath?: string; error?: string }>;
            exportProject: (projectJsonString: string, lmpPath?: string) => Promise<{ success: boolean; path?: string; stats?: { copied: number; skipped: number; pruned?: number }; error?: string }>;
            saveProjectSilent: (content: string, filePath?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
            saveProjectDirect: (content: string, filePath: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;

            showCloseDialog: () => Promise<number>;
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
    /** Mixer behavior. 'stacco' triggers ducking on other clips. Default: 'normal' */
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
    /** True se il rilevamento silenzio IPC è già stato eseguito su questa clip. */
    silenceChecked?: boolean;

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
