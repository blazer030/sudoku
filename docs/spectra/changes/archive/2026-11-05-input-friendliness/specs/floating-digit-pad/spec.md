## Purpose

A digit pad that appears at the corner of the selected cell, so a player who taps the cell first can fill, change or erase it without leaving the board.

## ADDED Requirements

### Requirement: Floating pad setting

The system SHALL offer a persisted floating digit pad setting that is off by default, and SHALL show no floating pad while it is off.

#### Scenario: Off by default

- **WHEN** a player with no saved value for the setting taps an empty cell
- **THEN** the cell is selected and no floating pad appears

#### Scenario: The choice is kept

- **WHEN** a player turns the setting on and reopens the app
- **THEN** the setting is still on

### Requirement: Floating pad opening

While the setting is on, the system SHALL open the floating pad when a selection lands on a cell the player solves, whether empty, holding notes or already filled, and SHALL NOT open it on a given clue, while a digit is picked, in Erase mode or in hint mode.

#### Scenario: Which tap opens the pad

- **WHEN** the player taps a cell with the setting on
- **THEN** the pad follows the table below

##### Example: tap outcomes

| Cell or state | Floating pad |
| ------------- | ------------ |
| Empty cell | Opens |
| Cell holding notes | Opens |
| Cell the player filled | Opens |
| Given clue | Does not open |
| Any cell while a digit is picked | Does not open; the digit is entered as today |
| Any cell in Erase mode | Does not open; the cell is erased as today |
| Any cell in hint mode | Does not open |

### Requirement: Floating pad placement

The system SHALL place the pad so that its corner touches the selected cell's corner, below and to the right by default, moving above or to the left when it would otherwise leave the board. On a board with room for it, the pad SHALL stay inside the board. On a board too small for it, the pad SHALL open on the side where it leaves the board the least, and SHALL stay on the screen. The pad SHALL NOT cover the selected cell's row or column.

#### Scenario: Every cell on the board

- **WHEN** the placement is computed for each of the 81 cells on a board with room for the pad
- **THEN** the pad stays inside the board and covers no cell of the selected cell's row or column

#### Scenario: Every cell on a small board

- **WHEN** the placement is computed for each of the 81 cells on an iPhone SE in Safari, where a cell is 24.2px wide on a 375×547 screen
- **THEN** the pad stays on the screen and covers no cell of the selected cell's row or column

##### Example: placement by cell

| Cell (row, column, zero-based) | Pad side |
| ------------------------------ | -------- |
| 0, 0 | Below, right |
| 4, 4 | Below, right |
| 5, 5 | Above, right |
| 2, 6 | Below, left |
| 8, 8 | Above, left |

### Requirement: Floating pad key size

Each digit key SHALL be at least 36px on each side, whatever the cell size. On a board whose cells would make the keys smaller, the pad SHALL grow past three cells wide.

#### Scenario: Key size by screen

- **WHEN** the pad opens on the screens below
- **THEN** the keys measure as the table shows

##### Example: measured cell widths

| Screen | Cell width | Digit key |
| ------ | ---------- | --------- |
| iPhone SE in Safari | 24.2px | 36px |
| Android at 360×640 dp | 26.5px | 36px |
| iPhone SE added to the home screen | 32.7px | 36px |
| Pixel 7 Pro | 41.5px | Follows the cell, over 36px |

### Requirement: Floating pad input

The pad SHALL offer the digits 1 to 9 and an erase key, and SHALL apply them by the same rules as the digit pad below the board. A digit the board already holds nine times SHALL be disabled. The erase key SHALL be disabled when the cell holds nothing to erase.

#### Scenario: Filling a cell

- **WHEN** the player presses a digit key in normal mode
- **THEN** the cell takes the digit, peer notes follow the Auto Remove Notes setting, group effects play as for any entry, and the pad closes

#### Scenario: Changing a filled cell

- **WHEN** the player selects a cell holding 5 and presses 3
- **THEN** the cell holds 3

#### Scenario: Pressing the digit already in the cell

- **WHEN** the player selects a cell holding 5 and presses 5
- **THEN** the cell is cleared, as with the digit pad below the board

#### Scenario: Notes stay open

- **WHEN** the player presses digit keys in note mode on a cell without an entry
- **THEN** each press toggles that note, the keys show which notes the cell holds, and the pad stays open

#### Scenario: Digits take their note places in note mode

- **WHEN** the pad is open in note mode
- **THEN** each digit sits at its place in a cell's 3×3 note grid, 1 at the top left through 9 at the bottom right, as the digit keys show them

#### Scenario: Notes on a filled cell

- **WHEN** the player presses a digit key in note mode on a filled cell
- **THEN** the cell does not change and no game step is recorded

#### Scenario: Erasing

- **WHEN** the player presses the erase key on a cell holding an entry or notes
- **THEN** the cell is erased as with the Erase key below the board, and the pad closes

### Requirement: Floating pad closing

The system SHALL close the pad when the selection clears, SHALL move it when another cell is selected, and SHALL clear the selection when the player taps outside the board, the pad and the controls while the setting is on. While the setting is on, a hint that puts its answer in a cell SHALL clear the selection, so the pad opens only on the player's next tap; a hint that ends with nothing filled SHALL leave the selection as it was.

#### Scenario: Tapping the selected cell again

- **WHEN** the player taps the cell the pad belongs to
- **THEN** the selection clears and the pad closes

#### Scenario: Tapping another cell

- **WHEN** the player taps another non-clue cell
- **THEN** the pad moves to that cell's corner

#### Scenario: Tapping the blank

- **WHEN** the player taps the blank with the setting on
- **THEN** the selection clears and the pad closes

#### Scenario: A hint fills a cell

- **WHEN** the pad is open, the player uses a hint and its answer goes into a cell
- **THEN** the selection clears and the pad stays closed until the next tap on a cell

#### Scenario: A hint ends with nothing filled

- **WHEN** the pad is open and the player closes a wrong-entry hint without clearing the entry
- **THEN** the pad opens again on the selected cell

#### Scenario: Blank tap with the setting off

- **WHEN** the player taps the blank with the setting off
- **THEN** the selection stays as it was

### Requirement: Floating pad on the Walkthrough

While the setting is on, the Walkthrough's editable board SHALL show the same floating pad component for its selected cell, with the digits that conflict with peers disabled, and SHALL NOT show it once the board stops being editable.

#### Scenario: Entering a puzzle

- **WHEN** the player selects a cell while entering a puzzle on the Walkthrough
- **THEN** the pad opens at the cell's corner and conflicting digits are disabled

#### Scenario: Playing the walkthrough

- **WHEN** the solver is running or its steps are playing
- **THEN** no floating pad is shown

### Requirement: Per-style floating pad

Each visual style SHALL give the floating pad its own look through the `floating-pad` skin hook, keeping the digits readable in the steady state. A style MAY also style the pad's keys through `floating-key` and `floating-erase`; those it leaves alone follow its `key` rules. The pad's surface SHALL be opaque in every style, including the glass of aurora, so the board's digits never show through it.

#### Scenario: Style coverage

- **WHEN** the style coverage test reads each style's skin sheet
- **THEN** every style has rules for the `floating-pad` hook

#### Scenario: An opaque surface

- **WHEN** the pad opens over filled cells in any style
- **THEN** none of the digits beneath it show through

#### Scenario: Motion off

- **WHEN** motion is not allowed
- **THEN** the pad appears without an entrance animation
