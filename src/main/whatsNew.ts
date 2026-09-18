// Schermata «Novità» dopo un aggiornamento (v1.15.34) — standard di distribuzione
// Runtime Desktop 2.0, §4, modello Titan (`consume-whats-new`).
//
// La decisione vive nel main e non in localStorage: il renderer non sa
// distinguere una prima installazione da chi aggiorna da una versione che il
// flag non l'aveva ancora (entrambi senza versione salvata). Il main invece può
// guardare nella cartella dei dati se l'app è già stata usata.

import * as fs from 'fs';
import { join } from 'path';

/**
 * @param previous      versione salvata all'ultimo «consume» (null = mai salvata)
 * @param current       versione in esecuzione
 * @param hasUserData   la cartella dei dati conteneva già dati dell'app all'avvio
 * @returns true se la schermata va mostrata (una volta sola)
 */
export function evaluateWhatsNew(previous: string | null, current: string, hasUserData: boolean): boolean {
    // Utente "esistente": gli abbiamo già salvato una versione oppure, per chi
    // arriva da versioni senza il flag, l'app aveva già dati suoi. La seconda
    // clausola è obbligatoria: senza, chi aggiorna dalla 1.15.33 non vedrebbe nulla.
    const existingUser = previous !== null || hasUserData;
    return existingUser && previous !== current;
}

// Tracce che solo un'app già avviata lascia nella cartella dei dati: le
// impostazioni del renderer (localStorage), i salvataggi automatici, i suoni FX
// copiati. Vanno lette PRIMA di aprire la finestra: dopo, anche una prima
// installazione avrebbe già il suo localStorage.
const USER_DATA_MARKERS = [join('Local Storage', 'leveldb'), 'autosaves', 'default-sfx'];

export function detectExistingUserData(userDataPath: string): boolean {
    return USER_DATA_MARKERS.some((m) => fs.existsSync(join(userDataPath, m)));
}

// Impostazioni del main: un piccolo JSON nella cartella dei dati. Per ora
// contiene solo `lastSeenVersion`.
const SETTINGS_FILE = 'main-settings.json';

interface MainSettings {
    lastSeenVersion?: string;
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

export interface WhatsNewResult {
    shouldShow: boolean;
    previousVersion: string | null;
    currentVersion: string;
}

/**
 * Decide e segna come vista la versione corrente: una seconda chiamata nella
 * stessa versione restituisce sempre false.
 */
export function consumeWhatsNew(userDataPath: string, currentVersion: string, hasUserData: boolean): WhatsNewResult {
    const settings = readMainSettings(userDataPath);
    const previous = typeof settings.lastSeenVersion === 'string' ? settings.lastSeenVersion : null;
    const shouldShow = evaluateWhatsNew(previous, currentVersion, hasUserData);
    if (previous !== currentVersion) {
        try {
            writeMainSettings(userDataPath, { ...settings, lastSeenVersion: currentVersion });
        } catch {
            // Scrittura fallita (disco pieno, permessi): la schermata riapparirà
            // al prossimo avvio. Meglio che bloccare l'avvio dell'app.
        }
    }
    return { shouldShow, previousVersion: previous, currentVersion };
}
