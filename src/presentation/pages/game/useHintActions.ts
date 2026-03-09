import { ref } from "vue";
import type Sudoku from "@/domain/Sudoku";
import { provideHintMenu } from "@/presentation/components/hint-menu-popup/useHintMenu";

interface HintActionsOptions {
    sudoku: Sudoku;
    onRevealComplete: () => void;
}

export const useHintActions = ({ sudoku, onRevealComplete }: HintActionsOptions) => {
    const hintMenu = provideHintMenu();
    const errorCells = ref<{ row: number; column: number }[]>([]);

    const clearErrors = () => {
        errorCells.value = [];
    };

    const isError = (row: number, column: number): boolean =>
        errorCells.value.some(c => c.row === row && c.column === column);

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
        case "revealCell":
            sudoku.revealRandomCell();
            onRevealComplete();
            break;
        }
    };

    return { errorCells, clearErrors, isError, openHintMenu };
};
