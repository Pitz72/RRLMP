// v1.7.1 — FIX bug regia: prima ogni punto che chiamava detectSilence duplicava la
// stessa logica a 2 rami (successo con silenzio / tutto il resto trattato come
// "controllato, nessun silenzio"), e il ramo "tutto il resto" copriva ANCHE i
// fallimenti reali (rate-limit, timeout, file corrotto) — marcandoli per sempre
// come "controllati" senza che l'analisi fosse mai avvenuta. Centralizzato qui a
// 3 rami: silenzio trovato / analisi riuscita senza silenzio / analisi fallita
// (quest'ultima NON va mai segnata come controllata: va ritentata al prossimo giro).

export interface SilenceDetectResult {
    success: boolean;
    data?: { trimStart: number; trimEnd: number; noSilence?: boolean } | null;
    error?: string;
}

export interface SilenceClassification {
    /** true solo se l'analisi è realmente avvenuta (con o senza silenzio trovato). */
    checked: boolean;
    /** presenti solo se è stato trovato silenzio reale da tagliare. */
    trimStart?: number;
    trimEnd?: number;
}

export function classifySilenceResult(result: SilenceDetectResult): SilenceClassification {
    if (!result.success || !result.data) {
        return { checked: false }; // fallita/dati assenti: NON segnare come controllata, ritentare al prossimo load
    }
    if (!result.data.noSilence) {
        return { checked: true, trimStart: result.data.trimStart, trimEnd: result.data.trimEnd };
    }
    return { checked: true }; // analisi riuscita, nessun silenzio reale da tagliare
}
