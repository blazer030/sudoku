## 1. 設定基礎

- [x] 1.1 實作 Requirement「Floating pad setting」「Double-tap fill setting」「Auto notes setting」的儲存面：`Settings` 新增 `floatingDigitPad`、`doubleTapFill`、`autoNotesAtStart`，預設關閉，舊存檔讀到時用預設值，`settingsStore` 提供 setter 並持久化。以 `src/__tests__/application/settings/SettingsStorage.test.ts` 和 `src/__tests__/stores/settingsStore.test.ts` 驗證預設值、舊存檔和重新載入。
- [ ] 1.2 [after: 1.1] 實作 Requirement「Grouped toggle rows」（決策：設定改為兩組開關列）：新增 `SettingToggleRow`，以共用 token 呈現狀態，Settings 的遊戲區塊拆成操作和顯示兩組共 8 列，新增 `setting-row`、`switch` skin hook 和中英文案。以 `src/__tests__/presentation/pages/settings/Settings.test.ts` 驗證分組、按列切換、持久化、輔助技術讀得到狀態、切換語言，並確認外觀頁的 `OptionTile` 不受影響。

## 2. 自動筆記與提示

- [ ] 2.1 [after: 1.1] 實作 Requirement「Notes at game start」（決策：開局自動筆記不進復原歷史）：`gameStore.startNewGame()` 依設定帶入筆記，涵蓋新遊戲和再玩一局，不計提示、不可復原、遊戲回顧的初始盤面有筆記，繼續舊遊戲時不變動，舊回顧的 `autoNotes` 步驟照常顯示。以 `src/__tests__/stores/gameStore.test.ts`、`src/__tests__/presentation/pages/game/Game.test.ts` 和 `src/__tests__/presentation/pages/game-review/GameReview.test.ts` 驗證規格的每個情境。
- [ ] 2.2 [after: 2.1, 1.2] 實作 Requirement「Unlimited hints」「No free hint」「Hint menu options」（決策：提示不限次數且取消首次免費）：`HintTracker` 移除上限和免費次數，提示選單只剩檢查衝突和揭示一格，完成畫面、離開遊戲、首頁放棄舊遊戲和 `game_complete` 都記實際次數，移除 `hints_total` 和 `hint_used` 的 `auto_notes`，移除不再使用的文案。以 `src/__tests__/domain/game/HintTracker.test.ts`、`src/__tests__/presentation/pages/game/components/HintMenuPopup.test.ts`、`src/__tests__/presentation/pages/game/useHintActions.test.ts`、`src/__tests__/presentation/pages/home/Home.test.ts` 驗證，並確認 `vue-tsc` 沒有對舊 API 的引用。
- [ ] 2.3 [after: 2.2] 實作 Requirement「Average hints per difficulty」（決策：平均提示次數比照平均時間）：`DifficultyStats.averageHints` 只算完成的遊戲，統計頁每個難度顯示 4 個數值，難度名稱移到數值上方，沒有完成的遊戲顯示「—」。以 `src/__tests__/stores/statisticsStore.test.ts` 跑規格的平均值表格，以統計頁測試驗證顯示和語言切換，並在 320px 寬實測 4 個數值不溢出。

## 3. 連點填入

- [ ] 3.1 [after: 2.3] 實作 Requirement「Fill every single-note cell」「One undo for a fill run」「Staggered arrival」「Merged group effect」（決策：單一筆記填入先定計畫再全部填上、逐格填入且一次復原、合併群組效果）：`Sudoku.singleNoteCells()`、`beginFillRun()`、`fillInRun()`，以及遊戲頁的填入流程，含 60ms 間隔、動態效果關閉時一次填完、填入途中鎖定、按返回和頁面隱藏時補完（含 `useLeaveGame` 的自動存檔）、合併群組效果、整盤完成時只記一局。以 `src/__tests__/domain/game/Sudoku.test.ts` 和新的 `src/__tests__/presentation/pages/game/useSingleNoteFill.test.ts` 驗證只填一輪、衝突照填、一次復原、遊戲回顧逐步、計時和合併。
- [ ] 3.2 [after: 3.1, 1.1] 實作 Requirement「Blank double tap」「Easy games ignore double tap」「Fill feedback」（決策：空白連點的判定、簡單難度不作用也不提示）：遊戲畫面判定空白連點並加上 `touch-action: manipulation`，簡單難度無反應也無訊息，填入和沒有可填時顯示 toast。以 `src/__tests__/presentation/pages/game/` 下的元件測試跑規格的點擊表格、簡單難度和 toast，並依決策「模擬器實機測試」，在調成 360×640 dp 的 `Pixel_3a_API_34_extension_level_7_arm64-v8a` 和 `iPhone SE (3rd generation)` 模擬器實測可點的空白區。空白不足時依 `design.md` 的退路把 `game-inputs` 的間隙算進去，並回報擁有者。

## 4. 懸浮數字鍵

- [ ] 4.1 實作 Requirement「Floating pad placement」和元件本體（決策：懸浮鍵貼在格子斜角、懸浮鍵在可作答格出現並含擦除鍵、懸浮鍵共用元件與輸入入口）：純函式 `floatingPadPlacement` 和共用元件 `FloatingDigitPad.vue`，含 1～9、擦除鍵、已滿數字停用、筆記和目前數字的標示、動態效果關閉時無進場動畫，基礎外觀只用共用 token 且不透明。以測試跑全部 81 格，確認不超出盤面也不蓋到該格的列和欄，並跑規格的位置表格。
- [ ] 4.2 [after: 4.1, 3.2] 實作 Requirement「Floating pad opening」「Floating pad input」「Floating pad closing」的遊戲頁接線：開啟條件依規格表格，按鍵走 `selectDigit` 和 `toggleEraseMode`，筆記模式留著懸浮鍵，已填格子的筆記鍵不改盤面也不記步驟，設定開啟時點空白取消選取，並確認懸浮鍵蓋在群組效果、盤面框和 ink canvas 之上。以 `src/__tests__/presentation/pages/game/useGameInteraction.test.ts` 和 `src/__tests__/presentation/pages/game/Game.test.ts` 驗證規格的每個情境，設定關閉時行為不變。
- [ ] 4.3 [after: 4.2] 實作 Requirement「Floating pad on the Walkthrough」：解題演示的可編輯盤面使用同一元件，衝突數字停用，停止編輯後不出現。以解題演示的元件測試驗證輸入中、執行中和逐步播放中的情況，並確認兩頁 import 的是同一元件。
- [ ] 4.4 [after: 4.3] 依決策「模擬器實機測試」，在 `Pixel_3a_API_34_extension_level_7_arm64-v8a` 和 `Pixel_7_Pro_API_34` 模擬器跑功能實測。以 `npm run android:build:dev` 建置後安裝，本機 gradle 需設定 `JAVA_HOME=~/Library/Java/JavaVirtualMachines/temurin-25.0.4/Contents/Home`。觸控走真實輸入路徑，逐項確認：懸浮鍵在四個角落和中央格子的位置不超出盤面、點每個按鍵的中心和距邊緣 3px 都打到該鍵、填入、改數字、同數字清除、筆記模式和擦除；中等遊戲連點會逐格填入、消筆記、播放合併群組效果，按一次復原全部還原，填入途中按系統返回鍵或切到背景都不會存到只填一半的盤面，`window.visualViewport.scale` 維持 1；簡單遊戲連點沒有反應也沒有訊息；開局自動筆記、第 5 次提示、統計 4 個數值和設定 8 列都正確顯示。完成標準是每項結果和截圖都回報給擁有者，發現的缺陷先補測試再修。

## 5. 各風格外觀

- [ ] 5.1 [after: 4.4] 依決策「各風格設計先上 canvas 再做 skin」，在 `feature/style-research` worktree 用 `docs/style-research/generator/` 新增 9 個風格的懸浮數字鍵畫板（含筆記模式和擦除鍵），發布到風格研究 canvas。完成標準是擁有者確認各風格外觀；該分支不合併進 `develop`。
- [ ] 5.2 [after: 5.1, 1.2] 實作 Requirement「Per-style floating pad」的 minimal、tactile、paper：依 canvas 寫懸浮數字鍵和開關的 skin。以 `src/__tests__/style/styleCoverage.test.ts` 的 `REQUIRED_SELECTORS` 和 `paletteContrast.test.ts` 驗證，並在這三個風格各截圖確認。
- [ ] 5.3 [after: 5.2] 實作 Requirement「Per-style floating pad」的 pixel、cyber、ink：依 canvas 寫懸浮數字鍵和開關的 skin，檢查擦除圖示的漸層規則和 ink 的書法字型。以 `styleCoverage.test.ts`、`paletteContrast.test.ts` 驗證，並在這三個風格各截圖確認。
- [ ] 5.4 [after: 5.3] 實作 Requirement「Per-style floating pad」的 chalkboard、blueprint、aurora：依 canvas 寫懸浮數字鍵和開關的 skin，aurora 的懸浮鍵不透明並加入 `AURORA_BOARD_CASES`，檢查擦除圖示的 `--aurora-icon-*` 規則和 blueprint 盤面框的層級。以 `styleCoverage.test.ts`、`paletteContrast.test.ts` 驗證，並在這三個風格各截圖確認。

## 6. 收尾

- [ ] 6.1 [after: 4.3, 5.4] 把新的 skin hook 和懸浮數字鍵寫進 `CLAUDE.md`，在 `UNRELEASED_CHANGES` 加入或歸入中英文各一行，並完成跨引擎檢查：懸浮鍵、連點和設定列在 Chromium、WebKit、Firefox 都檢查過。最後跑 `npx vitest run`、`npm run lint`、`npm run build`，全部通過才算完成。
- [ ] 6.2 [after: 6.1] 依決策「模擬器實機測試」跑最終檢查：`Pixel_7_Pro_API_34` 逐一切換 9 個風格及其明暗模式，截圖懸浮鍵的一般、筆記和已填格子狀態與設定開關列，確認文字可讀且懸浮鍵蓋在盤面框和動畫之上；`Pixel_8_Pro_API_35` 跑一局從開局筆記、懸浮鍵輸入到連點完成並進入遊戲回顧；`iPhone SE (3rd generation)` 和 `iPhone 16` 用 Safari 確認懸浮鍵可操作，連點會填入且畫面不縮放，動態效果關閉時一次填完。完成標準是每台模擬器的結果和截圖都回報給擁有者，且所有發現的缺陷已修正並重跑該項；任何一台無法執行時本任務保持未完成並說明原因。
