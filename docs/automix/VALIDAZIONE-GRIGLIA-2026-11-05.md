# Validazione della griglia dei beat — 2026-11-05 (v1.15.37)

**Contesto.** Richiesta utente: la modalità MIX deve far passare i brani «allineati dal software sulla base del ritmo» anche quando è l'operatore a cambiare brano. Gli usi indicati sono la classifica veloce, con solo l'inizio di ogni brano, e il medley durante la finale di un festival. Il mix a tempo aggancia le battute dei due brani usando `bpm` e `beatOffsetSec` (il primo battito) salvati nel progetto. La validazione A3 del 2026-07-02 aveva verificato che la griglia «cade sugli attacchi» (rapporto 2,4–6,9 contro 1 del caso), ma non **di quanti millisecondi** sbaglia. Questa misura colma quel vuoto.

## Metodo

1. **Basi sintetiche a verità nota.** Cassa su ogni battito, rullante sul 2 e sul 4, charleston in ottavi, a 124, 120 e 118 BPM, con primo battito a 0,25, 0,31 e 0,18 s. Si confronta il risultato del rilevatore con i valori veri.
2. **Musica vera, coerenza interna.** Per la musica vera non esiste un valore «vero» del primo battito. Si analizzano allora separatamente il primo minuto (0–60 s) e il secondo (60–120 s) dello stesso brano. La griglia del primo minuto, prolungata, deve cadere sui battiti trovati nel secondo: lo scarto in millisecondi misura quanto ci si può fidare della griglia lontano dal punto in cui è stata calcolata. Set: i 57 brani della cartella `Sanremo 2026` dell'utente, letti e mai modificati. Si considerano i 38 con confidence ≥ 0,5, cioè quelli che il mix provava già ad agganciare.

Pipeline identica all'app: FFmpeg → PCM mono 11025 Hz, codice compilato `out/main/bpmDetection.js`.

## Difetti trovati nel rilevatore fino alla 1.15.36

| Difetto | Effetto |
|---|---|
| Frequenza dell'inviluppo sbagliata: a 11025 Hz una finestra di «20 ms» è di 221 campioni (20,045 ms), ma i calcoli usavano 50 Hz esatti | tutti i BPM gonfiati dello 0,23%; griglia che scivola di circa 1 ms a battito (≈ 70 ms dopo 30 s di brano) |
| Fase cercata su 60 s con il periodo del BPM stimato | un errore di tempo dello 0,3% basta a spostare il «primo battito» di decine di millisecondi |
| Inviluppo a 20 ms, a banda intera | risoluzione grossa; charleston e battimani in controtempo competono con la cassa |

## Rimedio (v1.15.37)

`refineBeatGrid` in `src/main/bpmDetection.ts`:
- funzione di attacco a 5 ms sul segnale filtrato passa-basso a 200 Hz (cassa e basso), con la frequenza vera (55 campioni = 4,989 ms);
- ricerca **congiunta** di tempo (±3% attorno alla stima grezza: passo 0,1 BPM, poi 0,01) e fase (passo ¼ di campione) che massimizza l'energia di attacco sull'intera griglia;
- **punteggio della griglia** (`gridScore`): energia di attacco media sui battiti diviso energia media ovunque.

Nel motore del mix (`automixEngine.ts`): `minGridScore = 2.5`. Sotto soglia, su uno dei due brani, il passaggio è un crossfade classico.

## Risultati

**Basi sintetiche**

| Base | Vecchio: BPM / primo battito | Nuovo: BPM / primo battito |
|---|---|---|
| 124 BPM, 0,250 s | 124,6 / 0,325 (+75 ms) | 123,99 / 0,244 (−6 ms) |
| 120 BPM, 0,310 s | 120,1 / 0,275 (−35 ms) | 120,00 / 0,308 (−2 ms) |
| 118 BPM, 0,180 s | 118,6 / 0,270 (+90 ms) | 118,00 / 0,177 (−3 ms) |
| accordo senza ritmo | 147,1, conf 0,89 → «a tempo» | punteggio 2,36 → crossfade |

Lo scarto residuo è piccolo e quasi costante. Nel mix conta la fase **relativa** fra i due brani: uno scarto uguale su entrambi si annulla.

**Sanremo 2026: coerenza fra primo e secondo minuto (38 brani con confidence ≥ 0,5)**

| | Mediana | 75% | 90% | Sotto 20 ms |
|---|---|---|---|---|
| Rilevatore fino alla 1.15.36 | 141 ms | 186 ms | 234 ms | 1 su 26 |
| Nuovo, tutti i brani | 8 ms | 64 ms | 197 ms | 15 su 25 |
| Nuovo, griglia ≥ 2,5 (quelli che il mix aggancia) | 3 ms | 4 ms | 64 ms | 12 su 14 |

Brani sopra soglia (BPM, punteggio, coerenza vecchia → nuova):

| Brano | BPM | Griglia | Vecchio | Nuovo |
|---|---|---|---|---|
| animali notturni — Malika Ayane | 109,00 | 10,65 | 234 ms | 0 ms |
| Che fastidio! — Ditonellapiaga | 130,01 | 8,91 | 184 ms | 4 ms |
| Voilà — Elettra Lamborghini | 132,01 | 7,78 | 55 ms | 1 ms |
| La felicità e basta — Maria Antonietta, Colombre | 124,00 | 7,48 | 160 ms | 239 ms ⚠️ |
| OSSESSIONE — Samurai Jay | 121,96 | 7,34 | 218 ms | 64 ms ⚠️ |
| Stupida sfortuna — Fulminacci | 94,01 | 6,27 | 26 ms | 1 ms |
| Poesie Clandestine — LDA, Aka 7even | 108,01 | 6,10 | 141 ms | 3 ms |
| Ti penso sempre — chiello | 151,99 | 5,61 | 40 ms | 1 ms |
| E, la vita la vita — J-AX e altri | 138,01 | 4,86 | 37 ms | 2 ms |
| Aserejé (Sanremo Remix) — Elettra Lamborghini, Las Ketchup | 92,51 | 4,62 | 186 ms | 10 ms |
| ITALIA STARTER PACK — J-AX | 115,35 | 3,71 | 194 ms | 4 ms |
| The Riddle — The Kolors | 99,99 | 3,65 | 90 ms | 2 ms |
| Resta Con Me — Bambole Di Pezza | 144,00 | 3,56 | 65 ms | 2 ms |
| Il Mondo — Maria Antonietta, Colombre, Brunori Sas | 162,12 | 3,54 | 72 ms | 3 ms |

⚠️ «La felicità e basta» salta di mezzo battito (239 ms a 124 BPM) fra il primo e il secondo minuto: probabilmente nel secondo minuto cambia l'arrangiamento e prevale un controtempo. Nei primi 60 secondi, quelli che contano in una classifica veloce, la griglia resta valida. «OSSESSIONE» deriva di 64 ms in un minuto: tempo leggermente variabile.

I 24 brani sotto soglia (ballate, cassa assente o irregolare) passano col crossfade classico. È l'esito voluto per una ballata, e rispetta la regola della Fase D: il peggior esito ammesso è un crossfade normale, mai battute agganciate a caso.

## Limiti noti

- Si analizza il primo minuto di ogni brano, come prima. Un mix che parte dopo diversi minuti di un brano a tempo non perfettamente costante può essere meno preciso. La classifica veloce e il medley usano soprattutto l'inizio dei brani.
- Il tempo del brano entrante è agganciato con un playbackRate entro ±8%, con l'altezza conservata, e rientra a 1,0 dello 0,1% al secondo.
- I brani già analizzati prima della 1.15.37 hanno la griglia vecchia: alla prima apertura del progetto vengono rianalizzati una volta (`bpmCheckedV3`). Finché non lo sono, il mix usa il crossfade classico, perché manca il punteggio.

## Riproducibilità

Prototipo e basi sintetiche sono nello scratchpad della sessione del 2026-11-05 (`beatgrid_proto.js`, `make_mixtest.js`). I test permanenti sono in `src/main/__tests__/bpmDetection.test.ts`: segnali sintetici a 96–132 BPM con charleston forte in controtempo, più l'accordo senza ritmo.
