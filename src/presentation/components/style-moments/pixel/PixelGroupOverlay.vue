<template>
    <!-- Pixel sparks at the ends of each completed row or column and at the corners of each completed box.
         skin.css pops them as the group's farthest cell blinks: --pixel-spark-reach is how many ripple
         steps that cell lies from the entered one. -->
    <span
        v-for="group in effect.groups"
        :key="`${group.kind}-${group.index}`"
        :class="['pixel-group-mark absolute z-[3]', `pixel-group-${group.kind}`]"
        :style="{ ...placementOf(group), '--pixel-spark-reach': reachOf(group) }"
    >
        <span
            v-for="spark in SPARKS[group.kind]"
            :key="spark"
            :class="['pixel-group-spark absolute -mt-0.5 -ml-0.5 size-1', spark]"
        />
    </span>
</template>

<script lang="ts" setup>
import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import type { CompletedGroup, GroupKind } from "@/domain/game/Sudoku";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";

const props = defineProps<{
    effect: GroupEffect;
}>();

// Where each spark sits on its group: just past both ends of a line, on a box's four corners
const SPARKS: Record<GroupKind, string[]> = {
    row: ["-left-2.5 top-1/2", "left-[calc(100%+10px)] top-1/2"],
    column: ["left-1/2 -top-2.5", "left-1/2 top-[calc(100%+10px)]"],
    box: ["left-0 top-0", "left-full top-0", "left-0 top-full", "left-full top-full"],
};

const percent = (cells: number): string => `${(cells / BOARD_SIZE) * 100}%`;

// The first row and column of a box, numbered from the top left
const boxCorner = (index: number): { row: number; column: number } =>
    ({ row: Math.floor(index / BOX_SIZE) * BOX_SIZE, column: (index % BOX_SIZE) * BOX_SIZE });

// Where the group lies on the board, in board percentages
const placementOf = (group: CompletedGroup): Record<string, string> => {
    if (group.kind === "row") return { left: "0%", top: percent(group.index), width: "100%", height: percent(1) };
    if (group.kind === "column") return { left: percent(group.index), top: "0%", width: percent(1), height: "100%" };
    const corner = boxCorner(group.index);
    return { left: percent(corner.column), top: percent(corner.row), width: percent(BOX_SIZE), height: percent(BOX_SIZE) };
};

const cellsOf = (group: CompletedGroup): { row: number; column: number }[] => {
    const offsets = Array.from({ length: BOARD_SIZE }, (_, offset) => offset);
    if (group.kind === "row") return offsets.map(column => ({ row: group.index, column }));
    if (group.kind === "column") return offsets.map(row => ({ row, column: group.index }));
    const corner = boxCorner(group.index);
    return offsets.map(offset => ({ row: corner.row + Math.floor(offset / BOX_SIZE), column: corner.column + (offset % BOX_SIZE) }));
};

// The group's farthest cell from the entered one, in ripple steps, as the cells' own delay counts them
const reachOf = (group: CompletedGroup): number => {
    const { origin } = props.effect;
    return Math.max(...cellsOf(group).map(cell => Math.abs(cell.row - origin.row) + Math.abs(cell.column - origin.column)));
};
</script>
