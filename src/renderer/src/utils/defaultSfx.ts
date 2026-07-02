import { useProjectStore } from '../store/useProjectStore';
import { useAudioStore } from '../store/useAudioStore';
import type { AudioClip } from '../types';

/**
 * v1.10.9 — Popola la colonna FX con la libreria di default (CC0, bundlata)
 * SOLO su progetto "vergine": nessun `.lmp` caricato E colonna FX vuota.
 *
 * Nato in v1.10.8 come effect di solo-avvio in App.tsx; estratto qui e chiamato
 * ANCHE dopo "Nuovo Progetto" perché `resetProject()` svuota le colonne DOPO il
 * popolamento di avvio → il pad tornava vuoto (bug segnalato in dev 2026-07-02).
 *
 * Dopo il popolamento isDirty/undo vengono azzerati: il progetto di partenza
 * resta "pulito" (niente prompt di salvataggio spuri, niente passo undo
 * fantasma). Il doppio check su currentFilePath (prima e dopo l'IPC) evita di
 * interferire con l'apertura di un `.lmp` arrivata nel frattempo (doppio click).
 */
export async function populateDefaultFxIfVirgin(): Promise<void> {
    try {
        const ps = useProjectStore.getState();
        if (ps.currentFilePath) return;
        const sfx = ps.columns.find((c) => c.type === 'sfx');
        if (!sfx || sfx.clips.length > 0) return;
        if (!window.electron?.restoreDefaultSfx) return;

        const res = await window.electron.restoreDefaultSfx();
        if (!res.success || !res.sounds || res.sounds.length === 0) return;

        const fresh = useProjectStore.getState();
        if (fresh.currentFilePath) return; // nel frattempo è arrivato un .lmp
        const freshSfx = fresh.columns.find((c) => c.type === 'sfx');
        if (!freshSfx || freshSfx.clips.length > 0) return;

        const added: AudioClip[] = [];
        for (const s of res.sounds) {
            const clip = fresh.addClipFromPath(freshSfx.id, s.path);
            if (clip) added.push(clip);
        }
        useProjectStore.setState({ isDirty: false, undoStack: [], redoStack: [] });
        for (const c of added) await useAudioStore.getState().loadClip(c);
    } catch { /* best-effort: senza libreria il pad resta semplicemente vuoto */ }
}
