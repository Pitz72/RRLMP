import { describe, it, expect } from 'vitest';
import {
    autoTransitionLeadSec, remainingToEffectiveEndSec,
    BEATMATCH_LEAD_MARGIN_SEC, CLASSIC_LEAD_MARGIN_SEC, crossfadeDurationSec,
} from '../automixEngine';
import { StreamPlayer } from '../StreamPlayer';
import type { AudioClip } from '../../types';

// v1.15.39 — «Auto a fine brano» nella modalità MIX. Prova del 2026-11-06 sul Banco
// del Mutuo Soccorso: alcuni brani si fermavano invece di mixarsi col successivo.
// Due cause: (1) il tempo che manca era contato fino alla fine GREZZA del file,
// ignorando la coda tagliata; (2) alcuni FLAC dichiarano una durata falsa
// («Baciami Alfredo»: 321 s dichiarati, 101,7 s veri).

const grid = (bpm: number, gridScore: number) => ({ bpm, beatOffsetSec: 0.1, bpmConfidence: 0.8, beatGridScore: gridScore });

describe('remainingToEffectiveEndSec', () => {
    it('conta fino a durata − trimEnd, dove il lettore si ferma davvero', () => {
        // «A Cena, Per Esempio»: 383,46 s, coda tagliata 4,22 s
        expect(remainingToEffectiveEndSec(370, 383.46, 4.22)).toBeCloseTo(9.24, 6);
    });
    it('mai negativo, e 0 con durata ignota', () => {
        expect(remainingToEffectiveEndSec(380, 383.46, 4.22)).toBe(0);
        expect(remainingToEffectiveEndSec(10, 0, 0)).toBe(0);
        expect(remainingToEffectiveEndSec(NaN, 100, 0)).toBe(0);
    });
});

describe('autoTransitionLeadSec', () => {
    it('mix a tempo possibile → N beat al tempo dell\'uscente + margine d\'aggancio', () => {
        const r = autoTransitionLeadSec(grid(124, 4), grid(120, 4), 8, 2);
        expect(r.beatmatchExpected).toBe(true);
        expect(r.leadSec).toBeCloseTo(crossfadeDurationSec(124, 8) + BEATMATCH_LEAD_MARGIN_SEC, 6);
    });

    it('griglia incerta → crossfade classico: anticipo = crossfade + 1 s, non 8 beat + 2,5 s', () => {
        // «A Cena» (griglia 2,08) → «Allons Enfants»: prima partiva 6,9 s prima della
        // fine e un crossfade di 2 s buttava 5 s di coda dell'uscente.
        const r = autoTransitionLeadSec(grid(109.6, 2.08), grid(164.5, 3.45), 8, 2);
        expect(r.beatmatchExpected).toBe(false);
        expect(r.leadSec).toBeCloseTo(2 + CLASSIC_LEAD_MARGIN_SEC, 6);
    });

    it('BPM mancante → crossfade classico', () => {
        expect(autoTransitionLeadSec({}, grid(120, 4), 8, 3).leadSec).toBeCloseTo(3 + CLASSIC_LEAD_MARGIN_SEC, 6);
    });

    it('con 4,22 s di coda tagliata il mix parte comunque in tempo (prima: 0,47 s prima della fine)', () => {
        const lead = autoTransitionLeadSec(grid(109.6, 2.08), grid(164.5, 3.45), 4, 2).leadSec;
        // Il controllo della vista: scatta quando remaining (alla fine EFFETTIVA) ≤ lead.
        const firesAt = 383.46 - 4.22 - lead; // posizione nel file
        expect(remainingToEffectiveEndSec(firesAt, 383.46, 4.22)).toBeCloseTo(lead, 6);
        expect(lead).toBeGreaterThan(2); // il crossfade di 2 s ci sta tutto prima della fine
    });
});

describe('StreamPlayer — durata misurata contro durata dichiarata dal file', () => {
    const baciami = { id: 'b', duration: 101.703, durationDecoded: true, fadeOut: 2000, trimEnd: 0 } as unknown as AudioClip;

    function playerWithHeaderDuration(headerSec: number) {
        const p = new StreamPlayer();
        const el = (p as unknown as { audioElement: HTMLAudioElement }).audioElement;
        Object.defineProperty(el, 'duration', { configurable: true, get: () => headerSec });
        let t = 0;
        Object.defineProperty(el, 'currentTime', { configurable: true, get: () => t, set: (v: number) => { t = v; } });
        Object.defineProperty(el, 'paused', { configurable: true, get: () => false });
        // il contesto audio finto non ha le rampe: bastano dei no-op
        const gain = (p as unknown as { volumeGainNode: { gain: Record<string, unknown> } }).volumeGainNode.gain;
        gain.cancelScheduledValues = () => {};
        return { p, el, seek: (s: number) => { t = s; el.ontimeupdate?.(new Event('timeupdate')); } };
    }

    it('getDuration usa la durata misurata, non quella dell\'intestazione', () => {
        const { p } = playerWithHeaderDuration(321.067);
        expect(p.getDuration()).toBeCloseTo(321.067, 3);
        p.updateSettings(baciami);
        expect(p.getDuration()).toBeCloseTo(101.703, 3);
    });

    it('la durata dei metadati (senza durationDecoded) non sostituisce quella dell\'elemento', () => {
        const { p } = playerWithHeaderDuration(240);
        p.updateSettings({ id: 'x', duration: 60 } as unknown as AudioClip);
        expect(p.getDuration()).toBe(240);
    });

    it('la dissolvenza finale parte alla fine VERA del brano (prima: mai, troncamento secco)', () => {
        const { p, seek } = playerWithHeaderDuration(321.067);
        p.updateSettings(baciami);
        let fadeStarted = false;
        p.onFadeOutStart(() => { fadeStarted = true; });
        seek(99);
        expect(fadeStarted).toBe(false);
        seek(100);       // 1,7 s alla fine vera, dentro i 2 s di dissolvenza
        expect(fadeStarted).toBe(true);
    });
});
