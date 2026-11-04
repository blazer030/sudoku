## Purpose

Settings' gameplay switches are split into an input group and a display group of single-line rows, so they stay easy to scan as they grow.

## ADDED Requirements

### Requirement: Grouped toggle rows

Settings SHALL present its gameplay switches as rows with an icon, a label, a description and a switch, in an input group holding the floating digit pad, double-tap fill, auto notes at start and Auto Remove Notes, and a display group holding the same-digit highlight, the scope highlight, the remaining count and motion effects. Each row SHALL expose its state to assistive technology, and pressing a row SHALL change its setting at once. The double-tap fill row's description SHALL say it works on medium and hard. Each visual style SHALL style the rows through the `setting-row` and `switch` skin hooks.

#### Scenario: Groups and rows

- **WHEN** the player opens Settings
- **THEN** the two groups show the rows listed above and no gameplay option tile remains

#### Scenario: Pressing a row

- **WHEN** the player presses a row
- **THEN** its switch flips, the row reports the new state and the setting persists

#### Scenario: Language switch

- **WHEN** the player switches language
- **THEN** the group titles, labels and descriptions switch language

#### Scenario: Style coverage

- **WHEN** the style coverage test reads each style's skin sheet
- **THEN** every style has rules for the `switch` hook
