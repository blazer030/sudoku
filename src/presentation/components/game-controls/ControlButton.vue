<template>
    <button
        class="flex items-center justify-center cursor-pointer"
        @click="$emit('click')"
    >
        <span
            :class="active
                ? 'bg-primary-light border-2 border-primary'
                : 'bg-card shadow-card-sm'"
            class="w-11 h-11 rounded-xl flex items-center justify-center"
        >
            <component
                :is="icon"
                :class="active ? 'text-primary' : 'text-foreground'"
                :size="22"
            />
        </span>
    </button>
</template>

<script lang="ts" setup>
import type { Component } from "vue";

withDefaults(defineProps<{
    icon: Component;
    active?: boolean;
}>(), { active: false });

defineEmits<{ click: [] }>();
</script>
