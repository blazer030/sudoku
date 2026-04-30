<template>
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-background z-30">
        <FireworkCanvas />
        <div class="relative flex flex-col items-center gap-4 p-6">
            <span class="text-6xl">{{ emoji }}</span>
            <span class="text-foreground text-2xl font-semibold text-center">
                Thank you for the {{ label }}!
            </span>
            <button
                class="mt-6 px-8 py-3 bg-primary text-white rounded-2xl font-medium cursor-pointer"
                data-testid="donate-success-done"
                @click="$emit('done')"
            >
                Done
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import FireworkCanvas from "@/presentation/pages/game/components/FireworkCanvas.vue";
import type { DonateTier } from "@/application/analytics/AnalyticsService";

const props = defineProps<{ tier: DonateTier }>();
defineEmits<{ done: [] }>();

const TIER_META: Record<DonateTier, { emoji: string; label: string }> = {
    coffee:       { emoji: "☕", label: "Coffee" },
    lunch:        { emoji: "🍱", label: "Lunch" },
    coding_time:  { emoji: "💻", label: "Coding Time" },
};

const emoji = computed(() => TIER_META[props.tier].emoji);
const label = computed(() => TIER_META[props.tier].label);
</script>
