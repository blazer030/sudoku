<template>
    <div class="flex flex-col h-full items-center pt-20 pb-15 px-6">
        <!-- Logo -->
        <div class="flex flex-col items-center gap-2">
            <div
                class="w-20 h-20 bg-primary rounded-popup flex items-center justify-center shadow-primary-lg"
            >
                <div class="grid grid-cols-3 gap-1 w-12 h-12">
                    <div class="rounded-sm bg-white/40" />
                    <div class="rounded-sm bg-white" />
                    <div class="rounded-sm bg-white/40" />
                    <div class="rounded-sm bg-white" />
                    <div class="rounded-sm bg-white/40" />
                    <div class="rounded-sm bg-white" />
                    <div class="rounded-sm bg-white/40" />
                    <div class="rounded-sm bg-white" />
                    <div class="rounded-sm bg-white/40" />
                </div>
            </div>
            <h1 class="text-foreground text-4xl font-bold tracking-[-1px]">
                Sudoku
            </h1>
            <p class="text-foreground-secondary text-sm">
                Train your brain
            </p>
        </div>

        <div class="flex-1" />

        <!-- Menu -->
        <div class="flex flex-col gap-3 w-full">
            <!-- Continue Game -->
            <ContinueButton @continue="continueGame" />

            <!-- Difficulty Switcher -->
            <DifficultySwitcher v-model="difficulty" />

            <!-- New Game -->
            <button
                class="flex items-center justify-center gap-2.5 h-14 w-full bg-card rounded-2xl shadow-card cursor-pointer"
                data-testid="new-game-button"
                @click="handleNewGame"
            >
                <Plus
                    :size="20"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-semibold">New Game</span>
            </button>
        </div>

        <div class="flex-1" />

        <!-- Bottom Nav -->
        <div class="flex items-center justify-center gap-10">
            <button class="flex flex-col items-center gap-1 cursor-pointer">
                <Settings
                    :size="24"
                    class="text-foreground-muted"
                />
                <span class="text-foreground-muted text-[11px] font-medium">Settings</span>
            </button>
            <button
                class="flex flex-col items-center gap-1 cursor-pointer"
                data-testid="statistics-button"
                @click="goToStatistics"
            >
                <ChartBar
                    :size="24"
                    class="text-foreground-muted"
                />
                <span class="text-foreground-muted text-[11px] font-medium">Statistics</span>
            </button>
        </div>

        <!-- New Game Confirm Dialog -->
        <NewGameDialog />
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ChartBar, Plus, Settings } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import type { Difficulty } from "@/domain";
import { useGameStore } from "@/stores/gameStore";
import { deleteSavedGame, hasSavedGame, loadGame } from "@/application/GameStorage";
import { recordGameResult } from "@/application/Statistics";
import ContinueButton from "@/presentation/components/continue-button/ContinueButton.vue";
import DifficultySwitcher from "@/presentation/components/difficulty-switcher/DifficultySwitcher.vue";
import NewGameDialog from "@/presentation/components/new-game-dialog/NewGameDialog.vue";
import { provideNewGameDialog } from "@/presentation/components/new-game-dialog/useNewGameDialog";

const router = useRouter();
const gameStore = useGameStore();
const newGameDialog = provideNewGameDialog();

const difficulty = ref<Difficulty>("easy");

const handleNewGame = async () => {
    if (hasSavedGame()) {
        const result = await newGameDialog.open(undefined);
        if (result === "cancel") return;
        const saved = loadGame();
        if (saved) {
            recordGameResult({
                difficulty: saved.difficulty,
                elapsedSeconds: saved.elapsedSeconds,
                completed: false,
            });
        }
        deleteSavedGame();
    }
    startGame();
};

const startGame = () => {
    gameStore.startNewGame(difficulty.value);
    void router.push(ROUTER_PATH.game);
};

const goToStatistics = () => {
    void router.push(ROUTER_PATH.statistics);
};

const continueGame = () => {
    const saved = loadGame();
    if (saved) {
        gameStore.loadSavedGame(saved);
    }
    void router.push(ROUTER_PATH.game);
};
</script>
