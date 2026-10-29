# 藍圖工程 Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增第八個風格 `blueprint`（「藍圖工程」／"Blueprint"）：深色「藍曬圖」、淺色「製圖紙」兩種模式，四種紙色，方格紙底、盤外標註、繪圖筆描字、琥珀（紅筆）叉擦除，自己的 App 圖示、載入、完成一組與過關時刻。

**Architecture:**
- `blueprint` 照 tactile 的形狀註冊（兩種模式、多個主題），但每個主題用自己的 neutrals 各呼叫一次 `themeBuilder`；`STYLE_MODE_NAMES` 改名兩種模式。
- 外觀全在 `src/style/styles/blueprint/skin.css`（`[data-style="blueprint"]`）加旁邊的靜態 SVG；時刻元件在 `src/presentation/components/style-moments/blueprint/`，接到 `STYLE_MOMENTS`。
- skin 不能改版面，所以新增三個共用插槽，其他風格 DOM 與畫面都不變：盤框 `STYLE_BOARD_FRAMES`（三個盤面共用）、繼續卡的標題欄版面與 `data-caption`、外觀色票的顏色來源；首頁多一種 hero 版面。

**Tech Stack:** Vue 3 + TS + Tailwind v4、Vitest、PostCSS sheet tests（`src/__tests__/style/styleSheetRules.ts`）、`subset-font`、`harfbuzzjs`（一次性量字形外框）、`tsx` 產生器、`sharp`、Capacitor launcher aliases。

**Spec:** `docs/superpowers/specs/2026-10-29-blueprint-style-design.md`（有衝突時以 spec 為準，下面「規格裁定」列出的除外）。

**畫板（唯讀，另一個 worktree）：** `/Users/ethan/Project/sudoku/.worktrees/style-research/docs/style-research/project/`
- `Blueprint.dc.html`：約第 277–420 行是藍圖的全部規則（`.m-dark`／`.m-light` 與 `.t1`–`.t3` 主題、`.art`、`.scr`、`.sheet`、首頁、`.boardwrap`／`.collabels`／`.rowlabels`／`.dimh`／`.reg`、`.callout`、`.plot`／`.fxl` 與 `plotA`／`strokeA`／`inkA`／`headA`／`strikeA`、`.key`、`.ctl`、設定、對話框、統計、步驟、`.cell.hans`、`.nt.*`）。前面第 1–270 行是共用骨架，藍圖規則會覆蓋它。
- `GroupBlueprint.dc.html`：第 145–176 行（`bq-hatch`、`bq-snapx/y/b`、`g-fade`、`bq-acc`）。
- `MomentsBlueprint.dc.html`：第 140–190 行（`bp-plot`、`bp-pen`、`bp-dim`、`bp-tick`、`bp-xv`／`bp-xh`、`bp-hit`、`bp-ants`、`bp-lead`、`bp-draw`、`bp-spin`、`bp-stamp`）與其 reduced-motion 規則。
- `PickerC.dc.html`、`PickerFlow.dc.html`、`Main.dc.html`（第 80–90、162 行）：外觀卡片、App 圖示、總覽縮圖。`canvas.json`：`note5`、`momentsNote8`、`groupNote8`。
- 檔案很大，用 grep 找藍圖段落再讀。也可以用 Artifact `read` 加 `path` 讀 https://claude.ai/artifact/72nsZrRhPbd5nfnKt8UnWE 。

## Global Constraints

- **分支與工作目錄：** `feature/style-blueprint`，主 checkout `/Users/ethan/Project/sudoku`。不切分支、不合併到 `develop`、不碰 :5173／:5199 的 dev server。截圖用自己開的 vite：`npx vite --port 5207 --strictPort`，改過 CSS 後用 `--force` 重開。
- **TDD：** 一次一條測試，先紅再綠，綠了才重構。結構性（♻️，行為不變，前後都跑測試）和行為性 commit 分開。每次綠燈就 commit。
- **commit 門檻：** `npx vitest run` 全綠、`npm run lint` 乾淨、`npx vue-tsc --noEmit` 乾淨，沒有新警告。
- **commit 訊息：** 英文 Conventional Commits，type 前加 emoji（✨ feat、🐛 fix、♻️ refactor、📄 docs、🧪 test、🚧 chore），內文至多三點。**不加任何 trailer**：沒有 Co-Authored-By、Claude-Session 或任何產生標記。不要裸 `git stash`。
- **命名：** 識別字不縮寫（`row`／`column`，不用 `r`／`c`、`i`、`idx`、`ctx`）。只用 named export。Composition API `<script setup>`、箭頭函式、4 空格縮排。資料夾在 `presentation/` 下是 kebab-case。
- **分層：** domain 不 import `presentation/`、`stores/`、`application/`。
- **skin 規則**（`styleSheetRules.ts`／`styleSheets.test.ts`）：selector 都在 `[data-style="blueprint"]`（或 `:root[.dark][data-style="blueprint"]`）底下；keyframes 以 `blueprint-` 開頭；沒有版面宣告，除非該規則的 selector 全是 `::before`／`::after`。**`font-size`、`letter-spacing`、`line-height`、`border`／`border-width`、`padding`、`margin`、`width`、`height`、`display`、`gap`、`inset` 都算版面**：線框用 `box-shadow: inset 0 0 0 Npx` 或 `outline`；字級只能用 `--clue-scale`／`--entry-scale`／`--note-scale`／`--key-scale`，範圍 1–1.5；字距只在偽元素裡設。每個動畫都在 `@media (prefers-reduced-motion: reduce)` 停掉。
- **沒有寫死的顏色**（`hardcodedColors.test.ts`）：skin 與 `src/presentation` 的 `.vue`／`.ts` 只用 token、`color-mix()`、SVG 的 `currentColor`；遮罩 SVG 只帶 alpha。SVG 以 `url("@/style/styles/blueprint/<file>.svg")` 引用，`mask-image` 一律同時寫 `-webkit-mask-image`。
- **其他風格不變：** minimal、tactile、paper、pixel、cyber、ink、chalkboard 看起來、行為都和之前一樣。`git diff develop -- src/style/themes.generated.css` 只有 `blueprint` 的區塊。共用插槽對其他風格不產生任何 DOM。
- **效能：** 方格紙、剖面線、外框只用 CSS 漸層或靜態 SVG；任何會動的東西都不套即時濾鏡；唯一例外是過關準線上的 `box-shadow` 光暈（760ms、兩條 1px 線）。
- **標註不擋操作：** 盤框裡的引線、標籤、尺寸線、定位十字一律 `pointer-events: none`、`aria-hidden`，畫在格子外或格線上。
- **動態規則：** 「動態效果」設定管填入／擦除、完成一組、過關；載入只看系統的減少動態；完成一組在動畫關閉時完全不播、沒有靜態提示。格子動畫在 `ARRIVAL_SETTLE_MS`（1000）前結束；漣漪間距在格子上 45ms（不超過 60ms）。
- **文案：** 中文照 `CLAUDE.md`；測試只驗切換語言會換字，不驗字面。`UNRELEASED_CHANGES` 加一條「全新風格「藍圖工程」」／"New style: Blueprint"。不 bump 版本。商店與更新日誌不列出、不計算風格數量。
- **確切值：**
  - 風格 id `blueprint`，排在 `chalkboard` 後面；名稱 `settings.style.names.blueprint` 「藍圖工程」／"Blueprint"。
  - `THEME_IDS_BY_STYLE.blueprint = ["blue", "teal", "slate", "rust"]`（預設 `blue`；名稱沿用 `settings.colorThemes` 現有的 key）。
  - `STYLE_COLOR_MODES.blueprint = ["dark", "light"]`；`STYLE_MODE_NAMES.blueprint = true`；`settings.colorMode.styled.blueprint` = `{ dark: "藍曬圖", light: "製圖紙" }`／`{ dark: "Blueprint", light: "Drafting Paper" }`。
  - Launcher keys `blueprintBlue`、`blueprintBlueDark`、`blueprintTeal`、`blueprintTealDark`、`blueprintSlate`、`blueprintSlateDark`、`blueprintRust`、`blueprintRustDark`；launcher icons 29 → 37。
  - `barColors.blueprint`：dark 是各主題底色（`blue: "#123F78"`、`teal: "#0E4D5C"`、`slate: "#2B3A4E"`、`rust: "#5A3A22"`），light 四色都是 `systemBarColor` 給的 primary `#C0392B`（`noFlashScript.test.ts` 用 `systemBarColor` 比對）。
  - `STYLE_MOMENTS.blueprint`：`groupEffectMs: 900`、`celebrationBoardMs: 1300`、`cardDecoration: null`。
- **配色**（spec「目標」與「對比度的取捨」；`mix(色, 比例, 底)` 是 `mixColors`）：
  - 藍曬圖，主題 → 底／強調上的字／次要字：blue `#123F78`／`#10325F`／`#C2D4EE`；teal `#0E4D5C`／`#0A3540`／`#C2D4EE`；slate `#2B3A4E`／`#1E2A38`／`#C2D4EE`；rust `#5A3A22`／`#3E2716`／`#E8D6C2`。字 `#F2F7FF`、強調 `#FFD166`、錯誤 `#FFA39B`。
  - 製圖紙，主題 → 字／次要字：blue `#0F3A73`／`#4A6386`；teal `#0B5563`／`#3E6670`；slate `#2B3A4E`／`#56637A`；rust `#6B3A1E`／`#7A5A44`。底 `#FAFBFC`、強調（紅筆）與錯誤都是 `#C0392B`、強調上的字 `#FFFFFF`。
  - Token 對應：`background` 底；`card` 藍曬圖 `mix(#FFFFFF, .04, 底)`、製圖紙 `mix(#FFFFFF, .88, 底)`；`border`（畫板 `--line`）藍曬圖 `mix(字, .45, 底)`、製圖紙 `mix(字, .35, 底)`；`foreground` 字；`foreground-secondary`、`note` 次要字；`accent`（玩家數字）= 字；`primary` 強調；`on-primary` 強調上的字；`toast` 字、`on-toast` 底；`on-danger` 底。
  - 盤面淡底：`cell-selected` 藍曬圖 `mix(強調, .12, 底)`、製圖紙 `mix(強調, .08, 底)`；`highlight`（相同數字）藍曬圖 `mix(強調, .16, 底)`、製圖紙 `mix(強調, .08, 底)`；`error-surface` 藍曬圖 `mix(錯誤, .05, 底)`。
  - 新的 `STYLE_OWN_TOKENS`（只有藍圖的區塊會輸出）：`grid-minor`（藍曬圖 `mix(#FFFFFF, .065, 底)`、製圖紙 `#E6EDF6`）、`grid-major`（藍曬圖 `mix(#FFFFFF, .12, 底)`、製圖紙 `#D6E1EF`）、`hatch`（藍曬圖 `mix(字, .12, 底)`、製圖紙 `mix(#0F3A73, .08, 底)`，四色同一個印刷藍）、`error-hatch`（藍曬圖 `mix(錯誤, .06, 底)`、製圖紙 `mix(錯誤, .08, 底)`）。後兩個與 spec 的差異見「規格裁定」。
- **字型：** `"Blueprint Mono"`（IBM Plex Mono 400／500／600 靜態檔，可列印 ASCII 加 `·–×`）、`"Blueprint Hand"`（Architects Daughter，只有 `0123456789`）、`"Blueprint Sans TC"`（Noto Sans TC 可變 300–600，用 `chineseText` 裁）。Stacks `--font-blueprint-mono`、`--font-blueprint-hand`、`--font-blueprint-sans`。Gate `data-blueprint-fonts="ready"`。

## 從黑板粉筆學到的（每個 task 的驗收都要包含）

黑板粉筆第一版計畫之後補了三十多個 commit，這些問題在這裡事先檢查：

- **寬視窗：** 方格紙和圖框畫在 `body`，固定在視窗上（`cd6fed5`）；捲動容器和頁面本身保持透明，App 欄位兩側不出現色帶。盤面以外的東西不能被頁面捲動容器裁掉（`86acc4e`）：藍圖的盤外圖案全部畫在盤框的內距裡。
- **對比模型要涵蓋每一種墨在每一種淡底上**（`92ef212`、`12efdc2`）：提示的範圍格（剖面線）與樣式格（相同數字淡底）、答案格、解題演示與遊戲回顧的步驟答案格、強調候選數、刪去的候選數（標記，3:1）、錯誤格、盤外標籤壓在方格大線上。
- **三個盤面一起做**（`769351e`、`0fcdcac`）：提示模式、解題演示、遊戲回顧的強調候選數、步驟 tag 都要有，不能只做遊戲。
- **只用專用的 skin hook：** `home-tile` 只在首頁三個入口；放棄的遊戲有 `game-result gave-up`、`icon-tile gave-up`；toast、`recent-row`、`progress-*`、`step-dot`、`menu-divider` 都已有 hook。畫板細節沒有 hook 時，先在獨立的 ♻️ commit 加 hook（並補 `CLAUDE.md` 的 Skin hooks），再寫 skin。
- **只含數字的字型不碰其他字**（`d7b7e96`）：`Blueprint Hand` 只有數字，只用在玩家數字。
- **settle：** 數字的 arriving 只由它自己的動畫結束（`68b29eb`）；格子上的完成一組動畫命名 `blueprint-group-…`。writer 測試比較元素，不列舉元件實例（`3b37dff`）。
- **每個風格記住自己的明暗**（`4fe93a2` 已做好）：第一次選藍圖時是藍曬圖；外觀卡片預覽各自的模式；模式名稱在外觀頁和設定摘要都顯示「藍曬圖／製圖紙」。
- **App 圖示照畫板的材質畫**（`ad5365d`）：方格紙底要在圖示裡畫出來，monochrome 層只留墨線。
- **選中的按鍵照畫板**（`2274f2d`、`fdba028`）：藍圖是整顆塗滿強調色，不是淡底。

## 規格裁定

實作時遇到下面這幾處，照這裡做（理由寫在括號裡）：

1. **首頁 hero 不用 `"stacked"`，新增 `"spaced"`。** 44px、300、字距 0.5em 的標題和字距 0.2em 的副標都是版面宣告，skin 不能寫；黑板粉筆的 `"headline"` 就是這樣放進 `HomeHero.vue`。`"spaced"` = `stacked` 的 logo 加上這組字級與字距。
2. **字級與字距：** spec 裡小於元件基準的字級（題目 18px、按鍵 22px、筆記 9.5px、toast 12px）維持元件原本的大小（scale 只能 1–1.5）。玩家數字對題目的比例照畫板 23:18：`--clue-scale: 1`、`--entry-scale: 1.25`。按鈕、pill、對話框標題、分節標題的字距不做（skin 只能在偽元素設字距）；`data-caption`、`B-01`、`A1`–`A3`、盤框標籤這些偽元素或元件自己畫的字照畫板字距。
3. **盤面鋪紙色：** `board-grid` 底色是 `background`，頁面的方格紙停在盤面外框。（畫板的格子透明，方格大線會從數字底下穿過；製圖紙的紅筆在大線 `#D6E1EF` 上只有 4.11，spec 的表沒有算到。）
4. **製圖紙的剖面線從 13% 降到 8%。** 紅筆的相同數字筆記會落在剖面線上：13% 只有 4.16，8% 是 4.58。照 spec 自己的原則「調淡底、線或材質，不改字色和強調色」。
5. **錯誤格：** 錯誤格的底蓋過剖面線和相同數字淡底，所以錯誤數字從不壓在字色剖面線上（藍曬圖青綠在那上面只有 3.61）。錯誤格只鋪錯誤色剖面線、不再疊平塗淡底：線是 `error-hatch`，藍曬圖 6%（青綠最低 4.52）、製圖紙 8%（4.65）。spec 的「錯誤淡底 5%」留在 `error-surface` token；疊在剖面線下面會讓青綠掉到 4.5 以下。
6. **提示的範圍格用剖面線，樣式格用相同數字淡底**（黑板粉筆 `12efdc2` 的做法；spec 沒寫）。
7. **盤框右側內距用畫板的 12px**（spec 只寫左、上、下）。四個內距都要扣掉盤面元素自己的 `p-2`（8px），讓標籤對齊 `board-grid` 的格子：盤框內距 上 10、右 4、下 16、左 14px，多出的高度 26px。
8. **解題演示播放中只標有填數的步驟：** 標第一個 `assignment` 的格子；只有刪去候選數的步驟和最後的「完成」不標。
9. **完成一宮時盤外的 R／C 標籤不亮**：只有列亮 R、欄亮 C（GroupBlueprint 的 `bq-acc` 只寫了這兩種）。
10. **digitWriter 畫外框用 `<path>` 不用 `<text>`：** 每個數字的外框從打包後的 Architects Daughter 量一次，存成 path，加 `pathLength="1"`，`stroke-dasharray: 1` 從 offset 1 跑到 0。`<text>` 的描邊長度在瀏覽器裡量不到，各瀏覽器的 dash 也不一致；這樣九個數字的外框一定描得完。
11. **過關的鎖定虛線框和「R1–R9 · C1–C9 OK」標註由盤框元件畫**（spec 允許「由元件畫 SVG 自己跑 `stroke-dashoffset`」）：盤框有地方放引線，寬視窗也不會被裁掉。十字準線照 spec 畫在盤面的 `::before`。盤框因此多收一個 `celebration` prop。
12. **畫板以外的時間點：** 遮罩在 1300ms 打開，所以卡片、獎盃、印章的延遲從 modal 掛上時起算：卡片 60ms 起畫 520ms，獎盃虛線圈 580ms，印章 700ms。
13. **外觀色票：** 藍圖的 primary 四色都一樣，所以色票改用模式決定：藍曬圖用底色（換紙），製圖紙用字色（換墨），勾號用另一個。

## Review Focus

1. **矮螢幕（360×640）上的藍圖遊戲畫面：** 盤框多出 26px 高，數字鍵仍然完全在畫面裡，三個盤面一樣大。→ Task 8 的測試（`max-w-board-fit` 會扣掉 `--board-frame-block`），Task 9 的 360×640 截圖。
2. **選取標註在邊角格：** R1C1、R1C9、R9C1、R9C9 的引線和標籤都看得到、不被裁、不蓋住數字、點得到底下的格子；第 7–9 欄往左拉。→ Task 9 的元件測試與截圖。
3. **標註跟著狀態走：** 換選取格、進出提示模式（改標答案格）、過關（不標）、遊戲回顧第 0 步（不標）、解題演示輸入與播放、只刪候選數的步驟（不標）。→ Task 8 的頁面測試。
4. **快速連續輸入與擦除：** 前一個數字還在描時輸入下一個，writer 用新的 mask id 重掛，不卡輸入；擦掉後馬上在同一格填數，叉和殘影不留下來；Safari／iOS 沒有 writer，數字直接出現。→ Task 12、13 的測試與手動步驟。
5. **製圖紙的「錯了」和「選中」分得出來：** 紅筆同時是錯誤色，錯誤格要靠剖面線認出來，選取格、相同數字只有平塗淡底；四種墨色、兩種模式的每一種墨在每一種淡底上都過對比。→ Task 10 的 sheet 測試與 `BLUEPRINT_BOARD_CASES`。

---

### Task 1: 註冊 `blueprint` 與它的配色

`blueprint` 在外觀頁可以選，兩種模式、四種紙色都對。skin 是空殼，圖示暫時只有底色（Task 3），時刻先借 minimal 的（Task 14–16），hero 先用 `"stacked"`（Task 6）。

**Files:**
- Create: `src/style/styles/blueprint/palette.ts`、`src/style/styles/blueprint/skin.css`（空殼：press hooks 和 reduced-motion 區塊）
- Modify: `src/theme/themeIds.ts`、`src/theme/paletteBuilder.ts`（`STYLE_OWN_TOKENS` 加四個）、`src/theme/palettes.ts`、`src/style/index.css`（import）、`src/theme/styleIcons.ts`（`blueprint` 只畫底色）、`src/presentation/components/style-moments/styleMoments.ts`、`src/presentation/pages/home/homeHeroes.ts`、`index.html`（`barColors`）、`src/presentation/i18n/messages/{zh-Hant,en}.ts`、`src/presentation/pages/settings/changelogData.ts`
- Generated: `src/style/themes.generated.css`、`public/*blueprint*`、Android launcher 資源與 manifest aliases
- Tests: `src/__tests__/theme/{palettes,paletteContrast,launcherIcon,themeIds}.test.ts`、`src/__tests__/presentation/theme/noFlashScript.test.ts`、`src/__tests__/presentation/pages/settings/{Appearance,Settings}.test.ts`、`src/__tests__/stores/settingsStore.test.ts`、`src/__tests__/style/styleCoverage.test.ts`

**Interfaces:**
- Produces: `BLUEPRINT_STYLE: StyleDefinition`；`STYLE_IDS` 最後是 `"blueprint"`；`STYLE_OWN_TOKENS` 多了 `"grid-minor"`、`"grid-major"`、`"hatch"`、`"error-hatch"`（CSS 變數 `--color-grid-minor` 等）；`STYLE_MOMENTS.blueprint`；`REQUIRED_SELECTORS.blueprint`（先只有 press hooks）；`BLUEPRINT_BOARD_CASES`（先是空的骨架與涵蓋測試）。

- [ ] **Step 1: 寫失敗的測試。**
  - `palettes.test.ts`：`STYLES.blueprint.themes.map(theme => theme.id)` 等於 `["blue", "teal", "slate", "rust"]`；`getPalette("blueprint", "teal", "dark")` 的 background `#0E4D5C`、on-primary `#0A3540`、primary `#FFD166`、error `#FFA39B`、accent 等於 foreground `#F2F7FF`；`getPalette("blueprint", "rust", "light")` 的 foreground `#6B3A1E`、foreground-secondary `#7A5A44`、background `#FAFBFC`、primary 與 error 都是 `#C0392B`；四個主題的 dark `hatch` 都等於 `mixColors("#F2F7FF", 0.12, background)`，四個 light `hatch` 都一樣。
  - `palettes.test.ts`：只有 blueprint 的 palette 帶 `grid-minor`／`grid-major`／`hatch`／`error-hatch`。
  - `launcherIcon.test.ts`：37 個圖示，八個 `blueprint*` key 都在；`pwaIconKey("blueprint", "slate") === "blueprintSlate"`。
  - `noFlashScript.test.ts`（Review Focus 5 的前提）：存了 `{ style: "blueprint", colorTheme: "teal" }`、系統深色時畫 `dark` 與 `#0E4D5C`；系統淺色時沒有 `dark`、theme-color 是 `systemBarColor("blueprint", "teal", "light")`。
  - `settingsStore.test.ts`：第一次切到 blueprint 是 dark，主題是 `blue`。
  - `Appearance.test.ts`：風格卡片最後是 `style-option-blueprint`；選了 blueprint 後，模式控制顯示改名的模式（切換語言會換字），有四個 `color-theme-*`。
  - `Settings.test.ts`：blueprint 時外觀摘要用改名的模式。
- [ ] **Step 2:** 跑這些測試，因為 `blueprint` 不存在而失敗。
- [ ] **Step 3: 寫配色。** `palette.ts` 對每個主題組自己的 `Neutrals<LightThemeColors>`、`Neutrals<DarkThemeColors>` 和 extras，各呼叫一次 `themeBuilder(lightNeutrals, darkNeutrals, lightExtras, darkExtras)(id, light, dark)`，值照 Global Constraints 的「配色」。不改 `themeBuilder`。
- [ ] **Step 4: 讓對比測試接受藍圖。** 一般規則只因為藍圖的格子是透明淡底而不適用時，加 `exceptIn: ["blueprint"]`（或 `"blueprint/light"`），每一個都在旁邊寫原因。新增 `BLUEPRINT_BOARD_CASES` 骨架與涵蓋測試，期望八個標籤 `blueprint/<theme>/<mode>`；Task 10 填內容。
- [ ] **Step 5: 註冊與產生。** ids、`STYLES`、`styleIcons.ts` 的 `blueprint` 只回傳底色、i18n 名稱、`barColors`、`homeHeroes.blueprint = "stacked"`、空殼 skin（在 `index.css` import）、`BLUEPRINT_MOMENTS = { loader: MinimalLoader, celebration: null, cardDecoration: null, groupEffectMs: 900, celebrationBoardMs: 1300 }`、`UNRELEASED_CHANGES` 那一條。跑 `npm run generate:theme-css`、`generate:icons`、`generate:launcher-icons`。
- [ ] **Step 6:** `git diff develop -- src/style/themes.generated.css` 只有 blueprint 區塊。全部測試（包含 `iconAssets`、`launcherIconAssets`、`AndroidManifest`）、lint、vue-tsc 都乾淨。
- [ ] **Step 7:** Commit `✨ feat: add the blueprint style with its blueprint and drafting paper palettes`。

### Task 2: 外觀色票跟著紙色和墨色

**Files:**
- Modify: `src/theme/palettes.ts`、`src/presentation/pages/settings/Appearance.vue`
- Test: `src/__tests__/theme/palettes.test.ts`、`src/__tests__/presentation/pages/settings/Appearance.test.ts`

**Interfaces:**
- Produces: `swatchColors(style: StyleId, mode: ColorMode, palette: Palette): { fill: string; mark: string }`；預設 `{ fill: palette.primary, mark: palette["on-primary"] }`；blueprint 的 dark 是 `{ fill: background, mark: foreground }`、light 是 `{ fill: foreground, mark: background }`。色票按鈕加 `data-skin="swatch"`。

- [ ] **Step 1:** 寫 `swatchColors` 對 minimal 回傳 primary／on-primary 的測試（和現在的色票一樣）。跑，失敗。
- [ ] **Step 2:** 實作預設分支，`Appearance.vue` 改用它，色票加 `data-skin="swatch"`。全部測試綠，Appearance 的既有測試不改。Commit `♻️ refactor: take the appearance swatches' colours from one helper`。
- [ ] **Step 3:** 寫失敗的測試：blueprint dark 的四個色票 fill 是四個底色、互不相同；light 是四個墨色；`Appearance.test.ts` 選 blueprint 時四個 `color-theme-*` 的 `background-color` 互不相同。
- [ ] **Step 4:** 加 blueprint 分支。全部測試、lint、vue-tsc 乾淨。
- [ ] **Step 5:** Commit `✨ feat: show blueprint's swatches as its papers and inks`。

### Task 3: 藍圖的 App 圖示

**Files:**
- Modify: `src/theme/styleIcons.ts`
- Generated: `public/*blueprint*`、Android launcher 資源
- Test: `src/__tests__/theme/styleIcons.test.ts`

**Interfaces:**
- Consumes: `BLUEPRINT_STYLE`（Task 1）。
- Produces: `styleIconArtwork`／`styleIconForeground`／`styleIconMonochrome` 的 `blueprint` 分支。

- [ ] **Step 1: 寫失敗的測試。**
  - `styleIconSvg("blueprint", getPalette("blueprint", "blue", "dark"))` 含 `#123F78`、`#F2F7FF`、`#FFD166` 和 grid-major，不含 `<text`；`getPalette("blueprint", "teal", "light")` 的含 `#FAFBFC`、`#0B5563`、`#C0392B`。
  - 八張圖（四色 × 兩模式）的 SVG 互不相同。
  - 中央那格的虛線框是 `stroke-dasharray="3 2"`；`9×9` 是 path。
  - monochrome 層只用一個顏色，只有墨線和虛線框（沒有方格紙）。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3: 畫圖示。** 照 spec「App 圖示」與 PickerC／PickerFlow 的藍圖圖示：方格紙底（9 單位小格，`--ai-minor` = `grid-major`）、中央 48 單位的 3×3 盤（外框 2.2、內線 1，`--ai-ink` = foreground）、上方和右側帶箭頭的尺寸線、中央格強調色虛線框、往右上的引線、`9×9` 的 path（從 Blueprint Mono 的字形轉出一次，在註解裡寫怎麼轉的）。不用 filter。
- [ ] **Step 4:** 跑 `generate:icons`、`generate:launcher-icons`；在 :5207 的外觀頁看卡片，和畫板比。全部測試、lint、vue-tsc 乾淨。
- [ ] **Step 5:** Commit `✨ feat: draw the blueprint app icons in each paper and mode`。

### Task 4: 三套字型

**Files:**
- Modify: `scripts/generate-fonts.ts`、`src/style/fonts.css`、`src/style/index.css`（三個 stack）、`src/presentation/theme/appearanceSync.ts`
- Create: `src/style/styles/blueprint/fonts.ts`、`src/assets/fonts/{blueprint-mono-regular,blueprint-mono-medium,blueprint-mono-semibold,architects-daughter,noto-sans-tc}.woff2`、`public/fonts/licenses/{IBMPlexMono,ArchitectsDaughter,NotoSansTC}-OFL.txt`
- Tests: `src/__tests__/style/bundledFonts.test.ts`、`src/__tests__/style/styles/blueprint/fonts.test.ts`（新）、`src/__tests__/presentation/theme/appearanceSync.test.ts`

**Interfaces:**
- Produces:
  - 來源：`ofl/ibmplexmono/IBMPlexMono-{Regular,Medium,SemiBold}.ttf`、`ofl/architectsdaughter/ArchitectsDaughter-Regular.ttf`、`ofl/notosanstc/NotoSansTC[wght].ttf`（`weights: { min: 300, max: 600 }`，`text: chineseText`）。Mono 的字元是 U+0020–U+007E 加 `·–×`；Hand 是 `0123456789`。
  - `--font-blueprint-mono: "Blueprint Mono", "Blueprint Sans TC", ui-monospace, monospace`；`--font-blueprint-hand: "Blueprint Hand", "Blueprint Mono", "Blueprint Sans TC", cursive`；`--font-blueprint-sans: "Blueprint Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif`。
  - `syncBlueprintFonts(active: boolean): void` = `markFontsReady({ style: "blueprint", datasetKey: "blueprintFonts", faces: ['400 16px "Blueprint Mono"', '500 16px "Blueprint Mono"', '600 16px "Blueprint Mono"', '16px "Blueprint Hand"', '300 16px "Blueprint Sans TC"'], sample: "R5C5 0123456789 藍圖" })`，在 `appearanceSync.ts` 以 `syncBlueprintFonts(style === "blueprint")` 呼叫。

- [ ] **Step 1: 寫失敗的測試。**
  - `bundledFonts.test.ts`：五個檔都在、保留授權的 name table、Mono 涵蓋可列印 ASCII 與 `·–×`、Hand 涵蓋且只涵蓋 `0123456789`、Sans TC 涵蓋 `chineseText`。
  - `fonts.test.ts`：三個 stack 的前幾個 family 如上；`Blueprint Mono`／`Blueprint Hand`／`Blueprint Sans TC` 不出現在任何其他風格的 stack；`@font-face` 用 `font-display: swap`；gate 只在五個 face 都 `loaded` 時標記、離開 blueprint 時拿掉、沒有 `document.fonts` 時什麼都不做。
  - `appearanceSync.test.ts`：style 是 blueprint 時以 `true` 呼叫 `syncBlueprintFonts`。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3: 實作。** 產生器 job 用釘住的 commit；跑 `npm run generate:fonts`，回報五個檔的大小。
- [ ] **Step 4:** 全部測試、lint、vue-tsc、`npm run build` 乾淨。
- [ ] **Step 5:** Commit `✨ feat: bundle IBM Plex Mono, Architects Daughter and Noto Sans TC for blueprint`。

### Task 5: 紙面與共用元件

**Files:**
- Modify: `src/style/styles/blueprint/skin.css`、`src/__tests__/style/styleCoverage.test.ts`
- Test: `src/__tests__/style/styles/blueprint/blueprintSkin.test.ts`（新，PostCSS，照 `chalkboardSkin.test.ts`）

**Interfaces:**
- Consumes: 現有 hooks（`page-ruled`、`page`、`page-header`、`card`、`button`、`pill`、`pill hint`、`tag`、`tag new-record`、`tag step`、`tag step strong`、`app-tag`、`icon-tile`、`icon-tile danger`、`dialog-title`、`loader-scrim`、`menu-divider`、`toast`、`caret`）；字型 gate（Task 4）。
- Produces: `--blueprint-frame`（1px 字色內框的 `box-shadow` 值）、`--blueprint-frame-strong`（1.5px）、`--blueprint-double-frame`（1.5px 框、5px 底色、0.75px 細線），後面的 task 共用。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - `body` 的 `background-color: var(--color-background)`，`background-image` 四層漸層（`--color-grid-major` 40px、`--color-grid-minor` 8px），`background-attachment: fixed`；`body::before` 固定、內縮 10px、1.5px `--color-border` 圖框，`body::after` 再內縮 4px 的 0.75px 細框加上緣每 25% 的刻度（畫板 `.sheet`），兩者 `pointer-events: none`、在內容底下；`page-ruled`／`page`／`page-header` 的背景透明。
  - 在 `[data-blueprint-fonts="ready"]` 下，介面文字用 `--font-blueprint-sans`，`--font-clue`／`--font-key`／`--font-timer`／`--font-note` 指向 `--font-blueprint-mono`，`--font-entry` 指向 `--font-blueprint-hand`；`[data-skin~="title"]` 與 `dialog-title` 的 `font-weight` 分別是 300 與 500。
  - lucide 圖示（`svg.lucide`）`stroke-width: 1.5`、`stroke-linecap: square`、`stroke-linejoin: miter`。
  - `card`、`button`、`pill`、`tag`、`icon-tile`、`toast` 的 `border-radius: 0`；`trophy` 保留圓形。
  - `card` 底色 `var(--color-background)`，`box-shadow` 是雙框；`loader-scrim` 與對話框遮罩是 `color-mix(in srgb, var(--color-background) 72%, transparent)`。
  - 主要按鈕強調色底；次要和外框按鈕透明底配 1px 字色內框；危險按鈕錯誤色底配底色字；`icon-tile` 1px 字色內框，`icon-tile danger` 錯誤色內框。
  - `pill` 1px 字色內框，`pill hint` 強調色底；`tag new-record` 2px 強調色內框、強調色字、Mono、`transform: rotate(-6deg)`；`tag step` 1px 字色內框，`tag step strong` 強調色底；`app-tag` 1px 強調色內框；`toast` 字色底配底色字、Mono；提示選單方角，「揭示一格」強調色。
  - 沒有任何規則宣告 `border`、`letter-spacing`、`font-size`（除了偽元素）；淺色模式沒有寫死的顏色。
  - `REQUIRED_SELECTORS.blueprint` 加 `body::before`、`[data-skin~="card"]`、`[data-skin~="pill"]`、`[data-skin~="toast"]`。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3:** 照 Blueprint.dc 第 298–301、400–420 行寫 skin，兩種模式。
- [ ] **Step 4:** 全部測試、lint、vue-tsc 乾淨。
- [ ] **Step 5:** Commit `✨ feat: lay blueprint's screens on graph paper inside a drawing frame`。
- [ ] **Step 6: 截圖檢查。** :5207，390×844 與 1280×800，兩種模式：每個對話框、提示選單、toast；寬視窗兩側沒有色帶。回報和畫板不同的地方與截圖路徑。

### Task 6: 首頁

**Files:**
- Modify: `src/presentation/pages/home/homeHeroes.ts`、`src/presentation/pages/home/HomeHero.vue`、`src/presentation/components/continue-button/ContinueButton.vue`、`src/presentation/i18n/messages/{zh-Hant,en}.ts`、`src/style/styles/blueprint/skin.css`、`CLAUDE.md`（Skin hooks）
- Create: `src/presentation/components/continue-button/continueLayouts.ts`、`src/style/styles/blueprint/blueprint-logo.svg`
- Tests: `src/__tests__/presentation/pages/home/{HomeHero,Home}.test.ts`、`src/__tests__/presentation/components/continue-button/ContinueButton.test.ts`、`blueprintSkin.test.ts`

**Interfaces:**
- Produces:
  - `HomeHeroLayout` 多 `"spaced"`：logo、標題 44px `font-light` `[letter-spacing:.5em]` `mr-[-.5em]`、副標 `[letter-spacing:.2em]`（用屬性寫，不用 `tracking-*`，理由同 `HomeHero.vue` 的註解）；`STYLE_HOME_HEROES.blueprint = "spaced"`。
  - `CONTINUE_LAYOUTS: Record<StyleId, "chips" | "title-block">`（只有 blueprint 是 `"title-block"`）；`ContinueButton` 根元素帶 `data-layout`，`title-block` 時用元件自己的 class：上列 `py-3 px-4` 加下方分隔，三個 chip 等寬（`flex-1`）、直排、`px-3 py-2`、chip 之間以 1px 線分隔（`border-r` 用 `border-border`，最後一個沒有）、圓角與內距歸零。
  - 每個 chip 都有 `data-caption`，i18n `home.continueCaptions.difficulty`／`time`／`progress`（「難度」「時間」「進度」／"Difficulty" "Time" "Progress"）。

- [ ] **Step 1:** `ContinueButton.test.ts`：三個 chip 都有 `data-caption`，切換語言會換字；minimal 下 `data-layout="chips"`，class 和現在一樣。跑，失敗。
- [ ] **Step 2:** 實作 `data-caption`、`CONTINUE_LAYOUTS`（全部 `"chips"`）、`data-layout`。全部測試綠。補 `CLAUDE.md` 的 Skin hooks（`data-caption`、`data-layout`）。Commit `♻️ refactor: add a title-block layout and captions to the continue card`。
- [ ] **Step 3: 寫失敗的測試。**
  - `ContinueButton.test.ts`：blueprint 下 `data-layout="title-block"`，三個 chip 有 `flex-1`。
  - `HomeHero.test.ts`：blueprint 用 `"spaced"`，有 `logo`、`title`；其他風格的版面不變。
  - Sheet：`[data-skin~="logo"]` 以 `blueprint-logo.svg` 遮罩、`background-color: var(--color-foreground)`；`blueprint-logo.svg` 沒有 `<text>`、沒有 `<filter>`（3×3 方格、上方與右側帶箭頭的尺寸線、中央小圓加引線、一個定位十字）。
  - Sheet：`continue` 1.5px 字色框、`caret` 強調色、chip 的 `::before` 是 `content: attr(data-caption) / ""`、次要字色；`new-game` 1.5px 框；難度 `segmented` 方格、選中的 `segment` 反白（字色底、底色字）；`home-tile` 1px 框，`::before` 以 `counter` 標 `A1`–`A3`（Mono、次要字色），圖示字色。
- [ ] **Step 4:** 跑，失敗。
- [ ] **Step 5:** 實作（Blueprint.dc 第 299–322 行）。
- [ ] **Step 6:** 全部測試、lint、vue-tsc 乾淨；:5207 兩種模式、兩種語言、有沒有存檔各看一次首頁。
- [ ] **Step 7:** Commit `✨ feat: draw blueprint's Home as a drawing with a title block`。

### Task 7: 設定、外觀、統計、回顧與演示的頁面元件

**Files:**
- Modify: `src/style/styles/blueprint/skin.css`；需要時在獨立 ♻️ commit 補 hook（例如選項方塊、開關方塊、播放鍵）
- Test: `blueprintSkin.test.ts`

**Interfaces:**
- Consumes: `group-heading`、`tile`、`check`、`segmented`／`segment`、`swatch`（Task 2）、`recent-row`、`icon-tile gave-up`、`game-result`、`progress-track`／`progress-fill`、`step-dot`、`tag step`；`--blueprint-frame*`（Task 5）。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - 設定區塊 1.5px 字色框；捲動容器 `counter-reset`，`group-heading::after` 以 `counter` 標 `B-01`、`B-02`……（Mono 11px、次要字色）。
  - 選項方塊、開關方塊 1px 方框，選中時強調色框加一圈內框；開關指示 16px 方框（畫在偽元素），開著時裡面一個強調色的叉（兩條漸層斜線）。
  - `swatch` 方形，選中時兩圈強調色框（`box-shadow`，畫板 `.sw.on`）；`segmented` 方格、直線分隔、選中反白。
  - 統計：分節標題 Mono 500；數字 Mono 500，最佳時間強調色；`recent-row` 的 `icon-tile` 1px 方框，`icon-tile gave-up` 錯誤色框；`game-result` 與 `game-result gave-up` 都用字色。
  - 進度條像尺：`progress-track` 1px 內框加每 10% 一條刻度，`progress-fill` 4px 強調色（高度用偽元素或 `background-size`，不寫 `height`）；播放鍵 1.5px 強調色框的方鍵；`step-dot` 方點、次要字色框，目前那點強調色、走過的半透明次要字色；範例按鈕 1px 框。
  - `tag step` 在提示面板、解題演示、遊戲回顧三處都套到（同一個 selector，不依頁面限定）。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3:** 實作（Blueprint.dc 第 384–399、406–415 行）。
- [ ] **Step 4:** 全部測試、lint、vue-tsc 乾淨；:5207 兩種模式看設定、外觀、更新日誌、統計（含放棄的遊戲）、遊戲回顧、解題演示（介紹、輸入、播放）。
- [ ] **Step 5:** Commit `✨ feat: rule blueprint's settings, statistics and playback like a drawing`。

### Task 8: 盤框插槽（結構性）

三個盤面經過同一個模組掛 `STYLE_BOARD_FRAMES[style]`；所有風格都是 `null`，DOM 和畫面都不變。

**Files:**
- Create: `src/presentation/components/board-frame/boardFrames.ts`、`src/presentation/components/board-frame/BoardFrame.vue`
- Modify: `src/presentation/pages/game/GameScreen.vue`、`src/presentation/pages/game-review/GameReview.vue`、`src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue`、`src/style/index.css`（`max-w-board-fit`）、`CLAUDE.md`
- Tests: `src/__tests__/presentation/components/board-frame/BoardFrame.test.ts`（新）、`src/__tests__/presentation/pages/{game/GameScreen,game-review/GameReview,solver-walkthrough/SolverWalkthrough}.test.ts`（照現有檔名）

**Interfaces:**
- Produces:
  - `interface BoardFrameProps { target: CellReference | null; effect: GroupEffect | null; celebration: CelebrationPhase | null }`
  - `STYLE_BOARD_FRAMES: Record<StyleId, Component | null>`（全部 `null`）、`useBoardFrame(): ComputedRef<Component | null>`。
  - `BoardFrame.vue`：props 同上，預設 slot；有元件時 `<component :is="frame" v-bind="props"><slot /></component>`，沒有時只渲染 slot（沒有包裝元素）。
  - 三頁用 `BoardFrame` 包住 `[data-skin="board"]` 元素：
    - 遊戲：`celebration !== null` 時 `null`；提示模式時 `hintMode.answer.value?.cell ?? null`；否則選取格。`effect` 是 `groupEffect`，`celebration` 是 `celebration`。
    - 遊戲回顧：`changedCell`，`effect`／`celebration` 是 `null`。
    - 解題演示：可編輯時是選取格；播放中是 `currentStep.value?.step.assignments[0]?.cell ?? null`；其他 `null`。
  - `max-w-board-fit` 改成多扣 `var(--board-frame-block, 0px)`；盤框元件在自己的元素上設這個變數，盤面就縮掉盤框多出的高度。

- [ ] **Step 1:** 全部測試綠。
- [ ] **Step 2: 寫測試**（目前就該綠，用來釘住行為）：`BoardFrame.test.ts` 在 frame 為 `null` 時只渲染 slot 的內容，沒有多的元素；用 `vi.mock` 換成一個 stub frame 時，stub 收到 `target`／`effect`／`celebration`。三個頁面測試用 stub frame 驗 Review Focus 3：遊戲選取格 → 該格；進提示模式 → 答案格；過關 → `null`；回顧第 0 步 → `null`、走一步 → 改到的格；演示輸入 → 選取格；播放中有填數的步驟 → 第一個 assignment 的格；只刪候選數的步驟與完成 → `null`。另一條：`index.css` 的 `max-w-board-fit` 含 `var(--board-frame-block, 0px)`。
- [ ] **Step 3:** 實作，讓上面的測試綠；其他風格的頁面測試一條都不用改。
- [ ] **Step 4:** 全部測試、lint、vue-tsc 乾淨；`git diff --stat src/style/styles` 是空的。`CLAUDE.md` 的架構與 Skin hooks 寫上 `STYLE_BOARD_FRAMES`、它收到的 props、`--board-frame-block`。
- [ ] **Step 5:** Commit `♻️ refactor: add a board frame slot shared by the game, review and walkthrough boards`。

### Task 9: 藍圖的盤框

**Files:**
- Create: `src/presentation/components/board-frame/blueprint/BlueprintBoardFrame.vue`
- Modify: `boardFrames.ts`（`blueprint: BlueprintBoardFrame`）、`src/presentation/i18n/messages/{zh-Hant,en}.ts`
- Test: `src/__tests__/presentation/components/board-frame/blueprint/BlueprintBoardFrame.test.ts`

**Interfaces:**
- Consumes: `BoardFrameProps`、`--board-frame-block`（Task 8）、`cellName`。
- Produces: class `.blueprint-frame`、`.blueprint-frame-label`（`data-axis="row" | "column"`、`data-index`）、`.blueprint-frame-dimension`、`.blueprint-frame-register`、`.blueprint-callout`（`data-direction="right" | "left"`）、`.blueprint-callout-text`；i18n `game.boardFrame.columns`（「{n} 欄」／"{n} cols"）。Task 15、16 再加效果。

- [ ] **Step 1: 寫失敗的測試。**
  - 渲染 C1–C9、R1–R9、底部尺寸線（文字是 `game.boardFrame.columns`，參數 9，切換語言會換字）和四個定位十字，全部在一個 `aria-hidden` 的層裡，`pointer-events: none`。
  - 元素設 `--board-frame-block: 26px`；內距 上 10、右 4、下 16、左 14px（規格裁定 7）。
  - `target` 是 `{ row: 4, column: 4 }` 時有 `.blueprint-callout`，文字 `R5C5`，`data-direction="right"`；第 7–9 欄（`column` 6–8）是 `left`；`target` 是 `null` 時沒有標註。
  - 標註放在目標格的右上角（往左時是左上角），以格子的百分比位置定位，不量 DOM；四個角落格（Review Focus 2）的標註都在盤框元素內或往外延伸、不被 `overflow: hidden` 裁切（盤框與它的祖先 `board` 沒有 `overflow: hidden`）。
  - 換 `target` 時標註跟著移動，不重掛整個盤框。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3: 實作。** 元件 scoped CSS 照畫板 `.collabels`／`.rowlabels`（Mono 10px、`foreground-secondary`）、`.dimh`（兩端擋線，文字放在底色小塊上，字距 0.1em）、`.reg`（12px 圓加十字，`foreground-secondary`）、`.callout`（強調色引線 24px、1.5px、斜 38°；標籤 Mono 11px 600、`primary` 底配 `on-primary`）。標籤對齊 `board-grid` 的格子（在盤面的 `p-2` 裡）。盤框讓 slot 裡的盤面寬度填滿自己，自己承接盤面原本的置中與寬度。
- [ ] **Step 4:** 全部測試、lint、vue-tsc 乾淨。:5207 截 360×640 與 390×844 的遊戲、回顧、演示（Review Focus 1）：數字鍵完全在畫面裡、三個盤面一樣大；四個角落格的標註（Review Focus 2）。
- [ ] **Step 5:** Commit `✨ feat: dimension blueprint's board and call out the chosen cell`。

### Task 10: 盤面

**Files:**
- Modify: `src/style/styles/blueprint/skin.css`、`src/__tests__/theme/paletteContrast.test.ts`（`BLUEPRINT_BOARD_CASES`）、`styleCoverage.test.ts`
- Test: `blueprintSkin.test.ts`

**Interfaces:**
- Consumes: `board`、`board-grid`、`[data-variant]`、`[data-selected]`、`data-hint-mode`、`[data-note-highlight]`、own tokens（Task 1）、字型 stack（Task 4）。
- Produces: 數字 `z-index: 2`、`board-grid::after`（格線）`z-index: 3`、選取／答案框（格子 `::after`）`z-index: 4`；格子 `::before` 留給 Task 12 的擦除。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - `board` 背景透明、沒有陰影；`board-grid` 的 `background-color: var(--color-background)`（規格裁定 3），原本的框線透明，2px 字色外框用 `box-shadow`；`board-grid::after` 以四層漸層畫 2px 宮線與 1px 細線（`color-mix(in srgb, var(--color-foreground) 42%, transparent)`），`pointer-events: none`、`z-index: 3`。
  - `--clue-scale: 1`、`--entry-scale: 1.25`；題目 Mono 500，玩家數字 Hand、顏色 `var(--color-foreground)`；筆記 Mono、`--color-note`，`[data-note-highlight]` 強調色。
  - 同列欄宮是 `repeating-linear-gradient(45deg, var(--color-hatch) 0 1px, transparent 1px 6px)`；相同數字是 `--color-highlight` 平塗、數字強調色；選取格 `--color-cell-selected`、數字強調色，`::after` 內縮 3px、1.5px 強調色虛線框，`pointer-events: none`。
  - 錯誤格的背景是 `--color-error-hatch` 的 45° 剖面線、沒有平塗，而且排在同列欄宮與相同數字後面（錯誤蓋過兩者；規格裁定 5，Review Focus 5）；選取格、相同數字都沒有剖面線。
  - 提示模式（`data-hint-mode`）：答案格選取淡底加內縮 3px、1.5px 強調色實線框；範圍格剖面線、樣式格相同數字淡底（規格裁定 6）；候選數字色 600；強調候選數強調色方塊配 `on-primary`；刪去的候選數錯誤色劃線。強調候選數與答案格的規則在遊戲回顧、解題演示的盤面也成立（selector 不限定 `data-hint-mode`）。
  - `REQUIRED_SELECTORS.blueprint` 加 `[data-skin~="board-grid"]::after`、`[data-selected]::after`、`[data-value-kind]`、`[data-note-highlight]`。
- [ ] **Step 2: 寫失敗的對比案例** `BLUEPRINT_BOARD_CASES`，四色 × 兩模式，每個都 ≥ 4.5，除非註明：題目／玩家數字在底、剖面線、選取淡底、相同數字淡底上；強調色數字在選取與相同數字淡底上；筆記與強調筆記在底和剖面線上；錯誤數字在底和 `error-hatch` 上；候選數在答案格淡底與剖面線上；強調候選數 `on-primary` 在 `primary` 上；刪去的候選數（錯誤色）在剖面線與相同數字淡底上 ≥ 3；盤外標籤（`foreground-secondary`）在底與 `grid-major` 上；`R5C5` 標籤 `on-primary` 在 `primary` 上；選取虛線框（強調色）在選取淡底上 ≥ 3。
- [ ] **Step 3:** 跑，失敗。
- [ ] **Step 4:** 實作（Blueprint.dc 第 325–345、417–420 行）。對比不過時只能調淡底、線或材質，不改字色和強調色。
- [ ] **Step 5:** 全部測試、lint、vue-tsc 乾淨；:5207 兩種模式、四色：選取、相同數字、錯誤（製圖紙要一眼分得出錯誤與選取）、提示模式每一步、遊戲回顧、解題演示播放。
- [ ] **Step 6:** Commit `✨ feat: draw blueprint's board in drafting lines with hatched peers and a dashed selection`。

### Task 11: 按鍵與控制列

**Files:**
- Modify: `src/style/styles/blueprint/skin.css`
- Test: `blueprintSkin.test.ts`

**Interfaces:**
- Consumes: `key`、`badge`、`control`、`[data-pressed]`、`--blueprint-frame`（Task 5）。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - `key`：方形、`--color-card` 底、1px 字色內框、Mono 500；`key::before` 內縮 3px，以八層 6px 漸層畫四角的 L 形角標（`--color-border`）。
  - 相同數字的鍵整顆強調色底、`on-primary` 字、框也是強調色；用完的鍵 `opacity: 0.35`。
  - `badge`：方形、底色底、1px 字色內框、Mono。
  - `control`：1px `--color-border` 內框；開著時框和字強調色，再加一圈 1px 內框（`box-shadow` 兩層）。
  - 按下時的效果不改大小（沒有 `transform: scale` 以外的版面變化），在 reduced motion 停掉。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3:** 實作（Blueprint.dc 第 372–382 行；四個角，規格的判斷）。
- [ ] **Step 4:** 全部測試、lint、vue-tsc 乾淨；:5207 看遊戲與解題演示的數字鍵（含筆記模式、擦除、剩餘數量）。
- [ ] **Step 5:** Commit `✨ feat: frame blueprint's keys with corner marks and fill the chosen one`。

### Task 12: 擦除

**Files:**
- Modify: `src/style/styles/blueprint/skin.css`
- Test: `src/__tests__/style/styles/blueprint/blueprintMoments.test.ts`（新）

**Interfaces:**
- Consumes: `.value-leave`、`data-leaving-value`（現有）；格子 `::before`（Task 10 留下的）。

- [ ] **Step 1: 寫失敗的 sheet 測試。**
  - `.value-leave::before`：`content: attr(data-leaving-value) / ""`、Hand、`--entry-scale` 的大小、字色、`pointer-events: none`；同一個偽元素用兩層漸層畫強調色的叉（兩條 2px 斜線）。選取框在 `::after`，所以擦掉選取格的數字時框還在（Review Focus 4）。
  - 跑 `blueprint-strike`：700ms、`ease-in`，前 60% 不動、然後淡到 0；`animationTimingOf` 量到的結束時間 < `ARRIVAL_SETTLE_MS`；沒有 `forwards` 把它留在畫面上；沒有 `filter`、沒有殘影。
  - reduced motion 下 `animation: none` 而且看不見。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3:** 實作。偽元素的 `animationend` 經過 `BoardCell` 的偽元素路徑結束 leaving。
- [ ] **Step 4:** 全部測試、lint、vue-tsc 乾淨。:5207：擦除、復原、遊戲回顧往回走、解題演示輸入時擦除，擦完立刻在同一格填數；格子上都不留東西。
- [ ] **Step 5:** Commit `✨ feat: strike out blueprint's erased digits in amber`。

### Task 13: 繪圖筆寫數字

**Files:**
- Create: `src/presentation/components/style-moments/blueprint/blueprintDigitOutlines.ts`、`src/presentation/components/style-moments/blueprint/BlueprintDigitWriter.vue`
- Modify: `styleMoments.ts`（`digitWriter: BlueprintDigitWriter`）、`src/style/styles/blueprint/skin.css`、`styleCoverage.test.ts`
- Tests: `src/__tests__/presentation/components/style-moments/blueprint/BlueprintDigitWriter.test.ts`、`src/__tests__/style/styles/blueprint/digitCentring.test.ts`、`blueprintMoments.test.ts`

**Interfaces:**
- Consumes: `--digit-writer-mask`、`canMaskByReference()`（現有）；`--entry-scale`（Task 10）。
- Produces:
  - `BLUEPRINT_DIGIT_FACE: { outlines: Record<1|2|3|4|5|6|7|8|9, string>; advances: Record<1|…|9, number>; baselineEm: number; unitsPerEm: number }`（外框是 Architects Daughter 字形在 em 方格裡的 path，從 `ArchitectsDaughter-Regular.ttf` 用 `harfbuzzjs` 一次轉出，註解寫怎麼轉的；規格裁定 10）。
  - `BlueprintDigitWriter` props `{ digit: number; maskId: string }`，emits `written`；class `.blueprint-digit-outline`（`pathLength="1"`）、`.blueprint-digit-crosshair`、`.blueprint-digit-ink`（mask 裡蓋住真數字的那層）。

- [ ] **Step 1: 寫失敗的測試。**
  - `BlueprintDigitWriter.test.ts`：1–9 每個數字都畫出非空的外框 path，帶 `pathLength="1"`、`aria-hidden`；有兩條準線（橫、直）；渲染 `<mask :id="maskId">`；兩個 writer 的 mask id 不同；換數字時重掛（Review Focus 4）；`.blueprint-digit-ink` 的 `animationend` 才 emit `written`，外框與準線的 `animationend` 不會。
  - `digitCentring.test.ts`：`advances` 和 `baselineEm` 與打包後的 `architects-daughter.woff2` 相符（`advanceInEm`、`baselineInOneEmLine`，照黑板粉筆）。
  - `blueprintMoments.test.ts`：在 `[data-blueprint-fonts="ready"]` 下，arriving 的數字帶 `mask-image: var(--digit-writer-mask)`（與 `-webkit-`）；外框 `stroke-dasharray: 1`、`stroke-dashoffset` 1 → 0、0–655ms；上墨 605–840ms；外框 740–840ms 淡出；準線 0–640ms、跟著畫板 `headA` 的路線晃；全部在 `ARRIVAL_SETTLE_MS` 前結束；強調色描邊 0.8；reduced motion 下沒有 mask、`animation: none`（沒有 writer 時數字照常出現，Safari／iOS 同理）。
  - `REQUIRED_SELECTORS.blueprint` 加 `.blueprint-digit-outline`、`.blueprint-digit-crosshair`。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3:** 實作；時間軸是畫板 1.05s 的 0.8 倍。
- [ ] **Step 4:** 全部測試、lint、vue-tsc 乾淨。:5207 兩種模式快速連續輸入，不卡 mask；九個數字的外框都描完整。
- [ ] **Step 5:** Commit `✨ feat: plot blueprint's digits in outline and ink them in`。

### Task 14: 時刻：載入

**Files:**
- Create: `src/presentation/components/style-moments/blueprint/BlueprintLoader.vue`
- Modify: `styleMoments.ts`（`loader`）、`src/style/styles/blueprint/skin.css`、`styleCoverage.test.ts`
- Tests: `src/__tests__/presentation/components/style-moments/blueprint/BlueprintLoader.test.ts`、`blueprintMoments.test.ts`

**Interfaces:**
- Produces: `BlueprintLoader` props `{ message?: string }`；class `.blueprint-loader`、`.blueprint-loader-plot`、`.blueprint-loader-pen`、`.blueprint-loader-dimension`、`.blueprint-loader-coordinates`。

- [ ] **Step 1: 寫失敗的測試。**
  - `BlueprintLoader.test.ts`：276px 寬的雙框小圖紙；一條 path 畫 3×3（外框一筆加四條內線），筆頭與線共用同一條 path；「3 欄」尺寸線；標題欄左邊是 `message`，沒給時是會隨語言切換的「正在產生題目…」；右邊 X／Y 座標；最下面 `SDK-09 · SHT 01/01 · 1:1`；裝飾都 `aria-hidden`；兩個 loader 的 id 不重複。
  - `blueprintMoments.test.ts`：一輪 3.8s 無限循環，每個 keyframes 在 0% 都是隱藏；0–68% 畫線、68–76% 尺寸線從中間展開、停到 86%、96% 前淡出；keyframes 只動 `opacity`、`transform`、`stroke-dashoffset`、`offset-distance`、`clip-path`；筆頭的規則包在 `@supports (offset-path: path("M0 0"))` 裡；reduced motion 下全部 `animation: none`，停在畫好的格子、尺寸線與不動的座標，不顯示筆頭；沒有規則看「動態效果」設定。
  - `REQUIRED_SELECTORS.blueprint` 加 `.blueprint-loader-plot`、`.blueprint-loader-pen`。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3:** 照 MomentsBlueprint 的 loader 實作（`bp-plot`、`bp-pen`、`bp-dim`、`bp-tick`）。
- [ ] **Step 4:** 全部測試、lint、vue-tsc 乾淨；:5207 新遊戲與解題演示的檢查都看一次。
- [ ] **Step 5:** Commit `✨ feat: plot a sudoku box on a drawing sheet while a puzzle loads`。

### Task 15: 時刻：完成一列、一欄、一宮

**Files:**
- Create: `src/presentation/components/style-moments/blueprint/BlueprintGroupOverlay.vue`
- Modify: `styleMoments.ts`（`groupOverlay`）、`BlueprintBoardFrame.vue`（標籤亮起）、`src/style/styles/blueprint/skin.css`、`styleCoverage.test.ts`
- Tests: `.../style-moments/blueprint/BlueprintGroupOverlay.test.ts`、`BlueprintBoardFrame.test.ts`、`blueprintMoments.test.ts`

**Interfaces:**
- Consumes: `GroupEffect`、`groupPlacement`（現有）；`BoardFrameProps.effect`（Task 8）。
- Produces: `.blueprint-group-dimension`（`data-kind="row" | "column" | "box"`）、`.blueprint-group-label`；盤框標籤的 `data-lit`。

- [ ] **Step 1: 寫失敗的測試。**
  - `BlueprintGroupOverlay.test.ts`：一列畫橫的尺寸線（兩端擋線），標 `R5 · 9`；一欄直的 `C5 · 9`；一宮虛線框標 `B5`；位置都由 `groupPlacement` 決定；多組同時完成時一起畫、標籤各在自己的位置；新的 effect id 會重掛。
  - `BlueprintBoardFrame.test.ts`：`effect` 有第 5 列時 R5 標籤帶 `data-lit`，第 5 欄時 C5；只有宮時沒有標籤亮（規格裁定 9）；`effect` 是 `null` 時都不亮。
  - `blueprintMoments.test.ts`：列／欄 `steps(3)`、100ms 起 240ms；宮 140ms 起；780／800ms 起 200ms 淡掉；`data-lit` 標籤強調色 900ms `steps(1)`；`[data-group]` 格子的背景跑 `blueprint-group-hatch`（強調色 45%、5px 間距剖面線），100ms 後開始、560ms，每格延遲 `--group-delay`；格子上 `--group-ripple-step: 45ms`；每個延遲加時長都在 `groupEffectMs`（900）內，宮從中心完成的虛線框淡完（1000ms）在 900 + 120 內；動畫不動數字的 `> div`（若改數字顏色，就照 `CLAUDE.md` 合併成 `> div.value-arrive`）；reduced motion 下全部 `none`，沒有靜態提示。
  - `REQUIRED_SELECTORS.blueprint` 加 `[data-group]`、`.blueprint-group-dimension`。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3:** 照 GroupBlueprint 第 154–176 行實作。
- [ ] **Step 4:** 全部測試、lint、vue-tsc 乾淨。「動態效果」關掉時完成一組什麼都不出現；同時完成列和宮時兩者一起吸附。
- [ ] **Step 5:** Commit `✨ feat: snap dimension lines to blueprint's completed rows, columns and boxes`。

### Task 16: 時刻：過關

**Files:**
- Create: `src/presentation/components/style-moments/blueprint/BlueprintCelebration.vue`、`src/style/styles/blueprint/blueprint-ants.svg`（若用遮罩做行進虛線）
- Modify: `styleMoments.ts`（`celebration`）、`BlueprintBoardFrame.vue`（鎖定框與 OK 標註）、`src/style/styles/blueprint/skin.css`、`src/presentation/i18n/messages/{zh-Hant,en}.ts`、`styleCoverage.test.ts`
- Tests: `.../style-moments/blueprint/BlueprintCelebration.test.ts`、`BlueprintBoardFrame.test.ts`、`blueprintMoments.test.ts`

**Interfaces:**
- Consumes: `data-celebration`、`data-still`、`celebration`、`trophy`、`complete-title`（現有）；`BoardFrameProps.celebration`（Task 8）；`__APP_VERSION__`。
- Produces: `BlueprintCelebration` props `{ still: boolean }`（印章）；i18n `game.complete.stamp`（「核可」／"APPROVED"）、`game.complete.stampRevision`（「APPROVED · REV {version}」／"REV {version}"，`version` 是 `major.minor`）；盤框的 `.blueprint-frame-lock`、`.blueprint-frame-verdict`。

- [ ] **Step 1: 寫失敗的測試。**
  - `BlueprintBoardFrame.test.ts`：`celebration` 是 `"playing"`／`"done"`／`"still"` 時畫鎖定整個盤面的虛線框和 `R1–R9 · C1–C9 OK` 標註（文字不分語言），`null` 時沒有；`"still"` 時兩者帶 `data-still`。
  - `BlueprintCelebration.test.ts`：印章主字是 `game.complete.stamp`，切換語言會換字；小字含 `__APP_VERSION__` 的 major.minor；`aria-hidden`；`still` 時直接出現。
  - `blueprintMoments.test.ts`：`[data-skin~="board"][data-celebration="playing"]::before` 畫兩條琥珀準線，760ms 從左上掃到右下（可帶 `box-shadow` 光暈，不用 `filter`）；`[data-celebration="playing"]` 下每格數字閃琥珀色，延遲 `(var(--cell-row) + var(--cell-column)) * 42ms`、420ms，keyframes 命名 `blueprint-group-sweep`（`BoardCell` 忽略 `*-group-*`，閃色的 `animationend` 才不會提早結束最後填入那格的 arriving），並另寫一條 `> div.value-arrive` 同時列出閃色與 arrive 動畫（reduced-motion 區塊也一樣）；鎖定框 720ms 起行進虛線，OK 標註 1000ms 起拉出引線；`celebration` 卡片 60ms 起用 `clip-path` 由左往右 520ms 畫出；`trophy` 琥珀虛線圈 580ms 起；印章 700ms 起，−12°、由大縮回、底色 92% 襯底（規格裁定 12）；`[data-celebration="still"]`／`[data-still]` 不掃、虛線不跑、卡片不畫，鎖定框、標註、印章直接在終點；reduced motion 下全部 `none`。
  - `REQUIRED_SELECTORS.blueprint` 加 `[data-celebration="playing"]`、`[data-skin~="celebration"]:not([data-still])`、`[data-skin~="trophy"]`、`.blueprint-frame-lock`。
- [ ] **Step 2:** 跑，失敗。
- [ ] **Step 3:** 照 MomentsBlueprint 的過關實作（`bp-xv`／`bp-xh`、`bp-hit`、`bp-ants`、`bp-lead`、`bp-draw`、`bp-spin`、`bp-stamp`）。
- [ ] **Step 4:** 全部測試、lint、vue-tsc 乾淨。:5207 在「動態效果」開、關、系統減少動態三種情況各過關一次，兩種模式；1280×800 寬視窗看鎖定框與 OK 標註沒有被裁。
- [ ] **Step 5:** Commit `✨ feat: sweep and approve blueprint's solved board`。

### Task 17: 文件

**Files:** `CLAUDE.md`、`README.md`

- [ ] **Step 1: `CLAUDE.md`。** 風格資料夾列表加 `blueprint`；Registering a style 補 `STYLE_BOARD_FRAMES`、`CONTINUE_LAYOUTS`、`swatchColors`；`STYLE_OWN_TOKENS` 補 `grid-minor`、`grid-major`、`hatch`、`error-hatch`；A new typeface 補 "Blueprint Mono"／"Blueprint Hand"／"Blueprint Sans TC"、三個 stack、`syncBlueprintFonts`／`data-blueprint-fonts`；Home 的 hero 補 `"spaced"`；Moments 補 `BlueprintDigitWriter` 不用 `StrokeDigitWriter`、外框在 `blueprintDigitOutlines.ts`（換字型要重量）。Task 6、8 已補的 hook 不重複。
- [ ] **Step 2: `README.md`。** 照其他風格的寫法提到藍圖（不計算風格數量）。
- [ ] **Step 3:** 全部測試、lint、vue-tsc 乾淨。
- [ ] **Step 4:** Commit `📄 docs: describe the blueprint style, its board frame and its fonts`。

### Task 18: 對照畫板的視覺驗收

**Files:** 不改檔案（發現問題就回到對應的 task，開 🐛 fix commit）。

- [ ] **Step 1:** 開 `npx vite --port 5207 --strictPort --force`。用 Chrome DevTools MCP；連不上時用暫時 profile 的 headless Chrome，回報用了哪一個。
- [ ] **Step 2:** 390×844（另加 360×640 的遊戲畫面），**藍曬圖與製圖紙 × blue／teal／slate／rust**，中文與英文：首頁（有、沒有存檔）、遊戲（選取、相同數字、錯誤、筆記）、提示模式每一步、完成一列／一欄／一宮、過關（開始、卡片、印章）、統計（含放棄的遊戲）、遊戲回顧、解題演示（介紹、輸入、播放）、設定、外觀、更新日誌、每個對話框、載入。
- [ ] **Step 3:** 每張和畫板同一頁比：`Blueprint.dc.html`（各頁、填入、擦除）、`GroupBlueprint.dc.html`（列、欄、宮）、`MomentsBlueprint.dc.html`（載入、過關）。在本機用瀏覽器開這些檔，切到同樣的模式和紙色。
- [ ] **Step 4:** 把截圖存在 scratchpad，回報：和畫板不同的地方（每項附兩邊的截圖路徑）、裁切或溢出、hook 碰不到的畫板細節、Review Focus 五項各自的結果。不同的地方是 spec「規格裁定」裡寫明的，標成「依裁定」。
- [ ] **Step 5（controller）：** 把 Android 模擬器檢查交給 peer session「sudoku-app」，用 `npm run android:build:dev`（不要裸 `npx cap sync`）：兩種模式、launcher 圖示跟著紙色和模式換、寫數字與擦除的流暢度、完成一組、過關、中英文。截圖回報給 owner。
