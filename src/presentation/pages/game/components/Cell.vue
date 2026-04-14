<template>
    <div
        :class="[
            cellBg,
            positionClasses,
            !puzzleCell.isClue ? 'cursor-pointer' : '',
            flashing ? 'animate-completion-flash' : '',
        ]"
        class="flex justify-center items-center flex-1 aspect-square"
    >
        <div
            v-if="puzzleCell.isClue"
            class="text-foreground text-[22px] font-semibold"
        >
            {{ puzzleCell.clue }}
        </div>
        <div
            v-else-if="puzzleCell.hasEntry"
            data-testid="cell-entry"
            :class="[error ? 'text-error' : 'text-primary', 'text-[22px] font-medium']"
        >
            {{ puzzleCell.entry }}
        </div>
        <div
            v-else-if="puzzleCell.hasNotes"
            class="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5"
        >
            <div
                v-for="n in 9"
                :key="`note-${n}`"
                class="flex justify-center items-center leading-none"
            >
                <span
                    v-if="puzzleCell.notes.includes(n)"
                    :class="highlightSameDigit && selectedDigit === n
                        ? 'aspect-square max-w-5 max-h-5 w-full rounded-full bg-primary text-white font-semibold flex items-center justify-center'
                        : 'text-foreground-muted'"
                    class="text-[clamp(8px,-0.49px+2.26vw,14px)]"
                >
                    {{ n }}
                </span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { PuzzleCell } from "@/domain";

const props = withDefaults(defineProps<{
    puzzleCell: PuzzleCell;
    row: number;
    column: number;
    selected?: boolean;
    selectedDigit?: number | null;
    error?: boolean;
    flashing?: boolean;
    highlightSameDigit?: boolean;
}>(), {
    selectedDigit: null,
    highlightSameDigit: true,
});

const isSameDigit = computed(() => {
    if (!props.highlightSameDigit) return false;
    if (!props.selectedDigit) return false;
    const cellValue = props.puzzleCell.isClue ? props.puzzleCell.clue : props.puzzleCell.entry;
    return cellValue === props.selectedDigit;
});

const cellBg = computed(() => {
    if (props.error) return "bg-error-light";
    if (props.selected) return "bg-primary-light";
    if (isSameDigit.value) return "bg-highlight";
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
</script>
