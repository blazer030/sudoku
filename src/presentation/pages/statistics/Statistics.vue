<template>
    <div class="flex flex-col h-full px-5 pb-6 bg-background overflow-y-auto">
        <div class="flex items-center justify-between sticky top-0 bg-background pt-6 pb-3 z-10">
            <button
                class="flex items-center gap-2 cursor-pointer"
                data-testid="stats-back-button"
                @click="goBack"
            >
                <ChevronLeft
                    :size="24"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-medium">{{ t("common.back") }}</span>
            </button>
            <span class="text-foreground text-lg font-semibold">{{ t("home.statistics") }}</span>
            <div class="w-15" />
        </div>

        <div class="flex flex-col gap-2 mt-2">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">{{ t("statistics.overview") }}</span>
            <div class="flex gap-3">
                <div
                    class="flex-1 flex flex-col items-center gap-1 bg-card rounded-2xl px-2 py-4 shadow-card"
                    data-testid="games-won"
                >
                    <span class="text-3xl font-bold text-primary font-mono">{{ stats.overall.gamesWon }}</span>
                    <span class="text-xs font-medium text-foreground-secondary">{{ t("statistics.gamesWon") }}</span>
                </div>
                <div
                    class="flex-1 flex flex-col items-center gap-1 bg-card rounded-2xl px-2 py-4 shadow-card"
                    data-testid="win-rate"
                >
                    <span class="text-3xl font-bold text-primary font-mono">{{ winRateDisplay }}</span>
                    <span class="text-xs font-medium text-foreground-secondary">{{ t("statistics.winRate") }}</span>
                </div>
                <div
                    class="flex-1 flex flex-col items-center gap-1 bg-card rounded-2xl px-2 py-4 shadow-card"
                    data-testid="day-streak"
                >
                    <span class="text-3xl font-bold text-foreground font-mono">{{ dayStreak }}</span>
                    <span class="text-xs font-medium text-foreground-secondary text-center">{{ t("statistics.dayStreak") }}</span>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-2 mt-5">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">{{ t("statistics.byDifficulty") }}</span>
            <div class="bg-card rounded-2xl p-4 shadow-card flex flex-col divide-y divide-border">
                <div
                    v-for="difficulty in DIFFICULTIES"
                    :key="difficulty"
                    :data-testid="`difficulty-stats-${difficulty}`"
                    class="flex items-center gap-2 py-3 first:pt-0 last:pb-0"
                >
                    <span class="text-base font-medium text-foreground w-16 shrink-0">{{ difficultyLabel(difficulty) }}</span>
                    <div
                        v-if="stats[difficulty].gamesPlayed > 0"
                        class="grid grid-cols-3 flex-1"
                    >
                        <div
                            :data-testid="`difficulty-best-${difficulty}`"
                            class="flex flex-col items-center"
                        >
                            <span class="text-base font-semibold font-mono text-primary">{{ formatOptionalTime(stats[difficulty].bestTime) }}</span>
                            <span class="text-[11px] text-foreground-secondary">{{ t("statistics.best") }}</span>
                        </div>
                        <div
                            :data-testid="`difficulty-average-${difficulty}`"
                            class="flex flex-col items-center"
                        >
                            <span class="text-base font-semibold font-mono text-foreground">{{ formatOptionalTime(stats[difficulty].averageTime) }}</span>
                            <span class="text-[11px] text-foreground-secondary">{{ t("statistics.average") }}</span>
                        </div>
                        <div
                            :data-testid="`difficulty-completed-${difficulty}`"
                            class="flex flex-col items-center"
                        >
                            <span class="text-base font-semibold font-mono text-foreground">{{ `${stats[difficulty].gamesWon}/${stats[difficulty].gamesPlayed}` }}</span>
                            <span class="text-[11px] text-foreground-secondary">{{ t("statistics.completed") }}</span>
                        </div>
                    </div>
                    <span
                        v-else
                        class="text-sm text-foreground-muted"
                    >{{ t("statistics.notPlayed") }}</span>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-2 mt-5">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">{{ t("statistics.recentGames") }}</span>
            <div
                v-if="hasRecords"
                class="flex flex-col gap-2"
            >
                <button
                    v-for="(game, index) in stats.recentGames"
                    :key="index"
                    :class="game.replay ? 'cursor-pointer' : 'cursor-default'"
                    class="flex items-center justify-between bg-card rounded-xl py-3 px-4 shadow-card-sm text-left"
                    data-testid="recent-game"
                    @click="openReview(game, index)"
                >
                    <div class="flex items-center gap-3">
                        <div
                            :class="game.completed
                                ? 'bg-primary-light text-primary'
                                : 'bg-accent/10 text-accent'"
                            class="w-9 h-9 rounded-icon flex items-center justify-center"
                        >
                            <Trophy
                                v-if="game.completed"
                                :size="18"
                            />
                            <X
                                v-else
                                :size="18"
                            />
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <span class="text-sm font-semibold text-foreground">
                                {{ difficultyLabel(game.difficulty) }}
                            </span>
                            <span class="text-[11px] text-foreground-muted">
                                {{ formatDate(game.date, appLocale) }}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex flex-col items-end gap-0.5">
                            <span
                                :class="game.completed ? 'text-primary' : 'text-accent'"
                                class="text-base font-semibold font-mono"
                            >
                                {{ game.completed ? formatTime(game.elapsedSeconds) : t("statistics.gaveUp") }}
                            </span>
                            <span
                                class="flex items-center gap-0.75 text-[11px] font-medium text-foreground-muted font-mono"
                                data-testid="hints-used"
                            >
                                <Lightbulb :size="11" />
                                {{ game.hintsUsed }}
                            </span>
                        </div>
                        <ChevronRight
                            v-if="game.replay"
                            :size="20"
                            class="text-foreground-muted"
                            data-testid="review-chevron"
                        />
                    </div>
                </button>
            </div>

            <div
                v-if="!hasRecords"
                class="flex flex-col items-center gap-2"
                data-testid="empty-state"
            >
                <div class="w-16 h-16 rounded-full bg-card shadow-card flex items-center justify-center mb-2">
                    <Trophy
                        :size="28"
                        class="text-foreground-muted"
                    />
                </div>
                <span class="text-base font-semibold text-foreground">{{ t("statistics.empty.title") }}</span>
                <span class="text-sm text-foreground-muted">{{ t("statistics.empty.description") }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, ChevronRight, Lightbulb, Trophy, X } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import { useStatisticsStore } from "@/stores/statisticsStore";
import type { Difficulty } from "@/domain";
import type { GameResult } from "@/application/statistics/StatisticsRepository";
import { formatTime } from "@/utils/formatTime";
import { countPlayStreak } from "@/application/statistics/playStreak";
import { useI18n } from "vue-i18n";
import { useAppLocale } from "@/presentation/i18n/useAppLocale";
import { formatDate } from "@/presentation/i18n/formatDate";
import { useDifficultyLabel } from "@/presentation/labels/difficultyLabels";

const { t } = useI18n();
const appLocale = useAppLocale();
const router = useRouter();
const statisticsStore = useStatisticsStore();

const stats = computed(() => statisticsStore.statistics);

const hasRecords = computed(() => stats.value.overall.gamesPlayed > 0);

const winRateDisplay = computed(() =>
    `${Math.round(stats.value.overall.winRate * 100)}%`
);

const dayStreak = computed(() =>
    countPlayStreak(statisticsStore.history.map(game => game.date), new Date())
);

const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

const formatOptionalTime = (seconds: number | null): string => {
    if (seconds === null) return "—";
    return formatTime(seconds);
};

const difficultyLabel = useDifficultyLabel();

const openReview = (game: GameResult, displayIndex: number) => {
    if (!game.replay) return;
    const historyIndex = stats.value.recentGames.length - 1 - displayIndex;
    void router.push(ROUTER_PATH.gameReviewFor(historyIndex));
};

const goBack = () => {
    void router.push(ROUTER_PATH.home);
};
</script>
