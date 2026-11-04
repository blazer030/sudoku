## Why

現在「先點格子」每填一格都要在盤面和下方數字鍵之間來回，中等、困難的收尾階段也得一格一格補明顯的數字。同時「自動筆記」被放在提示選單裡，靠一次免費提示撐著，提示次數又有上限，提示規則和玩家的實際需求已經脫節。

## What Changes

- 新增「懸浮數字鍵」設定：點任何可作答的格子（含已填過的），格子斜角就出現數字鍵與擦除鍵；題目給定的格子不出現。遊戲和解題演示共用，每個風格各有自己的外觀。
- 新增「連點兩下填入」設定：連點盤面和功能鍵以外的空白處，把當下只剩一個筆記的格子全部填上。一次只填一輪、衝突也照填、一次復原全部還原，消筆記和動畫都照常。簡單難度完全不作用，也不提示。
- **BREAKING**（遊戲規則）自動筆記移出提示選單，改成「開局自動筆記」設定：開著就每局帶筆記開始，關掉就只能自己寫，遊戲中不再能補。
- **BREAKING**（遊戲規則）提示不再限制次數，也取消第一次免費：每次使用都算一次。
- 統計頁依難度新增「平均提示次數」，和平均時間一樣只算完成的遊戲。
- 設定頁的遊戲區塊改版：方塊格改成開關列，分成「操作」和「顯示」兩組。
- 三個新設定預設都關閉。

## Non-Goals

範圍排除與不採用的做法記在 `design.md` 的 Goals / Non-Goals。

## Capabilities

### New Capabilities

- `floating-digit-pad`: 選中可作答格子時，在格子斜角出現的數字鍵與擦除鍵
- `single-note-fill`: 連點空白處，一次填入所有只剩一個筆記的格子
- `auto-notes-setting`: 以設定決定遊戲開局是否帶好全部筆記
- `hint-usage`: 提示不限次數、沒有免費次數，以及統計頁的平均提示次數
- `gameplay-settings`: 設定頁的遊戲開關分組與開關列

### Modified Capabilities

無。專案目前還沒有既有規格。

## Impact

- 受影響的視覺風格：全部（minimal、tactile、paper、pixel、cyber、ink、chalkboard、blueprint、aurora）。懸浮數字鍵和設定開關列都要在每個風格下成立，懸浮數字鍵另有各風格專屬設計。
- 玩家看得到：是。合併進 `develop` 時要在 `src/presentation/pages/settings/changelogData.ts` 的 `UNRELEASED_CHANGES` 加一行，或歸入既有的一行。
- 程式：`src/domain/game/Sudoku.ts`、`src/domain/game/HintTracker.ts`、`src/application/settings/SettingsStorage.ts`、`src/application/analytics/AnalyticsService.ts`、`src/stores/settingsStore.ts`、`src/stores/gameStore.ts`、`src/stores/statisticsStore.ts`、`src/presentation/pages/game/`、`src/presentation/pages/solver-walkthrough/`、`src/presentation/pages/settings/Settings.vue`、`src/presentation/pages/statistics/Statistics.vue`、`src/presentation/pages/home/Home.vue`、`src/presentation/components/`、`src/presentation/i18n/messages/`、`src/style/styles/*/skin.css`。
- 資料：設定多三個欄位，舊存檔讀到時用預設值。舊遊戲紀錄的 `hintsUsed` 不補正，用過提示的舊紀錄會少算一次。
- 分析事件：`game_complete` 的 `hints_used` 改為實際次數，`hints_total` 移除；`hint_used` 不再有 `auto_notes`。
- 設計探索：`feature/style-research` worktree 的 canvas 會新增懸浮數字鍵的各風格畫板，該分支不合併進 `develop`。
