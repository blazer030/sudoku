import { computed, ref } from "vue";
import type { CompletedCells, Sudoku } from "@/domain/game/Sudoku";
import type { StepRecorder } from "@/domain/game/StepRecorder";
import { InputMode } from "@/presentation/pages/game/InputMode";
import { NO_DIGITS_USED_UP, isDigitUsedUp } from "@/presentation/components/digit-pad/digitKeys";
import type { CellReference } from "@/domain/board/CellReference";
import { arePeers, sameCell } from "@/domain/solver/cellRelations";

interface GameInteractionOptions {
    sudoku: Sudoku;
    stepRecorder: StepRecorder;
    clearErrors: () => void;
    checkAndComplete: () => void;
    onGroupCompleted?: (completed: CompletedCells, origin: CellReference) => void;
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
    const selectedCell = ref<CellReference | null>(null);
    const selectedDigit = ref<number | null>(null);
    const inputMode = ref(InputMode.Normal);

    const clickCell = (row: number, column: number) => {
        if (isLocked()) return;
        clearErrors();
        if (sudoku.puzzle[row][column].isClue) {
            selectClue(row, column);
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

    // A tapped clue is only looked at: it takes the selection outline, drops any picked digit or Erase mode,
    // and never becomes an input target.
    const selectClue = (row: number, column: number) => {
        if (inputMode.value === InputMode.Erase) inputMode.value = InputMode.Normal;
        selectedDigit.value = null;
        selectedCell.value = isSelected(row, column) ? null : { row, column };
    };

    const clearClueSelection = () => {
        if (selectedCell.value === null) return;
        if (sudoku.puzzle[selectedCell.value.row][selectedCell.value.column].isClue) selectedCell.value = null;
    };

    const noteToCell = (row: number, column: number, value: number) => {
        // Notes do not apply to a clue or an entry: nothing changes, so no step is recorded
        const cell = sudoku.puzzle[row][column];
        if (cell.isClue || cell.hasEntry) return;
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
            if (completed.cells.length > 0) onGroupCompleted?.(completed, { row, column });
        }
        checkAndComplete();
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

    // The digit whose matching cells light up: the picked digit, else the value of the selected cell.
    const highlightedDigit = computed(() => {
        if (selectedDigit.value !== null) return selectedDigit.value;
        if (selectedCell.value === null) return null;
        const cell = sudoku.puzzle[selectedCell.value.row][selectedCell.value.column];
        const value = cell.isClue ? cell.clue : cell.entry;
        return value > 0 ? value : null;
    });

    const isSelected = (row: number, column: number): boolean =>
        selectedCell.value !== null && sameCell(selectedCell.value, { row, column });

    const isPeerOfSelected = (row: number, column: number): boolean =>
        selectedCell.value !== null && arePeers(selectedCell.value, { row, column });

    const digitCounts = computed(() => {
        const counts = [...NO_DIGITS_USED_UP];
        for (const row of sudoku.puzzle) {
            for (const cell of row) {
                const value = cell.isClue ? cell.clue : cell.entry;
                if (value > 0) counts[value]++;
            }
        }
        return counts;
    });

    const isDigitCompleted = (digit: number): boolean => isDigitUsedUp(digitCounts.value, digit);

    // A selected cell with nothing on it (empty, or a clue) has nothing for Erase to clear
    const eraseDisabled = computed((): boolean => {
        if (selectedCell.value === null) return false;
        const cell = sudoku.puzzle[selectedCell.value.row][selectedCell.value.column];
        return cell.isClue || (!cell.hasEntry && cell.notes.length === 0);
    });

    const eraseCell = (row: number, column: number) => {
        sudoku.erase(row, column);
        stepRecorder.record(sudoku.puzzle, "erase", row, column, 0);
    };

    const toggleNoteMode = () => {
        if (isLocked()) return;
        inputMode.value = inputMode.value === InputMode.Note ? InputMode.Normal : InputMode.Note;
    };

    // Cell first, Erase clears the selected cell at once, the same as a digit fills it; with no cell
    // selected it switches Erase mode for tapping cells next
    const toggleEraseMode = () => {
        if (isLocked()) return;
        if (selectedCell.value !== null) {
            const { row, column } = selectedCell.value;
            if (!eraseDisabled.value) eraseCell(row, column);
            selectedCell.value = null;
            return;
        }
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
                noteToCell(row, column, digit);
                return;
            }
            inputToCell(row, column, digit);
            selectedCell.value = null;
            return;
        }
        selectedDigit.value = selectedDigit.value === digit ? null : digit;
    };

    const clearSelection = () => {
        selectedCell.value = null;
    };

    // A picked digit goes once the board holds all nine of it, however they got there
    const releaseCompletedDigit = () => {
        if (selectedDigit.value !== null && isDigitCompleted(selectedDigit.value)) selectedDigit.value = null;
    };

    const undo = () => {
        if (isLocked()) return;
        sudoku.undo();
        stepRecorder.record(sudoku.puzzle, "undo", 0, 0, 0);
    };

    return {
        selectedCell,
        selectedDigit,
        highlightedDigit,
        inputMode,
        clickCell,
        longPressCell,
        selectDigit,
        toggleNoteMode,
        toggleEraseMode,
        eraseDisabled,
        isSelected,
        isPeerOfSelected,
        digitCounts,
        clearSelection,
        releaseCompletedDigit,
        undo,
    };
};
