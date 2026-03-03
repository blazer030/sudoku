# Sudoku TDD 實作計畫

> **TDD Commit 規則**：每次測試從 RED 變 GREEN 就立即 commit，不要等整個功能完成才 commit。

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

- [x] **測試**：`isValidInColumn` — 空白列中放置數字應返回 true
- [x] **測試**：`isValidInColumn` — 列中已有相同數字應返回 false

### 2.3 Board 驗證 — 3x3 宮規則

- [x] **測試**：`isValidInBox` — 空白宮中放置數字應返回 true
- [x] **測試**：`isValidInBox` — 宮中已有相同數字應返回 false
- [x] **測試**：`isValidInBox` — 正確計算不同位置所屬的宮

### 2.4 Board 驗證 — 整合函數

- [x] **測試**：`isValidPlacement(board, row, col, num)` — 行列宮皆合法時返回 true
- [x] **測試**：`isValidPlacement` — 任一規則違反時返回 false

### 2.5 Solver — Backtracking 解法

> `src/__tests__/domain/SudokuSolver.test.ts` + `src/domain/SudokuSolver.ts`

- [x] **測試**：`solve` — 解一個只差一格的 board 應正確填入
- [x] **測試**：`solve` — 解一個差少量格子的 board 應回傳完整解
- [x] **測試**：`solve` — 解一個標準難度的 puzzle 應回傳完整合法 board
- [x] **測試**：`solve` — 無解的 board 應回傳 null
- [x] **測試**：`solve` — 解出的 board 每行每列每宮都包含 1-9

### 2.6 Generator — 完整 Board 生成

> `src/__tests__/domain/SudokuGenerator.test.ts` + `src/domain/SudokuGenerator.ts`

- [x] **測試**：`generateFullBoard` — 產生的 board 是 9x9 且滿足所有數獨規則
- [x] **測試**：`generateFullBoard` — 多次呼叫產生不同的 board

### 2.7 Generator — 挖空產生謎題

- [x] **測試**：`generatePuzzle(clueCount)` — 非零格子數量等於 clueCount
- [ ] **測試**：`generatePuzzle` — 回傳的 board 只有一個合法解（暫時跳過）
- [x] **測試**：`generatePuzzle` — 保留的格子值與完整 board 一致

### 2.8 難度等級

- [x] **測試**：`generatePuzzle('easy')` — easy 保留 36-45 個提示
- [x] **測試**：`generatePuzzle('medium')` — medium 保留 27-35 個提示
- [x] **測試**：`generatePuzzle('hard')` — hard 保留 22-26 個提示

### 2.9 整合到 Sudoku class

- [x] **測試**：`Sudoku.generate()` — 每次生成不同的 puzzle
- [x] **測試**：`Sudoku.generate('easy')` — 回傳對應難度的 PuzzleCell[][]
- [x] **測試**：`Sudoku.check(row, col, value)` — 對生成的 puzzle 驗證答案正確性
- [x] **重構**：移除硬編碼資料

### 2.10 衝突偵測

> `src/__tests__/domain/Sudoku.test.ts` + `src/domain/ConflictDetector.ts`（透過 Sudoku 整合測試）

- [x] **測試**：`findConflicts(row, column, value)` — 無衝突時回傳空陣列
- [x] **測試**：`findConflicts` — 行衝突時回傳衝突格子座標
- [x] **測試**：`findConflicts` — 列衝突時回傳衝突格子座標
- [x] **測試**：`findConflicts` — 宮衝突時回傳衝突格子座標
- [x] **測試**：`findConflicts` — 多重衝突時回傳所有衝突格子

### 2.11 遊戲完成偵測

- [x] **測試**：`isCompleted()` — 所有格子正確填入時回傳 true
- [x] **測試**：`isCompleted` — 有空格時回傳 false
- [x] **測試**：`isCompleted` — 有錯誤填入時回傳 false

---

## Phase 2.5: React → Vue 遷移（結構性變更）

> Domain 層完全不動。只替換 UI 框架和工具鏈。
> 遷移完成後確認所有 domain 測試通過、lint 零警告、build 成功。

### 2.5.1 套件替換

- [x] 移除 React 相關套件：`react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `react-router`, `react-icons`, `@radix-ui/react-slot`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- [x] 安裝 Vue 相關套件：`vue`, `@vitejs/plugin-vue`, `vue-router`, `@vue/test-utils`, `eslint-plugin-vue`, `vue-tsc`

### 2.5.2 設定檔更新

- [x] `vite.config.ts` — `@vitejs/plugin-react` → `@vitejs/plugin-vue`
- [x] `tsconfig.json` — `jsx: "react-jsx"` → 移除，加入 Vue 編譯器選項
- [x] `eslint.config.js` — 移除 react 插件，加入 `eslint-plugin-vue`
- [x] `index.html` — `main.tsx` → `main.ts`
- [x] `test-setup.ts` — 移除 `@testing-library/jest-dom`

### 2.5.3 UI 層重寫

- [x] `src/main.tsx` → `src/main.ts`（`createApp` + `use(router)`）
- [x] `src/routerConfig.tsx` → `src/router.ts`（`vue-router` 格式）
- [x] `src/presentation/App.tsx` → `src/presentation/App.vue`
- [x] `src/presentation/pages/home/Home.tsx` → `src/presentation/pages/home/Home.vue`
- [x] `src/presentation/pages/game/Game.tsx` → `src/presentation/pages/game/Game.vue`
- [x] `src/presentation/components/ui/button/Button.vue`（簡化，不需 Radix Slot）
- [x] 刪除 `src/presentation/components/icon/Icon.tsx`（之後按需新增）
- [x] 刪除 `src/presentation/pages/game/gameReducer.ts`
- [x] 刪除 `src/__tests__/presentation/gameReducer.test.ts`
- [x] `src/presentation/components/ui/lib/utils.ts` — 保留（純工具函數）
- [x] `src/presentation/components/ui/button/variants.tsx` → `.ts`（純 JS，不含 JSX）

### 2.5.4 驗證

- [x] `npm test` — 所有 domain 測試通過（33 個）
- [x] `npm run lint` — 零警告
- [x] `npm run build` — 無錯誤
- [ ] `npm run start` — 手動確認頁面可正常顯示

---

## Phase 3: Game Interaction（TDD 行為變更）

> 直接對 Game.vue 元件做測試（Vue Test Utils），不需要額外的 composable 層。
> `reactive(new Sudoku())` 讓 Vue 直接追蹤 class 狀態，UI 狀態用 `ref()` 管理。
> 如果元件變太複雜，再於 refactor 階段抽 composable。

### 3.1 Game 元件 — 基礎渲染

> `src/__tests__/presentation/Game.test.ts` + `src/presentation/pages/game/Game.vue`

- [x] **測試**：渲染 9x9 grid，所有 tip 格子顯示數字
- [x] **測試**：slot 格子初始為空

### 3.2 格子選取

- [x] **測試**：點擊格子後該格子有選取樣式
- [x] **測試**：tip 格子不能被選取
- [x] **測試**：再次點擊同一格子時取消選取

### 3.3 元件抽取（結構性變更）

- [x] **重構**：從 Game.vue 抽出 Cell 元件，接受 `puzzleCell` 和 `selected` props，處理 tip/input/notes 顯示與選取樣式
- [x] **重構**：Button 元件加 `selected` prop，處理選取樣式（用於數字按鈕）
- [x] 確認現有測試通過

### 3.4 數字輸入 — 格子優先模式（先選格子、再按數字）

- [x] **測試**：選取 slot 格子後點擊數字按鈕，格子顯示該數字
- [x] **測試**：未選取格子時點擊數字按鈕無反應
- [x] **測試**：選取 tip 格子時點擊數字按鈕無反應

### 3.5 數字輸入 — 數字優先模式（先選數字、再點格子）

- [x] **測試**：未選取格子時點擊數字按鈕，該按鈕進入選取狀態
- [x] **測試**：數字選取後點擊 slot 格子，填入該數字
- [x] **測試**：數字選取後可連續點擊多個 slot 格子，都填入該數字
- [x] **測試**：數字選取後點擊 tip 格子無反應
- [x] **測試**：再次點擊同一數字按鈕取消數字選取
- [x] **測試**：數字選取後點擊已有相同數字的格子，清空該格子
- [x] **修改**：tip 格子不能被 selected
- [x] **修改**：slot 格子加 cursor-pointer

### 3.6 衝突與完成

- [x] **測試**：輸入錯誤數字後衝突格子顯示錯誤樣式
- [x] **測試**：填滿所有格子且正確時顯示完成狀態

### 3.7 筆記模式

- [x] **測試**：點擊 Note 按鈕切換筆記模式
- [x] **測試**：筆記模式下點擊數字按鈕，格子顯示小數字筆記
- [x] **測試**：筆記模式下再次點擊已有的筆記數字，移除該筆記
- [x] **測試**：數字優先模式 + 筆記模式，點擊 slot 格子加 note 而非 input
- [x] **測試**：點擊 auto-notes 按鈕後，空白格顯示候選數字
- [x] **測試**：填入數字後，同行/列/宮空白格中的對應 note 被自動移除

### 3.8 清除與 Undo

- [x] **測試**：點擊 Erase 按鈕進入 erase mode（按鈕顯示選取樣式）
- [x] **測試**：erase mode 下點擊有輸入的 slot 格子，清除輸入
- [x] **測試**：erase mode 下點擊有筆記的 slot 格子，清除筆記
- [x] **測試**：erase mode 下點擊 clue 格子無反應
- [x] **測試**：點擊 Undo 按鈕還原上一次輸入
- [x] **測試**：點擊 Undo 按鈕還原上一次清除
- [x] **測試**：無操作歷史時點擊 Undo 無反應

### 3.9 計時器

- [x] **測試**：遊戲開始後計時器遞增
- [ ] **測試**：暫停/繼續計時（暫時跳過）
- [x] **測試**：遊戲完成後計時器停止

### 3.10 高亮系統

- [x] **測試**：選取格子時同行/列/宮背景高亮
- [x] **測試**：選取有數字的格子時相同數字高亮
- [x] ~~**測試**：衝突格子顯示錯誤樣式~~（已移除，note 輔助已足夠）

### 3.11 數字按鈕狀態

- [x] **測試**：某數字出現 9 次且全部正確時該按鈕 disabled

### 3.12 新遊戲流程

- [x] **測試**：Home 頁點擊 New Game 導航到 Game 頁
- [x] **測試**：Game 頁載入時自動初始化新 puzzle
- [x] **測試**：難度選擇 UI — 可選 Easy/Medium/Hard
### 3.13 引入 Pinia 狀態管理

- [x] 安裝 Pinia，註冊到 main.ts
- [x] **測試**：gameStore 預設 difficulty 為 null
- [x] **測試**：setDifficulty 可更新難度
- [x] **重構**：Home.vue 改用 store 傳遞 difficulty
- [x] **重構**：Game.vue 改用 store 讀取 difficulty，無 difficulty 時導回首頁

---

## Phase 4: Production Quality

### 4.1 遊戲存檔/讀檔

> 儲存用 localStorage，還原邏輯放 domain 層（Sudoku.getState / restoreState）
> GameStorage 只負責存取 plain object，不認識 domain class

#### 4.1.1 GameStorage CRUD

> `src/__tests__/application/GameStorage.test.ts` + `src/application/GameStorage.ts`

- [x] **測試**：`saveGame(state)` — 序列化並存入 localStorage
- [x] **測試**：`loadGame()` — 反序列化遊戲狀態
- [x] **測試**：`loadGame()` — 無存檔時回傳 null
- [x] **測試**：`hasSavedGame()` — 檢查是否有存檔
- [x] **測試**：`deleteSavedGame()` — 刪除存檔

#### 4.1.2 Domain 層序列化/還原

> `src/__tests__/domain/Sudoku.test.ts` + `src/domain/Sudoku.ts`

- [x] **測試**：`getState()` — generate 後回傳 `{ answer, cells: { value, input, notes }[][] }`
- [x] **測試**：`restoreState(state)` — 從 plain object 還原 puzzle，可繼續操作

#### 4.1.3 Game.vue 整合

> `src/__tests__/presentation/Game.test.ts` + `src/presentation/pages/game/Game.vue`

- [x] **測試**：自動存檔 — 離開頁面時 localStorage 有存檔資料
- [x] **測試**：Continue 流程 — 有存檔時還原棋盤狀態和計時器

#### 4.1.4 Home.vue Continue 按鈕

> `src/__tests__/presentation/Home.test.ts` + `src/presentation/pages/home/Home.vue`

- [x] **UI 測試**：有存檔時顯示 Continue 按鈕，點擊導航到 Game 頁
- [x] **行為**：New Game 點擊時清除舊存檔

---

## Phase 5: UI 更新 — 對齊設計稿

> 根據 `design/sudoku.pen` 設計稿更新 UI。
> 順序：全域樣式 → Home → Cell → Game → Complete 彈窗。

### 5.1 全域樣式 + 依賴

- [x] 安裝 `lucide-vue-next`、引入 Outfit 字體
- [x] 定義 CSS 變數（primary、background、card、border、highlight 等）
- [x] Tailwind v4 `@theme` 整合

### 5.2 Home 頁 UI

- [ ] Logo 區（green grid icon + 標題 + 副標題）
- [ ] Continue Game 按鈕（primary、play icon、時間 badge）
- [ ] 難度選擇器（三個 pill 按鈕）
- [ ] New Game 按鈕（secondary、plus icon）
- [ ] 底部導航（Settings + Statistics，暫無功能）

### 5.3 Cell 元件更新

- [ ] 對齊設計稿色系（cell-tip、highlight、highlight-strong、primary 邊框）
- [ ] 筆記模式小字排列

### 5.4 Game 頁 UI

- [ ] Header（Back + 計時器 + 難度 badge）
- [ ] Board Container（card 背景、圓角、陰影）
- [ ] Controls（icon + label 垂直排列、active 狀態）
- [ ] Number Pad（圓角 12、badge 顯示剩餘數量、selected/disabled 狀態）

### 5.5 Game Complete 彈窗

- [ ] Overlay + Modal（獎盃 icon、統計列、Back to Home 按鈕）

### 5.6 測試修正

- [ ] 確保 data-testid 不變、所有測試通過

---

## Phase 6: Production Quality

### 6.1 統計追蹤

> `src/__tests__/application/Statistics.test.ts` + `src/application/Statistics.ts`

- [ ] **測試**：`recordGameResult` — 記錄完成時間、難度、是否成功
- [ ] **測試**：`getStatistics` — 回傳各難度的完成次數、最佳時間、平均時間
- [ ] **測試**：統計資料持久化到 localforage
- [ ] **UI 測試**：統計頁面顯示各難度成績

### 6.2 深色模式

- [ ] 定義 CSS 變數系統（light/dark theme）
- [ ] 將所有硬編碼顏色替換為 CSS 變數
- [ ] **測試**：切換 dark mode 時 document 加上 `dark` class
- [ ] **測試**：dark mode 偏好持久化到 localStorage
- [ ] **測試**：首次載入時偵測系統偏好

### 6.3 動畫與轉場

- [ ] 格子選取 scale/highlight transition
- [ ] 數字輸入淡入動畫
- [ ] 錯誤格子抖動動畫
- [ ] 遊戲完成慶祝動畫
- [ ] 頁面轉場動畫

### 6.4 PWA 設定

- [ ] 安裝 `vite-plugin-pwa`，設定 service worker 和 manifest
- [ ] 設定 app icon（多尺寸）
- [ ] 設定 offline fallback
- [ ] 測試離線功能

### 6.5 最終整合與清理

- [ ] 移除未使用的依賴和代碼
- [ ] lint 零警告
- [ ] 更新 README.md
- [ ] 所有測試通過，build 無錯誤
- [ ] production build 測試
