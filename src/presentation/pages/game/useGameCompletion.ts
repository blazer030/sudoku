import { type Ref, ref } from "vue";
import type { Difficulty } from "@/domain";
import type Sudoku from "@/domain/game/Sudoku";
import { deleteSavedGame } from "@/application/GameStorage";
import { recordGameResult } from "@/application/Statistics";

interface GameCompletionOptions {
    sudoku: Sudoku;
    difficulty: Ref<Difficulty>;
    getElapsedSeconds: () => number;
    onCompleted: () => void;
}

export const useGameCompletion = ({ sudoku, difficulty, getElapsedSeconds, onCompleted }: GameCompletionOptions) => {
    const completed = ref(false);

    const checkAndComplete = () => {
        if (!sudoku.isCompleted()) return;
        completed.value = true;
        deleteSavedGame();
        recordGameResult({
            difficulty: difficulty.value,
            elapsedSeconds: getElapsedSeconds(),
            completed: true,
            hintsUsed: sudoku.hintTracker.recordedUsed,
        });
        onCompleted();
    };

    return { completed, checkAndComplete };
};
