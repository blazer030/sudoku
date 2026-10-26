# 黑板粉筆風格設計

## 背景與目的

風格研究畫布「數獨風格研究」（https://claude.ai/artifact/72nsZrRhPbd5nfnKt8UnWE）裡的第四個提案「黑板粉筆」，設計已經完整，這次照它做成第七個正式風格 `chalk`，分支 `feature/style-chalk`。

設計來源（畫布裡的檔案，用 Artifact `read` 加 `path` 取得；畫面、顏色、尺寸、動畫時序以畫板為準，這份文件只記決定與取捨）：

- `project/Chalk.dc.html`：所有頁面（首頁、遊戲、提示、完成、統計、回顧、演示、設定、更新日誌、各對話框），黑板／白板兩種模式。
- `project/GroupChalk.dc.html`：完成一列／欄／宮。
- `project/MomentsChalk.dc.html`：載入與過關。
- `project/StrokeWriting.dc.html`：填入筆順（紙本與黑板），含黑板的「數字 → 筆畫路徑」資料。
- `project/canvas.json`：各畫板旁的設計筆記（下文引用的筆記都在這裡）。

要做出來的感覺：一塊真的黑板。粉筆寫字、粉塵、擦過留下的殘影；白板是同一套動作換成麥克筆，乾淨、沒有粉塵。

## 目標

- 新增風格 `chalk`，兩種模式改名：深色叫「黑板」，淺色叫「白板」（`STYLE_MODE_NAMES`，像 pixel）。
- **顏色固定**，只有一組主題，不給主題色（設計筆記：「粉筆和麥克筆的顏色固定」；畫板 CSS 裡留著的 `t1`–`t3` 沒有出現在設定頁，是範本殘留，不做）。
  - 黑板：底 `#2E4B3C`、字 `#F4F1E8`、次要字 `#CFD8CC`、強調（黃粉筆）`#F7C873`、強調上的字 `#233A2E`、玩家數字（藍粉筆）`#A6D8F2`、錯誤 `#FF9E9E`。
  - 白板：底 `#F5F6F3`、字 `#1F2328`、次要字 `#4F5660`、強調（橘麥克筆）`#B04A00`、強調上的字 `#FFFFFF`、玩家數字（藍麥克筆）`#1D5FC2`、錯誤 `#C62828`。
  - 其餘 token（卡片、線、同列欄宮的淡色、粉塵、抹痕）照 `Chalk.dc.html` 的 `.m-dark` / `.m-light`。
- 字型：數字用 **Caveat Brush**（新打包），中文用已打包的**霞鶩文楷 TC**。
- 盤面：手繪、略帶抖動的粉筆格線；選取格是黃色粉筆圈；黑板上有擦過的粉塵痕跡。白板線條平滑。
- 按鍵：粉筆描邊、不規則圓角的方框；選中時塗上一層彩色粉筆。
- 首頁底部有粉筆槽。
- 填入：數字照筆順「寫」出來，每筆收尾掉一點粉塵（白板沒有粉塵），一個數字 420–560ms，用 `digitWriter`。
- 擦除：舊數字被抹開、留下淡淡殘影（設計筆記：「這是最有黑板感的一刻」）。照現有風格的做法（擁有者決定，前例是 ink 的 `ink-wash` 與 paper 的 `paper-digit-rub`）：只寫在 chalk 的 skin CSS，用格子既有的 `.value-leave` 與 `data-leaving-value` 在 `::before` 畫出剛擦掉的數字，照畫板的 `smearA/B` 往側邊抹開、變寬、變糊（模糊只套在這一個數字上，同 ink 前例），停在淡淡一層後在 `ARRIVAL_SETTLE_MS` 內淡到全無；它的 `animationend` 收掉 leaving。**不**在盤面留到下一次操作，不加共用狀態。減少動態時不播，數字直接消失。
- 完成一組、載入、過關照各自畫板（見「專屬時刻」）。
- App 圖示：木框黑板（黑板模式）和灰框白板（白板模式）各一款，上面有手繪井字、黃色粉筆圈和一個 7。

## 非目標

- 粉筆音效（設計筆記提到「可接」，這次不做）。
- 多組主題色。
- 改動頁面結構或功能：只換外觀，版面沿用現有頁面（畫板本身就是現有頁面換皮）。

## 反目標

- 低階 Android 上掉格。任何會動的東西都不能套即時 SVG 濾鏡（`feTurbulence` 等）。
- 擦除或填入的動畫擋住下一次輸入：書寫在 `ARRIVAL_SETTLE_MS` 內結束。
- 白板看起來像「沒做完的黑板」：白板要有自己的麥克筆質感（平滑、粗細一致），不是把粉塵關掉而已。

## 限制與技術決定

- **粉筆顆粒改用靜態材質圖**：畫板用 `feTurbulence` 濾鏡挖洞，正式版改成事先做好的 SVG 粉筆材質，用 `mask-image` 套上（`url("@/style/styles/chalk/<file>.svg")`），格線、選取圈、按鍵描邊、數字都一樣。設計筆記自己也是這個結論；專案規則也是「靜態 SVG，不用即時濾鏡」。（「填入筆順」畫板筆記說可以把濾鏡只套在數字上，這裡改用同一張靜態材質圖，以符合專案規則。——我的決定）
- **手繪格線**：一層靜態 SVG 疊在盤面上（像 ink 的 `brush-grid.svg`），黑板版有粉筆質感、白板版平滑。
- **兩種模式**：`STYLE_COLOR_MODES.chalk = ["dark", "light"]`，用一般的 `themeBuilder`。模式跟隨玩家的深淺色設定；畫板預設深色，所以清單把 dark 放前面。（我的決定）
- **主題 id**：一組，`chalkboard`（擁有者決定），規則同 pixel 的 `classic`。
- **字型**：Caveat Brush 加進 `scripts/generate-fonts.ts`，裁到數字（`0123456789`）以及計時器、統計需要的符號（照畫板實際用 `--font-num` 的地方決定）；字體名稱要另取，不能遮住系統字體（照 ink 的作法，例如 "Chalk Digits"）。在 `styles/chalk/fonts.ts` 用 `markFontsReady` 做字型 gate，接到 `appearanceSync.ts`。
- **「好棒！」**：過關卡片的標題要新增 i18n key（兩種語言），WenKai 子集由 `sourceCharacters()` 從訊息檔產生，所以加了 key 就會涵蓋；仍要讓 `bundledFonts.test.ts` 驗證。英文版的文字照現有風格的語氣決定（例如 "Well done!"）。
- **筆畫資料**：`style-moments/chalk/chalkDigitStrokes.ts`，從 `StrokeWriting.dc.html` 的黑板資料搬過來，並依打包後的 Caveat Brush 重新量字寬和基線（像 `paperDigitStrokes.ts`）。筆順依畫板：1 先旗再直、4 先斜下帶橫再直下、7 先橫再斜下、8 一筆 S 形繞回、5 先直下帶圓肚再補上橫。黑板筆寬 14 單位（格子 100 單位），兩筆之間停 50ms，最後 60ms 讓整個字形淡入。
- **WebKit**：`digitWriter` 只在 `canMaskByReference()` 成立時掛上；Safari／iOS 直接顯示數字，粉塵也不出現。
- **減少動態／完成動畫關閉**：照各畫板筆記（見下）。

## 專屬時刻（`STYLE_MOMENTS.chalk`）

- **loader**（`MomentsChalk.dc.html`）：小黑板上，粉筆先畫一個封閉的 3×3 九宮（外框一筆、再四條內線），黃色粉筆圈住「正在解」的那一格，在那格寫下數字、掉一點粉塵，四格輪流；最後板擦從左拖到右，留下一層抹痕再擦乾淨，重來。一輪 4.4 秒，每個元素在每輪開頭都是隱藏的，循環沒有接縫。白板是麥克筆、沒有粉塵。減少動態時顯示畫好的九宮、數字、最後一格的圈和一道抹痕。
- **groupOverlay**（`GroupChalk.dc.html`）：完成的列下方拖一條黃色粉筆線（欄畫在右側），宮被歪歪的粉筆圈起來；線畫完時掉粉塵，約 0.9 秒後淡掉；數字順便閃一下黃色。同時完成多組就同時畫，粉塵各掉各的。白板是麥克筆、沒有粉塵。動畫關閉時完全不播，也沒有靜態提示。`groupEffectMs` 依畫板時序算出。
- **celebration**：老師用黃粉筆把整個盤面圈起來，四周隨手畫上星星、波浪和放射線；`celebrationBoardMs` 依畫板時序算出。減少動態時圈和塗鴉一開始就在板上。
- **cardDecoration**：過關卡片像貼上黑板一樣出現，「好棒！」從左往右一格格寫出來、字下掉粉塵；`data-still` 時直接顯示。
- **digitWriter**：見上「筆畫資料」。

## 註冊清單

照專案 CLAUDE.md 的「Registering a style」逐項完成：`STYLES`、`style/index.css`、`styleIcons.ts`、`themeIds.ts`（含 `STYLE_MODE_NAMES`）、`index.html` 的 `barColors`（light 與 dark 都要）、i18n 名稱（`settings.style.names`、`settings.colorThemes`、`settings.colorMode.styled.chalk.light/dark` = 白板／黑板，Whiteboard／Chalkboard）、`REQUIRED_SELECTORS`、`paletteContrast.test.ts` 的盤面案例、`STYLE_HOME_HEROES`（看畫板應該是 `stacked`）、`<id>Moments.test.ts`；之後跑 `generate:theme-css`、`generate:icons`、`generate:launcher-icons`、`generate:fonts`。

`UNRELEASED_CHANGES` 加一條「全新風格：黑板粉筆」（兩種語言）。商店／更新日誌文案不列出或計算風格數量。

## 交給實作者決定

- 每個 token 怎麼對到 `Neutrals` / `StyleExtras` 的角色（以畫板為準，對比度由 `paletteContrast.test.ts` 把關）。
- 粉筆材質圖、格線、選取圈、按鍵框、粉筆槽、圖示的 SVG 繪製細節。
- 各時刻的毫秒數與 easing（依畫板）。
- 分步順序（建議：先註冊 + 配色 + 字型，看得到風格；再盤面與按鍵 skin；再擦除殘影、填入筆順；最後三個時刻與圖示）。
