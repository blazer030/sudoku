<template>
    <div
        :class="[
            backgroundClass,
            positionClasses,
            flashing ? 'animate-completion-flash' : '',
            popping ? 'animate-hint-reveal-glow' : '',
        ]"
        class="flex justify-center items-center flex-1 aspect-square"
    >
        <div
            v-if="value !== 0"
            :class="[valueTextColorClass, valueFontWeightClass, popping ? 'animate-hint-reveal-pop' : '', 'text-[22px]']"
            data-testid="cell-value"
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
                    :class="[noteClass(noteDigit), noteSizeClass]"
                    :data-testid="eliminatedDigits.includes(noteDigit) ? `eliminated-note-${noteDigit}` : undefined"
                >
                    {{ noteDigit }}
                </span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

export type CellVariant = "default" | "clue" | "selected" | "focus" | "scope" | "error" | "same-digit" | "pattern" | "answer" | "wrong";
/** Player notes are muted; solver candidates are bold in the theme colour so they never pass for the player's own. */
export type NoteTone = "player" | "solver";
export type ValueTextColor = "normal" | "error" | "primary";
export type ValueFontWeight = "semibold" | "medium";

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
});

const VARIANT_BACKGROUNDS: Record<CellVariant, string> = {
    default: "bg-card",
    clue: "bg-cell-clue",
    selected: "bg-primary-light",
    focus: "bg-primary/40",
    scope: "bg-primary/15",
    error: "bg-error-light",
    "same-digit": "bg-highlight",
    pattern: "bg-primary/30",
    answer: "bg-primary-light ring-2 ring-inset ring-primary",
    wrong: "bg-error-light ring-2 ring-inset ring-error",
};

const VALUE_TEXT_COLORS: Record<ValueTextColor, string> = {
    normal: "text-foreground",
    error: "text-error",
    primary: "text-primary",
};

const VALUE_FONT_WEIGHTS: Record<ValueFontWeight, string> = {
    semibold: "font-semibold",
    medium: "font-medium",
};

const backgroundClass = computed(() => VARIANT_BACKGROUNDS[props.variant]);

const valueTextColorClass = computed(() => VALUE_TEXT_COLORS[props.valueTextColor]);

const valueFontWeightClass = computed(() => VALUE_FONT_WEIGHTS[props.valueFontWeight]);

const noteSizeClass = computed(() => (props.noteTone === "solver"
    ? "text-[clamp(9.5px,-0.49px+2.7vw,15px)]"
    : "text-[clamp(8px,-0.49px+2.26vw,14px)]"));

const noteClass = (digit: number): string => {
    if (props.eliminatedDigits.includes(digit)) {
        return props.noteTone === "solver" ? "text-error font-semibold strike-diagonal" : "text-error strike-diagonal";
    }
    if (props.highlightedNote === digit || props.emphasizedDigits.includes(digit)) {
        return "aspect-square max-w-5 max-h-5 w-full rounded-full bg-primary text-white font-semibold flex items-center justify-center";
    }
    if (props.noteTone === "solver") return "text-primary font-semibold";
    return "text-foreground-muted";
};

const positionClasses = computed(() => {
    const classes: string[] = [];

    if (props.row === 0 && props.column === 0) classes.push("rounded-tl-lg");
    if (props.row === 0 && props.column === 8) classes.push("rounded-tr-lg");
    if (props.row === 8 && props.column === 0) classes.push("rounded-bl-lg");
    if (props.row === 8 && props.column === 8) classes.push("rounded-br-lg");

    if (props.column === 2 || props.column === 5) {
        classes.push("border-r-3 border-r-foreground/20");
    } else if (props.column < 8) {
        classes.push("border-r border-r-border");
    }

    if (props.row === 2 || props.row === 5) {
        classes.push("border-b-3 border-b-foreground/20");
    } else if (props.row < 8) {
        classes.push("border-b border-b-border");
    }

    return classes.join(" ");
});
</script>
