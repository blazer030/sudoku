# auto-notes-setting Specification

## Purpose

Auto Notes becomes a setting that decides how each game starts, so players either begin with every note in place or write their own.

## Requirements

### Requirement: Auto notes setting

The system SHALL offer a persisted setting for starting games with auto notes, off by default. Changing it SHALL NOT alter a game already started or saved.

#### Scenario: Off by default

- **WHEN** a player with no saved value starts a new game
- **THEN** no cell holds notes

#### Scenario: A game under way

- **WHEN** the player turns the setting on and continues a saved game
- **THEN** that game's notes do not change


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
### Requirement: Notes at game start

While the setting is on, every new game, including Play Again, SHALL start with each unfilled cell holding its valid candidates. The notes SHALL be part of the game's initial board in Game Review, SHALL NOT be undoable and SHALL NOT count as a hint.

#### Scenario: New game with the setting on

- **WHEN** the player starts a new game with the setting on
- **THEN** every unfilled cell holds the digits its row, column and box allow, and hints used is 0

#### Scenario: Play Again

- **WHEN** the player chooses Play Again with the setting on
- **THEN** the new game starts with notes

#### Scenario: Undo at the start

- **WHEN** the player presses Undo before any move
- **THEN** the notes stay

#### Scenario: Reviewing the game

- **WHEN** the player opens Game Review for such a game
- **THEN** its first board shows the notes and no auto notes step is listed

#### Scenario: Analytics for such a game

- **WHEN** a game started with the setting on completes
- **THEN** `game_complete` carries `undo_count` and `wrong_entries`, and no `used_notes`

#### Scenario: Old reviews

- **WHEN** the player opens Game Review for an older game that used Auto Notes as a hint
- **THEN** that step still shows as before

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