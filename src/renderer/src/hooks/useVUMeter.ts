import { useEffect, useRef, useState } from 'react';
import AudioContextManager from '../engine/AudioContextManager';
import { analyzeBuffer, dbToPct } from '../utils/meterScale';

export interface VUMeterLevels {
    /** Livello RMS canale sinistro/destro, 0..100 (corsa lineare in dB, −48…0 dBFS). */
    left: number;
    right: number;
    /** Peak-hold per canale, 0..100: tiene il picco per ~1.5 s poi si riallinea. */
    peakLeft: number;
    peakRight: number;
}

// Durata del peak-hold: abbastanza lunga da leggere il picco a colpo d'occhio
// in regia, abbastanza corta da non raccontare storia vecchia.
const PEAK_HOLD_MS = 1500;

// Quantizzazione dei livelli pubblicati (mezzo punto percentuale): evita
// re-render del componente per variazioni sotto la soglia visibile.
const quantize = (pct: number): number => Math.round(pct * 2) / 2;

interface PeakHoldState { pct: number; ts: number }

const updatePeakHold = (hold: PeakHoldState, peakPct: number, now: number): number => {
    // Un picco nuovo ≥ del trattenuto lo sostituisce subito; quello trattenuto
    // scade dopo PEAK_HOLD_MS e si riallinea al picco corrente.
    if (peakPct >= hold.pct || now - hold.ts > PEAK_HOLD_MS) {
        hold.pct = peakPct;
        hold.ts = now;
    }
    return hold.pct;
};

export const useVUMeter = (): VUMeterLevels => {
    const [levels, setLevels] = useState<VUMeterLevels>({ left: 0, right: 0, peakLeft: 0, peakRight: 0 });
    const requestRef = useRef<number>();
    const holdL = useRef<PeakHoldState>({ pct: 0, ts: 0 });
    const holdR = useRef<PeakHoldState>({ pct: 0, ts: 0 });
    const lastPublished = useRef<VUMeterLevels>({ left: 0, right: 0, peakLeft: 0, peakRight: 0 });

    useEffect(() => {
        // AUDIT-ME (2026-05-29): gli AnalyserNode venivano catturati UNA sola volta al mount.
        // Se il grafo audio cambia (es. cambio output device → ricreazione del contesto/analyser),
        // i riferimenti restavano stale e il VU meter leggeva da nodi disconnessi (livelli a 0
        // o congelati). Ora gli analyser sono ri-letti via getAnalysers() a ogni frame: cheap
        // (ritorna riferimenti) e sempre allineato al grafo corrente.
        //
        // v1.15.13: lettura in FLOAT sull'intera finestra (fftSize campioni — prima si
        // leggevano frequencyBinCount byte, cioè MEZZA finestra a 8 bit) e livelli in dB
        // via meterScale.ts. RMS lineare → dB: vedi il commento in meterScale.
        let bufL = new Float32Array(0);
        let bufR = new Float32Array(0);

        const updateMeter = () => {
            const mgr = AudioContextManager.getInstance();
            if (mgr.getContext().state !== 'running') {
                requestRef.current = requestAnimationFrame(updateMeter);
                return;
            }

            let left: AnalyserNode, right: AnalyserNode;
            try {
                ({ left, right } = mgr.getAnalysers());
            } catch {
                // grafo non ancora pronto / in ricostruzione — riprova al frame successivo
                requestRef.current = requestAnimationFrame(updateMeter);
                return;
            }

            // (Ri)alloca i buffer se la dimensione dell'analyser è cambiata
            if (bufL.length !== left.fftSize) {
                bufL = new Float32Array(left.fftSize);
                bufR = new Float32Array(right.fftSize);
            }

            left.getFloatTimeDomainData(bufL);
            right.getFloatTimeDomainData(bufR);

            const readL = analyzeBuffer(bufL);
            const readR = analyzeBuffer(bufR);
            const now = performance.now();

            const next: VUMeterLevels = {
                left: quantize(dbToPct(readL.rmsDb)),
                right: quantize(dbToPct(readR.rmsDb)),
                peakLeft: quantize(updatePeakHold(holdL.current, dbToPct(readL.peakDb), now)),
                peakRight: quantize(updatePeakHold(holdR.current, dbToPct(readR.peakDb), now)),
            };

            // Pubblica solo se qualcosa è cambiato (a riposo: zero re-render)
            const prev = lastPublished.current;
            if (next.left !== prev.left || next.right !== prev.right
                || next.peakLeft !== prev.peakLeft || next.peakRight !== prev.peakRight) {
                lastPublished.current = next;
                setLevels(next);
            }

            requestRef.current = requestAnimationFrame(updateMeter);
        };

        requestRef.current = requestAnimationFrame(updateMeter);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return levels;
};
