# 各風格專屬 Icon

## 意圖

App 有九個風格，但全部共用同一套 lucide 線條 Icon，只有少數風格調整線寬。8-bit 設計稿的點陣 Icon 一眼就看得出風格，owner 希望每個風格都做到這種程度：Icon 本身就帶有風格的感覺，不只是粗細不同。

這是純視覺的變更，功能、版面結構和文案都不變。

**設計來源：** 風格研究畫布 https://claude.ai/artifact/72nsZrRhPbd5nfnKt8UnWE 的「Icon 全部」畫板（`IconsAll.dc.html`）。原始繪製程式在 `feature/style-research` 分支（worktree `.worktrees/style-research`）的 `docs/style-research/generator/`：`iconset.py`、`iconstyles.py`、`iconinventory.py`、`lucide_icons.json`。

## 目標

- 九個風格各自顯示畫板上那一欄的 43 個 Icon，涵蓋全部頁面、對話框和提示面板。
- 新增風格時，少了 Icon 會是型別錯誤，和 `STYLE_MOMENTS` 等既有登記方式一樣。
- 切換風格立即生效；冷啟動時不會先閃過另一套 Icon。

## 不做的事

- 不合併或刪減 Icon：43 個全留（owner 決定）。
- 設定和外觀頁的分組標題保留 Icon，不改成只有文字（owner 決定）。
- 不改 App 圖示（launcher icon）、`StyleIcon`、品牌圖示。
- 不改各風格的 moments 動畫、盤面框線和 Loader 裡的 SVG。
- 不改變 Icon 的擺放位置，也不新增功能。8-bit 的尺寸對齊（見下）是唯一的尺寸變動。

## 不可以發生的事

- 紙本和黑板的 Icon 歪斜潦草。owner 明確要求形狀端正，只讓線條略有起伏；畫板上的程度就是標準。
- 危險操作的 Icon 失去危險色，或實心按鈕上的 Icon 看不清楚。
- Icon 換成專屬畫法後反而比現在難認，或整體變得刺眼。
- Minimal 的外觀有任何改變。
- 因為 Icon 而用到只有部分瀏覽器引擎支援的效果，導致三個引擎看起來不一樣。

## Owner 已確認的設計

以畫板為準，下列為摘要。

| 風格 | 畫法 | 換了物件 |
|---|---|---|
| minimal | lucide 原樣 | 無 |
| tactile | 實心粗短，帶厚度（下方半透明陰影）和白色反光 | 無 |
| paper | 鋼筆手繪，形狀端正，線條略有起伏，主線重描一小段 | 無 |
| pixel | 8×8 點陣 | 無 |
| cyber | 只有折線和切角，疊一層錯位的青色 | 擦除 → 刪除鍵 |
| ink | 毛筆筆觸，重下輕收 | 筆記和填入 → 毛筆；提示 → 燈籠 |
| chalkboard | 粗粉筆線，形狀端正，靠斷點和粉塵帶出質感 | 筆記和填入 → 粉筆；擦除 → 板擦 |
| blueprint | 細製圖線、直角線頭；中心線只放在圖形外面或空隙裡，20px 以下不畫 | 筆記和填入 → 製圖筆 |
| aurora | 圓潤漸層線，淡玻璃填色和一道殘光 | 無 |

8-bit 的齒輪、遊戲手把和語言（「文 A」）是 owner 看過後定案的版本。

## 架構

### 呼叫端

新增 `src/presentation/components/icon/`，匯出和 lucide 同名的 43 個元件，props 維持 `size`，`class` 等屬性照常傳遞。呼叫端只把 import 從 `lucide-vue-next` 換成 `@/presentation/components/icon`，模板不動，現有的動態 `:is="icon"` 也照常運作。

每個元件依目前風格的 Icon 組渲染：

- minimal、或該風格的 Icon 組尚未載入時：渲染 lucide 元件。
- 其他情況：渲染 `<svg>`，內容來自該風格的資料，帶 `aria-hidden="true"`，以及 `data-icon="<名稱>"`。minimal 的 lucide 也要帶同樣的 `data-icon`，skin 只認這個屬性。

ESLint 加上 `no-restricted-imports`：`src/` 裡除了 `components/icon/` 和測試，不准 import `lucide-vue-next`。

### 目前風格的來源

Icon 元件不直接讀 Pinia（兩百多個測試檔裡只有 29 個會建立 Pinia，直接讀會讓其他元件測試出錯）。由 `components/icon/` 持有一個模組層級的 reactive 狀態，預設是 minimal；`startAppearanceSync` 的 `apply` 負責通知風格變更，和字型 gate 同一個位置。

### Icon 資料

每個風格一個檔案：`src/style/styles/<id>/icons.ts`，匯出：

```ts
export interface IconSet {
    viewBox: string;                          // pixel 是 "0 0 8 8"，其餘 "0 0 24 24"
    svgAttributes?: Record<string, string>;   // 例如 pixel 的 shape-rendering="crispEdges"
    snapSize?: (size: number) => number;      // 只有 pixel 用
    drawings: Record<IconName, string>;       // <svg> 的內層標記
}
```

`IconName` 由 `components/icon/` 的名單推導，放在 `src/style/` 可 import 的框架無關位置。`STYLE_ICON_SETS: Record<StyleId, (() => Promise<IconSet>) | null>` 以動態 import 載入，minimal 是 `null`；少了風格就是型別錯誤。

內層標記用 `v-html` 渲染，沿用 `StyleIcon.vue` 的前例和 eslint 註解（資料是我們自己的靜態內容，不含使用者輸入）。

需要 id 的標記（aurora 的漸層、tactile 的 mask）在資料裡寫 `{id}` 佔位，渲染時換成 `useId()` 產生的值，每個實例各自獨立。不要用共用的全域 defs。

### 載入時機

- 每個風格的資料是獨立 chunk，只載入目前風格。總量未壓縮約 340KB、gzip 約 95KB，大部分來自 paper、ink、chalkboard，全塞進主 bundle 不划算。
- **冷啟動：** `main.ts` 在 `app.mount` 前的 `await Promise.all([...])` 一起等目前風格的 Icon 組，避免閃過 lucide。
- **切換風格：** 開始載入新的一組，載入完成才切換。載入失敗就退回 lucide，不報錯（web 版可能離線或 chunk 已失效）。

### 從繪製程式匯出資料

在 `feature/style-research` 的 generator 加一支匯出腳本，輸出各風格的 `icons.ts`；腳本留在該分支，不進 develop。匯入後資料檔就是來源，之後直接改資料檔。

匯出時要精簡路徑：手繪類現在每 0.8 單位一個點。用 1 位小數加線段簡化（例如 Ramer–Douglas–Peucker），目標是 paper、ink、chalkboard 各自 gzip 後 15KB 以下。40px 下肉眼要和畫板一致；如果兩者衝突，外觀優先，並回報實際大小。

## 各風格的注意事項

### 顏色共通規則

所有圖形都跟著 `currentColor`，因此主題色、危險色、`text-on-primary` 都會自動生效。例外只有下面明列的第二顏色。

### pixel：尺寸對齊

點陣要 8 的整數倍才銳利，`snapSize` 把請求尺寸換成：

| 請求尺寸 | 實際尺寸 |
|---|---|
| 11–18 | 16 |
| 20–24 | 24 |
| 32 | 32 |
| 36、40 | 40 |

只影響 pixel。最明顯的是統計和回顧的提示次數（11px 變 16px），要實際確認這些列沒有被撐破。裝置像素比非整數的手機（如 2.625）上，點陣會有 ±1 裝置像素的不均，這點可接受。

pixel skin 既有的 `[data-skin~="caret"]` 規則（`fill: currentColor; stroke: none`）是為了把 lucide 的 Play 填滿，換成點陣後可以拿掉填色部分，閃爍動畫保留。

### aurora：和畫板一樣的漸層（owner 選定）

一般 Icon 就是畫板上明顯的極光漸層，不跟著原本的文字色淡化。畫板是在夜空紫色主題上畫的，而 App 裡很多 Icon 原本是文字色或灰色，所以規則要明確：

**完整漸層（預設）：** 首頁方塊、Icon 方塊、提示選單、控制按鈕、設定分組標題、選項方塊（未選取），以及其他沒有列在下面的位置。

**維持單色 `currentColor`：**

- 危險與錯誤：`text-danger`、`text-error`、danger 和 gave-up 的 `icon-tile`。
- 實心底上：`text-on-primary`、選取中的選項方塊與控制按鈕。
- 次要 Icon：`text-foreground-muted`、列表箭頭、小字旁的小圖示（提示次數、筆記已隱藏）。
- 直接落在極光背景、沒有玻璃墊底的位置：標題列返回和計時。這是 skin 既有的規則（"words with no glass"），不能退步。

做法：

- 漸層寫在每個 Icon 的 `<svg>` 內，stop 用 `var(--aurora-icon-start)`、`var(--aurora-icon-middle)`、`var(--aurora-icon-end)`，並留 `stop-color="currentColor"` 當後備。殘光和玻璃填色用同一組顏色。
- skin 預設把這三個變數設為漸層色；在單色位置把三個都設成 `currentColor`（未註冊的 custom property 會留到使用時才解析成該處的文字色），不用 `color-mix`，三個引擎行為一致。
- 夜空：亮青 `#4FE3C1`、該主題的 primary、亮粉 `#FF8CC6`。晨光：`#0A6F61`、該主題的 primary、`#C2185B`（aurora 主題 primary 裡的深色）。
- Icon 對所在表面至少 3:1，漸層三個顏色都要算，每個主題和模式都檢查，並在 `paletteContrast.test.ts` 或 aurora 的測試裡固定下來。必要時可以調整漸層色，但不要回到淡色。

owner 擔心極光線條偏淡、不清楚，驗收時要特別看（見「驗收」）。

`svg.lucide-timer` 的顏色規則改用 `svg[data-icon="Timer"]`，並更新 `auroraSkin.test.ts`。

### cyber：第二顏色

錯位層的青色用 palette 的青色（`NEON.cyan` `#00F0FF`，補一個 `STYLE_OWN_TOKENS` token），不要寫死在資料裡。畫板用的 `#22E6FF` 只是近似值。

畫板把 cyber 整欄都畫成洋紅 `#FF2BD6`，這是為了看形狀，不代表實際配色。App 裡每個 Icon 維持所在位置的顏色：控制按鈕是文字色 `#E6F6FF`，首頁方塊、設定分組和選項方塊才是洋紅，次要 Icon 是灰色。不要把 Icon 統一改成洋紅。

owner 擔心整體太刺眼（見「驗收」）。如果實機上過亮，先降低青色錯位層的不透明度或位移，再考慮調主色位置；主題色本身不改。

### chalkboard：白板模式

owner 先前定過白板的麥克筆是平滑均勻的線條，沒有斷點和粉塵。資料裡的斷點線和粉塵線各帶 class（例如 `chalk-line`、`chalk-dust`），skin 在非 `.dark` 時關掉 `stroke-dasharray` 並隱藏粉塵，黑板才顯示。

### blueprint

`svg.lucide` 的 stroke 規則（skin 和 `blueprintSkin.test.ts`）改為資料本身就帶線寬與線頭，規則和對應測試移除。aurora 的 `svg.lucide` 同理。

中心線標記只有 22px 以上才畫，資料裡帶 class（例如 `blueprint-mark`）。元件依 `size` 決定：`size <= 20` 時不輸出這條路徑，或用 `data-size` 讓 skin 隱藏，由實作決定。

### tactile

反光是固定白色半透明，深色模式下偏淡沒關係。三個 mask（`EyeOff`、`CircleHelp`、`Timer`）用 `{id}`。

### 既有 skin 規則

下列規則會碰到 Icon，換圖後都要確認效果沒有壞掉，必要時微調：

- paper 的 `[data-skin~="check"] svg`：`stroke-dasharray: 24` 的描繪動畫，要符合新的勾勾路徑長度。
- cyber 和 pixel 的過關獎盃顏色，chalkboard 的獎盃顆粒 mask，tactile 和 minimal 的獎盃動畫。
- 各風格 `[data-skin~="caret"]`、`home-tile`、`icon-tile`、`group-heading`、`menu-option`、`check` 底下 `> svg` 的規則。

## 測試

依專案 TDD 流程，至少涵蓋：

- 每個 `StyleId` 都有 43 個 drawing（型別加一條執行期測試）。
- 切換風格時 Icon 跟著切換；Icon 組尚未載入或載入失敗時顯示 lucide。
- `size`、`class` 正確傳遞；帶 `aria-hidden` 和 `data-icon`；同一 Icon 的兩個實例 id 不重複。
- pixel 的 `snapSize` 對照表。
- 資料的安全網：不含 `filter`、`<foreignObject>`、`<image>`、CSS 動畫；顏色只能是 `currentColor`、`#fff` 反光、`#000` 和 `#fff` 的 mask 內容，或明列的 token。
- aurora 對比（見上）。
- `OptionTile.test.ts`、`StepTag.test.ts` 直接傳 lucide 元件當 prop，兩者不需要改。

## 施作順序

遵守 Tidy First，結構性和行為性分開 commit：

1. **結構性：** 建立 `components/icon/`，全部回傳 lucide，換掉所有 import，加 ESLint 規則。前後全部測試綠，畫面完全不變。
2. **機制：** Icon 組載入、切換、退回，先以一個風格驗證（建議 pixel，最小）。
3. **逐風格：** 每個風格一個 commit，資料加上該風格的 skin 調整。
4. **收尾：** 更新 `CLAUDE.md`（登記新風格的步驟、`data-icon` hook、`IconSet`）；在 `UNRELEASED_CHANGES` 加一行（兩種語言，不列風格數量）；刪除此規格。

在 `feature/style-icons` 分支上做，使用主目錄，不另開 worktree（owner 決定）。合併回 `develop` 要等 owner 同意。

## 驗收

- 每個風格的每個模式都實際走過：首頁、遊戲（含提示選單與提示面板）、過關、統計、回顧、解題演示、設定、外觀頁、各對話框。
- **這些模式畫板上沒有畫過：** tactile 深色、pixel 紅白機、chalkboard 白板、blueprint 製圖紙、aurora 晨光。全部風格做完後一次截圖給 owner 確認，不逐風格停等；要修的部分以後續 commit 處理。施作順序第 4 步（收尾）等 owner 確認後才做。
- **owner 特別提出要確認的三點**，用實際頁面在手機尺寸上看，和目前的 lucide 版本並排比較：
  - **aurora 是否太淡、不清楚：** 尤其是玻璃卡片上和晨光模式。
  - **tactile 和 pixel 實心之後是否變得不清楚：** 內部細節（格線、挖空的字、孔洞）在 14～22px 還認不認得出來，實心按鈕上和列表裡是否太重。
  - **cyber 是否太刺眼：** 洋紅加青色錯位層大面積出現的頁面，例如首頁和設定。
- Chromium、WebKit、Firefox 都看過，外觀一致。
- Android 用 `sudoku-app` 流程實機確認。
- 記錄建置後的體積變化；下次發版前依慣例比對 AAB 大小。

## 留給實作者決定

- `components/icon/` 的內部檔案切分與工廠函式寫法。
- `IconName` 名單的確切位置。
- 路徑簡化的演算法和容差。
- blueprint 標記依尺寸隱藏的做法。
- aurora 單色位置的 CSS 寫法，以及為了通過對比而微調的漸層色。
- 各 skin 規則的微調方式。

## 未經 owner 確認的判斷

以下是撰寫規格時的技術判斷，owner 可以推翻：

- 每個風格的資料做成獨立 chunk（主 bundle 目前 680KB、gzip 215KB，全部併入約增加兩成以上；Android 的 AAB 大小不受影響）。
- 沒畫過的模式等全部做完後一次確認，不逐風格停等。
- aurora 單色位置的清單（漸層本身是 owner 選定的）。
- chalkboard 白板模式拿掉斷點和粉塵。
- pixel 的尺寸對照表。
- 繪製程式留在風格研究分支，資料檔進 develop 後就是來源。
