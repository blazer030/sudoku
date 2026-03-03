import { defineStore } from "pinia";
import { ref } from "vue";
import type { Difficulty } from "@/domain/SudokuGenerator";

export const useGameStore = defineStore("game", () => {
    const difficulty = ref<Difficulty | null>(null);
    const continueGame = ref(false);

    function setDifficulty(value: Difficulty) {
        difficulty.value = value;
    }

    return { difficulty, continueGame, setDifficulty };
});
