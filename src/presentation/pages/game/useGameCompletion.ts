import { type Ref, ref } from "vue";
import type { Difficulty } from "@/domain";
import type { Sudoku } from "@/domain/game/Sudoku";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";
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
    const statisticsStore = useStatisticsStore();
    const gameStore = useGameStore();

    const checkAndComplete = (origin: { row: number; column: number }) => {
        if (!sudoku.isCompleted()) return;
        completed.value = true;
        void gameStore.clearSavedGame();
        statisticsStore.recordGame({
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
