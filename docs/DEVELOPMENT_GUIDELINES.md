# Development Guidelines & Architecture Reference

## 1. Core Architecture

### **Process Model**
- **Main Process (`src/main/`)**: Handles window management and native integrations.
  - **Protocol**: Exposes `media://` protocol (though currently `file:///` is used in renderer for legacy reasons).
  - **Security**: Operates with `webSecurity: false` to allow local file access via `file://`.
- **Renderer Process (`src/renderer/`)**: React application powered by Vite.
- **Bridge (`src/preload/`)**: Uses `contextBridge` to expose a safe API (`window.electron`).
  - **Critical**: `getFilePath(file)` allows retrieving native paths from Drag & Drop.

### **Audio Engine**
- **Singleton**: `AudioContextManager.ts` is the single source of truth for `VideoAudioContext`.
- **Bus Routing**:
  - `Music Bus` (Music, Preshow)
  - `Voice Bus` (Voice tracks)
  - `SFX Bus` (Sound effects)
  - `Assets Bus` (Jingles, Beds)
- **Player**: `StreamPlayer.ts` handles individual file playback.
  - **Protocol**: Uses `toFileUrl()` (`file:///`) for decoding stability.
  - **Features**: Supports Fade In/Out, Trim, and Output Device selection.

## 2. State Management (Zustand)

### **Store Separation**
1.  **`useProjectStore`**:
    - Handles **Persistence** (Save/Load LMP files).
    - Manages **Structure** (Columns, Clips data).
    - Handles **Selection Logic**.
2.  **`useAudioStore`**:
    - Handles **Playback State** (Active Players).
    - Implements **Mixing Logic** (`evaluateMix`: Ducking, Stacco rules).
    - Manages **Sequencing** (`play_next`, `loop`).
3.  **`useDebugStore`**:
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
