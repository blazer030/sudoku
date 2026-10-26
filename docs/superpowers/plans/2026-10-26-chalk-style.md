# 黑板粉筆 Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a seventh visual style, `chalk` (「黑板粉筆」 / "Chalkboard"): a 黑板 (dark) and a 白板 (light) mode with one fixed palette each, Caveat Brush digits and WenKai text, a hand-drawn chalk board, stroke-written digits, a smeared erase, its own app icons and its own loading, group and celebration moments.

**Architecture:**
- `chalk` registers like `pixel` (both modes, one fixed theme, renamed modes via `STYLE_MODE_NAMES`): ids, palette, icons, generated assets, a font and a font gate.
- Everything visual is `[data-style="chalk"]` CSS in `src/style/styles/chalk/skin.css` plus static SVG files beside it (chalk grain, hand-drawn grid); the moments are components in `src/presentation/components/style-moments/chalk/`, wired through `STYLE_MOMENTS`.
- Paper's digit writer is first generalised (structural) so chalk passes its own strokes and metrics instead of copying the component.

**Tech Stack:** Vue 3 + TS + Tailwind v4, Vitest, PostCSS sheet tests (`styleSheetRules.ts`), `subset-font`, `tsx` generator scripts, `sharp`, Capacitor Android launcher aliases.

**Spec:** `docs/superpowers/specs/2026-10-26-chalk-style-design.md`.

**Visual reference (read-only, other worktree):** `/Users/ethan/Project/sudoku/.worktrees/style-research/docs/style-research/project/`
- `Chalk.dc.html`: the `.m-dark` / `.m-light` / `.art` blocks and every chalk rule (≈ lines 280–420: `.chalky`, `.chalkgrid`, `.tray`, `.stick`, `.duster`, `.dust`, `.smears`, `.cell.*`, `.key*`, `.btn*`, `smearA/B`, `dustA/B`), the `.chalkgrid` SVG, the `#chalk` filter (the grain to bake into a static texture) and the two app icons. **Ignore `.t1`–`.t3`.**
- `StrokeWriting.dc.html`: the 黑板 and 白板 rows (second and third `<h2>`): Caveat Brush digit stroke paths, pen width 14, dust.
- `GroupChalk.dc.html`: row underline, column line, box ring, dust, the digits' yellow flash.
- `MomentsChalk.dc.html`: the loader (九宮, ring, digits, duster, 4.4s) and the celebration (board ring, 「好棒！」, doodles, card), with their reduced-motion rules.
- `canvas.json`: the designer's notes (quoted in the spec).
- The files are big; grep them and read the chalk sections.

## Global Constraints

- **Work and branch:** branch `feature/style-chalk` in the main checkout `/Users/ethan/Project/sudoku`. Never merge into `develop`; the owner merges after checking.
- **Commits:** English Conventional Commits with an emoji prefix (✨ feat, 🐛 fix, ♻️ refactor, 🧪 test, 📄 docs, 🚧 chore). **No trailers**: no Co-Authored-By, no Claude-Session. Structural (♻️, behaviour unchanged, tests green before and after) and behavioural commits are separate. Commit at every GREEN. Never bare `git stash`.
- **Before each commit** these run clean, with no new warnings: `npx vitest run`, `npm run lint`, `npx vue-tsc --noEmit`.
- **Other styles unchanged:** minimal, tactile, paper, pixel, cyber and ink look and behave as before. After a palette change, `src/style/themes.generated.css` differs from `develop` only by the `chalk` blocks.
- **Exact values:**
  - Style id `chalk`, after `ink`. Names 「黑板粉筆」 / "Chalkboard". Theme id `chalkboard` (「黑板」 / "Chalkboard"; the picker is hidden for a one-theme style).
  - `STYLE_COLOR_MODES.chalk = ["dark", "light"]`; `STYLE_MODE_NAMES.chalk = true`; `settings.colorMode.styled.chalk = { dark: "黑板", light: "白板" }` / `{ dark: "Chalkboard", light: "Whiteboard" }`.
  - Launcher keys `chalkChalkboard` (白板) and `chalkChalkboardDark` (黑板); launcher icons 27 → 29.
  - `barColors.chalk = { dark: { chalkboard: "#2E4B3C" }, light: { chalkboard: "#F5F6F3" } }` (the board backgrounds; adjust only if the system-bar test demands a different role, as pixel does).
- **Palette:**
  - 黑板: background `#2E4B3C`, foreground `#F4F1E8`, secondary `#CFD8CC`, primary (yellow chalk) `#F7C873`, on-primary `#233A2E`, entry (blue chalk, `accent`) `#A6D8F2`, error `#FF9E9E`.
  - 白板: background `#F5F6F3`, foreground `#1F2328`, secondary `#4F5660`, primary (orange marker) `#B04A00`, on-primary `#FFFFFF`, entry (blue marker, `accent`) `#1D5FC2`, error `#C62828`.
  - Card, lines, peer/same washes, smudge and smear from Chalk.dc's `.m-dark` / `.m-light` (`--card`, `--line`, `--line2`, `--peer`, `--same` = primary 14%, `--smudge`, `--smear-c`), mapped to `Neutrals` / `StyleExtras` roles; contrast is settled by `paletteContrast.test.ts`.
- **Type:** digits (clues, entries, keys, timer, notes) Caveat Brush, bundled as family **"Chalk Digits"** (never shadowing a system face), stack `--font-chalk-digits: "Chalk Digits", "LXGW WenKai TC", <sans stack>`; all text `--font-wenkai`. The English 「好棒！」 line ("Well done!") is also written in Chalk Digits, so the subset holds its letters.
- **Skin rules** (`src/__tests__/style/styleSheetRules.ts`): selectors under `[data-style="chalk"]`, keyframes prefixed `chalk-`, no layout properties outside `::before`/`::after`, every animation stopped under `prefers-reduced-motion: reduce`, `--*-scale` within 1–1.5.
- **No raw colours** in `skin.css` or `.vue`/`.ts` under `src/presentation` (`hardcodedColors.test.ts`): tokens, `color-mix()`, `currentColor` in SVG. Mask SVG files under `src/style/styles/chalk/` carry only alpha. The tray's wood/grey gradient becomes palette extras, not raw hex.
- **Performance:** no inline SVG `<filter>` in the DOM at runtime and no `filter` in mask files; chalk grain is a static texture (`chalk-grain.svg`, generated noise baked as paths/dots, or a small PNG if a path texture is too heavy) applied by `mask-image`; `filter: blur()` animates only on the one erased digit (ink's precedent).
- **WebKit:** every `mask-image` also sets `-webkit-mask-image`; masked lines turn the plain borders transparent only inside `@supports ((mask-image: url("")) or (-webkit-mask-image: url("")))`. The digit writer mounts only where `canMaskByReference()` holds.
- **白板 is markers:** in light mode no grain mask, no dust, smooth strokes of even width; every dust rule is scoped to dark (`:not(.dark)` / `.dark` as the codebase's mode selector does).
- **Motion rules (owner):** the 「動態效果」 setting gates fill/erase, group effects, the hint pop and the celebration; loaders and ambient art obey only system reduced motion; group effects have no still cue.
- **Timing:** cell animations end before `ARRIVAL_SETTLE_MS` (1000); a digit is written in 420–560ms. `groupEffectMs` and `celebrationBoardMs` from the boards (each cell's delay + duration fits `groupEffectMs`; the ripple step never above 60ms).
- **Copy:** Chinese copy follows `CLAUDE.md`. Tests check that switching language changes the screen, never exact wording. `UNRELEASED_CHANGES` gets one line 「全新風格「黑板粉筆」」 / "New style: Chalkboard".

## Review Focus

1. **A cold start with chalk saved and the system in light mode.** First paint is 白板 (no `dark` class), bar `#F5F6F3`; in dark mode 黑板. The mode names read 黑板／白板 in the 外觀 page and the Settings summary, never 深色／淺色. *noFlashScript, Appearance and Settings tests in Task 1.*
2. **Erasing by undo, in the Walkthrough input and by stepping back in Game Review.** The smear shows the digit that left and `leaving` still settles, so `.value-leave` never sticks and nothing stays on the board. *Sheet test in Task 6, manual check in its last step.*
3. **Typing digits quickly on chalk.** A new digit while the previous one is still being written replaces it cleanly (the writer remounts with a fresh mask id), and input is never blocked. *Writer test in Task 8.*
4. **Safari / iOS.** The hand-drawn grid, the selection ring and the grain show or fall back to plain lines; digits appear without the writer. *Sheet tests in Tasks 4 and 8.*
5. **白板 leaking chalk.** No dust, grain or blur in light mode, in cells, the loader, the group overlay or the celebration. *Sheet tests in Tasks 4, 8, 9, 10, 11.*

---

### Task 1: Register `chalk` with its palette

`chalk` exists and is selectable everywhere, in both modes, with the right palette. The skin is a stub; the icon is a plain background until Task 2; the moments borrow minimal's until Tasks 9–11.

**Files:**
- Create: `src/style/styles/chalk/palette.ts`, `src/style/styles/chalk/skin.css` (stub)
- Modify: `src/theme/themeIds.ts`, `src/theme/palettes.ts`, `src/style/index.css` (import), `src/theme/styleIcons.ts` (a `chalk` case: background only), `src/presentation/components/style-moments/styleMoments.ts` (`CHALK_MOMENTS` placeholder), `src/presentation/pages/home/homeHeroes.ts` (`chalk: "stacked"`), `index.html` (`barColors`), `src/presentation/i18n/messages/{zh-Hant,en}.ts`, `src/presentation/pages/settings/changelogData.ts`
- Generated: `src/style/themes.generated.css`, `public/*chalkChalkboard*`, Android launcher resources and manifest aliases
- Tests: `src/__tests__/theme/{palettes,paletteContrast,launcherIcon}.test.ts`, `src/__tests__/presentation/theme/noFlashScript.test.ts`, `src/__tests__/presentation/pages/settings/{Appearance,Settings}.test.ts`, `src/__tests__/style/styleCoverage.test.ts`

**Interfaces:**
- Produces: `STYLE_IDS` ends with `"chalk"`; `THEME_IDS_BY_STYLE.chalk = ["chalkboard"]`; `CHALK_STYLE: StyleDefinition`; `STYLE_MOMENTS.chalk`; `REQUIRED_SELECTORS.chalk` (press hooks only for now); palette extras for the tray (`tray`, `tray-edge`) and the dust/smear washes used by later tasks.

- [ ] **Step 1: Write the failing tests.**
  - `palettes.test.ts`: `STYLES.chalk.themes.map(theme => theme.id)` equals `["chalkboard"]`; `getPalette("chalk", "chalkboard", "dark")` has background `#2E4B3C`, primary `#F7C873`, accent `#A6D8F2`; the light one `#F5F6F3`, `#B04A00`, `#1D5FC2`.
  - `launcherIcon.test.ts`: 29 icons, `chalkChalkboard` and `chalkChalkboardDark` among them; `pwaIconKey("chalk", "chalkboard") === "chalkChalkboard"`.
  - `noFlashScript.test.ts` (Review Focus 1): saved `{ style: "chalk" }` with the system light paints no `dark` class and theme-color `#F5F6F3`; with the system dark paints `dark` and `#2E4B3C`.
  - `Appearance.test.ts` (Review Focus 1): the style cards end with `style-option-chalk`; with chalk chosen the colour-mode control shows the styled names (switching language switches them) and the theme picker is absent.
  - `Settings.test.ts`: with chalk, the appearance summary uses the styled mode name.
- [ ] **Step 2:** Run them; they fail (`chalk` is unknown).
- [ ] **Step 3: Build the palette** in `palette.ts` with `themeBuilder(CHALK_LIGHT_NEUTRALS, CHALK_DARK_NEUTRALS, extras)` (pixel's shape), one theme `chalkboard`, values from Global Constraints.
- [ ] **Step 4: Fit the contrast tests.** Where a generic board rule fails only because chalk's cells are transparent washes on the board, add `exceptIn: ["chalk"]` naming the rule, and add a `CHALK_BOARD_CASES` list whose coverage test expects `chalk/chalkboard/light` and `chalk/chalkboard/dark`; Task 4 fills it.
- [ ] **Step 5: Register and generate.** Ids, `STYLES`, `styleIcons.ts` `chalk` case returning the background only, i18n names (`settings.style.names.chalk`, `settings.colorThemes.chalkboard`, `settings.colorMode.styled.chalk`), `barColors`, home hero, a stub `skin.css` with the press selectors and a reduced-motion block (imported in `index.css`), `CHALK_MOMENTS = { loader: MinimalLoader, celebration: null, groupEffectMs: 620, celebrationBoardMs: 640 }`, the `UNRELEASED_CHANGES` line. Run `npm run generate:theme-css`, `generate:icons`, `generate:launcher-icons`.
- [ ] **Step 6:** `git diff develop -- src/style/themes.generated.css` shows only `chalk` blocks. Run the full suite (including `iconAssets`, `launcherIconAssets`, `AndroidManifest`), lint and vue-tsc; all clean.
- [ ] **Step 7:** Commit `✨ feat: add the chalkboard style with its chalkboard and whiteboard palettes`.

### Task 2: The chalk app icons

**Files:**
- Modify: `src/theme/styleIcons.ts`
- Generated: `public/*chalkChalkboard*`, Android launcher resources
- Test: `src/__tests__/theme/styleIcons.test.ts`

**Interfaces:**
- Consumes: `CHALK_STYLE` (Task 1).
- Produces: the `chalk` case of `styleIconArtwork` / `styleIconForeground` / `styleIconMonochrome`.

- [ ] **Step 1: Write the failing tests** in `styleIcons.test.ts`:
  - `styleIconSvg("chalk", darkPalette)` contains the board `#2E4B3C`, the chalk white and the yellow `#F7C873`, and no `<text`; the light one the whiteboard `#F5F6F3` and the orange/blue markers; the two differ.
  - The frame colour differs between modes (wood for 黑板, grey for 白板), both from palette extras.
  - The monochrome layer uses one colour.
- [ ] **Step 2:** Run; they fail.
- [ ] **Step 3: Draw it.** Port Chalk.dc's app icons (`--ai-bg`, `--ai-frame`, `--ai-ink`, `--ai-hot`): the frame, the hand-drawn 井, the yellow ring and the 7 as paths (the 7 outlined from Caveat Brush once, recorded in a comment). No filter in the icon.
- [ ] **Step 4:** Run `generate:icons` and `generate:launcher-icons`; check `public/` and the 外觀 card against the canvas. Full suite, lint, vue-tsc clean.
- [ ] **Step 5:** Commit `✨ feat: draw the chalk app icons, a framed chalkboard and whiteboard`.

### Task 3: Chalk Digits font

**Files:**
- Modify: `scripts/generate-fonts.ts`, `src/style/fonts.css`, `src/style/index.css` (`--font-chalk-digits`), `src/presentation/theme/appearanceSync.ts`, `src/presentation/i18n/messages/{zh-Hant,en}.ts` (`game.complete.cheer`)
- Create: `src/style/styles/chalk/fonts.ts`, `src/assets/fonts/caveat-brush.woff2`, `public/fonts/licenses/CaveatBrush-OFL.txt`
- Tests: `src/__tests__/style/bundledFonts.test.ts`, `src/__tests__/presentation/theme/appearanceSync.test.ts`, `src/__tests__/style/styles/chalk/fonts.test.ts` (new)

**Interfaces:**
- Produces:
  - `game.complete.cheer`: 「好棒！」 / "Well done!".
  - `syncChalkFonts(active: boolean): void` = `markFontsReady({ style: "chalk", datasetKey: "chalkFonts", faces: ['16px "Chalk Digits"'], sample: "0123456789" })`, wired as `syncChalkFonts(style === "chalk")`.
  - Family `"Chalk Digits"` from `ofl/caveatbrush/CaveatBrush-Regular.ttf`, cut to `0123456789:/%` plus the English `game.complete.cheer` string.

- [ ] **Step 1: Write the failing tests.**
  - `bundledFonts.test.ts`: the file exists, keeps its licence name-table entries, covers `0123456789:/%` and every character of the English cheer; WenKai covers the Chinese cheer (it does once the key exists, since the WenKai subset is cut from the message files).
  - `fonts.test.ts`: the gate marks only when the face reports `loaded`, drops the mark when leaving chalk, does nothing without `document.fonts`.
  - `appearanceSync.test.ts`: with style chalk, `syncChalkFonts` is called with `true`.
- [ ] **Step 2:** Run; they fail.
- [ ] **Step 3: Implement.** Generator job on the pinned commit, `@font-face` with `font-display: swap` naming the family "Chalk Digits". Run `npm run generate:fonts` and report the size (expect under 15 KB).
- [ ] **Step 4:** Full suite, lint, vue-tsc and `npm run build`; all clean.
- [ ] **Step 5:** Commit `✨ feat: bundle Caveat Brush as chalk's digits`.

### Task 4: The chalk board

**Files:**
- Create: `src/style/styles/chalk/chalk-grid.svg`, `src/style/styles/chalk/chalk-grain.svg` (or `.png`, see Global Constraints), `src/style/styles/chalk/chalk-ring.svg`
- Modify: `src/style/styles/chalk/skin.css`, `src/__tests__/theme/paletteContrast.test.ts` (`CHALK_BOARD_CASES`)
- Test: `src/__tests__/style/styles/chalk/chalkSkin.test.ts` (new, PostCSS-based like `inkSkin.test.ts`)

**Interfaces:**
- Consumes: `board-grid`, the font stack and `data-chalk-fonts` (Task 3).
- Produces: digits at `z-index: 2`, the grid's `::after` at 3, the selection ring (cell `::after`) at 4, leaving 1 for Task 10's lines; `--chalk-grain` (the grain mask URL, `none` in light mode) used by later tasks.

- [ ] **Step 1: Write the failing tests.**
  - Sheet (Review Focus 4): `[data-skin~="board-grid"]::after` sets both `-webkit-mask-image` and `mask-image` to the grid SVG (`url("@/style/styles/chalk/chalk-grid.svg")`), `background-color: var(--color-foreground)`, `pointer-events: none`, `z-index: 3`; the rule turning the board lines transparent sits inside `@supports` on mask images.
  - Sheet (Review Focus 5): in dark mode the digits, grid and ring carry the grain mask; in light mode no rule sets it.
  - Sheet: under `[data-chalk-fonts="ready"]`, `--font-clue`/`--font-entry`/`--font-key`/`--font-timer`/`--font-note` point at `--font-chalk-digits`; entries are `var(--color-accent)`.
  - Sheet: `[data-selected]::after` draws the ring (masked by `chalk-ring.svg`, `var(--color-primary)`), `z-index: 4`, `pointer-events: none`; the selected variant's own ring `box-shadow` is `none`.
  - `chalk-grid.svg` parses, has a 351×351 `viewBox` (Chalk.dc's `.chalkgrid`), and contains no `<filter>`; same for the ring and grain files.
  - Contrast: `CHALK_BOARD_CASES` checks clue, entry, note and same-digit colours on the board and on the peer/same washes, both modes, ≥ 4.5; error on the board ≥ 4.5.
- [ ] **Step 2:** Run; they fail.
- [ ] **Step 3: Implement** from Chalk.dc's `.chalkgrid` paths (copied, `fill`/`stroke` `currentColor`) and its `.cell.*`, `.nt.*` rules; bake the `#chalk` filter's look into the static grain once (record how in the file's comment). Light mode uses the same grid paths, smooth.
- [ ] **Step 4:** Full suite, lint, vue-tsc clean.
- [ ] **Step 5:** Commit `✨ feat: draw chalk's board in hand-drawn chalk lines with a yellow ring`.

### Task 5: Chalkboard pages, Home tray and the screens

**Files:**
- Create: `src/style/styles/chalk/chalk-smears.svg` (the board's erased-dust background, Chalk.dc's `.smears`, a static blurred-looking shape set with no filter)
- Modify: `src/style/styles/chalk/skin.css`
- Test: `chalkSkin.test.ts`

**Interfaces:**
- Consumes: the existing tokens (`page-ruled`, `page`, `page-header`, `card`, `button`, `continue`, `new-game`, `tile`, `key`, `control`, `check`, `segmented`, `segment`, `pill`, `pill hint`, `badge`, `chip`, `title`, `logo`, `group-heading`, `tag`, `caret`, `dialog-title`, `loader-scrim`) and `--chalk-grain` (Task 4).

- [ ] **Step 1: Write the failing sheet tests.**
  - The page paints the board from tokens with the dust specks (`background-image` layers) and a fixed `::before` masked by `chalk-smears.svg`, below content, `pointer-events: none`; light mode drops the dust and smears (Review Focus 5).
  - Home: `[data-skin~="logo"]`'s fixed `::after` is the tray at the bottom (palette extras `tray` / `tray-edge`), `pointer-events: none`; two sticks and a duster as gradients.
  - Buttons, keys, tiles and cards: chalk outlines (`border-radius` with Chalk.dc's `--wob` values, inset `box-shadow` from `--color-border`), no `border`, `letter-spacing` or `font-size` rules; the chosen key is a coloured chalk fill (`var(--color-primary)` behind `var(--color-on-primary)`) with the grain in dark mode.
  - `title`, `dialog-title`, `complete-title` use `--font-wenkai` 700.
- [ ] **Step 2:** Run; they fail.
- [ ] **Step 3: Write the skin** from Chalk.dc's rules for each screen, both modes.
- [ ] **Step 4:** Full suite, lint, vue-tsc clean.
- [ ] **Step 5:** Commit `✨ feat: lay chalk's screens on a chalkboard with a chalk tray on Home`.
- [ ] **Step 6: Visual check.** `npm run start` at 390×844, both modes, zh-Hant and English: Home, Game, Game in hint mode, Statistics, Game Review, Walkthrough (intro, input, playback), Settings, 外觀, Changelog, every dialog. Compare each to the Chalk.dc tab of the same name. Report differences, clipping or overflow, and canvas details no hook reaches, with screenshot paths. Use Chrome DevTools MCP if reachable, else headless Chrome with a temporary profile; say which.

### Task 6: The erase smear

**Files:**
- Modify: `src/style/styles/chalk/skin.css`
- Test: `chalkSkin.test.ts`

**Interfaces:**
- Consumes: `.value-leave`, `data-leaving-value` (existing).

- [ ] **Step 1: Write the failing sheet tests** (Review Focus 2).
  - `.value-leave::before` has `content: attr(data-leaving-value)`, the entry face and colour, `pointer-events: none`, and runs `chalk-smear` (Chalk.dc's `smearA`: to `translateX(-3px) scaleX(1.7) skewX(6deg)`, `blur(3px)`, through a faint layer to opacity 0) in ≤ 1000ms; the animation has no `forwards` hold that keeps it visible.
  - In light mode the smear is a marker wipe: same motion, no blur.
  - Under reduced motion it is `animation: none` and unseen.
- [ ] **Step 2:** Run; they fail.
- [ ] **Step 3:** Implement. The ghost's `animationend` settles `leaving` through `BoardCell`'s pseudo-element path.
- [ ] **Step 4:** Full suite, lint, vue-tsc clean. In the dev server: erase, undo, step back in Game Review, erase in the Walkthrough input; nothing stays on the board.
- [ ] **Step 5:** Commit `✨ feat: smear chalk's erased digits across the board`.

### Task 7: Generalise the stroke digit writer (structural)

Paper's writer reads paper's strokes and Caveat's metrics directly. Make the component take them, so chalk reuses it. Paper looks and behaves the same.

**Files:**
- Move/rename: `style-moments/paper/PaperDigitWriter.vue` → `style-moments/StrokeDigitWriter.vue`; the shared types (`PenStroke`, `DigitStrokes`) move from `paperDigitStrokes.ts` to `style-moments/digitStrokes.ts`
- Create: `style-moments/paper/PaperDigitWriter.vue` as a thin wrapper passing paper's face
- Modify: `paperDigitStrokes.ts`, the paper writer's tests
- Tests: existing `PaperDigitWriter` / `paperMoments` / `digitCentring` tests stay green unchanged

**Interfaces:**
- Produces:
  - `interface StrokeFace { strokes: Partial<Record<number, DigitStrokes>>; penWidth: number; easing: string; glyph: { size: number; centreX: number; baselineY: number }; advances: Partial<Record<number, number>>; baselineEm: number }` in `digitStrokes.ts`.
  - `StrokeDigitWriter.vue` props `{ digit: number; maskId: string; face: StrokeFace }`, emits `written`, a stroke class prop or slot for per-style stroke styling (`strokeClass: string`, `settleClass: string`).
  - `PAPER_STROKE_FACE: StrokeFace`.

- [ ] **Step 1:** Run the full suite; green.
- [ ] **Step 2:** Refactor. Paper's wrapper keeps the props `{ digit, maskId }` and the `written` emit, so `STYLE_MOMENTS.paper.digitWriter` is unchanged.
- [ ] **Step 3:** Full suite, lint, vue-tsc clean; `git diff --stat src/style` is empty.
- [ ] **Step 4:** Commit `♻️ refactor: let the stroke digit writer take a style's strokes and glyph metrics`.

### Task 8: Chalk writes its digits

**Files:**
- Create: `style-moments/chalk/chalkDigitStrokes.ts`, `style-moments/chalk/ChalkDigitWriter.vue`
- Modify: `styleMoments.ts` (`digitWriter: ChalkDigitWriter`), `src/style/styles/chalk/skin.css`, `styleCoverage.test.ts`
- Tests: `src/__tests__/presentation/components/style-moments/chalk/ChalkDigitWriter.test.ts`, `src/__tests__/style/styles/chalk/chalkMoments.test.ts` (new), `src/__tests__/style/styles/chalk/digitCentring.test.ts` (like paper's)

**Interfaces:**
- Consumes: `StrokeDigitWriter`, `StrokeFace` (Task 7); `--chalk-grain` (Task 4).
- Produces: `CHALK_STROKE_FACE: StrokeFace` (pen width 14, 50ms lift between strokes, 60ms settle), classes `.chalk-digit-stroke`, `.chalk-digit-settle`, `.chalk-digit-dust`.

- [ ] **Step 1: Write the failing tests.**
  - `ChalkDigitWriter.test.ts`: every digit 1–9 has 1–2 strokes in the board's order (1 flag then stem; 4 diagonal-with-bar then stem; 7 bar then diagonal; 8 one S stroke; 5 stem-with-belly then bar); each digit's last stroke plus settle ends between 420 and 560ms; gaps between strokes are 50ms; `written` emits on the settle's `animationend`; two writers get different mask ids, and a new digit remounts (Review Focus 3).
  - `digitCentring.test.ts`: the advances and baseline match the bundled `caveat-brush.woff2` (measured as paper's test does).
  - `chalkMoments.test.ts`: under `[data-chalk-fonts="ready"]` the arriving digit carries `mask-image: var(--digit-writer-mask)` (and `-webkit-`), and each stroke end drops a dust speck in dark mode only (Review Focus 5); reduced motion: no mask, no dust, `animation: none` (Review Focus 4: nothing depends on the writer being mounted).
- [ ] **Step 2:** Run; they fail.
- [ ] **Step 3:** Port the 黑板 row's paths from StrokeWriting.dc into `chalkDigitStrokes.ts` (with lengths and crossings), re-measuring advances/baseline against the bundled font. `ChalkDigitWriter.vue` wraps `StrokeDigitWriter` with `CHALK_STROKE_FACE` and adds the dust specks.
- [ ] **Step 4:** Full suite, lint, vue-tsc clean. In the dev server type digits fast in both modes; no stuck masks.
- [ ] **Step 5:** Commit `✨ feat: write chalk's digits stroke by stroke with a little chalk dust`.

### Task 9: Moment — the chalk loader

**Files:**
- Create: `src/presentation/components/style-moments/chalk/ChalkLoader.vue`
- Modify: `styleMoments.ts` (`CHALK_MOMENTS.loader`), `src/style/styles/chalk/skin.css`, `styleCoverage.test.ts`
- Tests: `src/__tests__/presentation/components/style-moments/chalk/ChalkLoader.test.ts`, `chalkMoments.test.ts`

**Interfaces:**
- Produces: `ChalkLoader` with props `{ message?: string }`; classes `.chalk-loader`, `.chalk-loader-stroke`, `.chalk-loader-ring`, `.chalk-loader-digit`, `.chalk-loader-duster`, `.chalk-loader-smear`.

- [ ] **Step 1: Write the failing tests.**
  - `ChalkLoader.test.ts`: renders the 九宮 (outline + four inner lines), the ring, four digits and the duster, all `aria-hidden`; ids unique across two mounted loaders; the caption is `message` when given and otherwise switches with the language.
  - `chalkMoments.test.ts`: one 4.4s infinite loop, every keyframe starting hidden; keyframes animate only `opacity`, `transform`, `stroke-dashoffset`; light mode has no dust (Review Focus 5); under reduced motion every piece is `animation: none` and the still frame shows the 九宮, the digits, the last ring and one smear. No loader rule depends on the motion setting.
  - `REQUIRED_SELECTORS.chalk` gains `.chalk-loader-stroke` and `.chalk-loader-duster`.
- [ ] **Step 2:** Run; they fail.
- [ ] **Step 3:** Port MomentsChalk's loader.
- [ ] **Step 4:** Full suite, lint, vue-tsc clean.
- [ ] **Step 5:** Commit `✨ feat: chalk a 九宮 and wipe it with a duster while a puzzle loads`.

### Task 10: Moment — row, column and box completion

**Files:**
- Create: `src/presentation/components/style-moments/chalk/ChalkGroupOverlay.vue`
- Modify: `styleMoments.ts` (`groupOverlay`, `groupEffectMs`), `src/style/styles/chalk/skin.css`, `styleCoverage.test.ts`
- Tests: `src/__tests__/presentation/components/style-moments/chalk/ChalkGroupOverlay.test.ts`, `chalkMoments.test.ts`

**Interfaces:**
- Consumes: `GroupEffect`, `groupPlacement`.
- Produces: `.chalk-group-line` with `data-kind="row" | "column" | "box"`, `.chalk-group-dust`; z-index 1.

- [ ] **Step 1: Write the failing tests.**
  - `ChalkGroupOverlay.test.ts`: a row under its row, a column on its right, a box ring around its box, all placed by `groupPlacement`; several groups at once draw together, each with its own dust; a new effect id remounts.
  - `chalkMoments.test.ts`: lines draw by `stroke-dashoffset` then fade by about 0.9s (GroupChalk's timing), within `groupEffectMs`; `[data-group] > div` flashes the digits yellow, and a combined `[data-group] > div.value-arrive` rule lists both the flash and the arrive animation (the `CLAUDE.md` trap), reduced-motion block too; dust only in dark mode (Review Focus 5); every piece `animation: none` under reduced motion, no still cue.
  - `REQUIRED_SELECTORS.chalk` gains `[data-group]` and `.chalk-group-line`.
- [ ] **Step 2:** Run; they fail.
- [ ] **Step 3:** Port GroupChalk's SVGs (no `<filter>`; the grain from `--chalk-grain`).
- [ ] **Step 4:** Full suite, lint, vue-tsc clean. With 「動態效果」 off, completing a group shows nothing.
- [ ] **Step 5:** Commit `✨ feat: underline chalk's completed rows and ring its boxes in yellow chalk`.

### Task 11: Moment — the celebration

**Files:**
- Create: `src/presentation/components/style-moments/chalk/ChalkCelebration.vue`, `src/presentation/components/style-moments/chalk/ChalkCardDecoration.vue`
- Modify: `styleMoments.ts` (`celebration`, `cardDecoration`, `celebrationBoardMs`), `src/style/styles/chalk/skin.css`, `styleCoverage.test.ts`
- Tests: `.../chalk/ChalkCelebration.test.ts`, `.../chalk/ChalkCardDecoration.test.ts`, `chalkMoments.test.ts`

**Interfaces:**
- Consumes: `data-celebration`, `data-still`, `complete-title`, `trophy` (existing); `game.complete.cheer` (Task 3).
- Produces: `ChalkCelebration` (the board ring and doodles: stars, waves, rays), `ChalkCardDecoration` with props `{ still?: boolean }` (the 「好棒！」 line, written letter by letter, with dust).

- [ ] **Step 1: Write the failing tests.**
  - `ChalkCardDecoration.test.ts`: shows `game.complete.cheer` (switching language switches it), `aria-hidden` beside the real title; with `still` every letter shows at once.
  - `ChalkCelebration.test.ts`: renders the ring and the doodles, `aria-hidden`.
  - `chalkMoments.test.ts`: `[data-celebration="playing"]` draws the ring then the doodles by `stroke-dashoffset`; the cheer's letters appear left to right with dust (dark only, Review Focus 5); the card lands like a note stuck on the board; `[data-celebration="still"]` / `[data-still]` show the end state with no animation; everything `none` under reduced motion.
  - `REQUIRED_SELECTORS.chalk` gains `[data-celebration="playing"]`, `[data-skin~="complete-title"]`, `[data-skin~="celebration"]:not([data-still])`.
- [ ] **Step 2:** Run; they fail.
- [ ] **Step 3:** Port MomentsChalk's celebration; `celebrationBoardMs` from its timing.
- [ ] **Step 4:** Full suite, lint, vue-tsc clean. Finish a game with 「動態效果」 on and off, with system reduced motion, both modes.
- [ ] **Step 5:** Commit `✨ feat: ring chalk's solved board and write 好棒 on the board`.

### Task 12: Docs and an on-device check

**Files:** `CLAUDE.md`, `README.md`

- [ ] **Step 1: `CLAUDE.md`.** Add `chalk` to the style-folder list; note the generalised `StrokeDigitWriter` / `StrokeFace` under Moments (paper and chalk pass their own strokes; re-measure `chalkDigitStrokes.ts` if Caveat Brush changes); note "Chalk Digits" beside ink's family names.
- [ ] **Step 2: `README.md`.** Mention chalk the way the README mentions the others (no style count in store copy).
- [ ] **Step 3:** Full suite, lint, vue-tsc clean.
- [ ] **Step 4:** Commit `📄 docs: describe the chalkboard style and the shared stroke writer`.
- [ ] **Step 5 (controller): hand an Android emulator check to the peer session "sudoku-app"** with `npm run android:build:dev` (never a bare `npx cap sync`): both modes, the launcher icon following the style and the mode, writing and erasing (frame rate while the grain and blur run), a row and box completion, the celebration, Chinese and English. Report screenshots to the owner.
