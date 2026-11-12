## Why

技巧教學第一版教得完每一招，但對第一次學的人還有幾處會卡住或誤解。最直接的一處是：隱藏唯一數只教在宮裡找，可是簡單題常常要在列或欄裡找，群組說明卻寫「學完就能解開所有簡單題」。這次參考 sudoku.coach Campaign 的教法，在不改課程數量與流程的前提下做「教學優化」。

## What Changes

- **隱藏唯一數補列／欄**：講解加上在列（或欄）裡找的例子，並說明先看宮再看列欄的理由（宮和一條線交 3 格，兩條線只交 1 格）；跟著做加一個在列裡找的步驟。仍是同一課，課程數維持 17 課。
- **「放得下」不等於「一定是」**：在隱藏唯一數的講解裡示範推出矛盾。先在一格填入一個跟周圍不衝突、卻不是答案的數字，順著唯一數推幾步，最後某一宮放不下那個數字，結論是只填確定的數字。盤面需要一種新標示「假設的數字」：推理中先假設填入的數字，畫法沿用現有的填入樣子，被推翻時改用現有的填錯樣子。
- **簡單到中等的過渡**：中等組第一課（宮區塊摒除）開頭加一步，說明從這裡起技巧多半是刪候選數、不是直接填數字，所以盤面會列出所有候選數，遊戲裡可以開設定的自動筆記。
- **反例與「怎麼找」**：
  - 宮區塊摒除、行列區塊摒除各加一個不成立的例子：候選數超出宮和線的交會時，什麼都不能刪。
  - X-Wing、XY-Wing 各加一步搜尋方法。
  - XY-Wing 加一個形狀成立、但沒有格子能刪的例子。
- **數組的互補**：在隱性三數組／四數組這課加一步，說明一個區域裡的隱性數組旁邊一定有互補的顯性數組，所以不必找超過 4 格的組合，難找時改找比較小的那一組。
- **講解的文字對得上格子**：一步的文字講了兩件以上、各自關於不同格子的事（例如兩種情況寫在同一步，或先介紹規律再刪某一格），就拆成幾步，每步只標文字講到的格子。拆的有 XYZ-Wing 的兩種情況、WXYZ-Wing 和 Jellyfish 的「規律」與「刪」。文字順著一條推論一格接一格講下去的步驟（例如 XY 鏈、X-Wing 的「如果…那麼…」），之後改用依序亮起的動畫輔助；動畫連同重播鈕與各風格的效果，owner 決定拆成另一個 change，這次不做。
- **語氣與用詞**：
  - 自己找完成時的訊息帶鼓勵。
  - 練習卡住時提醒可以按提示：連錯 3 次或 10 秒沒動作，訊息後面加一句提醒，提示鈕閃幾下（動態效果關閉時改成亮著不閃）。
  - 課程列表的基礎組說明讓玩家知道可以照自己的步調、跳著學。
  - 隱藏唯一數、唯一候選數、宮區塊摒除／行列區塊摒除第一次出現時，順帶提玩家在別處常見的別名（例如摒除法、唯餘法、區塊摒除法）。
- **驗證跟著擴充**：新的盤面和步驟也要由內容測試證明說的是真的，包括假設的數字確實不是答案、每一步推論都成立、反例確實不成立、互補的格子確實是一組。

**影響的風格**：「假設的數字」沿用現有的填入與填錯樣子，提示鈕的提醒用各風格自己的主色，都不需要各風格另畫，但 9 種風格都要確認看得清楚。其他改動只動課程內容與文案，跟風格無關。**玩家看得到**：會在 `UNRELEASED_CHANGES` 加一行（目前是空的）。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `technique-lessons`：隱藏唯一數涵蓋列／欄並示範「只填確定的數字」；中等組開頭的過渡；反例、搜尋方法與數組互補的講解；講解拆步讓文字對得上標示的格子；文案提到提示、步調與別名；內容驗證涵蓋新的步驟類別。
- `lesson-board-marks`：新增「假設的數字」標示，以及被推翻時的畫法。

## Impact

- **課程內容**：`src/domain/lessons/content/basicsAndEasy.ts`、`src/domain/lessons/content/medium.ts`、`src/domain/lessons/content/hard.ts`。
- **課程模型與驗證**：`src/domain/lessons/Lesson.ts`（`StepMarks` 加假設的數字）、`src/domain/lessons/verifyLesson.ts`。
- **盤面呈現**：`src/presentation/pages/lessons/lessonCellView.ts`、`src/presentation/pages/lessons/useLessonSession.ts`。
- **卡住提醒**：`src/domain/lessons/practice.ts`（連錯次數）、`src/presentation/pages/lessons/` 下的課程畫面與面板（閒置計時、提示鈕的提醒）。
- **文案與字型**：`src/presentation/i18n/messages/lessons/` 下的課程文案與 `en.ts`、`zh-Hant.ts`，`src/presentation/pages/settings/changelogData.ts`；新的中文字要重跑 npm run generate:fonts。
- **測試**：`src/__tests__/domain/lessons/content/lessonContent.test.ts`、`src/__tests__/presentation/pages/lessons/lessonCellView.test.ts`。
- 不需要新的相依套件。
