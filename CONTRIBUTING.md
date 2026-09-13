# Contributing

Guidelines for working on **Runtime Live Machine Pro** (Electron + React + TypeScript + Vite).
For how the system is put together, read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first, and
[`docs/regole-colonne/`](docs/regole-colonne/README.md) for the audio behaviour of each column —
that folder is the source of truth for the mixing engine.

Project documentation is mostly written in Italian. Issues and pull requests are welcome in Italian
or English.

## Prerequisites

* **Node.js 20** (the version used by CI) and npm.
* No native modules to compile: FFmpeg and FFprobe come as static binaries from `ffmpeg-static` and
  `ffprobe-static`. After `npm install`, `scripts/prune-native-binaries.js` removes the binaries for
  other platforms to keep the package small.
* No global tooling is required — everything runs through `npx` / npm scripts.

## Setup

```bash
npm ci
```

## Dev workflow

**Windows**

```bash
npm run dev
```

The `dev` script builds the main and preload processes, starts the Vite dev server and launches
Electron with `NODE_ENV=development` (it uses `cmd` syntax, so it only works on Windows).

**Linux and macOS** — the same steps, in two terminals:

```bash
npm run build:main && npm run build:preload
npm run dev:renderer                      # terminal 1: Vite dev server
NODE_ENV=development npx electron .       # terminal 2: Electron
```

In development the CSP also allows `unsafe-eval` for Vite's fast refresh; production builds don't.

## Project dev rules

These conventions are already in force in this repository. Follow them.

* **One fix or feature per patch version.** Each change ships as its own `X.Y.Z`; the changelog
  history shows a long run of small, single-purpose versions. MINOR is reserved for a feature
  declared stable, MAJOR for the planned 2.0.
* **Every version needs a changelog, in two languages.** `docs/changelogs/current/X.Y.Z.md`
  (Italian) and `docs/changelogs/current/X.Y.Z.en.md` (English), written **for the end user**: the
  release workflow concatenates them into the body of the GitHub release, which is exactly what the
  in-app update window shows. The auto-updater shows only the latest release, so notes must be
  **cumulative** from the last version users may have installed. Add the matching row to
  [`relazione.md`](relazione.md) and bump `version` in `package.json` **before** building.
* **Two languages, always both.** Interface strings live in `src/renderer/src/locales/it.json` and
  `en.json`; the main process has its own small dictionary in `src/main/i18nMain.ts`; the in-app
  quick guide is in `src/renderer/src/assets/quick-guide/`. A key added to one file must be added to
  the other.
* **TypeScript strict.** Four projects must type-check with zero errors (see *Testing*).
* **Respect the process boundary.** The renderer reaches disk, network and OS only through the
  preload bridge (`src/preload/index.ts` → `window.electron`). New capabilities mean a new IPC
  handler in the main process and a typed wrapper in the preload — never `nodeIntegration`.
* **Main-Side-Heavy audio.** The renderer never loads audio files into memory: files are streamed
  through the `media://` protocol, and heavy analysis (waveform, silence, loudness, BPM) runs with
  FFmpeg in the main process.
* **Project files stay compatible.** Opening an old `.lmp` must keep working: don't remove fields
  from the data model (see how `behavior` and `duckingRole` are kept for compatibility), migrate
  instead.
* **Exported projects must be portable** across computers and operating systems, Linux included.
  Path handling is covered by `pathUtils`, `pathPortability` and `mediaPath` tests — extend them when
  you touch paths.
* **External links** opened on request of the renderer must go through the closed host list in
  `src/main/externalLinks.ts`.
* **Line endings.** Source files use CRLF; scripted mass edits must preserve them.

## Testing

Tests use **Vitest** (`vitest.config.ts`: `jsdom` environment, setup in `test/setup.ts`, specs in
`src/**/*.test.ts`, usually under a `__tests__` folder next to the code).

```bash
npm test          # vitest run
npm run test:watch
```

Type-check all four projects:

```bash
npx tsc --noEmit -p tsconfig.json
npx tsc --noEmit -p tsconfig.main.json
npx tsc --noEmit -p tsconfig.node.json
npx tsc --noEmit -p tsconfig.preload.json
```

Note: `tsconfig.main.json` has `rootDir: src/main`, so a test under `src/main/__tests__` can't import
from the renderer; cross-process tests belong under the renderer.

The suite is a **blocking quality gate**: the CI `verify` job (`.github/workflows/build.yml`) runs the
four type-checks and the tests on every pull request to `master` and before every build. A red test
blocks the release.

## Build

```bash
npm run build     # main + preload + vite build + electron-builder --publish never
```

Installers land in `builds/v${version}/`: NSIS `.exe` on Windows, `AppImage` and `.deb` on Linux.
Official releases are produced only by the manual `workflow_dispatch` GitHub Action, never from a
local machine.

### macOS

There is no official macOS installer. You can build one yourself on a Mac:

```bash
npm ci
npm run build:main && npm run build:preload
npx vite build
npx electron-builder --mac --publish never
```

The resulting `.dmg` is **not signed**: on first launch, right-click the app and choose *Open* to get
past Gatekeeper. The app asks for microphone access only if you use Smart Mic.

## User manual

The manual (Italian and English) is written in Markdown under `manuale-utente/it` and
`manuale-utente/en` and typeset with **Typst**: `pwsh manuale-utente/typst/build.ps1 -All` regenerates
the chapters and compiles both PDFs. Screenshots are captured from the real renderer with
`manuale-utente/capture-app.js` and `capture-extra.js`.

## Commit conventions

Conventional-commit style, with the target version in the scope. Commit messages are written in
Italian:

```
fix(v1.15.31): board ferma -- hero e clip non scattano piu durante la messa in onda
feat(v1.15.30): torna Smart Mic -- il microfono abbassa la musica da solo
docs: roadmap e indici allineati alla 1.15.32 rilasciata
ci: note di rilascio bilingui italiano + inglese
```

* `feat(vX.Y.Z): …` for a new feature version, `fix(vX.Y.Z): …` for fixes.
* `docs`, `ci`, `chore`, `refactor` for their respective areas.

## Code layout

```
src/
  main/                  Electron main process: IPC, FFmpeg, media:// protocol, file I/O,
                         auto-updater, remote control server, recording
  preload/               contextBridge — the only door between renderer and main
  renderer/src/
    engine/              StreamPlayer, AudioContextManager, MicManager, automix engine
    store/               Zustand stores (audio, project, settings, …)
    components/          layout (grid, cards), modals, ui
    locales/             it.json, en.json
    assets/quick-guide/  in-app quick guide (it, en)
docs/                    architecture, roadmap, column rules, changelogs
manuale-utente/          user manual sources (Markdown) and Typst build
.github/workflows/       build.yml — verify on PR, build and release on manual dispatch
```
