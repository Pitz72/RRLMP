// v1.15.20 (G4) — Decodifica degli URL `media://` in path di filesystem.
//
// Estratto dall'handler `protocol.handle('media', ...)` di index.ts per due motivi:
// è logica pura (nessun fs, nessun electron) e finalmente testabile, e il caso UNC
// richiedeva di sostituire un `replace()` di stringa con un parsing vero.
//
// IL BUG CHE HA MOTIVATO QUESTO MODULO
// `toFileUrl()` (renderer) produceva per un path di rete `\\NAS\musica\x.mp3`
// l'URL `media://///NAS/musica/x.mp3`, e qui `url.replace(/^media:\/\/+/, '')`
// mangiava TUTTI gli slash iniziali lasciando `NAS/musica/x.mp3` — un path
// relativo, quindi respinto con 403. Il file però esisteva (`fs.existsSync` su UNC
// funziona), quindi l'integrity check NON marcava la clip come mancante: in griglia
// appariva perfettamente sana e, alla pressione, semplicemente non partiva.
//
// LA FORMA ADOTTATA
// Il server UNC viaggia nell'AUTHORITY dell'URL, dove sta di natura:
//   `\\NAS\musica\x.mp3`  → `media://NAS/musica/x.mp3`     (host = NAS)
//   `C:\audio\x.mp3`      → `media:///C:/audio/x.mp3`      (host vuoto, invariato)
//   `/home/u/x.mp3`       → `media:///home/u/x.mp3`        (host vuoto, invariato)
// `media` non è uno schema "speciale" per la specifica URL, quindi l'host viene
// conservato così com'è (maiuscole comprese) e non subisce normalizzazioni.

/**
 * Converte un URL `media://` nel path di filesystem corrispondente.
 * @param requestUrl URL completo della richiesta (`request.url`).
 * @param platform piattaforma di destinazione — iniettabile per i test.
 * @returns il path assoluto, oppure `null` se l'URL non è decodificabile in un
 *          path valido per quella piattaforma (il chiamante risponde 403).
 */
export function mediaUrlToFilePath(requestUrl: string, platform: NodeJS.Platform): string | null {
    if (typeof requestUrl !== 'string' || !requestUrl) return null;

    let host = '';
    let rawPath: string;
    try {
        const parsed = new URL(requestUrl);
        host = parsed.hostname;
        rawPath = parsed.pathname;
    } catch {
        // Fallback storico: se l'URL non è parsabile ci comportiamo come prima
        // della v1.15.20 (nessuna regressione sui casi che già funzionavano).
        rawPath = requestUrl.replace(/^media:\/\/+/, '/');
    }

    let filePath: string;
    try {
        filePath = decodeURIComponent(rawPath);
    } catch {
        return null; // percent-encoding malformato
    }

    if (host) {
        // Percorso di rete UNC. Concetto esclusivo di Windows: altrove le share si
        // montano come path POSIX e un host qui sarebbe un URL che non sappiamo servire.
        if (platform !== 'win32') return null;
        let decodedHost: string;
        try {
            decodedHost = decodeURIComponent(host);
        } catch {
            return null;
        }
        // Difesa: un host con separatori o `..` proverebbe a uscire dalla share.
        if (/[\\/]/.test(decodedHost) || decodedHost.includes('..')) return null;
        const share = filePath.replace(/\//g, '\\');
        return `\\\\${decodedHost}${share.startsWith('\\') ? '' : '\\'}${share}`;
    }

    if (platform === 'win32') {
        // `media:///C:/...` → pathname `/C:/...` → via lo slash davanti alla lettera di unità.
        if (/^\/[A-Za-z]:\//.test(filePath)) {
            filePath = filePath.slice(1);
        }
        return filePath.replace(/\//g, '\\');
    }

    // macOS / Linux: i path sono assoluti e cominciano con `/`. Gli slash iniziali
    // in eccesso vengono collassati: fino alla v1.15.19 `toFileUrl` produceva
    // `media:////home/...` e un `//home/...` grezzo confonderebbe `normalize()`.
    return filePath.startsWith('/') ? filePath.replace(/^\/+/, '/') : '/' + filePath;
}
