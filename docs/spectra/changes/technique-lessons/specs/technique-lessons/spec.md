## Purpose

A series of lessons that teach every technique the solver uses, from the rules to chains, so a player can learn each one in order and practise it on a real board.

## ADDED Requirements

### Requirement: Curriculum

The app SHALL offer 17 lessons in four groups, in a fixed order, that together cover all 19 techniques the solver uses.

#### Scenario: Lessons appear in their teaching order

- **WHEN** the player opens the lesson list
- **THEN** the lessons appear grouped and ordered as in the example

##### Example: the curriculum

| Group | Lessons in order |
| ----- | ---------------- |
| Basics | Filling in and notes; Rules |
| Easy | Hidden Single; Naked Single |
| Medium | Pointing; Claiming; Naked Pair; Hidden Pair; Naked Triple and Quad; Hidden Triple and Quad |
| Hard | X-Wing; Swordfish and Jellyfish; XY-Wing; W-Wing; XYZ-Wing and WXYZ-Wing; X-Chain; XY-Chain |

#### Scenario: Input comes before the rules

- **WHEN** a player starts with the first lesson
- **THEN** it teaches filling in and notes, pointing at the marked cell rather than naming its row and column, as the next lesson, Rules, is the first to use a digit pad on its own and to name rows and columns

#### Scenario: Every technique has a lesson

- **WHEN** any of the 19 technique ids is looked up
- **THEN** it resolves to exactly one lesson

### Requirement: Lesson list

The lesson list SHALL show each lesson's name, a one-line summary and its state, SHALL mark the first unfinished lesson as next, and SHALL NOT lock any lesson.

#### Scenario: A player opens any lesson

- **WHEN** a player who has finished no lesson taps the last lesson in the list
- **THEN** that lesson opens

#### Scenario: The next lesson is offered

- **WHEN** the player has finished the first six lessons
- **THEN** the list offers Naked Pair as the next lesson and shows 6 of 17 finished

#### Scenario: A finished group offers a game

- **WHEN** every lesson in the Easy, Medium or Hard group is finished
- **THEN** that group offers to start a new game at its difficulty

### Requirement: Lesson stages

Each lesson SHALL run through explanation, guided practice, independent practice and completion, in that order. The Rules and Filling in lessons SHALL have no independent stage. The Filling in lesson MAY alternate explanation and guided practice, as it teaches one skill after another.

#### Scenario: Skipping the explanation

- **WHEN** the player taps the action to skip to practice during an explanation
- **THEN** the lesson moves to the next practice step after the current step, never to an earlier one

#### Scenario: No practice left to skip to

- **WHEN** an explanation step has no practice step after it
- **THEN** the action to skip to practice is not offered, and the main action says next rather than offering a turn

#### Scenario: The practice is the next step

- **WHEN** the next step after an explanation is a practice step
- **THEN** the main action offers the practice, and the action to skip to practice is not offered

#### Scenario: Practice must be solved to move on

- **WHEN** the current practice step is unsolved
- **THEN** the next-step action and arrow are disabled

#### Scenario: Going back

- **WHEN** the player taps the previous arrow on a later step
- **THEN** the previous step shows again with what the player did there kept

### Requirement: Explanation steps

An explanation SHALL show one idea per step on a board, with the digits and candidates unrelated to that step dimmed. The Filling in lesson is the exception: it teaches the controls, not a pattern on the board, and its explanations SHALL dim nothing, because working out what a cell can hold takes the digits around it.

#### Scenario: Unrelated digits are dimmed

- **WHEN** an explanation step about digit 7 in box 1 is shown
- **THEN** digits outside the step's range other than 7 carry the dimmed state, and the 7s stay undimmed

#### Scenario: The Filling in lesson dims nothing

- **WHEN** an explanation step of the Filling in lesson is shown
- **THEN** no digit or candidate carries the dimmed state

### Requirement: Practising by tapping

Practice SHALL be done by tapping cells, whatever the player's input settings. A step SHALL open the floating digit pad only when the player has to decide a digit, and SHALL open it regardless of the floating pad setting. Lessons SHALL NOT show a permanent digit pad.

#### Scenario: Placing a known digit

- **WHEN** a step names digit 3 for box 2 and the player taps the one cell where it can go
- **THEN** the digit is placed and the step is solved, with no digit pad shown

#### Scenario: Removing a candidate

- **WHEN** a step asks which cell can lose a candidate and the player taps that cell
- **THEN** the candidate is shown struck out, with no need to tap the note itself

#### Scenario: Deciding a digit

- **WHEN** a step asks for a digit and the player taps an empty cell allowed by the step, with the floating pad setting off
- **THEN** the floating digit pad opens at that cell

### Requirement: Notes in lessons

Practice boards in the Basics and Easy groups SHALL show no notes, except where the Filling in lesson teaches them. Practice boards in the Medium and Hard groups SHALL show every candidate. Players SHALL NOT write notes during practice outside the Filling in lesson.

#### Scenario: Medium boards come with candidates

- **WHEN** a Naked Pair practice step opens
- **THEN** every empty cell shows its candidates without the player doing anything

#### Scenario: The notes toggle shows it is on

- **WHEN** the player turns on the notes toggle of the Filling in lesson, in any style, theme or mode
- **THEN** the toggle looks different from when it is off in more than its words, using that style's own look for a chosen control

### Requirement: Independent practice has one target

Independent practice SHALL show a whole board and SHALL name one target to look for: a digit, a row, a column or a box. A row, column or box its prompt names SHALL be framed on the board, so the player need not count to find it, and nothing else SHALL be marked. A prompt that names no particular row, column or box frames nothing. A lesson that removes candidates SHALL split its independent practice into the same two steps as its guided practice: first tapping the pattern's cells, then, with the pattern marked, tapping what can lose a candidate.

#### Scenario: The named house is framed

- **WHEN** independent practice for Pointing says to look in box 8
- **THEN** box 8 is framed on the board, and nothing marks the cells to find

#### Scenario: Nothing is named

- **WHEN** independent practice for X-Wing asks for the corners of an X-Wing on two columns, without saying which
- **THEN** no range is framed

#### Scenario: Finding the pattern, then removing

- **WHEN** the player reaches independent practice for X-Wing
- **THEN** the first step asks for the rectangle's four corners, and a cell that is not a corner says why; the next step shows the corners marked and asks which 1 can go

#### Scenario: Any valid answer counts

- **WHEN** independent practice for Hidden Single names digit 5 and the board has two cells where 5 is a hidden single
- **THEN** tapping either cell solves the step

### Requirement: Wrong answers explain themselves

A wrong tap SHALL leave the player on the same step, SHALL NOT change the board, and SHALL say why it was wrong. A wrong digit stays in its cell, marked as wrong, until the player's next action; it is not part of the board. Tapping a cell that already holds a digit is not a wrong tap, unless the step asks for that very cell: it SHALL give no reason and only clears a reason shown before it. On a fill or place step it also lights that digit across the board, as in a game, and a place step keeps it lit through a wrong tap, as the player is still looking for it. A lit digit is not dimmed. A place step that holds its digit lights no other: tapping a filled cell changes nothing.

#### Scenario: The reasons given

- **WHEN** the player taps a wrong cell
- **THEN** the message matches the reason, as in the example

##### Example: reasons by situation

| Situation | Message says |
| --------- | ------------ |
| Digit 3 asked; the column already has a 3 | That column already has a 3 |
| Digit 5 asked; no conflict, but not certain yet | The step's own words on why it is not certain yet |
| Cell outside the step's range | Look in the step's range first |
| A cell of the pattern tapped during removal | This cell is part of the pattern and stays |
| A cell without the candidates in question | This cell does not have those candidates |

#### Scenario: A cell that already holds a digit

- **WHEN** a step asks the player to pick a pattern or write notes, and the player taps a cell holding a 7 it does not ask for
- **THEN** the step and the board stay as they were, and no reason is shown

#### Scenario: A filled cell during a fill or place step

- **WHEN** a step asks the player to work out a digit or place digit 5, and the player taps a cell holding a 7
- **THEN** no reason is shown, and the 7s light up across the board

#### Scenario: Hidden Single teaches lighting a digit

- **WHEN** the player reaches the end of Hidden Single's explanation, before its first practice
- **THEN** a step says a digit on the board can be tapped to light every matching digit, and shows every 7 lit

#### Scenario: Hidden Single has the player light the digit first

- **WHEN** the player starts Hidden Single's guided practice
- **THEN** the first step asks them to tap any 3 on the board; another digit lights without being called wrong and does not finish the step, an empty cell says why, and a 3 lights every 3 and finishes it

#### Scenario: The digit is held while looking for its place

- **WHEN** the player is on the next step, looking for the only cell in box 2 for the 3, and taps a cell holding an 8
- **THEN** the 3s stay lit, the 8s do not light, and no reason is shown

### Requirement: Layered hints

Each practice step SHALL offer a hint that gives more with each use, and SHALL give the answer only at its last level. A step SHALL have only one level only where its prompt already names the answer, as the Filling in lesson's fill step does. Hints SHALL NOT count towards game statistics.

#### Scenario: Hints narrow step by step

- **WHEN** the player uses the hint repeatedly on a Hidden Single step
- **THEN** it shows the box first, then the digit's only place in that box, and lastly the cell itself

#### Scenario: The Rules lesson teaches step by step

- **WHEN** the player uses the hint repeatedly on the Rules lesson's fill step
- **THEN** it names a cell first, then says its row, column and box hold eight digits between them, and lastly gives the digit, and begins again on the next cell once that one is filled

#### Scenario: The last hint leaves the hint action disabled

- **WHEN** the last hint level has been shown
- **THEN** the hint action is disabled

### Requirement: One message at a time

The lesson panel SHALL show one message at a time, and a change of message SHALL NOT move the board.

#### Scenario: A wrong tap replaces the prompt

- **WHEN** the player taps a wrong cell
- **THEN** the reason replaces the prompt until the next tap, and the board's position is unchanged

#### Scenario: Small phones

- **WHEN** a lesson is shown on a 360×640 screen
- **THEN** the board, the panel and its actions all fit without scrolling the page

### Requirement: Board placement on tall screens

When a window has more room than the lesson's tallest panel needs, the panel SHALL stay at the bottom of the screen and the spare room SHALL go above and below the board, so the board sits about midway between the header and the panel. The board's place SHALL depend only on the window, not on the message shown. A window without that spare room SHALL keep the board directly under the header.

#### Scenario: A tall narrow phone

- **WHEN** a lesson is shown on a 390×844 screen
- **THEN** the panel's bottom edge is where it is on any other step, and the gap above the board and the gap below it differ by no more than a line of the panel's text, for a two-line message

#### Scenario: Every step keeps the board in place

- **WHEN** the player moves through a lesson on any window
- **THEN** the board's position is the same on every step

#### Scenario: A small phone has no room to spare

- **WHEN** a lesson is shown on a 360×640 screen
- **THEN** the board sits directly under the header

### Requirement: Completion

Finishing a lesson SHALL open a dialog in the style's completion look, with the lesson's name, its one-sentence takeaway and how many lessons are finished, record the lesson as finished, and offer the next lesson. The last lesson of a group with a difficulty SHALL offer a new game at that difficulty instead; Basics has none, so its last lesson goes on to the next lesson. The dialog SHALL offer only that and going back to the list, which the system Back key also does, and the lesson panel SHALL NOT show behind it. Going on to the next lesson SHALL fade one lesson out and the next in.

#### Scenario: Finishing mid-group

- **WHEN** the player finishes Hidden Single
- **THEN** the lesson is recorded as finished, and a dialog names it, gives its takeaway and how many lessons are finished, and its main action offers Naked Single

#### Scenario: Going back from the dialog

- **WHEN** the player chooses to go back to the list in the dialog, or presses the system Back key
- **THEN** the lesson list shows, with the lesson recorded as finished

#### Scenario: Finishing a group

- **WHEN** the player finishes Naked Single
- **THEN** the dialog's main action starts a new easy game

#### Scenario: Going home after a game from the lessons

- **WHEN** the player finishes a game started from a lesson or the lesson list, and chooses Back to Home on its completion card
- **THEN** Home shows, not the lessons

#### Scenario: Starting a game with one unfinished

- **WHEN** the player starts a game from the lessons with an unfinished game saved
- **THEN** the dialog's action to stay names the lessons, and staying leaves the player where they were; from Home it names Home

#### Scenario: Lessons are not games

- **WHEN** a lesson is finished
- **THEN** game statistics and the saved game are unchanged

### Requirement: Lesson progress

Finished lessons SHALL persist across launches and SHALL NOT be affected by clearing game records. Leaving a lesson before its end SHALL NOT mark it finished.

#### Scenario: Progress survives a restart

- **WHEN** the player finishes a lesson and restarts the app
- **THEN** the lesson still shows as finished

#### Scenario: Unreadable progress

- **WHEN** stored progress cannot be read
- **THEN** every lesson shows as not finished and the list still opens

### Requirement: Lesson boards are verified

Every lesson board SHALL be a valid position, and each technique step's pattern and removals SHALL match what the solver's own technique finds on that board.

#### Scenario: A wrong board fails the tests

- **WHEN** a lesson's declared removal differs from the solver technique's result on that board
- **THEN** the lesson content test fails

### Requirement: Entry points

Lessons SHALL open from Home's lessons entry and by a lesson's address only. Neither the Walkthrough nor game hint mode SHALL link to lessons: a player in the middle of either is not sent away from it.

#### Scenario: The Walkthrough shows no link

- **WHEN** a Walkthrough step shows its technique tag
- **THEN** nothing beside the tag opens a lesson

#### Scenario: No link during a game

- **WHEN** hint mode shows a technique during a game
- **THEN** no link to a lesson is shown

### Requirement: Lesson language

All lesson copy SHALL exist in English and Traditional Chinese.

#### Scenario: Switching language

- **WHEN** the player switches language
- **THEN** the lesson list and the open lesson's text switch with it
