# gameplay-settings Specification

## Purpose

Settings' gameplay options keep their option tiles, split into an input group and a display group, so they stay easy to scan as they grow.

## Requirements

### Requirement: Grouped option tiles

Settings SHALL present its gameplay options as option tiles with an icon, a label, a description and a mark of their state, in two columns: an input group holding the floating digit pad, double-tap fill, auto notes at start and Auto Remove Notes, and a display group holding the same-digit highlight, the scope highlight, the remaining count and motion effects. Each tile SHALL expose its state to assistive technology, and pressing a tile SHALL change its setting at once. The double-tap fill tile's description SHALL say it works on medium and hard.

#### Scenario: Groups and tiles

- **WHEN** the player opens Settings
- **THEN** the two groups show the option tiles listed above, in that order

#### Scenario: Pressing a tile

- **WHEN** the player presses a tile
- **THEN** the tile reports the new state and the setting persists

#### Scenario: Language switch

- **WHEN** the player switches language
- **THEN** the group titles, labels and descriptions switch language

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