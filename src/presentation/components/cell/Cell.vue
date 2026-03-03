<template>
    <div
        :class="[
            cellBg,
            positionClasses,
            selectionClasses,
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
import type { IPuzzleCell } from "@/domain/PuzzleCell";
import CellHighlight from "@/domain/CellHighlight";

const props = defineProps<{
    puzzleCell: IPuzzleCell;
    row: number;
    column: number;
    selected?: boolean;
    highlight?: CellHighlight;
}>();

const cellBg = computed(() => {
    if (props.selected) return "bg-highlight-strong";
    if (props.highlight === CellHighlight.Peer) return "bg-highlight";
    if (props.highlight === CellHighlight.SameNumber) return "bg-highlight";
    if (props.puzzleCell.isClue) return "bg-cell-clue";
    return "bg-card";
});

// 只依賴 row/column，永遠不變
const positionClasses = computed(() => {
    const classes: string[] = [];

    // 四角圓角
    if (props.row === 0 && props.column === 0) classes.push("rounded-tl-lg");
    if (props.row === 0 && props.column === 8) classes.push("rounded-tr-lg");
    if (props.row === 8 && props.column === 0) classes.push("rounded-bl-lg");
    if (props.row === 8 && props.column === 8) classes.push("rounded-br-lg");

    // 右邊框：宮格右邊界（col 2, 5）加粗
    if (props.column === 2 || props.column === 5) {
        classes.push("border-r-3 border-r-foreground/20");
    } else if (props.column < 8) {
        classes.push("border-r border-r-border");
    }

    // 下邊框：宮格下邊界（row 2, 5）加粗
    if (props.row === 2 || props.row === 5) {
        classes.push("border-b-3 border-b-foreground/20");
    } else if (props.row < 8) {
        classes.push("border-b border-b-border");
    }

    return classes.join(" ");
});

// 只依賴 selected
const selectionClasses = computed(() => {
    return props.selected ? "ring-2 ring-inset ring-primary" : "";
});
</script>
