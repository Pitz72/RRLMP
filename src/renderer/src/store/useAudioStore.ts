import { create } from 'zustand';
import { IAudioPlayer } from '../engine/AudioPlayer.interface';
import { StreamPlayer } from '../engine/StreamPlayer';
import { AudioClip, PlayoutLogEntry, TransitionType } from '../types';
import { planTransition } from '../engine/automixEngine';
import AudioContextManager from '../engine/AudioContextManager';
import { debugLog } from './useDebugStore';
import { useProjectStore } from './useProjectStore';
import { useSettingsStore } from './useSettingsStore';
import * as AUDIO_CONST from '../constants/audioConstants';
import i18n from '../i18n';

// v1.2.19 (NEW-GR-04): cap FIFO sul playoutLog per evitare degrado progressivo
// in memoria su sessioni broadcast lunghe (8h+ con jingle/SFX su tasti rapidi
// possono superare 5–10k entry). 2000 entry coprono ampiamente una diretta
// tipica; le più vecchie vengono droppate silenziosamente.
const MAX_PLAYOUT_LOG_ENTRIES = 2000;
// v1.4.5: esportato per i test unitari (Vitest). Funzione pura, nessun cambio di logica.
export const capPlayoutLog = (log: PlayoutLogEntry[]): PlayoutLogEntry[] =>
    log.length > MAX_PLAYOUT_LOG_ENTRIES ? log.slice(-MAX_PLAYOUT_LOG_ENTRIES) : log;

interface ActiveClipState {
    player: IAudioPlayer;
    isPlaying: boolean;
    progress: number;
    clip: AudioClip; // Init with full clip
}

interface AudioStore {
    activeClips: Record<string, ActiveClipState>;
    // v1.4.11 (#29): mappa ID → volume al momento della soppressione. Il valore è di
    // fatto un FLAG: il ripristino post-stacco usa sempre il clip.volume CORRENTE
    // (scelta deliberata — se l'operatore cambia il volume durante la soppressione,
    // vince il valore nuovo). Dal v1.4.6 evaluateMix tiene a 0 le clip presenti qui.
    suppressedClips: Record<string, number>; // ID -> Original Volume

    // v0.14.5 — Timer On Air
    onAirStartTime: number | null; // timestamp ms del primo play, null quando idle

    // v0.14.9 — Clip in fade-out per transizione (crossfade/segue)
    fadingClipIds: string[];

    // v0.16.5 — Preview Transition: set di clip ID avviate in modalità preview
    previewingClipIds: string[];

    // v0.17.0 — Smart Mic: il microfono hardware è rilevato come voce attiva
    isMicActive: boolean;

    // Playout Log
    playoutLog: PlayoutLogEntry[];
    clearPlayoutLog: () => void;

    // Actions
    // v1.4.9 (#21): opts.machine distingue i lanci del sequencer/rotazione dai gesti
    // operatore — solo i gesti operatore possono annullare un load in volo (toggle).
    playClip: (clip: AudioClip, velocityGain?: number, opts?: { machine?: boolean }) => Promise<void>;
    loadClip: (clip: AudioClip) => Promise<void>;
    playColumn: (colIndex: number) => Promise<void>;
    updateOutputDevice: (deviceId: string) => void;
    stopClip: (clipId: string) => void;
    previewTransition: (clip: AudioClip) => Promise<void>;
    stopPreviewTransition: (clipId: string) => void;
    // v1.10.23 (Automix Fase C2): transizione richiesta dalla Automix Section —
    // beat-match se il piano lo consente, altrimenti crossfade classico (Fase D).
    // Ritorna l'esito per la telemetria/toast della vista.
    automixTransition: (fromClipId: string, toClipId: string) => Promise<{ mode: 'beatmatched' | 'classic' | 'skipped'; reason?: string }>;
    stopAll: () => void;
    setMicActive: (active: boolean) => void;
    // v1.4.7 (#14): riallinea il player di una clip GIÀ in onda alle impostazioni
    // appena salvate (fadeOut di transizione, trim/marker, volume) — prima il
    // fadeOut dinamico veniva deciso solo al play e i cambi live non avevano effetto.
    syncActiveClipSettings: (clipId: string) => void;

    // Internal loop
    _syncProgress: () => void;
}

const getBusForType = (type: string) => {
    const mgr = AudioContextManager.getInstance();
    switch (type) {
        case 'music': return mgr.getMusicBus();
        case 'preshow': return mgr.getMusicBus(); // Map Preshow to Music
        case 'voice': return mgr.getVoiceBus();
        case 'asset': return mgr.getAssetsBus(); // Assets usually voice-overs
        case 'sfx': return mgr.getSfxBus();
        default: return mgr.getMusicBus();
    }
};

/**
 * CENTRALIZED MIXING ENGINE (L4: Logic Documentation)
 * 
 * This function is the "brain" of the audio engine. It is called every time
 * a clip starts or stops to recalculate the target volume of all active clips.
 * 
 * Logic follows a hierarchy of priority:
 * 1. VOICE: Always 100% volume.
 * 2. STACCO: High priority jingles that mute other assets and duck music.
 * 3. MUSIC: Standard background, ducks when Voice or Stacco is active.
 * 4. ASSETS: Beds/Jingles that duck on voice or mute on music dominance.
 */
/**
 * newClipId (opzionale) — ID della clip appena avviata.
 * Per quella clip il gain viene applicato istantaneamente (duration=0) per evitare
 * il glitch "parte a pieno volume poi scende" quando il ducking è attivo.
 * Per tutte le altre clip già in play si usa duckingDuration (smooth).
 */
// v1.4.5: esportato per i test unitari (Vitest). Nessun cambio di logica.
// v1.4.6 (revisione 2026-06-10, #1/#22): quarto parametro opzionale `mixState` —
// le clip in fade-out di transizione NON vanno toccate (riapplicare il volume nominale
// cancellerebbe la rampa verso 0 e le riporterebbe a volume pieno, distruggendo
// crossfade/segue); le clip soppresse da uno stacco restano a 0 finché la soppressione
// è attiva. Se non passati, i valori vengono letti dallo store (i chiamanti dentro
// set() devono passarli esplicitamente quando li stanno modificando nello stesso set).
export const evaluateMix = (
    activeClips: Record<string, ActiveClipState>,
    newClipId?: string,
    overrideDuration?: number,
    mixState?: { fadingClipIds?: string[]; suppressedClips?: Record<string, number> }
) => {
    const activeValues = Object.values(activeClips);
    const duckingFactor = _duckingFactor;
    const duckingDuration = _duckingDuration;
    const fadingIds = mixState?.fadingClipIds ?? useAudioStore.getState().fadingClipIds;
    const suppressed = mixState?.suppressedClips ?? useAudioStore.getState().suppressedClips;

    // 1. ANALYSIS: Scan for high-priority types currently playing
    // v0.17.0: isMicActive (Smart Mic) ha la stessa priorità di una clip voice
    const isVoiceActive = activeValues.some(c => c.clip.type === 'voice') || _isMicActiveGlobal;
    const isMusicActive = activeValues.some(c => c.clip.type === 'music');
    // Active Stacco defined as: An asset that is playing and has behavior 'stacco'
    const activeStacco = activeValues.find(c =>
        getColumnForClip(c.clip.id) === 'col-assets' && c.clip.behavior === 'stacco'
    );
    // 2026-06-30 (A3): è in onda un asset/jingle/promo NON in loop (= sigla, jingle, spot)?
    // Un sottofondo in LOOP deve abbassarsi a zero sotto di esso e poi tornare (rialzo
    // sfumato) quando finisce. Il rientro è automatico: a fine jingle stopClip richiama
    // evaluateMix, qui questa flag torna false e il bed risale al suo volume.
    const isNonLoopAssetActive = activeValues.some(c => c.clip.type === 'asset' && !c.clip.isLooping);

    debugLog(`MIX EVAL: MusicActive=${isMusicActive}, VoiceActive=${isVoiceActive}, Stacco=${activeStacco ? activeStacco.clip.name : 'None'}`, 'info');

    activeValues.forEach(ac => {
        const { clip, player } = ac;

        // v1.4.6 (#1): clip in transizione (crossfade/segue) — il suo fadeTo(0) e lo
        // stopClip sono già schedulati dal transition handler. Qualunque riapplicazione
        // di volume qui cancellerebbe la rampa (cancelScheduledValues) riportandola
        // udibilmente a volume pieno prima del taglio. Non toccare.
        if (fadingIds.includes(clip.id)) return;

        let targetVolume = clip.volume; // Start with nominal volume set by user

        if (clip.type === 'voice') {
            // VOICE: Always nominal (never ducked)
            targetVolume = clip.volume;
        }
        else if (clip.type === 'music' || clip.type === 'preshow') {
            // MUSIC: Ducks if Voice or Stacco is active
            if (isVoiceActive || activeStacco) {
                targetVolume = clip.volume * duckingFactor;
            } else {
                targetVolume = clip.volume;
            }
        }
        else if (clip.type === 'asset' || getColumnForClip(clip.id) === 'col-assets') {
            // ASSETS (Beds, Jingles, Stacchi)
            // Rule 1: Self-Preservation (If I am the active Stacco, I stay full)
            if (activeStacco && activeStacco.clip.id === clip.id) {
                targetVolume = clip.volume;
            }
            // Rule 2: Stacco Suppression (If another Stacco is active, I mute)
            else if (activeStacco) {
                targetVolume = 0;
            }
            // Rule 3: Music Dominance (If Music active, assets/beds mute to avoid mud)
            else if (isMusicActive) {
                targetVolume = 0;
            }
            // Rule 3b (A3, 2026-06-30): un SOTTOFONDO in LOOP si azzera quando è in onda
            // un asset/jingle/promo NON in loop (sigla, jingle, spot). A fine di quello
            // il bed torna al suo volume con rialzo sfumato (evaluateMix su stopClip).
            else if (clip.isLooping && isNonLoopAssetActive) {
                targetVolume = 0;
            }
            // Rule 4: Voice Ducking (If Voice active, I duck)
            else if (isVoiceActive) {
                targetVolume = clip.volume * duckingFactor;
            }
            // Rule 5: Normal
            else {
                targetVolume = clip.volume;
            }
        }
        else {
            // SFX / Others: Default behavior (duck half-way on voice)
            if (isVoiceActive) targetVolume = clip.volume * 0.5;
        }

        // v1.4.6 (#22): una clip soppressa da uno stacco (anche fuori da col-assets)
        // resta a 0 finché la soppressione è attiva — prima il primo evaluateMix
        // successivo la riportava al volume nominale ("rimbalzo" udibile di ~500ms).
        if (suppressed[clip.id] !== undefined) targetVolume = 0;

        // APPLY: istantaneo per la clip appena avviata (evita glitch ducking),
        // smooth per le clip già in play. overrideDuration usato per mic-ducking rapido.
        const applyDuration = (newClipId && clip.id === newClipId) ? 0 : (overrideDuration ?? duckingDuration);
        // AUDIT-ME (2026-05-29): guardia finita sul volume target. Se clip.volume o
        // duckingFactor risultano NaN/Infinity (settings corrotti, dati esterni), il
        // prodotto propagherebbe un valore non finito a fadeTo → GainNode in stato
        // indefinito (clip muta o bus compromesso). Clamp difensivo a [0, 1.5];
        // su valore non finito si forza il silenzio (più sicuro di un gain impazzito).
        const safeVolume = Number.isFinite(targetVolume)
            ? Math.max(0, Math.min(1.5, targetVolume))
            : 0;
        player.fadeTo(safeVolume, applyDuration);
    });
};

const getNextClipInColumn = (currentClipId: string): AudioClip | null => {
    // Access Project Store directly
    const state = useProjectStore.getState();
    if (!state || !state.columns) {
        debugLog('AudioStore: ProjectStore invalid state', 'error');
        return null;
    }

    const { columns } = state;

    for (const col of columns) {
        const idx = col.clips.findIndex((c: AudioClip) => c.id === currentClipId);
        if (idx !== -1) {
            // Found column
            debugLog(`AudioStore: Found current clip in col ${col.id} index ${idx}`, 'info');
            // v1.4.7 (#6): salta le clip con file mancante invece di restituirle —
            // playClip le bloccherebbe con un return secco quando la clip corrente
            // è GIÀ stata sfumata a zero dal transition handler → dead air.
            // Avanza alla prima clip riproducibile della colonna.
            for (let k = idx + 1; k < col.clips.length; k++) {
                const nextClip = col.clips[k];
                if (nextClip.isMissing) {
                    debugLog(`AudioStore: Next clip ${nextClip.name} mancante — salto alla successiva`, 'error');
                    continue;
                }
                debugLog(`AudioStore: Next clip identified: ${nextClip.name}`, 'event');
                return nextClip;
            }
            debugLog(`AudioStore: No next clip (End of list)`, 'info');
            return null; // End of list
        }
    }
    debugLog(`AudioStore: Current clip ${currentClipId} not found in any column`, 'error');
    return null;
};

// v1.4.7 (#7/#8): risolve il tipo di transizione EFFETTIVO di una clip, in un punto solo.
// - Valori non validi (es. la stringa 'default' persistita dai .lmp fino a v1.4.6 per la
//   voce UI "Default Globale") non superano il check → fallback, come l'utente si aspetta.
// - Fuori dalla PRE-SHOW il default è 'gapless': prima playClip armava il fadeOut col
//   default globale ma applyTransitionAndPlayNext risolveva 'gapless' → brano troncato
//   di crossfadeDuration prima della fine (incoerenza tra i due lettori).
export const resolveTransitionType = (clip: AudioClip, colId: string | null): TransitionType => {
    const t = clip.transitionType as unknown;
    if (t === 'crossfade' || t === 'segue' || t === 'gapless') return t;
    return colId === 'col-preshow'
        ? useSettingsStore.getState().defaultPreshowTransition
        : 'gapless';
};

// Helper to find column ID for a clip
export const getColumnForClip = (clipId: string): string | null => {
    const { columns } = useProjectStore.getState();
    for (const col of columns) {
        if (col.clips.find(c => c.id === clipId)) return col.id;
    }
    return null;
}

// v1.4.3 — Omologazione loudness clip.
// Calcola il fattore di guadagno STATICO (moltiplicatore) per portare la clip al target
// loudness comune. Fail-safe: se disattivo o non ancora misurato → 1.0 (nessuna alterazione).
// Il guadagno in dB è clampato a ±9 dB per evitare boost/cut estremi (sicurezza broadcast).
export const computeLoudnessGain = (clip: AudioClip): number => {
    const { loudnessNormEnabled, loudnessTargetLufs } = useSettingsStore.getState();
    if (!loudnessNormEnabled) return 1.0;
    const lufs = clip.loudnessLufs;
    if (lufs === undefined || !isFinite(lufs)) return 1.0;
    let gainDb = loudnessTargetLufs - lufs;
    gainDb = Math.max(-9, Math.min(9, gainDb));
    return Math.pow(10, gainDb / 20);
};

// Misura la loudness una volta sola e la cacha sulla clip (fire-and-forget, non bloccante).
// Guardata per-path per evitare misure concorrenti duplicate. Errori non fatali.
const _loudnessInFlight = new Set<string>();
const ensureLoudnessMeasured = async (clip: AudioClip): Promise<void> => {
    if (clip.loudnessLufs !== undefined) return;
    if (!useSettingsStore.getState().loudnessNormEnabled) return;
    if (!clip.path || _loudnessInFlight.has(clip.path)) return;
    _loudnessInFlight.add(clip.path);
    try {
        const res = await window.electron.measureLoudness(clip.path);
        if (res.success && res.data && isFinite(res.data.integratedLufs)) {
            const colId = getColumnForClip(clip.id);
            if (colId) {
                useProjectStore.getState().updateClip(colId, clip.id, { loudnessLufs: res.data.integratedLufs });
                debugLog(`AudioStore: Loudness ${clip.name} = ${res.data.integratedLufs.toFixed(1)} LUFS`, 'info');
            }
        }
    } catch {
        // non fatale: senza misura la clip resta a guadagno 1.0
    } finally {
        _loudnessInFlight.delete(clip.path);
    }
};

// Feature live-edit (audit 2026-05-29): restituisce la versione PIÙ AGGIORNATA della clip
// dal project store (non lo snapshot catturato all'avvio del play). Serve perché l'operatore
// può cambiare nextAction/transitionType di una clip GIÀ in esecuzione: la decisione di fine
// brano (stop vs play_next) deve leggere il valore corrente, non quello di quando è partita.
const getFreshClipById = (clipId: string): AudioClip | undefined =>
    useProjectStore.getState().columns.flatMap(c => c.clips).find(c => c.id === clipId);

// GRAVE #6 (audit 2026-05-29): handle dei setTimeout di transizione (crossfade/segue) per clipId.
// Vanno cancellati in stopClip/stopAll, altrimenti un re-trigger rapido della stessa clip entro
// la durata del crossfade verrebbe fermato dal timeout della transizione precedente.
const _transitionTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const clearTransitionTimeout = (clipId: string) => {
    const h = _transitionTimeouts.get(clipId);
    if (h) { clearTimeout(h); _transitionTimeouts.delete(clipId); }
};

// v1.10.23 (Automix Fase C2) — stato module-level del controller automix.
// _automixInFlight: anti doppio-pressione sul pulsantone TRANSIZIONE.
// _rateRampTimers: rampe di rientro del playbackRate a 1.0 (piano B.5) per clipId;
// si auto-fermano se la clip esce da activeClips (stop manuale / STOP ALL).
let _automixInFlight = false;
const AUTOMIX_RATE_RAMP_PER_SEC = 0.001; // 0.1%/s — inudibile; delta tipico 3% → ~30s
const _rateRampTimers = new Map<string, ReturnType<typeof setTimeout>>();
const clearRateRamp = (clipId: string) => {
    const h = _rateRampTimers.get(clipId);
    // setTimeout e setInterval condividono il pool di handle: clearInterval è
    // sicuro su entrambi (l'handle può essere l'uno o l'altro a seconda della fase).
    if (h) { clearInterval(h); _rateRampTimers.delete(clipId); }
};
const startRateRampBack = (clipId: string, delayMs: number) => {
    clearRateRamp(clipId);
    const t = setTimeout(() => {
        const TICK_MS = 250;
        const step = AUTOMIX_RATE_RAMP_PER_SEC * (TICK_MS / 1000);
        const iv = setInterval(() => {
            const st = useAudioStore.getState().activeClips[clipId];
            const pl = st?.player;
            if (!st || !pl?.getPlaybackRate || !pl.setPlaybackRate) { clearRateRamp(clipId); return; }
            const r = pl.getPlaybackRate();
            if (Math.abs(r - 1) <= step) {
                pl.setPlaybackRate(1);
                clearRateRamp(clipId);
                debugLog(`Automix: rate rientrato a 1.0 per ${st.clip.name}`, 'event');
                return;
            }
            pl.setPlaybackRate(r > 1 ? r - step : r + step);
        }, TICK_MS);
        _rateRampTimers.set(clipId, iv);
    }, delayMs);
    _rateRampTimers.set(clipId, t);
};

// GR-02 Fix: Mappa run-ID per evitare race condition in playClip.
// Ogni invocazione di playClip genera un UUID unico per clipId;
// se al ritorno dell'await load() il run-ID non corrisponde più,
// l'operazione è obsoleta (superata da un play successivo) e viene scartata.
// v1.4.9 (#3): stopClip/stopAll INVALIDANO le entry — prima un load in volo
// sopravviveva allo stop (Emergency Stop incluso) e l'audio partiva DOPO.
const playRunIds = new Map<string, string>();

// v1.4.9 (#3): i setTimeout del sequencer (avvio next/inserto/ripresa, 20ms) vanno
// tracciati e cancellati da stopAll — sopravvivevano all'Emergency Stop facendo
// partire la clip successiva subito dopo lo stop.
const _sequencerTimeouts = new Set<ReturnType<typeof setTimeout>>();
const scheduleSequencerPlay = (fn: () => void, delay = 20): void => {
    const h = setTimeout(() => { _sequencerTimeouts.delete(h); fn(); }, delay);
    _sequencerTimeouts.add(h);
};

// v1.4.10 (#17): preload della clip successiva. Il "gapless" caricava la next da disco
// SOLO al momento della transizione (await canplaythrough): su file grossi o storage
// lento il gap era udibile. Si tiene UN solo player precaricato (il sequenziale della
// clip in onda); playClip lo riusa se id+path corrispondono, altrimenti lo scarta.
let _preloadedNext: { clipId: string; path: string; player: IAudioPlayer } | null = null;
const discardPreloadedNext = (): void => {
    if (_preloadedNext) {
        _preloadedNext.player.cleanup();
        _preloadedNext = null;
    }
};
const preloadNextClip = async (currentClipId: string): Promise<void> => {
    const next = getNextClipInColumn(currentClipId);
    if (!next || next.isMissing || !next.path) return;
    if (_preloadedNext?.clipId === next.id && _preloadedNext.path === next.path) return;
    discardPreloadedNext();
    const p: IAudioPlayer = new StreamPlayer();
    try {
        await p.load(next.path);
        _preloadedNext = { clipId: next.id, path: next.path, player: p };
        debugLog(`AudioStore: Preload next ${next.name}`, 'info');
    } catch {
        p.cleanup(); // non fatale: al play si caricherà normalmente
    }
};

// v0.13.2 — Transition System
// Clip in fade-out per transizione: gestito come stato Zustand (v0.14.9)
// Esposto come fadingClipIds[] per permettere a ClipCard di mostrare il badge "FADING OUT".

// Durata fadeIn da applicare alla PROSSIMA clip avviata come parte di un crossfade.
// Viene letta una sola volta da playClip e poi azzerata (pattern one-shot).
let pendingCrossfadeFadeIn: number | null = null;

// v0.17.0 — Smart Mic: stato globale microfono, aggiornato da setMicActive().
// Variabile module-level (come pendingCrossfadeFadeIn) per essere accessibile
// da evaluateMix() che è definita fuori dal create() callback.
let _isMicActiveGlobal = false;

// === v1.3.21 — Rotazione PRE-SHOW (Jingle&Promo) — stato runtime (NON persistito) ===
// Filosofia: NON è automazione dello show (vedi docs/VISION.md). Vive solo nella
// PRE-SHOW: ogni X brani si inserisce a caso un jingle, ogni Y un promo, a fine
// brano seguendo le transizioni esistenti, mai sovrapposti. Gli intervalli sono
// persistiti su col-preshow.rotation; i contatori invece sono runtime (ripartono
// a ogni stopAll). Il jingle/promo lanciato da solo resta un normale asset.
let _jingleRotationCounter = 0;
let _promoRotationCounter = 0;
let _lastJingleId: string | null = null; // anti-repeat immediato
let _lastPromoId: string | null = null;
// Decisione di rotazione memoizzata per clip-sorgente PRE-SHOW. onPreEnd e il
// fallback di onEnded possono entrambi risolvere il "prossimo" per la stessa clip:
// la memo garantisce decisione unica (niente doppio incremento contatori né scelta
// random divergente). value=null → nessun inserto, prosegue la sequenza.
const _rotationDecisions = new Map<string, { inserts: AudioClip[]; resumeClipId: string } | null>();
// Coda inserti rimanenti dopo quello attualmente in onda + brano di ripresa playlist.
let _pendingInserts: AudioClip[] = [];
let _pendingResumeClipId: string | null = null;
let _activeInsertId: string | null = null; // id dell'inserto jingle/promo ora in onda
// v1.4.8 (#24): id del brano PRE-SHOW che ha originato l'inserto. Se la clip di
// ripresa viene cancellata durante l'inserto, il fallback è il sequenziale del
// sorgente (posizionale: con la clip rimossa, il next del sorgente è quella dopo).
let _pendingResumeSourceId: string | null = null;

// v1.4.8 (#10): clip-sorgente la cui transizione è GIÀ stata eseguita da
// onPreEnd/onOutroReached. Il fallback onEnded non deve rilanciare il next:
// se il next (inserto o brano corto) è più breve della coda di crossfade del
// sorgente, al suo termine risultava "non attivo" e veniva suonato DUE volte.
const _transitionFiredFor = new Set<string>();

/** v1.4.8 (#4/#11/#12): azzera lo stato inserto/ripresa pendente (non i contatori). */
const clearPendingInsertState = (reason: string): void => {
    if (_activeInsertId || _pendingResumeClipId || _pendingInserts.length > 0) {
        debugLog(`AudioStore: rotazione PRE-SHOW — stato inserto/ripresa azzerato (${reason})`, 'info');
    }
    _activeInsertId = null;
    _pendingInserts = [];
    _pendingResumeClipId = null;
    _pendingResumeSourceId = null;
};

/**
 * v1.4.8 (#2 rotazione): l'inserto deciso da resolvePreshowNext non è riuscito a
 * partire (file sparito dopo l'integrity check, load fallito). Senza recupero la
 * PRE-SHOW restava in silenzio con stato stale ("ghost resume" al successivo lancio
 * manuale della stessa clip). Drena la coda inserti o riprende la playlist.
 */
const recoverFromInsertFailure = (clipId: string): void => {
    if (_activeInsertId !== clipId) return;
    const queuedInserts = [..._pendingInserts];
    const resumeId = _pendingResumeClipId;
    const sourceId = _pendingResumeSourceId;
    clearPendingInsertState('inserto non riproducibile');
    while (queuedInserts.length > 0) {
        const cand = queuedInserts.shift()!;
        const freshCand = getFreshClipById(cand.id) ?? cand;
        if (freshCand.isMissing) continue;
        _activeInsertId = freshCand.id;
        _pendingInserts = queuedInserts;
        _pendingResumeClipId = resumeId;
        _pendingResumeSourceId = sourceId;
        debugLog(`AudioStore: Rotazione → inserto di riserva ${freshCand.name}`, 'event');
        scheduleSequencerPlay(() => useAudioStore.getState().playClip(freshCand, undefined, { machine: true }));
        return;
    }
    if (resumeId) {
        const resumeClip = getFreshClipById(resumeId);
        const target = (resumeClip && !resumeClip.isMissing)
            ? resumeClip
            : (sourceId ? getNextClipInColumn(sourceId) : null);
        if (target) {
            debugLog(`AudioStore: Rotazione → ripresa PRE-SHOW dopo inserto fallito: ${target.name}`, 'event');
            scheduleSequencerPlay(() => useAudioStore.getState().playClip(target, undefined, { machine: true }));
        } else {
            debugLog('AudioStore: Rotazione — nessuna clip di ripresa dopo inserto fallito', 'error');
        }
    }
};

/** Reset completo dello stato di rotazione (chiamato da stopAll). */
export const resetPreshowRotation = (): void => {
    _jingleRotationCounter = 0;
    _promoRotationCounter = 0;
    _rotationDecisions.clear();
    _pendingInserts = [];
    _pendingResumeClipId = null;
    _activeInsertId = null;
    _pendingResumeSourceId = null;
    // _lastJingleId/_lastPromoId non azzerati: l'anti-repeat può sopravvivere a uno stop.
};

/** Pesca a caso una clip dalla colonna indicata, evitando l'ultima usata (anti-repeat). */
export const pickRandomFromColumn = (colId: string, lastId: string | null): AudioClip | null => {
    const col = useProjectStore.getState().columns.find((c) => c.id === colId);
    if (!col || col.clips.length === 0) return null;
    // v1.4.8 (#13): escludi anche le clip ATTUALMENTE in onda — se la rotazione
    // pescava un jingle che l'operatore stava già suonando, playClip lo interpretava
    // come toggle-stop e lo troncava di colpo.
    const activeNow = useAudioStore.getState().activeClips;
    const candidates = col.clips.filter((c) => !c.isMissing && !activeNow[c.id]);
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    const pool = candidates.filter((c) => c.id !== lastId);
    const arr = pool.length > 0 ? pool : candidates;
    return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Decide il prossimo clip nella sequenza PRE-SHOW: il successivo sequenziale, oppure
 * (se scatta la rotazione) il primo inserto jingle/promo. La decisione è memoizzata
 * per clipId-sorgente così i due end-path restano coerenti. Imposta una sola volta lo
 * stato di coda/ripresa quando ci sono inserti. Per colonne ≠ PRE-SHOW ritorna il
 * sequenziale senza effetti collaterali.
 */
export const resolvePreshowNext = (currentClip: AudioClip, colId: string | null): AudioClip | null => {
    const sequentialNext = getNextClipInColumn(currentClip.id);
    if (colId !== 'col-preshow') return sequentialNext;

    // Non applicare rotazione durante la Preview Transizione (test, non on-air reale).
    if (useAudioStore.getState().previewingClipIds.includes(currentClip.id)) return sequentialNext;

    if (_rotationDecisions.has(currentClip.id)) {
        const d = _rotationDecisions.get(currentClip.id);
        return d ? d.inserts[0] : sequentialNext;
    }

    const preshowCol = useProjectStore.getState().columns.find((c) => c.id === 'col-preshow');
    const rot = preshowCol?.rotation;
    // Senza config o senza brano di ripresa (fine lista) non si inserisce nulla.
    if (!rot || !sequentialNext) {
        _rotationDecisions.set(currentClip.id, null);
        return sequentialNext;
    }

    const inserts: AudioClip[] = [];
    if (rot.jingleEnabled && rot.jingleEvery > 0) {
        _jingleRotationCounter++;
        if (_jingleRotationCounter >= rot.jingleEvery) {
            // v1.4.8 (#23): il contatore si azzera SOLO a pesca riuscita. Se la colonna
            // è vuota/tutta mancante lo slot resta "maturo" e si ritenta al prossimo
            // brano (prima: slot bruciato → "ogni 4" diventava silenziosamente "ogni 8").
            const j = pickRandomFromColumn('col-jingle', _lastJingleId);
            if (j) { _jingleRotationCounter = 0; inserts.push(j); _lastJingleId = j.id; }
        }
    }
    if (rot.promoEnabled && rot.promoEvery > 0) {
        _promoRotationCounter++;
        if (_promoRotationCounter >= rot.promoEvery) {
            const p = pickRandomFromColumn('col-promo', _lastPromoId);
            if (p) { _promoRotationCounter = 0; inserts.push(p); _lastPromoId = p.id; }
        }
    }

    if (inserts.length > 0) {
        _rotationDecisions.set(currentClip.id, { inserts, resumeClipId: sequentialNext.id });
        // Stato coda/ripresa impostato UNA volta (la memo evita la doppia entrata).
        _activeInsertId = inserts[0].id;
        _pendingInserts = inserts.slice(1);
        _pendingResumeClipId = sequentialNext.id;
        _pendingResumeSourceId = currentClip.id; // v1.4.8 (#24): per il fallback di ripresa
        debugLog(`AudioStore: Rotazione PRE-SHOW → ${inserts.map((c) => c.name).join(' + ')} prima di ${sequentialNext.name}`, 'event');
        return inserts[0];
    }
    _rotationDecisions.set(currentClip.id, null);
    return sequentialNext;
};

// GR-01 Fix: flag module-level che garantisce un solo interval attivo,
// anche con React 18 StrictMode (double-invoke in dev) o hot reload multipli.
let _progressLoopStarted = false;
// v1.2.27 (NEW-LI-03): handle al loop globale per consentire teardown deterministico
// in scenari di test/E2E (Vitest, Playwright) — vedi `destroyAudioStoreLoop()`.
let _progressLoopHandle: ReturnType<typeof setInterval> | null = null;

/** v1.2.27 (NEW-LI-03): teardown esplicito del loop di progress globale.
 *  Usato dai test e dall'unmount finale di App.tsx (idempotente). */
export function destroyAudioStoreLoop(): void {
    if (_progressLoopHandle !== null) {
        clearInterval(_progressLoopHandle);
        _progressLoopHandle = null;
    }
    _progressLoopStarted = false;
}

// ME-07 Fix: cache module-level per i parametri ducking di useSettingsStore.
// evaluateMix() è definita fuori da create() — non può usare hooks né chiamare
// getState() ad ogni invocazione. Subscribe aggiorna i valori ad ogni cambio settings.
let _duckingFactor = useSettingsStore.getState().duckingFactor;
let _duckingDuration = useSettingsStore.getState().duckingDuration;
useSettingsStore.subscribe((state) => {
    _duckingFactor = state.duckingFactor;
    _duckingDuration = state.duckingDuration;
});

export const useAudioStore = create<AudioStore>((set, get) => {

    // GR-01 Fix: avvia il loop di progresso una sola volta per lifetime del modulo.
    if (!_progressLoopStarted) {
        _progressLoopStarted = true;
        _progressLoopHandle = setInterval(() => {
            if (Object.keys(get().activeClips).length > 0) {
                get()._syncProgress();
            }
        }, 100);
    }

    return {
        activeClips: {},
        suppressedClips: {},
        onAirStartTime: null,
        fadingClipIds: [],
        previewingClipIds: [],
        isMicActive: false,
        playoutLog: [],
        clearPlayoutLog: () => set({ playoutLog: [] }),

        playClip: async (clipArg: AudioClip, velocityGain?: number, opts?: { machine?: boolean }) => {
            const currentStore = get();

            // v1.4.6 (#15): consumo one-shot dell'override fadeIn del crossfade QUI,
            // prima di qualunque early-return (file mancante / toggle-stop). Se questo
            // lancio abortisce, l'override NON deve restare armato: la prossima clip
            // qualsiasi (anche di un'altra colonna) partirebbe quasi muta con un
            // fade-in di crossfadeDuration mai richiesto.
            const fadeInOverride = pendingCrossfadeFadeIn;
            pendingCrossfadeFadeIn = null;

            // v1.3.21: una nuova riproduzione di questa clip invalida una eventuale
            // decisione di rotazione memoizzata su di essa (al replay i contatori vanno
            // rivalutati). Entro una singola transizione di fine brano la memo resta.
            _rotationDecisions.delete(clipArg.id);
            // v1.4.8 (#10): idem per il marcatore "transizione già eseguita".
            _transitionFiredFor.delete(clipArg.id);

            // FRESH DATA FETCH
            const { columns } = useProjectStore.getState();
            const freshClip = columns.flatMap(col => col.clips).find(c => c.id === clipArg.id) || clipArg;
            const columnId = getColumnForClip(freshClip.id);

            // v1.4.3 — Omologazione loudness: misura lazy (fire-and-forget) se non ancora fatta.
            // La riproduzione corrente usa il valore già cachato (1.0 se assente); le successive
            // usano la misura. Self-healing anche per clip caricate da .lmp vecchi.
            void ensureLoudnessMeasured(freshClip);
            const loudnessGain = computeLoudnessGain(freshClip);

            // MIDI velocity scaling + omologazione loudness: scala il volume senza toccare lo store
            const baseVolume = velocityGain !== undefined
                ? freshClip.volume * velocityGain
                : freshClip.volume;
            const effectiveVolume = Math.max(0, Math.min(1.5, baseVolume * loudnessGain));
            const effectiveClip = effectiveVolume !== freshClip.volume
                ? { ...freshClip, volume: effectiveVolume }
                : freshClip;

            // Integrity Guard (v0.14.2): blocca playback per file mancanti
            if (freshClip.isMissing) {
                debugLog(`AudioStore: PlayClip bloccato — file mancante: ${freshClip.path}`, 'error');
                // v1.4.8 (#2 rotazione): se era l'inserto deciso dalla rotazione,
                // recupera (prossimo inserto in coda o ripresa playlist).
                recoverFromInsertFailure(freshClip.id);
                return;
            }

            // v1.2.23 (NEW-ME-02): se la clip è già attiva, comportati come "toggle stop"
            // e ritorna SUBITO, prima della conflict resolution di colonna. Senza questo
            // check anticipato, una chiamata doppia (doppio-click o MIDI Note duplicata)
            // fermava prima le clip in conflitto della colonna, lasciandola silenziosa.
            if (currentStore.activeClips[freshClip.id]) {
                debugLog(`AudioStore: PlayClip toggle-stop su ${freshClip.name} (già attiva)`, 'info');
                currentStore.stopClip(freshClip.id);
                return;
            }

            // v1.4.9 (#21): la clip non è ancora attiva ma ha un load IN VOLO (primo
            // click/hotkey/MIDI di pochi istanti fa): il secondo gesto OPERATORE annulla
            // il lancio. Prima veniva di fatto ignorato (il primo run veniva scartato dal
            // run-ID ma il secondo partiva comunque) — l'operatore che premeva due volte
            // per annullare se la ritrovava in onda. I lanci macchina (transizioni,
            // rotazione) NON annullano: sostituiscono il run come prima.
            if (!opts?.machine && playRunIds.has(freshClip.id)) {
                playRunIds.delete(freshClip.id);
                debugLog(`AudioStore: PlayClip annullato durante il caricamento di ${freshClip.name}`, 'info');
                return;
            }

            debugLog(`AudioStore: PlayClip ${freshClip.name} (Next: ${freshClip.nextAction}, Behavior: ${freshClip.behavior})`, 'event');

            // v1.4.14 (#1/#5) — rivisto 2026-06-30: TAKE-OVER. Un asset/jingle/spot NON
            // in loop, lanciato a mano dall'operatore, ha priorità su TUTTO: ferma di
            // colpo (nessuna dissolvenza) ogni clip in onda, poi prende il posto a
            // volume pieno.
            // ECCEZIONI che SOPRAVVIVONO al take-over:
            //  - la colonna FX (col-sfx) — sempre;
            //  - i SOTTOFONDI in LOOP, MA SOLO se il take-over arriva da JINGLE/PROMO:
            //    un jingle/spot NON ferma il bed, lo ABBASSA a zero (regola di mix A3) e
            //    il bed torna con rialzo sfumato a fine jingle. Invece lo SHOW ASSET
            //    (col-assets = "sigla finale") FERMA il loop, perché è l'azione con cui
            //    l'operatore chiude davvero il sottofondo (decisione 2026-06-30).
            //  - (la clip stessa, ovviamente, non si ferma).
            // Distinzioni volute:
            //  - solo NON-loop scatena il take-over (avviare un bed in loop non azzera
            //    la regia: è un sottofondo che si appoggia a ciò che è già in onda);
            //  - solo gesti OPERATORE (!machine): rotazione PRE-SHOW e transizioni
            //    play_next continuano a usare le loro regole (in rotazione PRE-SHOW
            //    tutto funziona normalmente: un inserto jingle rientra nella playlist);
            //  - col-jingle e col-promo (= "SPOT") seguono la stessa regola dei jingle.
            const isTakeover = !opts?.machine
                && (columnId === 'col-assets' || columnId === 'col-jingle' || columnId === 'col-promo')
                && !freshClip.isLooping;
            const isAssetSigla = columnId === 'col-assets'; // la sigla che chiude il loop
            if (isTakeover) {
                Object.values(currentStore.activeClips).forEach(ac => {
                    if (ac.clip.id === freshClip.id) return;
                    if (getColumnForClip(ac.clip.id) === 'col-sfx') return; // FX = sempre esente
                    // jingle/promo NON fermano i sottofondi in loop: li abbassa il mix (A3)
                    // e tornano a fine jingle. Solo lo SHOW ASSET (sigla finale) li chiude.
                    if (!isAssetSigla) {
                        const liveLoop = getFreshClipById(ac.clip.id)?.isLooping ?? ac.clip.isLooping;
                        if (liveLoop) return;
                    }
                    get().stopClip(ac.clip.id);
                });
                discardPreloadedNext();     // soundscape azzerato: il preload non serve più
                resetPreshowRotation();     // l'operatore prende il comando
            }

            // PRE-SHOW LOGIC: Stop Pre-Show if starting Show Assets
            if (!isTakeover && columnId === 'col-assets') {
                const preShowClips = Object.values(currentStore.activeClips).filter(ac =>
                    getColumnForClip(ac.clip.id) === 'col-preshow'
                );
                if (preShowClips.length > 0) {
                    debugLog('AudioStore: Automatically stopping Pre-Show for Show Asset', 'info');
                    // G7 Fix: usa get() invece di currentStore (riferimento potenzialmente stale)
                    preShowClips.forEach(ac => get().stopClip(ac.clip.id));
                }
                // v1.3.21: l'operatore prende il comando dello show → annulla qualsiasi
                // ripresa rotazione pendente (un eventuale inserto jingle/promo ancora in
                // onda finirà senza far ripartire la PRE-SHOW sotto lo show).
                resetPreshowRotation();
            }

            // v1.4.8 (#12): lancio MANUALE di una clip PRE-SHOW mentre un inserto della
            // rotazione è in onda → l'operatore sceglie il punto della playlist: l'inserto
            // viene fermato e la ripresa pendente annullata (lo stop dell'inserto azzera
            // lo stato — vedi stopClip). Prima l'inserto continuava sopra la clip scelta
            // e a fine inserto la macchina la fermava per riprendere la sequenza vecchia.
            // Nota: i lanci macchina (inserto successivo/ripresa) avvengono solo quando
            // _activeInsertId è già stato gestito, quindi qui è sempre un gesto operatore.
            if (columnId === 'col-preshow' && _activeInsertId && _activeInsertId !== freshClip.id) {
                debugLog('AudioStore: lancio manuale PRE-SHOW durante inserto rotazione — inserto fermato', 'info');
                get().stopClip(_activeInsertId);
            }

            // v1.4.8 (#11): lanciare musica o voce = lo show prende il comando. Una
            // ripresa PRE-SHOW pendente non deve più scattare sotto lo show (prima solo
            // col-assets la annullava). SFX e jingle/promo manuali NON annullano
            // (compatibili col riempitivo PRE-SHOW). L'eventuale inserto ancora in onda
            // finisce senza ripresa (con musica attiva viene comunque azzerato dalla
            // Music Dominance di evaluateMix).
            if (columnId === 'col-music' || columnId === 'col-voice') {
                clearPendingInsertState(`lancio manuale da ${columnId}`);
            }

            // Handle Intra-Column Conflict
            // v1.4.14 (#1/#5): saltato sotto take-over — ha già fermato tutto tranne FX.
            // 2026-06-30: la colonna SFX/CARTWALL è ESENTE dal conflitto intra-colonna →
            // POLIFONIA. Più effetti possono suonare insieme (applauso + risata + stinger):
            // lanciare un secondo SFX non ferma più il primo. Decisione operatore.
            if (!isTakeover && columnId && columnId !== 'col-sfx') {
                // Find active clips in same column
                const sameColumnClips = Object.values(currentStore.activeClips).filter(ac => {
                    const acColId = getColumnForClip(ac.clip.id);
                    return acColId === columnId && ac.clip.id !== freshClip.id;
                });

                if (freshClip.behavior === 'stacco') {
                    // DUCK existing clips, don't stop them
                    sameColumnClips.forEach(ac => {
                        debugLog(`AudioStore: Suppressing ${ac.clip.name} for Stacco`, 'info');
                        // Store original volume if not already suppressed
                        const isAlreadySuppressed = currentStore.suppressedClips[ac.clip.id] !== undefined;
                        if (!isAlreadySuppressed) {
                            set(state => ({
                                suppressedClips: { ...state.suppressedClips, [ac.clip.id]: ac.clip.volume }
                            }));
                        }
                        ac.player.fadeTo(0, AUDIO_CONST.STACCO_FADE_DURATION); // Fast fade to silence
                    });
                } else {
                    // NORMAL behavior: Stop others in same column.
                    // v0.13.2: le clip in transizione (crossfade/segue) vengono saltate —
                    // il loro fade-out e stopClip sono già schedulati dal transition handler.
                    sameColumnClips
                        .filter(ac => !get().fadingClipIds.includes(ac.clip.id))
                        .forEach(ac => {
                            currentStore.stopClip(ac.clip.id);
                        });
                }
            }

            // GR-02 Fix: registra run-ID univoco prima del load asincrono.
            // v1.2.27 (NEW-LI-04): crypto.randomUUID per evitare collisioni rare su sessioni lunghe
            const runId = crypto.randomUUID();
            playRunIds.set(freshClip.id, runId);

            // v1.4.10 (#17): riusa il player precaricato se è proprio questa clip
            // (gapless senza buco di I/O). Altrimenti player nuovo come sempre.
            let usedPreload = false;
            let player: IAudioPlayer;
            if (_preloadedNext && _preloadedNext.clipId === freshClip.id && _preloadedNext.path === freshClip.path) {
                player = _preloadedNext.player;
                _preloadedNext = null;
                usedPreload = true;
                debugLog(`AudioStore: Avvio da preload per ${freshClip.name}`, 'info');
            } else {
                player = new StreamPlayer();
            }

            try {
                // Audio Routing
                const targetBus = getBusForType(freshClip.type);
                player.setBus(targetBus);

                // Apply Settings
                // v0.13.2: se è stato richiesto un crossfade, sovrascriamo il fadeIn
                // della clip entrante con la durata del crossfade (one-shot, consumato
                // in cima a playClip — v1.4.6 #15).
                player.updateSettings(
                    fadeInOverride !== null
                        ? { ...effectiveClip, fadeIn: fadeInOverride }
                        : effectiveClip
                );

                // v0.13.2 — Helper per applicare la transizione corretta tra clip in sequenza.
                // Legge il tipo di transizione dalla clip corrente (override) o dal default globale.
                const applyTransitionAndPlayNext = (clipId: string) => {
                    // Live-edit: leggi nextAction/transitionType dal project store (valore corrente),
                    // con fallback allo snapshot dell'active clip se non più presente nel progetto.
                    const currentClip = getFreshClipById(clipId) ?? get().activeClips[clipId]?.clip;
                    if (!currentClip || currentClip.nextAction !== 'play_next') return;

                    // v1.3.21: in PRE-SHOW il "prossimo" può essere un inserto jingle/promo
                    // (rotazione). resolvePreshowNext è la stessa decisione usata dal fallback
                    // di onEnded (memoizzata per coerenza). Fuori dalla PRE-SHOW = sequenziale.
                    const colId = getColumnForClip(currentClip.id);
                    const nextClip = resolvePreshowNext(currentClip, colId);
                    if (!nextClip) return;

                    // v1.4.7 (#5): se la clip successiva è GIÀ in onda (lanciata a mano
                    // dall'operatore, o in loop), NON chiamare playClip: il toggle-stop
                    // la spegnerebbe → dead air totale. La clip corrente finisce con la
                    // sua fine naturale (il suo fade interno è già armato dal player).
                    // v1.4.8 (#10): la transizione è comunque considerata GESTITA — il
                    // fallback onEnded non deve rilanciare il next (se nel frattempo
                    // fosse finito, verrebbe suonato di nuovo a sorpresa).
                    if (get().activeClips[nextClip.id]) {
                        debugLog(`AudioStore: Transizione saltata — ${nextClip.name} è già in onda`, 'info');
                        _transitionFiredFor.add(clipId);
                        return;
                    }

                    // v0.16.5: se la clip corrente è in preview, anche la clip successiva
                    // viene tracciata come preview (hasPlayed non deve essere settato).
                    if (get().previewingClipIds.includes(clipId)) {
                        set(state => ({ previewingClipIds: [...state.previewingClipIds, nextClip.id] }));
                    }

                    const { crossfadeDuration, segueDuration } = useSettingsStore.getState();
                    // v1.4.7 (#7/#8): risoluzione centralizzata (gestisce anche la stringa
                    // 'default' dei .lmp pre-1.4.7 e il fallback fuori PRE-SHOW).
                    const effectiveType = resolveTransitionType(currentClip, colId);

                    debugLog(`AudioStore: Transition [${effectiveType}] ${currentClip.name} → ${nextClip.name}`, 'event');

                    // v1.4.8 (#10): transizione eseguita QUI — il fallback onEnded di questa
                    // clip non deve rilanciare il next. Senza questo marcatore, un next più
                    // corto della coda di crossfade del sorgente (jingle 3s con crossfade 5s)
                    // risultava "non più attivo" all'onEnded del sorgente e veniva suonato
                    // una SECONDA volta sopra la clip di ripresa.
                    _transitionFiredFor.add(clipId);

                    if (effectiveType === 'crossfade') {
                        const currentPlayer = get().activeClips[clipId]?.player;
                        if (currentPlayer) {
                            set(state => ({ fadingClipIds: [...state.fadingClipIds, clipId] }));
                            currentPlayer.fadeTo(0, crossfadeDuration);
                            clearTransitionTimeout(clipId);
                            _transitionTimeouts.set(clipId, setTimeout(() => {
                                _transitionTimeouts.delete(clipId);
                                get().stopClip(clipId);
                                set(state => ({ fadingClipIds: state.fadingClipIds.filter(id => id !== clipId) }));
                            }, crossfadeDuration + 200));
                        }
                        // Imposta il fadeIn one-shot per la clip entrante
                        pendingCrossfadeFadeIn = crossfadeDuration;
                        get().playClip(nextClip, undefined, { machine: true });

                    } else if (effectiveType === 'segue') {
                        const currentPlayer = get().activeClips[clipId]?.player;
                        if (currentPlayer) {
                            set(state => ({ fadingClipIds: [...state.fadingClipIds, clipId] }));
                            // Segue usa la propria durata (fade-out rapido, entrante a pieno volume subito)
                            currentPlayer.fadeTo(0, segueDuration);
                            clearTransitionTimeout(clipId);
                            _transitionTimeouts.set(clipId, setTimeout(() => {
                                _transitionTimeouts.delete(clipId);
                                get().stopClip(clipId);
                                set(state => ({ fadingClipIds: state.fadingClipIds.filter(id => id !== clipId) }));
                            }, segueDuration + 200));
                        }
                        // La clip entrante parte subito a volume pieno (nessun fade-in forzato)
                        get().playClip(nextClip, undefined, { machine: true });

                    } else {
                        // gapless: comportamento esistente — la clip precedente viene fermata
                        // dalla conflict resolution di playClip in modo immediato.
                        get().playClip(nextClip, undefined, { machine: true });
                    }
                };

                // Sequencer Logic
                player.onPreEnd((clipId) => {
                    // v1.4.8 (#9): l'inserto della rotazione non segue MAI la propria
                    // play_next (una clip trascinata da PRE-SHOW a JINGLE conserva
                    // nextAction='play_next' — moveClip preserva i campi): senza guardia
                    // partiva ANCHE il jingle successivo della colonna, in doppio con la
                    // ripresa PRE-SHOW gestita da onEnded.
                    if (_activeInsertId === freshClip.id) return;
                    // Live-edit: legge il valore corrente di nextAction (l'operatore può averlo
                    // cambiato a clip già in esecuzione).
                    const live = getFreshClipById(freshClip.id) ?? freshClip;
                    // v1.4.11 (#27): il loop vince su play_next — la clip in loop non
                    // transiziona mai (prima la transizione partiva e il suo timeout
                    // uccideva il loop al secondo giro). Disattivando il loop in corsa
                    // la catena riprende alla fine del giro.
                    if (live.isLooping) return;
                    // Gapless: la clip termina naturalmente, onEnded gestirà il play_next
                    if (live.nextAction !== 'play_next') return;
                    // Se c'è un Outro Marker, onOutroReached gestirà la transizione
                    if ((live.outroMarker || 0) > 0) return;
                    applyTransitionAndPlayNext(clipId);
                });

                player.onIntroReached((clipId) => {
                    const clipName = get().activeClips[clipId]?.clip.name || 'Unknown';
                    debugLog(`🎤 Intro Ended for ${clipName} (Markers)`, 'event');
                });

                // v1.4.10 (#20): errore media a riproduzione in corso (drive scollegato,
                // file corrotto a metà). Prima: clip "zombie" in activeClips, catena
                // play_next ferma → dead air finché l'operatore non se ne accorgeva.
                // Ora: stop pulito + avanzamento alla prossima clip / recupero rotazione.
                player.onPlaybackError?.(() => {
                    // Errori in fase di load: gestiti dal reject di load() (catch sotto).
                    if (!get().activeClips[freshClip.id]) return;
                    debugLog(`AudioStore: Errore media su ${freshClip.name} in onda — stop e avanzamento`, 'error');

                    const wasActiveInsert = _activeInsertId === freshClip.id;
                    const queuedInserts = wasActiveInsert ? [..._pendingInserts] : [];
                    const queuedResumeId = wasActiveInsert ? _pendingResumeClipId : null;
                    const queuedSourceId = wasActiveInsert ? _pendingResumeSourceId : null;
                    const transitionAlreadyFired = _transitionFiredFor.delete(freshClip.id);

                    get().stopClip(freshClip.id);

                    if (wasActiveInsert) {
                        // ripristina lo stato catturato (stopClip lo ha azzerato) e usa
                        // il recupero standard della rotazione.
                        _activeInsertId = freshClip.id;
                        _pendingInserts = queuedInserts;
                        _pendingResumeClipId = queuedResumeId;
                        _pendingResumeSourceId = queuedSourceId;
                        recoverFromInsertFailure(freshClip.id);
                        return;
                    }
                    if (transitionAlreadyFired) return; // la next è già partita
                    const live = getFreshClipById(freshClip.id) ?? freshClip;
                    if (live.nextAction === 'play_next') {
                        const nextClip = resolvePreshowNext(live, getColumnForClip(freshClip.id));
                        if (nextClip && !get().activeClips[nextClip.id]) {
                            debugLog(`AudioStore: Avanzamento dopo errore → ${nextClip.name}`, 'event');
                            scheduleSequencerPlay(() => get().playClip(nextClip, undefined, { machine: true }));
                        }
                    }
                });

                player.onOutroReached((clipId) => {
                    // v1.4.8 (#9): guardia inserto — vedi onPreEnd.
                    if (_activeInsertId === freshClip.id) return;
                    // Live-edit: nextAction corrente dal project store.
                    const currentClip = getFreshClipById(freshClip.id) ?? get().activeClips[clipId]?.clip;
                    if (!currentClip) return;
                    // v1.4.11 (#27): il loop vince su play_next — vedi onPreEnd.
                    if (currentClip.isLooping) return;
                    debugLog(`🔊 Outro Reached for ${currentClip.name}`, 'info');
                    if (currentClip.nextAction === 'play_next') {
                        applyTransitionAndPlayNext(clipId);
                    }
                });

                player.onEnded(() => {
                    debugLog(`AudioStore: Ended ${freshClip.name}`, 'info');

                    // v1.4.8 (#4/#10): cattura lo stato di rotazione e il marcatore
                    // transizione PRIMA di stopClip — stopClip azzera lo stato inserto
                    // (è il comportamento corretto per gli stop manuali/takeover) e qui
                    // dobbiamo distinguere la FINE NATURALE, che invece deve riprendere.
                    const wasActiveInsert = _activeInsertId === freshClip.id;
                    const queuedInserts = wasActiveInsert ? [..._pendingInserts] : [];
                    const queuedResumeId = wasActiveInsert ? _pendingResumeClipId : null;
                    const queuedSourceId = wasActiveInsert ? _pendingResumeSourceId : null;
                    const transitionAlreadyFired = _transitionFiredFor.delete(freshClip.id);

                    get().stopClip(freshClip.id);

                    // v1.3.21: ripresa rotazione. Se la clip che è finita era l'inserto
                    // jingle/promo attualmente in onda, suona il prossimo inserto in coda
                    // (collisione jingle+promo) oppure riprende la playlist PRE-SHOW dal brano
                    // che era stato messo da parte. Ritorno alla musica gapless (taglio pulito).
                    if (wasActiveInsert) {
                        // v1.4.8 (#25): re-check della config — se l'operatore ha disattivato
                        // jingle/promo mentre la coda era pendente, gli inserti della
                        // categoria disattivata vengono saltati.
                        const rot = useProjectStore.getState().columns.find((c) => c.id === 'col-preshow')?.rotation;
                        while (queuedInserts.length > 0) {
                            const nextInsert = queuedInserts.shift()!;
                            const insCol = getColumnForClip(nextInsert.id);
                            const stillEnabled = insCol === 'col-jingle' ? !!rot?.jingleEnabled
                                : insCol === 'col-promo' ? !!rot?.promoEnabled
                                : true;
                            if (!stillEnabled) {
                                debugLog(`AudioStore: Rotazione — inserto ${nextInsert.name} saltato (categoria disattivata)`, 'info');
                                continue;
                            }
                            const freshInsert = getFreshClipById(nextInsert.id) ?? nextInsert;
                            if (freshInsert.isMissing) {
                                debugLog(`AudioStore: Rotazione — inserto ${nextInsert.name} saltato (file mancante)`, 'error');
                                continue;
                            }
                            _activeInsertId = freshInsert.id;
                            _pendingInserts = queuedInserts;
                            _pendingResumeClipId = queuedResumeId;
                            _pendingResumeSourceId = queuedSourceId;
                            debugLog(`AudioStore: Rotazione → inserto successivo ${freshInsert.name}`, 'event');
                            scheduleSequencerPlay(() => get().playClip(freshInsert, undefined, { machine: true }));
                            return;
                        }
                        if (queuedResumeId) {
                            const resumeClip = getFreshClipById(queuedResumeId);
                            // v1.4.8 (#24): clip di ripresa cancellata/mancante durante
                            // l'inserto → fallback al sequenziale del brano sorgente
                            // (posizionale: con la clip rimossa, il next del sorgente è
                            // ora la clip che la seguiva).
                            const target = (resumeClip && !resumeClip.isMissing)
                                ? resumeClip
                                : (queuedSourceId ? getNextClipInColumn(queuedSourceId) : null);
                            if (target) {
                                debugLog(`AudioStore: Rotazione → ripresa PRE-SHOW ${target.name}`, 'event');
                                scheduleSequencerPlay(() => get().playClip(target, undefined, { machine: true }));
                            } else {
                                debugLog('AudioStore: Rotazione — clip di ripresa non disponibile, playlist PRE-SHOW ferma', 'error');
                            }
                        }
                        return; // l'inserto non segue la logica play_next standard
                    }

                    // Live-edit: legge nextAction/transitionType correnti — se l'operatore ha
                    // cambiato la clip in corsa da 'stop' a 'play_next', la modifica vale comunque.
                    const live = getFreshClipById(freshClip.id) ?? freshClip;
                    if (live.nextAction === 'play_next') {
                        // v1.4.8 (#10): se onPreEnd/onOutroReached hanno GIÀ eseguito la
                        // transizione, questo fallback non deve rilanciare il next — con un
                        // next più corto della coda di crossfade risultava già terminato
                        // ("non attivo") e veniva suonato una seconda volta.
                        if (transitionAlreadyFired) {
                            debugLog(`AudioStore: Fallback onEnded saltato per ${freshClip.name} (transizione già eseguita)`, 'info');
                            return;
                        }
                        const transition = resolveTransitionType(live, getColumnForClip(freshClip.id));

                        // Gapless o Fallback: Se non è ancora partita la prossima clip, falla partire ora.
                        // v1.3.21: usa la stessa decisione di rotazione di onPreEnd (memoizzata) così,
                        // se la rotazione ha già avviato un inserto, qui non si avvia il brano sequenziale
                        // (doppio avvio) — la guardia isNextAlreadyActive lo riconosce come già attivo.
                        const colId = getColumnForClip(freshClip.id);
                        const nextClip = resolvePreshowNext(live, colId);
                        if (nextClip) {
                            const isNextAlreadyActive = Object.values(get().activeClips).some(ac => ac.clip.id === nextClip.id);
                            if (!isNextAlreadyActive) {
                                debugLog(`AudioStore: Sequencer Play Next (${transition} at End)`, 'event');
                                scheduleSequencerPlay(() => get().playClip(nextClip, undefined, { machine: true }));
                            }
                        }
                    }
                });

                // v1.4.10 (#17): se il player viene dal preload il file è già pronto.
                if (!usedPreload) {
                    await player.load(freshClip.path);
                }

                // GR-02 Fix: verifica che questa operazione di load sia ancora la più recente.
                // (v1.4.9 #3: vale anche per stop arrivati durante il load — entry rimossa.)
                if (playRunIds.get(freshClip.id) !== runId) {
                    debugLog(`AudioStore: Load obsoleto scartato per ${freshClip.name} (runId ${runId})`, 'info');
                    player.cleanup();
                    return;
                }

                // v0.14.10: imposta fadeOut dinamico per clip con play_next così onPreEnd scatta
                // al momento giusto per crossfade/segue (crossfadeDuration o segueDuration ms prima della fine).
                // v0.16.4: esteso a Music e Assets (rimosso guard type === 'preshow')
                // v1.4.7 (#8): il tipo di transizione è risolto con LO STESSO fallback di
                // applyTransitionAndPlayNext (prima qui si usava il default globale anche fuori
                // PRE-SHOW: fadeOut armato a crossfadeDuration ma transizione risolta gapless
                // → brano troncato di netto 2s prima della fine).
                // v1.4.7 (#26): senza una clip successiva il fadeOut di transizione non va
                // armato — l'ultima clip della catena finisce col suo finale naturale.
                // v1.4.11 (#27): idem per le clip in loop (il loop vince su play_next).
                if (freshClip.nextAction === 'play_next' && (freshClip.outroMarker || 0) <= 0
                    && !freshClip.isLooping
                    && getNextClipInColumn(freshClip.id)) {
                    const { crossfadeDuration, segueDuration } = useSettingsStore.getState();
                    const transType = resolveTransitionType(freshClip, columnId);
                    // v1.4.7: questo secondo updateSettings NON deve sovrascrivere il fadeIn
                    // one-shot del crossfade entrante (la maggior parte delle clip ha
                    // fadeIn: 0 esplicito che annullerebbe l'override).
                    const fadeInKeep = fadeInOverride !== null ? { fadeIn: fadeInOverride } : {};
                    if (transType === 'crossfade') {
                        player.updateSettings({ ...effectiveClip, ...fadeInKeep, fadeOut: crossfadeDuration });
                    } else if (transType === 'segue') {
                        player.updateSettings({ ...effectiveClip, ...fadeInKeep, fadeOut: segueDuration });
                    }
                }

                player.play();

                const logEntry: PlayoutLogEntry = {
                    id: crypto.randomUUID(), // v1.2.27 (NEW-LI-04)
                    clipId: freshClip.id,
                    clipName: freshClip.name,
                    artist: freshClip.artist,
                    title: freshClip.title,
                    clipType: freshClip.type,
                    startTime: Date.now(),
                };

                set((state) => {
                    // v0.14.5: avvia il timer On Air al primo play dopo idle
                    const wasIdle = Object.keys(state.activeClips).length === 0;
                    // v1.4.6 (#22): l'avvio di una clip ne annulla una eventuale
                    // soppressione da stacco precedente (non deve ripartire muta).
                    const newSuppressed = state.suppressedClips[freshClip.id] !== undefined
                        ? Object.fromEntries(Object.entries(state.suppressedClips).filter(([id]) => id !== freshClip.id))
                        : state.suppressedClips;
                    const newState = {
                        activeClips: {
                            ...state.activeClips,
                            [freshClip.id]: {
                                player,
                                isPlaying: true,
                                progress: 0,
                                clip: effectiveClip
                            }
                        },
                        suppressedClips: newSuppressed,
                        onAirStartTime: wasIdle ? Date.now() : state.onAirStartTime,
                        playoutLog: capPlayoutLog([...state.playoutLog, logEntry]),
                    };
                    // v1.4.6 (#1/#22): passa fading/suppressed correnti — dentro set()
                    // getState() vedrebbe lo stato precedente a questo update.
                    evaluateMix(newState.activeClips, freshClip.id, undefined, {
                        fadingClipIds: state.fadingClipIds,
                        suppressedClips: newSuppressed,
                    });
                    return newState;
                });

                // v1.4.10 (#17): precarica il sequenziale successivo (fire-and-forget).
                if (freshClip.nextAction === 'play_next') {
                    void preloadNextClip(freshClip.id);
                }

            } catch (error: unknown) {
                // Standardized L2 error handling
                const errorMsg = error instanceof Error ? error.message : String(error);
                debugLog(`AudioStore: Failed to play ${freshClip.name} - ${errorMsg}`, 'error');
                console.error("Failed to play clip:", freshClip, error);
                // v1.4.10 (#18): rilascia i nodi Web Audio del player fallito — prima
                // restavano connessi al grafo (accumulo su tentativi ripetuti).
                player.cleanup();
                // v1.4.8 (#2 rotazione): inserto fallito al load → recupero (coda/ripresa),
                // niente più PRE-SHOW in silenzio con stato stale.
                recoverFromInsertFailure(freshClip.id);
            }
        },

        loadClip: async (clip: AudioClip) => {
            let player: IAudioPlayer = new StreamPlayer();
            try {
                await player.load(clip.path);
                const duration = player.getDuration();
                // Silence detection for PRE-SHOW is handled via IPC in MainGrid.tsx (handleNativeDrop).
                // loadClip saves only the duration; trimStart/trimEnd come from the IPC result.
                const trimStart = clip.trimStart || 0;
                const trimEnd = clip.trimEnd || 0;

                // v0.16.4: estrai metadati ID3 (artist, title) se la clip è di tipo music
                let artist: string | undefined;
                let title: string | undefined;
                if (clip.type === 'music' && !clip.artist && !clip.title) {
                    try {
                        const meta = await window.electron.getAudioMetadata(clip.path);
                        if (meta.success && meta.data) {
                            const data = meta.data as Record<string, unknown>;
                            const tags = (data.common as Record<string, unknown>) || {};
                            if (typeof tags.artist === 'string' && tags.artist) artist = tags.artist;
                            if (typeof tags.title === 'string' && tags.title) title = tags.title;
                        }
                    } catch {
                        // non fatale: i tag ID3 sono opzionali
                    }
                }

                const { useProjectStore } = await import('./useProjectStore');
                useProjectStore.getState().updateClip(
                    clip.type === 'asset' ? 'col-assets' : `col-${clip.type}`,
                    clip.id,
                    { duration, trimStart, trimEnd, ...(artist !== undefined ? { artist } : {}), ...(title !== undefined ? { title } : {}) }
                );
                player.cleanup();
                // v1.4.3 — misura loudness in background per omologazione (non blocca l'aggiunta clip)
                void ensureLoudnessMeasured({ ...clip, loudnessLufs: undefined });
            } catch (e) {
                // Standardized error handling
                debugLog(`AudioStore: Failed to load metadata for ${clip.name}`, 'error');
                console.error("Failed to load clip metadata", clip.path, e);
                player.cleanup();
            }
        },

        playColumn: async (colIndex: number) => {
            const { columns } = useProjectStore.getState();
            if (colIndex < 0 || colIndex >= columns.length) return;

            const targetCol = columns[colIndex];
            const currentStore = get();

            // Find first available clip (not currently playing)
            // v1.4.10 (#19): salta anche le clip con file mancante — prima l'hotkey
            // colonna restava muta senza feedback se la prima clip libera era missing.
            const availableClip = targetCol.clips.find(clip => !clip.isMissing && !currentStore.activeClips[clip.id]);

            if (availableClip) {
                await get().playClip(availableClip);
            } else if (targetCol.clips.length > 0) {
                debugLog(`AudioStore: playColumn(${colIndex}) -> All clips in column are already playing`, 'info');
            }
        },

        updateOutputDevice: (deviceId: string) => {
            debugLog(`AudioStore: Update Audio Graph Output Device -> ${deviceId}`, 'info');
            // GR2/GR11 Fix: Il routing usa Web Audio API, cambiamo sinkId sul Context principale.
            AudioContextManager.getInstance().setOutputDevice(deviceId);
        },

        stopClip: (clipId: string) => {
            // GRAVE #6: annulla un eventuale timeout di transizione pendente per questa clip,
            // così un re-trigger non viene fermato dal vecchio crossfade/segue.
            clearTransitionTimeout(clipId);
            // v1.4.8 (#4): fermare l'inserto della rotazione (stop manuale, takeover,
            // conflict resolution) azzera lo stato pendente. Senza, restava un "ghost
            // resume": al successivo lancio manuale della stessa clip jingle, a fine clip
            // la vecchia PRE-SHOW ripartiva dal nulla sotto lo show. La fine NATURALE
            // dell'inserto resta gestita: onEnded cattura lo stato PRIMA di chiamare qui.
            if (_activeInsertId === clipId) {
                clearPendingInsertState('stop inserto');
            }
            // v1.4.9 (#3): invalida un eventuale load in volo per questa clip — al ritorno
            // dell'await load() il run-ID non corrisponde più e l'avvio viene scartato.
            // Prima lo stop NON toccava playRunIds: la clip partiva DOPO lo stop.
            playRunIds.delete(clipId);
            set((state) => {
                // v1.4.6 (#2): rimuovi SEMPRE la clip da fadingClipIds. Prima l'unica
                // pulizia era nel timeout di transizione, ma stopClip stesso lo cancella
                // (riga sopra): a ogni crossfade/segue completato naturalmente (onEnded →
                // stopClip arriva ~200ms PRIMA del timeout) l'id restava fantasma per
                // sempre → badge FADING permanente + conflict resolution che saltava la
                // clip al replay (doppio audio nella stessa colonna).
                const newFadingClipIds = state.fadingClipIds.includes(clipId)
                    ? state.fadingClipIds.filter(id => id !== clipId)
                    : state.fadingClipIds;
                const active = state.activeClips[clipId];
                if (active) {
                    active.player.stop();
                    active.player.cleanup();

                    const newActiveClips = { ...state.activeClips };
                    delete newActiveClips[clipId];

                    // G4 Fix: gestione di suppressedClips.
                    // Se la clip fermata era uno STACCO, svuotiamo completamente
                    // suppressedClips così evaluateMix può ripristinare liberamente
                    // i volumi di tutte le clip rimaste attive.
                    // Se era una clip normale soppressa, rimuoviamo solo la sua entry.
                    const wasStacco = active.clip.behavior === 'stacco';
                    const newSuppressedClips = wasStacco
                        ? {}
                        : Object.fromEntries(
                            Object.entries(state.suppressedClips).filter(([id]) => id !== clipId)
                        );

                    // v1.4.6 (#1/#22): passa lo stato POST-update — dentro set() getState()
                    // vedrebbe ancora la vecchia mappa suppressed/fading.
                    evaluateMix(newActiveClips, undefined, undefined, {
                        fadingClipIds: newFadingClipIds,
                        suppressedClips: newSuppressedClips,
                    });

                    // v0.14.12: marca come suonata le clip PRE-SHOW a fine riproduzione
                    // v0.16.5: skip se la clip era in modalità preview (non deve diventare grigia)
                    const isPreviewClip = state.previewingClipIds.includes(clipId);
                    if (active.clip.type === 'preshow' && !isPreviewClip) {
                        const colId = getColumnForClip(clipId);
                        if (colId) {
                            useProjectStore.getState().updateClip(colId, clipId, { hasPlayed: true });
                        }
                    }

                    const newPreviewingClipIds = state.previewingClipIds.filter(id => id !== clipId);

                    // Aggiorna endTime nell'ultima entry del log per questa clip
                    const now = Date.now();
                    const lastIdx = state.playoutLog.reduce((acc, e, i) =>
                        e.clipId === clipId && !e.endTime ? i : acc, -1);
                    const newPlayoutLog = lastIdx !== -1
                        ? state.playoutLog.map((e, i) => i === lastIdx ? { ...e, endTime: now } : e)
                        : state.playoutLog;

                    // v1.4.11 (#28): se non resta nulla in onda, azzera il timer ON AIR
                    // (prima continuava a contare nel silenzio dopo l'ultimo stop manuale;
                    // solo stopAll lo azzerava).
                    const newOnAirStartTime = Object.keys(newActiveClips).length === 0
                        ? null
                        : state.onAirStartTime;

                    return { activeClips: newActiveClips, suppressedClips: newSuppressedClips, previewingClipIds: newPreviewingClipIds, playoutLog: newPlayoutLog, fadingClipIds: newFadingClipIds, onAirStartTime: newOnAirStartTime };
                }
                // v1.4.6 (#2): anche se la clip non è (più) attiva, ripulisci un eventuale
                // residuo in fadingClipIds (stop arrivato dopo la fine naturale).
                if (newFadingClipIds !== state.fadingClipIds) {
                    return { ...state, fadingClipIds: newFadingClipIds };
                }
                return state;
            });
        },

        stopAll: () => {
            // GRAVE #6: annulla tutti i timeout di transizione pendenti.
            _transitionTimeouts.forEach(h => clearTimeout(h));
            _transitionTimeouts.clear();
            // v1.4.9 (#3): Emergency Stop totale — cancella i timeout del sequencer
            // (next/inserto/ripresa in partenza) e invalida TUTTI i load in volo.
            // Prima una clip in caricamento al momento dello stop partiva comunque
            // (es. la catena PRE-SHOW che ripartiva sotto la sigla).
            _sequencerTimeouts.forEach(h => clearTimeout(h));
            _sequencerTimeouts.clear();
            playRunIds.clear();
            // v1.4.10 (#17): scarta l'eventuale player precaricato.
            discardPreloadedNext();
            // v1.4.8 (#10): azzera i marcatori "transizione già eseguita".
            _transitionFiredFor.clear();
            // v1.3.21: azzera contatori/coda/decisioni di rotazione PRE-SHOW.
            resetPreshowRotation();
            set((state) => {
                Object.values(state.activeClips).forEach(ac => {
                    ac.player.stop();
                    ac.player.cleanup();
                });
                // Reset completo: mix, timer, preview e fading orphans
                return { activeClips: {}, suppressedClips: {}, onAirStartTime: null, fadingClipIds: [], previewingClipIds: [] };
            });
        },

        // v0.15.0 — Preview Transizione
        // Riproduce gli ultimi N secondi della clip corrente così la transizione
        // (crossfade/segue/gapless) scatta naturalmente, permettendo di testare
        // il punto di giunzione senza aspettare tutta la durata della canzone.
        // v0.16.5: traccia l'ID in previewingClipIds → hasPlayed non viene settato.
        previewTransition: async (clip: AudioClip) => {
            const nextClip = getNextClipInColumn(clip.id);
            if (!nextClip) return;

            const { crossfadeDuration, segueDuration } = useSettingsStore.getState();
            // v1.4.7 (#7/#8): la preview usa la STESSA risoluzione dell'on-air (prima una
            // clip con 'default' o fuori PRE-SHOW veniva previewata col default globale
            // ma in onda andava gapless).
            const transType = resolveTransitionType(clip, getColumnForClip(clip.id));

            // Quanti secondi prima della fine vogliamo far scattare la preview
            // (durata transizione + 3 secondi di ascolto pre-fade)
            const fadeSec = transType === 'crossfade' ? crossfadeDuration / 1000
                : transType === 'segue' ? segueDuration / 1000
                : 0;
            const previewLead = fadeSec + 3;

            const effectiveDuration = (clip.duration || 0) - (clip.trimEnd || 0);
            const seekTo = Math.max(clip.trimStart || 0, effectiveDuration - previewLead);

            // Marca il clip come "in preview" PRIMA di avviarlo
            set(state => ({
                previewingClipIds: state.previewingClipIds.includes(clip.id)
                    ? state.previewingClipIds
                    : [...state.previewingClipIds, clip.id]
            }));

            // Se già in play: seek diretto
            const alreadyActive = get().activeClips[clip.id];
            if (alreadyActive) {
                alreadyActive.player.seek(seekTo);
                return;
            }

            // Altrimenti: avvia la clip e poi seek appena il player è pronto
            await get().playClip(clip);
            // Piccolo delay per lasciar caricare il player prima del seek
            setTimeout(() => {
                const active = get().activeClips[clip.id];
                if (active) active.player.seek(seekTo);
            }, 200);
        },

        // v0.16.5 — Ferma tutti i clip attualmente in modalità preview
        stopPreviewTransition: (clipId: string) => {
            const { previewingClipIds, activeClips } = get();
            // Ferma la clip richiesta + tutte le clip in preview attualmente attive
            const toStop = previewingClipIds.filter(id => activeClips[id]);
            // Assicuriamoci di includere anche il clipId esplicitamente passato
            if (!toStop.includes(clipId) && activeClips[clipId]) toStop.push(clipId);

            toStop.forEach(id => get().stopClip(id));

            // Svuota completamente il set preview dopo lo stop
            set({ previewingClipIds: [] });
        },

        // v1.10.23 (Automix Fase C2) — transizione richiesta dal pulsantone della
        // Automix Section. ORCHESTRA le API esistenti (playClip/fadeTo/stopClip) e
        // le stesse strutture del crossfade play_next (fadingClipIds,
        // _transitionTimeouts, pendingCrossfadeFadeIn): il resto dell'app non
        // cambia comportamento. Il piano (beat-match o fallback classico) viene
        // dal motore puro planTransition (engine/automixEngine.ts, Fase B+D).
        automixTransition: async (fromClipId: string, toClipId: string) => {
            if (_automixInFlight) return { mode: 'skipped' as const, reason: i18n.t('automix.skipInFlight', 'transizione già in corso') };
            const fromState = get().activeClips[fromClipId];
            const toClip = getFreshClipById(toClipId);
            if (!fromState || !toClip || toClip.isMissing || get().activeClips[toClipId]) {
                return { mode: 'skipped' as const, reason: i18n.t('automix.skipInvalidState', 'stato non valido (uscente fermo, entrante già in onda o file mancante)') };
            }
            _automixInFlight = true;
            try {
                const fromClip = getFreshClipById(fromClipId) ?? fromState.clip;
                const fromPlayer = fromState.player;
                const positionSec = fromPlayer.getCurrentTime();
                const durationSec = fromPlayer.getDuration() || fromClip.duration || 0;

                const plan = planTransition({
                    outgoing: {
                        bpm: fromClip.bpm, beatOffsetSec: fromClip.beatOffsetSec, bpmConfidence: fromClip.bpmConfidence,
                        positionSec,
                        effectiveEndSec: durationSec > 0 ? durationSec - (fromClip.trimEnd || 0) : undefined
                    },
                    incoming: {
                        bpm: toClip.bpm, beatOffsetSec: toClip.beatOffsetSec, bpmConfidence: toClip.bpmConfidence,
                        trimStartSec: toClip.trimStart || 0
                    },
                    // Lead più largo del default: l'aggancio deve restare nel futuro anche
                    // dopo load()+play() dell'entrante (latenza assorbita poi dalla
                    // correzione di fase qui sotto).
                    options: { minLeadSec: 0.5 }
                });

                if (plan.mode === 'classic') {
                    // FALLBACK (Fase D): stessa sequenza del ramo crossfade di play_next.
                    const { crossfadeDuration } = useSettingsStore.getState();
                    debugLog(`Automix: TRANSIZIONE → crossfade classico (${plan.reason}) — ${fromClip.name} → ${toClip.name}, fade ${crossfadeDuration}ms`, 'event');
                    set(state => ({ fadingClipIds: [...state.fadingClipIds, fromClipId] }));
                    fromPlayer.fadeTo(0, crossfadeDuration);
                    clearTransitionTimeout(fromClipId);
                    _transitionTimeouts.set(fromClipId, setTimeout(() => {
                        _transitionTimeouts.delete(fromClipId);
                        get().stopClip(fromClipId);
                        set(state => ({ fadingClipIds: state.fadingClipIds.filter(id => id !== fromClipId) }));
                    }, crossfadeDuration + 200));
                    pendingCrossfadeFadeIn = crossfadeDuration;
                    await get().playClip(toClip, undefined, { machine: true });
                    return { mode: 'classic' as const, reason: plan.reason };
                }

                // BEAT-MATCH (piano B.1-B.5)
                const fadeMs = Math.round(plan.crossfadeSec * 1000);
                debugLog(`Automix: TRANSIZIONE beat-match — ${fromClip.name} → ${toClip.name} | rate ${plan.rate.toFixed(4)}, aggancio ${plan.anchorBeatSec.toFixed(3)}s, partenza entrante ${plan.incomingStartSec.toFixed(3)}s, fade ${fadeMs}ms`, 'event');

                // v1.10.26 (FIX "transizione secca", riscontro dev): l'uscente va marcato
                // in fadingClipIds PRIMA di playClip — la conflict resolution di colonna
                // dentro playClip FERMA di colpo le altre clip della stessa colonna e
                // salta SOLO quelle in fadingClipIds (v0.13.2). Con il marker messo dopo
                // (v1.10.23) l'uscente veniva stoppato all'istante: niente crossfade.
                // Il fade vero resta armato solo DOPO il successo di playClip: in caso
                // di partenza fallita si rimuove il marker e l'uscente prosegue intatto.
                set(state => ({ fadingClipIds: [...state.fadingClipIds, fromClipId] }));
                pendingCrossfadeFadeIn = fadeMs;
                await get().playClip(toClip, undefined, { machine: true });
                const toState = get().activeClips[toClipId];
                if (!toState) {
                    // Partenza fallita (load error ecc.): l'uscente resta in onda intatto —
                    // il fade non era ancora stato armato. MAI dead air per un tentativo di mix.
                    set(state => ({ fadingClipIds: state.fadingClipIds.filter(id => id !== fromClipId) }));
                    debugLog(`Automix: partenza di ${toClip.name} fallita — transizione annullata, uscente in onda`, 'error');
                    return { mode: 'skipped' as const, reason: i18n.t('automix.skipStartFailed', 'partenza entrante fallita') };
                }
                const toPlayer = toState.player;
                toPlayer.setPlaybackRate?.(plan.rate);

                // CORREZIONE DI FASE post-avvio: assorbe TUTTA la latenza reale di
                // load()+play() (decine-centinaia di ms, non schedulabile a priori).
                // Ora che entrambe suonano: quando l'uscente sarà su anchorBeatSec,
                // l'entrante deve trovarsi su incomingStartSec — da lì le griglie
                // restano agganciate dal rate. La seek avviene nei primissimi ms del
                // fade-in (volume ~0) → inudibile.
                const posOutNow = fromPlayer.getCurrentTime();
                let aligned = plan.incomingStartSec + (posOutNow - plan.anchorBeatSec) * plan.rate;
                // Mai posizioni negative: si avanza a beat INTERI dell'entrante
                // (griglia equivalente, l'aggancio di fase resta identico).
                const periodIn = 60 / (toClip.bpm as number);
                if (aligned < 0) aligned += Math.ceil(-aligned / periodIn) * periodIn;
                toPlayer.seek(aligned);

                // Crossfade: l'uscente scende in fadeMs da ORA (l'entrante sta già
                // salendo con il fade-in armato via pendingCrossfadeFadeIn) — rampe
                // simmetriche, stessa struttura del crossfade esistente. Il marker
                // fadingClipIds è già stato messo PRIMA di playClip (v1.10.26).
                fromPlayer.fadeTo(0, fadeMs);
                clearTransitionTimeout(fromClipId);
                _transitionTimeouts.set(fromClipId, setTimeout(() => {
                    _transitionTimeouts.delete(fromClipId);
                    get().stopClip(fromClipId);
                    set(state => ({ fadingClipIds: state.fadingClipIds.filter(id => id !== fromClipId) }));
                }, fadeMs + 200));

                // B.5: a uscente terminato, rientro graduale del rate a 1.0 (0.1%/s,
                // inudibile) così i mix successivi non accumulano scostamento.
                startRateRampBack(toClipId, fadeMs + 500);

                return { mode: 'beatmatched' as const };
            } finally {
                _automixInFlight = false;
            }
        },

        // v1.4.7 (#14): sync live delle impostazioni clip sul player in onda.
        // Chiamata dal salvataggio di ClipSettingsModal. Ricalcola il fadeOut dinamico
        // di transizione con la stessa logica del play (così un cambio gapless→crossfade
        // a clip in corsa arma il fade al momento giusto, e viceversa), riapplica
        // trim/marker e ricompone il volume effettivo (loudness inclusa).
        // Nota: l'eventuale scaling MIDI velocity del lancio originale non è ricostruibile
        // e viene perso — accettabile, il salvataggio esprime l'intenzione corrente.
        syncActiveClipSettings: (clipId: string) => {
            const active = get().activeClips[clipId];
            if (!active) return;
            // Le clip in fade-out di transizione non vanno riconfigurate (stop schedulato).
            if (get().fadingClipIds.includes(clipId)) return;
            const fresh = getFreshClipById(clipId);
            if (!fresh) return;
            const colId = getColumnForClip(clipId);

            const loudnessGain = computeLoudnessGain(fresh);
            const effectiveVolume = Math.max(0, Math.min(1.5, fresh.volume * loudnessGain));
            const effectiveClip = effectiveVolume !== fresh.volume
                ? { ...fresh, volume: effectiveVolume }
                : fresh;

            let dynFadeOut: number | undefined;
            if (fresh.nextAction === 'play_next' && (fresh.outroMarker || 0) <= 0
                && !fresh.isLooping // v1.4.11 (#27)
                && getNextClipInColumn(clipId)) {
                const { crossfadeDuration, segueDuration } = useSettingsStore.getState();
                const t = resolveTransitionType(fresh, colId);
                if (t === 'crossfade') dynFadeOut = crossfadeDuration;
                else if (t === 'segue') dynFadeOut = segueDuration;
            }
            active.player.updateSettings(
                dynFadeOut !== undefined ? { ...effectiveClip, fadeOut: dynFadeOut } : effectiveClip
            );
            debugLog(`AudioStore: Sync live settings su ${fresh.name} (fadeOut transizione: ${dynFadeOut ?? effectiveClip.fadeOut ?? 0}ms)`, 'info');

            set(state => {
                const cur = state.activeClips[clipId];
                if (!cur) return state;
                const newActive = { ...state.activeClips, [clipId]: { ...cur, clip: effectiveClip } };
                evaluateMix(newActive, undefined, undefined, {
                    fadingClipIds: state.fadingClipIds,
                    suppressedClips: state.suppressedClips,
                });
                return { activeClips: newActive };
            });
        },

        // v0.17.0 — Smart Mic: aggiorna lo stato mic e re-valuta il mix
        setMicActive: (active: boolean) => {
            _isMicActiveGlobal = active;
            set({ isMicActive: active });
            const { activeClips } = get();
            // Duck-down (mic attivo): ramp 60ms — deve sentirsi immediato, nessun lag
            // Duck-up (mic silenzioso): ramp 400ms — sfumatura graduale, evita lo scalino netto
            evaluateMix(activeClips, undefined, active ? 60 : 400);
        },

        _syncProgress: () => {
            // ... existing implementation
            set((state) => {
                const updates: Record<string, ActiveClipState> = {};
                let hasUpdates = false;

                Object.entries(state.activeClips).forEach(([id, clipState]) => {
                    const time = clipState.player.getCurrentTime();
                    const duration = clipState.player.getDuration();
                    // AUDIT-ME (2026-05-29): se time/duration non sono finiti (player non
                    // ancora pronto, getCurrentTime → NaN), progress diventava NaN. Poiché
                    // NaN !== NaN, il check sotto era SEMPRE vero → re-render ogni 100ms a
                    // vuoto + ClipCard riceveva progress NaN. Ora progress è sempre finito
                    // e clampato a [0, 1].
                    const rawProgress = duration > 0 && Number.isFinite(time) ? time / duration : 0;
                    const progress = Math.max(0, Math.min(1, rawProgress));

                    if (progress !== clipState.progress) {
                        updates[id] = { ...clipState, progress };
                        hasUpdates = true;
                    }
                });

                if (hasUpdates) {
                    return { activeClips: { ...state.activeClips, ...updates } };
                }
                return state;
            });
        }
    };
});
