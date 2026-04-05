import { useEffect, useRef, useState } from 'react';
import AudioContextManager from '../engine/AudioContextManager';

export const useVUMeter = () => {
    const [levels, setLevels] = useState({ left: 0, right: 0 });
    const requestRef = useRef<number>();

    useEffect(() => {
        let analysers: { left: AnalyserNode, right: AnalyserNode } | null = null;
        try {
            analysers = AudioContextManager.getInstance().getAnalysers();
        } catch (e) {
            console.warn("VU Meter: AudioContext not ready");
            return;
        }

        const { left, right } = analysers;
        const bufferLength = left.frequencyBinCount;
        const dataArrayL = new Uint8Array(bufferLength);
        const dataArrayR = new Uint8Array(bufferLength);

        const updateMeter = () => {
            if (AudioContextManager.getInstance().getContext().state !== 'running') {
                requestRef.current = requestAnimationFrame(updateMeter);
                return;
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
