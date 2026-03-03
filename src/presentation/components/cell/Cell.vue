<template>
    <div
        :class="[
            cellBg,
            cellBorder,
            !puzzleCell.isClue ? 'cursor-pointer' : '',
        ]"
        class="flex justify-center items-center flex-1 aspect-square"
    >
        <div
            v-if="puzzleCell.isClue"
            class="text-foreground text-[22px] font-semibold"
        >
            {{ puzzleCell.value }}
        </div>
        <div
            v-else-if="puzzleCell.isEntered"
            class="text-primary text-[22px] font-medium"
        >
            {{ puzzleCell.input }}
        </div>
        <div
            v-else-if="puzzleCell.hasNotes"
            class="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5"
        >
            <div
                v-for="n in 9"
                :key="`note-${n}`"
                class="flex justify-center items-center text-[10px] text-foreground-secondary leading-none"
            >
                {{ puzzleCell.notes.includes(n) ? n : '' }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PuzzleCell from "@/domain/PuzzleCell";
import CellHighlight from "@/domain/CellHighlight";

const props = defineProps<{
    puzzleCell: PuzzleCell;
    row: number;
    column: number;
    selected?: boolean;
    highlight?: CellHighlight;
}>();

const cellBg = computed(() => {
    if (props.selected) return "bg-highlight-strong";
    if (props.highlight === CellHighlight.Peer) return "bg-highlight";
    if (props.highlight === CellHighlight.SameNumber) return "bg-highlight";
    if (props.puzzleCell.isClue) return "bg-cell-tip";
    return "bg-card";
});

const cellBorder = computed(() => {
    if (props.selected) return "border-2 border-primary";

    const bottom = props.row % 3 === 2 && props.row < 8 ? "border-b-2" : "border-b";
    const right = props.column % 3 === 2 && props.column < 8 ? "border-r-2" : "border-r";
    return `border-t border-l ${bottom} ${right} border-border`;
});
</script>
