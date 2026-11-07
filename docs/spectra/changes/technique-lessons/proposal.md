## Why

解題器用到 19 種技巧，但玩家只能在提示或解題演示裡零星看到它們，沒有地方能從頭學起。第一次玩的人卡住時只能靠提示硬過，進階技巧也沒有練習的機會。這次新增一系列「技巧教學」，讓玩家按順序看懂並親手練過每一招。

## What Changes

- **新增技巧教學**：17 課涵蓋全部 19 種技巧，分基礎、簡單、中等、困難四組（三數組與四數組、Swordfish 與 Jellyfish、XYZ-Wing 與 WXYZ-Wing 各合成一課）。課程不上鎖，只標出下一課，進度會記住。
- **一課的流程**：講解 → 跟著做 → 自己找 → 完成。練習用點格子完成，只有要填數字時才跳出懸浮數字鍵。點錯留在原步驟並說明原因，提示分段給，最後才給答案。細長的手機上，面板留在底部，盤面放在面板上方空白的中間，兩者不會離得太遠。
- **一個入口**：首頁第一格「技巧教學」。解題演示和遊戲中都不提供入口，不在功能中途把玩家帶走（owner 2026-11-07 拿掉原本解題演示的「學這招」）。
- **首頁改成 2×2**：「技巧教學」放第一格。全尺寸放不下時，間距和元件逐步縮小，更矮時再縮小文字，500 高以下拿掉四格副標。844 高以上維持全尺寸。
- **8-bit 的盤面標示調整**：範圍改用暗點，目標數字反白，被刪的候選數斜線加粗。這套格子樣式與提示模式、解題演示、遊戲回顧共用，所以它們也會一起變。
- **8-bit 掌機的提醒**：進技巧教學前先提醒掌機的標示可能不夠清楚，可換成紅白機、看其他風格或繼續；選繼續後不再提醒。

**影響的風格**：全部 9 種。先做極簡，其他 8 種照畫布示意跟上。**玩家看得到**：會在 `UNRELEASED_CHANGES` 加一行。

## Capabilities

### New Capabilities

- `technique-lessons`: 課程內容與順序、課程列表、一課的流程、練習的點選與回饋、提示、完成與進度，以及入口只在首頁。
- `home-lesson-entry`: 首頁四個入口的 2×2 排列，以及各種視窗高度下的尺寸與副標規則。
- `lesson-board-marks`: 教學盤面上的淡化數字與 × 記號在各風格的畫法，以及 8-bit 的範圍標示和掌機提醒。

### Modified Capabilities

無。現有的規格沒有要改的需求：懸浮數字鍵照現有方式運作，教學裡是否一定使用它寫在 `technique-lessons`。

## Impact

- **新程式**：`src/domain/lessons/`（課程與練習規則）、`src/application/lessons/` 與 `src/infrastructure/` 的進度儲存、`src/stores/lessonStore.ts`、`src/presentation/pages/lessons/`。
- **改動的頁面**：`src/presentation/pages/home/Home.vue`、`src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue`、`src/router.ts`、`src/presentation/analytics/screenTracking.ts`。
- **共用元件**：`src/presentation/components/board-cell/`、`src/presentation/components/step-presentation/`。
- **風格**：`src/style/index.css`、`src/style/styles/*/skin.css` 與 `icons.ts`、`src/style/iconSet.ts`、`src/theme/paletteBuilder.ts`、`src/style/themes.generated.css`。
- **設定**：`src/application/settings/SettingsStorage.ts`、`src/stores/settingsStore.ts`（記住掌機提醒）。
- **文案與字型**：`src/presentation/i18n/messages/`、`src/presentation/pages/settings/changelogData.ts`，新文案要重跑 `npm run generate:fonts`。
- **測試**：`src/__tests__/presentation/pages/home/Home.test.ts` 的尺寸加總和入口順序測試要跟著改。
- 不需要新的相依套件。
