// v1.15.35 (G3) — Piano dei nomi per l'archivio `audio/` dell'export.
//
// L'export copia i file delle clip in `<cartella del .lmp>/audio/` e, dalla v1.15.9,
// ripunta le clip a quelle copie: da lì in poi l'archivio È il riferimento e gli
// originali possono essere cancellati. Fino alla 1.15.34 i nomi di destinazione
// venivano assegnati in ordine di scaletta, senza sapere quali file erano GIÀ
// nell'archivio. Una clip nuova con lo stesso nome file di una già archiviata, ma
// posizionata prima in scaletta, si prendeva il nome libero `x.mp3` e
// SOVRASCRIVEVA la copia archiviata; la clip archiviata veniva poi ricopiata da
// quel file (ormai sbagliato) in `x_1.mp3`. Risultato: l'audio originale della
// clip archiviata perso, e due clip che suonano lo stesso brano.
//
// Qui il piano si fa in due passate: prima si riservano i nomi dei file che stanno
// già nell'archivio (restano dove sono), poi si assegnano i nomi liberi agli altri.
// Una stessa sorgente usata da più clip riceve un solo nome (niente doppioni).
//
// Modulo puro (solo `path`): testabile senza Electron né disco.
import * as path from 'path';

export interface ArchivePlanEntry {
    /** Nome del file dentro `audio/`. */
    destName: string;
    /** true se la sorgente È già quel file dell'archivio: niente da copiare. */
    inPlace: boolean;
}

/**
 * @param sources path assoluti delle clip da archiviare, nell'ordine della scaletta;
 *   `null` per le clip da saltare (path vuoto o file inesistente).
 * @param audioDir cartella `audio/` di destinazione.
 * @param platform piattaforma dei path (`process.platform`): su Windows i path si
 *   confrontano senza distinguere maiuscole e minuscole.
 * @returns un elemento per ogni sorgente (`null` dove la sorgente era `null`).
 */
export function planArchiveNames(
    sources: ReadonlyArray<string | null>,
    audioDir: string,
    platform: NodeJS.Platform
): Array<ArchivePlanEntry | null> {
    const p = platform === 'win32' ? path.win32 : path.posix;
    const fold = (s: string) => (platform === 'win32' ? s.toLowerCase() : s);
    const keyOf = (s: string) => fold(p.normalize(s));
    const dirKey = keyOf(audioDir).replace(/[\\/]+$/, '');
    const isInArchive = (s: string) => fold(p.dirname(p.normalize(s))) === dirKey;

    // I nomi si confrontano SEMPRE senza maiuscole/minuscole (come prima): un
    // archivio esportato su Linux deve restare valido aperto su Windows.
    const used = new Set<string>();
    const nameBySource = new Map<string, string>();

    // 1ª passata: i file già nell'archivio tengono il proprio nome.
    for (const src of sources) {
        if (!src || !isInArchive(src)) continue;
        const key = keyOf(src);
        if (nameBySource.has(key)) continue;
        const name = p.basename(src);
        used.add(name.toLowerCase());
        nameBySource.set(key, name);
    }

    // 2ª passata: tutti gli altri prendono il primo nome libero.
    return sources.map((src) => {
        if (!src) return null;
        const key = keyOf(src);
        const known = nameBySource.get(key);
        if (known) return { destName: known, inPlace: isInArchive(src) };

        const fileName = p.basename(src);
        const dot = fileName.lastIndexOf('.');
        const base = dot > 0 ? fileName.slice(0, dot) : fileName;
        const ext = dot > 0 ? fileName.slice(dot) : '';
        let destName = fileName;
        let counter = 1;
        while (used.has(destName.toLowerCase())) {
            destName = `${base}_${counter++}${ext}`;
        }
        used.add(destName.toLowerCase());
        nameBySource.set(key, destName);
        return { destName, inPlace: false };
    });
}
