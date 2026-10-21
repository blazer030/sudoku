<template>
    <svg
        v-if="links.length > 0"
        :viewBox="`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`"
        class="absolute inset-0 w-full h-full pointer-events-none text-primary"
        data-testid="hint-link-overlay"
        preserveAspectRatio="none"
    >
        <line
            v-for="(link, index) in links"
            :key="`link-${index}`"
            :stroke-dasharray="link.type === 'weak' ? '0.12 0.09' : undefined"
            :x1="anchor(link.from, link.digit).x"
            :x2="anchor(link.to, link.digit).x"
            :y1="anchor(link.from, link.digit).y"
            :y2="anchor(link.to, link.digit).y"
            opacity="0.75"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="0.045"
        />
    </svg>
</template>

<script lang="ts" setup>
import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import type { CellReference, ChainLink } from "@/domain/solver/SolveStep";

defineProps<{ links: ChainLink[] }>();

// Lines meet the candidate digit they link inside the 3×3 note grid, not the cell centre.
const anchor = (cell: CellReference, digit: number) => {
    if (digit < 1) return { x: cell.column + 0.5, y: cell.row + 0.5 };
    return {
        x: cell.column + (((digit - 1) % BOX_SIZE) + 0.5) / BOX_SIZE,
        y: cell.row + (Math.floor((digit - 1) / BOX_SIZE) + 0.5) / BOX_SIZE,
    };
};
</script>
