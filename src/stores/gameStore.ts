import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { Difficulty } from "@/domain/SudokuGenerator";
import Sudoku from "@/domain/Sudoku";
import { GameStateConverter, type GameState } from "@/application/GameState";

export const useGameStore = defineStore("game", () => {
    const difficulty = ref<Difficulty | null>(null);
    const sudoku = shallowRef<Sudoku | null>(null);
    const elapsedSeconds = ref(0);
    const hasActiveGame = computed(() => sudoku.value !== null);

    function setDifficulty(value: Difficulty) {
        difficulty.value = value;
    }

    function startNewGame(diff: Difficulty) {
        const game = new Sudoku();
        game.generate(diff);
        sudoku.value = game;
        difficulty.value = diff;
        elapsedSeconds.value = 0;
    }

    function loadSavedGame(state: GameState) {
        sudoku.value = GameStateConverter.toSudoku(state);
        difficulty.value = state.difficulty;
        elapsedSeconds.value = state.elapsedSeconds;
    }

    return { difficulty, setDifficulty, sudoku, hasActiveGame, startNewGame, loadSavedGame, elapsedSeconds };
});
