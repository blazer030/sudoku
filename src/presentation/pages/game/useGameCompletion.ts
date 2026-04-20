import { type Ref, ref } from "vue";
import type { Difficulty } from "@/domain";
import type { Sudoku } from "@/domain/game/Sudoku";
import { deleteSavedGame } from "@/application/GameStorage";
import { recordGameResult, type GameReplayData } from "@/application/Statistics";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";

interface GameCompletionOptions {
    sudoku: Sudoku;
    difficulty: Ref<Difficulty>;
    getElapsedSeconds: () => number;
    getReplayData: () => GameReplayData;
    onCompleted: (origin: { row: number; column: number }) => void;
    analytics?: AnalyticsService;
}

export const useGameCompletion = ({ sudoku, difficulty, getElapsedSeconds, getReplayData, onCompleted, analytics }: GameCompletionOptions) => {
    const completed = ref(false);

    const checkAndComplete = (origin: { row: number; column: number }) => {
        if (!sudoku.isCompleted()) return;
        completed.value = true;
        deleteSavedGame();
        recordGameResult({
            difficulty: difficulty.value,
            elapsedSeconds: getElapsedSeconds(),
            completed: true,
            hintsUsed: sudoku.hintTracker.recordedUsed,
            replay: getReplayData(),
        });
        void analytics?.logEvent({
            name: "game_complete",
            difficulty: difficulty.value,
            time_seconds: getElapsedSeconds(),
            hints_used: sudoku.hintTracker.recordedUsed,
        });
        onCompleted(origin);
    };

    return { completed, checkAndComplete };
};
