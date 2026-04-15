import { type Ref, ref } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import type { Difficulty } from "@/domain";
import type { Sudoku } from "@/domain/game/Sudoku";
import { deleteSavedGame, saveGame } from "@/application/GameStorage";
import { GameStateConverter } from "@/application/GameState";
import { recordGameResult, type GameReplayData } from "@/application/Statistics";
import { provideLeaveDialog } from "./components/useLeaveDialog";

interface LeaveGameOptions {
    sudoku: Sudoku;
    difficulty: Ref<Difficulty>;
    completed: Ref<boolean>;
    getElapsedSeconds: () => number;
    getReplayData: () => GameReplayData;
}

export const useLeaveGame = ({ sudoku, difficulty, completed, getElapsedSeconds, getReplayData }: LeaveGameOptions) => {
    const router = useRouter();
    const leaveDialog = provideLeaveDialog();
    const leavingConfirmed = ref(false);

    const showLeaveDialog = async () => {
        const result = await leaveDialog.open();
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
                replay: getReplayData(),
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
