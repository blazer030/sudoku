import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { Difficulty } from "@/domain/SudokuGenerator";
import Sudoku from "@/domain/Sudoku";

export const useGameStore = defineStore("game", () => {
    const difficulty = ref<Difficulty | null>(null);
    const continueGame = ref(false);
    const sudoku = shallowRef<Sudoku | null>(null);
    const hasActiveGame = computed(() => sudoku.value !== null);

    function setDifficulty(value: Difficulty) {
        difficulty.value = value;
    }

    function startNewGame(diff: Difficulty) {
        const game = new Sudoku();
        game.generate(diff);
        sudoku.value = game;
        difficulty.value = diff;
    }

    return { difficulty, continueGame, setDifficulty, sudoku, hasActiveGame, startNewGame };
});
