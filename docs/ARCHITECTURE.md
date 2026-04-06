# Architecture & Development Reference (v0.10.4)

## 1. Core Architecture

### **Process Model**

- **Main Process (`src/main/`)**: Gestisce il ciclo di vita dell'app, il window management e le integrazioni native pesanti.
  - **Protocollo `media://`**: Espone un custom protocol che supporta lo streaming a blocchi (HighWaterMark: 128KB) per una riproduzione fluida senza saturare la memoria.
  - **Sicurezza (CSP)**: Configurazione granulare per supportare file locali, WebSockets (dev) e bloccare l'esecuzione di script non autorizzati.
- **Renderer Process (`src/renderer/`)**: Applicazione React (Vite) che funge esclusivamente da **Interfaccia Grafica (Skin)**.
- **Bridge (`src/preload/`)**: `contextBridge` sicuro che espone `window.electron` per l'accesso ai file e ai metadati audio.

### **Audio Engine: Strategia "Main-Side-Heavy" (Pro-Desktop)**

Per risolvere definitivamente i crash `0xC0000005` (Access Violation), l'architettura segue una rigida separazione dei compiti:

- **Renderer (Frontend)**:
  - **VIETATO**: Caricamento o decodifica di buffer audio grezzi (WAV pesanti) direttamente nel processo Chromium.
  - **Task**: Gestione dello stato di riproduzione, visualizzazione marker e trigger dei comandi.
- **Main Process (Node.js)**:
  - **Task I/O**: Unico responsabile per la lettura dei file, il calcolo della Waveform (Peak data) e l'estrazione dei metadati.
  - **Waveform Proxy**: I dati dell'onda sonora vengono generati nel Main e inviati al Renderer in formato JSON compresso o metadata leggero per il rendering tramite `canvas`.
- **AudioContext**: Utilizzato nel Renderer solo per il routing finale verso le uscite di sistema, minimizzando il buffer in-memory per il processing.

## 2. State Management (Zustand)

### **Store Separation**

1. **`useProjectStore`**:
   - Handles **Persistence** (Save/Load LMP files).
   - Manages **Structure** (Columns, Clips data).
   - Handles **Selection Logic**.
2. **`useAudioStore`**:
   - Handles **Playback State** (Active Players).
   - Implements **Mixing Logic** (`evaluateMix`: Ducking, Stacco rules).
   - Manages **Sequencing** (`play_next`, `loop`).
3. **`useDebugStore`**:
   - Transient logs for the in-app overlay.

### **Pattern**

- Logic is kept *inside* the stores (Action-based).
- Components trigger actions (`playClip`, `stopAll`) rather than managing logic.

## 3. UI & Styling

### **Technology**

- **Tailwind CSS**: Used extensively for all styling.
- **Icons**: `lucide-react`.

### **Design System**

- **Colors**:
  - Background: `zinc-950` / `zinc-900`.
  - Accents: `emerald-500` (Play), `red-500` (Music), `blue-500` (Loop).
- **Typography**: Inter / System UI.
- **Components**:
  - **Modal**: `fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`.
  - **Buttons**: Reusable `Button.tsx` or ad-hoc Tailwind classes.

## 4. Coding Standards

### **TypeScript**

- **Strict Parsing**: Yes.
- **Interfaces**: Defined in `src/renderer/src/types/index.ts`.
- **No `any`**: Avoid `any` except for unavoidable legacy Electron/Window expansions.

### **File Structure**

- Components should be functional and hook-based.
- One component per file generally.
- Business logic should reside in Stores or Utility/Helper functions, not UI components.

## 5. Terminology

- **Clip**: The fundamental audio unit.
- **Column**: Vertical container of clips (Playlist logic).
- **Stacco**: A high-priority jingle that ducks other content.
- **Ducking**: Automatic volume reduction (Sidechain-like effect).
