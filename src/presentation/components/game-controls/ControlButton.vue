<template>
    <button
        class="flex flex-col items-center gap-1 w-14 cursor-pointer"
        @click="$emit('click')"
    >
        <span
            :class="active
                ? 'bg-primary-light border-2 border-primary'
                : 'bg-card shadow-[0_1px_4px_#1A191808]'"
            class="w-11 h-11 rounded-xl flex items-center justify-center"
        >
            <component
                :is="icon"
                :class="active ? 'text-primary' : 'text-foreground'"
                :size="22"
            />
        </span>
        <span
            :class="active ? 'text-primary font-semibold' : 'text-foreground-secondary font-medium'"
            class="text-[11px]"
        >
            {{ label }}
        </span>
    </button>
</template>

<script lang="ts" setup>
import type { Component } from "vue";

withDefaults(defineProps<{
    label: string;
    icon: Component;
    active?: boolean;
}>(), { active: false });

defineEmits<{ click: [] }>();
</script>
