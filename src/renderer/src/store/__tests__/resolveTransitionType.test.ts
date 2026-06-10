import { describe, it, expect, beforeEach } from 'vitest';
import { resolveTransitionType } from '../useAudioStore';
import { useSettingsStore } from '../useSettingsStore';
import { validateLmpProjectData } from '../useProjectStore';
import { makeClip } from './fixtures';

// v1.4.7 (revisione 2026-06-10, reperti #7/#8) — risoluzione centralizzata del tipo
// di transizione + migrazione .lmp della stringa 'default' (pre-1.4.7).

beforeEach(() => {
    useSettingsStore.getState().setDefaultPreshowTransition('crossfade');
});

describe('resolveTransitionType', () => {
    it('passa attraverso i valori validi', () => {
        for (const t of ['crossfade', 'segue', 'gapless'] as const) {
            const clip = makeClip({ type: 'preshow', transitionType: t });
            expect(resolveTransitionType(clip, 'col-preshow')).toBe(t);
            expect(resolveTransitionType(clip, 'col-music')).toBe(t);
        }
    });

    it('clip PRE-SHOW senza override → default globale', () => {
        const clip = makeClip({ type: 'preshow' });
        expect(resolveTransitionType(clip, 'col-preshow')).toBe('crossfade');
        useSettingsStore.getState().setDefaultPreshowTransition('segue');
        expect(resolveTransitionType(clip, 'col-preshow')).toBe('segue');
    });

    it('fuori PRE-SHOW senza override → gapless (coerente con applyTransitionAndPlayNext)', () => {
        const clip = makeClip({ type: 'music' });
        expect(resolveTransitionType(clip, 'col-music')).toBe('gapless');
        expect(resolveTransitionType(clip, null)).toBe('gapless');
    });

    it("la stringa 'default' (persistita dai .lmp fino a v1.4.6) usa il fallback, non gapless forzato", () => {
        const clip = makeClip({ type: 'preshow' });
        (clip as unknown as { transitionType: string }).transitionType = 'default';
        // In PRE-SHOW: default globale (crossfade), NON gapless
        expect(resolveTransitionType(clip, 'col-preshow')).toBe('crossfade');
        // Fuori PRE-SHOW: gapless come da semantica
        expect(resolveTransitionType(clip, 'col-music')).toBe('gapless');
    });
});

describe("validateLmpProjectData — migrazione transitionType 'default'", () => {
    const makeLmp = (transitionType?: unknown) => ({
        columns: [{
            id: 'col-preshow', title: 'PRE-SHOW', type: 'preshow', color: '#888', clips: [{
                id: 'clip-1', name: 'A', path: 'C:/a.mp3', type: 'preshow', volume: 1,
                ...(transitionType !== undefined ? { transitionType } : {}),
            }],
        }],
    });

    it("rimuove la stringa 'default' dal .lmp", () => {
        const out = validateLmpProjectData(makeLmp('default'));
        expect(out.columns[0].clips[0].transitionType).toBeUndefined();
    });

    it('rimuove valori spazzatura', () => {
        const out = validateLmpProjectData(makeLmp(42));
        expect(out.columns[0].clips[0].transitionType).toBeUndefined();
    });

    it('preserva i valori validi', () => {
        const out = validateLmpProjectData(makeLmp('segue'));
        expect(out.columns[0].clips[0].transitionType).toBe('segue');
    });

    it('lascia intatte le clip senza transitionType', () => {
        const out = validateLmpProjectData(makeLmp(undefined));
        expect(out.columns[0].clips[0].transitionType).toBeUndefined();
    });
});
