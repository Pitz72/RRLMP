import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useProjectStore } from '../../store/useProjectStore';
import { useAudioStore } from '../../store/useAudioStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { hasSupportedAudioExtension } from '../../utils/audioExtensions';
import { debugLog } from '../../store/useDebugStore';
import { ClipCard } from './ClipCard';
import { SortableClip } from './SortableClip'; // New component
import { Upload } from 'lucide-react';
import { ClipSettingsModal } from '../modals/ClipSettingsModal';
import { AudioClip, Column } from '../../types';
import { decideSilenceUpdate, needsLegacyFingerprint } from '../../utils/silenceDetection';
import { classifyBpmResult } from '../../utils/bpmDetection';
import { assessCompatibility, findMixNext } from '../../engine/automixEngine';
import { useTranslation } from 'react-i18next';

// Helper component for Drop Area (Column)
interface SortableColumnProps {
    column: Column;
    children: React.ReactNode;
    onNativeDrop: (e: React.DragEvent, colId: string) => void;
    onNativeDragOver: (e: React.DragEvent, colId: string) => void;
    onNativeDragLeave: (e: React.DragEvent) => void;
}

import { ColumnHeader } from './ColumnHeader';
import { toast } from '../../store/useToastStore';

const SortableColumn: React.FC<SortableColumnProps> = ({ column, children, onNativeDrop, onNativeDragOver, onNativeDragLeave }) => {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    // Colore della colonna come variabile CSS (LED della testata, scrollbar, pad).
    // Solo presentazione: il colore è quello già scelto per la colonna nello store.
    const colVars = { '--col-color': column.customColor || column.color } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            className="col"
            style={colVars}
            onDrop={(e) => onNativeDrop(e, column.id)}
            onDragOver={(e) => onNativeDragOver(e, column.id)}
            onDragLeave={onNativeDragLeave}
        >
            <ColumnHeader column={column} />
            <div className="col-body">
                {children}
            </div>
        </div>
    );
};


export const MainGrid: React.FC = () => {
    const { t } = useTranslation();
    const { columns, addClipAtIndex, updateClip, removeClip, moveClip, moveSelectedClips, currentFilePath } = useProjectStore();
    // v1.15.35 (M4): due selettori separati. Il selettore a oggetto `({ loadClip,
    // playColumn })` restituiva un oggetto nuovo a ogni giro dello store audio: la
    // griglia intera si ridisegnava 10 volte al secondo mentre qualcosa suonava
    // (il progresso delle clip aggiorna lo store a 10 Hz).
    const loadClip = useAudioStore((state) => state.loadClip);
    const playColumn = useAudioStore((state) => state.playColumn);
    // Controllo Remoto (2026-07-01, Step 4/N) — sottoscrizione reattiva separata:
    // serve solo per sapere QUALI clip sono in play, non richiede altro dallo store.
    // v1.15.35 (M4): solo l'ELENCO delle clip in onda, come stringa stabile. La mappa
    // intera cambia a ogni aggiornamento del progresso: il ridisegno della griglia e
    // la ripubblicazione dello stato al tablet (IPC + broadcast WebSocket) avvenivano
    // 10 volte al secondo anche senza alcun cambiamento da mostrare.
    const activeIdsKey = useAudioStore((state) => JSON.stringify(Object.keys(state.activeClips).sort()));
    // v1.15.37: modalità MIX verso il telefono — brani in uscita, stato MIX, esito
    // dell'ultimo passaggio (valori stabili: nessun ridisegno a 10 Hz).
    const fadingIdsKey = useAudioStore((state) => state.fadingClipIds.join('|'));
    const mixMode = useAudioStore((state) => state.mixMode);
    const lastAutomix = useAudioStore((state) => state.lastAutomix);
    // Layout regia configurabile (v1.9.8) — colonne nascoste dalla board (globale).
    const hiddenColumnIds = useSettingsStore((state) => state.hiddenColumnIds);

    const [editingClip, setEditingClip] = useState<AudioClip | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [preshowAnalyzingCount, setPreshowAnalyzingCount] = useState(0);
    const [musicAnalyzingCount, setMusicAnalyzingCount] = useState(0);
    // Drop indicator: colonna + indice di inserimento durante il drag da OS
    const [dropIndicator, setDropIndicator] = useState<{ colId: string; index: number } | null>(null);

    // GLOBAL HOTKEYS
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ASSET-02 (v1.3.6): blocca eventi keydown da OS autorepeat.
            // Tenere premuto un tasto bound a un jingle (es. F1) generava 30+ keydown/s
            // → la stessa clip veniva toggle on/off ripetutamente, con risultato udibile
            // catastrofico in diretta (jingle balbettante / stop immediato). Solo il
            // primo evento "fisico" del tasto deve scatenare il trigger.
            if (e.repeat) return;

            // 1. Modal Guard
            if (editingClip) return;

            // 2. Input Guard
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            // v1.15.35 (M3): le combinazioni con Ctrl, Alt o Cmd sono scorciatoie
            // dell'app o del sistema, non tasti di lancio. I keybind registrano solo il
            // tasto fisico (e.code), quindi prima Ctrl+Z (annulla) lanciava ANCHE il
            // jingle assegnato a Z, Ctrl+Y quello su Y, Ctrl+Shift+D quello su D, e
            // Alt+F4 faceva partire la colonna di F4 mentre la finestra si chiudeva.
            // Eccezione: se il tasto premuto È un modificatore (un bind su Ctrl destro,
            // per esempio), il suo stesso flag è acceso e va lasciato passare.
            const isModifierKey = e.key === 'Control' || e.key === 'Alt' || e.key === 'AltGraph' || e.key === 'Meta' || e.key === 'Shift';
            if ((e.ctrlKey || e.altKey || e.metaKey) && !isModifierKey) return;

            // 3. Custom Keybinds (Priority)
            // Nota: Escape (Emergency Stop) è gestito dal keydown globale in App.tsx
            // (v1.4.13 ESC-01: spostato dal globalShortcut del main) — non serve qui.
            // AUDIT-ME (2026-05-29): legge `columns` fresco via getState() invece dalla closure.
            // Prima `columns` era in deps → il listener veniva ri-registrato a ogni mutazione
            // (add/remove clip, ma anche ogni updateClip di analisi/trim). Ora si registra solo
            // al cambio di `editingClip` (apertura/chiusura modale) e il keybind è sempre
            // confrontato con lo stato corrente al momento della pressione.
            const allClips = useProjectStore.getState().columns.flatMap(col => col.clips);
            const bindMatch = allClips.find(c => c.keybind === e.code);

            if (bindMatch) {
                e.preventDefault();
                // Toggle Logic matching ClipCard click
                const isActive = useAudioStore.getState().activeClips[bindMatch.id];
                if (isActive) {
                    useAudioStore.getState().stopClip(bindMatch.id);
                } else {
                    useAudioStore.getState().playClip(bindMatch);
                }
                return;
            }

            // v1.15.26 (M1): F1..Fn seguono le colonne EFFETTIVAMENTE VISIBILI, nello
            // stesso ordine in cui si vedono. Prima erano indici fissi 1..5 sull'array
            // completo: da quando le colonne sono 7 (v1.3.21) PRE-SHOW e FX non erano
            // raggiungibili, e nascondere una colonna dalle preferenze (v1.9.8) non
            // rimappava nulla — il tasto e la colonna sotto il dito divergevano.
            // Nota deliberata: F1 resta la prima colonna, di norma SHOW ASSETS, il cui
            // lancio è un take-over (ferma tutto tranne gli FX). È coerente con il click
            // sulla stessa colonna; il tasto ora almeno corrisponde a ciò che si vede.
            if (e.key.startsWith('F')) {
                const fKey = parseInt(e.key.substring(1));
                const cols = useProjectStore.getState().columns;
                const hidden = useSettingsStore.getState().hiddenColumnIds;
                const visible = cols.filter((c) => c.type !== 'sfx' && !hidden.includes(c.id));
                if (!isNaN(fKey) && fKey >= 1 && fKey <= visible.length) {
                    e.preventDefault();
                    playColumn(visible[fKey - 1].id);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingClip, playColumn]); // columns/hiddenColumnIds letti via getState(); stopAll non usato qui

    // AUTO-SILENCE DETECTION BATCH — colonne MUSIC e PRE-SHOW al caricamento progetto.
    // Parte a ogni cambio di currentFilePath (qualunque via di caricamento).
    // v1.7.1: un'analisi fallita non viene mai segnata come controllata (si ritenta).
    // v1.15.38: gate silenceCheckedV3. Fino alla 1.15.37 il rilevatore poteva far
    // partire un brano da una pausa interna (o finirlo lì): al primo caricamento ogni
    // clip viene rianalizzata col rilevatore ai bordi. I tagli scritti dal vecchio
    // rilevatore vengono sostituiti (e il progetto risulta da salvare), quelli fatti a
    // mano restano: vedi decideSilenceUpdate in utils/silenceDetection.ts.
    useEffect(() => {
        if (!currentFilePath) return;

        const runBatch = (colType: 'music' | 'preshow', setCount: React.Dispatch<React.SetStateAction<number>>, doneToastKey: string, doneToastFallback: string) => {
            const col = useProjectStore.getState().columns.find(c => c.type === colType);
            const tag = `AutoSilence[${colType}]`;
            if (!col) {
                if (colType === 'preshow') debugLog(`${tag} load: nessuna colonna con type="preshow" trovata nel progetto`, 'error');
                return;
            }
            const colId = col.id;
            const pending = col.clips.filter(c => !c.silenceCheckedV3 && !c.isMissing);
            debugLog(`${tag} load: colonna id="${colId}", ${col.clips.length} clip totali, ${pending.length} da analizzare (silenceCheckedV3 assente/false)`, 'info');
            if (pending.length === 0 || !window.electron?.detectSilence) return;

            setCount(pending.length);
            let processed = 0;
            let optimized = 0;
            let repaired = 0;

            const finishOne = () => {
                processed++;
                setCount(n => Math.max(0, n - 1));
                if (processed !== pending.length) return;
                if (optimized > 0) toast(t(doneToastKey, doneToastFallback, { count: optimized }), 'success');
                if (repaired > 0) toast(t('grid.trimRepaired', 'Taglio automatico ricalcolato su {{count}} clip con il nuovo rilevatore (i tagli fatti a mano non sono stati toccati). Salva il progetto per conservarlo.', { count: repaired }), 'warning', 9000);
            };

            pending.forEach(clip => {
                updateClip(colId, clip.id, { isAnalyzing: true }, { runtime: true });
                window.electron.detectSilence(clip.path, undefined, { withLegacy: needsLegacyFingerprint(clip) }).then(result => {
                    const fresh = useProjectStore.getState().columns.find(c => c.id === colId)?.clips.find(c => c.id === clip.id);
                    if (!fresh) return; // clip rimossa nel frattempo
                    const d = decideSilenceUpdate(clip, result);
                    if (!d.patch) {
                        updateClip(colId, clip.id, { isAnalyzing: false }, { runtime: true });
                        debugLog(`${tag}: analisi fallita per "${clip.name}" (${result.error ?? 'errore sconosciuto'}) — riprovo al prossimo caricamento`, 'error');
                        return;
                    }
                    // Se l'operatore ha cambiato i tagli mentre l'analisi girava, vincono i suoi.
                    const editedMeanwhile = (fresh.trimStart ?? 0) !== (clip.trimStart ?? 0) || (fresh.trimEnd ?? 0) !== (clip.trimEnd ?? 0);
                    if (editedMeanwhile) {
                        updateClip(colId, clip.id, { isAnalyzing: false, silenceCheckedV2: true, silenceCheckedV3: true }, { runtime: true });
                        return;
                    }
                    if (d.reason === 'replacedLegacy' && d.changed) {
                        // Correzione vera di un dato salvato: scrittura NON runtime, così il
                        // progetto risulta da salvare e la correzione finisce nel .lmp.
                        updateClip(colId, clip.id, { ...d.patch, isAnalyzing: false });
                        repaired++;
                        debugLog(`${tag}: taglio corretto per "${clip.name}": ${clip.trimStart ?? 0}s/${clip.trimEnd ?? 0}s → ${d.patch.trimStart}s/${d.patch.trimEnd}s (il vecchio rilevatore tagliava dentro il brano)`, 'event');
                        return;
                    }
                    updateClip(colId, clip.id, { ...d.patch, isAnalyzing: false }, { runtime: true });
                    if (d.reason === 'applied' && ((d.patch.trimStart ?? 0) > 0 || (d.patch.trimEnd ?? 0) > 0)) optimized++;
                    if (d.reason === 'keptManual') debugLog(`${tag}: "${clip.name}" ha un taglio impostato a mano (${clip.trimStart ?? 0}s/${clip.trimEnd ?? 0}s): conservato`, 'info');
                }).catch((err) => {
                    updateClip(colId, clip.id, { isAnalyzing: false }, { runtime: true });
                    debugLog(`${tag}: eccezione per "${clip.name}": ${err}`, 'error');
                }).finally(finishOne);
            });
        };

        runBatch('music', setMusicAnalyzingCount, 'grid.silenceRemovedSongs', 'Silenzio rimosso automaticamente da {{count}} canzoni.');
        runBatch('preshow', setPreshowAnalyzingCount, 'grid.silenceRemovedPreshow', 'Silenzio rimosso automaticamente da {{count}} clip PRE-SHOW.');
    }, [currentFilePath]); // eslint-disable-line react-hooks/exhaustive-deps

    // AUTO-BPM DETECTION BATCH — colonna Music al caricamento progetto (2026-07-01)
    // Stesso schema del batch auto-silenzio qui sopra, nessuna UI di progresso
    // (l'analisi BPM non altera l'ascolto, quindi gira silenziosamente in background).
    // v1.10.17 (Automix Fase A): gate versionato bpmCheckedV2 — le clip analizzate
    // prima (solo bpmChecked legacy) vengono rianalizzate UNA volta per ottenere
    // anche beatOffsetSec (e la precisione dell'interpolazione parabolica v1.10.14).
    useEffect(() => {
        if (!currentFilePath) return;
        const freshColumns = useProjectStore.getState().columns;
        const musicCol = freshColumns.find(c => c.type === 'music');
        if (!musicCol) return;

        // v1.15.37: gate V3 — griglia raffinata (le griglie V2 erano sfasate di ~140 ms in
        // mediana su musica vera): ogni brano già analizzato viene rianalizzato UNA volta.
        const unanalyzed = musicCol.clips.filter(c => !c.bpmCheckedV3 && !c.isMissing);
        if (unanalyzed.length === 0 || !window.electron?.detectBpm) return;
        debugLog(`AutoBpm[music] load: ${musicCol.clips.length} clip totali, ${unanalyzed.length} da analizzare (bpmCheckedV3 assente/false)`, 'info');

        unanalyzed.forEach(clip => {
            window.electron.detectBpm(clip.path).then(result => {
                const r = classifyBpmResult(result);
                if (r.checked) {
                    updateClip('col-music', clip.id, {
                        ...(r.bpm !== undefined ? { bpm: r.bpm } : {}),
                        ...(r.beatOffsetSec !== undefined ? { beatOffsetSec: r.beatOffsetSec } : {}),
                        ...(r.confidence !== undefined ? { bpmConfidence: r.confidence } : {}),
                        ...(r.gridScore !== undefined ? { beatGridScore: r.gridScore } : {}),
                        bpmCheckedV2: true,
                        bpmCheckedV3: true
                    }, { runtime: true });
                    // v1.10.18 (Fase A, supporto A3): esito nel Debug Overlay — servono i
                    // numeri (BPM, confidence, offset) per la validazione su musica reale.
                    debugLog(`AutoBpm[music]: "${clip.name}" → ${r.bpm !== undefined
                        ? `${r.bpm} BPM (conf ${result.data?.confidence ?? '?'}${r.beatOffsetSec !== undefined ? `, primo beat a ${r.beatOffsetSec}s` : ', offset non stimabile'})`
                        : 'nessuna periodicità rilevabile'}`, 'info');
                } else {
                    debugLog(`AutoBpm[music]: analisi fallita per "${clip.name}" (${result.error ?? 'errore sconosciuto'}) — riprovo al prossimo caricamento`, 'error');
                }
            }).catch((err) => {
                debugLog(`AutoBpm[music]: eccezione per "${clip.name}": ${err}`, 'error');
            });
        });
    }, [currentFilePath]); // eslint-disable-line react-hooks/exhaustive-deps

    // CONTROLLO REMOTO (2026-07-01, Step 4/N) — pubblica lo stato della colonna
    // Music (id/nome/in-play) al main a ogni cambio, così il server LAN può
    // mostrarlo sul tablet. Fire-and-forget: se il server non è attivo, il main
    // riceve comunque il messaggio ma non lo trasmette a nessun client connesso.
    // v1.15.37: anche i pad FX (colonna col-sfx), con il colore assegnato
    // dall'utente e il flag file mancante — il telefono mostra la stessa cartwall.
    // Il main scarta i duplicati: pubblicare spesso non costa traffico di rete.
    const musicColumnForRemote = columns.find(c => c.type === 'music');
    const sfxColumnForRemote = columns.find(c => c.type === 'sfx');
    useEffect(() => {
        if (!window.electron?.publishRemoteState) return;
        const active = new Set<string>(JSON.parse(activeIdsKey) as string[]);
        const fading = new Set<string>(fadingIdsKey ? fadingIdsKey.split('|') : []);
        const musicClips = musicColumnForRemote?.clips ?? [];
        // v1.15.37: un brano in dissolvenza (mix in corso) non è più «in onda»: è in uscita
        const music = musicClips.map(c => ({
            id: c.id,
            name: c.title || c.name,
            isPlaying: active.has(c.id) && !fading.has(c.id),
            ...(active.has(c.id) && fading.has(c.id) ? { fading: true } : {})
        }));
        const fx = (sfxColumnForRemote?.clips ?? []).map(c => ({
            id: c.id,
            name: c.title || c.name,
            isPlaying: !c.isMissing && active.has(c.id),
            ...(c.customColor ? { color: c.customColor } : {}),
            ...(c.isMissing ? { missing: true } : {})
        }));
        // v1.15.37: «PROSSIMO» sul telefono — stesso brano che sceglierebbe la regia
        const onAir = musicClips.find(c => active.has(c.id) && !fading.has(c.id)) ?? null;
        const next = findMixNext(musicClips, onAir?.id ?? null);
        const nextTempo = onAir && next ? assessCompatibility(onAir, next).level !== 'red' : false;
        const mix = {
            on: mixMode,
            ...(next ? { nextId: next.id, nextName: next.title || next.name, nextMode: (onAir ? (nextTempo ? 'tempo' : 'classic') : 'start') as 'tempo' | 'classic' | 'start' } : {}),
            ...(lastAutomix ? { last: lastAutomix.mode } : {})
        };
        window.electron.publishRemoteState({ music, fx, mix });
    }, [musicColumnForRemote, sfxColumnForRemote, activeIdsKey, fadingIdsKey, mixMode, lastAutomix]);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start drag, allowing clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // NATIVE FILE DROP HANDLER
    const handleNativeDrop = async (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        // Allow only files
        if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

        // v1.3.18: rimosso il rifiuto del drop su colonna `isLocked` (era DND-04 in
        // v1.3.4). Per richiesta esplicita dell'utente la colonna SHOW ASSETS deve
        // accettare i file trascinati dall'OS esattamente come tutte le altre colonne
        // (comportamento pre-v1.3.4). Il flag `isLocked` resta nel modello dati ma non
        // blocca più il drop nativo — non esiste alcuna UI per attivarlo e l'unica
        // colonna che lo aveva (assets) ora è sbloccata anche di default. La rimozione
        // del guard qui copre anche i progetti .lmp già salvati con assets isLocked:true
        // (il validatore non normalizza isLocked).

        // GR12 Fix: filtra solo file audio supportati.
        // File non audio (immagini, PDF, exe...) vengono ignorati silenziosamente
        // invece di essere aggiunti e fallire al momento del caricamento.
        // v1.10.7: whitelist centralizzata in utils/audioExtensions.ts (era duplicata qui e nel pad FX).
        const files = Array.from(e.dataTransfer.files).filter(file => hasSupportedAudioExtension(file.name));

        // Calcola l'indice di inserimento dal punto di drop (Y) rispetto alle clip esistenti.
        // Ogni SortableClip ha data-clip-id, li interroghiamo per trovare il "slot" corretto.
        const clipEls = e.currentTarget.querySelectorAll('[data-clip-id]');
        let insertIndex = clipEls.length; // default: in fondo
        for (let i = 0; i < clipEls.length; i++) {
            const rect = clipEls[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                insertIndex = i;
                break;
            }
        }

        setDropIndicator(null);

        for (const file of files) {
            const newClip = addClipAtIndex(colId, file, insertIndex);
            insertIndex++; // ogni file inserito sposta l'array di 1
            if (newClip) {
                await loadClip(newClip);

                // Auto-Silence Detection per colonna Pre-Show e Music (v0.13.2, fix v0.14.10, v1.2.4)
                const col = columns.find(c => c.id === colId);
                if ((col?.type === 'preshow' || col?.type === 'music') && window.electron?.detectSilence) {
                    const isPreshow = col.type === 'preshow';
                    updateClip(colId, newClip.id, { isAnalyzing: true }, { runtime: true });
                    if (isPreshow) setPreshowAnalyzingCount(n => n + 1);
                    else setMusicAnalyzingCount(n => n + 1);
                    window.electron.detectSilence(newClip.path).then(result => {
                        // v1.15.38: clip appena aggiunta → decideSilenceUpdate scrive il taglio ai bordi.
                        const d = decideSilenceUpdate(newClip, result);
                        if (d.patch) {
                            updateClip(colId, newClip.id, { ...d.patch, isAnalyzing: false }, { runtime: true });
                            debugLog(`AutoSilence [${newClip.name}]: trimStart=${d.patch.trimStart}s, trimEnd=${d.patch.trimEnd}s`, 'info');
                        } else {
                            updateClip(colId, newClip.id, { isAnalyzing: false }, { runtime: true });
                            debugLog(`AutoSilence [${newClip.name}]: analisi fallita (${result.error ?? 'errore sconosciuto'}) — riprovo al prossimo caricamento`, 'error');
                        }
                    }).catch((err) => {
                        updateClip(colId, newClip.id, { isAnalyzing: false }, { runtime: true });
                        debugLog(`AutoSilence [${newClip.name}]: eccezione: ${err}`, 'error');
                    }).finally(() => {
                        if (isPreshow) setPreshowAnalyzingCount(n => Math.max(0, n - 1));
                        else setMusicAnalyzingCount(n => Math.max(0, n - 1));
                    });
                }

                // Auto-BPM Detection per colonna Music (2026-07-01) — solo rilevamento +
                // persistenza, nessuna UI di progresso (vedi batch al caricamento sopra).
                // v1.10.17: gate/campi allineati al batch (bpmCheckedV2 + beatOffsetSec).
                if (col?.type === 'music' && window.electron?.detectBpm) {
                    window.electron.detectBpm(newClip.path).then(result => {
                        const r = classifyBpmResult(result);
                        if (r.checked) {
                            updateClip(colId, newClip.id, {
                                ...(r.bpm !== undefined ? { bpm: r.bpm } : {}),
                                ...(r.beatOffsetSec !== undefined ? { beatOffsetSec: r.beatOffsetSec } : {}),
                                ...(r.confidence !== undefined ? { bpmConfidence: r.confidence } : {}),
                                ...(r.gridScore !== undefined ? { beatGridScore: r.gridScore } : {}),
                                bpmCheckedV2: true,
                                bpmCheckedV3: true
                            }, { runtime: true });
                            // v1.10.18: stesso log del batch (validazione A3 dal Debug Overlay)
                            debugLog(`AutoBpm [${newClip.name}]: ${r.bpm !== undefined
                                ? `${r.bpm} BPM (conf ${result.data?.confidence ?? '?'}${r.beatOffsetSec !== undefined ? `, primo beat a ${r.beatOffsetSec}s` : ', offset non stimabile'})`
                                : 'nessuna periodicità rilevabile'}`, 'info');
                        } else {
                            debugLog(`AutoBpm [${newClip.name}]: analisi fallita (${result.error ?? 'errore sconosciuto'}) — riprovo al prossimo caricamento`, 'error');
                        }
                    }).catch((err) => {
                        debugLog(`AutoBpm [${newClip.name}]: eccezione: ${err}`, 'error');
                    });
                }
            }
        }
    };

    const handleNativeDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        // Calcola l'indice di inserimento in tempo reale per il drop indicator
        const clipEls = e.currentTarget.querySelectorAll('[data-clip-id]');
        let insertIndex = clipEls.length;
        for (let i = 0; i < clipEls.length; i++) {
            const rect = clipEls[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                insertIndex = i;
                break;
            }
        }
        setDropIndicator({ colId, index: insertIndex });
    };

    const handleNativeDragLeave = (e: React.DragEvent) => {
        // Cancella l'indicatore solo se il puntatore esce davvero dalla colonna
        // (non quando transita tra figli interni)
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDropIndicator(null);
        }
    };

    const handleSaveClip = (clipId: string, updates: Partial<AudioClip>) => {
        if (!editingClip) return;
        const colId = columns.find(c => c.clips.some(clip => clip.id === clipId))?.id;
        if (colId) {
            // v1.5.0: snapshot per undo/redo prima della modifica impostazioni clip.
            // Lo snapshot è qui (call site UI) e non in updateClip: quest'ultima è
            // condivisa con le scritture runtime (analisi silenzio, loudness, hasPlayed)
            // che NON devono entrare nella cronologia.
            useProjectStore.getState()._snapshot();
            updateClip(colId, clipId, updates);
            // v1.4.7 (#14): se la clip è in onda, riallinea subito il player
            // (fadeOut di transizione, trim/marker, volume) alle nuove impostazioni.
            useAudioStore.getState().syncActiveClipSettings(clipId);
        }
    };

    const handleDeleteClip = (clipId: string) => {
        if (!editingClip) return;
        const colId = columns.find(c => c.clips.some(clip => clip.id === clipId))?.id;
        if (colId) {
            removeClip(colId, clipId);
        }
    };

    // DND-KIT HANDLERS
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find source column and index
        const sourceCol = columns.find(col => col.clips.some(c => c.id === activeId));
        if (!sourceCol) return;
        const oldIndex = sourceCol.clips.findIndex(c => c.id === activeId);

        // Find dest column (could be a Column ID or a Clip ID)
        let destCol = columns.find(col => col.id === overId);
        let newIndex = 0;
        // v1.4.14 (#3): se l'utente trascina una clip che fa parte di una
        // multiselezione (>1), tutte le clip selezionate si spostano in blocco nella
        // colonna destinazione. overId è l'id della clip-bersaglio (inserimento prima
        // di essa) o null se si lascia cadere sul contenitore colonna (in fondo).
        const selectedIds = useProjectStore.getState().selectedClipIds;
        const isBlockMove = selectedIds.length > 1 && selectedIds.includes(activeId);

        if (destCol) {
            // Dropped on a column container (likely empty or at end)
            newIndex = destCol.clips.length;
            if (isBlockMove) { moveSelectedClips(destCol.id, null); return; }
        } else {
            // Dropped on another clip
            destCol = columns.find(col => col.clips.some(c => c.id === overId));
            if (!destCol) return;
            if (isBlockMove) { moveSelectedClips(destCol.id, overId); return; }
            const overIndex = destCol.clips.findIndex(c => c.id === overId);
            // If dropping below the halfway point of the target, insert after
            // But dnd-kit sortable usually handles index calculation via closestCenter/Corners
            // Simple approach: Use array index
            newIndex = overIndex;
            // Check if we are moving down in same column to adjust index?
            // moveClip logic handles splice, so we just need target index as intended position.
            // If source same as dest and oldIndex < newIndex, typical array move logic applies.
            // But let's trust dnd-kit visual feedback to guide user.
            // Usually for Sortable, if active.id !== over.id, we allow move.
        }

        if (activeId !== overId || sourceCol.id !== destCol.id) {
            moveClip(sourceCol.id, destCol.id, oldIndex, newIndex);
        }
    };

    // Find the clip object for the DragOverlay
    const activeClip = activeId ? columns.flatMap(c => c.clips).find(c => c.id === activeId) : null;

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.4',
                },
            },
        }),
    };

    // Step 3 (UI regia): la colonna FX (type 'sfx') non è più nella griglia —
    // i suoi effetti vivono nel minipad FX 5×5 (FxPadOverlay). La colonna
    // resta nel modello dati (bus/polifonia/esenzioni del motore invariate).
    // Step 4 (UI regia): filtra anche le colonne disattivate dal layout
    // configurabile (preferenza globale hiddenColumnIds). Nascondere una
    // colonna non elimina le sue clip.
    const visibleColumns = columns.filter((col) => col.type !== 'sfx' && !hiddenColumnIds.includes(col.id));
    // v1.10.7: i banner "Rilevamento silenzio…" vivono DENTRO le colonne — se
    // Music/PRE-SHOW è nascosta dal layout, l'analisi al load partiva senza alcun
    // feedback. Conteggio delle analisi in corso su colonne nascoste per il
    // banner globale qui sotto.
    const isColHidden = (type: 'music' | 'preshow') => {
        const col = columns.find(c => c.type === type);
        return !!col && hiddenColumnIds.includes(col.id);
    };
    const hiddenAnalyzingCount =
        (isColHidden('preshow') ? preshowAnalyzingCount : 0) +
        (isColHidden('music') ? musicAnalyzingCount : 0);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="board">
                {/* v1.10.7: banner globale analisi su colonne nascoste */}
                {hiddenAnalyzingCount > 0 && (
                    <div className="scan global">
                        <span className="led a pulse" />
                        <span>{t('grid.silenceScanHiddenColumns', 'Rilevamento silenzio su colonne nascoste… {{count}} file in analisi', { count: hiddenAnalyzingCount })}</span>
                    </div>
                )}
                {/* v1.10.7: tutte le colonne nascoste → board vuota senza spiegazione */}
                {visibleColumns.length === 0 && (
                    <div className="board-empty">
                        <b>{t('grid.allColumnsHidden', 'Tutte le colonne sono nascoste')}</b>
                        <span>{t('grid.reenableHint', 'Riattivale da Impostazioni → Generali → "Layout regia — colonne"')}</span>
                    </div>
                )}
                {visibleColumns.map((col) => (
                    <SortableColumn
                        key={col.id}
                        column={col}
                        onNativeDrop={handleNativeDrop}
                        onNativeDragOver={handleNativeDragOver}
                        onNativeDragLeave={handleNativeDragLeave}
                    >
                        {col.type === 'preshow' && preshowAnalyzingCount > 0 && (
                            <div className="scan">
                                <span className="led a pulse" />
                                <span>{t('grid.silenceScanPreshow', 'Rilevamento silenzio… {{count}} file in analisi', { count: preshowAnalyzingCount })}</span>
                            </div>
                        )}
                        {col.type === 'music' && musicAnalyzingCount > 0 && (
                            <div className="scan">
                                <span className="led a pulse" />
                                <span>{t('grid.silenceScanMusic', 'Rilevamento silenzio… {{count}} canzoni in analisi', { count: musicAnalyzingCount })}</span>
                            </div>
                        )}
                        <SortableContext
                            items={col.clips.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {col.clips.map((clip, idx) => (
                                <React.Fragment key={clip.id}>
                                    {dropIndicator?.colId === col.id && dropIndicator.index === idx && (
                                        <div className="drop-line" />
                                    )}
                                    <SortableClip
                                        clip={clip}
                                        onEdit={(clip) => setEditingClip(clip)}
                                    />
                                </React.Fragment>
                            ))}
                            {dropIndicator?.colId === col.id && dropIndicator.index === col.clips.length && (
                                <div className="drop-line" />
                            )}
                        </SortableContext>

                        {col.clips.length === 0 && (
                            <div className="col-empty">
                                <Upload size={22} />
                                <span>{t('grid.dropAudioHere', 'Trascina qui i file audio')}</span>
                            </div>
                        )}
                    </SortableColumn>
                ))}

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeClip ? (
                        <ClipCard clip={activeClip} onEdit={() => { }} />
                    ) : null}
                </DragOverlay>

                {/* SETTINGS MODAL */}
                {editingClip && (
                    <ClipSettingsModal
                        clip={editingClip}
                        isOpen={true}
                        onClose={() => setEditingClip(null)}
                        onSave={handleSaveClip}
                        onDelete={handleDeleteClip}
                    />
                )}
            </div>
        </DndContext>
    );
};
