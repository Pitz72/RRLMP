import React from 'react';
import { useVUMeter } from '../../hooks/useVUMeter';

// v1.15.36 (tema Pad luminosi): scala a LED. 16 LED per canale sulla corsa del
// meter (−48…0 dBFS lineare in dB, utils/meterScale.ts): 3 dB per LED.
// Verde fino a −12 dBFS, giallo fino a −3, rosso l'ultimo LED, a ridosso del
// limiter — le stesse zone del gradiente fisso della v1.15.13. Il colore
// dipende dal livello reale, come in un meter vero.
const LEDS = 16;
const STEP = 100 / LEDS;
const tone = (i: number): string => (i >= LEDS - 1 ? 'o' : i >= 12 ? 'y' : 'g');

interface ChannelRowProps {
    label: string;
    level: number; // 0..100
    peak: number;  // 0..100 (peak-hold)
}

const ChannelRow: React.FC<ChannelRowProps> = ({ label, level, peak }) => {
    // Peak-hold: il LED del picco resta acceso ~1.5 s (bianco in zona sicura,
    // rosso sull'ultimo LED), utile in regia per beccare i picchi.
    const peakIdx = peak > 1 ? Math.min(LEDS - 1, Math.floor(peak / STEP)) : -1;
    return (
        <div className="vu-row">
            <span>{label}</span>
            {Array.from({ length: LEDS }).map((_, i) => {
                // acceso se il livello copre almeno metà del LED
                const lit = level >= i * STEP + STEP / 2;
                const cls = lit ? tone(i) : i === peakIdx ? `pk ${tone(i) === 'o' ? 'o' : ''}` : '';
                return <i key={i} className={cls} />;
            })}
        </div>
    );
};

export const VUMeter: React.FC = () => {
    const { left, right, peakLeft, peakRight } = useVUMeter();

    return (
        <div className="vu" aria-hidden="true">
            <ChannelRow label="L" level={left} peak={peakLeft} />
            <ChannelRow label="R" level={right} peak={peakRight} />
        </div>
    );
};
