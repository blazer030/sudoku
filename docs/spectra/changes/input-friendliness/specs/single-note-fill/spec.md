## Purpose

A double tap on the blank fills every cell whose notes are down to one digit, so a player finishing a medium or hard game can enter what they are sure of in one go.

## ADDED Requirements

### Requirement: Double-tap fill setting

The system SHALL offer a persisted double-tap fill setting that is off by default, and a double tap SHALL do nothing while it is off.

#### Scenario: Off by default

- **WHEN** a player with no saved value double taps the blank in a hard game with single-note cells
- **THEN** the board does not change

### Requirement: Blank double tap

The system SHALL treat two taps as a double tap when both land on the game screen outside the board and its frame, the input area, and every button or link, no more than 300ms and 24px apart. It SHALL ignore a double tap during hint mode, during a running fill and after the game is completed.

#### Scenario: What counts as a double tap

- **WHEN** the player taps twice with the setting on in a hard game
- **THEN** the outcome follows the table below

##### Example: tap pairs

| First tap | Second tap | Apart | Outcome |
| --------- | ---------- | ----- | ------- |
| Blank | Blank | 200ms, 10px | Fills |
| Blank | Blank | 400ms, 10px | Nothing |
| Blank | Blank | 200ms, 60px | Nothing |
| Board | Blank | 200ms, 10px | Nothing |
| Blank | Digit key | 200ms, 10px | Digit key acts as usual; nothing fills |

### Requirement: Easy games ignore double tap

On easy games the system SHALL ignore a double tap, even with the setting on, and SHALL show no message about it.

#### Scenario: Easy game with the setting on

- **WHEN** the player double taps the blank in an easy game with single-note cells
- **THEN** the board does not change and no toast appears

### Requirement: Fill every single-note cell

A double tap SHALL fill every cell that has no entry and exactly one note at that moment, with that note's digit, regardless of whether the digit is correct or conflicts. It SHALL fill one round only and SHALL NOT read the answer. Peer notes SHALL follow the Auto Remove Notes setting.

#### Scenario: One round only

- **WHEN** filling a cell leaves a peer with a single note that it did not have when the double tap landed
- **THEN** that peer stays unfilled until the next double tap

##### Example: a chain stops after one round

- **GIVEN** cell A holds the note 5, and cell B, in A's row, holds the notes 3 and 5
- **WHEN** the player double taps with Auto Remove Notes on
- **THEN** A holds 5, and B holds the note 3 with no entry

#### Scenario: Two peers with the same single note

- **WHEN** two cells of one row each hold only the note 5 and the player double taps with Auto Remove Notes on
- **THEN** both cells hold 5

#### Scenario: A wrong note

- **WHEN** a cell's single note differs from the answer
- **THEN** the cell takes that note's digit and no mistake is flagged

### Requirement: One undo for a fill run

One press of Undo SHALL restore the board as it was before the double tap, including every note the run removed. Game Review SHALL show each filled cell as its own step.

#### Scenario: Undo after a run

- **WHEN** a run fills 6 cells and the player presses Undo once
- **THEN** all 6 cells and every removed note are as they were before the double tap

#### Scenario: Reviewing a run

- **WHEN** the player opens Game Review for a game with a 6-cell run
- **THEN** the run shows as 6 fill steps

### Requirement: Staggered arrival

With motion allowed, the system SHALL fill the cells one after another in reading order, 60ms apart, each playing its style's arrival. With motion not allowed it SHALL fill them all at once. The board and controls SHALL ignore the player until the run ends. Pressing Back or the page being hidden during a run SHALL finish the run at once, before the leave dialog opens or the game is saved, so no save ever holds part of a run.

#### Scenario: Motion on

- **WHEN** a run of 3 cells starts with motion allowed
- **THEN** the first cell is filled at once, the second after 60ms and the third after 120ms

#### Scenario: Motion off

- **WHEN** a run of 3 cells starts with motion not allowed
- **THEN** all 3 cells are filled at once

#### Scenario: Interrupting a run

- **WHEN** a run is interrupted with cells left
- **THEN** the rest of the run is finished at once and the outcome follows the table below

##### Example: a 6-cell run interrupted after 2 cells, with Auto Remove Notes on

| Interruption | Outcome |
| ------------ | ------- |
| Back pressed | All 6 cells and their 6 fill steps are in place when the leave dialog opens |
| Back pressed, then Cancel | The game goes on with all 6 cells filled, and one Undo restores the board from before the double tap |
| Back pressed, then Save | The saved game holds all 6 entries, the notes as a whole run leaves them, and 6 fill steps |
| Page hidden | The saved game holds all 6 entries, the notes as a whole run leaves them, and 6 fill steps |
| Back pressed and the rest of the run solves the board | The celebration plays, one completed game is recorded and no leave dialog opens |

### Requirement: Merged group effect

After a run the system SHALL play one group effect holding every row, column and box the run completed, each once, starting from the last filled cell. If the run solves the board, the system SHALL play the celebration instead and record the game once.

#### Scenario: Several groups

- **WHEN** a run ends having completed groups
- **THEN** one effect plays, starting from the last filled cell, holding the groups below as they stand once the run has ended

##### Example: what the effect holds

| What the run did | Effect holds | Notes |
| ---------------- | ------------ | ----- |
| Filled the last two cells of row 0 | Row 0 | One group, once |
| Filled the last cell of row 0 and, elsewhere, the last cell of box 4 | Row 0 and box 4 | |
| Filled one cell that ends row 0, column 3 and box 1 | Row 0, column 3 and box 1 | |
| Filled the last cell of row 0 with a wrong digit | Nothing for row 0 | A group counts only when correct, as for any entry |

#### Scenario: The run solves the board

- **WHEN** the run's last cell completes the board correctly
- **THEN** the celebration plays and one completed game is recorded

### Requirement: Fill feedback

The system SHALL show a toast with the number of cells a run filled, and a toast saying there is nothing to fill when a double tap finds no single-note cell.

#### Scenario: Filled cells

- **WHEN** a run fills 6 cells
- **THEN** a toast states 6 cells were filled

#### Scenario: Nothing to fill

- **WHEN** the player double taps in a medium game with no single-note cell
- **THEN** the board does not change and a toast says there is nothing to fill
