# Sudoku TDD 實作計畫

## Phase 1: Package Upgrades（結構性變更）

> 每個步驟獨立 commit。每步完成後確認 `npm test`、`npm run lint`、`npm run build` 皆通過。

### 1.1 TypeScript 升級

- [x] 升級 TypeScript 5.2 → 5.9，確認測試通過

### 1.2 ESLint 8 → 9 遷移

- [x] 移除 `vite-plugin-eslint`，從 `vite.config.ts` 移除相關設定
- [x] 升級 ESLint 8 → 9，安裝 `@eslint/js`、`typescript-eslint` v8、`eslint-plugin-react-hooks@7`、`eslint-plugin-react-refresh@0.5`
- [x] 將 `.eslintrc.cjs` 轉換為 `eslint.config.js`（flat config 格式）
- [x] 移除舊的 `eslint-plugin-react`，更新 lint script 移除 `--ext` flag
- [x] 確認 `npm run lint` 和 `npm test` 皆通過

### 1.3 React 18 → 19 升級

- [x] 升級 `react`、`react-dom`、`@types/react`、`@types/react-dom` 至 v19
- [x] 重構 Button 元件：`React.forwardRef` → ref as prop（React 19 風格）
- [x] 確認測試通過，手動驗證 UI 正常

### 1.4 React Router 6 → 7 升級

- [x] 升級 `react-router-dom` → `react-router@^7`，更新所有 import 路徑
- [x] 調整 `routerConfig.tsx` 和所有使用 router hooks 的檔案
- [x] 確認測試通過，確認路由正常運作

### 1.5 Vite 與 Plugin 升級

- [x] 升級 `@vitejs/plugin-react` 4 → 5、`jsdom` 26 → 27
- [x] 清理 `vite.config.ts`
- [x] 確認測試通過

### 1.6 Tailwind CSS 3 → 4 遷移

- [x] 安裝 `tailwindcss@^4`、`@tailwindcss/postcss`，移除 `autoprefixer`
- [x] 更新 `postcss.config.js`：替換為 `@tailwindcss/postcss`
- [x] 將 `src/style/index.scss` → `src/style/index.css`：`@tailwind` 改為 `@import "tailwindcss"`
- [x] 刪除 `tailwind.config.js`，遷移設定至 CSS `@theme` 區塊
- [x] 更新 `main.tsx` import 路徑（`.scss` → `.css`）
- [x] 移除 `tailwindcss-animate`，手動定義需要的動畫或安裝 `tw-animate-css`
- [x] 升級 `tailwind-merge` 2 → 3
- [x] 審查並修正所有 Tailwind class 相容性問題
- [x] 移除 `sass` devDependency
- [x] 確認測試通過，手動驗證 UI 樣式正確

### 1.7 其餘套件升級

- [x] 升級 `@radix-ui/react-slot`、`@testing-library/*` 到最新
- [x] 升級或移除 `lucide-react`（已在 1.3 移除）
- [x] 移除未使用的依賴（`match-sorter` 移除、`localforage` 保留）
- [x] 確認測試通過

---

## Phase 2: Core Domain Logic（TDD 行為變更）

> 每個 checkbox 是一個 Red → Green → Refactor 循環。
> 測試檔案位置：`src/__tests__/domain/`

### 2.1 Board 驗證 — 行規則

> `src/__tests__/domain/SudokuBoard.test.ts` + `src/domain/SudokuBoard.ts`

- [x] **測試**：`isValidInRow` — 空白行中放置數字應返回 true
- [x] **測試**：`isValidInRow` — 行中已有相同數字應返回 false
- [x] **測試**：`isValidInRow` — 行中有不同數字應返回 true

### 2.2 Board 驗證 — 列規則

- [ ] **測試**：`isValidInColumn` — 空白列中放置數字應返回 true
- [ ] **測試**：`isValidInColumn` — 列中已有相同數字應返回 false

### 2.3 Board 驗證 — 3x3 宮規則

- [ ] **測試**：`isValidInBox` — 空白宮中放置數字應返回 true
- [ ] **測試**：`isValidInBox` — 宮中已有相同數字應返回 false
- [ ] **測試**：`isValidInBox` — 正確計算不同位置所屬的宮

### 2.4 Board 驗證 — 整合函數

- [ ] **測試**：`isValidPlacement(board, row, col, num)` — 行列宮皆合法時返回 true
- [ ] **測試**：`isValidPlacement` — 任一規則違反時返回 false

### 2.5 Solver — Backtracking 解法

> `src/__tests__/domain/SudokuSolver.test.ts` + `src/domain/SudokuSolver.ts`

- [ ] **測試**：`solve` — 解一個只差一格的 board 應正確填入
- [ ] **測試**：`solve` — 解一個差少量格子的 board 應回傳完整解
- [ ] **測試**：`solve` — 解一個標準難度的 puzzle 應回傳完整合法 board
- [ ] **測試**：`solve` — 無解的 board 應回傳 null
- [ ] **測試**：`solve` — 解出的 board 每行每列每宮都包含 1-9

### 2.6 Generator — 完整 Board 生成

> `src/__tests__/domain/SudokuGenerator.test.ts` + `src/domain/SudokuGenerator.ts`

- [ ] **測試**：`generateFullBoard` — 產生的 board 是 9x9
- [ ] **測試**：`generateFullBoard` — 產生的 board 每格都是 1-9
- [ ] **測試**：`generateFullBoard` — 產生的 board 滿足所有數獨規則
- [ ] **測試**：`generateFullBoard` — 多次呼叫產生不同的 board

### 2.7 Generator — 挖空產生謎題

- [ ] **測試**：`generatePuzzle(clueCount)` — 非零格子數量等於 clueCount
- [ ] **測試**：`generatePuzzle` — 回傳的 board 只有一個合法解
- [ ] **測試**：`generatePuzzle` — 保留的格子值與完整 board 一致

### 2.8 難度等級

- [ ] **測試**：`generatePuzzle('easy')` — easy 保留 36-45 個提示
- [ ] **測試**：`generatePuzzle('medium')` — medium 保留 27-35 個提示
- [ ] **測試**：`generatePuzzle('hard')` — hard 保留 22-26 個提示

### 2.9 整合到 Sudoku class

- [ ] **測試**：`Sudoku.generate()` — 每次生成不同的 puzzle
- [ ] **測試**：`Sudoku.generate('easy')` — 回傳對應難度的 PuzzleCell[][]
- [ ] **測試**：`Sudoku.check(row, col, value)` — 對生成的 puzzle 驗證答案正確性
- [ ] **重構**：移除硬編碼資料

### 2.10 衝突偵測

> `src/__tests__/domain/ConflictDetector.test.ts` + `src/domain/ConflictDetector.ts`

- [ ] **測試**：`findConflicts(board, row, col, value)` — 無衝突時回傳空陣列
- [ ] **測試**：`findConflicts` — 行衝突時回傳衝突格子座標
- [ ] **測試**：`findConflicts` — 列衝突時回傳衝突格子座標
- [ ] **測試**：`findConflicts` — 宮衝突時回傳衝突格子座標
- [ ] **測試**：`findConflicts` — 多重衝突時回傳所有衝突格子

### 2.11 遊戲完成偵測

- [ ] **測試**：`isCompleted(puzzle, answer)` — 所有格子正確填入時回傳 true
- [ ] **測試**：`isCompleted` — 有空格時回傳 false
- [ ] **測試**：`isCompleted` — 有錯誤填入時回傳 false

---

## Phase 3: Game Interaction（TDD 行為變更）

> 使用 `useReducer` 管理遊戲狀態，React Testing Library 測試 UI。

### 3.1 GameState Reducer — 基礎架構

> `src/__tests__/presentation/gameReducer.test.ts` + `src/presentation/pages/game/gameReducer.ts`

- [ ] **測試**：`INIT_GAME` action — 初始化 puzzle、answer、selectedCell 為 null
- [ ] **測試**：初始狀態的 isNoteMode 為 false、isCompleted 為 false

### 3.2 格子選取

- [ ] **測試**：`SELECT_CELL` action — 設定 selectedCell 座標
- [ ] **測試**：`SELECT_CELL` — 選取 tip 格子時仍可選取
- [ ] **測試**：`SELECT_CELL` — 再次選取同一格子時取消選取

### 3.3 數字輸入

- [ ] **測試**：`INPUT_NUMBER` action — 在選取的 slot 格子中輸入數字
- [ ] **測試**：`INPUT_NUMBER` — 未選取格子時忽略
- [ ] **測試**：`INPUT_NUMBER` — 選取 tip 格子時忽略
- [ ] **測試**：`INPUT_NUMBER` — 輸入後更新衝突列表
- [ ] **測試**：`INPUT_NUMBER` — 填滿所有格子且正確時 isCompleted 為 true

### 3.4 筆記模式

- [ ] **測試**：`TOGGLE_NOTE_MODE` action — 切換 isNoteMode
- [ ] **測試**：`INPUT_NUMBER` — noteMode 為 true 時操作 notes 而非 input
- [ ] **測試**：`INPUT_NUMBER` — noteMode 為 true 時 toggle 已有的 note

### 3.5 清除與 Undo

- [ ] **測試**：`ERASE` action — 清除選取格子的 input
- [ ] **測試**：`ERASE` — 清除選取格子的 notes
- [ ] **測試**：`ERASE` — tip 格子不可清除
- [ ] **測試**：`UNDO` action — 還原上一次的 input 操作
- [ ] **測試**：`UNDO` — 還原上一次的 erase 操作
- [ ] **測試**：`UNDO` — 無歷史記錄時忽略

### 3.6 計時器

- [ ] **測試**：`TICK` action — timer 遞增 1 秒
- [ ] **測試**：`PAUSE` / `RESUME` action — 暫停/繼續計時
- [ ] **測試**：遊戲完成後 TICK 不再增加

### 3.7 UI 元件測試 — Cell 互動

> `src/__tests__/presentation/GameBoard.test.tsx`

- [ ] **測試**：渲染 9x9 grid，所有 tip 格子顯示數字
- [ ] **測試**：點擊格子觸發選取，選取格子有高亮樣式
- [ ] **測試**：點擊數字按鈕在選取的 slot 格子中填入數字
- [ ] **測試**：點擊 Note 按鈕切換筆記模式
- [ ] **測試**：點擊 Erase 按鈕清除選取格子
- [ ] **測試**：點擊 Undo 按鈕還原操作

### 3.8 高亮系統

- [ ] **測試**：選取格子時同行/列/宮背景高亮
- [ ] **測試**：選取有數字的格子時相同數字高亮
- [ ] **測試**：衝突格子顯示錯誤樣式

### 3.9 數字按鈕狀態

- [ ] **測試**：某數字出現 9 次且全部正確時該按鈕 disabled

### 3.10 新遊戲流程

- [ ] **測試**：Home 頁點擊 New Game 導航到 Game 頁
- [ ] **測試**：Game 頁載入時自動初始化新 puzzle
- [ ] **測試**：難度選擇 UI — 可選 Easy/Medium/Hard

---

## Phase 4: Production Quality

### 4.1 遊戲存檔/讀檔

> `src/__tests__/application/GameStorage.test.ts` + `src/application/GameStorage.ts`

- [ ] **測試**：`saveGame(state)` — 序列化並存入 localStorage
- [ ] **測試**：`loadGame()` — 反序列化遊戲狀態
- [ ] **測試**：`loadGame()` — 無存檔時回傳 null
- [ ] **測試**：`hasSavedGame()` — 檢查是否有存檔
- [ ] **測試**：`deleteSavedGame()` — 刪除存檔
- [ ] **測試**：自動存檔 — 每次 state 變更時自動儲存
- [ ] **UI 測試**：Home 頁有存檔時顯示 Continue 按鈕

### 4.2 統計追蹤

> `src/__tests__/application/Statistics.test.ts` + `src/application/Statistics.ts`

- [ ] **測試**：`recordGameResult` — 記錄完成時間、難度、是否成功
- [ ] **測試**：`getStatistics` — 回傳各難度的完成次數、最佳時間、平均時間
- [ ] **測試**：統計資料持久化到 localforage
- [ ] **UI 測試**：統計頁面顯示各難度成績

### 4.3 深色模式

- [ ] 定義 CSS 變數系統（light/dark theme）
- [ ] 將所有硬編碼顏色替換為 CSS 變數
- [ ] **測試**：切換 dark mode 時 document 加上 `dark` class
- [ ] **測試**：dark mode 偏好持久化到 localStorage
- [ ] **測試**：首次載入時偵測系統偏好

### 4.4 動畫與轉場

- [ ] 格子選取 scale/highlight transition
- [ ] 數字輸入淡入動畫
- [ ] 錯誤格子抖動動畫
- [ ] 遊戲完成慶祝動畫
- [ ] 頁面轉場動畫

### 4.5 視覺風格打磨（暖色柔和風格）

- [ ] 定義暖色調色盤（cream 背景、soft coral 強調、warm gray 文字）
- [ ] 棋盤樣式優化（圓角、柔和邊框、陰影）
- [ ] 按鈕和控制區樣式統一
- [ ] Google Fonts 整合（Nunito 或 Quicksand）
- [ ] 響應式微調

### 4.6 PWA 設定

- [ ] 安裝 `vite-plugin-pwa`，設定 service worker 和 manifest
- [ ] 設定 app icon（多尺寸）
- [ ] 設定 offline fallback
- [ ] 測試離線功能

### 4.7 最終整合與清理

- [ ] 移除未使用的依賴和代碼
- [ ] lint 零警告
- [ ] 更新 README.md
- [ ] 所有測試通過，build 無錯誤
- [ ] production build 測試
