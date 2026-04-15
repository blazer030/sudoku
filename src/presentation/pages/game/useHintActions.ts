import { ref } from "vue";
import type { Sudoku } from "@/domain/game/Sudoku";
import type { StepRecorder } from "@/domain/game/StepRecorder";
import { provideHintMenu } from "@/presentation/pages/game/components/useHintMenu";

interface HintActionsOptions {
    sudoku: Sudoku;
    stepRecorder: StepRecorder;
    onRevealComplete: (origin: { row: number; column: number }) => void;
    onGroupCompleted?: (cells: { row: number; column: number }[], origin: { row: number; column: number }) => void;
}

export const useHintActions = ({ sudoku, stepRecorder, onRevealComplete, onGroupCompleted }: HintActionsOptions) => {
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
            stepRecorder.record(sudoku.puzzle, "autoNotes", 0, 0, 0);
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
                const revealedValue = sudoku.puzzle[target.row][target.column].entry;
                stepRecorder.record(sudoku.puzzle, "hint", target.row, target.column, revealedValue);
            }
            if (target && !sudoku.isCompleted()) {
                const completed = sudoku.findCompletedGroups(target.row, target.column);
                if (completed.cells.length > 0) onGroupCompleted?.(completed.cells, target);
            }
            onRevealComplete(target ?? { row: 4, column: 4 });
            break;
        }
        }
    };

    return { errorCells, clearErrors, isError, openHintMenu };
};
