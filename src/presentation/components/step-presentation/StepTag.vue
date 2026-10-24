<template>
    <Transition
        mode="out-in"
        name="step-swap"
    >
        <span
            :key="`tag-${stepKey}`"
            :class="strong ? 'bg-primary text-on-primary' : 'bg-primary-light text-primary'"
            :data-skin="strong ? 'tag step strong' : 'tag step'"
            :data-testid="testId"
            class="inline-flex items-center gap-1.5 rounded-full text-[13px] font-semibold pl-2 pr-2.5 py-1 leading-none whitespace-nowrap"
        >
            <component
                :is="icon"
                :size="14"
            />
            {{ label }}
        </span>
    </Transition>
</template>

<script lang="ts" setup>
import type { Component } from "vue";

defineProps<{
    label: string;
    icon: Component;
    /** Solid primary for the step that settles something; otherwise the light tint. */
    strong: boolean;
    stepKey: string | number;
    testId: string;
}>();
</script>
