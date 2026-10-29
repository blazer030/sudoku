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
- **`src/presentation/`** — `pages/` (home, game, game-review, solver-walkthrough, statistics, settings, donate), shared `components/` (one kebab-case folder each; `board-frame/` holds `STYLE_BOARD_FRAMES`, the per-style frame that `BoardFrame.vue` wraps round the game, Game Review and Walkthrough boards alike), `composables/`, `directives/`, `analytics/` (screen tracking and user-property sync), `i18n/` (messages and label helpers), `theme/` (runtime appearance and launcher icon sync).
- **`src/stores/`** — Pinia stores: game (single source of truth for the active game), statistics, settings, donate.
- **`src/theme/`** — Framework-free look data shared with `scripts/`: `themeIds.ts` (styles, themes, light/dark), `palettes.ts`, `launcherIcon.ts`, `styleIcons.ts` (each style's app icon, also the 外觀 page's card), `brandIcon.ts` (the app's own icon, shown while the icon does not follow the style). Relative imports only.
- **`src/style/styles/<id>/`** — One folder per visual style (`minimal`, `tactile`, `paper`, `pixel`, `cyber`, `ink`, `chalkboard`): `skin.css` (scoped by `[data-style]`), `palette.ts` (colours; run `npm run generate:theme-css` after editing).
  - **Registering a style:** `theme/palettes.ts` `STYLES`, `style/index.css`, `theme/styleIcons.ts` (its app icon, also the 外觀 page's card), `STYLE_IDS` / `THEME_IDS_BY_STYLE` / `STYLE_COLOR_MODES` (and `STYLE_MODE_NAMES` when it renames light/dark) in `theme/themeIds.ts` (`STYLE_COLOR_MODES` may list a single mode, light or dark: the palette then uses `lightOnlyThemeBuilder` / `darkOnlyThemeBuilder` from `theme/paletteBuilder.ts`, instead of `themeBuilder`, and carries a palette only for that mode; `StyleExtras` can set board tints and the alias tokens `primary-ink` / `signal` / `signal-surface` directly; `STYLE_OWN_TOKENS` in the same file adds optional per-style colour tokens emitted only in that style's generated blocks: chalkboard's `tray`, `tray-shade`, `tray-edge`, `duster`, `duster-felt`, `smudge`, `smear`, `icon-frame`, `doodle`, of which `smudge` / `smear` are source colours applied through `color-mix`; chalkboard is `chalkboard` with one fixed theme `classic`, and `STYLE_MODE_NAMES` renames its modes 黑板 / 白板), the `barColors` block in `index.html` (per-theme `light?` / `dark?` maps, only for the modes the style has; `pwaIconKey` in `theme/launcherIcon.ts` picks the light icon, or the only one, for installed web apps), the i18n names (`settings.style.names`, `settings.colorThemes`, `settings.colorMode.styled.<style>.<mode>`) and `REQUIRED_SELECTORS` in `styleCoverage.test.ts`. Then run `npm run generate:theme-css`, `generate:icons` and `generate:launcher-icons`.
  - **A new typeface:** add it to `scripts/generate-fonts.ts` and run `generate:fonts`, then gate it in `styles/<id>/fonts.ts` (mark `<html>` once the faces load, like `syncPixelFonts`, built on `markFontsReady` in `style/fontGate.ts`) wired in `presentation/theme/appearanceSync.ts`, so the skin switches faces only when they are ready. Chalkboard's digits are "Chalk Digits" (Caveat Brush; stack `--font-chalkboard-digits`), gated by `syncChalkboardFonts` / `data-chalkboard-fonts`. Ink's bundled families are "Ink Brush", "Ink Serif TC" and "Ink Garamond" (named so they never shadow system faces; stacks `--font-ink-brush` / `--font-ink-serif` / `--font-ink-digits`); Yuji Boku is cut to the glyphs of `INK_BRUSH_MESSAGE_KEYS` in `style/styles/ink/brushTitles.ts` (not under `scripts/`, which a test in `src` can't import; the generator imports it), so a new brushed title adds its key there.
  - **Board contrast:** a style with its own board look adds a board case to `paletteContrast.test.ts` (like `PIXEL_BOARD_CASES` / `CYBER_BOARD_CASES`, each `exceptIn` skip named).
  - **Skin hooks:** cells carry `.value-leave` and `data-selected`, the board `data-hint-mode` and `data-selected-cell`; `data-skin` tokens include `badge` (keypad badge), `card` (cards, dialogs, popovers), `pill` (header pills) `chip` (continue-card chips, each captioned by its `data-caption`; the card carries `data-layout`, `chips` or `title-block`, from `CONTINUE_LAYOUTS` in `presentation/components/continue-button/continueLayouts.ts`, a `Record<StyleId, …>`; `title-block` is the component's own equal, ruled columns), `celebration` (the completion card, with `data-still` when motion is not allowed), `trophy` (its trophy), `complete-title` (its title), `tag` (`tag new-record`, `tag step`, `tag step strong`), `logo`, `group-heading`, `pill hint`, `board-grid` (each board's inner grid), `dialog-title` (titles of the new-game, leave, clear-records and walkthrough dialogs), `loader-scrim` (PuzzleLoader's layer), `dialog-scrim` (the layer behind each dialog, the completion card and the hint menu), `recent-row` (Statistics' recent-game rows), `icon-tile` (dialog, hint-panel and walkthrough icon tiles and recent-game chips in Statistics and Game Review; `icon-tile danger` on danger ones, `icon-tile gave-up` on a given-up game's chip), `home-tile` (beside `tile` on Home's three entry tiles only, not the option and toggle tiles), `new-game-card` (beside `card` on Home's new game card only), `settings-card` (beside `card` on the Settings groups' cards and the 外觀 page's two cards), `stat-card` (beside `card` on Statistics' three overview cards and its By Difficulty card), `stat-heading` (Statistics' section headings), `stat-value` (Statistics' overview numbers and each difficulty's best, average and completed), `game-result` (a recent game's time or its "Gave up" text, in Statistics' rows and Game Review's card; `game-result gave-up` on a given-up game's), `app-tag` (the changelog's App tag), `progress-track` / `progress-fill` (the playback progress bar), `button play` (the playback panel's play button), `menu-divider` (the hint menu's divider), `menu-option` (the hint menu's options), `text-button` (a button that is only its words, not `button`: the dialogs' cancel and second actions, the completion card's Back to Home, Settings' Clear Records), `step-dot` (a step navigator's dots; `step-dot step-dot-current` on this step's, `step-dot step-dot-past` on the ones passed), `step-arrow` (a step navigator's previous and next arrows), `swatch` (the 外觀 page's colour-theme swatches) and `toast` (the game's toast). A style can frame the boards through `STYLE_BOARD_FRAMES` (`presentation/components/board-frame/boardFrames.ts`, a `Record<StyleId, Component | null>`; `null` renders the board alone, with no element round it): the frame wraps the `board` element in its default slot and is given `BoardFrameProps` `{ target, effect, celebration }`: `target` is the cell the board points at (the game's selected cell, the hint's answer cell in hint mode, none while the solved board celebrates; the cell a Game Review step changed; the Walkthrough's selected cell while entering, a playing step's first assigned cell, none on an elimination-only step or the solved board), `effect` the game's `GroupEffect` and `celebration` its phase (both `null` on the other two boards). A frame sets `--board-frame-block` on its own element to the height it adds, which `max-w-board-fit` takes off the board so the digit keys stay on a short screen; a frame that takes over the board's place and width in the page (the board then fills it) carries `max-w-board-fit` itself and sets `--board-frame-inline` to the width it adds. Home's title follows `STYLE_HOME_HEROES` (`presentation/pages/home/homeHeroes.ts`, a `Record<StyleId, "stacked" | "vertical" | "headline" | "spaced">`, laid out in `HomeHero.vue`): `stacked` carries `logo`, `title` and `title-glyph`; `spaced` (blueprint) carries the same `logo`, `title` and `title-glyph`, with the title set light at 44px and spaced 0.5em and the subtitle spaced 0.2em; `headline` (chalkboard) has no logo, the title set large, and carries `hero-headline`, `title` and `title-glyph`; `vertical` (ink) carries `hero-vertical`, `hero-title`, `hero-subtitle` and `hero-seal`, Chinese in both languages and `aria-hidden` beside a visually hidden heading in the player's language. A cell while `leaving` carries `data-leaving-value` (the digit that left) so a skin can draw it as a ghost, and a cell whose digit arrives carries `data-arriving` (while its digit has `.value-arrive`), so a skin can draw on the cell's pseudo-elements without `:has()`. A skin may mask the board by a static SVG image (no live filters), referenced as `url("@/style/styles/<id>/<file>.svg")` since a `./` URL breaks in the production build. A style that animates a cell's `::before`/`::after` settles `arriving`/`leaving` when that animation ends (`BoardCell` takes a cell's own `animationend` only from its pseudo-elements, so the cell's colour animations never settle it; a digit's group animation must therefore be named `<style>-group-…`, as `BoardCell` ignores `*-group-*` names, or its `animationend` settles the arrival); a style's `digitWriter` emitting `written` is the second settle path.
  - **Moments (loading, group completion, celebration):** an entry in `STYLE_MOMENTS` (`presentation/components/style-moments/styleMoments.ts`, a `Record<StyleId, StyleMoments>`, so a style without one is a type error) with `loader`, `celebration` (a component, or `null` for no decoration), `cardDecoration`, `groupOverlay` (optional), `digitWriter` (optional; props `{ digit, maskId }`, emits `written`; while arriving the digit carries `--digit-writer-mask: url(#maskId)` for the skin's `mask-image`. `BoardCell` mounts it only where `canMaskByReference()` (`style-moments/maskReferenceSupport.ts`, by engine: Chromium 120+, Gecko) holds; elsewhere (WebKit: Safari, every iOS browser) the digit appears plainly. paper and chalkboard share `StrokeDigitWriter` (`style-moments/StrokeDigitWriter.vue`) and `StrokeFace` (`style-moments/digitStrokes.ts`), each passing its own strokes and glyph metrics (optional `boxPaddingEm`); paper's stroke constants in `paperDigitStrokes.ts` are measured from the bundled Caveat and chalkboard's in `chalkboardDigitStrokes.ts` from Caveat Brush; re-measure them if the font changes. blueprint has no `digitWriter`: its arrival is CSS only, so every engine shows it alike: crosshairs on the cell's `::before` (`[data-variant]:has(> .value-arrive)::before`, run on unseen to the ink's end, since a cell pseudo-element's `animationend` settles the arrival) and the digit's own ink on `> .value-arrive`), `groupEffectMs` (one cell's effect length; each cell's delay plus duration must fit it) and `celebrationBoardMs` (the board phase before the dialog opens), components in `style-moments/<id>/`. The skin styles the board through `data-celebration` (`playing` / `done` / `still`), and a group effect through cells' `data-group` (their kinds) with `--cell-row` / `--cell-column` / `--cell-box`, and the board's `data-group-effect`, `--origin-row` / `--origin-column` and `--group-ripple-step` (60ms) (cells derive their `--group-delay` from these in `index.css`; a style may shorten the step on cells, never raise it above 60ms, which the JS timer assumes); the dialog card carries `data-still`, plus the `complete-title` and `trophy` hooks. Add `<id>Moments.test.ts` under `__tests__/style/styles/<id>/` and the moments selectors to `REQUIRED_SELECTORS`. Trap: the entered digit sits in its own completed group, so a group rule's `animation` on `[data-group] > div` replaces its `.value-arrive`; list both in a combined `> div.value-arrive` rule (reduced-motion block too).
- **`src/utils/featureToggle.ts`** — Ships half-built features switched off (`VITE_APP_ENV`); keep it even when nothing uses it.

Folders are camelCase in the TypeScript layers and kebab-case under `presentation/`.

IMPORTANT: Domain layer must never import from `presentation/`, `stores/`, or `application/`. Dependencies flow inward only.

## Specs & Plans

Design specs and implementation plans live under `docs/superpowers/` — never in a root `plan.md`. Delete them once the work is complete; git history keeps them.

## Release

Follow `docs/release.md` (git flow, web + Android). Bump the version only on the release/hotfix branch; `package.json` is the single source and Android derives `versionName` / `versionCode` from it.

A player-facing change merged into `develop` also adds a line to `UNRELEASED_CHANGES` in `src/presentation/pages/settings/changelogData.ts` (both languages, same copy rules as the changelog), or fits under a line already there. Keep lines broad, like 「全新風格」「介面優化」「遊戲進度保存更可靠」, not one per detail. Develop builds show them as 「開發中」 on top of the changelog; the release moves them into its entry.

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
