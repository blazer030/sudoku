<template>
    <div
        :class="[
            cellBackground,
            positionClasses,
            'cursor-pointer',
        ]"
        class="flex justify-center items-center flex-1 aspect-square"
    >
        <div
            v-if="value !== 0"
            class="text-foreground text-[22px] font-semibold"
            data-testid="cell-value"
        >
            {{ value }}
        </div>
        <div
            v-else
            class="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5"
        >
            <div
                v-for="noteDigit in 9"
                :key="`note-${noteDigit}`"
                class="flex justify-center items-center leading-none"
            >
                <span
                    v-if="notes.includes(noteDigit)"
                    class="text-foreground-muted text-[clamp(8px,-0.49px+2.26vw,14px)]"
                >
                    {{ noteDigit }}
                </span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

export type CellHighlight = "focus";

const props = withDefaults(defineProps<{
    value: number;
    row: number;
    column: number;
    notes?: number[];
    selected?: boolean;
    highlight?: CellHighlight | null;
}>(), {
    notes: () => [],
    highlight: null,
});

const cellBackground = computed(() => {
    if (props.highlight === "focus") return "bg-primary-light";
    if (props.selected) return "bg-primary-light";
    return "bg-card";
});

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
