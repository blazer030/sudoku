<template>
    <div class="flex flex-col h-full items-center pt-20 pb-15 px-6">
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

        <div class="flex flex-col gap-3 w-full">
            <ContinueButton @continue="continueGame" />

            <DifficultySwitcher v-model="difficulty" />

            <button
                class="flex items-center justify-center gap-2.5 h-14 w-full bg-card rounded-2xl shadow-card cursor-pointer transition-all duration-200 hover:bg-foreground/3 hover:shadow-card-lg"
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

        <div class="flex items-center justify-center gap-10">
            <button
                class="flex flex-col items-center gap-1 cursor-pointer"
                data-testid="settings-button"
                @click="goToSettings"
            >
                <Settings
                    :size="24"
                    class="text-foreground-muted"
                />
                <span class="text-foreground-muted text-[11px] font-medium">Settings</span>
            </button>
            <button
                class="flex flex-col items-center gap-1 cursor-pointer"
                data-testid="walkthrough-button"
                @click="goToWalkthrough"
            >
                <Wand2
                    :size="24"
                    class="text-foreground-muted"
                />
                <span class="text-foreground-muted text-[11px] font-medium">Walkthrough</span>
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

        <NewGameDialog />

        <PuzzleLoader :visible="puzzleLoader.visible.value" />
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ChartBar, Plus, Settings, Wand2 } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import type { Difficulty } from "@/domain";
import { useGameStore } from "@/stores/gameStore";
import { deleteSavedGame, hasSavedGame, loadGame } from "@/application/GameStorage";
import { recordGameResult } from "@/application/Statistics";

import ContinueButton from "@/presentation/components/continue-button/ContinueButton.vue";
import DifficultySwitcher from "@/presentation/components/difficulty-switcher/DifficultySwitcher.vue";
import NewGameDialog from "@/presentation/components/new-game-dialog/NewGameDialog.vue";
import { provideNewGameDialog } from "@/presentation/components/new-game-dialog/useNewGameDialog";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";
import { usePuzzleLoader } from "@/presentation/components/puzzle-loader/usePuzzleLoader";

const router = useRouter();
const gameStore = useGameStore();
const newGameDialog = provideNewGameDialog();
const puzzleLoader = usePuzzleLoader();

const difficulty = ref<Difficulty>("easy");

const handleNewGame = async () => {
    if (hasSavedGame()) {
        const result = await newGameDialog.open();
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
    await startGame();
};

const startGame = async () => {
    await puzzleLoader.runWithLoader(() => gameStore.startNewGame(difficulty.value));
    void router.push(ROUTER_PATH.game);
};

const goToSettings = () => {
    void router.push(ROUTER_PATH.settings);
};

const goToStatistics = () => {
    void router.push(ROUTER_PATH.statistics);
};

const goToWalkthrough = () => {
    void router.push(ROUTER_PATH.solverWalkthrough);
};

const continueGame = () => {
    const saved = loadGame();
    if (saved) {
        gameStore.loadSavedGame(saved);
    }
    void router.push(ROUTER_PATH.game);
};
</script>
