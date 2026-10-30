# 極光玻璃 Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增風格 `aurora`（「極光玻璃」／"Aurora Glass"）：深色「夜空」、淺色「晨光」兩種模式，紫／青綠／粉紅／橘四種主題色，四團漂移的極光上浮著磨砂玻璃（不用任何濾鏡），九宮是九塊玻璃，柔光脈衝填入、縮小淡出擦除，自己的 App 圖示、載入、完成一組與過關時刻。

**Architecture:**
- `aurora` 照 blueprint 的形狀註冊（兩種模式、四個主題、`themeBuilder`），但主題只換強調色：極光、玻璃與其他 token 只跟著模式換。`STYLE_MODE_NAMES` 改名兩種模式。
- 「玻璃」是半透明的 `color-mix` 染色加 `box-shadow` 的邊緣、高光與陰影，全部靜態；「極光」是預先柔化的 `radial-gradient`，畫在 `body::before`、`body::after`、`.app-safe-area::before` 三層固定偽元素上，只動 `transform`。palette 的 `card`、`cell-clue` 等 token 是「玻璃在極光最亮處的合成色」，對比測試由 palette 的極光 token 加 skin 的密度屬性重算並比對。
- 外觀全在 `src/style/styles/aurora/skin.css`（`[data-style="aurora"]`）；時刻元件在 `src/presentation/components/style-moments/aurora/`。唯一的共用改動是 `BoardCell` 的 `data-box-corner`（獨立 ♻️ commit），其他風格 DOM 與畫面都不變。

**Tech Stack:** Vue 3 + TS + Tailwind v4、Vitest、PostCSS sheet tests（`src/__tests__/style/styleSheetRules.ts`）、`tsx` 產生器、`sharp`（librsvg）、Capacitor launcher aliases、Playwright（只在驗收時從 scratchpad 跑，不加進 `package.json`）。

**Spec:** `docs/superpowers/specs/2026-10-30-aurora-style-design.md`（有衝突時以 spec 為準，下面「計劃裁定」列出的除外）。

**畫板（唯讀，另一個 worktree）：** `/Users/ethan/Project/sudoku/.worktrees/style-research/docs/style-research/project/`
- `Aurora.dc.html`：第 277–381 行是極光的全部規則（`.m-dark`／`.m-light` 與 `.t1`–`.t3`、`.blob`、`.ribbon`、玻璃、`.orb`、`.cell.sel`、`pulseA`／`softA`／`fadeA`、`.key`、`.ctl`、`.btn.*`、`--err`、`ringout`）。第 1–270 行是共用骨架。
- `GroupAurora.dc.html`：第 150–170 行（`ag-glow`、`ag-sx`／`ag-sy`、`ag-pulse`）。
- `MomentsAurora.dc.html`：第 110–160 行（`spin`、`au-breathe`、`au-surge`、`au-glow`、`ringout`、`au-rise`、`au-frost`）與其 reduced-motion 規則。
- `PickerC.dc.html`、`PickerFlow.dc.html`：外觀卡片與 App 圖示（`aiw`）。`canvas.json`：`note6`、`momentsNote9`、`groupNote9`。
- 檔案很大，用 grep 找段落再讀。也可以用 Artifact `read` 加 `path` 讀 https://claude.ai/artifact/72nsZrRhPbd5nfnKt8UnWE 。

## Global Constraints

- **分支與工作目錄：** `feature/style-aurora`，主 checkout `/Users/ethan/Project/sudoku`。不切分支、不合併、不 push，不碰 :5173／:5199 的 dev server。截圖用自己開的 vite：`npx vite --port 5207 --strictPort --force`，改過 CSS 後重開。
- **TDD：** 一次一條測試，先紅再綠，綠了才重構。結構性（♻️，行為不變，前後都跑測試）和行為性 commit 分開。每次綠燈就 commit。
- **commit 門檻：** `npx vitest run` 全綠、`npm run lint` 乾淨、`npx vue-tsc --noEmit` 乾淨，沒有新警告。
- **commit 訊息：** 英文 Conventional Commits，type 前加 emoji（✨ feat、🐛 fix、♻️ refactor、📄 docs、🧪 test、🚧 chore），內文至多三點。**不加任何 trailer**：沒有 Co-Authored-By、Claude-Session 或任何產生標記。不要裸 `git stash`。
- **命名：** 識別字不縮寫（`row`／`column`，不用 `r`／`c`、`i`、`idx`、`ctx`）。只用 named export。Composition API `<script setup>`、箭頭函式、4 空格縮排。`presentation/` 下資料夾 kebab-case。
- **skin 規則**（`styleSheets.test.ts`）：selector 都在 `[data-style="aurora"]`（或 `:root[data-style="aurora"]`、`:root.dark[data-style="aurora"]`）底下；keyframes 以 `aurora-` 開頭；沒有版面宣告，除非該規則的 selector 全是 `::before`／`::after`（`font-size`、`letter-spacing`、`border`、`padding`、`margin`、`width`、`height`、`inset`、`display` 都算；`position: relative` 和 `z-index` 不算）。字級只能用 `--clue-scale` 等 scale（1–1.5），這個風格全部維持 1（spec「數字大小沿用 App 的設定」）。每個動畫都在 `@media (prefers-reduced-motion: reduce)` 停掉。
- **沒有寫死的顏色**（`hardcodedColors.test.ts`）：skin 與 `.vue` 只用 token 與 `color-mix()`；白色用 `--color-glass-sheen`。`mask-image` 一律同時寫 `-webkit-mask-image`，遮罩只用漸層（不用 `url(#…)` 參照）。
- **反目標（每個 task 的 sheet 測試都隱含）：** aurora 的 skin 與 `style-moments/aurora/*.vue` 沒有任何 `filter`、`backdrop-filter`、`-webkit-backdrop-filter`、`:has(`、`offset-path`、`url(#`；`STYLE_MOMENTS.aurora` 沒有 `digitWriter`。會動的只動 `transform`、`opacity`，例外只有：完成一組與過關時格子的 `background-color`、填入那一格數字的 `text-shadow`。
- **其他風格不變：** `git diff develop -- src/style/themes.generated.css` 只有 aurora 的區塊；共用 hook 對其他風格的畫面沒有影響。
- **文案：** 中文照 `CLAUDE.md`；測試只驗切換語言會換字。`UNRELEASED_CHANGES` 加一條「全新風格「極光玻璃」」／"New style: Aurora Glass"。不 bump 版本。不列出、不計算風格數量。
- **確切值：**
  - 風格 id `aurora`，排在 `blueprint` 後面；`settings.style.names.aurora` = 「極光玻璃」／"Aurora Glass"；`settings.colorMode.styled.aurora` = `{ dark: "夜空", light: "晨光" }`／`{ dark: "Night Sky", light: "Dawn" }`。
  - `THEME_IDS_BY_STYLE.aurora = ["purple", "teal", "pink", "orange"]`（預設 `purple`，名稱沿用 `settings.colorThemes`）；`STYLE_COLOR_MODES.aurora = ["dark", "light"]`；`STYLE_MODE_NAMES.aurora = true`。
  - Launcher keys `auroraPurple`、`auroraPurpleDark`、`auroraTeal`、`auroraTealDark`、`auroraPink`、`auroraPinkDark`、`auroraOrange`、`auroraOrangeDark`；launcher icons 37 → 45。
  - `barColors.aurora`：dark 四色都是 `#060914`；light 是各主題的 primary：`purple: "#5B3FE0"`、`teal: "#0A6F61"`、`pink: "#C2185B"`、`orange: "#A84808"`。
  - `STYLE_MOMENTS.aurora`：`loader: AuroraLoader`、`celebration: AuroraCelebration`、`cardDecoration: null`、`groupOverlay: AuroraGroupOverlay`、`groupEffectMs: 900`、`celebrationBoardMs: 800`，沒有 `digitWriter`。`STYLE_HOME_HEROES.aurora = "stacked"`、`CONTINUE_LAYOUTS.aurora = "chips"`、`STYLE_BOARD_FRAMES.aurora = null`。
- **配色**（`mix(色, 比例, 底)` 是 `mixColors`）：
  - 夜空：底 `#060914`、字 `#F2F5FF`、次要字 `#B0B9D3`、錯誤 `#FF948A`、`on-danger` 是底；極光 `aurora-1`–`4` = `#19E6A3`／`#7C4DFF`／`#1FB6FF`／`#FF6FB5`；`glass` `#141A34`；`glass-sheen` `#FFFFFF`。主題 → primary／on-primary：purple `#A897FF`／`#120B30`、teal `#4FE3C1`／`#052A22`、pink `#FF8CC6`／`#3A0820`、orange `#FFB86B`／`#3A1E00`。
  - 晨光：底 `#EEF0F7`、字 `#151A2D`、次要字 `#48506A`、錯誤 `#B71C1C`、`on-danger` `#FFFFFF`；極光 `#7FE7C9`／`#B7A4FF`／`#8CCBFF`／`#FFC2A6`；`glass` `#FFFFFF`；`glass-sheen` `#FFFFFF`。primary：purple `#5B3FE0`、teal `#0A6F61`、pink `#C2185B`、orange `#A84808`，on-primary 都是 `#FFFFFF`。
  - 最亮點（「ground」）：夜空 `mix(aurora-1, 0.42 × 0.55 × 0.8, mix(aurora-1, 0.42, 底))` ≈ `#107E5F`；晨光 `mix(aurora-2, 0.85 × 0.45 × 0.8, mix(aurora-2, 0.85, 底))` ≈ `#BDACFE`。
  - Token 對應：`card` = `mix(glass, 卡片密度, ground)`；`cell-clue` = 格子玻璃（`mix(glass-sheen, 格子提亮, mix(glass, 格子密度, ground))`）；`cell-peer`、`cell-scope` = 格子玻璃再疊 `mix(glass-sheen, 同列提亮, …)`；`highlight`、`cell-pattern` = `mix(primary, 0.08, 格子玻璃)`；`primary-light` = `mix(primary, 淡底, card)`；`cell-focus` = `mix(primary, 淡底, 格子玻璃)`（提示答案格）；`cell-selected` = `primary`；`error-surface` = 錯誤格斜紋上最深的一點（見下）；`featured`／`on-featured` = primary／on-primary；`toast` = `mix(glass, 對話框密度, ground)`、`on-toast` = 字；`note` = 次要字；`accent`（玩家數字）= primary。`primary-hover`、`foreground-muted`、`border`、`shadow` 照同模式鄰近值推，過對比即可。
- **skin 的自訂屬性**（對比測試直接讀；`:root[data-style="aurora"]` 是晨光、`:root.dark[data-style="aurora"]` 是夜空，不分模式的放 `[data-style="aurora"]`）：

  | 屬性 | 晨光 | 夜空 |
  |---|---|---|
  | `--aurora-strength`（每團極光的不透明度） | `0.85` | `0.42` |
  | `--aurora-glass-card` | `80%` | `80%` |
  | `--aurora-glass-cell` | `80%` | `88%` |
  | `--aurora-sheen-cell` | `0%` | `6%` |
  | `--aurora-sheen-peer`（疊在格子玻璃上） | `75%`（合起來是白 95%） | `9%` |
  | `--aurora-glass-dialog` | `92%` | `90%` |
  | `--aurora-edge`／`--aurora-gloss` | `85%`／`90%` | `12%`／`14%` |
  | `--aurora-tint-soft`（淡底）／`--aurora-tint-same`（相同數字） | `6%`／`8%` | `8%`／`8%` |
  | `--aurora-error-wash`／`--aurora-error-stripe` | `5%`／`8%` | `5%`／`8%` |

  不分模式：`--aurora-ribbon-first: 55%`、`--aurora-ribbon-second: 45%`、`--aurora-ribbon-strength: 0.8`、`--aurora-scrim: 62%`、`--aurora-loader-scrim: 45%`；極光幾何 `--aurora-blob-size`、`--aurora-a1-x`／`--aurora-a1-y` … `--aurora-a4-x`／`--aurora-a4-y`、`--aurora-drift-1-x`／`-y`、`--aurora-drift-2-x`／`-y`，全部 `vmax`（值由實作者定，守住 Task 4 的約束）。
- **字型：** `"Aurora Sans TC"`（`noto-sans-tc.woff2` 同一個檔，`font-weight: 300 600`）；`--font-aurora-sans: "Outfit", "Aurora Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif`；gate `data-aurora-fonts="ready"`。

## 從藍圖工程學到的（每個 task 的驗收都要包含）

- **填入只用 CSS**（`1780023`、`8a89677`）：藍圖的 mask writer 最後拿掉，改成 CSS。aurora 一開始就不用 `digitWriter`，arrival 由格子 `::before` 的 `animationend` 結束（`73cfa36`：掛在 `data-arriving`，不用 `:has()`）。
- **錯誤色和主題色撞色**（`4ab916f`、`e20c2e5`）：每個主題、每個模式都要一眼分出「錯誤」「選取」「相同數字」。aurora 靠圖樣（斜紋／實心／平塗）加真正的紅；Task 1 有一條測試釘住錯誤色不等於任何主題的 primary。
- **最後的視覺比對才抓到的問題**（`8cceacd` 框太粗、`1499a62`／`aaba3a2` 最近遊戲列）：每個頁面 task 結束都在 :5207 跟畫板並排看，不留到最後。
- **畫在卡片上的東西跟著卡片走**（`912c149`：印章移到 `cardDecoration`）：aurora 的光環和光點畫在卡片「後面」，由 `celebration` 畫在遮罩層，以卡片中心為圓心；卡片本身的效果只寫在 skin。
- **字型 gate 之前的版面**（`9c7169e`）：gate 前後只有字體不同，不能有東西跳動。
- **三個盤面一起做**：提示模式、解題演示、遊戲回顧的答案格、強調候選數、步驟 tag 都要有。

## 計劃裁定

spec 沒算到或留給實作者、而這份計劃替實作者先決定的地方：

1. **錯誤格的淡底從 10% 降到 5%、斜紋從 10% 降到 8%。** 照 spec 的 10% + 10% 重算，錯誤字在斜紋上最深處只有 4.28（夜空）、4.20（晨光），不過 4.5；5% + 8% 是 4.87／4.71。照 spec 自己的原則「調淡底，不改字色」。`error-surface` token 就是這個最深處的合成色。
2. **選取格那圈 2px 光環：** 實心選取格上維持主題色 40%（裝飾，3:1 由實心本身對鄰格承擔：最低 5.13）；錯誤格被選取時，光環是 100% 主題色，因為它是唯一的選取記號（40% 對格子只有 1.81–2.55）。`AURORA_BOARD_CASES` 檢查的「光環 3:1」指的是這一圈。
3. **晨光同列欄宮的「95% 白」**是格子玻璃（白 80%）再疊 `--aurora-sheen-peer: 75%`，合起來正好是白 95%，兩個模式用同一個公式。
4. **數字蓋在所有柔光之上：** 格子裡的數字 `position: relative; z-index: 2`，選取格與答案格 `z-index: 1`，填入脈衝在格子自己的 `::before`、`z-index: 0`，完成一組的光帶與光環也是 `z-index: 0`（在玻璃之上、選取格與所有數字之下）。選取格的光暈畫到鄰格的玻璃上，但不蓋鄰格的數字（spec 反目標「柔光蓋住數字」）。
5. **極光只平移，不縮放。** 畫板的 `scale(1.2)`／`scale(.85)` 拿掉，約束才算得出來。四團的錨點固定：a1 左上、a3 左下（`body::before`），a2 右上、a4 右下（`body::after`），`--aurora-aN-x/y` 是該團方塊離錨定的兩條邊的距離。
6. **約束的算法（保守）：** 每團是邊長 S 的方塊上的 `radial-gradient(circle, 色 0, transparent 66%)`，`circle` 預設 farthest-corner，所以衰減半徑 R = 0.66 × S × √2 ⁄ 2。同層兩團的中心距離 ≥ R；不同層兩團「靜止時的距離 − |drift-1| − |drift-2|」≥ R。在 360×640、360×800、390×844、768×1024、1280×800、1920×1080 六種視窗都要成立。
7. **格子的底色寫成 `--aurora-cell-ground`**，每個 variant 只設這個屬性，`background-color: var(--aurora-cell-ground)`。完成一組與過關的漫光 keyframes 起訖都用它，所以選取格、錯誤格漫光完回到自己的底色，不會閃回玻璃。疊在玻璃上的提亮用巢狀 `color-mix`（sRGB 預乘混色與逐層疊色結果相同）。
8. **過關漫光排在完成一組後面：** `[data-celebration="playing"]` 的格子規則寫在 `[data-group]` 之後、權重不低於它，最後一格同時完成一組和過關時只播過關的漫光。
9. **減少動態的過關：** 中央那一宮的光是 `max(0%, 22% − 11% × 距離)`，距離是到中心格的棋盤距離（同 spec 的 `max()` 算法），所以只有中心格 22%、外一圈 11%，正好是中央那一宮。
10. **載入光點的亮色畫在點的 `::before`、只動 `opacity`**，柔光在 `::after`、只動 `opacity`；點本身只動 `transform`。不動 `background-color`。
11. **App 圖示漸層的 id 用既有的 `idSuffix`**（`StyleIcon.vue` 每個實例一個 `useId()`），比 spec 說的「帶風格、主題、模式」更不會撞；產生器（`idSuffix` 為空）照 cyber 的寫法用無後綴的 id。
12. **首頁標題維持 stacked 的 36px 與字距，只改字重 600。** spec 的 40px、0.06em 是版面宣告，skin 不能寫，spec 又指定 `"stacked"`、不加 hero 版面。差 4px。
13. **中階 Android 的效能檢查改成 Chrome DevTools 4× CPU 降速錄一段**（spec 允許的替代；擁有者已取消 Android peer 檢查）。

## Review Focus

1. **選取格或錯誤格剛好在完成的一組裡：** 漫光從它自己的底色亮起再回到它自己的底色（實心主題色、斜紋），不閃成普通玻璃。→ Task 14 的 sheet 測試（keyframes 起訖都是 `var(--aurora-cell-ground)`，每個 variant 都設它）。
2. **最後一格同時完成一組和整盤：** 格子只播過關漫光，填入脈衝照常在 800ms 結束 arriving，對話框 800ms 打開。→ Task 15 的 sheet 測試（規則順序與權重，裁定 8）。
3. **柔光不蓋任何數字：** 選取格光暈、答案格光暈、填入脈衝、完成一組的光帶都在數字底下。→ Task 10、12、14 的測試（數字 `z-index: 2`；選取與答案格 `z-index: 1`；脈衝與完成一組的光帶、光環 `z-index: 0`，在玻璃之上、所有數字與選取格之下）。
4. **寬、窄、橫的視窗：** 六種視窗下極光核心都分開；寬視窗兩側沒有色帶，極光蓋滿整個視窗；矮螢幕上過關湧亮（盤面的 135%）不被捲動容器裁掉。→ Task 4 的約束測試、Task 15 的測試與 Task 18 截圖。
5. **快速連續操作同一格：** 填入後馬上再填（脈衝重播）、填入後馬上擦掉（脈衝換成殘影）、選取格上填入（脈衝在實心玻璃上看得到），都不留柔光或殘影。→ Task 12 的測試（兩個 `::before` 規則都沒有 `forwards`／`both`，結束時透明度 0，arriving 與 leaving 互斥由 `useArrivalMotion` 保證）。

---

### Task 1: 註冊 `aurora` 與它的配色

`aurora` 在外觀頁可以選，兩種模式、四色都對。skin 是空殼，圖示暫時只有底色（Task 2），時刻先借 minimal 的（Task 13–15）。

**Files:**
- Create: `src/style/styles/aurora/palette.ts`、`src/style/styles/aurora/skin.css`（空殼：press hooks 和 reduced-motion 區塊，照 blueprint 開頭）
- Modify: `src/theme/themeIds.ts`、`src/theme/paletteBuilder.ts`（`STYLE_OWN_TOKENS` 加六個，更新上方註解）、`src/theme/palettes.ts`、`src/style/index.css`（import）、`src/theme/styleIcons.ts`（`aurora` 只畫底色）、`src/presentation/components/style-moments/styleMoments.ts`、`src/presentation/pages/home/homeHeroes.ts`、`src/presentation/components/continue-button/continueLayouts.ts`、`src/presentation/components/board-frame/boardFrames.ts`、`index.html`（`barColors`）、`src/presentation/i18n/messages/{zh-Hant,en}.ts`、`src/presentation/pages/settings/changelogData.ts`
- Generated: `src/style/themes.generated.css`、`public/*aurora*`、Android launcher 資源與 manifest aliases
- Tests: `src/__tests__/theme/{palettes,paletteContrast,launcherIcon,themeIds}.test.ts`、`src/__tests__/presentation/theme/noFlashScript.test.ts`、`src/__tests__/presentation/pages/settings/{Appearance,Settings}.test.ts`、`src/__tests__/stores/settingsStore.test.ts`、`src/__tests__/style/styleCoverage.test.ts`

**Interfaces:**
- Produces: `AURORA_STYLE: StyleDefinition`；`STYLE_IDS` 最後是 `"aurora"`；`STYLE_OWN_TOKENS` 多了 `"aurora-1"`、`"aurora-2"`、`"aurora-3"`、`"aurora-4"`、`"glass"`、`"glass-sheen"`（CSS 變數 `--color-aurora-1`、`--color-glass`、`--color-glass-sheen`）；`REQUIRED_SELECTORS.aurora`（先只有 press hooks）。palette.ts 內部常數 `AURORA_DENSITIES: Record<ColorMode, { strength, card, cell, sheenCell, sheenPeer, dialog, tintSoft, tintSame, errorWash, errorStripe }>` 與 `AURORA_RIBBON = { first: 0.55, second: 0.45, strength: 0.8 }`，值同 Global Constraints 的表（之後的 skin 必須一致，Task 5 的測試比對）。

- [ ] **Step 1: 寫失敗的測試。**
  - `palettes.test.ts`：`STYLES.aurora.themes.map(theme => theme.id)` 等於 `["purple", "teal", "pink", "orange"]`；`getPalette("aurora", "pink", "dark")` 的 background `#060914`、foreground `#F2F5FF`、foreground-secondary `#B0B9D3`、primary `#FF8CC6`、on-primary `#3A0820`、accent `#FF8CC6`、cell-selected `#FF8CC6`、error `#FF948A`、on-danger `#060914`、aurora-1..4 `#19E6A3`／`#7C4DFF`／`#1FB6FF`／`#FF6FB5`、glass `#141A34`、glass-sheen `#FFFFFF`；`getPalette("aurora", "orange", "light")` 的 background `#EEF0F7`、foreground `#151A2D`、foreground-secondary `#48506A`、primary `#A84808`、on-primary `#FFFFFF`、error `#B71C1C`、on-danger `#FFFFFF`、aurora-1..4 `#7FE7C9`／`#B7A4FF`／`#8CCBFF`／`#FFC2A6`、glass `#FFFFFF`。
  - `palettes.test.ts`：同一模式下四個主題的 `background`、`card`、`cell-clue`、`cell-peer`、aurora-1..4、glass 都相同（主題只換強調色）；只有 aurora 的 palette 帶這六個 own token；每個主題、每個模式的 `error` 都不等於 aurora 任何主題同模式的 `primary`。
  - `launcherIcon.test.ts`：45 個圖示，八個 `aurora*` key 都在；`pwaIconKey("aurora", "teal") === "auroraTeal"`。
  - `noFlashScript.test.ts`：存了 `{ style: "aurora", colorTheme: "pink" }`、系統深色時畫 `dark` 與 `#060914`；系統淺色時沒有 `dark`、theme-color 是 `systemBarColor("aurora", "pink", "light")`（`#C2185B`）。
  - `settingsStore.test.ts`：第一次切到 aurora 是 dark，主題是 `purple`。
  - `Appearance.test.ts`：風格卡片最後是 `style-option-aurora`；選了 aurora 後，模式控制顯示改名的模式（切換語言會換字），有四個 `color-theme-*`，色票顏色是各主題的 primary（`swatchColors` 預設，spec 裁定 13）。
  - `Settings.test.ts`：aurora 時外觀摘要用改名的模式。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/theme src/__tests__/presentation/theme src/__tests__/presentation/pages/settings src/__tests__/stores/settingsStore.test.ts`，因為 `aurora` 不存在而失敗。
- [ ] **Step 3: 寫配色。** `palette.ts`：`auroraGround(mode): string`（最亮點，見 Global Constraints）、`auroraNeutrals(mode)`，四個主題各呼叫一次 `themeBuilder(lightNeutrals, darkNeutrals, lightExtras, darkExtras)(id, light, dark)`，extras 帶 Token 對應裡的 board tints 與六個 own token。不改 `themeBuilder`。
- [ ] **Step 4: 讓通用對比測試接受 aurora。** 選取格是實心主題色，`foreground／primary／error／note on cell-selected` 與 `primary on cell-selected (3:1)` 加 `exceptIn: ["aurora"]`，原因寫「選取格是實心主題色，字是 on-primary；AURORA_BOARD_CASES 檢查」；「層要看得出不同」的 `SURFACE_PAIRS` 照 spec 對 aurora 豁免，原因寫「題目與其他格同一塊玻璃，靠字色分辨」。其他不過的組合先查是不是畫面上不存在的組合，是才豁免並寫原因，不是就調 extras。
- [ ] **Step 5: 註冊與產生。** ids、`STYLES`、`styleIcons.ts` 的 `aurora` 只回傳底色、i18n、`barColors`、`homeHeroes`／`continueLayouts`／`boardFrames` 的 aurora 項、空殼 skin、`AURORA_MOMENTS = { loader: MinimalLoader, celebration: null, cardDecoration: null, groupEffectMs: 900, celebrationBoardMs: 800 }`、`UNRELEASED_CHANGES` 那一條。跑 `npm run generate:theme-css`、`generate:icons`、`generate:launcher-icons`。
- [ ] **Step 6:** `git diff develop -- src/style/themes.generated.css` 只有 aurora 區塊。`npx vitest run`（含 `iconAssets`、`launcherIconAssets`、`AndroidManifest`、`themesGenerated`）、`npm run lint`、`npx vue-tsc --noEmit` 都乾淨。
- [ ] **Step 7:** Commit `✨ feat: add the aurora glass style with its night sky and dawn palettes`。

### Task 2: 極光的 App 圖示

**Files:**
- Modify: `src/theme/styleIcons.ts`
- Generated: `public/*aurora*`、Android launcher 資源
- Test: `src/__tests__/theme/styleIcons.test.ts`

**Interfaces:**
- Consumes: `AURORA_STYLE`（Task 1）。
- Produces: `auroraArtwork(palette: Palette, bleed: number, idSuffix: string): string[]`、`auroraMonochrome(color: string): string[]`，接進 `artworkOf` 與 `monochromeArtwork` 的 `aurora` 分支。

- [ ] **Step 1: 寫失敗的測試。**
  - `styleIconSvg("aurora", getPalette("aurora", "purple", "dark"), "x")` 含 `#060914`、`#19E6A3`、`#7C4DFF`、`#1FB6FF`、`#A897FF`，有三個 `<radialGradient`，圓心與半徑是 (20, 18, 56)、(96, 44, 58)、(38, 104, 54)；有一個 56 單位、`rx="16"` 的玻璃 `rect`；九個光點：四角 r4.5 字色 30%（`fill-opacity="0.3"`）、四邊 r4.5 primary、中央 r6 `glass-sheen`；不含 `<filter`、`<text`。
  - 八張圖（四色 × 兩模式）的 SVG 互不相同；晨光的含 `#EEF0F7` 與 `#5B3FE0`（purple）。
  - 兩個 `idSuffix` 不同的 SVG，所有 `id="…"` 互不相同，`url(#…)` 都指向自己的 id；`idSuffix` 為空時 id 沒有後綴。
  - `styleIconMonochrome("aurora")` 只用一個顏色，只有玻璃外框和九顆光點，沒有 `radialGradient`。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/theme/styleIcons.test.ts`，失敗。
- [ ] **Step 3: 畫圖示**（PickerC／PickerFlow 的 `aiw`，Aurora.dc 第 381 行的 `.art` 變數）。玻璃是 `glass` 照模式的卡片密度合成在底色上、`glass-sheen` 1.2 寬的邊。
- [ ] **Step 4:** 跑 `generate:icons`、`generate:launcher-icons`；:5207 的外觀頁看卡片，和畫板並排比。`npx vitest run`、lint、vue-tsc 乾淨。
- [ ] **Step 5:** Commit `✨ feat: draw the aurora app icons in each colour and mode`。

### Task 3: 中文字型與 gate

**Files:**
- Modify: `src/style/fonts.css`（`"Aurora Sans TC"` 的 `@font-face`）、`src/style/index.css`（`--font-aurora-sans`）、`src/presentation/theme/appearanceSync.ts`
- Create: `src/style/styles/aurora/fonts.ts`
- Generated: `src/assets/fonts/noto-sans-tc.woff2`、`lxgw-wenkai-tc-*.woff2`（`npm run generate:fonts`，涵蓋新字「極光玻璃」「夜空」「晨光」）
- Tests: `src/__tests__/style/bundledFonts.test.ts`、`src/__tests__/style/styles/aurora/fonts.test.ts`（新）、`src/__tests__/presentation/theme/appearanceSync.test.ts`

**Interfaces:**
- Produces: `syncAuroraFonts(active: boolean): void` = `markFontsReady({ style: "aurora", datasetKey: "auroraFonts", faces: ['400 16px "Aurora Sans TC"', '600 16px "Aurora Sans TC"'], sample: "數獨 極光" })`；`appearanceSync.ts` 以 `syncAuroraFonts(style === "aurora")` 呼叫。

- [ ] **Step 1: 寫失敗的測試。**
  - `bundledFonts.test.ts`：`["Aurora Sans TC", "300 600"]` 從打包的 woff2 宣告、`font-display: swap`，`src` 是 `noto-sans-tc.woff2`（`BUNDLED_FONTS` 不加新檔）；`noto-sans-tc.woff2` 涵蓋 `chineseText`（含新字）。
  - `fonts.test.ts`：`--font-aurora-sans` 的前兩個 family 是 `Outfit`、`Aurora Sans TC`；`Aurora Sans TC` 不出現在其他風格的 stack，`Blueprint Sans TC` 不出現在 aurora 的；gate 只在兩個 face 都 `loaded` 時標記、離開 aurora 時拿掉、沒有 `document.fonts` 時什麼都不做；skin 在 `[data-style="aurora"][data-aurora-fonts="ready"]` 下把 `--font-sans` 換成 `var(--font-aurora-sans)`，`[data-skin~="title"]` 與 `dialog-title` 的 `font-weight: 600`。
  - `appearanceSync.test.ts`：style 是 aurora 時以 `true` 呼叫 `syncAuroraFonts`。
- [ ] **Step 2:** 跑這三個檔，失敗。
- [ ] **Step 3:** 實作；跑 `npm run generate:fonts`，回報 `noto-sans-tc.woff2` 的大小變化。
- [ ] **Step 4:** `npx vitest run`、lint、vue-tsc、`npm run build` 乾淨。
- [ ] **Step 5:** Commit `✨ feat: set aurora's Chinese in the bundled Noto Sans TC under its own family`。

### Task 4: 極光背景

**Files:**
- Modify: `src/style/styles/aurora/skin.css`、`src/__tests__/style/styleCoverage.test.ts`
- Test: `src/__tests__/style/styles/aurora/auroraSkin.test.ts`（新，PostCSS，照 `blueprintSkin.test.ts`）

**Interfaces:**
- Consumes: own tokens（Task 1）。
- Produces: 測試 helper `auroraProperty(selector: string, name: string): string`、`vmaxOf(value: string): number`（Task 5、10 共用）；keyframes `aurora-drift-first`、`aurora-drift-second`、`aurora-ribbon`。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - `body` 的 `background-color: var(--color-background)`，沒有 `background-image`；`page`／`page-ruled`／`page-header` 透明。
  - `body::before`、`body::after`、`.app-safe-area::before`：`content: ""`、`position: fixed`、`z-index: -1`、`pointer-events: none`、`will-change: transform`、`opacity` 用 `--aurora-strength`（光帶乘 `--aurora-ribbon-strength`）；前兩層各兩個 `radial-gradient(circle, var(--color-aurora-N) 0, transparent 66%)`（a1＋a3、a2＋a4），`background-size` 用 `--aurora-blob-size`、`background-repeat: no-repeat`、位置用 `--aurora-aN-x/y` 依裁定 5 的錨點；光帶是兩個橢圓 `radial-gradient`（左 a1 `--aurora-ribbon-first`、右 a2 `--aurora-ribbon-second`）。
  - 動畫：`body::before` 跑 `aurora-drift-first` 19s `ease-in-out infinite alternate`；`body::after` 跑 `aurora-drift-second` 23s `infinite alternate-reverse`；光帶 `aurora-ribbon` 16s `alternate`，`rotate(-12deg)` → `rotate(-4deg)`；三個 keyframes 只有 `transform`，drift 只有 `translate(var(--aurora-drift-N-x), var(--aurora-drift-N-y))`。
  - **約束（裁定 6，Review Focus 4）：** 讀 `--aurora-blob-size` 與八個位置、四個漂移，在六種視窗算出四團中心；同層兩團距離 ≥ R、不同層「靜止距離 − |drift-1| − |drift-2|」≥ R，R = 0.66 × S × √2 ⁄ 2。
  - 頁首捲動後：`[data-skin~="page-header"][data-scrolled]` 的 `background-color: color-mix(in srgb, var(--color-background) calc(88% * var(--header-scroll, 0)), transparent)`，沒有 `backdrop-filter`。
  - 整份 aurora skin 沒有 `filter`、`backdrop-filter`、`-webkit-backdrop-filter`、`:has(`、`offset-path`、`url(#`（反目標，之後每個 task 都會跑到）。
  - reduced motion 下三層 `animation: none`，停在起始位置（沒有 `transform` 覆寫）。
  - `REQUIRED_SELECTORS.aurora` 加 `body::before`、`body::after`、`.app-safe-area::before`。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/style`，失敗。
- [ ] **Step 3:** 照 Aurora.dc 第 285–295 行實作，從 390×844 換算成 `vmax`。
- [ ] **Step 4:** `npx vitest run`、lint、vue-tsc 乾淨；:5207 在 390×844、1280×800 兩種模式看首頁，寬視窗兩側沒有色帶、極光在動；DevTools 的 Rendering → Paint flashing 確認背景漂移時玻璃不重畫。
- [ ] **Step 5:** Commit `✨ feat: drift aurora's four lights and ribbon behind every screen`。

### Task 5: 玻璃與共用元件

**Files:**
- Modify: `src/style/styles/aurora/skin.css`、`src/__tests__/theme/paletteContrast.test.ts`（`AURORA_BOARD_CASES` 第一批）、`styleCoverage.test.ts`
- Test: `auroraSkin.test.ts`

**Interfaces:**
- Consumes: 現有 hooks（`card`、`button`（`primary`／`secondary`／`outline`／`danger` 依元件現有的 class 或 data，照 blueprint 怎麼分）、`text-button`、`pill`、`pill hint`、`tag`、`tag new-record`、`tag step`、`tag step strong`、`app-tag`、`icon-tile`、`icon-tile danger`、`dialog-title`、`dialog-scrim`、`loader-scrim`、`menu-option`、`menu-divider`、`toast`）；Task 4 的 helper。
- Produces: `--aurora-glass-frame`（邊緣＋高光＋陰影的 `box-shadow` 值）、`--aurora-glass-card-fill`、`--aurora-glass-dialog-fill`（`color-mix(in srgb, var(--color-glass) var(--aurora-glass-…), transparent)`），後面的 task 共用；`paletteContrast.test.ts` 的 `auroraGround(palette, mode): string`（從 palette 的 aurora token 與 skin 的 `--aurora-strength`、ribbon 屬性算）與 `auroraGlass(palette, mode, layer: "card" | "cell" | "peer" | "dialog"): string`。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - 每個模式的密度屬性等於 Global Constraints 的表。
  - `card`：`background-color: var(--aurora-glass-card-fill)`、`box-shadow: var(--aurora-glass-frame)`、`border-radius: 22px`；對話框、提示選單、toast 用 `--aurora-glass-dialog-fill`；toast `border-radius: 16px`、字色 foreground。
  - `dialog-scrim` 是 `color-mix(in srgb, var(--color-background) var(--aurora-scrim), transparent)`、`loader-scrim` 用 `--aurora-loader-scrim`，都沒有模糊。
  - 主要按鈕 primary 底、on-primary 字、主題色柔光陰影與 35% `glass-sheen` 上緣高光；次要按鈕 `--aurora-tint-soft` 淡底配 primary 字；外框按鈕是玻璃；危險按鈕 error 底配 `on-danger`；按鈕 `border-radius: 16px`；`text-button` 次要字色。
  - `dialog-title` 600；`icon-tile` 淡底配 primary，加 30px primary 35% 柔光；`icon-tile danger` error 14% 配 error。
  - `pill` 與圖示鍵是玻璃、全圓；`pill hint` primary 實心；`tag new-record` primary 實心加 16px 柔光；`tag step` 淡底、`tag step strong` 實心加柔光；`app-tag` 淡底。
  - 沒有玻璃墊著的字一律 foreground（spec 裁定 4）：頁首標題與返回、計時器、更新日誌說明；lucide `stroke-width: 2`、圓頭。
  - 沒有規則宣告版面屬性（偽元素除外）。
  - `REQUIRED_SELECTORS.aurora` 加 `[data-skin~="card"]`、`[data-skin~="pill"]`、`[data-skin~="toast"]`、`[data-skin~="dialog-scrim"]`。
- [ ] **Step 2: 寫失敗的對比測試。**
  - `auroraGround` 夜空每個主題與 `#107E5F`、晨光與 `#BDACFE` 每個色版差不超過 1；palette 的 `card`、`cell-clue`、`cell-peer`、`toast` 等於 `auroraGlass(…)` 用 skin 的密度算出的值（palette 與 skin 一致）。
  - `AURORA_BOARD_CASES`（四色 × 兩模式，標籤 `aurora/<theme>/<mode>: …`，涵蓋測試期望八個前綴）第一批：foreground 在 ground 上（4.5，最低約 4.62／8.62）；foreground、foreground-secondary、primary 在卡片玻璃與對話框玻璃上；primary 在淡底（卡片上）上；on-primary 在 primary 上；`on-danger` 在 error 上；toast 字在 toast 上。
- [ ] **Step 3:** 跑 `npx vitest run src/__tests__/style src/__tests__/theme/paletteContrast.test.ts`，失敗。
- [ ] **Step 4:** 照 Aurora.dc 第 296–297、360–375 行實作，兩種模式。
- [ ] **Step 5:** `npx vitest run`、lint、vue-tsc 乾淨；:5207 390×844 兩種模式看每個對話框、提示選單、toast，和畫板並排；回報差異與截圖路徑。
- [ ] **Step 6:** Commit `✨ feat: float aurora's cards, dialogs, pills and buttons as frosted glass`。

### Task 6: 首頁

**Files:**
- Modify: `src/style/styles/aurora/skin.css`、`paletteContrast.test.ts`
- Test: `auroraSkin.test.ts`、`src/__tests__/presentation/pages/home/HomeHero.test.ts`

**Interfaces:**
- Consumes: `logo`、`title`、`continue`、chip（`data-layout="chips"`）、`caret`、`new-game-card`、`segmented`／`segment`、`home-tile`；Task 5 的玻璃屬性。

- [ ] **Step 1: 寫失敗的測試。**
  - `HomeHero.test.ts`：aurora 用 `"stacked"`，有 `logo`、`title`（其他風格的版面不變）。
  - Sheet：`logo` `border-radius: 50%`、玻璃底、`box-shadow` 含 `--aurora-glass-frame` 與 `0 0 40px color-mix(in srgb, var(--color-primary) 35%, transparent)`；九個小方塊 `background-color: transparent`，`background-image` 是一顆 `radial-gradient` 圓點，`:nth-child(odd)` 用 primary、其他用 `color-mix(in srgb, var(--color-foreground) 25%, transparent)`；沒有寬高宣告。
  - `title` `font-weight: 600`（裁定 12），副標 foreground。
  - `continue`：primary 底、on-primary 字、`0 … color-mix(primary 70%)` 柔光陰影、35% `glass-sheen` 上緣高光；chip Outfit 500；夜空 chip 底 `color-mix(in srgb, var(--color-on-primary) 16%, transparent)`，晨光 chip 底 `color-mix(in srgb, var(--color-foreground) 16%, var(--color-primary))`、字 on-primary。
  - `new-game-card` 是卡片玻璃；難度 `segmented` 底 foreground 7%，選中的 `segment` 是更亮的玻璃（晨光 `glass-sheen` 實心）帶陰影；`home-tile` 是玻璃、圖示 primary。
- [ ] **Step 2: 寫失敗的對比案例**（`AURORA_BOARD_CASES`）：晨光 chip 的 on-primary 在 `mix(foreground, 0.16, primary)` 上（最低約 7.12）；夜空 chip 的 on-primary 在 `mix(on-primary, 0.16, primary)` 上；home-tile 圖示 primary 在卡片玻璃上 ≥ 3。
- [ ] **Step 3:** 跑 `npx vitest run src/__tests__/style/styles/aurora src/__tests__/presentation/pages/home/HomeHero.test.ts src/__tests__/theme/paletteContrast.test.ts`，預期 FAIL：logo、chip 的規則與新的對比案例不存在。
- [ ] **Step 4:** 照 Aurora.dc 第 298–311 行實作。「新遊戲」按鈕是主要按鈕（spec 裁定 10）。
- [ ] **Step 5:** `npx vitest run`、lint、vue-tsc 乾淨；:5207 兩種模式、兩種語言、有沒有存檔各看一次首頁，和畫板並排。
- [ ] **Step 6:** Commit `✨ feat: set aurora's Home as a glass orb over the lights`。

### Task 7: 設定、外觀、更新日誌

**Files:**
- Modify: `src/style/styles/aurora/skin.css`；畫板細節沒有 hook 時，先在獨立 ♻️ commit 補 hook（並補 `CLAUDE.md` 的 Skin hooks）
- Test: `auroraSkin.test.ts`

**Interfaces:**
- Consumes: `settings-card`、`group-heading`、`tile`、`check`、開關方塊與指示（現有 hook，照 blueprint 用的）、`segmented`／`segment`、`swatch`、`app-tag`。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - `settings-card` 是卡片玻璃；`group-heading` foreground。
  - 選項方塊、開關方塊：1px 線框 `inset 0 0 0 1px color-mix(in srgb, var(--color-foreground) 12%, transparent)`、`border-radius: 16px`、底 foreground 3%；選中的選項方塊框 2px primary；開著的開關方塊框 primary 50%、底淡底。
  - 開關指示：`::before` 是 34×20 全圓軌道（關：foreground 20%；開：primary），`::after` 是 16px `glass-sheen` 圓鈕，開著時 `transform: translateX(14px)`；寬高只寫在偽元素裡；鈕的 `transition` 在 reduced motion 停掉。
  - `segmented` 底 foreground 7%，選中的那格更亮的玻璃（晨光 `glass-sheen` 實心）。
  - `swatch` 選中時 `box-shadow` 是 `0 0 0 3px var(--color-background)`、`0 0 0 5px var(--color-primary)` 與 16px primary 柔光。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/style/styles/aurora/auroraSkin.test.ts`，預期 FAIL：設定與外觀的規則不存在。
- [ ] **Step 3:** 照 Aurora.dc 第 342–359 行實作。
- [ ] **Step 4:** `npx vitest run`、lint、vue-tsc 乾淨；:5207 兩種模式看設定、外觀（四色切換、模式切換）、更新日誌，和畫板並排。
- [ ] **Step 5:** Commit `✨ feat: lay aurora's settings and appearance on glass with a sliding switch`。

### Task 8: 統計、遊戲回顧與解題演示的頁面元件

**Files:**
- Modify: `src/style/styles/aurora/skin.css`
- Test: `auroraSkin.test.ts`

**Interfaces:**
- Consumes: `stat-heading`、`stat-card`、`stat-value`、`recent-row`、`icon-tile gave-up`、`game-result`、`game-result gave-up`、`progress-track`／`progress-fill`、`button play`、`step-dot`、`step-dot-current`、`step-dot-past`、`step-arrow`、`tag step`。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - `stat-heading` foreground、700；`stat-card` 卡片玻璃；`stat-value` 700，勝場、勝率、最佳時間 primary（照元件現有的區分）；`recent-row` 玻璃；`icon-tile` 淡底配 primary，`icon-tile gave-up` error 12% 配 error；`game-result` primary，`game-result gave-up` error。
  - `progress-track` 底 foreground 10%、全圓（高度用 `background-size` 或偽元素，不寫 `height`）；`progress-fill` 是 `linear-gradient(90deg, var(--color-aurora-1), var(--color-primary))`。
  - `button play` 44px 圓的 primary 實心加 20px 柔光（大小是元件的，skin 只設圓角與顏色）。
  - `step-dot` foreground 12% 圓點、`step-dot-past` primary 40%、`step-dot-current` primary 加 10px 柔光（20px 膠囊的寬只能畫在偽元素裡）；範例按鈕淡底配 primary。
  - `tag step` 在提示面板、遊戲回顧、解題演示三處同一個 selector。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/style/styles/aurora/auroraSkin.test.ts`，預期 FAIL：統計與播放元件的規則不存在。
- [ ] **Step 3:** 照 Aurora.dc 第 362–368、372–374 行實作。
- [ ] **Step 4:** `npx vitest run`、lint、vue-tsc 乾淨；:5207 兩種模式看統計（含放棄的遊戲）、遊戲回顧、解題演示（介紹、輸入、播放），和畫板並排。
- [ ] **Step 5:** Commit `✨ feat: glaze aurora's statistics and playback pieces`。

### Task 9: 宮角 hook（結構性）

**Files:**
- Modify: `src/presentation/components/board-cell/BoardCell.vue`、`CLAUDE.md`（Skin hooks）
- Test: `src/__tests__/presentation/components/board-cell/BoardCell.test.ts`

**Interfaces:**
- Produces: `data-box-corner: "top-left" | "top-right" | "bottom-left" | "bottom-right" | undefined`，由 `row % 3`（0 是 top、2 是 bottom）與 `column % 3`（0 是 left、2 是 right）決定，只掛在 36 個宮角格。

- [ ] **Step 1:** 全部測試綠。
- [ ] **Step 2: 寫失敗的測試**：(0,0) `top-left`、(0,2) `top-right`、(2,0) `bottom-left`、(2,2) `bottom-right`、(3,5) `top-right`、(8,6) `bottom-left`；(4,4)、(1,0)、(0,1) 沒有這個屬性；整個盤面有 36 格帶它。
- [ ] **Step 3:** 跑 `npx vitest run src/__tests__/presentation/components/board-cell/BoardCell.test.ts`，失敗。
- [ ] **Step 4:** 實作 `boxCornerOf(row: number, column: number): string | undefined`（`BoardCell.vue` 內）。`npx vitest run`、lint、vue-tsc 乾淨；`git diff --stat src/style/styles` 是空的。補 `CLAUDE.md` 的 Skin hooks（cells carry `data-box-corner` on a box's four corner cells）。
- [ ] **Step 5:** Commit `♻️ refactor: mark a box's corner cells with data-box-corner`。

### Task 10: 盤面

**Files:**
- Modify: `src/style/styles/aurora/skin.css`、`paletteContrast.test.ts`（`AURORA_BOARD_CASES` 盤面）、`styleCoverage.test.ts`
- Test: `auroraSkin.test.ts`

**Interfaces:**
- Consumes: `board`、`board-grid`、`[data-variant]`、`[data-selected]`、`[data-box-corner]`（Task 9）、`data-hint-mode`、`[data-value-kind]`、`[data-note-highlight]`；玻璃屬性（Task 5）。
- Produces: `--aurora-cell-ground`（每個 variant 設，裁定 7）；數字 `z-index: 2`、選取／答案格 `z-index: 1`（裁定 4）；格子 `::before` 留給 Task 12。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - `board` 與 `board-grid` 沒有底色、沒有陰影，`board-grid` 外框透明；`--board-line`、`--board-box-line` 是 `transparent`；`[data-variant]` 有 `background-clip: padding-box`、`background-color: var(--aurora-cell-ground)`、`border-radius: 5px`；四種 `[data-box-corner]` 各自只把那個角設成 14px。
  - 預設與題目格的 ground 是 `color-mix(in srgb, var(--color-glass-sheen) var(--aurora-sheen-cell), color-mix(in srgb, var(--color-glass) var(--aurora-glass-cell), transparent))`；`peer`、`scope` 再疊 `--aurora-sheen-peer`；`same-digit`、`pattern` 疊 `--aurora-tint-same` 的 primary，數字 primary。
  - 題目 foreground 500、玩家數字 primary 600；筆記 500 `--color-note`，`[data-note-highlight]` primary 700。
  - `selected`：ground `var(--color-primary)`、數字 on-primary、`position: relative`、`z-index: 1`、`box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 40%, transparent), 0 0 10px color-mix(in srgb, var(--color-primary) 35%, transparent)`（spec 裁定 9）。
  - `error`、`wrong`：ground 是 `--aurora-error-wash` 的 error 疊在格子玻璃上，`background-image: repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-error) var(--aurora-error-stripe), transparent) 0 2px, transparent 2px 6px)`，數字 error；規則排在 `selected`、`same-digit`、`peer` 之後；`[data-variant="error"][data-selected]` 保留斜紋與 error 數字，`box-shadow` 是 `0 0 0 2px var(--color-primary)`（裁定 2）。`selected`、`same-digit` 沒有 `background-image`。
  - 數字（`[data-variant] > div`）`position: relative`、`z-index: 2`（Review Focus 3）。
  - 提示模式：`answer` ground 是 `--aurora-tint-soft` 的 primary 疊在格子玻璃上、`inset 0 0 0 2px var(--color-primary)` 加和選取格一樣的柔光、`z-index: 1`；候選數 primary 700；強調候選數 primary 圓點配 on-primary；刪去的候選數 error、1.5px 劃線。這些 selector 不限定 `data-hint-mode`，遊戲回顧與解題演示也套到。
  - `REQUIRED_SELECTORS.aurora` 加 `[data-skin~="board"]`、`[data-box-corner`、`[data-selected]`、`[data-value-kind]`、`[data-note-highlight]`。
- [ ] **Step 2: 寫失敗的對比案例**（用 `auroraGlass` 與 skin 的屬性合成，四色 × 兩模式，沒註明的 ≥ 4.5）：題目 foreground 在格子與同列玻璃上；玩家數字 primary 在格子玻璃上（最低約 5.13）與相同數字淡底上（約 4.55）；筆記在格子與同列玻璃上；on-primary 在 primary 上（約 5.84）；primary 實心對格子玻璃 ≥ 3；錯誤選取格的 2px primary 光環對格子玻璃 ≥ 3；error 在錯誤格最深處（wash + stripe）上（約 4.87／4.71，裁定 1）；候選數 primary 在答案格淡底上；強調候選數 on-primary 在 primary 上；刪去的候選數 error 在答案格淡底與同列玻璃上 ≥ 3；palette 的 `highlight`、`cell-focus`、`error-surface` 等於這些合成色。
- [ ] **Step 3:** 跑 `npx vitest run src/__tests__/style src/__tests__/theme/paletteContrast.test.ts`，失敗。
- [ ] **Step 4:** 照 Aurora.dc 第 315–324、360、372 行實作。對比不過時只調密度、淡底或斜紋，不改字色和強調色。
- [ ] **Step 5:** `npx vitest run`、lint、vue-tsc 乾淨；:5207 兩種模式、四色：選取、相同數字、錯誤（含錯誤又選取，粉紅主題要一眼分得出三種）、提示模式每一步、遊戲回顧、解題演示播放；九宮的縫透出極光，宮角圓。
- [ ] **Step 6:** Commit `✨ feat: cut aurora's board into nine glass boxes with a lit selection and hatched errors`。

### Task 11: 按鍵與控制列

**Files:**
- Modify: `src/style/styles/aurora/skin.css`、`paletteContrast.test.ts`
- Test: `auroraSkin.test.ts`

**Interfaces:**
- Consumes: `key`、`badge`、`control`、`[data-pressed]`；玻璃屬性（Task 5）。

- [ ] **Step 1: 寫失敗的測試。**
  - Sheet：`key` `border-radius: 50%`、卡片玻璃、500；相同數字的鍵 primary 底、on-primary 字、`0 0 22px color-mix(in srgb, var(--color-primary) 60%, transparent)`；用完的鍵 `opacity: 0.35`。
  - `badge`：全圓、primary 底、on-primary 字、`0 0 0 2px var(--color-background)` 外圈。
  - `control`：平常 foreground（spec 裁定 4）、沒有底；開著時卡片玻璃上疊 `--aurora-tint-soft` 的 primary、字 primary。
  - 按下的效果只動 `transform`，在 reduced motion 停掉。
  - 對比：控制鍵 foreground 在 ground 上；開著的控制鍵 primary 在「卡片玻璃 + 淡底」上；badge on-primary 在 primary 上。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/style/styles/aurora/auroraSkin.test.ts src/__tests__/theme/paletteContrast.test.ts`，預期 FAIL：按鍵規則與控制鍵的對比案例不存在。
- [ ] **Step 3:** 照 Aurora.dc 第 338–341 行實作。
- [ ] **Step 4:** `npx vitest run`、lint、vue-tsc 乾淨；:5207 看遊戲與解題演示的數字鍵（筆記模式、擦除、剩餘數量、用完的鍵）。
- [ ] **Step 5:** Commit `✨ feat: round aurora's keys into glass and light the matching one`。

### Task 12: 填入與擦除

**Files:**
- Modify: `src/style/styles/aurora/skin.css`、`styleCoverage.test.ts`
- Test: `src/__tests__/style/styles/aurora/auroraMoments.test.ts`（新，照 `blueprintMoments.test.ts`）

**Interfaces:**
- Consumes: `.value-arrive`、`[data-arriving]`、`.value-leave`、`data-leaving-value`、`ARRIVAL_SETTLE_MS`（現有）；格子 `::before`（Task 10 留下的）。
- Produces: keyframes `aurora-arrive`、`aurora-pulse`、`aurora-leave`。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - `[data-variant] > .value-arrive` 跑 `aurora-arrive` 550ms：0% `opacity: 0`、`transform: scale(0.55)`、`text-shadow: 0 0 6px currentColor`；60% `opacity: 1`、`text-shadow: 0 0 0 currentColor`；100% `transform: scale(1)`。沒有 `filter`。
  - `[data-variant][data-arriving]::before`：`content: ""`、`position: absolute`、`inset: -2px`、`z-index: 0`、`pointer-events: none`、`background-image: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 55%, transparent), transparent 70%)`，跑 `aurora-pulse` 800ms `ease-out`：`opacity` 0.95 → 0、`transform: scale(0.4)` → `scale(1.15)`；`animationTimingOf` 量到的結束 < `ARRIVAL_SETTLE_MS`。選取格上的脈衝用同一條規則（Review Focus 5）。
  - `[data-variant].value-leave::before`：`content: attr(data-leaving-value) / ""`、字色 `currentColor`、字級跟玩家數字一樣（`--entry-scale`）、`pointer-events: none`，跑 `aurora-leave` 500ms `ease-in`：`opacity` 1 → 0、`transform` `none` → `scale(0.6)`。
  - 兩個 `::before` 規則的 `animation` 都沒有 `forwards`／`both`，結束時 `opacity: 0`（Review Focus 5）；只動 `transform`、`opacity`（arrive 另有 `text-shadow`）。
  - reduced motion 下三者 `animation: none`，`::before` 看不見。
  - `REQUIRED_SELECTORS.aurora` 加 `[data-arriving]::before`、`> .value-arrive`、`.value-leave::before`。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/style/styles/aurora`，失敗。
- [ ] **Step 3:** 實作（Aurora.dc 第 324–337 行，拿掉 `blur`，脈衝收在格子加縫內，spec 裁定 9、11）。脈衝的 `animationend` 經 `BoardCell` 的偽元素路徑結束 arriving；殘影的結束 leaving。
- [ ] **Step 4:** `npx vitest run`、lint、vue-tsc 乾淨。:5207 兩種模式：快速連續填同一格、填完馬上擦、選取格上填、復原、遊戲回顧往回走、解題演示輸入；格子上不留柔光或殘影；在 WebKit（Playwright）看一次填入，和 Chromium 一樣。
- [ ] **Step 5:** Commit `✨ feat: pulse light through aurora's cell as a digit settles and fade an erased one`。

### Task 13: 時刻：載入

**Files:**
- Create: `src/presentation/components/style-moments/aurora/AuroraLoader.vue`
- Modify: `styleMoments.ts`（`loader`）、`src/style/styles/aurora/skin.css`、`styleCoverage.test.ts`
- Tests: `src/__tests__/presentation/components/style-moments/aurora/AuroraLoader.test.ts`、`auroraMoments.test.ts`

**Interfaces:**
- Produces: `AuroraLoader` props `{ message?: string }`；class `.aurora-loader`（28px 圓角、對話框密度的玻璃）、`.aurora-loader-halo`、`.aurora-loader-dot`（`data-ring="centre" | "edge" | "corner"`）、`.aurora-loader-message`；keyframes `aurora-loader-spin`、`aurora-loader-breathe`、`aurora-loader-glow`。

- [ ] **Step 1: 寫失敗的測試。**
  - `AuroraLoader.test.ts`：一個 halo、九個點，`data-ring` 依序是 corner／edge／corner／edge／centre／edge／corner／edge／corner；`message` 沒給時是會隨語言切換的 `home.generatingPuzzle`；halo 與點都在 `aria-hidden` 的層裡。
  - `auroraMoments.test.ts`：halo 150px、四團 `radial-gradient`（aurora-1..4）排成一圈、`opacity: 0.55`、跑 `aurora-loader-spin` 7s `linear infinite`（只有 `transform: rotate`）；點跑 `aurora-loader-breathe` 2.4s infinite，延遲 centre 0s、edge 0.28s、corner 0.56s，keyframes 只有 `transform`（0%／100% `scale(0.7)`、30% `scale(1.2)`、60% `scale(1)`）；點的 `::before`（primary）與 `::after`（primary `radial-gradient` 柔光）跑 `aurora-loader-glow`，只動 `opacity`，0% 與 100% 都是 0（每輪從暗開始，裁定 10）；reduced motion 下全部 `animation: none`，centre 的 `::before`／`::after` `opacity: 1`、其他 0；沒有規則看「動態效果」設定。
  - `REQUIRED_SELECTORS.aurora` 加 `.aurora-loader-halo`、`.aurora-loader-dot`。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/presentation/components/style-moments/aurora/AuroraLoader.test.ts src/__tests__/style/styles/aurora/auroraMoments.test.ts`，預期 FAIL：找不到 `AuroraLoader.vue`。
- [ ] **Step 3:** 照 MomentsAurora 第 110–130 行實作（spec 裁定 12）。
- [ ] **Step 4:** `npx vitest run`、lint、vue-tsc 乾淨；:5207 新遊戲與解題演示的檢查各看一次。
- [ ] **Step 5:** Commit `✨ feat: breathe nine lights under a turning aurora while a puzzle loads`。

### Task 14: 時刻：完成一列、一欄、一宮

**Files:**
- Create: `src/presentation/components/style-moments/aurora/AuroraGroupOverlay.vue`
- Modify: `styleMoments.ts`（`groupOverlay`）、`src/style/styles/aurora/skin.css`、`styleCoverage.test.ts`
- Tests: `src/__tests__/presentation/components/style-moments/aurora/AuroraGroupOverlay.test.ts`、`auroraMoments.test.ts`

**Interfaces:**
- Consumes: `GroupEffect`、`groupPlacement`、`boardPercent`（現有）；`--aurora-cell-ground`（Task 10）。
- Produces: `.aurora-group-ribbon`（`data-kind="row" | "column"`）、`.aurora-group-ring`（宮）；keyframes `aurora-group-glow`、`aurora-group-sweep-x`、`aurora-group-sweep-y`、`aurora-group-ring`。

- [ ] **Step 1: 寫失敗的測試。**
  - `AuroraGroupOverlay.test.ts`：一列畫一條 `data-kind="row"` 的光帶，位置是 `groupPlacement`，`transform-origin` 的橫向位置是剛填那格的欄中心（`effect.origin.column` 為 6 時是 `(6 + 0.5) / 9`）；一欄的縱向同理；一宮畫一個 `.aurora-group-ring`，置中在那一宮；同時完成多組時都畫；新的 effect id 會重掛；全部 `aria-hidden`、`pointer-events: none`。
  - `auroraMoments.test.ts`：
    - `[data-group]` 格子跑 `aurora-group-glow` 600ms、延遲 `calc(100ms + var(--group-delay))`；keyframes 0% 與 100% 都是 `background-color: var(--aurora-cell-ground)`、35% 是 `color-mix(in srgb, var(--color-primary) 45%, var(--aurora-cell-ground))`，沒有 `box-shadow`（spec 裁定 15，Review Focus 1）；格子上 `--group-ripple-step: 45ms`；動畫掛在格子本身，不掛 `> div`。
    - 光帶 `linear-gradient(90deg, color-mix(aurora-1 70%), color-mix(primary 70%), color-mix(aurora-2 70%))`（直的用 180deg），上下（左右）兩緣 `mask-image` 與 `-webkit-mask-image` 是 `linear-gradient(…)`；跑 `aurora-group-sweep-x`／`-y` 760ms、100ms 起：`scaleX(0.1)`／`opacity: 0` → 35% `opacity: 0.9` → `scaleX(1.1)`／`opacity: 0`。
    - 宮的光環 `inset 0 0 0 2px color-mix(in srgb, var(--color-primary) 80%, transparent)` 加靜態 aurora-1 柔光 `box-shadow`，跑 `aurora-group-ring` 760ms、120ms 起：`scale(0.35)`／`opacity: 0.9` → `scale(1.12)`／`opacity: 0`；keyframes 只有 `transform`、`opacity`。
    - 每個延遲加時長：格子 100 + 600 = 700、光帶 860、光環 880，都 ≤ `groupEffectMs`（900）；宮從中心完成的光環在 `900 + 2 × GROUP_RIPPLE_STEP_MS` 內。
    - `.aurora-group-ribbon`、`.aurora-group-ring` 是 `z-index: 0`（裁定 4，Review Focus 3）。
    - reduced motion 下全部 `none`，沒有靜態提示。
  - `REQUIRED_SELECTORS.aurora` 加 `[data-group]`、`.aurora-group-ribbon`、`.aurora-group-ring`。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/presentation/components/style-moments/aurora/AuroraGroupOverlay.test.ts src/__tests__/style/styles/aurora/auroraMoments.test.ts`，預期 FAIL：找不到 `AuroraGroupOverlay.vue`。
- [ ] **Step 3:** 照 GroupAurora 第 150–170 行實作（spec 裁定 15、16、17）。
- [ ] **Step 4:** `npx vitest run`、lint、vue-tsc 乾淨。:5207：「動態效果」關掉時什麼都不出現；同時完成列和宮時兩者一起；剛填的格子是選取格時漫光完回到實心主題色；光帶經過的別格數字仍然看得清楚（Review Focus 3）。
- [ ] **Step 5:** Commit `✨ feat: sweep aurora light along completed rows and columns and ring completed boxes`。

### Task 15: 時刻：過關

**Files:**
- Create: `src/presentation/components/style-moments/aurora/AuroraCelebration.vue`
- Modify: `styleMoments.ts`（`celebration`）、`src/style/styles/aurora/skin.css`、`styleCoverage.test.ts`
- Tests: `src/__tests__/presentation/components/style-moments/aurora/AuroraCelebration.test.ts`、`auroraMoments.test.ts`

**Interfaces:**
- Consumes: `data-celebration`、`data-still`、`celebration`、`trophy`、`complete-title`（現有）；`--aurora-cell-ground`（Task 10）。
- Produces: `AuroraCelebration` props `{ still: boolean }`；class `.aurora-celebration`、`.aurora-celebration-ring`（`data-index` 0–2）、`.aurora-celebration-spark`（六個）；keyframes `aurora-surge`、`aurora-celebration-glow`、`aurora-celebration-ring`、`aurora-celebration-rise`、`aurora-card-focus`。

- [ ] **Step 1: 寫失敗的測試。**
  - `AuroraCelebration.test.ts`：根元素 `absolute inset-0`、`aria-hidden`、`pointer-events: none`，以畫面中心（卡片中心）為圓心；三道光環，第二道用 aurora-2；六顆光點 aurora-1／aurora-2 交替；`still` 時只有一道光環、沒有光點。
  - `auroraMoments.test.ts`：
    - `[data-skin~="board"][data-celebration="playing"]`：`position: relative`、`isolation: isolate`；`::before` 往外延伸到盤面的 135%（`inset: -17.5%`）、`z-index: -1`、三團 `radial-gradient`（aurora-1、aurora-2、aurora-4），跑 `aurora-surge` 1.8s 0ms 起：`scale(0.6)`／`opacity: 0` → 40% `opacity: 0.9` → `scale(1.1)`／`opacity: 0.4`；沒有 `filter`。
    - `[data-celebration="playing"] [data-variant]` 跑 `aurora-celebration-glow` 900ms，延遲 `calc(max(var(--cell-row) - 4, 4 - var(--cell-row), var(--cell-column) - 4, 4 - var(--cell-column)) * 85ms)`，keyframes 起訖 `var(--aurora-cell-ground)`、30% primary 45%；不用 `abs()`、`mod()`；最遠格 4 × 85 + 900 = 1240ms。
    - 這條規則排在 `[data-group]` 的格子規則之後、權重不低於它（裁定 8，Review Focus 2）；填入脈衝（Task 12）的規則不被它覆蓋。
    - 卡片：`[data-skin~="card"][data-skin~="celebration"]:not([data-still])` 跑 `aurora-card-focus` 640ms、100ms 起：`scale(1.04)`／`opacity: 0` → `none`／`1`；`trophy` primary 底、圖示 on-primary、靜態 `0 0 40px color-mix(in srgb, var(--color-primary) 60%, transparent)`。
    - 光環 2.4s infinite、延遲 0.1s／0.9s／1.7s：`scale(0.6)`／`opacity: 0.9` → `scale(2.6)`／`opacity: 0`，aurora-1 柔光是靜態 `box-shadow`；光點 5.5s infinite，只動 `transform`、`opacity`。
    - still（`[data-celebration="still"]`、`[data-still]`）：湧亮停在 `scale(1.1)`／`opacity: 0.4`；格子 ground 上疊 `max(0%, 22% − 11% × 距離)` 的 primary（裁定 9）、不動；光環固定 `scale(1.5)`／`opacity: 0.6`；卡片只淡入。reduced motion 下全部 `none`。
    - `STYLE_MOMENTS.aurora.celebrationBoardMs === 800`。
  - `REQUIRED_SELECTORS.aurora` 加 `[data-celebration="playing"]`、`[data-skin~="celebration"]:not([data-still])`、`[data-skin~="trophy"]`、`.aurora-celebration-ring`。
- [ ] **Step 2:** 跑 `npx vitest run src/__tests__/presentation/components/style-moments/aurora/AuroraCelebration.test.ts src/__tests__/style/styles/aurora/auroraMoments.test.ts`，預期 FAIL：找不到 `AuroraCelebration.vue`。
- [ ] **Step 3:** 照 MomentsAurora 第 132–160 行實作（spec 裁定 18、19、20）。
- [ ] **Step 4:** `npx vitest run`、lint、vue-tsc 乾淨。:5207 在「動態效果」開、關、系統減少動態三種情況各過關一次，兩種模式；360×640 與 1280×800 看湧亮沒有被裁（Review Focus 4）；最後一格同時完成一組時只看到過關的漫光。
- [ ] **Step 5:** Commit `✨ feat: surge the lights through aurora's solved board and ring the card`。

### Task 16: 文件

**Files:** `CLAUDE.md`、`README.md`

- [ ] **Step 1: `CLAUDE.md`。** 風格資料夾列表加 `aurora`；Registering a style 補 aurora 的 `STYLE_OWN_TOKENS`（`aurora-1`–`aurora-4` 四團極光，`glass`、`glass-sheen` 是用 `color-mix` 套上的來源色）、四個主題 `purple`／`teal`／`pink`／`orange`、`STYLE_MODE_NAMES` 改名 夜空／晨光；A new typeface 補 "Aurora Sans TC"（與 "Blueprint Sans TC" 同一個 `noto-sans-tc.woff2`）、`--font-aurora-sans`、`syncAuroraFonts`／`data-aurora-fonts`；Board contrast 補 `AURORA_BOARD_CASES` 由 palette 的極光 token 與 skin 的 `--aurora-*` 密度合成；Moments 補 aurora 沒有 `digitWriter`、arrival 只用 CSS（格子 `::before` 的脈衝結束它），與 `AuroraLoader`、`AuroraGroupOverlay`、`AuroraCelebration`。Task 9 已補的 `data-box-corner` 不重複。
- [ ] **Step 2: `README.md`。** 照其他風格的寫法提到 Aurora Glass（極光玻璃）：四種主題色，夜空或晨光；不計算風格數量。
- [ ] **Step 3:** `npx vitest run`、lint、vue-tsc 乾淨。
- [ ] **Step 4:** Commit `📄 docs: describe the aurora glass style, its tokens and its fonts`。

### Task 17: 效能檢查

**Files:** 不改檔案（掉格就回到對應的 task 開 🐛 fix commit，先縮小極光層的尺寸，不加回模糊）。

- [ ] **Step 1:** 開 `npx vite --port 5207 --strictPort --force`。Chrome DevTools MCP（連不上時用暫時 profile 的 headless Chrome，回報用了哪一個），390×844、夜空 purple，CPU 4× 降速（裁定 13）。
- [ ] **Step 2:** 錄 performance trace：遊戲畫面靜置 5 秒（極光在動）、連續填入與擦除、完成一列、過關。回報每段的掉格數、最長的 frame、Paint 與 Composite 的佔比；靜置時除了三層極光沒有其他圖層在重畫。
- [ ] **Step 3:** 用腳本對 `document.getAnimations()` 的每個 target，在動畫播放中讀 computed `filter`、`backdrop-filter`，全部是 `none`；回報。

### Task 18: 對照畫板的視覺驗收

**Files:** 不改檔案（發現問題就回到對應的 task，開 🐛 fix commit）。

- [ ] **Step 1:** 開 `npx vite --port 5207 --strictPort --force`。Chromium 用 Chrome DevTools MCP；WebKit 與 Firefox 用 Playwright（已快取的 `chromium-1169`、`firefox-1482`、`webkit-2158`，腳本放 scratchpad，不加進 `package.json`）。
- [ ] **Step 2: Chromium 全矩陣。** **夜空與晨光 × purple／teal／pink／orange × 中文與英文 × 390×844 與 360×640**：首頁（有、沒有存檔）、遊戲（選取、相同數字、錯誤、錯誤又選取、筆記）、提示模式每一步、完成一列／一欄／一宮、過關（湧亮、卡片、光環）、統計（含放棄的遊戲）、遊戲回顧、解題演示（介紹、輸入、播放）、設定、外觀、更新日誌、每個對話框、toast、載入。另加 1280×800 的首頁與遊戲。
- [ ] **Step 3: WebKit 與 Firefox 抽查。** 兩種模式各一個主題（夜空 pink、晨光 orange），390×844：首頁、遊戲、提示模式、外觀。
- [ ] **Step 4: 每個效果三個引擎都一樣。** 在三個引擎錄同一段（填入、擦除、完成一列、完成一宮、載入、過關、減少動態的過關），逐格截幾張並排比對；不同就回報引擎與畫面。
- [ ] **Step 5: 錯誤、選取、相同數字分得出來。** 四色 × 兩模式，各截一張同時有錯誤格、選取格、錯誤又選取、相同數字格的盤面（粉紅主題特別看），回報是否一眼分得出來。
- [ ] **Step 6: 會動的東西沒有濾鏡。** 每個效果播放中跑 Task 17 Step 3 的腳本，三個引擎都要全部 `none`。
- [ ] **Step 7: 和畫板並排。** 每張截圖和畫板同一頁比：`Aurora.dc.html`（各頁、填入、擦除）、`GroupAurora.dc.html`（列、欄、宮）、`MomentsAurora.dc.html`（載入、過關、減少動態）、`PickerC.dc.html`／`PickerFlow.dc.html`（外觀卡片、App 圖示）。在本機用瀏覽器開這些檔，切到同樣的模式和主題色。
- [ ] **Step 8:** 截圖存在 scratchpad，回報：和畫板不同的地方（每項附兩邊的截圖路徑；spec「規格裁定」或本計劃「計劃裁定」寫明的標成「依裁定」）、裁切或溢出、hook 碰不到的畫板細節、三個引擎的差異、Review Focus 五項各自的結果。
