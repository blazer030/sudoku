# technique-lessons Specification

## Purpose

A series of lessons that teach every technique the solver uses, from the rules to chains, so a player can learn each one in order and practise it on a real board.

## Requirements

### Requirement: Curriculum

The app SHALL offer 17 lessons in four groups, in a fixed order, that together cover all 19 techniques the solver uses.

#### Scenario: Lessons appear in their teaching order

- **WHEN** the player opens the lesson list
- **THEN** the lessons appear grouped and ordered as in the example

##### Example: the curriculum

| Group | Lessons in order |
| ----- | ---------------- |
| Basics | Filling in and notes; Rules |
| Easy | Hidden Single; Naked Single |
| Medium | Pointing; Claiming; Naked Pair; Hidden Pair; Naked Triple and Quad; Hidden Triple and Quad |
| Hard | X-Wing; Swordfish and Jellyfish; XY-Wing; W-Wing; XYZ-Wing and WXYZ-Wing; X-Chain; XY-Chain |

#### Scenario: Input comes before the rules

- **WHEN** a player starts with the first lesson
- **THEN** it teaches filling in and notes, pointing at the marked cell rather than naming its row and column, as the next lesson, Rules, is the first to use a digit pad on its own and to name rows and columns

#### Scenario: Every technique has a lesson

- **WHEN** any of the 19 technique ids is looked up
- **THEN** it resolves to exactly one lesson


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
### Requirement: Lesson list

The lesson list SHALL show each lesson's name, a one-line summary and its state, SHALL mark the first unfinished lesson as next, and SHALL NOT lock any lesson.

#### Scenario: A player opens any lesson

- **WHEN** a player who has finished no lesson taps the last lesson in the list
- **THEN** that lesson opens

#### Scenario: The next lesson is offered

- **WHEN** the player has finished the first six lessons
- **THEN** the list offers Naked Pair as the next lesson and shows 6 of 17 finished

#### Scenario: A finished group offers a game

- **WHEN** every lesson in the Easy, Medium or Hard group is finished
- **THEN** that group offers to start a new game at its difficulty


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
### Requirement: Lesson stages

Each lesson SHALL run through explanation, guided practice, independent practice and completion, in that order. The Rules and Filling in lessons SHALL have no independent stage. The Filling in lesson MAY alternate explanation and guided practice, as it teaches one skill after another.

#### Scenario: Skipping the explanation

- **WHEN** the player taps the action to skip to practice during an explanation
- **THEN** the lesson moves to the next practice step after the current step, never to an earlier one

#### Scenario: No practice left to skip to

- **WHEN** an explanation step has no practice step after it
- **THEN** the action to skip to practice is not offered, and the main action says next rather than offering a turn

#### Scenario: The practice is the next step

- **WHEN** the next step after an explanation is a practice step
- **THEN** the main action offers the practice, and the action to skip to practice is not offered

#### Scenario: Practice must be solved to move on

- **WHEN** the current practice step is unsolved
- **THEN** the next-step action and arrow are disabled

#### Scenario: Going back

- **WHEN** the player taps the previous arrow on a later step
- **THEN** the previous step shows again with what the player did there kept


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
### Requirement: Explanation steps
An explanation SHALL show one idea per step on a board, with the digits and candidates unrelated to that step dimmed. The Filling in lesson is the exception: it teaches the controls, not a pattern on the board, and its explanations SHALL dim nothing, because working out what a cell can hold takes the digits around it. A step about the whole board rather than a pattern on it, such as Hidden Single's tip on lighting digits or the step that opens the Medium group, SHALL dim nothing either.

#### Scenario: Unrelated digits are dimmed
- **WHEN** an explanation step about digit 7 in box 1 is shown
- **THEN** digits outside the step's range other than 7 carry the dimmed state, and the 7s stay undimmed

#### Scenario: The Filling in lesson dims nothing
- **WHEN** an explanation step of the Filling in lesson is shown
- **THEN** no digit or candidate carries the dimmed state

#### Scenario: A step about the whole board dims nothing
- **WHEN** the step that opens Pointing is shown
- **THEN** no digit or candidate carries the dimmed state


<!-- @trace
source: lesson-refinement
updated: 2026-11-12
code:
  - src/assets/fonts/noto-serif-tc.woff2
  - src/assets/fonts/noto-sans-tc.woff2
  - src/domain/lessons/practice.ts
  - src/presentation/i18n/messages/lessons/en.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/domain/lessons/verifyLesson.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/index.css
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/settings/changelogData.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/domain/lessons/content/hard.ts
  - src/presentation/pages/lessons/useStuckNudge.ts
  - src/domain/lessons/Lesson.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
tests:
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/domain/lessons/verifyLesson.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/presentation/pages/lessons/useStuckNudge.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/presentation/pages/lessons/useLessonSession.test.ts
  - src/__tests__/style/reducedMotion.test.ts
-->

---
### Requirement: Practising by tapping

Practice SHALL be done by tapping cells, whatever the player's input settings. A step SHALL open the floating digit pad only when the player has to decide a digit, and SHALL open it regardless of the floating pad setting. Lessons SHALL NOT show a permanent digit pad.

A pattern whose explanation follows an order SHALL be picked in that order: a chain's cells from either end, each joined to the last one picked, and a wing's pivot before its other cells. Cells that hold together, such as an X-Wing's corners, MAY be picked in any order. A cell of the pattern picked before its turn SHALL say why and keep the cells picked so far.

#### Scenario: Placing a known digit

- **WHEN** a step names digit 3 for box 2 and the player taps the one cell where it can go
- **THEN** the digit is placed and the step is solved, with no digit pad shown

#### Scenario: Removing a candidate

- **WHEN** a step asks which cell can lose a candidate and the player taps that cell
- **THEN** the candidate is shown struck out, with no need to tap the note itself

#### Scenario: A chain is picked in order

- **WHEN** X-Chain's practice asks for the chain's four cells, and the player taps one end, then the other end
- **THEN** the first end stays picked, the other is not, and the message says to go along the chain one cell at a time from an end; tapping the cells in order from either end solves the step

#### Scenario: A wing's pivot comes first

- **WHEN** XY-Wing's practice asks for the pivot and its two ends, and the player taps an end first
- **THEN** nothing is picked and the message says to tap the pivot first; after the pivot, the ends may come in either order

#### Scenario: Deciding a digit

- **WHEN** a step asks for a digit and the player taps an empty cell allowed by the step, with the floating pad setting off
- **THEN** the floating digit pad opens at that cell


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
### Requirement: Notes in lessons

Practice boards in the Basics and Easy groups SHALL show no notes, except where the Filling in lesson teaches them. Practice boards in the Medium and Hard groups SHALL show every candidate. Players SHALL NOT write notes during practice outside the Filling in lesson.

#### Scenario: Medium boards come with candidates

- **WHEN** a Naked Pair practice step opens
- **THEN** every empty cell shows its candidates without the player doing anything

#### Scenario: The notes toggle shows it is on

- **WHEN** the player turns on the notes toggle of the Filling in lesson, in any style, theme or mode
- **THEN** the toggle looks different from when it is off in more than its words, using that style's own look for a chosen control


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
### Requirement: Independent practice has one target

Independent practice SHALL show a whole board and SHALL name one target to look for: a digit, a row, a column or a box. A row, column or box its prompt names SHALL be framed on the board, so the player need not count to find it, and nothing else SHALL be marked. A prompt that names no particular row, column or box frames nothing. A lesson that removes candidates SHALL split its independent practice into the same two steps as its guided practice: first tapping the pattern's cells, then, with the pattern marked, tapping what can lose a candidate.

#### Scenario: The named house is framed

- **WHEN** independent practice for Pointing says to look in box 8
- **THEN** box 8 is framed on the board, and nothing marks the cells to find

#### Scenario: Nothing is named

- **WHEN** independent practice for X-Wing asks for the corners of an X-Wing on two columns, without saying which
- **THEN** no range is framed

#### Scenario: Finding the pattern, then removing

- **WHEN** the player reaches independent practice for X-Wing
- **THEN** the first step asks for the rectangle's four corners, and a cell that is not a corner says why; the next step shows the corners marked and asks which 1 can go

#### Scenario: W-Wing follows its explanation's order

- **WHEN** the player reaches W-Wing's guided or independent practice
- **THEN** one step asks for the two cells with the same pair, the next for the two cells that join them, and the last for what can lose a candidate; on the independent board no other cell holds that pair, so there is one answer to find

#### Scenario: Any valid answer counts

- **WHEN** independent practice for Hidden Single names digit 5 and the board has two cells where 5 is a hidden single
- **THEN** tapping either cell solves the step


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
### Requirement: Wrong answers explain themselves

A wrong tap SHALL leave the player on the same step, SHALL NOT change the board, and SHALL say why it was wrong. A wrong digit stays in its cell, marked as wrong, until the player's next action; it is not part of the board. Tapping a cell that already holds a digit is not a wrong tap, unless the step asks for that very cell: it SHALL give no reason and only clears a reason shown before it. On a fill or place step it also lights that digit across the board, as in a game, and a place step keeps it lit through a wrong tap, as the player is still looking for it. A lit digit is not dimmed. A place step that holds its digit lights no other: tapping a filled cell changes nothing.

#### Scenario: The reasons given

- **WHEN** the player taps a wrong cell
- **THEN** the message matches the reason, as in the example

##### Example: reasons by situation

| Situation | Message says |
| --------- | ------------ |
| Digit 3 asked; the column already has a 3 | That column already has a 3 |
| Digit 5 asked; no conflict, but not certain yet | The step's own words on why it is not certain yet |
| Cell outside the step's range | Look in the step's range first |
| A cell of the pattern tapped during removal | This cell is part of the pattern and stays |
| A cell without the candidates in question | This cell does not have those candidates |
| A cell of an ordered pattern tapped before its turn | Start at an end and go one cell at a time, or tap the pivot first |

#### Scenario: A cell that already holds a digit

- **WHEN** a step asks the player to pick a pattern or write notes, and the player taps a cell holding a 7 it does not ask for
- **THEN** the step and the board stay as they were, and no reason is shown

#### Scenario: A filled cell during a fill or place step

- **WHEN** a step asks the player to work out a digit or place digit 5, and the player taps a cell holding a 7
- **THEN** no reason is shown, and the 7s light up across the board

#### Scenario: Hidden Single teaches lighting a digit

- **WHEN** the player reaches the end of Hidden Single's explanation, before its first practice
- **THEN** a step says a digit on the board can be tapped to light every matching digit, and shows every 7 lit

#### Scenario: Hidden Single has the player light the digit first

- **WHEN** the player starts Hidden Single's guided practice
- **THEN** the first step asks them to tap any 3 on the board; another digit lights without being called wrong and does not finish the step, an empty cell says why, and a 3 lights every 3 and finishes it

#### Scenario: The digit is held while looking for its place

- **WHEN** the player is on the next step, looking for the only cell in box 2 for the 3, and taps a cell holding an 8
- **THEN** the 3s stay lit, the 8s do not light, and no reason is shown


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
### Requirement: Layered hints

Each practice step SHALL offer a hint that gives more with each use, and SHALL give the answer only at its last level. A step SHALL have only one level only where its prompt already names the answer, as the Filling in lesson's fill step does. Hints SHALL NOT count towards game statistics.

#### Scenario: Hints narrow step by step

- **WHEN** the player uses the hint repeatedly on a Hidden Single step
- **THEN** it shows the box first, then the digit's only place in that box, and lastly the cell itself

#### Scenario: The Rules lesson teaches step by step

- **WHEN** the player uses the hint repeatedly on the Rules lesson's fill step
- **THEN** it names a cell first, then says its row, column and box hold eight digits between them, and lastly gives the digit, and begins again on the next cell once that one is filled

#### Scenario: The last hint leaves the hint action disabled

- **WHEN** the last hint level has been shown
- **THEN** the hint action is disabled


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
### Requirement: One message at a time

The lesson panel SHALL show one message at a time, and a change of message SHALL NOT move the board.

#### Scenario: A wrong tap replaces the prompt

- **WHEN** the player taps a wrong cell
- **THEN** the reason replaces the prompt until the next tap, and the board's position is unchanged

#### Scenario: Small phones

- **WHEN** a lesson is shown on a 360×640 screen
- **THEN** the board, the panel and its actions all fit without scrolling the page

#### Scenario: The narrowest phones

- **WHEN** a lesson is shown 320 wide, in a language or style whose words run long
- **THEN** the stage tag's words shorten, and the step arrows beside it stay on screen; a long message may scroll inside the panel


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
### Requirement: Board placement on tall screens

When a window has more room than the lesson's tallest panel needs, the panel SHALL stay at the bottom of the screen and the spare room SHALL go above and below the board, so the board sits about midway between the header and the panel. The board's place SHALL depend only on the window, not on the message shown. A window without that spare room SHALL keep the board directly under the header.

#### Scenario: A tall narrow phone

- **WHEN** a lesson is shown on a 390×844 screen
- **THEN** the panel's bottom edge is where it is on any other step, and the gap above the board and the gap below it differ by no more than a line of the panel's text, for a two-line message

#### Scenario: Every step keeps the board in place

- **WHEN** the player moves through a lesson on any window
- **THEN** the board's position is the same on every step

#### Scenario: A small phone has no room to spare

- **WHEN** a lesson is shown on a 360×640 screen
- **THEN** the board sits directly under the header


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
### Requirement: Completion

Finishing a lesson SHALL open a dialog in the style's completion look, with the lesson's name, its one-sentence takeaway and how many lessons are finished, record the lesson as finished, and offer the next lesson. The last lesson of a group with a difficulty SHALL offer a new game at that difficulty instead; Basics has none, so its last lesson goes on to the next lesson. The dialog SHALL offer only that and going back to the list, which the system Back key also does, and the lesson panel SHALL NOT show behind it. Going on to the next lesson SHALL fade one lesson out and the next in.

#### Scenario: Finishing mid-group

- **WHEN** the player finishes Hidden Single
- **THEN** the lesson is recorded as finished, and a dialog names it, gives its takeaway and how many lessons are finished, and its main action offers Naked Single

#### Scenario: Going back from the dialog

- **WHEN** the player chooses to go back to the list in the dialog, or presses the system Back key
- **THEN** the lesson list shows, with the lesson recorded as finished

#### Scenario: Finishing a group

- **WHEN** the player finishes Naked Single
- **THEN** the dialog's main action starts a new easy game

#### Scenario: Going home after a game from the lessons

- **WHEN** the player finishes a game started from a lesson or the lesson list, and chooses Back to Home on its completion card
- **THEN** Home shows, not the lessons

#### Scenario: Starting a game with one unfinished

- **WHEN** the player starts a game from the lessons with an unfinished game saved
- **THEN** the dialog's action to stay names the lessons, and staying leaves the player where they were; from Home it names Home

#### Scenario: Lessons are not games

- **WHEN** a lesson is finished
- **THEN** game statistics and the saved game are unchanged


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
### Requirement: Lesson progress

Finished lessons SHALL persist across launches and SHALL NOT be affected by clearing game records. Leaving a lesson before its end SHALL NOT mark it finished.

#### Scenario: Progress survives a restart

- **WHEN** the player finishes a lesson and restarts the app
- **THEN** the lesson still shows as finished

#### Scenario: Unreadable progress

- **WHEN** stored progress cannot be read
- **THEN** every lesson shows as not finished and the list still opens


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
### Requirement: Lesson boards are verified
Every lesson board SHALL be a valid position, and each technique step's pattern and removals SHALL match what the solver's own technique finds on that board. Supposed digits SHALL be checked too: each supposed cell is empty on the board and conflicts with neither the board's digits nor the supposed digits before it, the first supposed digit is not its cell's answer, and every later one is a hidden or naked single once the ones before it are on the board. A claimed contradiction SHALL hold: with every supposed digit on the board, no empty cell of its range can hold its digit, and the range does not already hold it.

#### Scenario: A wrong board fails the tests
- **WHEN** a lesson's declared removal differs from the solver technique's result on that board
- **THEN** the lesson content test fails

#### Scenario: A supposed digit that is the answer fails the tests
- **WHEN** the first supposed digit of a demonstration is its cell's answer
- **THEN** the lesson content test fails

#### Scenario: A supposed digit that does not follow fails the tests
- **WHEN** a later supposed digit is neither a hidden nor a naked single given the ones before it
- **THEN** the lesson content test fails

#### Scenario: A contradiction that does not hold fails the tests
- **WHEN** a step claims a box has no place for a digit, yet one of its empty cells can still hold it with the supposed digits on the board
- **THEN** the lesson content test fails


<!-- @trace
source: lesson-refinement
updated: 2026-11-12
code:
  - src/assets/fonts/noto-serif-tc.woff2
  - src/assets/fonts/noto-sans-tc.woff2
  - src/domain/lessons/practice.ts
  - src/presentation/i18n/messages/lessons/en.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/domain/lessons/verifyLesson.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/index.css
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/settings/changelogData.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/domain/lessons/content/hard.ts
  - src/presentation/pages/lessons/useStuckNudge.ts
  - src/domain/lessons/Lesson.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
tests:
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/domain/lessons/verifyLesson.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/presentation/pages/lessons/useStuckNudge.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/presentation/pages/lessons/useLessonSession.test.ts
  - src/__tests__/style/reducedMotion.test.ts
-->

---
### Requirement: Entry points

Lessons SHALL open from Home's lessons entry and by a lesson's address only. Neither the Walkthrough nor game hint mode SHALL link to lessons: a player in the middle of either is not sent away from it.

#### Scenario: The Walkthrough shows no link

- **WHEN** a Walkthrough step shows its technique tag
- **THEN** nothing beside the tag opens a lesson

#### Scenario: No link during a game

- **WHEN** hint mode shows a technique during a game
- **THEN** no link to a lesson is shown


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
### Requirement: Lesson language

All lesson copy SHALL exist in English and Traditional Chinese.

#### Scenario: Switching language

- **WHEN** the player switches language
- **THEN** the lesson list and the open lesson's text switch with it

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
### Requirement: Hidden Single in rows and columns
The Hidden Single lesson SHALL teach finding a hidden single in a row or column as well as in a box, without adding a lesson. Its explanation SHALL show a digit with one place left in a row, and SHALL say why boxes come first: a box meets a line in three cells, two lines meet in one. Its guided practice SHALL add a step that places a digit in a row, chosen so that the row has one place left for the digit while the digit's box still has more than one, so only the row gives the answer.

#### Scenario: A row's hidden single in the explanation
- **WHEN** the player moves through Hidden Single's explanation past the box example
- **THEN** a step frames a row, crosses out its cells that cannot hold the digit, and shows the one cell left, followed by a step on why boxes are looked at first

#### Scenario: Guided practice in a row
- **WHEN** the player reaches the row step of Hidden Single's guided practice
- **THEN** the prompt names the row and the digit, the row is framed, and tapping the one cell left places the digit

#### Scenario: The row is needed
- **WHEN** the lesson content tests run
- **THEN** the row step's answer is the only cell of its row that can hold the digit, and the digit has at least two cells left in the answer's box


<!-- @trace
source: lesson-refinement
updated: 2026-11-12
code:
  - src/assets/fonts/noto-serif-tc.woff2
  - src/assets/fonts/noto-sans-tc.woff2
  - src/domain/lessons/practice.ts
  - src/presentation/i18n/messages/lessons/en.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/domain/lessons/verifyLesson.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/index.css
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/settings/changelogData.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/domain/lessons/content/hard.ts
  - src/presentation/pages/lessons/useStuckNudge.ts
  - src/domain/lessons/Lesson.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
tests:
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/domain/lessons/verifyLesson.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/presentation/pages/lessons/useStuckNudge.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/presentation/pages/lessons/useLessonSession.test.ts
  - src/__tests__/style/reducedMotion.test.ts
-->

---
### Requirement: Placing only what is certain
The Hidden Single lesson's explanation SHALL show that a digit which fits a cell can still be wrong. It SHALL place a supposed digit that conflicts with nothing yet is not the cell's answer, follow it through singles, and end on a house left with no place for that digit, with the first supposed digit then shown as refuted. It SHALL close by saying to fill a digit only when it must go there. The demonstration SHALL come after the row explanation and before the tip on lighting digits.

#### Scenario: Following a supposed digit to a dead end
- **WHEN** the player moves through the demonstration
- **THEN** the first step shows the supposed digit, the next steps add the digits that follow from it, and the last step frames a house whose empty cells are all crossed out, with the first supposed digit shown as wrong

##### Example: the steps of the demonstration
| Step | Board shows | Text says |
| ---- | ----------- | --------- |
| 1 | A supposed 7 in an empty cell | It fits: no 7 in its row, column or box |
| 2 to n−1 | Each following single added | This digit follows from the one before |
| n | A box framed, its empty cells crossed, the first 7 marked wrong | The box has no place left for a 7, so the first 7 was wrong |
| n+1 | The board without the supposed digits | Fill a digit only when it must go there |


<!-- @trace
source: lesson-refinement
updated: 2026-11-12
code:
  - src/assets/fonts/noto-serif-tc.woff2
  - src/assets/fonts/noto-sans-tc.woff2
  - src/domain/lessons/practice.ts
  - src/presentation/i18n/messages/lessons/en.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/domain/lessons/verifyLesson.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/index.css
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/settings/changelogData.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/domain/lessons/content/hard.ts
  - src/presentation/pages/lessons/useStuckNudge.ts
  - src/domain/lessons/Lesson.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
tests:
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/domain/lessons/verifyLesson.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/presentation/pages/lessons/useStuckNudge.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/presentation/pages/lessons/useLessonSession.test.ts
  - src/__tests__/style/reducedMotion.test.ts
-->

---
### Requirement: From placing digits to removing candidates
The first lesson of the Medium group, Pointing, SHALL open with two explanation steps: the first says that from here on most techniques remove candidates rather than place digits and that lesson boards show every candidate; the second says that Auto Notes in Settings fills them in a game. Both steps are about the whole board and SHALL dim nothing.

#### Scenario: Opening Pointing
- **WHEN** the player opens Pointing
- **THEN** the first two steps show the board with every candidate and nothing dimmed; the first explains the move to removing candidates and the second where to find Auto Notes


<!-- @trace
source: lesson-refinement
updated: 2026-11-12
code:
  - src/assets/fonts/noto-serif-tc.woff2
  - src/assets/fonts/noto-sans-tc.woff2
  - src/domain/lessons/practice.ts
  - src/presentation/i18n/messages/lessons/en.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/domain/lessons/verifyLesson.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/index.css
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/settings/changelogData.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/domain/lessons/content/hard.ts
  - src/presentation/pages/lessons/useStuckNudge.ts
  - src/domain/lessons/Lesson.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
tests:
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/domain/lessons/verifyLesson.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/presentation/pages/lessons/useStuckNudge.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/presentation/pages/lessons/useLessonSession.test.ts
  - src/__tests__/style/reducedMotion.test.ts
-->

---
### Requirement: Counter-examples and search tips
Explanations SHALL show where a pattern does not hold and how to look for it, as explanation steps only, leaving the practice steps unchanged:

- Pointing SHALL show a box whose candidates for a digit lie on more than one line, so nothing can be removed.
- Claiming SHALL show a line whose candidates for a digit lie in more than one box, so nothing can be removed.
- X-Wing SHALL show how to look for one: one digit at a time, the lines where it has exactly two places, then two such lines whose places share the same two crossing lines.
- XY-Wing SHALL show how to look for one, marking the cells with exactly two candidates as the only ones it uses, and SHALL show an XY-Wing whose shared digit is in no cell that sees both ends, so nothing can be removed.

#### Scenario: A box that does not point
- **WHEN** the player reaches Pointing's counter-example
- **THEN** the box and the digit's candidates in it are marked, they lie on more than one row or column, and no candidate is shown removed

#### Scenario: An XY-Wing with nothing to remove
- **WHEN** the player reaches XY-Wing's counter-example
- **THEN** two steps mark the pivot and both ends: the first says they make an XY-Wing, the second that no cell that sees both ends holds the shared digit

#### Scenario: The claims are checked
- **WHEN** the lesson content tests run
- **THEN** they fail if a counter-example's candidates do lie on one line or in one box, if a line X-Wing's tip marks has other than two places for its digit, if a cell XY-Wing's tip marks has other than two candidates, or if any cell that sees both ends of the XY-Wing counter-example holds the shared digit


<!-- @trace
source: lesson-refinement
updated: 2026-11-12
code:
  - src/assets/fonts/noto-serif-tc.woff2
  - src/assets/fonts/noto-sans-tc.woff2
  - src/domain/lessons/practice.ts
  - src/presentation/i18n/messages/lessons/en.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/domain/lessons/verifyLesson.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/index.css
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/settings/changelogData.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/domain/lessons/content/hard.ts
  - src/presentation/pages/lessons/useStuckNudge.ts
  - src/domain/lessons/Lesson.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
tests:
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/domain/lessons/verifyLesson.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/presentation/pages/lessons/useStuckNudge.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/presentation/pages/lessons/useLessonSession.test.ts
  - src/__tests__/style/reducedMotion.test.ts
-->

---
### Requirement: Complementary subsets
The Hidden Triple and Quad lesson SHALL show, after its hidden triple, that the other empty cells of the same house form a naked group of their own, and SHALL say that one of the two groups always has four cells or fewer, so no group larger than four needs looking for, and that the smaller group is the one to look for. The complementary group shown SHALL have between two and four cells.

#### Scenario: The other cells form a group
- **WHEN** the player reaches the step after the hidden triple
- **THEN** the house's other empty cells are marked, together holding exactly as many candidates as there are cells

#### Scenario: The claim is checked
- **WHEN** the lesson content tests run
- **THEN** they fail if the marked cells' candidates, taken together, do not number exactly as many as the cells, or if there are fewer than two or more than four cells


<!-- @trace
source: lesson-refinement
updated: 2026-11-12
code:
  - src/assets/fonts/noto-serif-tc.woff2
  - src/assets/fonts/noto-sans-tc.woff2
  - src/domain/lessons/practice.ts
  - src/presentation/i18n/messages/lessons/en.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/domain/lessons/verifyLesson.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/index.css
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/settings/changelogData.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/domain/lessons/content/hard.ts
  - src/presentation/pages/lessons/useStuckNudge.ts
  - src/domain/lessons/Lesson.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
tests:
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/domain/lessons/verifyLesson.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/presentation/pages/lessons/useStuckNudge.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/presentation/pages/lessons/useLessonSession.test.ts
  - src/__tests__/style/reducedMotion.test.ts
-->

---
### Requirement: Lesson copy that supports the learner
Lesson copy SHALL tell the player in the Basics group's note on the lesson list that lessons can be taken at their own pace and in any order; SHALL end each lesson's last independent step's success message with encouragement; and SHALL give a common other name for Hidden Single, Naked Single, Pointing and Claiming where the explanation first names the technique. Lesson names and the fixed terms of the app's copy rules SHALL stay unchanged.

#### Scenario: Other names in the explanation
- **WHEN** Hidden Single's explanation first names the technique, in Traditional Chinese
- **THEN** the same text also gives a name players meet elsewhere, while the lesson's name stays 隱藏唯一數

#### Scenario: The longer note fits
- **WHEN** the lesson list is shown 320 wide, in either language and any style
- **THEN** the Basics group's note wraps within its group and nothing in the list is cut off or overlaps


<!-- @trace
source: lesson-refinement
updated: 2026-11-12
code:
  - src/assets/fonts/noto-serif-tc.woff2
  - src/assets/fonts/noto-sans-tc.woff2
  - src/domain/lessons/practice.ts
  - src/presentation/i18n/messages/lessons/en.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/domain/lessons/verifyLesson.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/index.css
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/settings/changelogData.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/domain/lessons/content/hard.ts
  - src/presentation/pages/lessons/useStuckNudge.ts
  - src/domain/lessons/Lesson.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
tests:
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/domain/lessons/verifyLesson.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/presentation/pages/lessons/useStuckNudge.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/presentation/pages/lessons/useLessonSession.test.ts
  - src/__tests__/style/reducedMotion.test.ts
-->

---
### Requirement: Explanation text matches the marked cells
An explanation step SHALL mark only the cells its text is about, besides the range that frames them, so the player never has to count rows and columns to tell which marked cell the text means. A step whose text makes two or more separate claims about different cells, such as two cases or a pattern followed by a removal, SHALL be split into one step per claim. A step whose text follows one argument from cell to cell, or treats the marked cells as one group, MAY stay one step.

#### Scenario: XYZ-Wing's cases
- **WHEN** the player moves through XYZ-Wing's explanation past its ends
- **THEN** the case of a pivot of 5 and the case of a pivot of 9 are separate steps, each lighting only the pivot and the end its text names

#### Scenario: A pattern before its removal
- **WHEN** the player reaches the Jellyfish or the WXYZ-Wing in an explanation
- **THEN** one step shows the pattern with no candidate removed, and the next step shows the removal

#### Scenario: The split is checked
- **WHEN** the lesson content tests run
- **THEN** they fail if either XYZ-Wing case step lights other than two cells, or if the Jellyfish or WXYZ-Wing pattern step removes a candidate


<!-- @trace
source: lesson-refinement
updated: 2026-11-12
code:
  - src/assets/fonts/noto-serif-tc.woff2
  - src/assets/fonts/noto-sans-tc.woff2
  - src/domain/lessons/practice.ts
  - src/presentation/i18n/messages/lessons/en.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/domain/lessons/verifyLesson.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/index.css
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/settings/changelogData.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/domain/lessons/content/hard.ts
  - src/presentation/pages/lessons/useStuckNudge.ts
  - src/domain/lessons/Lesson.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
tests:
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/domain/lessons/verifyLesson.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/presentation/pages/lessons/useStuckNudge.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/presentation/pages/lessons/useLessonSession.test.ts
  - src/__tests__/style/reducedMotion.test.ts
-->

---
### Requirement: Nudge toward the hint when stuck
During a practice step that is not solved and still has a hint left, the lesson SHALL nudge the player toward the hint action after three wrong answers in a row or ten seconds with no action. A wrong answer is an action that brings a correcting message; an action that moves the step forward resets the count, and neutral actions such as selecting a cell leave it as it is. While nudging, the message area SHALL add, after what it already says, that the hint can help, unless it is showing a hint, whose words SHALL stay as they are; and the hint button SHALL draw attention: flashing a few times in the style's primary colour when motion is allowed, and staying highlighted without flashing when it is not. Asking for a hint, solving the step or leaving it SHALL end the nudge and start the count again.

#### Scenario: Three wrong answers in a row
- **WHEN** the player taps three cells in a row that each bring a correcting message
- **THEN** the message area says the hint can help and the hint button draws attention

#### Scenario: Ten seconds without an action
- **WHEN** ten seconds pass on an unsolved practice step with no action
- **THEN** the nudge appears

#### Scenario: Motion off
- **WHEN** the nudge appears with motion effects off
- **THEN** the hint button stays highlighted without flashing

#### Scenario: A hint ends the nudge
- **WHEN** the player asks for a hint while nudged
- **THEN** the hint shows, the nudge ends, and the count starts again

#### Scenario: A hint on screen keeps its words
- **WHEN** ten seconds pass while a hint is shown
- **THEN** the hint button draws attention, and the hint's words stay without the added line

<!-- @trace
source: lesson-refinement
updated: 2026-11-12
code:
  - src/assets/fonts/noto-serif-tc.woff2
  - src/assets/fonts/noto-sans-tc.woff2
  - src/domain/lessons/practice.ts
  - src/presentation/i18n/messages/lessons/en.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/domain/lessons/verifyLesson.ts
  - src/presentation/pages/lessons/LessonPanel.vue
  - src/presentation/i18n/messages/lessons/contentHardZhHant.ts
  - src/style/index.css
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/domain/lessons/content/basicsAndEasy.ts
  - src/presentation/i18n/messages/lessons/contentMediumEn.ts
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/i18n/messages/lessons/contentMediumZhHant.ts
  - src/presentation/pages/settings/changelogData.ts
  - src/presentation/pages/lessons/useLessonSession.ts
  - src/presentation/i18n/messages/lessons/contentZhHant.ts
  - src/presentation/pages/lessons/LessonScreen.vue
  - src/assets/fonts/cubic-11-characters.txt
  - src/presentation/pages/lessons/lessonCellView.ts
  - src/domain/lessons/content/hard.ts
  - src/presentation/pages/lessons/useStuckNudge.ts
  - src/domain/lessons/Lesson.ts
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/domain/lessons/content/medium.ts
  - src/presentation/i18n/messages/lessons/zh-Hant.ts
  - src/presentation/i18n/messages/lessons/contentEn.ts
  - src/presentation/i18n/messages/lessons/contentHardEn.ts
tests:
  - src/__tests__/presentation/pages/lessons/lessonCellView.test.ts
  - src/__tests__/domain/lessons/verifyLesson.test.ts
  - src/__tests__/domain/lessons/practiceReducer.test.ts
  - src/__tests__/presentation/pages/lessons/LessonScreen.test.ts
  - src/__tests__/presentation/pages/lessons/useStuckNudge.test.ts
  - src/__tests__/domain/lessons/content/lessonContent.test.ts
  - src/__tests__/presentation/pages/lessons/useLessonSession.test.ts
  - src/__tests__/style/reducedMotion.test.ts
-->