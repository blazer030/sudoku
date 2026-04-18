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
                            :row="rowIndex - 1"
                            :selected="isSelectedCell(rowIndex - 1, columnIndex - 1)"
                            :value="state.valueAt(rowIndex - 1, columnIndex - 1)"
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
const emptyDigitCounts = Array.from({ length: 10 }, () => 0);

const toggleEraseMode = () => {
    eraseMode.value = !eraseMode.value;
};

const goBack = () => {
    void router.push(ROUTER_PATH.home);
};

const selectCell = (row: number, column: number) => {
    if (selectedDigit.value !== null) {
        userValues.value[row][column] = selectedDigit.value;
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
        userValues.value[row][column] = digit;
        return;
    }
    selectedDigit.value = selectedDigit.value === digit ? null : digit;
};
</script>
