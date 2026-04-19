<template>
    <div class="flex flex-col gap-2 h-dvh py-6 px-5">
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
                    Back
                </span>
            </button>
            <span class="text-foreground text-lg font-semibold">
                Walkthrough
            </span>
            <div class="w-[72px]" />
        </div>
        <div class="flex-1" />
        <div class="flex flex-col items-center gap-6">
            <div
                :class="[
                    'bg-card rounded-2xl shadow-card-lg p-2 w-full',
                    solveResult !== null ? 'pointer-events-none' : '',
                ]"
            >
                <div class="flex flex-col border-3 border-foreground/20 rounded-xl">
                    <div
                        v-for="rowIndex in BOARD_SIZE"
                        :key="`row-${rowIndex - 1}`"
                        class="flex"
                    >
                        <BoardCell
                            v-for="columnIndex in BOARD_SIZE"
                            :key="`cell-${rowIndex - 1}-${columnIndex - 1}`"
                            :column="columnIndex - 1"
                            :data-testid="`solver-cell-${rowIndex - 1}-${columnIndex - 1}`"
                            :eliminated-digits="eliminatedDigitsAt(rowIndex - 1, columnIndex - 1)"
                            :notes="preStepState.candidatesOf(rowIndex - 1, columnIndex - 1)"
                            :row="rowIndex - 1"
                            :value="displayState.valueAt(rowIndex - 1, columnIndex - 1)"
                            :variant="cellVariant(rowIndex - 1, columnIndex - 1)"
                            class="cursor-pointer"
                            @click="selectCell(rowIndex - 1, columnIndex - 1)"
                        />
                    </div>
                </div>
            </div>
            <DigitPad
                v-if="solveResult === null"
                :digit-counts="emptyDigitCounts"
                :disabled-digits="invalidDigitsForSelectedCell"
                :erase-active="eraseMode"
                :selected-digit="selectedDigit"
                :show-remaining-count="false"
                @select-digit="pickDigit"
                @toggle-erase-mode="toggleEraseMode"
            />
            <button
                v-if="solveResult === null"
                class="px-6 py-3 bg-primary text-white rounded-2xl font-semibold cursor-pointer shadow-primary-active"
                data-testid="solve-button"
                @click="runSolver"
            >
                Solve
            </button>
            <div
                v-if="solveResult === null && testButtonsEnabled"
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
            <div
                v-else
                class="flex flex-col items-center gap-3 w-full"
            >
                <div
                    class="bg-card rounded-lg py-2.5 px-4 shadow-card-sm min-h-9 flex items-center w-full"
                    data-testid="step-description"
                >
                    <span class="text-sm text-foreground-muted">{{ stepDescription }}</span>
                </div>
                <ProgressBar
                    :current-step="currentStep"
                    :total-steps="totalSteps"
                    :play-state="playState"
                    @seek="goToStep"
                />
                <PlaybackControls
                    :is-playing="isPlaying"
                    @first="jumpToFirst"
                    @prev="reverseStep"
                    @toggle-play="togglePlay"
                    @next="advanceStep"
                    @last="jumpToLast"
                />
                <button
                    class="px-6 py-2 bg-card rounded-xl font-semibold cursor-pointer shadow-card-sm"
                    data-testid="edit-button"
                    @click="returnToEdit"
                >
                    Edit
                </button>
            </div>
        </div>
        <div class="flex-1" />
    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft } from "lucide-vue-next";
import PlaybackControls from "@/presentation/components/playback/PlaybackControls.vue";
import { ROUTER_PATH } from "@/router";
import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { TechniqueSolver, type SolveResult } from "@/domain/solver/TechniqueSolver";
import type { TechniqueId } from "@/domain/solver/SolveStep";
import DigitPad from "@/presentation/pages/game/components/DigitPad.vue";
import BoardCell, { type CellVariant } from "@/presentation/components/board-cell/BoardCell.vue";
import ProgressBar from "@/presentation/components/playback/ProgressBar.vue";
import { TEST_PUZZLE_PRESETS } from "@/presentation/pages/solver-walkthrough/testPuzzles";
import { usePlaybackState } from "@/presentation/components/playback/usePlaybackState";
import { isFeatureEnabled } from "@/utils/featureToggle";

interface CellPosition {
    row: number;
    column: number;
}

const createEmptyBoard = (): number[][] =>
    Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 0));

const router = useRouter();
const userValues = ref<number[][]>(createEmptyBoard());
const state = computed(() => BoardState.fromPuzzle(userValues.value));
const selectedCell = ref<CellPosition | null>(null);
const selectedDigit = ref<number | null>(null);
const eraseMode = ref(false);
const solveResult = ref<SolveResult | null>(null);
const techniqueSolver = new TechniqueSolver();
const emptyDigitCounts = Array.from({ length: 10 }, () => 0);

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

const totalSteps = computed(() => solveResult.value?.steps.length ?? 0);

const {
    currentStep,
    isPlaying,
    next: advanceStep,
    previous: reverseStep,
    goToFirst: jumpToFirst,
    goToLast: jumpToLast,
    goToStep,
    togglePlay,
    startPlay,
    stopPlay,
} = usePlaybackState(totalSteps);

const playState = { isPlaying, stopPlay, startPlay };

const TECHNIQUE_LABELS: Record<TechniqueId, string> = {
    nakedSingle: "Naked Single",
    hiddenSingle: "Hidden Single",
    nakedPair: "Naked Pair",
    nakedTriple: "Naked Triple",
    nakedQuad: "Naked Quad",
    hiddenPair: "Hidden Pair",
    hiddenTriple: "Hidden Triple",
    hiddenQuad: "Hidden Quad",
    pointing: "Pointing",
    claiming: "Claiming",
};

const stepDescription = computed(() => {
    if (solveResult.value === null) return "";
    if (currentStep.value === 0) return "Initial board";
    const step = solveResult.value.steps[currentStep.value - 1];
    const label = TECHNIQUE_LABELS[step.technique];
    if (step.assignments.length > 0) {
        const { cell, digit } = step.assignments[0];
        return `${label}: Row ${cell.row + 1}, Col ${cell.column + 1} = ${digit}`;
    }
    const eliminationCount = step.eliminations.length;
    return `${label}: ${eliminationCount} elimination${eliminationCount === 1 ? "" : "s"}`;
});

const currentStepFocus = computed(() => {
    if (solveResult.value === null || currentStep.value === 0) return [];
    return solveResult.value.steps[currentStep.value - 1].focus;
});

const currentStepScopeCellKeys = computed(() => {
    const keys = new Set<string>();
    if (solveResult.value === null || currentStep.value === 0) return keys;
    const scopes = solveResult.value.steps[currentStep.value - 1].scopes;
    for (const scope of scopes) {
        if (scope.kind === "row") {
            for (let column = 0; column < BOARD_SIZE; column++) keys.add(`${scope.row}-${column}`);
        } else if (scope.kind === "column") {
            for (let row = 0; row < BOARD_SIZE; row++) keys.add(`${row}-${scope.column}`);
        } else {
            for (let row = scope.boxRow; row < scope.boxRow + 3; row++) {
                for (let column = scope.boxColumn; column < scope.boxColumn + 3; column++) {
                    keys.add(`${row}-${column}`);
                }
            }
        }
    }
    return keys;
});

const eliminatedDigitsAt = (row: number, column: number): number[] => {
    const preCandidates = preStepState.value.candidatesOf(row, column);
    const postCandidates = displayState.value.candidatesOf(row, column);
    return preCandidates.filter((digit) => !postCandidates.includes(digit));
};

const cellVariant = (row: number, column: number): CellVariant => {
    if (currentStepFocus.value.some((c) => c.row === row && c.column === column)) return "focus";
    if (currentStepScopeCellKeys.value.has(`${row}-${column}`)) return "scope";
    if (isSelectedCell(row, column)) return "selected";
    return "default";
};

const preStepState = computed(() => {
    const baseState = BoardState.fromPuzzle(userValues.value);
    if (solveResult.value === null || currentStep.value === 0) return baseState;
    let currentState = baseState;
    for (let stepIndex = 0; stepIndex < currentStep.value - 1; stepIndex++) {
        const step = solveResult.value.steps[stepIndex];
        for (const assignment of step.assignments) {
            currentState = currentState.assign(assignment.cell.row, assignment.cell.column, assignment.digit);
        }
        for (const elimination of step.eliminations) {
            currentState = currentState.eliminate(elimination.cell.row, elimination.cell.column, elimination.digit);
        }
    }
    return currentState;
});

const displayState = computed(() => {
    if (solveResult.value === null || currentStep.value === 0) return preStepState.value;
    const step = solveResult.value.steps[currentStep.value - 1];
    let currentState = preStepState.value;
    for (const assignment of step.assignments) {
        currentState = currentState.assign(assignment.cell.row, assignment.cell.column, assignment.digit);
    }
    for (const elimination of step.eliminations) {
        currentState = currentState.eliminate(elimination.cell.row, elimination.cell.column, elimination.digit);
    }
    return currentState;
});

const returnToEdit = () => {
    stopPlay();
    solveResult.value = null;
    jumpToFirst();
};

const loadPreset = (puzzle: number[][]) => {
    selectedCell.value = null;
    selectedDigit.value = null;
    eraseMode.value = false;
    userValues.value = puzzle.map((row) => [...row]);
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
    solveResult.value = techniqueSolver.solveWithTechniques(state.value);
    jumpToFirst();
};

const goBack = () => {
    void router.push(ROUTER_PATH.home);
};

const tryFillCell = (row: number, column: number, digit: number) => {
    if (!conflictsWithPeers(row, column, digit)) {
        userValues.value[row][column] = digit;
    }
};

const selectCell = (row: number, column: number) => {
    if (solveResult.value !== null) return;
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
