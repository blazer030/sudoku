# CLAUDE.md

## Commands

```bash
npm run start          # Dev server (Vite)
npm run build          # Production build (vue-tsc + Vite)
npm run lint           # ESLint (--max-warnings 0, must pass before commit)
npm test               # Run all tests (Vitest, watch mode)
npx vitest run         # Run all tests once (CI mode)
npx vitest run src/__tests__/domain/game/Sudoku.test.ts  # Run single test file
```

## Architecture

Vue 3 + TypeScript Sudoku game following **Domain-Driven Design (DDD)**:

- **`src/domain/`** — Pure business logic, zero framework dependencies. Subdivided into `board/`, `game/`, `generator/`.
- **`src/application/`** — Serialization (`GameState`, `GameStateConverter`), persistence (`GameStorage`), and `Statistics`.
- **`src/presentation/`** — Vue components, pages, and composables. Pages: `home/`, `game/`, `statistics/`.
- **`src/stores/`** — Pinia store (`gameStore.ts`) as single source of truth for active game state.

IMPORTANT: Domain layer must never import from `presentation/`, `stores/`, or `application/`. Dependencies flow inward only.

## Code Style

- **Composition API** with `<script setup>` and arrow functions — no Options API
- **Named exports** only — no default exports
- **Path alias**: `@/` maps to `src/`
- **Vue components**: Single-word names allowed (ESLint `multi-word-component-names` disabled)
- **Indentation**: 4 spaces in Vue templates and TypeScript
- **Strict TypeScript**: `noUnusedLocals`, `noUnusedParameters` enabled

## Testing Conventions

- **Test location**: `src/__tests__/` mirroring `src/` structure (e.g., `src/__tests__/domain/game/Sudoku.test.ts`)
- **Framework**: Vitest with `globals: true` (no need to import `describe`/`it`/`expect`)
- **Component tests**: `@vue/test-utils` `mount()` with `jsdom` environment
- **Mocking**: Use `vi.mocked()` and `vi.restoreAllMocks()` in `afterEach`
- **Test selectors**: Use `[data-testid="..."]` for querying DOM elements
- **Fixtures**: Known puzzle data in `src/__tests__/fixtures/knownPuzzle.ts` — use `spyGeneratePuzzle()` to mock puzzle generation for deterministic tests

## Key Domain Concepts

- **`PuzzleCell`**: Has `clue` (given), `entry` (player input), `notes` (candidates). `isClue` cells cannot be modified.
- **`Sudoku`**: Main game engine — `generate()`, `fill()`, `erase()`, `toggleNote()`, `undo()`, `isCompleted()`, `revealRandomCell()`.
- **`HintTracker`**: Max 4 hints per game, 1st hint is free. Tracked in game state and statistics.
- **`BoardHistory`**: Stores snapshots for undo. Records state before each `fill`/`erase`/`toggleNote`.
- **Difficulty levels**: `easy`, `medium`, `hard` — controls number of clues removed during generation.

## Environment

- `.env` — `VITE_BASE_URL=/` (dev)
- `.env.production` — `VITE_BASE_URL=/sudoku/` (deployed to subdirectory)
