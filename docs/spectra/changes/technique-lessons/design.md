## Context

解題器有 19 種技巧（`TechniqueId`），提示模式和解題演示會用 `StepCellView` 把一步畫在棋盤上，但沒有地方可以從頭學。首頁的 `Home.vue` 已留下註解，預期第四格是 Technique Lessons，並改成兩欄。

現況的限制：

- `Cell` 接受 `hint: StepCellView`，提示模式、解題演示、遊戲回顧都走這條路；畫面共用是專案規則。
- `SolverWalkthrough` 的步驟狀態存在頁面裡，專案沒有用 `KeepAlive`，換路由就會失去。
- `Home.test.ts` 把尺寸加總鎖在 552 + 168 = 720，並鎖住三個入口。
- 8 種風格各自重畫卡片、磚塊、格子。部分 skin 會把 `.rounded-full` 變方形（8-bit），或隱藏特定 hook 裡的圖示（賽博的 `check`）。

## Design Source

- **來源**：畫布 https://claude.ai/artifact/Gkj4rnyBgSDi6QTvR32RfM ，取得於 2026-11-06。
- **本機副本**：`.spectra/design-cache/technique-lessons/`，內含 `Main.dc.html`（極簡的流程與文案）、`Sketch.dc.html`（8 種風格的數值）、`HomeSmall.dc.html`、`PixelOptions.dc.html`、`PixelNotice.dc.html`。此資料夾不進版控，畫布是最新來源。
- 其餘畫面數值沿用現有元件（`HintPanel`、`StepTag`、`StepNavigator`、`LeaveGameDialog`）。

| 項目 | 值 |
| --- | --- |
| 課程列的狀態記號 | 24px；極簡：完成實心 primary 加 14px check、下一課 2px primary 圓環、未開始 1.5px border 圓環 |
| 狀態記號形狀 | 8-bit、藍圖方形；賽博切角 6px；水墨圓相；黑板手繪圓；其他圓形 |
| × 記號 | 圖示 16px，畫在空格正中；各風格顏色見 `Sketch.dc.html` 的 `cross` |
| 淡色（`lesson-dim`） | 極簡 #B5B4B1、觸感 #B3AEA4、紙本 #B9B2A5、掌機 #306230、紅白機 #6C6C6C、賽博 #4A5A70、水墨 #B9B2A3、黑板 #7E9588、藍圖 #7792B5、極光 #6B7390 |
| 8-bit 範圍暗點 | 6px 一格、2px 方點；掌機 #306230 疊 #9BBC0F，紅白機 #6C6C6C 疊 #000000 |
| 8-bit 目標數字 | 掌機 #0F380F 底 #9BBC0F 字；紅白機 #0058F8 底 #FCFCFC 字 |
| 8-bit 規律格 | 掌機 #8BAC0F 底；紅白機 #1E1E3C 底 |
| 首頁矮螢幕（578 高以下） | 標誌 40px、標題 0.78 倍、副標行高 16px、卡片內距與間距 8px、分段與新遊戲按鈕 44px、磚塊間距 8px |
| 課程面板 | 內距 16 / 16 / 12、間距 12、文字 14.5px / 1.6；360×640 時內距 12 / 16 / 10、間距 8 |

## Goals / Non-Goals

**Goals:**

- 玩家能按順序學完全部 19 種技巧，每課都親手練過。
- 每個範例盤面都由專案自己的解題器驗證，內容錯誤會被測試擋下。
- 新畫面在 9 種風格都能看，小手機放得下。

**Non-Goals:**

- 不做分數、星等、徽章或排行。
- 不計入統計，也不影響遊戲紀錄。
- 遊戲中（提示模式）不提供教學入口。owner 明確不要。
- 練習中不提供手寫筆記，手寫只在「填數字與筆記」那課教。
- 不調整解題器本身，也不新增它還不會的技巧。

## Decisions

### Lesson content lives in the domain as data

`src/domain/lessons/` 放課程的型別、順序與每課內容，內容只存盤面、格子與 i18n key，不存文案。替代方案是放在 presentation，但練習判定和測試都需要這份資料，而且它沒有框架相依。

### Every lesson board is validated by the technique solver

每個刪候選數的盤面以「題目數字 + 先前已刪的候選數」表示，測試用 `BoardState.fromPuzzle` 加 `eliminate` 重建，再用對應的技巧類別 `find`，結果必須等於這一步宣告的規律與可刪項目。填數字的盤面則驗證目標答案符合題目唯一解。替代方案是手算後寫死，但錯誤只會被玩家發現。

### Practice is a pure state machine in the domain

`LessonPractice` 是純函式：輸入步驟、目前狀態與一次點格子或按數字，回傳新狀態與回饋原因（例如 `{ kind: "conflictInColumn", column: 4, digit: 3 }`）。presentation 只負責把原因翻成文案。這樣每種答錯情境都能不開瀏覽器測試。

### Lesson boards reuse Cell and StepCellView

教學盤面用 `Cell` 加 `hint`，連線用 `StepLinkOverlay`，懸浮鍵用 `FloatingDigitPad`，外框用 `BoardFrame`。`StepCellView` 新增 `crossed`、`dimmed` 與 `target` 高亮，符合「兩頁都顯示的東西來自同一模組」的規則。

### Target digits get their own cell variant

講解裡要強調的數字用新的 `target` 變體，而不是 `same-digit`。8-bit 要把目標反白，但 `same-digit` 也用在遊戲中選數字時的高亮，直接改會動到遊戲外觀。其他風格的 `target` 預設與 `same-digit` 同樣外觀。

### The lesson panel composes the step components

新增 `LessonPanel`，由 `StepTag`、`StepNavigator`、`StepExplanation` 組成，下面放兩顆按鈕，版型同 `HintPanel`。不用 `StepPlaybackPanel`，因為課程沒有自動播放，而且一次只顯示一則訊息。

### Lessons open over the Walkthrough rather than by route

`LessonScreen` 是可獨立使用的元件。從課程列表進入時由 `/lessons/:lessonId` 路由呈現；從解題演示進入時疊在 `SolverWalkthrough` 上方，用 `registerBackDismissal` 接返回鍵，因此解題演示不會被卸載，步驟保留。替代方案是加 `KeepAlive` 或把步驟存進 store，影響範圍都比較大。

### Dimmed digits use a per-style colour token, not opacity

新增 palette token `lesson-dim`。8-bit 的 skin 明文沒有淡出，極光的格子只有 7% 玻璃，半透明字會直接壓在光上。用顏色也避開 `value-arrive` 動畫蓋掉 opacity 的問題。

### The cross mark is an icon

新增 `CellMark`，用 `X` 圖示畫 ×。內建的 Caveat、Press Start 2P、Silkscreen、Share Tech Mono 都沒有 U+00D7，所以不能用文字。`X` 已在 `ICON_NAMES`，各風格已有畫法。

### Lesson rows get their own skin hooks

新增 `lesson-row`、`lesson-mark`（`done`、`next`、`rest`）。不重用 `recent-row`（四個 skin 沒有規則，掌機會完全看不見）、`check`（賽博會隱藏圖示）、`new-game`（紙本會傾斜成印章）。

### Home sizes extend the existing step

`--home-step` 維持現有做法，但預算改成兩排磚塊，每種 hero 用 `--home-hero-extra` 提早開始縮。578 高以下再加一段縮小文字與間距，500 高以下隱藏副標。高度數字是 `HomeSmall` 畫板與 CSS 算出的估計值，實作時以瀏覽器量測校正，測試鎖定校正後的值。

### Lesson progress has its own repository

`application/lessons/LessonProgressRepository` 是 port，`infrastructure` 用 localStorage 實作，由 `lessonStore` 持有。「清除紀錄」不影響進度，因為那是遊戲紀錄，進度是另一回事。替代方案是放進 `Settings`，但進度不是設定。

### The handheld notice is remembered in settings

`Settings` 新增 `handheldLessonNoticeDismissed`。只有選「還是用掌機看」才記住；換配色或看其他風格之後，若又回到掌機，還會再提醒。提醒由 `useLessonNotice` 統一在進入課程列表或從解題演示開課時判斷。

## Implementation Contract

**Behavior**

- 首頁第一格是「技巧教學」，進入課程列表，看得到四組 17 課、已完成數與下一課。
- 一課依序走過講解、跟著做、自己找、完成。任何一步都能用返回離開，進度以「完成整課」為單位記錄。
- 解題演示的技巧標籤旁有「學這招」，開啟對應課程，返回後解題演示停在原本的步驟。提示模式沒有這個連結。

**Interface / data shape**

- `LessonStep` 種類：`show`（講解）、`place`（點格子，數字已定）、`pick`（點出規律格）、`remove`（點能刪候選數的格子）、`fill`（點格子再用懸浮鍵填數字）、`note`（「填數字與筆記」那課專用：打開筆記模式，在指定格寫下指定候選數）、`done`。
- `lessonForTechnique(technique: TechniqueId): LessonId`：19 個技巧都有對應。
- `practiceReducer(step, state, action) => { state, feedback }`，`action` 是 `{ kind: "tapCell", row, column }`、`{ kind: "pressDigit", digit }`、`{ kind: "toggleNoteMode" }` 或 `{ kind: "requestHint" }`。
- `StepCellView` 新增 `crossed: boolean`、`dimmed: boolean`，`StepHighlight` 新增 `"target"`。`BoardCell` 對應輸出 `data-dimmed`、`data-crossed`，`data-variant="target"`。
- 路由：`ROUTER_PATH.lessons`（`/lessons`）、`ROUTER_PATH.lesson`（`/lessons/:lessonId`）；`ScreenName` 新增 `lessons`、`lesson`。

**Failure modes**

- 網址的 `lessonId` 不存在時導回課程列表。
- 進度資料壞掉或讀不到時視為全部未完成，不擋畫面。
- 動態效果關閉時，所有轉場直接跳到結果；沒有依賴 WebGL 或 mask 的新效果，WebKit 上看起來相同。

**Acceptance criteria**

- `npx vitest run` 全綠，含內容驗證、練習判定、首頁尺寸、皮膚覆蓋測試；`npm run lint` 與 `npm run build` 通過。
- 在 360×640、375×667、320×568、390×844 量測：教學頁按鈕都在畫面內，棋盤在訊息切換時不移動。
- 844 高以上逐元素比對舊版：除了入口磚塊區，其他元素的大小都不變，Android 模擬器也要比對。
- 9 種風格的課程列表和課程頁都實際截圖看過。

**Scope**

- 範圍內：17 課內容、課程列表、課程頁、兩個入口、首頁尺寸、9 種風格的新元素、8-bit 標示與掌機提醒、兩種語言文案。
- 範圍外：統計、成就、遊戲中入口、解題器改動。

## Risks / Trade-offs

- [8-bit 掌機的辨識度本來就受限] → 用暗點與反白改善，再加進場提醒；實機看過仍不夠就只能靠提醒。
- [X-Wing 的矩形線穿過中間的數字] → 連線畫在數字下方，與解題演示共用同一處修改。
- [淡色對比很低，違反一般文字對比] → 淡化數字是刻意退到背景的脈絡，不是要讀的內容；`paletteContrast.test.ts` 為它設 1.5:1 的下限，並用具名例外記錄。1.5 是設計估計值，實作時以各風格截圖確認。
- [藍圖的棋盤框多佔 26px] → 小手機試算只剩約 20px 餘裕，實作時量測；不足就用 `panelLift` 讓面板上移。
- [17 課的內容量大] → 內容按難度分批，每批都有驗證測試，前面的批次不依賴後面。
- [X 鏈、XY 鏈的步驟比較長] → 面板文字沿用 `StepExplanation` 的捲動；這兩課上線前特別看小手機。
- [首頁 720 到約 819 高會比現在略小] → owner 已同意；844 以上不變，並逐元素比對證明。

## Migration Plan

新功能，沒有資料遷移。`Settings` 新欄位用預設值 `false`，舊資料不受影響。回滾時移除入口即可，進度資料留在 localStorage 不影響其他功能。

## Open Questions

無。所有畫面決定都已由 owner 在 2026-11-06 確認。
