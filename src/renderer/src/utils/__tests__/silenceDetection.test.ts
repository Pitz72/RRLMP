import { describe, it, expect } from 'vitest';
import { decideSilenceUpdate, needsLegacyFingerprint, needsSilenceAnalysis } from '../silenceDetection';

// v1.7.1 — un'analisi fallita non è mai «controllata».
// v1.15.38 — tagli del vecchio rilevatore sostituiti, tagli dell'operatore conservati.

const ok = (trimStart: number, trimEnd: number, legacy?: { trimStart: number; trimEnd: number } | null) => ({
    success: true,
    data: { trimStart, trimEnd, ...(trimStart === 0 && trimEnd === 0 ? { noSilence: true } : {}), ...(legacy !== undefined ? { legacy } : {}) },
});

describe('decideSilenceUpdate', () => {
    it('analisi fallita (rate-limit, timeout) → niente da scrivere, si ritenta', () => {
        expect(decideSilenceUpdate({}, { success: false, error: 'IPC_RATE_LIMITED' })).toEqual({ reason: 'failed' });
        expect(decideSilenceUpdate({}, { success: true, data: null })).toEqual({ reason: 'failed' });
    });

    it('clip nuova → taglio nuovo e entrambi i gate', () => {
        const d = decideSilenceUpdate({}, ok(0.95, 1.85));
        expect(d.reason).toBe('applied');
        expect(d.patch).toEqual({ trimStart: 0.95, trimEnd: 1.85, silenceCheckedV2: true, silenceCheckedV3: true });
    });

    it('nessun silenzio → tagli esplicitamente a zero', () => {
        expect(decideSilenceUpdate({}, ok(0, 0)).patch).toMatchObject({ trimStart: 0, trimEnd: 0 });
    });

    it('caso «Splash! Boing!»: 105,517 s scritti dal vecchio rilevatore → sostituiti con 0', () => {
        const clip = { trimStart: 105.517, trimEnd: 0.19, silenceCheckedV2: true };
        const d = decideSilenceUpdate(clip, ok(0, 0, { trimStart: 105.517, trimEnd: 0.19 }));
        expect(d.reason).toBe('replacedLegacy');
        expect(d.changed).toBe(true);
        expect(d.patch).toMatchObject({ trimStart: 0, trimEnd: 0 });
    });

    it('taglio fatto a mano (diverso dall\'impronta) → resta com\'era', () => {
        const clip = { trimStart: 12.5, trimEnd: 0, silenceCheckedV2: true };
        const d = decideSilenceUpdate(clip, ok(0.05, 0, { trimStart: 0.1, trimEnd: 0 }));
        expect(d.reason).toBe('keptManual');
        expect(d.patch).toEqual({ silenceCheckedV2: true, silenceCheckedV3: true });
    });

    it('impronta non disponibile (vecchio rilevatore fallito) → si conserva, mai si sovrascrive alla cieca', () => {
        const clip = { trimStart: 0.4, trimEnd: 1, silenceCheckedV2: true };
        expect(decideSilenceUpdate(clip, ok(0, 0.5, null)).reason).toBe('keptManual');
        expect(decideSilenceUpdate(clip, ok(0, 0.5)).reason).toBe('keptManual');
    });

    it('clip già analizzata ma con tagli a zero → taglio nuovo', () => {
        const d = decideSilenceUpdate({ trimStart: 0, trimEnd: 0, silenceCheckedV2: true }, ok(0.3, 1.2));
        expect(d.reason).toBe('applied');
        expect(d.patch).toMatchObject({ trimStart: 0.3, trimEnd: 1.2 });
    });

    it('tolleranza: arrotondamenti a 3 decimali contano come la stessa impronta', () => {
        const clip = { trimStart: 0.0561, trimEnd: 0.546, silenceCheckedV2: true };
        const d = decideSilenceUpdate(clip, ok(0.08, 0.29, { trimStart: 0.056, trimEnd: 0.546 }));
        expect(d.reason).toBe('replacedLegacy');
        expect(d.changed).toBe(true);
    });
});

describe('needsLegacyFingerprint', () => {
    it('solo per clip già analizzate con almeno un taglio, e mai dopo il gate V3', () => {
        expect(needsLegacyFingerprint({})).toBe(false);
        expect(needsLegacyFingerprint({ silenceCheckedV2: true })).toBe(false);
        expect(needsLegacyFingerprint({ silenceCheckedV2: true, trimEnd: 0.2 })).toBe(true);
        expect(needsLegacyFingerprint({ trimStart: 3 })).toBe(false);
        expect(needsLegacyFingerprint({ silenceCheckedV2: true, silenceCheckedV3: true, trimEnd: 0.2 })).toBe(false);
    });
});

// v1.15.39 — durata misurata decodificando il file (alcuni FLAC dichiarano il falso).
const withDuration = (trimStart: number, trimEnd: number, durationSec: number) => ({
    success: true,
    data: { trimStart, trimEnd, ...(trimStart === 0 && trimEnd === 0 ? { noSilence: true } : {}), durationSec },
});

describe('decideSilenceUpdate — durata misurata (v1.15.39)', () => {
    it('clip nuova: taglio e durata misurata insieme', () => {
        const d = decideSilenceUpdate({}, withDuration(0.2, 0, 101.70312));
        expect(d.patch).toMatchObject({ trimStart: 0.2, trimEnd: 0, duration: 101.703, durationDecoded: true });
    });

    it('«Baciami Alfredo»: 321,07 s dichiarati, 101,70 veri → durata corretta e segnalata', () => {
        const clip = { duration: 321.0667, silenceCheckedV2: true, silenceCheckedV3: true, trimStart: 0.2, trimEnd: 0 };
        const d = decideSilenceUpdate(clip, withDuration(0.2, 0, 101.703));
        expect(d.reason).toBe('durationOnly');
        expect(d.durationFixed).toBe(true);
        expect(d.patch).toEqual({ silenceCheckedV2: true, silenceCheckedV3: true, duration: 101.703, durationDecoded: true });
    });

    it('clip già ricontrollata dalla 1.15.38: i tagli non si toccano, anche se il calcolo dà altro', () => {
        const clip = { duration: 210, silenceCheckedV2: true, silenceCheckedV3: true, trimStart: 12.5, trimEnd: 3 };
        const d = decideSilenceUpdate(clip, withDuration(0.05, 0.4, 209.97));
        expect(d.patch).not.toHaveProperty('trimStart');
        expect(d.patch).not.toHaveProperty('trimEnd');
        expect(d.durationFixed).toBe(false); // 30 ms di scarto: normale (ritardo del codificatore)
    });

    it('needsSilenceAnalysis: senza V3 o senza durata misurata, mai per file mancanti', () => {
        expect(needsSilenceAnalysis({})).toBe(true);
        expect(needsSilenceAnalysis({ silenceCheckedV3: true })).toBe(true);
        expect(needsSilenceAnalysis({ silenceCheckedV3: true, durationDecoded: true })).toBe(false);
        expect(needsSilenceAnalysis({ isMissing: true })).toBe(false);
    });
});
