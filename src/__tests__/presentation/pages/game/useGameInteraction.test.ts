import { describe, it, expect, vi } from "vitest";
import { StepRecorder } from "@/domain/game/StepRecorder";
import { createKnownSudoku } from "@/__tests__/fixtures/knownPuzzle";
import { useGameInteraction } from "@/presentation/pages/game/useGameInteraction";
import { InputMode } from "@/presentation/pages/game/InputMode";

// Known puzzle: (0, 0) is the clue 5, (0, 2) is empty, (0, 3) is empty.
const setup = () => {
    const sudoku = createKnownSudoku();
    const stepRecorder = new StepRecorder();
    const interaction = useGameInteraction({
        sudoku,
        stepRecorder,
        clearErrors: vi.fn(),
        checkAndComplete: vi.fn(),
        autoRemoveNotes: () => false,
    });
    return { sudoku, stepRecorder, ...interaction };
};

describe("useGameInteraction Erase with a selected cell", () => {
    it("clears the selected cell at once, records it and stays out of Erase mode", () => {
        const { clickCell, selectDigit, toggleEraseMode, sudoku, stepRecorder, inputMode, selectedCell } = setup();
        clickCell(0, 2);
        selectDigit(4);
        clickCell(0, 2);

        toggleEraseMode();

        expect(sudoku.puzzle[0][2].entry).toBe(0);
        const steps = stepRecorder.steps;
        expect(steps[steps.length - 1].action).toBe("erase");
        expect(inputMode.value).toBe(InputMode.Normal);
        expect(selectedCell.value).toBeNull();
    });

    it("has nothing to erase on an empty selected cell", () => {
        const { clickCell, eraseDisabled } = setup();

        clickCell(0, 2);

        expect(eraseDisabled.value).toBe(true);
    });
});

describe("useGameInteraction quick input", () => {
    describe("tapping a clue", () => {
        it("selects the clue cell without picking its digit", () => {
            const { clickCell, isSelected, selectedDigit } = setup();

            clickCell(0, 0);

            expect(isSelected(0, 0)).toBe(true);
            expect(selectedDigit.value).toBeNull();
        });

        it("clears the clue selection when the clue is tapped again", () => {
            const { clickCell, isSelected, selectedCell, selectedDigit } = setup();

            clickCell(0, 0);
            clickCell(0, 0);

            expect(isSelected(0, 0)).toBe(false);
            expect(selectedCell.value).toBeNull();
            expect(selectedDigit.value).toBeNull();
        });

        it("switches Erase mode to Normal and selects the clue", () => {
            const { clickCell, toggleEraseMode, selectedDigit, inputMode, isSelected } = setup();
            toggleEraseMode();

            clickCell(0, 0);

            expect(inputMode.value).toBe(InputMode.Normal);
            expect(selectedDigit.value).toBeNull();
            expect(isSelected(0, 0)).toBe(true);
        });

        it("clears a digit picked on the pad instead of switching to the clue's digit", () => {
            const { clickCell, selectDigit, selectedDigit, isSelected } = setup();
            selectDigit(4);

            clickCell(0, 0);

            expect(selectedDigit.value).toBeNull();
            expect(isSelected(0, 0)).toBe(true);
        });

        it("does not fill the previously selected cell and moves the selection to the clue", () => {
            const { clickCell, sudoku, selectedCell, selectedDigit } = setup();
            clickCell(0, 2);

            clickCell(0, 0);

            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(selectedCell.value).toEqual({ row: 0, column: 0 });
            expect(selectedDigit.value).toBeNull();
        });

        it("moves the outline to another clue and still picks no digit", () => {
            const { sudoku, clickCell, isSelected, selectedDigit } = setup();
            const otherFive = sudoku.puzzle.flatMap((cells, row) => cells.map((cell, column) => ({ cell, row, column })))
                .find(({ cell, row, column }) => cell.isClue && cell.clue === 5 && !(row === 0 && column === 0));
            if (otherFive === undefined) throw new Error("fixture needs a second clue 5");

            clickCell(0, 0);
            clickCell(otherFive.row, otherFive.column);

            expect(isSelected(otherFive.row, otherFive.column)).toBe(true);
            expect(isSelected(0, 0)).toBe(false);
            expect(selectedDigit.value).toBeNull();
        });

        it("highlights the clue's value as the digit to match", () => {
            const { clickCell, highlightedDigit } = setup();

            clickCell(0, 0);

            expect(highlightedDigit.value).toBe(5);
        });

        it("never writes into a selected clue from the digit pad", () => {
            const { clickCell, selectDigit, sudoku, isSelected, selectedDigit } = setup();

            clickCell(0, 0);
            selectDigit(4);

            expect(sudoku.puzzle[0][0].clue).toBe(5);
            expect(sudoku.puzzle[0][0].entry).toBe(0);
            expect(selectedDigit.value).toBe(4);
            expect(isSelected(0, 0)).toBe(false);
        });

        it("keeps a player's entry when it is tapped right after a clue, and selects it", () => {
            const { clickCell, selectDigit, sudoku, isSelected, selectedDigit } = setup();
            selectDigit(2);
            clickCell(0, 2);
            selectDigit(2);
            expect(sudoku.puzzle[0][2].entry).toBe(2);

            clickCell(0, 0);
            clickCell(0, 2);

            expect(sudoku.puzzle[0][2].entry).toBe(2);
            expect(isSelected(0, 2)).toBe(true);
            expect(isSelected(0, 0)).toBe(false);
            expect(selectedDigit.value).toBeNull();
        });

        it("does not fill an empty cell tapped after a clue, it only selects it", () => {
            const { clickCell, sudoku, isSelected } = setup();

            clickCell(0, 0);
            clickCell(0, 2);

            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(isSelected(0, 2)).toBe(true);
            expect(isSelected(0, 0)).toBe(false);
        });

        it("does not make player-filled cells pick their digit", () => {
            const { clickCell, selectDigit, selectedDigit, sudoku } = setup();
            selectDigit(4);
            clickCell(0, 2);

            clickCell(0, 2);

            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(selectedDigit.value).toBe(4);
        });
    });

    describe("a selected clue and long press", () => {
        it("does nothing on another cell, since no digit is selected", () => {
            const { clickCell, longPressCell, sudoku, isSelected } = setup();

            clickCell(0, 0);
            longPressCell(0, 2);

            expect(sudoku.puzzle[0][2].notes).toEqual([]);
            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(isSelected(0, 0)).toBe(true);
        });
    });

    describe("row, column and box peers", () => {
        it("finds the row, column and box peers of the selected cell", () => {
            const { clickCell, isPeerOfSelected } = setup();
            expect(isPeerOfSelected(0, 4)).toBe(false);

            clickCell(4, 4);

            expect(isPeerOfSelected(4, 0)).toBe(true);
            expect(isPeerOfSelected(0, 4)).toBe(true);
            expect(isPeerOfSelected(3, 3)).toBe(true);
            expect(isPeerOfSelected(0, 0)).toBe(false);
            expect(isPeerOfSelected(4, 4)).toBe(false);
        });
    });

    describe("long-pressing a cell", () => {
        it("toggles the note in Normal mode and keeps the mode", () => {
            const { longPressCell, selectDigit, sudoku, inputMode } = setup();
            selectDigit(4);

            longPressCell(0, 2);

            expect(sudoku.puzzle[0][2].notes).toContain(4);
            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(inputMode.value).toBe(InputMode.Normal);
        });

        it("fills the digit in Note mode and keeps the mode", () => {
            const { longPressCell, selectDigit, toggleNoteMode, sudoku, inputMode } = setup();
            toggleNoteMode();
            selectDigit(4);

            longPressCell(0, 2);

            expect(sudoku.puzzle[0][2].entry).toBe(4);
            expect(inputMode.value).toBe(InputMode.Note);
        });

        it("does nothing when no digit is selected", () => {
            const { longPressCell, sudoku, stepRecorder, selectedCell } = setup();

            longPressCell(0, 2);

            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(sudoku.puzzle[0][2].notes).toEqual([]);
            expect(selectedCell.value).toBeNull();
            expect(stepRecorder.steps).toHaveLength(0);
        });

        it("does nothing in Erase mode", () => {
            const { longPressCell, toggleEraseMode, sudoku, stepRecorder } = setup();
            toggleEraseMode();

            longPressCell(0, 2);

            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(stepRecorder.steps).toHaveLength(0);
        });

        it("only selects the clue when pressed on a clue", () => {
            const { longPressCell, selectedDigit, isSelected } = setup();

            longPressCell(0, 0);

            expect(selectedDigit.value).toBeNull();
            expect(isSelected(0, 0)).toBe(true);
        });

        it("records the step and can be undone", () => {
            const { longPressCell, selectDigit, undo, sudoku, stepRecorder } = setup();
            selectDigit(4);

            longPressCell(0, 2);

            expect(stepRecorder.steps.map((step) => step.action)).toEqual(["toggleNote"]);
            undo();
            expect(sudoku.puzzle[0][2].notes).toEqual([]);
        });
    });
});
