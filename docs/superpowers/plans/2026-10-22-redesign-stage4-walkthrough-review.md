# Redesign Stage 4 (Solver Walkthrough and Game Review) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hint mode, the Solver Walkthrough and Game Review show steps the same way: the same cell marks and links, a tag, a plain-words explanation, ‹ › paging and a step count. The walkthrough opens with a guide and samples that ship in production. It checks the solution count before solving, asks before resetting, and keeps the board still between input and playback (audit 13 and 14). It also accepts an initial puzzle, which a later feature will use.

**Architecture:** First a structural extraction moves the step presentation out of hint mode into `src/presentation/components/step-presentation/`. That folder gets pure per-cell views (`stepCellView.ts`), `StepTag`, `StepNavigator`, `StepExplanation` and `StepLinkOverlay`. `HintPanel` and `useHintMode` then delegate to these pieces. A new `StepPlaybackPanel` adds a play button and a seek bar. Review and the walkthrough both place it as an overlay under the board. The walkthrough's input area stays in the layout but turns inert under the overlay, so the board never moves. The domain gains `buildSolvePath`, which records the board before each step, and a `countSolutions` that is safe for user input.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript strict, Tailwind v4 tokens, Pinia, vue-i18n, lucide-vue-next, Vitest + @vue/test-utils (jsdom), puppeteer-core for the visual pass.

**Spec:** `docs/superpowers/specs/2026-10-22-redesign-stage4-walkthrough-review-design.md`. Overview: `docs/superpowers/specs/2026-10-22-redesign-overview-design.md`. Builds on the stage 1–3 plans in `docs/superpowers/plans/2026-10-22-redesign-stage{1-foundation,2-game-screen,3-home-settings}.md`. In particular, it builds on stage 2's `GameScreen.vue` split, the `hint-close` exit, `Cell`'s `selected` outline (`ring-2 ring-inset ring-primary`) and `BoardCell`'s 10px notes.

---

## Global Constraints

**From the spec**

- One step presentation is shared by hint mode, the walkthrough and review. It covers:
  - per-cell data: scope, pattern cells, eliminated candidates, answer cell, computed candidates
  - links
  - the tag
  - the explanation
  - ‹ › paging
  - the step count: dots for 6 steps or fewer, "3 / 8" above that
- The extraction is a ♻️ commit of its own. Every existing hint-mode test passes unchanged after it.
- **Walkthrough intro card:** the line 「輸入任何一題數獨，看解題器用哪些技巧一步步解開」, two actions (「自己輸入題目」 and 「試試範例」: easy, medium, hard), and the reminder that solving may not finish.
- **Samples:** they ship in production. Their `data-testid`s use ids, not label text.
- **While entering a puzzle,** empty cells show no candidates. ⚙︎ This plan picks "none at all".
- **Reset** is a secondary text button and asks before clearing.
- **Before Solve,** call `SudokuSolver.countSolutions(board, 2)`.
  - 0 solutions: do not start, and say 「這題無解，請檢查輸入」.
  - More than one: warn 「這題不只一個解，解題結果可能不完整」. The player may still continue.
- **Playback** uses the hint panel's look: tag, explanation (`useHintExplanation` with each step's `candidatesBefore`), step count and ‹ ›, plus auto-play. The board marks match hint mode. When the solver gets stuck, playback stops on the last step it found and shows no extra message.
- **Layout:** the board sits at the same spot during input and playback (audit 14). The step explanation uses `text-foreground` on `card`, which fixes audit 14's contrast item.
- **Initial puzzle:** the walkthrough accepts one as a parameter. Opening it from a failed game is out of scope for this stage.
- **Review** uses the same panel: an action tag, the existing `ReviewDescription` sentence, step count, ‹ › and auto-play. The cell a step changed is outlined. The seek bar and step count sit where the walkthrough has them.

**From stages 1–3**

- Every colour comes from a token. `hardcodedColors.test.ts` stays green.
- Every new button gets `v-press`, imported locally. Nothing new depends on hover.
- Contrast is enforced by `paletteContrast.test.ts`. Use existing tokens only; this stage adds no palette token.

**Project rules**

- **TDD:** write one failing test, then the minimum code to pass it. Commit after every green step.
- **Commits**
  - Structural commits (rename, move, extract; behaviour unchanged) are separate from behavioural ones and say which they are.
  - Before every commit, run `npx vitest run && npm run lint && npx vue-tsc --noEmit`. There must be zero warnings.
  - Messages are English Conventional Commits with an emoji (🐛 ✨ ♻️ 🚀 🧪 📄). No `Co-Authored-By` or any other trailer.
- **Code**
  - `src/domain/` never imports from application, presentation or stores.
  - Spell out identifiers (`row`/`column`, not `r`/`c`; no `i`, `idx`, `el`). Comments are in English.
- **Copy**
  - All new copy exists in both `en` and `zh-Hant`. `MessageSchema` typing makes `vue-tsc` enforce this.
  - zh text follows `docs/superpowers/specs/2026-10-21-i18n-zh-hant-design.md`: row = 列, column = 欄, 「第 r 列第 c 欄」, 簡單／中等／困難, 自動筆記, and 「遊戲」, never 「對局」.
- Everything must fit and work at 360px phone width.

## Review Focus

These are the five real-world inputs most likely to break this stage. Each maps to a named test.

1. **A sparse puzzle with a hidden contradiction.** For example, column 9 holds 1–8 and row 9 already has a 9, so the last cell has no candidate. The UI allows this input, because no two digits clash. Today's row-major backtracking explores millions of placements before it reaches that cell, which freezes the page on Solve. Covered by Task 4 "should give up at once when an empty cell has no candidate" and Task 9 "should block solving a puzzle with no solution".
2. **Givens that already clash, passed in as the initial puzzle.** Samples, or the future failed-game entry, skip the input UI's clash check. `countSolutions` only validates new placements, so it would report solutions. Covered by Task 4 "should count no solutions when two givens already conflict" and Task 9 "should block a passed-in puzzle whose givens already conflict".
3. **"Solve Anyway" on a board where the solver cannot take one step,** such as an empty board, which has many solutions. An empty playback panel would have no tag, no explanation and nowhere to go. Covered by Task 9 "should explain when there is nothing to show".
4. **Auto-play left running when the player leaves playback,** or a re-solve that starts mid-way from the previous path's step index. Covered by Task 6 "should stop auto-play when going back to edit" and "should start from the first step after solving again".
5. **Review steps that carry no cell.** `autoNotes` and `undo` are recorded with row 0, column 0. Outlining "the changed cell" would wrongly mark the top-left cell. Covered by Task 3 "should not outline any cell for auto notes or undo".

---

### Task 1: Extract the shared step presentation (structural)

Behaviour is unchanged. Every file under `src/__tests__/presentation/pages/game/hint-mode/`, plus `Game.test.ts`, `Cell.test.ts` and `BoardCell.test.ts`, passes **without edits**. These files stay where they are because their tests import them by path: `useHintMode.ts`, `HintPanel.vue`, `useHintExplanation.ts`, `useRoomBelow.ts`. Later tasks import `useHintExplanation` and `useRoomBelow` from `pages/game/hint-mode/`.

**Files:**
- Create in `src/presentation/components/step-presentation/`: `stepCellView.ts`, `StepTag.vue`, `StepNavigator.vue`, `StepExplanation.vue`
- Move (`git mv`): `src/presentation/pages/game/hint-mode/HintLinkOverlay.vue` → `src/presentation/components/step-presentation/StepLinkOverlay.vue`. The test id becomes `step-link-overlay`; no test references the old one.
- Modify:
  - `useHintMode.ts`
  - `HintPanel.vue`
  - `src/presentation/pages/game/components/Cell.vue`, which imports the view types from the new module
  - `src/presentation/pages/game/GameScreen.vue`, for the overlay import
  - `src/style/index.css`, which gets the shared swap transition
  - both message files

**Interfaces (Produces):**
```ts
// stepCellView.ts — the cell logic moved verbatim out of useHintMode
export type StepHighlight = "none" | "scope" | "pattern" | "answer" | "wrong";
export interface StepCellView { highlight: StepHighlight; candidates: number[] | null; eliminated: number[]; emphasized: number[] }
export interface PresentedStep { step: SolveStep; candidatesBefore: number[][][] } // RevealHintStep and SolvePathStep both satisfy it
export interface StepBoard {
    isEmpty: (row: number, column: number) => boolean;          // no given and no placed digit
    showsCandidates: (row: number, column: number) => boolean;  // for an empty cell; false → shows [] (blank)
}
export const cellKey: (cell: CellReference) => string;
export const scopeCells: (scope: Scope) => CellReference[];
export const touchedCellKeys: (steps: readonly PresentedStep[]) => Set<string>;  // today's involvedKeys
export const stepLinks: (presented: PresentedStep) => ChainLink[];               // chainLinks, else today's wingLinks
export const stepCellView: (presented: PresentedStep, row: number, column: number, board: StepBoard) => StepCellView;
export const stepCellViews: (presented: PresentedStep, board: StepBoard) => StepCellView[][]; // scope keys and links computed once per grid
// StepTag.vue — props: label: string; icon: Component; strong: boolean; stepKey: string | number; testId: string
//   the <Transition name="step-swap" mode="out-in"> span HintPanel has today; strong = solid primary, otherwise primary-light
// StepNavigator.vue — props: stepIndex: number; totalSteps: number; testIdPrefix: string
//   emits: previous: []; next: []; goTo: [index: number]
//   export const MAX_STEP_DOTS = 6
//   test ids: `${prefix}-previous`, `${prefix}-next`, `${prefix}-dot-${index}`, `${prefix}-step-counter`, `${prefix}-step-counter-label`
//   next is disabled at stepIndex >= totalSteps - 1; previous at 0
// StepExplanation.vue — props: stepKey: string | number; testIdPrefix: string; default slot = the explanation content
//   renders `${prefix}-explanation-region` (aria-live="polite", stays mounted) holding a keyed
//   <p data-testid=`${prefix}-explanation` class="text-foreground text-[14.5px] leading-[1.6]">
//   carries the fade mask, the short-screen min-height rule and the clipped-edge measurement;
//   re-measures on mount, onUpdated and after each enter transition; defineExpose({ updateClipped })
```
`useHintMode` keeps its return shape exactly. Its `StepBoard` is:
- `isEmpty`: not a clue and no entry.
- `showsCandidates`: `touchedCellKeys(steps).has(...)`.

`cellView` handles the wrong-entry phase itself and calls `stepCellView` for steps. `cellViews` stays a `computed`.

`HintPanel` keeps its root, role, focus, buttons and caption. It composes:
- `StepTag` with `test-id="hint-technique"`, `strong=isLastStep`, and the `PencilLine` or `ListFilter` icon
- `StepNavigator` with prefix `hint`
- `StepExplanation` with prefix `hint`

On a `maxHeight` change, it calls the exposed `updateClipped` after `nextTick`.

Move these message keys from `hintMode.panel.*` to a new `stepPanel` namespace, with the text unchanged: `previousStep`, `nextStep`, `stepCounter` and `stepCount`.

- [ ] **Step 1:** Run `npx vitest run src/__tests__/presentation` and note that it is green. This is the baseline.
- [ ] **Step 2:** Make the extraction above.
- [ ] **Step 3:** Run the full gate. Expect PASS with **no test file changed**. Check with `git diff --stat -- src/__tests__`, which must be empty.
- [ ] **Step 4: Commit** `♻️ refactor: extract the hint panel's step presentation for reuse`

---

### Task 2: Shared playback panel

**Files:**
- Create: `src/presentation/components/step-presentation/StepPlaybackPanel.vue`
- Modify:
  - `src/presentation/components/playback/useProgressDrag.ts`: export `PlayState`
  - `ProgressBar.vue`: prop `showCounter?: boolean`, default `true`
  - both message files
- Test: `src/__tests__/presentation/components/step-presentation/StepPlaybackPanel.test.ts`, `src/__tests__/presentation/ProgressBar.test.ts`

**Interfaces (Produces):**
```ts
export interface PlayState { isPlaying: Ref<boolean>; stopPlay: () => void; startPlay: () => void } // useProgressDrag.ts
// StepPlaybackPanel.vue
// props: stepIndex: number; totalSteps: number; playState: PlayState; testIdPrefix: string;
//        label: string (the group's aria-label); maxHeight?: number | null (default null)
// slots: tag (a StepTag), default (explanation content)
// emits: previous: []; next: []; goTo: [index: number]; togglePlay: []
// DOM: root role="group" data-testid=`${prefix}-panel`, the same shell classes as HintPanel's root
//   row 1: tag slot | StepNavigator
//   row 2: StepExplanation keyed by stepIndex
//   row 3: `${prefix}-play` (size-11 rounded-full bg-primary text-on-primary, v-press, Play/Pause icon,
//          aria-label stepPanel.play / stepPanel.pause, aria-pressed = isPlaying)
//          + ProgressBar (flex-1, show-counter false, testid-prefix `${prefix}-`,
//            current-step = stepIndex, total-steps = totalSteps - 1, @seek → goTo)
```

| key | en | zh-Hant |
|---|---|---|
| `stepPanel.play` | "Play" | 「播放」 |
| `stepPanel.pause` | "Pause" | 「暫停」 |

- [ ] **Step 1: Write the failing tests.** Use prefix `demo` and slot text `"Because."`.
  - `it("should page with the arrows and the dots")`: 3 steps at index 1 → `demo-dot-0..2` exist, and `demo-dot-1` has `aria-current="step"`. `demo-next` emits `next`, `demo-previous` emits `previous`, and `demo-dot-2` emits `goTo` with `[2]`.
  - `it("should disable the arrows at both ends")`: at index 0 of 3, `demo-previous` is `disabled`. At index 2, `demo-next` is `disabled`.
  - `it("should show one step count, the panel's own")`: 12 steps at index 4 → exactly one `[data-testid='demo-step-counter']`, with text `"5 / 12"`.
  - `it("should fill the seek bar by step")`: 5 steps → index 0 gives `demo-progress-fill` style `width: 0%`, and index 4 gives `width: 100%`.
  - `it("should toggle play")`: `demo-play` has `aria-label="Play"` and `aria-pressed="false"`. A click emits `togglePlay`. With `isPlaying` set to `ref(true)`, it has `aria-label="Pause"` and `aria-pressed="true"`. Under zh-Hant: 「播放」 and 「暫停」.
  - `it("should render the explanation slot in the live region")`: `demo-explanation` text is `"Because."`, inside `demo-explanation-region`.
  - In `ProgressBar.test.ts`: with `showCounter: false` there is no `step-counter`.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: add a step panel with play and seek for walkthrough and review`

---

### Task 3: Game Review adopts the step panel

**Files:**
- Modify: `src/presentation/pages/game-review/GameReview.vue`, `useGameReview.ts`, both message files
- Test: `src/__tests__/presentation/pages/game-review/GameReview.test.ts`

**Interfaces:**
```ts
// useGameReview adds (playback stays usePlaybackState(totalSteps = replay.totalSteps + 1))
export type ReviewStage = "initial" | "action" | "final";
stage: ComputedRef<ReviewStage>;            // 0 → initial; totalSteps → final; otherwise action
positionCount: ComputedRef<number>;         // replay.totalSteps + 2: the panel's totalSteps
changedCell: ComputedRef<CellReference | null>; // the step's cell for fill / erase / toggleNote / hint; null otherwise
description: ComputedRef<ReviewDescription>;    // no longer nullable: initial → { keypath: "review.initialBoard", params: {} }
playState: PlayState;
```
**Layout:**
- From the top: the header, the game summary card as today, the board, then `StepPlaybackPanel`.
  - The board is `data-testid="review-board"`, and each cell is `review-cell-<row>-<column>` with `:selected="isChanged(row, column)"`.
  - The panel has prefix `review` and label `t("review.title")`.
- `PlaybackControls` and the old description card are removed from this page.
- The tag is `StepTag` with `test-id="review-action"`:
  - initial: `review.stages.initial` with `LayoutGrid`
  - action: `review.actions.<action>` with today's `ACTION_ICONS`
  - final: `review.stages.completed` with `Trophy`, or `review.stages.gaveUp` with `X`
  - `strong` is set only in the final stage.
- The explanation slot keeps today's `i18n-t` with bold `value`, `row` and `column`.

| key | en | zh-Hant |
|---|---|---|
| `review.actions.fill` / `erase` / `toggleNote` / `hint` / `autoNotes` / `undo` | "Fill" / "Erase" / "Note" / "Hint" / "Auto Notes" / "Undo" | 「填入」／「擦除」／「筆記」／「提示」／「自動筆記」／「復原」 |
| `review.stages.initial` / `completed` / `gaveUp` | "Initial Board" / "Completed" / "Gave Up" | 「初始盤面」／「已完成」／「已放棄」 |
| `review.initialBoard` (replace) | "The board when the game began" | 「遊戲開始時的盤面」 |
| `review.autoNotes` (replace) | "Filled in notes for every empty cell" | 「為所有空格填上筆記」 |
| `review.undo` (replace) | "Took back the previous move" | 「收回上一步」 |
| `review.completed` (replace) | "Every cell is filled in correctly" | 「所有格子都填對了」 |
| `review.gaveUp` (replace) | "The board when you gave up" | 「放棄時的盤面」 |

The replaced sentences stop the tag and the explanation from repeating the same words.

- [ ] **Step 1: Write the failing tests.**
  - In `mountReview`, `review-next-step-button` becomes `review-next`. This is mechanical, and the four existing tests otherwise stay.
  - `it("should tag each position with its stage or action")`:
    - 0 clicks → `review-action` "Initial Board", and `review-explanation` "The board when the game began"
    - 1 click → "Fill"; under zh-Hant, 「填入」
    - 2 clicks with `completed: true` → "Completed"; with `completed: false` → "Gave Up"
  - `it("should outline the cell the step changed")`: 1 click → `review-cell-0-1` has `ring-primary`, and `review-cell-0-0` does not.
  - `it("should not outline any cell for auto notes or undo")`: `it.each(["autoNotes", "undo"])`, 1 click → no `[data-testid^='review-cell-']` has `ring-primary`.
  - `it("should count positions with dots for a short game")`: 1 action gives 3 positions → `review-dot-0..2`. After 1 click, `review-dot-1` has `aria-current="step"`.
  - `it("should auto-play to the end and stop")`: `vi.useFakeTimers({ shouldAdvanceTime: true })`, 0 clicks, click `review-play` →
    - after 800ms, `review-action` is "Fill"
    - after another 800ms, it is "Gave Up"
    - `review-play` has `aria-label="Play"`
  - `it("should keep the seek bar and play button inside the panel")`: `review-panel` contains `review-progress-bar` and `review-play`.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: review a game step by step in the hint-style panel`

---

### Task 4: Solution counting that is safe for user input (domain)

**Files:**
- Modify: `src/domain/generator/SudokuSolver.ts`
- Test: `src/__tests__/domain/generator/SudokuSolver.test.ts`

**Interface:** `countSolutions(board, limit = 2)` keeps its signature. The existing tests stay unchanged.

**4a, bug fix**
- [ ] **Step 1: Write the failing test.**
  - `it("should count no solutions when two givens already conflict")`: an empty board with 5 at (0, 0) and (0, 4) → `0`.
  - Also: 5 at (0, 0) and (1, 1), which share a box → `0`.
- [ ] **Step 2:** Run the file. Expect FAIL. Today it returns 2.
- [ ] **Step 3: Implement.** Before the search, check each given against its peers: clear that cell, then call `isValidPlacement`.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `🐛 fix: count no solutions for a board whose givens already conflict`

**4b, performance**
- [ ] **Step 1: Write the failing test.**
  - `it("should give up at once when an empty cell has no candidate")`:
    - Build an empty board, put digits 1–8 in column 8 at rows 1–8, and put 9 at (0, 0). Cell (0, 8) has no candidate.
    - Spy on `SudokuBoard.prototype.isValidPlacement`.
    - Expect `countSolutions(board, 2)` to be `0`, and the spy's call count to be `< 5000`.
    - Today's row-major search makes about a million calls here. Do not use the column-8-rows-0–7 variant in the test: before the fix it would hang the worker, which a timeout cannot interrupt.
- [ ] **Step 2:** Run the file. Expect FAIL on the call count.
- [ ] **Step 3: Implement.** At each level, branch on the empty cell with the fewest candidates, and return 0 as soon as a cell has none. The result is still `min(solutions, limit)`, so the generator's uniqueness checks do not change.
- [ ] **Step 4:** Run the full gate. Expect PASS, including `SudokuGenerator.test.ts`.
- [ ] **Step 5: Commit** `🚀 perf: count solutions from the most constrained cell`

---

### Task 5: Solve path with the board before each step (domain)

**Files:**
- Modify: `src/domain/solver/BoardState.ts`, `src/domain/game/Sudoku.ts`
- Create: `src/domain/solver/SolvePath.ts`
- Test: `src/__tests__/domain/solver/SolvePath.test.ts`, `src/__tests__/domain/solver/BoardState.test.ts`

**Interfaces (Produces):**
```ts
// BoardState
public candidateGrid(): number[][][];  // [row][column] → sorted candidates; [] for filled cells
public valueGrid(): number[][];
// SolvePath.ts
export interface SolvePathStep { step: SolveStep; valuesBefore: number[][]; candidatesBefore: number[][][] }
export const buildSolvePath: (puzzle: number[][]) => SolvePathStep[];
//   walks TechniqueSolver.nextStep exactly like solveWithTechniques (assignments, then eliminations);
//   stops when solved or when no technique applies
```

**5a, structural**
- [ ] **Step 1:** Replace `Sudoku`'s private `candidatesOfAllCells` with `BoardState.candidateGrid()`, moving the same body there.
- [ ] **Step 2:** Run the full gate. Expect PASS with no test changed.
- [ ] **Step 3: Commit** `♻️ refactor: let BoardState list every cell's candidates`

**5b, behavioural**
- [ ] **Step 1: Write the failing tests.**
  - `BoardState.test.ts`: `valueGrid()` of `BoardState.fromPuzzle(singlesPuzzle)` equals `singlesPuzzle`.
  - `SolvePath.test.ts`:
    - `it("should list the same steps as solveWithTechniques")`: for `singlesPuzzle`, `buildSolvePath(...).map(entry => entry.step)` equals `solveWithTechniques(BoardState.fromPuzzle(singlesPuzzle)).steps`.
    - `it("should record the board before each step")`:
      - Step 0's `valuesBefore` equals `singlesPuzzle`, and its `candidatesBefore` equals `BoardState.fromPuzzle(singlesPuzzle).candidateGrid()`.
      - Step 1's `valuesBefore` has step 0's assignment digit at its cell, and its `candidatesBefore` for that cell is `[]`.
    - `it("should stop where no technique applies")`: an all-zero board → `[]`.
    - `it("should return no steps for a solved board")`: `singlesSolution` → `[]`.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: record the board before each step of a solve path`

---

### Task 6: Walkthrough playback in the step panel, with a board that stays put

**Files:**
- Create: `src/presentation/pages/solver-walkthrough/useWalkthroughPlayback.ts`
- Modify: `src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue`
- Delete in 6b: `src/presentation/components/playback/PlaybackControls.vue`, `src/presentation/pages/solver-walkthrough/components/ChainOverlay.vue` and their tests
- Test: `src/__tests__/presentation/SolverWalkthrough.test.ts`, `src/__tests__/presentation/components/step-presentation/StepLinkOverlay.test.ts` (6b)

**Interfaces:**
```ts
export const useWalkthroughPlayback = (givens: Ref<number[][]>) => ({
    path,          // ShallowRef<SolvePathStep[] | null>; null = input phase
    start,         // (path: SolvePathStep[]) => void — stops play, goes to step 0
    stop,          // () => void — stops play, path = null
    stepIndex,     // from usePlaybackState(computed(() => Math.max(0, steps - 1))), so play ends on the last step
    currentStep, isLastStep, playState, next, previous, goTo, togglePlay,
    puzzleCells,   // ComputedRef<PuzzleCell[][]>: givens as clues; in playback, digits placed before the current step as entries
    cellViews,     // ComputedRef<StepCellView[][] | null>: stepCellViews(current, { isEmpty: valuesBefore === 0, showsCandidates: () => true })
    links,         // ComputedRef<ChainLink[]>: stepLinks(current) or []
});
```
⚙︎ The walkthrough shows every empty cell's candidates before the step, because the solver reasons over the whole board. Hint mode keeps its touched-cells rule. As in hint mode, a step shows the board *before* it, with the step's marks. The digit appears on the next step.

**Layout** (the decision that fixes audit 14):
```
root  flex flex-col gap-2 h-dvh py-6 px-5        (as GameScreen)
  header
  flex-1
  flex flex-col items-center gap-6
    walkthrough-board   relative; game Cell per cell (solver-cell-<row>-<column>); StepLinkOverlay inside; pointer-events-none in playback
    walkthrough-input-area   ref, relative w-full
      walkthrough-inputs   DigitPad + action row; ALWAYS rendered; opacity-0 + inert while an overlay shows
      overlay              absolute top-0 inset-x-0 z-10; StepPlaybackPanel (prefix walkthrough) during playback
  flex-1
```
- The overlay gets `max-height` from `useRoomBelow(inputArea, 24)`.
- Cells use the game `Cell` with `:puzzle-cell="puzzleCells[row][column]"` and `:hint="cellViews?.[row][column] ?? null"`. During input they also get `selected` and `selected-digit`, so input shows no candidates.
- The tag is `StepTag`, `test-id="walkthrough-technique"`. It shows the technique label. When the step places a digit it is `strong` with `PencilLine`; otherwise it uses `ListFilter`.
- The explanation is `useHintExplanation()(step, candidatesBefore)`.
- Back during playback calls `stop()`, as today.
- Solve calls `start(buildSolvePath(values))`. Task 9 adds the checks in front of it.

**6a, behavioural**
- [ ] **Step 1: Write the failing tests.**
  - Rewrite these tests against the new ids:

    | old | new |
    |---|---|
    | `next-step-button` | `walkthrough-next` |
    | `prev-step-button` | `walkthrough-previous` |
    | `play-button` | `walkthrough-play` |
    | `step-counter` | `walkthrough-step-counter` (the singles path is longer than 6, so it shows "1 / N") |
    | `progress-fill` | `walkthrough-progress-fill` |
    | `step-description` | `walkthrough-technique` / `walkthrough-explanation` |

    Steps are now 0-based, with no "initial board" position, so "click Next k + 1 times" becomes "k times".
  - Replace the candidate-related input tests ("show all 1-9…", "remove filled digit…", "restore candidate notes…", and the text checks in "reject filling…" and "clear a filled cell…") with:
    - `it("should leave empty cells blank while entering a puzzle")`: `solver-cell-0-0` text is `""`. After filling 9 at (0, 0), `solver-cell-0-1` text is `""`.
    - `it("should show entered digits as givens")`: after filling 7 at (3, 4), its `cell-value` has `font-bold`.
  - Delete "first/last" and "center the step counter". Replace "Initial board" with `it("should open on the first step")`: after Solve, `walkthrough-technique` is "Naked Single", and `walkthrough-explanation` contains `Row ${row + 1}, Col ${column + 1}` and the digit of `TechniqueSolver.nextStep`'s first assignment.
  - `it("should mark the first step's answer cell like hint mode")`: that cell has `bg-primary-light` and `ring-primary`, and has no `cell-value`. After `walkthrough-next`, it has `cell-value` with the digit and `text-primary`. After `walkthrough-previous`, the value is gone again.
  - `it("should show every empty cell's candidates before the step")`: at step 0, an empty cell outside the step's scopes has text equal to `BoardState.fromPuzzle(singlesPuzzle).candidatesOf(row, column).join("")`.
  - `it("should strike the candidates an elimination step removes")`: for the hard sample, at the first step with `assignments.length === 0`, each elimination cell has `eliminated-note-<digit>`.
  - Keep "should apply scope variant…" (`bg-cell-scope`) with the new ids.
  - `it("should stop on the last step the solver found")`: click `walkthrough-next` until it is `disabled`. Every cell except the last step's assignment cell then shows `singlesSolution` as `cell-value`, and the progress fill is `width: 100%`.
  - `it("should keep the inputs in place under the panel")`:
    - Before Solve: `walkthrough-inputs` has no `inert`.
    - After Solve: it still exists, has `inert` and `opacity-0`. `walkthrough-panel`'s parent has `absolute`, and the `walkthrough-board` element is the same `element` as before Solve.
  - `it("should stop auto-play when going back to edit")`: fake timers; Solve, then `walkthrough-play`, then `back-button`. Advance 2000ms → no `walkthrough-panel`. Solve again → `walkthrough-step-counter` is "1 / N".
  - `it("should start from the first step after solving again")`: step to 5, then Back, then Solve → "1 / N".
  - Keep: "ignore cell clicks after entering solve mode" (no `bg-cell-selected`), "return to edit mode and preserve puzzle…", and the auto-advance-every-800ms test, using the new ids.
  - zh: `walkthrough-technique` is 「唯一候選數」, and `walkthrough-explanation` contains 「第」 and 「列」. The reset and solve labels stay 「重設」 and 「解題」.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: play the walkthrough in the hint-style panel without moving the board`

**6b, structural cleanup:** nothing uses these any more.
- [ ] **Step 1:**
  - Port `ChainOverlay.test.ts`'s four cases to `StepLinkOverlay.test.ts`: one `line` per link, no SVG for `[]`, `preserveAspectRatio="none"`, and a dash only on weak links.
  - Delete `ChainOverlay.vue`, `PlaybackControls.vue`, `ChainOverlay.test.ts` and `PlaybackControls.test.ts`.
  - Remove `ProgressBar`'s `showCounter` prop and its counter span, and drop the counter assertions from `ProgressBar.test.ts`.
  - Delete the message keys no source file references any more: check `walkthrough.initialBoard`, `walkthrough.eliminations`, `playback.step` and `game.hintResult` with grep, and keep `position.cell`, which `GameToast` still uses.
- [ ] **Step 2:** Run the full gate. Expect PASS.
- [ ] **Step 3: Commit** `♻️ refactor: remove playback controls and chain overlay now that no page uses them`

---

### Task 7: Reset is a quiet button that asks first

**Files:**
- Create: `src/presentation/pages/solver-walkthrough/useWalkthroughDialog.ts`, `WalkthroughDialog.vue`
- Modify: `SolverWalkthrough.vue`, both message files
- Test: `src/__tests__/presentation/SolverWalkthrough.test.ts`

**Interfaces:**
```ts
export type WalkthroughDialogKind = "reset";   // Task 9 adds "noSolution" | "multipleSolutions" | "noSteps"
export const { provideDialog: provideWalkthroughDialog, useDialog: useWalkthroughDialog } =
    createDialog<WalkthroughDialogKind, "confirm" | "cancel">();
// WalkthroughDialog.vue: LeaveGameDialog's modal shell; one content table per kind:
//   { icon, titleKey, messageKey, confirmKey, confirmTone: "danger" | "primary", cancelKey: string | null }
//   test ids: walkthrough-dialog, walkthrough-dialog-title, walkthrough-dialog-message,
//             walkthrough-dialog-confirm, walkthrough-dialog-cancel (absent when cancelKey is null)
```
**Action row:** `flex gap-3 w-full`.
- `reset-button`: an `h-12 px-4` text button with the `RotateCcw` icon, `text-foreground-secondary font-medium`, no fill. It is `disabled` while the board is empty.
- `solve-button`: `flex-1`, primary, `h-12`.

| key | en | zh-Hant |
|---|---|---|
| `walkthrough.dialog.reset.title` | "Clear the board?" | 「清空盤面？」 |
| `walkthrough.dialog.reset.message` | "Every digit you entered will be removed." | 「你輸入的數字會全部清除。」 |
| `walkthrough.dialog.reset.confirm` | "Clear" | 「清空」 |

Cancel uses `common.cancel`. The reset kind has a `danger` confirm.

- [ ] **Step 1: Write the failing tests.**
  - `it("should make reset a quiet text button")`: `reset-button` has `text-foreground-secondary` and has no `bg-danger`. It is `disabled` on an empty board and enabled after one digit.
  - `it("should ask before clearing the board")`: fill 7 at (3, 4), then click `reset-button` → `walkthrough-dialog-message` is the en message, and `solver-cell-3-4` still shows 7.
  - `it("should keep the puzzle when reset is cancelled")`: `walkthrough-dialog-cancel` → no dialog, and 7 is still there.
  - `it("should clear the board when reset is confirmed")`: `walkthrough-dialog-confirm` → `solver-cell-3-4` text is `""`, and `reset-button` is `disabled`.
  - zh: `walkthrough-dialog-title` is 「清空盤面？」.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.** The page calls `provideWalkthroughDialog()` and mounts `<WalkthroughDialog />`.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: make reset a quiet button that asks before clearing the board`

---

### Task 8: Intro card with samples that ship in production, and an initial puzzle

**Files:**
- Rename: `src/presentation/pages/solver-walkthrough/testPuzzles.ts` → `samplePuzzles.ts`
- Modify:
  - `SolverWalkthrough.vue`
  - `src/utils/featureToggle.ts`: remove the `walkthroughTestButtons` entry
  - both message files
  - `src/__tests__/fixtures/multiStepPuzzle.ts` and `src/__tests__/domain/solver/TechniqueSolver.test.ts` (imports)
- Test: `src/__tests__/presentation/SolverWalkthrough.test.ts`, `src/__tests__/presentation/pages/solver-walkthrough/samplePuzzles.test.ts`

**8a, structural:** rename `TestPuzzlePreset` → `SamplePuzzle` and `TEST_PUZZLE_PRESETS` → `SAMPLE_PUZZLES`, and the file, keeping the `label` field. Update every import.
- [ ] **Step 1:** Make the rename. Run the full gate. Expect PASS.
- [ ] **Step 2: Commit** `♻️ refactor: call the walkthrough presets samples`

**8b, behavioural**

**Interfaces:**
```ts
export interface SamplePuzzle { id: Difficulty; puzzle: number[][] }   // Singles → easy, Medium → medium, Hard → hard
// SolverWalkthrough props: initialPuzzle?: number[][]  — copied into the board on setup; the intro starts closed when given
// intro state: introOpen = initialPuzzle === undefined; closed by "enter own" or a sample; reopened by a confirmed reset
```
**Intro card:** `walkthrough-intro`, shown in the input area's overlay slot while `introOpen` is true and the page is not in playback. It uses the same overlay, `max-height` and `bg-card rounded-2xl shadow-card-lg p-4` shell as the panel. The inputs underneath are `inert`. Content, top to bottom:
1. A `Wand2` icon tile, then the description (`text-[15px] text-foreground`).
2. `walkthrough-enter-own`: primary, full width, `h-12`, with a `Pencil` icon.
3. The label `walkthrough.intro.samples` (`text-[13px] font-semibold text-foreground-secondary`), then a `grid grid-cols-3 gap-2` of `load-sample-<id>` buttons (`h-11 bg-primary-light text-primary font-semibold`). Each is labelled with `useDifficultyLabel()(id)` and has `v-press`.
4. `walkthrough-intro-caveat`: an `Info` icon plus text, `text-[13px] text-foreground-secondary`.

| key | en | zh-Hant |
|---|---|---|
| `walkthrough.intro.description` | "Enter any Sudoku and see which techniques the solver uses to crack it, step by step." | 「輸入任何一題數獨，看解題器用哪些技巧一步步解開」 |
| `walkthrough.intro.enterOwn` | "Enter a Puzzle" | 「自己輸入題目」 |
| `walkthrough.intro.samples` | "Try a Sample" | 「試試範例」 |
| `walkthrough.intro.caveat` | "It may not finish: the puzzle may need a more advanced technique, the input may have a mistake, or the puzzle may have no solution or more than one." | 「不一定能解完：題目可能需要更進階的技巧、輸入可能有誤，或題目本身無解或不只一個解。」 |

- [ ] **Step 1: Write the failing tests.**
  - `samplePuzzles.test.ts`:
    - The ids are `["easy", "medium", "hard"]`.
    - `it.each` → `new SudokuSolver().countSolutions(puzzle, 2)` is `1`.
    - The easy sample is `solved` by `solveWithTechniques`.
  - `SolverWalkthrough.test.ts`:
    - Test helpers: `mountWalkthrough({ initialPuzzle })` passes the prop. Input tests click `walkthrough-enter-own` first. Puzzle-based tests use `initialPuzzle: singlesPuzzle` instead of `fillPuzzle` (mechanical).
    - `it("should open with the guide")`: `walkthrough-intro` contains the en description and caveat, and `walkthrough-inputs` has `inert`. Under zh-Hant it contains 「輸入任何一題數獨」 and 「不一定能解完」.
    - `it("should offer the samples in production")`: `vi.stubEnv("VITE_APP_ENV", "production")` (with `vi.unstubAllEnvs()` in `afterEach`) → `load-sample-easy`, `load-sample-medium` and `load-sample-hard` exist with "Easy", "Medium" and "Hard". Under zh-Hant: 「簡單」「中等」「困難」.
    - `it("should load a sample and close the guide")`: `load-sample-hard` → no `walkthrough-intro`, `solver-cell-0-0` shows 2, and `walkthrough-inputs` has no `inert`.
    - `it("should close the guide to enter a puzzle")`: `walkthrough-enter-own` → no `walkthrough-intro`, and every cell text is `""`.
    - `it("should bring the guide back after a confirmed reset")`.
    - `it("should start from a puzzle passed in")`: with `initialPuzzle: singlesPuzzle` → no `walkthrough-intro`, and `solver-cell-0-3` shows 2.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.**
  - Switch the samples to `id`.
  - Update `multiStepPuzzle.ts` and `TechniqueSolver.test.ts` to find `id === "hard"`.
  - Delete the dev-only button row and the feature-toggle entry. `isFeatureEnabled` stays for future flags.
- [ ] **Step 4:** Run the full gate. Expect PASS. This includes `useHintMode.test.ts`, through the fixture.
- [ ] **Step 5: Commit** `✨ feat: open the walkthrough with a guide and samples that ship in production`

---

### Task 9: Check the solution count before solving

**Files:**
- Modify: `SolverWalkthrough.vue`, `useWalkthroughDialog.ts`, `WalkthroughDialog.vue`, both message files
- Test: `src/__tests__/presentation/SolverWalkthrough.test.ts`

**Solve flow** (`runSolver` becomes async):
1. Run `countSolutions(values, 2)`. If it is 0, `open("noSolution")` and stop.
2. If it is ≥ 2, call `open("multipleSolutions")`. On anything but `"confirm"`, stop.
3. Run `buildSolvePath(values)`. If the path is empty, `open("noSteps")` and stop.
4. Otherwise `start(path)`.

| key | en | zh-Hant |
|---|---|---|
| `common.ok` | "OK" | 「好」 |
| `walkthrough.dialog.noSolution.title` | "Can't Solve" | 「無法解題」 |
| `walkthrough.dialog.noSolution.message` | "This puzzle has no solution. Check what you entered." | 「這題無解，請檢查輸入」 |
| `walkthrough.dialog.multipleSolutions.title` | "More Than One Solution" | 「不只一個解」 |
| `walkthrough.dialog.multipleSolutions.message` | "This puzzle has more than one solution, so the steps may not be complete." | 「這題不只一個解，解題結果可能不完整」 |
| `walkthrough.dialog.multipleSolutions.confirm` | "Solve Anyway" | 「仍要解題」 |
| `walkthrough.dialog.multipleSolutions.cancel` | "Keep Editing" | 「返回修改」 |
| `walkthrough.dialog.noSteps.title` | "No Steps to Show" | 「沒有可示範的步驟」 |
| `walkthrough.dialog.noSteps.message` | "The solver's techniques can't make progress from this board, or it's already full." | 「解題器的技巧無法從這個盤面推進，或盤面已經填滿。」 |

- `noSolution` and `noSteps` have one `primary` button with `common.ok` and no cancel.
- `multipleSolutions` has a primary confirm and a cancel.

- [ ] **Step 1: Write the failing tests.** Use `flushPromises()` after each click.
  - `it("should block solving a puzzle with no solution")`:
    - `initialPuzzle` has 1–8 in column 8 at rows 1–8 and 9 at (0, 0).
    - Click `solve-button` → `walkthrough-dialog-message` is the en message, and there is no `walkthrough-dialog-cancel`.
    - Click confirm → no dialog, no `walkthrough-panel`, and `solve-button` exists.
    - Under zh-Hant, the message is 「這題無解，請檢查輸入」.
  - `it("should block a passed-in puzzle whose givens already conflict")`: 5 at (0, 0) and (0, 4) → the noSolution message.
  - `it("should warn about more than one solution and still allow solving")`:
    - Start from `singlesSolution`.
    - Find an unavoidable rectangle: rows r1 and r2 in one band, columns c1 and c2 in different stacks, with `[r1][c1] = [r2][c2] = a` and `[r1][c2] = [r2][c1] = b`. Throw if none exists.
    - Blank those four cells plus one other cell outside their rows and columns, so a naked single remains.
    - Solve → `walkthrough-dialog-message` is the multiple-solutions text (en, and 「這題不只一個解，解題結果可能不完整」 under zh).
    - Click `walkthrough-dialog-confirm` → `walkthrough-panel` shows 1 step (`walkthrough-dot-0` only).
  - `it("should keep editing when the warning is declined")`: the same board, then `walkthrough-dialog-cancel` → no panel, and the inputs are usable.
  - `it("should explain when there is nothing to show")`: an empty board (`walkthrough-enter-own`), then Solve → multiple solutions, then confirm → the `noSteps` message. Click OK → no panel.
  - `it("should solve a unique puzzle without asking")`: singles → no `walkthrough-dialog`, and `walkthrough-panel` exists.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: check the solution count before the walkthrough starts solving`

---

### Task 10: Real-browser visual pass (360×780)

**Files:** scripts only, in `/private/tmp/claude-501/-Users-ethan-Project-sudoku/8581f059-8ad5-412a-943e-1b0b712810ab/scratchpad/shots/` (for example `stage4.mjs`, reusing `capture.mjs`'s pinia-driven flows). Add nothing to `src/` and no demo routes.

- [ ] **Step 1: Set up.**
  - Start a dev server of your own: `CHOKIDAR_USEPOLLING=1 npx vite --port <free port> --strictPort`, in the background.
  - Use puppeteer-core from `shots/node_modules` with `executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, a 360×780 viewport, `isMobile` and `hasTouch`.
  - Seed `sudoku-settings` (`language`, `appearance`, `colorTheme`) with `evaluateOnNewDocument`.
  - For review, record a finished game and a given-up game through pinia, as `capture.mjs` does, then open `/game-review/<index>`.
- [ ] **Step 2: Capture.**
  - Matrix: zh-Hant and en × light and dark, in green. The playback states are also captured in teal light and dark.
  - Walkthrough states:
    1. The intro card.
    2. Input with digits and a selected cell.
    3. The reset dialog.
    4. The no-solution dialog.
    5. The multiple-solutions dialog.
    6. Playback on the hard sample's first elimination step.
    7. Playback on a step with links (a chain or wing step from the hard sample, if it has one).
    8. Playback on the last step.
  - Review states: the initial position, a fill step, the completed final position, and the given-up final position.
  - Hint mode in the steps phase, as a regression check of Task 1.
  - Save to `shots/stage4/<locale>-<theme>-<mode>-<state>.png`.
- [ ] **Step 3: Measure.**
  - The `walkthrough-board` `getBoundingClientRect().top` is equal, within 0.5px, in states 1, 2 and 6. This is the audit 14 check.
  - There is no vertical page scroll in the walkthrough at 780: `scrollHeight <= innerHeight`. The panel's bottom is at or above `innerHeight`.
  - There is no horizontal overflow on either page at 360px.
  - At 360×640 the panel stays on screen: the explanation shrinks and fades instead of the play row being pushed off.
  - With `.env.production`, run `npx vite build --mode production && npx vite preview --port <free port>` and confirm `load-sample-easy` exists. This is the audit 13 check on a real production build.
- [ ] **Step 4: Review every shot.**
  - Marks look the same as hint mode: scope, pattern, eliminated, answer and links.
  - Tags and explanations are readable in dark mode.
  - The intro copy and caveat do not crowd at 360px in en.
  - The seek bar and step count sit in the same place on both pages.
  - Fix any problem test first (`🐛 fix: …`).
- [ ] **Step 5: Report to the user.** Give the shot folder path and list this plan's ⚙︎ choices for review:
  - No candidates at all while entering a puzzle.
  - The walkthrough shows every empty cell's candidates during playback; hint mode keeps touched cells only.
  - A step shows the board before it, so the final digit is never shown filled.
  - The first and last buttons are dropped in favour of the seek bar.
  - The intro card covers the inputs until the player picks an action, and comes back after a reset.
  - The no-solution, multiple-solutions and no-steps messages are dialogs.
  - The "no steps" case gets a message. The spec's "no extra message" applies to stopping part-way.
  - Review stage tags, and the reworded review sentences.
  - The copy tables.
