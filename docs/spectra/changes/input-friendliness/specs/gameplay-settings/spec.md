## Purpose

Settings' gameplay options keep their option tiles, split into an input group and a display group, so they stay easy to scan as they grow.

## ADDED Requirements

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
