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
        <div className="lcd-sm select-none" style={{ padding: 0 }}>
            <span className="clock">{timeString}</span>
        </div>
    );
};
