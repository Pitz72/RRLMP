# Integrazione Interfaccia — Analisi Prototipo Stitch → RRLMP

**Data analisi:** 2026-04-11  
**Sorgente:** `IMPORT/code.html` + `IMPORT/DESIGN.md` + `IMPORT/screen.png`  
**Filosofia Stitch:** "The Precision Cockpit" — strumento mission-critical, non web app

---

## 1. SINTESI ESECUTIVA

Il prototipo Stitch è tecnicamente e esteticamente compatibile con la nostra architettura React/Tailwind. **Non si tratta di riscrivere l'app, ma di sostituire la skin**: colori, font, spaziatura, regole di bordo. Il design system Stitch è costruito interamente su Tailwind CSS con una custom theme — esattamente come il nostro stack.

**Stima realistica del lavoro di integrazione:** 15–25h di frontend puro, nessuna modifica al motore audio o agli store Zustand.

---

## 2. COSA PORTA STITCH CHE NOI NON ABBIAMO

### 2.1 Sistema di colori "Obsidian Dark"

Il nostro sistema attuale usa la palette Tailwind `zinc` generica. Stitch ha una palette **custom** progettata specificamente per ambienti broadcast in studi scuri:

| Ruolo | Attuale (zinc) | Stitch target |
|-------|---------------|---------------|
| Background base | `zinc-950` (#09090b) | `#0e0e10` |
| Moduli primari | `zinc-900` (#18181b) | `#131315` |
| Elementi attivi | `zinc-800` (#27272a) | `#262528` |
| Accento live/attivo | `emerald-400` (#34d399) | `#69f6b8` (più brillante) |
| Accento info/utility | `cyan-500` (#06b6d4) | `#3adffa` (più saturo) |
| Accento on-air/alert | `red-500` (#ef4444) | `#ff716a` (più caldo) |
| Testo principale | `white` (#ffffff) | `#f9f5f8` (anti eye-strain) |
| Testo secondario | `zinc-400` (#a1a1aa) | `#adaaad` |
| Bordi | `zinc-700/800` | NO bordi (vedi §2.3) |

### 2.2 Tipografia duale Inter + JetBrains Mono

Noi usiamo system font generico. Stitch separa rigidamente:
- **Inter** (400/600/700/900) → label UI, titoli, navigation
- **JetBrains Mono** (400/700) → **tutto ciò che "scorre"**: timer ON AIR, orologio, durate clip, valori MIDI, dBFS, BPM

Questo risolve il problema del "layout jump" quando i numeri cambiano rapidamente — JetBrains Mono è monospace, ogni cifra occupa lo stesso spazio.

### 2.3 "No-Line Rule" — nessun bordo 1px tra colonne

**La differenza visiva più impattante.** Stitch proibisce i bordi lineari tra colonne. Li sostituisce con:
- **Tonal shifts**: la colonna ha `surface-container-low`, il gap tra colonne è `surface` (base più scura)
- **16px gap** tra le 5 colonne (whitespace come separatore)
- **Ghost Border** (opacity 20%) solo per input e elementi che richiedono accessibilità

Questo crea l'effetto "slab monolitico scavato" invece del grid con gabbia.

### 2.4 Semantica degli stati clip più ricca

Il prototipo distingue visivamente più stati rispetto alla nostra implementazione attuale:

| Stato | Stitch | RRLMP attuale |
|-------|--------|---------------|
| In play (LIVE) | `border-l-4 border-primary` + progress bar bottom 1px | `border border-{color}` + progress bg overlay |
| Prossima (CUED/NEXT) | `border-l-2 border-secondary` (cyan) | badge "UP NEXT" viola |
| Fade out | Badge "Fade" cyan | Badge "FADE OUT" viola |
| Done/Played | `opacity-30 grayscale` | `opacity-50` |
| Ready (SFX) | Card 80px, play icon hover | Card normale |

Il **2px vertical strip sul lato sinistro** del Stitch è più elegante e leggibile del nostro border completo della card.

### 2.5 Status Bar footer (assente in RRLMP)

Stitch ha una barra di stato 24px in fondo con:
- `ENGINE: STABLE ●` — stato motore audio
- `MIDI: CONNECTED ●` — stato controller MIDI  
- `CPU: 12%` `MEM: 1.4GB / 32GB`
- `SYNC: OK` (verde)

Sarebbe un'aggiunta di valore reale: attualmente questi dati non sono esposti nell'UI (solo nel Debug Overlay nascosto).

### 2.6 Icone Material Symbols

Stitch usa Google Material Symbols Outlined invece di Lucide. **Non è necessario cambiare**: Lucide è più leggero, le icone sono equivalenti, e lo stile "glyph 14-18px" è raggiungibile con Lucide al stesso modo.

---

## 3. ANALISI COMPLETA: STITCH VS RRLMP — COPERTURA ELEMENTI

### ✅ Elementi presenti in entrambi (copertura completa)

| Elemento | Stitch | RRLMP |
|----------|--------|-------|
| 5 colonne (Assets/Music/Voice/SFX/PRE-SHOW) | ✅ | ✅ |
| Card in play con progress bar | ✅ (1px bottom) | ✅ (bg overlay) |
| Card idle hover state | ✅ | ✅ |
| Card placeholder "drop here" | ✅ (dashed border) | ✅ |
| Badge LOOP su clip Music | ✅ | ✅ |
| Badge STACCO su clip Voice | ✅ | ✅ |
| Badge NEXT su clip | ✅ | ✅ |
| Badge "Done/Played" su PRE-SHOW | ✅ (grayscale) | ✅ (opacity-50) |
| NoteBoard note regia | ✅ (con timestamp) | ✅ |
| ON AIR timer | ✅ | ✅ |
| Orologio digitale | ✅ | ✅ |
| STOP ALL button | ✅ | ✅ |
| Column header con nome | ✅ | ✅ |
| VU Meter master | ✅ (in header) | ✅ |
| Timer rimanente per clip | ✅ | ✅ |
| Font monospace per valori | ✅ (JetBrains Mono) | ✅ (font-mono Tailwind) |

### ⚠️ Elementi in RRLMP assenti o parziali in Stitch

| Elemento RRLMP | Status Stitch | Note |
|---------------|---------------|------|
| ARM Mic button + mini VU 8 barre | ⚠️ Abbozzato in header | Il prototipo mostra il concetto ma senza dettaglio |
| Master Volume slider | ⚠️ Presente ma minimal | Slider semplice senza la nostra logica MIDI |
| Badge FADE OUT pulsante | ❌ Assente | Solo "Fade" statico |
| Badge UP NEXT con pulse | ⚠️ NEXT statico | Manca l'animazione e il colore viola |
| Badge INTRO countdown | ❌ Assente | Non previsto nel prototipo |
| Badge OUTRO countdown + alert | ❌ Assente | Non previsto |
| Badge TRIM… (analisi silenzio) | ❌ Assente | Non previsto |
| Badge MIDI bind su clip | ❌ Assente | Non previsto |
| Badge Keybind (ambra) su clip | ❌ Assente | Non previsto |
| Badge PRIORITY (ducking source) | ❌ Assente | Non previsto |
| Titolo ID3 + Artista su clip Music | ❌ Assente | Solo nome file |
| Drop Indicator linea blu | ❌ Assente | Non previsto |
| Column Color Picker | ❌ Assente | Header con dot fisso |
| Dead Air Warning su ColumnHeader | ❌ Assente | Non previsto |
| Multi-select clip (Ctrl+click) | ❌ Assente | Non implementato nel prototipo |
| MIDI Learn mode (UI globale) | ❌ Assente | Solo concetto nel design |
| Pulsanti file (New/Save/Load/Export) | ❌ Assente | Non nel layout visivo |
| Import M3U button | ❌ Assente | Non previsto |
| Keybinding modal trigger | ❌ Assente | Non previsto |
| Settings modal trigger | ❌ Assente | Non previsto |
| About modal trigger | ❌ Assente | Non previsto |
| Auto-saved badge | ❌ Assente | Non previsto |
| Badge "PRO" nell'header | ❌ Assente | Non nel prototipo |
| Error Boundary fallback UI | ❌ Assente | Non applicabile al design |
| Waveform Editor (modale) | ❌ Assente | Non previsto nel prototipo |

**Conclusione:** Il prototipo copre la struttura di base (scheletro + flusso visivo live) ma **non** il set completo di badge, controlli e interazioni avanzate che RRLMP ha sviluppato. Questi elementi non devono essere rimossi — devono essere re-stilizzati secondo il nuovo design system.

---

## 4. SIDEBAR SINISTRA — RIPROGETTAZIONE CONCETTUALE

### Il problema attuale

Stitch usa una **sidebar sinistra di 64px** con 5 icone per navigare tra le colonne. Nel nostro contesto questo non ha senso: tutte e 5 le colonne sono sempre visibili simultaneamente nella MainGrid. La sidebar di Stitch sarebbe vuota di funzione.

### La soluzione: sidebar come pannello controlli

**Decisione:** STOP ALL e Master Volume rimangono nell'header — sono controlli live da raggiungere in qualsiasi momento durante la trasmissione, anche senza guardare. Tutto il resto (gestione progetto, MIDI, settings, ARM mic) va nella sidebar.

**Rationale:** Esiste una distinzione netta tra controlli *on-air* (reazione istantanea, emergenza, volume) e controlli *pre/post-air* (salvare, caricare, configurare). I primi restano nell'header dove sono già; i secondi si spostano in un pannello dedicato che non richiede velocità di accesso.

#### Header risultante (snellito):

```
┌──────────────────────────────────────────────────────────────────┐
│ [LOGO] Runtime Live Machine PRO │ [ARM+VU] [VUMeter] [VOL ━━━] │ [■ STOP ALL] │ [ON AIR 00:12:45] [14:42:01] │
└──────────────────────────────────────────────────────────────────┘
```

- Rimangono: Logo + titolo, ARM Mic + mini VU, VU Meter master, Volume slider, STOP ALL, ON AIR timer, Orologio
- Si spostano in sidebar: tutto il resto

#### Layout proposto per il pannello sinistro (top → bottom):

```
┌─────────────────────────┐
│  [LOGO]  Runtime        │  ← Logo + nome app (compact)
│          Live Machine   │
│          PRO            │
├─────────────────────────┤  ── GESTIONE PROGETTO ──
│  [+] Nuovo Progetto     │  ← Icona + testo (compatto)
│  [💾] Salva             │  ← (evidenziato se dirty)
│  [↗] Salva Come…        │
│  [📂] Carica            │
│  [♪] Import M3U         │
│  [↓] Esporta            │
├─────────────────────────┤  ── CONTROLLI & CONFIG ──
│  [MIDI] ●2              │  ← Badge controller count
│  [⌘] Keybinds           │
│  [≡] Impostazioni       │
│  [?] Info               │
├─────────────────────────┤
│  ✓ Auto-saved           │  ← Appare 3s (opacity transition)
└─────────────────────────┘
```

#### Vantaggi di questa distribuzione:

1. **Header:** contiene solo ciò che serve in trasmissione — STOP ALL e Volume a portata di mano immediata in emergenza
2. **Sidebar:** raccoglie tutto ciò che si usa *tra i blocchi*, non durante l'azione — nessuna penalità di velocità
3. **Gerarchia operativa rispettata:** live controls → missione critica (header); project controls → operatività normale (sidebar)
4. **Header più leggibile:** meno elementi significa meno scanning visivo sotto pressione
5. **Allineamento con l'estetica Stitch:** il pannello sinistro è un "operations panel" da console broadcast

---

## 5. PIANO DI INTEGRAZIONE — COSA VA MODIFICATO E COME

### Fase 1 — Design Token (2–3h)

Aggiungere al `tailwind.config.js` i custom colors di Stitch:

```js
// tailwind.config.js — estensione colors
colors: {
  'surface': '#0e0e10',
  'surface-low': '#131315',
  'surface-high': '#1f1f22',
  'surface-highest': '#262528',
  'on-surface': '#f9f5f8',
  'on-surface-dim': '#adaaad',
  'primary': '#69f6b8',
  'primary-container': '#06b77f',
  'secondary': '#3adffa',
  'secondary-container': '#006877',
  'tertiary': '#ff716a',
  'outline': '#767577',
  'outline-dim': '#48474a',
}
```

E importare i font in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

### Fase 2 — Layout globale (3–4h)

- `App.tsx`: ridurre header a Logo + Timer/Clock; creare `<ControlPanel>` sidebar sinistra 200px
- `MainGrid.tsx`: sostituire `border-r border-zinc-800` con `gap-4` tra colonne (no borders)
- Rimuovere `border-l border-zinc-800 pl-4 ml-4` dal wrapping di GlobalControls

### Fase 3 — ControlPanel component (4–5h)

Nuovo componente `src/renderer/src/components/ui/ControlPanel.tsx` che contiene la parte di `GlobalControls.tsx` che migra nella sidebar: pulsanti file (New/Save/SaveAs/Load/Export/M3U), MIDI button, Keybinding, Settings, About, Auto-saved badge.

**Rimangono in `GlobalControls.tsx`** (e quindi nell'header): ARM Mic + mini VU, VU Meter master, Master Volume slider, STOP ALL. Questi sono controlli live — non si toccano.

La logica di divisione è: *"se ti serve mentre sei in onda, resta nell'header; se lo usi prima o dopo, va in sidebar."*

### Fase 4 — ClipCard restyling (3–4h)

- Sostituire `border` full-card con `border-l-4` per lo stato in play
- Per CUED/UP NEXT: aggiungere `border-l-2 border-secondary`
- Sostituire progress bar overlay con una linea `h-0.5 absolute bottom-0`
- Applicare `grayscale` alle clip PRE-SHOW già suonate (oltre a opacity-50)
- Font timer su JetBrains Mono
- Colori da zinc → surface palette Stitch

### Fase 5 — ColumnHeader restyling (1–2h)

- Rimuovere `border-b border-zinc-800`
- Sostituire il `backgroundColor: effectiveColor + "20"` con il dot colorato del Stitch
- Applicare `border-b-0` — separazione via tonal shift (header su `surface-highest`, colonna su `surface-low`)

### Fase 6 — Status Bar footer (2–3h)

Nuovo componente `<StatusBar>` — 24px in fondo. Legge:
- `useAudioStore` per stato engine
- `MidiManager` per stato MIDI
- Performance API (o Electron `process.getCPUUsage()`) per CPU/MEM

### Fase 7 — NoteBoard + modali (1–2h)

- NoteBoard: sostituire `border-t` con tonal shift; aggiungere timestamp per ogni nota
- Modali: aggiornare colori di sfondo/bordo alla palette Stitch

---

## 6. COSA NON CAMBIA

- **Tutto il codice TypeScript**: store, engine, IPC, MicManager, StreamPlayer — zero modifiche
- **La struttura a 5 colonne**: stessa logica, stesso drag & drop, stessa ordering
- **Tutti i badge**: vengono mantenuti e re-stilizzati (non eliminati)
- **Tutte le modali**: ClipSettings, GeneralSettings, Waveform Editor — stessa funzione, nuovo skin
- **i18n**: nessun impatto
- **MIDI, keybinding, auto-save**: nessun impatto

---

## 7. RISCHI E NOTE

### ⚠️ Google Fonts in Electron
I font Inter e JetBrains Mono vanno pre-bundlati (non caricati da CDN in produzione) per garantire funzionamento offline. Usare `@fontsource/inter` e `@fontsource/jetbrains-mono` come npm packages.

### ⚠️ Contrasto su schermi non calibrati
La palette Stitch è progettata per studi broadcast con monitor calibrati. Su monitor consumer con gamma alta, i colori potrebbero sembrare eccessivamente brillanti. Da testare.

### ⚠️ Status bar CPU/MEM
Electron può esporre `process.getCPUUsage()` solo dal main process. Richiede un canale IPC aggiuntivo per portare i dati al renderer. Non critico — può essere implementato come feature separata.

### ✅ Tailwind compatibility
Il design system Stitch è nativamente Tailwind. L'integrazione dei token custom è diretta e non rompe nulla di esistente.

---

## 8. RIEPILOGO PRIORITÀ

| Priorità | Fase | Impatto visivo | Effort |
|----------|------|---------------|--------|
| 🔴 Alta | Design Token (colori + font) | Massimo | 2–3h |
| 🔴 Alta | ClipCard restyling | Alto | 3–4h |
| 🔴 Alta | ControlPanel sidebar | Alto | 4–5h |
| 🟡 Media | ColumnHeader + no-borders | Medio-alto | 1–2h |
| 🟡 Media | Layout globale (App.tsx) | Medio | 3–4h |
| 🟢 Bassa | Status Bar footer | Basso | 2–3h |
| 🟢 Bassa | Modali restyling | Basso | 1–2h |

**Totale stimato:** 16–23h di lavoro frontend puro.

---

*Documento generato a partire dall'analisi di `IMPORT/code.html`, `IMPORT/DESIGN.md`, `IMPORT/screen.png` in relazione alla codebase RRLMP v1.0.0.*
