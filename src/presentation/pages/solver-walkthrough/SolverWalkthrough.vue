<template>
    <div class="flex flex-col gap-2 h-dvh py-6 px-5">
        <div class="flex-1" />
        <div class="flex flex-col items-center gap-6">
            <div class="bg-card rounded-2xl shadow-card-lg p-2 w-full">
                <div class="flex flex-col border-3 border-foreground/20 rounded-xl">
                    <div
                        v-for="(rowValues, rowIndex) in values"
                        :key="`row-${rowIndex}`"
                        class="flex"
                    >
                        <SolverBoardCell
                            v-for="(digit, columnIndex) in rowValues"
                            :key="`cell-${rowIndex}-${columnIndex}`"
                            :column="columnIndex"
                            :data-testid="`solver-cell-${rowIndex}-${columnIndex}`"
                            :row="rowIndex"
                            :selected="isSelectedCell(rowIndex, columnIndex)"
                            :value="digit"
                            @click="selectCell(rowIndex, columnIndex)"
                        />
                    </div>
                </div>
            </div>
            <DigitPad
                :digit-counts="emptyDigitCounts"
                :erase-active="false"
                :selected-digit="null"
                :show-remaining-count="false"
                @select-digit="fillDigit"
                @toggle-erase-mode="() => {}"
            />
        </div>
        <div class="flex-1" />
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import DigitPad from "@/presentation/pages/game/components/DigitPad.vue";
import SolverBoardCell from "@/presentation/pages/solver-walkthrough/components/SolverBoardCell.vue";

interface CellPosition {
    row: number;
    column: number;
}

const createEmptyBoard = (): number[][] =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

const values = ref<number[][]>(createEmptyBoard());
const selectedCell = ref<CellPosition | null>(null);
const emptyDigitCounts = Array.from({ length: 10 }, () => 0);

const selectCell = (row: number, column: number) => {
    selectedCell.value = { row, column };
};

const isSelectedCell = (row: number, column: number): boolean => {
    const selected = selectedCell.value;
    return selected !== null && selected.row === row && selected.column === column;
};

const fillDigit = (digit: number) => {
    if (!selectedCell.value) return;
    const { row, column } = selectedCell.value;
    const nextValues = values.value.map((rowValues) => [...rowValues]);
    nextValues[row][column] = digit;
    values.value = nextValues;
};
</script>
