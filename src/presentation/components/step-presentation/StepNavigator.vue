<template>
    <div class="flex items-center gap-1 shrink-0">
        <button
            v-press
            :aria-label="t('stepPanel.previousStep')"
            :data-testid="`${testIdPrefix}-previous`"
            :disabled="stepIndex <= 0"
            class="step-arrow"
            @click="emit('previous')"
        >
            <ChevronLeft :size="20" />
        </button>
        <template v-if="totalSteps > MAX_STEP_DOTS">
            <span
                :data-testid="`${testIdPrefix}-step-counter`"
                aria-hidden="true"
                class="min-w-11 text-center text-[13px] font-semibold tabular-nums text-foreground-secondary"
            >
                {{ t("stepPanel.stepCount", { current: stepIndex + 1, total: totalSteps }) }}
            </span>
            <span
                :data-testid="`${testIdPrefix}-step-counter-label`"
                class="sr-only"
            >
                {{ t("stepPanel.stepCounter", { current: stepIndex + 1, total: totalSteps }) }}
            </span>
        </template>
        <div
            v-else
            class="flex items-center gap-1 px-0.5"
        >
            <button
                v-for="index in totalSteps"
                :key="`dot-${index}`"
                :aria-current="index - 1 === stepIndex ? 'step' : undefined"
                :aria-label="t('stepPanel.stepCounter', { current: index, total: totalSteps })"
                :class="dotClass(index - 1)"
                :data-testid="`${testIdPrefix}-dot-${index - 1}`"
                class="h-2 rounded-full transition-all duration-300 cursor-pointer"
                data-skin="step-dot"
                @click="emit('goTo', index - 1)"
            />
        </div>
        <button
            v-press
            :aria-label="t('stepPanel.nextStep')"
            :data-testid="`${testIdPrefix}-next`"
            :disabled="stepIndex >= totalSteps - 1"
            class="step-arrow"
            @click="emit('next')"
        >
            <ChevronRight :size="20" />
        </button>
    </div>
</template>

<script lang="ts">
// Beyond this many steps the dots, the arrows and the longest technique name no longer fit
// one row of a 360px-wide panel, so a "3 / 8" counter takes the dots' place.
export const MAX_STEP_DOTS = 6;
</script>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { vPress } from "@/presentation/directives/press";

const props = defineProps<{
    stepIndex: number;
    totalSteps: number;
    testIdPrefix: string;
}>();

const emit = defineEmits<{
    previous: [];
    next: [];
    goTo: [index: number];
}>();

const { t } = useI18n();

const dotClass = (index: number): string => {
    if (index === props.stepIndex) return "w-5 bg-primary";
    if (index < props.stepIndex) return "w-2 bg-primary/40";
    return "w-2 bg-border";
};
</script>

<style scoped>
@reference "../../../style/index.css";

.step-arrow {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-foreground cursor-pointer transition-all duration-200 hover:bg-foreground/5 disabled:opacity-25 disabled:cursor-default;
}
</style>
