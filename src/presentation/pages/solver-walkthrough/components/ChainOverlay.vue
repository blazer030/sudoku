<template>
    <svg
        v-if="chainLinks.length > 0"
        class="absolute inset-0 pointer-events-none text-primary"
        :viewBox="`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`"
        preserveAspectRatio="none"
        data-testid="chain-overlay"
    >
        <line
            v-for="(link, index) in chainLinks"
            :key="`link-${index}`"
            :x1="link.from.column + 0.5"
            :y1="link.from.row + 0.5"
            :x2="link.to.column + 0.5"
            :y2="link.to.row + 0.5"
            stroke="currentColor"
            stroke-width="0.06"
            stroke-linecap="round"
            :stroke-dasharray="link.type === 'weak' ? '0.18 0.12' : undefined"
            :data-testid="`chain-link-${index}`"
        />
    </svg>
</template>

<script lang="ts" setup>
import { BOARD_SIZE } from "@/domain/board/constants";
import type { ChainLink } from "@/domain/solver/SolveStep";

defineProps<{
    chainLinks: ChainLink[];
}>();
</script>
