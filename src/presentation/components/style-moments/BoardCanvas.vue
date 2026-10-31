<template>
    <!-- The current style's board-level canvas, if it draws its moments on one rather than in the skin -->
    <component
        :is="canvas"
        v-if="canvas"
        v-model:takes="takes"
        :celebration="celebration"
    />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useStyleMoments, type CelebrationPhase } from "@/presentation/components/style-moments/styleMoments";

defineProps<{
    celebration: CelebrationPhase | null;
}>();

/** The moments the canvas draws in the skin's place, for the board's `data-board-canvas`. */
const takes = defineModel<string | undefined>("takes");

const moments = useStyleMoments();
const canvas = computed(() => moments.value.boardCanvas ?? null);
</script>
