// Apertura di link esterni su richiesta del renderer (IPC 'open-external').
//
// Apertura del sorgente (Fase 1): non è un «apri questo URL» generico. Il renderer
// passa un indirizzo, ma viene onorato solo se è https verso un elenco chiuso di
// host del progetto: un renderer compromesso non può usarlo come lanciatore di
// schemi o di siti arbitrari. Stesso criterio di FeedDownloader Pro.
//
// Restano fuori da questa regola, e hanno la loro validazione http/https:
// - i link cliccati dentro l'interfaccia (setWindowOpenHandler in index.ts);
// - il fallback dell'auto-updater su macOS/.deb (updateManager.ts), che apre
//   l'indirizzo della release restituito dall'API di GitHub.

export const ALLOWED_EXTERNAL_HOSTS: ReadonlySet<string> = new Set([
    'github.com',                   // codice sorgente e pagina delle release
    'raw.githubusercontent.com',    // PDF dei manuali
    'simonepizzi.runtimeradio.it',  // contatti
    'runtimeradio.com',             // sito di Runtime Radio
    'www.paypal.com',               // sostegno al progetto
]);

export function isAllowedExternalUrl(url: unknown): boolean {
    if (typeof url !== 'string' || !url) return false;
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return false;
    }
    return parsed.protocol === 'https:' && ALLOWED_EXTERNAL_HOSTS.has(parsed.hostname);
}
