import { computed, ref } from "vue";
import { BOARD_SIZE, BOX_SIZE } from "@/domain";
import type { Sudoku } from "@/domain";
import type { StepRecorder } from "@/domain/game/StepRecorder";
import { InputMode } from "@/presentation/pages/game/InputMode";

interface GameInteractionOptions {
    sudoku: Sudoku;
    stepRecorder: StepRecorder;
    clearErrors: () => void;
    checkAndComplete: (origin: { row: number; column: number }) => void;
    onGroupCompleted?: (cells: { row: number; column: number }[], origin: { row: number; column: number }) => void;
    autoRemoveNotes: () => boolean;
    /** True while the board ignores the player, e.g. during hint mode. */
    isLocked?: () => boolean;
}

export const useGameInteraction = ({
    sudoku,
    stepRecorder,
    clearErrors,
    checkAndComplete,
    onGroupCompleted,
    autoRemoveNotes,
    isLocked = () => false,
}: GameInteractionOptions) => {
    const selectedCell = ref<{ row: number; column: number } | null>(null);
    const selectedDigit = ref<number | null>(null);
    const inputMode = ref(InputMode.Normal);

    const clickCell = (row: number, column: number) => {
        if (isLocked()) return;
        clearErrors();
        if (sudoku.puzzle[row][column].isClue) {
            pickClueDigit(row, column);
            return;
        }
        clearClueSelection();
        if (inputMode.value === InputMode.Erase) {
            eraseCell(row, column);
            return;
        }
        if (selectedDigit.value !== null) {
            if (inputMode.value === InputMode.Note) {
                noteToCell(row, column, selectedDigit.value);
            } else {
                inputToCell(row, column, selectedDigit.value);
            }
            return;
        }
        toggleSelectCell(row, column);
    };

    // Digit-first only: performs the opposite input of the current mode, once, without changing the mode.
    const longPressCell = (row: number, column: number) => {
        if (isLocked()) return;
        if (sudoku.puzzle[row][column].isClue) {
            clickCell(row, column);
            return;
        }
        if (inputMode.value === InputMode.Erase) return;
        if (selectedDigit.value === null) return;
        clearErrors();
        clearClueSelection();
        if (inputMode.value === InputMode.Note) {
            inputToCell(row, column, selectedDigit.value);
        } else {
            noteToCell(row, column, selectedDigit.value);
        }
    };

    // A tapped clue picks its digit and shows the selection outline, but it never becomes an input target.
    const pickClueDigit = (row: number, column: number) => {
        const digit = sudoku.puzzle[row][column].clue;
        if (inputMode.value === InputMode.Erase) inputMode.value = InputMode.Normal;
        // Tapping a different clue of the selected digit moves the outline; only the same one (or a digit-pad pick) toggles off.
        const outlinedClue = selectedCell.value;
        const movesOutline = selectedDigit.value === digit
            && outlinedClue !== null
            && (outlinedClue.row !== row || outlinedClue.column !== column)
            && sudoku.puzzle[outlinedClue.row][outlinedClue.column].isClue;
        if (movesOutline) {
            selectedCell.value = { row, column };
            return;
        }
        selectedDigit.value = selectedDigit.value === digit ? null : digit;
        selectedCell.value = selectedDigit.value === digit ? { row, column } : null;
    };

    const clearClueSelection = () => {
        if (selectedCell.value === null) return;
        if (sudoku.puzzle[selectedCell.value.row][selectedCell.value.column].isClue) selectedCell.value = null;
    };

    const noteToCell = (row: number, column: number, value: number) => {
        sudoku.toggleNote(row, column, value);
        stepRecorder.record(sudoku.puzzle, "toggleNote", row, column, value);
    };

    const inputToCell = (row: number, column: number, value: number) => {
        if (sudoku.puzzle[row][column].isClue) return;
        if (sudoku.puzzle[row][column].entry === value) {
            sudoku.fill(row, column, 0);
            stepRecorder.record(sudoku.puzzle, "erase", row, column, 0);
            return;
        }
        sudoku.fill(row, column, value, { autoRemoveNotes: autoRemoveNotes() });
        stepRecorder.record(sudoku.puzzle, "fill", row, column, value);
        if (!sudoku.isCompleted()) {
            const completed = sudoku.findCompletedGroups(row, column);
            if (completed.cells.length > 0) onGroupCompleted?.(completed.cells, { row, column });
        }
        checkAndComplete({ row, column });
        if (isDigitCompleted(value)) selectedDigit.value = null;
    };

    const toggleSelectCell = (row: number, column: number) => {
        if (sudoku.puzzle[row][column].isClue) return;
        if (isSelected(row, column)) {
            selectedCell.value = null;
            return;
        }
        selectedCell.value = { row, column };
    };

    const isSelected = (row: number, column: number) => {
        if (selectedCell.value === null) return false;
        if (selectedCell.value.row !== row) return false;
        return selectedCell.value.column === column;
    };

    const isPeerOfSelected = (row: number, column: number) => {
        if (selectedCell.value === null) return false;
        const selected = selectedCell.value;
        if (selected.row === row && selected.column === column) return false;
        if (selected.row === row || selected.column === column) return true;
        const sameBoxRow = Math.floor(selected.row / BOX_SIZE) === Math.floor(row / BOX_SIZE);
        const sameBoxColumn = Math.floor(selected.column / BOX_SIZE) === Math.floor(column / BOX_SIZE);
        return sameBoxRow && sameBoxColumn;
    };

    const digitCounts = computed(() => {
        const counts = Array.from<number, number>({ length: 10 }, () => 0);
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                const cell = sudoku.puzzle[row][column];
                // 明確存取兩個屬性，確保 Vue 追蹤 _clue 和 _entry
                const clue = cell.clue;
                const entry = cell.entry;
                if (clue > 0) counts[clue]++;
                else if (entry > 0) counts[entry]++;
            }
        }
        return counts;
    });

    const isDigitCompleted = (digit: number): boolean => {
        return digitCounts.value[digit] >= 9;
    };

    const eraseCell = (row: number, column: number) => {
        sudoku.erase(row, column);
        stepRecorder.record(sudoku.puzzle, "erase", row, column, 0);
    };

    const toggleNoteMode = () => {
        if (isLocked()) return;
        inputMode.value = inputMode.value === InputMode.Note ? InputMode.Normal : InputMode.Note;
    };

    const toggleEraseMode = () => {
        if (isLocked()) return;
        inputMode.value = inputMode.value === InputMode.Erase ? InputMode.Normal : InputMode.Erase;
        if (inputMode.value === InputMode.Erase) {
            selectedCell.value = null;
            selectedDigit.value = null;
        }
    };

    const selectDigit = (digit: number) => {
        if (isLocked()) return;
        clearErrors();
        clearClueSelection();
        if (inputMode.value === InputMode.Erase) inputMode.value = InputMode.Normal;
        if (selectedCell.value) {
            const { row, column } = selectedCell.value;
            if (inputMode.value === InputMode.Note) {
                sudoku.toggleNote(row, column, digit);
                stepRecorder.record(sudoku.puzzle, "toggleNote", row, column, digit);
                return;
            }
            inputToCell(row, column, digit);
            selectedCell.value = null;
            return;
        }
        selectedDigit.value = selectedDigit.value === digit ? null : digit;
    };

    const undo = () => {
        if (isLocked()) return;
        sudoku.undo();
        stepRecorder.record(sudoku.puzzle, "undo", 0, 0, 0);
    };

    return {
        selectedCell,
        selectedDigit,
        inputMode,
        clickCell,
        longPressCell,
        selectDigit,
        toggleNoteMode,
        toggleEraseMode,
        isSelected,
        isPeerOfSelected,
        digitCounts,
        undo,
    };
};
