// v1.15.37 — QR code del Controllo Remoto. Il telefono inquadra il codice
// mostrato nelle Impostazioni e apre la pagina già con il PIN, senza digitare
// indirizzo IP e cifre (operatore ipovedente: digitare un IP su uno smartphone è
// la parte più faticosa di tutta la procedura).
//
// Il main restituisce solo la matrice dei moduli; il renderer la disegna in SVG.
// Così niente immagini data: e nessuna libreria nel bundle del renderer.

// `qrcode-generator` esporta con `export =`: senza esModuleInterop la forma
// compatibile con tutte e tre le configurazioni TypeScript è il require tipizzato.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qrcode: typeof import('qrcode-generator') = require('qrcode-generator');

export interface QrMatrix {
    /** Lato in moduli (senza margine). */
    size: number;
    /** Una stringa per riga, '1' = modulo scuro. */
    rows: string[];
}

export function buildQrMatrix(text: string): QrMatrix {
    // Correzione d'errore M (15%): buon compromesso fra densità e lettura da uno
    // schermo, anche con riflessi. Versione automatica (0).
    const qr = qrcode(0, 'M');
    qr.addData(text, 'Byte');
    qr.make();
    const size = qr.getModuleCount();
    const rows: string[] = [];
    for (let r = 0; r < size; r++) {
        let row = '';
        for (let c = 0; c < size; c++) row += qr.isDark(r, c) ? '1' : '0';
        rows.push(row);
    }
    return { size, rows };
}
