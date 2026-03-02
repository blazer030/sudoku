<template>
  <div>
    <div class="p-4 text-center">
      This is Navbar
    </div>
    <div class="my-9">
      <div
        v-for="(row, rowIndex) in puzzle"
        :key="rowIndex"
        :class="[
          rowIndex % 3 !== 0 ? 'border-t-2' : '',
          rowIndex === 8 ? 'border-b-2' : '',
          rowIndex === 0 ? 'border-t-4' : '',
          rowIndex % 3 === 2 ? 'border-b-4' : '',
        ]"
        class="flex border-sky-200"
      >
        <Cell
          v-for="(puzzleCell, columnIndex) in row"
          :key="`cell-${rowIndex}-${columnIndex}`"
          :data-testid="`cell-${rowIndex}-${columnIndex}`"
          :puzzle-cell="puzzleCell"
          :selected="isSelected(rowIndex, columnIndex)"
          :conflict="isConflict(rowIndex, columnIndex)"
          :class="[
            columnIndex % 3 !== 0 ? 'border-l-2' : '',
            columnIndex === 8 ? 'border-r-2' : '',
            columnIndex === 0 ? 'border-l-4' : '',
            columnIndex % 3 === 2 ? 'border-r-4' : '',
          ]"
          class="border-sky-200"
          @click="clickCell(rowIndex, columnIndex)"
        />
      </div>
    </div>
    <div
      v-if="completed"
      class="text-center text-2xl font-bold text-green-600 my-4"
    >
      Completed
    </div>
    <div class="flex justify-center px-4 gap-2 mb-4">
      <Button variant="outline">
        Undo
      </Button>
      <Button variant="outline">
        Erase
      </Button>
      <Button variant="outline">
        Note
      </Button>
    </div>
    <div class="flex px-4 gap-2">
      <div
        v-for="number in 9"
        :key="`num-${number}`"
        class="flex-1 aspect-square"
      >
        <Button
          :data-testid="`number-${number}`"
          :selected="selectedNumber === number"
          class="w-full h-full text-2xl rounded-full"
          variant="outline"
          @click="inputNumber(number)"
        >
          {{ number }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import Sudoku from "@/domain/Sudoku";
import Button from "@/presentation/components/ui/button/Button.vue";
import Cell from "@/presentation/components/cell/Cell.vue";

const sudoku = reactive(new Sudoku());
const puzzle = sudoku.generate();

const selectedCell = ref<{ row: number; column: number } | null>(null);
const selectedNumber = ref<number | null>(null);
const conflicts = ref<{ row: number; column: number }[]>([]);
const completed = ref(false);

function clickCell(row: number, column: number) {
    if (selectedNumber.value !== null) {
        inputToCell(row, column, selectedNumber.value);
        return;
    }
    toggleSelectCell(row, column);
}

function inputToCell(row: number, column: number, value: number) {
    if (puzzle[row][column].isClue) return;
    if (puzzle[row][column].input === value) {
        sudoku.input(row, column, 0);
        conflicts.value = [];
        return;
    }
    sudoku.input(row, column, value);
    conflicts.value = sudoku.findConflicts(row, column, value);
    if (sudoku.isCompleted()) completed.value = true;
}

function toggleSelectCell(row: number, column: number) {
    if (puzzle[row][column].isClue) return;
    if (isSelected(row, column)) {
        selectedCell.value = null;
        return;
    }
    selectedCell.value = { row, column };
}

function isSelected(row: number, column: number) {
    if (selectedCell.value === null) return false;
    if (selectedCell.value.row !== row) return false;
    return selectedCell.value.column === column;
}

function isConflict(row: number, column: number) {
    return conflicts.value.some(c => c.row === row && c.column === column);
}

function inputNumber(value: number) {
    if (selectedCell.value) {
        inputToCell(selectedCell.value.row, selectedCell.value.column, value);
        return;
    }
    selectedNumber.value = selectedNumber.value === value ? null : value;
}
</script>
