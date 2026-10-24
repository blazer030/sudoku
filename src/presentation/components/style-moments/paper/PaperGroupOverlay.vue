<template>
    <!-- A pencil strike along each completed row or column and a loop round each completed box; skin.css
         draws them in the theme's ink and fades them -->
    <svg
        v-for="group in effect.groups"
        :key="`${group.kind}-${group.index}`"
        :class="['paper-group-mark absolute overflow-visible', `paper-group-${group.kind}`]"
        :style="placementOf(group)"
        :viewBox="MARKS[group.kind].viewBox"
        preserveAspectRatio="none"
    >
        <path
            class="paper-group-stroke"
            :d="MARKS[group.kind].path"
        />
    </svg>
</template>

<script lang="ts" setup>
import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import type { CompletedGroup, GroupKind } from "@/domain/game/Sudoku";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";

defineProps<{
    effect: GroupEffect;
}>();

// One hand-drawn path per kind of group, drawn in its own box; the boxes keep a cell's proportions
const MARKS: Record<GroupKind, { viewBox: string; path: string }> = {
    row: { viewBox: "0 0 351 39", path: "M6 21 C 90 17, 180 24, 345 18" },
    column: { viewBox: "0 0 39 351", path: "M20 6 C 17 90, 23 200, 19 345" },
    box: {
        viewBox: "0 0 117 117",
        path: "M58 5 C 100 3, 114 30, 112 62 C 108 100, 80 113, 52 111 C 19 109, 4 84, 7 52 C 10 22, 34 7, 72 7",
    },
};

const percent = (cells: number): string => `${(cells / BOARD_SIZE) * 100}%`;

// Where the group lies on the board, in board percentages
const placementOf = (group: CompletedGroup): Record<string, string> => {
    if (group.kind === "row") return { left: "0%", top: percent(group.index), width: "100%", height: percent(1) };
    if (group.kind === "column") return { left: percent(group.index), top: "0%", width: percent(1), height: "100%" };
    return {
        left: percent((group.index % BOX_SIZE) * BOX_SIZE),
        top: percent(Math.floor(group.index / BOX_SIZE) * BOX_SIZE),
        width: percent(BOX_SIZE),
        height: percent(BOX_SIZE),
    };
};
</script>
