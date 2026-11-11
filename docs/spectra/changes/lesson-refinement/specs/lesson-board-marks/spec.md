## ADDED Requirements

### Requirement: Supposed digits
A lesson board SHALL be able to show supposed digits, placed only for the length of an argument and never part of the board. A supposed digit SHALL use the look of a digit the player has filled in, and a refuted one SHALL use the look of a wrong digit in practice, so every style already draws both and no style needs a hook of its own. Supposed and refuted digits SHALL NOT be dimmed. Only lesson boards show them; hint mode, the Walkthrough and Game Review are unchanged.

#### Scenario: A supposed digit
- **WHEN** an explanation step supposes a 2 in an empty cell
- **THEN** the cell shows 2 with the filled-in look, and is not dimmed even when the step dims other digits

#### Scenario: A refuted digit
- **WHEN** a later step refutes that 2
- **THEN** the cell shows 2 with the wrong-digit look

#### Scenario: Every style draws them
- **WHEN** the demonstration is shown in each of the nine styles, with motion on and off
- **THEN** the supposed and refuted digits are readable and look different from each other, with nothing to wait for
