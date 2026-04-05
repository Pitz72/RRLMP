import React, { useState, useEffect } from 'react';

export const DigitalClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeString = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

    return (
        <div className="font-mono text-xl font-bold tracking-wider text-green-500 tabular-nums select-none bg-black/20 px-3 py-1 rounded border border-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
            {timeString}
        </div>
    );
};
