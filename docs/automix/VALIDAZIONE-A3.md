# Validazione A3 — BPM e beat-offset su musica reale (2026-07-02)

**Contesto**: la Fase A dell'automix (v1.10.16-18) richiedeva la validazione su brani veri prima di costruire motore e UI. L'utente non può stimare i BPM a orecchio ("altrimenti facevo i mix manualmente") → validazione **oggettiva e strumentale**, eseguita con il codice compilato REALE dell'app (`out/main/bpmDetection.js`, stessa pipeline FFmpeg 11025Hz/PCM16/inviluppo 50Hz) su 9 brani della libreria dell'utente (`C:\Users\Utente\Music`).

## Metodo (script `validate-a3.js`, 3 misure indipendenti per brano)

1. **Self-consistency**: BPM stimato su 3 segmenti diversi del brano (10-40s, 40-70s, 70-100s) oltre alla finestra dell'app (0-60s). Un rilevatore affidabile dà lo stesso BPM (o un rapporto d'ottava/terzina) su segmenti diversi di un brano a tempo costante.
2. **Grid score**: rapporto tra l'onset medio nei punti dei beat predetti da `(bpm, beatOffsetSec)` e l'onset medio globale. Fase casuale ≈ 1.0; griglia agganciata > 1.5.
3. **Confronto col BPM canonico** noto pubblicamente (dove certo).

## Risultati

| Brano | BPM app (0-60s) | conf | offset | Segmenti (3) | Coerenza | Grid score | Canonico |
|---|---|---|---|---|---|---|---|
| R.E.M. — Losing My Religion | 125.8 | 0.53 | 0.355s | 125.8 / 125.8 / 125.8 | 3/3 | **6.95** | ~126 ✅ |
| Linkin Park — What I've Done | 120.0 | 0.80 | 0.44s | 120 / 120 / 120 | 3/3 | **5.19** | 120 ✅ |
| Måneskin — BABY SAID | 131.1 | 0.61 | 0.36s | 131.1 ×3 | 3/3 | **6.52** | ~131 ✅ |
| Vampire Weekend — A-Punk | 175.9 | 0.59 | 0.22s | 175.7 / 175.5 / 175.6 | 3/3 | 3.79 | ~175 ✅ |
| Social Distortion — Story of My Life | 100.0 | 0.72 | 0.36s | 101.1 / 101 / 100 | 3/3 | 3.04 | ~100 ✅ |
| RHCP — Californication | 100.0 | 0.60 | 0.22s | 100 / 100 / 96.2 | 2/3 | 2.86 | ~96 ⚠️ (+4%) |
| Green Day — She | 90.8 | 0.45 | 0.12s | 90.3 / 92.5 / 93 | 2/3 | 3.32 | incerto |
| Chris Stapleton — Tennessee Whiskey | 150.5 | **0.30** | 0.29s | 151.2 / 149.1 / 150 | 3/3 | 2.94 | ballad 6/8 (~50×3) |
| Pink Floyd — Mother | 143.0 | **0.41** | 0.375s | 139.9 / 148.7 / 136.2 | **0/3** | 2.41 | tempo variabile (no click) |

## Verdetto

- ✅ **BPM affidabile su materiale con beat regolare** (il target dell'automix): 5-6 brani su 9 con valori canonici centrati e segmenti coerenti al decimale. Californication sovrastimata del ~4% (entro il cap ±8% del piano, ma contribuisce a deriva di fase → il crossfade breve, default 8 beat, resta la mitigazione giusta).
- ✅ **Beat-offset agganciato**: grid score 2.4–6.9 su TUTTI i brani (fase casuale ≈ 1.0). La griglia `t_k = offset + k·(60/bpm)` cade davvero sugli attacchi.
- ⚠️ **SCOPERTA per la Fase D — la soglia di confidence ipotizzata (0.3) NON basta**: "Mother" (tempo variabile, IL caso da non mixare mai) esce con confidence **0.41** e segmenti 0/3 coerenti; "Tennessee Whiskey" (ballad 6/8) esattamente **0.30**. I brani buoni stanno a 0.53–0.80. → **Soglia raccomandata: ≥ 0.5** (i casi 0.3–0.5 degradano a crossfade classico, esattamente l'esito voluto: "il peggior esito ammesso è un crossfade normale").
- Conseguenza implementativa: la **confidence va persistita** sulla clip (fino alla v1.10.19 veniva scartata dopo il badge) → campo `bpmConfidence` aggiunto in questo stesso step.

## Fase A: CHIUSA. Si può procedere con la Fase B (motore).
