<template>
    <div class="flex flex-col gap-5 px-5 bg-background overflow-y-auto h-dvh">
        <!-- Header -->
        <div class="flex items-center justify-between sticky top-0 bg-background pt-6 pb-3 z-10">
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
        <div class="bg-card rounded-lg py-2.5 px-4 shadow-card-sm min-h-9 flex items-center gap-2">
            <template v-if="description && stepIcon">
                <component
                    :is="stepIcon"
                    :size="16"
                    class="text-foreground-muted shrink-0"
                />
                <span class="text-sm text-foreground">
                    <template
                        v-for="(part, i) in description"
                        :key="i"
                    >
                        <span
                            v-if="part.bold"
                            class="font-semibold"
                        >{{ part.text }}</span>
                        <template v-else>{{ part.text }}</template>
                    </template>
                </span>
            </template>
            <span
                v-else
                class="text-sm text-foreground-muted"
            >
                Initial board
            </span>
        </div>

        <!-- Progress -->
        <ProgressBar
            :current-step="currentStep"
            :total-steps="totalSteps"
            :play-state="playState"
            testid-prefix="review-"
            counter-align="center"
            @seek="goToStep"
        />

        <!-- Playback Controls -->
        <div class="pb-8">
            <PlaybackControls
                :is-playing="isPlaying"
                testid-prefix="review-"
                @first="goToFirst"
                @prev="previous"
                @toggle-play="togglePlay"
                @next="next"
                @last="goToLast"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, Eraser, Lightbulb, Pencil, Sparkles, StickyNote, Trophy, Undo2, X } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import { getGameHistory } from "@/application/Statistics";
import { formatTime } from "@/utils/formatTime";
import { formatDate } from "@/utils/formatDate";
import { type Difficulty, DifficultyLabels } from "@/domain";
import Cell from "@/presentation/pages/game/components/Cell.vue";
import PlaybackControls from "@/presentation/components/playback/PlaybackControls.vue";
import ProgressBar from "@/presentation/components/playback/ProgressBar.vue";
import { useGameReview } from "@/presentation/pages/game-review/useGameReview";

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
    isAtFinalStep,
    board,
    gameStep,
    description,
    isPlaying,
    next,
    previous,
    goToFirst,
    goToLast,
    goToStep,
    togglePlay,
    stopPlay,
    startPlay,
} = useGameReview(replayData ?? { initialBoard: [], steps: [] }, game.completed);

const playState = { isPlaying, stopPlay, startPlay };

const ACTION_ICONS: Record<string, typeof Pencil> = {
    fill: Pencil,
    erase: Eraser,
    toggleNote: StickyNote,
    hint: Lightbulb,
    autoNotes: Sparkles,
    undo: Undo2,
};

const stepIcon = computed(() => {
    if (isAtFinalStep.value) {
        return game.completed ? Trophy : X;
    }
    const step = gameStep.value;
    if (!step) return null;
    return ACTION_ICONS[step.action];
});

const isActiveCell = (row: number, column: number): boolean => {
    const step = gameStep.value;
    if (!step) return false;
    return step.row === row && step.column === column;
};

const difficultyLabel = (difficulty: Difficulty): string => DifficultyLabels[difficulty];

const goBack = () => {
    void router.push(ROUTER_PATH.statistics);
};
</script>
