<template>
    <BoardCell
        :row="row"
        :column="column"
        :value="value"
        :notes="notes"
        :variant="variant"
        :value-text-color="valueTextColor"
        :value-font-weight="valueFontWeight"
        :highlighted-note="highlightedNote"
        :flashing="flashing"
        :class="[puzzleCell.isClue ? '' : 'cursor-pointer', 'select-none [-webkit-touch-callout:none]']"
        @click="handleClick"
        @contextmenu.prevent
        @pointerdown="longPress.onPointerdown"
        @pointermove="longPress.onPointermove"
        @pointerup="longPress.onPointerup"
        @pointercancel="longPress.onPointercancel"
        @pointerleave="longPress.onPointerleave"
    />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import BoardCell, { type CellVariant, type ValueTextColor, type ValueFontWeight } from "@/presentation/components/board-cell/BoardCell.vue";
import { PuzzleCell } from "@/domain";
import { useLongPress } from "@/presentation/composables/useLongPress";

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

const emit = defineEmits<{
    click: [];
    longPress: [];
}>();

const longPress = useLongPress({ onLongPress: () => { emit("longPress"); } });

// The click that follows a long press must not trigger a second, normal input.
const handleClick = () => {
    if (longPress.consumeClickSuppression()) return;
    emit("click");
};

const isSameDigit = computed(() => {
    if (!props.highlightSameDigit) return false;
    if (!props.selectedDigit) return false;
    const cellValue = props.puzzleCell.isClue ? props.puzzleCell.clue : props.puzzleCell.entry;
    return cellValue === props.selectedDigit;
});

const value = computed(() => {
    if (props.puzzleCell.isClue) return props.puzzleCell.clue;
    if (props.puzzleCell.hasEntry) return props.puzzleCell.entry;
    return 0;
});

const notes = computed(() => (props.puzzleCell.hasNotes ? props.puzzleCell.notes : []));

const variant = computed((): CellVariant => {
    if (props.error) return "error";
    if (props.selected) return "selected";
    if (isSameDigit.value) return "same-digit";
    if (props.puzzleCell.isClue) return "clue";
    return "default";
});

const valueTextColor = computed((): ValueTextColor => {
    if (props.puzzleCell.isClue) return "normal";
    if (props.error) return "error";
    return "primary";
});

const valueFontWeight = computed((): ValueFontWeight => (props.puzzleCell.isClue ? "semibold" : "medium"));

const highlightedNote = computed((): number | null => {
    if (!props.highlightSameDigit) return null;
    return props.selectedDigit;
});
</script>
