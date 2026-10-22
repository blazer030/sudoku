# Redesign Stage 6 (Tactile Tiles, Paper Notebook and All-Combination Checks) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two more styles sit beside Minimal Motion. **Tactile Tiles** has thick keys that sink and spring back, a tray board with raised pieces, and four themes (green, blue, rust, slate). **Paper Notebook** has warm textured paper, ruled pages, printed clues, handwritten entries and notes, stamp presses and a night-desk dark mode, with three ink themes. Every style × theme × mode passes the contrast test. Board width and digit-key size are measured equal across styles at 360px. "Match launcher icon to theme" picks the nearest of the six existing icons.

**Architecture:** Colour stays in `src/theme/palettes.ts`. Each style gets its own palette builder, and the generated CSS picks the new blocks up unchanged. Theme ids are listed per style in `SettingsStorage.ts`; the six launcher-icon ids become their own type, and a pure `iconThemeFor` maps any theme to one of them by OKLab hue distance. Shape, texture, type and motion live in one stylesheet per style (`src/style/styles/<id>.css`), each scoped by `[data-style="<id>"]`. They hook onto `data-skin` attributes in the shared components and onto `v-press`'s data attributes. Font and size differences go through CSS variables (`--font-entry`, `--entry-scale` …), never through layout properties. Static tests over those stylesheets guard layout, scope and reduced motion. A real-browser pass measures the proportions.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript strict, Tailwind v4 (`@theme`), Pinia, vue-i18n, Vitest + @vue/test-utils (jsdom), `postcss` (already a devDependency) to parse stylesheets in tests, Google Fonts (Caveat, LXGW WenKai TC), puppeteer-core for the visual pass.

**Spec:** `docs/superpowers/specs/2026-10-22-redesign-stage6-more-styles-design.md`. Overview: `docs/superpowers/specs/2026-10-22-redesign-overview-design.md`. Builds on the stage 1–5 plans in `docs/superpowers/plans/2026-10-22-redesign-stage{1-foundation,2-game-screen,3-home-settings,4-walkthrough-review,5-statistics-changelog}.md` and on stage 1 as implemented. In particular, `v-press` now sets `data-pressed`, `data-press-motion` and `data-press-bounce` (not classes). `index.html`'s inline script carries a `barColors` table that `noFlashScript.test.ts` keeps in sync with `systemBarColor`. Each stylesheet has one reduced-motion block (`reducedMotion.test.ts`).

---

## Global Constraints

**From the spec and the overview**

- A style changes only material, shape, thickness, shadow, texture, font, motion and colour. Layout, button positions, flows, copy and features are shared. No style has its own markup branch.
- Board width, digit-key size and their ratio are the same in every style. At 360px, a browser measurement must agree within 2px.
- Game information (digits, notes, selection, hint marks) is equally clear in every style. Every style × theme × light/dark passes WCAG AA in `paletteContrast.test.ts`: 4.5:1 for text, 3:1 for large text and UI parts.
- **Tactile:**
  - Buttons, digit keys and option tiles have a bottom edge. They sink on press and spring back. An option tile that is on rests half pressed.
  - The board reads as a recessed tray. Clues and entries read as raised pieces. A placed digit drops in without ever delaying input.
  - The Home title may show 「數」「獨」 as two plates. That is a look of the title component only.
  - Themes: green, blue, rust (紅褐), slate (灰藍). Each has light and dark.
- **Paper:**
  - Warm paper with a faint texture. Home and Settings get ruled lines and a red margin line.
  - Clues use a printed face. Entries and notes use handwriting: LXGW WenKai TC for Chinese and Caveat for digits, both from Google Fonts. If they fail to load, system fonts take over without hurting legibility. Handwritten digits are sized to read clearly in a cell.
  - The selected cell gets a hand-drawn circle. An option tile's tick draws as a pen stroke. A press feels like a stamp.
  - Dark mode is a night desk: dark paper with a warm lamp glow at the top.
  - Themes: blue ink (藍墨), green ink (綠墨), red ink (紅墨).
  - New Game looks like a stamp and Continue like a sticky note. Both are looks of the same buttons, in the same place.
- Switching style applies live. The theme list follows the style, and each style remembers its own theme (stage 3).
- The six launcher icons (and the six PWA icon sets) stay. For any other theme, "match icon" picks the nearest of the six by colour distance.
- Under `prefers-reduced-motion: reduce`, every animation and moving transition is off. Only colour changes remain.

**From stages 1–5**

- Colour values live only in `src/theme/`. Run `npm run generate:theme-css` after any palette edit. `hardcodedColors.test.ts` stays green, and it also scans `src/style/styles/*.css` and `index.html`. Stylesheets reach colours only through `var(--color-…)` and `color-mix`. SVG data URIs use `currentColor` (as a mask) and never a colour word or `#`.
- `src/theme/` files use relative imports only.
- Every new button gets `v-press`, imported locally. Nothing depends on hover.

**Project rules**

- **TDD:** write one failing test, then the minimum code to pass it. Commit after every green step. A defect fix gets an API-level failing test plus a minimal reproduction test, and both turn green together.
- **Commits**
  - Structural commits (rename, move, extract; behaviour unchanged) are separate from behavioural ones and say which they are.
  - Before every commit, run `npx vitest run && npm run lint && npx vue-tsc --noEmit`. There must be zero warnings.
  - Messages are English Conventional Commits with an emoji (🐛 ✨ ♻️ 🧪 📄). No `Co-Authored-By` or any other trailer.
- **Code**
  - `src/domain/` never imports from application, presentation or stores.
  - Spell out identifiers (`row`/`column`, not `r`/`c`; no `i`, `idx`, `el`). Comments are in English.
- **Copy**
  - New copy exists in both `en` and `zh-Hant`.
  - zh copy follows `docs/superpowers/specs/2026-10-21-i18n-zh-hant-design.md`: row = 列, column = 欄, and 「遊戲」, never 「對局」.
- Everything must fit and work at 360px phone width.

## Review Focus

These are the five real-world inputs most likely to break this stage. Each maps to a named test.

1. **A stored theme that belongs to another style.** Examples: `{ style: "paper", colorTheme: "teal" }` from a hand edit, or a sync between builds. If only `COLOR_THEME_IDS` is checked, no `[data-style="paper"][data-color-theme="teal"]` block exists. The page then falls back to the light `@theme` defaults, which shows white surfaces in dark mode, and `index.html` paints the wrong `theme-color` first. Covered by Task 3 "should move a theme from another style to that style's remembered theme" (`loadSettings`) and "should fall back like loadSettings when the theme belongs to another style" (inline script).
2. **A non-icon id reaching the launcher or the PWA links, and a darkened primary landing on the wrong icon.** `AppIcon.change({ name: "blueInk" })` has no alias, and `sudoku-blueInk.svg` and `manifest-blueInk.webmanifest` would 404. Minimal's AA-tuned primaries are much darker than the icons. In full OKLab, orange `#8C5000` is nearer pink and teal `#0B696A` is nearer green. Covered by Task 2 "should ignore lightness so a darkened orange stays orange", "should keep every minimal theme on its own icon", and the store tests "should send the nearest icon when the style changes" and "should never hand a non-icon id to the icon or the page links" (extended in Tasks 3 and 5).
3. **Paper with Google Fonts unreachable** (offline Android, a blocked CDN). A stack that ends in `cursive` lands on Comic Sans or a script face. A stack with no CJK fallback renders Chinese in a random serif. Georgia's old-style figures make 3/4/5/7/9 hang below the line. Covered by Task 9 "should fall back to the app's own stacks and never to cursive", "should not use old-style figures for clues", and Task 12's blocked-fonts run.
4. **A larger handwritten digit stretching the cells.** `aspect-square` cells let content raise their height. A 1.3× Caveat entry at the inherited `line-height: 1.5` is taller than a 33px cell at 360px, so the board grows and the game page scrolls. Covered by Task 7 "should keep the value's line box at its glyph size", Task 6's layout guard (stylesheets may not set `font-size` or `line-height`) and scale guard (≤ 1.5), and Task 12's cell-squareness and no-scroll measurements.
5. **Motion that ignores the player.** Two cases:
   - Resuming a saved game would drop all 50+ digits at once if "arrival" fired on mount.
   - A new stylesheet animation without a reduced-motion override would keep moving under `prefers-reduced-motion`.

   Covered by Task 7 "should not animate digits present on mount", "should not animate under reduced motion", and Task 6's motion guard "every moving rule has a reduced-motion override".

---

### Task 1: Launcher-icon ids apart from colour-theme ids; theme ids listed per style (structural)

Behaviour is unchanged. Today every colour theme is also an icon, so the types stay compatible.

**Files:**
- Modify: `src/application/SettingsStorage.ts`, `src/application/icon/IconService.ts`, `src/infrastructure/icon/DynamicIconAdapter.ts`, `src/infrastructure/icon/NoopIconAdapter.ts`, `src/application/PwaThemeUpdater.ts`
- Test: `src/__tests__/theme/palettes.test.ts`, `src/__tests__/application/SettingsStorage.test.ts`

**Interfaces (Produces):**
```ts
// SettingsStorage.ts
export const STYLE_IDS = ["minimal"] as const;                       // Tasks 3 and 5 append "tactile", "paper"
/** Launcher aliases and PWA icon sets exist for these six only. */
export const ICON_THEME_IDS = ["green", "blue", "purple", "orange", "pink", "teal"] as const;
export type IconThemeId = typeof ICON_THEME_IDS[number];
export const THEME_IDS_BY_STYLE = { minimal: ICON_THEME_IDS } as const satisfies Record<StyleId, readonly string[]>;
export type ColorThemeId = typeof THEME_IDS_BY_STYLE[StyleId][number];
export const COLOR_THEME_IDS: readonly ColorThemeId[];               // union of all styles' ids, first-seen order
// IconService.setIcon(iconTheme: IconThemeId); both adapters take IconThemeId; DynamicIconAdapter's aliases are ICON_THEME_IDS
// updateFavicon / updateManifestLink / updateAppleTouchIcon(iconTheme: IconThemeId)
```

- [ ] **Step 1: Write the failing tests.**
  - `palettes.test.ts`: "should define every color theme for the minimal style in order" becomes `it("should define each style's themes in the listed order")`. For every `STYLE_IDS` entry, `STYLES[style].themes.map(theme => theme.id)` equals `[...THEME_IDS_BY_STYLE[style]]`. Also, `Object.keys(STYLES)` equals `[...STYLE_IDS]`.
  - `SettingsStorage.test.ts`: `it("should list the six icon themes as the minimal style's themes")`: `THEME_IDS_BY_STYLE.minimal` equals `ICON_THEME_IDS`.
- [ ] **Step 2:** Run both files. Expect FAIL (the exports do not exist).
- [ ] **Step 3: Implement.** Type changes only. `scripts/` keep their own colour tables.
- [ ] **Step 4:** Run the full gate. Expect PASS with no other test changed.
- [ ] **Step 5: Commit** `♻️ refactor: separate launcher icon ids from color theme ids`

---

### Task 2: Nearest launcher icon for any theme

**Decision:** Compare colours in OKLab's (a, b) plane and ignore lightness. Every light primary was darkened for AA contrast, so lightness would pull themes toward the wrong hue. Use the theme's **light** primary, so the icon does not change with the mode. A tie goes to the earlier id in `ICON_THEME_IDS`. The minimal style maps each theme to its own id without measuring.

**Files:**
- Create: `src/theme/iconTheme.ts`, `src/__tests__/theme/iconTheme.test.ts`
- Modify: `src/stores/settingsStore.ts`
- Test: `src/__tests__/stores/settingsStore.test.ts`

**Interfaces (Produces):**
```ts
// iconTheme.ts (relative imports only)
export const ICON_COLORS: Readonly<Record<IconThemeId, string>>;   // the generate-*-icons.ts primaries: #3D8A5A #4A7AB5 #7B5EA7 #C08040 #B5607A #4A9A9A
export const nearestIconTheme: (color: string) => IconThemeId;     // Euclidean distance in OKLab (a, b)
export const iconThemeFor: (style: StyleId, themeId: ColorThemeId) => IconThemeId;
//   minimal → themeId itself; otherwise nearestIconTheme(getPalette(style, themeId, "light").primary)
// settingsStore: favicon, manifest, apple-touch icon and iconService.setIcon all receive iconThemeFor(style, colorTheme).
//   setStyle (stage 3) sets style before it calls setColorTheme, so the icon follows the new style.
```

- [ ] **Step 1: Write the failing tests.**
  - `iconTheme.test.ts`:
    - `it.each` over `ICON_THEME_IDS`: `nearestIconTheme(ICON_COLORS[id])` is `id`.
    - `it("should ignore lightness so a darkened orange stays orange")`: `nearestIconTheme("#8C5000")` is `"orange"`, and `nearestIconTheme("#0B696A")` is `"teal"`.
    - `nearestIconTheme("#9A4A2C")` is `"orange"`, `("#9E2B3A")` is `"pink"`, and `("#3E5878")` and `("#2B4A7A")` are `"blue"`.
    - `it("should keep every minimal theme on its own icon")`: for every minimal theme, `iconThemeFor("minimal", id)` is `id`, and `nearestIconTheme(getPalette("minimal", id, "light").primary)` is `id` too. That guards a future retune.
    - `it("should match the icon generator scripts")`: for each id, `readFileSync("scripts/generate-launcher-icons.ts")` and `generate-pwa-icons.ts` contain `id: "<id>"` followed by `primary: "<ICON_COLORS[id]>"` (one regex per id, whitespace-tolerant).
  - `settingsStore.test.ts` (fake `IconService` with `setIcon: vi.fn()`):
    - `it("should never hand a non-icon id to the icon or the page links")`: with `matchLauncherIconToTheme` on, call `setStyle` and `setColorTheme` for every style and theme in `THEME_IDS_BY_STYLE`. Every `setIcon` argument is in `ICON_THEME_IDS`, and `link[rel=icon]`, `link[rel=manifest]` and `link[rel=apple-touch-icon]` always end in one of the six ids. Tasks 3 and 5 make this loop cover the new styles; until then it runs over minimal only.
    - `it("should send the nearest icon when the style changes")`: written in Task 3, where the second style first exists.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.** Write the OKLab conversion (sRGB → linear → LMS → OKLab) inside `iconTheme.ts`. No new dependency.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: match the launcher icon to the nearest of its six colors`

---

### Task 3: Tactile palettes, and theme ids that belong to their style

**Files:**
- Modify: `src/application/SettingsStorage.ts`, `src/theme/palettes.ts`, `src/style/themes.generated.css` (regenerate), `index.html` (inline script), both message files
- Test: `src/__tests__/application/SettingsStorage.test.ts`, `src/__tests__/theme/palettes.test.ts`, `src/__tests__/theme/paletteContrast.test.ts`, `src/__tests__/theme/iconTheme.test.ts`, `src/__tests__/presentation/theme/noFlashScript.test.ts`, `src/__tests__/stores/settingsStore.test.ts`, `src/__tests__/presentation/i18n/messages.test.ts` (create if no parity test exists)

**Interfaces:**
```ts
STYLE_IDS = ["minimal", "tactile"];
THEME_IDS_BY_STYLE.tactile = ["green", "blue", "rust", "slate"];   // "green"/"blue" are tactile's own palettes; lookup is per style
// palettes.ts: tactileTheme(id, light, dark) builder with its own neutrals; reuses tintsOf; note === foreground-secondary
```

**`loadSettings` rules** (these extend stage 3's rules):
1. Validate `colorThemeByStyle` per style: drop an entry whose value is not in `THEME_IDS_BY_STYLE[key]`.
2. If `colorTheme` is not in `THEME_IDS_BY_STYLE[style]`, use `colorThemeByStyle[style]` when that is valid, otherwise the style's first theme. This is the same rule as `rememberedThemeFor`, but written against `THEME_IDS_BY_STYLE` so that `SettingsStorage` never imports `src/theme`.
3. Then set `colorThemeByStyle[style] = colorTheme`, as in stage 3.

**Inline script.** The `barColors` data gains a `tactile` entry, and the "keeps it in sync" test generates the expected data from `STYLES`. The theme fallback mirrors rule 2:
- use `settings.colorTheme` when it is a key of `barColors[style].light`;
- else use `settings.colorThemeByStyle[style]` when that is a key;
- else use the first key. This relies on object key insertion order, which matches `THEME_IDS_BY_STYLE`.
Keep it ES5.

**Tactile palette direction.** Actual values are the implementer's, and they must pass every pair:
- Light neutrals start from the reference's direction A: `background #EBE7E0`, `card #FCFBF8`, `border #D0C9BD`, `foreground #2A2724`.
- Dark neutrals start from `background #1A1C1F`, `card #2E3136`, `foreground #EDEAE5`.
- Light primaries start at green `#2E7048`, blue `#2F5E96`, rust `#9A4A2C`, slate `#3E5878`. Dark primaries are lighter tints with a dark `on-primary`.
- Icons must map **green → green, blue → blue, rust → orange, slate → blue**. Slate must lean blue; `#3E5878` does, while `#3F5A70` ties with teal.

| key | en | zh-Hant |
|---|---|---|
| `settings.style.names.tactile` | "Tactile Tiles" | 「實體方塊」 |
| `settings.colorThemes.rust` | "Rust" | 「紅褐」 |
| `settings.colorThemes.slate` | "Slate Blue" | 「灰藍」 |

- [ ] **Step 1: Write the failing tests.**
  - `SettingsStorage.test.ts`:
    - `it("should move a theme from another style to that style's remembered theme")`:
      - `{ style: "tactile", colorTheme: "teal" }` gives `colorTheme` `"green"`.
      - `{ style: "tactile", colorTheme: "teal", colorThemeByStyle: { tactile: "rust" } }` gives `"rust"`, and `colorThemeByStyle.tactile` is `"rust"`.
    - `it("should drop a remembered theme that belongs to another style")`: `{ colorThemeByStyle: { tactile: "purple", minimal: "blue" } }` gives `{ minimal: "green" }`, because the current style is minimal and its colour theme is the default.
  - `palettes.test.ts`:
    - "should keep the dark toast a dark surface…" runs over every style.
    - "uses the secondary text colour for notes in every palette" already iterates `STYLES`.
  - `paletteContrast.test.ts`: `it("should check every style, theme and mode")`. The set of `style/theme/mode` prefixes in `CASES` equals the set built from `THEME_IDS_BY_STYLE` × `["light", "dark"]`.
  - `iconTheme.test.ts`: `it.each` over the tactile rows above. For example, `iconThemeFor("tactile", "rust")` is `"orange"`.
  - `noFlashScript.test.ts`:
    - "should accept every color theme id" and "should set the theme-color meta…" iterate `THEME_IDS_BY_STYLE`, storing `{ style, colorTheme }` and expecting `systemBarColor(style, theme, mode)`.
    - `it("should fall back like loadSettings when the theme belongs to another style")`:
      - `{ style: "tactile", colorTheme: "teal", colorThemeByStyle: { tactile: "slate" } }` gives `data-color-theme` `"slate"`.
      - Without the map it gives `"green"`.
      - In both cases the meta colour is that theme's light primary.
  - `settingsStore.test.ts`: `it("should send the nearest icon when the style changes")`:
    - With matching on and `colorTheme` `"teal"`, call `setStyle("tactile")`. `setIcon` gets `"green"`, the tactile default.
    - Then call `setColorTheme("rust")`. `setIcon` gets `"orange"`, and the favicon `href` ends with `sudoku-orange.svg`.
  - `messages.test.ts`: `it("should name every style and theme in both languages")`. For each style, `en.settings.style.names[style]` and the zh value are non-empty. The same holds for `settings.colorThemes[id]` for every id in `COLOR_THEME_IDS`.
- [ ] **Step 2:** Run those files. Expect FAIL.
- [ ] **Step 3: Implement.** Add the builder and the four themes, regenerate the CSS and update the inline script. Settings shows a second style card through stage 3's `STYLE_IDS` loop. Tactile has no press feedback until Task 8, because minimal's rules are scoped; that is acceptable mid-branch.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add the tactile tiles palettes with themes that belong to their style`

---

### Task 4: The Continue card gets its own surface token (structural)

Paper turns Continue into a sticky note, so its surface stops being "primary". Every builder sets `featured = primary` and `on-featured = on-primary`, so minimal and tactile look exactly as before.

**Files:**
- Modify: `src/theme/palettes.ts`, `src/style/themes.generated.css` (regenerate), `src/presentation/components/continue-button/ContinueButton.vue`
- Test: `src/__tests__/theme/palettes.test.ts`, `src/__tests__/theme/paletteContrast.test.ts`, `src/__tests__/presentation/Home.test.ts`

**Interfaces:** `PALETTE_TOKENS` gains `"featured"` and `"on-featured"`. ContinueButton swaps `bg-primary` / `text-on-primary` / `bg-on-primary/10` for `bg-featured` / `text-on-featured` / `bg-on-featured/10`. `hover:bg-primary-hover` is dropped; the hover keeps only its `hover:shadow-primary-lg`, as a fine-pointer extra.

- [ ] **Step 1: Write the failing tests.**
  - `palettes.test.ts`: `it("should keep featured equal to primary outside paper")`. For minimal and tactile, in both modes, `featured === primary` and `on-featured === on-primary`.
  - `paletteContrast.test.ts`: add `pair("on-featured", "featured")` and `tinted("on-featured", "on-featured", 0.1, "featured", TEXT)`, which covers the chips.
  - `Home.test.ts`: with `dummySave`, `continue-button` has `bg-featured` and `text-on-featured`, and has no `bg-primary`.
- [ ] **Step 2:** Run the three files. Expect FAIL.
- [ ] **Step 3: Implement**, then regenerate the CSS.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `♻️ refactor: give the continue card its own surface token`

---

### Task 5: Paper palettes and paper-only tokens

**Files:**
- Modify: `src/application/SettingsStorage.ts`, `src/theme/palettes.ts`, `src/style/themes.generated.css` (regenerate), `index.html` (`barColors`), both message files
- Test: `src/__tests__/theme/paletteContrast.test.ts`, `src/__tests__/theme/palettes.test.ts`, `src/__tests__/theme/iconTheme.test.ts`

**Interfaces:**
```ts
STYLE_IDS = ["minimal", "tactile", "paper"];
THEME_IDS_BY_STYLE.paper = ["blueInk", "greenInk", "redInk"];
// PALETTE_TOKENS gains "rule", "margin-line", "lamp".
//   minimal and tactile set all three to their own background, so nothing shows if they are ever painted.
// paperTheme(id, light, dark) builder.
// paletteContrast.test.ts: ContrastPair gains an optional `styles?: readonly StyleId[]`; CASES skip a pair outside its styles.
```

**Paper direction.** Values are the implementer's, but they must pass every pair:
- **Light**
  - `background #F4EDE0`, `card #FBF7EF`, `border #DCD0BB`, `foreground #2F2C35`.
  - `rule #CFDCE4`, `margin-line #E9B9AF`.
  - `featured #F7E6A0` with `on-featured #3A3326` (the sticky note). `lamp` equals `background`.
  - The reference's muted `#938874` fails 4.5 and must darken.
- **Dark (night desk)**
  - `background #201D19`, `card #2A2621`, `foreground #EDE4D3`.
  - `rule #2B343B`, `margin-line #583833`, `featured #4A4230`.
  - `lamp` is a warm amber near `#FFBE6E`.
- **Inks (light primaries)**
  - They start at blue ink `#2B4A7A`, green ink `#2E6B4A` and red ink `#9E2B3A`.
  - Icons must map **blueInk → blue, greenInk → green, redInk → pink**.
  - The dark primaries are lighter inks.

**Paper-only pairs** (`styles: ["paper"]`):
- Text crosses the ruled lines: `foreground`, `foreground-secondary`, `foreground-muted` and `primary` on `rule`, at 4.5.
- The lamp glow peaks at 35% over the background: the same four inks on `tinted(…, "lamp", 0.35, "background")`, at 4.5.
- The texture is the `border` colour at no more than 40%: the same four inks on `tinted(…, "border", 0.4, "background")`, at 4.5.

| key | en | zh-Hant |
|---|---|---|
| `settings.style.names.paper` | "Paper Notebook" | 「紙本筆記」 |
| `settings.colorThemes.blueInk` | "Blue Ink" | 「藍墨」 |
| `settings.colorThemes.greenInk` | "Green Ink" | 「綠墨」 |
| `settings.colorThemes.redInk` | "Red Ink" | 「紅墨」 |

- [ ] **Step 1: Write the failing tests.**
  - `paletteContrast.test.ts`:
    - Add the `styles` filter and the paper-only pairs.
    - `it("should check 26 style, theme and mode combinations")`: the number of distinct prefixes is `2 × (6 + 4 + 3)`. This is the spec's "3 styles × their themes × light/dark".
  - `palettes.test.ts`:
    - `it("should keep paper's lines and lamp invisible in other styles")`: for minimal and tactile, `rule`, `margin-line` and `lamp` equal `background`.
    - `it("should light the paper lamp only at night")`: paper light `lamp === background`, and paper dark `lamp !== background`.
  - `iconTheme.test.ts`: the paper rows above.
  - Tasks 2–3's store, inline-script and message loops now include paper, without code changes in the tests.
- [ ] **Step 2:** Run `npx vitest run src/__tests__/theme`. Expect FAIL.
- [ ] **Step 3: Implement**, regenerate the CSS and add `paper` to `barColors`.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add the paper notebook palettes with ink themes and a night desk`

---

### Task 6: One stylesheet per style, skin hooks and stylesheet guards

**6a (structural):** move minimal's style-scoped rules out of `index.css`.
- **Files:**
  - Create `src/style/styles/minimal.css`. It holds the press-feedback and segmented-indicator rules, plus their reduced-motion rules in its own single block.
  - Create `src/style/styles/tactile.css` and `src/style/styles/paper.css`. Each holds only a header comment; Tasks 8–10 fill them.
  - Modify `src/style/index.css`: after the generated import, `@import "./styles/minimal.css"; @import "./styles/tactile.css"; @import "./styles/paper.css";`.
  - Modify `src/__tests__/style/reducedMotion.test.ts`: the press and indicator expectations read `minimal.css`.
- Rename the keyframes to `minimal-press-bounce`. Every keyframe in a style sheet starts with `<style>-`.
- [ ] **Step 1:** Make the move. Run the full gate. Expect PASS with only the read path changed in the test.
- [ ] **Step 2: Commit** `♻️ refactor: move minimal style rules into their own stylesheet`

**6b (structural):** mark the skinnable surfaces. These are attributes only, so nothing looks different. `data-skin` holds space-separated tokens, and stylesheets match them with `~=`.

| token | element |
|---|---|
| `board` | the board card in GameScreen (also `data-testid="game-board"`), GameReview and SolverWalkthrough |
| `key` | DigitPad's digit and erase keys |
| `control` | the ControlButton tile |
| `button` | every `v-press` button whose resting look is a filled surface (`bg-primary`, `bg-primary-light` or `bg-card`). For example: the new-game button; the completion, leave, new-game, clear-records and walkthrough dialog buttons; the HintPanel buttons; the StepPlaybackPanel play button; the walkthrough sample buttons; `show-more-button`; `start-first-game-button`. Text-only buttons and SegmentedControl options are not marked. |
| `continue` | ContinueButton, with `button` too |
| `new-game` | Home's `new-game-button`, with `button` too |
| `tile` | OptionTile, the Home entry tiles, the Settings style cards |
| `check` | OptionTile's `option-tile-mark` |
| `segmented`, `segmented-indicator` | SegmentedControl's root and indicator |
| `title` | Home's `<h1>`. Task 8 adds `title-glyph`. |
| `page-ruled` | the Home and Settings page roots |

- **Files:** the components above, plus `src/__tests__/style/skinHooks.test.ts`.
- [ ] **Step 1: Write the failing tests** in `skinHooks.test.ts`.
  - `it("should mark every filled pressable button with a skin")`:
    - Scan `src/presentation/**/*.vue` with `/<(?:button|a)\b[^>]*>/gs`.
    - A tag that contains `v-press` but not `v-press:tint`, and whose text matches `/\bbg-(?:primary|primary-light|card)\b/`, must contain `data-skin=`.
    - Report `file: tag start` for each offender.
  - `it("should only style hooks that exist in the markup")`:
    - Collect every `data-skin~="x"` / `data-skin="x"` in `src/style/styles/*.css`.
    - Each `x` must appear as a token of some `data-skin` attribute value in a `.vue` file. That covers static values and string literals in a bound value.
    - Include a self-check on a sample string.
  - `it("should keep the skin hooks GameScreen measures")`: `GameScreen.vue` contains `data-testid="game-board"` on the same tag as `data-skin="board"`.
- [ ] **Step 2:** Run the file. Expect FAIL (offenders listed).
- [ ] **Step 3:** Add the attributes.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `♻️ refactor: mark skinnable surfaces for per-style stylesheets`

**6c (test):** guards over every style sheet. The helpers live in `src/__tests__/style/styleSheetRules.ts` and parse with `postcss.parse`.

```ts
export const findLayoutDeclarations: (css: string) => string[];    // "selector → property"
export const findUnscopedSelectors: (css: string, style: StyleId) => string[];
export const findUnguardedMotion: (css: string) => string[];
export const findScalesOutOfRange: (css: string) => string[];      // --*-scale outside [1, 1.5]
```

The rules are decisions:
- **Layout.** Flag `width`, `height`, `min-*`, `max-*`, `padding*`, `margin*`, `gap`, `row-gap`, `column-gap`, `inset*`, `top`, `right`, `bottom`, `left`, `display`, `flex*`, `grid*`, `order`, `aspect-ratio`, `border-width`, `border-*-width`, the `border` shorthands, `font-size`, `line-height`, `letter-spacing`, `word-spacing` and `white-space`. Flag `position` unless its value is `relative`.
  - Exempt: selectors ending in `::before` or `::after`, which are absolutely placed decorations.
  - Exempt: `[data-skin~="title-glyph"]`, but only for `display: inline-block` and `margin-inline`.
  - Thickness and outlines use `box-shadow` and `outline`. Sizes of type use the `--*-scale` variables.
- **Scope.** Every selector outside `@keyframes` starts with `[data-style="<id>"]`, `:root[data-style="<id>"]` or `:root.dark[data-style="<id>"]`. Keyframe names start with `<id>-`.
- **Motion.** A rule outside the sheet's `@media (prefers-reduced-motion: reduce)` block is a moving rule when it declares one of these:
  - `animation` or `animation-name` other than `none`;
  - a `transition` or `transition-property` whose value contains `transform`, `translate`, `scale`, `rotate` or `all`.

  The same selector must appear in that block. For an animation, that rule declares `animation: none`. For a moving transition, it declares `transition: none` or `transform: none`. Minimal's existing block already meets this. A rule that sets only `transition-duration` or `transition-timing-function` is not a moving rule.

- [ ] **Step 1: Write the failing tests** in `src/__tests__/style/styleSheets.test.ts`.
  - **Self-checks on small CSS strings.** Each finder has a positive and a negative case:
    - `[data-style="tactile"] .x { padding: 2px }` → 1 layout hit
    - `[data-style="tactile"] .x::after { inset: 0 }` → 0 hits
    - `.x { color: red }` scoped to tactile → 1 unscoped
    - a `[data-style="paper"] .x { animation: paper-a 1s }` with no reduced-motion rule → 1 unguarded
    - `--entry-scale: 0.9` → 1 out of range
  - `it.each(STYLE_IDS)("%s.css has no layout declarations")`, and the same for "is scoped to its style", "has a reduced-motion override for every moving rule" and "keeps type scales between 1 and 1.5".
  - `it("should import every style's sheet")`: `index.css` contains `@import "./styles/<id>.css";` for each `STYLE_IDS` entry, and `src/style/styles/` has no other `.css` file.
- [ ] **Step 2:** Run the file. Expect FAIL (the helper module does not exist).
- [ ] **Step 3:** Implement the helpers. `minimal.css` must already pass.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `🧪 test: guard per-style stylesheets against layout, scope and motion leaks`

---

### Task 7: Board-cell and key hooks for type and motion

**Files:**
- Modify: `src/presentation/components/board-cell/BoardCell.vue`, `src/presentation/pages/game/components/Cell.vue`, `src/presentation/pages/game/components/DigitPad.vue`, `src/style/index.css` (`@theme` font tokens)
- Create: `src/presentation/components/board-cell/useArrivalMotion.ts`
- Test: `src/__tests__/presentation/BoardCell.test.ts`, `src/__tests__/presentation/Cell.test.ts`, `src/__tests__/presentation/Game.test.ts`

**Interfaces:**
```ts
// BoardCell props gain: valueKind?: "given" | "entered"   (default "given")
// Cell passes "entered" for a player's entry. GameReview uses Cell. SolverWalkthrough keeps the default.
// BoardCell root: data-variant="<variant>" always; data-value-kind="<valueKind>" only when value !== 0
// value element: font-clue | font-entry; size text-[length:calc(22px*var(--clue-scale,1))] | …var(--entry-scale,1)…
// player and solver notes: font-note; stage 2's clamp(...) multiplied by var(--note-scale,1)
// DigitPad keys: font-key; stage 2's text-2xl / text-lg sizes become calc(var(--text-2xl)*var(--key-scale,1)) / …--text-lg…
// @theme: --font-clue, --font-entry, --font-note, --font-key: all var(--font-sans)   (paper overrides them in Task 9)
export const useArrivalMotion: (value: Ref<number>, popping: Ref<boolean>) => { arriving: Ref<boolean>; settle: () => void };
//   arriving turns true when value goes from 0 to non-zero after mount, popping is false and motion is allowed;
//   settle() (bound to animationend on the value element) turns it off. The value element gets class value-arrive while arriving.
```

**7a (structural):** attributes, font tokens and scale variables. These resolve to today's values, so minimal and tactile render the same. Update the stage 2 class assertions (`text-2xl` → the calc class) mechanically.
- [ ] **Step 1: Write the failing tests.**
  - `BoardCell.test.ts`:
    - `variant: "selected"` → root `data-variant="selected"`.
    - `value: 5, valueKind: "entered"` → `data-value-kind="entered"`, and the value has `font-entry`.
    - The default → `font-clue`.
    - `value: 0` → no `data-value-kind`.
    - The note span has `font-note`.
  - `Cell.test.ts`: an entry cell has `data-value-kind="entered"`, and a clue has `"given"`.
  - `Game.test.ts`: `number-8` has `font-key`.
- [ ] **Step 2:** Run the files. Expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `♻️ refactor: route board and key type through per-style font and scale tokens`

**7b (behavioural):** a pinned line box and the arrival hook.
- [ ] **Step 1: Write the failing tests** in `BoardCell.test.ts`:
  - `it("should keep the value's line box at its glyph size")`: the value has `leading-none`. Digit keys have `leading-none` too; test that in `Game.test.ts`.
  - `it("should mark a newly placed digit as arriving")`: mount with `value: 0`, then `setProps({ value: 5 })` → `cell-value` has `value-arrive`. After `trigger("animationend")` it does not.
  - `it("should not animate digits present on mount")`: mount with `value: 5` → no `value-arrive`.
  - `it("should not animate under reduced motion")`: stub `matchMedia` to reduce, then 0 → 5 → no `value-arrive`.
  - `it("should leave a hint reveal to its own pop")`: `popping: true`, 0 → 5 → no `value-arrive`.
- [ ] **Step 2:** Run the files. Expect FAIL.
- [ ] **Step 3:** Implement. Only tactile styles `value-arrive` (Task 8). Minimal has no rule for it.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: pin cell and key line boxes and flag newly placed digits`

---

### Task 8: Tactile stylesheet and the title plates

**Files:**
- Create: `src/presentation/pages/home/titleGlyphs.ts`, `src/__tests__/presentation/pages/home/titleGlyphs.test.ts`, `src/__tests__/style/styleCoverage.test.ts`
- Modify: `src/style/styles/tactile.css`, `src/presentation/pages/home/Home.vue`
- Test: `src/__tests__/presentation/Home.test.ts`

**Interfaces:**
```ts
export const titleGlyphs: (title: string) => string[];
//   a title made only of Han characters → one entry per character; anything else → [title]
// Home's <h1 data-skin="title"> renders one <span data-skin="title-glyph" data-testid="home-title-glyph"> per glyph.
//   The h1's text is unchanged, so screen readers read it as before.
// styleCoverage.test.ts: REQUIRED_SELECTORS: Record<StyleId, readonly string[]>.
//   Each fragment must occur in some selector of that style's sheet.
//   A shared PRESS list applies to every style:
//   "[data-pressed]", "[data-press-motion][data-pressed]", "[data-press-bounce]", ".segmented-indicator-motion"
```

**Tactile rules** (the decisions; all under `[data-style="tactile"]`):
- **Variables:** `--tactile-depth: 4px`. `--tactile-edge` is `color-mix(in srgb, var(--color-shadow) 28%, var(--color-background))`, one neutral edge for every surface; do not key off utility classes such as `.bg-primary`. `--tactile-highlight` is `color-mix(in srgb, var(--color-card) 60%, transparent)`. The radius tokens (`--radius-button`, `--radius-icon`) may change.
- **Thickness:** `[data-skin~="button"]`, `[data-skin~="key"]`, `[data-skin~="control"]` and `[data-skin~="tile"]` get an inset top highlight, a `0 var(--tactile-depth) 0 var(--tactile-edge)` edge and a soft drop shadow, all as `box-shadow`. Their boxes do not change.
- **Press:**
  - `[data-pressed]` keeps minimal's 8% overlay, which is the colour change that stays under reduced motion.
  - `[data-press-motion][data-pressed]` → `translateY(calc(var(--tactile-depth) - 1px))`, with the edge shrinking to 1px over 70ms.
  - Release springs back over 320ms on `cubic-bezier(0.2, 2.2, 0.4, 1)`.
  - `[data-press-bounce]` → `tactile-key-pop`, 260ms: up 2px, then rest.
- **On tiles:** `[data-skin~="tile"][aria-pressed="true"]` rests at `translateY(calc(var(--tactile-depth) - 2px))` with a 2px edge. This is static, so it stays under reduced motion.
- **Board:**
  - `[data-skin~="board"]` gets an inset tray shadow.
  - `[data-value-kind]` cells get an inset top highlight and an inset bottom edge. These are added to, never replace, the stage 2 selection ring (compose through Tailwind's `--tw-inset-shadow`, or put the piece shading on `::before`).
- **Drop:** `.value-arrive` → `tactile-drop`, 380ms. The digit falls from `translateY(-35%) scale(1.2)` with opacity 0, overshoots 4%, then rests. Only the digit moves; the cell does not.
- **Segmented:** `[data-skin~="segmented"]` is a recessed tray, and `[data-skin~="segmented-indicator"]` is a raised cap with a 3px edge. `.segmented-indicator-motion` uses the spring curve.
- **Title:** `[data-skin~="title-glyph"]` is an inline-block plate. Its face is `card`, its text is `foreground` (a tested pair), and its edge is a box-shadow. It has `margin-inline: 0.12em` and its padding is drawn by a spread shadow.

- [ ] **Step 1: Write the failing tests.**
  - `titleGlyphs.test.ts`: `"數獨"` → `["數", "獨"]`; `"Sudoku"` → `["Sudoku"]`; `""` → `[]`.
  - `Home.test.ts`:
    - In zh-Hant, two `home-title-glyph` spans with 「數」「獨」, and the `h1` text is 「數獨」.
    - In en, one span, "Sudoku".
  - `styleCoverage.test.ts`:
    - `minimal`: PRESS.
    - `tactile`: PRESS plus `[data-skin~="key"]`, `[data-skin~="button"]`, `[data-skin~="tile"][aria-pressed="true"]`, `[data-skin~="board"]`, `[data-value-kind]`, `.value-arrive`, `[data-skin~="title-glyph"]`, `[data-skin~="segmented-indicator"]`.
- [ ] **Step 2:** Run the files. Expect FAIL.
- [ ] **Step 3:** Implement. Task 6's guards must stay green; they fail on any layout property, missing scope or unguarded motion.
- [ ] **Step 4:** Run the full gate. Expect PASS. Run `npm run start`, pick Tactile in Settings, and check once that keys sink and tiles rest half pressed.
- [ ] **Step 5: Commit** `✨ feat: add the tactile tiles style`

---

### Task 9: Paper type — web fonts with safe fallbacks

**Files:**
- Modify: `index.html` (the Google Fonts link), `src/style/index.css` (`@theme` font stacks), `src/style/styles/paper.css`
- Create: `src/__tests__/style/paperFonts.test.ts`

**Decisions:**
- **One stylesheet link.** It holds `family=Caveat:wght@500;700`, `family=LXGW+WenKai+TC:wght@400;700`, the existing Outfit and Roboto Mono families, and `display=swap`. Browsers download a face only when text uses it, so other styles pay only for the small CSS.
- **`@theme` stacks.** They are defined once and reused by paper and by the Task 11 thumbnails:
  - `--font-hand: "Caveat", "LXGW WenKai TC", "Outfit", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`
  - `--font-wenkai: "LXGW WenKai TC", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`
  - `--font-print: "Times New Roman", "Noto Serif TC", "Songti TC", "PMingLiU", serif`. Not Georgia: its old-style figures sink 3/4/5/7/9.
- **`paper.css`.**
  - It sets `--font-sans: var(--font-wenkai)`, `--font-clue: var(--font-print)`, and `--font-entry`, `--font-note` and `--font-key` to `var(--font-hand)`.
  - Entries and keys use weight 700.
  - Scales: `--entry-scale: 1.3`, `--note-scale: 1.15`, `--key-scale: 1.25`. Notes stay at least 11.5px, above stage 2's 10px.
  - The timer keeps `font-mono`, so its width does not jitter every second.

- [ ] **Step 1: Write the failing tests** in `paperFonts.test.ts`:
  - `it("should load Caveat and LXGW WenKai TC with swap")`: the `index.html` stylesheet `href` contains both families, `Outfit` and `display=swap`.
  - `it("should fall back to the app's own stacks and never to cursive")`:
    - Every `--font-*` in `index.css`'s `@theme` that is a literal stack (not a `var(…)` alias such as `--font-clue`) ends in `sans-serif`, `serif` or `monospace`, and contains neither `cursive` nor `fantasy`.
    - `--font-hand` and `--font-wenkai` contain `"PingFang TC"` and `"Noto Sans TC"`.
  - `it("should not use old-style figures for clues")`: `--font-print` does not contain `Georgia`.
  - `it("should hand paper's entries, notes and keys to the handwriting stack")`: `paper.css` declares `--font-entry`, `--font-note` and `--font-key` as `var(--font-hand)`, and `--font-clue` as `var(--font-print)`. Use postcss.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the full gate. Expect PASS, including Task 6's scale guard.
- [ ] **Step 5: Commit** `✨ feat: write paper entries and notes by hand with safe font fallbacks`

---

### Task 10: Paper surfaces — ruled pages, circle, tick, stamp, sticky note, night desk

**Files:**
- Modify: `src/style/styles/paper.css`, `src/presentation/pages/home/Home.vue`
- Test: `src/__tests__/style/styleCoverage.test.ts`, `src/__tests__/presentation/Home.test.ts`

**Paper rules** (the decisions; all under `[data-style="paper"]`):
- **Texture:** the `body` background gets two faint repeating radial gradients of `color-mix(in srgb, var(--color-border) 40%, transparent)`. It uses no image, so the colour test and the contrast test (Task 5) see it. It is painted behind content only.
- **Ruled pages:**
  - `[data-skin~="page-ruled"]` gets a `repeating-linear-gradient` with a 1px `var(--color-rule)` every 32px.
  - A 1.5px `var(--color-margin-line)` sits 14px from the left. That is inside the 20–24px page gutter, so no text crosses it.
  - Settings uses `background-attachment: local`, so the lines scroll with the content.
- **Night desk:** `:root.dark[data-style="paper"] body` gains `radial-gradient(110% 55% at 50% -6%, color-mix(in srgb, var(--color-lamp) 35%, transparent), transparent 65%)` as a background layer. It is never an overlay above text.
- **Selected cell:**
  - `[data-variant="selected"]` drops the ring and gains `position: relative`.
  - Its `::after` draws a hand ellipse with `background-color: var(--color-primary)` through an SVG mask data URI. The stroke is `currentColor`, slightly open and rotated −4°.
  - It appears with `paper-circle-draw`, a 220ms `clip-path` sweep.
  - `primary` on `cell-selected` ≥ 3 is already tested.
- **Tick:** `[data-skin~="check"] svg` draws with `stroke-dasharray`/`stroke-dashoffset` from 24 to 0 over 300ms (`paper-check-draw`). It runs when the mark appears.
- **Press like a stamp:**
  - `[data-pressed]` gets a `color-mix(in srgb, var(--color-primary) 10%, transparent)` overlay.
  - `[data-press-motion][data-pressed]` → `translate(1px, 1.5px) scale(0.965) rotate(-0.7deg)` in 80ms. Release takes 340ms on `cubic-bezier(0.3, 1.7, 0.5, 1)`.
  - `[data-press-bounce]` → `paper-stamp-settle`, 260ms.
- **Sticky note:** `[data-skin~="continue"]` rotates −1°. It gets a `2px 4px 0` shadow of `color-mix(in srgb, var(--color-shadow) 18%, transparent)`. A tape strip on `::before` is `color-mix(in srgb, var(--color-card) 60%, transparent)`, 56×16px at the top centre, rotated 2°. Its colours come from `featured` (Task 5).
- **Stamp:** `[data-skin~="new-game"]` is `background: transparent; color: var(--color-primary)` with a double inset ring (`primary` 2px, `card` 2px, `primary` 1px) and rotates −1.5°. `primary` on `card` is already tested.
- **Segmented:** the indicator stays filled, so its labels keep `on-primary`. It rotates −0.6°, and `.segmented-indicator-motion` eases over 300ms.

**Home change (structural, invisible elsewhere):** the new-game button's icon and label drop their own colour classes and inherit the button's `color`, so the stamp can recolour them.

- [ ] **Step 1: Write the failing tests.**
  - `styleCoverage.test.ts` `paper`: PRESS plus `[data-skin~="page-ruled"]`, `[data-variant="selected"]::after`, `[data-skin~="check"]`, `[data-skin~="continue"]`, `[data-skin~="new-game"]`, and a selector starting with `:root.dark[data-style="paper"]`.
  - `Home.test.ts`: `it("should let the new game button colour its icon and label")`. Inside `new-game-button`, neither the `svg` nor the label span has a class starting with `text-`.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3:** Implement. All of Task 6's guards stay green.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add the paper notebook style`

---

### Task 11: Style thumbnails for three styles, and live switching

**Files:**
- Modify: `src/presentation/pages/settings/components/StyleThumbnail.vue`, `src/presentation/pages/settings/Settings.vue`
- Test: `src/__tests__/presentation/pages/settings/Settings.test.ts`

**Interfaces:**
```ts
// StyleThumbnail props: style: StyleId; palette: Palette
// root: data-testid="style-thumbnail", data-thumbnail-style=<style>, aria-hidden="true",
//   :style sets every `--color-<token>` from the palette, so its children use ordinary token classes.
// Inside it, a THUMBNAIL_LOOKS: Record<StyleId, ThumbnailLook> class map draws a mini page, a 3×3 board
//   (one given digit, one entered digit, one selected cell), a key and a pill:
//   minimal — flat cards; tactile — tray, raised pieces, a key with a bottom edge (box-shadow);
//   paper — ruled background, font-print given digit, font-hand entered digit, an SVG ellipse in text-primary around the selected cell.
// Never put data-style or data-skin inside a thumbnail. Style sheets match by descendant,
//   so a nested hook would pick up the *current* style's rules.
```

- [ ] **Step 1: Write the failing tests.**
  - `it("should show a thumbnail for each of the three styles")`:
    - The `style-option-*` ids are `minimal`, `tactile` and `paper`, in that order, with their names in en and zh.
    - Each contains a `style-thumbnail` whose `data-thumbnail-style` is its id.
    - The thumbnail's inline style contains `--color-primary: <getPalette(id, rememberedThemeFor(id, …), "light").primary>`.
  - `it("should keep style hooks out of thumbnails")`: no element inside any `style-thumbnail` has `data-style` or `data-skin`.
  - `it("should switch styles live and remember each style's theme")`. Start `startAppearanceSync` as in stage 3, and stop it in `finally`.
    1. Click `style-option-tactile`. `documentElement.dataset.style` is `"tactile"` and `colorTheme` is `"green"`. There are 4 swatches, and `color-theme-rust` has `aria-label` "Rust".
    2. Click `color-theme-rust`.
    3. Click `style-option-paper`. There are 3 swatches, and `color-theme-blueInk` is `aria-pressed="true"`. Click `color-theme-redInk`.
    4. Click `style-option-tactile`. `color-theme-rust` is pressed and `dataset.colorTheme` is `"rust"`.
    5. Click `style-option-paper`. `"redInk"` comes back.
    6. Click `style-option-minimal`. `"green"` comes back, which is the stage 3 default.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3:** Implement. Settings passes `:style="id"` to the thumbnail.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: preview all three styles in the style picker`

---

### Task 12: Real-browser pass — proportions, fonts, motion and every combination (360×780)

**Files:** scripts only, in `/private/tmp/claude-501/-Users-ethan-Project-sudoku/8581f059-8ad5-412a-943e-1b0b712810ab/scratchpad/shots/` (for example `stage6.mjs`, reusing `capture.mjs`'s pinia-driven flows and the stage 2–5 scripts' states). Add nothing to `src/` and no demo routes.

- [ ] **Step 1: Set up.**
  - Start a dev server of your own: `CHOKIDAR_USEPOLLING=1 npx vite --port <free port> --strictPort`, in the background.
  - Use puppeteer-core from `shots/node_modules` with `executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, a 360×780 viewport, `isMobile` and `hasTouch`.
  - Seed `sudoku-settings` (`style`, `colorTheme`, `colorThemeByStyle`, `appearance`, `language`) with `evaluateOnNewDocument`.
  - Use one fixed puzzle (`knownPuzzle` through pinia) with the same entries, notes and selection in every style.
  - Wait for `document.fonts.ready` before measuring.
- [ ] **Step 2: Measure proportions** (the spec's check). On the game screen, in light and dark for each style, record:
  - `[data-testid="game-board"]` width and height;
  - `number-5` width and height;
  - one cell's width and height;
  - `document.scrollingElement.scrollHeight` against `innerHeight`.

  Pass when:
  - across the three styles, board width and key height each differ by ≤ 2px;
  - board width ÷ key height differs by ≤ 2px-equivalent;
  - every cell is square within 1px;
  - the game page has no vertical scroll;
  - no screen has horizontal overflow (`scrollWidth <= 360`).

  Print the table in the report.
- [ ] **Step 3: Measure legibility and behaviour.**
  - **Glyph size.** Use canvas `measureText` with each element's computed font. The ink height (`actualBoundingBoxAscent + actualBoundingBoxDescent`) of an entered digit and of a note in paper must be ≥ 0.95 × minimal's.
  - **Fonts loaded.** In paper, `document.fonts.check("700 20px Caveat")` is true.
  - **Fonts blocked.** Abort `fonts.googleapis.com` and `fonts.gstatic.com` with request interception and reload paper. Repeat Step 2's measurements (same pass rules). Computed `font-family` falls back to the stacks, and screenshots are readable.
  - **Selection survives the skin.** In tactile, the selected cell's computed `box-shadow` contains the primary colour. In paper, the selected cell's `::after` has a `mask-image`.
  - **Mid-press.**
    - Tactile `number-5`: computed `transform` is `matrix(1, 0, 0, 1, 0, 3)`.
    - Paper: the transform has a rotation.
    - Under `prefers-reduced-motion: reduce`, both are `none`, and filling a cell adds no `value-arrive`.
    - In tactile with motion on, filling a cell adds `value-arrive`. Reloading a saved game adds none.
  - **Live switch.** On Settings, click each style card. `<html>` `data-style` and `data-color-theme` update without a reload, and the swatch count is 6, 4 and 3.
- [ ] **Step 3b: Capture.** Save to `shots/stage6/<style>-<theme>-<locale>-<mode>-<screen>.png`.
  - **Full set:** each style with its representative theme (minimal green, tactile green, paper blueInk) × light and dark, in zh-Hant. Screens:
    - Home with a save
    - game with notes, a selection, same digits and note mode on
    - hint mode with its panel
    - statistics with records
    - settings at Appearance (three style cards)
    - solver walkthrough during playback
    - game review
    - the leave dialog, the new-game dialog and the completion modal
  - **en:** Home, game and settings for each style × light and dark.
  - **Every other theme:** the game screen in light and dark, zh-Hant. That is tactile blue, rust and slate; paper greenInk and redInk; minimal's other five.
  - **Blocked fonts:** paper game and Home in light and dark.
- [ ] **Step 4: Review every shot.**
  - Digits, notes, the selection, same-digit and hint marks read as clearly as in minimal.
  - The tactile edges do not collide between key rows.
  - The ruled lines never make text hard to read.
  - The lamp glow stays behind text.
  - The sticky note and stamp keep the Home layout.
  - Fix any problem test first (`🐛 fix: …`). Palette changes go through `paletteContrast.test.ts` plus a regeneration. Stylesheet changes must keep Task 6's guards green.
- [ ] **Step 5: Report to the user.** Give the shot folder path, the measurement table, and this plan's ⚙︎ choices for review:
  - the theme ids, their names and their icon mapping: tactile green/blue/rust/slate → green/blue/orange/blue; paper blueInk/greenInk/redInk → blue/green/pink;
  - the hue-only (OKLab a, b) distance, using the light primary;
  - Continue's `featured` surface;
  - the `data-skin` vocabulary;
  - title plates only for all-Han titles;
  - Times instead of Georgia for printed clues;
  - the paper type scales 1.3 / 1.15 / 1.25 and the mono timer;
  - the margin line at 14px;
  - a texture drawn from gradients rather than an image;
  - thumbnails drawn by a class map without style hooks.

  Manual check left for the user on Android (`npm run android:run`): choose Paper with blue ink and turn on "App 圖示配合主題", then leave the app. The launcher shows the blue icon. Then turn off the network and reopen the app: paper falls back to system fonts and stays readable.
