import { type Ref, ref } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import type { Difficulty } from "@/domain";
import type { Sudoku } from "@/domain/game/Sudoku";
import { deleteSavedGame, saveGame } from "@/application/GameStorage";
import { GameStateConverter } from "@/application/GameState";
import { recordGameResult } from "@/application/Statistics";
import { provideLeaveDialog } from "@/presentation/themes/classic/components/useLeaveDialog";

interface LeaveGameOptions {
    sudoku: Sudoku;
    difficulty: Ref<Difficulty>;
    completed: Ref<boolean>;
    getElapsedSeconds: () => number;
}

export const useLeaveGame = ({ sudoku, difficulty, completed, getElapsedSeconds }: LeaveGameOptions) => {
    const router = useRouter();
    const leaveDialog = provideLeaveDialog();
    const leavingConfirmed = ref(false);

    const showLeaveDialog = async () => {
        const result = await leaveDialog.open(undefined);
        if (result === "save") {
            const state = GameStateConverter.fromSudoku(sudoku.raw(), {
                difficulty: difficulty.value,
                elapsedSeconds: getElapsedSeconds(),
                completed: completed.value,
            });
            saveGame(state);
            leavingConfirmed.value = true;
            router.back();
        } else if (result === "giveUp") {
            recordGameResult({
                difficulty: difficulty.value,
                elapsedSeconds: getElapsedSeconds(),
                completed: false,
                hintsUsed: sudoku.hintTracker.recordedUsed,
            });
            deleteSavedGame();
            leavingConfirmed.value = true;
            router.back();
        }
    };

    onBeforeRouteLeave(() => {
        if (completed.value || leavingConfirmed.value) return true;
        void showLeaveDialog();
        return false;
    });

    return { leaveDialog, showLeaveDialog };
};
