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
                data-skin="board"
                :class="boardEditable ? '' : 'pointer-events-none'"
                class="bg-card rounded-2xl shadow-card-lg p-2 self-center w-[calc(100%+1.5rem)] max-w-board-fit"
                data-testid="walkthrough-board"
            >
                <div class="relative flex flex-col border-3 border-foreground/20 rounded-xl">
                    <div
                        v-for="(row, rowIndex) in puzzleCells"
                        :key="`row-${rowIndex}`"
                        :data-testid="`solver-row-${rowIndex}`"
                        class="grid grid-cols-9"
                    >
                        <Cell
                            v-for="(puzzleCell, columnIndex) in row"
                            :key="`cell-${rowIndex}-${columnIndex}`"
                            :column="columnIndex"
                            :data-testid="`solver-cell-${rowIndex}-${columnIndex}`"
                            :hint="cellViews?.[rowIndex][columnIndex] ?? null"
                            :interactive="boardEditable"
                            :puzzle-cell="puzzleCell"
                            :row="rowIndex"
                            :selected="boardEditable && isSelectedCell(rowIndex, columnIndex)"
                            :selected-digit="boardEditable ? selectedDigit : null"
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
                    :class="overlayShown ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'"
                    :inert="overlayShown || undefined"
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
                    <div class="flex gap-3 w-full">
                        <button
                            v-press
                            :disabled="isBoardEmpty"
                            class="h-12 px-4 flex items-center gap-2 rounded-2xl text-foreground-secondary font-medium cursor-pointer transition-all duration-200 hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-default"
                            data-testid="reset-button"
                            @click="confirmReset"
                        >
                            <RotateCcw :size="18" />
                            {{ t("walkthrough.reset") }}
                        </button>
                        <button
                            v-press
                            data-skin="button"
                            class="flex-1 h-12 bg-primary text-on-primary rounded-2xl font-semibold cursor-pointer shadow-primary transition-all duration-200 hover:bg-primary-hover hover:shadow-primary-lg"
                            data-testid="solve-button"
                            @click="runSolver"
                        >
                            {{ t("walkthrough.solve") }}
                        </button>
                    </div>
                </div>

                <Transition name="walkthrough-overlay">
                    <div
                        v-if="introOpen && !inPlayback"
                        ref="introPosition"
                        :style="{ top: `${-introLift}px` }"
                        class="absolute inset-x-0 z-10"
                        data-testid="walkthrough-intro-position"
                    >
                        <!-- On short screens the guide rises over the empty board, so its actions stay on screen. -->
                        <section
                            :aria-label="t('home.walkthrough')"
                            :style="introMaxHeight === null ? undefined : { maxHeight: `${introMaxHeight}px` }"
                            class="bg-card rounded-2xl shadow-card-lg p-4 w-full flex flex-col gap-4 overflow-y-auto"
                            data-testid="walkthrough-intro"
                        >
                            <div class="flex items-start gap-3">
                                <span class="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                                    <Wand2 :size="20" />
                                </span>
                                <p class="text-[15px] leading-snug text-foreground">
                                    {{ t("walkthrough.intro.description") }}
                                </p>
                            </div>
                            <button
                                v-press
                                data-skin="button"
                                class="w-full h-12 shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-primary text-on-primary font-semibold cursor-pointer shadow-primary transition-all duration-200 hover:bg-primary-hover"
                                data-testid="walkthrough-enter-own"
                                @click="enterOwnPuzzle"
                            >
                                <Pencil :size="18" />
                                {{ t("walkthrough.intro.enterOwn") }}
                            </button>
                            <div class="flex flex-col gap-2">
                                <span class="text-[13px] font-semibold text-foreground-secondary">
                                    {{ t("walkthrough.intro.samples") }}
                                </span>
                                <div class="grid grid-cols-3 gap-2">
                                    <button
                                        v-for="sample in SAMPLE_PUZZLES"
                                        :key="sample.id"
                                        v-press
                                        data-skin="button"
                                        :data-testid="`load-sample-${sample.id}`"
                                        class="h-11 rounded-xl bg-primary-light text-primary font-semibold cursor-pointer transition-all duration-200"
                                        @click="loadSample(sample.puzzle)"
                                    >
                                        {{ difficultyLabel(sample.id) }}
                                    </button>
                                </div>
                            </div>
                            <p
                                class="flex items-start gap-2 text-[13px] leading-snug text-foreground-secondary"
                                data-testid="walkthrough-intro-caveat"
                            >
                                <Info
                                    :size="16"
                                    class="shrink-0 mt-px"
                                />
                                <span>{{ t("walkthrough.intro.caveat") }}</span>
                            </p>
                        </section>
                    </div>
                </Transition>

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
                                    v-if="tag"
                                    :icon="tag.icon"
                                    :label="tag.label"
                                    :step-key="stepIndex"
                                    :strong="tag.strong"
                                    :test-id="tag.testId"
                                />
                            </template>
                            {{ explanation }}
                        </StepPlaybackPanel>
                    </div>
                </Transition>
            </div>
        </div>
        <div class="flex-1" />

        <WalkthroughDialog />
    </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, useTemplateRef, watch, type Component } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ChevronLeft, Info, ListFilter, Pencil, PencilLine, RotateCcw, Trophy, Wand2 } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import { BOARD_SIZE } from "@/domain/board/constants";
import { SudokuSolver, UNKNOWN_SOLUTION_COUNT } from "@/domain/generator/SudokuSolver";
import { buildSolvePath } from "@/domain/solver/SolvePath";
import { useTechniqueLabel } from "@/presentation/labels/techniqueLabels";
import Cell from "@/presentation/pages/game/components/Cell.vue";
import DigitPad from "@/presentation/pages/game/components/DigitPad.vue";
import StepLinkOverlay from "@/presentation/components/step-presentation/StepLinkOverlay.vue";
import StepPlaybackPanel from "@/presentation/components/step-presentation/StepPlaybackPanel.vue";
import StepTag from "@/presentation/components/step-presentation/StepTag.vue";
import { useHintExplanation } from "@/presentation/pages/game/hint-mode/useHintExplanation";
import { useRoomBelow } from "@/presentation/pages/game/hint-mode/useRoomBelow";
import { panelLift } from "@/presentation/pages/game/hint-mode/panelLift";
import { useWalkthroughPlayback } from "@/presentation/pages/solver-walkthrough/useWalkthroughPlayback";
import { provideWalkthroughDialog } from "@/presentation/pages/solver-walkthrough/useWalkthroughDialog";
import WalkthroughDialog from "@/presentation/pages/solver-walkthrough/WalkthroughDialog.vue";
import { vPress } from "@/presentation/directives/press";
import { SAMPLE_PUZZLES } from "@/presentation/pages/solver-walkthrough/samplePuzzles";
import { useDifficultyLabel } from "@/presentation/labels/difficultyLabels";

const props = defineProps<{
    /** A puzzle to start from, such as one from the game history; the guide stays closed. */
    initialPuzzle?: number[][];
}>();

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
const difficultyLabel = useDifficultyLabel();
const userValues = ref<number[][]>(props.initialPuzzle?.map((rowValues) => [...rowValues]) ?? createEmptyBoard());
// The guide covers the inputs until the player picks a way in.
const introOpen = ref(props.initialPuzzle === undefined);
const selectedCell = ref<CellPosition | null>(null);
const selectedDigit = ref<number | null>(null);
const eraseMode = ref(false);
const emptyDigitCounts = Array.from({ length: 10 }, () => 0);
const { open: openDialog } = provideWalkthroughDialog();

const isBoardEmpty = computed(() => userValues.value.every((rowValues) => rowValues.every((value) => value === 0)));

const {
    path,
    start,
    stop,
    stepIndex,
    stepCount,
    currentStep,
    isCompleted,
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
const overlayShown = computed(() => inPlayback.value || introOpen.value);
// Cells take input only while the player is entering a puzzle, not under the guide or during playback.
const boardEditable = computed(() => !overlayShown.value);

// A solver step names its technique; the solved board, which ends a path that solves, gets a stage tag
const tag = computed((): { label: string; icon: Component; strong: boolean; testId: string } | null => {
    if (isCompleted.value) return { label: t("walkthrough.stages.completed"), icon: Trophy, strong: true, testId: "walkthrough-stage" };
    const current = currentStep.value;
    if (current === null) return null;
    const assigns = current.step.assignments.length > 0;
    return { label: techniqueLabel(current.step.technique), icon: assigns ? PencilLine : ListFilter, strong: assigns, testId: "walkthrough-technique" };
});

const explanation = computed(() => {
    if (isCompleted.value) return t("walkthrough.completed");
    return currentStep.value === null ? "" : explain(currentStep.value.step, currentStep.value.candidatesBefore);
});

// The panel opens over the inputs; keep it on screen when an explanation runs long.
const PANEL_BOTTOM_GAP = 24;
const inputAreaElement = useTemplateRef<HTMLElement>("inputArea");
const { room: roomBelowInputArea, measure: measureRoomBelowInputArea } = useRoomBelow(inputAreaElement, PANEL_BOTTOM_GAP);
watch(inPlayback, (playing) => {
    if (playing) measureRoomBelowInputArea();
});

const introPosition = useTemplateRef<HTMLElement>("introPosition");
const introLift = ref(0);
const introMaxHeight = computed(() =>
    roomBelowInputArea.value === null ? null : roomBelowInputArea.value + introLift.value);

const measureIntroLift = () => {
    const intro = introPosition.value?.querySelector<HTMLElement>("[data-testid='walkthrough-intro']");
    if (!intro || roomBelowInputArea.value === null) {
        introLift.value = 0;
        return;
    }
    introLift.value = panelLift(roomBelowInputArea.value, intro.scrollHeight);
};

watch([introOpen, inPlayback, roomBelowInputArea], () => { void nextTick(measureIntroLift); }, { immediate: true });

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
const loadSample = (puzzle: number[][]) => {
    selectedCell.value = null;
    selectedDigit.value = null;
    eraseMode.value = false;
    userValues.value = puzzle.map((row) => [...row]);
    introOpen.value = false;
};

const enterOwnPuzzle = () => {
    introOpen.value = false;
};

const resetBoard = () => {
    selectedCell.value = null;
    selectedDigit.value = null;
    eraseMode.value = false;
    userValues.value = createEmptyBoard();
};

const confirmReset = async () => {
    if (await openDialog("reset") !== "confirm") return;
    resetBoard();
    introOpen.value = true;
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

const solutionCounter = new SudokuSolver();
// Bounds the check to roughly a tenth of a second on a desktop; a board it can't settle in time gets a warning.
const SOLUTION_COUNT_NODE_BUDGET = 40000;

// No solution stops here; more than one, or a count too costly to settle, asks first.
// The solver then shows what it can, even nothing.
const runSolver = async () => {
    const values = userValues.value;
    const solutionCount = solutionCounter.countSolutions(values, 2, { maxNodes: SOLUTION_COUNT_NODE_BUDGET });
    if (solutionCount === 0) {
        await openDialog("noSolution");
        return;
    }
    if (solutionCount === UNKNOWN_SOLUTION_COUNT) {
        if (await openDialog("solutionCountUnknown") !== "confirm") return;
    } else if (solutionCount > 1 && await openDialog("multipleSolutions") !== "confirm") return;
    selectedCell.value = null;
    start(buildSolvePath(values));
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
    if (!boardEditable.value) return;
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
