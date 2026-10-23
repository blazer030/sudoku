import { type Ref, onScopeDispose, ref } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import type { Sudoku } from "@/domain/game/Sudoku";
import { GameStateConverter } from "@/application/game/GameState";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";
import { provideLeaveDialog } from "@/presentation/pages/game/components/useLeaveDialog";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";
import { computeAbandonProgress } from "@/application/analytics/computeAbandonProgress";

interface LeaveGameOptions {
    sudoku: Sudoku;
    difficulty: Ref<Difficulty>;
    completed: Ref<boolean>;
    getElapsedSeconds: () => number;
    getReplayData: () => GameReplayData;
    analytics?: AnalyticsService;
    /** Runs once leaving is confirmed, before the game is saved or given up. */
    onLeave?: () => void;
    /** Closes the topmost other overlay (hint menu, hint panel); returns whether one was open. */
    dismissOverlay?: () => boolean;
}

export const useLeaveGame = ({ sudoku, difficulty, completed, getElapsedSeconds, getReplayData, analytics, onLeave, dismissOverlay }: LeaveGameOptions) => {
    const router = useRouter();
    const leaveDialog = provideLeaveDialog();
    const leavingConfirmed = ref(false);
    const statisticsStore = useStatisticsStore();
    const gameStore = useGameStore();

    const saveGame = () => {
        gameStore.persistGame(GameStateConverter.fromSudoku(sudoku.raw(), {
            difficulty: difficulty.value,
            elapsedSeconds: getElapsedSeconds(),
            completed: completed.value,
            replay: getReplayData(),
        }));
    };

    const showLeaveDialog = async () => {
        const result = await leaveDialog.open();
        if (result === "save" || result === "giveUp") onLeave?.();
        if (result === "save") {
            saveGame();
            leavingConfirmed.value = true;
            router.back();
        } else if (result === "giveUp") {
            const { progressPct, correctPct, incorrectPct } = computeAbandonProgress(sudoku.puzzle, sudoku.answer);
            void analytics?.logEvent({
                name: "game_abandon",
                difficulty: difficulty.value,
                progress_pct: progressPct,
                correct_pct: correctPct,
                incorrect_pct: incorrectPct,
            });
            statisticsStore.recordGame({
                difficulty: difficulty.value,
                elapsedSeconds: getElapsedSeconds(),
                completed: false,
                hintsUsed: sudoku.hintTracker.recordedUsed,
                replay: getReplayData(),
            });
            void gameStore.clearSavedGame();
            leavingConfirmed.value = true;
            router.back();
        }
    };

    // The app may be killed while it is in the background (a swipe from recents, the system reclaiming
    // memory, a closed tab), so a game in progress is saved whenever the page is hidden. A hint in
    // progress leaves the board as it was, so the save is whole; the hint itself is not kept.
    const saveWhenHidden = () => {
        if (document.visibilityState !== "hidden" || completed.value || leavingConfirmed.value) return;
        saveGame();
    };
    document.addEventListener("visibilitychange", saveWhenHidden);
    onScopeDispose(() => {
        document.removeEventListener("visibilitychange", saveWhenHidden);
    });

    onBeforeRouteLeave(() => {
        if (completed.value || leavingConfirmed.value) return true;
        // Back closes the topmost overlay first; only a bare game screen asks to leave.
        if (leaveDialog.visible.value) {
            leaveDialog.close("cancel");
            return false;
        }
        if (dismissOverlay?.()) return false;
        void showLeaveDialog();
        return false;
    });

    return { leaveDialog, showLeaveDialog };
};
