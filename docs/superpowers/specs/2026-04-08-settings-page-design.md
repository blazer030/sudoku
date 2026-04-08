# Settings Page Design

## Context

The Sudoku app has a Settings page that currently only contains theme selection (Classic / Game Boy Color), gated behind a feature toggle (develop-only). The goal is to redesign the Settings page to provide game experience personalization, removing the theme section and replacing it with a color theme picker and game behavior toggles. The Settings page will be made available in production.

## Settings Data Model

### `SettingsStorage.ts`

Remove `ThemeId` and `theme`. Add new settings:

```typescript
export type ColorThemeId = "green" | "blue" | "purple" | "orange" | "pink" | "teal";

export interface Settings {
    colorTheme: ColorThemeId;
    highlightSameDigit: boolean;
    completionFlash: boolean;
    autoRemoveNotes: boolean;
    showRemainingCount: boolean;
}

const DEFAULT_SETTINGS: Settings = {
    colorTheme: "green",
    highlightSameDigit: true,
    completionFlash: true,
    autoRemoveNotes: true,
    showRemainingCount: true,
};
```

Storage key remains `sudoku-settings`. The spread pattern `{ ...DEFAULT_SETTINGS, ...JSON.parse(stored) }` ensures backward compatibility when new fields are added.

### `settingsStore.ts`

Expose a reactive ref for each setting and a setter that persists to localStorage. On initialization (and on `colorTheme` change), set `document.documentElement.dataset.colorTheme` to apply the color theme.

## Color Theme Implementation

### CSS Variables (`index.css`)

Define color overrides via `[data-color-theme]` attribute selectors:

```css
[data-color-theme="green"]  { --color-primary: #3D8A5A; --color-primary-light: #C8F0D8; }
[data-color-theme="blue"]   { --color-primary: #4A7AB5; --color-primary-light: #D0E4F7; }
[data-color-theme="purple"] { --color-primary: #7B5EA7; --color-primary-light: #E4D8F0; }
[data-color-theme="orange"] { --color-primary: #C08040; --color-primary-light: #F5E0C8; }
[data-color-theme="pink"]   { --color-primary: #B5607A; --color-primary-light: #F7D4DE; }
[data-color-theme="teal"]   { --color-primary: #4A9A9A; --color-primary-light: #D0F0F0; }
```

Each color theme also overrides `--shadow-primary-*` variables (computed from the primary color with alpha).

All existing Tailwind usages of `bg-primary`, `text-primary`, `shadow-primary` etc. will automatically follow the CSS variable change.

### Application

`settingsStore` sets `document.documentElement.dataset.colorTheme` on init and on change. The `green` theme matches the current default colors exactly, so no visual change for existing users.

## Settings Page UI

### Layout (replaces current Settings.vue content)

```
Header: [< Back]                    [Settings]                    [spacer]

Section: "Color Theme"
  6 circular color swatches in a row (or 2 rows of 3)
  Selected swatch: ring-2 + checkmark overlay
  Tap to apply immediately (instant preview)

Section: "Game"
  Toggle row: "Highlight Same Numbers"    [toggle]
              "Highlight cells with the same digit"

  Toggle row: "Completion Animation"       [toggle]
              "Flash effect when completing a row, column, or box"

  Toggle row: "Auto-Remove Notes"          [toggle]
              "Remove notes from peers when placing a digit"

  Toggle row: "Remaining Count"            [toggle]
              "Show remaining count on digit buttons"

[flex-1 spacer]

Version: v1.1.1
```

### Toggle Switch Component

A simple Tailwind-based toggle switch (no external dependency). Dimensions: ~44x24px. Active state uses `bg-primary`, inactive uses `bg-foreground-muted`.

## Feature Integration Points

### highlightSameDigit

- **File**: `src/presentation/themes/classic/components/Cell.vue`
- **How**: Import `useSettingsStore`. In `isSameDigit` computed, return `false` early when `settingsStore.highlightSameDigit` is `false`.

### completionFlash

- **File**: `src/presentation/themes/classic/useCompletionFlash.ts`
- **How**: Import `useSettingsStore`. In `triggerFlash`, return early when `settingsStore.completionFlash` is `false`.

### autoRemoveNotes

- **File**: `src/domain/game/Sudoku.ts`
- **How**: Add optional parameter to `fill()`: `options?: { autoRemoveNotes?: boolean }`. When `autoRemoveNotes` is `false`, skip `removeNoteFromPeers()` call. Default to `true` for backward compatibility.
- **Caller**: `useGameInteraction.ts` passes `{ autoRemoveNotes: settingsStore.autoRemoveNotes }` to `sudoku.fill()`.

### showRemainingCount

- **File**: `src/presentation/themes/classic/components/DigitPad.vue`
- **How**: Accept a `showRemainingCount` prop. When `false`, hide the remaining count badge (`v-if`).
- **Caller**: `ClassicGame.vue` or `useGameInteraction.ts` reads from `settingsStore`.

## Feature Toggle Changes

- Remove `'settings': 'develop'` from `featureToggle.ts` features map.
- In `Home.vue`, remove `v-if="showSettings"` condition and the `isFeatureEnabled` import/usage. Settings button always visible.
- Keep `featureToggle.ts` file for future use.

## Theme Cleanup

- Remove `ThemeId` type export from `SettingsStorage.ts`
- Remove theme-related code from `settingsStore.ts`
- Remove theme thumbnails reference from `Settings.vue`
- Remove theme rendering logic from `Game.vue` (keep only ClassicGame)
- Theme thumbnail images (`theme-classic.png`, `theme-gbc.png`) can remain in public/ for now

## Files to Modify

| File | Change |
|------|--------|
| `src/application/SettingsStorage.ts` | New Settings interface, remove ThemeId |
| `src/stores/settingsStore.ts` | Expose all settings + colorTheme DOM sync |
| `src/presentation/pages/settings/Settings.vue` | Complete UI rewrite |
| `src/presentation/pages/home/Home.vue` | Remove feature toggle for settings button |
| `src/style/index.css` | Add color theme CSS variable overrides |
| `src/domain/game/Sudoku.ts` | Add `autoRemoveNotes` option to `fill()` |
| `src/presentation/themes/classic/components/Cell.vue` | Check highlightSameDigit setting |
| `src/presentation/themes/classic/useCompletionFlash.ts` | Check completionFlash setting |
| `src/presentation/themes/classic/components/DigitPad.vue` | Check showRemainingCount setting |
| `src/presentation/themes/classic/useGameInteraction.ts` | Pass autoRemoveNotes to fill() |
| `src/utils/featureToggle.ts` | Remove 'settings' entry |
| `src/presentation/pages/game/Game.vue` | Remove theme switching logic |

## Verification

1. **Settings persistence**: Change settings, refresh page, verify settings are restored from localStorage
2. **Color theme**: Switch color theme, verify all primary-colored elements update (buttons, icons, shadows, highlights)
3. **Highlight same digit**: Toggle off, select a cell with a number, verify no other cells highlight
4. **Completion flash**: Toggle off, complete a row/column/box, verify no ripple animation
5. **Auto-remove notes**: Toggle off, add notes, fill a cell, verify peer notes remain unchanged
6. **Remaining count**: Toggle off, verify digit pad badges are hidden
7. **Settings button**: Verify Settings button shows on home page in both dev and production builds
8. **Backward compatibility**: Existing users with old localStorage format should get default values for new settings
9. **Run all tests**: `npx vitest run` — all existing tests must pass
