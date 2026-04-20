import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { Difficulty } from "@/domain";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { Sudoku } from "@/domain/game/Sudoku";
import { GameStateConverter, type GameState } from "@/application/GameState";
import { generatePuzzleAsync } from "@/application/PuzzleGenerationService";

export const useGameStore = defineStore("game", () => {
    const difficulty = ref<Difficulty | null>(null);
    const sudoku = shallowRef<Sudoku | null>(null);
    const elapsedSeconds = ref(0);
    const hasActiveGame = computed(() => sudoku.value !== null);

    const setDifficulty = (value: Difficulty) => {
        difficulty.value = value;
    };

    const startNewGame = async (newDifficulty: Difficulty) => {
        const { puzzle, answer } = await generatePuzzleAsync(newDifficulty);
        const puzzleCells = puzzle.map((row) => row.map((value) => new PuzzleCell(value)));
        sudoku.value = Sudoku.restoreSave(answer, puzzleCells);
        difficulty.value = newDifficulty;
        elapsedSeconds.value = 0;
    };

    const loadSavedGame = (state: GameState) => {
        sudoku.value = GameStateConverter.toSudoku(state);
        difficulty.value = state.difficulty;
        elapsedSeconds.value = state.elapsedSeconds;
    };

    return { difficulty, setDifficulty, sudoku, hasActiveGame, startNewGame, loadSavedGame, elapsedSeconds };
});
