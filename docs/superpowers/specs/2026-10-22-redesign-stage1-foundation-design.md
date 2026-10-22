# 重新設計 第 1 階段：基礎（顏色、深淺色、風格系統、極簡動態）

總體設計：`docs/superpowers/specs/2026-10-22-redesign-overview-design.md`。本文件只寫第 1 階段。

## 目的

後面所有階段都要能放心使用顏色、深淺色和風格，不用再管寫死的顏色或對比問題。這個階段要做到四件事：

- 建立一套以 token 表達的顏色與材質。
- 讓深色模式能用。
- 建立「風格」的骨架。
- 把預設風格「極簡動態」的觸控回饋套到現有元件上。

## 目標

- 所有介面顏色都來自 token，不再有寫死的色值或 `bg-white`、`text-white`。巡檢 15 提到的淺橘底 `#FFF3E0`、Logo 和數字鍵小圓標的 `bg-white`、按鈕上的 `text-white`、陰影裡寫死的顏色，都要處理。
- 深色模式：設定值為「跟隨系統／淺色／深色」，即時切換；跟隨系統時，系統一變就跟著變。
- 風格骨架：設定裡有「風格」值，目前只有 `minimal`（極簡動態）。每種風格有自己的主題色清單；極簡動態沿用現有 6 色與 id。
- 對比：每個風格、每個主題色、淺深兩種模式下，文字與背景的對比都符合 WCAG AA（一般文字 4.5:1、大字與圖示 3:1），用自動測試把關。
- 極簡動態的觸控回饋：
  - 按鈕、數字鍵、分段選擇、盤面格子在按下時有彈性縮放回饋，放開時彈回。數字鍵放開有小彈跳。
  - 分段選擇（難度、語言）的選取指示會滑動。
  - 不依賴 hover。

## 非目標

- 不改版面與功能。首頁、設定頁的重新配置在第 3 階段，遊戲畫面的巡檢項目在第 2 階段。
- 不做實體方塊與紙本筆記兩種風格（第 6 階段）。
- 設定頁裡的「風格選擇」介面要等第 3 階段；這階段只有一種風格，不需要選擇器。

## 反目標

- 某個主題色或深色模式下，有文字、圖示、筆記、盤面標示看不清楚。
- 深色模式下還殘留白底或淺色區塊，例如對話框、小圓標、Logo、Toast、提示面板。
- 動畫讓操作變慢或延遲輸入。動畫只能是回饋，不可以等動畫結束才生效。
- 有開「減少動態效果」的使用者，仍看到彈跳或滑動。

## 設計

### 1. 設定與即時套用

- `Settings` 新增兩個欄位：
  - `appearance: "system" | "light" | "dark"`，預設 `"system"`；
  - `style: "minimal"`，預設 `"minimal"`。
  - 舊設定讀進來時補上預設值；不認得的值退回預設，比照 `language` 的做法。
- 有效的深淺色由 `appearance` 與系統的 `prefers-color-scheme` 決定，寫到 `<html>`：`class="dark"`，以及 `data-style="minimal"`、既有的 `data-color-theme`。
- 系統深淺色改變時（`matchMedia` change），設定為 `system` 才跟著變，做法比照 `localeSync`。
- 瀏覽器的 `theme-color` meta、Android 系統列顏色也跟著深淺色走 ⚙︎。
  - Android 若需要額外外掛（例如 `@capacitor/status-bar`），由實作計畫決定；做不到時至少確保深色模式下系統列文字看得到。

### 2. Token 架構 ⚙︎

- 兩層：
  - **語意 token**：在 Tailwind `@theme` 裡，例如 `--color-background`、`--color-card`、`--color-foreground`、`--color-primary`、`--color-on-primary`、`--color-cell-clue`、`--color-highlight`、`--color-error-surface`，以及陰影。
  - **風格 × 主題色 × 深淺色的色值表**：用 CSS 變數，選擇器例如 `[data-style="minimal"][data-color-theme="blue"].dark`。
- 新增 `--color-on-primary`（主色上的文字與圖示色），取代所有 `text-white`。不同主題色可以不同，以通過對比為準。
- 現有 6 個主題色各補一組深色版：背景、卡片、文字、邊框、主色、主色淺底、高亮、錯誤底等。
- 色值表集中在一個檔案，或每種風格一個檔案，方便第 6 階段新增風格。
- 現有的 `PwaThemeUpdater` 與 `themeConfig.ts` 改成讀同一份主題資料，不要兩處各寫一份色值。

### 3. 對比自動測試

新增一個測試，讀取色值表（從 TypeScript 主題資料或解析 CSS），對每個「風格 × 主題色 × 深淺色」計算這些組合的 WCAG 對比，低於門檻就失敗：

- 文字對背景、文字對卡片；
- 次要文字與淡色文字對卡片；
- `on-primary` 對主色；
- 筆記色對格子底色；
- 錯誤與強調色對背景。

門檻：一般文字 4.5:1；大字（≥ 18.66px 粗體或 ≥ 24px）與圖示 3:1。

### 4. 極簡動態的觸控回饋 ⚙︎

- 共用的按壓回饋，例如一個 Tailwind 工具類或小型 composable：
  - pointerdown 時縮到約 0.96；放開時用彈性曲線回到 1，約 180–250ms。
  - 輸入在 pointerdown／click 當下就生效，動畫不阻擋輸入。
- 套用範圍：
  - 首頁按鈕、遊戲控制列、數字鍵（放開時小彈跳）、提示選單選項、提示面板按鈕、對話框按鈕；
  - 分段選擇：難度、語言；選取指示滑動。
  - 盤面格子只做很輕的回饋，不能干擾長按與快速輸入。
- `prefers-reduced-motion: reduce` 時關閉縮放、彈跳與滑動，只保留顏色變化。

### 5. 暫時的深淺色切換入口 ⚙︎

第 3 階段才重做設定頁。這個階段先在現有設定頁的「外觀」區塊加一個分段選擇：跟隨系統／淺色／深色，方便驗證與測試。第 3 階段會換成新設計。

## 測試

- 設定：
  - 新欄位的預設值；舊設定補值；不認得的值退回預設。
  - 切換後 `<html>` 的 class 與 data 屬性立即更新。
  - `system` 時跟著 `matchMedia` 變化；手動選擇時忽略系統變化。
- 對比測試：見第 3 節，涵蓋所有組合。
- 寫死顏色檢查：一個測試或 lint 規則，掃描 `src/presentation` 與 `src/style`，不允許出現 `bg-white`、`text-white`、`#` 開頭的色值。主題資料檔與 token 定義檔除外。
- 觸控回饋：
  - 有回饋的元件在 pointerdown 時加上按壓狀態；
  - reduced-motion 時不加動畫類別（jsdom 用 matchMedia mock）。
- 瀏覽器實測：360×780，6 個主題色 × 淺深 × 首頁、遊戲（含提示模式、提示選單）、統計、設定、解題演示、對話框，逐張截圖檢查沒有殘留淺色區塊、文字看得清楚。

## 實作層面的決定 ⚙︎（審閱者提問後補上）

1. **色值的唯一來源是 TypeScript**：
   - 新增主題資料檔，例如 `src/theme/palettes.ts`，內容是每個風格、每個主題色、淺深兩種模式的完整 token 值。
   - 用一個產生腳本把它寫成 `src/style/themes.generated.css`，其中是 `[data-style][data-color-theme]` 加上 `.dark` 的選擇器。
   - 加一條測試，確認產生的 CSS 檔與腳本輸出一致，避免兩邊不同步。
   - 對比測試、`PwaThemeUpdater`、`themeConfig.ts` 都直接讀這個 TS 檔。
2. **寫死顏色檢查的範圍**：
   - 掃描 `src/presentation` 的 `.vue`、`.ts`，以及 `src/style` 裡產生檔以外的 `.css`。
   - 不允許出現：`#` 色值、`rgb()`、`rgba()`、`hsl()`、`bg-white`、`text-white`、`bg-black`、`text-black`、Tailwind 內建色盤類別（例如 `bg-gray-100`、`text-red-500`）。
   - 例外：`src/theme/` 與產生的 CSS 檔。
   - SVG 改用 `currentColor` 或 token。
   - 陰影色改用 token，例如 `--color-shadow`；需要透明度時用 `color-mix` 搭配 token。
3. **系統列與 theme-color**：
   - 淺色維持現狀，用主題主色；深色改用深色背景 token。只有一個 `theme-color` meta，執行時更新，所以手動選擇也會生效。
   - Android 可以在這個分支加入 `@capacitor/status-bar`，用它設定系統列顏色和圖示深淺。既有的 `npm run android:*` 腳本已經包含同步，不影響發版流程。
   - PWA manifest 與啟動畫面的深色版不在這階段範圍。
4. **避免載入時閃一下淺色**：在 `index.html` 加一段很小的內嵌腳本，在畫面繪製前讀取 `localStorage` 的 `sudoku-settings.appearance` 與系統偏好，先套上 `dark` class。內嵌腳本與 `SettingsStorage` 的讀法會重複，用註解互相指明。
5. **按壓回饋**：
   - 做成一個共用的指令或 composable：pointerdown 時加上按壓狀態，放開或取消時移除。不用 `:active`，它在觸控裝置上不穩定。
   - 新增共用的 `SegmentedControl` 元件，取代難度與語言兩處各自的實作；目前只有這兩處，第 3 階段的新設定頁也會用它。
   - 盤面格子只做顏色回饋，不做縮放。
6. **既有的 hover 變體**：保留，只當精細游標（滑鼠）裝置的加分效果；不再新增依賴 hover 的設計。
7. **設定沒有版本號**：新欄位比照 `language` 用預設值合併，不需要升版或寫遷移。

## 交給實作者決定

- token 的實際命名與分組。
- 各主題色深色版的實際色值，須通過對比測試，並在截圖中看起來協調。
- 按壓回饋用 CSS 還是 composable 實作。
- Android 系統列的處理方式。
