import { type Ref, ref } from "vue";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import type { Sudoku } from "@/domain/game/Sudoku";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";
import { summarizeReplay } from "@/application/analytics/summarizeReplay";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";

export interface CompletionOutcome {
    isNewRecord: boolean;
}

interface GameCompletionOptions {
    sudoku: Sudoku;
    difficulty: Ref<Difficulty>;
    getElapsedSeconds: () => number;
    getReplayData: () => GameReplayData;
    onCompleted: (outcome: CompletionOutcome) => void;
    analytics?: AnalyticsService;
}

export const useGameCompletion = ({ sudoku, difficulty, getElapsedSeconds, getReplayData, onCompleted, analytics }: GameCompletionOptions) => {
    const completed = ref(false);
    const statisticsStore = useStatisticsStore();
    const gameStore = useGameStore();

    const checkAndComplete = () => {
        if (!sudoku.isCompleted()) return;
        completed.value = true;
        // Compared before this game joins the history
        const isNewRecord = statisticsStore.isNewBestTime(difficulty.value, getElapsedSeconds());
        void gameStore.clearSavedGame();
        const replay = getReplayData();
        const replaySummary = summarizeReplay(replay, sudoku.answer);
        statisticsStore.recordGame({
            difficulty: difficulty.value,
            elapsedSeconds: getElapsedSeconds(),
            completed: true,
            hintsUsed: sudoku.hintTracker.recordedUsed,
            replay,
        });
        void analytics?.logEvent({
            name: "game_complete",
            difficulty: difficulty.value,
            time_seconds: getElapsedSeconds(),
            hints_used: sudoku.hintTracker.recordedUsed,
            hints_total: sudoku.hintTracker.totalUsed,
            ...(replaySummary && {
                undo_count: replaySummary.undoCount,
                wrong_entries: replaySummary.wrongEntries,
                used_notes: replaySummary.usedNotes,
            }),
        });
        onCompleted({ isNewRecord });
    };

    return { completed, checkAndComplete };
};
