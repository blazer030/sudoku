<template>
    <div
        ref="cellElement"
        :class="[
            backgroundClass,
            positionClasses,
            pops ? 'animate-hint-reveal-glow' : '',
            leaving ? 'value-leave' : '',
        ]"
        :data-leaving-value="leaving ? lastDigit : undefined"
        :data-arriving="arriving && value !== 0 ? '' : undefined"
        :data-group="inGroupEffect ? groupKinds.join(' ') : undefined"
        :data-selected="selected ? '' : undefined"
        :data-value-kind="value !== 0 ? valueKind : undefined"
        :data-variant="variant"
        :style="placement"
        class="flex justify-center items-center aspect-square min-w-0 min-h-0"
        @animationend.self="settleFromCell"
    >
        <div
            v-if="value !== 0"
            :class="[
                valueTextColorClass,
                valueFontWeightClass,
                valueFaceClass,
                pops ? 'animate-hint-reveal-pop' : '',
                arriving ? 'value-arrive' : '',
                'leading-none',
            ]"
            :style="digitWriter ? { '--digit-writer-mask': `url(#${writerMaskId})` } : undefined"
            data-testid="cell-value"
            @animationend="settleFromDigit"
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
        <!-- The style's pen: it draws the mask the arriving digit is shown through, beside the digit so its
             strokes' animations never reach the digit's own animationend -->
        <component
            :is="digitWriter"
            v-if="digitWriter"
            :digit="value"
            :mask-id="writerMaskId"
            @written="settle"
        />
    </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, toRef, useId, useTemplateRef, watch } from "vue";
import { BOX_SIZE } from "@/domain/board/constants";
import type { GroupKind } from "@/domain/game/Sudoku";
import { useMotionAllowed } from "@/presentation/composables/useMotionAllowed";
import { useArrivalMotion } from "@/presentation/components/board-cell/useArrivalMotion";
import { useStyleMoments } from "@/presentation/components/style-moments/styleMoments";
import { canMaskByReference } from "@/presentation/components/style-moments/maskReferenceSupport";

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
    /** The kinds of completed group (row, column, box) whose effect this cell is in; none outside one. */
    groupKinds?: GroupKind[];
    /** The running group effect's id; a new one restarts the cell's effect. */
    groupEffectId?: number | null;
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
    groupKinds: () => [],
    groupEffectId: null,
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
// without one they settle on a timer. A style's burst on the cell's pseudo-elements settles them too.
// The cell's own colour animations (a group effect, a hint's glow) run on their own clock, and
// animations ending inside the cell bubble up, so neither does.
const motionAllowed = useMotionAllowed();
// While a new effect takes over a cell still in the old one, the cell is shown out of it for a moment,
// so its CSS animations start again from the new origin
const restartingGroupEffect = ref(false);
const inGroupEffect = computed(() => props.groupKinds.length > 0 && !restartingGroupEffect.value && motionAllowed());
const cellElement = useTemplateRef<HTMLElement>("cellElement");
watch(() => props.groupEffectId, (id, previousId) => {
    if (id === null || previousId === null || props.groupKinds.length === 0) return;
    restartingGroupEffect.value = true;
    void nextTick(() => {
        // Reading its size makes the browser see the cell without the effect before it comes back
        void cellElement.value?.offsetWidth;
        restartingGroupEffect.value = false;
    });
});

// Where the cell sits, counted from 0, for a style's effects to work from
const placement = computed(() => ({
    "--cell-row": props.row,
    "--cell-column": props.column,
    "--cell-box": Math.floor(props.row / BOX_SIZE) * BOX_SIZE + Math.floor(props.column / BOX_SIZE),
}));
const pops = computed(() => props.popping && motionAllowed());
const { arriving, leaving, settle } = useArrivalMotion(toRef(props, "value"), toRef(props, "popping"));

// The digit a leaving cell last showed, for a style to draw as it goes
const lastDigit = ref(props.value);
watch(() => props.value, (current) => {
    if (current !== 0) lastDigit.value = current;
});

// A style may write an arriving digit in with its own pen; arriving is only ever set while motion is allowed.
// The pen is a mask, so a browser that cannot mask by one shows the digit plainly.
const moments = useStyleMoments();
const writerMaskId = `digit-writer-${useId()}`;
const digitWriter = computed(() => (arriving.value && props.value !== 0 && canMaskByReference() ? moments.value.digitWriter ?? null : null));

// The entered digit lies in its own completed group; the group's animation on it (named <style>-group-…)
// runs on the group effect's clock, so it never settles the arrival
const settleFromDigit = (event: AnimationEvent) => {
    // jsdom's plain events carry no name
    const name = event.animationName as string | undefined;
    if (!(name ?? "").includes("-group-")) settle();
};

const settleFromCell = (event: AnimationEvent) => {
    if (event.pseudoElement) settle();
};

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
