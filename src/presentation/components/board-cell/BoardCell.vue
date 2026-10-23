<template>
    <div
        :class="[
            backgroundClass,
            positionClasses,
            flashing ? 'animate-completion-flash' : '',
            popping ? 'animate-hint-reveal-glow' : '',
            leaving ? 'value-leave' : '',
        ]"
        :data-selected="selected ? '' : undefined"
        :data-value-kind="value !== 0 ? valueKind : undefined"
        :data-variant="variant"
        class="flex justify-center items-center aspect-square min-w-0 min-h-0"
        @animationend.self="settle"
    >
        <div
            v-if="value !== 0"
            :class="[
                valueTextColorClass,
                valueFontWeightClass,
                valueFaceClass,
                popping ? 'animate-hint-reveal-pop' : '',
                arriving ? 'value-arrive' : '',
                'leading-none',
            ]"
            data-testid="cell-value"
            @animationend="settle"
        >
            {{ value }}
        </div>
        <div
            v-else-if="notes.length > 0 || eliminatedDigits.length > 0"
            class="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5"
        >
            <div
                v-for="noteDigit in 9"
                :key="`note-${noteDigit}`"
                class="flex justify-center items-center leading-none"
            >
                <span
                    v-if="notes.includes(noteDigit) || eliminatedDigits.includes(noteDigit)"
                    :class="[noteClass(noteDigit), noteSizeClass, 'font-note']"
                    :data-note-highlight="isNoteHighlighted(noteDigit) ? '' : undefined"
                    :data-testid="eliminatedDigits.includes(noteDigit) ? `eliminated-note-${noteDigit}` : undefined"
                >
                    {{ noteDigit }}
                </span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, toRef } from "vue";
import { useArrivalMotion } from "@/presentation/components/board-cell/useArrivalMotion";

export type CellVariant = "default" | "clue" | "selected" | "focus" | "scope" | "error" | "same-digit" | "pattern" | "answer" | "wrong" | "peer";
/** Player notes are muted; solver candidates are bold in the theme colour so they never pass for the player's own. */
export type NoteTone = "player" | "solver";
export type ValueTextColor = "normal" | "error" | "primary";
export type ValueFontWeight = "bold" | "semibold" | "medium";
/** A given digit is printed like a clue; an entered one is the player's (or a hint's) answer. Styles may set them in different faces. */
export type ValueKind = "given" | "entered";

const props = withDefaults(defineProps<{
    row: number;
    column: number;
    value: number;
    notes?: number[];
    eliminatedDigits?: number[];
    variant?: CellVariant;
    valueTextColor?: ValueTextColor;
    valueFontWeight?: ValueFontWeight;
    highlightedNote?: number | null;
    flashing?: boolean;
    noteTone?: NoteTone;
    emphasizedDigits?: number[];
    popping?: boolean;
    valueKind?: ValueKind;
    /** The selected cell, even when another state (an error) decides its variant; a style may mark it. */
    selected?: boolean;
}>(), {
    notes: () => [],
    eliminatedDigits: () => [],
    variant: "default",
    valueTextColor: "normal",
    valueFontWeight: "semibold",
    highlightedNote: null,
    flashing: false,
    noteTone: "player",
    emphasizedDigits: () => [],
    popping: false,
    valueKind: "given",
    selected: false,
});

const VARIANT_BACKGROUNDS: Record<CellVariant, string> = {
    default: "bg-card",
    clue: "bg-cell-clue",
    selected: "bg-cell-selected ring-2 ring-inset ring-primary",
    focus: "bg-cell-focus",
    scope: "bg-cell-scope",
    error: "bg-error-surface",
    "same-digit": "bg-highlight",
    pattern: "bg-cell-pattern",
    answer: "bg-primary-light ring-2 ring-inset ring-primary",
    wrong: "bg-error-surface ring-2 ring-inset ring-error",
    peer: "bg-cell-peer",
};

const VALUE_TEXT_COLORS: Record<ValueTextColor, string> = {
    normal: "text-foreground",
    error: "text-error",
    primary: "text-primary",
};

const VALUE_FONT_WEIGHTS: Record<ValueFontWeight, string> = {
    bold: "font-bold",
    semibold: "font-semibold",
    medium: "font-medium",
};

// Only a style sheet gives value-arrive (on the digit) and value-leave (on the cell) a look; in styles
// without one they settle on a timer. The cell's own animations (a style's burst on a pseudo-element)
// settle them too; the cell ignores animations ending inside it.
const { arriving, leaving, settle } = useArrivalMotion(toRef(props, "value"), toRef(props, "popping"));

const backgroundClass = computed(() => VARIANT_BACKGROUNDS[props.variant]);

const valueTextColorClass = computed(() => VALUE_TEXT_COLORS[props.valueTextColor]);

const valueFontWeightClass = computed(() => VALUE_FONT_WEIGHTS[props.valueFontWeight]);

// Faces and sizes go through per-style tokens; each scale defaults to 1, so minimal keeps 22px digits
const VALUE_FACES: Record<ValueKind, string> = {
    given: "font-clue text-[length:calc(22px*var(--clue-scale,1))]",
    entered: "font-entry text-[length:calc(22px*var(--entry-scale,1))]",
};

const valueFaceClass = computed(() => VALUE_FACES[props.valueKind]);

const noteSizeClass = computed(() => (props.noteTone === "solver"
    ? "text-[length:calc(clamp(10px,-0.49px+2.7vw,15px)*var(--note-scale,1))]"
    : "text-[length:calc(clamp(10px,-0.49px+2.26vw,14px)*var(--note-scale,1))]"));

// The selected digit's note, or a hint's emphasised candidate; a style may redraw it
const isNoteHighlighted = (digit: number): boolean =>
    !props.eliminatedDigits.includes(digit) && (props.highlightedNote === digit || props.emphasizedDigits.includes(digit));

const noteClass = (digit: number): string => {
    if (props.eliminatedDigits.includes(digit)) {
        return props.noteTone === "solver" ? "text-error font-semibold strike-diagonal" : "text-error strike-diagonal";
    }
    if (isNoteHighlighted(digit)) {
        return "aspect-square max-w-5 max-h-5 w-full rounded-full bg-primary text-on-primary font-semibold flex items-center justify-center";
    }
    if (props.noteTone === "solver") return "text-primary font-semibold";
    return "text-note";
};

const positionClasses = computed(() => {
    const classes: string[] = [];

    if (props.row === 0 && props.column === 0) classes.push("rounded-tl-lg");
    if (props.row === 0 && props.column === 8) classes.push("rounded-tr-lg");
    if (props.row === 8 && props.column === 0) classes.push("rounded-bl-lg");
    if (props.row === 8 && props.column === 8) classes.push("rounded-br-lg");

    // Thin lines are translucent ink rather than the border token, so they still show on clue cells.
    // Their colours are custom properties (index.css), so a style can redraw the grid.
    if (props.column === 2 || props.column === 5) {
        classes.push("border-r-3 border-r-(color:--board-box-line)");
    } else if (props.column < 8) {
        classes.push("border-r border-r-(color:--board-line)");
    }

    if (props.row === 2 || props.row === 5) {
        classes.push("border-b-3 border-b-(color:--board-box-line)");
    } else if (props.row < 8) {
        classes.push("border-b border-b-(color:--board-line)");
    }

    return classes.join(" ");
});
</script>
