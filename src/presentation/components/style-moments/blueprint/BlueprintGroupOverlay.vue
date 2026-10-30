<template>
    <!-- From GroupBlueprint: a dimension line of the primary, an end stop at each end, snaps out along each completed
         row's top edge (R5 · 9) and down each completed column's left edge (C5 · 9), and a dashed outline of the
         primary snaps round each completed box (B5), each from the cell just filled; skin.css snaps and fades them. -->
    <span
        v-for="group in effect.groups"
        :key="`${group.kind}-${group.index}`"
        :data-kind="group.kind"
        :style="{ ...groupPlacement(group), transformOrigin: snapOriginOf(group) }"
        class="blueprint-group-dimension absolute"
    >
        <span
            v-if="group.kind === 'box'"
            class="absolute -inset-1"
        >
            <!-- A dashed SVG line, not a dashed border: WebKit leaves out a 1.5px dashed border's sides -->
            <svg class="blueprint-group-frame absolute inset-0 size-full overflow-visible text-primary">
                <rect
                    fill="none"
                    height="100%"
                    stroke="currentColor"
                    stroke-dasharray="4.5 3"
                    stroke-width="1.5"
                    width="100%"
                />
            </svg>
            <span :class="[LABEL_CLASSES, '-left-0.5 -top-3.5']">{{ labelOf(group) }}</span>
        </span>
        <span
            v-else
            :class="['absolute', RULERS[group.kind].ruler]"
        >
            <span :class="['blueprint-group-line absolute bg-primary', RULERS[group.kind].line]" />
            <span
                v-for="stop in RULERS[group.kind].stops"
                :key="stop"
                :class="['blueprint-group-stop absolute bg-primary', stop]"
            />
            <span :class="[LABEL_CLASSES, RULERS[group.kind].label]">{{ labelOf(group) }}</span>
        </span>
    </span>
</template>

<script lang="ts" setup>
import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import type { CompletedGroup } from "@/domain/game/Sudoku";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { boxCorner, groupPlacement } from "@/presentation/components/style-moments/groupPlacement";

const props = defineProps<{
    effect: GroupEffect;
}>();

type LineKind = "row" | "column";

// GroupBlueprint's .dim: a 10px band centred on the line's leading edge, its 1.5px line through the middle, a stop
// across each end and the label on the line, on the paper (a column's turned to run down it)
const RULERS: Record<LineKind, { ruler: string; line: string; stops: string[]; label: string }> = {
    row: {
        ruler: "inset-x-0 -top-[5px] h-[10px]",
        line: "inset-x-0 top-1/2 h-[1.5px]",
        stops: ["inset-y-0 left-0 w-[1.5px]", "inset-y-0 right-0 w-[1.5px]"],
        label: "left-1/2 -top-px -translate-x-1/2",
    },
    column: {
        ruler: "inset-y-0 -left-[5px] w-[10px]",
        line: "inset-y-0 left-1/2 w-[1.5px]",
        stops: ["inset-x-0 top-0 h-[1.5px]", "inset-x-0 bottom-0 h-[1.5px]"],
        label: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90",
    },
};

const LABEL_CLASSES = "blueprint-group-label absolute whitespace-nowrap bg-background px-1 font-mono text-[10px] leading-3 font-medium text-primary";

const percent = (part: number, whole: number): string => `${(part / whole * 100).toFixed(4)}%`;

// Each piece snaps out from the cell just filled: a line from that cell along it, a box from that cell's place in it
const snapOriginOf = (group: CompletedGroup): string => {
    const { origin } = props.effect;
    if (group.kind === "row") return `${percent(origin.column + 0.5, BOARD_SIZE)} 50%`;
    if (group.kind === "column") return `50% ${percent(origin.row + 0.5, BOARD_SIZE)}`;
    const corner = boxCorner(group.index);
    return `${percent(origin.column - corner.column + 0.5, BOX_SIZE)} ${percent(origin.row - corner.row + 0.5, BOX_SIZE)}`;
};

// A drawing's codes, the same in both languages: a line's with its nine cells, a box's alone
const labelOf = (group: CompletedGroup): string => {
    if (group.kind === "row") return `R${group.index + 1} · ${BOARD_SIZE}`;
    if (group.kind === "column") return `C${group.index + 1} · ${BOARD_SIZE}`;
    return `B${group.index + 1}`;
};
</script>
