import { useEffect, useRef, useState } from 'react';
import AudioContextManager from '../engine/AudioContextManager';

export const useVUMeter = () => {
    const [levels, setLevels] = useState({ left: 0, right: 0 });
    const requestRef = useRef<number>();

    useEffect(() => {
        // AUDIT-ME (2026-05-29): gli AnalyserNode venivano catturati UNA sola volta al mount.
        // Se il grafo audio cambia (es. cambio output device → ricreazione del contesto/analyser),
        // i riferimenti restavano stale e il VU meter leggeva da nodi disconnessi (livelli a 0
        // o congelati). Ora gli analyser sono ri-letti via getAnalysers() a ogni frame: cheap
        // (ritorna riferimenti) e sempre allineato al grafo corrente. I buffer sono dimensionati
        // dinamicamente dal frequencyBinCount reale (no assunzioni sulla fftSize).
        let dataArrayL = new Uint8Array(0);
        let dataArrayR = new Uint8Array(0);

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
            if (dataArrayL.length !== left.frequencyBinCount) {
                dataArrayL = new Uint8Array(left.frequencyBinCount);
                dataArrayR = new Uint8Array(right.frequencyBinCount);
            }

            // Get Time Domain Data for RMS (Volume)
            left.getByteTimeDomainData(dataArrayL);
            right.getByteTimeDomainData(dataArrayR);

            const rmsL = calculateRMS(dataArrayL);
            const rmsR = calculateRMS(dataArrayR);

            setLevels({
                left: Math.min(100, rmsL * 100 * 2),
                right: Math.min(100, rmsR * 100 * 2)
            });

            requestRef.current = requestAnimationFrame(updateMeter);
        };

        requestRef.current = requestAnimationFrame(updateMeter);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return levels;
};

// RMS Utility
const calculateRMS = (data: Uint8Array) => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const value = (data[i] - 128) / 128; // Normalize to -1..1
        sum += value * value;
    }
    const rms = Math.sqrt(sum / data.length);
    return rms;
};
