# Redesign Stage 2 (Game Screen) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the game screen, notes, selection, same digits and the selected cell's row, column and box are clear at a glance. Every action gives clear feedback: Check Conflicts, the hint count, labelled buttons and the long press. Finishing and leaving a game are clear flows that are hard to trigger by mistake. This covers audit items 1–8.

**Architecture:** Stage 1 gives us the tokens, `v-press`, the palettes and the contrast test. This stage adds two board tokens, `cell-selected` and `cell-peer`, and tightens the board rules in the contrast test. Board layers are resolved in `Cell.vue` in a fixed priority order and painted by `BoardCell.vue`. The one-off messages (random reveal, no conflicts, the long-press tip) share one game toast. `Game.vue` becomes a thin page that mounts a keyed `GameScreen.vue`, so "Play Again" can start a new game without leaving `/game`.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript strict, Tailwind v4 tokens from `src/theme/palettes.ts`, Pinia, vue-i18n, Vitest + @vue/test-utils (jsdom), puppeteer-core for the visual pass.

**Spec:** `docs/superpowers/specs/2026-10-22-redesign-stage2-game-screen-design.md`. Overview: `docs/superpowers/specs/2026-10-22-redesign-overview-design.md`. Builds on `docs/superpowers/plans/2026-10-22-redesign-stage1-foundation.md`.

---

## Global Constraints

**From the spec**

- **Notes**
  - Note text is at least 10px. The upper bound and the vw slope stay as they are.
  - The note colour is the secondary-text colour: in every palette, `note` equals `foreground-secondary`.
  - Notes reach 4.5:1 on every board surface.
- **Selected cell**
  - It gets a 2px inset `primary` outline.
  - A tapped clue shows this outline too, but the digit pad never writes into a clue.
- **Row, column and box (peers)**
  - The selected cell's row, column and box get a very faint `cell-peer` tint.
  - The tint is controlled by the new setting `highlightScope` (default `true`). Stage 3 adds the switch to the settings screen, so this stage adds no UI for it.
- **Contrast between surfaces:** `highlight` (same digit) vs `cell-clue` ≥ 1.25:1, and `cell-clue` vs `card` ≥ 1.25:1. Clues are bold. Player entries keep the `primary` ink.
- **Layer priority**, from highest to lowest: error → selected → same digit → peer → clue. Each layer has its own token, with light and dark values.
- **Check Conflicts**
  - It never marks a clue.
  - If nothing repeats, a toast says so. It still costs a hint.
  - The menu says it finds repeated digits in a row, column or box.
- **Hint menu**
  - It shows "N hints left this game".
  - The free-hint note appears only before any hint is used in this game.
  - When no hints are left, the options are disabled and the menu says why ("4 per game").
- **Hint panel:** the exit button reads 「關閉」 / "Close" in both phases. The panel shows no deducted count.
- **Controls**
  - Undo, Notes, Hint and Erase each have a visible text label and an `aria-label`.
  - When notes are on, the Notes button is solid `primary` and reads 「筆記 開」.
  - In note mode, the digit keys show smaller digits aligned to the top.
- **Long-press tip:** show it once, the first time a digit is selected, then record it in the `seenLongPressTip` setting.
- **aria-labels**
  - Cells: 「第 r 列第 c 欄，空白／5／筆記 1 3」.
  - Digit keys: 「填入 5，還剩 2 個」.
- **Completion modal**
  - Buttons: Play Again (primary, same difficulty), Review This Game, Back to Home.
  - A "New record!" badge shows when the time beats this difficulty's previous best, or when this is the first win at this difficulty. A tie is not a record.
  - The difficulty becomes a small tag under the title.
- **Leave dialog**
  - The primary button is 「儲存並離開」. 「放棄這局」 is a text button.
  - It explains: 「放棄會記為一場未完成，會影響勝率」.
- **New-game dialog**
  - It shows the saved game's difficulty and elapsed time, with the same explanation.
  - The primary button is 「繼續原本那局」. The secondary is 「放棄並開新局」.
- **Out of scope:** the hint-mode flow, the home and settings layouts, and the How to Play page.

**From stage 1**

- Every colour comes from a token in `src/theme/palettes.ts`. Run `npm run generate:theme-css` after any palette edit. `hardcodedColors.test.ts` must stay green, so no `bg-white`, `text-white`, hex values or Tailwind palette classes.
- Every new button gets `v-press`, imported locally.
- Contrast is enforced by `src/__tests__/theme/paletteContrast.test.ts` for every style × theme × mode.

**Project rules**

- **TDD:** write one failing test, then the minimum code to pass it. Commit after every green step.
- **Commits**
  - Structural commits (rename, move, extract; behaviour unchanged) are separate from behavioural ones.
  - Before every commit, run `npx vitest run && npm run lint && npx vue-tsc --noEmit`. There must be zero warnings.
  - Messages are English Conventional Commits with an emoji (🐛 ✨ ♻️ 🧪 📄). No `Co-Authored-By` or any other trailer.
- **Code**
  - `src/domain/` never imports from application, presentation or stores.
  - Spell out identifiers (`row`/`column`, not `r`/`c`; no `i`, `idx`, `el`). Comments are in English.
- **Copy**
  - All new copy exists in both `en` and `zh-Hant`.
  - The zh text follows `docs/superpowers/specs/2026-10-21-i18n-zh-hant-design.md`: row = 列, column = 欄, 「第 r 列第 c 欄」, and 「遊戲」, never 「對局」. The spec's 「本局／這局／新局」 wording is kept as written.
- Everything must fit and work at 360px phone width.

## Review Focus

These are the five real-world inputs most likely to break this stage. Each maps to a named test.

1. **A clue tap followed by a digit key.** The clue now shows the selection outline, which invites the player to press a digit. That digit must become the selected digit, not an entry in the clue, and the outline must leave the clue. Covered by Task 4 "never writes into a selected clue from the digit pad" and "moves the outline off a clue when an empty cell is filled digit first".
2. **Best-time edge cases.** A finish that ties the best time, a first win at a difficulty that only has given-up games, and a best time that exists only at another difficulty. Each would give a wrong badge if `bestTime` were read after recording or across difficulties. Covered by Task 11 "treats a tie as no record", "counts the first win after give-ups as a record", "ignores other difficulties" and "compares against the history before this game".
3. **Play Again on the same route.** The new game has to start at 00:00 with 4 hints. The finished game's leave guard and timer must not leak into it, and leaving the new game must still ask first. Covered by Task 12 "should start a fresh game at the same difficulty on Play Again" and "should guard leaving the new game after Play Again".
4. **Review This Game when history already has games.** The review must open the game that just finished, not the first or a stale index. Covered by Task 12 "should open the review of the game just finished".
5. **A player entry that repeats a clue.** Only the player's cell turns red, and the no-conflicts toast must not appear, because there is a conflict. Covered by Task 6 "should mark only the player cell when an entry repeats a clue" and the domain test "should return only the player cell for a clue duplicate".

---

### Task 1: `highlightScope` and `seenLongPressTip` settings

**Files:**
- Modify: `src/application/SettingsStorage.ts`, `src/stores/settingsStore.ts`
- Test: `src/__tests__/application/SettingsStorage.test.ts`, `src/__tests__/stores/settingsStore.test.ts`

**Interfaces (Produces):**
```ts
// Settings gains: highlightScope: boolean (default true); seenLongPressTip: boolean (default false)
// settingsStore gains: highlightScope: Ref<boolean>, seenLongPressTip: Ref<boolean>,
//   setHighlightScope(value: boolean): void, markLongPressTipSeen(): void
```

- [ ] **Step 1: Write the failing tests.**
  - In `SettingsStorage.test.ts`:
    - Add `highlightScope: true, seenLongPressTip: false` to the defaults `toEqual`.
    - `it("should default highlightScope and seenLongPressTip for settings saved before they existed")`: store `{ colorTheme: "blue" }`. Expect `true` and `false`.
  - In `settingsStore.test.ts`:
    - `it("should persist highlightScope and restore it in a new store")`: `setHighlightScope(false)` → the stored JSON has `highlightScope === false`, and a fresh pinia reads `false`.
    - `it("should remember that the long-press tip was seen")`: `markLongPressTipSeen()` → `seenLongPressTip` is `true` and persisted.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.** Add the defaults, the refs, both setters and both fields in `persistAll`.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add row-column-box highlight and long-press tip settings`

---

### Task 2: Board tokens and surface contrast rules

**Files:**
- Modify: `src/theme/palettes.ts`, `src/style/themes.generated.css` (regenerate)
- Test: `src/__tests__/theme/paletteContrast.test.ts`, `src/__tests__/theme/palettes.test.ts`

**Interfaces (Produces):**
- `PALETTE_TOKENS` gains `"cell-selected"` and `"cell-peer"`. Both are per-theme, so they join `ThemeAccents`.
- `note` is no longer typed in the palette: `minimalTheme` sets `note` to that palette's `foreground-secondary`, in both modes.

- [ ] **Step 1: Write the failing tests.**
  - In `paletteContrast.test.ts`:
    - Add `"cell-selected"` and `"cell-peer"` to `BOARD_SURFACES`.
    - Add a `SURFACE_PAIRS` list, built with the existing `pair()` helper and run through the same `it.each` (`contrastRatio` is symmetric):
      - `pair("cell-clue", "card", 1.25)`
      - `pair("highlight", "cell-clue", 1.25)`
      - `pair("highlight", "card", 1.25)`
      - `pair("highlight", "cell-peer", 1.25)`
      - `pair("cell-peer", "card", 1.08)`
      - `pair("primary", "cell-selected", 3)` (the outline is a UI component, so 3:1 applies)
  - In `palettes.test.ts`, add `it("uses the secondary text colour for notes in every palette")`: for every style, theme and mode, `palette.note === palette["foreground-secondary"]`.
- [ ] **Step 2:** Run `npx vitest run src/__tests__/theme`. Expect FAIL. The tokens are missing, and today `cell-clue` vs `card` is about 1.07.
- [ ] **Step 3: Implement**, then regenerate the CSS. The values are the implementer's, within these decisions:
  - **Luminance order.**
    - Light mode: `card` > `cell-clue` > `highlight`. Same digit is the strongest tint, so "加深" holds.
    - Dark mode is the reverse: `card` is darkest and `highlight` is lightest.
    - `cell-clue` stays neutral. `highlight`, `cell-peer` and `cell-selected` are tints of the theme's primary.
  - **Starting points (light):**
    - `cell-clue` is about `#E3E3E3`, which gives 1.28 against white.
    - `cell-selected` takes today's `primary-light`.
    - `cell-peer` is a very faint primary tint, a little stronger than `cell-scope`.
  - **Ink consequence.** In light mode `highlight` lands near relative luminance 0.6, and every board ink must reach 4.5 on it. That puts `primary`, `error` and `foreground-secondary` (and so `note`) at about luminance 0.095 or lower. Darken them per theme and keep each hue. Do not relax any stage 1 pair.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add selected and peer cell tokens with distinct board surfaces`

---

### Task 3: BoardCell layers — bigger notes, selection outline, peer tint, bold clues

**Files:**
- Modify: `src/presentation/components/board-cell/BoardCell.vue`
- Test: `src/__tests__/presentation/BoardCell.test.ts`

**Interfaces (Produces):**
```ts
export type CellVariant = /* existing */ | "peer";
export type ValueFontWeight = "bold" | "semibold" | "medium";
// VARIANT_BACKGROUNDS.selected = "bg-cell-selected ring-2 ring-inset ring-primary"
// VARIANT_BACKGROUNDS.peer     = "bg-cell-peer"
// player note size: "text-[clamp(10px,-0.49px+2.26vw,14px)]"; solver: "text-[clamp(10px,-0.49px+2.7vw,15px)]"
```
`SolverWalkthrough` and `GameReview` also use `selected`, so they get the outline too. That is intended, because it keeps one look for selection.

- [ ] **Step 1: Write the failing tests.**
  - In the variant table, use `["selected", "bg-cell-selected"]` and `["peer", "bg-cell-peer"]`.
  - `it("should outline the selected cell inside its edges")`: `ring-2`, `ring-inset` and `ring-primary`.
  - `it("should keep player notes at least 10px")`: the note span has `text-[clamp(10px,-0.49px+2.26vw,14px)]` and `text-note`.
  - `it("should keep solver candidates at least 10px")`: with `noteTone: "solver"`, the span has `text-[clamp(10px,-0.49px+2.7vw,15px)]`.
  - `it("should render valueFontWeight bold")`: `font-bold`.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement** the variant table and the weight map.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: draw the selected cell as an outline and keep notes at 10px or larger`

---

### Task 4: Select clues and tint the selected cell's row, column and box

**Files:**
- Modify: `src/presentation/pages/game/useGameInteraction.ts`, `src/presentation/pages/game/components/Cell.vue`, `src/presentation/pages/game/Game.vue`
- Test: `src/__tests__/presentation/pages/game/useGameInteraction.test.ts`, `src/__tests__/presentation/Cell.test.ts`, `src/__tests__/presentation/Game.test.ts`

**Interfaces:**
```ts
// useGameInteraction adds
isPeerOfSelected: (row: number, column: number) => boolean; // same row, column or box as selectedCell; false for the cell itself or when nothing is selected
// Cell.vue adds prop
peer?: boolean;  // default false
// Cell variant order (outside hint mode): error → selected → same-digit → peer → clue → default
// Cell valueFontWeight: clue → "bold", entry → "medium"
```

**Selection rules** (the decisions):
- `selectedCell` may now hold a clue. A clue tap still runs `pickClueDigit`. After it, `selectedCell` is the clue when `selectedDigit` equals the clue's digit, and `null` when the tap toggled the digit off.
- Any later `clickCell` on another cell, and any `selectDigit`, first clears a clue selection. After that, the existing logic runs unchanged. A clue is therefore never an input target: `selectDigit` with a clue selected acts digit first.
- `Game.vue` passes `:peer="settingsStore.highlightScope && isPeerOfSelected(rowIndex, columnIndex)"`.

- [ ] **Step 1: Write the failing tests.**
  - In `useGameInteraction.test.ts`, under "tapping a clue":
    - `it("selects the tapped clue cell along with its digit")`: `clickCell(0, 0)` → `isSelected(0, 0)` is true and `selectedDigit` is 5.
    - `it("clears the clue selection when the clue is tapped again")`
    - `it("never writes into a selected clue from the digit pad")`: `clickCell(0, 0)`, then `selectDigit(4)` → `sudoku.puzzle[0][0].clue` is 5, `entry` is 0, `selectedDigit` is 4, and `isSelected(0, 0)` is false.
    - `it("moves the outline off a clue when an empty cell is filled digit first")`: `clickCell(0, 0)`, then `clickCell(0, 2)` → `entry` of (0, 2) is 5, and `isSelected(0, 0)` is false.
    - `it("finds the row, column and box peers of the selected cell")`: `clickCell(4, 4)` (empty in the fixture). Then (4, 0) (a clue), (0, 4) and (3, 3) are true, and (0, 0) and (4, 4) itself are false. With nothing selected, every cell is false.
  - In `Cell.test.ts`, `it("should layer selected over same digit over peer over clue")`, using a clue `PuzzleCell(5)`:
    - `peer: true` → `bg-cell-peer`
    - `peer: true, selectedDigit: 5` → `bg-highlight`
    - adding `selected: true` → `bg-cell-selected`
    - with none of these props → `bg-cell-clue`, and the value has `font-bold`
  - In `Game.test.ts`:
    - Replace "should not select a clue cell" with `it("should outline a tapped clue cell")`: `cell-0-0` has prop `selected` true and class `ring-primary`, and its text is still `"5"` after a `number-4` click.
    - `it("should tint the row, column and box of the selected cell")`: click `cell-0-2` → `cell-0-8`, `cell-8-2` and `cell-1-1` have `bg-cell-peer`, and `cell-4-4` does not.
    - `it("should not tint peers when highlightScope is off")`: seed `localStorage["sudoku-settings"]` with `{ highlightScope: false }` → `cell-0-8` has no `bg-cell-peer`.
- [ ] **Step 2:** Run the three files. Expect FAIL.
- [ ] **Step 3: Implement** the rules above.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: select clue cells and tint the selected row, column and box`

---

### Task 5: One game toast for one-off messages (structural)

**Files:**
- Rename: `src/presentation/pages/game/useHintResult.ts` → `useGameToast.ts`, and `components/HintResultToast.vue` → `components/GameToast.vue`
- Modify: `src/presentation/pages/game/useGameSession.ts`, `src/presentation/pages/game/Game.vue`
- Test: `src/__tests__/presentation/Game.test.ts` (test id `hint-result-toast` → `game-toast`, mechanical)

**Interfaces (Produces):**
```ts
export type ToastContent = { kind: "randomReveal"; outcome: RevealOutcome };   // Tasks 6 and 10 add kinds
export const useGameToast: () => { content: Ref<ToastContent | null>; show: (content: ToastContent) => void; hide: () => void };
// The duration comes per kind from TOAST_DURATION_MS: Record<ToastContent["kind"], number> (randomReveal 3000)
// GameToast.vue: prop content: ToastContent | null; data-testid="game-toast"; renders the text per kind with t()
// useGameSession returns toastContent and showToast instead of hintResultOutcome
```

- [ ] **Step 1:** Rename the test id in the existing random-reveal tests in `Game.test.ts`. Run them. Expect FAIL.
- [ ] **Step 2:** Make the move. `useHintActions`' `onHintReveal` becomes `outcome => showToast({ kind: "randomReveal", outcome })`.
- [ ] **Step 3:** Run the full gate. Expect PASS, with no other test changed.
- [ ] **Step 4: Commit** `♻️ refactor: generalize the hint result toast into a game toast`

---

### Task 6: Check Conflicts — never mark clues, report "no duplicates"

**Files:**
- Modify: `src/domain/game/ConflictDetector.ts`, `src/presentation/pages/game/useHintActions.ts`, `src/presentation/pages/game/useGameSession.ts`, `src/presentation/pages/game/useGameToast.ts`, `src/presentation/pages/game/components/GameToast.vue`, `src/presentation/pages/game/components/HintMenuPopup.vue`, `src/presentation/i18n/messages/en.ts`, `src/presentation/i18n/messages/zh-Hant.ts`
- Test: `src/__tests__/domain/game/Sudoku.test.ts`, `src/__tests__/presentation/pages/game/useHintActions.test.ts`, `src/__tests__/presentation/Game.test.ts`, `src/__tests__/presentation/HintMenuPopup.test.ts`

**Interfaces:**
```ts
// ConflictDetector.findAllConflicts returns only non-clue cells.
// useHintActions option: onNoConflicts?: () => void   (called after the hint is spent and the result is empty)
// ToastContent adds { kind: "noConflicts" } (3000 ms)
```

| key | en | zh-Hant |
|---|---|---|
| `game.toast.noConflicts` | "No repeated digits found" | 「沒有發現重複的數字」 |
| `game.hints.checkConflictsDescription` | "Finds repeated digits in a row, column or box" | 「找出同列、欄、宮裡重複的數字」 |

**6a. Domain (bug fix)**
- [ ] **Step 1: Write the failing tests** in `Sudoku.test.ts` › `checkAllConflicts`:
  - "row duplicates" becomes `it("should return only the player cell for a clue duplicate")`: fill (0, 2) with 5 → `toEqual([{ row: 0, column: 2 }])`.
  - The column and box case → `toEqual([{ row: 1, column: 1 }])`.
  - `it("should return both player cells when two entries repeat")`: fill (0, 2) and (0, 3) with 4 → length 2, containing both.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.** Skip clue positions when collecting conflicts.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `🐛 fix: never report clues as conflicts`

**6b. Feedback and copy**
- [ ] **Step 1: Write the failing tests.**
  - In `useHintActions.test.ts`, give the harness an `onNoConflicts` part:
    - `it("reports no conflicts and still spends a hint")`: resolve the menu with `"checkConflicts"` on the partial sudoku → `onNoConflicts` is called once, and `hintTracker.totalUsed` is 1.
    - `it("does not report no conflicts when a duplicate exists")`: fill (4, 0) with 5 first (column 0 has the clue 5) → `onNoConflicts` is not called.
  - In `Game.test.ts`:
    - `it("should toast when Check Conflicts finds nothing")`: `game-toast` text is `"No repeated digits found"`.
    - `it("should mark only the player cell when an entry repeats a clue")`: fill (0, 2) with 5 and run Check Conflicts → `cell-0-2` has `bg-error-surface`, `cell-0-0` does not, and there is no `game-toast`.
  - In `HintMenuPopup.test.ts`:
    - `hint-check-conflicts-description` text is the en string above, and the zh string under zh-Hant.
    - The existing zh option assertion becomes `toContain("檢查衝突")`.
- [ ] **Step 2:** Run those files. Expect FAIL.
- [ ] **Step 3: Implement.**
  - The session wires `onNoConflicts: () => showToast({ kind: "noConflicts" })`.
  - The description sits under the option label: `text-[12px] text-foreground-secondary`, with `data-testid="hint-check-conflicts-description"`.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: say when Check Conflicts finds no duplicates`

---

### Task 7: Hint menu shows hints left, the free-hint rule and the limit

**Files:**
- Modify: `src/domain/game/HintTracker.ts` (export `MAX_HINTS`), `src/presentation/pages/game/components/useHintMenu.ts`, `src/presentation/pages/game/components/HintMenuPopup.vue`, `src/presentation/pages/game/useHintActions.ts`, both message files
- Test: `src/__tests__/presentation/HintMenuPopup.test.ts`, `src/__tests__/presentation/Game.test.ts`

**Interfaces:**
```ts
export const MAX_HINTS = 4;                                          // HintTracker.ts
export interface HintParams { remaining: number; firstHintFree: boolean }  // replaces { recordedUsed, canUseHint }
// useHintActions opens with { remaining: hintTracker.remainingHints, firstHintFree: hintTracker.totalUsed === 0 }
// The options are disabled when remaining === 0
```

| key | en | zh-Hant |
|---|---|---|
| `game.hints.remaining` | "{count} hint left this game \| {count} hints left this game" | 「本局還剩 {count} 次提示」 |
| `game.hints.freeNote` (replace) | "Your first hint each game is free and isn't counted in statistics." | 「每局第一次提示免費，不計入統計」 |
| `game.hints.usedUp` | "No hints left in this game ({max} per game)" | 「本局的提示已用完（每局 {max} 次）」 |

Call `remaining` the way `walkthrough.eliminations` is called: `t(key, { count }, count)`.

- [ ] **Step 1: Write the failing tests.**
  - In `HintMenuPopup.test.ts`, the mount defaults become `{ remaining: 4, firstHintFree: true }`. Delete the dots test.
    - `remaining: 3` → `hint-remaining` text is `"3 hints left this game"`, and there is no `hint-light`.
    - `remaining: 1` → `"1 hint left this game"`.
    - zh-Hant with `remaining: 4` → 「本局還剩 4 次提示」.
    - `firstHintFree: true` → `hint-free-note` has the en text, or the zh text under zh-Hant. With `firstHintFree: false` it is absent.
    - `remaining: 0` → `hint-used-up` text is `"No hints left in this game (4 per game)"`. All three options are `disabled`, and `hint-remaining` is absent.
  - In `Game.test.ts`, update the two dot tests:
    - after the free Auto Notes → `hint-remaining` is `"3 hints left this game"`, and there is no `hint-free-note`
    - after three hints → `"1 hint left this game"`
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.** The header row keeps the title on the left and puts `hint-remaining` (or `hint-used-up`) on its own line under it, in `text-[13px] text-foreground-secondary`. The free note keeps its place.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: spell out how many hints are left and why they ran out`

---

### Task 8: Hint panel says Close in both phases

**Files:**
- Modify: `src/presentation/pages/game/hint-mode/HintPanel.vue`, `src/presentation/pages/game/Game.vue`
- Test: `src/__tests__/presentation/pages/game/hint-mode/HintPanel.test.ts`, `src/__tests__/presentation/Game.test.ts`

**Interface:** In the steps phase, the exit button becomes `data-testid="hint-close"`. It emits `close` and shows `hintMode.panel.close`. The `cancel` emit and Game's `@cancel` are removed.

- [ ] **Step 1: Write the failing tests.**
  - `HintPanel.test.ts`: in the steps phase, `hint-close` text is `"Close"` (「關閉」 under zh-Hant), `hint-cancel` does not exist, and a click emits `close`.
  - `Game.test.ts`: in the hint-mode test, `hint-cancel` → `hint-close`.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: call the hint panel's exit Close so it never sounds like a refund`

---

### Task 9: Labelled controls, an obvious note mode and digit-key labels

**Files:**
- Modify: `src/presentation/pages/game/components/ControlButton.vue`, `GameControls.vue`, `DigitPad.vue`, `src/presentation/pages/game/Game.vue`, both message files
- Test: `src/__tests__/presentation/Game.test.ts`

**Interfaces:**
```ts
// ControlButton props: icon: Component; label: string; pressed?: boolean | null (default null)
//   renders aria-label=label; aria-pressed only when pressed !== null;
//   the tile is solid bg-primary text-on-primary when pressed; the label is a span under the tile
// DigitPad adds prop noteMode?: boolean (default false)
//   digit keys: aria-label t(noteMode ? "game.digitPad.note" : "game.digitPad.fill", { digit, count: remaining })
//   noteMode → "text-lg items-start pt-1.5"; otherwise "text-2xl items-center"
//   erase key: aria-label and a visible label under the icon (text-[10px])
```

| key | en | zh-Hant |
|---|---|---|
| `game.controls.undo` | "Undo" | 「復原」 |
| `game.controls.notes` | "Notes" | 「筆記」 |
| `game.controls.notesOn` | "Notes on" | 「筆記 開」 |
| `game.controls.hint` | "Hint" | 「提示」 |
| `game.controls.erase` | "Erase" | 「擦除」 |
| `game.digitPad.fill` | "Fill {digit}, {count} left" | 「填入 {digit}，還剩 {count} 個」 |
| `game.digitPad.note` | "Note {digit}, {count} left" | 「筆記 {digit}，還剩 {count} 個」 |

- [ ] **Step 1: Write the failing tests** in `Game.test.ts`, as a `describe("control labels")`:
  - `undo-button`, `note-button`, `hint-button` and `erase-button`: the text and `aria-label` are "Undo", "Notes", "Hint" and "Erase". Under zh-Hant they are 「復原」「筆記」「提示」「擦除」.
  - `note-button` has `aria-pressed="false"`. After a click it reads "Notes on" (「筆記 開」), has `aria-pressed="true"`, and its tile has `bg-primary`.
  - `number-8` has aria-label `"Fill 8, 4 left"` (8 has five clues in the fixture), and 「填入 8，還剩 4 個」 under zh-Hant. In note mode it is `"Note 8, 4 left"`.
  - `number-8` has `items-center` and `text-2xl`. In note mode it has `items-start` and `text-lg`.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
  - Control button: `flex-col gap-1`; the label is `text-[11px] font-medium text-foreground-secondary`, or `text-primary font-semibold` when pressed.
  - Notes on uses `primary`, not `accent`.
  - `Game.vue` passes `:note-mode="inputMode === InputMode.Note"`.
  - `SolverWalkthrough` keeps the defaults.
- [ ] **Step 4:** Run the full gate. Expect PASS. Check that `npm run start` at 360×780 still fits the board, controls and pad without scrolling.
- [ ] **Step 5: Commit** `✨ feat: label the game controls and make note mode obvious`

---

### Task 10: Spoken cell labels and the one-time long-press tip

**Files:**
- Create: `src/presentation/pages/game/useLongPressTip.ts`
- Modify: `src/presentation/pages/game/components/Cell.vue`, `src/presentation/pages/game/useGameToast.ts`, `GameToast.vue`, `src/presentation/pages/game/Game.vue`, both message files
- Test: `src/__tests__/presentation/Cell.test.ts`, `src/__tests__/presentation/Game.test.ts`

**Interfaces:**
```ts
// Cell root: role="button", aria-label from game.cell.{empty|value|notes} (1-based row and column; notes joined with " ")
export const useLongPressTip: (options: { selectedDigit: Ref<number | null>; showTip: () => void }) => void;
//   The first time selectedDigit becomes non-null while settingsStore.seenLongPressTip is false:
//   call showTip() and settingsStore.markLongPressTipSeen()
// ToastContent adds { kind: "longPressTip" } (5000 ms)
```

| key | en | zh-Hant |
|---|---|---|
| `game.cell.empty` | "Row {row}, column {column}, empty" | 「第 {row} 列第 {column} 欄，空白」 |
| `game.cell.value` | "Row {row}, column {column}, {value}" | 「第 {row} 列第 {column} 欄，{value}」 |
| `game.cell.notes` | "Row {row}, column {column}, notes {notes}" | 「第 {row} 列第 {column} 欄，筆記 {notes}」 |
| `game.toast.longPressTip` | "Long-press a cell to toggle a note directly (in note mode, it fills the digit)" | 「長按格子可以直接切換筆記（筆記模式下則是填入）」 |

**10a. Cell labels**
- [ ] **Step 1: Write the failing tests** in `Cell.test.ts`, at row 0 and column 2:
  - empty → `"Row 1, column 3, empty"`
  - entry 5 → `"Row 1, column 3, 5"`
  - notes [1, 3] → `"Row 1, column 3, notes 1 3"`
  - under zh-Hant, empty → 「第 1 列第 3 欄，空白」
  - `role` is `"button"`
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: give board cells spoken labels`

**10b. Long-press tip**
- [ ] **Step 1: Write the failing tests** in `Game.test.ts`:
  - `it("should show the long-press tip the first time a digit is selected")`: click `number-4` → `game-toast` text is the en tip, `useSettingsStore().seenLongPressTip` is true, and the stored JSON has `seenLongPressTip: true`.
  - `it("should show the tip when the first digit comes from a clue")`: click `cell-0-0` → tip.
  - `it("should not show the tip twice in one game")`: use fake timers. Select 4, advance 6000ms, deselect, select 6 → no `game-toast`.
  - `it("should not show the tip after a reload")`: seed `{ seenLongPressTip: true }`, then select 4 → no `game-toast`.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.** Use a `watch` on `selectedDigit`. `Game.vue` calls `useLongPressTip({ selectedDigit, showTip: () => showToast({ kind: "longPressTip" }) })`.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: explain long press the first time a digit is picked`

---

### Task 11: New record on the completion modal

**Files:**
- Modify: `src/stores/statisticsStore.ts`, `src/presentation/pages/game/useGameCompletion.ts`, `src/presentation/pages/game/useGameSession.ts`, `src/presentation/pages/game/components/useGameCompleteModal.ts`, `GameCompleteModal.vue`, both message files
- Test: `src/__tests__/stores/statisticsStore.test.ts`, `src/__tests__/presentation/pages/game/useGameCompletion.test.ts`, `src/__tests__/presentation/GameCompleteModal.test.ts`

**Interfaces:**
```ts
// statisticsStore
isNewBestTime: (difficulty: Difficulty, elapsedSeconds: number) => boolean; // no completed game at this difficulty, or strictly faster
// useGameCompletion
export interface CompletionOutcome { isNewRecord: boolean }
onCompleted: (origin: { row: number; column: number }, outcome: CompletionOutcome) => void;
//   isNewRecord is computed BEFORE recordGame
// GameCompleteParams gains isNewRecord: boolean
```

| key | en | zh-Hant |
|---|---|---|
| `game.complete.newRecord` | "New record!" | 「新紀錄！」 |

- [ ] **Step 1: Write the failing tests.**
  - In `statisticsStore.test.ts`, under `describe("isNewBestTime")`:
    - empty history → `("easy", 300)` is true
    - `it("counts the first win after give-ups as a record")`: only given-up easy games → true
    - with an easy best of 300: 299 is true; `it("treats a tie as no record")`: 300 is false; 301 is false
    - `it("ignores other difficulties")`: a medium best of 100 and no easy win → `("easy", 500)` is true
  - In `useGameCompletion.test.ts`:
    - `it("reports a new record on the first win")`: `onCompleted` gets `{ isNewRecord: true }`.
    - `it("compares against the history before this game")`: an easy win at the same elapsed time already recorded → `{ isNewRecord: false }`.
  - In `GameCompleteModal.test.ts`:
    - `isNewRecord: true` → `new-record-badge` text is `"New record!"` (「新紀錄！」 under zh-Hant). With false it is absent.
    - `complete-difficulty` text is `"Medium"` for `difficulty: "medium"`.
    - The stats grid has class `grid-cols-2` and no longer contains the difficulty. This replaces the old `grid-cols-3` gap test.
- [ ] **Step 2:** Run the three files. Expect FAIL.
- [ ] **Step 3: Implement.**
  - The modal shows the title, then a row with the difficulty tag (`bg-accent/10 text-accent text-[13px] font-semibold rounded-full px-2.5 py-1`) and, when it applies, the badge (`bg-primary text-on-primary`).
  - The stats are two columns: time and hints.
  - `useGameSession` passes `isNewRecord` through to `open()`.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: celebrate a new best time on the completion modal`

---

### Task 12: Completion actions — Play Again, Review This Game, Back to Home

**12a, structural:** split the page so a new game can remount it.
- **Files:** rename `src/presentation/pages/game/Game.vue` → `GameScreen.vue`, and create a new `Game.vue`. Modify `useGameSession.ts`, which moves the "no active game → home" redirect out of it.
- The new `Game.vue` is `<GameScreen v-if="gameStore.hasActiveGame" />` plus the redirect. `GameScreen` drops its root `v-if`.
- [ ] **Step 1:** Make the move.
- [ ] **Step 2:** Run the full gate. Expect PASS, with no test changed. `Game.test.ts` and `GameRouting.test.ts` still mount `Game`, and `onBeforeRouteLeave` works from a child of the route component.
- [ ] **Step 3: Commit** `♻️ refactor: split the game page from the game screen it hosts`

**12b, behavioural**

**Files:**
- Modify: `src/stores/gameStore.ts`, `src/presentation/pages/game/Game.vue`, `GameScreen.vue`, `useGameSession.ts`, `components/useGameCompleteModal.ts`, `components/GameCompleteModal.vue`, both message files
- Create test: `src/__tests__/presentation/pages/game/GameCompleteActions.test.ts`
- Test: `src/__tests__/presentation/GameCompleteModal.test.ts`, `src/__tests__/stores/gameStore.test.ts`

**Interfaces:**
```ts
export type GameCompleteAction = "playAgain" | "review" | "home";
// createDialog<GameCompleteParams, GameCompleteAction>(); the modal only calls close(action), no router
// gameStore: gameSerial: Ref<number>, incremented by startNewGame
// Game.vue: <GameScreen :key="gameStore.gameSerial" @play-again="playAgain" /> and <PuzzleLoader>;
//   playAgain = puzzleLoader.runWithLoader(() => gameStore.startNewGame(gameStore.difficulty ?? "easy"))
// useGameSession(options: { onPlayAgain: () => void }) handles the modal result:
//   home → router.back(); review → router.replace(ROUTER_PATH.gameReviewFor(statisticsStore.history.length - 1));
//   playAgain → onPlayAgain()
```
`review` uses `replace`, so Back from the review does not land on a finished `/game`.

| key | en | zh-Hant |
|---|---|---|
| `game.complete.playAgain` | "Play Again" | 「再玩一局」 |
| `game.complete.review` | "Review This Game" | 「看這局回顧」 |
| `game.complete.backToHome` | (unchanged) | (unchanged) |

- [ ] **Step 1: Write the failing tests.**
  - `gameStore.test.ts`: `startNewGame` raises `gameSerial` from 0 to 1. Use `spyGeneratePuzzle()`.
  - `GameCompleteModal.test.ts`: clicking `play-again-button`, `review-game-button` and `back-to-home-button` resolves `open()` with `"playAgain"`, `"review"` and `"home"`. `play-again-button` has `bg-primary`. The en labels are "Play Again", "Review This Game" and "Back to Home".
  - `GameCompleteActions.test.ts`:
    - Setup: copy Home.test's mocks of `PuzzleGenerationService` and `usePuzzleLoader`. Seed settings `{ completionFlash: false }`. The router has `/`, `/game` and `/game-review/:index` (stub). Push `/` then `/game`. Mount `<router-view>`.
    - Helper `completeKnownGame`: fill every empty cell digit first.
    - `it("should start a fresh game at the same difficulty on Play Again")`, at difficulty `"medium"`: use Auto Notes once, complete the game, click `play-again-button`, then `flushPromises` →
      - the modal is gone
      - `timer` is `"00:00"`
      - `cell-0-2` text is `""`
      - `gameStore.difficulty` is `"medium"`
      - the route is `/game`
      - the hint menu shows `"4 hints left this game"`
    - `it("should guard leaving the new game after Play Again")`: then `router.push("/")` → still on `/game`, and `leave-game-dialog` is shown.
    - `it("should open the review of the game just finished")`: record two games in `statisticsStore` first, then complete → `review-game-button` → the route is `/game-review/2`.
    - `it("should go back home")`: `back-to-home-button` → the route is `/`.
- [ ] **Step 2:** Run the three files. Expect FAIL.
- [ ] **Step 3: Implement.** The buttons, all with `v-press`, from top to bottom:
  - primary `bg-primary text-on-primary`, h-[52px], with the `RotateCcw` icon
  - secondary `bg-card border border-border text-foreground`, h-[52px], with the `History` icon
  - a text button, h-11, `text-foreground-secondary`
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: offer play again and this game's review when a game is solved`

---

### Task 13: Leave dialog — quiet give-up with its cost

**Files:**
- Modify: `src/presentation/pages/game/components/LeaveGameDialog.vue`, both message files (`game.leave.giveUpAndLeave` → `game.leave.giveUp`; add `common.giveUpConsequence`)
- Test: `src/__tests__/presentation/Game.test.ts`, `src/__tests__/presentation/GameRouting.test.ts` (labels only)

| key | en | zh-Hant |
|---|---|---|
| `game.leave.giveUp` | "Give Up This Game" | 「放棄這局」 |
| `common.giveUpConsequence` | "Giving up counts as an unfinished game and lowers your win rate." | 「放棄會記為一場未完成，會影響勝率」 |

**Layout:**
1. Icon, title and message, as today.
2. `save-and-leave-button`: primary, full width.
3. A two-column row of h-11 text buttons: `leave-cancel-button` (`text-foreground`) and `give-up-and-leave-button` (`text-danger`, no `bg-danger`).
4. `leave-give-up-note`: `text-[13px] text-foreground-secondary`, centred.

All buttons get `v-press`.

- [ ] **Step 1: Write the failing tests** in `Game.test.ts`, opening the dialog with `back-button`:
  - `save-and-leave-button` has `bg-primary`.
  - `give-up-and-leave-button` text is `"Give Up This Game"`. It has `text-danger` and no `bg-danger`.
  - `leave-give-up-note` has the en text.
  - Under zh-Hant: 「放棄這局」 and 「放棄會記為一場未完成，會影響勝率」.
  - The existing give-up and save behaviour tests stay.
- [ ] **Step 2:** Run the files. Expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: make giving up a quiet choice with its cost spelled out`

---

### Task 14: New-game dialog — continue first, show what would be given up

**Files:**
- Modify: `src/presentation/components/new-game-dialog/NewGameDialog.vue`, `useNewGameDialog.ts`, `src/presentation/pages/home/Home.vue`, both message files
- Test: `src/__tests__/presentation/Home.test.ts`

**Interfaces:**
```ts
export interface SavedGameSummary { difficulty: Difficulty; elapsedSeconds: number }
createDialog<SavedGameSummary, "continue" | "giveUp">();
// Home opens it with the savedGame's difficulty and elapsedSeconds; "continue" → the existing continueGame()
```

| key | en | zh-Hant |
|---|---|---|
| `home.giveUp.title` (replace) | "Unfinished Game" | 「還有一局沒完成」 |
| `home.giveUp.summary` | "{difficulty} · {time} played" | 「{difficulty}・已玩 {time}」 |
| `home.giveUp.continue` | "Continue That Game" | 「繼續原本那局」 |
| `home.giveUp.confirm` (replace) | "Give Up & Start New" | 「放棄並開新局」 |

Remove `home.giveUp.message`. The consequence line uses `common.giveUpConsequence`.

**Layout:**
1. Icon tile (`bg-danger/10`, as in stage 1), title, `new-game-saved-summary`, then `new-game-give-up-note`.
2. `new-game-continue-button`: primary, full width.
3. `give-up-and-start-new-button`: an h-11 text button in `text-danger`.

There is no Cancel button: Continue is the safe way out.

- [ ] **Step 1: Write the failing tests** in `Home.test.ts`. `dummySave` is easy, 204 seconds.
  - The dialog contains "Unfinished Game". `new-game-saved-summary` is `"Easy · 03:24 played"`, and 「簡單・已玩 03:24」 under zh-Hant.
  - `new-game-give-up-note` has the en consequence.
  - `new-game-continue-button` text is `"Continue That Game"` and it has `bg-primary`. `give-up-and-start-new-button` has `text-danger` and no `bg-danger`.
  - `it("should continue the saved game from the dialog")`: click continue →
    - the route is `/game`
    - `gameStore.hasActiveGame` is true
    - `gameStore.elapsedSeconds` is 204
    - the statistics history is empty
    - no `game_abandon` is logged
  - Replace the two Cancel tests with this one, and replace the zh Cancel assertion with the zh continue label.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: offer to continue the unfinished game before starting a new one`

---

### Task 15: Real-browser visual pass (360×780)

**Files:** scripts only, in `/private/tmp/claude-501/-Users-ethan-Project-sudoku/8581f059-8ad5-412a-943e-1b0b712810ab/scratchpad/shots/` (for example `stage2.mjs`, reusing `capture.mjs`'s pinia-driven flows). Add nothing to `src/` and no demo routes.

- [ ] **Step 1: Set up.**
  - Start a dev server of your own: `CHOKIDAR_USEPOLLING=1 npx vite --port <free port> --strictPort`, in the background.
  - Use puppeteer-core from `shots/node_modules` with `executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, a 360×780 viewport, `isMobile` and `hasTouch`.
  - Seed `sudoku-settings` with `evaluateOnNewDocument`.
- [ ] **Step 2: Capture.**
  - Matrix: zh-Hant and en × light and dark, in green. For the board shots, also capture all 6 themes × light and dark in zh-Hant.
  - States:
    1. Board with a selected clue, peers, same-digit cells, notes and an entry.
    2. Board with a selected empty cell.
    3. Note mode on: the Notes button and the digit keys.
    4. The hint menu fresh, after one hint, and used up.
    5. The no-conflicts toast.
    6. The long-press tip toast.
    7. Hint mode in the steps phase.
    8. The completion modal with "New record!".
    9. The leave dialog.
    10. The new-game dialog on home.
  - Save to `shots/stage2/<locale>-<theme>-<mode>-<state>.png`.
- [ ] **Step 3: Measure.**
  - The computed `font-size` of a player note is at least 10px.
  - The page has no vertical scroll in the board-and-pad layout: `scrollHeight <= innerHeight`.
  - Nothing overflows horizontally at 360px, in the hint menu, the dialogs or the control labels.
- [ ] **Step 4: Review every shot.**
  - Clue, same-digit, peer and selected cells are distinct in every theme and mode.
  - Notes are readable.
  - Labels do not wrap awkwardly in either language.
  - Fix any problem test first (`🐛 fix: …`). Palette changes go through Task 2's tests plus a regeneration.
- [ ] **Step 5: Report to the user.** Give the shot folder path and list every ⚙︎ decision from the spec plus this plan's own choices for review:
  - the luminance order of the board layers
  - the clue-selection rules
  - no Cancel button on the new-game dialog
  - Review This Game uses `replace`
  - the copy tables
