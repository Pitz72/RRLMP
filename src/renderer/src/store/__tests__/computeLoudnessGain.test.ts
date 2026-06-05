import { describe, it, expect, beforeEach } from 'vitest';
import { computeLoudnessGain } from '../useAudioStore';
import { useSettingsStore } from '../useSettingsStore';
import { makeClip } from './fixtures';

// Blocco 2 (v1.4.5) — omologazione loudness (v1.4.3).
// gainDb = targetLufs - clip.loudnessLufs, clampato a +/-9 dB, poi 10^(dB/20).
// Fail-safe: disabilitato o LUFS assente/non-finito → 1.0 (nessuna alterazione).

const setNorm = (enabled: boolean, targetLufs = -16) =>
    useSettingsStore.getState().setLoudnessNorm({ enabled, targetLufs });

beforeEach(() => {
    setNorm(true, -16); // default applicativo
});

describe('computeLoudnessGain', () => {
    it('ritorna 1.0 quando l\'omologazione e\' disattivata', () => {
        setNorm(false);
        expect(computeLoudnessGain(makeClip({ loudnessLufs: -23 }))).toBe(1.0);
    });

    it('ritorna 1.0 quando la clip non e\' ancora stata misurata (undefined)', () => {
        expect(computeLoudnessGain(makeClip({ loudnessLufs: undefined }))).toBe(1.0);
    });

    it('ritorna 1.0 su LUFS non finito (NaN / Infinity)', () => {
        expect(computeLoudnessGain(makeClip({ loudnessLufs: NaN }))).toBe(1.0);
        expect(computeLoudnessGain(makeClip({ loudnessLufs: -Infinity }))).toBe(1.0);
    });

    it('ritorna 1.0 (gain neutro) quando il LUFS coincide col target', () => {
        expect(computeLoudnessGain(makeClip({ loudnessLufs: -16 }))).toBeCloseTo(1.0, 10);
    });

    it('amplifica una clip piu\' quieta del target (+7 dB)', () => {
        // target -16, clip -23 → +7 dB
        const g = computeLoudnessGain(makeClip({ loudnessLufs: -23 }));
        expect(g).toBeCloseTo(Math.pow(10, 7 / 20), 6);
        expect(g).toBeGreaterThan(1);
    });

    it('attenua una clip piu\' forte del target (-6 dB)', () => {
        // target -16, clip -10 → -6 dB
        const g = computeLoudnessGain(makeClip({ loudnessLufs: -10 }));
        expect(g).toBeCloseTo(Math.pow(10, -6 / 20), 6);
        expect(g).toBeLessThan(1);
    });

    it('clampa il boost a +9 dB (clip molto quieta)', () => {
        // target -16, clip -40 → +24 dB → clamp +9 dB
        const g = computeLoudnessGain(makeClip({ loudnessLufs: -40 }));
        expect(g).toBeCloseTo(Math.pow(10, 9 / 20), 6);
    });

    it('clampa il taglio a -9 dB (clip molto forte)', () => {
        // target -16, clip -3 → -13 dB → clamp -9 dB
        const g = computeLoudnessGain(makeClip({ loudnessLufs: -3 }));
        expect(g).toBeCloseTo(Math.pow(10, -9 / 20), 6);
    });

    it('rispetta un target personalizzato', () => {
        setNorm(true, -14);
        // target -14, clip -20 → +6 dB
        const g = computeLoudnessGain(makeClip({ loudnessLufs: -20 }));
        expect(g).toBeCloseTo(Math.pow(10, 6 / 20), 6);
    });
});
