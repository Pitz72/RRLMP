import { create } from 'zustand';
import { Column, AudioClip, ClipType, RotationConfig } from '../types';
import i18n from '../i18n';
import { resolveClipPath, audioFallbackCandidate } from '../utils/pathPortability';

const VALID_CLIP_TYPES = new Set<ClipType>(['asset', 'music', 'voice', 'sfx', 'preshow']);

// v1.2.24 (NEW-ME-03): clamp + fallback per campi numerici di clip.
// NaN/Infinity/numeri fuori range nel .lmp causavano in passato volumi muti
// (volume=NaN nel gain node → bus silente) o trim assurdi (trimEnd=1e10).
// Strategia: sanitize silenzioso con default sensati, niente throw — un .lmp
// con numerici malformati resta caricabile, l'utente può poi correggere manualmente.
const finiteOrDefault = (val: unknown, def: number, min?: number, max?: number): number => {
    if (typeof val !== 'number' || !isFinite(val)) return def;
    let v = val;
    if (min !== undefined && v < min) v = min;
    if (max !== undefined && v > max) v = max;
    return v;
};

/** ME-02: Valida la struttura grezza di un .lmp prima di caricarla nello store.
 *  Lancia un Error con messaggio descrittivo se la struttura non è conforme.
 *  v1.2.24 (NEW-ME-03): sanitize numerici (volume/pan/trim/marker/fade/duration). */
export function validateLmpProjectData(raw: unknown): { columns: Column[] } {
    if (!raw || typeof raw !== 'object') throw new Error('struttura radice non è un oggetto');
    const obj = raw as Record<string, unknown>;
    if (!Array.isArray(obj.columns)) throw new Error('"columns" mancante o non è un array');

    // AUDIT-ME (2026-05-29): dedup degli id clip. Un .lmp prodotto da versioni vecchie o
    // editato a mano può contenere clip con id ripetuti: poiché activeClips/playRunIds sono
    // keyed by id e getColumnForClip/moveClip cercano per id, due clip omonime si
    // confonderebbero (play/stop e MIDI ambigui). Le sequenze del playout sono basate sulla
    // POSIZIONE in array, non sugli id, quindi rigenerare un id duplicato è sicuro.
    const seenClipIds = new Set<string>();

    for (let i = 0; i < obj.columns.length; i++) {
        const col = obj.columns[i];
        if (!col || typeof col !== 'object') throw new Error(`colonna[${i}] non è un oggetto`);
        const c = col as Record<string, unknown>;
        if (typeof c.id !== 'string') throw new Error(`colonna[${i}].id non è una stringa`);
        if (!VALID_CLIP_TYPES.has(c.type as ClipType)) throw new Error(`colonna[${i}].type non valido: "${c.type}"`);
        if (!Array.isArray(c.clips)) throw new Error(`colonna[${i}].clips non è un array`);

        for (let j = 0; j < c.clips.length; j++) {
            const clip = c.clips[j];
            if (!clip || typeof clip !== 'object') throw new Error(`clip[${i}][${j}] non è un oggetto`);
            const cl = clip as Record<string, unknown>;
            if (typeof cl.id !== 'string') throw new Error(`clip[${i}][${j}].id non è una stringa`);
            // dedup: se l'id è già visto, rigenera (la prima occorrenza vince)
            if (seenClipIds.has(cl.id as string)) {
                cl.id = crypto.randomUUID();
            }
            seenClipIds.add(cl.id as string);
            if (typeof cl.name !== 'string') throw new Error(`clip[${i}][${j}].name non è una stringa`);
            if (typeof cl.path !== 'string') throw new Error(`clip[${i}][${j}].path non è una stringa`);
            if (!VALID_CLIP_TYPES.has(cl.type as ClipType)) throw new Error(`clip[${i}][${j}].type non valido: "${cl.type}"`);

            // v1.2.24 (NEW-ME-03): sanitize numerici — mutazione in place
            cl.volume      = finiteOrDefault(cl.volume,      1.0, 0,    1.5);
            cl.pan         = finiteOrDefault(cl.pan,         0,  -1,    1);
            cl.duration    = finiteOrDefault(cl.duration,    0,   0);
            cl.trimStart   = finiteOrDefault(cl.trimStart,   0,   0);
            cl.trimEnd     = finiteOrDefault(cl.trimEnd,     0,   0);
            cl.introMarker = finiteOrDefault(cl.introMarker, 0,   0);
            cl.outroMarker = finiteOrDefault(cl.outroMarker, 0,   0);
            cl.fadeIn      = finiteOrDefault(cl.fadeIn,      0,   0,   60_000);
            cl.fadeOut     = finiteOrDefault(cl.fadeOut,     0,   0,   60_000);

            // v1.4.10 (#16): outroMarker incoerente con trim/durata → azzerato (mai
            // raggiunto se oltre la fine effettiva; scatterebbe all'avvio se ≤ trimStart).
            {
                const durV = cl.duration as number;
                const outroV = cl.outroMarker as number;
                if (outroV > 0 && durV > 0) {
                    const effEnd = durV - (cl.trimEnd as number);
                    if (outroV >= effEnd || outroV <= (cl.trimStart as number)) cl.outroMarker = 0;
                }
            }

            // v1.4.7 (revisione 2026-06-10, #7): transitionType valido o assente. I .lmp
            // salvati fino a v1.4.6 persistevano la stringa 'default' (voce UI "Default
            // Globale") che i lettori non riconoscevano → la clip andava sempre gapless
            // ignorando il default globale. Normalizziamo: qualunque valore che non sia un
            // TransitionType reale viene rimosso → la clip torna a usare il default globale.
            if (cl.transitionType !== undefined
                && cl.transitionType !== 'crossfade'
                && cl.transitionType !== 'segue'
                && cl.transitionType !== 'gapless') {
                delete cl.transitionType;
            }

            // ASSET-07 (v1.3.6): normalizza keybind a string vuota se undefined/null/non-string.
            // Senza, clip caricate da .lmp v1.2.x (prima dell'introduzione del campo keybind)
            // restano `keybind: undefined` e il check `c.keybind === e.code` in MainGrid
            // accidentalmente farebbe match se anche `e.code` fosse undefined (improbabile ma
            // pulizia logica). Anche `midiBind` per analogia.
            if (typeof cl.keybind !== 'string') cl.keybind = '';
            if (typeof cl.midiBind !== 'string') cl.midiBind = '';
        }
    }

    // v1.3.21 — MIGRAZIONE Jingle&Promo: i .lmp salvati prima di v1.3.21 hanno 5 colonne
    // fisse. Iniettiamo col-jingle/col-promo (vuote) a destra di col-assets se assenti, e
    // garantiamo una config rotazione valida su col-preshow. Nessun dato esistente viene
    // toccato; i progetti vecchi restano caricabili (colonne nuove vuote, rotazione spenta).
    const cols = obj.columns as Record<string, unknown>[];
    const hasId = (id: string) => cols.some((c) => c.id === id);
    let anchor = cols.findIndex((c) => c.id === 'col-assets');
    if (anchor === -1) anchor = 0;
    let offset = 1;
    if (!hasId('col-jingle')) {
        cols.splice(anchor + offset, 0, { id: 'col-jingle', title: i18n.t('columns.jingle', 'JINGLE'), type: 'asset', color: '#F59E0B', isLocked: false, clips: [] });
        offset++;
    }
    if (!hasId('col-promo')) {
        cols.splice(anchor + offset, 0, { id: 'col-promo', title: i18n.t('columns.promo', 'PROMO'), type: 'asset', color: '#06B6D4', isLocked: false, clips: [] });
        offset++;
    }
    // Sanitize/inietta la config rotazione sulla PRE-SHOW (clamp every >= 1).
    const preshow = cols.find((c) => c.id === 'col-preshow');
    if (preshow) {
        const r = (preshow.rotation && typeof preshow.rotation === 'object') ? preshow.rotation as Record<string, unknown> : {};
        preshow.rotation = {
            jingleEnabled: r.jingleEnabled === true,
            jingleEvery: finiteOrDefault(r.jingleEvery, 4, 1),
            promoEnabled: r.promoEnabled === true,
            promoEvery: finiteOrDefault(r.promoEvery, 6, 1),
        };
    }

    return raw as { columns: Column[] };
}

// v1.3.21: default rotazione PRE-SHOW. Disattivata di default → comportamento
// identico alle versioni precedenti finché l'operatore non la abilita.
const DEFAULT_ROTATION = { jingleEnabled: false, jingleEvery: 4, promoEnabled: false, promoEvery: 6 } as const;

// i18n (2026-07-03): i titoli di default sono FUNZIONE (non costante) così vengono
// risolti nella lingua corrente al momento della creazione del progetto. Il titolo
// è dato di progetto (.lmp): una volta creato non cambia più al cambio lingua,
// come un titolo rinominato dall'utente.
const getDefaultColumns = (): Column[] => [
    {
        id: 'col-assets',
        title: i18n.t('columns.assets', 'SHOW ASSETS'),
        type: 'asset',
        color: '#10B981', // Emerald-500 (Green)
        isLocked: false, // v1.3.18: assets accetta i file trascinati come tutte le colonne (era true fino a v1.3.17, vedi MainGrid.handleNativeDrop)
        clips: []
    },
    {
        // v1.3.21: colonna JINGLE. Riusa type 'asset' (stesso profilo: nextAction stop,
        // ducking none, fadeOut 500ms) → una clip lanciata da sola si comporta come un asset.
        // È sorgente della rotazione PRE-SHOW (identificata per id stabile, non per type).
        id: 'col-jingle',
        title: i18n.t('columns.jingle', 'JINGLE'),
        type: 'asset',
        color: '#F59E0B', // Amber-500
        isLocked: false,
        clips: []
    },
    {
        // v1.3.21: colonna PROMO. Vedi nota col-jingle.
        id: 'col-promo',
        title: i18n.t('columns.promo', 'PROMO'),
        type: 'asset',
        color: '#06B6D4', // Cyan-500
        isLocked: false,
        clips: []
    },
    {
        id: 'col-music',
        title: i18n.t('columns.music', "CANZONI DELL'EPISODIO"),
        type: 'music',
        color: '#EF4444', // Red-500
        isLocked: false,
        clips: []
    },
    {
        id: 'col-voice',
        title: i18n.t('columns.voice', 'VOCI / PREREGISTRAZIONI'),
        type: 'voice',
        color: '#F97316', // Orange-500
        isLocked: false,
        clips: []
    },
    {
        id: 'col-sfx',
        title: i18n.t('columns.sfx', 'SFX / CARTWALL'),
        type: 'sfx',
        color: '#64748B', // Slate-500 (Grey)
        isLocked: false,
        clips: []
    },
    {
        id: 'col-preshow',
        title: i18n.t('columns.preshow', 'PRE-SHOW'),
        type: 'preshow',
        color: '#8B5CF6', // Violet-500
        isLocked: false,
        clips: [],
        rotation: { ...DEFAULT_ROTATION }
    }
];

interface ProjectState {
    // Persistence Control
    isDirty: boolean;
    setDirty: (dirty: boolean) => void;

    // Actions
    columns: Column[];
    currentFilePath: string | null; // Track file path for auto-backup

    resetProject: () => void;
    addClip: (columnId: string, file: File) => AudioClip | undefined;
    addClipAtIndex: (columnId: string, file: File, insertIndex: number) => AudioClip | undefined;
    addClipFromPath: (columnId: string, filePath: string) => AudioClip | undefined;
    removeClip: (columnId: string, clipId: string) => void;
    /** v1.15.9: svuota completamente una colonna (rimuove tutte le clip). No-op se già vuota. */
    clearColumn: (columnId: string) => void;
    updateClip: (columnId: string, clipId: string, updates: Partial<AudioClip>) => void;
    loadProject: (data: { columns: Column[] }, filePath?: string, opts?: { preserveUiState?: boolean }) => void;
    moveClip: (sourceColId: string, destColId: string, oldIndex: number, newIndex: number) => void;

    setColumnColor: (columnId: string, color: string) => void;
    /** v1.3.21: aggiorna la config rotazione Jingle&Promo (solo col-preshow). */
    setColumnRotation: (columnId: string, rotation: RotationConfig) => void;

    /** Verifica l'esistenza su disco di tutti i file delle clip. Imposta isMissing. Ritorna il numero di file mancanti. */
    runIntegrityCheck: () => Promise<number>;

    /** v1.15.9: dopo un export self-contained, ripunta le clip alle copie in `audio/`
     *  (path assoluto <projectDir>/audio/xxx) così cancellare gli originali è sicuro. */
    applyArchivedPaths: (projectDir: string, remap: { id: string; path: string }[]) => void;

    isMidiLearnMode: boolean;
    setIsMidiLearnMode: (active: boolean) => void;

    assignMidiToClip: (clipId: string, note: number) => void;

    // Selection
    selectedClipIds: string[];


    selectClip: (clipId: string, mode: 'single' | 'toggle' | 'add') => void;
    clearSelection: () => void;
    removeSelectedClips: () => void;
    /** v1.4.14 (#3): sposta in blocco tutte le clip selezionate nella colonna
     *  destinazione. overId = id della clip su cui è avvenuto il drop (inserimento
     *  prima di essa) oppure null per accodare in fondo. */
    moveSelectedClips: (destColId: string, overId: string | null) => void;

    // === Undo/Redo cronologia playlist (v1.5.0) ===
    // Stack di snapshot deep-clone delle colonne. Lo snapshot viene catturato PRIMA
    // di ogni modifica INTENZIONALE dell'operatore (add/remove/move/colore/rotazione/
    // MIDI/impostazioni clip). Le modifiche runtime (analisi silenzio, loudness,
    // hasPlayed, isMissing) NON passano da _snapshot → non inquinano la cronologia.
    undoStack: Column[][];
    redoStack: Column[][];
    /** Salva lo stato corrente delle colonne nello stack undo e svuota il redo.
     *  Da chiamare PRIMA di applicare una modifica utente. */
    _snapshot: () => void;
    undo: () => void;
    redo: () => void;
}

// v1.5.0: profondità massima della cronologia undo/redo. 50 passi coprono ampiamente
// una sessione di editing; oltre, gli snapshot più vecchi vengono droppati (FIFO).
const HISTORY_LIMIT = 50;
const cloneColumns = (cols: Column[]): Column[] => JSON.parse(JSON.stringify(cols));

export const useProjectStore = create<ProjectState>((set, get) => ({
    isDirty: false,
    setDirty: (dirty) => set({ isDirty: dirty }),

    columns: getDefaultColumns(),
    currentFilePath: null,
    undoStack: [],
    redoStack: [],
    isMidiLearnMode: false,
    setIsMidiLearnMode: (active) => set({ isMidiLearnMode: active }),
    assignMidiToClip: (clipId, note) => { get()._snapshot(); set((state) => ({
        isDirty: true,
        isMidiLearnMode: false, // Exit learn mode after assignment? Prompt implied behavior "Click -> Assign". Maybe user stays in learn mode? User didn't specify. I'll stay, or toggle manually? Prompt: "Se l'utente ha selezionato... assegna". Usually learn mode stays on.
        // But prompt says "Mostra un feedback".
        // Let's Keep Learn Mode ON for mapping multiple.
        // Wait, "Se l'utente ha selezionato/cliccato una clip specifica... assegna la nota".
        // User workflow: Click MIDI button (ON). Click Clip (Select). Press MIDI key. Clip gets mapped. Status stays ON.
        columns: state.columns.map((col) => ({
            ...col,
            clips: col.clips.map((c) => c.id === clipId ? { ...c, midiBind: `NOTE:${note}` } : c)
        }))
    })); },

    // PERSIST-09 (v1.3.3): resetProject ora azzera anche selectedClipIds (era l'unica
    // azione che cambia tutte le colonne senza ripulire la selezione).
    resetProject: () => set({ columns: getDefaultColumns(), isDirty: false, currentFilePath: null, isMidiLearnMode: false, selectedClipIds: [], undoStack: [], redoStack: [] }),

    setColumnColor: (columnId, color) => { get()._snapshot(); set((state) => ({
        isDirty: true,
        columns: state.columns.map((col) =>
            col.id === columnId ? { ...col, customColor: color } : col
        )
    })); },

    setColumnRotation: (columnId, rotation) => { get()._snapshot(); set((state) => ({
        isDirty: true,
        columns: state.columns.map((col) =>
            col.id === columnId ? { ...col, rotation } : col
        )
    })); },



    addClip: (columnId, file) => {
        let createdClip: AudioClip | undefined;
        get()._snapshot();
        set((state) => ({
            isDirty: true,
            columns: state.columns.map((col) => {
                if (col.id !== columnId) return col;

                const newClip: AudioClip = {
                    id: crypto.randomUUID(),
                    name: file.name.replace(/\.[^/.]+$/, ""), // Rimuove estensione
                    path: window.electron ? window.electron.getFilePath(file) : '', // Secure Path Retrieval
                    type: col.type,
                    color: col.customColor || col.color,
                    volume: 1.0,
                    pan: 0,
                    isLooping: false,
                    isPlaying: false,
                    duration: 0,
                    currentTime: 0,

                    // Default Logic basata sul tipo di colonna
                    nextAction: (col.type === 'preshow') ? 'play_next' : 'stop',
                    behavior: 'normal',
                    duckingRole: (col.type === 'voice') ? 'source' :
                        (col.type === 'music' || col.type === 'preshow') ? 'target' : 'none',

                    // Transizioni Defaults
                    fadeIn: 0,
                    fadeOut: (col.type === 'music') ? 2000 :
                        (col.type === 'preshow') ? 0 : // Gapless for preshow
                            (col.type === 'asset' ? 500 : 0)
                };
                createdClip = newClip;

                return { ...col, clips: [...col.clips, newClip] };
            })
        }));

        return createdClip;
    },

    addClipAtIndex: (columnId, file, insertIndex) => {
        let createdClip: AudioClip | undefined;
        get()._snapshot();
        set((state) => ({
            isDirty: true,
            columns: state.columns.map((col) => {
                if (col.id !== columnId) return col;

                const newClip: AudioClip = {
                    id: crypto.randomUUID(),
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    path: window.electron ? window.electron.getFilePath(file) : '',
                    type: col.type,
                    color: col.customColor || col.color,
                    volume: 1.0,
                    pan: 0,
                    isLooping: false,
                    isPlaying: false,
                    duration: 0,
                    currentTime: 0,
                    nextAction: (col.type === 'preshow') ? 'play_next' : 'stop',
                    behavior: 'normal',
                    duckingRole: (col.type === 'voice') ? 'source' :
                        (col.type === 'music' || col.type === 'preshow') ? 'target' : 'none',
                    fadeIn: 0,
                    fadeOut: (col.type === 'music') ? 2000 :
                        (col.type === 'preshow') ? 0 :
                            (col.type === 'asset' ? 500 : 0)
                };
                createdClip = newClip;

                const clips = [...col.clips];
                const clampedIndex = Math.max(0, Math.min(insertIndex, clips.length));
                clips.splice(clampedIndex, 0, newClip);
                return { ...col, clips };
            })
        }));

        return createdClip;
    },

    addClipFromPath: (columnId, filePath) => {
        let createdClip: AudioClip | undefined;
        const fileName = filePath.split(/[\\/]/).pop() || filePath;
        const name = fileName.replace(/\.[^/.]+$/, '');
        get()._snapshot();
        set((state) => ({
            isDirty: true,
            columns: state.columns.map((col) => {
                if (col.id !== columnId) return col;
                const newClip: AudioClip = {
                    id: crypto.randomUUID(),
                    name,
                    path: filePath,
                    type: col.type,
                    color: col.customColor || col.color,
                    volume: 1.0,
                    pan: 0,
                    isLooping: false,
                    isPlaying: false,
                    duration: 0,
                    currentTime: 0,
                    nextAction: (col.type === 'preshow') ? 'play_next' : 'stop',
                    behavior: 'normal',
                    duckingRole: (col.type === 'voice') ? 'source' :
                        (col.type === 'music' || col.type === 'preshow') ? 'target' : 'none',
                    fadeIn: 0,
                    fadeOut: (col.type === 'preshow') ? 0 : (col.type === 'asset' ? 500 : 0)
                };
                createdClip = newClip;
                return { ...col, clips: [...col.clips, newClip] };
            })
        }));
        return createdClip;
    },

    removeClip: (columnId, clipId) => { get()._snapshot(); set((state) => ({
        isDirty: true,
        columns: state.columns.map((col) =>
            col.id === columnId
                ? { ...col, clips: col.clips.filter((c) => c.id !== clipId) }
                : col
        )
    })); },

    // v1.15.9: svuota l'intera colonna. No-op se già vuota (niente snapshot inutile
    // nella cronologia undo). Ripulisce anche la selezione dalle clip rimosse.
    clearColumn: (columnId) => {
        const col = get().columns.find((c) => c.id === columnId);
        if (!col || col.clips.length === 0) return;
        get()._snapshot();
        const removedIds = new Set(col.clips.map((c) => c.id));
        set((state) => ({
            isDirty: true,
            columns: state.columns.map((c) =>
                c.id === columnId ? { ...c, clips: [] } : c
            ),
            selectedClipIds: state.selectedClipIds.filter((id) => !removedIds.has(id))
        }));
    },

    updateClip: (columnId, clipId, updates) => set((state) => ({
        isDirty: true,
        columns: state.columns.map((col) =>
            col.id === columnId
                ? {
                    ...col,
                    clips: col.clips.map((c) => c.id === clipId ? { ...c, ...updates } : c)
                }
                : col
        )
    })),

    // Persistence
    loadProject: (stateToLoad: { columns: Column[] }, filePath?: string, opts?: { preserveUiState?: boolean }) => {
        // Reset isMissing on all clips before integrity check
        // v1.15.14 (portabilità): i path RELATIVI (es. `audio/x.mp3` scritti dal
        // project.lmp dell'export "libero") vengono risolti contro la cartella del
        // .lmp appena aperto — a runtime il motore/FFmpeg/media:// vogliono assoluti.
        const cleanColumns = stateToLoad.columns.map(col => ({
            ...col,
            clips: col.clips.map(c => ({
                ...c,
                path: filePath ? resolveClipPath(c.path, filePath) : c.path,
                isMissing: false
            }))
        }));
        // PERSIST-09 (v1.3.3): caricamento di un progetto NUOVO azzera selectedClipIds
        // e isMidiLearnMode (gli ID precedenti non esistono più → dangling selection).
        // Il flag opts.preserveUiState=true è usato dai chiamanti Save/Save As che
        // riutilizzano questa azione solo per aggiornare currentFilePath senza
        // perturbare selezione corrente e modalità MIDI Learn dell'utente.
        // v1.5.0: il caricamento di un progetto NUOVO azzera la cronologia undo/redo
        // (gli snapshot del progetto precedente non sono più validi). I Save/Save As
        // riusano loadProject con preserveUiState solo per aggiornare currentFilePath:
        // in quel caso la cronologia (e la selezione) NON va toccata.
        const uiReset = opts?.preserveUiState
            ? {}
            : { selectedClipIds: [], isMidiLearnMode: false, undoStack: [], redoStack: [] };
        set({
            columns: cleanColumns,
            isDirty: false,
            currentFilePath: filePath || null,
            ...uiReset
        });
    },

    // Integrity Check (v0.14.2)
    // v1.15.14 (portabilità): prima di marcare isMissing, per ogni file assente si
    // tenta la RIPARAZIONE nella cartella `audio/` accanto al .lmp (layout garantito
    // dall'export). Un archivio esportato e riaperto su un'altra macchina — o
    // semplicemente spostato — torna così riproducibile senza intervento manuale.
    // Il repoint marca isDirty: il .lmp su disco ha ancora i path vecchi, e il
    // salvataggio successivo li consolida per la macchina corrente.
    runIntegrityCheck: async () => {
        const state = useProjectStore.getState();
        const allClips = state.columns.flatMap(col => col.clips);
        const paths = allClips.map(c => c.path).filter(Boolean);
        if (paths.length === 0) return 0;

        const { missing } = await window.electron.checkFilesExist(paths);
        const missingSet = new Set(missing ?? []);

        // Mappa path-rotto → candidato in <dir del .lmp>/audio/<nomefile>
        const repairMap = new Map<string, string>();
        const lmpPath = state.currentFilePath;
        if (missingSet.size > 0 && lmpPath) {
            const candidates = new Map<string, string>(); // candidato → path rotto
            for (const broken of missingSet) {
                const cand = audioFallbackCandidate(broken, lmpPath);
                if (cand) candidates.set(cand, broken);
            }
            if (candidates.size > 0) {
                const res = await window.electron.checkFilesExist([...candidates.keys()]);
                const candMissing = new Set(res.missing ?? []);
                for (const [cand, broken] of candidates) {
                    if (!candMissing.has(cand)) repairMap.set(broken, cand);
                }
            }
        }

        set((s) => ({
            ...(repairMap.size > 0 ? { isDirty: true } : {}),
            columns: s.columns.map(col => ({
                ...col,
                clips: col.clips.map(c => {
                    const repaired = repairMap.get(c.path);
                    if (repaired) return { ...c, path: repaired, isMissing: false };
                    return { ...c, isMissing: missingSet.has(c.path) };
                })
            }))
        }));

        return missingSet.size - repairMap.size;
    },

    // v1.15.9: repoint post-export. Il main copia i file in <projectDir>/audio/ e
    // restituisce la mappa id→path relativo; qui li rendiamo assoluti così le clip
    // puntano alla COPIA. Deliberatamente NON passa da _snapshot (l'undo ripunterebbe
    // agli originali, che l'utente potrebbe aver appena cancellato). isMissing=false:
    // le copie esistono per definizione appena create dall'export.
    applyArchivedPaths: (projectDir, remap) => {
        if (!projectDir || remap.length === 0) return;
        const sep = projectDir.includes('\\') ? '\\' : '/';
        const byId = new Map(remap.map(r => [r.id, r.path]));
        set((state) => ({
            isDirty: true,
            columns: state.columns.map(col => ({
                ...col,
                clips: col.clips.map(c => {
                    const rel = byId.get(c.id);
                    if (!rel || !rel.startsWith('audio/')) return c;
                    return { ...c, path: `${projectDir}${sep}${rel.replace(/\//g, sep)}`, isMissing: false };
                })
            }))
        }));
    },


    moveClip: (sourceColId: string, destColId: string, oldIndex: number, newIndex: number) => { get()._snapshot(); set((state) => {
        const sourceCol = state.columns.find(c => c.id === sourceColId);
        const destCol = state.columns.find(c => c.id === destColId);

        if (!sourceCol || !destCol) return state;

        // DND-02 (v1.3.4): bounds check su oldIndex prima dello spread.
        // dnd-kit normalmente fornisce indici validi, ma una race tra drag-end
        // e modifiche concorrenti (rimozione clip via MIDI, hot reload) può
        // produrre oldIndex >= sourceCol.clips.length: `{ ...undefined }` non
        // crasha JS ma genera una clip senza id → tutta la colonna destinazione
        // diventa inutilizzabile fino a reload. newIndex viene clampato dopo.
        if (oldIndex < 0 || oldIndex >= sourceCol.clips.length) {
            return state;
        }

        // Clone columns to avoid mutation
        const newColumns = [...state.columns];
        const sourceColIndex = newColumns.findIndex(c => c.id === sourceColId);
        const destColIndex = newColumns.findIndex(c => c.id === destColId);

        // Get clip to move
        const clipToMove = { ...newColumns[sourceColIndex].clips[oldIndex] };

        // Remove from source
        newColumns[sourceColIndex] = {
            ...newColumns[sourceColIndex],
            clips: newColumns[sourceColIndex].clips.filter((_, i) => i !== oldIndex)
        };

        // Update Clip Properties if changing column type.
        // Spostando una clip in un'altra colonna ne aggiorniamo type (routing bus/colore) e
        // colore base. FIX (audit 2026-05-29): usa il colore EFFETTIVO della colonna destinazione
        // (customColor ha precedenza sul color di default), prima veniva persa la tinta scelta.
        // L'eventuale override colore della singola clip (clipToMove.customColor) resta intatto,
        // così come nextAction/behavior/marker: lo spostamento non altera la logica di playout.
        if (sourceColId !== destColId) {
            clipToMove.type = destCol.type;
            clipToMove.color = destCol.customColor || destCol.color;
        }

        // Insert into destination — DND-02 (v1.3.4): clamp newIndex per evitare
        // splice fuori range (es. dnd-kit calcola un indice basato su uno snapshot
        // delle colonne precedente a una rimozione concorrente).
        if (sourceColId === destColId) {
            // AUDIT-ME (2026-05-29): il riordino intra-colonna riusa l'array GIÀ privato di
            // oldIndex (newColumns[sourceColIndex], calcolato sopra) invece di ri-derivare da
            // `sourceCol` (stato originale, ancora con la clip). Prima i due rami divergevano:
            // la rimozione a riga ~389 veniva di fatto scartata e ricalcolata, rendendo il
            // codice fragile a future modifiche. Risultato identico, logica unificata.
            const reordered = [...newColumns[sourceColIndex].clips];
            const safeIndex = Math.max(0, Math.min(newIndex, reordered.length));
            reordered.splice(safeIndex, 0, clipToMove);
            newColumns[sourceColIndex] = { ...newColumns[sourceColIndex], clips: reordered };
        } else {
            const destClips = [...newColumns[destColIndex].clips];
            const safeIndex = Math.max(0, Math.min(newIndex, destClips.length));
            destClips.splice(safeIndex, 0, clipToMove);
            newColumns[destColIndex] = { ...destCol, clips: destClips };
        }

        return { columns: newColumns, isDirty: true };
    }); },

    // Selection Logic
    selectedClipIds: [],

    selectClip: (clipId, mode) => set((state) => {
        let newSelection = [...state.selectedClipIds];
        if (mode === 'single') {
            newSelection = [clipId];
        } else if (mode === 'toggle') {
            if (newSelection.includes(clipId)) {
                newSelection = newSelection.filter(id => id !== clipId);
            } else {
                newSelection.push(clipId);
            }
        } else if (mode === 'add') {
            if (!newSelection.includes(clipId)) newSelection.push(clipId);
        }
        return { selectedClipIds: newSelection };
    }),

    clearSelection: () => set({ selectedClipIds: [] }),

    removeSelectedClips: () => { if (get().selectedClipIds.length === 0) return; get()._snapshot(); set((state) => {
        if (state.selectedClipIds.length === 0) return state;

        const newColumns = state.columns.map(col => ({
            ...col,
            clips: col.clips.filter(clip => !state.selectedClipIds.includes(clip.id))
        }));

        return {
            columns: newColumns,
            isDirty: true,
            selectedClipIds: []
        };
    }); },

    // v1.4.14 (#3): spostamento in blocco della multiselezione.
    moveSelectedClips: (destColId, overId) => { if (get().selectedClipIds.length === 0) return; get()._snapshot(); set((state) => {
        const ids = new Set(state.selectedClipIds);
        if (ids.size === 0) return state;

        const destCol0 = state.columns.find(c => c.id === destColId);
        if (!destCol0) return state;

        // Clip selezionate in ordine stabile (per colonna, poi per indice): l'ordine
        // visivo viene preservato nell'inserimento nella colonna destinazione.
        const moving: AudioClip[] = [];
        state.columns.forEach(col => col.clips.forEach(c => { if (ids.has(c.id)) moving.push(c); }));
        if (moving.length === 0) return state;

        const destColor = destCol0.customColor || destCol0.color;
        const destType = destCol0.type;
        // Set degli id già presenti nella destinazione (riordino interno → niente
        // cambio di type/colore, come moveClip per lo spostamento intra-colonna).
        const alreadyInDest = new Set(destCol0.clips.map(c => c.id));

        // Rimuovi le selezionate da TUTTE le colonne (lo spostamento è multicolonna).
        const stripped = state.columns.map(col => ({
            ...col,
            clips: col.clips.filter(c => !ids.has(c.id))
        }));

        // Punto di inserimento calcolato sull'array GIÀ ripulito (gli indici post-rimozione
        // sono quelli reali) — evita splice fuori posto quando si riordina dentro la dest.
        const destIdx = stripped.findIndex(c => c.id === destColId);
        const destClips = [...stripped[destIdx].clips];
        let insertAt = destClips.length;
        if (overId && overId !== destColId) {
            const k = destClips.findIndex(c => c.id === overId);
            if (k !== -1) insertAt = k;
        }

        const prepared = moving.map(c =>
            alreadyInDest.has(c.id) ? c : { ...c, type: destType, color: destColor }
        );
        destClips.splice(insertAt, 0, ...prepared);
        stripped[destIdx] = { ...stripped[destIdx], clips: destClips };

        // Selezione mantenuta: le clip spostate restano evidenziate.
        return { columns: stripped, isDirty: true };
    }); },

    // === Undo/Redo (v1.5.0) ===
    _snapshot: () => set((state) => ({
        undoStack: [...state.undoStack, cloneColumns(state.columns)].slice(-HISTORY_LIMIT),
        redoStack: [], // ogni nuova modifica utente invalida il ramo di redo
    })),

    undo: () => set((state) => {
        if (state.undoStack.length === 0) return state;
        const prev = state.undoStack[state.undoStack.length - 1];
        const cur = cloneColumns(state.columns);
        return {
            columns: prev,
            undoStack: state.undoStack.slice(0, -1),
            redoStack: [...state.redoStack, cur].slice(-HISTORY_LIMIT),
            isDirty: true,
            selectedClipIds: [], // gli id selezionati potrebbero non esistere più nello stato ripristinato
        };
    }),

    redo: () => set((state) => {
        if (state.redoStack.length === 0) return state;
        const next = state.redoStack[state.redoStack.length - 1];
        const cur = cloneColumns(state.columns);
        return {
            columns: next,
            redoStack: state.redoStack.slice(0, -1),
            undoStack: [...state.undoStack, cur].slice(-HISTORY_LIMIT),
            isDirty: true,
            selectedClipIds: [],
        };
    })
}));
