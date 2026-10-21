# 揭示一格：逐步提示模式 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「揭示一格」改成二選一：盤面有錯時指出一格錯誤；沒有錯時在盤面上逐步展示到下一個填入數字的完整推理，最後一步才填入。

**Architecture:**
- Domain 新增兩樣東西：
  - `TechniqueSolver.stepsToNextAssignment` 取出整串步驟；
  - `Sudoku` 改成唯讀的「計算提示」加上「套用提示」兩個操作。
- Presentation 新增：
  - `useHintMode` 狀態機（錯格／步驟兩種階段，負責每格的顯示資料）；
  - `HintPanel` 面板，取代數字鍵與控制列；
  - 每種技巧的白話說明。
- 產生器退而求其次時，只接受解題器解得開的題目。

**Tech Stack:** Vue 3.5 `<script setup>`、TypeScript strict、Pinia、vue-i18n 11、Tailwind v4、Vitest + @vue/test-utils（jsdom）。

**Spec:** `docs/superpowers/specs/2026-10-21-step-by-step-reveal-hint-design.md`
**視覺參考：** 分支 `spike/hint-mode`（commit 8a91d2b）。只當參考，不合併、不 cherry-pick。用 `git show spike/hint-mode:<path>` 看 `src/presentation/pages/game/hint-mode/*`。

## Global Constraints

- 一次提示二選一：盤面有填錯的格子時只指出一格錯誤，依閱讀順序取第一格，不進入推理；沒有錯時才逐步揭示。
- 提示一出現就扣一次（`hintTracker.useHint()`），按取消、關閉或沒看完都一樣。
- 錯格面板的按鈕是「清除」／「關閉」。按清除只清那一格的填寫，筆記保留；按關閉盤面不變。
- 步驟面板：前面的步驟主按鈕是「下一步」，只有最後一步是「[答案數字] 填入答案」。另有「取消」與 ‹ › 翻頁。
- 盤面只在「填入答案」時改變，一次套用：填入答案、從玩家筆記刪掉整串推理刪去的候選數（只刪不補）、「自動移除筆記」設定照一般填入規則。取消時盤面完全不變。
- 提示模式中，推理用到的格子顯示解題器算出的候選數，用主題色粗體；玩家筆記暫時隱藏，結束後還原。面板底部小字：zh「顯示盤面算出的候選數，你的筆記暫時隱藏」。
- 提示模式期間盤面鎖住：格子、數字鍵、復原、筆記與擦除、提示選單都無作用。標頭難度標籤改顯示「提示模式」。提示模式不存檔。
- 提示選單拿掉「檢查錯誤」。Analytics 的 `hint_type` 移除 `check_errors`。
- 19 種技巧都要有專屬中英文說明。格子位置寫「第 r 列第 c 欄」，技巧名稱用 `useTechniqueLabel()`，文字放訊息檔、用參數插值。
- 設計文件裡我自己做的決定（⚙︎）照文件執行。
- 依專案規範：
  - TDD，每次綠燈就 commit；結構性與行為性分開 commit。
  - English Conventional Commits 加 emoji，不加 Co-Authored-By。
  - commit 前 `npx vitest run && npm run lint && npx vue-tsc --noEmit` 全過。
  - domain 不可 import application、presentation、stores。
  - 不用縮寫命名，英文註解。

## Review Focus

1. **提示填入的是最後一格**：填入後遊戲要完成，完成視窗、統計、`game_complete` 都要照常觸發。測試在 Task 5。
2. **玩家完全沒寫筆記**：提示中顯示算出的候選數；填入後玩家筆記仍是空的，不會被補上。測試在 Task 5。
3. **提示填入後立刻按復原**：盤面回到提示前，包括被刪掉的筆記。測試在 Task 3（domain）和 Task 5（頁面）。
4. **提示模式中按返回離開遊戲**：提示模式結束，盤面不變，存檔裡沒有提示狀態。測試在 Task 5。
5. **開著「自動移除筆記」**：填入時同行、列、宮的該數字筆記被移除。關閉時只刪推理刪去的候選數。測試在 Task 3。

---

### Task 1: 取出到下一個填入為止的整串步驟

**Files:**
- Modify: `src/domain/solver/TechniqueSolver.ts:59-74`
- Test: `src/__tests__/domain/solver/TechniqueSolver.test.ts`

**Interfaces:**
- Produces: `TechniqueSolver.stepsToNextAssignment(state: BoardState): SolveStep[]`。依序回傳每個要套用的消去步驟，最後一個是含 `assignments` 的步驟；找不到含填入的步驟時回傳 `[]`。`nextAssignment(state)` 改為 `stepsToNextAssignment(state).at(-1) ?? null`，行為不變。

- [ ] **Step 1: 寫失敗測試**
  - `should return only the assignment step when a single is available`：用 `src/__tests__/fixtures/singlesPuzzle.ts` 的盤面，回傳長度 1，且 `steps[0].assignments.length > 0`。
  - `should return elimination steps before the assignment`：從 `src/presentation/pages/solver-walkthrough/testPuzzles.ts` 的 Hard 題，用 `solveWithTechniques` 找到第一個 assignments 為空的步驟，從那個步驟之前的局面呼叫。斷言除最後一步外都沒有 assignments、都有 eliminations，最後一步有 assignments。
  - `should return an empty list when no technique applies`：用一個解題器卡住的局面（例如只剩極少線索的盤面，可以從 `solveWithTechniques` 回傳 `stuck: true` 的局面取得）。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/domain/solver/TechniqueSolver.test.ts`。Expected：FAIL（方法不存在）。
- [ ] **Step 3:** 實作，並讓 `nextAssignment` 改用新方法。
- [ ] **Step 4:** 全部測試、lint、tsc。Expected：PASS，既有 `nextAssignment` 測試不變。
- [ ] **Step 5:** Commit：`✨ feat: list every solver step up to the next assignment`

### Task 2: 產生的題目一定能用技巧解開

**Files:**
- Modify: `src/domain/generator/SudokuGenerator.ts`（`generatePuzzle`）
- Test: `src/__tests__/domain/generator/SudokuGenerator.test.ts`

**Interfaces:**
- Consumes: `DifficultyRater.rate(puzzle): Difficulty | null`
- Produces: `generatePuzzle(difficulty)` 永遠回傳 `rate(puzzle) !== null` 的題目。30 次內有符合難度的照舊回傳；否則回傳之後第一個 `rate !== null` 的候選，繼續產生直到找到為止。

- [ ] **Step 1: 寫失敗測試**
  - `should only fall back to a technique-solvable puzzle`：用 `vi.spyOn(DifficultyRater.prototype, "matches").mockReturnValue(false)`，並讓 `rate` 前幾次回傳 `null`、之後回傳 `"hard"`。斷言回傳的題目是 `rate` 回傳非 null 的那一個（用 spy 的呼叫紀錄比對）。
  - `should keep every generated puzzle solvable step by step`：三種難度各產生 2 題。用 `stepsToNextAssignment`（Task 1）反覆套用到解完，過程中每次都拿到非空清單。
    - 這條較慢；若單題超過 2 秒，用專案既有的長時間測試慣例（`it.skip` 或環境變數旗標，參考 8 個 skipped 測試的寫法）。
- [ ] **Step 2:** 跑測試。Expected：第一條 FAIL。
- [ ] **Step 3:** 實作退而求其次的規則，並移除「直接回傳最後一個候選」的分支與 `console.warn`。
- [ ] **Step 4:** 全部測試、lint、tsc。Expected：PASS。
- [ ] **Step 5:** Commit：`🐛 fix: never fall back to a puzzle the technique solver cannot finish`

### Task 3: Sudoku 的「計算提示」與「套用提示」

**Files:**
- Create: `src/domain/game/RevealHint.ts`（型別）
- Modify: `src/domain/game/Sudoku.ts:188-226`、`src/domain/game/RevealOutcome.ts`
- Test: `src/__tests__/domain/game/Sudoku.test.ts`

**Interfaces:**
- Consumes: `stepsToNextAssignment`（Task 1）。
- Produces（`RevealHint.ts`）：

```ts
export interface RevealHintStep {
    step: SolveStep;
    candidatesBefore: number[][][]; // [row][column] → sorted candidates before this step; [] for filled cells
}
export type RevealHintPlan =
    | { kind: "wrongEntry"; cell: CellReference }
    | { kind: "steps"; steps: RevealHintStep[]; target: CellReference; digit: number }
    | { kind: "noTechnique" }
    | { kind: "solved" };
```

- `Sudoku.planRevealHint(): RevealHintPlan`：唯讀，不改盤面、不拍快照。
  - 有錯格（`checkErrors()` 依閱讀順序第一格）→ `wrongEntry`。
  - 否則從「題目數字＋玩家填對的數字」建 `BoardState`，取 `stepsToNextAssignment`。
    - 非空 → `steps`；`target` 和 `digit` 取最後一步的第一個 assignment。
    - 空 → `noTechnique`。
  - 沒有空格 → `solved`。
- `Sudoku.applyRevealHint(target: CellReference, digit: number, eliminations: Elimination[], options?: { autoRemoveNotes?: boolean }): void`：
  - 一次快照。
  - 填入 `digit`；`autoRemoveNotes` 依選項，與 `fill` 一致。
  - 對每個 elimination，若該格玩家筆記有那個數字就移除。
- `revealCellWithTechnique()` 刪除。`RevealOutcome` 只留給隨機揭示：`{ cell; value; fallback: true }`，`step` 欄位移除；隨機揭示沿用 `revealRandomCell()`。

- [ ] **Step 1: 寫失敗測試**（`Sudoku.test.ts`，用 `spyGeneratePuzzle()` 或直接 `restore` 已知盤面）
  - `planRevealHint should point out the first wrong entry in reading order`：填錯兩格（例如第 5 列與第 2 列各一），斷言 `kind === "wrongEntry"`，`cell` 是第 2 列那格；盤面與筆記都沒有改變。
  - `planRevealHint should return the steps to the next assignment when there are no errors`：斷言 `kind === "steps"`，最後一步的 assignment 等於 `target`／`digit`，`digit === answer[target.row][target.column]`；`candidatesBefore` 在已填格是 `[]`。
  - `planRevealHint should ignore the player's notes`：玩家筆記全刪或亂寫，回傳的步驟與筆記無關（與沒有筆記時相同）。
  - `applyRevealHint should fill the target and only delete eliminated candidates from notes`：某格筆記有被刪的數字、另一格筆記沒有，斷言前者被刪、後者不變、沒有任何筆記被新增。
  - `applyRevealHint should honour autoRemoveNotes`：開啟時同行、列、宮的 `digit` 筆記被移除；關閉時不移除。
  - `undo after applyRevealHint should restore the board and notes`。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/domain/game/Sudoku.test.ts`。Expected：FAIL。
- [ ] **Step 3:** 實作，刪除 `revealCellWithTechnique` 及其測試。presentation 端暫時的編譯錯誤在同一個 commit 內修好：`useHintActions` 先改成 `revealCell` 只走隨機揭示，Task 5 再接上提示模式。
- [ ] **Step 4:** 全部測試、lint、tsc。Expected：PASS。
- [ ] **Step 5:** Commit：`✨ feat: split reveal hint into a read-only plan and an atomic apply`

### Task 4: 每種技巧的白話說明

**Files:**
- Create: `src/presentation/pages/game/hint-mode/useHintExplanation.ts`
- Modify: `src/presentation/i18n/messages/en.ts`、`zh-Hant.ts`（`hintMode.explanation.*`）
- Test: `src/__tests__/presentation/pages/game/hint-mode/useHintExplanation.test.ts`

**Interfaces:**
- Produces: `useHintExplanation(): (step: SolveStep) => string`，回傳目前語言的完整說明句。
  - 訊息 key 以 `TechniqueId` 為鍵，型別用 `satisfies Record<TechniqueId, string>` 保證 19 種都有。
  - 參數由 step 的 `focus`／`supporters`／`scopes`／`eliminations`／`assignments`／`chainLinks` 組成：格子位置、數字、列／欄／宮。
  - 宮的寫法：zh「第 n 宮」，en "box n"，n 為 1–9，由左上往右下編號。

- [ ] **Step 1: 寫失敗測試**
  - 對 19 種技巧各準備一個最小 `SolveStep` fixture（手寫物件即可）。斷言 en 與 zh 都回傳非空字串、包含 step 中至少一個格子位置（zh 用「第 r 列第 c 欄」格式）、且彼此不相同（不能共用通用句）。
  - `nakedSingle` 的 zh 斷言完整句，作為範本：`第 {r} 列第 {c} 欄只剩 {d} 這個候選數，所以填入 {d}。`
- [ ] **Step 2:** 跑測試。Expected：FAIL。
- [ ] **Step 3:** 實作。說明要點出「哪些格子、為什麼、所以刪去或填入什麼」，可參考 `git show spike/hint-mode:src/presentation/pages/game/hint-mode/useHintExplanation.ts`，但 19 種都要寫專屬句。
- [ ] **Step 4:** 全部測試、lint、tsc。Expected：PASS。
- [ ] **Step 5:** Commit：`✨ feat: explain every solver technique in plain words`

### Task 5: 提示模式（狀態機、面板、盤面整合）

**Files:**
- Create: `src/presentation/pages/game/hint-mode/useHintMode.ts`、`HintPanel.vue`、`HintLinkOverlay.vue`（或重用 `ChainOverlay`）
- Modify: `src/presentation/pages/game/Game.vue`、`components/GameHeader.vue`、`components/Cell.vue` 或 `BoardCell.vue`（需要時加顯示 prop）、`useHintActions.ts`、`useGameInteraction.ts`（鎖輸入）、兩個訊息檔（`hintMode.*`）
- Test: `src/__tests__/presentation/pages/game/hint-mode/useHintMode.test.ts`、`src/__tests__/presentation/Game.test.ts`

**Interfaces:**
- Consumes: `planRevealHint`、`applyRevealHint`（Task 3），`useHintExplanation`（Task 4）。
- Produces: `useHintMode(sudoku: Sudoku, options: { autoRemoveNotes: () => boolean; onApplied: (cell: CellReference) => void; record: (action: "hint" | "erase", cell: CellReference, value: number) => void })`，回傳：
  - `active: Ref<boolean>`、`phase: Ref<"wrongEntry" | "steps" | null>`
  - `start(plan: RevealHintPlan): void`
  - `stepIndex`、`isLastStep`、`next()`、`previous()`
  - `cancel()`（清除提示模式）
  - `clearWrongEntry()`（erase 那格、紀錄 `erase`、結束）
  - `fill()`（`applyRevealHint`、紀錄 `hint`、呼叫 `onApplied`、結束）
  - `cellView(row, column): { highlight: "none" | "scope" | "pattern" | "answer" | "wrong"; candidates: number[] | null; eliminated: number[]; emphasized: number[] }`
    - `candidates` 為 `null` 時顯示玩家原本的內容；非 null 時以算出的候選數取代筆記。

- [ ] **Step 1: 寫失敗測試**（`useHintMode.test.ts`，直接用 `Sudoku` 實例）
  - wrongEntry：`clearWrongEntry` 只清那格填寫、筆記保留、紀錄 `erase`；`cancel` 後盤面不變。
  - steps：
    - `isLastStep` 只在最後一步為真，`next`／`previous` 有邊界；
    - `cellView` 在步驟格回傳算出的候選數、被刪的數字在 `eliminated`、作用範圍是 `scope`、答案格在最後一步是 `answer`；
    - `fill` 後盤面等於 `applyRevealHint` 的結果、紀錄 `hint`、`active` 為 false；
    - `cancel` 後盤面不變。
- [ ] **Step 2: 寫失敗測試**（`Game.test.ts`，用既有的掛載與 `spyGeneratePuzzle()` 模式）
  - 揭示一格（有錯格）：面板顯示 zh「第 r 列第 c 欄填錯了」，按鈕是「清除」「關閉」；提示次數已扣。
  - 揭示一格（無錯格）：主按鈕在非最後一步是「下一步」，最後一步是 `${digit} 填入答案`；按下後填入，面板消失，數字鍵回來。
  - 提示模式中點格子與數字鍵不改盤面；標頭顯示「提示模式」。
  - Review Focus 1：只剩一格時，提示填入後跳出完成視窗並送出 `game_complete`。
  - Review Focus 2：沒有任何筆記時，填入後所有空格的筆記仍為空。
  - Review Focus 3：填入後按復原回到提示前。
  - Review Focus 4：提示模式中觸發離開，例如 router 返回後在離開對話框選「儲存並離開」，提示模式結束、盤面不變，存檔裡沒有提示狀態。
- [ ] **Step 3:** 跑測試。Expected：FAIL。
- [ ] **Step 4:** 實作。
  - 面板樣式、顏色意義、連線、技巧標籤、步驟點點與 ‹ ›、底部小字，照 spike 與 spec 第 3 節。最後一步技巧標籤實心。
  - 面板放在控制列與數字鍵的位置，盤面位置不動。
  - 進入時扣提示，送 `hint_used`（`reveal_cell`）。
- [ ] **Step 5:** 全部測試、lint、tsc。Expected：PASS。
- [ ] **Step 6:** Commit：`✨ feat: step-by-step reveal hint mode on the game board`

### Task 6: 提示選單收斂與後備揭示

**Files:**
- Modify: `components/HintMenuPopup.vue`、`components/useHintMenu.ts`（`HintAction`）、`useHintActions.ts`、`src/application/analytics/AnalyticsService.ts`、兩個訊息檔（刪 `checkErrors` 相關 key）、`components/HintResultToast.vue`
- Test: `src/__tests__/presentation/HintMenuPopup.test.ts`、`src/__tests__/presentation/pages/game/useHintActions.test.ts`、`Game.test.ts`

**Interfaces:**
- Produces: `HintAction = "autoNotes" | "checkConflicts" | "revealCell" | "close"`；`hint_used.hint_type = "auto_notes" | "check_conflicts" | "reveal_cell"`。
  - `planRevealHint` 回傳 `noTechnique` 時，走 `revealRandomCell()`，toast 顯示既有的 `game.randomReveal`。
  - 回傳 `solved` 時不扣提示，選單不會走到這裡，但要防呆。

- [ ] **Step 1: 寫失敗測試**
  - 選單沒有 `[data-testid='hint-check-errors']`，只剩三個選項。
  - `noTechnique` 時（mock `planRevealHint` 回傳 `{ kind: "noTechnique" }`）會填入一格答案並顯示隨機揭示 toast。
  - analytics 對照表沒有 `check_errors`（型別保證；`useHintActions.test.ts` 的 `it.each` 拿掉那列）。
- [ ] **Step 2:** 跑測試。Expected：FAIL。
- [ ] **Step 3:** 實作，刪掉 `checkErrors` 選項與相關訊息 key、事件型別、測試列。
- [ ] **Step 4:** 全部測試、lint、tsc。Expected：PASS。
- [ ] **Step 5:** Commit：`✨ feat: fold check errors into reveal cell`

### Task 7: 填入動畫與 360px 視覺檢查

**Files:**
- Modify: `hint-mode/*`、`BoardCell.vue`（需要時）、`src/style/index.css`（需要時）

- [ ] **Step 1:** 填入的那一刻給答案格明顯但短暫的動畫，例如沿用完成閃爍或放大回彈。若用 class 控制，就加一條 class 斷言測試。
- [ ] **Step 2: 瀏覽器實測**：
  - 啟動 `npx vite --port 5199`，用 puppeteer-core 以 360×800 在 zh 與 en 下走完兩種流程，逐張截圖檢查：
    - 錯格：清除、關閉；
    - 步驟：至少一個含消去的例子，加上單步填入。
  - puppeteer-core 在 `/private/tmp/claude-501/-Users-ethan-Project-sudoku/8581f059-8ad5-412a-943e-1b0b712810ab/scratchpad/shots/node_modules`。
  - 要構造含消去的局面，可參考 spike 的 `src/presentation/pages/hint-demo/HintDemo.vue` 做法，但寫在 scratchpad 腳本裡，用 Pinia 設定盤面，不要在正式程式裡加 demo 路由。
  - 檢查項目：沒有截斷或溢出，標頭與面板不擠，候選數與筆記樣式可分辨。
- [ ] **Step 3:** 修掉發現的問題，全部測試、lint、tsc。
- [ ] **Step 4:** Commit：`✨ feat: polish the reveal hint fill moment and layout`
