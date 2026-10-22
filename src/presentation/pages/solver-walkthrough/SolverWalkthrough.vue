<template>
    <div class="flex flex-col gap-2 min-h-full py-6 px-5">
        <div class="flex items-center justify-between">
            <button
                class="flex items-center gap-2 cursor-pointer"
                data-testid="back-button"
                @click="goBack"
            >
                <ChevronLeft
                    :size="24"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-medium">
                    {{ t("common.back") }}
                </span>
            </button>
            <span class="text-foreground text-lg font-semibold">
                {{ t("home.walkthrough") }}
            </span>
            <div class="w-18" />
        </div>
        <div class="flex-1" />
        <div class="flex flex-col items-center gap-6">
            <div
                :class="inPlayback ? 'pointer-events-none' : ''"
                class="bg-card rounded-2xl shadow-card-lg p-2 w-full"
                data-testid="walkthrough-board"
            >
                <div class="relative flex flex-col border-3 border-foreground/20 rounded-xl">
                    <div
                        v-for="(row, rowIndex) in puzzleCells"
                        :key="`row-${rowIndex}`"
                        :data-testid="`solver-row-${rowIndex}`"
                        class="flex"
                    >
                        <Cell
                            v-for="(puzzleCell, columnIndex) in row"
                            :key="`cell-${rowIndex}-${columnIndex}`"
                            :column="columnIndex"
                            :data-testid="`solver-cell-${rowIndex}-${columnIndex}`"
                            :hint="cellViews?.[rowIndex][columnIndex] ?? null"
                            :interactive="!inPlayback"
                            :puzzle-cell="puzzleCell"
                            :row="rowIndex"
                            :selected="!inPlayback && isSelectedCell(rowIndex, columnIndex)"
                            :selected-digit="inPlayback ? null : selectedDigit"
                            @click="selectCell(rowIndex, columnIndex)"
                        />
                    </div>
                    <StepLinkOverlay
                        v-if="inPlayback"
                        :links="links"
                    />
                </div>
            </div>

            <!-- The playback panel covers the inputs in place, so the board never moves. -->
            <div
                ref="inputArea"
                class="relative w-full"
            >
                <div
                    :class="inPlayback ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'"
                    :inert="inPlayback || undefined"
                    class="flex flex-col items-center gap-6 transition-opacity duration-200"
                    data-testid="walkthrough-inputs"
                >
                    <DigitPad
                        :digit-counts="emptyDigitCounts"
                        :disabled-digits="invalidDigitsForSelectedCell"
                        :erase-active="eraseMode"
                        :erase-disabled="eraseDisabledForSelectedCell"
                        :selected-digit="selectedDigit"
                        :show-remaining-count="false"
                        @select-digit="pickDigit"
                        @toggle-erase-mode="toggleEraseMode"
                    />
                    <div class="flex gap-3">
                        <button
                            class="px-6 py-3 bg-danger text-on-danger rounded-2xl font-semibold cursor-pointer shadow-danger transition-all duration-200 hover:bg-danger-hover hover:shadow-primary-lg"
                            data-testid="reset-button"
                            @click="resetBoard"
                        >
                            {{ t("walkthrough.reset") }}
                        </button>
                        <button
                            class="px-6 py-3 bg-primary text-on-primary rounded-2xl font-semibold cursor-pointer shadow-primary transition-all duration-200 hover:bg-primary-hover hover:shadow-primary-lg"
                            data-testid="solve-button"
                            @click="runSolver"
                        >
                            {{ t("walkthrough.solve") }}
                        </button>
                    </div>
                    <div
                        v-if="testButtonsEnabled"
                        class="flex gap-2"
                    >
                        <button
                            v-for="preset in TEST_PUZZLE_PRESETS"
                            :key="preset.label"
                            :data-testid="`load-preset-${preset.label.toLowerCase()}`"
                            class="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground-muted cursor-pointer hover:bg-foreground/5"
                            @click="loadPreset(preset.puzzle)"
                        >
                            {{ preset.label }}
                        </button>
                    </div>
                </div>

                <Transition name="walkthrough-overlay">
                    <div
                        v-if="inPlayback"
                        class="absolute top-0 inset-x-0 z-10"
                    >
                        <StepPlaybackPanel
                            :label="t('home.walkthrough')"
                            :max-height="roomBelowInputArea"
                            :play-state="playState"
                            :step-index="stepIndex"
                            :total-steps="stepCount"
                            test-id-prefix="walkthrough"
                            @go-to="goTo"
                            @next="next"
                            @previous="previous"
                            @toggle-play="togglePlay"
                        >
                            <template #tag>
                                <StepTag
                                    v-if="currentStep"
                                    :icon="currentStep.step.assignments.length > 0 ? PencilLine : ListFilter"
                                    :label="techniqueLabel(currentStep.step.technique)"
                                    :step-key="stepIndex"
                                    :strong="currentStep.step.assignments.length > 0"
                                    test-id="walkthrough-technique"
                                />
                            </template>
                            {{ explanation }}
                        </StepPlaybackPanel>
                    </div>
                </Transition>
            </div>
        </div>
        <div class="flex-1" />
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ChevronLeft, ListFilter, PencilLine } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import { BOARD_SIZE } from "@/domain/board/constants";
import { buildSolvePath } from "@/domain/solver/SolvePath";
import { useTechniqueLabel } from "@/presentation/labels/techniqueLabels";
import Cell from "@/presentation/pages/game/components/Cell.vue";
import DigitPad from "@/presentation/pages/game/components/DigitPad.vue";
import StepLinkOverlay from "@/presentation/components/step-presentation/StepLinkOverlay.vue";
import StepPlaybackPanel from "@/presentation/components/step-presentation/StepPlaybackPanel.vue";
import StepTag from "@/presentation/components/step-presentation/StepTag.vue";
import { useHintExplanation } from "@/presentation/pages/game/hint-mode/useHintExplanation";
import { useRoomBelow } from "@/presentation/pages/game/hint-mode/useRoomBelow";
import { useWalkthroughPlayback } from "@/presentation/pages/solver-walkthrough/useWalkthroughPlayback";
import { TEST_PUZZLE_PRESETS } from "@/presentation/pages/solver-walkthrough/testPuzzles";
import { isFeatureEnabled } from "@/utils/featureToggle";

interface CellPosition {
    row: number;
    column: number;
}

const createEmptyBoard = (): number[][] =>
    Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 0));

const router = useRouter();
const { t } = useI18n();
const techniqueLabel = useTechniqueLabel();
const explain = useHintExplanation();
const userValues = ref<number[][]>(createEmptyBoard());
const selectedCell = ref<CellPosition | null>(null);
const selectedDigit = ref<number | null>(null);
const eraseMode = ref(false);
const emptyDigitCounts = Array.from({ length: 10 }, () => 0);

const {
    path,
    start,
    stop,
    stepIndex,
    stepCount,
    currentStep,
    playState,
    next,
    previous,
    goTo,
    togglePlay,
    puzzleCells,
    cellViews,
    links,
} = useWalkthroughPlayback(userValues);

const inPlayback = computed(() => path.value !== null);

const explanation = computed(() =>
    currentStep.value === null ? "" : explain(currentStep.value.step, currentStep.value.candidatesBefore));

// The panel opens over the inputs; keep it on screen when an explanation runs long.
const PANEL_BOTTOM_GAP = 24;
const inputAreaElement = useTemplateRef<HTMLElement>("inputArea");
const { room: roomBelowInputArea, measure: measureRoomBelowInputArea } = useRoomBelow(inputAreaElement, PANEL_BOTTOM_GAP);
watch(inPlayback, (playing) => {
    if (playing) measureRoomBelowInputArea();
});

const conflictsWithPeers = (row: number, column: number, digit: number): boolean => {
    for (let otherColumn = 0; otherColumn < BOARD_SIZE; otherColumn++) {
        if (otherColumn === column) continue;
        if (userValues.value[row][otherColumn] === digit) return true;
    }
    for (let otherRow = 0; otherRow < BOARD_SIZE; otherRow++) {
        if (otherRow === row) continue;
        if (userValues.value[otherRow][column] === digit) return true;
    }
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartColumn = Math.floor(column / 3) * 3;
    for (let boxRow = boxStartRow; boxRow < boxStartRow + 3; boxRow++) {
        for (let boxColumn = boxStartColumn; boxColumn < boxStartColumn + 3; boxColumn++) {
            if (boxRow === row && boxColumn === column) continue;
            if (userValues.value[boxRow][boxColumn] === digit) return true;
        }
    }
    return false;
};

const eraseDisabledForSelectedCell = computed((): boolean => {
    if (selectedCell.value === null) return false;
    const { row, column } = selectedCell.value;
    return userValues.value[row][column] === 0;
});

const invalidDigitsForSelectedCell = computed((): number[] => {
    if (selectedCell.value === null) return [];
    const { row, column } = selectedCell.value;
    const currentValue = userValues.value[row][column];
    const invalid: number[] = [];
    for (let digit = 1; digit <= BOARD_SIZE; digit++) {
        if (digit === currentValue) invalid.push(digit);
        else if (conflictsWithPeers(row, column, digit)) invalid.push(digit);
    }
    return invalid;
});
const testButtonsEnabled = isFeatureEnabled("walkthroughTestButtons");

const loadPreset = (puzzle: number[][]) => {
    selectedCell.value = null;
    selectedDigit.value = null;
    eraseMode.value = false;
    userValues.value = puzzle.map((row) => [...row]);
};

const resetBoard = () => {
    selectedCell.value = null;
    selectedDigit.value = null;
    eraseMode.value = false;
    userValues.value = createEmptyBoard();
};

const toggleEraseMode = () => {
    if (selectedCell.value !== null) {
        const { row, column } = selectedCell.value;
        userValues.value[row][column] = 0;
        selectedCell.value = null;
        return;
    }
    if (!eraseMode.value) {
        selectedDigit.value = null;
    }
    eraseMode.value = !eraseMode.value;
};

const runSolver = () => {
    selectedCell.value = null;
    start(buildSolvePath(userValues.value));
};

const goBack = () => {
    if (inPlayback.value) {
        stop();
        return;
    }
    void router.push(ROUTER_PATH.home);
};

const tryFillCell = (row: number, column: number, digit: number) => {
    if (!conflictsWithPeers(row, column, digit)) {
        userValues.value[row][column] = digit;
    }
};

const selectCell = (row: number, column: number) => {
    if (inPlayback.value) return;
    if (eraseMode.value) {
        userValues.value[row][column] = 0;
        return;
    }
    if (selectedDigit.value !== null) {
        tryFillCell(row, column, selectedDigit.value);
        return;
    }
    if (isSelectedCell(row, column)) {
        selectedCell.value = null;
        return;
    }
    selectedCell.value = { row, column };
};

const isSelectedCell = (row: number, column: number): boolean => {
    const selected = selectedCell.value;
    return selected !== null && selected.row === row && selected.column === column;
};

const pickDigit = (digit: number) => {
    eraseMode.value = false;
    if (selectedCell.value !== null) {
        const { row, column } = selectedCell.value;
        tryFillCell(row, column, digit);
        selectedCell.value = null;
        return;
    }
    selectedDigit.value = selectedDigit.value === digit ? null : digit;
};
</script>

<style scoped>
.walkthrough-overlay-enter-active {
    transition: opacity 220ms ease, transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.walkthrough-overlay-leave-active {
    transition: opacity 150ms ease, transform 200ms ease;
}

.walkthrough-overlay-enter-from,
.walkthrough-overlay-leave-to {
    opacity: 0;
    transform: translateY(16px);
}
</style>
