import { type Ref, ref } from "vue";
import type { Difficulty } from "@/domain";
import type { Sudoku } from "@/domain/game/Sudoku";
import { deleteSavedGame } from "@/application/GameStorage";
import { recordGameResult, type GameReplayData } from "@/application/Statistics";

interface GameCompletionOptions {
    sudoku: Sudoku;
    difficulty: Ref<Difficulty>;
    getElapsedSeconds: () => number;
    getReplayData: () => GameReplayData;
    onCompleted: (origin: { row: number; column: number }) => void;
}

export const useGameCompletion = ({ sudoku, difficulty, getElapsedSeconds, getReplayData, onCompleted }: GameCompletionOptions) => {
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
        onCompleted(origin);
    };

    return { completed, checkAndComplete };
};
