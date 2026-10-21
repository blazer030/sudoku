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

describe("useGameInteraction quick input", () => {
    describe("tapping a clue", () => {
        it("selects the clue digit", () => {
            const { clickCell, selectedDigit } = setup();

            clickCell(0, 0);

            expect(selectedDigit.value).toBe(5);
        });

        it("deselects the digit when it is already selected", () => {
            const { clickCell, selectedDigit } = setup();

            clickCell(0, 0);
            clickCell(0, 0);

            expect(selectedDigit.value).toBeNull();
        });

        it("switches Erase mode to Normal and selects the digit", () => {
            const { clickCell, toggleEraseMode, selectedDigit, inputMode } = setup();
            toggleEraseMode();

            clickCell(0, 0);

            expect(inputMode.value).toBe(InputMode.Normal);
            expect(selectedDigit.value).toBe(5);
        });

        it("does not fill the selected cell and moves the selection to the clue", () => {
            const { clickCell, sudoku, selectedCell, selectedDigit } = setup();
            clickCell(0, 2);

            clickCell(0, 0);

            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(selectedCell.value).toEqual({ row: 0, column: 0 });
            expect(selectedDigit.value).toBe(5);
        });

        it("selects the tapped clue cell along with its digit", () => {
            const { clickCell, isSelected, selectedDigit } = setup();

            clickCell(0, 0);

            expect(isSelected(0, 0)).toBe(true);
            expect(selectedDigit.value).toBe(5);
        });

        it("clears the clue selection when the clue is tapped again", () => {
            const { clickCell, isSelected, selectedCell, selectedDigit } = setup();

            clickCell(0, 0);
            clickCell(0, 0);

            expect(isSelected(0, 0)).toBe(false);
            expect(selectedCell.value).toBeNull();
            expect(selectedDigit.value).toBeNull();
        });

        it("moves the outline to another clue with the same digit and keeps the digit selected", () => {
            const { sudoku, clickCell, isSelected, selectedDigit } = setup();
            const otherFive = sudoku.puzzle.flatMap((cells, row) => cells.map((cell, column) => ({ cell, row, column })))
                .find(({ cell, row, column }) => cell.isClue && cell.clue === 5 && !(row === 0 && column === 0));
            expect(otherFive).toBeDefined();

            clickCell(0, 0);
            clickCell(otherFive!.row, otherFive!.column);

            expect(isSelected(otherFive!.row, otherFive!.column)).toBe(true);
            expect(isSelected(0, 0)).toBe(false);
            expect(selectedDigit.value).toBe(5);
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

        it("moves the outline off a clue when an empty cell is filled digit first", () => {
            const { clickCell, sudoku, isSelected } = setup();

            clickCell(0, 0);
            clickCell(0, 2);

            expect(sudoku.puzzle[0][2].entry).toBe(5);
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
        it("moves the outline off a clue when another cell is long-pressed", () => {
            const { clickCell, longPressCell, sudoku, isSelected } = setup();

            clickCell(0, 0);
            longPressCell(0, 2);

            expect(sudoku.puzzle[0][2].notes).toEqual([5]);
            expect(isSelected(0, 0)).toBe(false);
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

        it("picks the digit when pressed on a clue", () => {
            const { longPressCell, selectedDigit } = setup();

            longPressCell(0, 0);

            expect(selectedDigit.value).toBe(5);
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
