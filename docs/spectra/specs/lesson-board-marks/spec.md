# lesson-board-marks Specification

## Purpose

The marks only lessons need on a board, drawn so each visual style stays recognisable, and clearer range marks for the 8-bit style, whose handheld palette gets a notice before lessons.

## Requirements

### Requirement: Dimmed digits

A dimmed digit SHALL use its style's dim colour token rather than opacity, in every style, and SHALL stay at least 1.5:1 against its cell.

#### Scenario: Every style defines the colour

- **WHEN** the palette tests run
- **THEN** every style and mode has a dim colour that meets the minimum against its cell


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
### Requirement: Crossed-out cells

A cell ruled out by an explanation SHALL show a cross drawn with the current style's own icon, not a text character.

#### Scenario: The cross follows the style

- **WHEN** an explanation rules out an empty cell
- **THEN** the cell shows the current style's `X` icon


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
### Requirement: Lesson state marks

Each lesson row SHALL show a mark for finished, next or not started, each distinguishable from the others in every style. The shared look SHALL already tell the three apart; a style MAY override any of them in its own shape language, through skin hooks of the lesson row's own.

#### Scenario: The three states differ

- **WHEN** the lesson list shows finished, next and unstarted lessons
- **THEN** each row's mark carries its state in a `data-skin` token, and the three look different in every style, whether from the shared look or the style's own rules


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
### Requirement: Target digits

A digit an explanation points at SHALL use a target cell variant, separate from the same-digit highlight of the game.

#### Scenario: The game's highlight is unchanged

- **WHEN** a player selects a digit during a game in the 8-bit style
- **THEN** matching digits keep today's same-digit look


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
### Requirement: 8-bit range and pattern marks

In the 8-bit style, a highlighted range SHALL be drawn as dots in a dark ink, target digits SHALL be inverted, pattern cells SHALL keep a light fill so lines drawn across them stay visible, and an eliminated candidate SHALL have a thicker strike than today. These marks SHALL apply wherever steps are shown: lessons, hint mode, the Walkthrough and Game Review.

#### Scenario: Marks by mode

- **WHEN** a step with a range, a target and a pattern is shown in the 8-bit style
- **THEN** the marks follow the example

##### Example: colours

| Mark | 掌機 (light) | 紅白機 (dark) |
| ---- | ------------ | ------------- |
| Range dots | #306230 on #9BBC0F | #6C6C6C on #000000 |
| Target digit | #9BBC0F on #0F380F | #FCFCFC on #0058F8 |
| Pattern cell | #8BAC0F | #1E1E3C |

#### Scenario: Lines pass under the digits

- **WHEN** a step with lines is shown in a lesson, the Walkthrough or game hint mode, in any style but 8-bit
- **THEN** the lines are drawn under the digits they cross; 8-bit keeps its lines above the cells on all three

#### Scenario: Lines stay visible

- **WHEN** an X-Wing's rectangle is drawn over its corners in the 8-bit style
- **THEN** the corners are not filled with the line's colour


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
### Requirement: Handheld notice

Entering lessons in the 8-bit style's 掌機 mode SHALL first show a notice that its marks can be hard to see, offering to switch to 紅白機, to look at other styles, or to carry on. Choosing to carry on SHALL be remembered, and the notice SHALL NOT show again. No other style or mode SHALL show it.

#### Scenario: Entering from Home

- **WHEN** the player in 掌機 opens the lessons for the first time
- **THEN** the notice shows before the lesson list can be used

#### Scenario: Opening a lesson by its address

- **WHEN** the player in 掌機 opens a lesson by its address and has not chosen to carry on before
- **THEN** the notice shows before the lesson, and backing out of it leaves the lessons, to the page before or to Home, as backing out on the lesson list does; going to the list would only show the notice again

#### Scenario: Switching to the dark mode

- **WHEN** the player chooses to switch to 紅白機
- **THEN** the style's mode becomes 紅白機 and the lessons open

#### Scenario: Looking at other styles

- **WHEN** the player chooses to look at other styles
- **THEN** the Appearance page opens

#### Scenario: Carrying on is remembered

- **WHEN** the player chooses to carry on and later opens the lessons again in 掌機
- **THEN** no notice shows

#### Scenario: Other looks show no notice

- **WHEN** the player opens the lessons in 紅白機 or any other style
- **THEN** no notice shows


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
### Requirement: Lessons in every style

The lesson list and lesson page SHALL be styled in all nine styles, and new skin hooks SHALL be covered by the style coverage test.

#### Scenario: A style without a rule fails

- **WHEN** a style has no rule for a new lesson hook that needs one
- **THEN** the style coverage test fails

#### Scenario: Motion off

- **WHEN** motion effects are off
- **THEN** lessons show every state directly, with no animation needed to read them

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