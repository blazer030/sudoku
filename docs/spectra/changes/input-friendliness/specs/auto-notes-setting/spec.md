## Purpose

Auto Notes becomes a setting that decides how each game starts, so players either begin with every note in place or write their own.

## ADDED Requirements

### Requirement: Auto notes setting

The system SHALL offer a persisted setting for starting games with auto notes, off by default. Changing it SHALL NOT alter a game already started or saved.

#### Scenario: Off by default

- **WHEN** a player with no saved value starts a new game
- **THEN** no cell holds notes

#### Scenario: A game under way

- **WHEN** the player turns the setting on and continues a saved game
- **THEN** that game's notes do not change

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

#### Scenario: Old reviews

- **WHEN** the player opens Game Review for an older game that used Auto Notes as a hint
- **THEN** that step still shows as before
