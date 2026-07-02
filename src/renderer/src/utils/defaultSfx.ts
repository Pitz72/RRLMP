import { useProjectStore } from '../store/useProjectStore';
import { useAudioStore } from '../store/useAudioStore';
import type { AudioClip } from '../types';

/**
 * v1.11.2 — Popola la colonna FX con la libreria di default (CC0, bundlata)
 * ogni volta che il pad è VUOTO: progetto vergine, "Nuovo Progetto" E anche
 * apertura di un `.lmp` senza clip FX (richiesta utente 2026-07-02: prima
 * serviva un reset manuale per far apparire i suoni su un progetto caricato).
 * Un `.lmp` salvato CON clip FX resta ovviamente intatto: la regola scatta
 * solo a colonna vuota.
 *
 * Storia: nata in v1.10.8 come effect di solo-avvio in App.tsx; estratta in
 * v1.10.9 (populateDefaultFxIfVirgin) e chiamata anche dopo i resetProject;
 * generalizzata in v1.11.2 (il vincolo "nessun .lmp caricato" è stato tolto).
 *
 * Dopo il popolamento isDirty/undo vengono azzerati: i default sono la vista
 * di partenza, non una modifica (niente prompt di salvataggio spuri, niente
 * passo undo fantasma). Se poi l'utente salva, le clip finiscono nel `.lmp`
 * come qualunque altra. Il doppio check su currentFilePath (deve restare LO
 * STESSO prima e dopo l'IPC) evita di scrivere su un progetto diverso arrivato
 * nel frattempo (open-file da doppio click, load concorrente).
 */
export async function populateDefaultFxIfPadEmpty(): Promise<void> {
    try {
        const ps = useProjectStore.getState();
        const pathAtStart = ps.currentFilePath;
        const sfx = ps.columns.find((c) => c.type === 'sfx');
        if (!sfx || sfx.clips.length > 0) return;
        if (!window.electron?.restoreDefaultSfx) return;

        const res = await window.electron.restoreDefaultSfx();
        if (!res.success || !res.sounds || res.sounds.length === 0) return;

        const fresh = useProjectStore.getState();
        if (fresh.currentFilePath !== pathAtStart) return; // nel frattempo è cambiato progetto
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
