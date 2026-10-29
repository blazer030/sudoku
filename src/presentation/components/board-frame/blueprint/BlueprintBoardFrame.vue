<template>
    <div
        class="blueprint-frame max-w-board-fit"
        data-testid="board-frame"
    >
        <slot />
        <div
            aria-hidden="true"
            class="blueprint-frame-marks"
        >
            <div class="blueprint-frame-grid">
                <div class="blueprint-frame-columns">
                    <span
                        v-for="index in INDICES"
                        :key="`column-${index}`"
                        :data-index="index"
                        :data-lit="isLit('column', index) || undefined"
                        :data-target="target?.column === index || undefined"
                        class="blueprint-frame-label"
                        data-axis="column"
                    >C{{ index + 1 }}</span>
                </div>
                <div class="blueprint-frame-rows">
                    <span
                        v-for="index in INDICES"
                        :key="`row-${index}`"
                        :data-index="index"
                        :data-lit="isLit('row', index) || undefined"
                        :data-target="target?.row === index || undefined"
                        class="blueprint-frame-label"
                        data-axis="row"
                    >R{{ index + 1 }}</span>
                </div>
                <div class="blueprint-frame-dimension">
                    <span>{{ t("game.boardFrame.columns", { n: INDICES.length }) }}</span>
                </div>
                <span
                    v-if="callout !== null"
                    :style="{ left: callout.left }"
                    class="blueprint-callout"
                >
                    <span class="blueprint-callout-text">{{ callout.name }}</span>
                </span>
                <template v-if="celebration !== null">
                    <!-- A dashed SVG line, not a dashed border: WebKit leaves out a 1.5px dashed border's sides -->
                    <svg
                        :data-still="celebration === 'still' || undefined"
                        class="blueprint-frame-lock text-primary"
                    >
                        <!-- Inset by half its stroke, as the canvas's, so the whole line lies on the lock's box -->
                        <rect
                            fill="none"
                            height="calc(100% - 1.5px)"
                            stroke="currentColor"
                            stroke-dasharray="6 4"
                            stroke-width="1.5"
                            width="calc(100% - 1.5px)"
                            x="0.75"
                            y="0.75"
                        />
                    </svg>
                    <span
                        :data-still="celebration === 'still' || undefined"
                        class="blueprint-frame-verdict"
                    >
                        <span class="blueprint-frame-verdict-text">{{ VERDICT }}</span>
                    </span>
                </template>
            </div>
            <i
                v-for="corner in CORNERS"
                :key="corner"
                :data-corner="corner"
                class="blueprint-frame-register"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { cellName } from "@/presentation/components/board-cell/cellName";
import type { BoardFrameProps } from "@/presentation/components/board-frame/boardFrames";

const props = defineProps<BoardFrameProps>();

const { t } = useI18n();

const INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
// A drawing's codes, the same in both languages
const VERDICT = "R1–R9 · C1–C9 OK";

// A completed row's or column's label lights while its group effect runs (skin.css); a box lights none, having no
// label of its own beside the board
const isLit = (kind: "row" | "column", index: number): boolean =>
    props.effect?.groups.some(group => group.kind === kind && group.index === index) ?? false;

// The middle of a column, as a percentage of the grid's width
const columnMiddle = (column: number): string => `${((column + 0.5) * 100 / INDICES.length).toFixed(4)}%`;

// The target cell's name stands in its column's label place, above the board, so it never covers a digit
const callout = computed(() => {
    if (props.target === null) return null;
    const { row, column } = props.target;
    return { name: cellName(row, column), left: columnMiddle(column) };
});
</script>

<style scoped>
/* Takes the board's place and width in the page (centred, reaching into the page gutter, no larger than
   max-w-board-fit allows) and pads round it for the marks: the canvas's 18px, 12px, 24px and 22px less the
   board's own 8px padding. The board fills it. */
.blueprint-frame {
    --board-frame-block: 26px;
    --board-frame-inline: 18px;
    position: relative;
    isolation: isolate;
    align-self: center;
    width: calc(100% + 1.5rem);
    padding: 10px 4px 16px 14px;
}

:slotted([data-skin~="board"]) {
    --board-frame-inline: 0px;
    width: 100%;
}

/* Over the board's cells, digits and selection (up to z-index 4), and never in the way of a tap */
.blueprint-frame-marks {
    position: absolute;
    inset: 0;
    z-index: 8;
    pointer-events: none;
}

/* The board's cells: the frame's padding, the board's p-2 (8px) and the board grid's 3px border in */
.blueprint-frame-grid {
    position: absolute;
    inset: 21px 15px 27px 25px;
}

.blueprint-frame-columns {
    position: absolute;
    right: 0;
    bottom: calc(100% + 8px);
    left: 0;
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    text-align: center;
}

.blueprint-frame-rows {
    position: absolute;
    top: 0;
    right: calc(100% + 9px);
    bottom: 0;
    display: grid;
    grid-template-rows: repeat(9, minmax(0, 1fr));
    align-items: center;
    text-align: right;
}

.blueprint-frame-label {
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1;
    color: var(--color-foreground-secondary);
    /* On a block of the paper's colour, as the dimension's words, so no graph-paper line runs under a glyph */
    background-color: var(--color-background);
}

/* Grid items stretch to their track; these keep each label's paper to its own width */
.blueprint-frame-label[data-axis="column"] {
    justify-self: center;
}

.blueprint-frame-label[data-axis="row"] {
    justify-self: end;
}

/* The grid's width, end stops and a centre line, its words on a block of the paper's colour */
.blueprint-frame-dimension {
    position: absolute;
    top: calc(100% + 13px);
    right: 0;
    left: 0;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.blueprint-frame-dimension::before {
    content: "";
    position: absolute;
    top: 50%;
    right: 0;
    left: 0;
    height: 1px;
    background: var(--color-foreground-secondary);
}

.blueprint-frame-dimension::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
        linear-gradient(var(--color-foreground-secondary), var(--color-foreground-secondary)) left / 1px 100% no-repeat,
        linear-gradient(var(--color-foreground-secondary), var(--color-foreground-secondary)) right / 1px 100% no-repeat;
}

.blueprint-frame-dimension > span {
    position: relative;
    z-index: 1;
    padding: 0 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1;
    letter-spacing: 0.1em;
    color: var(--color-foreground-secondary);
    background: var(--color-background);
}

.blueprint-frame-register {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 1px solid var(--color-foreground-secondary);
    border-radius: 50%;
    background:
        linear-gradient(var(--color-foreground-secondary), var(--color-foreground-secondary)) center / 16px 1px no-repeat,
        linear-gradient(var(--color-foreground-secondary), var(--color-foreground-secondary)) center / 1px 16px no-repeat;
}

.blueprint-frame-register[data-corner="top-left"] { top: 1px; left: 4px; }
.blueprint-frame-register[data-corner="top-right"] { top: 1px; right: 0; }
.blueprint-frame-register[data-corner="bottom-left"] { bottom: 6px; left: 4px; }
.blueprint-frame-register[data-corner="bottom-right"] { right: 0; bottom: 6px; }

/* The tag hides its column's label and the row's label lights, so the pair reads as the cell's place */
.blueprint-frame-label[data-axis="column"][data-target] {
    visibility: hidden;
}

.blueprint-frame-label[data-axis="row"][data-target] {
    color: var(--color-primary);
}

/* The target cell's name in its column's label place: centred on the column, its foot on the labels' line
   8px above the cells, with a short leader down to the board grid's 3px top border, never over a cell */
/* Over the corner registration crosses, which a C1 or C9 tag reaches */
.blueprint-callout {
    position: absolute;
    z-index: 1;
    bottom: calc(100% + 8px);
    width: 0;
    height: 0;
}

.blueprint-callout::after {
    content: "";
    position: absolute;
    top: 100%;
    left: -0.75px;
    width: 1.5px;
    height: 5px;
    background: var(--color-primary);
}

.blueprint-callout-text {
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 2px 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
    color: var(--color-on-primary);
    background: var(--color-primary);
    transform: translateX(-50%);
}

/* The solved board, as the canvas's .aframe and .callout: a dashed frame of the primary locks the cells 9px round
   them, and the verdict hangs from its top right corner on a 34px leader up to the left, on the primary like the
   tag. Drawn at their end here; skin.css marches the dashes and pulls the leader out unless the board is still. */
.blueprint-frame-lock {
    position: absolute;
    inset: -9px;
    width: calc(100% + 18px);
    height: calc(100% + 18px);
    overflow: visible;
}

.blueprint-frame-verdict {
    position: absolute;
    z-index: 1;
    top: -9px;
    right: -6px;
    width: 0;
    height: 0;
}

.blueprint-frame-verdict::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 34px;
    height: 1.5px;
    background: var(--color-primary);
    transform-origin: 0 50%;
    transform: rotate(-140deg);
}

.blueprint-frame-verdict-text {
    position: absolute;
    right: 22px;
    bottom: 16px;
    padding: 2px 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
    color: var(--color-on-primary);
    background: var(--color-primary);
}
</style>
