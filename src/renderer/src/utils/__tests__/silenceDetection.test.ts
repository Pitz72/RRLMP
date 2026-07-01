import { describe, it, expect } from 'vitest';
import { classifySilenceResult } from '../silenceDetection';

// v1.7.1 — regressione del bug rate-limiter: un risultato "fallito" (rate-limit,
// timeout, file corrotto) non deve mai essere trattato come "controllato".

describe('classifySilenceResult', () => {
    it('silenzio reale trovato -> checked + trim', () => {
        const r = classifySilenceResult({ success: true, data: { trimStart: 1.5, trimEnd: 3.2, noSilence: false } });
        expect(r).toEqual({ checked: true, trimStart: 1.5, trimEnd: 3.2 });
    });

    it('analisi riuscita senza silenzio -> checked, nessun trim', () => {
        const r = classifySilenceResult({ success: true, data: { trimStart: 0, trimEnd: 0, noSilence: true } });
        expect(r.checked).toBe(true);
        expect(r.trimStart).toBeUndefined();
    });

    it('rate-limit/errore (success:false) -> NON checked', () => {
        const r = classifySilenceResult({ success: false, error: 'IPC_RATE_LIMITED' });
        expect(r.checked).toBe(false);
        expect(r.trimStart).toBeUndefined();
    });

    it('success:true senza data -> NON checked (difensivo)', () => {
        const r = classifySilenceResult({ success: true, data: null });
        expect(r.checked).toBe(false);
    });
});
