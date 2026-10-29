<template>
    <div
        class="blueprint-loader flex w-[276px] flex-col bg-background p-1.5 text-foreground shadow-modal"
        data-skin="card"
    >
        <!-- A small drawing sheet. skin.css dashes the plot on while the plotter's pen (an amber cross in a ring)
             runs along the same path at the same pace, the outline in one stroke and then the four inner lines;
             then the 3-column dimension spreads from its middle, holds, and the drawing fades for the next round.
             Under reduced motion the box and its dimension are drawn and the pen is gone. -->
        <div
            class="blueprint-loader-drawing relative mt-[18px] mb-1.5 h-[140px] w-[120px] self-center"
            aria-hidden="true"
        >
            <svg
                class="absolute top-0 left-0 overflow-visible"
                viewBox="0 0 120 120"
                width="120"
                height="120"
                fill="none"
                stroke="currentColor"
            >
                <path
                    class="blueprint-loader-plot"
                    :d="PLOT"
                    pathLength="1"
                    stroke-width="1.5"
                    stroke-linejoin="miter"
                />
            </svg>
            <span
                class="blueprint-loader-pen absolute top-0 left-0 -mt-[7px] -ml-[7px] size-3.5 text-primary"
                :style="PEN_PATH"
            >
                <svg
                    class="absolute inset-0"
                    viewBox="0 0 14 14"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                >
                    <path d="M0 7 H14 M7 0 V14" />
                    <circle
                        cx="7"
                        cy="7"
                        r="2.5"
                    />
                </svg>
            </span>
            <span class="blueprint-loader-dimension absolute top-[120px] right-2.5 left-2.5 h-4 text-foreground-secondary">
                <span class="absolute inset-x-0 top-1/2 h-px bg-current" />
                <span class="absolute inset-y-0 left-0 w-px bg-current" />
                <span class="absolute inset-y-0 right-0 w-px bg-current" />
                <span class="absolute top-0 left-1/2 h-4 -translate-x-1/2 bg-background px-1.5 text-[11px] leading-4 tracking-[0.1em] whitespace-nowrap">
                    {{ t("game.boardFrame.columns", { n: 3 }) }}
                </span>
            </span>
        </div>
        <!-- The title block: the caption, the pen's X and Y ticking past, and the sheet's number -->
        <div class="grid grid-cols-[1fr_auto] border-t border-foreground">
            <p class="blueprint-loader-caption m-0 px-2.5 py-2 text-[13px] tracking-[0.06em] text-foreground">
                {{ message ?? t("home.generatingPuzzle") }}
            </p>
            <span
                class="blueprint-loader-coordinates my-2 h-7 self-center overflow-hidden border-l border-foreground px-2.5 font-mono text-[10px] leading-[14px] font-medium text-foreground-secondary"
                aria-hidden="true"
            >
                <span class="block">
                    <template
                        v-for="(point, position) in READOUT"
                        :key="position"
                    >
                        <b class="block h-3.5 font-medium">X {{ coordinateOf(point.x) }}</b>
                        <b class="block h-3.5 font-medium">Y {{ coordinateOf(point.y) }}</b>
                    </template>
                </span>
            </span>
            <span
                class="blueprint-loader-sheet-number col-span-full border-t border-border px-2.5 py-2 font-mono text-[10px] leading-none font-medium tracking-[0.12em] text-foreground-secondary"
                aria-hidden="true"
            >SDK-09 · SHT 01/01 · 1:1</span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

withDefaults(defineProps<{
    message?: string;
}>(), {
    message: undefined,
});

// The box in the 120-unit viewBox, in the order it is plotted: the outline in one stroke, then on along it to the
// two lines down and the two across. The pen runs along this same path.
const PLOT = "M10 10 H110 V110 H10 V10 H43 V110 H77 V10 H110 V43 H10 V77 H110";
const PEN_PATH = { "--blueprint-loader-path": `path("${PLOT}")` };

// The readout ticks through six of these in a round; the seventh repeats the first, so the loop has no seam
const READOUT = [
    { x: 10, y: 10 },
    { x: 110, y: 110 },
    { x: 43, y: 110 },
    { x: 77, y: 10 },
    { x: 110, y: 43 },
    { x: 10, y: 77 },
    { x: 10, y: 10 },
];

const coordinateOf = (value: number): string => value.toFixed(1).padStart(5, "0");
</script>
