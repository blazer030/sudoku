# 8-bit Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth visual style, `pixel` (「8-bit 電玩」 / "8-bit"), built as a skin. It has two modes named 掌機 and 紅白機, a fixed palette per mode, pixel fonts, pixel board and keys, stepped motion, and its own app icon.

**Architecture:** `pixel` registers like paper does: an id in `themeIds.ts`, a palette in `src/style/styles/pixel/palette.ts`, a scoped `skin.css`, icon artwork in `styleIcons.ts`, and generated icon, theme-CSS and font assets.
- Two small shared features make a one-theme style and per-style mode names work for every style, driven by data rather than by `pixel` checks.
- One new cell hook, "value leaves", lets a skin animate an erase.
- Everything else is CSS on the existing `data-skin` / `data-variant` / press hooks.

**Tech Stack:** Vue 3 + TS + Tailwind v4, Vitest, PostCSS-based sheet tests, `subset-font` font pipeline, `tsx` generator scripts, Capacitor Android launcher aliases.

**Spec:** `docs/superpowers/specs/2026-10-23-pixel-style-design.md`. Visual reference: `/Users/ethan/Project/sudoku/.worktrees/style-research/docs/style-research/project/Pixel.dc.html`. It is read-only and lives on another branch; its `.m-light`, `.m-dark` and `.art` blocks and its skin rules are the look to match.

## Global Constraints

- **Work and branch:**
  - Work in worktree `/Users/ethan/Project/sudoku/.worktrees/style-pixel`, branch `feature/style-pixel`.
  - Never merge it into `develop`; the owner merges after checking.
- **Commits:**
  - English Conventional Commits with an emoji prefix (✨ feat, 🐛 fix, ♻️ refactor, 🧪 test, 📄 docs, 🚧 chore). **No trailers** (no Co-Authored-By, no Claude-Session).
  - Structural and behavioural changes go in separate commits. Commit at every GREEN.
- **Before each commit** these must be clean, with no new warnings in test output:
  - `npx vitest run`
  - `npm run lint`
  - `npx vue-tsc --noEmit`
- **No changes for other styles:** minimal, tactile and paper must look and behave exactly as before. Only tests that list every style change for them.
- **Contrast:** `paletteContrast.test.ts` keeps every existing rule for every other style. `pixel` skips only rules its own board model replaces, and each skip is named in the test.
- **Skin rules** (`src/__tests__/style/styleSheetRules.ts`):
  - Selectors are scoped to `[data-style="pixel"]` (or `:root[data-style="pixel"]` / `:root.dark[data-style="pixel"]`), and keyframes are prefixed `pixel-`.
  - No layout properties outside `::before`/`::after`.
  - Every animation and moving transition is stopped in `@media (prefers-reduced-motion: reduce)`.
  - `--*-scale` values stay within 1–1.5.
  - Every animation uses `steps()`. There are no smooth easings, blur or glow.
- **Exact values:**
  - Style id `pixel`. Theme id `classic` (labels 「經典」 / "Classic").
  - Mode names 掌機 / 紅白機 (zh-Hant) and "Handheld" / "Console" (en).
  - Style names 「8-bit 電玩」 / "8-bit".
  - Launcher keys `pixelClassic` and `pixelClassicDark`.
- **Palettes:**
  - 掌機: `#0F380F` `#306230` `#8BAC0F` `#9BBC0F`. Every text role is `#0F380F`, the only shade that passes 4.5:1 on the light greens.
  - 紅白機: `#FCFCFC` `#6C6C6C` `#1E1E3C` `#000000`, entry `#3CBCFC`, highlight `#F8B800`, same-digit `#0058F8`, NES red for errors (lighter where it sits on navy), secondary text `#BCBCBC`.
- **Fonts:**
  - Press Start 2P only for digits: board, keys, timer and counts.
  - 俐方體 11 號 (Cubic 11) for all other text in both languages, cut to the characters `src` uses, like WenKai.
  - Silkscreen for notes.
  - All are self-hosted through `scripts/generate-fonts.ts`, with licences in `public/fonts/licenses/`.
  - Synthetic bold is off for pixel faces (`font-synthesis: none`).
- **Copy:** Chinese copy follows `CLAUDE.md`. Tests check that switching language changes the screen, never exact wording.
- **Shared code:** no `pixel` checks inside shared components. Behaviour hangs off data: the theme count, the per-style mode-name map, and skin hooks.

## Review Focus

1. **The English UI in pixel type.** Long labels on the 外觀 page, Settings, dialogs and the keypad must not overflow or clip. *Task 4 Step 6: open each screen in English and confirm by screenshot.*
2. **Switching into pixel and back.** Coming back to minimal or tactile returns the theme last chosen there, while pixel always uses `classic`. *Test in Task 2.*
3. **First paint in pixel.** With pixel saved, a cold start paints the right system-bar colour in both modes, and there is no flash of minimal: `#0F380F` in 掌機, `#000000` in 紅白機. *Test in Task 1 (noFlashScript).*
4. **Erasing in places other than the game.** Undo, game-review stepping backwards and the walkthrough all remove digits. The leave burst must never stick, and must stay off under reduced motion. *Test in Task 6.*
5. **Text that reads as one colour in 掌機.** Player digits must still be told from clues (underline), and errors from plain cells (hatch), without colour. *Test in Task 5 via the pixel board model and a sheet test that those rules exist.*

---

### Task 1: Register `pixel` with its palette, icon and generated assets

A fourth style exists and is selectable everywhere, with a correct palette and app icon. The look is still mostly default: the skin is a stub that covers only the press hooks the coverage test requires.

**Files:**
- Create:
  - `src/style/styles/pixel/palette.ts`
  - `src/style/styles/pixel/skin.css` (press hooks only, square corners)
- Modify:
  - `src/theme/themeIds.ts`, `src/theme/palettes.ts`, `src/style/index.css` (import), `src/theme/styleIcons.ts`
  - `index.html` (`barColors` block)
  - `src/presentation/i18n/messages/{zh-Hant,en}.ts` (style name, `colorThemes.classic`)
- Generated:
  - `src/style/themes.generated.css`, via `npm run generate:theme-css`
  - `public/*pixelClassic*` files, via `npm run generate:icons`
  - `android/app/src/main/res/**` and the manifest aliases, via `npm run generate:launcher-icons`
- Tests:
  - `src/__tests__/theme/paletteContrast.test.ts`, `launcherIcon.test.ts` (23→25)
  - `src/__tests__/presentation/pages/settings/Appearance.test.ts` (style list)
  - `src/__tests__/style/styleCoverage.test.ts` (`REQUIRED_SELECTORS.pixel`)
  - `src/__tests__/theme/palettes.test.ts` (`featured` = `primary` rule: include or explicitly exempt pixel)

**Interfaces:**
- Produces:
  - `STYLE_IDS = ["minimal", "tactile", "paper", "pixel"]` and `THEME_IDS_BY_STYLE.pixel = ["classic"]`.
  - `STYLE_COLOR_MODES.pixel = ["light", "dark"]`.
  - `PIXEL_STYLE: StyleDefinition`.
  - `styleIconSvg("pixel", palette)`, a 54×54-pixel sudoku-screen artwork.

- [ ] **Step 1: Write the failing tests.**
  - `palettes.test.ts`: `STYLES.pixel.themes.map(theme => theme.id)` equals `["classic"]`.
  - `launcherIcon.test.ts`: `LAUNCHER_ICONS` has length 25 and contains `launcherIconKey("pixel", "classic", "light") === "pixelClassic"` and `"pixelClassicDark"`.
  - `Appearance.test.ts`: the card list ends with `"style-option-pixel"`.
  - `styleIcons.test.ts`:
    - `styleIconSvg("pixel", getPalette("pixel", "classic", "light"))` contains a `#9BBC0F` fill.
    - The dark one contains `#000000` and the star colour `#3CBCFC`.
    - The monochrome layer is single-colour, as for other styles.
- [ ] **Step 2:** Run `npx vitest run src/__tests__/theme src/__tests__/presentation/pages/settings`. It should fail, because `pixel` is unknown.
- [ ] **Step 3: Register the ids and build the palette.**
  - Add the ids, and build `PIXEL_STYLE` with `themeBuilder(lightNeutrals, darkNeutrals, lightExtras, darkExtras)("classic", light, dark)` from the canvas tokens in Global Constraints.
  - Map tokens so every text pair passes: in 掌機, `foreground`, `foreground-secondary`, `foreground-muted`, `note`, `error`, `danger` and `primary` all resolve to `#0F380F`, and `on-primary` is `#9BBC0F`.
  - Register in `STYLES`, with key order equal to `STYLE_IDS`, and add the i18n names.
  - Run `npm run generate:theme-css`.
- [ ] **Step 4: Add the pixel board model and named exceptions to `paletteContrast.test.ts`.**
  - Add an optional `exceptIn?: readonly StyleId[]` with a comment naming why, next to the existing `styles` filter. Apply it only to `BOARD_PAIRS`, `SURFACE_PAIRS` and, for pixel in light mode only, `TEXT_HIERARCHY`, since 掌機 has one text ink.
  - Add `PIXEL_BOARD_CASES` for both modes. Each case is the ink actually drawn on the surface actually drawn:

    | State | 掌機 | 紅白機 |
    |---|---|---|
    | Default / clue / player digit / note | `#0F380F` on `#9BBC0F` | its ink on `#000000` |
    | Selected (inverted) | `#9BBC0F` on `#0F380F` | `#000000` on `#FCFCFC` |
    | Same digit | `#0F380F` on `#8BAC0F` | `#FCFCFC` on `#0058F8` |
    | Scope dither | `#0F380F` on `mixColors(#0F380F, 0.25, #9BBC0F)` | the matching mix in dark |
    | Error | the hatch mixed the same way | the error red on `#000000` |

  - Each case must reach 4.5, or 3 for the selection frame.
  - Add a coverage assertion, like paper's, that the cases cover `pixel/classic/light` and `pixel/classic/dark`.
- [ ] **Step 5: Draw the icon in `styleIcons.ts`.**
  - The artwork is the sudoku-screen icon on a 54×54 grid, 2 units a pixel. Port `pixelicon.py` from the style-research generator (`/Users/ethan/Project/sudoku/.worktrees/style-research/docs/style-research/generator/pixelicon.py`: `HEART`, `DIGITS`, `STARS`, `TWINKLES`, `draw`, run-length rects) to TypeScript.
  - 掌機 colours come from the palette's four greens. 紅白機 uses the NES colours, with the star field.
  - Background is the palette `background`, so the icon assets' background-pixel sample (5% width, mid-height) stays background. Check that no star sits there.
  - Monochrome is the hearts, box and digits in one colour.
- [ ] **Step 6: Generate the assets.**
  - Add `pixel` to `index.html` `barColors`: `light: { classic: "#0F380F" }`, `dark: "#000000"`.
  - Run `npm run generate:icons` and `npm run generate:launcher-icons`.
- [ ] **Step 7: Write the stub `skin.css`.**
  - Style the four required press selectors with `border-radius: 0` plus a hard press offset placeholder, and add a reduced-motion block. Task 4 replaces it.
  - Add `@import "./styles/pixel/skin.css";` in `src/style/index.css`.
- [ ] **Step 8:** Run the full suite, lint and vue-tsc; all should be green. Include `noFlashScript`, `iconAssets`, `launcherIconAssets` and `AndroidManifest` (Review Focus 3).
- [ ] **Step 9:** Commit `✨ feat: add the 8-bit style with its palettes and app icon`.

### Task 2: One-theme styles and per-style mode names

**Files:**
- Modify:
  - `src/theme/themeIds.ts`: add `STYLE_MODE_NAMES`.
  - `src/presentation/pages/settings/Appearance.vue`, `Settings.vue`.
  - Both message files.
  - Create `src/presentation/i18n/colorModeLabels.ts`.
- Tests:
  - `Appearance.test.ts`, `Settings.test.ts`
  - `src/__tests__/presentation/i18n/colorModeLabels.test.ts`
  - `messages.test.ts` (keys for every named mode)

**Interfaces:**
- Produces:
  - `useColorModeLabel(): (style: StyleId, mode: ColorMode) => string`. It returns `t("settings.colorMode.styled.<style>.<mode>")` when `STYLE_MODE_NAMES[style]` is true, else `t("settings.colorMode.<mode>")`.
  - `STYLE_MODE_NAMES: Readonly<Partial<Record<StyleId, true>>> = { pixel: true }`.
  - The i18n keys `settings.colorMode.styled.pixel.light` (掌機 / Handheld) and `.dark` (紅白機 / Console).

- [ ] **Step 1: Write the failing tests.**
  - On the 外觀 page with style pixel, `[data-testid='color-theme-classic']` does not exist, and no 「色彩主題」 heading is rendered. Add `data-testid="appearance-theme-label"` to the heading. With minimal, the heading and six swatches exist.
  - With pixel, the appearance segmented options' text differs between `zh-Hant` and `en`, and differs from minimal's labels in the same language. That is a locale-switch check, not exact copy.
  - The Settings summary for pixel (dark) contains the pixel dark mode label and does not contain the theme label. For minimal it still has both.
  - Switch minimal→blue, then pixel, then minimal. The theme is `blue` again (Review Focus 2).
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3: Implement.**
  - The theme section is shown when `STYLES[style].themes.length > 1`.
  - The summary is the mode label alone when there is one theme, the theme alone when there is one mode, and both otherwise. If a style ever has one theme and one mode, the summary is the style name alone.
  - Both pages use `useColorModeLabel`.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: hide a single colour theme and name light and dark per style`.

### Task 3: Pixel fonts

**Files:**
- Modify:
  - `scripts/generate-fonts.ts`
  - `src/style/fonts.css`
  - `src/style/index.css` (`@theme` font stacks `--font-pixel-digits`, `--font-pixel`, `--font-pixel-note`)
  - `src/__tests__/style/bundledFonts.test.ts`
- Create:
  - `src/assets/fonts/{press-start-2p,silkscreen,cubic-11}.woff2`, plus `cubic-11-characters.txt`
  - `public/fonts/licenses/{PressStart2P,Silkscreen,Cubic11}-OFL.txt`
  - `src/style/styles/pixel/fonts.ts` (`syncPixelFonts(active: boolean): void`)

**Interfaces:**
- Consumes the `download()` helper. Cubic 11 needs a second source: `https://raw.githubusercontent.com/ACh-K/Cubic-11/4c566f7d6cc5c05ee360fe9cff56b5da1fcafd4d/fonts/ttf/Cubic_11.ttf`, licence `OFL.txt` at the same commit. Pin it by commit like Google Fonts; cache it under the same cache dir.
- Produces:
  - Faces `"Press Start 2P"` (text `0123456789`), `"Silkscreen"` (text `0123456789`) and `"Cubic 11"` (ASCII + `src` characters, like WenKai).
  - `syncPixelFonts`, which sets `data-pixel-fonts="ready"` on `<html>` once `document.fonts.load` resolves for all three, mirroring paper's `fonts.ts`. It is wired in `appearanceSync.ts` next to `syncPaperFonts`, called as `syncPixelFonts(style === "pixel")`.

- [ ] **Step 1: Write the failing tests.**
  - `bundledFonts.test.ts`: each new face exists, its name table keeps the licence description/URL IDs, and the Cubic 11 subset covers every non-ASCII character in `src`. Same shape as WenKai's test.
  - `appearanceSync.test.ts`: with style pixel, `syncPixelFonts` is called with `true`.
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3:** Implement the font jobs and `@font-face` rules (`font-display: swap`), then run `npm run generate:fonts`. Report each subset's size.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green. Run `npm run build` (the PWA precache includes the new woff2).
- [ ] **Step 5:** Commit `✨ feat: bundle the 8-bit pixel fonts`.

### Task 4: The pixel skin: type, board frame, keys, controls and pages

**Files:**
- Modify:
  - `src/style/styles/pixel/skin.css`
  - `src/presentation/components/digit-pad/DigitPad.vue` (add `data-skin="badge"` to both badge spans)
  - `src/__tests__/style/skinHooks.test.ts`, only if the new token needs registering
- Test: `src/__tests__/style/styles/pixel/pixelSkin.test.ts` (new, PostCSS-based like the paper/tactile style tests)

**Interfaces:**
- Consumes the font stacks from Task 3 and the palette tokens from Task 1.
- Produces skin rules keyed on:
  - `data-skin` tokens `page`, `page-header`, `board`, `key`, `control`, `button`, `continue`, `new-game`, `tile`, `check`, `segmented`, `segmented-indicator`, `title`, `title-glyph`, `badge`
  - `data-variant` and `data-value-kind` on cells

- [ ] **Step 1: Write the failing sheet tests.** Using `pixelSkin.test.ts`, assert that the pixel sheet:
  - repoints `--font-sans` and the other text fonts to the Cubic 11 stack, `--font-clue`, `--font-entry`, `--font-key` and `--font-timer` to Press Start 2P, and `--font-note` to Silkscreen, all under `[data-style="pixel"][data-pixel-fonts="ready"]`
  - sets `font-synthesis: none`
  - sets `--board-line` and `--board-box-line` to solid palette colours (no `color-mix` transparency)
  - gives `[data-skin="key"]` a hard `box-shadow` with zero blur
  - sets `border-radius: 0` on `key`, `control`, `button`, `tile`, `segmented`, `badge` and `board`
  - uses `steps(` in every `animation` declaration
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3: Write the skin from the canvas.**
  - The board frame is a notched pixel frame (`box-shadow` stack on `[data-skin="board"]`). Cell lines are 2px and box lines 4px, through the existing border variables or `::before` overlays.
  - Keys are square, with a hard 4px shadow. A pressed key (`[data-pressed]`) moves 4px into its shadow via `translate`, and the shadow goes to 0.
  - The badge is a square pixel tag.
  - Controls, buttons, tiles and segmented controls get pixel frames.
  - Pages get the flat background; headers and titles use the pixel font.
  - Everything stays within the layout rule.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: draw the 8-bit board, keys and screens in pixels`.
- [ ] **Step 6: Visual check (Review Focus 1).**
  - Run `npm run start`. In a browser at phone width (390×844), take screenshots in zh-Hant and English, 掌機 and 紅白機, of: Home, Game, 外觀, Settings, Statistics, a dialog.
  - Report clipping or overflow with file paths. If labels overflow in English, record it for the owner's decision; do not change shared layout.
  - Use Chrome DevTools MCP if it is reachable. Otherwise use headless Chrome with a temporary profile (`--headless=new --screenshot`). State which.

### Task 5: Board states without colour, and the selection cursor

**Files:**
- Modify: `src/style/styles/pixel/skin.css`
- Test: `pixelSkin.test.ts`, and `paletteContrast.test.ts`'s `PIXEL_BOARD_CASES` if values change

- [ ] **Step 1: Write the failing sheet tests.** The pixel sheet:
  - draws an underline for `[data-value-kind="entered"]` (`::after`, 2px, current colour)
  - draws a diagonal hatch background for `[data-variant="error"]` and a `pixel-`-prefixed blink using `steps(`
  - draws a 2px dither background for `[data-variant="scope"]` and `[data-variant="peer"]`
  - fills `[data-variant="same-digit"]` solid
  - inverts `[data-variant="selected"]` (background = foreground colour, digit = background colour) with four corner brackets via `::before`/`::after` that blink with `steps(2)`
  - stops all of these animations under reduced motion
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3: Implement from the canvas's cell rules.** Keep `PIXEL_BOARD_CASES` in step with the colours actually drawn (Review Focus 5).
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: tell 8-bit cells apart by pattern, not colour alone`.

### Task 6: The "value leaves" hook and 8-bit fill/erase motion

**Files:**
- Modify:
  - `src/presentation/components/board-cell/useArrivalMotion.ts`
  - `BoardCell.vue`
  - `src/style/styles/pixel/skin.css`
- Tests:
  - `src/__tests__/presentation/components/board-cell/useArrivalMotion.test.ts`
  - `BoardCell` tests
  - `pixelSkin.test.ts`

**Interfaces:**
- Produces:
  - `useArrivalMotion(value, popping)` returns `{ arriving, leaving, settle }`.
  - `leaving` is true when the value goes from non-zero to 0 after mount, not while `popping`, and not under reduced motion. It is cleared by `settle` or by the `ARRIVAL_SETTLE_MS` timer.
  - `BoardCell` puts class `value-leave` on the cell root while `leaving`, and clears it on that element's `animationend`.
- Structural first: if the hook needs a rename (e.g. `useValueMotion`), do the rename alone in a ♻️ commit with the suite green, before the behaviour.

- [ ] **Step 1: Write the failing hook tests.**
  - Digit 5 → 0 sets `leaving`; it clears after `ARRIVAL_SETTLE_MS` (fake timers).
  - A value present at mount, then cleared, still sets `leaving`.
  - `popping` true → no `leaving`.
  - Reduced motion → no `leaving`.
  - 5 → 3 sets neither.
  - The cell root of a mounted `BoardCell` gets and loses `value-leave` (Review Focus 4: it never sticks).
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3: Implement the hook, then the pixel motion.**
  - `.value-arrive`: the digit appears in 4 steps (`steps(4)`), with eight pixels bursting outward on `::before`/`::after` box-shadow pixels.
  - `.value-leave`: the same burst in the light colour.
  - Both finish well under `ARRIVAL_SETTLE_MS`, and the `useArrivalMotion` duration test covers pixel.
  - Both are stopped under reduced motion.
  - Other styles do not style `.value-leave`; check their sheets don't match it.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: burst 8-bit digits in and out in steps`.

### Task 7: Docs and an on-device check

**Files:** `CLAUDE.md`, `README.md`

- [ ] **Step 1: `CLAUDE.md`.**
  - Add pixel to the style list in the style-folder line.
  - Complete the "a new style registers in…" steps: the `index.html` `barColors` block, i18n names (`settings.style.names`, `settings.colorThemes`, `settings.colorMode.styled` when modes are renamed), `styleCoverage`'s `REQUIRED_SELECTORS`, and the scripts to run (`generate:theme-css`, `generate:icons`, `generate:launcher-icons`, `generate:fonts`).
- [ ] **Step 2: `README.md`.** Four styles; 8-bit has 掌機/紅白機 and fixed colours.
- [ ] **Step 3:** Run lint and the full suite; both should be green.
- [ ] **Step 4:** Commit `📄 docs: describe the 8-bit style and how a style registers`.
- [ ] **Step 5 (controller):** Hand an Android emulator check to the peer session "sudoku-app" (`npm run android:build:dev`, never a bare `npx cap sync`). It covers:
  - picking 8-bit and switching 掌機/紅白機
  - the launcher icon following the style
  - filling and erasing digits
  - English and Chinese
  - Report screenshots to the owner.
