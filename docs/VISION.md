# RRLMP — Documento di Visione Tecnica
**Versione**: 0.13.2 | **Data**: 2026-04-06

Questo documento sintetizza lo **stato reale del software** confrontato con la documentazione di progetto, identifica le aree di miglioramento prioritarie, e propone le funzionalità essenziali per il perfezionamento del software broadcast.

---

## 1. STATO ATTUALE — Cosa è davvero implementato

### 1.1 Funzionalità Operative (Verificate nel Codice)

| Area | Feature | Versione | Note |
|------|---------|----------|------|
| **Engine** | Playback HTML5 + Web Audio API gain nodes | ≤0.9.x | StreamPlayer |
| **Engine** | FFmpeg silence detection (IPC) | 0.13.2 | `detect-silence` channel |
| **Engine** | Auto-Silence on Drop (PRE-SHOW) | 0.13.2 | Non-bloccante, background |
| **Engine** | Sistema Transizioni (Gapless/Segue/Crossfade) | 0.13.2 | Override globale + per-clip |
| **Engine** | Ducking Sidechain | ≤0.9.x | source → ducka i target |
| **Engine** | Output Device Hot-Switch | ≤0.9.x | setSinkId() |
| **Engine** | Sequencer play_next | ≤0.9.x | per la colonna PRE-SHOW |
| **Waveform** | Peak-based rendering (200 barre max) | 0.10.7 | Via IPC FFmpeg PCM |
| **Waveform** | Mini-Player locale per clip | 0.10.7 | Tag `<audio>` HTML5 |
| **Markers** | Trim Start/End (via pulsanti) | 0.10.7 | No drag, click-based |
| **Markers** | Intro Marker (countdown board) | 0.12.0 | `INTRO: -Xs` |
| **Markers** | Outro Marker (pre-cue + alert) | 0.12.1 | `OUTRO IN: -Xs` + `🚨 OUTRO` |
| **UI** | Clip Settings Modal (tab General + Trim&Markers) | 0.10.0 | |
| **UI** | General Settings Modal (Audio, Ducking, Transizioni) | ≤0.9.x + 0.13.2 | |
| **UI** | VU Meter real-time | ≤0.9.x | |
| **UI** | Digital Clock | ≤0.9.x | |
| **UI** | Welcome Screen / New Project | ≤0.9.x | |
| **Persistenza** | Save/Load .lmp (JSON) | ≤0.9.x | |
| **Persistenza** | Save As / Direct Save | ≤0.9.x | |
| **Persistenza** | Auto-Backup ogni 5 min | 0.10.3 | Decoupled timer |
| **Persistenza** | Export Self-Contained (copia file) | ≤0.9.x | Progress IPC |
| **MIDI** | Note/CC mapping per-clip | ≤0.9.x | `midiBind` field |
| **MIDI** | Global bind (Stop All, Master Volume) | ≤0.9.x | |
| **MIDI** | MIDI Learn Mode 15s countdown | ≤0.9.x | Escape, badge |
| **i18n** | react-i18next (IT, EN, multi-lingua) | ≤0.9.x | |
| **Arch** | Main-Side-Heavy (FFmpeg nel Main) | 0.11.0 | |
| **Arch** | ASAR Unpack FFmpeg/FFprobe | 0.11.2 | |
| **Arch** | media:// custom protocol | ≤0.9.x | Range requests |

### 1.2 Discrepanze Documentazione vs Codice

| Claim Documentato | Versione | Realtà | Impatto |
|------------------|----------|--------|---------|
| "Rendering Wavesurfer.js" | 0.10.0 | Wavesurfer MAI usato dopo v0.10.7; package.json ancora lo include | Basso — nota errata aggiunta |
| "Marker Drag & Drop visivi" | 0.10.0 | Implementati come pulsanti click-based, non drag | Medio — UX diversa |
| "Auto-Fit Zoom (px/sec)" | 0.10.2 | La "soluzione" fu migrare a HTML5, nessun sistema di zoom esiste | Basso — risolto diversamente |
| `isUpdatingRef` lock per Wavesurfer | 0.10.3 | Implementato ma diventato irrilevante con abbandono Wavesurfer | Nessuno |

---

## 2. ANALISI GAP — Roadmap vs Implementazione

### 2.1 Feature Pianificate mai Implementate

#### 🔴 Priorità Alta

**Marker Drag & Drop Interattivi**
- *Promesso*: Trim/Intro/Outro spostabili trascinando handle sulla waveform
- *Attuale*: Pulsanti "Set Trim Start", "Set Intro" ecc. — funzionale ma meno intuitivo
- *Impatto*: UX broadcast richiede editing rapido. Il drag visivo è lo standard (Adobe Audition, Audacity, RX)
- *Complessità*: Media — richiede overlay SVG/canvas interattivo sopra la waveform

**LMP Integrity Check**
- *Promesso*: Diagnostica all'apertura progetto per file mancanti (Clip Rosse)
- *Attuale*: Se un file è stato spostato/rinominato, la clip è silenziosa senza feedback
- *Impatto*: Potenzialmente catastrofico in broadcast (clip muta in onda)
- *Complessità*: Bassa — controllo `fs.existsSync` per ogni path all'apertura del .lmp

#### 🟡 Priorità Media

**Feedback Visivo Auto-Silence in Background**
- *Promesso*: Implicito dalla feature auto-silence on drop
- *Attuale*: Il processo FFmpeg gira in background ma la clip non mostra nessun indicatore visivo
- *Impatto*: L'utente non sa se il trim è stato applicato o se è in corso
- *Complessità*: Bassa — stato `isAnalyzing` sulla clip, spinner sul ClipCard

**Pannello Keymapping Centralizzato**
- *Promesso*: Gestione Keybind/MIDI in pannello dedicato
- *Attuale*: Keybind per-clip in ClipSettingsModal; Global bind disperso in GlobalControls
- *Impatto*: In broadcast si vogliono vedere tutti i binding d'un colpo per verifica rapida
- *Complessità*: Media — modal tabellare con tutte le clip+binding

**Colonne Configurabili (Layout Regia 5.0)**
- *Promesso*: Espansione griglia, customizzazione colonne
- *Attuale*: 5 colonne fisse hardcoded in `DEFAULT_COLUMNS`
- *Impatto*: Ogni radio ha workflow diversi — alcune vogliono 2 colonne musica, nessuna SFX
- *Complessità*: Alta — richiede UI di gestione colonne e migrazione dati .lmp

#### 🟢 Priorità Bassa

**Pulizia `wavesurfer.js` da package.json**: 1 riga da rimuovere, 0 rischi.

**i18n nei Modali**: Testi ancora in italiano hardcoded in ClipSettingsModal e GeneralSettingsModal.

---

## 3. FUNZIONALITÀ DA MIGLIORARE

### 3.1 Waveform Editor — UX Insufficiente per Standard Broadcast

**Problema attuale**: Il WaveformEditor mostra una rappresentazione visiva dell'onda ma non è interattiva oltre i pulsanti. In un software broadcast professionale (Adobe Audition, ProTools, Descript) l'editor è il cuore dell'operatività.

**Miglioramenti prioritari**:

1. **Handle Drag & Drop** — Overlay semitrasparente con handle SVG trascinabili per Trim Start, Trim End, Intro, Outro. La posizione x del mouse → secondi via `(x / containerWidth) * clip.duration`.

2. **Click-to-Seek nel Mini-Player** — Click sulla waveform → salta a quel punto nel player locale. Standard atteso in qualsiasi DAW.

3. **Zoom orizzontale** — Pinch/scroll per ingrandire una zona specifica. Fondamentale per editing preciso di tracce lunghe (intros di 30s su clip da 4 minuti).

4. **Playhead visivo** — Lineetta verticale che avanza mentre il mini-player suona. Attualmente non c'è.

### 3.2 Sistema di Transizioni — Buono ma Incompleto

**Cosa funziona bene**: L'engine Gapless/Segue/Crossfade è corretto e stabile.

**Gap aperti**:

1. **Durata separata per Segue e Crossfade** — Attualmente condividono `crossfadeDuration`. In broadcast Segue e Crossfade hanno spesso durate diverse (Segue più breve, Crossfade più lungo).

2. **Preview del crossfade** — Nessun modo di "sentire" la transizione senza andare in onda. Utile un pulsante "Test Transition" che suona gli ultimi N secondi della clip corrente + i primi N della prossima.

3. **Indicatore visivo di transizione in corso** — Quando una clip è in `transitioningClips`, la ClipCard dovrebbe mostrare uno stato diverso (badge "FADING OUT", barra che scende).

### 3.3 Gestione Errori — Troppo Primitiva

**Problema**: Gli errori usano `alert()` nativi del browser, che:
- Bloccano completamente l'interfaccia (broadcast inaccettabile)
- Non hanno stile coerente con l'app
- Non possono essere accodati o ignorati

**Soluzione**: Toast notification system (bottom-right, non-bloccante, auto-dismiss dopo 4s). Stack di toast per errori multipli. Log anche nel DebugOverlay.

### 3.4 Auto-Backup — Funzionale ma Silenzioso

**Attuale**: Timer ogni 5 minuti, log nel DebugOverlay, nessun feedback UI.

**Miglioramento**: Badge "💾 Auto-saved" nell'header che appare per 3 secondi dopo ogni backup. Indicatore "⚠️ unsaved 8m" se non si salva da troppo tempo.

---

## 4. FUNZIONALITÀ ESSENZIALI MANCANTI (per perfezionamento broadcast)

### 4.1 🔴 CRITICO — Clip Integrity Check

**Perché è essenziale**: In radio il progetto viene preparato il giorno prima e eseguito in onda il giorno dopo. Se nel mezzo qualcuno rinomina una cartella, le clip diventano mute. Non c'è nessun alert.

**Implementazione**:
```
Al loadProject():
  per ogni clip in ogni colonna:
    if (!fs.existsSync(clip.path)):
      marca clip con { isMissing: true }

ClipCard: se isMissing → sfondo rosso, icona ⚠️, testo "FILE MANCANTE"
Al play di clip mancante → toast error invece di silenziosa
```

### 4.2 🔴 CRITICO — Hotkey Globale Emergency Stop

**Perché è essenziale**: In broadcast c'è sempre la necessità di un "panic button" che stoppa tutto immediatamente. Attualmente il Stop All è solo nel pannello UI e nel binding MIDI.

**Implementazione**: `globalShortcut.register('Escape', stopAll)` nel main process (funziona anche con finestra non in focus).

### 4.3 🟠 ALTA — Coda Playlist Visiva (Next-Up Indicator)

**Perché è essenziale**: Nella colonna PRE-SHOW il sistema sa qual è la prossima clip da suonare (la successiva nella lista), ma non lo mostra all'utente.

**Implementazione**: Badge "▶ NEXT" sulla clip che verrà suonata dopo quella corrente. In colonna PRE-SHOW, quando una clip è in riproduzione, la successiva mostra l'indicatore.

### 4.4 🟠 ALTA — Timer On Air / Elapsed

**Perché è essenziale**: Il conduttore radio deve sapere da quanti minuti si è in onda continuativa. Un semplice counter "ON AIR: 01:23:45" che parte al primo play e si ferma allo stop-all è fondamentale.

**Implementazione**: Stato `onAirStartTime` in `useAudioStore`, resettato al `stopAll()`, incrementato ogni secondo con `setInterval`.

### 4.5 🟠 ALTA — Script / Note per il Conduttore

**Perché è essenziale**: Il conduttore legge un testo mentre la musica suona. Attualmente non c'è nessun posto dove inserire/leggere il testo del parlato associato a una clip.

**Implementazione**: Campo `notes?: string` su `AudioClip`. In ClipSettingsModal, tab "Script/Note". In ClipCard durante riproduzione → click su icona 📝 → overlay a schermo intero del testo (grande, leggibile).

### 4.6 🟡 MEDIA — Playlist Import da M3U/CSV

**Perché è essenziale**: Le radio hanno già playlist generate da sistemi di scheduling (Zetta, RCS, Myriad). Importare una M3U con path assoluti e mapparla automaticamente sulle colonne ridurrebbe il setup manuale da 20 minuti a 30 secondi.

**Implementazione**: IPC handler `import-playlist` che legge M3U e crea `AudioClip[]` con path già mappati.

### 4.7 🟡 MEDIA — Segnaposto / Clip Placeholder

**Perché è essenziale**: In preparazione puntata spesso si sa "qui ci va una canzone" ma non si ha ancora il file. Un placeholder con nome e durata stimata permette di costruire il rundown visivo prima di avere tutti i file.

**Implementazione**: `isMissing: boolean` flag usato anche per placeholder intenzionali. `estimatedDuration?: number` per il tempo stimato.

### 4.8 🟡 MEDIA — Shortcut Tastiera Globali per le Clip

**Perché è essenziale**: Il campo `keybind` esiste su AudioClip ma non è chiaro se e come i keybind siano attivi globalmente. In broadcast le mani sono spesso occupate dai microfoni — serve che F1-F12 / numpad triggeri le clip senza click.

**Verifica e completamento**: Assicurarsi che il listener keyboard sia attivo globalmente (non solo quando un elemento è focused) e documentarlo.

### 4.9 🟢 BASSA — Colori Personalizzati per Colonna

**Implementazione**: Già c'è `customColor` su AudioClip. Estendere il concetto alla colonna stessa con color picker nell'header.

### 4.10 🟢 BASSA — Volume Master Fisico (MIDI CC come Fader)

**Attuale**: MIDI CC può bindare il Master Volume ma solo in modo on/off. Un CC continuo (fader fisico) dovrebbe mappare linearmente 0-127 → 0.0-1.0 del gain.

---

## 5. PRIORITÀ DI SVILUPPO SUGGERITE

### Fase A — Stabilità & Professionalità Broadcast (immediato)

| # | Feature | Effort | Impatto |
|---|---------|--------|---------|
| A1 | **LMP Integrity Check** (clip mancanti → rosse) | 2h | 🔴 Critico in broadcast |
| A2 | **Toast notification system** (sostituisce alert) | 4h | 🔴 Standard professionale |
| A3 | **Feedback Auto-Silence** (spinner sulla clip) | 1h | 🟠 UX trasparente |
| A4 | **Global Emergency Stop hotkey** (Escape globale) | 1h | 🔴 Broadcast safety |
| A5 | **Next-Up badge** in PRE-SHOW | 2h | 🟠 Workflow speaker |

### Fase B — UX Editor (breve termine)

| # | Feature | Effort | Impatto |
|---|---------|--------|---------|
| B1 | **Drag & Drop marker waveform** | 2 giorni | 🟠 Editing preciso |
| B2 | **Click-to-seek waveform** | 4h | 🟡 Comfort utente |
| B3 | **Playhead visivo waveform** | 4h | 🟡 Comfort utente |
| B4 | **Timer On Air** | 3h | 🟠 Workflow speaker |
| B5 | **Note/Script per clip** | 1 giorno | 🟠 Workflow speaker |

### Fase C — Potenza & Scalabilità (medio termine)

| # | Feature | Effort | Impatto |
|---|---------|--------|---------|
| C1 | **Colonne Configurabili** | 1 settimana | 🟡 Flessibilità workflow |
| C2 | **Pannello Keymapping Centralizzato** | 3 giorni | 🟡 Gestione bind |
| C3 | **Playlist Import M3U** | 2 giorni | 🟡 Integrazione sistemi radio |
| C4 | **Pulizia wavesurfer.js** | 30min | 🟢 Pulizia build |
| C5 | **i18n modali** | 2h | 🟢 Completamento i18n |

---

## 6. VISIONE A LUNGO TERMINE

RRLMP è nato come software di messa in onda per streaming/podcast, ma con le feature attuali ha le basi per diventare uno strumento **broadcast professionale completo** su desktop.

**Differenziatori rispetto alla concorrenza** (Myriad, Zetta, RadioDJ):
- **Open architecture**: file .lmp sono JSON leggibili e modificabili
- **Cross-platform** (Electron): funziona su Windows, Mac, Linux
- **Gratuito / custom-deployable**: no licenze per stazione
- **Real-time visual feedback**: i countdown Intro/Outro sono rari anche nel software commerciale

**Limiti strutturali da tenere a mente**:
- Il playback su Chromium (anche con Main-Side-Heavy) ha un overhead rispetto ad applicazioni native C++
- Web Audio API non supporta nativamente sample rate > 48kHz senza resampling
- MIDI latency su Web MIDI API è ~10-30ms (accettabile ma non studio-grade)

Per uso broadcast professionale ad alta criticità, il sistema attuale è adeguato per streaming/web radio. Per stazioni FM con requisiti di timing molto stretti (±10ms), si dovrebbe valutare un backend audio nativo.

---

*Documento generato il 2026-04-06 — basato su analisi completa del codice sorgente v0.13.2.*
