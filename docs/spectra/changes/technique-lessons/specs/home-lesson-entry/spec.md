## Purpose

Home carries the lessons as a fourth entry in a two-by-two grid, and fits every style on short screens by shrinking step by step.

## ADDED Requirements

### Requirement: Four entries

Home SHALL show its entries in a two-column grid, in the order lessons, Walkthrough, statistics, settings.

#### Scenario: Entry order

- **WHEN** Home opens
- **THEN** the entries read lessons, Walkthrough, statistics, settings, in two rows of two

### Requirement: Lesson entry subtitle

The lesson entry's subtitle SHALL invite a new player in, and SHALL show progress once a lesson is finished. Home SHALL NOT open a dialog to promote the lessons.

#### Scenario: Subtitle by progress

- **WHEN** Home opens
- **THEN** the subtitle matches the player's progress, as in the example

##### Example: subtitle

| Lessons finished | Subtitle says |
| ---------------- | ------------- |
| 0 | First time? Start here |
| 6 | 6 of 17 learned |

### Requirement: Home fits short windows

Home SHALL fit without scrolling in every style, with a saved game, on windows from 480px tall up, by shrinking in steps. Windows wider than the column SHALL stay at full size, as they do today.

#### Scenario: Sizes by window height

- **WHEN** Home opens on a narrow window of the given height
- **THEN** its sizes follow the example

##### Example: bands, for every style

| Window height | Sizes |
| ------------- | ----- |
| 820px and up | Full size |
| 644px to 819px | Gaps, logo, and new game button shrink with the height |
| 624px to 643px | Those at their smallest |
| 550px to 623px | Also smaller title, subtitle, tile labels and card gaps |
| Under 550px | Also no subtitles on the four entries, and smaller margins and logo |

#### Scenario: Ink's vertical title

- **WHEN** the window is under 813px tall on a narrow window in the ink style
- **THEN** its vertical title takes its smaller size, so Home still fits; a window wider than the column does so only under 741px, as it did before

#### Scenario: Subtitles leave only when needed

- **WHEN** the window is 568px tall in any style
- **THEN** the four entries keep their subtitles and Home fits without scrolling

#### Scenario: Very short windows

- **WHEN** the window is 480px tall in any style
- **THEN** the entries show no subtitles and Home fits without scrolling

### Requirement: Tall screens keep their sizes

On windows 844px tall and up, Home SHALL keep today's sizes for everything except the entry grid.

#### Scenario: Comparing with the old build

- **WHEN** Home at 390×844 with a saved game is compared element by element with the previous build, in the web build and on Android
- **THEN** only the entry grid and the free space around the cards differ
