<template>
    <button
        v-press:tint
        :aria-checked="checked"
        class="flex items-center gap-3 w-full min-h-13 py-2 px-1 text-left cursor-pointer"
        data-skin="setting-row"
        role="switch"
        type="button"
        @click="emit('toggle')"
    >
        <component
            :is="icon"
            :size="20"
            class="shrink-0 text-primary"
        />
        <span class="flex flex-col gap-0.5 flex-1 min-w-0">
            <span class="text-foreground text-[15px] font-medium">{{ label }}</span>
            <span class="text-foreground-muted text-[13px]">{{ description }}</span>
        </span>
        <!-- The state shows as the knob's side as well as by colour -->
        <span
            :class="checked ? 'bg-primary border-primary' : 'bg-transparent border-foreground-muted'"
            class="relative shrink-0 w-11 h-6 rounded-full border-2 transition-colors duration-200"
            data-skin="switch"
        >
            <span
                :class="checked ? 'translate-x-5 bg-on-primary' : 'translate-x-0 bg-foreground-muted'"
                class="absolute top-0.5 left-0.5 size-4 rounded-full transition-transform duration-200 motion-reduce:transition-none"
                data-skin="switch-knob"
            />
        </span>
    </button>
</template>

<script lang="ts" setup>
import type { Component } from "vue";
import { vPress } from "@/presentation/directives/press";

defineProps<{
    checked: boolean;
    label: string;
    description: string;
    icon: Component;
}>();

const emit = defineEmits<{ toggle: [] }>();
</script>
