<template>
    <div
        class="home-sizes flex flex-col min-h-full items-center pt-(--home-page-top) pb-(--home-page-bottom) px-6"
        :class="gameStore.savedGame === null ? '[--home-spare:106px]' : ''"
        data-skin="page-ruled"
    >
        <HomeHero />

        <!-- However short a narrow window, the cards never touch what is above and below them -->
        <div class="flex-1 min-h-(--home-spacer-min)" />

        <div class="flex flex-col gap-3 home-short:gap-2 w-full">
            <ContinueButton @continue="newGameFlow.continueGame" />

            <div
                class="flex flex-col gap-3 home-short:gap-2 bg-card rounded-2xl shadow-card p-3 home-short:p-2"
                data-skin="card new-game-card"
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
                    class="flex items-center justify-center gap-2.5 h-(--home-new-game-height) w-full rounded-2xl cursor-pointer"
                    data-testid="new-game-button"
                    type="button"
                    @click="handleNewGame"
                >
                    <Plus :size="20" />
                    <span class="text-base font-semibold">{{ t("home.newGame") }}</span>
                </button>
            </div>
        </div>

        <div class="flex-1 min-h-(--home-spacer-min)" />

        <div
            class="grid grid-cols-2 gap-3 home-short:gap-2 w-full"
            data-testid="home-entries"
        >
            <button
                v-for="entry in entries"
                :key="entry.id"
                v-press
                data-skin="tile home-tile"
                :data-testid="`${entry.id}-button`"
                class="flex flex-col items-center justify-center gap-1 home-short:gap-0.5 min-h-(--home-tile-min) bg-card rounded-2xl shadow-card px-2 py-(--home-tile-padding) cursor-pointer"
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
                    class="text-sm home-short:text-[13px] font-semibold text-foreground"
                >{{ entry.label }}</span>
                <span
                    :data-testid="`${entry.id}-subtitle`"
                    class="text-[11px] text-foreground-secondary text-center leading-tight home-tiny:hidden"
                >{{ entry.subtitle }}</span>
            </button>
        </div>

        <NewGameDialog />

        <PuzzleLoader :visible="newGameFlow.puzzleLoader.visible.value" />
    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ChartBar, GraduationCap, Plus, Settings, Wand2 } from "@/presentation/components/icon";
import { ALL_LESSON_IDS } from "@/domain/lessons/curriculum";
import { ROUTER_PATH } from "@/routerPaths";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import { useGameStore } from "@/stores/gameStore";
import { useLessonStore } from "@/stores/lessonStore";
import { useStatisticsStore } from "@/stores/statisticsStore";

import ContinueButton from "@/presentation/components/continue-button/ContinueButton.vue";
import DifficultySwitcher from "@/presentation/components/difficulty-switcher/DifficultySwitcher.vue";
import NewGameDialog from "@/presentation/components/new-game-dialog/NewGameDialog.vue";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";
import { useNewGameFlow } from "@/presentation/composables/useNewGameFlow";
import { vPress } from "@/presentation/directives/press";
import HomeHero from "@/presentation/pages/home/HomeHero.vue";

const { t } = useI18n();
const router = useRouter();
const statisticsStore = useStatisticsStore();
const lessonStore = useLessonStore();
const gameStore = useGameStore();
const newGameFlow = useNewGameFlow();

const difficulty = ref<Difficulty>("easy");

const handleNewGame = () => newGameFlow.startNewGame(difficulty.value);

// Says "no games yet" rather than a 0% win rate nobody earned
const statisticsSubtitle = computed(() => {
    const { gamesPlayed, winRate } = statisticsStore.statistics.overall;
    return gamesPlayed === 0
        ? t("home.entries.noGames")
        : t("home.entries.winRate", { percent: Math.round(winRate * 100) });
});

// Invites a new player in, then shows how far they are
const lessonsSubtitle = computed(() => (lessonStore.finishedCount === 0
    ? t("home.entries.lessonsFirst")
    : t("home.entries.lessonsProgress", { done: lessonStore.finishedCount, total: ALL_LESSON_IDS.length })));

const entries = computed(() => [
    { id: "lessons", icon: GraduationCap, label: t("lessons.title"), subtitle: lessonsSubtitle.value, open: goToLessons },
    { id: "walkthrough", icon: Wand2, label: t("home.walkthrough"), subtitle: t("home.entries.walkthrough"), open: goToWalkthrough },
    { id: "statistics", icon: ChartBar, label: t("home.statistics"), subtitle: statisticsSubtitle.value, open: goToStatistics },
    { id: "settings", icon: Settings, label: t("settings.title"), subtitle: t("home.entries.settings"), open: goToSettings },
]);

const goToLessons = () => {
    void router.push(ROUTER_PATH.lessons);
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
</script>
