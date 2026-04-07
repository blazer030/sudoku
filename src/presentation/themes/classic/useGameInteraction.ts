import { computed, ref } from "vue";
import { BOARD_SIZE } from "@/domain";
import type { Sudoku } from "@/domain";
import { InputMode } from "@/presentation/pages/game/InputMode";

interface GameInteractionOptions {
    sudoku: Sudoku;
    clearErrors: () => void;
    checkAndComplete: () => void;
    onGroupCompleted?: (cells: { row: number; column: number }[], origin: { row: number; column: number }) => void;
}

export const useGameInteraction = ({ sudoku, clearErrors, checkAndComplete, onGroupCompleted }: GameInteractionOptions) => {
    const selectedCell = ref<{ row: number; column: number } | null>(null);
    const selectedDigit = ref<number | null>(null);
    const inputMode = ref(InputMode.Normal);

    const clickCell = (row: number, column: number) => {
        clearErrors();
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

    const noteToCell = (row: number, column: number, value: number) => {
        sudoku.toggleNote(row, column, value);
    };

    const inputToCell = (row: number, column: number, value: number) => {
        if (sudoku.puzzle[row][column].isClue) return;
        if (sudoku.puzzle[row][column].entry === value) {
            sudoku.fill(row, column, 0);
            return;
        }
        sudoku.fill(row, column, value);
        const completed = sudoku.findCompletedGroups(row, column);
        if (completed.cells.length > 0) onGroupCompleted?.(completed.cells, { row, column });
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

    const isSelected = (row: number, column: number) => {
        if (selectedCell.value === null) return false;
        if (selectedCell.value.row !== row) return false;
        return selectedCell.value.column === column;
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
    };

    const toggleNoteMode = () => {
        inputMode.value = inputMode.value === InputMode.Note ? InputMode.Normal : InputMode.Note;
    };

    const toggleEraseMode = () => {
        inputMode.value = inputMode.value === InputMode.Erase ? InputMode.Normal : InputMode.Erase;
        if (inputMode.value === InputMode.Erase) {
            selectedCell.value = null;
            selectedDigit.value = null;
        }
    };

    const selectDigit = (digit: number) => {
        clearErrors();
        if (inputMode.value === InputMode.Erase) inputMode.value = InputMode.Normal;
        if (selectedCell.value) {
            const { row, column } = selectedCell.value;
            if (inputMode.value === InputMode.Note) {
                sudoku.toggleNote(row, column, digit);
                return;
            }
            inputToCell(row, column, digit);
            selectedCell.value = null;
            return;
        }
        selectedDigit.value = selectedDigit.value === digit ? null : digit;
    };

    return {
        selectedCell,
        selectedDigit,
        inputMode,
        clickCell,
        selectDigit,
        toggleNoteMode,
        toggleEraseMode,
        isSelected,
        digitCounts,
    };
};
