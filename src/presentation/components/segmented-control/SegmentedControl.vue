<template>
    <div class="flex h-12 w-full bg-card rounded-button shadow-card p-1">
        <button
            v-for="option in options"
            :key="option.value"
            :aria-pressed="modelValue === option.value"
            :class="modelValue === option.value
                ? 'bg-primary text-on-primary font-semibold shadow-primary-sm'
                : 'text-foreground-secondary font-medium hover:bg-foreground/5'"
            :data-testid="`${testIdPrefix}-${option.value}`"
            class="flex-1 h-full rounded-icon flex items-center justify-center text-sm transition-all cursor-pointer"
            @click="emit('update:modelValue', option.value)"
        >
            {{ option.label }}
        </button>
    </div>
</template>

<script lang="ts" setup generic="Value extends string">
export interface SegmentedOption<OptionValue extends string> {
    value: OptionValue;
    label: string;
}

defineProps<{
    options: readonly SegmentedOption<Value>[];
    modelValue: Value;
    testIdPrefix: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: Value] }>();
</script>
