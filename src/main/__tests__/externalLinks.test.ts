import { describe, it, expect } from 'vitest';
import { isAllowedExternalUrl, ALLOWED_EXTERNAL_HOSTS } from '../externalLinks';

describe('isAllowedExternalUrl', () => {
    it('accetta https verso gli host del progetto', () => {
        expect(isAllowedExternalUrl('https://github.com/Pitz72/RRLMP')).toBe(true);
        expect(isAllowedExternalUrl('https://raw.githubusercontent.com/Pitz72/RRLMP/master/manuale-utente/typst/Manuale-Utente-IT.pdf')).toBe(true);
        expect(isAllowedExternalUrl('https://simonepizzi.runtimeradio.it/contatti')).toBe(true);
        expect(isAllowedExternalUrl('https://runtimeradio.com')).toBe(true);
        expect(isAllowedExternalUrl('https://www.paypal.com/paypalme/runtimeradio')).toBe(true);
    });

    it('accetta l\'indirizzo reale dei manuali (manualLinks.ts)', () => {
        expect(isAllowedExternalUrl('https://raw.githubusercontent.com/Pitz72/RRLMP/master/manuale-utente/typst/User-Manual-EN.pdf')).toBe(true);
    });

    it('accetta ancora i manuali pubblicati su RRLMP-Releases (link delle versioni ≤ 1.15.32)', () => {
        expect(isAllowedExternalUrl('https://raw.githubusercontent.com/Ecosystem-Runtime/RRLMP-Releases/master/manuals/User-Manual-EN.pdf')).toBe(true);
    });

    it('rifiuta http anche verso un host consentito', () => {
        expect(isAllowedExternalUrl('http://github.com/Pitz72/RRLMP')).toBe(false);
    });

    it('rifiuta host non in elenco e sottodomini o domini che li imitano', () => {
        expect(isAllowedExternalUrl('https://example.com')).toBe(false);
        expect(isAllowedExternalUrl('https://github.com.evil.example/x')).toBe(false);
        expect(isAllowedExternalUrl('https://evilgithub.com/x')).toBe(false);
        expect(isAllowedExternalUrl('https://gist.github.com/x')).toBe(false);
        expect(isAllowedExternalUrl('https://paypal.com/x')).toBe(false);
    });

    it('non si lascia ingannare dalle credenziali nell\'URL', () => {
        // L'hostname reale qui è evil.example, non github.com
        expect(isAllowedExternalUrl('https://github.com@evil.example/x')).toBe(false);
    });

    it('rifiuta schemi pericolosi', () => {
        expect(isAllowedExternalUrl('file:///C:/Windows/System32/calc.exe')).toBe(false);
        expect(isAllowedExternalUrl('javascript:alert(1)')).toBe(false);
        expect(isAllowedExternalUrl('ms-settings:')).toBe(false);
    });

    it('rifiuta valori non stringa, vuoti o malformati', () => {
        expect(isAllowedExternalUrl(undefined)).toBe(false);
        expect(isAllowedExternalUrl(null)).toBe(false);
        expect(isAllowedExternalUrl(42)).toBe(false);
        expect(isAllowedExternalUrl('')).toBe(false);
        expect(isAllowedExternalUrl('not a url')).toBe(false);
    });

    it('l\'elenco degli host resta chiuso e piccolo', () => {
        expect([...ALLOWED_EXTERNAL_HOSTS].sort()).toEqual([
            'github.com',
            'raw.githubusercontent.com',
            'runtimeradio.com',
            'simonepizzi.runtimeradio.it',
            'www.paypal.com',
        ]);
    });
});
