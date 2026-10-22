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
- **`src/style/styles/<id>/`** — One folder per visual style (`minimal`, `tactile`, `paper`): `skin.css` (scoped by `[data-style]`), `palette.ts` (colours; run `npm run generate:theme-css` after editing), `thumbnail.ts` (Settings preview). A new style registers in `theme/palettes.ts` `STYLES`, `style/index.css`, `StyleThumbnail.vue` and `STYLE_IDS` / `THEME_IDS_BY_STYLE` in `theme/themeIds.ts`.

IMPORTANT: Domain layer must never import from `presentation/`, `stores/`, or `application/`. Dependencies flow inward only.

## Specs & Plans

Design specs and implementation plans live under `docs/superpowers/` — never in a root `plan.md`. Delete them once the work is complete; git history keeps them.

## Release

Follow `docs/release.md` (git flow, web + Android). Bump the version only on the release/hotfix branch; `package.json` is the single source and Android derives `versionName` / `versionCode` from it.

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

## Copy (zh-Hant)

The app ships in English and Traditional Chinese (`src/presentation/i18n/messages/`). Chinese copy follows these rules:

- Row is 列 (horizontal), column is 欄 (vertical): 「第 r 列第 c 欄」. Box is 宮: 「第 n 宮」, numbered from the top left.
- A single game is 「遊戲」, never 「對局」 (遊戲回顧, 最近遊戲).
- Dates: 「今天 15:05」「昨天 09:12」「10/21 15:05」 — slash dates, 24-hour clock, no year.
- Fixed terms: Easy/Medium/Hard 簡單／中等／困難 · Auto Notes 自動筆記 · Check Conflicts 檢查衝突 · Reveal Cell 揭示一格 · Walkthrough 解題演示 · Statistics 統計 · Settings 設定 · Changelog 更新日誌 · Donate 贊助 · Game Review 遊戲回顧 · Recent Games 最近遊戲.
- Techniques: Naked Single 唯一候選數 · Hidden Single 隱藏唯一數 · Naked Pair/Triple/Quad 顯性數對／三數組／四數組 · Hidden Pair/Triple/Quad 隱性數對／三數組／四數組 · Pointing 宮區塊摒除 · Claiming 行列區塊摒除 · X-Chain X 鏈 · XY-Chain XY 鏈 · X-Wing, Swordfish, Jellyfish, XY-Wing, W-Wing, XYZ-Wing, WXYZ-Wing stay in English.
- Google Play's localised prices, analytics ids, `data-testid`s, developer messages and the privacy policy are never translated.
- Tests check that switching language switches the screen, not the exact wording of the copy.

## Key Domain Concepts

- **`PuzzleCell`**: Has `clue` (given), `entry` (player input), `notes` (candidates). `isClue` cells cannot be modified.
- **`Sudoku`**: Main game engine — `generate()`, `fill()`, `erase()`, `toggleNote()`, `undo()`, `isCompleted()`, `revealRandomCell()`.
- **`HintTracker`**: Max 4 hints per game, 1st hint is free. Tracked in game state and statistics.
- **`BoardHistory`**: Stores snapshots for undo. Records state before each `fill`/`erase`/`toggleNote`.
- **Difficulty levels**: `easy`, `medium`, `hard` — controls number of clues removed during generation.

## Environment

- `.env` — `VITE_BASE_URL=/` (dev)
- `.env.production` — `VITE_BASE_URL=/sudoku/` (deployed to subdirectory)
