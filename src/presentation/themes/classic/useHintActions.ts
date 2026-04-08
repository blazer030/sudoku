import { ref } from "vue";
import type { Sudoku } from "@/domain/game/Sudoku";
import { provideHintMenu } from "@/presentation/themes/classic/components/useHintMenu";

interface HintActionsOptions {
    sudoku: Sudoku;
    onRevealComplete: () => void;
    onGroupCompleted?: (cells: { row: number; column: number }[], origin: { row: number; column: number }) => void;
}

export const useHintActions = ({ sudoku, onRevealComplete, onGroupCompleted }: HintActionsOptions) => {
    const hintMenu = provideHintMenu();
    const errorCells = ref<{ row: number; column: number }[]>([]);

    const clearErrors = () => {
        errorCells.value = [];
    };

    const isError = (row: number, column: number): boolean =>
        errorCells.value.some(cell => cell.row === row && cell.column === column);

    const openHintMenu = async () => {
        const action = await hintMenu.open({
            recordedUsed: sudoku.hintTracker.recordedUsed,
            canUseHint: sudoku.hintTracker.canUseHint,
        });
        if (action === "close") return;
        sudoku.hintTracker.useHint();
        switch (action) {
        case "autoNotes":
            sudoku.autoNotes();
            break;
        case "checkConflicts":
            errorCells.value = sudoku.checkAllConflicts();
            break;
        case "checkErrors":
            errorCells.value = sudoku.checkErrors();
            break;
        case "revealCell": {
            const target = sudoku.revealRandomCell();
            if (target) {
                const completed = sudoku.findCompletedGroups(target.row, target.column);
                if (completed.cells.length > 0) onGroupCompleted?.(completed.cells, target);
            }
            onRevealComplete();
            break;
        }
        }
    };

    return { errorCells, clearErrors, isError, openHintMenu };
};
