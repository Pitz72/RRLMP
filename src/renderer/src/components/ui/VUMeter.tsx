import React from 'react';
import { useVUMeter } from '../../hooks/useVUMeter';

// Gradiente FISSO sull'intera corsa del meter (scala −48…0 dBFS lineare in dB):
// verde fino a ~−13 dBFS, giallo fino a ~−5 dBFS, rosso a ridosso del limiter.
// v1.15.13: fino alla v1.15.12 il gradiente era applicato alla barra stessa
// (width = livello), quindi le percentuali dei colori si comprimevano con la
// barra e la punta era SEMPRE gialla/rossa a qualunque livello. Ora il layer
// colorato copre tutta la corsa e il livello lo rivela via clip-path: il
// colore dipende dal livello reale, come in un meter vero.
const METER_GRADIENT = 'linear-gradient(90deg, #10b981 0%, #10b981 72%, #fbbf24 80%, #fbbf24 88%, #ef4444 95%)';

interface ChannelBarProps {
    level: number; // 0..100
    peak: number;  // 0..100 (peak-hold)
}

const ChannelBar: React.FC<ChannelBarProps> = ({ level, peak }) => (
    <div className="relative w-full h-[6px] bg-zinc-900 overflow-hidden rounded-[1px]">
        <div
            className="absolute inset-0"
            style={{
                background: METER_GRADIENT,
                clipPath: `inset(0 ${100 - level}% 0 0)`,
                transition: 'clip-path 75ms linear',
            }}
        />
        {/* Peak-hold: lineetta che trattiene il picco per ~1.5 s (utile in regia
            per beccare i picchi senza fissare il meter). Bianca in zona sicura,
            rossa oltre ~−5 dBFS. */}
        {peak > 1 && (
            <div
                className="absolute inset-y-0 w-[2px]"
                style={{
                    left: `calc(${peak}% - 2px)`,
                    backgroundColor: peak >= 90 ? '#ef4444' : 'rgba(255,255,255,0.75)',
                    transition: 'left 75ms linear',
                }}
            />
        )}
    </div>
);

export const VUMeter: React.FC = () => {
    const { left, right, peakLeft, peakRight } = useVUMeter();

    return (
        <div className="flex flex-col gap-[2px] w-24 h-6 justify-center bg-zinc-950 p-[2px] rounded border border-zinc-800 shadow-inner">
            <ChannelBar level={left} peak={peakLeft} />
            <ChannelBar level={right} peak={peakRight} />
        </div>
    );
};
