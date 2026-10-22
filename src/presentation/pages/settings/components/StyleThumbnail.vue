<template>
    <!-- No data-style or data-skin inside: style sheets match by descendant, so a hook here would pick up the current style's rules -->
    <div
        :class="look.page"
        :data-thumbnail-style="styleId"
        :style="thumbnailVariables"
        aria-hidden="true"
        class="flex flex-col items-center justify-center gap-1.5 w-full aspect-[3/2] rounded-lg bg-background"
        data-testid="style-thumbnail"
    >
        <div class="flex items-end gap-1.5">
            <div
                :class="look.board"
                class="grid grid-cols-3 gap-px w-10 p-px rounded-[3px]"
            >
                <div
                    v-for="cell in CELLS"
                    :key="cell"
                    :class="cellClasses(cell)"
                    class="relative flex items-center justify-center aspect-square rounded-[2px] text-[8px] leading-none"
                >
                    <span
                        v-if="cell === GIVEN_CELL"
                        :class="look.given"
                        class="text-foreground font-bold"
                    >5</span>
                    <span
                        v-else-if="cell === ENTERED_CELL"
                        :class="look.entered"
                        class="text-primary"
                    >3</span>
                    <svg
                        v-if="cell === SELECTED_CELL && look.circledSelection"
                        class="absolute -inset-px text-primary -rotate-6"
                        fill="none"
                        viewBox="0 0 40 40"
                    >
                        <path
                            d="M30 7.5C23 3.5 11 4.5 6 11.5S3.5 29 11 33.5 30 37.5 35 30 37 13 27 6.8"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-width="4"
                        />
                    </svg>
                </div>
            </div>
            <div
                :class="look.key"
                class="flex items-center justify-center size-4 rounded-[3px] bg-card text-foreground text-[8px] leading-none"
            >
                <span :class="look.keyDigit">7</span>
            </div>
        </div>
        <div
            :class="look.pill"
            class="h-1.5 w-2/5 rounded-full bg-primary"
        />
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { StyleId } from "@/application/SettingsStorage";
import { PALETTE_TOKENS, type Palette } from "@/theme/palettes";

const props = defineProps<{ styleId: StyleId; palette: Palette }>();

interface ThumbnailLook {
    /** The style's interface face, pinned on the thumbnail so the active style's never leaks in */
    sansFont: string;
    page: string;
    board: string;
    /** Added to every cell; the fill comes from the cell's role */
    cell: string;
    /** Added to the selected cell's fill */
    selected: string;
    given: string;
    entered: string;
    circledSelection: boolean;
    key: string;
    keyDigit: string;
    pill: string;
}

// Each style's look as plain token classes, drawn with the thumbnail's own palette
const THUMBNAIL_LOOKS: Record<StyleId, ThumbnailLook> = {
    minimal: {
        sansFont: "var(--font-default)",
        page: "",
        board: "bg-border",
        cell: "",
        selected: "ring-1 ring-inset ring-primary",
        given: "font-sans",
        entered: "font-sans font-medium",
        circledSelection: false,
        key: "shadow-card-sm",
        keyDigit: "font-sans font-semibold",
        pill: "",
    },
    tactile: {
        sansFont: "var(--font-default)",
        page: "",
        board: "bg-background shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--color-shadow)_22%,transparent)]",
        cell: "shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--color-shadow)_16%,transparent)]",
        selected: "ring-1 ring-inset ring-primary",
        given: "font-sans",
        entered: "font-sans font-medium",
        circledSelection: false,
        key: "shadow-[0_2px_0_color-mix(in_srgb,var(--color-shadow)_28%,var(--color-background))]",
        keyDigit: "font-sans font-semibold",
        pill: "shadow-[0_2px_0_color-mix(in_srgb,var(--color-shadow)_28%,var(--color-background))]",
    },
    paper: {
        sansFont: "var(--font-wenkai)",
        page: "bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_7px,var(--color-rule)_7px,var(--color-rule)_8px)]",
        board: "bg-border",
        cell: "",
        selected: "",
        given: "font-print",
        entered: "font-hand font-bold text-[10px]",
        circledSelection: true,
        key: "",
        keyDigit: "font-hand font-bold text-[10px]",
        pill: "-rotate-2",
    },
};

// A 3×3 mini board: a given digit, an entered digit and the selected cell
const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
const GIVEN_CELL = 0;
const SELECTED_CELL = 4;
const ENTERED_CELL = 5;

const look = computed(() => THUMBNAIL_LOOKS[props.styleId]);

// The thumbnail's own palette and interface face; the hand and print faces belong to no style
const thumbnailVariables = computed(() => ({
    ...Object.fromEntries(PALETTE_TOKENS.map(token => [`--color-${token}`, props.palette[token]])),
    "--font-sans": look.value.sansFont,
}));

const cellClasses = (cell: number): string[] => {
    if (cell === SELECTED_CELL) return [look.value.cell, "bg-cell-selected", look.value.selected];
    if (cell === GIVEN_CELL) return [look.value.cell, "bg-cell-clue"];
    return [look.value.cell, "bg-card"];
};
</script>
