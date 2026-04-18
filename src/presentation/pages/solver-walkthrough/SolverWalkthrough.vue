<template>
    <div class="flex flex-col gap-4 p-4">
        <div class="grid grid-cols-9">
            <div
                v-for="row in 9"
                :key="`row-${row}`"
                class="contents"
            >
                <div
                    v-for="column in 9"
                    :key="`cell-${row}-${column}`"
                    :data-testid="`solver-cell-${row - 1}-${column - 1}`"
                    :class="[
                        'aspect-square flex items-center justify-center border cursor-pointer',
                        isSelectedCell(row - 1, column - 1) ? 'bg-highlight' : '',
                    ]"
                    @click="selectCell(row - 1, column - 1)"
                >
                    {{ values[row - 1][column - 1] === 0 ? "" : values[row - 1][column - 1] }}
                </div>
            </div>
        </div>
        <DigitPad
            :selected-digit="null"
            :erase-active="false"
            :digit-counts="emptyDigitCounts"
            :show-remaining-count="false"
            @select-digit="fillDigit"
            @toggle-erase-mode="() => {}"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import DigitPad from "@/presentation/pages/game/components/DigitPad.vue";

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
