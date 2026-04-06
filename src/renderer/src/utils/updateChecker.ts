export interface UpdateInfo {
    hasUpdate: boolean;
    remoteVersion: string;
}

const UPDATE_URL = 'https://www.runtimeradio.it/versions.json'; // Placeholder URL

export const checkForUpdates = async (currentVersion: string): Promise<UpdateInfo> => {
    try {
        const response = await fetch(UPDATE_URL);
        if (!response.ok) {
            return { hasUpdate: false, remoteVersion: '' };
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn("Update check failed: Server returned non-JSON response (likely HTML error page)");
            return { hasUpdate: false, remoteVersion: '' };
        }

        const data = await response.json();
        // Assuming JSON structure: { "rrlmp": { "version": "0.8.2" } } or just { "version": "..." }
        // Adapting to a generic structure for now
        const remoteVersion = data.rrlmp?.version || data.version;

        if (remoteVersion && remoteVersion !== currentVersion) {
            // Very basic semantic version check (string inequality might be enough if strictly increasing)
            return { hasUpdate: true, remoteVersion };
        }

        return { hasUpdate: false, remoteVersion: currentVersion };

    } catch (error) {
        console.warn("Update check failed:", error);
        return { hasUpdate: false, remoteVersion: '' };
    }
};
