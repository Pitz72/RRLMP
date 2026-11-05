/**
 * Taglio automatico del silenzio ai BORDI del file (v1.15.38) — logica pura,
 * testabile senza FFmpeg.
 *
 * Perché esiste: fino alla 1.15.37 detectSilence prendeva da `silencedetect`
 * «il primo silenzio che finisce nella prima metà del brano» come silenzio
 * iniziale e «l'ultimo che comincia nella seconda metà» come silenzio finale,
 * SENZA controllare che toccassero davvero l'inizio o la fine del file.
 * Misurato sui brani della prima semifinale FDCA 2026:
 *   - «Splash! Boing! Zac-zac-zà!» (242,8 s): pausa di 0,28 s a 105 s → il
 *     brano partiva da 105,5 s;
 *   - «Le tengo io (Oh Susanna)»: pausa a 156 s → tolti gli ultimi 87 s;
 *   - «Volpe»: tolti gli ultimi 25,7 s;
 *   - «Nero»: musica da t=0 ma 0,48 s tagliati (il primo colpo); «Cydia»,
 *     «Mariia», «Non puoi fare così»: tagliati dentro la dissolvenza d'apertura.
 *
 * Regola nuova, vera per costruzione: si taglia SOLO ciò che sta prima del
 * primo blocco udibile e dopo l'ultimo. Le pause interne non esistono per
 * questo calcolo, qualunque sia la loro durata.
 *
 * «Udibile» = energia (RMS su 50 ms centrati) sopra rif − 45 dB, OPPURE un
 * picco sopra rif − 35 dB (rif = livello delle parti forti del brano). Il
 * picco serve per i suoni radi e brevi (sussurri, un colpo isolato) che hanno
 * poca energia ma si sentono: con la sola energia «Bisbigli» (Banco) perdeva
 * 1,3 s di sussurri finali.
 *
 * Due casi misurati su file veri, gestiti a parte:
 *   - molti brani generati finiscono con una rampa di rumore negli ultimi
 *     30-40 ms (da −90 a −52 dBFS): gli ultimi 50 ms del file non contano come
 *     suono, altrimenti la rampa bloccherebbe ogni taglio in coda;
 *   - alcuni finiscono in un fruscio continuo a ~−60 dB («Puzzette»): se
 *     l'ultimo secondo è un fondo stabile senza picchi, la soglia di coda sale
 *     sopra il fruscio, ma mai oltre rif − 40 dB. In apertura la soglia non
 *     sale mai: un tappeto morbido d'apertura («Let's Talk About Me», Alan
 *     Parsons) sembra un fondo stabile ma è musica.
 *
 * Garanzia: ciò che viene tolto in apertura è almeno 45 dB sotto le parti
 * forti, in coda almeno 40, e in nessuno dei due c'è un picco entro 35 dB.
 */

/** 24 kHz: blocchi da 10 ms di esattamente 240 frame (niente durate «quasi 10 ms»
 *  come i 221 campioni a 11025 Hz che sfasavano la griglia BPM fino alla 1.15.36)
 *  e banda fino a 12 kHz, abbondante per riconoscere qualunque attacco. */
export const TRIM_SAMPLE_RATE = 24000;
export const TRIM_CHANNELS = 2;
export const TRIM_BLOCK_FRAMES = 240;

/** Finestra e percentile del livello di riferimento («le parti forti del brano»). */
export const REFERENCE_WINDOW_SEC = 0.4;
export const REFERENCE_PERCENTILE = 0.95;

/** Finestra dell'energia di un blocco: 5 blocchi centrati = 50 ms. */
export const LEVEL_WINDOW_BLOCKS = 5;

/** Soglia di energia: 45 dB sotto le parti forti. */
export const THRESHOLD_BELOW_REFERENCE_DB = 45;
/** Tetto della soglia di coda quando il fruscio la alza: mai più vicina di 40 dB
 *  alle parti forti. È la garanzia di non scambiare musica per silenzio. */
export const THRESHOLD_CAP_BELOW_REFERENCE_DB = 40;
/** Limiti assoluti della soglia di energia (dBFS RMS). */
export const THRESHOLD_MIN_DB = -72;
export const THRESHOLD_MAX_DB = -48;

/** Soglia di picco: un blocco con un picco entro 35 dB dalle parti forti è suono,
 *  qualunque sia la sua energia. Limiti assoluti in dBFS. */
export const PEAK_BELOW_REFERENCE_DB = 35;
export const PEAK_THRESHOLD_MIN_DB = -62;
export const PEAK_THRESHOLD_MAX_DB = -40;

/** Gli ultimi 50 ms non contano come suono (rampa di rumore di fine generazione). */
export const END_GUARD_SEC = 0.05;

/** Fruscio in coda: l'ultimo secondo (prima della guardia) è un fondo stabile se
 *  l'energia sta in TAIL_FLOOR_SPREAD_DB tra 10° e 90° percentile e nessun picco
 *  supera la soglia di picco. Allora la soglia di coda sale a mediana + 4 dB. */
export const TAIL_FLOOR_SEC = 1.0;
export const TAIL_FLOOR_SPREAD_DB = 5;
export const TAIL_FLOOR_MARGIN_DB = 4;

/** Margini lasciati prima del primo suono e dopo l'ultimo. */
export const LEAD_MARGIN_SEC = 0.05;
export const TAIL_MARGIN_SEC = 0.15;

/** Tagli più corti di così non valgono la pena (e non si sentono). */
export const MIN_TRIM_SEC = 0.02;

export interface BlockLevels {
    /** Picco |x| per blocco (0..1), massimo tra i canali. Solo diagnostica. */
    peaks: number[];
    /** Media dei quadrati per blocco (tutti i canali): base dell'energia. */
    meanSquares: number[];
    /** Durata di un blocco in secondi (frame per blocco / frequenza). */
    blockSec: number;
    /** Durata reale del file decodificato (frame totali / frequenza). */
    durationSec: number;
}

/**
 * Accumula PCM s16le interleaved in streaming e produce picco e potenza media
 * per blocchi di `framesPerBlock` frame. Memoria O(durata·100/s), mai il PCM
 * intero. Un frame può arrivare spezzato tra due chunk dello stream: i byte
 * avanzati vengono tenuti da parte e completati col chunk successivo.
 */
export class BlockLevelAccumulator {
    private pending: Buffer | null = null;
    private blockPeak = 0;
    private blockSumSq = 0;
    private blockFrames = 0;
    private totalFrames = 0;
    private readonly peaks: number[] = [];
    private readonly meanSquares: number[] = [];
    private readonly bytesPerFrame: number;

    constructor(
        private readonly sampleRate: number = TRIM_SAMPLE_RATE,
        private readonly channels: number = TRIM_CHANNELS,
        private readonly framesPerBlock: number = TRIM_BLOCK_FRAMES,
    ) {
        this.bytesPerFrame = 2 * channels;
    }

    push(chunk: Buffer): void {
        const data = this.pending ? Buffer.concat([this.pending, chunk]) : chunk;
        const usable = data.length - (data.length % this.bytesPerFrame);
        const ch = this.channels;
        for (let off = 0; off < usable; off += this.bytesPerFrame) {
            for (let c = 0; c < ch; c++) {
                const v = data.readInt16LE(off + 2 * c) / 32768;
                const a = v < 0 ? -v : v;
                if (a > this.blockPeak) this.blockPeak = a;
                this.blockSumSq += v * v;
            }
            this.totalFrames++;
            if (++this.blockFrames >= this.framesPerBlock) this.closeBlock();
        }
        this.pending = usable < data.length ? Buffer.from(data.subarray(usable)) : null;
    }

    private closeBlock(): void {
        if (this.blockFrames === 0) return;
        this.peaks.push(this.blockPeak);
        this.meanSquares.push(this.blockSumSq / (this.blockFrames * this.channels));
        this.blockPeak = 0;
        this.blockSumSq = 0;
        this.blockFrames = 0;
    }

    finalize(): BlockLevels {
        this.closeBlock(); // blocco residuo più corto in coda
        return {
            peaks: this.peaks,
            meanSquares: this.meanSquares,
            blockSec: this.framesPerBlock / this.sampleRate,
            durationSec: this.totalFrames / this.sampleRate,
        };
    }
}

export function linearToDb(x: number): number {
    return x > 0 ? 20 * Math.log10(x) : -Infinity;
}

const powerToDb = (p: number): number => (p > 0 ? 10 * Math.log10(p) : -Infinity);

/**
 * Livello delle parti forti del brano in dBFS: RMS su finestre consecutive da
 * REFERENCE_WINDOW_SEC, poi il 95° percentile (non il massimo: un singolo colpo
 * non deve spostare la soglia). File più corti di una finestra: RMS dell'intero.
 */
export function referenceLevelDb(levels: BlockLevels): number {
    const { meanSquares, blockSec } = levels;
    if (meanSquares.length === 0) return -Infinity;
    const per = Math.max(1, Math.round(REFERENCE_WINDOW_SEC / blockSec));
    const windows: number[] = [];
    for (let i = 0; i < meanSquares.length; i += per) {
        const end = Math.min(meanSquares.length, i + per);
        let sum = 0;
        for (let k = i; k < end; k++) sum += meanSquares[k];
        windows.push(sum / (end - i));
    }
    windows.sort((a, b) => a - b);
    const idx = Math.min(windows.length - 1, Math.floor(REFERENCE_PERCENTILE * windows.length));
    return powerToDb(windows[idx]);
}

/** Energia di ogni blocco in dBFS, media su LEVEL_WINDOW_BLOCKS blocchi centrati. */
export function windowedLevelsDb(meanSquares: number[]): number[] {
    const n = meanSquares.length;
    const half = Math.floor(LEVEL_WINDOW_BLOCKS / 2);
    const out: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
        const a = Math.max(0, i - half);
        const b = Math.min(n - 1, i + half);
        let sum = 0;
        for (let k = a; k <= b; k++) sum += meanSquares[k];
        out[i] = powerToDb(sum / (b - a + 1));
    }
    return out;
}

function percentile(values: number[], p: number): number {
    if (values.length === 0) return -Infinity;
    const s = [...values].sort((x, y) => x - y);
    return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
}

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/** Soglia di energia (dBFS RMS) di base: rif − 45 dB entro i limiti assoluti. */
export function baseThresholdDb(referenceDb: number): number {
    if (!Number.isFinite(referenceDb)) return THRESHOLD_MIN_DB;
    return clamp(referenceDb - THRESHOLD_BELOW_REFERENCE_DB, THRESHOLD_MIN_DB, THRESHOLD_MAX_DB);
}

/** Soglia di picco (dBFS): rif − 35 dB entro i limiti assoluti. */
export function peakThresholdDb(referenceDb: number): number {
    if (!Number.isFinite(referenceDb)) return PEAK_THRESHOLD_MIN_DB;
    return clamp(referenceDb - PEAK_BELOW_REFERENCE_DB, PEAK_THRESHOLD_MIN_DB, PEAK_THRESHOLD_MAX_DB);
}

/**
 * Soglia di energia per la CODA. Parte dalla base; se il tratto finale è un fondo
 * stabile (energia entro TAIL_FLOOR_SPREAD_DB tra 10° e 90° percentile) senza
 * picchi sopra la soglia di picco, sale a mediana + TAIL_FLOOR_MARGIN_DB, ma mai
 * oltre rif − 40 dB.
 */
export function tailThresholdDb(referenceDb: number, tailLevelsDb: number[], tailPeaks: number[]): number {
    const base = baseThresholdDb(referenceDb);
    if (!Number.isFinite(referenceDb) || tailLevelsDb.length === 0) return base;
    const peakThr = Math.pow(10, peakThresholdDb(referenceDb) / 20);
    if (tailPeaks.some(p => p > peakThr)) return base;
    const p10 = percentile(tailLevelsDb, 0.1);
    const p90 = percentile(tailLevelsDb, 0.9);
    if (!Number.isFinite(p10) || p90 - p10 > TAIL_FLOOR_SPREAD_DB) return base;
    const raised = percentile(tailLevelsDb, 0.5) + TAIL_FLOOR_MARGIN_DB;
    const cap = Math.min(THRESHOLD_MAX_DB, referenceDb - THRESHOLD_CAP_BELOW_REFERENCE_DB);
    return Math.max(base, Math.min(raised, cap));
}

export interface EdgeTrimResult {
    durationSec: number;
    /** Nessun blocco sopra soglia: file muto (o sotto soglia in tutta la durata). */
    allSilent: boolean;
    referenceDb: number;
    /** Soglie di energia (dBFS RMS) usate in apertura e in coda, e soglia di picco (dBFS). */
    headThresholdDb: number;
    tailThresholdDb: number;
    peakThresholdDb: number;
    /** Inizio del primo blocco udibile / fine dell'ultimo (secondi dall'inizio del file). */
    contentStartSec: number;
    contentEndSec: number;
    /** Secondi da saltare all'inizio. */
    trimStart: number;
    /** Secondi da togliere alla fine (contratto di AudioClip.trimEnd). */
    trimEnd: number;
}

const round3 = (x: number): number => Math.round(x * 1000) / 1000;

/**
 * Calcola il taglio ai bordi. `thresholdDbOverride` (dBFS RMS) sostituisce la
 * soglia automatica su entrambi i bordi (stesso ruolo del vecchio parametro).
 */
export function computeEdgeTrim(levels: BlockLevels, thresholdDbOverride?: number): EdgeTrimResult {
    const { peaks, meanSquares, blockSec, durationSec } = levels;
    const referenceDb = referenceLevelDb(levels);
    const lv = windowedLevelsDb(meanSquares);

    // Blocchi utili per la coda: gli ultimi END_GUARD_SEC non contano come suono.
    const guardBlocks = Math.round(END_GUARD_SEC / blockSec);
    const lastUsable = lv.length - 1 - guardBlocks;
    const tailBlocks = Math.max(1, Math.round(TAIL_FLOOR_SEC / blockSec));
    const tailFrom = Math.max(0, lastUsable + 1 - tailBlocks);

    const override = thresholdDbOverride !== undefined && Number.isFinite(thresholdDbOverride) ? thresholdDbOverride : undefined;
    const headThr = override ?? baseThresholdDb(referenceDb);
    const tailThr = override ?? (lastUsable >= 0
        ? tailThresholdDb(referenceDb, lv.slice(tailFrom, lastUsable + 1), peaks.slice(tailFrom, lastUsable + 1))
        : baseThresholdDb(referenceDb));
    const peakThrDb = peakThresholdDb(referenceDb);
    const peakThr = Math.pow(10, peakThrDb / 20);

    let first = -1;
    for (let i = 0; i < lv.length; i++) {
        if (lv[i] > headThr || peaks[i] > peakThr) { first = i; break; }
    }
    let last = -1;
    for (let i = lastUsable; i >= 0; i--) {
        if (lv[i] > tailThr || peaks[i] > peakThr) { last = i; break; }
    }

    if (first === -1 || last === -1 || last < first) {
        return {
            durationSec, allSilent: true, referenceDb, headThresholdDb: headThr, tailThresholdDb: tailThr, peakThresholdDb: peakThrDb,
            contentStartSec: 0, contentEndSec: round3(durationSec), trimStart: 0, trimEnd: 0,
        };
    }

    const contentStartSec = first * blockSec;
    const contentEndSec = Math.min(durationSec, (last + 1) * blockSec);

    let trimStart = Math.max(0, contentStartSec - LEAD_MARGIN_SEC);
    let trimEnd = Math.max(0, durationSec - contentEndSec - TAIL_MARGIN_SEC);
    if (trimStart < MIN_TRIM_SEC) trimStart = 0;
    if (trimEnd < MIN_TRIM_SEC) trimEnd = 0;

    return {
        durationSec,
        allSilent: false,
        referenceDb,
        headThresholdDb: headThr,
        tailThresholdDb: tailThr,
        peakThresholdDb: peakThrDb,
        contentStartSec: round3(contentStartSec),
        contentEndSec: round3(contentEndSec),
        trimStart: round3(trimStart),
        trimEnd: round3(trimEnd),
    };
}

// ─── Smart Cues (marker Intro/Outro suggeriti) ────────────────────────────────
// Stesso difetto del vecchio taglio: l'outro era «l'ultimo tratto quieto dopo il
// 40% del brano», anche se dopo ripartiva la musica. In PRE-SHOW il marker di
// outro fa partire il brano successivo: una pausa interna tagliava via il resto.
// Ora un tratto quieto vale come intro solo se parte dall'inizio del file, e
// come outro solo se arriva fino alla fine.

export interface SilenceRegion { start: number; end: number | null }

/** Estrae le regioni da uno stderr di `silencedetect` (end null = fino a EOF). */
export function parseSilenceRegions(stderr: string): SilenceRegion[] {
    const regions: SilenceRegion[] = [];
    for (const line of stderr.split(/\r?\n|\r/)) {
        const s = line.match(/silence_start:\s*(-?[\d.e+-]+)/);
        if (s) { regions.push({ start: Math.max(0, parseFloat(s[1])), end: null }); continue; }
        const e = line.match(/silence_end:\s*([\d.e+-]+)/);
        if (e && regions.length > 0 && regions[regions.length - 1].end === null) {
            regions[regions.length - 1].end = parseFloat(e[1]);
        }
    }
    return regions;
}

/** Tolleranze sui bordi per le Smart Cues (secondi). */
export const CUE_EDGE_START_TOLERANCE_SEC = 0.05;
export const CUE_EDGE_END_TOLERANCE_SEC = 0.25;

export function pickSmartCues(regions: SilenceRegion[], durationSec: number): { introCue: number; outroCue: number } {
    let introCue = 0;
    let outroCue = 0;
    if (durationSec <= 0 || regions.length === 0) return { introCue, outroCue };

    const head = regions[0];
    if (head.start <= CUE_EDGE_START_TOLERANCE_SEC && head.end !== null && head.end > 0.3 && head.end < durationSec * 0.4) {
        introCue = round3(head.end);
    }

    const tail = regions[regions.length - 1];
    const reachesEnd = tail.end === null || tail.end >= durationSec - CUE_EDGE_END_TOLERANCE_SEC;
    if (reachesEnd && tail.start > durationSec * 0.4 && tail.start < durationSec - 1.0) {
        outroCue = round3(tail.start);
    }
    return { introCue, outroCue };
}
