import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { Difficulty } from "@/domain/SudokuGenerator";
import type { Sudoku } from "@/domain/Sudoku";

export const useGameStore = defineStore("game", () => {
    const difficulty = ref<Difficulty | null>(null);
    const continueGame = ref(false);
    const sudoku = shallowRef<Sudoku | null>(null);
    const hasActiveGame = computed(() => sudoku.value !== null);

    function setDifficulty(value: Difficulty) {
        difficulty.value = value;
    }

    return { difficulty, continueGame, setDifficulty, sudoku, hasActiveGame };
});
