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
        const response = await fetch(UPDATE_URL, { cache: 'no-store' });
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
