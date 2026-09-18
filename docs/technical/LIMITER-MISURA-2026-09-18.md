# Limiter della master chain — misura e correzione (v1.15.34)

**Data:** 2026-09-18 · **Codice:** `src/renderer/src/engine/masterLimiter.ts` · **Sonde:** `scripts/sonda-audio/`

## Metodo

Tutte le misure sono fatte **dentro l'Electron del progetto** (28.3.3, Chrome 120): il `DynamicsCompressorNode` è codice di Blink e i numeri devono venire dalla versione che va in onda.

- **Sinusoide** (`limiter-main.js` + `limiter-page.js`): 1 kHz su `OfflineAudioContext`, picco a regime sugli ultimi 0,5 s.
- **Musica vera** (`run-chain.sh`): bundle esbuild del **vero** `AudioContextManager`, con `window.AudioContext` sostituito da un `OfflineAudioContext`; uscita in WAV float32 misurata con FFmpeg `ebur128=peak=true`. Estratti di 60 s: *Mr. Self Destruct* (NIN, master forte, −9,1 LUFS, picchi a 0 dBFS) e *Roma Capoccia* (Venditti, −12,2 LUFS).

## Cosa non andava (≤ 1.15.33: soglia −1, 20:1, knee 0, nessun trim)

| Ingresso | Uscita | |
|---:|---:|---|
| −60 dBFS | −59,43 | **+0,57 dB** anche dove non comprime |
| −6 dBFS | −5,43 | +0,57 |
| +6 dBFS | **+0,07** | tetto −1 superato |
| +24 dBFS | **+1,26** | |

Makeup implicito misurato per soglie da −0,1 a −10 dB: **0,570 dB per dB di soglia**, costante. Soglia 0 con rapporto 1 (catena spenta): makeup 0,00.

## Correzione

- soglia interna = tetto − **1,5 dB**;
- guadagno fisso dopo il limiter = −0,57 × soglia (annulla il makeup);
- uscita del Glue Multibanda × 10^(0,57/20): era stato tarato nel 2026-06 con il vecchio makeup nel percorso.

Margine scelto tra quattro misurati (uscita meno tetto, caso peggiore sui tetti −0,1 / −1 / −3 / −6):

| Margine | fino a +12 dB di sovraccarico | a +24 dB |
|---:|---:|---:|
| 1,0 dB | +0,34 | +1,02 |
| 1,2 dB | +0,15 | +0,83 |
| **1,5 dB** | **−0,13** | +0,54 (+0,27 col tetto di default) |
| 2,1 dB | −0,70 | −0,03 |

2,1 dB regge anche +24 dB ma, a parità di tetto, schiaccia di più i master già caldi. +12 dB equivale a tre sorgenti a fondo scala sommate, più margine.

## Risultato su musica (tetto −1, default)

| Stato | NIN prima → dopo | Venditti prima → dopo |
|---|---|---|
| sorgente | −9,1 LUFS · −0,1 dBTP | −12,2 LUFS · −0,5 dBTP |
| Glue spento | −8,5 · **+0,5 dBTP** → −9,6 · −1,4 dBTP | −11,5 · 0,0 → **−12,2** · −1,7 |
| Glue acceso | −11,4 · −0,1 → −11,5 · −1,7 | −13,4 · −1,6 → −13,4 · −2,2 |

Il Glue acceso resta al livello di prima (entro 0,1 LU). Con il Glue spento il brano dinamico torna identico alla sorgente; il master già compresso perde 0,5 LU perché ora il limiter lavora davvero.

## Emerso durante la misura, non corretto

**Catena spenta non trasparente sui picchi.** Con la catena in bypass il livello resta identico (−9,1 / −12,2 LUFS) ma il picco vero sale: NIN da −0,1 a **+2,4 dBTP**, Venditti da −0,5 a +0,5. Il limiter in bypass è neutro (misurato), quindi la causa più probabile è l'HPF messo in `allpass`, che ruota la fase delle basse. In roadmap.
