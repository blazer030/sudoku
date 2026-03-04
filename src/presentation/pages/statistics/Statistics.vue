<template>
    <div class="flex flex-col gap-6 h-dvh py-6 px-5 overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between">
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
            <div class="w-[60px]" />
        </div>

        <!-- Overview -->
        <div class="flex flex-col gap-3">
            <span class="text-foreground-secondary text-sm font-semibold">Overview</span>
            <div class="flex gap-3">
                <div
                    class="flex-1 flex flex-col items-center gap-1 bg-card rounded-2xl p-4 shadow-[0_2px_8px_#1A191808]"
                    data-testid="games-won"
                >
                    <span class="text-3xl font-bold text-primary">{{ stats.overall.gamesWon }}</span>
                    <span class="text-xs font-medium text-foreground-secondary">Games Won</span>
                </div>
                <div
                    class="flex-1 flex flex-col items-center gap-1 bg-card rounded-2xl p-4 shadow-[0_2px_8px_#1A191808]"
                    data-testid="win-rate"
                >
                    <span class="text-3xl font-bold text-primary">{{ winRateDisplay }}</span>
                    <span class="text-xs font-medium text-foreground-secondary">Win Rate</span>
                </div>
                <div
                    class="flex-1 flex flex-col items-center gap-1 bg-card rounded-2xl p-4 shadow-[0_2px_8px_#1A191808]"
                    data-testid="day-streak"
                >
                    <span class="text-3xl font-bold text-foreground">{{ dayStreak }}</span>
                    <span class="text-xs font-medium text-foreground-secondary">Day Streak</span>
                </div>
            </div>
        </div>

        <!-- Best Times -->
        <div class="flex flex-col gap-3">
            <span class="text-foreground-secondary text-sm font-semibold">Best Times</span>
            <div class="bg-card rounded-2xl p-4 shadow-[0_2px_8px_#1A191808] flex flex-col gap-3">
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
                    <span class="text-base font-semibold text-primary">{{ formatBestTime(stats.easy.bestTime) }}</span>
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
                    <span class="text-base font-semibold text-primary">{{ formatBestTime(stats.medium.bestTime) }}</span>
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
                    <span class="text-base font-semibold text-primary">{{ formatBestTime(stats.hard.bestTime) }}</span>
                </div>
            </div>
        </div>

        <!-- Recent Games -->
        <div class="flex flex-col gap-3">
            <span class="text-foreground-secondary text-sm font-semibold">Recent Games</span>
            <div class="flex flex-col gap-2">
                <div
                    v-for="(game, index) in stats.recentGames"
                    :key="index"
                    class="flex items-center justify-between bg-card rounded-xl py-3 px-4 shadow-[0_1px_4px_#1A191808]"
                    data-testid="recent-game"
                >
                    <div class="flex items-center gap-3">
                        <div
                            :class="game.completed
                                ? 'text-primary'
                                : 'text-accent'"
                            class="w-8 h-8 rounded-lg flex items-center justify-center"
                        >
                            <Trophy
                                v-if="game.completed"
                                :size="20"
                            />
                            <X
                                v-else
                                :size="20"
                            />
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-semibold text-foreground">{{ difficultyLabel(game.difficulty) }}</span>
                            <span class="text-xs text-foreground-muted">{{ formatDate(game.date) }}</span>
                        </div>
                    </div>
                    <span
                        :class="game.completed ? 'text-foreground' : 'text-accent'"
                        class="text-sm font-semibold"
                    >
                        {{ game.completed ? formatTime(game.elapsedSeconds) : "Gave up" }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, Trophy, X } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import { getStatistics } from "@/application/Statistics";
import { formatTime } from "@/utils/formatTime";
import { DifficultyLabels, type Difficulty } from "@/domain/SudokuGenerator";

const router = useRouter();

const stats = computed(() => getStatistics());

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

    const sortedDates = [...playedDates].sort((a, b) => b - a);
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

function formatBestTime(seconds: number | null): string {
    if (seconds === null) return "--:--";
    return formatTime(seconds);
}

function difficultyLabel(difficulty: Difficulty): string {
    return DifficultyLabels[difficulty];
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const gameDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - gameDay.getTime()) / 86400000);

    const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    if (diffDays === 0) return `Today, ${timeStr}`;
    if (diffDays === 1) return `Yesterday, ${timeStr}`;
    return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`;
}

const goBack = () => {
    void router.push(ROUTER_PATH.home);
};
</script>
