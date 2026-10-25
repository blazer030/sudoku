<template>
    <div
        :data-skin="skin ? `segmented ${skin}` : 'segmented'"
        :class="inset ? 'bg-background' : 'bg-card shadow-card'"
        :style="{ gap: 'var(--segmented-gap, 0px)', paddingInline: 'var(--segmented-padding, 0.25rem)' }"
        class="relative isolate flex h-12 w-full rounded-button"
    >
        <div
            v-if="selectedIndex >= 0"
            :class="{ 'segmented-indicator-motion': withMotion }"
            :style="indicatorStyle"
            class="absolute rounded-icon bg-primary shadow-primary-sm"
            data-skin="segmented-indicator"
            data-testid="segmented-indicator"
        />
        <button
            v-for="option in options"
            :key="option.value"
            v-press
            :aria-pressed="modelValue === option.value"
            :class="modelValue === option.value
                ? 'text-on-primary font-semibold'
                : 'text-foreground-secondary font-medium hover:text-foreground'"
            :data-testid="`${testIdPrefix}-${option.value}`"
            data-skin="segment"
            class="relative z-10 flex-1 h-full rounded-icon flex items-center justify-center text-sm transition-all cursor-pointer"
            @click="emit('update:modelValue', option.value)"
        >
            {{ option.label }}
        </button>
    </div>
</template>

<script lang="ts" setup generic="Value extends string">
import { computed } from "vue";
import { vPress } from "@/presentation/directives/press";
import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";

export interface SegmentedOption<OptionValue extends string> {
    value: OptionValue;
    label: string;
}

const props = defineProps<{
    options: readonly SegmentedOption<Value>[];
    modelValue: Value;
    testIdPrefix: string;
    // Recessed track for use on a card surface: background tone, no shadow
    inset?: boolean;
    /** More skin tokens for a style to tell this control apart, such as "menu" for a list of choices */
    skin?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: Value] }>();

// The indicator slides between options; with reduced motion it jumps
const withMotion = !prefersReducedMotion();
const selectedIndex = computed(() => props.options.findIndex(option => option.value === props.modelValue));

// A skin can set --segmented-gap (space between options) and --segmented-padding (the strip's inner padding);
// the indicator's size and step follow both, so it still lands exactly on the chosen option
const indicatorStyle = computed(() => ({
    top: "var(--segmented-padding, 0.25rem)",
    bottom: "var(--segmented-padding, 0.25rem)",
    left: "var(--segmented-padding, 0.25rem)",
    width: `calc((100% - 2 * var(--segmented-padding, 0.25rem) - ${props.options.length - 1} * var(--segmented-gap, 0px)) / ${props.options.length})`,
    transform: `translateX(calc(${selectedIndex.value} * (100% + var(--segmented-gap, 0px))))`,
}));
</script>
