import { computed, ref, type Ref } from "vue";
import { BOARD_SIZE } from "@/domain/board/constants";
import { ConflictDetector } from "@/domain/game/ConflictDetector";

interface CellPosition {
    row: number;
    column: number;
}

/** Entering a puzzle in the walkthrough: cell first or digit first, with erase, never breaking the rules. */
export const useWalkthroughInput = (userValues: Ref<number[][]>, boardEditable: Ref<boolean>) => {
    const selectedCell = ref<CellPosition | null>(null);
    const selectedDigit = ref<number | null>(null);
    const eraseMode = ref(false);

    const conflictDetector = new ConflictDetector();
    const conflictsWithPeers = (row: number, column: number, digit: number): boolean =>
        conflictDetector.findConflicts(userValues.value, row, column, digit).length > 0;

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
