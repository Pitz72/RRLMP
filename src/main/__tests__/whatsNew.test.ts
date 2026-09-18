import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { evaluateWhatsNew, detectExistingUserData, consumeWhatsNew, readMainSettings } from '../whatsNew';

describe('evaluateWhatsNew', () => {
    it('prima installazione pulita: niente schermata', () => {
        expect(evaluateWhatsNew(null, '1.15.34', false)).toBe(false);
    });
    it('aggiornamento da una versione senza il flag (dati presenti): schermata', () => {
        expect(evaluateWhatsNew(null, '1.15.34', true)).toBe(true);
    });
    it('aggiornamento da una versione con il flag: schermata', () => {
        expect(evaluateWhatsNew('1.15.34', '1.15.35', false)).toBe(true);
    });
    it('stessa versione: niente schermata', () => {
        expect(evaluateWhatsNew('1.15.34', '1.15.34', true)).toBe(false);
    });
});

describe('consumeWhatsNew', () => {
    let dir: string;
    beforeEach(() => { dir = fs.mkdtempSync(join(os.tmpdir(), 'rrlmp-whatsnew-')); });
    afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

    it('riconosce i dati di un utente esistente', () => {
        expect(detectExistingUserData(dir)).toBe(false);
        fs.mkdirSync(join(dir, 'Local Storage', 'leveldb'), { recursive: true });
        expect(detectExistingUserData(dir)).toBe(true);
    });

    it('mostra una volta sola dopo l\'aggiornamento e salva la versione', () => {
        const first = consumeWhatsNew(dir, '1.15.34', true);
        expect(first).toEqual({ shouldShow: true, previousVersion: null, currentVersion: '1.15.34' });
        expect(readMainSettings(dir).lastSeenVersion).toBe('1.15.34');
        expect(consumeWhatsNew(dir, '1.15.34', true).shouldShow).toBe(false);
        expect(consumeWhatsNew(dir, '1.15.35', true).shouldShow).toBe(true);
    });

    it('prima installazione: non mostra, ma registra la versione', () => {
        expect(consumeWhatsNew(dir, '1.15.34', false).shouldShow).toBe(false);
        expect(readMainSettings(dir).lastSeenVersion).toBe('1.15.34');
    });

    it('file di impostazioni rovinato: trattato come assente', () => {
        fs.writeFileSync(join(dir, 'main-settings.json'), '{non json');
        expect(consumeWhatsNew(dir, '1.15.34', true).shouldShow).toBe(true);
    });
});
