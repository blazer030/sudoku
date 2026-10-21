# Redesign Stage 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every UI colour comes from tokens. Dark mode works (system / light / dark, switched live). A "style" skeleton exists with the minimal style as the only entry. All text passes WCAG AA in every style × theme × mode. The minimal style's press feedback is applied to the existing components.

**Architecture:** `src/theme/palettes.ts` is the only place colour values live. A script renders it into `src/style/themes.generated.css`: an `@theme static` block of defaults, plus `:root[data-style][data-color-theme]` and `:root.dark[…]` blocks. A test keeps the generated file in step with the script. A new `startAppearanceSync` (modelled on `startLocaleSync`) owns `<html>`: the `dark` class, `data-style`, `data-color-theme`, the theme-color meta and the Android system bar. A small inline script in `index.html` applies the same attributes before first paint. Press feedback is a `v-press` directive; its motion is CSS scoped to `[data-style="minimal"]` and turned off under reduced motion.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript strict, Tailwind v4 (`@theme`), Pinia, vue-i18n, Vitest + @vue/test-utils (jsdom), Capacitor 8 (`SystemBars` from `@capacitor/core`), tsx for scripts, puppeteer-core for the visual pass.

**Spec:** `docs/superpowers/specs/2026-10-22-redesign-stage1-foundation-design.md` (overview: `docs/superpowers/specs/2026-10-22-redesign-overview-design.md`)

---

## Global Constraints

- Colour values live only in `src/theme/` (TypeScript). `src/style/themes.generated.css` is generated from them and never edited by hand. Run `npm run generate:theme-css` after any palette edit.
- `src/presentation/**/*.{vue,ts}` and `src/style/*.css` (except the generated file) contain no `#` hex colours, no `rgb()`, `rgba()`, `hsl()` or `hsla()`, no `bg-white`, `text-white`, `bg-black` or `text-black`, and no Tailwind built-in palette classes (`bg-gray-100`, `text-red-500` and so on). SVGs use `currentColor` or tokens. Shadows use `--color-shadow` or another token through `color-mix`.
- Contrast is checked for every style × theme × mode: 4.5:1 for normal text, 3:1 for large text and icons. A test enforces it.
- Settings get `appearance: "system" | "light" | "dark"` (default `"system"`) and `style: "minimal"` (default `"minimal"`). Unknown stored values fall back to the default. There is no version bump or migration.
- `system` follows `prefers-color-scheme` live. A manual choice ignores system changes. Every switch takes effect without a restart.
- There is exactly one `theme-color` meta, updated at runtime. Light mode uses the theme's primary colour; dark mode uses the dark `background` token.
- PWA manifests, the splash screen and the desktop/launcher icons are out of scope. `scripts/generate-pwa-icons.ts` and `scripts/generate-launcher-icons.ts` keep their own six colours on purpose, because the overview spec keeps the icons as they are.
- Press feedback is applied on pointerdown and removed on release or cancel. It never delays or blocks input, and it does not use `:active`. Under `prefers-reduced-motion: reduce` there is no scaling, bouncing or sliding; only colour changes remain. Board cells get a colour change only.
- Existing `hover:` variants stay as a fine-pointer extra. Add no new design that depends on hover.
- Layout and features do not change. The appearance switch in Settings is temporary (stage 3 replaces it).
- TDD: one failing test, then the minimum code to pass it, then refactor. Commit after every green step. Structural commits (rename, move, extract; behaviour unchanged) are separate from behavioural ones and say which they are.
- Before every commit, run `npx vitest run && npm run lint && npx vue-tsc --noEmit`. All must pass with zero warnings.
- Commit messages are English Conventional Commits with an emoji (🐛 ✨ ♻️ 🧪 📄 🚧). No `Co-Authored-By` or any other trailer.
- `src/domain/` never imports from application, presentation or stores. Files under `src/theme/` use **relative** imports only, so `scripts/` (tsconfig.node, no `@/` paths) can import them.
- No abbreviated identifiers (`row`/`column`, not `r`/`c`; no `i`, `idx`, `el`, `ctx`). Comments are in English.
- User-facing copy exists in both `en` and `zh-Hant`. The zh text follows `docs/superpowers/specs/2026-10-21-i18n-zh-hant-design.md`: row = 列, column = 欄, 「遊戲」 not 「對局」.
- Everything must work at 360px phone width.

## Review Focus

These are the five real-world inputs most likely to break this stage. Each maps to a named test.

1. **A stored `colorTheme` the palette does not know** (hand-edited, or a future style's theme id). If nothing normalises it, no `[data-color-theme]` block matches and dark mode falls back to the light `@theme` defaults, which gives white surfaces. Covered by Task 1 "should normalize an unknown stored colorTheme to green" and Task 2 "getPalette falls back to the style's first theme".
2. **Startup environments with gaps**: no `window.matchMedia` (jsdom, an old WebView) or corrupt `sudoku-settings` JSON. The sync, the inline script and the directive must not throw. Covered by Task 5 "should treat a missing matchMedia as a light system", Task 6 "should ignore corrupt stored settings" and "should survive a missing matchMedia", and Task 8 "should press without matchMedia".
3. **A press released somewhere other than the element**: the finger slides off and lifts, a scroll fires `pointercancel`, or a dialog button unmounts its own dialog mid-press. Either `is-pressed` sticks or window listeners leak. Covered by Task 8 "should release when the pointer lifts outside the element", "should release on pointercancel" and "should drop window listeners when unmounted mid-press".
4. **Long press and rapid taps on board cells once the tint feedback is on.** A long press must still fire exactly once, the click after it must stay suppressed, and two quick taps on different cells must both register. Covered by Task 8b "should still long-press a cell with press feedback" and "should register quick taps on two cells".
5. **Moving from a manual choice back to `system`.** The change must resolve against the *current* system preference, not the one seen at startup, and while a manual mode is set, system changes must be ignored. Covered by Task 5 "should pick up the current system mode when switching back to system" and "should ignore system changes while a mode is chosen".

---

### Task 1: Appearance and style settings

**Files:**
- Modify: `src/application/SettingsStorage.ts`, `src/stores/settingsStore.ts`
- Test: `src/__tests__/application/SettingsStorage.test.ts`, `src/__tests__/stores/settingsStore.test.ts`

**Interfaces (Produces):**
```ts
// SettingsStorage.ts
export const COLOR_THEME_IDS = ["green", "blue", "purple", "orange", "pink", "teal"] as const;
export type ColorThemeId = typeof COLOR_THEME_IDS[number];
export const APPEARANCES = ["system", "light", "dark"] as const;
export type Appearance = typeof APPEARANCES[number];
export type ColorMode = Exclude<Appearance, "system">;
export const STYLE_IDS = ["minimal"] as const;
export type StyleId = typeof STYLE_IDS[number];
// Settings gains: appearance: Appearance; style: StyleId
// settingsStore gains: appearance: Ref<Appearance>, style: Ref<StyleId>, setAppearance(value: Appearance): void
```

- [ ] **Step 1: Write the failing tests** in `SettingsStorage.test.ts`:
  - Update "should return default settings…" so `toEqual` includes `appearance: "system", style: "minimal"`, and add both fields to the "should restore saved settings" round trip (`appearance: "dark"`).
  - `it("should default appearance and style for settings saved before they existed")`: store `{ colorTheme: "blue", language: "en" }`. Expect `appearance` `"system"`, `style` `"minimal"` and `colorTheme` `"blue"`.
  - `it("should normalize an unknown stored appearance to system")`: store `{ appearance: "sepia" }`. Expect `"system"`.
  - `it("should normalize an unknown stored style to minimal")`: store `{ style: "neon" }`. Expect `"minimal"`.
  - `it("should normalize an unknown stored colorTheme to green")`: store `{ colorTheme: "red" }`. Expect `"green"`.

  In `settingsStore.test.ts`:
  - Extend the defaults test with `store.appearance` `"system"` and `store.style` `"minimal"`.
  - `it("should persist appearance change and restore it in a new store")`: call `setAppearance("dark")`. The stored JSON has `appearance === "dark"`, and a fresh pinia's store reads `"dark"`.
- [ ] **Step 2:** Run `npx vitest run src/__tests__/application/SettingsStorage.test.ts src/__tests__/stores/settingsStore.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.** Add the constants and fields. In `loadSettings`, normalise all three with the same `includes` guard as `language`. In the store, add the refs, `setAppearance` and the two fields in `persistAll`. `style` has no setter yet.
- [ ] **Step 4:** Run the same command again. Expect PASS. Then run the full gate.
- [ ] **Step 5: Commit** `✨ feat: add appearance and style settings with safe fallbacks`

---

### Task 2: Palette source of truth and generated theme CSS (structural)

Behaviour is unchanged: the light values are exactly today's effective per-theme values, which are the base `@theme` values with each `[data-color-theme]` block's overrides merged on top. The unused `accent-hover` and `highlight-strong` are dropped. For now `dark` is a copy of `light`, because nothing sets `.dark` until Task 5 and Task 4 replaces it.

**Files:**
- Create: `src/theme/palettes.ts`, `src/theme/renderThemeCss.ts`, `scripts/generate-theme-css.ts`, `src/style/themes.generated.css` (generated)
- Modify: `src/style/index.css`, `src/theme/themeConfig.ts`, `src/application/PwaThemeUpdater.ts`, `package.json` (script `"generate:theme-css": "npx tsx scripts/generate-theme-css.ts"`)
- Test: `src/__tests__/theme/palettes.test.ts`, `src/__tests__/theme/themesGenerated.test.ts`, `src/__tests__/application/PwaThemeUpdater.test.ts`

**Interfaces (Produces):**
```ts
// palettes.ts (relative imports only)
export const PALETTE_TOKENS = ["background", "card", "border", "foreground", "foreground-secondary", "foreground-muted",
    "primary", "primary-hover", "primary-light", "accent", "highlight", "cell-clue",
    "danger", "danger-hover", "error", "error-light", "shadow"] as const;   // Task 3 extends this list
export type PaletteToken = typeof PALETTE_TOKENS[number];
export type Palette = Record<PaletteToken, string>;          // "#RRGGBB", upper case
export interface ThemePalette { id: ColorThemeId; light: Palette; dark: Palette }
export interface StyleDefinition { id: StyleId; themes: readonly ThemePalette[] }
export const STYLES: Record<StyleId, StyleDefinition>;
export const DEFAULT_STYLE_ID: StyleId;          // "minimal"
export const getPalette: (style: StyleId, themeId: ColorThemeId, mode: ColorMode) => Palette; // unknown id → style's first theme
// renderThemeCss.ts
export const renderThemeCss: () => string;
// themeConfig.ts — THEMES keeps its shape ({ id, primary, accent }) and is derived from STYLES.minimal light palettes
```

**Generated CSS format:**
- The file starts with the header comment `/* Generated from src/theme/palettes.ts by npm run generate:theme-css. Do not edit. */`.
- Next comes `@theme static { … }`, holding the default style's first theme in light mode.
- Then, for each style and each theme, a `:root[data-style="minimal"][data-color-theme="green"] { … }` block followed by a `:root.dark[data-style="minimal"][data-color-theme="green"] { … }` block.
- Each declaration is `--color-<token>: <value>;`. Tokens follow `PALETTE_TOKENS` order, indentation is 4 spaces, there is one blank line between blocks, and the file ends with a trailing newline.
- `@theme static` is required because some tokens (`shadow`) are referenced only from CSS. The theme blocks are unlayered, so they beat Tailwind's `@layer theme` defaults.

- [ ] **Step 1: Write the failing tests.**
  - `palettes.test.ts`:
    - `STYLES.minimal.themes.map(theme => theme.id)` equals `[...COLOR_THEME_IDS]`.
    - Every value in every light and dark palette matches `/^#[0-9A-F]{6}$/`.
    - `getPalette("minimal", "blue", "light").primary` is `"#4A7AB5"`, and `getPalette("minimal", "blue", "light").highlight` is `"#E4EFF9"` (an override merged over the base).
    - `it("getPalette falls back to the style's first theme")`: `getPalette("minimal", "red" as ColorThemeId, "light")` equals `getPalette("minimal", "green", "light")`.
  - `themesGenerated.test.ts`:
    - `readFileSync("src/style/themes.generated.css", "utf8")` equals `renderThemeCss()`.
    - `renderThemeCss()` contains `':root.dark[data-style="minimal"][data-color-theme="teal"] {'` and `"--color-primary: #4A9A9A;"`.
  - `PwaThemeUpdater.test.ts`: the blue assertion becomes `toBe(getPalette("minimal", "blue", "light").primary)`.
- [ ] **Step 2:** Run `npx vitest run src/__tests__/theme`. Expect FAIL (the modules do not exist).
- [ ] **Step 3: Implement.**
  - Build `palettes.ts` from today's `index.css` values.
  - The script writes `renderThemeCss()` to `src/style/themes.generated.css`. Run `npm run generate:theme-css`.
  - In `index.css`:
    - Add `@import "./themes.generated.css";` right after `@import "tailwindcss";`.
    - Delete every `--color-*` line from `@theme` and all six `[data-color-theme]` blocks.
    - Rewrite the shadows with `color-mix(in srgb, var(--color-…) N%, transparent)`:
      - card shadows: `shadow` at 3%
      - `primary-*`: `primary` at 19%, `primary-active` at 25%
      - `accent`: `accent` at 19%
      - `danger`: `danger` at 19%
      - `popup` and `modal`: `shadow` at 12.5%
    - Set the scrollbar thumb to `foreground` at 18% and 32%.
  - `themeConfig.ts` and `PwaThemeUpdater.ts` read `getPalette` / `STYLES`.
- [ ] **Step 4:** Run the full gate. Expect PASS. Then run `npm run build` and confirm `dist/assets/*.css` contains `[data-color-theme=green]` and `--color-shadow`.
- [ ] **Step 5: Commit** `♻️ refactor: generate theme CSS from a TypeScript palette source`

---

### Task 3: Semantic tokens for every hard-coded colour, plus the hard-coded colour check (structural in light mode)

Light values are chosen so that light mode looks the same as before. Task 4 retunes them for contrast.

**New tokens** (append to `PALETTE_TOKENS`; rename `error-light` → `error-surface`):

| token | replaces | light value now |
|---|---|---|
| `on-primary` | `text-white` / `bg-white` on primary surfaces, the logo tiles, digit-key badges | `#FFFFFF` |
| `on-danger` | `text-white` on `bg-danger` | `#FFFFFF` |
| `note` | `text-foreground-muted` on player notes in `BoardCell.noteClass` | the theme's `foreground-muted` |
| `cell-focus` / `cell-scope` / `cell-pattern` | `bg-primary/40`, `/15`, `/30` in `BoardCell.VARIANT_BACKGROUNDS` | primary blended over card at 40% / 15% / 30% (sRGB, computed once into hex) |
| `scrim` | `bg-black/NN` overlays, PuzzleLoader's `rgba(0, 0, 0, 0.3)` → `bg-scrim/30` | `#000000` |
| `on-scrim` | PuzzleLoader's `text-white/80` → `text-on-scrim` | `#FFFFFF` |

Each remaining offender gets one of these replacements:

| offender | replacement |
|---|---|
| `bg-[#FFF3E0]` icon tiles (NewGameDialog, ClearRecordsDialog) | `bg-danger/10` |
| Settings toggle knobs `bg-white` | `bg-card` |
| colour-swatch check icon | `text-on-primary` |
| DigitPad badge (selected) `bg-white text-primary` | `bg-on-primary text-primary` |
| DigitPad badge (unselected) `bg-foreground-secondary text-white` | `bg-foreground-secondary text-card` |
| ContinueButton / HintPanel `bg-white/20` | `bg-on-primary/20` |
| HintPanel mask `#000` | `black`, with the comment "mask only reads alpha" |
| `FireworkCanvas` colours | move to `src/theme/fireworkColors.ts` as `FIREWORK_COLORS: readonly string[]` (same values) |

**Files:**
- Create: `src/theme/fireworkColors.ts`, `src/__tests__/style/hardcodedColors.test.ts`
- Modify: `src/theme/palettes.ts`, `src/style/themes.generated.css` (regenerate), and every file the offender scan lists: BoardCell, DigitPad, ContinueButton, PlaybackControls, PuzzleLoader, NewGameDialog, ClearRecordsDialog, Settings, Home, Donate, DonateSuccess, SolverWalkthrough, GameCompleteModal, FireworkCanvas, GameHeader, HintMenuPopup, LeaveGameDialog and HintPanel.
- Test: `src/__tests__/presentation/BoardCell.test.ts`, `Cell.test.ts`, `Game.test.ts` (class names `bg-error-light` → `bg-error-surface`, `bg-primary/40` → `bg-cell-focus` and so on)

- [ ] **Step 1: Write the failing test** `hardcodedColors.test.ts`:
  - Walk `src/presentation` (`.vue`, `.ts`) and `src/style` (`.css`), skipping `themes.generated.css`.
  - Collect `file:line: match` for each pattern below, then `expect(offenders).toEqual([])`:
    - `/(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/`
    - `/\b(?:rgba?|hsla?)\(/`
    - `/\b(?:bg|text)-(?:white|black)\b/`
    - `/\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|shadow|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/`
  - Also add a self-check: run the matcher on `'class="bg-gray-100 text-white" style="color: #fff"'` and expect 3 hits.
- [ ] **Step 2:** Run `npx vitest run src/__tests__/style`. Expect FAIL, listing roughly 45 offenders.
- [ ] **Step 3: Implement** the token additions and replacements above, then regenerate the CSS. Update the BoardCell, Cell and Game tests for the renamed classes (mechanical).
- [ ] **Step 4:** Run the full gate. Expect PASS. Run `npm run start` and compare the home and game screens against `main` once in green light mode. They should be pixel-equivalent apart from blend rounding.
- [ ] **Step 5: Commit** `♻️ refactor: route every hard-coded color through semantic tokens`

---

### Task 4: Contrast test, dark palettes and light retuning (behavioural)

**Files:**
- Create: `src/theme/contrast.ts`, `src/__tests__/theme/contrast.test.ts`, `src/__tests__/theme/paletteContrast.test.ts`
- Modify: `src/theme/palettes.ts`, `src/style/themes.generated.css` (regenerate)

**Interfaces (Produces):**
```ts
export const contrastRatio: (foreground: string, background: string) => number;  // WCAG 2.x relative luminance
export const mixColors: (color: string, alpha: number, base: string) => string;   // sRGB blend → "#RRGGBB"
```

**Pairs checked for each style × theme × mode.** These are decisions; keep them as data in the test:
- **Text at 4.5:**
  - `foreground` on `background`, `card` and `cell-clue`
  - `foreground-secondary` and `foreground-muted` on `background` and `card`
  - `on-primary` on `primary` and `primary-hover`
  - `on-danger` on `danger` and `danger-hover`
  - `primary`, `accent` and `danger` on `background` and `card`
  - `error` on `card` and `error-surface`
  - `primary` on `primary-light` (statistics and review badges, hint step button)
- **Board at 4.5:** every surface in `["card", "cell-clue", "primary-light", "highlight", "cell-focus", "cell-scope", "cell-pattern", "error-surface"]` × every ink in `["foreground", "primary", "error", "note"]`.
- **Tinted surfaces** (blended with `mixColors`):
  - `accent` on accent 10% over `card`: 4.5
  - `accent` on accent 15% over `card`: 3, for the icon
  - `danger` on danger 10% over `card`: 3, for the icon
  - `on-scrim` on scrim 65% over `background`: 4.5, for the loader text over stacked overlays

**Dark palette direction** (actual values are the implementer's, but they must pass the test and look coherent in Task 11):
- Neutrals start from the style reference's direction C: `background #111110`, `card #1D1D1B`, `foreground #F3F2EE`, `border #2D2D2A`.
- Primaries and accents become lighter tints with a dark `on-primary` where needed.
- Cell tints are dark tints of primary. `shadow` is `#000000`.

Light mode must change too. Today, for example:
- `foreground-muted` on `card` is 2.78
- white on orange or teal primary is 3.28
- `accent` on `card` is 2.48 in green
- `error` on `error-light` is 2.60

Darken those inks or lighten those surfaces, and keep each theme's hue.

- [ ] **Step 1: Write the failing tests.**
  - `contrast.test.ts`:
    - `contrastRatio("#000000", "#FFFFFF")` is `21`.
    - `contrastRatio("#777777", "#FFFFFF")` is close to `4.48` (2 digits).
    - The ratio is symmetric.
    - `mixColors("#000000", 0.5, "#FFFFFF")` is `"#808080"`.
  - `paletteContrast.test.ts` uses `it.each` over generated cases named like `"minimal/teal/dark: note on cell-scope ≥ 4.5"` and expects `contrastRatio(...) >= minimum`.
- [ ] **Step 2:** Run `npx vitest run src/__tests__/theme`. Expect FAIL in many light cases and in all dark cases that are still copies of light, such as `on-primary` and on-scrim.
- [ ] **Step 3: Implement** `contrast.ts`. Tune the light values and write the dark palettes until every case passes, then regenerate the CSS.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add dark palettes and meet WCAG AA contrast in every theme`

---

### Task 5: Appearance sync

**Files:**
- Create: `src/presentation/theme/appearanceSync.ts`, `src/__tests__/presentation/theme/appearanceSync.test.ts`
- Modify: `src/stores/settingsStore.ts`, `src/application/PwaThemeUpdater.ts`, `src/theme/palettes.ts`, `src/style/index.css`, `src/main.ts`
- Test: `src/__tests__/stores/settingsStore.test.ts`, `src/__tests__/application/PwaThemeUpdater.test.ts`, `src/__tests__/theme/palettes.test.ts`

**Interfaces (Produces):**
```ts
export interface AppearanceSources { appearance: Ref<Appearance>; style: Ref<StyleId>; colorTheme: Ref<ColorThemeId> }
export const resolveColorMode: (appearance: Appearance, systemPrefersDark: boolean) => ColorMode;
export const startAppearanceSync: (sources: AppearanceSources) => () => void;   // Task 7 adds a SystemBarService parameter
// palettes.ts
export const systemBarColor: (style: StyleId, themeId: ColorThemeId, mode: ColorMode) => string; // light → primary, dark → background
// PwaThemeUpdater.ts — signature changes
export const updateMetaThemeColor: (color: string) => void;
```

**5a, structural:** move `document.documentElement.dataset.colorTheme = id` and the meta update out of `settingsStore.applyColorTheme` into `startAppearanceSync`.
- The store keeps favicon, manifest, apple-touch icon and the icon service.
- `main.ts` calls `startAppearanceSync(storeToRefs(settingsStore))` right after `useSettingsStore().setIconService(icon)` and before the awaits.

- [ ] **Step 1:**
  - Move the store tests "should set data-color-theme…", "should update data-color-theme…" and the `updateMetaThemeColor` expectation into `appearanceSync.test.ts`, written against `startAppearanceSync` with plain refs. The colour expected is `getPalette("minimal", "purple", "light").primary`.
  - Change the `PwaThemeUpdater` test to `updateMetaThemeColor("#123456")` → `meta.content === "#123456"`.
- [ ] **Step 2:** Run the new test file. Expect FAIL.
- [ ] **Step 3:** Implement the move. Use `watch([...], apply, { immediate: true })` like `startLocaleSync`. Add `systemBarColor`.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `♻️ refactor: move html theme attributes out of the settings store`

**5b, behavioural:** add the dark class, `data-style` and system following.
- [ ] **Step 1: Write the failing tests.**
  - Shared setup: a `mockSystemDark(initial)` helper uses `vi.stubGlobal("matchMedia", …)` and returns `setSystemDark(value)`, which flips `.matches` and calls the registered `change` listeners. `afterEach`: `stop()`, `vi.unstubAllGlobals()`, and reset `documentElement.className` and its dataset.
  - `resolveColorMode`: `("system", true)` → `"dark"`, `("system", false)` → `"light"`, `("light", true)` → `"light"`, `("dark", false)` → `"dark"`.
  - `it("should apply the system mode immediately")`: system dark plus `"system"` → `classList.contains("dark")` is true, `dataset.style` is `"minimal"`, and `dataset.colorTheme` is `"green"`.
  - `it("should switch when the appearance changes")`: `appearance.value = "light"`, then `await nextTick()` → no `dark` class.
  - `it("should follow system changes while appearance is system")`.
  - `it("should ignore system changes while a mode is chosen")`: `"dark"`, then `setSystemDark(false)` → still dark.
  - `it("should pick up the current system mode when switching back to system")`:
    - Start `"dark"` with the system dark.
    - `setSystemDark(false)`.
    - `appearance.value = "system"` → no `dark` class.
  - `it("should set theme-color to the dark background in dark mode")`: `meta.content === getPalette("minimal", "green", "dark").background`.
  - `it("should treat a missing matchMedia as a light system")`: `vi.stubGlobal("matchMedia", undefined)` → no throw, no `dark` class.
  - `it("should stop following the system after stop")`.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
  - Guard with `typeof window.matchMedia === "function"`.
  - Toggle `dark` with `classList.toggle("dark", mode === "dark")`.
  - Add `:root { color-scheme: light; } :root.dark { color-scheme: dark; }` to `index.css`.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: apply light, dark or system appearance to the page`

---

### Task 6: No light flash on load

**Files:**
- Modify: `index.html` (an inline `<script>` in `<head>`, before the stylesheet links), `src/application/SettingsStorage.ts` (comment only)
- Test: `src/__tests__/presentation/theme/noFlashScript.test.ts`

The script reads `localStorage["sudoku-settings"]` inside `try/catch` and sets:
- `data-style`: the stored value or `"minimal"`
- `data-color-theme`: the stored value or `"green"`
- the `dark` class: when `appearance === "dark"`, or when `appearance !== "light"` and `matchMedia("(prefers-color-scheme: dark)").matches` (guarding that `matchMedia` exists)

Unknown appearance values count as `system`, which matches `loadSettings`. Add comments on both sides: the script says "mirrors loadSettings() and resolveColorMode()", and `SettingsStorage.ts` says "index.html's inline script reads these fields too".

- [ ] **Step 1: Write the failing tests.**
  - Extract the first `<script>` without attributes from `readFileSync("index.html", "utf8")` and run it with `new Function(code)()`, using one `eslint-disable-next-line @typescript-eslint/no-implied-eval` that gives the reason.
  - Cases:
    - stored `{ appearance: "dark", colorTheme: "blue" }` → `dark` class, `dataset.colorTheme === "blue"`, `dataset.style === "minimal"`
    - `"system"` with the system dark → `dark` class
    - `"light"` with the system dark → no `dark` class
    - nothing stored with the system light → no class, `"green"`
    - `it("should ignore corrupt stored settings")`: stored `"{"` → no throw, no class
    - `it("should survive a missing matchMedia")`
- [ ] **Step 2:** Run the file. Expect FAIL (no script found).
- [ ] **Step 3: Implement** the script. Keep it tiny and ES5-safe.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: apply dark mode before first paint`

---

### Task 7: Android system bars follow the mode

Decision: use `SystemBars.setStyle` from `@capacitor/core` 8 (already installed), with no new dependency. Under Capacitor 8's edge-to-edge layout, the bars show the page's own `background` token, so only icon contrast needs setting. Use `Dark` (light icons) for dark mode and `Light` for light mode.

**Files:**
- Create: `src/application/systemBar/SystemBarService.ts`, `src/infrastructure/systemBar/CapacitorSystemBarAdapter.ts`, `src/infrastructure/systemBar/NoopSystemBarAdapter.ts`
- Modify: `src/presentation/theme/appearanceSync.ts`, `src/main.ts`
- Test: `src/__tests__/infrastructure/systemBar/CapacitorSystemBarAdapter.test.ts`, `src/__tests__/presentation/theme/appearanceSync.test.ts`

**Interfaces:**
```ts
export interface SystemBarService { apply(mode: ColorMode): Promise<void> }
export class CapacitorSystemBarAdapter implements SystemBarService {}   // never rejects
export class NoopSystemBarAdapter implements SystemBarService {}
export const startAppearanceSync: (sources: AppearanceSources, systemBar: SystemBarService) => () => void;
```

- [ ] **Step 1: Write the failing tests.**
  - The adapter test mocks `@capacitor/core` with `importOriginal`, spreading the original and replacing `SystemBars` with `{ setStyle: vi.fn() }`.
    - `apply("dark")` → `setStyle({ style: SystemBarsStyle.Dark })`
    - `apply("light")` → `SystemBarsStyle.Light`
    - when `setStyle` rejects, `apply` resolves
  - Sync tests pass a fake service and assert `apply` gets `"dark"` after a switch to `"dark"`.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.** `main.ts` picks the adapter with `Capacitor.isNativePlatform()`, like the other services.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: match Android system bar icons to the appearance`

---

### Task 8: `v-press` directive and the minimal-style press CSS

**Files:**
- Create: `src/presentation/directives/press.ts`, `src/presentation/composables/prefersReducedMotion.ts`, `src/__tests__/presentation/directives/press.test.ts`
- Modify: `src/style/index.css`

**Interfaces:**
```ts
export const prefersReducedMotion: () => boolean;  // false when matchMedia is missing
export type PressFeedback = "scale" | "bounce" | "tint";
export const vPress: Directive<HTMLElement, undefined, string, PressFeedback>;  // v-press (scale), v-press:bounce, v-press:tint
```

**Behaviour:**
- On `pointerdown` with `event.button <= 0`, if the element is neither `:disabled` nor `aria-disabled="true"`:
  - Add `is-pressed`.
  - For `scale` and `bounce`, when motion is allowed, also add `press-motion`.
  - Register `pointerup` and `pointercancel` listeners on `window`.
- On release, remove `is-pressed`. For `bounce` with motion allowed, add `press-bounce-release` and remove it on `animationend`.
- Unmounting removes the window listeners.
- The directive never touches click handling.

**CSS:** put it under a `/* Press feedback — minimal style */` section, with every rule scoped by `[data-style="minimal"]`:
- `.is-pressed` gets an overlay `background-image: linear-gradient(var(--press-overlay), var(--press-overlay))` with `--press-overlay: color-mix(in srgb, var(--color-foreground) 8%, transparent)`. This is a colour change, so it stays on under reduced motion.
- `.press-motion` sets `transition-property: transform, background-color, color, box-shadow, opacity` and `transition-duration: 220ms`, with the timing function `cubic-bezier(0.34, 1.4, 0.64, 1)`. These must also override `transition-all`, which this selector does by specificity.
- `.press-motion.is-pressed` sets `transform: scale(0.96)` with a `90ms` ease-out.
- `.press-bounce-release` runs `press-bounce` for 260ms, with keyframes `0% scale(0.96)`, `45% scale(1.04)`, `75% scale(0.99)`, `100% scale(1)`.
- An `@media (prefers-reduced-motion: reduce)` block sets `transform: none` and `animation: none` on all three, as a backstop to the JS check.

- [ ] **Step 1: Write the failing tests.** Use a test-local component built with `defineComponent` + `withDirectives(h("button", { onClick }), [[vPress, undefined, arg]])`. Do not compile a runtime template.
  - `it("should add is-pressed and press-motion on pointerdown")`
  - `it("should release when the pointer lifts outside the element")`: dispatch `pointerup` on `window` → no `is-pressed`.
  - `it("should release on pointercancel")`
  - `it("should drop window listeners when unmounted mid-press")`: spy on `window.removeEventListener` for `"pointerup"` and `"pointercancel"`.
  - `it("should not add motion classes under reduced motion")`: stub `matchMedia` with `matches: true` for `"(prefers-reduced-motion: reduce)"` → `is-pressed` present, `press-motion` absent, and no `press-bounce-release` after release for `bounce`.
  - `it("should add press-bounce-release on release and clear it on animationend")`
  - `it("should never add press-motion for tint")`
  - `it("should ignore a disabled button")`
  - `it("should call the click handler without waiting for the animation")`: pointerdown, then click → the handler was called once, synchronously.
  - `it("should press without matchMedia")`
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement** the directive, the helper and the CSS.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add press feedback directive for the minimal style`

**8b, apply it.** Import `vPress` locally in each component. It is not registered globally, because the tests mount components without `main.ts`.

| Where | Variant |
|---|---|
| ContinueButton, the Home new-game button and the Home settings / walkthrough / statistics buttons | `v-press` |
| ControlButton (game control bar) | `v-press` |
| HintMenuPopup options | `v-press` |
| HintPanel buttons (drop `active:scale-[0.98]`) | `v-press` |
| NewGameDialog, ClearRecordsDialog, LeaveGameDialog and GameCompleteModal buttons | `v-press` |
| DigitPad digit keys and the erase key | `v-press:bounce` |
| game `Cell` (on the `BoardCell` root) | `v-press:tint` |

- [ ] **Step 1: Write the failing tests.**
  - `Game.test.ts`:
    - pointerdown on `number-4` → `is-pressed` and `press-motion`. After `window` `pointerup` → `press-bounce-release`.
    - pointerdown on an empty cell → `is-pressed`, and no `press-motion`.
    - `it("should still long-press a cell with press feedback")`: fake timers. Hold past the long-press delay, then pointerup and click → `longPress` was emitted once and no normal input happened, which is today's expectation from `useLongPress`.
    - `it("should register quick taps on two cells")`: pointerdown, pointerup and click on cell A then cell B within 50ms → B ends up selected.
  - `Home.test.ts`: pointerdown on `new-game-button` → `is-pressed`.
- [ ] **Step 2:** Run those files. Expect FAIL.
- [ ] **Step 3:** Apply the directive per the table.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: apply press feedback to buttons, digit keys and cells`

---

### Task 9: Shared `SegmentedControl` with a sliding indicator

**Files:**
- Create: `src/presentation/components/segmented-control/SegmentedControl.vue`, `src/__tests__/presentation/components/segmented-control/SegmentedControl.test.ts`
- Modify: `src/presentation/components/difficulty-switcher/DifficultySwitcher.vue` (a thin wrapper around SegmentedControl), `src/presentation/pages/settings/Settings.vue` (language)

**Interfaces:**
```ts
// <script setup lang="ts" generic="Value extends string">
export interface SegmentedOption<Value extends string> { value: Value; label: string }
// props: options: readonly SegmentedOption<Value>[]; modelValue: Value; testIdPrefix: string
// emits: "update:modelValue": [value: Value]
// DOM:
//   root: the caller's data-testid (fallthrough); the container keeps today's look
//     (h-12 bg-card rounded-button shadow-card p-1, relative)
//   buttons: data-testid `${testIdPrefix}-${value}`, aria-pressed, v-press,
//     text-on-primary font-semibold when selected, text-foreground-secondary otherwise
//   indicator: data-testid="segmented-indicator", absolute top-1 bottom-1 left-1 rounded-icon bg-primary shadow-primary-sm,
//     style width `calc((100% - 0.5rem) / ${options.length})`, transform `translateX(${selectedIndex * 100}%)`,
//     class segmented-indicator-motion (transform 250ms cubic-bezier(0.34, 1.4, 0.64, 1), scoped to [data-style="minimal"]) unless prefersReducedMotion();
//     not rendered when modelValue is not among the options
```

**9a, structural:** extract SegmentedControl with today's per-button `bg-primary` look and no indicator, then switch DifficultySwitcher and the language switch to it. The existing DifficultySwitcher and Settings tests stay green unchanged, including `language-*` and `aria-pressed`.
- [ ] **Step 1:** Write `SegmentedControl.test.ts` cases:
  - It renders `${prefix}-${value}` buttons with labels.
  - The selected button has `aria-pressed="true"`.
  - A click emits `update:modelValue` with that value.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3:** Implement the component and switch both callers to it.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `♻️ refactor: share one SegmentedControl for difficulty and language`

**9b, behavioural:** add the sliding indicator.
- [ ] **Step 1: Write the failing tests.**
  - With three options and the third selected, the indicator style has `transform: translateX(200%)` and `width: calc((100% - 0.5rem) / 3)`.
  - Changing `modelValue` to the first option gives `translateX(0%)`.
  - The `segmented-indicator-motion` class is present by default and absent under a reduced-motion `matchMedia` stub.
  - With a `modelValue` that is not in the options, there is no indicator.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3:** Implement. The buttons drop their own `bg-primary`, and labels sit above the indicator (`relative z-10`).
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: slide the segmented control indicator between options`

---

### Task 10: Temporary appearance switch in Settings

**Files:**
- Modify: `src/presentation/pages/settings/Settings.vue`, `src/presentation/i18n/messages/en.ts`, `src/presentation/i18n/messages/zh-Hant.ts`
- Test: `src/__tests__/presentation/pages/settings/Settings.test.ts`

Copy goes under `settings.colorMode`:

| key | en | zh-Hant |
|---|---|---|
| `label` | "Color mode" | 「深淺色」 |
| `system` | "System" | 「跟隨系統」 |
| `light` | "Light" | 「淺色」 |
| `dark` | "Dark" | 「深色」 |

Place it at the top of the 外觀 card, above 色彩主題: a `text-[15px] font-medium` label, then a full-width `SegmentedControl` with `data-testid="appearance-switcher"` and `test-id-prefix="appearance"`.

- [ ] **Step 1: Write the failing tests.**
  - The English labels of `appearance-system`, `appearance-light` and `appearance-dark` are "System", "Light" and "Dark". After switching the locale to zh-Hant they are 「跟隨系統」「淺色」「深色」.
  - `appearance-system` has `aria-pressed="true"` by default.
  - A click on `appearance-dark` → `useSettingsStore().appearance === "dark"`, and the stored JSON has `appearance` `"dark"`.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add a temporary light and dark switch to settings`

---

### Task 11: Real-browser visual pass (360×780)

**Files:** scripts only, in `/private/tmp/claude-501/-Users-ethan-Project-sudoku/8581f059-8ad5-412a-943e-1b0b712810ab/scratchpad/shots/`, for example `stage1.mjs`. Reuse the flows in `capture.mjs`, which drives the game through pinia. Add nothing to `src/`, and add no demo routes.

- [ ] **Step 1: Set up.**
  - Start an own dev server: `CHOKIDAR_USEPOLLING=1 npx vite --port <free port> --strictPort`, in the background from the repo.
  - Launch puppeteer-core from `shots/node_modules` with `executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.
  - Use a 360×780 viewport, `isMobile`, `hasTouch`.
  - Seed `localStorage["sudoku-settings"]` (`colorTheme`, `appearance`, `language`) with `evaluateOnNewDocument`.
- [ ] **Step 2: Capture.**
  - Matrix: 6 themes × light/dark in zh-Hant, plus green light/dark in en.
  - Screens:
    - home
    - a game in progress (entries, notes, a selected cell, same-digit highlight)
    - the hint menu
    - hint mode with its panel
    - statistics
    - settings
    - solver walkthrough
    - NewGameDialog, LeaveGameDialog and ClearRecordsDialog
    - GameCompleteModal (finish the game by filling the answer from pinia, as `capture.mjs` does)
  - Save to `shots/stage1/<locale>-<theme>-<mode>-<screen>.png`.
- [ ] **Step 3: Interaction checks.**
  - Appearance `system` with `emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }])` → `<html>` has `dark`. Flipping it to light while on Settings switches live.
  - Mid-press on a digit key, the computed `transform` is `matrix(0.96, …)`.
  - With `prefers-reduced-motion: reduce`, the transform is `none` and the segmented indicator has no transition.
  - On reload in dark mode, a screenshot taken at `domcontentloaded` already has a dark background (no flash).
- [ ] **Step 4: Review every shot.**
  - In dark mode there is no white or light block: dialogs, badges, logo, toast, hint panel, loader.
  - Text, notes, selection and hint marks are readable in every theme.
  - Nothing overflows at 360px.
  - Fix any problem with a test-first commit (`🐛 fix: …`). Palette tweaks go through Task 4's test plus a regeneration.
- [ ] **Step 5: Report to the user.**
  - Report the shot folder path and any fixes.
  - The Android system-bar check stays a manual step for the user: after `npm run android:run`, check status and navigation bar icons in light and dark on one Android 15+ device and one device on 14 or lower. If the bar background does not follow the page on 14 or lower, add `@capacitor/status-bar` `setBackgroundColor`, which the spec allows.
