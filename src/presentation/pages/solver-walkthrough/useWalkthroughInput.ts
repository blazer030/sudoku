import { computed, ref, type Ref } from "vue";
import { BOARD_SIZE } from "@/domain/board/constants";

interface CellPosition {
    row: number;
    column: number;
}

/** Entering a puzzle in the walkthrough: cell first or digit first, with erase, never breaking the rules. */
export const useWalkthroughInput = (userValues: Ref<number[][]>, boardEditable: Ref<boolean>) => {
    const selectedCell = ref<CellPosition | null>(null);
    const selectedDigit = ref<number | null>(null);
    const eraseMode = ref(false);

    const conflictsWithPeers = (row: number, column: number, digit: number): boolean => {
        for (let otherColumn = 0; otherColumn < BOARD_SIZE; otherColumn++) {
            if (otherColumn === column) continue;
            if (userValues.value[row][otherColumn] === digit) return true;
        }
        for (let otherRow = 0; otherRow < BOARD_SIZE; otherRow++) {
            if (otherRow === row) continue;
            if (userValues.value[otherRow][column] === digit) return true;
        }
        const boxStartRow = Math.floor(row / 3) * 3;
        const boxStartColumn = Math.floor(column / 3) * 3;
        for (let boxRow = boxStartRow; boxRow < boxStartRow + 3; boxRow++) {
            for (let boxColumn = boxStartColumn; boxColumn < boxStartColumn + 3; boxColumn++) {
                if (boxRow === row && boxColumn === column) continue;
                if (userValues.value[boxRow][boxColumn] === digit) return true;
            }
        }
        return false;
    };

    const eraseDisabledForSelectedCell = computed((): boolean => {
        if (selectedCell.value === null) return false;
        const { row, column } = selectedCell.value;
        return userValues.value[row][column] === 0;
    });

    const invalidDigitsForSelectedCell = computed((): number[] => {
        if (selectedCell.value === null) return [];
        const { row, column } = selectedCell.value;
        const currentValue = userValues.value[row][column];
        const invalid: number[] = [];
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            if (digit === currentValue) invalid.push(digit);
            else if (conflictsWithPeers(row, column, digit)) invalid.push(digit);
        }
        return invalid;
    });

    const clearSelection = () => {
        selectedCell.value = null;
        selectedDigit.value = null;
        eraseMode.value = false;
    };

    const toggleEraseMode = () => {
        if (selectedCell.value !== null) {
            const { row, column } = selectedCell.value;
            userValues.value[row][column] = 0;
            selectedCell.value = null;
            return;
        }
        if (!eraseMode.value) {
            selectedDigit.value = null;
        }
        eraseMode.value = !eraseMode.value;
    };

    const tryFillCell = (row: number, column: number, digit: number) => {
        if (!conflictsWithPeers(row, column, digit)) {
            userValues.value[row][column] = digit;
        }
    };

    const isSelectedCell = (row: number, column: number): boolean => {
        const selected = selectedCell.value;
        return selected !== null && selected.row === row && selected.column === column;
    };

    const selectCell = (row: number, column: number) => {
        if (!boardEditable.value) return;
        if (eraseMode.value) {
            userValues.value[row][column] = 0;
            return;
        }
        if (selectedDigit.value !== null) {
            tryFillCell(row, column, selectedDigit.value);
            return;
        }
        if (isSelectedCell(row, column)) {
            selectedCell.value = null;
            return;
        }
        selectedCell.value = { row, column };
    };

    const pickDigit = (digit: number) => {
        eraseMode.value = false;
        if (selectedCell.value !== null) {
            const { row, column } = selectedCell.value;
            tryFillCell(row, column, digit);
            selectedCell.value = null;
            return;
        }
        selectedDigit.value = selectedDigit.value === digit ? null : digit;
    };

    return {
        selectedCell,
        selectedDigit,
        eraseMode,
        eraseDisabledForSelectedCell,
        invalidDigitsForSelectedCell,
        clearSelection,
        toggleEraseMode,
        isSelectedCell,
        selectCell,
        pickDigit,
    };
};
