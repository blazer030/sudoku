# 藍圖工程風格設計

## 背景與目的

風格研究畫布「數獨風格研究」（https://claude.ai/artifact/72nsZrRhPbd5nfnKt8UnWE）的第五個提案「藍圖工程」已經畫完，這次照它做成正式風格 `blueprint`。

設計來源（畫布裡的檔案，用 Artifact `read` 加 `path` 取得；本機副本在 `.worktrees/style-research/docs/style-research/project/`。畫面、顏色、尺寸、動畫時序以畫板為準，這份文件只記決定與取捨）：

- `project/Blueprint.dc.html`：所有頁面（首頁、遊戲、提示、完成、統計、回顧、演示、設定、更新日誌、各對話框），兩種模式、四種紙色，以及填入／擦除效果。
- `project/GroupBlueprint.dc.html`：完成一列／欄／宮。
- `project/MomentsBlueprint.dc.html`：載入與過關。
- `project/PickerC.dc.html`、`project/PickerFlow.dc.html`、`project/Main.dc.html`：外觀頁卡片、App 圖示（兩種模式各一張）、總覽縮圖。
- `project/canvas.json`：設計筆記 `note5`、`momentsNote8`、`groupNote8`（下文引用的筆記都在這裡）。`StrokeWriting.dc.html` 沒有藍圖的資料：裡面的「藍色麥克筆」是黑板粉筆的白板模式。

要做出來的感覺：一張工程圖。方格紙底，題目數字像蓋上的等寬字，玩家數字像製圖員的手寫，盤外有列欄標註、尺寸線和定位十字；選什麼就用琥珀色（製圖紙上是紅筆）圈起來、拉一條引線標註。

## 目標

- 新增風格 `blueprint`，兩種模式改名：深色「藍曬圖」、淺色「製圖紙」（`STYLE_MODE_NAMES`）。英文 Blueprint／Drafting Paper；畫布沒有英文。深色模式跟風格同名，chalkboard 也是這樣。（我的判斷）
- **四種紙色**（外觀卡片「藍曬圖／製圖紙・4 色」，設定頁的色票）：藍、青綠、灰藍、紅褐。主題 id 用 `blue`、`teal`、`slate`、`rust`，這些 key 和中文名稱在 `settings.colorThemes` 裡都有（藍／青綠／灰藍／紅褐，Blue／Teal／Slate Blue／Rust），不用新增 i18n。主題 id 一律在各自的風格裡查，跟 minimal／tactile 撞名沒關係。預設 `blue`。
- 紙色換的東西和一般主題不同：**藍曬圖換紙**（底色），**製圖紙換墨**（字和線），強調色在每個模式裡固定。
  - 藍曬圖：字 `#F2F7FF`，強調（琥珀）`#FFD166`。底色和強調上的字依主題：藍 `#123F78`／`#10325F`、青綠 `#0E4D5C`／`#0A3540`、灰藍 `#2B3A4E`／`#1E2A38`、紅褐 `#5A3A22`／`#3E2716`。次要字 `#C2D4EE`，紅褐用 `#E8D6C2`。
  - 製圖紙：底 `#FAFBFC`，強調（紅筆）`#C0392B`，強調上的字 `#FFFFFF`。字和次要字依主題：藍 `#0F3A73`／`#4A6386`、青綠 `#0B5563`／`#3E6670`、灰藍 `#2B3A4E`／`#56637A`、紅褐 `#6B3A1E`／`#7A5A44`。
  - 其餘 token 照畫板 `.m-dark`／`.m-light`：方格線、剖面線、`--line` 等，以及下面「對比度」改過的值。製圖紙的方格線和剖面線四種墨色都一樣是印刷藍，這是畫板的設定，照做，因為製圖紙的格子本來就是印好的。
  - `themeBuilder` 讓所有主題共用一份 neutrals，藍圖的 neutrals 卻跟著主題變，所以每個主題用它自己的 neutrals 各呼叫一次 builder。不需要改 `paletteBuilder`。
- 字型（`note5`）：題目數字和標籤用 **IBM Plex Mono**，玩家數字用 **Architects Daughter**，介面文字用 **Noto Sans TC**（標題用 300 細體）。三套都要新打包。
- 盤面：盤外有 C1–C9／R1–R9、「9 欄」尺寸線和四個定位十字。同列、欄、宮用 45° 剖面線標示；選取格是琥珀虛線框，旁邊拉一條引線標出 `R5C5`。
- 按鍵：細線方框，四角有角標；相同數字的按鍵整顆塗滿琥珀色。
- 填入：繪圖筆先描出數字外框再上墨，一組十字準線掃過格子（`digitWriter`）。擦除：舊數字被琥珀色的叉劃掉，然後淡出。
- 完成一組、載入、過關照各自的畫板做（見「專屬時刻」）。
- App 圖示：一款製圖圖示，**跟著紙色和模式換顏色**，四色乘兩種模式共 8 張。

## 非目標

- 改動頁面結構或功能，只換外觀。下面「共用的小改動」列出的鉤子是例外，其他風格看起來完全不變。
- 製圖音效、可切換的格線密度。

## 反目標

- 低階 Android 掉格。方格紙、剖面線、外框一律用 CSS 漸層或靜態 SVG，任何會動的東西都不套即時濾鏡。畫板過關時十字準線上的 `box-shadow` 光暈保留，因為它只跑 760ms，而且只畫在兩條 1px 的線上。
- 標註擋住數字或攔截點擊：引線、標籤、尺寸線一律 `pointer-events: none`，而且都畫在格子外或格線上。
- 製圖紙看起來只是「把藍曬圖反白」：製圖紙的紅筆是改圖用的紅線，選取和標註都用它，四種墨色也要讓人一眼看得出來。

## 限制與技術決定

- **模式**：`STYLE_COLOR_MODES.blueprint = ["dark", "light"]`。畫板預設深色，外觀卡片也把藍曬圖列在前面，所以深色排第一。
- **紙面材質**：頁面底色上疊方格紙，用 CSS 漸層畫，大格 40px、小格 8px，`background-image` 不算版面宣告。整個畫面內縮 10px 畫一道 1.5px 的圖框，再往內 4px 畫一道 0.75px 的細框，上緣每隔 25% 有一個刻度（畫板的 `.sheet`），畫在頁面根的固定偽元素上。
- **線條圖示**：skin 把 lucide 圖示改成 `stroke-width: 1.5`、`stroke-linecap: square`、`stroke-linejoin: miter`，跟畫板一樣。
- **圓角**：全部歸零。只有獎盃的琥珀虛線圈和定位十字保留圓形。
- **字型**（照「A new typeface」）：
  - 三個 family 都另外取名，不能遮住系統字體：`"Blueprint Mono"`（IBM Plex Mono 的 400／500／600 靜態檔，裁到可列印 ASCII 再加 `·–×`）、`"Blueprint Hand"`（Architects Daughter，只裁 `0123456789`）、`"Blueprint Sans TC"`（Noto Sans TC 可變字重 300–600，用 `chineseText` 裁，做法同 Ink Serif TC）。stack 分別是 `--font-blueprint-mono`、`--font-blueprint-hand`、`--font-blueprint-sans`。（字重和字元範圍是我的判斷，依畫板實際用到的地方決定）
  - Noto Sans TC 要打包。畫板指定細體標題，可是 Android WebView 的系統 CJK 字不一定有 300。代價是多一個中文子集檔。（我的判斷）
  - 在 `styles/blueprint/fonts.ts` 寫 `syncBlueprintFonts`，用 `markFontsReady` 做 gate，標記 `data-blueprint-fonts`，接到 `appearanceSync.ts`。三套都載入後才換字。
- **選取標註、列欄標籤、尺寸線**：這些畫在盤面外面，需要盤面周圍有空間，可是 skin 不能改版面。所以新增一個共用的「盤框」插槽：`STYLE_BOARD_FRAMES: Record<StyleId, Component | null>`（例如 `presentation/components/board-frame/boardFrames.ts`）。遊戲、遊戲回顧、解題演示三個盤面都經過同一個模組掛它，照「共用 UI」原則。其他風格都是 `null`，版面不變。藍圖的盤框元件做這些事（畫板筆記：「要新增：盤面外圍標籤與尺寸線 slot、選取格座標給標註用」——我的判斷是用插槽來做）：
  - 留出空間：左 22px、上 18px、下 24px，寫在元件自己的 scoped CSS，不寫進 skin.css。
  - 畫 C1–C9／R1–R9（Mono 10px，次要字色）、底部「9 欄」尺寸線（兩端有擋線，文字放在底色的小塊上）、四角的定位十字。
  - 畫選取標註：琥珀色引線 24px、斜 38°，標籤 `R5C5`（Mono 11px 600，琥珀底配強調上的字）。第 7–9 欄的格子改往左拉。標哪一格：遊戲裡是選取格，提示模式是提示的答案格，遊戲回顧是這一步改到的格，解題演示是輸入中的選取格或播放中這一步的格。過關時不標。
  - 完成一組時，對應的盤外標籤亮成琥珀色（見下）。
  - 「9 欄」要新增 i18n key，參數是數量：中文「{n} 欄」、英文 "{n} cols"。（我的判斷）
- **首頁繼續遊戲卡做成圖紙標題欄**：外框 1.5px，上方一列是播放圖示加「繼續遊戲」，下面用一條線隔開，難度、時間、進度三欄並排，欄之間用直線分隔，每欄上方有小字標題（難度／時間／進度）。
  - 小字標題要新增 i18n，以 `data-caption` 放在 `chip` 上，skin 用 `content: attr(data-caption) / ""` 畫。
  - 三欄等寬、內距歸零屬於版面，由 `ContinueButton` 提供一個 skin 可以選的版面變體（例如 `data-layout="title-block"`，由元件自己的 class 處理），不寫進 skin.css。（我的判斷）
- **AA 對比**：見「對比度的取捨」。`paletteContrast.test.ts` 加 `BLUEPRINT_BOARD_CASES`，涵蓋兩種模式、每個主題，每個 `exceptIn` 都要寫明原因。
- **WebKit**：`digitWriter` 只在 `canMaskByReference()` 成立時掛上；Safari／iOS 的數字直接出現，沒有描線也沒有準線。

## 各個畫面

- **首頁**（`STYLE_HOME_HEROES.blueprint = "stacked"`）：
  - `logo` 是一張小工程圖：3×3 方格、上方和右側的尺寸線帶箭頭、中央一個小圓加引線，再加一個定位十字。做成靜態 SVG 遮罩，用字色上色。畫板上的「3 欄／3 列／宮」字樣拿掉，因為圖示裡的字不能跟著語言切換。（我的判斷）
  - 標題 44px、300 細體、字距 0.5em；副標字距 0.2em。
  - 新遊戲卡也用 1.5px 外框。難度切換是方格，格之間用直線分隔，選中的那格反白（字色底、底色字）。
  - 三個入口方塊用 1px 框，左上角標 A1／A2／A3（Mono 10px），圖示改用字色。
- **盤面**：
  - 外框 2px 字色；宮線 2px 字色；細線 1px，是字色 42%。
  - 題目數字用 Mono 500、18px；玩家數字用 Hand、23px，**跟題目同色**，只靠字體分辨，照畫板。
  - 筆記用 Mono 9.5px，次要字色；相同數字的筆記改成強調色。
  - 同列、欄、宮是 45° 剖面線（1px 線、6px 間距）。相同數字是強調色的淡底，數字也改成強調色。
  - 選取格是強調色淡底、數字變強調色，內縮 3px 有 1.5px 虛線框，再加上盤框插槽畫的標註。
  - 錯誤格見「對比度」。
- **提示模式**：
  - 答案格用選取格的淡底，內縮 3px 畫 1.5px 強調色**實線**框。
  - 候選數用字色 600；強調的筆記是強調色方塊配強調上的字；刪去的筆記用錯誤色劃線。
  - 提示選單是方角，「揭示一格」用強調色。
- **按鍵與控制列**：
  - 數字鍵是方形，1px 字色框，卡片色底，Mono 500、22px，四角有 6px 的 L 形角標（線條色）。
  - 主畫板畫的是四個角，完成一組／載入畫板的簡化版只有左上一個，以主畫板為準。（我的判斷）
  - 相同數字的鍵塗滿強調色；用完的鍵淡到 35%。
  - 剩餘數量 `badge` 是方形，底色底、1px 字色框、Mono 10px。
  - 復原、筆記、提示三個鍵是 1px 線框；開著時框和字變強調色，再加一圈 1px 內框。
- **卡片、對話框（`card`）**：
  - 底色和頁面相同，外面是 1.5px 字色框、留 5px 底色、再一道 0.75px 細線，像圖框（照完成一組／載入畫板；主畫板只有單框，用後出的雙框）。（我的判斷）
  - 遮罩是頁面底色 72%。標題 500、字距 0.2em。圖示方塊是 1px 字色框；危險的那種改用錯誤色框。
  - 按鈕字距 0.35em、500。主要按鈕是強調色底；次要和外框按鈕是透明底配 1px 字色內框；危險按鈕是錯誤色底配底色字。
  - toast 是方角，字色底配底色字，Mono 12px。
- **頂端標籤、tag**：
  - 難度 pill 是方角 1px 字色框，字距 0.2em；提示模式的 pill 是強調色底。
  - `tag new-record` 是 2px 強調色內框加強調色字，Mono，傾斜 −6°。
  - 步驟 tag 用 1px 字色框，最後一步是強調色底。
  - 更新日誌的 `app-tag` 用 1px 強調色內框。
- **設定、外觀**：
  - 每個區塊 1.5px 外框，標題右邊用 CSS counter 標 `B-01`、`B-02`……（Mono 11px）。
  - 選項方塊和開關方塊是 1px 方框，選中時框變強調色並加一圈內框。開關指示是 16px 方框，開著時框裡畫一個強調色的叉。
  - 色票是方形，選中時外面套兩圈強調色框。分段按鈕是方格，用直線分隔，選中的反白。
- **統計**：
  - 分節標題用 Mono 500、字距 0.2em。數字用 Mono 500，最佳時間用強調色。
  - 最近遊戲列的 `icon-tile` 是 1px 方框，放棄的用錯誤色框。`game-result` 用字色，不用強調色。
- **遊戲回顧、解題演示**：
  - 盤面和盤框插槽跟遊戲一樣。
  - 播放進度條像一把尺：12px 高、每 10% 一條刻度、1px 外框，中間一條 4px 的強調色進度。播放鍵是 1.5px 強調色框的方鍵。
  - `step-dot` 是方點，次要字色框；目前這步是 20px 寬的強調色塊，走過的是半透明次要字色。
  - 範例按鈕用 1px 框。

## 填入與擦除

- **digitWriter**（`BlueprintDigitWriter`，**不用** `StrokeDigitWriter`）：
  - 不用的原因：共用的 writer 是沿字的中心線用遮罩把字形一筆筆露出來，藍圖要的是「描外框再上墨」（`note5`），做法不同。（我的判斷）
  - 寫法：writer 畫一個看得見的 SVG `<text>`（Blueprint Hand，填色透明、強調色 0.8 描邊），用 `stroke-dashoffset` 把外框描出來，同時畫兩條 1px 的強調色準線，橫直交叉在格子中央，跟著繪圖筆的路線晃過格子。它的 `<mask>` 先蓋住真正的數字，描完外框才淡入，最後外框淡掉，留下來的就是原本的字形。
  - 時長：畫板一輪 1.05s，超過 `ARRIVAL_SETTLE_MS`（1000ms），所以整條時間軸等比縮成 0.8 倍，約 840ms：描邊 0–655ms、上墨 605–840ms、外框 740–840ms 淡出、準線 0–640ms。（我的判斷）
  - 結束時 emit `written`。每個數字外框的 dash 長度依打包後的字形實測，要確定九個數字的外框都能描完整。
- **擦除**：
  - 用 `data-leaving-value` 在格子偽元素上畫出剛擦掉的數字（Hand 23px），上面疊一個強調色的叉（兩條 2px 斜線）。前 60% 不動，然後在 700ms 內淡掉（畫板 `strike`）。這段由偽元素動畫的 `animationend` 結束 leaving。
  - 不留殘影：殘影是黑板粉筆的特色，藍圖沒有。
- 減少動態或完成動畫關閉時，數字直接出現，擦除時直接消失。

## 專屬時刻（`STYLE_MOMENTS.blueprint`）

- **loader**（`MomentsBlueprint.dc.html`，`BlueprintLoader`）：
  - 一張 276px 寬的小圖紙，雙框（同卡片）。繪圖機的筆頭（琥珀十字加小圓）沿同一條 path 等速畫出 3×3 格：外框一筆，再加四條內線。線用 `stroke-dashoffset`，筆頭用 `offset-path`，兩者共用同一條路徑。
  - 畫完後「3 欄」尺寸線從中間往兩邊展開。下方標題欄的左邊是「正在產生題目…」，右邊的 X／Y 座標跳格顯示，最下面一行是 `SDK-09 · SHT 01/01 · 1:1`。
  - 一輪 3.8s：0–68% 畫線、68–76% 尺寸線出現、停到 86%、96% 前淡出。每個元素在每輪開頭都是隱藏的，循環沒有接縫。
  - `offset-path` 不支援時（`@supports`）不畫筆頭，只畫線（`momentsNote8`：Android WebView 要 Chrome 116+）。
  - 減少動態時顯示畫好的格子、尺寸線和不動的座標，不顯示筆頭。
- **groupOverlay**（`GroupBlueprint.dc.html`，`BlueprintGroupOverlay`）——「尺寸線吸附」：
  - 一列：一條琥珀尺寸線，兩端有短擋線，從剛填那格用 `steps(3)` 分三步拉到整列兩端（100ms 起、240ms），中間標 `R5 · 9`；一欄是直的 `C5 · 9`。
  - 一宮：琥珀虛線框從中間那格分三步放大到整宮（140ms 起），標 `B5`。
  - 線和框在 780／800ms 起的 200ms 內淡掉。同時，盤框插槽裡對應的 R／C 標籤亮琥珀色 900ms（`steps(1)`）。
  - 格子掠過一層琥珀 45° 剖面線（強調色 45%、5px 間距），每格 100ms 後開始、跑 560ms。漣漪間距在格子上縮成 45ms（畫板值，不超過 60ms）。
  - 同時完成多組就一起吸附，標籤各在自己的位置。
  - 動畫關閉時完全不播，也沒有靜態提示。
  - 這個效果動的是格子的背景，不動數字的 `> div`，所以不會踩到 `.value-arrive` 被蓋掉的陷阱。如果實作時改動數字顏色，就照 CLAUDE.md 合併寫成 `> div.value-arrive`。
  - `groupEffectMs = 900`（我的判斷，依畫板算出）。單格是 100 + 560 = 660ms。JS 計時器以 60ms 一步計：一宮從中心完成時最遠兩步，900 + 120 = 1020 ≥ 虛線框淡完的 1000ms；一列最遠至少四步，900 + 240 = 1140 ≥ 980ms。
- **celebration**（`BlueprintCelebration`，加上 skin）：
  - 兩條琥珀十字準線同時從盤面左上掃到右下（760ms，像驗圖）。掃過的數字閃一下琥珀色：每格延遲 (列 + 欄) × 42ms，跑 420ms，由 skin 依 `data-celebration="playing"` 和 `--cell-row`／`--cell-column` 做。
  - 720ms 起，一圈琥珀行進虛線框鎖住整個盤面。1000ms 起拉出引線，標註 `R1–R9 · C1–C9 OK`，這段文字不分語言。
  - 準線和虛線框畫在盤面的偽元素上。虛線的行進用靜態 SVG 遮罩加上 `mask-position` 動畫，或由元件畫 SVG 自己跑 `stroke-dashoffset`，由實作者決定。
  - 遮罩 1300ms 進來，卡片從 1360ms 起由左往右用 `clip-path` 在 520ms 內「畫」出來（skin 的 `celebration` 卡片）。獎盃的琥珀虛線圈 1880ms 起出現。2000ms 時，「核可」雙框印章蓋在畫面右上、標題列上方（−12°、由大縮回、底色 92% 的襯底）。
  - 印章由 `celebration` 元件畫，因為它在卡片外面。主字新增 i18n：中文「核可」、英文 "APPROVED"；小字是 `REV <版本號 major.minor>`，中文版前面加 `APPROVED · `。（我的判斷）
  - `celebrationBoardMs = 1300`：卡片在遮罩進來時打開，那時虛線框還在收尾。
  - 減少動態（`still`）：不掃、虛線不跑、卡片不畫。虛線框和標註一開始就停在盤面上，印章直接出現，卡片直接出現。
- **cardDecoration**：`null`。卡片的繪製和獎盃都交給 skin。
- **digitWriter**：見「填入與擦除」。
- 新增 `blueprintMoments.test.ts`（`__tests__/style/styles/blueprint/`），把 moments 的 selector 加進 `REQUIRED_SELECTORS`。

## 對比度的取捨

畫板的配色大多過 AA（文字 4.5:1）。下面這幾處不過，處理方式都是調淡底、線或材質，不改畫板的字色和強調色：

| 哪裡 | 畫板 | 問題 | 改成 |
|---|---|---|---|
| 製圖紙：紅筆數字在選取格（12%）和相同數字（16%）的淡底上 | 4.41／4.14 | 不過 | 兩種淡底都降到 8%（4.65） |
| 藍曬圖：錯誤色 `#FF8A80` 在青綠、紅褐底上 | 4.12／4.46 | 不過 | 改成 `#FFA39B`，四色都 ≥ 4.9；錯誤淡底用 5%（青綠 4.59）（我的判斷，選了最接近原色的值） |
| 藍曬圖青綠：筆記（次要字）在 16% 剖面線上 | 4.13 | 不過 | 四色的剖面線都降到 12%（4.59） |
| 藍曬圖青綠：次要字壓在 14% 方格大線上 | 4.26 | 不過 | 四色的大線都降到 12%（4.52） |
| 製圖紙：次要字壓在大線 `#CFDCEC` 上 | 4.36–4.52 | 不過 | 大線改成 `#D6E1EF`（≥ 4.59） |

- **製圖紙的錯誤色和強調色是同一個 `#C0392B`**，只靠顏色分不出「錯了」和「選中／相同數字」。所以兩種模式的錯誤格都多畫一層錯誤色的 45° 剖面線底（跟同列欄宮一樣的手法，換成錯誤色），相同數字只上平塗的淡底。這樣錯誤格靠圖樣就能認出來。（我的判斷）
- 細格線（字色 42%，製圖紙約 2.2:1）是材質，不是 UI 元件邊界，照畫板。選取虛線框是 UI 元件，套 3:1：藍曬圖琥珀 ≥ 6.5、製圖紙紅筆 5.25，都過。

## 註冊清單

照 CLAUDE.md 的「Registering a style」逐項完成：

- `STYLES`、`style/index.css`、`styleIcons.ts`（見下）。
- `themeIds.ts`：`STYLE_IDS`、`THEME_IDS_BY_STYLE.blueprint = ["blue", "teal", "slate", "rust"]`、`STYLE_COLOR_MODES`、`STYLE_MODE_NAMES`。
- `index.html` 的 `barColors`：四個主題各有 light 和 dark。
- i18n：`settings.style.names.blueprint` = 藍圖工程／Blueprint；`settings.colorMode.styled.blueprint.dark/light` = 藍曬圖／製圖紙，Blueprint／Drafting Paper；新增 key 有尺寸線、繼續卡小字標題、印章。
- `REQUIRED_SELECTORS`、`paletteContrast.test.ts` 的盤面案例、`STYLE_HOME_HEROES`、`STYLE_MOMENTS`、`STYLE_BOARD_FRAMES`。
- 之後跑 `generate:theme-css`、`generate:fonts`、`generate:icons`、`generate:launcher-icons`。

**App 圖示**（`styleIcons.ts`，外觀頁卡片也是它）：

- 方格紙底（9 單位小格），中央 48 單位的 3×3 盤面（外框 2.2、內線 1），上方和右側的尺寸線帶箭頭。中央那格是強調色虛線框（3 2），拉一條引線往右上，底下標 `9×9`。
- 顏色：`--ai-bg` = 底，`--ai-ink` = 字，`--ai-minor` = 大格線，`--ai-hot` = 強調色。照 `LAUNCHER_ICONS` 現有的機制，四色乘兩種模式產生 8 個 launcher alias。
- `9×9` 要畫成 path，不能用 text。monochrome 層只留墨線和虛線框。

`UNRELEASED_CHANGES` 加一條「全新風格「藍圖工程」」／"New style: Blueprint"（兩種語言）。商店和更新日誌的文案不列出、也不計算風格數量。

## 共用的小改動（其他風格看起來不變）

- `STYLE_BOARD_FRAMES` 盤框插槽，三個盤面共用，會拿到要標註的格子和完成一組的效果。
- `ContinueButton` 的 `data-caption` 和標題欄版面變體。
- 以上都要補上 CLAUDE.md 的「Skin hooks」說明。

## 交給實作者決定

- 每個 token 怎麼對到 `Neutrals`／`StyleExtras` 的角色：以畫板為準，對比由 `paletteContrast.test.ts` 把關。
- 盤框元件的 props 介面、`data-layout` 的命名、logo 和虛線框遮罩的 SVG 細節。
- 各時刻的 easing，以及 writer 每個數字的 dash 長度。
- 分步順序，建議：
  1. 註冊、配色、字型，先讓風格看得到。
  2. 頁面 skin（卡片、按鍵、設定、統計）。
  3. 盤框插槽和盤面。
  4. 填入、擦除。
  5. 三個時刻和圖示。
