# Runtime Radio Live Machine Pro (RRLMP)

Professional Broadcast Audio Architecture built with Electron, React, and TypeScript.

## Architecture

- **Main Process**: Electron (Window Management, Native Bridge)
- **Renderer Process**: React + Vite + TailwindCSS
- **Audio Engine**: Pure Web Audio API Singleton
- **State Management**: Zustand

## Structure

```bash
src/
├── main/                 # Electron Main Process
├── renderer/             # React Frontend
│   ├── src/
│   │   ├── engine/       # Audio Core
│   │   ├── store/        # Data Stores
│   │   └── components/   # UI Library
```

## Getting Started

1. `npm install`
2. `npm run dev` (Starts Vite)
3. In a separate terminal (optional if not using concurrent): `npx electron .` or setup a dev runner.
   *Currently configured for standard build:*
   `npm run build` -> Compiles Main & Renderer -> Builds App

## Documentation

Per una guida completa allo sviluppo e all'uso di RRLMP, consulta il nostro **[Centro Documentazione (docs/INDEX.md)](./docs/INDEX.md)**.

### Risorse Rapide

- **[Architettura e Linee Guida](./docs/ARCHITECTURE.md)**: Dettagli tecnici sul motore audio "Main-Side-Heavy".
- **[Roadmap](./docs/ROADMAP.md)**: Stato di avanzamento e criticità.
- **[Changelog](./docs/changelogs/current/)**: Ultime modifiche e hotfix.
- **[Manuale Utente](./manuale-utente/it/)**: Manualistica specifica per la regia.

## License

ISC
