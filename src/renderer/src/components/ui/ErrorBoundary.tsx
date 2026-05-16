import React, { Component, ReactNode } from 'react';
import { toast } from '../../store/useToastStore';

// Installato una sola volta per tutta la sessione (più istanze ErrorBoundary non duplicano il listener)
let _asyncHandlerInstalled = false;

// v1.2.27 (NEW-LI-07): installazione a livello modulo invece che in componentDidMount.
// Prima il listener veniva agganciato solo dopo il primo render dell'ErrorBoundary,
// perdendo eventuali unhandled rejection del bootstrap iniziale (import sincroni,
// IIFE, side-effect dei singleton in App.tsx). Ora viene attaccato all'IMPORT del
// modulo — che è la primissima fase, prima ancora del primo render React.
if (typeof window !== 'undefined' && !_asyncHandlerInstalled) {
    _asyncHandlerInstalled = true;
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        const message = event.reason instanceof Error
            ? event.reason.message
            : String(event.reason ?? 'Promise rejection non gestita');
        console.error('[ErrorBoundary] Unhandled async rejection:', event.reason);
        toast(`Errore asincrono: ${message}`, 'error');
    });
}

interface Props {
    children: ReactNode;
    /** Fallback UI personalizzato. Se omesso, mostra il pannello di default. */
    fallback?: ReactNode;
    /** Identificatore della zona (es. "MainGrid", "Column") per il log */
    zone?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary React (v0.16.4)
 * Cattura errori nel render tree e mostra un fallback invece di crashare l'intera app.
 * Usare per wrappare sezioni critiche: MainGrid, colonne, modali.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    // v1.2.27 (NEW-LI-07): listener unhandledrejection ora attivato al module load,
    // non più in componentDidMount.

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        const zone = this.props.zone || 'Unknown';
        console.error(`[ErrorBoundary:${zone}] Uncaught render error:`, error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            const zone = this.props.zone || 'Componente';
            return (
                <div className="flex flex-col items-center justify-center gap-3 p-6 bg-red-950/30 border border-red-800 rounded-lg text-center">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-sm font-bold text-red-400">Errore in {zone}</p>
                    <p className="text-[11px] text-red-300/70 max-w-xs">
                        {this.state.error?.message || 'Errore sconosciuto nel render.'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="mt-1 px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs rounded font-bold transition-colors"
                    >
                        Riprova
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
