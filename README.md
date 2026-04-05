# Runtime Radio Live Machine Pro (RRLMP)

Professional Broadcast Audio Architecture built with Electron, React, and TypeScript.

## Architecture

- **Main Process**: Electron (Window Management, Native Bridge)
- **Renderer Process**: React + Vite + TailwindCSS
- **Audio Engine**: Pure Web Audio API Singleton
- **State Management**: Zustand

## Structure

```
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

## License

ISC

## Documentation

Full documentation, including changelogs and technical reports, can be found in the [docs/](./docs/) directory.
- [Changelogs](./docs/changelogs/)
- [Technical Reports](./docs/technical_reports/)
