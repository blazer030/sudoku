<template>
    <div class="relative flex h-12 w-full bg-card rounded-button shadow-card p-1">
        <div
            v-if="selectedIndex >= 0"
            :class="{ 'segmented-indicator-motion': withMotion }"
            :style="{
                width: `calc((100% - 0.5rem) / ${options.length})`,
                transform: `translateX(${selectedIndex * 100}%)`,
            }"
            class="absolute top-1 bottom-1 left-1 rounded-icon bg-primary shadow-primary-sm"
            data-testid="segmented-indicator"
        />
        <button
            v-for="option in options"
            :key="option.value"
            v-press
            :aria-pressed="modelValue === option.value"
            :class="modelValue === option.value
                ? 'text-on-primary font-semibold'
                : 'text-foreground-secondary font-medium hover:bg-foreground/5'"
            :data-testid="`${testIdPrefix}-${option.value}`"
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
}>();

const emit = defineEmits<{ "update:modelValue": [value: Value] }>();

// The indicator slides between options; with reduced motion it jumps
const withMotion = !prefersReducedMotion();
const selectedIndex = computed(() => props.options.findIndex(option => option.value === props.modelValue));
</script>
