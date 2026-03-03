<template>
    <div class="flex flex-col h-full items-center pt-20 pb-15 px-6">
        <!-- Logo -->
        <div class="flex flex-col items-center gap-2">
            <div
                class="w-20 h-20 bg-primary rounded-[20px] flex items-center justify-center shadow-[0_4px_16px_#3D8A5A30]"
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
            <button
                v-if="showContinue"
                class="flex items-center justify-center gap-2.5 h-14 w-full bg-primary rounded-2xl text-white shadow-[0_4px_12px_#3D8A5A30] cursor-pointer"
                data-testid="continue-button"
                @click="continueGame"
            >
                <Play :size="20" />
                <span class="text-base font-semibold">Continue Game</span>
                <span class="bg-white/20 rounded-full px-2.5 py-1 text-xs font-medium">
                    {{ savedTimeLabel }}
                </span>
            </button>

            <!-- Difficulty Switcher -->
            <div
                class="flex h-12 w-full bg-card rounded-[14px] shadow-[0_2px_8px_#1A191808] p-1"
                data-testid="difficulty-switcher"
            >
                <button
                    v-for="(difficulty, index) in difficulties"
                    :key="difficulty"
                    :class="difficultyIndex === index
                        ? 'bg-primary text-white font-semibold shadow-[0_2px_6px_#3D8A5A30]'
                        : 'text-foreground-secondary font-medium'"
                    :data-testid="`difficulty-${difficulty}`"
                    class="flex-1 h-full rounded-[10px] flex items-center justify-center text-sm transition-all cursor-pointer"
                    @click="difficultyIndex = index"
                >
                    {{ labels[difficulty] }}
                </button>
            </div>

            <!-- New Game -->
            <button
                class="flex items-center justify-center gap-2.5 h-14 w-full bg-card rounded-2xl shadow-[0_2px_8px_#1A191808] cursor-pointer"
                data-testid="new-game-button"
                @click="startGame"
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
            <button class="flex flex-col items-center gap-1 cursor-pointer">
                <ChartBar
                    :size="24"
                    class="text-foreground-muted"
                />
                <span class="text-foreground-muted text-[11px] font-medium">Statistics</span>
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ChartBar, Play, Plus, Settings } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import type { Difficulty } from "@/domain/SudokuGenerator";
import { useGameStore } from "@/stores/gameStore";
import { deleteSavedGame, hasSavedGame, loadGame } from "@/application/GameStorage";

const router = useRouter();
const gameStore = useGameStore();

const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const labels: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const difficultyIndex = ref(0);

const showContinue = hasSavedGame();
const savedTimeLabel = (() => {
    if (!showContinue) return "";
    const saved = loadGame();
    if (!saved) return "00:00";
    const mins = Math.floor(saved.elapsedSeconds / 60);
    const secs = saved.elapsedSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
})();

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
