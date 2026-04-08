<template>
    <button
        class="flex items-center justify-center cursor-pointer"
        @click="$emit('click')"
    >
        <span
            :class="active
                ? 'bg-accent/15 border-2 border-accent'
                : 'bg-card shadow-card-sm hover:bg-foreground/5'"
            class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
        >
            <component
                :is="icon"
                :class="active ? 'text-accent' : 'text-foreground'"
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
