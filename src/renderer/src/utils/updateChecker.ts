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

export const checkForUpdates = async (currentVersion: string): Promise<UpdateInfo> => {
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
        if (!remoteVersion || remoteVersion === currentVersion) {
            return { hasUpdate: false, remoteVersion: currentVersion };
        }

        // Rileva la piattaforma corrente e prendi l'URL di download specifico
        const platform: string = window.electron?.getPlatform?.() || 'win32';
        const platformKey = platform === 'darwin' ? 'darwin' : platform === 'linux' ? 'linux' : 'win32';
        const asset: PlatformAsset | undefined = data.platforms?.[platformKey];

        return {
            hasUpdate: true,
            remoteVersion,
            releaseNotes: data.releaseNotes || '',
            releaseDate: data.releaseDate || '',
            downloadUrl: asset?.url || '',
            downloadFilename: asset?.filename || '',
        };

    } catch (error) {
        console.warn('[Updater] Controllo aggiornamenti fallito:', error);
        return { hasUpdate: false, remoteVersion: '' };
    }
};
