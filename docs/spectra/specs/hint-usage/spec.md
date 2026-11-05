# hint-usage Specification

## Purpose

Hints have no limit and no free use; each use is counted and Statistics shows the average per difficulty.

## Requirements

### Requirement: Unlimited hints

The system SHALL let the player use hints any number of times in a game, and SHALL count every use.

#### Scenario: Past the old limit

- **WHEN** the player has used 4 hints in a game and opens the hint menu
- **THEN** every option is enabled and using one counts as the fifth


<!-- @trace
source: input-friendliness
updated: 2026-11-05
code:
  - src/presentation/pages/settings/changelogData.ts
  - src/domain/game/HintTracker.ts
  - src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue
  - src/style/styles/blueprint/skin.css
  - src/assets/fonts/noto-serif-tc.woff2
  - src/presentation/i18n/messages/en.ts
  - src/stores/statisticsStore.ts
  - src/style/styles/pixel/skin.css
  - src/presentation/pages/home/Home.vue
  - src/presentation/pages/game/useLeaveGame.ts
  - src/stores/settingsStore.ts
  - src/style/styles/ink/floating-pad-grid.svg
  - CLAUDE.md
  - src/presentation/pages/game/components/HintMenuPopup.vue
  - src/style/styles/chalkboard/skin.css
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/presentation/components/floating-digit-pad/floatingPadPlacement.ts
  - src/style/styles/minimal/skin.css
  - src/style/styles/paper/skin.css
  - src/application/settings/SettingsStorage.ts
  - src/presentation/pages/game/useGameInteraction.ts
  - src/presentation/pages/game/useSingleNoteFill.ts
  - src/assets/fonts/cubic-11-characters.txt
  - src/application/analytics/AnalyticsService.ts
  - src/presentation/pages/settings/Settings.vue
  - src/presentation/pages/game/useHintActions.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/presentation/i18n/messages/zh-Hant.ts
  - src/application/analytics/summarizeReplay.ts
  - src/presentation/pages/statistics/Statistics.vue
  - src/style/styles/cyber/skin.css
  - src/presentation/pages/game/components/GameToast.vue
  - src/presentation/pages/game/useBlankDoubleTap.ts
  - src/style/styles/ink/skin.css
  - docs/analytics.md
  - src/presentation/pages/game/useGameSession.ts
  - src/style/styles/aurora/skin.css
  - src/domain/game/Sudoku.ts
  - src/stores/gameStore.ts
  - src/presentation/components/digit-pad/noteGlyphPlace.ts
  - src/presentation/components/floating-digit-pad/FloatingDigitPad.vue
  - src/presentation/pages/game/components/useHintMenu.ts
  - src/assets/fonts/noto-sans-tc.woff2
  - src/presentation/components/digit-pad/DigitPad.vue
  - src/presentation/pages/game/useGameToast.ts
  - src/style/styles/tactile/skin.css
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/pages/game/useGameCompletion.ts
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/presentation/composables/isBlankTap.ts
  - src/presentation/pages/game/GameScreen.vue
tests:
  - src/__tests__/presentation/components/digit-pad/noteGlyphPlace.test.ts
  - src/__tests__/presentation/pages/home/Home.test.ts
  - src/__tests__/presentation/pages/game/Game.test.ts
  - src/__tests__/presentation/pages/game/useHintActions.test.ts
  - src/__tests__/application/analytics/summarizeReplay.test.ts
  - src/__tests__/presentation/components/floating-digit-pad/floatingPadPlacement.test.ts
  - src/__tests__/application/game/GameState.test.ts
  - src/__tests__/style/skinHooks.test.ts
  - src/__tests__/presentation/pages/game/useSingleNoteFill.test.ts
  - src/__tests__/application/settings/SettingsStorage.test.ts
  - src/__tests__/stores/statisticsStore.test.ts
  - src/__tests__/presentation/components/floating-digit-pad/FloatingDigitPad.test.ts
  - src/__tests__/presentation/pages/game/autoNotesAtStart.test.ts
  - src/__tests__/stores/gameStore.test.ts
  - src/__tests__/presentation/pages/statistics/Statistics.test.ts
  - src/__tests__/style/styleCoverage.test.ts
  - src/__tests__/presentation/pages/game/GameCompleteActions.test.ts
  - src/__tests__/presentation/pages/game/useGameCompletion.test.ts
  - src/__tests__/style/styles/aurora/auroraSkin.test.ts
  - src/__tests__/presentation/pages/game/doubleTapFill.test.ts
  - src/__tests__/domain/game/HintTracker.test.ts
  - src/__tests__/presentation/pages/game/floatingDigitPadInGame.test.ts
  - src/__tests__/theme/paletteContrast.test.ts
  - src/__tests__/presentation/pages/game-review/GameReview.test.ts
  - src/__tests__/style/styles/ink/inkSkin.test.ts
  - src/__tests__/presentation/pages/settings/Settings.test.ts
  - src/__tests__/presentation/pages/game/components/HintMenuPopup.test.ts
  - src/__tests__/stores/settingsStore.test.ts
  - src/__tests__/presentation/pages/solver-walkthrough/SolverWalkthrough.test.ts
  - src/__tests__/domain/game/Sudoku.test.ts
  - src/__tests__/style/styles/ink/fonts.test.ts
-->

---
### Requirement: No free hint

Every hint use SHALL count, including the first, in the completion screen, the recorded game, Game Review and analytics. A reveal on an already solved board SHALL NOT count, as today.

#### Scenario: One hint used

- **WHEN** the player finishes a game after using one hint
- **THEN** the completion screen and the recorded game both state 1

#### Scenario: A game left unfinished

- **WHEN** the player used two hints and abandons the game, by leaving it or by starting a new one
- **THEN** the recorded game states 2

#### Scenario: Analytics

- **WHEN** a game with two hints completes
- **THEN** `game_complete` carries `hints_used` 2 and no `hints_total`


<!-- @trace
source: input-friendliness
updated: 2026-11-05
code:
  - src/presentation/pages/settings/changelogData.ts
  - src/domain/game/HintTracker.ts
  - src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue
  - src/style/styles/blueprint/skin.css
  - src/assets/fonts/noto-serif-tc.woff2
  - src/presentation/i18n/messages/en.ts
  - src/stores/statisticsStore.ts
  - src/style/styles/pixel/skin.css
  - src/presentation/pages/home/Home.vue
  - src/presentation/pages/game/useLeaveGame.ts
  - src/stores/settingsStore.ts
  - src/style/styles/ink/floating-pad-grid.svg
  - CLAUDE.md
  - src/presentation/pages/game/components/HintMenuPopup.vue
  - src/style/styles/chalkboard/skin.css
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/presentation/components/floating-digit-pad/floatingPadPlacement.ts
  - src/style/styles/minimal/skin.css
  - src/style/styles/paper/skin.css
  - src/application/settings/SettingsStorage.ts
  - src/presentation/pages/game/useGameInteraction.ts
  - src/presentation/pages/game/useSingleNoteFill.ts
  - src/assets/fonts/cubic-11-characters.txt
  - src/application/analytics/AnalyticsService.ts
  - src/presentation/pages/settings/Settings.vue
  - src/presentation/pages/game/useHintActions.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/presentation/i18n/messages/zh-Hant.ts
  - src/application/analytics/summarizeReplay.ts
  - src/presentation/pages/statistics/Statistics.vue
  - src/style/styles/cyber/skin.css
  - src/presentation/pages/game/components/GameToast.vue
  - src/presentation/pages/game/useBlankDoubleTap.ts
  - src/style/styles/ink/skin.css
  - docs/analytics.md
  - src/presentation/pages/game/useGameSession.ts
  - src/style/styles/aurora/skin.css
  - src/domain/game/Sudoku.ts
  - src/stores/gameStore.ts
  - src/presentation/components/digit-pad/noteGlyphPlace.ts
  - src/presentation/components/floating-digit-pad/FloatingDigitPad.vue
  - src/presentation/pages/game/components/useHintMenu.ts
  - src/assets/fonts/noto-sans-tc.woff2
  - src/presentation/components/digit-pad/DigitPad.vue
  - src/presentation/pages/game/useGameToast.ts
  - src/style/styles/tactile/skin.css
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/pages/game/useGameCompletion.ts
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/presentation/composables/isBlankTap.ts
  - src/presentation/pages/game/GameScreen.vue
tests:
  - src/__tests__/presentation/components/digit-pad/noteGlyphPlace.test.ts
  - src/__tests__/presentation/pages/home/Home.test.ts
  - src/__tests__/presentation/pages/game/Game.test.ts
  - src/__tests__/presentation/pages/game/useHintActions.test.ts
  - src/__tests__/application/analytics/summarizeReplay.test.ts
  - src/__tests__/presentation/components/floating-digit-pad/floatingPadPlacement.test.ts
  - src/__tests__/application/game/GameState.test.ts
  - src/__tests__/style/skinHooks.test.ts
  - src/__tests__/presentation/pages/game/useSingleNoteFill.test.ts
  - src/__tests__/application/settings/SettingsStorage.test.ts
  - src/__tests__/stores/statisticsStore.test.ts
  - src/__tests__/presentation/components/floating-digit-pad/FloatingDigitPad.test.ts
  - src/__tests__/presentation/pages/game/autoNotesAtStart.test.ts
  - src/__tests__/stores/gameStore.test.ts
  - src/__tests__/presentation/pages/statistics/Statistics.test.ts
  - src/__tests__/style/styleCoverage.test.ts
  - src/__tests__/presentation/pages/game/GameCompleteActions.test.ts
  - src/__tests__/presentation/pages/game/useGameCompletion.test.ts
  - src/__tests__/style/styles/aurora/auroraSkin.test.ts
  - src/__tests__/presentation/pages/game/doubleTapFill.test.ts
  - src/__tests__/domain/game/HintTracker.test.ts
  - src/__tests__/presentation/pages/game/floatingDigitPadInGame.test.ts
  - src/__tests__/theme/paletteContrast.test.ts
  - src/__tests__/presentation/pages/game-review/GameReview.test.ts
  - src/__tests__/style/styles/ink/inkSkin.test.ts
  - src/__tests__/presentation/pages/settings/Settings.test.ts
  - src/__tests__/presentation/pages/game/components/HintMenuPopup.test.ts
  - src/__tests__/stores/settingsStore.test.ts
  - src/__tests__/presentation/pages/solver-walkthrough/SolverWalkthrough.test.ts
  - src/__tests__/domain/game/Sudoku.test.ts
  - src/__tests__/style/styles/ink/fonts.test.ts
-->

---
### Requirement: Hint menu options

The hint menu SHALL offer Check Conflicts and Reveal Cell only, and SHALL NOT show a remaining count, a used-up message or a free-hint note.

#### Scenario: Opening the menu

- **WHEN** the player opens the hint menu
- **THEN** it shows Check Conflicts and Reveal Cell, and neither Auto Notes nor any hint count


<!-- @trace
source: input-friendliness
updated: 2026-11-05
code:
  - src/presentation/pages/settings/changelogData.ts
  - src/domain/game/HintTracker.ts
  - src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue
  - src/style/styles/blueprint/skin.css
  - src/assets/fonts/noto-serif-tc.woff2
  - src/presentation/i18n/messages/en.ts
  - src/stores/statisticsStore.ts
  - src/style/styles/pixel/skin.css
  - src/presentation/pages/home/Home.vue
  - src/presentation/pages/game/useLeaveGame.ts
  - src/stores/settingsStore.ts
  - src/style/styles/ink/floating-pad-grid.svg
  - CLAUDE.md
  - src/presentation/pages/game/components/HintMenuPopup.vue
  - src/style/styles/chalkboard/skin.css
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/presentation/components/floating-digit-pad/floatingPadPlacement.ts
  - src/style/styles/minimal/skin.css
  - src/style/styles/paper/skin.css
  - src/application/settings/SettingsStorage.ts
  - src/presentation/pages/game/useGameInteraction.ts
  - src/presentation/pages/game/useSingleNoteFill.ts
  - src/assets/fonts/cubic-11-characters.txt
  - src/application/analytics/AnalyticsService.ts
  - src/presentation/pages/settings/Settings.vue
  - src/presentation/pages/game/useHintActions.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/presentation/i18n/messages/zh-Hant.ts
  - src/application/analytics/summarizeReplay.ts
  - src/presentation/pages/statistics/Statistics.vue
  - src/style/styles/cyber/skin.css
  - src/presentation/pages/game/components/GameToast.vue
  - src/presentation/pages/game/useBlankDoubleTap.ts
  - src/style/styles/ink/skin.css
  - docs/analytics.md
  - src/presentation/pages/game/useGameSession.ts
  - src/style/styles/aurora/skin.css
  - src/domain/game/Sudoku.ts
  - src/stores/gameStore.ts
  - src/presentation/components/digit-pad/noteGlyphPlace.ts
  - src/presentation/components/floating-digit-pad/FloatingDigitPad.vue
  - src/presentation/pages/game/components/useHintMenu.ts
  - src/assets/fonts/noto-sans-tc.woff2
  - src/presentation/components/digit-pad/DigitPad.vue
  - src/presentation/pages/game/useGameToast.ts
  - src/style/styles/tactile/skin.css
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/pages/game/useGameCompletion.ts
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/presentation/composables/isBlankTap.ts
  - src/presentation/pages/game/GameScreen.vue
tests:
  - src/__tests__/presentation/components/digit-pad/noteGlyphPlace.test.ts
  - src/__tests__/presentation/pages/home/Home.test.ts
  - src/__tests__/presentation/pages/game/Game.test.ts
  - src/__tests__/presentation/pages/game/useHintActions.test.ts
  - src/__tests__/application/analytics/summarizeReplay.test.ts
  - src/__tests__/presentation/components/floating-digit-pad/floatingPadPlacement.test.ts
  - src/__tests__/application/game/GameState.test.ts
  - src/__tests__/style/skinHooks.test.ts
  - src/__tests__/presentation/pages/game/useSingleNoteFill.test.ts
  - src/__tests__/application/settings/SettingsStorage.test.ts
  - src/__tests__/stores/statisticsStore.test.ts
  - src/__tests__/presentation/components/floating-digit-pad/FloatingDigitPad.test.ts
  - src/__tests__/presentation/pages/game/autoNotesAtStart.test.ts
  - src/__tests__/stores/gameStore.test.ts
  - src/__tests__/presentation/pages/statistics/Statistics.test.ts
  - src/__tests__/style/styleCoverage.test.ts
  - src/__tests__/presentation/pages/game/GameCompleteActions.test.ts
  - src/__tests__/presentation/pages/game/useGameCompletion.test.ts
  - src/__tests__/style/styles/aurora/auroraSkin.test.ts
  - src/__tests__/presentation/pages/game/doubleTapFill.test.ts
  - src/__tests__/domain/game/HintTracker.test.ts
  - src/__tests__/presentation/pages/game/floatingDigitPadInGame.test.ts
  - src/__tests__/theme/paletteContrast.test.ts
  - src/__tests__/presentation/pages/game-review/GameReview.test.ts
  - src/__tests__/style/styles/ink/inkSkin.test.ts
  - src/__tests__/presentation/pages/settings/Settings.test.ts
  - src/__tests__/presentation/pages/game/components/HintMenuPopup.test.ts
  - src/__tests__/stores/settingsStore.test.ts
  - src/__tests__/presentation/pages/solver-walkthrough/SolverWalkthrough.test.ts
  - src/__tests__/domain/game/Sudoku.test.ts
  - src/__tests__/style/styles/ink/fonts.test.ts
-->

---
### Requirement: Average hints per difficulty

Statistics SHALL show each difficulty's average hints, counted over that difficulty's completed games like average time, to one decimal place, and a dash when it has no completed game. Stored records SHALL be read as they are.

#### Scenario: Computing the average

- **WHEN** Statistics computes a difficulty's average
- **THEN** the result follows the table below

##### Example: averages

| Games at this difficulty | Average hints | Notes |
| ------------------------ | ------------- | ----- |
| Won with 0, 1 and 2 hints | 1.0 | |
| Won with 1 and 2 hints | 1.5 | One decimal place |
| Won with 1 hint, given up with 4 | 1.0 | Given-up games do not count |
| Only given-up games | — | No completed game |

<!-- @trace
source: input-friendliness
updated: 2026-11-05
code:
  - src/presentation/pages/settings/changelogData.ts
  - src/domain/game/HintTracker.ts
  - src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue
  - src/style/styles/blueprint/skin.css
  - src/assets/fonts/noto-serif-tc.woff2
  - src/presentation/i18n/messages/en.ts
  - src/stores/statisticsStore.ts
  - src/style/styles/pixel/skin.css
  - src/presentation/pages/home/Home.vue
  - src/presentation/pages/game/useLeaveGame.ts
  - src/stores/settingsStore.ts
  - src/style/styles/ink/floating-pad-grid.svg
  - CLAUDE.md
  - src/presentation/pages/game/components/HintMenuPopup.vue
  - src/style/styles/chalkboard/skin.css
  - src/assets/fonts/lxgw-wenkai-tc-regular.woff2
  - src/presentation/components/floating-digit-pad/floatingPadPlacement.ts
  - src/style/styles/minimal/skin.css
  - src/style/styles/paper/skin.css
  - src/application/settings/SettingsStorage.ts
  - src/presentation/pages/game/useGameInteraction.ts
  - src/presentation/pages/game/useSingleNoteFill.ts
  - src/assets/fonts/cubic-11-characters.txt
  - src/application/analytics/AnalyticsService.ts
  - src/presentation/pages/settings/Settings.vue
  - src/presentation/pages/game/useHintActions.ts
  - src/assets/fonts/lxgw-wenkai-tc-bold.woff2
  - src/presentation/i18n/messages/zh-Hant.ts
  - src/application/analytics/summarizeReplay.ts
  - src/presentation/pages/statistics/Statistics.vue
  - src/style/styles/cyber/skin.css
  - src/presentation/pages/game/components/GameToast.vue
  - src/presentation/pages/game/useBlankDoubleTap.ts
  - src/style/styles/ink/skin.css
  - docs/analytics.md
  - src/presentation/pages/game/useGameSession.ts
  - src/style/styles/aurora/skin.css
  - src/domain/game/Sudoku.ts
  - src/stores/gameStore.ts
  - src/presentation/components/digit-pad/noteGlyphPlace.ts
  - src/presentation/components/floating-digit-pad/FloatingDigitPad.vue
  - src/presentation/pages/game/components/useHintMenu.ts
  - src/assets/fonts/noto-sans-tc.woff2
  - src/presentation/components/digit-pad/DigitPad.vue
  - src/presentation/pages/game/useGameToast.ts
  - src/style/styles/tactile/skin.css
  - src/assets/fonts/cubic-11.woff2
  - src/presentation/pages/game/useGameCompletion.ts
  - src/assets/fonts/lxgw-wenkai-tc-characters.txt
  - src/presentation/composables/isBlankTap.ts
  - src/presentation/pages/game/GameScreen.vue
tests:
  - src/__tests__/presentation/components/digit-pad/noteGlyphPlace.test.ts
  - src/__tests__/presentation/pages/home/Home.test.ts
  - src/__tests__/presentation/pages/game/Game.test.ts
  - src/__tests__/presentation/pages/game/useHintActions.test.ts
  - src/__tests__/application/analytics/summarizeReplay.test.ts
  - src/__tests__/presentation/components/floating-digit-pad/floatingPadPlacement.test.ts
  - src/__tests__/application/game/GameState.test.ts
  - src/__tests__/style/skinHooks.test.ts
  - src/__tests__/presentation/pages/game/useSingleNoteFill.test.ts
  - src/__tests__/application/settings/SettingsStorage.test.ts
  - src/__tests__/stores/statisticsStore.test.ts
  - src/__tests__/presentation/components/floating-digit-pad/FloatingDigitPad.test.ts
  - src/__tests__/presentation/pages/game/autoNotesAtStart.test.ts
  - src/__tests__/stores/gameStore.test.ts
  - src/__tests__/presentation/pages/statistics/Statistics.test.ts
  - src/__tests__/style/styleCoverage.test.ts
  - src/__tests__/presentation/pages/game/GameCompleteActions.test.ts
  - src/__tests__/presentation/pages/game/useGameCompletion.test.ts
  - src/__tests__/style/styles/aurora/auroraSkin.test.ts
  - src/__tests__/presentation/pages/game/doubleTapFill.test.ts
  - src/__tests__/domain/game/HintTracker.test.ts
  - src/__tests__/presentation/pages/game/floatingDigitPadInGame.test.ts
  - src/__tests__/theme/paletteContrast.test.ts
  - src/__tests__/presentation/pages/game-review/GameReview.test.ts
  - src/__tests__/style/styles/ink/inkSkin.test.ts
  - src/__tests__/presentation/pages/settings/Settings.test.ts
  - src/__tests__/presentation/pages/game/components/HintMenuPopup.test.ts
  - src/__tests__/stores/settingsStore.test.ts
  - src/__tests__/presentation/pages/solver-walkthrough/SolverWalkthrough.test.ts
  - src/__tests__/domain/game/Sudoku.test.ts
  - src/__tests__/style/styles/ink/fonts.test.ts
-->