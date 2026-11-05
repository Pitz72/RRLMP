import { describe, it, expect } from 'vitest';
import { classifyBpmResult, formatBpm } from '../bpmDetection';

describe('classifyBpmResult', () => {
    it('BPM rilevato -> checked + bpm (+confidence dal v1.10.20)', () => {
        const r = classifyBpmResult({ success: true, data: { bpm: 128, confidence: 0.8, detected: true } });
        expect(r).toEqual({ checked: true, bpm: 128, confidence: 0.8 });
    });

    it('analisi riuscita ma nessuna periodicità marcata (voce/ambient) -> checked, nessun bpm', () => {
        const r = classifyBpmResult({ success: true, data: { bpm: 0, confidence: 0, detected: false } });
        expect(r.checked).toBe(true);
        expect(r.bpm).toBeUndefined();
    });

    it('rate-limit/errore (success:false) -> NON checked', () => {
        const r = classifyBpmResult({ success: false, error: 'IPC_RATE_LIMITED' });
        expect(r.checked).toBe(false);
        expect(r.bpm).toBeUndefined();
    });

    it('success:true senza data -> NON checked (difensivo)', () => {
        const r = classifyBpmResult({ success: true, data: null });
        expect(r.checked).toBe(false);
    });

    // v1.10.17 (Automix Fase A, step A2) — passthrough del beat-offset
    it('beatOffsetSec presente -> propagato insieme al bpm', () => {
        const r = classifyBpmResult({ success: true, data: { bpm: 120, confidence: 0.9, detected: true, beatOffsetSec: 0.34 } });
        expect(r).toEqual({ checked: true, bpm: 120, beatOffsetSec: 0.34, confidence: 0.9 });
    });

    it('beatOffsetSec assente (main vecchio o fase non stimabile) -> solo bpm, campo assente', () => {
        const r = classifyBpmResult({ success: true, data: { bpm: 120, confidence: 0.9, detected: true } });
        expect(r.bpm).toBe(120);
        expect('beatOffsetSec' in r).toBe(false);
    });

    it('beatOffsetSec non finito -> scartato (difensivo)', () => {
        const r = classifyBpmResult({ success: true, data: { bpm: 120, confidence: 0.9, detected: true, beatOffsetSec: NaN } });
        expect(r.bpm).toBe(120);
        expect(r.beatOffsetSec).toBeUndefined();
    });

    // v1.10.20 (chiusura A3) — la confidence è il segnale di fallback della Fase D
    it('confidence propagata insieme a bpm e offset', () => {
        const r = classifyBpmResult({ success: true, data: { bpm: 120, confidence: 0.62, detected: true, beatOffsetSec: 0.4 } });
        expect(r).toEqual({ checked: true, bpm: 120, beatOffsetSec: 0.4, confidence: 0.62 });
    });
});

// v1.15.37 — punteggio della griglia dei beat
describe('classifyBpmResult — gridScore (v1.15.37)', () => {
    it('propagato quando presente, scartato se non finito', () => {
        expect(classifyBpmResult({ success: true, data: { bpm: 124, confidence: 0.9, detected: true, beatOffsetSec: 0.25, gridScore: 4.2 } }).gridScore).toBe(4.2);
        expect(classifyBpmResult({ success: true, data: { bpm: 124, confidence: 0.9, detected: true, gridScore: NaN } }).gridScore).toBeUndefined();
        expect(classifyBpmResult({ success: true, data: { bpm: 124, confidence: 0.9, detected: true } }).gridScore).toBeUndefined();
    });
});

describe('formatBpm (v1.15.37)', () => {
    it('una cifra decimale a schermo', () => {
        expect(formatBpm(123.99)).toBe('124');
        expect(formatBpm(118.64)).toBe('118.6');
        expect(formatBpm(100)).toBe('100');
    });
});
