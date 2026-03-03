<template>
  <div
    :class="[
      selected ? 'selected bg-sky-100' : '',
      highlight === CellHighlight.Peer ? 'bg-sky-50' : '',
      highlight === CellHighlight.SameNumber ? 'bg-sky-100' : '',
      !puzzleCell.isClue ? 'cursor-pointer' : '',
    ]"
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
      class="grid grid-cols-3 grid-rows-3 w-full h-full p-1"
    >
      <div
        v-for="n in 9"
        :key="`note-${n}`"
        class="flex justify-center items-center text-xs text-gray-400"
      >
        {{ puzzleCell.notes.includes(n) ? n : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PuzzleCell from "@/domain/PuzzleCell";
import CellHighlight from "@/domain/CellHighlight";

defineProps<{
    puzzleCell: PuzzleCell;
    selected?: boolean;
    highlight?: CellHighlight;
}>();
</script>
