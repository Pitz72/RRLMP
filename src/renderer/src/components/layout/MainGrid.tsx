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
import { classifySilenceResult } from '../../utils/silenceDetection';
import { classifyBpmResult } from '../../utils/bpmDetection';

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

    // Spectrum: variabili colore per-colonna (derivazione 1:1 dal prototipo —
    // tint=+22, border=+55, glow=+88). Solo presentazione: il colore è quello
    // già scelto per la colonna nello store.
    const c = column.customColor || column.color;
    const colVars = {
        '--col-color': c,
        '--col-tint': `${c}22`,
        '--col-border': `${c}55`,
        '--col-glow': `${c}88`,
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            className="col flex-1 min-w-0"
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
    const { columns, addClipAtIndex, updateClip, removeClip, moveClip, moveSelectedClips, currentFilePath } = useProjectStore();
    const { loadClip, playColumn } = useAudioStore((state) => ({
        loadClip: state.loadClip,
        playColumn: state.playColumn
    }));
    // Controllo Remoto (2026-07-01, Step 4/N) — sottoscrizione reattiva separata:
    // serve solo per sapere QUALI clip sono in play, non richiede altro dallo store.
    const activeClips = useAudioStore((state) => state.activeClips);
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

            if (e.key.startsWith('F')) {
                const fKey = parseInt(e.key.substring(1));
                if (!isNaN(fKey) && fKey >= 1 && fKey <= 5) {
                    e.preventDefault();
                    playColumn(fKey - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingClip, playColumn]); // columns letto via getState(); stopAll non usato qui

    // AUTO-SILENCE DETECTION BATCH — colonna Music al caricamento progetto
    useEffect(() => {
        if (!currentFilePath) return;
        const freshColumns = useProjectStore.getState().columns;
        const musicCol = freshColumns.find(c => c.type === 'music');
        if (!musicCol) return;

        // v1.7.1: gate su silenceCheckedV2 (non più il vecchio silenceChecked, che
        // poteva risultare true senza analisi reale — vedi tipo in types/index.ts).
        // Nei .lmp esistenti nessuna clip lo possiede ancora: al primo caricamento
        // dopo l'aggiornamento QUESTO batch ricontrolla realmente ogni clip una volta.
        const unanalyzed = musicCol.clips.filter(c => !c.silenceCheckedV2 && !c.isMissing);
        debugLog(`AutoSilence[music] load: ${musicCol.clips.length} clip totali, ${unanalyzed.length} da analizzare (silenceCheckedV2 assente/false)`, 'info');
        if (unanalyzed.length === 0 || !window.electron?.detectSilence) return;

        setMusicAnalyzingCount(unanalyzed.length);
        let processed = 0;
        let optimized = 0;

        unanalyzed.forEach(clip => {
            updateClip('col-music', clip.id, { isAnalyzing: true });
            window.electron.detectSilence(clip.path).then(result => {
                const r = classifySilenceResult(result);
                if (r.checked) {
                    updateClip('col-music', clip.id, {
                        ...(r.trimStart !== undefined ? { trimStart: r.trimStart, trimEnd: r.trimEnd } : {}),
                        isAnalyzing: false,
                        silenceCheckedV2: true
                    });
                    if (r.trimStart !== undefined) optimized++;
                } else {
                    updateClip('col-music', clip.id, { isAnalyzing: false });
                    debugLog(`AutoSilence[music]: analisi fallita per "${clip.name}" (${result.error ?? 'errore sconosciuto'}) — riprovo al prossimo caricamento`, 'error');
                }
                processed++;
                setMusicAnalyzingCount(n => Math.max(0, n - 1));
                if (processed === unanalyzed.length && optimized > 0) {
                    toast(`Silenzio rimosso automaticamente da ${optimized} canzon${optimized === 1 ? 'e' : 'i'}.`, 'success');
                }
            }).catch((err) => {
                updateClip('col-music', clip.id, { isAnalyzing: false });
                debugLog(`AutoSilence[music]: eccezione per "${clip.name}": ${err}`, 'error');
                processed++;
                setMusicAnalyzingCount(n => Math.max(0, n - 1));
            });
        });
    }, [currentFilePath]); // eslint-disable-line react-hooks/exhaustive-deps

    // AUTO-SILENCE DETECTION BATCH — colonna PRE-SHOW al caricamento progetto (2026-07-01)
    // Analogo al batch MUSIC qui sopra: rende AUTOMATICO il rilevamento silenzio anche
    // sulle clip PRE-SHOW già caricate (prima avveniva solo al drop di un file o dietro
    // un prompt nel pulsante "Carica Progetto") → transizioni PRE-SHOW ottimizzate senza
    // intervento manuale. Parte a ogni cambio di currentFilePath (qualunque via di load).
    useEffect(() => {
        if (!currentFilePath) return;
        const freshColumns = useProjectStore.getState().columns;
        const preshowCol = freshColumns.find(c => c.type === 'preshow');
        if (!preshowCol) {
            debugLog('AutoSilence[preshow] load: nessuna colonna con type="preshow" trovata nel progetto', 'error');
            return;
        }

        const unanalyzed = preshowCol.clips.filter(c => !c.silenceCheckedV2 && !c.isMissing);
        debugLog(`AutoSilence[preshow] load: colonna id="${preshowCol.id}", ${preshowCol.clips.length} clip totali, ${unanalyzed.length} da analizzare (silenceCheckedV2 assente/false)`, 'info');
        if (unanalyzed.length === 0 || !window.electron?.detectSilence) return;

        setPreshowAnalyzingCount(unanalyzed.length);
        let processed = 0;
        let optimized = 0;

        unanalyzed.forEach(clip => {
            updateClip('col-preshow', clip.id, { isAnalyzing: true });
            window.electron.detectSilence(clip.path).then(result => {
                const r = classifySilenceResult(result);
                if (r.checked) {
                    updateClip('col-preshow', clip.id, {
                        ...(r.trimStart !== undefined ? { trimStart: r.trimStart, trimEnd: r.trimEnd } : {}),
                        isAnalyzing: false,
                        silenceCheckedV2: true
                    });
                    if (r.trimStart !== undefined) optimized++;
                } else {
                    updateClip('col-preshow', clip.id, { isAnalyzing: false });
                    debugLog(`AutoSilence[preshow]: analisi fallita per "${clip.name}" (${result.error ?? 'errore sconosciuto'}) — riprovo al prossimo caricamento`, 'error');
                }
                processed++;
                setPreshowAnalyzingCount(n => Math.max(0, n - 1));
                if (processed === unanalyzed.length && optimized > 0) {
                    toast(`Silenzio rimosso automaticamente da ${optimized} clip PRE-SHOW.`, 'success');
                }
            }).catch((err) => {
                updateClip('col-preshow', clip.id, { isAnalyzing: false });
                debugLog(`AutoSilence[preshow]: eccezione per "${clip.name}": ${err}`, 'error');
                processed++;
                setPreshowAnalyzingCount(n => Math.max(0, n - 1));
            });
        });
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

        const unanalyzed = musicCol.clips.filter(c => !c.bpmCheckedV2 && !c.isMissing);
        if (unanalyzed.length === 0 || !window.electron?.detectBpm) return;
        debugLog(`AutoBpm[music] load: ${musicCol.clips.length} clip totali, ${unanalyzed.length} da analizzare (bpmCheckedV2 assente/false)`, 'info');

        unanalyzed.forEach(clip => {
            window.electron.detectBpm(clip.path).then(result => {
                const r = classifyBpmResult(result);
                if (r.checked) {
                    updateClip('col-music', clip.id, {
                        ...(r.bpm !== undefined ? { bpm: r.bpm } : {}),
                        ...(r.beatOffsetSec !== undefined ? { beatOffsetSec: r.beatOffsetSec } : {}),
                        ...(r.confidence !== undefined ? { bpmConfidence: r.confidence } : {}),
                        bpmCheckedV2: true
                    });
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
    const musicColumnForRemote = columns.find(c => c.type === 'music');
    useEffect(() => {
        if (!window.electron?.publishRemoteState) return;
        const clips = (musicColumnForRemote?.clips ?? []).map(c => ({
            id: c.id,
            name: c.title || c.name,
            isPlaying: !!activeClips[c.id]
        }));
        window.electron.publishRemoteState(clips);
    }, [musicColumnForRemote, activeClips]);

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
                    updateClip(colId, newClip.id, { isAnalyzing: true });
                    if (isPreshow) setPreshowAnalyzingCount(n => n + 1);
                    else setMusicAnalyzingCount(n => n + 1);
                    window.electron.detectSilence(newClip.path).then(result => {
                        const r = classifySilenceResult(result);
                        if (r.checked) {
                            updateClip(colId, newClip.id, {
                                ...(r.trimStart !== undefined ? { trimStart: r.trimStart, trimEnd: r.trimEnd } : {}),
                                isAnalyzing: false,
                                silenceCheckedV2: true
                            });
                            if (r.trimStart !== undefined) debugLog(`AutoSilence [${newClip.name}]: trimStart=${r.trimStart}s, trimEnd=${r.trimEnd}s`, 'info');
                        } else {
                            updateClip(colId, newClip.id, { isAnalyzing: false });
                            debugLog(`AutoSilence [${newClip.name}]: analisi fallita (${result.error ?? 'errore sconosciuto'}) — riprovo al prossimo caricamento`, 'error');
                        }
                    }).catch((err) => {
                        updateClip(colId, newClip.id, { isAnalyzing: false });
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
                                bpmCheckedV2: true
                            });
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
            <div className="flex h-full w-full text-white overflow-hidden relative gap-2.5 px-4 pb-4 pt-1">
                {/* v1.10.7: banner globale analisi su colonne nascoste */}
                {hiddenAnalyzingCount > 0 && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-amber-950/80 border border-amber-500/40 rounded text-amber-300 text-[10px] flex items-center gap-2 pointer-events-none">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        <span>Rilevamento silenzio su colonne nascoste… {hiddenAnalyzingCount} file in analisi</span>
                    </div>
                )}
                {/* v1.10.7: tutte le colonne nascoste → board vuota senza spiegazione */}
                {visibleColumns.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-2">
                        <span className="text-sm font-semibold">Tutte le colonne sono nascoste</span>
                        <span className="text-xs">Riattivale da Impostazioni → Generali → "Layout regia — colonne"</span>
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
                            <div className="mx-2 mb-1 px-2 py-1.5 bg-amber-950/60 border border-amber-500/40 rounded text-amber-300 text-[10px] flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                <span>Rilevamento silenzio… {preshowAnalyzingCount} file in analisi</span>
                            </div>
                        )}
                        {col.type === 'music' && musicAnalyzingCount > 0 && (
                            <div className="mx-2 mb-1 px-2 py-1.5 bg-red-950/60 border border-red-500/40 rounded text-red-300 text-[10px] flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                                <span>Rilevamento silenzio… {musicAnalyzingCount} canzon{musicAnalyzingCount === 1 ? 'e' : 'i'} in analisi</span>
                            </div>
                        )}
                        <SortableContext
                            items={col.clips.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {col.clips.map((clip, idx) => (
                                <React.Fragment key={clip.id}>
                                    {dropIndicator?.colId === col.id && dropIndicator.index === idx && (
                                        <div className="h-0.5 rounded mx-0.5 shadow-[0_0_8px_rgba(96,165,250,0.9)] pointer-events-none" style={{ backgroundColor: '#60a5fa' }} />
                                    )}
                                    <SortableClip
                                        clip={clip}
                                        onEdit={(clip) => setEditingClip(clip)}
                                    />
                                </React.Fragment>
                            ))}
                            {dropIndicator?.colId === col.id && dropIndicator.index === col.clips.length && (
                                <div className="h-0.5 rounded mx-0.5 shadow-[0_0_8px_rgba(96,165,250,0.9)] pointer-events-none" style={{ backgroundColor: '#60a5fa' }} />
                            )}
                        </SortableContext>

                        {col.clips.length === 0 && (
                            <div className="h-32 border-2 border-dashed border-zinc-800 rounded flex flex-col items-center justify-center text-zinc-600 m-2 pointer-events-none">
                                <Upload size={24} className="mb-2 opacity-50" />
                                <span className="text-xs">Drop Audio Here</span>

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
