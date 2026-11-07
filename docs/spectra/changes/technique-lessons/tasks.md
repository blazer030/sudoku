## 1. 課程核心

- [x] 1.1 完成 Curriculum 與內容模型（Lesson content lives in the domain as data）：`src/domain/lessons/` 能列出四組 17 課，`lessonForTechnique` 對 19 個 `TechniqueId` 都回傳一課。同時建立內容驗證工具（Every lesson board is validated by the technique solver，Lesson boards are verified），用 `BoardState.fromPuzzle` 加 `eliminate` 重建盤面，再和對應技巧的 `find` 結果比對。以 `src/__tests__/domain/lessons/curriculum.test.ts` 驗證順序與對應，並用一個故意寫錯的盤面確認驗證工具會失敗。
- [x] 1.2 [after: 1.1] 完成練習判定（Practice is a pure state machine in the domain）：`practiceReducer` 處理 `place`、`pick`、`remove`、`fill`、`note` 五種步驟，涵蓋 Wrong answers explain themselves 的每種原因、Layered hints 的分段與最後才給答案，以及 Independent practice has one target 接受任一合法答案。以 `src/__tests__/domain/lessons/practiceReducer.test.ts` 驗證規格裡的範例表。

## 2. 課程畫面（先做極簡）

- [x] 2.1 [after: 1.1] 讓共用棋盤支援教學標示（Lesson boards reuse Cell and StepCellView）：`StepCellView` 新增 `crossed`、`dimmed` 與 `target`，`BoardCell` 輸出 `data-crossed`、`data-dimmed`、`data-variant="target"`。這一步完成 Target digits get their own cell variant、Target digits、Crossed-out cells（The cross mark is an icon），以及 Dimmed digits（Dimmed digits use a per-style colour token, not opacity，含 palette token `lesson-dim`）。以 `BoardCell` 元件測試驗證，並確認遊戲中選數字仍是 `same-digit`、提示模式與解題演示的現有測試不變。
- [x] 2.2 [after: 1.1] 完成 Lesson list 頁：路由 `/lessons` 與 `/lessons/:lessonId`、不存在的課程導回列表、下一課標示、分組計數、學完一組可開新遊戲、`ScreenName` 新增 `lessons` 與 `lesson`。以 `src/__tests__/presentation/pages/lessons/LessonList.test.ts` 和 `screenTracking` 測試驗證，含語言切換（Lesson language）。
- [x] 2.3 [after: 1.2, 2.1] 完成 `LessonScreen` 的 Lesson stages 與 Explanation steps：`LessonPanel`（The lesson panel composes the step components）可前後翻步、跳到練習，未解的練習不能往下走；符合 One message at a time，訊息切換時棋盤不移動。以元件測試驗證流程，並在 360×640 量測棋盤位置與按鈕都在畫面內。
- [x] 2.4 [after: 2.3] 完成 Practising by tapping 與 Notes in lessons：點格子填數字、點出規律、點格子刪候選數；要決定數字時才開 `FloatingDigitPad`，不看懸浮鍵設定，也沒有常駐數字鍵；簡單的課不顯示筆記，中等以上顯示全部候選數。提示與答錯原因接上文案。以 `LessonScreen` 元件測試驗證，含懸浮鍵設定關閉的情況。
- [x] 2.5 [after: 2.4] 完成 Completion 與 Lesson progress（Lesson progress has its own repository）：整課走完才記錄完成，完成畫面顯示一句話重點並提供下一課，一組的最後一課改提供新遊戲；進度重開 App 還在，「清除紀錄」不影響，讀不到時視為未完成；統計和存檔不受影響。以 `lessonStore` 與 repository 的測試驗證。

## 3. 入口

- [x] 3.1 [after: 2.2] 完成首頁 Four entries、Lesson entry subtitle 與 Home fits short windows（Home sizes extend the existing step）：入口改成 2×2 並以技巧教學為第一格，依高度分段縮小，500 高以下隱藏副標。在瀏覽器量測 9 種風格有存檔時的總高，把設計和規格裡的估計值校正成實際值（數字有差異時同步更新 `home-lesson-entry` 規格）後，更新 `Home.test.ts` 的尺寸加總與入口順序。同時驗證 Tall screens keep their sizes：390×844 逐元素比對舊版，只有入口區和卡片周圍的空間不同。
- [x] 3.2 [after: 2.5] 完成 Learning from the Walkthrough（Lessons open over the Walkthrough rather than by route）：技巧標籤旁有「學這招」，課程疊在解題演示上，返回鈕和系統返回鍵都回到同一步，播放狀態不變；提示模式沒有連結。以 `SolverWalkthrough` 元件測試驗證，並用 `HintPanel` 測試確認沒有連結。

## 4. 課程內容

- [x] 4.1 [after: 2.5, 3.2] 寫好基礎與簡單四課（規則、填數字與筆記、隱藏唯一數、唯一候選數）的盤面與兩種語言文案，文案照 CLAUDE.md 的列、欄、宮用語。以內容驗證測試確認盤面有效且答案符合題目唯一解，並手動走完四課。
- [x] 4.2 [after: 4.1] 寫好中等六課（宮區塊摒除、行列區塊摒除、顯性與隱性數對、顯性與隱性三數組與四數組）的盤面與文案，盤面取自解題器實際走到的局面。以內容驗證測試確認每一步的規律與可刪項目等於對應技巧的結果，並手動走完六課。
- [x] 4.3 [after: 4.2] 寫好困難七課（X-Wing、Swordfish 與 Jellyfish、XY-Wing、W-Wing、XYZ-Wing 與 WXYZ-Wing、X 鏈、XY 鏈）的盤面與文案，連線沿用 `StepLinkOverlay` 並畫在數字下方。以內容驗證測試確認結果，手動走完七課，並在 360×640 確認 X 鏈、XY 鏈的文字能捲動讀完。

## 5. 各風格

- [x] 5.1 [after: 2.5, 3.1] 讓其他 8 種風格完成 Lessons in every style 與 Lesson state marks（Lesson rows get their own skin hooks）：新增 `lesson-row`、`lesson-mark`，各風格畫出自己的記號；新增技巧教學圖示的 8 套畫法；補上 `lesson-dim` 色值與對比下限 1.5:1 的測試。以 `styleCoverage.test.ts`、`iconSets.test.ts`、`paletteContrast.test.ts` 驗證，並照 `Sketch.dc.html` 比對 8 種風格的截圖。
- [x] 5.2 [after: 2.1, 2.2, 3.2] 完成 8-bit range and pattern marks 與 Handheld notice（The handheld notice is remembered in settings）：範圍用暗點、目標反白、規律格維持淺底讓線看得到、被刪候選數斜線加粗；掌機進教學先提醒，可換成紅白機、看其他風格或繼續，選繼續後記住，從解題演示進入也一樣。以 `pixelSkin.test.ts` 與 `settingsStore` 測試驗證，並截圖比對 `PixelOptions.dc.html`、`PixelNotice.dc.html`，同時確認遊戲中的 `same-digit` 外觀不變。

## 6. 收尾

- [x] 6.1 [after: 4.3, 5.1, 5.2] 完成上線前檢查：在 `UNRELEASED_CHANGES` 加一行兩種語言的「技巧教學」；新的水墨標題加進 `INK_BRUSH_MESSAGE_KEYS`；跑 `npm run generate:fonts`、`generate:theme-css`、`generate:icons`；`npx vitest run`、`npm run lint`、`npm run build` 全過；在 Chromium、WebKit、Firefox 看過 9 種風格的課程列表與課程頁，動態效果關閉時也看過；在 Android 模擬器比對首頁 844 高以上與舊版相同，並檢查返回鍵。

## 7. Verify 之後的修正

任務 1.2、2.1 當時寫的 `{ state, feedback }` 回傳值、`data-crossed` 與必填欄位和實作不同，以 `design.md` 的 Interface 段落為準；任務 5.1 的「各風格畫出自己的記號」改由 Lesson state marks 的新寫法取代。

- [x] 7.1 修正 Lesson stages 的跳到練習：`useLessonSession` 的 `skipToPractice` 走到目前步驟之後的下一個練習，後面沒有練習時 `LessonPanel` 不顯示這顆按鈕。以 `LessonScreen.test.ts` 的交錯講解與練習課程驗證，新測試要先失敗。
- [x] 7.2 修正 Completion 的 Finishing from the Walkthrough：從解題演示開的課，完成時只剩回解題演示的按鈕。以 `LessonScreen.test.ts` 驗證 `lesson-secondary` 不存在，新測試要先失敗。
- [x] 7.3 修正 Learning from the Walkthrough 的掌機提醒：`openLessonOfStep` 在提醒前就暫停播放並記下課程；取消提醒時恢復播放且不註冊返回鍵處理；去外觀頁時不恢復。以 `SolverWalkthrough.test.ts` 的「播放中加掌機」驗證，新測試要先失敗。
- [x] 7.4 完成 Board placement on tall screens（The board sits midway above the panel on tall screens）：`LessonScreen` 加上棋盤上方的空白與面板區基準。在 Chromium 量測 360×800、390×844、412×915 的上下空白與 17 課每一步的棋盤位置，並確認 320×568、360×640 棋盤位置和改動前相同；在 WebKit、Firefox 與藍圖（棋盤框多佔高度）各看一次。把量測值寫回 `design.md` 取代預估值。
- [x] 7.5 確認 Lesson state marks 的新寫法：9 種風格（8-bit 含兩種模式）的課程列表截圖，三種狀態都分得出來。分不出來的風格補規則。
- [x] 7.6 補測試：Hint 分段改測隱藏唯一數這課真實的提示內容，並移除沒有課程使用的 `FillRule` `hiddenSingle` 分支與它的文案；首頁副標用規格範例的 6 課驗證（用文案鍵，不寫死字串）；`reducedMotion.test.ts` 確認教學頁和課程記號的規則沒有靠動畫才看得到的狀態。`npx vitest run`、`npm run lint`、`npx vue-tsc --noEmit` 全過。

## 8. 第二次 Verify 之後的修正

owner 2026-11-07 的裁定：點已有數字的格子不算點錯；「填數字與筆記」的講解不淡化；按提示要一步一步教。

- [x] 8.1 完成 Notes in lessons 的 The notes toggle shows it is on：筆記鍵加上 `lesson-toggle` hook，水墨、黑板、藍圖、極光、賽博、8-bit 用各自選取的樣子標出開啟。以 `styleCoverage.test.ts` 驗證規則存在，並在 Chromium 比對 9 種風格 45 種主題與明暗組合的開關差異。
- [x] 8.2 完成 Layered hints 的 The Rules lesson teaches step by step：「規則」課的填數字步驟改成三層提示，填完一格後從下一格重新開始。以 `practiceReducer.test.ts` 驗證，新測試要先失敗，並在瀏覽器走過一次。
- [x] 8.3 移除沒有課程會出現的 `notCertain`、`notTheAnswer` 與文案。在 `lessonContent.test.ts` 新增每課每個空格每個數字的列舉，點錯或按錯都必須有原因。
- [x] 8.4 補測試：`LessonPage.test.ts`（返回、下一課取代目前記錄、開新遊戲、直接開網址時的提醒）、`LessonList.test.ts`（各難度的開新遊戲）、`lessonStore.test.ts`（清除紀錄不影響進度）、`LessonScreen.test.ts`（列、欄、宮的原因文字）、`practiceReducer.test.ts`（列與宮的衝突）、`lessonContent.test.ts`（提示最後標出答案、自己找的步驟不標範圍）。
- [x] 8.5 把上述裁定寫進規格與設計文件，並更新 `CLAUDE.md` 的 skin hook 清單。`npx vitest run`、`npm run lint`、`npx vue-tsc --noEmit` 全過。
- [x] 8.6 修正 Home fits short windows：把首頁的兩個分界提高到 624 與 550，英文的解題演示副標縮短成一行，水墨標題在窄視窗提早到 812 換小字、寬視窗維持 740。用瀏覽器逐高度量 480 到 850（有存檔），並和改動前的版本比對 844 高以上與寬視窗，除了四格和它撐開的空白，元素大小都相同。
- [x] 8.7 補 The Filling in lesson dims nothing 的測試（`lessonContent.test.ts`），並修正文件與程式的落差：課程面板不會縮小、「基礎」組沒有難度、點錯的數字會暫留在格子上、提案不再列 `brushTitles.ts`、`CLAUDE.md` 的架構段落列出技巧教學。

owner 2026-11-07 的第二批裁定：拿掉解題演示的「學這招」（Supersedes 任務 3.2、5.2 的「從解題演示進入」、7.2、7.3 的入口與修正；它們的記錄保留，程式已移除）；320 寬的英文首頁和寬而矮的視窗可以稍微捲動，不再處理。

- [x] 8.8 拿掉 Learning from the Walkthrough，改成 Entry points：`SolverWalkthrough` 不再有「學這招」、課程疊層與掌機提醒；`LessonScreen` 去掉 `fromWalkthrough`；刪除兩處文案；`lessonForTechnique` 改成匯出 `LESSON_BY_TECHNIQUE`。以 `SolverWalkthrough.test.ts` 沒有 `walkthrough-learn`、`curriculum.test.ts` 仍驗證 19 種技巧都有課驗證。
- [x] 8.9 修正講解最後一步的按鈕：下一步是完成時寫「下一步」而不是「換你試試」；下一步就是練習時不再另外顯示「跳到練習」。以 `LessonScreen.test.ts` 驗證，新測試要先失敗。
- [x] 8.10 移除不會出現的 `selectCellFirst` 與文案（數字鍵只在選了格子時顯示）。
- [x] 8.11 遊戲提示模式的連線畫在數字下方，與解題演示、教學一致：`GameScreen` 的棋盤格在有連線時帶 `has-step-links`。以 `Game.test.ts` 走到真實盤面有連線的那一步驗證，拿掉這個 class 測試要失敗，並在瀏覽器確認 9 種風格的堆疊順序。
- [x] 8.12 從課程開新遊戲時，「還有一局沒完成」對話框的留下按鈕改寫成留在教學（首頁維持「留在首頁」）。以 `LessonPage.test.ts` 或 `LessonList.test.ts` 用文案鍵驗證。

任務 6.1 的「新的水墨標題加進 `INK_BRUSH_MESSAGE_KEYS`」最後不需要：唯一新增的對話框標題只在 8-bit 出現，水墨不會顯示。

- [x] 8.13 依 owner「點題目的格子原本就不算錯」，圈出格子的步驟點已填格也不說明（`practiceReducer.test.ts`，新測試要先失敗）；移除走不到的「最後一課之後」分支。
- [x] 8.14 補測試：課程頁與解題演示的 `has-step-links`、從課程頁與課程列表按「留在教學」後不換頁也不開新局、8-bit 範圍暗點的兩個色值。修正設計與提案裡過期的內容。
- [x] 8.15 在 Android 模擬器比對首頁與教學之前的版本（有存檔）：除了四格和它撐開的空白，元素大小都相同，首頁不用捲動。

owner 2026-11-07 在 NAS 測試伺服器上的回饋：隱藏唯一數「自己找」時點題目的 5 要能亮起所有 5，並在前面就說明這個功能。

- [x] 8.16 點已填格亮起相同數字也適用於 `place` 步驟，亮起的數字不淡化，點錯空格時維持亮著；隱藏唯一數在第一個練習前加一步說明，盤面亮出所有 7。寫筆記步驟點已填格不再說明原因（修正與「點題目的格子不算錯」的落差）。以 `practiceReducer.test.ts`、`lessonCellView.test.ts`、`LessonScreen.test.ts`、`lessonContent.test.ts` 驗證，新測試要先失敗，並在瀏覽器確認小手機放得下。

owner 2026-11-07：隱藏唯一數「跟著做」的第一步先讓玩家點一個 3 把 3 點亮，第二步不能改點其他數字。

- [x] 8.17 新增 `light` 步驟：點任一個指定數字即亮起並完成，點其他數字亮起但不算完成也不算錯，點空格說明原因。隱藏唯一數「跟著做」拆成兩步，第二步的 `place` 設 `holdsDigit`，點已填格不會改變亮的數字；「自己找」不設。以 `practiceReducer.test.ts`、`lessonContent.test.ts`、`LessonScreen.test.ts` 驗證，新測試要先失敗，並在瀏覽器走過一次。

owner 2026-11-07：一課結束和換課都太平淡，換課時感覺還在同一堂課；要加強結束，用彈窗說完成了，在彈窗上選要不要下一課。

- [x] 8.18 結束一課時開完成彈窗（`LessonCompleteDialog`），沿用通關卡片的 `celebration`、`trophy`、`complete-title` 與各風格的慶祝效果，顯示課名、重點、已完成課數，動作是下一課或玩一局、回課程、回上一步（系統返回鍵同回上一步）；完成時不顯示課程面板；換課時整頁淡出淡入；水墨標題加進 `INK_BRUSH_MESSAGE_KEYS` 並重產字型。以 `LessonScreen.test.ts` 驗證，新測試要先失敗，並在瀏覽器比對 9 種風格與小手機。

owner 2026-11-07：完成彈窗不要回上一步，只留下一課和回課程清單（Supersedes 任務 8.18 的「回上一步」，它的記錄保留）。

- [x] 8.19 完成彈窗拿掉回上一步，系統返回鍵改成回課程清單，按鈕文字改成「回課程清單」。設計文件補上 `light`、`holdsDigit`、完成彈窗與點亮規則。以 `LessonScreen.test.ts` 驗證，新測試要先失敗。

owner 2026-11-07：自己找的題目提到第幾列、欄、宮時要框出來，不然要先數位置，看錯還會白做（Supersedes 任務 8.4 的「自己找的步驟不標範圍」，它的記錄保留）。

- [x] 8.20 自己找的題目指名列、欄、宮時，`marks.range` 框出那裡（唯一候選數、宮區塊摒除、行列區塊摒除、顯性數對、隱性數對、顯性三數組、隱性三數組、X 鏈）；沒有指名的不框。以 `lessonContent.test.ts` 逐課檢查兩種語言的題目與框選一致，新測試要先失敗，並在瀏覽器確認。

owner 2026-11-07：從教學開局，通關後按「回到首頁」會回到教學；文字不改，要真的回首頁。

- [x] 8.21 通關卡片的「回到首頁」一律回首頁：上一頁是首頁時照舊返回，不多留一筆記錄；其他情況以取代方式前往首頁。以 `GameCompleteActions.test.ts` 驗證從課程與課程清單開局，新測試要先失敗，並在瀏覽器走完一局。
