<template>
    <div class="flex flex-col h-full justify-center items-center gap-4 px-12">
        <div class="mb-32 rounded-full bg-sky-200 p-4 text-white text-8xl">
            🧩
        </div>

        <div class="flex items-center gap-4">
            <button
                data-testid="difficulty-prev"
                class="text-gray-400 text-xl px-2"
                @click="prevDifficulty"
            >
                ◀
            </button>
            <span
                data-testid="difficulty-label"
                class="text-gray-500 text-lg w-20 text-center"
            >
                {{ difficultyLabel }}
            </span>
            <button
                data-testid="difficulty-next"
                class="text-gray-400 text-xl px-2"
                @click="nextDifficulty"
            >
                ▶
            </button>
        </div>

        <Button
            v-if="showContinue"
            data-testid="continue-button"
            variant="outline"
            class="rounded-full w-full text-gray-500"
            @click="continueGame"
        >
            Continue
        </Button>

        <Button
            data-testid="new-game-button"
            variant="outline"
            class="rounded-full w-full text-gray-500"
            @click="startGame"
        >
            New Game
        </Button>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import Button from "@/presentation/components/ui/button/Button.vue";
import { ROUTER_PATH } from "@/router";
import type { Difficulty } from "@/domain/SudokuGenerator";
import { useGameStore } from "@/stores/gameStore";
import { hasSavedGame, deleteSavedGame } from "@/application/GameStorage";

const router = useRouter();
const gameStore = useGameStore();

const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const labels: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const difficultyIndex = ref(0);

const difficultyLabel = computed(() => labels[difficulties[difficultyIndex.value]]);
const showContinue = hasSavedGame();

function nextDifficulty() {
    difficultyIndex.value = (difficultyIndex.value + 1) % difficulties.length;
}

function prevDifficulty() {
    difficultyIndex.value = (difficultyIndex.value - 1 + difficulties.length) % difficulties.length;
}

function startGame() {
    deleteSavedGame();
    gameStore.setDifficulty(difficulties[difficultyIndex.value]);
    void router.push(ROUTER_PATH.game);
}

function continueGame() {
    gameStore.continueGame = true;
    gameStore.setDifficulty(difficulties[difficultyIndex.value]);
    void router.push(ROUTER_PATH.game);
}
</script>
