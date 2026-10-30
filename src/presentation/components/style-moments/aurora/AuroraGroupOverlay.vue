<template>
    <!-- From GroupAurora: a streak of the aurora glides along each completed row or down each completed column, swept
         out from the cell just filled, and each completed box sends one ring of light out from its centre; skin.css
         draws and moves them. A streak runs 4px past its line on both long sides, where its mask fades it out. -->
    <template
        v-for="group in effect.groups"
        :key="`${group.kind}-${group.index}`"
    >
        <span
            v-if="group.kind === 'box'"
            :style="groupPlacement(group)"
            aria-hidden="true"
            class="aurora-group-ring pointer-events-none absolute"
        />
        <span
            v-else
            :class="BLEEDS[group.kind]"
            :data-kind="group.kind"
            :style="{ ...groupPlacement(group), transformOrigin: sweepOriginOf(group.kind) }"
            aria-hidden="true"
            class="aurora-group-ribbon pointer-events-none absolute box-content"
        />
    </template>
</template>

<script lang="ts" setup>
import { BOARD_SIZE } from "@/domain/board/constants";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { groupPlacement } from "@/presentation/components/style-moments/groupPlacement";

const props = defineProps<{
    effect: GroupEffect;
}>();

type LineKind = "row" | "column";

// GroupAurora's .streak runs 4px past its line on both long sides: padding round the line's own box, pulled back
// by as much, so the line still sits where groupPlacement puts it
const BLEEDS: Record<LineKind, string> = {
    row: "-mt-1 py-1",
    column: "-ml-1 px-1",
};

const percent = (part: number, whole: number): string => `${(part / whole * 100).toFixed(4)}%`;

// A streak sweeps out from the cell just filled, along its line
const sweepOriginOf = (kind: LineKind): string => {
    const { origin } = props.effect;
    if (kind === "row") return `${percent(origin.column + 0.5, BOARD_SIZE)} 50%`;
    return `50% ${percent(origin.row + 0.5, BOARD_SIZE)}`;
};
</script>
