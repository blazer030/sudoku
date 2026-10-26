<template>
    <!-- From GroupChalk: a stick of yellow chalk (an orange marker on 白板) is dragged under each completed row and
         down the right of each completed column, and a wobbly ring goes round each completed box; a little dust
         drops off each stroke (黑板 only). skin.css draws them on, fades them and grains them in 黑板. -->
    <span
        v-for="group in effect.groups"
        :key="`${group.kind}-${group.index}`"
        class="chalkboard-group-line absolute text-primary"
        :data-kind="group.kind"
        :style="groupPlacement(group)"
    >
        <svg
            class="absolute inset-0 size-full overflow-visible"
            :viewBox="LINES[group.kind].viewBox"
            preserveAspectRatio="none"
        >
            <path
                class="chalkboard-group-stroke"
                :d="LINES[group.kind].path"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
            />
        </svg>
        <span
            v-for="(place, step) in DUST_PLACES[group.kind]"
            :key="step"
            :class="['chalkboard-group-dust absolute size-[3px] rounded-full', place]"
            :data-step="step"
        />
    </span>
</template>

<script lang="ts" setup>
import type { GroupKind } from "@/domain/game/Sudoku";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { groupPlacement } from "@/presentation/components/style-moments/groupPlacement";

defineProps<{
    effect: GroupEffect;
}>();

// GroupChalk's strokes, each in its group's own box (a row's is a cell high, a column's a cell wide)
const LINES: Record<GroupKind, { viewBox: string; path: string }> = {
    row: { viewBox: "0 0 351 39", path: "M8 36 C 120 33, 230 39, 343 34" },
    column: { viewBox: "0 0 39 351", path: "M36 8 C 33 120, 39 230, 34 343" },
    box: {
        viewBox: "0 0 117 117",
        path: "M60 4 C 102 4, 115 32, 112 62 C 109 98, 82 114, 54 112 C 20 110, 3 86, 6 52 C 9 22, 34 6, 74 8",
    },
};

// Where the dust drops: under a row and a box, beside a column, at three points along the stroke
const DUST_PLACES: Record<GroupKind, string[]> = {
    row: ["-bottom-1.5 left-[28%]", "-bottom-1.5 left-[58%]", "-bottom-1.5 left-[88%]"],
    column: ["-right-1.5 top-[28%]", "-right-1.5 top-[58%]", "-right-1.5 top-[88%]"],
    box: ["-bottom-1.5 left-[28%]", "-bottom-1.5 left-[58%]", "-bottom-1.5 left-[88%]"],
};
</script>
