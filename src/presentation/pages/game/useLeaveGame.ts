import { type Ref, ref } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import type { Difficulty } from "@/domain";
import type { Sudoku } from "@/domain/game/Sudoku";
import { deleteSavedGame, saveGame } from "@/application/GameStorage";
import { GameStateConverter } from "@/application/GameState";
import { recordGameResult, type GameReplayData } from "@/application/Statistics";
import { provideLeaveDialog } from "@/presentation/pages/game/components/useLeaveDialog";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";

interface LeaveGameOptions {
    sudoku: Sudoku;
    difficulty: Ref<Difficulty>;
    completed: Ref<boolean>;
    getElapsedSeconds: () => number;
    getReplayData: () => GameReplayData;
    analytics?: AnalyticsService;
}

const TOTAL_CELLS = 81;

const computeProgressPct = (sudoku: Sudoku): number => {
    let filled = 0;
    for (const row of sudoku.puzzle) {
        for (const cell of row) {
            if (cell.isClue || cell.hasEntry) filled += 1;
        }
    }
    return Math.round((filled / TOTAL_CELLS) * 100);
};

export const useLeaveGame = ({ sudoku, difficulty, completed, getElapsedSeconds, getReplayData, analytics }: LeaveGameOptions) => {
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
            void analytics?.logEvent({
                name: "game_abandon",
                difficulty: difficulty.value,
                progress_pct: computeProgressPct(sudoku),
            });
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
