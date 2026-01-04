import { useEffect } from 'react';
import { MainGrid } from './components/layout/MainGrid';
import DebugOverlay from './components/debug/DebugOverlay';
import { useDebugStore } from './store/useDebugStore';

function App() {
    useEffect(() => {
        const handleDrag = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '0') {
                useDebugStore.getState().toggle();
            }
        };

        window.addEventListener('dragover', handleDrag);
        window.addEventListener('drop', handleDrag);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('dragover', handleDrag);
            window.removeEventListener('drop', handleDrag);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="h-screen w-screen flex flex-col bg-black text-white select-none">
            {/* DEBUG OVERLAY */}
            <DebugOverlay />

            {/* GLOBAL HEADER (Top Bar) */}
            <header className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <h1 className="font-bold text-lg tracking-tight">RRLM <span className="text-zinc-500 font-normal">DIRECTOR</span></h1>
                </div>
                <div className="text-xs text-zinc-500">
                    Audio Engine: <span className="text-green-500">READY</span>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-hidden">
                <MainGrid />
            </div>
        </div>
    );
}

export default App;
