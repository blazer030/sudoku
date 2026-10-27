<template>
    <div
        ref="scrollArea"
        class="flex flex-col gap-4 h-full overflow-y-auto overflow-x-hidden overscroll-y-contain bg-background px-5 pb-6"
        data-skin="page"
        data-testid="review-scroll-area"
    >
        <div
            ref="header"
            :data-scrolled="headerScrolled ? '' : undefined"
            class="flex items-center justify-between sticky top-0 bg-background -mx-5 px-5 pt-6 pb-1 z-10"
            data-skin="page-header"
            data-testid="review-header"
        >
            <button
                class="flex items-center gap-2 cursor-pointer"
                data-testid="review-back-button"
                @click="goBack"
            >
                <ChevronLeft
                    :size="24"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-medium">{{ t("common.back") }}</span>
            </button>
            <span class="text-foreground text-lg font-semibold">{{ t("review.title") }}</span>
            <div class="w-15" />
        </div>

        <div
            class="flex items-center justify-between bg-card rounded-xl py-2 px-4 shadow-card-sm"
            data-skin="card"
        >
            <div class="flex items-center gap-3">
                <div
                    :class="game.completed
                        ? 'bg-primary-light text-primary'
                        : 'bg-accent/10 text-accent'"
                    :data-skin="game.completed ? 'icon-tile' : 'icon-tile gave-up'"
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
            <div class="flex flex-col items-end gap-0.5">
                <span
                    :class="game.completed ? 'text-primary' : 'text-accent'"
                    :data-skin="game.completed ? 'game-result' : 'game-result gave-up'"
                    class="text-base font-semibold font-mono"
                >
                    {{ game.completed ? formatTime(game.elapsedSeconds) : t("statistics.gaveUp") }}
                </span>
                <span class="flex items-center gap-0.75 text-[11px] font-medium text-foreground-muted font-mono">
                    <Lightbulb :size="11" />
                    {{ game.hintsUsed }}
                </span>
            </div>
        </div>

        <div class="flex-1" />
        <!-- The board reaches into the page gutter from inside this wrapper: as a direct child it would
             count the page's end padding past it as sideways overflow -->
        <div class="flex flex-col gap-6">
            <div
                :data-selected-cell="changedCellName"
                data-skin="board"
                class="bg-card rounded-2xl shadow-card-lg p-2 self-center w-[calc(100%+1.5rem)] max-w-board-fit pointer-events-none"
                data-testid="review-board"
            >
                <div
                    ref="boardGrid"
                    class="flex flex-col border-3 border-foreground/20 rounded-xl"
                    data-skin="board-grid"
                >
                    <div
                        v-for="(row, rowIndex) in board"
                        :key="rowIndex"
                        class="grid grid-cols-9"
                    >
                        <Cell
                            v-for="(puzzleCell, columnIndex) in row"
                            :key="`cell-${rowIndex}-${columnIndex}`"
                            :column="columnIndex"
                            :data-testid="`review-cell-${rowIndex}-${columnIndex}`"
                            :highlight-same-digit="false"
                            :interactive="false"
                            :puzzle-cell="puzzleCell"
                            :row="rowIndex"
                            :selected="isChanged(rowIndex, columnIndex)"
                        />
                    </div>
                </div>
            </div>
            <StepPlaybackPanel
                :label="t('review.title')"
                :play-state="playState"
                :step-index="currentStep"
                compact-explanation
                :total-steps="positionCount"
                test-id-prefix="review"
                @go-to="goToStep"
                @next="next"
                @previous="previous"
                @toggle-play="togglePlay"
            >
                <template #tag>
                    <StepTag
                        :icon="tag.icon"
                        :label="tag.label"
                        :step-key="currentStep"
                        :strong="stage === 'final'"
                        test-id="review-action"
                    />
                </template>
                <i18n-t
                    :keypath="description.keypath"
                    scope="global"
                    tag="span"
                >
                    <template #value>
                        <span class="font-semibold">{{ description.params.value }}</span>
                    </template>
                    <template #row>
                        <span class="font-semibold">{{ description.params.row }}</span>
                    </template>
                    <template #column>
                        <span class="font-semibold">{{ description.params.column }}</span>
                    </template>
                </i18n-t>
            </StepPlaybackPanel>
        </div>
        <div class="flex-1" />
    </div>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef, watch, type Component } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, Eraser, LayoutGrid, Lightbulb, Pencil, Sparkles, StickyNote, Trophy, Undo2, X } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import { useScrolledHeader } from "@/presentation/composables/useScrolledHeader";
import type { GameStepAction } from "@/domain/game/GameStep";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { formatTime } from "@/utils/formatTime";
import { useI18n } from "vue-i18n";
import { useAppLocale } from "@/presentation/i18n/useAppLocale";
import { formatDate } from "@/presentation/i18n/formatDate";
import { useDifficultyLabel } from "@/presentation/i18n/difficultyLabels";
import Cell from "@/presentation/components/board-cell/Cell.vue";
import { cellName } from "@/presentation/components/board-cell/cellName";
import StepPlaybackPanel from "@/presentation/components/step-presentation/StepPlaybackPanel.vue";
import StepTag from "@/presentation/components/step-presentation/StepTag.vue";
import { useGameReview } from "@/presentation/pages/game-review/useGameReview";
import { revealInScroller } from "@/presentation/pages/game-review/revealInScroller";

const props = defineProps<{
    index: string;
}>();

const { t } = useI18n();
const appLocale = useAppLocale();
const router = useRouter();
const history = useStatisticsStore().history;
const gameIndex = Number(props.index);
const game = history[gameIndex];
const replayData = game.replay;

if (!replayData) {
    void router.replace(ROUTER_PATH.statistics);
}

const {
    currentStep,
    positionCount,
    stage,
    board,
    gameStep,
    changedCell,
    description,
    playState,
    next,
    previous,
    goToStep,
    togglePlay,
} = useGameReview(replayData ?? { initialBoard: [], steps: [] }, game.completed);

const ACTION_ICONS: Record<GameStepAction, Component> = {
    fill: Pencil,
    erase: Eraser,
    toggleNote: StickyNote,
    hint: Lightbulb,
    autoNotes: Sparkles,
    undo: Undo2,
};

const tag = computed((): { label: string; icon: Component } => {
    if (stage.value === "final") {
        return game.completed
            ? { label: t("review.stages.completed"), icon: Trophy }
            : { label: t("review.stages.gaveUp"), icon: X };
    }
    const step = gameStep.value;
    if (stage.value === "initial" || step === null) return { label: t("review.stages.initial"), icon: LayoutGrid };
    return { label: t(`review.actions.${step.action}`), icon: ACTION_ICONS[step.action] };
});

const changedCellName = computed(() => changedCell.value === null ? undefined : cellName(changedCell.value.row, changedCell.value.column));

const isChanged = (row: number, column: number): boolean => {
    const cell = changedCell.value;
    return cell !== null && cell.row === row && cell.column === column;
};

// Each step brings the cell it changed into view. Steps that touch no single
// cell (auto notes, undo, the first and last boards) leave the scroll where the player put it.
const scrollArea = useTemplateRef<HTMLElement>("scrollArea");
const header = useTemplateRef<HTMLElement>("header");
const headerScrolled = useScrolledHeader(header);
const boardGrid = useTemplateRef<HTMLElement>("boardGrid");
watch(currentStep, () => {
    const cell = changedCell.value;
    const cellElement = cell === null ? null : boardGrid.value?.children[cell.row]?.children[cell.column];
    if (!(cellElement instanceof HTMLElement) || !scrollArea.value) return;
    revealInScroller(scrollArea.value, cellElement, header.value?.getBoundingClientRect().bottom ?? 0);
}, { flush: "post" });

const difficultyLabel = useDifficultyLabel();

const goBack = () => {
    void router.push(ROUTER_PATH.statistics);
};
</script>
