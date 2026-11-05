// Impostazioni del main: un piccolo JSON nella cartella dei dati
// (`main-settings.json`). Nato con la schermata «Novità» (v1.15.34, vedi
// whatsNew.ts), dalla 1.15.37 ospita anche le preferenze del Controllo Remoto,
// che devono vivere nel main perché il server parte prima che il renderer
// abbia caricato le sue impostazioni (avvio automatico).

import * as fs from 'fs';
import { join } from 'path';

const SETTINGS_FILE = 'main-settings.json';

export interface MainSettings {
    lastSeenVersion?: string;
    /** v1.15.37: PIN del Controllo Remoto, stabile fra un avvio e l'altro. */
    remotePin?: string;
    /** v1.15.37: il Controllo Remoto parte da solo all'apertura dell'app (opt-in). */
    remoteAutoStart?: boolean;
}

export function readMainSettings(userDataPath: string): MainSettings {
    try {
        const parsed = JSON.parse(fs.readFileSync(join(userDataPath, SETTINGS_FILE), 'utf-8'));
        return parsed && typeof parsed === 'object' ? parsed as MainSettings : {};
    } catch {
        return {};
    }
}

export function writeMainSettings(userDataPath: string, settings: MainSettings): void {
    const target = join(userDataPath, SETTINGS_FILE);
    const tmp = `${target}.tmp`;
    fs.mkdirSync(userDataPath, { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(settings, null, 2), 'utf-8');
    fs.renameSync(tmp, target);
}

/**
 * Rilegge il file e cambia solo le chiavi indicate: chi scrive una preferenza non
 * deve cancellare quelle degli altri moduli. Errori di scrittura propagati al
 * chiamante, che decide se sono gravi.
 */
export function updateMainSettings(userDataPath: string, patch: Partial<MainSettings>): MainSettings {
    const next = { ...readMainSettings(userDataPath), ...patch };
    writeMainSettings(userDataPath, next);
    return next;
}
