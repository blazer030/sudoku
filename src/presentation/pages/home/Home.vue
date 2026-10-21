<template>
    <div class="flex flex-col h-full items-center pt-20 pb-15 px-6">
        <div class="flex flex-col items-center gap-2">
            <div
                class="w-20 h-20 bg-primary rounded-popup flex items-center justify-center shadow-primary-lg"
            >
                <div class="grid grid-cols-3 gap-1 w-12 h-12">
                    <div class="rounded-sm bg-on-primary/40" />
                    <div class="rounded-sm bg-on-primary" />
                    <div class="rounded-sm bg-on-primary/40" />
                    <div class="rounded-sm bg-on-primary" />
                    <div class="rounded-sm bg-on-primary/40" />
                    <div class="rounded-sm bg-on-primary" />
                    <div class="rounded-sm bg-on-primary/40" />
                    <div class="rounded-sm bg-on-primary" />
                    <div class="rounded-sm bg-on-primary/40" />
                </div>
            </div>
            <h1 class="text-foreground text-4xl font-bold tracking-[-1px]">
                {{ t("home.title") }}
            </h1>
            <p class="text-foreground-secondary text-sm">
                {{ t("home.subtitle") }}
            </p>
        </div>

        <div class="flex-1" />

        <div class="flex flex-col gap-3 w-full">
            <ContinueButton @continue="continueGame" />

            <DifficultySwitcher v-model="difficulty" />

            <button
                v-press
                class="flex items-center justify-center gap-2.5 h-14 w-full bg-card rounded-2xl shadow-card cursor-pointer transition-all duration-200 hover:bg-foreground/3 hover:shadow-card-lg"
                data-testid="new-game-button"
                @click="handleNewGame"
            >
                <Plus
                    :size="20"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-semibold">{{ t("home.newGame") }}</span>
            </button>
        </div>

        <div class="flex-1" />

        <div class="flex items-center justify-center gap-10">
            <button
                v-press
                class="flex flex-col items-center gap-1 cursor-pointer"
                data-testid="settings-button"
                @click="goToSettings"
            >
                <Settings
                    :size="24"
                    class="text-foreground-muted"
                />
                <span class="text-foreground-muted text-[11px] font-medium">{{ t("settings.title") }}</span>
            </button>
            <button
                v-press
                class="flex flex-col items-center gap-1 cursor-pointer"
                data-testid="walkthrough-button"
                @click="goToWalkthrough"
            >
                <Wand2
                    :size="24"
                    class="text-foreground-muted"
                />
                <span class="text-foreground-muted text-[11px] font-medium">{{ t("home.walkthrough") }}</span>
            </button>
            <button
                v-press
                class="flex flex-col items-center gap-1 cursor-pointer"
                data-testid="statistics-button"
                @click="goToStatistics"
            >
                <ChartBar
                    :size="24"
                    class="text-foreground-muted"
                />
                <span class="text-foreground-muted text-[11px] font-medium">{{ t("home.statistics") }}</span>
            </button>
        </div>

        <NewGameDialog />

        <PuzzleLoader :visible="puzzleLoader.visible.value" />
    </div>
</template>

<script lang="ts" setup>
import { inject, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ChartBar, Plus, Settings, Wand2 } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import type { Difficulty } from "@/domain";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";
import { computeAbandonProgress } from "@/application/analytics/computeAbandonProgress";

import ContinueButton from "@/presentation/components/continue-button/ContinueButton.vue";
import DifficultySwitcher from "@/presentation/components/difficulty-switcher/DifficultySwitcher.vue";
import NewGameDialog from "@/presentation/components/new-game-dialog/NewGameDialog.vue";
import { provideNewGameDialog } from "@/presentation/components/new-game-dialog/useNewGameDialog";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";
import { usePuzzleLoader } from "@/presentation/components/puzzle-loader/usePuzzleLoader";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();
const router = useRouter();
const gameStore = useGameStore();
const statisticsStore = useStatisticsStore();
const newGameDialog = provideNewGameDialog();
const puzzleLoader = usePuzzleLoader();
const analytics = inject(ANALYTICS_KEY);

const difficulty = ref<Difficulty>("easy");

const handleNewGame = async () => {
    if (gameStore.savedGame !== null) {
        const unfinished = gameStore.savedGame;
        const result = await newGameDialog.open({ difficulty: unfinished.difficulty, elapsedSeconds: unfinished.elapsedSeconds });
        if (result === "continue") {
            continueGame();
            return;
        }
        const saved = gameStore.savedGame;
        const { progressPct, correctPct, incorrectPct } = computeAbandonProgress(saved.cells, saved.answer);
        void analytics?.logEvent({
            name: "game_abandon",
            difficulty: saved.difficulty,
            progress_pct: progressPct,
            correct_pct: correctPct,
            incorrect_pct: incorrectPct,
        });
        statisticsStore.recordGame({
            difficulty: saved.difficulty,
            elapsedSeconds: saved.elapsedSeconds,
            completed: false,
            replay: saved.replay,
        });
        await gameStore.clearSavedGame();
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
    const saved = gameStore.savedGame;
    if (saved) {
        gameStore.loadSavedGame(saved);
    }
    void router.push(ROUTER_PATH.game);
};
</script>
