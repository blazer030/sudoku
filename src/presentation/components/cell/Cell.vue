<template>
  <div
    :class="[selected ? 'selected bg-sky-100' : '', conflict ? 'conflict bg-red-100' : '', !puzzleCell.isClue ? 'cursor-pointer' : '']"
    class="flex justify-center items-center flex-1 aspect-square"
  >
    <div
      v-if="puzzleCell.isClue"
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
</template>

<script setup lang="ts">
import PuzzleCell from "@/domain/PuzzleCell";

defineProps<{
    puzzleCell: PuzzleCell;
    selected?: boolean;
    conflict?: boolean;
}>();
</script>
