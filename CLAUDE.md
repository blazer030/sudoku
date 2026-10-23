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

Vue 3 + TypeScript Sudoku game following **Domain-Driven Design (DDD)** with ports and adapters:

- **`src/domain/`** — Pure business logic, zero framework dependencies: `board/`, `game/` (the `Sudoku` engine, history, conflicts, hints, replay), `generator/` (puzzles and solution counting), `solver/` (human-style techniques, difficulty rating; shared helpers such as `cellRelations.ts`).
- **`src/application/`** — Ports and app services, one folder each: `game/` (`GameState`, `GameRepository`), `settings/` (`SettingsStorage`), `statistics/`, `puzzleGeneration/` and `puzzleCheck/` (Web Worker services), `analytics/`, `billing/`, `icon/`, `systemBar/`, `appearanceBridge/`, `backButton/`.
- **`src/infrastructure/`** — Adapters for those ports: IndexedDB repositories, and native adapters (Capacitor plugins, Firebase, Play Billing) that each have a no-op web twin; Firebase also serves the production web build. `src/main.ts` picks them by platform.
- **`src/presentation/`** — `pages/` (home, game, game-review, solver-walkthrough, statistics, settings, donate), shared `components/` (one kebab-case folder each), `composables/`, `directives/`, `analytics/` (screen tracking and user-property sync), `i18n/` (messages and label helpers), `theme/` (runtime appearance and launcher icon sync).
- **`src/stores/`** — Pinia stores: game (single source of truth for the active game), statistics, settings, donate.
- **`src/theme/`** — Framework-free look data shared with `scripts/`: `themeIds.ts` (styles, themes, light/dark), `palettes.ts`, `launcherIcon.ts`, `styleIcons.ts` (each style's app icon, also the 外觀 page's card). Relative imports only.
- **`src/style/styles/<id>/`** — One folder per visual style (`minimal`, `tactile`, `paper`, `pixel`): `skin.css` (scoped by `[data-style]`), `palette.ts` (colours; run `npm run generate:theme-css` after editing). A new style registers in `theme/palettes.ts` `STYLES`, `style/index.css`, `theme/styleIcons.ts` (its app icon, also the 外觀 page's card), `STYLE_IDS` / `THEME_IDS_BY_STYLE` / `STYLE_COLOR_MODES` (and `STYLE_MODE_NAMES` when it renames light/dark) in `theme/themeIds.ts`, the `barColors` block in `index.html`, the i18n names (`settings.style.names`, `settings.colorThemes`, `settings.colorMode.styled.<style>.<mode>`) and `REQUIRED_SELECTORS` in `styleCoverage.test.ts`; a style with its own board look also adds a board case to `paletteContrast.test.ts` (like `PIXEL_BOARD_CASES`, each `exceptIn` skip named). Then run `npm run generate:theme-css`, `generate:icons`, `generate:launcher-icons` and, for a new typeface, `generate:fonts`. Skin hooks on cells: `.value-leave`, `data-selected`, `data-hint-mode`, `data-skin` (`badge`/`card`/`pill`).
- **`src/utils/featureToggle.ts`** — Ships half-built features switched off (`VITE_APP_ENV`); keep it even when nothing uses it.

Folders are camelCase in the TypeScript layers and kebab-case under `presentation/`.

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
- **Fixtures**: Known puzzle data in `src/__tests__/fixtures/knownPuzzle.ts` — use `spyGeneratePuzzle()` to mock puzzle generation for deterministic tests, and `fillAllButLastKnownCell()` when a test only needs to finish a game

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
- **`Sudoku`**: Main game engine — `generate()`, `fill()`, `erase()`, `toggleNote()`, `undo()`, `isCompleted()`, `planRevealHint()` / `applyRevealHint()`.
- **`HintTracker`**: Max 4 hints per game, 1st hint is free. Tracked in game state and statistics.
- **`BoardHistory`**: Stores snapshots for undo. Records state before each `fill`/`erase`/`toggleNote`.
- **Difficulty levels**: `easy`, `medium`, `hard` — controls number of clues removed during generation.

## Environment

- `.env` — `VITE_BASE_URL=/` (dev)
- `.env.production` — `VITE_BASE_URL=/sudoku/` (deployed to subdirectory); also holds the `VITE_FIREBASE_*` web config (public identifiers)
