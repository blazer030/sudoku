# Per-style Loading, Group Completion and Puzzle Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give minimal, tactile, paper, pixel and cyber their own loading animation, row/column/box completion effect and puzzle-complete celebration, as drawn on the style-research canvas, through one per-style registry. Replace the Lottie loader and the game's fireworks.

**Architecture:**
- A typed registry, `STYLE_MOMENTS: Record<StyleId, StyleMoments>`, gives each style a loader component, a celebration component and its group-effect timing.
- The shared `PuzzleLoader` and the game's completion flow only ask the registry.
- Cells carry their row, column and box as CSS variables. A group effect carries its kinds and origin, so effects are CSS-driven, with a board overlay layer for the per-group drawings.
- The motion gate (`useMotionAllowed`) decides group effects and celebration motion. The loader follows only system reduced motion.

**Tech Stack:** Vue 3 + TS + Tailwind v4, Vitest + @vue/test-utils, PostCSS sheet tests, inline SVG, CSS keyframes.

**Spec:** `docs/superpowers/specs/2026-10-24-style-moments-design.md`.

**Visual reference (read-only):** `/Users/ethan/Project/sudoku/.worktrees/style-research/docs/style-research/project/`:
- `Moments<Style>.dc.html`: loading and celebration, with its 減少動態 variant.
- `Group<Style>.dc.html`: row, column and box completion.
- `canvas.json`: notes `momentsNote1–5` and `groupNote1–5`.

## Global Constraints

- **Branch and worktree:** work in worktree `/Users/ethan/Project/sudoku/.worktrees/style-moments`, branch `feature/style-moments`. Never merge; the owner merges.
- **Commits:**
  - English Conventional Commits with an emoji prefix. No trailers (no Co-Authored-By, no Claude-Session).
  - Structural (♻️) and behavioural changes go in separate commits. Commit at every GREEN.
- **Before each commit,** all of these are clean, with no new warnings:
  - `npx vitest run`
  - `npm run lint`
  - `npx vue-tsc --noEmit`
- **No shared component checks a style id.** Styles are reached only through `STYLE_MOMENTS` and their `[data-style]` skins.
- **Motion rules (owner):**
  - Group effects play only when `useMotionAllowed()()` is true; otherwise nothing plays.
  - When motion is not allowed, the celebration shows the style's still end state, and the dialog appears without motion.
  - The loader plays regardless of the setting; under `prefers-reduced-motion` it shows the board's still version.
- **The final entry (owner):** the entry that solves the puzzle plays the celebration only. It plays no group effect and no whole-board ripple.
- **The celebration plays** only on the just-completed event in play. It never plays on reload, in Game Review, or on reopening.
- **Words in effects (owner):** paper's stamp reads 「完成」 in zh-Hant and "SOLVED" in English (Caveat), from i18n. STAGE CLEAR, NOW LOADING, MISSION COMPLETE and ROW/COL/BOX OK are English decoration in both languages, `aria-hidden`.
- **Dates:** the paper stamp's date follows the copy rule: 「10/24」, a slash date with no year.
- **Skin rules** (`src/__tests__/style/styleSheetRules.ts`):
  - scoped `[data-style="<id>"]` selectors;
  - keyframes prefixed with the style id;
  - no layout properties outside pseudo-elements in skin CSS;
  - no raw colours (tokens and `color-mix()`);
  - every animation stopped under `prefers-reduced-motion`.
- **Fonts:** only bundled faces. New characters (「完成」, "SOLVED") go through `npm run generate:fonts`.
- **Flashing:** at most two flashes per row (pixel), and never more than three flashes per second.
- **Timing to the first tappable dialog button:** about today's, unless the board's sequence is longer. When it is, follow the board.
- **Board versus rules:** port the boards' look. Convert their CSS to the skin rules; timing may move within about 20% to do so.

## Review Focus

1. **The final entry:** filling the last cell, when it also completes a row, column or box, starts the celebration only. No group effect is visible first. *Test in Task 3.*
2. **Motion off:** with 「動態效果」 off or reduced motion on, a completed group shows nothing at all. Solving shows the still end state and an unanimated dialog with working buttons. *Tests in Tasks 2 and 3.*
3. **Rapid entries:** completing two groups in quick succession, or filling while an effect still plays, never blocks input. No stale effect stays stuck on the board. *Test in Task 2.*
4. **Language switch:** paper's stamp text switches between 「完成」 and "SOLVED". Every other dialog word stays translated. *Test in Task 6.*
5. **Leaving mid-celebration:** pressing Back, or the dialog's buttons, during the board phase never leaves timers that open the dialog later or on another screen. *Test in Task 3.*

---

### Task 1: The style-moments registry, with today's look for every style (structural)

**Files:**
- Create:
  - `src/presentation/components/style-moments/styleMoments.ts` (registry and types)
  - `src/presentation/components/style-moments/default/DefaultLoader.vue` (today's Lottie card, moved out of `PuzzleLoader`)
  - `src/presentation/components/style-moments/default/DefaultCelebration.vue` (today's `FireworkCanvas` usage)
- Modify:
  - `src/presentation/components/puzzle-loader/PuzzleLoader.vue`
  - `src/presentation/pages/game/components/GameCompleteModal.vue`
- Tests: `src/__tests__/presentation/components/style-moments/styleMoments.test.ts`, plus the existing `PuzzleLoader` and `GameCompleteModal` tests.

**Interfaces:**
- Produces:
  - `interface StyleMoments { loader: Component; celebration: Component; groupEffectMs: number; celebrationBoardMs: number }`.
    - `groupEffectMs` is how long a group effect runs before `onComplete`.
    - `celebrationBoardMs` is how long the board phase runs before the dialog opens.
  - `STYLE_MOMENTS: Record<StyleId, StyleMoments>`.
  - `useStyleMoments(): ComputedRef<StyleMoments>`, which follows the settings store's `style`.
  - Loader component props: none. It renders its own card and caption from `t("home.generatingPuzzle")`.
  - Celebration component props: `{ still: boolean }`. It renders the decoration layer over the screen. The dialog card itself stays in `GameCompleteModal`.
  - `PuzzleLoader` keeps `visible` and the scrim/transition. It drops `themeColor` and `size`, which no caller passes.

- [ ] **Step 1:** Write a test that `STYLE_MOMENTS` has an entry for every `STYLE_IDS` member (`Object.keys` equals `STYLE_IDS`), and that `PuzzleLoader` renders the current style's loader component.
- [ ] **Step 2:** Run it; it should fail.
- [ ] **Step 3: Implement.**
  - Every style maps to `DefaultLoader` and `DefaultCelebration`.
  - Today's numbers are `groupEffectMs = 500 + max ripple`, which `useCompletionFlash` computes, and `celebrationBoardMs` = the current all-cells flash duration. Keep the current ripple; the numbers only move into the registry.
  - The screens look exactly as before.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `♻️ refactor: route the loader and the completion decoration through a per-style registry`.

### Task 2: Group effects from cell variables, with kinds, origin and an overlay layer

**Files:**
- Modify:
  - `src/domain/game/Sudoku.ts` (`findCompletedGroups` also returns the groups)
  - `src/presentation/pages/game/useGameInteraction.ts`
  - `useCompletionFlash.ts`, renamed `useGroupEffect.ts` in its own ♻️ commit first
  - `GameScreen.vue`
  - `src/presentation/components/board-cell/{Cell,BoardCell}.vue`
  - `src/style/index.css` (the default effect)
- Create: `src/presentation/components/style-moments/GroupOverlay.vue` (a board-sized layer; it renders the current style's group overlay pieces, empty by default)
- Tests:
  - `src/__tests__/domain/game/Sudoku.test.ts`
  - `useGroupEffect` tests
  - `GameScreen` tests
  - the default sheet test

**Interfaces:**
- Produces:
  - `CompletedCells` gains `groups: { kind: "row" | "column" | "box"; index: number }[]`.
  - `useGroupEffect(motionAllowed: () => boolean, durationMs: () => number)` returns:
    - `play(groups, cells, origin, onComplete)`
    - `effect: Ref<{ id: number; groups: …; origin: … } | null>`
    - `isInEffect(row, column): GroupKind[]`
    - With motion off, `onComplete` runs at once and nothing is set.
  - Every cell carries `--cell-row`, `--cell-column` and `--cell-box` (0-based), and while in an effect, `data-group="row column"` (its kinds).
  - The board carries `data-group-effect="<id>"` and `--origin-row` / `--origin-column`. A new effect gets a new id, which restarts CSS animations.
  - `StyleMoments` gains an optional `groupOverlay: Component | null`, rendered by `GroupOverlay` with props `{ effect }`.
  - The default effect is today's flash, driven by CSS delay: `calc((|row − origin row| + |column − origin column|) * 60ms)`. It looks the same as now, including pixel's stepped override.

- [ ] **Step 1 (structural):** Rename `useCompletionFlash` to `useGroupEffect` with the same behaviour. Run the suite. Commit `♻️ refactor: call the completion flash a group effect`.
- [ ] **Step 2: Write the failing tests.**
  - `findCompletedGroups` reports a completed row 4 as `{ kind: "row", index: 4 }`, and row+box together.
  - With motion allowed, `play` sets cells' `data-group` and the board's id. They clear after `durationMs`, and `onComplete` fires then.
  - With motion off, nothing is set and `onComplete` fires at once (Review Focus 2).
  - A second `play` during an effect replaces it, with a new id and the old timers cancelled, so no cell stays marked (Review Focus 3).
  - Cells carry the three variables.
- [ ] **Step 3:** Run them; they should fail.
- [ ] **Step 4: Implement.**
  - Replace the per-cell `setTimeout`s with the effect state plus CSS delays.
  - Keep `flashing` working for styles that still use it until their task, or move them to `[data-group]` now, keeping the same look.
- [ ] **Step 5:** Run the full suite, lint and vue-tsc; all should be green. Screenshot a group completion in minimal and pixel and compare with develop: they should look the same.
- [ ] **Step 6:** Commit `✨ feat: drive group completion effects from cell positions, kinds and origin`.

### Task 3: The celebration sequence: final entry, board phase, still end state

**Files:**
- Modify:
  - `src/presentation/pages/game/useGameSession.ts`
  - `useGameInteraction.ts` (skip the group effect when the entry completes the puzzle)
  - `GameScreen.vue` (board `data-celebration="playing|still"`)
  - `GameCompleteModal.vue` (renders `STYLE_MOMENTS[style].celebration` with `still`)
- Tests: `useGameSession` / `Game` tests, and a `GameCompleteModal` test.

**Interfaces:**
- Consumes: `celebrationBoardMs` (Task 1) and `useMotionAllowed`.
- Produces:
  - On the just-completed event:
    - With motion allowed, the board gets `data-celebration="playing"`. After `celebrationBoardMs` the dialog opens, and the board keeps `data-celebration="done"`.
    - With motion off, the board gets `data-celebration="still"`, the dialog opens at once, and the celebration component gets `still: true`.
  - The whole-board ripple is removed. The style's board phase replaces it.
  - All timers are cancelled on unmount (Review Focus 5).

- [ ] **Step 1: Write the failing tests.**
  - Filling the last cell when it also completes a row: no `data-group` appears on any cell, and the board gets `data-celebration="playing"` (Review Focus 1).
  - The dialog opens after `celebrationBoardMs` (fake timers).
  - With motion off: `data-celebration="still"`, the dialog opens immediately, and the celebration gets `still` (Review Focus 2).
  - Unmounting during `playing` never opens the dialog afterwards (Review Focus 5).
  - Loading a completed game shows no celebration.
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: play the style's celebration on the solving entry, or its still end state`.

### Tasks 4–8: One style each, ported from its boards

Each task is the same shape, one style per task, in this order: **4 minimal**, **5 tactile**, **6 paper**, **7 pixel**, **8 cyber**.

**Files (for style `<id>`):**
- Create:
  - `src/presentation/components/style-moments/<id>/<Id>Loader.vue`
  - `<Id>Celebration.vue`
  - `<Id>GroupOverlay.vue`, only if the style draws per-group pieces (paper, pixel, cyber)
- Modify:
  - `src/style/styles/<id>/skin.css` (group cell effect and board celebration phase)
  - `styleMoments.ts` (the style's entry, with its `groupEffectMs` and `celebrationBoardMs` from the board)
- Tests:
  - `src/__tests__/style/styles/<id>/…` sheet test (create `<id>Moments.test.ts` if the style has none)
  - `src/__tests__/presentation/components/style-moments/<id>/…` component tests
  - `styleCoverage.test.ts` (add the style's required moment selectors)

**What each must match** (from `Moments<Style>.dc.html`, `Group<Style>.dc.html` and their notes):
- **Loader:** the board's 載入中 card, caption and loop. Under `prefers-reduced-motion`, the board's still loader.
- **Group effect:** the board's row, column and box effects, and the row+box case. The overlay pieces are positioned from `effect.groups`.
- **Celebration:**
  - With motion allowed: the board's 過關 sequence. The board phase is in skin CSS on `[data-celebration="playing"]`; the decoration and dialog arrival are in `<Id>Celebration.vue`.
  - With `still`: the board's 減少動態 end state.
- Light/dark (or 掌機/紅白機) as the style has them, through tokens.

**Per style extras:**
- **minimal:** the dark loader uses the higher-contrast version.
- **tactile:** keys press with the existing `--tactile-*` variables. Animate transform, not box-shadow.
- **paper:**
  - Add a stamp message `game.complete.stamp` (zh 「完成」, en "SOLVED").
  - The stamp's date is 「MM/DD」 from today.
  - Run `generate:fonts`.
  - Add a contrast case for the stamp red.
  - Add a test that the stamp text switches with the language (Review Focus 4).
- **pixel:**
  - Use only steps; at most two flashes per row.
  - STAGE CLEAR and NOW LOADING are decorative `aria-hidden`.
  - 掌機 and 紅白機 palettes.
- **cyber:**
  - Glitch and CRT open. ROW/COL/BOX OK tags are decorative.
  - Note glow and clip-path for the Android check.

- [ ] **Step 1: Write the failing tests.**
  - The style's registry entry uses its own components.
  - Its loader renders its card and caption, and the caption switches with the language.
  - Its sheet has `[data-style="<id>"] [data-group~="row"]` (or overlay) rules, a `[data-celebration="playing"]` board rule, and reduced-motion stops.
  - Its celebration with `still` renders the end-state elements and no animated classes.
  - The styleCoverage selectors.
- [ ] **Step 2:** Run them; they should fail.
- [ ] **Step 3:** Port the boards' markup and keyframes, converted to the skin rules.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5: Visual check.**
  - Run the dev server on a free port with `--force`.
  - At 390×844, in zh-Hant and English, in each mode the style has, capture:
    - the loader;
    - a row, a column, a box, and row+box (frames mid-effect);
    - the celebration mid-sequence and at the end;
    - the still celebration with 「動態效果」 off.
  - Save the shots under `.superpowers/sdd/<plan>/screens/<id>/`, compare them with the boards, and report the differences.
- [ ] **Step 6:** Commit `✨ feat: give <style name> its own loading, group completion and celebration`.

### Task 9: Remove the shared leftovers, document, changelog

**Files:**
- Delete: `src/presentation/components/style-moments/default/*` (if no style uses it) and `src/assets/lottie/sudoku-loader.json`.
- Remove the dependency: `vue3-lottie` from `package.json` (`npm uninstall vue3-lottie`).
- Keep: `FireworkCanvas`, which DonateSuccess still uses.
- Update: `CLAUDE.md`, under "Registering a style": add the style's moments (registry entry, loader, celebration, group effect, `groupEffectMs` and `celebrationBoardMs`, coverage selectors).
- Update: `src/presentation/pages/settings/changelogData.ts` `UNRELEASED_CHANGES`. Add a broad line in both languages, e.g. 「每種風格都有專屬的載入與過關效果」 / "Each style has its own loading and celebration effects", following the copy rules.

- [ ] **Step 1:** Write a test that no source file imports `vue3-lottie` or `sudoku-loader.json` (grep-style, like `hardcodedColors`). Run it; it should fail.
- [ ] **Step 2:** Remove them, update the docs and the changelog, and run `npm install` to refresh the lockfile.
- [ ] **Step 3:** Run the full suite, lint, vue-tsc and `npm run build`; all should be green. Report the bundle size change.
- [ ] **Step 4:** Commit `🚧 chore: drop the Lottie loader now that every style draws its own` and `📄 docs: describe registering a style's loading and celebration`.
- [ ] **Step 5 (controller):** hand an Android emulator check to the peer session sudoku-app (`npm run android:build:dev` from this worktree). It covers:
  - each style's loader, group effects and celebration;
  - 「動態效果」 off;
  - English;
  - cyber's glow performance.
