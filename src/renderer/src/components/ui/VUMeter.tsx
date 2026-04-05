import React from 'react';
import { useVUMeter } from '../../hooks/useVUMeter';

export const VUMeter: React.FC = () => {
    const { left, right } = useVUMeter();

    // CSS Gradient for the bars: Green -> Yellow -> Red
    // We mask it with width.
    // Actually easier: Fixed background gradient, adjust width of a "cover" or width of the bar itself?
    // Width of bar itself is easiest.

    return (
        <div className="flex flex-col gap-[2px] w-24 h-6 justify-center bg-zinc-950 p-[2px] rounded border border-zinc-800 shadow-inner">
            {/* Left Channel */}
            <div className="relative w-full h-[6px] bg-zinc-900 overflow-hidden rounded-[1px]">
                <div
                    className="h-full transition-all duration-75 ease-out"
                    style={{
                        width: `${left}%`,
                        background: 'linear-gradient(90deg, #10b981 60%, #fbbf24 85%, #ef4444 100%)'
                    }}
                />
            </div>

            {/* Right Channel */}
            <div className="relative w-full h-[6px] bg-zinc-900 overflow-hidden rounded-[1px]">
                <div
                    className="h-full transition-all duration-75 ease-out"
                    style={{
                        width: `${right}%`,
                        background: 'linear-gradient(90deg, #10b981 60%, #fbbf24 85%, #ef4444 100%)'
                    }}
                />
            </div>

            {/* Tick Marks (Optional decorative) */}
            {/* <div className="absolute top-0 w-[1px] h-full bg-zinc-800 left-[60%] pointer-events-none opacity-50"></div> */}
        </div>
    );
};
