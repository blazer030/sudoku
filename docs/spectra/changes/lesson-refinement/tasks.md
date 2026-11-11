## 1. 假設的數字（模型、驗證、畫法）

- [x] 1.1 完成 Lesson boards are verified 對假設的數字與矛盾的檢查。依「假設的數字用標示表達，不放進盤面數字」與「矛盾的宣稱寫在步驟上，由測試證明」：
  - 在 `src/domain/lessons/Lesson.ts` 新增 `StepMarks.supposed`、`StepMarks.refuted` 與 `ShowStep.contradiction`。
  - `verifyLessonStep` 回報四種錯：假設格不是空格、假設跟盤面或前面的假設衝突、第一個假設是答案、之後的假設不是唯一數。
  - `verifyLessonStep` 也回報矛盾的範圍裡還有空格放得下。
  - 先在 `src/__tests__/domain/lessons/verifyLesson.test.ts` 為每一種錯各寫一個故意寫錯的步驟，確認新測試先失敗再轉綠；現有測試全綠。
- [x] 1.2 [after: 1.1] 完成 Supposed digits 的畫法，依「假設的數字沿用現有的填入與填錯樣子」：
  - `lessonCellViews` 對假設格顯示該數字，highlight 為 `answer`；`refuted` 的格子為 `wrong`。
  - 兩者都不淡化，即使步驟有 `dimOthers`。
  - 遊戲、提示模式、解題演示、遊戲回顧用的 `stepCellView` 不受影響。
  - 先在 `src/__tests__/presentation/pages/lessons/lessonCellView.test.ts` 寫這三點的測試（新測試先失敗）；提示模式與解題演示的現有測試不變。

## 2. 隱藏唯一數

- [x] 2.1 完成 Hidden Single in rows and columns，依「列／欄的隱藏唯一數放在宮的講解之後」：
  - 講解在宮的四步之後加一個列的例子（框出列、打叉放不下的格、標出剩下那格），接著加一步說明先看宮的理由。
  - 跟著做在「第 2 宮找 3」之後加一個在列裡放數字的 `place` 步驟，提示分三層：列、打叉、答案格。
  - 盤面要讓列只剩一格，但答案格所在的宮還有兩格以上，必要時另用一個盤面。
  - 兩種語言的文案都要寫。
  - 在 `lessonContent.test.ts` 的 Hidden Single describe 加一個測試，證明這一步非用列不可（新測試先失敗）；全部內容測試綠。
- [x] 2.2 [after: 1.1, 1.2, 2.1] 完成 Placing only what is certain，依「推出矛盾的示範放在隱藏唯一數的講解裡」：
  - 在列的講解之後、點數字會亮起的提示之前，加入規格範例表的示範：先假設一個放得下、但不是答案的數字，順著唯一數推下去，最後某一宮放不下，第一個假設改成被推翻，再一步說「只填確定必須在那裡的數字」。
  - 盤面不顯示候選數，跟這課其他盤面一樣。
  - 兩種語言的文案都要寫。
  - 以內容測試驗證（1.1 的檢查會套用到這些步驟），並在瀏覽器手動走一次，確認每一步看得出推論順序。

## 3. 中等與困難的講解

- [ ] 3.1 完成 From placing digits to removing candidates 與 Explanation steps 的例外，依「進中等組的過渡是宮區塊摒除的第一步」：
  - 宮區塊摒除開頭加一步講解，用這課第一個盤面、列出全部候選數、不淡化任何數字。
  - 文案說明從這裡起多半是刪候選數，以及遊戲裡的自動筆記在設定。
  - 在 `lessonContent.test.ts` 加測試：宮區塊摒除第一步沒有 `dimOthers`，盤面列出候選數（新測試先失敗）。
- [ ] 3.2 [after: 3.1] 完成 Counter-examples and search tips 的宮區塊摒除與行列區塊摒除兩個反例，依「反例與搜尋方法都是講解步驟」：
  - 各加一步講解，標出某數字在一宮（或一條線）裡分散的候選數，不標任何刪除。
  - 在 `lessonContent.test.ts` 加測試，證明宮區塊摒除反例的候選數不在同一列或欄、行列區塊摒除反例的候選數不在同一宮（新測試先失敗）。
- [ ] 3.3 完成 Counter-examples and search tips 的 X-Wing 找法與 XY-Wing 找法、沒有可刪的例子：
  - X-Wing 講解加一步，標出某數字剛好只剩兩格的列。
  - XY-Wing 講解加兩步：一步標出只有兩個候選數的格子；另一步標出一組 XY-Wing，說明看得到兩端的格子裡沒有共有的數字。
  - 在 `lessonContent.test.ts` 加測試證明三件事：標出的列都只剩兩格、標出的格子都只有兩個候選數、反例的 XY-Wing 形狀成立且沒有可刪（新測試先失敗）。
- [ ] 3.4 完成 Complementary subsets，依「數組的互補放在隱性三數組／四數組」：
  - 在隱性三數組之後加一步，標出同一區域其餘空格組成的顯性數組，文案說明不必找超過 4 格的組合、難找時改找小的那組。
  - 互補數組要 2 到 4 格，隱性三數組的盤面不合用就換盤面，並確認原本的 `hiddenTriple` 驗證仍通過。
  - 在 `lessonContent.test.ts` 加測試，證明標出格子的候選數聯集數量等於格數，且格數在 2 到 4 之間（新測試先失敗）。

- [ ] 3.5 [after: 3.3] 完成 Explanation text matches the marked cells，依「文字講到的格子要對得上標示」：
  - 通讀 17 課的講解步驟，對照每步的 marks 分成要拆、等動畫、不動三類；跟設計的初步清單不同時，更新設計裡的清單。
  - XYZ-Wing 的 `casesEnds` 拆成兩步，每步只亮樞紐和那一端；`wxyz` 拆成規律一步、刪一步；Fish 的 `jellyfish` 拆成規律一步、刪一步。通讀時再找到的「要拆」步驟照同樣做法拆。
  - 有刪除的那一步保留 `technique`；兩種語言的文案都要寫，舊的 key 不再用就刪掉。
  - 在 `lessonContent.test.ts` 加測試（新測試先失敗）：XYZ-Wing 兩種情況的步驟各只亮兩格（樞紐和一端）；WXYZ-Wing、Jellyfish 的規律步驟沒有 `eliminated`，下一步才有，並由解題器驗證。全部內容測試綠。

## 4. 文案

- [ ] 4.1 完成 Lesson copy that supports the learner，依「語氣與別名只改文案，不改版面」：
  - 規則課填數字步驟的第一層提示說卡住可以按提示。
  - 課程列表基礎組的說明改成可以照自己的步調、跳著學。
  - 15 課自己找最後一步的成功訊息帶一句鼓勵。
  - 隱藏唯一數、唯一候選數、宮區塊摒除、行列區塊摒除第一次講到名稱時附別名：中文摒除法、唯餘法、區塊摒除法；英文 crosshatching、sole candidate、locked candidates。
  - 課程名稱與 CLAUDE.md 的固定用詞不變。不加釘死文案的測試；以現有的「兩種語言都有文案」與語言切換測試驗證。
- [ ] 4.2 [after: 2.2, 3.4, 3.5, 4.1] 檢查課程文案的整體語氣：通讀 17 課兩種語言的講解、提示與成功訊息，用詞跟 CLAUDE.md 的中文規則一致（列／欄／宮、固定用詞），新加的句子跟原有的語氣一致。以 `lessonContent.test.ts` 全綠，加上逐課走一次的人工檢查完成。

## 5. 收尾

- [ ] 5.1 [after: 4.2] 完成上線前的整合：
  - 在 `UNRELEASED_CHANGES` 加一行兩種語言的「技巧教學內容優化」。
  - 跑 `npm run generate:fonts` 把新中文字加進字型子集。
  - `npx vitest run`、`npx vue-tsc --noEmit`、`npm run lint` 全過。
- [ ] 5.2 [after: 5.1] 在 Chromium、WebKit、Firefox 檢查畫面：
  - 9 種風格下推出矛盾的示範：假設的數字和被推翻的樣子都看得清楚、彼此不同，動態效果關閉時也一樣。
  - 課程列表在 320 寬、兩種語言、9 種風格下，基礎組說明換行後不破版。
  - 360×640 下新加的講解步驟訊息能讀完，盤面位置跟其他步驟相同。
