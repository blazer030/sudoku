<template>
    <div class="flex flex-col gap-4 p-4">
        <div class="flex gap-2">
            <textarea
                v-model="puzzleInput"
                data-testid="puzzle-input"
                class="flex-1 border p-2 rounded"
                placeholder="Paste 81-digit puzzle (0 or . for empty)"
                rows="2"
            />
            <button
                data-testid="load-puzzle-button"
                class="px-4 py-2 border rounded cursor-pointer"
                @click="loadPuzzle"
            >
                Load
            </button>
        </div>
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
                    class="aspect-square flex items-center justify-center border"
                >
                    {{ values[row - 1][column - 1] === 0 ? "" : values[row - 1][column - 1] }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const createEmptyBoard = (): number[][] =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

const puzzleInput = ref("");
const values = ref<number[][]>(createEmptyBoard());

const loadPuzzle = () => {
    const normalized = puzzleInput.value.replace(/\./g, "0").replace(/\s/g, "");
    if (normalized.length !== 81) return;
    const nextValues = createEmptyBoard();
    for (let index = 0; index < 81; index++) {
        const row = Math.floor(index / 9);
        const column = index % 9;
        const digit = Number(normalized[index]);
        nextValues[row][column] = Number.isNaN(digit) ? 0 : digit;
    }
    values.value = nextValues;
};
</script>
