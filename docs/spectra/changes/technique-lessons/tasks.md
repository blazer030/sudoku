## 1. 課程核心

- [x] 1.1 完成 Curriculum 與內容模型（Lesson content lives in the domain as data）：`src/domain/lessons/` 能列出四組 17 課，`lessonForTechnique` 對 19 個 `TechniqueId` 都回傳一課。同時建立內容驗證工具（Every lesson board is validated by the technique solver，Lesson boards are verified），用 `BoardState.fromPuzzle` 加 `eliminate` 重建盤面，再和對應技巧的 `find` 結果比對。以 `src/__tests__/domain/lessons/curriculum.test.ts` 驗證順序與對應，並用一個故意寫錯的盤面確認驗證工具會失敗。
- [x] 1.2 [after: 1.1] 完成練習判定（Practice is a pure state machine in the domain）：`practiceReducer` 處理 `place`、`pick`、`remove`、`fill`、`note` 五種步驟，涵蓋 Wrong answers explain themselves 的每種原因、Layered hints 的分段與最後才給答案，以及 Independent practice has one target 接受任一合法答案。以 `src/__tests__/domain/lessons/practiceReducer.test.ts` 驗證規格裡的範例表。

## 2. 課程畫面（先做極簡）

- [ ] 2.1 [after: 1.1] 讓共用棋盤支援教學標示（Lesson boards reuse Cell and StepCellView）：`StepCellView` 新增 `crossed`、`dimmed` 與 `target`，`BoardCell` 輸出 `data-crossed`、`data-dimmed`、`data-variant="target"`。這一步完成 Target digits get their own cell variant、Target digits、Crossed-out cells（The cross mark is an icon），以及 Dimmed digits（Dimmed digits use a per-style colour token, not opacity，含 palette token `lesson-dim`）。以 `BoardCell` 元件測試驗證，並確認遊戲中選數字仍是 `same-digit`、提示模式與解題演示的現有測試不變。
- [ ] 2.2 [after: 1.1] 完成 Lesson list 頁：路由 `/lessons` 與 `/lessons/:lessonId`、不存在的課程導回列表、下一課標示、分組計數、學完一組可開新遊戲、`ScreenName` 新增 `lessons` 與 `lesson`。以 `src/__tests__/presentation/pages/lessons/LessonList.test.ts` 和 `screenTracking` 測試驗證，含語言切換（Lesson language）。
- [ ] 2.3 [after: 1.2, 2.1] 完成 `LessonScreen` 的 Lesson stages 與 Explanation steps：`LessonPanel`（The lesson panel composes the step components）可前後翻步、跳到練習，未解的練習不能往下走；符合 One message at a time，訊息切換時棋盤不移動。以元件測試驗證流程，並在 360×640 量測棋盤位置與按鈕都在畫面內。
- [ ] 2.4 [after: 2.3] 完成 Practising by tapping 與 Notes in lessons：點格子填數字、點出規律、點格子刪候選數；要決定數字時才開 `FloatingDigitPad`，不看懸浮鍵設定，也沒有常駐數字鍵；簡單的課不顯示筆記，中等以上顯示全部候選數。提示與答錯原因接上文案。以 `LessonScreen` 元件測試驗證，含懸浮鍵設定關閉的情況。
- [ ] 2.5 [after: 2.4] 完成 Completion 與 Lesson progress（Lesson progress has its own repository）：整課走完才記錄完成，完成畫面顯示一句話重點並提供下一課，一組的最後一課改提供新遊戲；進度重開 App 還在，「清除紀錄」不影響，讀不到時視為未完成；統計和存檔不受影響。以 `lessonStore` 與 repository 的測試驗證。

## 3. 入口

- [ ] 3.1 [after: 2.2] 完成首頁 Four entries、Lesson entry subtitle 與 Home fits short windows（Home sizes extend the existing step）：入口改成 2×2 並以技巧教學為第一格，依高度分段縮小，500 高以下隱藏副標。在瀏覽器量測 9 種風格有存檔時的總高，把設計和規格裡的估計值校正成實際值（數字有差異時同步更新 `home-lesson-entry` 規格）後，更新 `Home.test.ts` 的尺寸加總與入口順序。同時驗證 Tall screens keep their sizes：390×844 逐元素比對舊版，只有入口區和卡片周圍的空間不同。
- [ ] 3.2 [after: 2.5] 完成 Learning from the Walkthrough（Lessons open over the Walkthrough rather than by route）：技巧標籤旁有「學這招」，課程疊在解題演示上，返回鈕和系統返回鍵都回到同一步，播放狀態不變；提示模式沒有連結。以 `SolverWalkthrough` 元件測試驗證，並用 `HintPanel` 測試確認沒有連結。

## 4. 課程內容

- [ ] 4.1 [after: 2.5, 3.2] 寫好基礎與簡單四課（規則、填數字與筆記、隱藏唯一數、唯一候選數）的盤面與兩種語言文案，文案照 CLAUDE.md 的列、欄、宮用語。以內容驗證測試確認盤面有效且答案符合題目唯一解，並手動走完四課。
- [ ] 4.2 [after: 4.1] 寫好中等六課（宮區塊摒除、行列區塊摒除、顯性與隱性數對、顯性與隱性三數組與四數組）的盤面與文案，盤面取自解題器實際走到的局面。以內容驗證測試確認每一步的規律與可刪項目等於對應技巧的結果，並手動走完六課。
- [ ] 4.3 [after: 4.2] 寫好困難七課（X-Wing、Swordfish 與 Jellyfish、XY-Wing、W-Wing、XYZ-Wing 與 WXYZ-Wing、X 鏈、XY 鏈）的盤面與文案，連線沿用 `StepLinkOverlay` 並畫在數字下方。以內容驗證測試確認結果，手動走完七課，並在 360×640 確認 X 鏈、XY 鏈的文字能捲動讀完。

## 5. 各風格

- [ ] 5.1 [after: 2.5, 3.1] 讓其他 8 種風格完成 Lessons in every style 與 Lesson state marks（Lesson rows get their own skin hooks）：新增 `lesson-row`、`lesson-mark`，各風格畫出自己的記號；新增技巧教學圖示的 8 套畫法；補上 `lesson-dim` 色值與對比下限 1.5:1 的測試。以 `styleCoverage.test.ts`、`iconSets.test.ts`、`paletteContrast.test.ts` 驗證，並照 `Sketch.dc.html` 比對 8 種風格的截圖。
- [ ] 5.2 [after: 2.1, 2.2, 3.2] 完成 8-bit range and pattern marks 與 Handheld notice（The handheld notice is remembered in settings）：範圍用暗點、目標反白、規律格維持淺底讓線看得到、被刪候選數斜線加粗；掌機進教學先提醒，可換成紅白機、看其他風格或繼續，選繼續後記住，從解題演示進入也一樣。以 `pixelSkin.test.ts` 與 `settingsStore` 測試驗證，並截圖比對 `PixelOptions.dc.html`、`PixelNotice.dc.html`，同時確認遊戲中的 `same-digit` 外觀不變。

## 6. 收尾

- [ ] 6.1 [after: 4.3, 5.1, 5.2] 完成上線前檢查：在 `UNRELEASED_CHANGES` 加一行兩種語言的「技巧教學」；新的水墨標題加進 `INK_BRUSH_MESSAGE_KEYS`；跑 `npm run generate:fonts`、`generate:theme-css`、`generate:icons`；`npx vitest run`、`npm run lint`、`npm run build` 全過；在 Chromium、WebKit、Firefox 看過 9 種風格的課程列表與課程頁，動態效果關閉時也看過；在 Android 模擬器比對首頁 844 高以上與舊版相同，並檢查返回鍵。
