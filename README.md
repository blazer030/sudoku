# Sudoku

A Sudoku game built with Vue 3 and TypeScript, shipped both as an installable
progressive web app (PWA) and as a native Android app via Capacitor.

## Features

- **Three difficulty levels** (Easy, Medium, Hard) with difficulty rated by an
  actual solver, not just clue count
- **Guaranteed unique-solution puzzles**, generated off the main thread in a
  Web Worker
- **Human-style technique solver** — naked/hidden singles & subsets,
  pointing/claiming, fish, wings (XY/XYZ/W/WXYZ), and X-/XY-chains — powering
  both difficulty rating and a step-by-step **Solver Walkthrough** page
- **Notes** (manual and auto-notes), undo, erase, and live conflict highlighting
- **Hints** — up to 4 per game, the first one free
- **Save & restore** with a running timer, persisted to IndexedDB
- **Statistics** (best times, win rate, day streak) plus per-game **Review**
  with move replay
- **Six selectable color themes** (green, blue, purple, orange, pink, teal)
- **Offline support** via service worker (web build)
- **Native Android app** — Firebase analytics, Google Play Billing donations,
  and a dynamic app icon that can match the selected theme (native-only
  features)

## Tech Stack

- **Framework**: Vue 3 + TypeScript (`<script setup>`, Composition API)
- **Build**: Vite + vite-plugin-pwa
- **Routing**: Vue Router
- **State**: Pinia
- **Styling**: Tailwind CSS v4
- **Persistence**: localforage (IndexedDB)
- **Native**: Capacitor (Android) — Firebase Analytics, Play Billing
- **Animation / icons**: vue3-lottie, Lucide Vue Next
- **Testing**: Vitest + @vue/test-utils (jsdom)

## Architecture

The codebase follows **Domain-Driven Design** with a **hexagonal (ports &
adapters)** structure. Dependencies flow inward only — the domain layer never
imports from the outer layers.

```
src/
├── domain/          Pure business logic, zero framework dependencies
│   ├── board/         PuzzleCell, SudokuBoard, constants
│   ├── game/          Sudoku engine, history/undo, conflicts, replay, hints
│   ├── generator/     Puzzle generator + backtracking solver
│   └── solver/        Technique solver, difficulty rater, techniques, chains
├── application/     Ports (interfaces) + app services
│   ├── game/          GameRepository port
│   ├── statistics/    StatisticsRepository port
│   ├── analytics/     AnalyticsService port
│   ├── billing/       BillingService port
│   └── icon/          IconService port
├── infrastructure/  Adapters implementing the ports
│   ├── game/          IndexedDB / LocalStorage game repositories
│   ├── statistics/    IndexedDB / LocalStorage statistics repositories
│   ├── analytics/     Firebase / Noop adapters
│   ├── billing/       Play Billing / Noop adapters
│   └── icon/          Dynamic icon / Noop adapters
├── presentation/    Vue components, pages, composables
├── stores/          Pinia stores (game, statistics, settings, donate)
├── workers/         Puzzle generation Web Worker
└── router.ts        Routes (donate is native-only, guarded)
```

`src/main.ts` is the **composition root**: it selects adapters by platform
(native gets Firebase / Play Billing / dynamic-icon, web gets no-op adapters),
provides them via Vue's `provide/inject`, wires repositories into the stores,
and hydrates state from IndexedDB before mounting.

## Development

```bash
npm install
npm run start     # Dev server (Vite)
npm test          # Run tests (watch mode)
npx vitest run    # Run tests once (CI mode)
npm run lint      # ESLint (--max-warnings 0, must pass before commit)
npm run build     # Type-check (vue-tsc) + production build
npm run preview   # Preview the production build
```

`@/` is a path alias for `src/`.

### Android

```bash
npm run android:sync          # Build (Capacitor mode) + cap sync
npm run android:open          # Open the Android project in Android Studio
npm run android:run           # Build + run on a connected device/emulator
npm run android:build:release # Production release build + sync
```

## Testing

- Tests live in `src/__tests__/`, mirroring the `src/` structure.
- Vitest runs with `globals: true` — no need to import `describe`/`it`/`expect`.
- Component tests use `@vue/test-utils` `mount()` in a `jsdom` environment.
- Use `[data-testid="..."]` selectors and the fixtures in
  `src/__tests__/fixtures/` for deterministic puzzle data.

## Environment

- `.env` — `VITE_BASE_URL=/` (dev)
- `.env.production` — `VITE_BASE_URL=/sudoku/` (deployed to a subdirectory)
- `VITE_CAPACITOR=1` switches the build to native (Capacitor) mode and skips
  the PWA service worker.