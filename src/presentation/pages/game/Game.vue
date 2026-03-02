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
        <div
            v-for="(puzzleCell, columnIndex) in row"
            :key="`cell-${rowIndex}-${columnIndex}`"
            :data-testid="`cell-${rowIndex}-${columnIndex}`"
            :class="[
            columnIndex % 3 !== 0 ? 'border-l-2' : '',
            columnIndex === 8 ? 'border-r-2' : '',
            columnIndex === 0 ? 'border-l-4' : '',
            columnIndex % 3 === 2 ? 'border-r-4' : '',
          ]"
            class="flex justify-center items-center flex-1 aspect-square border-sky-200"
        >
          <div
              v-if="puzzleCell.isTip"
              class="text-black text-2xl"
          >
            {{ puzzleCell.value }}
          </div>
          <div
              v-else-if="puzzleCell.isEntered"
              class="text-sky-200 text-2xl"
          >
            {{ puzzleCell.input }}
          </div>
          <div
              v-else-if="puzzleCell.hasNotes"
              class="flex flex-wrap p-1"
          >
            <div
                v-for="(note, noteIndex) in puzzleCell.notes"
                :key="`note-${noteIndex}`"
                class="w-1/3 flex justify-center items-center text-xs text-gray-400 aspect-square"
            >
              {{ note }}
            </div>
          </div>
        </div>
      </div>
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
          v-for="index in 9"
          :key="`num-${index}`"
          class="flex-1 aspect-square"
      >
        <Button
            class="w-full h-full text-2xl rounded-full"
            variant="outline"
        >
          {{ index }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Sudoku from "@/domain/Sudoku";
import Button from "@/presentation/components/ui/button/Button.vue";

const sudoku = new Sudoku();
const puzzle = sudoku.generate();
</script>
