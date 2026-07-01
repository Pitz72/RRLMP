import React from 'react';
import { Loader2 } from 'lucide-react';

interface ExportProgressModalProps {
    isOpen: boolean;
    current: number;
    total: number;
    filename: string;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({ isOpen, current, total, filename }) => {
    if (!isOpen) return null;

    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="ov" style={{ zIndex: 100 }}>
            <div className="ov-panel anim-in p-6 w-96 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <h3 className="text-xl font-bold text-white">Esportazione in corso...</h3>

                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-emerald-500 h-full transition-all duration-100 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <div className="text-center">
                    <div className="text-2xl font-mono font-bold text-emerald-400">
                        {percentage}%
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 truncate max-w-[300px]">
                        {filename}
                    </div>
                    <div className="text-xs text-zinc-600 mt-1">
                        {current} / {total} files
                    </div>
                </div>
            </div>
        </div>
    );
};
