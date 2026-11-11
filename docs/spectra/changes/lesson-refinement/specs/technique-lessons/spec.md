## ADDED Requirements

### Requirement: Hidden Single in rows and columns
The Hidden Single lesson SHALL teach finding a hidden single in a row or column as well as in a box, without adding a lesson. Its explanation SHALL show a digit with one place left in a row, and SHALL say why boxes come first: a box meets a line in three cells, two lines meet in one. Its guided practice SHALL add a step that places a digit in a row, chosen so that the row has one place left for the digit while the digit's box still has more than one, so only the row gives the answer.

#### Scenario: A row's hidden single in the explanation
- **WHEN** the player moves through Hidden Single's explanation past the box example
- **THEN** a step frames a row, crosses out its cells that cannot hold the digit, and shows the one cell left, followed by a step on why boxes are looked at first

#### Scenario: Guided practice in a row
- **WHEN** the player reaches the row step of Hidden Single's guided practice
- **THEN** the prompt names the row and the digit, the row is framed, and tapping the one cell left places the digit

#### Scenario: The row is needed
- **WHEN** the lesson content tests run
- **THEN** the row step's answer is the only cell of its row that can hold the digit, and the digit has at least two cells left in the answer's box

### Requirement: Placing only what is certain
The Hidden Single lesson's explanation SHALL show that a digit which fits a cell can still be wrong. It SHALL place a supposed digit that conflicts with nothing yet is not the cell's answer, follow it through singles, and end on a house left with no place for that digit, with the first supposed digit then shown as refuted. It SHALL close by saying to fill a digit only when it must go there. The demonstration SHALL come after the row explanation and before the tip on lighting digits.

#### Scenario: Following a supposed digit to a dead end
- **WHEN** the player moves through the demonstration
- **THEN** the first step shows the supposed digit, the next steps add the digits that follow from it, and the last step frames a house whose empty cells are all crossed out, with the first supposed digit shown as wrong

##### Example: the steps of the demonstration
| Step | Board shows | Text says |
| ---- | ----------- | --------- |
| 1 | A supposed 2 in an empty cell | It fits: no 2 in its row, column or box |
| 2 to n−1 | Each following single added | This digit follows from the one before |
| n | A box framed, its empty cells crossed, the first 2 marked wrong | The box has no place left for a 2, so the first 2 was wrong |
| n+1 | The board without the supposed digits | Fill a digit only when it must go there |

### Requirement: From placing digits to removing candidates
The first lesson of the Medium group, Pointing, SHALL open with an explanation step that says that from here on most techniques remove candidates rather than place digits, that lesson boards show every candidate, and that Auto Notes in Settings fills them in a game. The step is about the whole board and SHALL dim nothing.

#### Scenario: Opening Pointing
- **WHEN** the player opens Pointing
- **THEN** the first step shows its board with every candidate and nothing dimmed, and the text explains the move to removing candidates and where to find Auto Notes

### Requirement: Counter-examples and search tips
Explanations SHALL show where a pattern does not hold and how to look for it, as explanation steps only, leaving the practice steps unchanged:

- Pointing SHALL show a box whose candidates for a digit lie on more than one line, so nothing can be removed.
- Claiming SHALL show a line whose candidates for a digit lie in more than one box, so nothing can be removed.
- X-Wing SHALL show how to look for one: one digit at a time, the lines where it has exactly two places, then two such lines whose places share the same two crossing lines.
- XY-Wing SHALL show how to look for one, marking the cells with exactly two candidates as the only ones it uses, and SHALL show an XY-Wing whose shared digit is in no cell that sees both ends, so nothing can be removed.

#### Scenario: A box that does not point
- **WHEN** the player reaches Pointing's counter-example
- **THEN** the box and the digit's candidates in it are marked, they lie on more than one row or column, and no candidate is shown removed

#### Scenario: An XY-Wing with nothing to remove
- **WHEN** the player reaches XY-Wing's counter-example
- **THEN** the pivot and both ends are marked, and the text says no cell that sees both ends holds the shared digit

#### Scenario: The claims are checked
- **WHEN** the lesson content tests run
- **THEN** they fail if a counter-example's candidates do lie on one line or in one box, if a line X-Wing's tip marks has other than two places for its digit, if a cell XY-Wing's tip marks has other than two candidates, or if any cell that sees both ends of the XY-Wing counter-example holds the shared digit

### Requirement: Complementary subsets
The Hidden Triple and Quad lesson SHALL show, after its hidden triple, that the other empty cells of the same house form a naked group of their own, and SHALL say that one of the two groups always has four cells or fewer, so no group larger than four needs looking for, and that the smaller group is the one to look for. The complementary group shown SHALL have between two and four cells.

#### Scenario: The other cells form a group
- **WHEN** the player reaches the step after the hidden triple
- **THEN** the house's other empty cells are marked, together holding exactly as many candidates as there are cells

#### Scenario: The claim is checked
- **WHEN** the lesson content tests run
- **THEN** they fail if the marked cells' candidates, taken together, do not number exactly as many as the cells, or if there are fewer than two or more than four cells

### Requirement: Lesson copy that supports the learner
Lesson copy SHALL tell the player, at the Rules lesson's first hint, that the hint action helps when stuck; SHALL tell the player in the Basics group's note on the lesson list that lessons can be taken at their own pace and in any order; SHALL end each lesson's last independent step's success message with encouragement; and SHALL give a common other name for Hidden Single, Naked Single, Pointing and Claiming where the explanation first names the technique. Lesson names and the fixed terms of the app's copy rules SHALL stay unchanged.

#### Scenario: Other names in the explanation
- **WHEN** Hidden Single's explanation first names the technique, in Traditional Chinese
- **THEN** the same text also gives a name players meet elsewhere, while the lesson's name stays 隱藏唯一數

#### Scenario: The longer note fits
- **WHEN** the lesson list is shown 320 wide, in either language and any style
- **THEN** the Basics group's note wraps within its group and nothing in the list is cut off or overlaps

### Requirement: Explanation text matches the marked cells
An explanation step SHALL mark only the cells its text is about, besides the range that frames them, so the player never has to count rows and columns to tell which marked cell the text means. A step whose text makes two or more separate claims about different cells, such as two cases or a pattern followed by a removal, SHALL be split into one step per claim. A step whose text follows one argument from cell to cell, or treats the marked cells as one group, MAY stay one step.

#### Scenario: XYZ-Wing's cases
- **WHEN** the player moves through XYZ-Wing's explanation past its ends
- **THEN** the case of a pivot of 5 and the case of a pivot of 9 are separate steps, each lighting only the pivot and the end its text names

#### Scenario: A pattern before its removal
- **WHEN** the player reaches the Jellyfish or the WXYZ-Wing in an explanation
- **THEN** one step shows the pattern with no candidate removed, and the next step shows the removal

#### Scenario: The split is checked
- **WHEN** the lesson content tests run
- **THEN** they fail if either XYZ-Wing case step lights other than two cells, or if the Jellyfish or WXYZ-Wing pattern step removes a candidate

## MODIFIED Requirements

### Requirement: Explanation steps
An explanation SHALL show one idea per step on a board, with the digits and candidates unrelated to that step dimmed. The Filling in lesson is the exception: it teaches the controls, not a pattern on the board, and its explanations SHALL dim nothing, because working out what a cell can hold takes the digits around it. A step about the whole board rather than a pattern on it, such as Hidden Single's tip on lighting digits or the step that opens the Medium group, SHALL dim nothing either.

#### Scenario: Unrelated digits are dimmed
- **WHEN** an explanation step about digit 7 in box 1 is shown
- **THEN** digits outside the step's range other than 7 carry the dimmed state, and the 7s stay undimmed

#### Scenario: The Filling in lesson dims nothing
- **WHEN** an explanation step of the Filling in lesson is shown
- **THEN** no digit or candidate carries the dimmed state

#### Scenario: A step about the whole board dims nothing
- **WHEN** the step that opens Pointing is shown
- **THEN** no digit or candidate carries the dimmed state

### Requirement: Lesson boards are verified
Every lesson board SHALL be a valid position, and each technique step's pattern and removals SHALL match what the solver's own technique finds on that board. Supposed digits SHALL be checked too: each supposed cell is empty on the board and conflicts with neither the board's digits nor the supposed digits before it, the first supposed digit is not its cell's answer, and every later one is a hidden or naked single once the ones before it are on the board. A claimed contradiction SHALL hold: with every supposed digit on the board, no empty cell of its range can hold its digit, and the range does not already hold it.

#### Scenario: A wrong board fails the tests
- **WHEN** a lesson's declared removal differs from the solver technique's result on that board
- **THEN** the lesson content test fails

#### Scenario: A supposed digit that is the answer fails the tests
- **WHEN** the first supposed digit of a demonstration is its cell's answer
- **THEN** the lesson content test fails

#### Scenario: A supposed digit that does not follow fails the tests
- **WHEN** a later supposed digit is neither a hidden nor a naked single given the ones before it
- **THEN** the lesson content test fails

#### Scenario: A contradiction that does not hold fails the tests
- **WHEN** a step claims a box has no place for a digit, yet one of its empty cells can still hold it with the supposed digits on the board
- **THEN** the lesson content test fails
