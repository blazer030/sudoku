<template>
    <div class="flex flex-col gap-2 min-h-full py-6 px-5">
        <div class="flex items-center justify-between">
            <!-- Stays above the checking loader, so Back can cancel the check. -->
            <button
                :class="checking ? 'relative z-60' : ''"
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
                    :inert="overlayShown || checking || undefined"
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
                            :disabled="checking"
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
        <PuzzleLoader
            :message="t('walkthrough.checking')"
            :visible="puzzleLoader.visible.value"
        />
    </div>
</template>

<script lang="ts" setup>
import { computed, inject, nextTick, onBeforeUnmount, ref, useTemplateRef, watch, type Component } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ChevronLeft, Info, ListFilter, Pencil, PencilLine, RotateCcw, Trophy, Wand2 } from "lucide-vue-next";
import { ROUTER_PATH } from "@/router";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";
import { BOARD_SIZE } from "@/domain/board/constants";
import { UNKNOWN_SOLUTION_COUNT } from "@/domain/generator/SudokuSolver";
import { checkPuzzleAsync } from "@/application/puzzleCheck/PuzzleCheckService";
import type { PuzzleCheck } from "@/application/puzzleCheck/checkPuzzle";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";
import { usePuzzleLoader } from "@/presentation/components/puzzle-loader/usePuzzleLoader";
import { useTechniqueLabel } from "@/presentation/i18n/techniqueLabels";
import Cell from "@/presentation/components/board-cell/Cell.vue";
import DigitPad from "@/presentation/components/digit-pad/DigitPad.vue";
import StepLinkOverlay from "@/presentation/components/step-presentation/StepLinkOverlay.vue";
import StepPlaybackPanel from "@/presentation/components/step-presentation/StepPlaybackPanel.vue";
import StepTag from "@/presentation/components/step-presentation/StepTag.vue";
import { useHintExplanation } from "@/presentation/components/step-presentation/useHintExplanation";
import { useRoomBelow } from "@/presentation/composables/useRoomBelow";
import { panelLift } from "@/presentation/components/step-presentation/panelLift";
import { useWalkthroughInput } from "@/presentation/pages/solver-walkthrough/useWalkthroughInput";
import { useWalkthroughPlayback } from "@/presentation/pages/solver-walkthrough/useWalkthroughPlayback";
import { provideWalkthroughDialog } from "@/presentation/pages/solver-walkthrough/useWalkthroughDialog";
import WalkthroughDialog from "@/presentation/pages/solver-walkthrough/WalkthroughDialog.vue";
import { vPress } from "@/presentation/directives/press";
import { SAMPLE_PUZZLES, isSamplePuzzle } from "@/presentation/pages/solver-walkthrough/samplePuzzles";
import { useDifficultyLabel } from "@/presentation/i18n/difficultyLabels";

const props = defineProps<{
    /** A puzzle to start from, such as one from the game history; the guide stays closed. */
    initialPuzzle?: number[][];
}>();

const createEmptyBoard = (): number[][] =>
    Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 0));

const router = useRouter();
const analytics = inject(ANALYTICS_KEY);
const { t } = useI18n();
const techniqueLabel = useTechniqueLabel();
const explain = useHintExplanation();
const difficultyLabel = useDifficultyLabel();
const userValues = ref<number[][]>(props.initialPuzzle?.map((rowValues) => [...rowValues]) ?? createEmptyBoard());
// The guide covers the inputs until the player picks a way in.
const introOpen = ref(props.initialPuzzle === undefined);
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
    isLastStep,
    playState,
    next,
    previous,
    goTo,
    togglePlay,
    puzzleCells,
    cellViews,
    links,
} = useWalkthroughPlayback(userValues);

const puzzleLoader = usePuzzleLoader();
// Solving checks the puzzle first, behind the same loader as a new game.
const checking = puzzleLoader.visible;

const inPlayback = computed(() => path.value !== null);
const overlayShown = computed(() => inPlayback.value || introOpen.value);
// Cells take input only while the player is entering a puzzle, not under the guide, while checking, or during playback.
const boardEditable = computed(() => !overlayShown.value && !checking.value);

const {
    selectedCell,
    selectedDigit,
    eraseMode,
    eraseDisabledForSelectedCell,
    invalidDigitsForSelectedCell,
    clearSelection,
    toggleEraseMode,
    isSelectedCell,
    selectCell,
    pickDigit,
} = useWalkthroughInput(userValues, boardEditable);

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

const loadSample = (puzzle: number[][]) => {
    clearSelection();
    userValues.value = puzzle.map((row) => [...row]);
    introOpen.value = false;
};

const enterOwnPuzzle = () => {
    introOpen.value = false;
};

const resetBoard = () => {
    clearSelection();
    userValues.value = createEmptyBoard();
};

const confirmReset = async () => {
    if (await openDialog("reset") !== "confirm") return;
    resetBoard();
    introOpen.value = true;
};

const isCancellation = (error: unknown): boolean => error instanceof DOMException && error.name === "AbortError";

// Checks off the main thread behind the loader; null when Back cancels it.
const checkBehindLoader = async (): Promise<PuzzleCheck | null> => {
    try {
        return await puzzleLoader.runWithLoader((signal) => checkPuzzleAsync(userValues.value, signal));
    } catch (error) {
        if (isCancellation(error)) return null;
        throw error;
    }
};

// No solution stops here; more than one, or a count too costly to settle, asks first.
// The solver then shows what it can, even nothing. Each press that gets an answer is reported once.
const runSolver = async () => {
    if (checking.value) return;
    const source = isSamplePuzzle(userValues.value) ? "sample" : "own";
    const check = await checkBehindLoader();
    if (check === null) return;
    const { solutionCount, path: solvePath } = check;
    if (solutionCount === 0) {
        await openDialog("noSolution");
        void analytics?.logEvent({ name: "walkthrough_solve", result: "no_solution", source });
        return;
    }
    if (solutionCount === UNKNOWN_SOLUTION_COUNT || solutionCount > 1) {
        const result = solutionCount === UNKNOWN_SOLUTION_COUNT ? "unknown_count" : "multiple_solutions";
        const answer = await openDialog(solutionCount === UNKNOWN_SOLUTION_COUNT ? "solutionCountUnknown" : "multipleSolutions");
        const confirmed = answer === "confirm" ? 1 : 0;
        void analytics?.logEvent({ name: "walkthrough_solve", result, confirmed, source });
        if (confirmed === 0) return;
    } else {
        void analytics?.logEvent({ name: "walkthrough_solve", result: "solved", source });
    }
    selectedCell.value = null;
    finishLogged = false;
    start(solvePath);
};

// Reaching the end of a path is reported once per start, however the player steps back and forth.
let finishLogged = false;
watch(isLastStep, (atEnd) => {
    if (!atEnd || finishLogged) return;
    finishLogged = true;
    void analytics?.logEvent({ name: "walkthrough_finish" });
});

// Back, in the app or from the system, cancels a running check and keeps the player editing.
onBeforeRouteLeave(() => {
    if (!checking.value) return true;
    puzzleLoader.cancel();
    return false;
});
onBeforeUnmount(puzzleLoader.cancel);

const goBack = () => {
    if (checking.value) {
        puzzleLoader.cancel();
        return;
    }
    if (inPlayback.value) {
        stop();
        return;
    }
    void router.push(ROUTER_PATH.home);
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
