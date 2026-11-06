## Purpose

The marks only lessons need on a board, drawn so each visual style stays recognisable, and clearer range marks for the 8-bit style, whose handheld palette gets a notice before lessons.

## ADDED Requirements

### Requirement: Dimmed digits

A dimmed digit SHALL use its style's dim colour token rather than opacity, in every style, and SHALL stay at least 1.5:1 against its cell.

#### Scenario: Every style defines the colour

- **WHEN** the palette tests run
- **THEN** every style and mode has a dim colour that meets the minimum against its cell

### Requirement: Crossed-out cells

A cell ruled out by an explanation SHALL show a cross drawn with the current style's own icon, not a text character.

#### Scenario: The cross follows the style

- **WHEN** an explanation rules out an empty cell
- **THEN** the cell shows the current style's `X` icon

### Requirement: Lesson state marks

Each lesson row SHALL show a mark for finished, next or not started, each distinguishable from the others in every style. Each style SHALL draw the mark in its own shape language, through skin hooks of the lesson row's own.

#### Scenario: The three states differ

- **WHEN** the lesson list shows finished, next and unstarted lessons
- **THEN** each row's mark carries its state in a `data-skin` token, and each style has a rule for all three

### Requirement: Target digits

A digit an explanation points at SHALL use a target cell variant, separate from the same-digit highlight of the game.

#### Scenario: The game's highlight is unchanged

- **WHEN** a player selects a digit during a game in the 8-bit style
- **THEN** matching digits keep today's same-digit look

### Requirement: 8-bit range and pattern marks

In the 8-bit style, a highlighted range SHALL be drawn as dots in a dark ink, target digits SHALL be inverted, pattern cells SHALL keep a light fill so lines drawn across them stay visible, and an eliminated candidate SHALL have a thicker strike than today. These marks SHALL apply wherever steps are shown: lessons, hint mode, the Walkthrough and Game Review.

#### Scenario: Marks by mode

- **WHEN** a step with a range, a target and a pattern is shown in the 8-bit style
- **THEN** the marks follow the example

##### Example: colours

| Mark | 掌機 (light) | 紅白機 (dark) |
| ---- | ------------ | ------------- |
| Range dots | #306230 on #9BBC0F | #6C6C6C on #000000 |
| Target digit | #9BBC0F on #0F380F | #FCFCFC on #0058F8 |
| Pattern cell | #8BAC0F | #1E1E3C |

#### Scenario: Lines stay visible

- **WHEN** an X-Wing's rectangle is drawn over its corners in the 8-bit style
- **THEN** the corners are not filled with the line's colour

### Requirement: Handheld notice

Entering lessons in the 8-bit style's 掌機 mode SHALL first show a notice that its marks can be hard to see, offering to switch to 紅白機, to look at other styles, or to carry on. Choosing to carry on SHALL be remembered, and the notice SHALL NOT show again. No other style or mode SHALL show it.

#### Scenario: Entering from Home

- **WHEN** the player in 掌機 opens the lessons for the first time
- **THEN** the notice shows before the lesson list can be used

#### Scenario: Entering from the Walkthrough

- **WHEN** the player in 掌機 opens a lesson from the Walkthrough and has not chosen to carry on before
- **THEN** the notice shows before the lesson

#### Scenario: Switching to the dark mode

- **WHEN** the player chooses to switch to 紅白機
- **THEN** the style's mode becomes 紅白機 and the lessons open

#### Scenario: Looking at other styles

- **WHEN** the player chooses to look at other styles
- **THEN** the Appearance page opens

#### Scenario: Carrying on is remembered

- **WHEN** the player chooses to carry on and later opens the lessons again in 掌機
- **THEN** no notice shows

#### Scenario: Other looks show no notice

- **WHEN** the player opens the lessons in 紅白機 or any other style
- **THEN** no notice shows

### Requirement: Lessons in every style

The lesson list and lesson page SHALL be styled in all nine styles, and new skin hooks SHALL be covered by the style coverage test.

#### Scenario: A style without a rule fails

- **WHEN** a style has no rule for a new lesson hook that needs one
- **THEN** the style coverage test fails

#### Scenario: Motion off

- **WHEN** motion effects are off
- **THEN** lessons show every state directly, with no animation needed to read them
