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
            <div class="bg-card rounded-2xl shadow-card-lg p-2 w-full">
                <div class="flex flex-col border-3 border-foreground/20 rounded-xl">
                    <div
                        v-for="rowIndex in BOARD_SIZE"
                        :key="`row-${rowIndex - 1}`"
                        class="flex"
                    >
                        <SolverBoardCell
                            v-for="columnIndex in BOARD_SIZE"
                            :key="`cell-${rowIndex - 1}-${columnIndex - 1}`"
                            :column="columnIndex - 1"
                            :data-testid="`solver-cell-${rowIndex - 1}-${columnIndex - 1}`"
                            :notes="displayState.candidatesOf(rowIndex - 1, columnIndex - 1)"
                            :row="rowIndex - 1"
                            :selected="isSelectedCell(rowIndex - 1, columnIndex - 1)"
                            :value="displayState.valueAt(rowIndex - 1, columnIndex - 1)"
                            @click="selectCell(rowIndex - 1, columnIndex - 1)"
                        />
                    </div>
                </div>
            </div>
            <DigitPad
                :digit-counts="emptyDigitCounts"
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
                v-else
                class="flex gap-2"
            >
                <button
                    class="px-4 py-2 bg-card rounded-xl font-semibold cursor-pointer shadow-card-sm"
                    data-testid="first-step-button"
                    @click="jumpToFirst"
                >
                    First
                </button>
                <button
                    class="px-4 py-2 bg-card rounded-xl font-semibold cursor-pointer shadow-card-sm"
                    data-testid="prev-step-button"
                    @click="reverseStep"
                >
                    Prev
                </button>
                <button
                    class="px-4 py-2 bg-card rounded-xl font-semibold cursor-pointer shadow-card-sm"
                    data-testid="next-step-button"
                    @click="advanceStep"
                >
                    Next
                </button>
                <button
                    class="px-4 py-2 bg-card rounded-xl font-semibold cursor-pointer shadow-card-sm"
                    data-testid="last-step-button"
                    @click="jumpToLast"
                >
                    Last
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
import { ROUTER_PATH } from "@/router";
import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { TechniqueSolver, type SolveResult } from "@/domain/solver/TechniqueSolver";
import DigitPad from "@/presentation/pages/game/components/DigitPad.vue";
import SolverBoardCell from "@/presentation/pages/solver-walkthrough/components/SolverBoardCell.vue";

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
const currentStepIndex = ref(-1);
const techniqueSolver = new TechniqueSolver();
const emptyDigitCounts = Array.from({ length: 10 }, () => 0);

const displayState = computed(() => {
    const baseState = BoardState.fromPuzzle(userValues.value);
    if (solveResult.value === null || currentStepIndex.value < 0) {
        return baseState;
    }
    let currentState = baseState;
    for (let stepIndex = 0; stepIndex <= currentStepIndex.value; stepIndex++) {
        for (const assignment of solveResult.value.steps[stepIndex].assignments) {
            currentState = currentState.assign(assignment.cell.row, assignment.cell.column, assignment.digit);
        }
    }
    return currentState;
});

const advanceStep = () => {
    if (solveResult.value === null) return;
    const lastIndex = solveResult.value.steps.length - 1;
    if (currentStepIndex.value < lastIndex) {
        currentStepIndex.value += 1;
    }
};

const reverseStep = () => {
    if (currentStepIndex.value >= 0) {
        currentStepIndex.value -= 1;
    }
};

const jumpToFirst = () => {
    currentStepIndex.value = -1;
};

const jumpToLast = () => {
    if (solveResult.value === null) return;
    currentStepIndex.value = solveResult.value.steps.length - 1;
};

const toggleEraseMode = () => {
    eraseMode.value = !eraseMode.value;
};

const runSolver = () => {
    solveResult.value = techniqueSolver.solveWithTechniques(state.value);
    currentStepIndex.value = -1;
};

const goBack = () => {
    void router.push(ROUTER_PATH.home);
};

const tryFillCell = (row: number, column: number, digit: number) => {
    if (state.value.candidatesOf(row, column).includes(digit)) {
        userValues.value[row][column] = digit;
    }
};

const selectCell = (row: number, column: number) => {
    if (eraseMode.value) {
        userValues.value[row][column] = 0;
        return;
    }
    if (selectedDigit.value !== null) {
        tryFillCell(row, column, selectedDigit.value);
        return;
    }
    selectedCell.value = { row, column };
};

const isSelectedCell = (row: number, column: number): boolean => {
    const selected = selectedCell.value;
    return selected !== null && selected.row === row && selected.column === column;
};

const pickDigit = (digit: number) => {
    if (selectedCell.value !== null) {
        const { row, column } = selectedCell.value;
        tryFillCell(row, column, digit);
        return;
    }
    selectedDigit.value = selectedDigit.value === digit ? null : digit;
};
</script>
