<template>
    <div
        class="flex flex-col min-h-full items-center pt-20 pb-15 px-6"
        data-skin="page-ruled"
    >
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
            <h1
                class="text-foreground text-4xl font-bold tracking-[-1px]"
                data-skin="title"
            >
                <!-- One span per plate; the heading's text is unchanged, so it reads as before -->
                <span
                    v-for="(glyph, glyphIndex) in titleGlyphs(t('home.title'))"
                    :key="glyphIndex"
                    data-skin="title-glyph"
                    data-testid="home-title-glyph"
                >{{ glyph }}</span>
            </h1>
            <p class="text-foreground-secondary text-sm">
                {{ t("home.subtitle") }}
            </p>
        </div>

        <div class="flex-1" />

        <div class="flex flex-col gap-3 w-full">
            <ContinueButton @continue="continueGame" />

            <div
                class="flex flex-col gap-3 bg-card rounded-2xl shadow-card p-3"
                data-skin="card"
                data-testid="new-game-card"
            >
                <DifficultySwitcher v-model="difficulty" />

                <!-- The main action without a save; secondary to Continue while one exists -->
                <button
                    v-press
                    data-skin="button new-game"
                    :class="gameStore.savedGame === null
                        ? 'bg-primary text-on-primary shadow-primary'
                        : 'bg-primary-light text-primary'"
                    class="flex items-center justify-center gap-2.5 h-14 w-full rounded-2xl cursor-pointer"
                    data-testid="new-game-button"
                    type="button"
                    @click="handleNewGame"
                >
                    <Plus :size="20" />
                    <span class="text-base font-semibold">{{ t("home.newGame") }}</span>
                </button>
            </div>
        </div>

        <div class="flex-1" />

        <!-- Becomes grid-cols-2 when Technique Lessons adds a fourth tile -->
        <div
            class="grid grid-cols-3 gap-3 w-full"
            data-testid="home-entries"
        >
            <button
                v-for="entry in entries"
                :key="entry.id"
                v-press
                data-skin="tile"
                :data-testid="`${entry.id}-button`"
                class="flex flex-col items-center gap-1 min-h-22 bg-card rounded-2xl shadow-card px-2 py-3 cursor-pointer"
                type="button"
                @click="entry.open"
            >
                <component
                    :is="entry.icon"
                    :size="22"
                    class="text-primary"
                />
                <span
                    :data-testid="`${entry.id}-label`"
                    class="text-sm font-semibold text-foreground"
                >{{ entry.label }}</span>
                <span
                    :data-testid="`${entry.id}-subtitle`"
                    class="text-[11px] text-foreground-secondary text-center leading-tight"
                >{{ entry.subtitle }}</span>
            </button>
        </div>

        <NewGameDialog />

        <PuzzleLoader :visible="puzzleLoader.visible.value" />
    </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ChartBar, Plus, Settings, Wand2 } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";
import { computeAbandonProgress } from "@/application/analytics/computeAbandonProgress";
import { HintTracker } from "@/domain/game/HintTracker";

import ContinueButton from "@/presentation/components/continue-button/ContinueButton.vue";
import DifficultySwitcher from "@/presentation/components/difficulty-switcher/DifficultySwitcher.vue";
import NewGameDialog from "@/presentation/components/new-game-dialog/NewGameDialog.vue";
import { provideNewGameDialog } from "@/presentation/components/new-game-dialog/useNewGameDialog";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";
import { usePuzzleLoader } from "@/presentation/components/puzzle-loader/usePuzzleLoader";
import { vPress } from "@/presentation/directives/press";
import { titleGlyphs } from "@/presentation/pages/home/titleGlyphs";

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
        if (result === "stay") return;
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
        // The save counts every hint used; statistics count the paid ones, as leaving a game does
        const hints = new HintTracker();
        hints.restore(saved.hintsUsed);
        statisticsStore.recordGame({
            difficulty: saved.difficulty,
            elapsedSeconds: saved.elapsedSeconds,
            completed: false,
            hintsUsed: hints.recordedUsed,
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

// Says "no games yet" rather than a 0% win rate nobody earned
const statisticsSubtitle = computed(() => {
    const { gamesPlayed, winRate } = statisticsStore.statistics.overall;
    return gamesPlayed === 0
        ? t("home.entries.noGames")
        : t("home.entries.winRate", { percent: Math.round(winRate * 100) });
});

const entries = computed(() => [
    { id: "statistics", icon: ChartBar, label: t("home.statistics"), subtitle: statisticsSubtitle.value, open: goToStatistics },
    { id: "walkthrough", icon: Wand2, label: t("home.walkthrough"), subtitle: t("home.entries.walkthrough"), open: goToWalkthrough },
    { id: "settings", icon: Settings, label: t("settings.title"), subtitle: t("home.entries.settings"), open: goToSettings },
]);

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
