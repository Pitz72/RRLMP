// Controllo Remoto (2026-07-01, Step 2/N) — rate-limiter minimo per l'endpoint
// di verifica PIN. Un PIN a 6 cifre (1.000.000 di combinazioni) senza limite
// di tentativi è forzabile in pochi secondi con richieste automatiche in LAN:
// questo modulo limita i tentativi per client (per IP) in una finestra scorrevole.
// Logica pura, testabile con un clock iniettato (nessun uso di Date.now() se non
// come default reale a runtime).

export interface PinRateLimiter {
    /** true se il tentativo è permesso (e viene conteggiato); false se il limite è superato per questa finestra. */
    allow(key: string): boolean;
    /** Azzera i tentativi per una chiave (es. dopo un PIN corretto) o per tutte (nessun argomento). */
    reset(key?: string): void;
}

export function createPinRateLimiter(
    maxAttempts = 10,
    windowMs = 5 * 60 * 1000,
    now: () => number = Date.now
): PinRateLimiter {
    const attempts = new Map<string, { count: number; windowStart: number }>();

    return {
        allow(key: string): boolean {
            const t = now();
            const entry = attempts.get(key);
            if (!entry || t - entry.windowStart >= windowMs) {
                attempts.set(key, { count: 1, windowStart: t });
                return true;
            }
            if (entry.count >= maxAttempts) return false;
            entry.count++;
            return true;
        },
        reset(key?: string): void {
            if (key === undefined) attempts.clear();
            else attempts.delete(key);
        }
    };
}
