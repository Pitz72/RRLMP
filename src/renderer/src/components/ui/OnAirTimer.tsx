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

    if (!onAirStartTime) {
        return (
            <div className="font-mono text-sm font-bold tracking-wider text-zinc-700 tabular-nums select-none px-3 py-1 rounded border border-zinc-800/60 whitespace-nowrap shrink-0">
                ON AIR --:--:--
            </div>
        );
    }

    return (
        <div className="font-mono text-sm font-bold tracking-wider text-red-400 tabular-nums select-none bg-red-950/40 px-3 py-1 rounded border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.25)] flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span>ON AIR {timeString}</span>
        </div>
    );
};
