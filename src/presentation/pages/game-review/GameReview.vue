<template>
    <div class="flex flex-col gap-7 px-5 bg-background">
        <!-- Header -->
        <div class="flex items-center justify-between pt-6">
            <button
                class="flex items-center gap-2 cursor-pointer"
                data-testid="review-back-button"
                @click="goBack"
            >
                <ChevronLeft
                    :size="24"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-medium">Back</span>
            </button>
            <span class="text-foreground text-lg font-semibold">Game Review</span>
            <div class="w-15" />
        </div>

        <!-- Game Info Card -->
        <div class="flex items-center justify-between bg-card rounded-xl py-3 px-4 shadow-card-sm">
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
            <div class="flex flex-col items-end gap-0.5">
                <span
                    :class="game.completed ? 'text-primary' : 'text-accent'"
                    class="text-base font-semibold font-mono"
                >
                    {{ game.completed ? formatTime(game.elapsedSeconds) : "Gave up" }}
                </span>
                <span class="flex items-center gap-0.75 text-[11px] font-medium text-foreground-muted font-mono">
                    <Lightbulb :size="11" />
                    {{ game.hintsUsed }}
                </span>
            </div>
        </div>

        <!-- Board -->
        <div class="bg-card rounded-2xl shadow-card-lg p-2 w-full pointer-events-none">
            <div class="flex flex-col border-3 border-foreground/20 rounded-xl">
                <div
                    v-for="(row, rowIndex) in board"
                    :key="rowIndex"
                    class="flex"
                >
                    <Cell
                        v-for="(puzzleCell, columnIndex) in row"
                        :key="`cell-${rowIndex}-${columnIndex}`"
                        :column="columnIndex"
                        :puzzle-cell="puzzleCell"
                        :row="rowIndex"
                        :selected="isActiveCell(rowIndex, columnIndex)"
                        :highlight-same-digit="false"
                    />
                </div>
            </div>
        </div>

        <!-- Step Description -->
        <div class="flex flex-col gap-2">
            <div class="bg-card rounded-lg py-2.5 px-4 shadow-card-sm min-h-9 flex items-center">
                <span
                    v-if="description"
                    class="text-sm text-foreground"
                >
                    {{ description }}
                </span>
                <span
                    v-else
                    class="text-sm text-foreground-muted"
                >
                    Initial board
                </span>
            </div>

            <!-- Progress -->
            <div class="flex flex-col gap-1.5">
                <div class="w-full bg-border rounded-full h-1">
                    <div
                        class="bg-primary h-1 rounded-full transition-all duration-200"
                        :style="{ width: progressPercent }"
                    />
                </div>
                <span class="text-xs text-foreground-muted text-center">
                    Step {{ currentStep }} of {{ totalSteps }}
                </span>
            </div>
        </div>

        <!-- Playback Controls -->
        <div class="flex items-center justify-center gap-5">
            <button
                class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5"
                data-testid="review-first"
                @click="goToFirst"
            >
                <SkipBack :size="20" />
            </button>
            <button
                class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5"
                data-testid="review-prev"
                @click="previous"
            >
                <ChevronLeft :size="22" />
            </button>
            <button
                class="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90"
                data-testid="review-play"
                @click="togglePlay"
            >
                <Pause
                    v-if="isPlaying"
                    :size="24"
                />
                <Play
                    v-else
                    :size="24"
                />
            </button>
            <button
                class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5"
                data-testid="review-next"
                @click="next"
            >
                <ChevronRight :size="22" />
            </button>
            <button
                class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5"
                data-testid="review-last"
                @click="goToLast"
            >
                <SkipForward :size="20" />
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, ChevronRight, Lightbulb, Pause, Play, SkipBack, SkipForward, Trophy, X } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import { getGameHistory } from "@/application/Statistics";
import { formatTime } from "@/utils/formatTime";
import { formatDate } from "@/utils/formatDate";
import { type Difficulty, DifficultyLabels } from "@/domain";
import Cell from "@/presentation/pages/game/components/Cell.vue";
import { useGameReview } from "./useGameReview";

const props = defineProps<{
    index: string;
}>();

const router = useRouter();
const history = getGameHistory();
const gameIndex = Number(props.index);
const game = history[gameIndex];
const replayData = game.replay;

if (!replayData) {
    void router.replace(ROUTER_PATH.statistics);
}

const {
    currentStep,
    totalSteps,
    board,
    gameStep,
    description,
    isPlaying,
    next,
    previous,
    goToFirst,
    goToLast,
    togglePlay,
} = useGameReview(replayData ?? { initialBoard: [], steps: [] });

const isActiveCell = (row: number, column: number): boolean => {
    const step = gameStep.value;
    if (!step) return false;
    return step.row === row && step.column === column;
};

const progressPercent = computed(() => {
    if (totalSteps.value === 0) return "0%";
    return `${(currentStep.value / totalSteps.value) * 100}%`;
});

const difficultyLabel = (difficulty: Difficulty): string => DifficultyLabels[difficulty];

const goBack = () => {
    void router.push(ROUTER_PATH.statistics);
};
</script>
