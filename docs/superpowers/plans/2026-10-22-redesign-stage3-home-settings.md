# Redesign Stage 3 (Home and Settings) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home puts the game first. A "Continue" card shows the saved game's difficulty, time and progress. A separate "New Game" card holds the difficulty picker right above its button (audit 9). Statistics, Walkthrough and Settings become real entry tiles with a subtitle each. Settings becomes five grouped cards (Gameplay, Appearance, Language, Data, About). Gameplay switches become option tiles. Appearance gets the style picker, the current style's swatches and the final light/dark control. "Clear All Records" moves from Statistics to the Data group (audit 11). About gains a privacy-policy link.

**Architecture:** This stage builds on stage 1's tokens, `v-press`, `SegmentedControl`, `STYLES` / `getPalette` and appearance sync, and on stage 2's `highlightScope` setting. It adds two shared pieces: `OptionTile` (a pressed/unpressed tile) and `SettingsGroup` (an icon heading plus a card). The settings store gains `setStyle` and a per-style memory of the chosen colour theme, `colorThemeByStyle`. A pure `rememberedThemeFor` in `src/theme/palettes.ts` resolves which theme a style comes back to. No routes, flows or features change.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript strict, Tailwind v4 tokens, Pinia, vue-i18n, lucide-vue-next icons, Vitest + @vue/test-utils (jsdom), puppeteer-core for the visual pass.

**Spec:** `docs/superpowers/specs/2026-10-22-redesign-stage3-home-settings-design.md`. Overview: `docs/superpowers/specs/2026-10-22-redesign-overview-design.md`. Builds on `docs/superpowers/plans/2026-10-22-redesign-stage1-foundation.md` and `docs/superpowers/plans/2026-10-22-redesign-stage2-game-screen.md`.

---

## Global Constraints

**From the spec**

- **Home, top to bottom:** logo and title, then the game area, then the secondary entries. Home's features and flows stay the same; only layout and look change.
- **Continue card:** shown only when a save exists, and placed first in the game area. It shows the difficulty, the elapsed time and the percentage of the player's cells filled.
- **New Game card:** the difficulty `SegmentedControl` sits inside this card, directly above the New Game button. The Continue card is outside it. With no save, the game area holds only this card.
- **Secondary entries:** one row of tiles in the order Statistics, Walkthrough, Settings. Each tile has an icon, a label and a one-line subtitle. The whole tile is one button with a hit area of at least 44×44px. The row is a 3-column grid. When Technique Lessons ships later, it becomes 2×2. Do not render anything for that feature now.
- **Settings:** one page of group cards in this order: Gameplay, Appearance, Language, Data, About. Each group has an icon heading.
- **Gameplay:** 2-column option tiles replace the switches. Each tile has an icon, a name, a one-line description and `aria-pressed`. On is a solid `primary` tile; off is an outline. Pressing gives `v-press` feedback. The tiles, in order: Highlight Same Numbers, Highlight Row/Column/Box (`highlightScope` from stage 2), Completion Animation, Auto-Remove Notes, Remaining Count.
- **Appearance:**
  - Style: one card per style, each with a drawn thumbnail. Only "Minimal Motion" exists now.
  - Theme colour: the current style's own swatches.
  - Light/dark: a `SegmentedControl` (System, Light, Dark). This replaces stage 1's temporary control.
  - The app-icon option appears in the app build only.
- **Language:** a `SegmentedControl` (System, English, 繁體中文).
- **Data:** "Clear All Records" is a text button. It asks for confirmation, and the dialog says exactly which data is deleted.
- **About:** version and changelog, a privacy-policy link (new; opens the external URL), and Donate, shown only once products are found.
- **Style choice:** picking a style applies it live. Each style remembers its own chosen colour theme.

**From stages 1 and 2**

- Every colour comes from a token. `hardcodedColors.test.ts` must stay green: no hex literals, `rgb()`, `bg-white` / `text-white` or Tailwind palette classes in `src/presentation`. Thumbnails and swatches take values from `getPalette(...)` through `:style`.
- Every new button gets `v-press`, imported locally. No new design may depend on hover.
- Use stage 2's setting name `highlightScope` (store: `highlightScope`, `setHighlightScope`). The spec's `highlightPeers` is the same setting under its stage-2 name.
- Keep `appearance-switcher` / `appearance-*` and `language-switcher` / `language-*` test IDs from stage 1.

**Project rules**

- **TDD:** write one failing test, then the minimum code to pass it. Commit after every green step.
- **Commits**
  - Structural commits (rename, move, extract; behaviour unchanged) are separate from behavioural ones and say which they are.
  - Before every commit, run `npx vitest run && npm run lint && npx vue-tsc --noEmit`. There must be zero warnings.
  - Messages are English Conventional Commits with an emoji (🐛 ✨ ♻️ 🧪 📄). No `Co-Authored-By` or any other trailer.
- **Code**
  - `src/domain/` never imports from application, presentation or stores. Files in `src/theme/` use relative imports only.
  - Spell out identifiers (`row`/`column`, not `r`/`c`; no `i`, `idx`, `el`). Comments are in English.
- **Copy**
  - All new copy exists in both `en` and `zh-Hant`.
  - zh copy follows `docs/superpowers/specs/2026-10-21-i18n-zh-hant-design.md`: row = 列, column = 欄, and 「遊戲」, never 「對局」.
- Everything must fit and work at 360px phone width.

## Review Focus

These are the five real-world inputs most likely to break this stage. Each maps to a named test.

1. **A shared default object for `colorThemeByStyle`.** If `loadSettings` returns `{ ...DEFAULT_SETTINGS }`, every load shares one map. Then the first `setColorTheme` changes the defaults for the rest of the session, including the defaults a fresh store reads after records are cleared. Covered by Task 1: "should not share the remembered theme map between loads".
2. **An upgraded player who taps the style card that is already selected.** Their stored settings have `colorTheme: "blue"` and no `colorThemeByStyle`. If the map is not seeded from `colorTheme`, `setStyle("minimal")` drops them back to green, which breaks the overview's "keep the theme you chose" rule. Covered by Task 1: "should keep an upgraded player's theme when the current style is chosen again".
3. **A hand-edited or future `colorThemeByStyle`**, such as `null`, an array, an unknown style key or an unknown theme id. Covered by Task 1: "should drop unusable remembered themes" and "rememberedThemeFor falls back to the style's first theme".
4. **Clearing records while a game is unfinished.** The dialog promises the unfinished game and the settings are kept. A fix that "clears everything" would also lose the save and the theme. Covered by Task 5: "should keep the unfinished game and settings when clearing records". The disabled state with no records is covered by "should disable clearing when there are no records".
5. **Numbers on Home that look real but are not** (audit 12 territory). A player with no games would see "Win rate 0%". If clues were counted, the progress percentage would start near 37% on a fresh save. Covered by Task 9: "should say no games yet instead of a 0% win rate", and by Task 7: "should count only the player's cells in the progress".

---

### Task 1: Style choice and a remembered theme per style

**Files:**
- Modify: `src/application/SettingsStorage.ts`, `src/theme/palettes.ts`, `src/stores/settingsStore.ts`
- Test: `src/__tests__/application/SettingsStorage.test.ts`, `src/__tests__/theme/palettes.test.ts`, `src/__tests__/stores/settingsStore.test.ts`

**Interfaces (Produces):**
```ts
// SettingsStorage.ts
export type RememberedThemes = Partial<Record<StyleId, ColorThemeId>>;
// Settings gains: colorThemeByStyle: RememberedThemes
// palettes.ts (relative imports only)
export const rememberedThemeFor: (style: StyleId, remembered: RememberedThemes) => ColorThemeId;
//   remembered[style] when it is one of STYLES[style].themes, otherwise STYLES[style].themes[0].id
// settingsStore gains:
//   colorThemeByStyle: Ref<RememberedThemes>
//   setStyle(id: StyleId): void   // style = id, then setColorTheme(rememberedThemeFor(id, colorThemeByStyle))
//   setColorTheme(id) also sets colorThemeByStyle[style] = id before persisting
```

**`loadSettings` rules:**
- Always build a fresh `colorThemeByStyle` object; never share `DEFAULT_SETTINGS`'s object.
- A stored value that is not a plain object (`null`, an array, a string) becomes `{}`.
- Drop entries whose key is not in `STYLE_IDS` or whose value is not in `COLOR_THEME_IDS`.
- After `colorTheme` is normalised, set `colorThemeByStyle[style] = colorTheme`. The current theme is the truth for the current style.

`setStyle` goes through `setColorTheme`, so favicon, manifest, persistence and the launcher icon all follow. Appearance sync already watches `style` and `colorTheme`, so the change applies live.

- [ ] **Step 1: Write the failing tests.**
  - `SettingsStorage.test.ts`:
    - The defaults `toEqual` gains `colorThemeByStyle: { minimal: "green" }`.
    - `it("should seed the remembered theme from colorTheme for settings saved before it existed")`: store `{ colorTheme: "blue" }` → `{ minimal: "blue" }`.
    - `it("should drop unusable remembered themes")`: `{ colorThemeByStyle: null }` → `{ minimal: "green" }`. `{ colorThemeByStyle: ["blue"] }` → `{ minimal: "green" }`. `{ colorTheme: "teal", colorThemeByStyle: { neon: "blue", minimal: "crimson" } }` → `{ minimal: "teal" }`.
    - `it("should not share the remembered theme map between loads")`: with nothing stored, `loadSettings().colorThemeByStyle.minimal = "teal"`, then a second `loadSettings()` → `{ minimal: "green" }`.
  - `palettes.test.ts`:
    - `rememberedThemeFor("minimal", { minimal: "teal" })` → `"teal"`
    - `it("rememberedThemeFor falls back to the style's first theme")`: `({})` → `"green"`, and `({ minimal: "crimson" as ColorThemeId })` → `"green"`
  - `settingsStore.test.ts`:
    - `it("should remember the theme chosen for the current style")`: `setColorTheme("teal")` → the stored JSON has `colorThemeByStyle` `{ minimal: "teal" }`, and a fresh pinia's store has `colorThemeByStyle.minimal === "teal"`.
    - `it("should keep an upgraded player's theme when the current style is chosen again")`: store `{ colorTheme: "blue" }`, then `setStyle("minimal")` → `colorTheme === "blue"` and `style === "minimal"`.
    - `it("should persist the chosen style")`: `setStyle("minimal")` → the stored JSON has `style: "minimal"`.
- [ ] **Step 2:** Run `npx vitest run src/__tests__/application/SettingsStorage.test.ts src/__tests__/theme/palettes.test.ts src/__tests__/stores/settingsStore.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** per the rules above. `persistAll` writes `colorThemeByStyle`.
- [ ] **Step 4:** Run the same command again. Expect PASS. Then run the full gate.
- [ ] **Step 5: Commit** `✨ feat: let the style be chosen and remember a theme per style`

---

### Task 2: Shared `OptionTile` and `SettingsGroup`

**Files:**
- Create: `src/presentation/components/option-tile/OptionTile.vue`, `src/presentation/pages/settings/components/SettingsGroup.vue`
- Test: `src/__tests__/presentation/components/option-tile/OptionTile.test.ts`

**Interfaces (Produces):**
```ts
// OptionTile.vue
// props: pressed: boolean; label: string; description: string; icon: Component; wide?: boolean (default false)
// emits: toggle: []
// DOM: one <button type="button"> with aria-pressed, v-press; data-testid falls through from the caller
//   pressed:   bg-primary border-primary text-on-primary; the description is text-on-primary as well
//   unpressed: bg-card border-border text-foreground; the icon is text-primary; the description is text-foreground-secondary
//   both:      border-2 rounded-2xl p-3 min-h-28 text-left, label text-sm font-semibold, description text-xs
//   data-testid="option-tile-mark" top-right: Check inside a filled on-primary circle when pressed, an empty ring
//     (border-2 border-border) when not. The state is never shown by colour alone.
//   wide: flex-row layout (icon, then text, then mark) and min-h-0; the grid caller adds col-span-2
// SettingsGroup.vue
// props: id: string; title: string; icon: Component
// DOM: <section :data-testid="`settings-group-${id}`"> → <h2> (icon size 16 text-primary + title,
//   text-foreground-secondary text-[13px] font-semibold) → a bg-card rounded-2xl shadow-card-sm p-3 card holding the default slot
```

- [ ] **Step 1: Write the failing tests** in `OptionTile.test.ts`. Mount with `Sparkles` as the icon.
  - `it("should expose its state with aria-pressed")`: `pressed: true` → `"true"`. After `setProps({ pressed: false })` → `"false"`.
  - `it("should be solid primary when pressed and an outline when not")`: pressed → classes include `bg-primary` and `text-on-primary`. Unpressed → `bg-card` and `border-border`, with no `bg-primary`.
  - `it("should show a check mark only when pressed")`: `option-tile-mark` contains an `svg` only when pressed.
  - `it("should emit toggle on click")`.
  - `it("should give press feedback")`: `pointerdown` → the root has `is-pressed`.
  - `it("should render label and description")`.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement** both components. `SettingsGroup` has no logic, so Task 3's group-order test covers it.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add option tiles and settings group cards`

---

### Task 3: Settings groups in the new order, with Gameplay option tiles

**Files:**
- Modify: `src/presentation/pages/settings/Settings.vue`, both message files
- Test: `src/__tests__/presentation/pages/settings/Settings.test.ts`, `src/__tests__/presentation/Settings.test.ts` (the toggle count goes from 4 to 5)

**Layout:**
- Wrap each section in `SettingsGroup`. Use these ids, titles and icons in this order:
  1. `gameplay`: `settings.gameplay`, `Gamepad2`
  2. `appearance`: `settings.appearance`, `Palette`
  3. `language`: `settings.language.label`, `Languages`
  4. `about`: `settings.about`, `Info`
- Task 5 inserts `data` before `about`. Leave the current Support section after About; Task 6 folds it in.
- The Language group holds stage 1's language `SegmentedControl` unchanged (`language-switcher`, `language-*`).
- Gameplay is a `grid grid-cols-2 gap-2` of `OptionTile`s. `data-testid` stays `toggle-<key>`.
- There are five tiles, so the last one (`showRemainingCount`) is `wide` with `col-span-2`.

| key | icon | setter |
|---|---|---|
| `highlightSameDigit` | `Highlighter` | `setHighlightSameDigit` |
| `highlightScope` | `Crosshair` | `setHighlightScope` |
| `completionFlash` | `Sparkles` | `setCompletionFlash` |
| `autoRemoveNotes` | `Eraser` | `setAutoRemoveNotes` |
| `showRemainingCount` | `Hash` | `setShowRemainingCount` |

**Copy:** replace the four existing `settings.toggles.*` entries and add `highlightScope`. The text is short so it fits a ~144px tile at 360px.

| key | en label / description | zh-Hant label / description |
|---|---|---|
| `highlightSameDigit` | "Same Numbers" / "Light up matching digits" | 「標示相同數字」／「同樣數字一起亮」 |
| `highlightScope` | "Row, Column & Box" / "Shade the selected cell's lines" | 「標示同列、欄、宮」／「淡淡標出所在範圍」 |
| `completionFlash` | "Completion Flash" / "Flash a finished row or box" | 「完成動畫」／「完成一組時閃一下」 |
| `autoRemoveNotes` | "Auto-Clear Notes" / "Clear notes a digit rules out" | 「自動移除筆記」／「填入後清掉相同筆記」 |
| `showRemainingCount` | "Remaining Count" / "Show how many are left on each key" | 「剩餘數量」／「數字鍵上顯示還差幾個」 |

- [ ] **Step 1: Write the failing tests** in `pages/settings/Settings.test.ts`, on web:
  - `it("should show the groups in order")`: the `data-testid` values of `[data-testid^='settings-group-']` equal `["settings-group-gameplay", "settings-group-appearance", "settings-group-language", "settings-group-about"]`.
  - `it("should show five gameplay tiles in order")`: within `settings-group-gameplay`, the `[data-testid^='toggle-']` ids are `toggle-highlightSameDigit`, `toggle-highlightScope`, `toggle-completionFlash`, `toggle-autoRemoveNotes`, `toggle-showRemainingCount`, and all are `aria-pressed="true"` by default.
  - `it("should turn row, column and box highlighting off from its tile")`: click `toggle-highlightScope` → `useSettingsStore().highlightScope === false`, `aria-pressed="false"`, and the stored JSON has `highlightScope: false`.
  - `it("should sync every tile with its setting")`: `it.each` over the other four keys. One click → that store value is `false` and the tile has `aria-pressed="false"`.
  - Extend "should switch the whole page to Chinese immediately…": after the zh click, `settings-group-gameplay` text contains 「遊戲」 and 「標示同列、欄、宮」.
  - In `presentation/Settings.test.ts`, "should render 4 toggle switches" becomes 5.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.** The toggles list keeps its computed shape and adds `icon`. Drop the old switch markup.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: group settings into cards and turn gameplay switches into tiles`

---

### Task 4: Appearance group — style cards, the style's swatches, light/dark

**Files:**
- Create: `src/presentation/pages/settings/components/StyleThumbnail.vue`
- Modify: `Settings.vue`, both message files
- Test: `src/__tests__/presentation/pages/settings/Settings.test.ts`

**Interfaces:**
```ts
// StyleThumbnail.vue — props: palette: Palette. data-testid="style-thumbnail", aria-hidden="true".
//   A 3:2 box in palette.background holding a 3×3 mini board of palette.card cells (one cell in palette.highlight,
//   one carrying a palette.primary dot) and a palette.primary pill underneath. Colours go only through :style.
```

**Appearance group content, in order:**
1. **Style:** a `text-[15px] font-medium` label `settings.style.label`, then a `grid grid-cols-3 gap-2` of style cards, one per `STYLE_IDS`.
   - Each card is a button `style-option-<id>` with `aria-pressed` and `v-press`.
   - It contains `StyleThumbnail` with `getPalette(id, rememberedThemeFor(id, colorThemeByStyle), "light")`, then the name `settings.style.names.<id>`.
   - Selected: `border-2 border-primary`. Unselected: `border-2 border-border`.
   - A click calls `setStyle(id)`.
   - ⚙︎ Thumbnails always use the light palette, because they stand for the style, not the current mode.
2. **Theme colour:** the label `settings.colorTheme`, then swatches from `STYLES[settingsStore.style].themes`, which replaces `THEMES`.
   - Each swatch keeps `color-theme-<id>` and its split primary/accent look, using `getPalette(style, id, "light")`.
   - It adds `aria-pressed` and `aria-label` = `settings.colorThemes.<id>`, and keeps `color-theme-check` on the selected one.
   - The check icon takes that palette's `on-primary` through `:style`, so it stays readable in dark mode.
3. **Light/dark:** stage 1's `appearance-switcher` moves here unchanged, with the `settings.colorMode.label` label. It is the only appearance control on the page.
4. **App icon (native only):** an `OptionTile`, `wide`, `toggle-matchLauncherIconToTheme`, with the `Smartphone` icon, label `settings.matchLauncherIcon` and description `settings.matchLauncherIconNote`.

| key | en | zh-Hant |
|---|---|---|
| `settings.style.label` | "Style" | 「風格」 |
| `settings.style.names.minimal` | "Minimal Motion" | 「極簡動態」 |
| `settings.colorThemes.green` / `blue` / `purple` / `orange` / `pink` / `teal` | "Green" / "Blue" / "Purple" / "Orange" / "Pink" / "Teal" | 「綠」／「藍」／「紫」／「橘」／「粉紅」／「青綠」 |

- [ ] **Step 1: Write the failing tests.**
  - `it("should show the minimal style as the selected style card")`: `style-option-minimal` has `aria-pressed="true"`, text "Minimal Motion" and a `style-thumbnail` inside. In zh it reads 「極簡動態」.
  - `it("should apply a style through the store")`: `vi.spyOn(useSettingsStore(), "setStyle")` before mount, then click the card → called with `"minimal"`.
  - `it("should list the current style's themes with names and state")`: the swatch count equals `STYLES.minimal.themes.length`. `color-theme-blue` has `aria-label="Blue"` and `aria-pressed="false"`, and `color-theme-green` has `aria-pressed="true"`.
  - `it("should switch light and dark live")`:
    - Start `startAppearanceSync(storeToRefs(useSettingsStore()), { apply: vi.fn().mockResolvedValue(undefined) })`.
    - Click `appearance-dark` → `document.documentElement.classList.contains("dark")`.
    - Click `appearance-light` → not dark.
    - Stop the sync in `finally` and reset `className`.
  - `it("should keep a single appearance control inside the appearance group")`: `findAll("[data-testid='appearance-switcher']")` has length 1, and it is inside `settings-group-appearance`.
  - The existing match-launcher-icon tests stay green. Add: on native, `toggle-matchLauncherIconToTheme` has `aria-pressed="false"` and sits inside `settings-group-appearance`.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.** Remove the stage 1 temporary placement, which is now this group's item 3.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: pick style, theme and light or dark from the appearance group`

---

### Task 5: Data group — Clear All Records moves from Statistics

**5a, structural:** move the dialog and its copy.
- `git mv` `src/presentation/pages/statistics/ClearRecordsDialog.vue` and `useClearRecordsDialog.ts` to `src/presentation/pages/settings/components/`.
- Rename the message keys `statistics.clearRecords` → `settings.data.clearRecords` and `statistics.clearDialog.*` → `settings.data.clearDialog.*` in both files, the dialog and `Statistics.vue`.
- Statistics keeps working from the new path, and its tests stay green unchanged.
- [ ] **Step 1:** Make the move. Run the full gate. Expect PASS with no test edits.
- [ ] **Step 2: Commit** `♻️ refactor: move the clear-records dialog under settings`

**5b, behavioural:**

**Files:**
- Modify: `Settings.vue`, `Statistics.vue` (remove the sticky button, `ClearRecordsDialog` and `provideClearRecordsDialog`), `ClearRecordsDialog.vue` (add `v-press` if missing), both message files
- Test: `src/__tests__/presentation/pages/settings/Settings.test.ts`, `src/__tests__/presentation/Statistics.test.ts`

**Layout:**
- Add a `data` group (`settings.groups.data`, icon `Database`) between language and about.
- Inside it, `clear-records-button` is a full-width `h-11` text button: `Trash2` plus the label, in `text-danger`, with no fill and no border.
- It is `disabled` (with `disabled:text-foreground-muted`) while `statisticsStore.statistics.overall.gamesPlayed === 0`.
- `Settings.vue` provides the dialog. On `"confirm"` it calls `statisticsStore.clearAll()`.

| key | en | zh-Hant |
|---|---|---|
| `settings.groups.data` | "Data" | 「資料」 |
| `settings.data.clearDialog.message` (replace) | "All game records, including their reviews, plus your win rate and best times will be permanently deleted. This can't be undone. Your unfinished game and settings are kept." | 「所有遊戲紀錄（包括遊戲回顧）、勝率和最佳時間都會永久刪除，無法復原。未完成的遊戲和設定會保留。」 |

- [ ] **Step 1: Write the failing tests.**
  - `Settings.test.ts`:
    - Group order now includes `settings-group-data` before `settings-group-about`.
    - `it("should disable clearing when there are no records")`: `clear-records-button` has the `disabled` attribute.
    - `it("should be a quiet text button")`: after recording one game, it has `text-danger`, and has neither `bg-danger` nor `border-danger`.
    - `it("should say what clearing deletes and keeps")`: click → `clear-records-dialog` contains the en message. Under zh-Hant it contains 「未完成的遊戲和設定會保留」.
    - `it("should clear records on confirm")` and `it("should keep records on cancel")`: history length 0 and 1 (moved from Statistics).
    - `it("should keep the unfinished game and settings when clearing records")`: `useGameStore().persistGame(save)` with a `dummySave` like Home.test's, plus `setColorTheme("blue")` and one recorded game. Confirm, then `flushPromises()` →
      - `useGameStore().savedGame` is not null
      - `useSettingsStore().colorTheme === "blue"`
      - the stored settings JSON has `colorTheme: "blue"`
      - `clear-records-button` is now `disabled`
  - `Statistics.test.ts`:
    - Delete the four clear-records tests and "should show the clear records dialog in Traditional Chinese".
    - Add `it("should not offer clearing records")`: with one record there is no `clear-records-button`.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: move clearing records to a quiet button in settings`

---

### Task 6: About group — version and changelog, privacy policy, Donate

**Files:**
- Create: `src/presentation/pages/settings/externalLinks.ts` (`export const PRIVACY_POLICY_URL = "https://blazer030.github.io/sudoku/privacy-policy.html";`, the URL already filed in `docs/play-console-launch.md`)
- Modify: `Settings.vue`, both message files (remove `settings.support`)
- Test: `src/__tests__/presentation/pages/settings/Settings.test.ts`

**Rows,** each `h-13` and divided by `border-border`:
1. `version-link`: label `settings.version`, the version on the right, a chevron, and it opens the changelog.
2. `privacy-policy-link`: an `<a>` with `href={PRIVACY_POLICY_URL}`, `target="_blank"` and `rel="noopener noreferrer"`, label `settings.privacyPolicy`, and an `ExternalLink` icon. Capacitor hands off-host navigation to the system browser, so the app needs no plugin.
3. `donate-link`: same gating as today (`platform.isNative && donateStore.products.length > 0`), label `settings.donate`. The separate Support section is removed.

| key | en | zh-Hant |
|---|---|---|
| `settings.version` (replace) | "Version & Changelog" | 「版本與更新日誌」 |
| `settings.privacyPolicy` | "Privacy Policy" | 「隱私權政策」 |

- [ ] **Step 1: Write the failing tests.**
  - `it("should link to the privacy policy in a new window")`: on web, `privacy-policy-link` has `href` equal to `"https://blazer030.github.io/sudoku/privacy-policy.html"` (the literal string), `target` `"_blank"`, and `rel` containing `"noopener"`. Its text is "Privacy Policy", and 「隱私權政策」 under zh.
  - `it("should keep the about rows in order")`: on native with products, the ids inside `settings-group-about` are `version-link`, `privacy-policy-link`, `donate-link`.
  - The four existing donate-gating tests stay as they are. In "shows the donate entry on native…", add that `donate-link` is inside `settings-group-about`.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add the privacy policy link and fold donate into about`

---

### Task 7: Home — the Continue card shows difficulty, time and progress

**Files:**
- Modify: `src/presentation/components/continue-button/ContinueButton.vue`, both message files
- Test: `src/__tests__/presentation/Home.test.ts`

**Layout:**
- `continue-button` stays one `<button>` with `v-press`.
- It becomes a `bg-primary text-on-primary rounded-2xl shadow-primary px-5 py-4` card.
  - Row 1: `Play` and 「繼續遊戲」 (`text-lg font-semibold`).
  - Row 2: three `text-sm` spans with `bg-on-primary/20 rounded-full px-2.5 py-0.5`:
    - `continue-difficulty`: the difficulty label
    - `continue-time`: `formatTime`
    - `continue-progress`: `home.continueProgress` with `percent` = `computeAbandonProgress(saved.cells, saved.answer).progressPct`

| key | en | zh-Hant |
|---|---|---|
| `home.continueProgress` | "{percent}% filled" | 「已填 {percent}%」 |

- [ ] **Step 1: Write the failing tests.**
  - `it("should show the saved difficulty, time and progress")`: `dummySave` → `continue-difficulty` "Easy", `continue-time` "03:24", `continue-progress` "0% filled". Under zh: 「簡單」 and 「已填 0%」.
  - `it("should count only the player's cells in the progress")`:
    - Build a save from `knownPuzzle` / `knownAnswer`: clues from the puzzle, entries equal to the answer on the first 17 empty cells in row-major order. There are 30 clues and 51 empty cells.
    - Expect "33% filled".
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: show difficulty and progress on the continue card`

---

### Task 8: Home — the New Game card holds the difficulty picker

**Files:**
- Modify: `src/presentation/pages/home/Home.vue`
- Test: `src/__tests__/presentation/Home.test.ts`

**Layout:**
- The game area is `flex flex-col gap-3 w-full`. It holds `ContinueButton` first, then `new-game-card` (`bg-card rounded-2xl shadow-card p-3 flex flex-col gap-3`).
- `new-game-card` holds `DifficultySwitcher`, then `new-game-button` (`h-14`, `Plus` icon, `v-press`).
- With no save, `new-game-button` is `bg-primary text-on-primary`, because it is the main action.
- With a save, it is `bg-primary-light text-primary`, so Continue stays the main action.

- [ ] **Step 1: Write the failing tests.**
  - `it("should put the difficulty picker inside the new game card, right above its button")`: `new-game-card` contains `difficulty-switcher`, and `difficulty-switcher`'s `nextElementSibling` is `new-game-button`.
  - `it("should keep continue apart from the new game card")`: with `dummySave`, `new-game-card` does not contain `continue-button`. `continue-button` comes before `new-game-card` (`compareDocumentPosition` has `DOCUMENT_POSITION_FOLLOWING`).
  - `it("should show only the new game card without a save")`: no `continue-button`, and `new-game-button` has `bg-primary`.
  - `it("should make new game secondary while a save exists")`: `new-game-button` has `bg-primary-light` and no `bg-primary`.
  - The existing difficulty, new-game and dialog tests stay green.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: move the difficulty picker into the new game card`

---

### Task 9: Home — secondary entry tiles with subtitles

**Files:**
- Modify: `Home.vue`, both message files
- Test: `src/__tests__/presentation/Home.test.ts`

**Layout:**
- `home-entries` is a `grid grid-cols-3 gap-3 w-full`. It holds `statistics-button`, `walkthrough-button` and `settings-button`, in that order.
- Each tile is one `<button>` with `v-press` and `min-h-22 bg-card rounded-2xl shadow-card px-2 py-3 flex flex-col items-center gap-1`.
  - The icon (`ChartBar`, `Wand2`, `Settings`; size 22; `text-primary`).
  - The label (`text-sm font-semibold text-foreground`).
  - A subtitle span `<id>-subtitle` (`text-[11px] text-foreground-secondary text-center leading-tight`). In en it may wrap to two lines.
- Leave a comment at the grid: "Becomes grid-cols-2 when Technique Lessons adds a fourth tile".

| key | en | zh-Hant |
|---|---|---|
| `home.entries.winRate` | "Win rate {percent}%" | 「勝率 {percent}%」 |
| `home.entries.noGames` | "No games yet" | 「還沒有紀錄」 |
| `home.entries.walkthrough` | "Enter a puzzle, see the steps" | 「輸入題目看解法」 |
| `home.entries.settings` | "Theme, mode, language" | 「主題、深淺色、語言」 |

The statistics subtitle is `noGames` when `statistics.overall.gamesPlayed === 0`. Otherwise it is `winRate` with `Math.round(winRate * 100)`.

- [ ] **Step 1: Write the failing tests.** Add `/statistics` and `/settings` stubs to the Home test router.
  - `it("should show the entries in order")`: the ids of the buttons in `home-entries` are `statistics-button`, `walkthrough-button`, `settings-button`.
  - `it("should say no games yet instead of a 0% win rate")`: `statistics-subtitle` is "No games yet".
  - `it("should show the win rate on the statistics tile")`: record 2 completed games and 1 given-up game → "Win rate 67%". Under zh: 「勝率 67%」.
  - `it("should describe the walkthrough and settings tiles")`: "Enter a puzzle, see the steps" and "Theme, mode, language". Under zh: 「輸入題目看解法」 and 「主題、深淺色、語言」.
  - `it("should make the whole tile the tap target")`: for each tile, the icon `svg`, the label and the subtitle are descendants of the same `button`, and the button has `min-h-22`.
  - `it("should open statistics and settings from their tiles")`: the route becomes `/statistics` and then `/settings`.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: turn home's secondary links into entry tiles with subtitles`

---

### Task 10: Real-browser visual pass (360×780)

**Files:** scripts only, in `/private/tmp/claude-501/-Users-ethan-Project-sudoku/8581f059-8ad5-412a-943e-1b0b712810ab/scratchpad/shots/` (for example `stage3.mjs`, reusing `capture.mjs`'s pinia-driven flows). Add nothing to `src/` and no demo routes.

- [ ] **Step 1: Set up.**
  - Start a dev server of your own: `CHOKIDAR_USEPOLLING=1 npx vite --port <free port> --strictPort`, in the background.
  - Use puppeteer-core from `shots/node_modules` with `executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, a 360×780 viewport, `isMobile` and `hasTouch`.
  - Seed `sudoku-settings` (`language`, `appearance`, `colorTheme`) with `evaluateOnNewDocument`. To get a save, start a game, fill a few cells through pinia, then choose Save & Leave.
- [ ] **Step 2: Capture.**
  - Matrix: zh-Hant and en × light and dark, in green. Settings is also captured in teal light and dark.
  - States:
    1. Home with no save.
    2. Home with a save.
    3. Settings at the top (Gameplay with one tile off).
    4. Settings scrolled to Appearance and Language.
    5. Settings scrolled to Data and About.
    6. The clear-records dialog.
    7. Statistics with records (no clear button).
  - Save to `shots/stage3/<locale>-<theme>-<mode>-<state>.png`.
- [ ] **Step 3: Measure.**
  - Every `home-entries` button and every option tile is at least 44×44 (`getBoundingClientRect`).
  - Home with a save has no vertical scroll: `document.scrollingElement.scrollHeight <= innerHeight`.
  - There is no horizontal overflow on Home or Settings: `scrollWidth <= 360`.
  - In zh, each option-tile description is one line: its height is at most 1.5 × its computed `line-height`.
  - Clicking `appearance-dark` on Settings turns `<html>` dark without a reload. Clicking `language-en` relabels the group headings at once.
- [ ] **Step 4: Review every shot.**
  - On and off tiles are told apart at a glance in light and dark.
  - The off outline is visible on the dark card.
  - The style thumbnail and swatches read well in dark.
  - The Continue card's three chips do not wrap awkwardly in en.
  - Fix any problem test first (`🐛 fix: …`). Copy that does not fit gets shortened in both languages.
- [ ] **Step 5: Report to the user.** Give the shot folder path and list this plan's ⚙︎ choices for review:
  - New Game becomes secondary while a save exists.
  - Progress counts only the player's cells.
  - The statistics tile says 「還沒有紀錄」 instead of 「勝率 0%」.
  - The tile order is Statistics, Walkthrough, Settings.
  - The fifth gameplay tile spans both columns.
  - Thumbnails and swatches always use the light palette.
  - Clear All Records is disabled with no records.
  - The copy tables.

  Manual checks left for the user on Android (`npm run android:run`):
  - The privacy link opens the system browser and the app stays put.
  - The app-icon tile and Donate row appear in About and Appearance as expected.
