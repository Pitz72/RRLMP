/**
 * Limiter della master chain — parametri MISURATI (v1.15.34).
 *
 * Sonda: OfflineAudioContext dentro l'Electron del progetto (28.3.3, Chrome 120),
 * sinusoide 1 kHz, picco a regime. Stesso metodo di StreamFlow 0.8.2.
 *
 * Cosa non andava fino alla 1.15.33 (soglia −1 dB, 20:1, knee 0, nessun trim):
 *  1. MAKEUP IMPLICITO. Il `DynamicsCompressorNode` di Chromium alza TUTTO il
 *     segnale di 0,570 dB per ogni dB di soglia, anche dove non comprime nulla
 *     (−60 dBFS in → −59,43 out). Misurato identico da −0,1 a −10 dB di soglia.
 *  2. TETTO NON RISPETTATO. 20:1 non è un muro: con soglia −1 l'uscita passava
 *     0 dBFS già a +6 dB di sovraccarico (+0,07) e arrivava a +1,26 a +24 dB.
 *
 * Correzione:
 *  - la soglia interna sta LIMITER_HEADROOM_DB sotto il tetto scelto dall'utente;
 *  - un guadagno fisso dopo il limiter annulla esattamente il makeup di quella soglia.
 * Risultato misurato (sinusoide), per ogni tetto da −0,1 a −6 dBFS:
 *  - trasparente (0,00 dB) sotto la soglia interna;
 *  - uscita sotto il tetto fino a +12 dB di sovraccarico (tre sorgenti a fondo
 *    scala sommate, più margine); a +24 dB lo supera di 0,27 dB con il tetto di
 *    default, 0,54 dB a −6.
 * Su musica vera (tetto −1): master dinamico −12,2 LUFS invariato; master già
 * compresso a −9,1 LUFS con picchi a 0 dBFS → −9,6 LUFS, picco vero −1,4 dBTP.
 * Prima: +0,6 LU su tutto e picchi a +0,5 dBTP.
 *
 * Il makeup dipende da soglia, rapporto e knee: la costante vale SOLO per 20:1 e
 * knee 0. Se si cambiano, va rimisurata.
 */

export const LIMITER_RATIO = 20;
export const LIMITER_KNEE = 0;
export const LIMITER_ATTACK_S = 0.002;
export const LIMITER_RELEASE_S = 0.1;

/** Makeup implicito di Chromium per dB di soglia (20:1, knee 0), misurato. */
export const LIMITER_MAKEUP_PER_DB = 0.57;

/** Distanza tra soglia interna e tetto. Scelta tra 1,0 / 1,2 / 1,5 / 2,1 dB
 * misurati: 2,1 regge anche +24 dB di sovraccarico ma schiaccia di più i master
 * già caldi; 1,5 regge +12 dB con ogni tetto e costa la metà sulla musica. */
export const LIMITER_HEADROOM_DB = 1.5;

export interface LimiterParams {
    threshold: number; // dB, soglia del DynamicsCompressorNode
    ratio: number;
    trimDb: number;    // guadagno dopo il limiter, annulla il makeup implicito
}

/**
 * @param ceilingDb tetto d'uscita scelto dall'utente (dBFS, negativo)
 * @param chainOn   false = catena in bypass: limiter neutro (soglia 0, 1:1, makeup
 *                  misurato 0,00 dB) e nessun trim
 */
export function limiterParams(ceilingDb: number, chainOn: boolean): LimiterParams {
    if (!chainOn) return { threshold: 0, ratio: 1, trimDb: 0 };
    const threshold = Math.min(0, ceilingDb) - LIMITER_HEADROOM_DB;
    return { threshold, ratio: LIMITER_RATIO, trimDb: LIMITER_MAKEUP_PER_DB * threshold };
}

/**
 * Il Glue Multibanda (preset 'neutro') era stato tarato nel 2026-06 con il vecchio
 * limiter nel percorso, cioè con i suoi +0,57 dB di makeup (tetto di default −1).
 * Tolto il makeup, l'uscita del Glue sale della stessa quantità: con il Glue
 * acceso il livello resta quello di prima.
 */
export const GLUE_LEGACY_MAKEUP_GAIN = Math.pow(10, (LIMITER_MAKEUP_PER_DB * 1) / 20);

export const dbToGain = (db: number): number => Math.pow(10, db / 20);
