# Cyberpunk Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fifth visual style, `cyber` (「賽博龐克」 / "Cyberpunk"). It is dark only, with one fixed neon palette, Orbitron and Share Tech Mono type, cut-corner panels with deep fills, a HUD board, glitch motion and its own app icon.

**Architecture:**
- First, a structural change makes light-only and dark-only one "single-mode" mechanism: a theme carries a palette for each mode its style has, and every consumer asks `STYLE_COLOR_MODES`.
- Then `cyber` registers like `pixel` did: ids, palette, icon, generated assets.
- A few new skin hooks (data attributes and `data-skin` tokens) carry the decoration.
- Everything visual is `[data-style="cyber"]` CSS in `src/style/styles/cyber/skin.css`.

**Tech Stack:** Vue 3 + TS + Tailwind v4, Vitest, PostCSS-based sheet tests, `subset-font` font pipeline, `tsx` generator scripts, `sharp`, Capacitor Android launcher aliases.

**Spec:** `docs/superpowers/specs/2026-10-24-cyber-style-design.md`.

**Visual reference:** `/Users/ethan/Project/sudoku/.worktrees/style-research/docs/style-research/project/Cyber.dc.html`.
- It is read-only and lives on another branch.
- Its `.m-dark` and `.art` blocks and its skin rules are the look to match. Ignore its `.m-light` and `.t1`–`.t3` blocks.
- The same CSS, unminified, is in that worktree's `docs/style-research/generator/parts.json` (`Cyber.css`) and `skins.py` (`ADDON['Cyber']`).
- The icon is `ICONS['Cyber']` in `generator/icons.py`.

## Global Constraints

- **Work and branch:**
  - Worktree `/Users/ethan/Project/sudoku/.worktrees/style-cyber`, branch `feature/style-cyber`.
  - Never merge into `develop`; the owner merges after checking.
- **Commits:**
  - English Conventional Commits with an emoji prefix (✨ feat, 🐛 fix, ♻️ refactor, 🧪 test, 📄 docs, 🚧 chore).
  - **No trailers**: no Co-Authored-By, no Claude-Session.
  - Structural and behavioural changes go in separate commits. Commit at every GREEN.
- **Before each commit** these must be clean, with no new warnings in test output:
  - `npx vitest run`
  - `npm run lint`
  - `npx vue-tsc --noEmit`
- **No changes for other styles:**
  - minimal, tactile, paper and pixel look and behave exactly as before. Only tests that list every style change for them.
  - After any palette change, `src/style/themes.generated.css` differs from `develop` only by the new tokens' lines and the `cyber` blocks.
- **Exact values:**
  - Style id `cyber`. Theme id `neon` (「霓虹」 / "Neon").
  - Style names 「賽博龐克」 / "Cyberpunk", listed after `pixel`.
  - `STYLE_COLOR_MODES.cyber = ["dark"]`. Not in `STYLE_MODE_NAMES`.
  - Launcher key `cyberNeonDark`. Launcher icons 25 → 26.
- **Palette (dark):**

  | Role | Colour |
  |---|---|
  | Page | `#07070D` |
  | Card | `#0E0F1C` |
  | Text | `#E6F6FF` |
  | Secondary text | `#8EA3BD` |
  | Magenta | `#FF2BD6` |
  | Pink text | `#FF5AE0` |
  | Cyan | `#00F0FF` |
  | Yellow | `#FCEE0A` |
  | Error | `#FF4D6D` |
  | Deep magenta | `#4A0B40` |
  | Deep yellow | `#3A3506` |
  | Deep red | `#4A0A16` |
  | Edge | cyan at 45% over the page |

- **Type:**
  - Orbitron for digits: board, keys, counts.
  - Share Tech Mono for the system voice: timer, notes, HUD tags, Home mark, section labels, group numbers, toasts, version numbers.
  - Everything else uses the system sans stack already in `--font-sans` after Outfit (PingFang TC / Noto Sans TC). Cyber drops Outfit for text.
- **Skin rules** (`src/__tests__/style/styleSheetRules.ts`):
  - Selectors are scoped to `[data-style="cyber"]`, and keyframes are prefixed `cyber-`.
  - No layout properties outside `::before`/`::after`. That includes `letter-spacing` and `font-size`, so the canvas's wide tracking and 56px title are left out.
  - Every animation is stopped in `@media (prefers-reduced-motion: reduce)`.
  - `--*-scale` values stay within 1–1.5.
- **No raw colours in `skin.css`** (`hardcodedColors.test.ts`): only `var(--color-*)` and `color-mix()` of them.
- **No bright solid block carries text,** except the remaining-count badge (yellow, near-black digits).
- **Shared code:** no `cyber` checks inside shared components or theme code. Behaviour hangs off data: `STYLE_COLOR_MODES`, theme counts, tokens and skin hooks.
- **Copy:** Chinese copy follows `CLAUDE.md`. Tests check that switching language changes the screen, never exact wording. The HUD texts (「GRID 9×9」「CELL R4C7」「SYS://SUDOKU」「// MISSION COMPLETE」) are decoration in CSS `content`, the same in both languages, and `aria-hidden` by being pseudo-elements.

## Review Focus

1. **A cold start with cyber saved while the appearance setting is light.** Expected: the first paint is already dark, with `<html class="dark">` and theme-color `#07070D`, and there is no light flash. Paper saved with dark still paints light. *Test in Task 3 (`noFlashScript`).*
2. **Switching style while the appearance setting is light.** Going minimal(light) → cyber → minimal comes back light, because cyber never writes `appearance`. The theme comes back as last chosen. *Test in Task 3 (settings store).*
3. **The installed web app's icon and manifest on cyber.** Expected: they point at `cyberNeonDark` files that exist, not at a missing `cyberNeon`. *Test in Tasks 1 and 3 (`pwaIconKey`, `iconAssets`).*
4. **Decoration over the board or controls.** Scanlines, beam, floor and HUD tags never take taps (`pointer-events: none`), and never sit above the cells' digits. *Sheet test in Task 6.*
5. **The 「CELL」 tag when nothing is selected, or in Walkthrough playback.** The tag is absent rather than showing 「CELL 」 with an empty name. *Tests in Task 5 (attribute absent) and Task 6 (the rule keys on the attribute's presence).*

---

### Task 1: One single-mode mechanism for palettes (structural)

No look changes. Today a theme must have a light palette, and dark is optional. After this task, a theme has a palette for exactly the modes its style lists, and nothing assumes light exists.

**Files:**
- Modify:
  - `src/theme/paletteBuilder.ts`
  - `src/theme/palettes.ts` (`getPalette`)
  - `src/theme/renderThemeCss.ts`
  - `src/theme/launcherIcon.ts` (add `pwaIconKey`)
  - `src/stores/settingsStore.ts` (`applyColorTheme`)
  - `scripts/generate-pwa-icons.ts` (`LIGHT_KEYS` → PWA keys)
  - `index.html` (first-paint script and `barColors` shape)
- Tests:
  - `src/__tests__/theme/palettes.test.ts`, `launcherIcon.test.ts`, `paletteContrast.test.ts` (iterate modes, no `theme.light`)
  - `noFlashScript.test.ts`, the settings store test

**Interfaces:**
- Produces:
  - `ThemePalette = { id: ColorThemeId; light?: Palette; dark?: Palette }`.
  - `lightOnlyThemeBuilder(neutrals, extras?)`, unchanged in signature.
  - `darkOnlyThemeBuilder(darkNeutrals: Neutrals<DarkThemeColors>, darkExtras?: StyleExtras) => (id, dark: DarkThemeColors) => ThemePalette`.
  - `themeBuilder` composes the two private builders `lightPalette` and `darkPalette`.
  - `getPalette(style, themeId, mode)` returns `theme[effectiveColorMode(style, mode)]`. There is no light fallback; a missing palette is a programming error caught by the palettes test.
  - `pwaIconKey(style: StyleId, themeId: ColorThemeId): LauncherIconKey` = `launcherIconKey(style, themeId, effectiveColorMode(style, "light"))`. Installed web apps keep "the light icon, or the only one".
  - `barColors` in `index.html` gives each style the modes it has: `light?: { <theme>: colour }` and `dark?: colour`. The theme list comes from whichever mode is present.

- [ ] **Step 1: Write the failing tests.**
  - `palettes.test.ts`: for every style and theme, `Object.keys` of the theme's palettes (`light`/`dark` that are defined) equals `STYLE_COLOR_MODES[style]` as a set.
  - `launcherIcon.test.ts`:
    - `pwaIconKey("paper", "blueInk") === "paperBlueInk"`
    - `pwaIconKey("minimal", "green") === "green"`
    - `pwaIconKey("pixel", "classic") === "pixelClassic"`
  - Settings store test: `setStyle` puts `manifest-${pwaIconKey(style, theme)}.webmanifest` on the manifest link.
- [ ] **Step 2:** Run them; the `pwaIconKey` tests should fail (not defined).
- [ ] **Step 3: Implement.**
  - Make `light` optional. The checker's errors list every consumer; fix each to ask `STYLE_COLOR_MODES` or `effectiveColorMode`:
    - `renderThemeCss`: render `:root[...]` from `light` when present and `:root.dark[...]` from `dark` when present.
    - The `@theme static` default stays minimal's light.
    - `generate-pwa-icons`: the PWA set is `LAUNCHER_ICONS` keys equal to `pwaIconKey(icon.style, icon.themeId)`.
    - `settingsStore.applyColorTheme` uses `pwaIconKey`.
    - `index.html` reads the new `barColors` shape. A style without `light` is always dark; one without `dark` is always light.
  - Update the comment that says "Missing for a style that is light only".
- [ ] **Step 4: Prove no change.**
  - Run `npm run generate:theme-css` and `npm run generate:icons`.
  - `git diff --stat src/style/themes.generated.css public/` must be empty.
  - Then run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `♻️ refactor: give each theme a palette for exactly the modes its style has`.

### Task 2: Shared tokens for a neon ink, a signal colour and their surfaces

Cyber needs colours no token carries today: pink text on deep magenta, yellow, deep yellow, and cyan washes where other styles tint the primary. These become shared tokens that alias existing ones in every other style, so nothing else changes.

**Files:**
- Modify: `src/theme/paletteBuilder.ts`, `src/style/themes.generated.css` (generated)
- Tests: `palettes.test.ts`, `paletteContrast.test.ts`

**Interfaces:**
- Produces:
  - Tokens appended to `PALETTE_TOKENS`, each an alias:
    - `primary-ink`: the primary as text on `primary-light`. Alias → `primary`.
    - `signal`: the selection and alert yellow. Alias → `highlight`.
    - `signal-surface`: the deep fill behind `signal` text. Alias → `primary-light`.
  - `StyleExtras` also accepts these three and the board tints `cell-selected`, `cell-focus`, `cell-scope`, `cell-pattern`, `cell-peer`. A style may set a tint directly instead of deriving it from the primary.

- [ ] **Step 1: Write the failing tests.**
  - `palettes.test.ts`: for every existing style, theme and mode, `primary-ink === primary`, `signal === highlight`, and `signal-surface === primary-light`.
- [ ] **Step 2:** Run them; they should fail (unknown tokens).
- [ ] **Step 3:** Implement the aliases in `withAliases` and widen `StyleExtras`. Run `npm run generate:theme-css`.
- [ ] **Step 4:** Check the generated diff holds only the three new `--color-*` lines per block. Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: add primary-ink and signal tokens that other styles alias`.

### Task 3: Register `cyber` with its palette, icon and generated assets

Cyberpunk exists and is selectable everywhere, dark only, with the right palette and app icon. The skin is a stub covering only the press hooks the coverage test requires.

**Files:**
- Create:
  - `src/style/styles/cyber/palette.ts`
  - `src/style/styles/cyber/skin.css` (stub)
- Modify:
  - `src/theme/themeIds.ts`, `src/theme/palettes.ts`, `src/style/index.css` (import), `src/theme/styleIcons.ts`
  - `index.html` (`barColors.cyber = { dark: "#07070D" }` plus its theme list as Task 1 shaped it)
  - `src/presentation/i18n/messages/{zh-Hant,en}.ts`: `settings.style.names.cyber` and `settings.colorThemes.neon`
- Generated:
  - `themes.generated.css`
  - `public/*cyberNeonDark*`
  - Android launcher resources and manifest alias, via `generate:launcher-icons`
- Tests:
  - `palettes.test.ts`, `paletteContrast.test.ts`, `launcherIcon.test.ts` (25 → 26)
  - `styleIcons.test.ts`
  - `Appearance.test.ts`, `Settings.test.ts`
  - `styleCoverage.test.ts` (`REQUIRED_SELECTORS.cyber`)
  - `noFlashScript.test.ts`, the settings store test

**Interfaces:**
- Consumes: `darkOnlyThemeBuilder`, `pwaIconKey` (Task 1); the new tokens and extras (Task 2).
- Produces:
  - `STYLE_IDS` ends with `"cyber"`. `THEME_IDS_BY_STYLE.cyber = ["neon"]`.
  - `CYBER_STYLE: StyleDefinition`.
  - The `cyber` case in `styleIconArtwork` / `styleIconForeground` / `styleIconMonochrome`.

- [ ] **Step 1: Write the failing tests.**
  - `palettes.test.ts`: `STYLES.cyber.themes.map(theme => theme.id)` equals `["neon"]`. `getPalette("cyber", "neon", "light")` equals `getPalette("cyber", "neon", "dark")`, and its `background` is `#07070D`.
  - `launcherIcon.test.ts`: 26 icons, including `cyberNeonDark` and no `cyberNeon`. `pwaIconKey("cyber", "neon") === "cyberNeonDark"`.
  - `styleIcons.test.ts`:
    - `styleIconSvg("cyber", palette)` contains `#07070D`, `#FF2BD6`, `#00F0FF` and `#FCEE0A`.
    - The monochrome layer is one colour.
    - The background-pixel sample (5% width, mid-height) is the background.
  - `Appearance.test.ts`: the cards end with `style-option-cyber`. With cyber chosen, the colour-mode control and `appearance-theme-label` are absent.
  - `Settings.test.ts`: with cyber, the appearance row's summary is the style name alone, with no mode or theme label. This is the untested branch noted in the spec.
  - Settings store test (Review Focus 2): with appearance light, minimal → cyber → minimal leaves `appearance` `"light"` and the theme as last chosen.
  - `noFlashScript.test.ts` (Review Focus 1): with saved `{style: "cyber", appearance: "light"}`, the script adds `dark` and sets theme-color `#07070D`. With no appearance it does the same. `{style: "paper", appearance: "dark"}` still paints light.
- [ ] **Step 2:** Run them; they should fail (`cyber` is unknown).
- [ ] **Step 3: Build the palette** with `darkOnlyThemeBuilder` from Global Constraints. Every `PALETTE_TOKENS` entry needs a dark value. The ones that fix the look:
  - Surfaces and text: `background` `#07070D`, `card` `#0E0F1C`, `foreground` `#E6F6FF`, `foreground-secondary` and `note` `#8EA3BD`. `foreground-muted` sits between secondary and the card and still passes.
  - Edge: `border` = cyan mixed 45% over the page (`mixColors`).
  - Primary: `primary` and `primary-hover` `#FF2BD6`, `primary-light` `#4A0B40`, `primary-ink` `#FF5AE0`, `on-primary` `#07070D`.
  - Accent and signal: `accent` `#00F0FF` (player digits), `signal` `#FCEE0A`, `signal-surface` `#3A3506`.
  - Error and danger: `error` and `danger` `#FF4D6D`, `error-surface` `#4A0A16`.
  - Board washes:
    - `highlight` (same digit): magenta at 16% over the card.
    - `cell-selected`: yellow at 10% over the card.
    - `cell-peer` / `cell-scope`: cyan at 7–8% over the card.
    - `cell-pattern`: magenta at 18% over the card.
  - Featured (continue card): `featured` `#4A0B40`, `on-featured` `#E6F6FF`.
  - Toast: `toast` `#0E0F1C`, `on-toast` `#00F0FF`.
  - Scrim: `scrim` near-black.
- [ ] **Step 4: Fit the contrast tests.**
  - Add text pairs limited with `styles: ["cyber"]`, each at `TEXT`:
    - `primary-ink` on `primary-light`
    - `signal` on `signal-surface`
    - `error` on `error-surface`
  - Run `paletteContrast.test.ts` with cyber in.
  - Where a generic rule fails only because cyber's states are washes on one dark panel (for example `LAYER_APART` 1.25 between card, clue cell and highlight), add `exceptIn: ["cyber"]` with a one-line reason naming the rule. Add a `CYBER_BOARD_CASES` placeholder list, whose coverage test expects `cyber/neon/dark`. Task 7 fills it in.
  - Every text pair outside the board must pass as is.
- [ ] **Step 5: Draw the icon.**
  - Port `ICONS['Cyber']` (108×108) into `styleIcons.ts`, scaled to that file's artwork box.
  - Colours come from the palette: `background`, `primary`, `accent`, `signal`.
  - Give the gradient and glow-filter ids a per-call suffix (the 外觀 page renders several icons on one page).
  - Monochrome is the board outline, grid, bar and squares in one colour.
- [ ] **Step 6: Register and generate.**
  - Ids, `STYLES` (key order = `STYLE_IDS`), i18n names, `barColors`.
  - Stub `skin.css` with the four press selectors and a reduced-motion block. `@import` it in `src/style/index.css`.
  - Run `generate:theme-css`, `generate:icons` and `generate:launcher-icons`.
- [ ] **Step 7:** Run the full suite (including `iconAssets`, `launcherIconAssets`, `AndroidManifest`, `noFlashScript`), lint and vue-tsc; all should be green.
- [ ] **Step 8:** Commit `✨ feat: add the cyberpunk style, dark only, with its palette and app icon`.

### Task 4: Cyberpunk fonts

**Files:**
- Modify:
  - `scripts/generate-fonts.ts`, `src/style/fonts.css`
  - `src/style/index.css` (`@theme` stacks `--font-cyber-digits`, `--font-cyber-mono`)
  - `src/presentation/theme/appearanceSync.ts`
  - `src/style/styles/pixel/fonts.ts`, `src/style/styles/paper/fonts.ts` (structural step only)
- Create:
  - `src/style/fontGate.ts` (structural step)
  - `src/style/styles/cyber/fonts.ts`
  - `src/assets/fonts/{orbitron,share-tech-mono}.woff2`
  - `public/fonts/licenses/{Orbitron,ShareTechMono}-OFL.txt`
- Tests:
  - `bundledFonts.test.ts`, `appearanceSync.test.ts`
  - the existing pixel/paper font-gate tests
  - a new `src/__tests__/style/styles/cyber/fonts.test.ts`

**Interfaces:**
- Produces:
  - Structural: `markFontsReady(options: { style: StyleId; datasetKey: string; faces: readonly string[]; sample: string }): (active: boolean) => void`. It holds the shared load-then-mark logic that pixel's and paper's gates duplicate today. `syncPixelFonts` and `syncPaperFonts` keep their names and behaviour, built on it. If paper's gate differs too much to share cleanly, share it with pixel only and say why in the commit.
  - `syncCyberFonts(active: boolean): void`. It sets `data-cyber-fonts="ready"` on `<html>` once Orbitron and Share Tech Mono have loaded. It is wired in `appearanceSync.ts` as `syncCyberFonts(style === "cyber")`.
  - Faces `"Orbitron"` (digits and Latin, weights the skin uses) and `"Share Tech Mono"` (printable ASCII).

- [ ] **Step 1 (structural):**
  - Extract `markFontsReady`, then rebuild `syncPixelFonts` (and `syncPaperFonts` if it fits) on it.
  - The existing font-gate tests pass unchanged. Run the full suite.
  - Commit `♻️ refactor: share the load-then-mark font gate between styles`.
- [ ] **Step 2: Write the failing tests.**
  - `bundledFonts.test.ts`: both faces exist and keep their licence name-table entries. Orbitron covers `0123456789`; Share Tech Mono covers printable ASCII.
  - `fonts.test.ts`: the gate marks only when every face reports `loaded`. It drops the mark when leaving cyber, and does nothing without `document.fonts`.
  - `appearanceSync.test.ts`: with style cyber, `syncCyberFonts` is called with `true`.
- [ ] **Step 3:** Run them; they should fail.
- [ ] **Step 4: Implement.**
  - Add Google Fonts jobs pinned like Press Start 2P's.
  - Add `@font-face` rules with `font-display: swap`.
  - Run `npm run generate:fonts`, and report each subset's size.
- [ ] **Step 5:** Run the full suite, lint, vue-tsc and `npm run build`; all should be green.
- [ ] **Step 6:** Commit `✨ feat: bundle Orbitron and Share Tech Mono for cyberpunk`.

### Task 5: Skin hooks the cyberpunk look needs

Markup-only hooks: no style other than cyber styles them, so nothing changes elsewhere.

**Files:**
- Modify:
  - `src/presentation/pages/game/GameScreen.vue`, `game-review/GameReview.vue`, `solver-walkthrough/SolverWalkthrough.vue` (board attribute)
  - `src/presentation/components/board-cell/cellName.ts` (create)
  - `src/presentation/pages/game/components/GameCompleteModal.vue`
  - `src/presentation/pages/home/Home.vue` (logo)
  - `src/presentation/pages/settings/components/SettingsGroup.vue` (heading)
- Tests:
  - `src/__tests__/presentation/components/board-cell/cellName.test.ts`
  - the three pages' tests
  - `GameCompleteModal` and `Home` tests
  - `skinHooks.test.ts` (it stays green)

**Interfaces:**
- Produces:
  - `cellName(row: number, column: number): string`, for example `cellName(3, 6) === "R4C7"`.
  - Each board element (`data-skin="board"`) carries `data-selected-cell="R4C7"` when a cell is selected, and no attribute otherwise. It is derived from the same selection that sets the cell's `data-selected`.
  - `data-skin` tokens:
    - `celebration` on the completion modal's card (`data-skin="card celebration"`).
    - `tag` on its difficulty chip, and `tag new-record` on its new-record badge.
    - `logo` on Home's 3×3 logo box.
    - `group-heading` on `SettingsGroup`'s title element.

- [ ] **Step 1: Write the failing tests.**
  - `cellName` maps the corners and the centre: (0,0) `R1C1`, (8,8) `R9C9`, (4,4) `R5C5`.
  - Game: select cell (3,6) and the board has `data-selected-cell="R4C7"`. Before any selection the attribute is absent (Review Focus 5).
  - Game Review: stepping to a move sets the attribute to that move's cell.
  - Walkthrough: during playback the attribute is absent.
  - Completion modal, Home and SettingsGroup each render the new tokens.
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3:** Implement. Keep each board's existing selection logic. The attribute is a computed from it, nothing more.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: expose the selected cell and a few more skin hooks for styles to decorate`.

### Task 6: The cyberpunk skin: panels, type, pages, board frame, Home and Settings

**Files:**
- Modify: `src/style/styles/cyber/skin.css`
- Test: `src/__tests__/style/styles/cyber/cyberSkin.test.ts` (new, PostCSS-based like `pixelSkin.test.ts`)

**Interfaces:**
- Consumes:
  - the tokens from Tasks 2–3
  - the font stacks and the `data-cyber-fonts` mark from Task 4
  - the hooks from Task 5
  - the existing tokens `page`, `page-header`, `card`, `button`, `continue`, `new-game`, `tile`, `key`, `control`, `check`, `segmented`, `segmented-indicator`, `pill`, `badge`, `chip`, `title`, `title-glyph`, `board`

- [ ] **Step 1: Write the failing sheet tests.** The cyber sheet:
  - Fonts: under `[data-style="cyber"][data-cyber-fonts="ready"]`, points the digit fonts (`--font-clue`, `--font-entry`, `--font-key`) at the Orbitron stack. It points `--font-timer` and `--font-note` at the Share Tech Mono stack, and the text fonts at a stack without Outfit.
  - Cut corners: gives `card`, `button`, `tile`, `key`, `control`, `segmented`, `pill`, `tag` and `board` a `clip-path: polygon(` on the element or its pseudo-element.
  - Lit pieces: draws pressed or chosen pieces with `var(--color-primary-light)` behind `var(--color-primary-ink)`. These are `[aria-pressed="true"]`, `[aria-checked="true"]`, the chosen segment, `key` when chosen, and `button` in its primary variant. No rule pairs `--color-primary` or `--color-signal` as a background with text on it, except `[data-skin~="badge"]`.
  - Yellow pieces: the hint-mode pill and `tag new-record` use `--color-signal-surface` behind `--color-signal`.
  - Danger: the danger button uses `--color-error-surface` behind `--color-error`, with an error-coloured edge.
  - Pages: `[data-skin~="page"]` decoration pseudo-elements are `position: fixed`, have `pointer-events: none`, and a `z-index` below the content (Review Focus 4).
  - HUD tags: `[data-skin~="board"]::after` has `content` built from `attr(data-selected-cell)`, under a selector requiring `[data-selected-cell]` (Review Focus 5). Both tags are `pointer-events: none`.
  - Settings: `[data-skin~="group-heading"]` uses a CSS counter.
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3: Write the skin from the canvas.**
  - **Panels:**
    - Cut corners on a thin edge (`var(--color-border)` at rest, the primary when lit) around the fill.
    - Where a component already uses `::before`/`::after` (check each in pixel's skin and the component), draw the edge with `clip-path` on the element plus an inset ring through `box-shadow`/`outline`. Accept that the diagonal has no line there.
  - **Header and tags:**
    - Header pills and completion tags as deep fills with their ink.
    - The count badge is a yellow tag with a notched corner.
  - **Board:**
    - A 2px cyan-to-magenta gradient frame with 16px cut corners.
    - Magenta 2px box lines and cyan 1px cell lines at 16%, through the board line variables or an overlay above the cells' background but below their digits.
    - 「GRID 9×9」 on `::before` at the top left and 「CELL 」+name on `::after` at the bottom right, in Share Tech Mono on the page colour.
  - **Pages:**
    - `::before` holds scanlines plus the beam layer; `::after` holds the perspective floor, masked to the bottom of the screen.
    - All stay static in this task; Task 8 animates them.
  - **Home:**
    - `logo` loses its filled square: magenta lit squares on the diagonal, edge-coloured squares elsewhere.
    - 「SYS://SUDOKU」 sits on its `::after` in cyan Share Tech Mono.
    - The title gets a 2px magenta/cyan split shadow, with `title-glyph` `margin-inline` for spacing.
  - **Settings:**
    - Group headings number 01, 02, … on the right in Share Tech Mono.
    - Toggle indicators are short bars that glow in the primary when on.
    - Row separators are dashed `var(--color-border)`.
  - **Glow:** `text-shadow`/`drop-shadow` in the colour of the thing glowing, as on the canvas. Glow never replaces contrast.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: draw cyberpunk's cut-corner panels, HUD board and neon pages`.
- [ ] **Step 6: Visual check.**
  - Run `npm run start` and look at phone width (390×844), in zh-Hant and English, with these screens: Home, Game, Game in hint mode, 外觀, Settings, Statistics, the completion dialog, the new-game dialog.
  - Compare each to the canvas artboard. Report differences and any clipping or overflow, with screenshot paths.
  - Use Chrome DevTools MCP if reachable, else headless Chrome with a temporary profile; state which.

### Task 7: Cell states and the board contrast model

**Files:**
- Modify: `src/style/styles/cyber/skin.css`, `src/__tests__/theme/paletteContrast.test.ts` (`CYBER_BOARD_CASES`)
- Test: `cyberSkin.test.ts`

- [ ] **Step 1: Write the failing tests.**
  - Sheet:
    - `[data-value-kind="entered"]` digits are `var(--color-accent)` with a cyan `text-shadow`.
    - `[data-variant="selected"]` (or `[data-selected]`) draws four corner brackets in `--color-signal` on a pseudo-element, and its digit is `--color-signal`.
    - `[data-variant="same-digit"]` digits are `--color-primary-ink`.
    - Notes with `data-note-highlight` are `--color-primary-ink`.
    - In hint mode (`[data-hint-mode]`), the answer cell has an inset `--color-signal` outline.
    - In the walkthrough and hints, candidate notes are `--color-accent` and eliminated notes `--color-error`.
    - Emphasised notes sit on `--color-primary-light` in `--color-primary-ink`.
  - Contrast: `CYBER_BOARD_CASES` checks the ink actually drawn on the surface actually drawn:
    - Clue `#E6F6FF`, entry `#00F0FF` and note `#8EA3BD` on the card.
    - The selected digit `#FCEE0A` on `cell-selected`.
    - Pink on `highlight`.
    - Each ink on `cell-peer`, `cell-scope` and `cell-pattern`.
    - The error ink on its surface.

    Each reaches 4.5 (3 for the brackets). Its coverage test expects `cyber/neon/dark`.
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3:** Implement from the canvas's `.cell.*`, `.nt.*`, `.cell.h*` rules. Keep `CYBER_BOARD_CASES` in step with what is drawn.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: mark cyberpunk's cells with neon washes, brackets and glow`.

### Task 8: Motion

**Files:**
- Modify: `src/style/styles/cyber/skin.css`
- Test: `cyberSkin.test.ts`, and `useArrivalMotion`'s duration test if it lists styles

- [ ] **Step 1: Write the failing sheet tests.**
  - `.value-arrive` runs a `cyber-glitch` animation on the digit for 550ms or less, with `steps(` timing. A `cyber-scan-down` animation runs on the cell's pseudo-element.
  - `.value-leave` runs `cyber-scan-up` on the cell's pseudo-element.
  - The page beam and floor animate only `transform` or `opacity`; no keyframe in the sheet animates `top`, `left` or `background-position`.
  - The title runs `cyber-title-glitch`.
  - `[data-skin~="celebration"]` gets the turning dashed ring and 「// MISSION COMPLETE」 on its pseudo-elements, with the ring animated by `transform: rotate`.
  - Every animation in the sheet is set to `none` under `prefers-reduced-motion: reduce`, and every animation finishes under `ARRIVAL_SETTLE_MS` except the looping page, title and ring ones.
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3: Implement from the canvas.**
  - Keyframes: `glitchA`, `beamA`, `beamUpA`, `tglitch`, `sweep`, `floor`, `spin`, renamed with the `cyber-` prefix.
  - Convert `top`/`background-position` motion to `translate`.
  - Cell pseudo-element animations settle `arriving`/`leaving` on `animationend` as `CLAUDE.md` describes. Erase on undo, Game Review stepping back and Walkthrough never sticks.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: glitch cyberpunk's digits in and sweep its screens`.

### Task 9: Docs and an on-device check

**Files:** `CLAUDE.md`, `README.md`

- [ ] **Step 1: `CLAUDE.md`.**
  - Add `cyber` to the style-folder list.
  - In "Registering a style", note that `STYLE_COLOR_MODES` may hold one mode, either light or dark. The palette then uses `lightOnlyThemeBuilder` or `darkOnlyThemeBuilder`, and `barColors` gets only that mode.
  - Mention `primary-ink` / `signal` / `signal-surface` beside the other alias tokens if `CLAUDE.md` lists tokens.
- [ ] **Step 2: `README.md`.** Five styles; cyberpunk is dark only with a fixed palette.
- [ ] **Step 3:** Run lint and the full suite; both should be green.
- [ ] **Step 4:** Commit `📄 docs: describe the cyberpunk style and single-mode styles`.
- [ ] **Step 5 (controller): hand an Android emulator check to the peer session "sudoku-app".**
  - Use `npm run android:build:dev`, never a bare `npx cap sync`.
  - It covers:
    - picking cyberpunk with the system in light mode
    - the launcher icon following the style
    - filling and erasing digits
    - the completion dialog
    - English and Chinese
    - scrolling performance on the animated background
  - Report screenshots to the owner.
