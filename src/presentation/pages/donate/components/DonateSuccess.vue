<template>
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-background z-30">
        <FireworkCanvas />
        <div class="relative flex flex-col items-center gap-4 p-6">
            <span class="text-6xl">{{ emoji }}</span>
            <span class="text-foreground text-2xl font-semibold text-center">
                {{ t(`donate.thanks.${props.tier}`) }}
            </span>
            <button
                class="mt-6 px-8 py-3 bg-primary text-white rounded-2xl font-medium cursor-pointer"
                data-testid="donate-success-done"
                @click="$emit('done')"
            >
                {{ t("donate.done") }}
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import FireworkCanvas from "@/presentation/pages/game/components/FireworkCanvas.vue";
import type { DonateTier } from "@/application/analytics/AnalyticsService";

const { t } = useI18n();
const props = defineProps<{ tier: DonateTier }>();
defineEmits<{ done: [] }>();

const TIER_EMOJI: Record<DonateTier, string> = {
    coffee: "☕",
    lunch: "🍱",
    coding_time: "💻",
};

const emoji = computed(() => TIER_EMOJI[props.tier]);
</script>
