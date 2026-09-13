// Auto-Updater (2026-07-02) — sostituisce il vecchio updateChecker.ts lato
// renderer (fetch verso ecosystem.mruntimeradio.com, mai installazione
// automatica) con electron-updater reale puntato sulle release GitHub del
// progetto (provider GitHub, config in package.json#build.publish).
//
// v1.15.33 (apertura del sorgente): le release stanno su Pitz72/RRLMP, lo stesso
// repository del codice. Fino alla 1.15.32 erano su Ecosystem-Runtime/RRLMP-Releases,
// dove la 1.15.33 è pubblicata anche come release ponte.
//
// Due percorsi, in base a cosa la piattaforma può davvero auto-installare:
// - NATIVO (Windows NSIS, Linux AppImage in esecuzione): electron-updater
//   reale — check/download/quitAndInstall, `autoDownload:false` così il
//   download parte solo quando l'utente preme "Scarica" nel popup (mai
//   in automatico, come richiesto).
// - FALLBACK (macOS compilato dal sorgente, Linux .deb — electron-updater non può
//   installare in modo affidabile): confronto versione via GitHub Releases
//   API + apertura pagina di download nel browser, stesso comportamento
//   "manuale" che aveva il vecchio sistema.
// In entrambi i casi il renderer riceve lo stesso evento `updater:status`
// e decide la UI in base al campo `canAutoInstall`.
import { app, shell, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { logger } from './logger';

const RELEASES_API = 'https://api.github.com/repos/Pitz72/RRLMP/releases/latest';
const STARTUP_CHECK_DELAY_MS = 3000; // stesso valore collaudato in FeedDownloader — lascia respirare il render iniziale

export type UpdaterStatusPayload =
    | { type: 'checking' }
    | { type: 'not-available' }
    | { type: 'available'; version: string; canAutoInstall: boolean; downloadUrl?: string; releaseNotes?: string }
    | { type: 'downloading'; percent: number }
    | { type: 'ready'; version: string; canAutoInstall: boolean; releaseNotes?: string }
    | { type: 'error'; message: string };

let windowGetter: (() => BrowserWindow | null) | null = null;
let lastAvailable: { canAutoInstall: boolean; downloadUrl?: string } | null = null;
// v1.15.10: le note di rilascio arrivano con 'update-available', ma il popup può
// restare aperto fino a 'ready' (download completato) — memorizziamole per poterle
// rimostrare anche nello stato 'ready', dove info.releaseNotes può essere assente.
let lastReleaseNotes = '';
let nativeEventsWired = false;

// Stessa policy di isSafeExternalUrl in index.ts (SEC audit 2026-05-29): solo
// http/https possono essere aperti nel browser di sistema — l'URL qui arriva
// dalla GitHub Releases API, non da input utente, ma la difesa in profondità
// non costa nulla.
function isSafeExternalUrl(url: unknown): boolean {
    if (typeof url !== 'string' || !url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

// Confronto semver puro (major.minor.patch, suffissi pre-release ignorati) —
// stessa logica di updateChecker.ts, portata qui perché il fallback gira nel
// main process e non deve dipendere dal renderer.
function compareSemver(a: string, b: string): number {
    const parse = (v: string) =>
        v.trim().replace(/^v/i, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
    const pa = parse(a);
    const pb = parse(b);
    for (let i = 0; i < 3; i++) {
        const da = pa[i] ?? 0;
        const db = pb[i] ?? 0;
        if (da !== db) return da - db;
    }
    return 0;
}

function emit(payload: UpdaterStatusPayload): void {
    if (payload.type === 'available') {
        lastAvailable = { canAutoInstall: payload.canAutoInstall, downloadUrl: payload.downloadUrl };
    }
    const win = windowGetter?.();
    if (win && !win.isDestroyed()) {
        win.webContents.send('updater:status', payload);
    }
}

// Windows: sempre nativo. Linux: solo se davvero in esecuzione come AppImage
// (electron-updater non sa applicare l'update a un pacchetto .deb). macOS:
// mai nativo — Squirrel.Mac richiede una firma valida che non abbiamo.
function canUseNativeUpdater(): boolean {
    if (!app.isPackaged) return false;
    if (process.platform === 'win32') return true;
    if (process.platform === 'linux') return !!process.env.APPIMAGE;
    return false;
}

function wireNativeEventsOnce(): void {
    if (nativeEventsWired) return;
    nativeEventsWired = true;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    autoUpdater.on('checking-for-update', () => emit({ type: 'checking' }));
    autoUpdater.on('update-available', (info) => {
        lastReleaseNotes = typeof info.releaseNotes === 'string' ? info.releaseNotes : '';
        emit({
            type: 'available',
            version: info.version,
            canAutoInstall: true,
            releaseNotes: lastReleaseNotes
        });
    });
    autoUpdater.on('update-not-available', () => emit({ type: 'not-available' }));
    autoUpdater.on('download-progress', (progress) => {
        emit({ type: 'downloading', percent: Math.round(progress.percent) });
    });
    autoUpdater.on('update-downloaded', (info) => {
        const notes = typeof info.releaseNotes === 'string' && info.releaseNotes ? info.releaseNotes : lastReleaseNotes;
        emit({ type: 'ready', version: info.version, canAutoInstall: true, releaseNotes: notes });
    });
    autoUpdater.on('error', (err) => {
        logger.error('[UpdateManager] electron-updater error:', err);
        emit({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    });
}

async function fallbackCheck(): Promise<void> {
    emit({ type: 'checking' });
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        // 2026-07-04: media type html+json aggiunge `body_html` (markdown già
        // renderizzato da GitHub) — stesso formato HTML che il percorso nativo
        // riceve dal feed Atom di electron-updater (vedi GitHubProvider), così
        // la UI (UpdateModal) può trattare le note di rilascio allo stesso modo
        // su tutte le piattaforme invece di mostrare la sintassi Markdown grezza.
        const res = await fetch(RELEASES_API, {
            headers: { Accept: 'application/vnd.github.html+json', 'User-Agent': 'RRLMP-UpdateManager' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
            emit({ type: 'not-available' });
            return;
        }
        const data = (await res.json()) as { tag_name?: string; body?: string; body_html?: string; html_url?: string; assets?: Array<{ name: string; browser_download_url: string }> };
        const remoteVersion = String(data.tag_name || '').replace(/^v/i, '');
        const currentVersion = app.getVersion();
        if (!remoteVersion || compareSemver(remoteVersion, currentVersion) <= 0) {
            emit({ type: 'not-available' });
            return;
        }
        // Dalla 1.15.33 non esiste più un .dmg ufficiale: su macOS nessun asset
        // corrisponde e si apre la pagina della release (codice sorgente).
        const asset = process.platform === 'linux'
            ? (data.assets || []).find((a) => a.name.endsWith('.deb'))
            : undefined;
        const downloadUrl = asset?.browser_download_url || data.html_url;
        emit({
            type: 'available',
            version: remoteVersion,
            canAutoInstall: false,
            downloadUrl,
            releaseNotes: data.body_html || data.body || ''
        });
    } catch (err) {
        logger.warn('[UpdateManager] fallback check fallito:', err);
        emit({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
}

export async function checkForUpdates(): Promise<void> {
    if (!app.isPackaged) {
        emit({ type: 'not-available' });
        return;
    }
    if (canUseNativeUpdater()) {
        wireNativeEventsOnce();
        try {
            await autoUpdater.checkForUpdates();
        } catch (err) {
            logger.error('[UpdateManager] checkForUpdates (nativo) fallito:', err);
            emit({ type: 'error', message: err instanceof Error ? err.message : String(err) });
        }
    } else {
        await fallbackCheck();
    }
}

export async function downloadUpdate(): Promise<void> {
    if (!lastAvailable) return;
    if (lastAvailable.canAutoInstall) {
        try {
            await autoUpdater.downloadUpdate();
        } catch (err) {
            logger.error('[UpdateManager] downloadUpdate (nativo) fallito:', err);
            emit({ type: 'error', message: err instanceof Error ? err.message : String(err) });
        }
    } else if (lastAvailable.downloadUrl && isSafeExternalUrl(lastAvailable.downloadUrl)) {
        await shell.openExternal(lastAvailable.downloadUrl);
    }
}

export function quitAndInstall(): void {
    if (lastAvailable?.canAutoInstall) {
        autoUpdater.quitAndInstall();
    }
}

// Chiamata una sola volta da app.whenReady(). Il getter (anziché un riferimento
// diretto) evita di catturare una BrowserWindow potenzialmente ricreata più
// tardi — stesso motivo per cui index.ts usa `mainWindowRef` module-level.
export function initUpdateManager(getWindow: () => BrowserWindow | null): void {
    windowGetter = getWindow;
    if (canUseNativeUpdater()) {
        wireNativeEventsOnce();
    }
    if (app.isPackaged) {
        setTimeout(() => {
            checkForUpdates().catch((err) => logger.error('[UpdateManager] startup check fallito:', err));
        }, STARTUP_CHECK_DELAY_MS);
    }
}
