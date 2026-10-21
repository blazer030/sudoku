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

        it("does not fill the selected cell and drops the cell selection", () => {
            const { clickCell, sudoku, selectedCell, selectedDigit } = setup();
            clickCell(0, 2);

            clickCell(0, 0);

            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(selectedCell.value).toBeNull();
            expect(selectedDigit.value).toBe(5);
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
