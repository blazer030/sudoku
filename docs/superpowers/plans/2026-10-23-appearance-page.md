# Appearance Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the three shipped styles their own app icons, move style/theme/light-dark/app-icon settings onto a new 外觀 page reached from one Settings row, drop the 跟隨系統 appearance and make 紙本筆記 light only.

**Architecture:** A style declares which colour modes it has (`STYLE_COLOR_MODES`); every consumer asks `effectiveColorMode(style, appearance)` instead of resolving "system". Icon artwork moves into a framework-free `src/theme/styleIcons.ts` that both the generator scripts and a new `StyleIcon.vue` render, so the launcher icon and the picker image are the same drawing. The new `Appearance.vue` page reuses the Changelog page shell.

**Tech Stack:** Vue 3 + TS, Pinia, vue-i18n, Vitest, sharp (scripts), Capacitor Android.

**Spec:** the approved design is the style-research canvas (https://claude.ai/artifact/72nsZrRhPbd5nfnKt8UnWE, board 「定案方向」 and the App 圖示 section of 總覽), plus these decisions from chat on 2026-10-23:

- Settings keeps one 外觀 row (current style icon, style name, 「<mode>・<theme>」 summary, chevron). Its page holds: the style cards with the app icon as the image, 色彩主題, 深淺色, and (native only) the existing 「App 圖示配合主題」 OptionTile unchanged. Every tap applies at once; there is no apply button and no preview page.
- 深淺色 offers only 淺色／深色. A style with one mode shows 「這個風格只有淺色」 instead of the control.
- 紙本筆記 is light only.
- Users stored on "system" get whatever the system is at their first launch after the update, saved from then on. Paper users stored on dark see light; their stored choice stays dark so another style still opens dark.
- Icons: 極簡動態 keeps today's tile icon. 實體方塊 = a recessed tray of raised tiles, the centre tile in the theme colour with a 5, one tile pressed. 紙本筆記 = ruled loose-leaf paper with a red margin and three holes, a hand-drawn 3×3 grid in the ink colour, a printed 3, a handwritten 7 circled in red and a handwritten 4. Both follow the theme colour (the canvas file `docs/style-research/generator/icons.py` on `feature/style-research` holds the reference SVGs, 108-unit viewBox).

## Global Constraints

- TDD and Tidy First; structural and behavioural commits separate; every commit green with `npx vitest run`, `npm run lint` and `npx vue-tsc --noEmit`.
- English Conventional Commits with an emoji prefix; no trailers.
- `src/theme/` stays framework-free with relative imports only (scripts import it).
- Named exports only, 4-space indentation, `<script setup>` arrow functions, spelled-out identifiers.
- Tests check that a language switch switches the screen, never exact copy; `data-testid` selectors.
- Never run a bare `npx cap sync`; Android checks go through `npm run android:build:dev` and the emulator peer session.
- zh-Hant copy follows CLAUDE.md "Copy (zh-Hant)".

## Review Focus

1. A user who has 「App 圖示配合主題」 on and sits on a `paper…Dark` launcher alias must still have a launcher entry after the update, and the app must not crash when it re-targets the icon (Task 5 keeps those aliases as legacy).
2. A stored `"system"` appearance must become light or dark once, be saved, and agree between index.html's first paint and the app (Tasks 2 and 3).
3. Choosing 紙本筆記 while dark must yield light everywhere at once: page class, system bars, the native bridge, the theme-color meta and the launcher key (Task 3).
4. A hand-edited or future appearance value (e.g. "sepia") falls back like "system" does (Task 2).
5. Android Back from the 外觀 page returns to Settings, not Home (Task 8).

---

### Task 1: Styles declare their colour modes

**Files:** Modify `src/theme/themeIds.ts`. Test `src/__tests__/theme/themeIds.test.ts` (create if absent).

**Interfaces — Produces:**
- `STYLE_COLOR_MODES: Readonly<Record<StyleId, readonly ColorMode[]>>` — minimal and tactile `["light","dark"]`, paper `["light"]`.
- `effectiveColorMode(style: StyleId, mode: ColorMode): ColorMode` — `mode` when the style has it, else the style's first mode.

- [ ] Failing tests: paper + dark → light; tactile + dark → dark; every style lists light.
- [ ] Implement; full suite green; commit `✨ feat: let a style say which colour modes it has`.

### Task 2: Appearance is light or dark, chosen once from the system

**Files:** Modify `src/theme/themeIds.ts` (`APPEARANCES` → `COLOR_MODES = ["light","dark"]`; `Appearance` removed, call sites use `ColorMode`), `src/application/settings/SettingsStorage.ts`, `src/stores/settingsStore.ts`. Tests `src/__tests__/application/settings/SettingsStorage.test.ts`, `src/__tests__/stores/settingsStore.test.ts`.

**Interfaces — Produces:** `Settings.appearance: ColorMode`; `loadSettings()` turns a missing, `"system"` or unknown appearance into `matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"` and saves the result when it changed anything; `setAppearance(mode: ColorMode)`.

- [ ] Structural commit first if renames are needed (`♻️ refactor:`), suite green before and after.
- [ ] Failing tests (defect-style pair not needed — new behaviour): fresh install with system dark → "dark"; stored "system" with system light → "light" and localStorage now holds "light"; stored "sepia" → system value; stored "dark" stays "dark".
- [ ] Implement; update the existing "system" assertions; commit `✨ feat: save light or dark instead of following the system`.

### Task 3: Everything follows the effective mode

**Files:** Modify `src/presentation/theme/appearanceSync.ts`, `src/presentation/theme/launcherIconSync.ts`, `src/presentation/theme/useColorMode.ts` (remove if only Settings used it), `src/theme/palettes.ts` (`getPalette` applies `effectiveColorMode` itself so it can never miss), `src/application/appearanceBridge/AppearanceBridgeService.ts` (`setAppearance(mode: ColorMode)`), `index.html` inline script. Tests `appearanceSync.test.ts`, `launcherIconSync.test.ts`, `noFlashScript.test.ts`, `palettes.test.ts`.

**Interfaces — Consumes:** Task 1 `effectiveColorMode`, Task 2 `ColorMode` appearance. **Produces:** the `.dark` class, system bars, `appearanceBridge.setAppearance`, theme-color meta, favicon and launcher key all use `effectiveColorMode(style, appearance)`; no `matchMedia` listener remains in the sync.

- [ ] Failing tests: style paper + appearance dark → no `.dark` class, bridge receives "light", launcher key `paperBlueInk`; switching style from paper to minimal while appearance dark → `.dark` and bridge "dark"; index.html script with paper + dark paints light and the paper light bar colour; index.html with stored "system" still resolves through `prefers-color-scheme` (first paint before the app migrates).
- [ ] Implement; commit `✨ feat: apply each style's own colour mode everywhere`.

### Task 4: Paper is light only

**Files:** Modify `src/theme/paletteBuilder.ts` (a theme may omit `dark`; add a light-only builder), `src/style/styles/paper/palette.ts` (drop dark neutrals, dark extras, `lamp`), `src/style/styles/paper/skin.css` (drop `:root.dark[data-style="paper"]` blocks), regenerate `src/style/themes.generated.css` (`npm run generate:theme-css`; `renderThemeCss` skips missing dark). Tests: `paletteContrast.test.ts`, `palettes.test.ts`, `themesGenerated.test.ts`, `styleCoverage.test.ts`, `style/styles/paper/surface.test.ts`, `board.test.ts`.

- [ ] Failing test: `renderThemeCss` emits no `.dark` block for paper; contrast tests iterate `STYLE_COLOR_MODES` instead of both modes.
- [ ] Remove the dark-only paper tests (lamp at night) and the coverage rule for the paper dark selector.
- [ ] Implement; regenerate CSS; commit `✨ feat: keep paper notebook light only`.

### Task 5: Launcher icons per supported mode, with legacy paper aliases

**Files:** Modify `src/theme/launcherIcon.ts`, `src/infrastructure/icon/DynamicIconAdapter.ts`, `scripts/generate-launcher-icons.ts`, `scripts/generate-pwa-icons.ts`. Tests `launcherIcon.test.ts`, `launcherIconAssets.test.ts`, `iconAssets.test.ts`, `android/AndroidManifest.test.ts`, `DynamicIconAdapter.test.ts`.

**Interfaces — Produces:**
- `LAUNCHER_ICONS` = every style × theme × `STYLE_COLOR_MODES[style]` (23 icons).
- `LEGACY_LAUNCHER_ALIASES: readonly { key: string; icon: LauncherIconKey }[]` — `paperBlueInkDark`, `paperGreenInkDark`, `paperRedInkDark`, each drawing its light twin's icon.
- `ALL_LAUNCHER_ALIASES: readonly string[]` — icon keys then legacy keys; the manifest and the adapter's `disable` list both use it.

- [ ] Failing tests: manifest aliases equal `ALL_LAUNCHER_ALIASES`; a legacy alias's `android:icon` is its light twin's mipmap; the adapter disables every alias but the chosen one, legacy included; no `paper…Dark` mipmap/xml/svg files remain.
- [ ] Implement; delete orphaned paper dark assets (the generator never deletes); regenerate; commit `✨ feat: keep old paper dark launcher entries pointing at the light icon`.

### Task 6: Style icon artwork

**Files:** Create `src/theme/styleIcons.ts`; modify `scripts/iconArtwork.ts`, `scripts/generate-launcher-icons.ts`, `scripts/generate-pwa-icons.ts`; regenerate `public/` and `android/app/src/main/res/`. Tests `src/__tests__/theme/styleIcons.test.ts`, `iconAssets.test.ts`, `launcherIconAssets.test.ts`.

**Interfaces — Produces:**
- `styleIconSvg(style: StyleId, palette: Palette): string` — full square SVG, viewBox `0 0 108 108`, no outer rounding (callers mask it).
- `styleIconForeground(style, palette): string` — the adaptive foreground (whole artwork for tactile and paper, tiles only for minimal, as today).
- `styleIconMonochrome(style): string` — one-colour silhouette (minimal: tiles; tactile: tiles; paper: grid, digits and circle).
- Colours come from the palette: minimal `primary`/`on-primary`; tactile `background` tray, `border` well, `card` tiles, `shadow`-mixed ledges, `primary`/`on-primary` centre tile; paper `background` paper, `rule`, `margin-line`, `primary` ink, `danger` circle.

- [ ] Failing tests: minimal's SVG still has the 3×3 tiles in on-primary on primary (today's icon); tactile's centre tile uses the theme primary; paper's grid strokes use the ink (`primary`) and the margin uses `margin-line`; each style's monochrome has a single fill colour.
- [ ] Implement; adaptive background stays a colour (minimal `primary`, tactile `background`, paper `background`); foreground PNGs are per variant for tactile and paper; legacy PNGs and favicons mask the square to a rounded rect (rx 25%).
- [ ] Regenerate with `npm run generate:launcher-icons` and `npm run generate:icons`; commit `✨ feat: draw tactile and paper their own app icons`.

### Task 7: StyleIcon component

**Files:** Create `src/presentation/components/style-icon/StyleIcon.vue`. Test `src/__tests__/presentation/components/style-icon/StyleIcon.test.ts`.

**Interfaces — Produces:** `<StyleIcon :style-id :palette :size />` renders `styleIconSvg` inside a rounded (24%) clip with `data-testid="style-icon-<id>"` and `role="img"` + `aria-label` from the style name.

- [ ] Failing test: renders the given style's drawing; label follows the locale.
- [ ] Implement; commit `✨ feat: show a style's app icon as a component`.

### Task 8: The 外觀 page

**Files:** Create `src/presentation/pages/settings/Appearance.vue`; modify `src/router.ts` (`ROUTER_PATH.appearance = "/settings/appearance"`), `Settings.vue` (appearance group becomes one row), i18n `en.ts`/`zh-Hant.ts` (drop `settings.colorMode.system`; add `settings.colorMode.onlyLight` 「這個風格只有淺色」/"This style is light only"; add `settings.appearanceSummary` 「{mode}・{theme}」). Delete `StyleThumbnail.vue`, `thumbnail.ts` per style, `thumbnailLook.ts` and their tests. Tests: create `src/__tests__/presentation/pages/settings/Appearance.test.ts`; move the appearance cases out of `Settings.test.ts`; `ruledPages.test.ts` picks the route up.

- [ ] Failing tests: Settings shows one `appearance-row` with the current style icon and a summary that changes with mode/theme, and pushes `/settings/appearance`; the page lists the three styles with `StyleIcon`s, selecting one applies at once; swatches follow the style; `appearance-switcher` has exactly light and dark; with paper the switcher is replaced by `appearance-only-light`; the icon OptionTile shows only on native; Back returns to Settings.
- [ ] Implement (page root `data-skin="page"`, Changelog's header pattern); commit `✨ feat: move appearance settings onto their own page`.
- [ ] Structural cleanup commit: remove thumbnails and unused helpers (`♻️ refactor:`).

### Task 9: Docs and device check

- [ ] Update CLAUDE.md (themeIds.ts line, style registration list without `thumbnail.ts`, add `styleIcons.ts`) and README if it lists settings; commit `📄 docs: …`.
- [ ] `npm run android:build:dev`; ask the emulator peer to check: fresh install follows the system once; paper forces light incl. system bars and splash on next launch; icon toggle switches the launcher icon for tactile and paper; an existing paper-dark alias user keeps a launcher entry.
- [ ] Delete this plan once the work is merged.
