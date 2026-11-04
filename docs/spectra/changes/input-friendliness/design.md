## Context

- 輸入有兩條路：先點數字（`selectedDigit` 留著，連續點格子就填）和先點格子（選格後到下方 `DigitPad` 按數字，一般模式填完就取消選取）。懸浮數字鍵只改善後者。
- `DigitPad` 同時用在 `GameScreen.vue` 和 `SolverWalkthrough.vue`，兩頁的輸入邏輯分別在 `useGameInteraction` 和 `useWalkthroughInput`。
- `Sudoku.fill()` 每次呼叫都存一份整盤快照；`useGroupEffect.play()` 可一次接受多個群組，但新效果會取代還在跑的效果。
- `HintTracker` 有 `MAX_HINTS = 4` 和一次免費；存檔存 `totalUsed`，遊戲紀錄存扣掉免費後的 `recordedUsed`。
- `useGameSession` 開局時會建立新的 `Sudoku` 實例，只帶走答案、盤面和提示次數，所以 `gameStore` 開局時的快照不會進入遊戲的復原歷史。
- 擁有者用手機可點示意比較過位置（https://claude.ai/artifact/DpZyPLfkaf3G9eSh4a8pL7），選定貼斜角。
- 模擬（實測，每個難度 40 局，自動筆記後反覆填單一筆記，不用其他技巧）：簡單解完 39 局，中等 3 局，困難 0 局。這是簡單難度排除連點的依據。

## Goals / Non-Goals

**Goals:**

- 先點格子的玩家不必離開盤面就能填、改、擦。
- 中等、困難的玩家在收尾時能一次填完有把握的格子。
- 自動筆記和提示規則變單純：前者是設定，後者只計次。
- 設定變多後仍然好掃讀。

**Non-Goals:**

- 懸浮數字鍵不取代下方數字鍵，也不顯示剩餘數量。
- 連點填入不查答案、不連鎖、不檢查衝突。
- 不新增即時的錯誤或衝突提醒。
- 不補正舊遊戲紀錄的提示次數。
- 不為這三個新設定新增分析事件或使用者屬性。
- 解題演示沒有筆記，所以沒有連點填入。
- 不合併 `feature/style-research` 進 `develop`。

## Decisions

### 懸浮鍵貼在格子斜角

懸浮鍵的角貼著選中格子的角，預設在右下，超出盤面時往左或往上翻。這樣不會擋到該格的列和欄，但可能擋到同宮的格子。擁有者試過可點示意後，選它而不選「蓋在對角宮」，因為距離最近。

### 懸浮鍵在可作答格出現並含擦除鍵

所有可作答的格子都會出現，包含已填過的格子，方便直接修改；題目給定的格子不出現。按鍵是 3×3 數字加一條擦除鍵，擦除鍵的做法經擁有者在可點示意上確認。一般盤面上高度約 3.6 格，以 Requirement「Floating pad placement」的 81 格測試確認不超出盤面。

### 懸浮鍵按鍵最小 36px

實測的按鍵大小隨盤面縮小：Pixel 7 Pro 38px、Pixel 3a 36px、iPhone SE 加到主畫面 29px、360×640 dp 的 Android 23px、iPhone SE 的 Safari 21px。擁有者選擇讓按鍵最小 36px：盤面小時懸浮鍵比 3 格大，可能超出盤面，但矮螢幕的盤面左右有空位（實測 iPhone SE 的 Safari 每邊 67px、360×640 dp 每邊 50px），所以仍在畫面內。兩邊都放不下時選超出最少的一邊。懸浮鍵開著時盤面的層級提高，避免超出的部分被下方控制項蓋住。不採用「太小就不顯示」，因為矮螢幕的玩家最需要少移動；不採用維持比例，因為 21px 難以按準。

### 懸浮鍵共用元件與輸入入口

`FloatingDigitPad.vue` 放在 `presentation/components/` 並由兩頁共用，放在 `board-grid` 內，以格子數換算位置，不需要量測。按鍵事件直接走各頁既有的 `selectDigit`／`pickDigit` 和 `toggleEraseMode`，所以規則和下方數字鍵完全一致。解題演示額外傳入 `disabledDigits`。

### 單一筆記填入先定計畫再全部填上

先掃出當下所有「未填且只有一個筆記」的格子成為計畫，再依序填入。計畫不會因填入途中筆記被消掉而改變，所以兩個同列的格子都只剩 5 時會都填上，等同玩家自己沒看就填。只填一輪不連鎖，否則簡單以外的題目也會被一路解完。

### 逐格填入且一次復原

計畫開始前存一份快照，之後每格填入不再存，所以按一次復原就還原整批。動態效果開啟時每格間隔 60ms（選定值，靠實機確認手感），動態效果關閉時同一刻全部填上。遊戲紀錄每格記一步 `fill`，遊戲回顧照舊能逐步看。填入途中盤面和功能鍵鎖定。按返回（畫面上或系統的）和頁面隱藏都會先把剩下的格子立刻填完，再開離開對話框或存檔，因為 `useLeaveGame` 除了離開對話框，也會在頁面隱藏時自動存檔，不這樣做就可能存到只填一半的盤面。剩下的格子若解完整盤，就進慶祝而不開對話框。

### 合併群組效果

整批填完後，把每格完成的列、欄、宮去重合併，以最後一格為起點播一次 `useGroupEffect.play()`。若逐格播，新效果會取代舊效果，只看得到最後一個。整盤完成時直接進慶祝，和一般填入一致。

### 空白連點的判定

兩次點擊都落在遊戲畫面內、但不在盤面（含盤面框）、`game-inputs` 區塊或任何按鈕和連結上，且間隔不超過 300ms、距離不超過 24px，才算連點。不用瀏覽器的 `dblclick`，判定才能在各引擎一致。遊戲畫面加上 `touch-action: manipulation`，避免 iOS 把連點當成縮放。

### 簡單難度不作用也不提示

簡單難度下連點完全沒有反應，設定開著也一樣，且不跳任何訊息。擁有者認為會主動開這個設定的玩家看得到設定說明。

### 開局自動筆記不進復原歷史

`gameStore.startNewGame()` 依設定呼叫 `Sudoku.autoNotes()`，涵蓋新遊戲和再玩一局。因為遊戲畫面會重建 `Sudoku`，這份快照不會進入復原歷史；`captureInitialBoard` 會把筆記存進遊戲回顧的初始盤面。不記錄 `autoNotes` 步驟，但 `GameStepAction` 保留該值，舊回顧才能繼續顯示。設定只影響之後開的局，繼續舊遊戲時不改動。

### 提示不限次數且取消首次免費

`HintTracker` 只留 `totalUsed`、`useHint()` 和 `restore()`。提示選單只剩「檢查衝突」和「揭示一格」，移除剩餘次數、用完和免費說明。紀錄、完成畫面和分析事件都改用實際次數。

### 平均提示次數比照平均時間

`DifficultyStats` 新增 `averageHints`，只算該難度完成的遊戲，沒有完成的遊戲時為 `null` 並顯示「—」，顯示到小數一位。統計頁每個難度的數值從 3 欄變 4 欄，把難度名稱移到數值上方，窄螢幕才放得下時間。

### 設定沿用方塊並分成兩組

遊戲區塊沿用 `OptionTile`，拆成「操作」和「顯示」兩個 `SettingsGroup`，各 2×2。擁有者先前特地把開關改成方塊（`b2a1e66`），任務 1.2 的開關列推翻了這個決定，所以改回。各風格既有的 `tile` 和 `check` 外觀直接沿用，不需要新的開關外觀。不開子頁面，因為 8 個方塊仍在同一頁的合理長度內。

| 組別 | 方塊 |
|---|---|
| 操作 | `floatingDigitPad`、`doubleTapFill`、`autoNotesAtStart`、`autoRemoveNotes` |
| 顯示 | `highlightSameDigit`、`highlightScope`、`showRemainingCount`、`motionEffects` |

### 各風格設計先上 canvas 再做 skin

先在風格研究 canvas 畫 9 個風格的懸浮數字鍵，擁有者確認後才寫 `skin.css`。基礎版只用共用 token，所以在各風格 skin 完成前功能已可用。

### 模擬器實機測試

單元測試和桌面瀏覽器測不到真實的觸控流程、WebView 和手機版面，所以這個變更要在模擬器上實際跑過才算完成，分兩次：功能做完先跑一次，風格畫板開始前就能發現版面和觸控問題；全部完成後再跑一次最終檢查。

| 模擬器 | 用途 |
|---|---|
| `Pixel_3a_API_34_extension_level_7_arm64-v8a` | 小螢幕 Android；另用 `adb shell wm size` 和 `wm density` 調成 360×640 dp 量空白區 |
| `Pixel_7_Pro_API_34` | 一般大手機；9 個風格的最終檢查 |
| `Pixel_8_Pro_API_35` | 較新的 Android 版本，確認最終版本可正常操作 |
| `iPhone SE (3rd generation)` | 矮螢幕 iPhone；Safari 的連點不會縮放、空白區是否夠用 |
| `iPhone 16` | 有瀏海和 Home 指示條的 iPhone；懸浮鍵和連點 |

觸控要走裝置的真實輸入路徑，不能用頁面內的 `element.click()`。Android 單點用 `adb shell input tap`；連點用 WebView DevTools 的 `Input.dispatchTouchEvent`，因為連續兩個 `adb` 指令不一定落在 300ms 內（未量測，任務 4.4 第一次跑時確認）。iOS 模擬器沒有對應的指令，改為點 Simulator 視窗，App 由本機 Vite 開發伺服器提供；`localhost` 是安全環境，所以 New Game 可以用。

模擬器點的是精確座標，只能確認按鍵範圍正確，不能代表手指的手感和誤觸率，這部分仍要靠擁有者在真機判斷。

## Implementation Contract

**Behavior**

- 懸浮數字鍵：見規格 `floating-digit-pad`。開啟時，點遊戲畫面的空白處會取消選取並收起；關閉時完全維持現況。
- 連點填入：見規格 `single-note-fill`。第一下點空白會照常收起懸浮鍵，第二下才觸發。
- 自動筆記、提示、統計：見規格 `auto-notes-setting`、`hint-usage`。
- 設定頁：見規格 `gameplay-settings`。

**Interface / data shape**

- `Settings` 新增 `floatingDigitPad: boolean`、`doubleTapFill: boolean`、`autoNotesAtStart: boolean`，預設皆為 `false`；`settingsStore` 提供對應 setter。
- `Sudoku.singleNoteCells(): { row: number; column: number; digit: number }[]`，依閱讀順序。
- `Sudoku.beginFillRun(): void` 存快照；`Sudoku.fillInRun(row, column, digit, { autoRemoveNotes })` 填入但不存快照。
- `floatingPadSize(cellSize): { rows: number; columns: number }`：懸浮鍵以格為單位的大小。
- `floatingPadPlacement(cell, size): { rowStart: number; columnStart: number }`：純函式，以格為單位。
- `FloatingDigitPad.vue` props：`cell`、`digitCounts`、`noteMode`、`currentEntry`、`currentNotes`、`disabledDigits`、`eraseDisabled`；emits：`selectDigit`、`erase`。
- `DifficultyStats.averageHints: number | null`。
- `ToastContent` 新增 `singleNotesFilled`（帶 `count`）和 `noSingleNotes`。
- Skin hooks：`floating-pad`、`floating-key`、`floating-erase`。

**Failure modes**

- 舊設定存檔沒有新欄位時用預設值。
- 舊存檔的 `hintsUsed` 超過舊上限不是問題，因為不再有上限。
- WebGL 失效、WebKit 無法用遮罩寫字時，動畫走各風格既有的退路，填入結果不變。動態效果關閉時沒有逐格間隔和進場動畫。

**Acceptance criteria**

- 每個 Requirement 的情境都有 Vitest 測試。
- `npx vitest run`、`npm run lint`、`npm run build` 通過。
- 9 個風格的懸浮數字鍵在 Chromium、WebKit、Firefox 都檢查過。
- 決策「模擬器實機測試」列出的模擬器都實際跑過，並向擁有者回報每項結果和截圖。模擬器無法執行或某項無法操作時，對應任務保持未完成並回報，不以桌面瀏覽器結果代替。

**Scope boundaries**

- 範圍內：本文件列出的功能、9 個風格的懸浮數字鍵 skin、`CLAUDE.md` 的 skin hook 說明、`UNRELEASED_CHANGES`。
- 範圍外：Goals / Non-Goals 列出的項目。

## Risks / Trade-offs

- [懸浮鍵擋到同宮的格子，而同宮正是判斷依據之一] → 擁有者試過示意後接受；設定預設關閉，可隨時關掉。
- [點已填的格子只想看相同數字時也會跳出懸浮鍵] → 擁有者明確要求可以改已填的格子；再點一次該格或點空白就收起。
- [懸浮鍵按鍵最小 36px，低於常見的 44～48px 觸控建議] → 擁有者選定最小 36px；模擬器確認按鍵範圍和實際尺寸，手感和誤觸由擁有者在真機判斷。
- [實測 Pixel 3a 上，點中間的鍵左右距邊緣 3～4px 時，WebView 會歸給隔壁的鍵；調間距、圓角和 `touch-action` 都未消除，盤面格子和下方數字鍵沒有此現象] → 只出現在各 2px 的窄帶，且模擬器的觸控半徑和真手指不同，由擁有者在真機判斷是否處理。
- [矮手機的空白處很少：依版面類別推算，盤面左右只剩約 8px，上下的彈性空間可能是 0] → 任務 3.2 在 360×640 實測可點的空白區；不足時把 `game-inputs` 內的間隙也算空白，並回報擁有者。
- [誤觸連點一次填很多格] → 一次復原全部還原。
- [舊紀錄少算第一次提示，平均偏低] → 擁有者接受，不補正。
- [`hints_total` 移除後 GA4 的對應維度不再有新資料] → 提案已標明。
- [9 個風格都要設計，變更量大] → 基礎版先可用，skin 分批做，每批可獨立驗證。

## Migration Plan

設定和紀錄都不需要資料遷移。進行中的舊遊戲照常繼續，提示次數沿用存檔的 `hintsUsed`。回復時改回舊版即可，新設定欄位會被忽略。

## Open Questions

無。
