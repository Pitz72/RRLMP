const UPDATE_URL = 'https://ecosystem.mruntimeradio.com/updates/rlmp/versions.json';

export interface PlatformAsset {
    url: string;
    filename: string;
}

export interface UpdateInfo {
    hasUpdate: boolean;
    remoteVersion: string;
    releaseNotes?: string;
    releaseDate?: string;
    downloadUrl?: string;
    downloadFilename?: string;
}

// BUILD-05 (v1.3.7): throttle a 24h tramite localStorage.
// WelcomeScreen + AboutModal chiamavano `checkForUpdates` ad ogni mount → ad ogni
// avvio dell'app il server `versions.json` riceve un hit, anche se l'utente apre
// e chiude RRLMP più volte al giorno per test. Con il throttle: se l'ultimo check
// è andato a buon fine entro 24h, restituiamo la risposta cached senza network.
// Il chiamante può passare `force: true` per bypassare (es. bottone "Controlla ora"
// in About). Cached info inclusi i campi della release così la UI mostra ancora il
// dialog se l'update era disponibile e l'utente l'aveva chiuso.
const CACHE_KEY = 'rrlmp.updateCheckCache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// AUDIT-ME (2026-05-29): confronto semver (major.minor.patch). Prima si usava solo
// `remoteVersion !== currentVersion` → qualsiasi differenza (anche una versione remota
// PIÙ VECCHIA, es. dopo un rollback del feed) veniva segnalata come aggiornamento
// disponibile, proponendo un downgrade. Ritorna > 0 se a > b, < 0 se a < b, 0 se uguali.
// Suffissi pre-release (es. "-beta") vengono ignorati nel confronto numerico.
const compareSemver = (a: string, b: string): number => {
    const parse = (v: string) =>
        v.trim().replace(/^v/i, '').split('-')[0].split('.').map(n => parseInt(n, 10) || 0);
    const pa = parse(a);
    const pb = parse(b);
    for (let i = 0; i < 3; i++) {
        const da = pa[i] ?? 0;
        const db = pb[i] ?? 0;
        if (da !== db) return da - db;
    }
    return 0;
};

interface UpdateCheckCache {
    timestamp: number;
    currentVersion: string;
    info: UpdateInfo;
}

const readCache = (currentVersion: string): UpdateInfo | null => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as UpdateCheckCache;
        if (parsed.currentVersion !== currentVersion) return null; // app aggiornata → invalida
        if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
        return parsed.info;
    } catch {
        return null;
    }
};

const writeCache = (currentVersion: string, info: UpdateInfo): void => {
    try {
        const payload: UpdateCheckCache = { timestamp: Date.now(), currentVersion, info };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch { /* quota piena / privato — ignora */ }
};

export const checkForUpdates = async (currentVersion: string, force = false): Promise<UpdateInfo> => {
    if (!force) {
        const cached = readCache(currentVersion);
        if (cached) return cached;
    }
    try {
        // MODAL-05 (v1.3.5): timeout 5s sulla fetch del feed update.
        // Senza, una rete lenta o un DNS che non risolve lascia la Promise pendente
        // per minuti. Le UI che chiamano checkForUpdates (WelcomeScreen, AboutModal)
        // restano in stato "Checking..." fino al timeout TCP del browser (default ~30s
        // su Chromium) — durante una diretta è inaccettabile.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(UPDATE_URL, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
            return { hasUpdate: false, remoteVersion: '' };
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[Updater] Risposta non-JSON dal server di aggiornamento.');
            return { hasUpdate: false, remoteVersion: '' };
        }

        const data = await response.json();
        const remoteVersion: string = data.version;
        // hasUpdate solo se la versione remota è STRETTAMENTE più recente (semver).
        if (!remoteVersion || compareSemver(remoteVersion, currentVersion) <= 0) {
            const info = { hasUpdate: false, remoteVersion: currentVersion };
            writeCache(currentVersion, info);
            return info;
        }

        // Rileva la piattaforma corrente e prendi l'URL di download specifico
        const platform: string = window.electron?.getPlatform?.() || 'win32';
        const platformKey = platform === 'darwin' ? 'darwin' : platform === 'linux' ? 'linux' : 'win32';
        const asset: PlatformAsset | undefined = data.platforms?.[platformKey];

        const info: UpdateInfo = {
            hasUpdate: true,
            remoteVersion,
            releaseNotes: data.releaseNotes || '',
            releaseDate: data.releaseDate || '',
            downloadUrl: asset?.url || '',
            downloadFilename: asset?.filename || '',
        };
        writeCache(currentVersion, info);
        return info;

    } catch (error) {
        console.warn('[Updater] Controllo aggiornamenti fallito:', error);
        // Non cachiamo i fallimenti — la prossima richiesta riproverà subito.
        return { hasUpdate: false, remoteVersion: '' };
    }
};
