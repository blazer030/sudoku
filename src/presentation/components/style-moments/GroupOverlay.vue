<template>
    <!-- A board-sized layer for the pieces a style draws over a completed group; empty by default -->
    <div
        aria-hidden="true"
        class="absolute inset-0 pointer-events-none"
        data-testid="group-overlay"
    >
        <component
            :is="overlay"
            v-if="overlay && effect"
            :key="effect.id"
            :effect="effect"
        />
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useStyleMoments, type GroupEffect } from "@/presentation/components/style-moments/styleMoments";

defineProps<{
    effect: GroupEffect | null;
}>();

const moments = useStyleMoments();
const overlay = computed(() => moments.value.groupOverlay ?? null);
</script>
