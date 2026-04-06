# RRLMP — Claude Project State
**Ultimo aggiornamento**: 2026-04-06
**Versione corrente**: 0.13.2
**Branch attivo**: `claude/musing-lumiere` (worktree in `.claude/worktrees/musing-lumiere/`)

---

## Struttura Repository

```
C:\Users\Utente\Documents\GitHub\RRLMP\
├── .claude\
│   ├── PROJECT_STATE.md        ← questo file
│   ├── launch.json             ← Vite renderer config (port 5173)
│   └── worktrees\musing-lumiere\  ← working copy attivo (git worktree)
├── builds\
│   └── v0.14.0\               ← exe già compilato (hotfix OOM)
├── docs\changelogs\current\   ← changelog per versione
└── src\                       ← source (mirror nel worktree)
```

---

## Architettura Applicazione

**RRLMP** è un'app Electron + React + TypeScript per radio automation (broadcast audio).

### Pattern fondamentale: Main-Side-Heavy
- **Main process** (Node.js): tutto il processing audio pesante — FFmpeg, metadata, waveform
- **Renderer** (Chromium): solo UI React. Mai operazioni CPU/memoria intensive
- **IPC**: `ipcMain.handle` / `ipcRenderer.invoke` via `preload/index.ts`

### File chiave

| File | Ruolo |
|------|-------|
| `src/main/AudioProcessor.ts` | FFmpeg, metadata, waveform, detectSilence |
| `src/main/index.ts` | IPC handlers, custom media:// protocol |
| `src/preload/index.ts` | contextBridge — espone API a renderer |
| `src/renderer/src/store/useAudioStore.ts` | Engine audio: playClip, stopClip, crossfade |
| `src/renderer/src/store/useSettingsStore.ts` | Settings persistiti in localStorage |
| `src/renderer/src/store/useProjectStore.ts` | State board, colonne, clip |
| `src/renderer/src/types/index.ts` | Tutti i tipi TypeScript |
| `src/renderer/src/components/layout/MainGrid.tsx` | Board principale, drag&drop |
| `src/renderer/src/components/modals/ClipSettingsModal.tsx` | Impostazioni per-clip |
| `src/renderer/src/components/modals/GeneralSettingsModal.tsx` | Impostazioni globali |

### Custom Protocol
`media://` — serve file audio locali con Range Request support.
**CRITICO Windows**: il path deve avere tre slash: `media:///C:/path/to/file.mp3`

---

## Stato Funzionalità (v0.13.2)

### ✅ Implementate e verificate

#### Silence Detection (Fix critico)
- **Manual Auto-Trim** (Clip Settings): `window.electron.detectSilence(path)` → IPC → `AudioProcessor.detectSilence()` → FFmpeg silencedetect
- **Auto-Silence on Drop** (PRE-SHOW): dopo `loadClip()`, chiama `detectSilence` in background (non-bloccante), aggiorna `trimStart`/`trimEnd`
- **IPC channel**: `detect-silence`
- **Fix OOM**: prima era tutto in renderer (arrayBuffer + decodeAudioData) → crash su file grandi

#### Transition System
- **Tipi**: `gapless` (default) | `segue` (old fades, new at full) | `crossfade` (overlap bilanciato)
- **Default globale**: `preshowTransitionType` + `crossfadeDuration` in `useSettingsStore` (localStorage: `rrlmp-settings`)
- **Override per-clip**: `transitionType?: TransitionType` su `AudioClip`
- **Engine**: `transitioningClips: Set<string>` (module-level) + `pendingCrossfadeFadeIn: number | null`
- **Helper**: `applyTransitionAndPlayNext(clipId)` in `useAudioStore`
- **UI globale**: "Pre-Show Transition" section in `GeneralSettingsModal`
- **UI per-clip**: selettore 4 bottoni in `ClipSettingsModal` tab "General Settings"

#### StreamPlayer
- HTML5 `<audio>` + Web Audio API GainNode
- `fadeTo(targetVolume, durationMs)`: rampa lineare
- `updateSettings(clip)`: aggiorna fadeIn/fadeOut/markers
- `onPreEnd` callback: triggera transizione verso prossima clip

#### Ducking
- `duckingFactor` (0-1, default 0.2) + `duckingDuration` (ms, default 500)
- Gestito da Mixing Intelligence in `useAudioStore`

#### Output Device
- Selezione scheda audio via `AudioContext.setSinkId()` / `HTMLMediaElement.setSinkId()`
- Hot switch (applicato immediatamente)

---

## Cose da NON dimenticare

### Errori comuni già incontrati

1. **electron-builder "Cannot compute electron version"**
   → Non usare `"^28.1.0"` (caret). Pinnare versione esatta: `"28.3.3"`

2. **Build in worktree ≠ build in repo principale**
   → Dopo `npm run build`, copiare manualmente `builds/vX.X.X/` in `C:\Users\Utente\Documents\GitHub\RRLMP\builds\`

3. **Triple slash su Windows per media://**
   → `media:///C:/...` non `media://C:/...`

4. **OOM in renderer**
   → MAI `response.arrayBuffer()` + `decodeAudioData()` nel renderer su file grandi. Sempre su main.

5. **ffStream senza error handler**
   → Aggiungere sempre `.on('error', ...)` ai stream FFmpeg o crashano silenziosamente il main process

### Sessioni LLM precedenti

- **Gemini** ha scritto v0.13.0 (poi crashato/persa) → recuperata da `C:\Users\Utente\.gemini\antigravity\brain\c029653b-2875-414d-898c-86cbc692dacc\walkthrough.md.resolved`
- Reintegrata come v0.13.2 in questa sessione Claude

---

## Versioning History (riassunto)

| Versione | Contenuto chiave |
|----------|-----------------|
| 0.10.0–0.10.3 | Engine audio base, StreamPlayer, IPC architecture |
| 0.11.0 | Waveform editor, marker IN/OUT, ducking |
| 0.12.0–0.12.1 | Stability, project save/load (.lmp), ClipCard refactor |
| 0.13.0 | **PERSA** (sessione Gemini crashata) |
| 0.13.2 | Reintegra v0.13.0: Auto-Silence on Drop + Transition System + Fix OOM |
| 0.14.0 | Hotfix OOM (poi rientrato in 0.13.2, numero riservato) |

---

## Prossimi Step Suggeriti

- [ ] Audit completo changelog 0.10.0→0.13.2 vs codice effettivo (verifica feature claims)
- [ ] Build exe v0.13.2
- [ ] Test manuale: crossfade tra 2 clip PRE-SHOW con audio reale
- [ ] Test: auto-silence on drop su file .wav con silenzio iniziale lungo
- [ ] Considerare: UI feedback visivo durante auto-silence in background (spinner/badge)
