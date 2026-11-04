# 各風格專屬 Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 九個風格各顯示自己畫法的 43 個 Icon，呼叫端的模板不變。

**Architecture:** `components/icon/` 匯出和 lucide 同名的元件；每個元件依模組層級的「目前 Icon 組」渲染 lucide 或該風格的 SVG。每個風格的資料是獨立 chunk（`src/style/styles/<id>/icons.ts`），由 `feature/style-research` 的繪製程式匯出一次後就是來源。

**Tech Stack:** Vue 3.5（`useId`）、TypeScript、Vitest、lucide-vue-next 0.576、Python 3（只有匯出腳本，留在研究分支）。

**Spec:** `docs/superpowers/specs/2026-11-04-style-icons-design.md`

## Global Constraints

- 分支 `feature/style-icons`，主目錄，不開 worktree；合併要等 owner 同意，不 push。
- 結構性和行為性分開 commit；每個 commit 全部測試綠、`npm run lint` 無警告。commit 訊息英文、Conventional Commits 加 emoji，不加產生標記。
- Named exports only；`<script setup>`；4 空格縮排；不縮寫識別字（row/column，不用 i/idx/ctx）。
- 43 個全留；分組標題保留 Icon；Minimal 外觀零變動。
- 圖形只用 `currentColor`，例外只有明列的 token 和 tactile 的白色反光。資料不含 `filter`、`<foreignObject>`、`<image>`、動畫。
- 紙本和黑板形狀端正，以 `IconsAll.dc.html` 的程度為準。
- 不用只有部分引擎支援的效果；aurora 的漸層不用 `color-mix`。
- App 裡的 Icon 維持所在位置的顏色，不把整個風格統一成畫板上的單色。

## Review Focus

1. 快速連續切換風格、舊的 chunk 較晚載完：畫面要停在最後選的風格，不被舊結果蓋掉（Task 2 測試）。
2. chunk 載入失敗（web 離線或 chunk 已失效）：App 照常掛載並顯示 lucide，之後仍能切到其他風格（Task 2 測試）。
3. 同一個 Icon 同時出現多次，其中一個在隱藏的元素裡：mask 和漸層的 id 各自獨立，不會引用到隱藏的那個（Task 2 測試）。
4. 不在對照表裡的尺寸（未傳 `size` 的預設 24、12、19、100）傳給 pixel：仍是 8 的整數倍，不會回傳 0 或非倍數（Task 3 測試）。
5. 只切深淺色、不切風格：chalkboard 的斷點和粉塵跟著開關，aurora 的漸層顏色跟著變，不需要重新載入 Icon 組（Task 8、Task 10 測試）。

---

### Task 1: 結構性：所有 Icon 改走 `components/icon/`

畫面不變。先做這一步，之後每個風格都不用再碰呼叫端。

**Files:**
- Create: `src/style/iconSet.ts`
- Create: `src/presentation/components/icon/IconGlyph.vue`
- Create: `src/presentation/components/icon/index.ts`
- Modify: 22 個 import `lucide-vue-next` 的檔案（`grep -rl lucide-vue-next src | grep -v __tests__`）
- Modify: `eslint.config.*`
- Test: `src/__tests__/presentation/components/icon/icon.test.ts`

**Interfaces:**
- Produces: `src/style/iconSet.ts` 匯出 `ICON_NAMES`（43 個 lucide 名稱的 `as const` 陣列）、`type IconName`、`interface IconSet`：
  ```ts
  export interface IconSet {
      viewBox: string;
      svgAttributes?: Readonly<Record<string, string>>;
      /** 每個實例都放進 <svg> 開頭的標記，例如 aurora 的漸層 */
      defs?: string;
      snapSize?: (size: number) => number;
      drawings: Readonly<Record<IconName, string>>;
  }
  ```
- Produces: `index.ts` 匯出 43 個同名元件，例如 `export const Pencil = bindIcon("Pencil", LucidePencil);`。`bindIcon(name: IconName, lucide: Component): FunctionalComponent` 回傳把 `attrs` 原樣傳給 `IconGlyph` 的 functional component。`:stroke-width`（`OptionTile`、`Appearance` 有用）隨 attrs 傳遞。
- Produces: `IconGlyph.vue` props `{ name: IconName; lucide: Component; size?: number }`，`size` 預設 24。

- [ ] **Step 1: 寫失敗測試** `icon.test.ts`：`Pencil` 以 `size: 18`、`class: "text-primary"` 掛載，會渲染 `svg.lucide-pencil`、`width="18"`、帶該 class、`data-icon="Pencil"`、`aria-hidden="true"`；`index.ts` 匯出的鍵集合等於 `ICON_NAMES`，長度 43。
- [ ] **Step 2: 執行確認失敗** `npx vitest run src/__tests__/presentation/components/icon/icon.test.ts`，應因模組不存在而失敗。
- [ ] **Step 3: 實作** `iconSet.ts`、`IconGlyph.vue`（這一步只渲染 lucide，`data-icon` 傳過去）、`index.ts`。
- [ ] **Step 4: 執行確認通過。**
- [ ] **Step 5: 換掉 22 個檔案的 import**（`from "lucide-vue-next"` → `from "@/presentation/components/icon"`），模板不動。
- [ ] **Step 6: ESLint** 加 `no-restricted-imports` 擋 `lucide-vue-next`，`src/presentation/components/icon/**` 和 `src/__tests__/**` 例外。
- [ ] **Step 7: 全部驗證** `npx vitest run`、`npm run lint`、`npx vue-tsc --noEmit` 全過。
- [ ] **Step 8: Commit** `♻️ refactor: route every icon through one module, unchanged`

### Task 2: 機制：載入、切換、退回

**Files:**
- Create: `src/presentation/components/icon/activeIconSet.ts`
- Modify: `src/presentation/components/icon/IconGlyph.vue`
- Modify: `src/presentation/theme/appearanceSync.ts`、`src/main.ts:116`
- Test: `src/__tests__/presentation/components/icon/activeIconSet.test.ts`、`icon.test.ts`、`appearanceSync` 既有測試

**Interfaces:**
- Consumes: Task 1 的 `IconSet`、`IconName`。
- Produces:
  ```ts
  export type IconSetLoader = () => Promise<IconSet>;
  export const STYLE_ICON_SETS: Record<StyleId, IconSetLoader | null>;   // 這一步全部 null
  export const activeIconSet: Readonly<ShallowRef<IconSet | null>>;      // null 代表 lucide
  export const selectIconStyle: (style: StyleId) => Promise<void>;       // 永遠 resolve，不 reject
  ```
  測試用可注入 loader：`selectIconStyle` 第二參數 `loaders = STYLE_ICON_SETS`。

- [ ] **Step 1: 寫失敗測試** `activeIconSet.test.ts`，用假 loader：
  - minimal（loader 為 null）立即設為 `null`。
  - 載入中維持舊的 Icon 組，完成才換。
  - **切換競爭：** 先選 A（慢）再選 B（快），兩者都完成後 `activeIconSet` 是 B。
  - **載入失敗：** loader reject 時 `selectIconStyle` resolve，`activeIconSet` 是 `null`；之後選其他風格正常切換。
- [ ] **Step 2: 寫失敗測試** `icon.test.ts`，把假 Icon 組設進 `activeIconSet`：
  - 渲染 `<svg viewBox=…>`，內容是 drawing，帶 `svgAttributes`、`data-icon`、`aria-hidden`、`class`、`width`/`height`；不是 `svg.lucide`。
  - `defs` 放在 drawing 前面；`{id}` 全部換成 `useId()` 的值。
  - **兩個實例的 id 不同。**
  - `snapSize` 存在時用它的結果當尺寸。
  - `size <= 20` 時帶 `data-icon-small`，大於 20 時不帶。
  - 切回 `null` 時回到 lucide。
- [ ] **Step 3: 執行確認失敗。**
- [ ] **Step 4: 實作** `activeIconSet.ts` 和 `IconGlyph.vue`。`v-html` 比照 `StyleIcon.vue` 的 eslint 註解。`useId()` 去掉非英數字元，比照 `StyleIcon.vue:32`。
- [ ] **Step 5: 接上啟動流程：** `startAppearanceSync` 的 `apply` 呼叫 `void selectIconStyle(sources.style.value)`；`main.ts:116` 的 `Promise.all` 加上 `selectIconStyle(useSettingsStore().style)`。
- [ ] **Step 6: 全部驗證**（vitest、lint、vue-tsc）。全部 null，所以畫面不變。
- [ ] **Step 7: Commit** `✨ feat: let a style bring its own icon set, loaded on demand`

### Task 3: 匯出腳本與 pixel

**Files:**
- Create（研究分支）: `.worktrees/style-research/docs/style-research/generator/export_icons.py`
- Modify（研究分支）: `iconstyles.py`、`iconset.py`（下面列的輸出調整）
- Create: `src/style/styles/pixel/icons.ts`
- Modify: `src/presentation/components/icon/activeIconSet.ts`（pixel 的 loader）、`src/style/styles/pixel/skin.css:871`
- Test: `src/__tests__/style/iconSets.test.ts`、`src/__tests__/style/styles/pixel/pixelIcons.test.ts`

**Interfaces:**
- Produces: 匯出指令 `python3 export_icons.py <style> <輸出檔>`，輸出：
  ```ts
  import type { IconSet } from "@/style/iconSet";
  export const pixelIcons: IconSet = { viewBox: "0 0 8 8", svgAttributes: { "shape-rendering": "crispEdges", fill: "currentColor" }, snapSize, drawings: { … } };
  ```
  匯出名稱是 `<id>Icons`。`snapSize` 由 pixel 的檔案定義，其餘風格沒有。
- 匯出時的路徑精簡：只由 `M` 和 `L` 組成的路徑用 Ramer–Douglas–Peucker，容差從 0.06 開始，座標 1 位小數。目標 paper、ink、chalkboard 各自 gzip 15KB 以下；和畫板 40px 有肉眼差異就放寬，外觀優先，並在 commit 內文記下實際大小。

- [ ] **Step 1: 寫腳本並匯出 pixel。** 研究分支 commit `📄 docs: export the icon drawings for the app`。
- [ ] **Step 2: 寫失敗測試** `iconSets.test.ts`，迭代 `STYLE_ICON_SETS` 裡每個非 null 的 loader：`drawings` 的鍵等於 `ICON_NAMES`；每個 drawing 非空；不含 `filter`、`foreignObject`、`<image`、`<animate`、`<script`；所有顏色值只能是 `currentColor`、`none`、`var(--…)`、`#fff`、`#000`。
- [ ] **Step 3: 寫失敗測試** `pixelIcons.test.ts`，`snapSize`：11、12、13、14、16、18 → 16；20、22、24 → 24；32 → 32；36、40 → 40；**19 → 24、100 → 104、1 → 16**（一律是 8 的倍數，最小 16）。
- [ ] **Step 4: 執行確認失敗。**
- [ ] **Step 5: 實作** `pixel/icons.ts`（`snapSize`：`size <= 18` 回 16，其餘無條件進位到 8 的倍數），在 `STYLE_ICON_SETS` 接上 `() => import("@/style/styles/pixel/icons").then(module => module.pixelIcons)`。
- [ ] **Step 6: pixel 的 caret：** 移除 `skin.css` 那條規則的 `fill` 和 `stroke`，保留顏色和閃爍。
- [ ] **Step 7: 全部驗證**，啟動 `npm run start` 切到 8-bit，走首頁、遊戲、統計，確認提示次數那列（11→16px）沒有撐破；要調整版面時只動 pixel skin。
- [ ] **Step 8: Commit** `✨ feat: give 8-bit its dot-drawn icons, sized to whole pixels`

### Task 4: tactile

**Files:**
- Modify（研究分支）: `iconset.py` 的 `cut_out` 改輸出 `{id}`，三個 mask（`EyeOff`、`CircleHelp`、`Timer`）；`#fff` 反光保留。
- Create: `src/style/styles/tactile/icons.ts`
- Modify: `activeIconSet.ts`

- [ ] **Step 1: 匯出並接上 loader。** `iconSets.test.ts` 自動涵蓋。
- [ ] **Step 2: 驗證** vitest、lint；瀏覽器看淺色和深色，確認過關獎盃動畫（`tactile/skin.css:328-343`）正常。
- [ ] **Step 3: Commit** `✨ feat: give tactile its solid, raised icons`

### Task 5: paper

**Files:**
- Create: `src/style/styles/paper/icons.ts`
- Modify: `activeIconSet.ts`、視需要 `src/style/styles/paper/skin.css:271`

- [ ] **Step 1: 匯出並接上 loader。** 確認 gzip 大小並記下。
- [ ] **Step 2: 檢查勾勾描繪動畫：** `[data-skin~="check"] svg` 的 `stroke-dasharray: 24` 會被 `Check` 的主線和重描線繼承。主線路徑長度約 22～23，確認動畫完整描完；不對就調數值，並讓重描線也描完或不參與。
- [ ] **Step 3: 驗證** vitest、lint、瀏覽器。
- [ ] **Step 4: Commit** `✨ feat: give paper its hand-penned icons`

### Task 6: cyber

**Files:**
- Modify（研究分支）: `iconstyles.py` 的 `cyber()`，青色層改 `style="stroke:var(--color-cyber-ghost)"`。
- Create: `src/style/styles/cyber/icons.ts`
- Modify: `src/theme/paletteBuilder.ts`（`STYLE_OWN_TOKENS` 加 `cyber-ghost`）、`src/style/styles/cyber/palette.ts`（`NEON.cyan`）、`activeIconSet.ts`
- Test: 既有 palette 測試、`iconSets.test.ts`

- [ ] **Step 1: 加 token**，執行 `npm run generate:theme-css`。
- [ ] **Step 2: 匯出並接上 loader。**
- [ ] **Step 3: 驗證** vitest、lint；瀏覽器看首頁和設定（洋紅最多的頁面）。**太刺眼時先降青色層的不透明度或位移**，主題色不改；過關獎盃（`cyber/skin.css:806`）仍是 signal 色並帶光暈。
- [ ] **Step 4: Commit** `✨ feat: give cyber its cut-corner icons with a cyan ghost`

### Task 7: ink

**Files:**
- Create: `src/style/styles/ink/icons.ts`
- Modify: `activeIconSet.ts`

- [ ] **Step 1: 匯出並接上 loader。** 確認 gzip 大小並記下。
- [ ] **Step 2: 驗證** vitest、lint；瀏覽器看毛筆和燈籠在 14px 以下（統計的提示次數 11px），過關獎盃（`ink/skin.css:516`）正常。
- [ ] **Step 3: Commit** `✨ feat: give ink its brushed icons`

### Task 8: chalkboard

**Files:**
- Modify（研究分支）: `iconstyles.py` 的 `chalk()`，主線帶 `class="chalk-line"`，粉塵線帶 `class="chalk-dust"`。
- Create: `src/style/styles/chalkboard/icons.ts`
- Modify: `src/style/styles/chalkboard/skin.css`、`activeIconSet.ts`
- Test: `src/__tests__/style/styles/chalkboard/chalkboardSkin.test.ts`

- [ ] **Step 1: 寫失敗測試：** skin 有 `:root:not(.dark)[data-style="chalkboard"] .chalk-line` 設 `stroke-dasharray: none`，且 `.chalk-dust` 為 `display: none`；黑板沒有這兩條覆寫。
- [ ] **Step 2: 執行確認失敗，加上 skin 規則，確認通過。**
- [ ] **Step 3: 匯出並接上 loader。** 確認 gzip 大小並記下。
- [ ] **Step 4: 驗證** vitest、lint；瀏覽器在黑板和白板之間切換，不換風格時兩邊立刻正確；黑板的獎盃顆粒 mask（`chalkboard/skin.css:1103`）正常。
- [ ] **Step 5: Commit** `✨ feat: give chalkboard its chalk icons, plain marker on the whiteboard`

### Task 9: blueprint

**Files:**
- Modify（研究分支）: `iconstyles.py` 的 `blueprint()`，標記線帶 `class="blueprint-mark"`，主線帶線寬和線頭；`iconset.py` 標記沿用目前版本（只在圖形外面或空隙裡）。
- Create: `src/style/styles/blueprint/icons.ts`
- Modify: `src/style/styles/blueprint/skin.css:70-75`、`activeIconSet.ts`
- Test: `src/__tests__/style/styles/blueprint/blueprintSkin.test.ts:112`

- [ ] **Step 1: 改測試：** 移除 `svg.lucide` 的線條測試；新增 `[data-style="blueprint"] svg[data-icon-small] .blueprint-mark` 為 `display: none`。
- [ ] **Step 2: 執行確認失敗。**
- [ ] **Step 3: 改 skin**（移除 `svg.lucide` 規則，加隱藏規則）。退回 lucide 時線條稍粗可接受。
- [ ] **Step 4: 匯出並接上 loader。**
- [ ] **Step 5: 驗證** vitest、lint；瀏覽器看藍曬圖和製圖紙；22px 以上才有標記。
- [ ] **Step 6: Commit** `✨ feat: give blueprint its drafting-pen icons`

### Task 10: aurora

**Files:**
- Modify（研究分支）: `iconstyles.py` 的 `aurora()`，`url(#aurora-line)` → `url(#{id}-line)`，`url(#aurora-glass)` → `url(#{id}-glass)`；gradient 匯出到 `IconSet.defs`，stop 為 `stop-color="currentColor" style="stop-color:var(--aurora-icon-start)"`（`-middle`、`-end` 同理），玻璃層 `stop-opacity=".22"`。
- Create: `src/style/styles/aurora/icons.ts`
- Modify: `src/style/styles/aurora/skin.css:248-258`、`src/style/styles/aurora/palette.ts`、`src/theme/paletteBuilder.ts`、`activeIconSet.ts`
- Test: `src/__tests__/style/styles/aurora/auroraSkin.test.ts:399,414`、`src/__tests__/theme/paletteContrast.test.ts`

**Interfaces:**
- `STYLE_OWN_TOKENS` 加 `aurora-icon-start`、`aurora-icon-end`，在 aurora 的 palette 依模式設定（`hardcodedColors.test.ts` 不准 skin 寫色值）：夜空 `#4FE3C1`、`#FF8CC6`；晨光 `#0A6F61`、`#C2185B`。改完執行 `npm run generate:theme-css`。
- skin 變數 `--aurora-icon-start: var(--color-aurora-icon-start)`、`--aurora-icon-middle: var(--color-primary)`、`--aurora-icon-end: var(--color-aurora-icon-end)`。

- [ ] **Step 1: 改測試：** `svg.lucide-timer` 改成 `svg[data-icon="Timer"]`；移除 `svg.lucide` 的線條測試；新增：單色位置把三個變數設為 `currentColor`：`.text-on-primary`、`.text-danger`、`.text-error`、`.text-foreground-muted`、`.text-foreground-secondary`、`[data-skin~="icon-tile"][data-skin~="danger"]`、`[data-skin~="icon-tile"][data-skin~="gave-up"]`、`svg[data-icon="Timer"]`、`svg[data-icon="ChevronLeft"]`、`svg[data-icon="ChevronRight"]`。變數會由祖先繼承，所以小字旁的小圖示靠所在元素的 muted class 就成立。**不要用 `data-icon-small`：** 設定分組標題（16px）、提示選單和選項方塊（20px）都要完整漸層。
- [ ] **Step 2: 寫失敗對比測試：** 夜空和晨光、四個主題，三個顏色對玻璃卡片表面（`AURORA_BOARD_CASES` 的最差底色）都至少 3:1。
- [ ] **Step 3: 執行確認失敗。**
- [ ] **Step 4: 加 token、改 skin**，移除 `svg.lucide` 規則。對比不過就調 token 的色值，不要改回淡色；調整時同步更新規格的色值。
- [ ] **Step 5: 匯出並接上 loader。**
- [ ] **Step 6: 驗證** vitest、lint；瀏覽器看夜空和晨光：實心按鈕上的 Icon、危險對話框、提示面板的錯誤提示、標題列返回和計時都是單色且清楚。切深淺色時漸層立刻跟著變。
- [ ] **Step 7: Commit** `✨ feat: give aurora its gradient glass icons`

### Task 11: 全部接上，整體驗收

**Files:**
- Test: `src/__tests__/style/iconSets.test.ts`

- [ ] **Step 1: 寫測試並確認通過：** `STYLE_ICON_SETS` 裡只有 `minimal` 是 `null`。
- [ ] **Step 2: `npm run build`**，記錄主 bundle 和各 chunk 大小，和 680KB／215KB gzip 比較，主 bundle 不應增加超過 5KB。確認 PWA precache 有包含 chunk（`globPatterns` 已涵蓋 `*.js`）。
- [ ] **Step 3: 跨引擎：** Chromium、WebKit、Firefox 各看一個會用到 mask 和漸層的頁面（tactile 的 `EyeOff`、aurora 的設定頁）。
- [ ] **Step 4: 截圖給 owner**，每個風格的每個模式，手機尺寸，和 lucide 版本並排，覆蓋首頁、遊戲（含提示選單與提示面板）、過關、統計、回顧、解題演示、設定、外觀頁、對話框。**特別標出：** aurora 是否太淡、tactile 和 pixel 實心後是否不清楚或太重、cyber 是否刺眼，以及畫板沒畫過的五個模式。
- [ ] **Step 5: 等 owner 確認。** 要修的部分以後續 commit 處理，修完再給 owner 看。
- [ ] **Step 6: Android 實機** 依 `sudoku-app` 流程確認。

### Task 12: 收尾（owner 確認後才做）

**Files:**
- Modify: `CLAUDE.md`、`src/presentation/pages/settings/changelogData.ts`
- Delete: `docs/superpowers/specs/2026-11-04-style-icons-design.md`、`docs/superpowers/plans/2026-11-04-style-icons.md`

- [ ] **Step 1: 更新 `CLAUDE.md`：** 架構段落加 `components/icon/`；「Registering a style」加 `styles/<id>/icons.ts` 和 `STYLE_ICON_SETS`，說明 `Record<StyleId,…>` 少了會是型別錯誤；Skin hooks 加 `data-icon`、`data-icon-small`；記下 pixel 的尺寸對齊、chalk 的 `chalk-line` / `chalk-dust`、blueprint 的 `blueprint-mark`、aurora 的 `--aurora-icon-*`，以及 token `cyber-ghost`。
- [ ] **Step 2: `UNRELEASED_CHANGES`** 加一行，中英文，例如「每個風格都有專屬的圖示」，不列風格數量。
- [ ] **Step 3: 刪除規格和計畫，全部驗證，commit** `📄 docs: document per-style icons and retire their spec`。
- [ ] **Step 4: 詢問 owner 是否合併回 `develop`。** 未經同意不合併、不 push。
