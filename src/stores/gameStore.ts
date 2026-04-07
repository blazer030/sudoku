import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { Difficulty } from "@/domain";
import { Sudoku } from "@/domain/game/Sudoku";
import { GameStateConverter, type GameState } from "@/application/GameState";

export const useGameStore = defineStore("game", () => {
    const difficulty = ref<Difficulty | null>(null);
    const sudoku = shallowRef<Sudoku | null>(null);
    const elapsedSeconds = ref(0);
    const hasActiveGame = computed(() => sudoku.value !== null);

    const setDifficulty = (value: Difficulty) => {
        difficulty.value = value;
    };

    const startNewGame = (newDifficulty: Difficulty) => {
        const game = new Sudoku();
        game.generate(newDifficulty);
        sudoku.value = game;
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
