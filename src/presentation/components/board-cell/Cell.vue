<template>
    <BoardCell
        v-press:tint
        :aria-label="spokenLabel"
        :row="row"
        :column="column"
        :value="value"
        :notes="notes"
        :variant="variant"
        :value-text-color="valueTextColor"
        :value-font-weight="valueFontWeight"
        :value-kind="puzzleCell.isClue ? 'given' : 'entered'"
        :highlighted-note="highlightedNote"
        :flashing="flashing"
        :note-tone="hint?.candidates ? 'solver' : 'player'"
        :eliminated-digits="hint?.eliminated ?? []"
        :emphasized-digits="hint?.emphasized ?? []"
        :popping="revealed"
        :class="[interactionClass, 'select-none [-webkit-touch-callout:none]']"
        :role="interactive ? 'button' : undefined"
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
import { useI18n } from "vue-i18n";
import BoardCell, { type CellVariant, type ValueTextColor, type ValueFontWeight } from "@/presentation/components/board-cell/BoardCell.vue";
import { PuzzleCell } from "@/domain";
import { useLongPress } from "@/presentation/composables/useLongPress";
import type { StepCellView, StepHighlight } from "@/presentation/components/step-presentation/stepCellView";
import { vPress } from "@/presentation/directives/press";

const props = withDefaults(defineProps<{
    puzzleCell: PuzzleCell;
    row: number;
    column: number;
    selected?: boolean;
    /** In the selected cell's row, column or box. */
    peer?: boolean;
    selectedDigit?: number | null;
    error?: boolean;
    flashing?: boolean;
    highlightSameDigit?: boolean;
    /** While hint mode is on, how the hint wants this cell shown; it replaces the normal highlights. */
    hint?: StepCellView | null;
    revealed?: boolean;
    /** False on boards that only show a game, so the cell does not present itself as a button. */
    interactive?: boolean;
}>(), {
    peer: false,
    selectedDigit: null,
    highlightSameDigit: true,
    hint: null,
    revealed: false,
    interactive: true,
});

const HINT_VARIANTS: Record<Exclude<StepHighlight, "none">, CellVariant> = {
    scope: "scope",
    pattern: "pattern",
    answer: "answer",
    wrong: "wrong",
};

const emit = defineEmits<{
    click: [];
    longPress: [];
}>();

const { t } = useI18n();

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

const notes = computed(() => {
    if (props.hint?.candidates) return props.hint.candidates;
    return props.puzzleCell.hasNotes ? props.puzzleCell.notes : [];
});

const spokenLabel = computed(() => {
    const place = { row: props.row + 1, column: props.column + 1 };
    if (value.value !== 0) return t("game.cell.value", { ...place, value: value.value });
    if (notes.value.length > 0) return t("game.cell.notes", { ...place, notes: notes.value.join(" ") });
    return t("game.cell.empty", place);
});

// Colour changes animate only while hinting, so normal selection stays instant.
const interactionClass = computed(() => {
    if (props.hint) return "transition-colors duration-300";
    return props.puzzleCell.isClue || !props.interactive ? "" : "cursor-pointer";
});

const variant = computed((): CellVariant => {
    if (props.hint) {
        if (props.hint.highlight !== "none") return HINT_VARIANTS[props.hint.highlight];
        return props.puzzleCell.isClue ? "clue" : "default";
    }
    if (props.error) return "error";
    if (props.selected) return "selected";
    if (isSameDigit.value) return "same-digit";
    if (props.peer) return "peer";
    if (props.puzzleCell.isClue) return "clue";
    return "default";
});

const valueTextColor = computed((): ValueTextColor => {
    if (props.puzzleCell.isClue) return "normal";
    if (props.hint) return props.hint.highlight === "wrong" ? "error" : "primary";
    if (props.error) return "error";
    return "primary";
});

const valueFontWeight = computed((): ValueFontWeight => (props.puzzleCell.isClue ? "bold" : "medium"));

const highlightedNote = computed((): number | null => {
    if (props.hint) return null;
    if (!props.highlightSameDigit) return null;
    return props.selectedDigit;
});
</script>
