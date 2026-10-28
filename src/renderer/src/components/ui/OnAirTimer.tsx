import React, { useState, useEffect } from 'react';
import { useAudioStore } from '../../store/useAudioStore';

export const OnAirTimer: React.FC = () => {
    const onAirStartTime = useAudioStore(state => state.onAirStartTime);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!onAirStartTime) {
            setElapsed(0);
            return;
        }
        // Sync immediato per evitare il ritardo del primo tick
        setElapsed(Date.now() - onAirStartTime);
        const interval = setInterval(() => {
            setElapsed(Date.now() - onAirStartTime);
        }, 1000);
        return () => clearInterval(interval);
    }, [onAirStartTime]);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const totalSeconds = Math.floor(elapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    // v1.15.36 (tema Pad luminosi): piccolo display incassato, stessa larghezza da
    // fermo e in onda; il LED rosso si accende quando la diretta è partita.
    const isLive = !!onAirStartTime;
    return (
        <div className={`lcd-sm select-none ${isLive ? 'live' : ''}`}>
            <span className={`led ${isLive ? 'r pulse' : ''}`} />
            <span className="lcd-stack">
                <span className="k">ON AIR</span>
                <span className="v">{isLive ? timeString : '--:--:--'}</span>
            </span>
        </div>
    );
};
