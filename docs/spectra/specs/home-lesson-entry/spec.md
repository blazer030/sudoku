# home-lesson-entry Specification

## Purpose

Home carries the lessons as a fourth entry in a two-by-two grid, and fits every style on short screens by shrinking step by step.

## Requirements

### Requirement: Four entries

Home SHALL show its entries in a two-column grid, in the order lessons, Walkthrough, statistics, settings.

#### Scenario: Entry order

- **WHEN** Home opens
- **THEN** the entries read lessons, Walkthrough, statistics, settings, in two rows of two


<!-- @trace
source: technique-lessons
updated: 2026-11-08
code:
  - src/assets/fonts/yuji-boku-characters.txt
  - src/presentation/components/page-header/PageHeader.vue
  - src/style/styles/cyber/skin.css
  - src/application/analytics/AnalyticsService.ts
  - src/style/styles/tactile/skin.css
  - src/assets/fonts/noto-serif-tc.woff2
  - src/presentation/i18n/messages/en.ts
  - src/presentation/pages/game/GameScreen.vue
  - README.md
  - src/presentation/pages/home/HomeHero.vue
  - deploy/nas/nginx.conf
  - deploy/nas/compose.yaml
  - src/domain/lessons/content/hard.ts
  - src/presentation/components/new-game-dialog/useNewGameDialog.ts
  - src/presentation/components/step-presentation/StepTag.vue
  - src/presentation/composables/useNewGameFlow.ts
  - src/presentation/pages/game/useGameSession.ts
  - src/presentation/pages/lessons/useLessonNotice.ts
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/style/styles/pixel/skin.css
  - scripts/deploy-nas.sh
  - src/main.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/style/styles/blueprint/skin.css
  - src/infrastructure/lessons/LocalStorageLessonProgressRepository.ts
  - src/presentation/i18n/messages/zh-Hant.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/style/themes.generated.css
  - src/presentation/components/segmented-control/SegmentedControl.vue
  - src/style/iconSet.ts
  - src/assets/fonts/noto-sans-tc.woff2
  - src/style/styles/aurora/skin.css
  - src/presentation/pages/lessons/LessonPage.vue
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/i18n/messages/lessons/en.ts
  - src/presentation/pages/home/Home.vue
  - src/domain/lessons/curriculum.ts
  - src/presentation/analytics/screenTracking.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/style/styles/blueprint/icons.ts
  - src/style/styles/ink/brushTitles.ts
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/styles/chalkboard/skin.css
  - src/stores/settingsStore.ts
  - src/application/lessons/LessonProgressRepository.ts
  - src/presentation/pages/lessons/LessonCompleteDialog.vue
  - src/style/styles/chalkboard/icons.ts
  - src/style/styles/pixel/palette.ts
  - deploy/nas/README.md
  - src/presentation/components/icon/index.ts
  - src/application/settings/SettingsStorage.ts
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
  - src/domain/lessons/content/helpers.ts
  - src/style/index.css
  - src/style/styles/pixel/icons.ts
  - src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue
  - src/presentation/pages/settings/changelogData.ts
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/style/styles/tactile/icons.ts
  - src/assets/fonts/yuji-boku.woff2
  - src/style/styles/paper/skin.css
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/domain/lessons/Lesson.ts
  - CLAUDE.md
  - src/presentation/components/new-game-dialog/NewGameDialog.vue
  - src/presentation/components/step-presentation/StepNavigator.vue
  - src/router.ts
  - package.json
  - src/presentation/pages/lessons/LessonList.vue
  - src/style/styles/ink/icons.ts
  - src/domain/lessons/practice.ts
  - src/style/styles/aurora/icons.ts
  - src/stores/lessonStore.ts
  - src/presentation/components/board-cell/BoardCell.vue
  - src/presentation/pages/lessons/LessonNoticeDialog.vue
  - src/domain/lessons/content/index.ts
  - src/assets/fonts/cubic-11.woff2
  - src/style/styles/paper/icons.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/style/styles/cyber/icons.ts
  - src/style/styles/ink/skin.css
tests:
  - src/__tests__/application/settings/SettingsStorage.test.ts
  - src/__tests__/router/lessonRoute.test.ts
  - src/__tests__/theme/paletteContrast.test.ts
  - src/__tests__/presentation/pages/home/Home.test.ts
  - src/__tests__/presentation/pages/game/GameCompleteActions.test.ts
  - src/__tests__/presentation/pages/lessons/LessonList.test.ts
  - src/__tests__/presentation/pages/solver-walkthrough/SolverWalkthrough.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/style/reducedMotion.test.ts
  - src/__tests__/fixtures/multiStepPuzzle.ts
  - src/__tests__/infrastructure/lessons/LocalStorageLessonProgressRepository.test.ts
  - src/__tests__/presentation/pages/lessons/LessonPage.test.ts
  - src/__tests__/presentation/components/icon/icon.test.ts
  - src/__tests__/style/styleCoverage.test.ts
  - src/__tests__/presentation/analytics/screenTracking.test.ts
  - src/__tests__/domain/lessons/curriculum.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/stores/lessonStore.test.ts
  - src/__tests__/presentation/pages/game/hint-mode/HintPanel.test.ts
  - src/__tests__/presentation/components/segmented-control/SegmentedControl.test.ts
  - src/__tests__/style/styles/pixel/pixelSkin.test.ts
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/theme/palettes.test.ts
  - src/__tests__/presentation/pages/game/Game.test.ts
-->

---
### Requirement: Lesson entry subtitle

The lesson entry's subtitle SHALL invite a new player in, and SHALL show progress once a lesson is finished. Home SHALL NOT open a dialog to promote the lessons.

#### Scenario: Subtitle by progress

- **WHEN** Home opens
- **THEN** the subtitle matches the player's progress, as in the example

##### Example: subtitle

| Lessons finished | Subtitle says |
| ---------------- | ------------- |
| 0 | First time? Start here |
| 6 | 6 of 17 learned |


<!-- @trace
source: technique-lessons
updated: 2026-11-08
code:
  - src/assets/fonts/yuji-boku-characters.txt
  - src/presentation/components/page-header/PageHeader.vue
  - src/style/styles/cyber/skin.css
  - src/application/analytics/AnalyticsService.ts
  - src/style/styles/tactile/skin.css
  - src/assets/fonts/noto-serif-tc.woff2
  - src/presentation/i18n/messages/en.ts
  - src/presentation/pages/game/GameScreen.vue
  - README.md
  - src/presentation/pages/home/HomeHero.vue
  - deploy/nas/nginx.conf
  - deploy/nas/compose.yaml
  - src/domain/lessons/content/hard.ts
  - src/presentation/components/new-game-dialog/useNewGameDialog.ts
  - src/presentation/components/step-presentation/StepTag.vue
  - src/presentation/composables/useNewGameFlow.ts
  - src/presentation/pages/game/useGameSession.ts
  - src/presentation/pages/lessons/useLessonNotice.ts
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/style/styles/pixel/skin.css
  - scripts/deploy-nas.sh
  - src/main.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/style/styles/blueprint/skin.css
  - src/infrastructure/lessons/LocalStorageLessonProgressRepository.ts
  - src/presentation/i18n/messages/zh-Hant.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/style/themes.generated.css
  - src/presentation/components/segmented-control/SegmentedControl.vue
  - src/style/iconSet.ts
  - src/assets/fonts/noto-sans-tc.woff2
  - src/style/styles/aurora/skin.css
  - src/presentation/pages/lessons/LessonPage.vue
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/i18n/messages/lessons/en.ts
  - src/presentation/pages/home/Home.vue
  - src/domain/lessons/curriculum.ts
  - src/presentation/analytics/screenTracking.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/style/styles/blueprint/icons.ts
  - src/style/styles/ink/brushTitles.ts
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/styles/chalkboard/skin.css
  - src/stores/settingsStore.ts
  - src/application/lessons/LessonProgressRepository.ts
  - src/presentation/pages/lessons/LessonCompleteDialog.vue
  - src/style/styles/chalkboard/icons.ts
  - src/style/styles/pixel/palette.ts
  - deploy/nas/README.md
  - src/presentation/components/icon/index.ts
  - src/application/settings/SettingsStorage.ts
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
  - src/domain/lessons/content/helpers.ts
  - src/style/index.css
  - src/style/styles/pixel/icons.ts
  - src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue
  - src/presentation/pages/settings/changelogData.ts
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/style/styles/tactile/icons.ts
  - src/assets/fonts/yuji-boku.woff2
  - src/style/styles/paper/skin.css
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/domain/lessons/Lesson.ts
  - CLAUDE.md
  - src/presentation/components/new-game-dialog/NewGameDialog.vue
  - src/presentation/components/step-presentation/StepNavigator.vue
  - src/router.ts
  - package.json
  - src/presentation/pages/lessons/LessonList.vue
  - src/style/styles/ink/icons.ts
  - src/domain/lessons/practice.ts
  - src/style/styles/aurora/icons.ts
  - src/stores/lessonStore.ts
  - src/presentation/components/board-cell/BoardCell.vue
  - src/presentation/pages/lessons/LessonNoticeDialog.vue
  - src/domain/lessons/content/index.ts
  - src/assets/fonts/cubic-11.woff2
  - src/style/styles/paper/icons.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/style/styles/cyber/icons.ts
  - src/style/styles/ink/skin.css
tests:
  - src/__tests__/application/settings/SettingsStorage.test.ts
  - src/__tests__/router/lessonRoute.test.ts
  - src/__tests__/theme/paletteContrast.test.ts
  - src/__tests__/presentation/pages/home/Home.test.ts
  - src/__tests__/presentation/pages/game/GameCompleteActions.test.ts
  - src/__tests__/presentation/pages/lessons/LessonList.test.ts
  - src/__tests__/presentation/pages/solver-walkthrough/SolverWalkthrough.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/style/reducedMotion.test.ts
  - src/__tests__/fixtures/multiStepPuzzle.ts
  - src/__tests__/infrastructure/lessons/LocalStorageLessonProgressRepository.test.ts
  - src/__tests__/presentation/pages/lessons/LessonPage.test.ts
  - src/__tests__/presentation/components/icon/icon.test.ts
  - src/__tests__/style/styleCoverage.test.ts
  - src/__tests__/presentation/analytics/screenTracking.test.ts
  - src/__tests__/domain/lessons/curriculum.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/stores/lessonStore.test.ts
  - src/__tests__/presentation/pages/game/hint-mode/HintPanel.test.ts
  - src/__tests__/presentation/components/segmented-control/SegmentedControl.test.ts
  - src/__tests__/style/styles/pixel/pixelSkin.test.ts
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/theme/palettes.test.ts
  - src/__tests__/presentation/pages/game/Game.test.ts
-->

---
### Requirement: Home fits short windows

Home SHALL fit without scrolling in every style, with a saved game, on windows from 480px tall up and 360px wide up in both languages, by shrinking in steps. Windows wider than the column SHALL stay at full size, as they do today. Two extreme shapes MAY scroll a little, with every control still reachable: windows wider than the column and too short for its full size, and windows under 360px wide in English, where the blueprint and ink styles' wider text wraps.

#### Scenario: Sizes by window height

- **WHEN** Home opens on a narrow window of the given height
- **THEN** its sizes follow the example

##### Example: bands, for every style

| Window height | Sizes |
| ------------- | ----- |
| 820px and up | Full size |
| 644px to 819px | Gaps, logo, and new game button shrink with the height |
| 624px to 643px | Those at their smallest |
| 550px to 623px | Also smaller title, subtitle, tile labels and card gaps |
| Under 550px | Also no subtitles on the four entries, and smaller margins and logo |

#### Scenario: An extreme window scrolls

- **WHEN** Home opens at 320px wide in English in the blueprint style, or at 1024×700
- **THEN** the page scrolls by a few dozen pixels at most and the last entries can be scrolled to

#### Scenario: Ink's vertical title

- **WHEN** the window is under 813px tall on a narrow window in the ink style
- **THEN** its vertical title takes its smaller size, so Home still fits; a window wider than the column does so only under 741px, as it did before

#### Scenario: Subtitles leave only when needed

- **WHEN** the window is 568px tall in any style
- **THEN** the four entries keep their subtitles and Home fits without scrolling

#### Scenario: Very short windows

- **WHEN** the window is 480px tall in any style
- **THEN** the entries show no subtitles and Home fits without scrolling


<!-- @trace
source: technique-lessons
updated: 2026-11-08
code:
  - src/assets/fonts/yuji-boku-characters.txt
  - src/presentation/components/page-header/PageHeader.vue
  - src/style/styles/cyber/skin.css
  - src/application/analytics/AnalyticsService.ts
  - src/style/styles/tactile/skin.css
  - src/assets/fonts/noto-serif-tc.woff2
  - src/presentation/i18n/messages/en.ts
  - src/presentation/pages/game/GameScreen.vue
  - README.md
  - src/presentation/pages/home/HomeHero.vue
  - deploy/nas/nginx.conf
  - deploy/nas/compose.yaml
  - src/domain/lessons/content/hard.ts
  - src/presentation/components/new-game-dialog/useNewGameDialog.ts
  - src/presentation/components/step-presentation/StepTag.vue
  - src/presentation/composables/useNewGameFlow.ts
  - src/presentation/pages/game/useGameSession.ts
  - src/presentation/pages/lessons/useLessonNotice.ts
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/style/styles/pixel/skin.css
  - scripts/deploy-nas.sh
  - src/main.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/style/styles/blueprint/skin.css
  - src/infrastructure/lessons/LocalStorageLessonProgressRepository.ts
  - src/presentation/i18n/messages/zh-Hant.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/style/themes.generated.css
  - src/presentation/components/segmented-control/SegmentedControl.vue
  - src/style/iconSet.ts
  - src/assets/fonts/noto-sans-tc.woff2
  - src/style/styles/aurora/skin.css
  - src/presentation/pages/lessons/LessonPage.vue
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/i18n/messages/lessons/en.ts
  - src/presentation/pages/home/Home.vue
  - src/domain/lessons/curriculum.ts
  - src/presentation/analytics/screenTracking.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/style/styles/blueprint/icons.ts
  - src/style/styles/ink/brushTitles.ts
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/styles/chalkboard/skin.css
  - src/stores/settingsStore.ts
  - src/application/lessons/LessonProgressRepository.ts
  - src/presentation/pages/lessons/LessonCompleteDialog.vue
  - src/style/styles/chalkboard/icons.ts
  - src/style/styles/pixel/palette.ts
  - deploy/nas/README.md
  - src/presentation/components/icon/index.ts
  - src/application/settings/SettingsStorage.ts
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
  - src/domain/lessons/content/helpers.ts
  - src/style/index.css
  - src/style/styles/pixel/icons.ts
  - src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue
  - src/presentation/pages/settings/changelogData.ts
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/style/styles/tactile/icons.ts
  - src/assets/fonts/yuji-boku.woff2
  - src/style/styles/paper/skin.css
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/domain/lessons/Lesson.ts
  - CLAUDE.md
  - src/presentation/components/new-game-dialog/NewGameDialog.vue
  - src/presentation/components/step-presentation/StepNavigator.vue
  - src/router.ts
  - package.json
  - src/presentation/pages/lessons/LessonList.vue
  - src/style/styles/ink/icons.ts
  - src/domain/lessons/practice.ts
  - src/style/styles/aurora/icons.ts
  - src/stores/lessonStore.ts
  - src/presentation/components/board-cell/BoardCell.vue
  - src/presentation/pages/lessons/LessonNoticeDialog.vue
  - src/domain/lessons/content/index.ts
  - src/assets/fonts/cubic-11.woff2
  - src/style/styles/paper/icons.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/style/styles/cyber/icons.ts
  - src/style/styles/ink/skin.css
tests:
  - src/__tests__/application/settings/SettingsStorage.test.ts
  - src/__tests__/router/lessonRoute.test.ts
  - src/__tests__/theme/paletteContrast.test.ts
  - src/__tests__/presentation/pages/home/Home.test.ts
  - src/__tests__/presentation/pages/game/GameCompleteActions.test.ts
  - src/__tests__/presentation/pages/lessons/LessonList.test.ts
  - src/__tests__/presentation/pages/solver-walkthrough/SolverWalkthrough.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/style/reducedMotion.test.ts
  - src/__tests__/fixtures/multiStepPuzzle.ts
  - src/__tests__/infrastructure/lessons/LocalStorageLessonProgressRepository.test.ts
  - src/__tests__/presentation/pages/lessons/LessonPage.test.ts
  - src/__tests__/presentation/components/icon/icon.test.ts
  - src/__tests__/style/styleCoverage.test.ts
  - src/__tests__/presentation/analytics/screenTracking.test.ts
  - src/__tests__/domain/lessons/curriculum.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/stores/lessonStore.test.ts
  - src/__tests__/presentation/pages/game/hint-mode/HintPanel.test.ts
  - src/__tests__/presentation/components/segmented-control/SegmentedControl.test.ts
  - src/__tests__/style/styles/pixel/pixelSkin.test.ts
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/theme/palettes.test.ts
  - src/__tests__/presentation/pages/game/Game.test.ts
-->

---
### Requirement: Tall screens keep their sizes

On windows 844px tall and up, Home SHALL keep today's sizes for everything except the entry grid.

#### Scenario: Comparing with the old build

- **WHEN** Home at 390×844 with a saved game is compared element by element with the previous build, in the web build and on Android
- **THEN** only the entry grid and the free space around the cards differ

<!-- @trace
source: technique-lessons
updated: 2026-11-08
code:
  - src/assets/fonts/yuji-boku-characters.txt
  - src/presentation/components/page-header/PageHeader.vue
  - src/style/styles/cyber/skin.css
  - src/application/analytics/AnalyticsService.ts
  - src/style/styles/tactile/skin.css
  - src/assets/fonts/noto-serif-tc.woff2
  - src/presentation/i18n/messages/en.ts
  - src/presentation/pages/game/GameScreen.vue
  - README.md
  - src/presentation/pages/home/HomeHero.vue
  - deploy/nas/nginx.conf
  - deploy/nas/compose.yaml
  - src/domain/lessons/content/hard.ts
  - src/presentation/components/new-game-dialog/useNewGameDialog.ts
  - src/presentation/components/step-presentation/StepTag.vue
  - src/presentation/composables/useNewGameFlow.ts
  - src/presentation/pages/game/useGameSession.ts
  - src/presentation/pages/lessons/useLessonNotice.ts
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/style/styles/pixel/skin.css
  - scripts/deploy-nas.sh
  - src/main.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/style/styles/blueprint/skin.css
  - src/infrastructure/lessons/LocalStorageLessonProgressRepository.ts
  - src/presentation/i18n/messages/zh-Hant.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/style/themes.generated.css
  - src/presentation/components/segmented-control/SegmentedControl.vue
  - src/style/iconSet.ts
  - src/assets/fonts/noto-sans-tc.woff2
  - src/style/styles/aurora/skin.css
  - src/presentation/pages/lessons/LessonPage.vue
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/i18n/messages/lessons/en.ts
  - src/presentation/pages/home/Home.vue
  - src/domain/lessons/curriculum.ts
  - src/presentation/analytics/screenTracking.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/style/styles/blueprint/icons.ts
  - src/style/styles/ink/brushTitles.ts
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/styles/chalkboard/skin.css
  - src/stores/settingsStore.ts
  - src/application/lessons/LessonProgressRepository.ts
  - src/presentation/pages/lessons/LessonCompleteDialog.vue
  - src/style/styles/chalkboard/icons.ts
  - src/style/styles/pixel/palette.ts
  - deploy/nas/README.md
  - src/presentation/components/icon/index.ts
  - src/application/settings/SettingsStorage.ts
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
  - src/domain/lessons/content/helpers.ts
  - src/style/index.css
  - src/style/styles/pixel/icons.ts
  - src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue
  - src/presentation/pages/settings/changelogData.ts
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/style/styles/tactile/icons.ts
  - src/assets/fonts/yuji-boku.woff2
  - src/style/styles/paper/skin.css
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/domain/lessons/Lesson.ts
  - CLAUDE.md
  - src/presentation/components/new-game-dialog/NewGameDialog.vue
  - src/presentation/components/step-presentation/StepNavigator.vue
  - src/router.ts
  - package.json
  - src/presentation/pages/lessons/LessonList.vue
  - src/style/styles/ink/icons.ts
  - src/domain/lessons/practice.ts
  - src/style/styles/aurora/icons.ts
  - src/stores/lessonStore.ts
  - src/presentation/components/board-cell/BoardCell.vue
  - src/presentation/pages/lessons/LessonNoticeDialog.vue
  - src/domain/lessons/content/index.ts
  - src/assets/fonts/cubic-11.woff2
  - src/style/styles/paper/icons.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/style/styles/cyber/icons.ts
  - src/style/styles/ink/skin.css
tests:
  - src/__tests__/application/settings/SettingsStorage.test.ts
  - src/__tests__/router/lessonRoute.test.ts
  - src/__tests__/theme/paletteContrast.test.ts
  - src/__tests__/presentation/pages/home/Home.test.ts
  - src/__tests__/presentation/pages/game/GameCompleteActions.test.ts
  - src/__tests__/presentation/pages/lessons/LessonList.test.ts
  - src/__tests__/presentation/pages/solver-walkthrough/SolverWalkthrough.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/style/reducedMotion.test.ts
  - src/__tests__/fixtures/multiStepPuzzle.ts
  - src/__tests__/infrastructure/lessons/LocalStorageLessonProgressRepository.test.ts
  - src/__tests__/presentation/pages/lessons/LessonPage.test.ts
  - src/__tests__/presentation/components/icon/icon.test.ts
  - src/__tests__/style/styleCoverage.test.ts
  - src/__tests__/presentation/analytics/screenTracking.test.ts
  - src/__tests__/domain/lessons/curriculum.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/stores/lessonStore.test.ts
  - src/__tests__/presentation/pages/game/hint-mode/HintPanel.test.ts
  - src/__tests__/presentation/components/segmented-control/SegmentedControl.test.ts
  - src/__tests__/style/styles/pixel/pixelSkin.test.ts
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/theme/palettes.test.ts
  - src/__tests__/presentation/pages/game/Game.test.ts
-->