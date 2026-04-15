<template>
    <div class="flex flex-col h-dvh px-5 bg-background overflow-y-auto">
        <!-- Header -->
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
                <span class="text-foreground text-base font-medium">Back</span>
            </button>
            <span class="text-foreground text-lg font-semibold">Statistics</span>
            <div class="w-15" />
        </div>

        <!-- Overview -->
        <div class="flex flex-col gap-2 mt-2">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">Overview</span>
            <div class="flex gap-3">
                <div
                    class="flex-1 flex flex-col items-center gap-1 bg-card rounded-2xl p-4 shadow-card"
                    data-testid="games-won"
                >
                    <span class="text-3xl font-bold text-primary font-mono">{{ stats.overall.gamesWon }}</span>
                    <span class="text-xs font-medium text-foreground-secondary">Games Won</span>
                </div>
                <div
                    class="flex-1 flex flex-col items-center gap-1 bg-card rounded-2xl p-4 shadow-card"
                    data-testid="win-rate"
                >
                    <span class="text-3xl font-bold text-primary font-mono">{{ winRateDisplay }}</span>
                    <span class="text-xs font-medium text-foreground-secondary">Win Rate</span>
                </div>
                <div
                    class="flex-1 flex flex-col items-center gap-1 bg-card rounded-2xl p-4 shadow-card"
                    data-testid="day-streak"
                >
                    <span class="text-3xl font-bold text-foreground font-mono">{{ dayStreak }}</span>
                    <span class="text-xs font-medium text-foreground-secondary">Day Streak</span>
                </div>
            </div>
        </div>

        <!-- Best Times -->
        <div class="flex flex-col gap-2 mt-5">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">Best Times</span>
            <div class="bg-card rounded-2xl p-4 shadow-card flex flex-col gap-3">
                <div
                    class="flex items-center justify-between"
                    data-testid="best-time-easy"
                >
                    <div class="flex items-center gap-3">
                        <Trophy
                            :size="20"
                            class="text-foreground-muted"
                        />
                        <span class="text-base font-medium text-foreground">Easy</span>
                    </div>
                    <span class="text-base font-semibold text-primary font-mono">
                        {{ formatBestTime(stats.easy.bestTime) }}
                    </span>
                </div>
                <div
                    class="flex items-center justify-between"
                    data-testid="best-time-medium"
                >
                    <div class="flex items-center gap-3">
                        <Trophy
                            :size="20"
                            class="text-foreground-muted"
                        />
                        <span class="text-base font-medium text-foreground">Medium</span>
                    </div>
                    <span class="text-base font-semibold text-primary font-mono">
                        {{ formatBestTime(stats.medium.bestTime) }}
                    </span>
                </div>
                <div
                    class="flex items-center justify-between"
                    data-testid="best-time-hard"
                >
                    <div class="flex items-center gap-3">
                        <Trophy
                            :size="20"
                            class="text-foreground-muted"
                        />
                        <span class="text-base font-medium text-foreground">Hard</span>
                    </div>
                    <span class="text-base font-semibold text-primary font-mono">
                        {{ formatBestTime(stats.hard.bestTime) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Recent Games -->
        <div class="flex flex-col gap-2 mt-5">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">Recent Games</span>
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
                                {{ formatDate(game.date) }}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex flex-col items-end gap-0.5">
                            <span
                                :class="game.completed ? 'text-primary' : 'text-accent'"
                                class="text-base font-semibold font-mono"
                            >
                                {{ game.completed ? formatTime(game.elapsedSeconds) : "Gave up" }}
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

            <!-- Empty State -->
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
                <span class="text-base font-semibold text-foreground">No games played yet</span>
                <span class="text-sm text-foreground-muted">Your game history will appear here</span>
            </div>
        </div>

        <!-- Clear All Records -->
        <div
            v-if="hasRecords"
            class="sticky bottom-0 bg-background py-4"
        >
            <button
                class="w-full h-13 rounded-xl border-2 border-danger bg-background flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-danger/10"
                data-testid="clear-records-button"
                @click="handleClearRecords"
            >
                <Trash2
                    :size="18"
                    class="text-danger"
                />
                <span class="text-base font-semibold text-danger">Clear All Records</span>
            </button>
        </div>

        <!-- Clear Records Dialog -->
        <ClearRecordsDialog />
    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, ChevronRight, Lightbulb, Trash2, Trophy, X } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import { clearAllRecords, getStatistics, type GameResult } from "@/application/Statistics";
import { formatTime } from "@/utils/formatTime";
import { formatDate } from "@/utils/formatDate";
import { type Difficulty, DifficultyLabels } from "@/domain";
import ClearRecordsDialog from "@/presentation/pages/statistics/ClearRecordsDialog.vue";
import { provideClearRecordsDialog } from "@/presentation/pages/statistics/useClearRecordsDialog";

const router = useRouter();
const { open: openClearRecordsDialog } = provideClearRecordsDialog();

const version = ref(0);

const handleClearRecords = async () => {
    const result = await openClearRecordsDialog();
    if (result === "confirm") {
        clearAllRecords();
        version.value++;
    }
};

const stats = computed(() => {
    void version.value;
    return getStatistics();
});

const hasRecords = computed(() => stats.value.overall.gamesPlayed > 0);

const winRateDisplay = computed(() =>
    `${Math.round(stats.value.overall.winRate * 100)}%`
);

const dayStreak = computed(() => {
    const games = stats.value.recentGames;
    if (games.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const playedDates = new Set(
        games.filter(game => game.completed).map(game => {
            const date = new Date(game.date);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
        })
    );

    const sortedDates = [...playedDates].sort((dateA, dateB) => dateB - dateA);
    if (sortedDates.length === 0) return 0;

    const msPerDay = 86400000;
    let expectedDate = today.getTime();

    for (const date of sortedDates) {
        if (date === expectedDate || date === expectedDate - msPerDay) {
            streak++;
            expectedDate = date - msPerDay;
        } else {
            break;
        }
    }

    return streak;
});

const formatBestTime = (seconds: number | null): string => {
    if (seconds === null) return "--:--";
    return formatTime(seconds);
};

const difficultyLabel = (difficulty: Difficulty): string => {
    return DifficultyLabels[difficulty];
};

const openReview = (game: GameResult, displayIndex: number) => {
    if (!game.replay) return;
    const historyIndex = stats.value.recentGames.length - 1 - displayIndex;
    void router.push(ROUTER_PATH.gameReviewFor(historyIndex));
};

const goBack = () => {
    void router.push(ROUTER_PATH.home);
};
</script>
