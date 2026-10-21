<template>
    <button
        :aria-label="label"
        :aria-pressed="pressed === null ? undefined : pressed"
        class="flex flex-col items-center gap-1 cursor-pointer"
        @click="$emit('click')"
    >
        <span
            v-press
            :class="pressed
                ? 'bg-primary text-on-primary shadow-primary-active'
                : 'bg-card text-foreground shadow-card-sm hover:bg-foreground/5'"
            class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
            data-testid="control-tile"
        >
            <component
                :is="icon"
                :size="22"
            />
        </span>
        <span
            :class="pressed ? 'text-primary font-semibold' : 'text-foreground-secondary font-medium'"
            class="text-[11px] leading-none whitespace-nowrap"
        >{{ visibleText ?? label }}</span>
    </button>
</template>

<script lang="ts" setup>
import type { Component } from "vue";
import { vPress } from "@/presentation/directives/press";

withDefaults(defineProps<{
    icon: Component;
    /** The accessible name; it stays fixed so a toggle's state is carried by aria-pressed alone. */
    label: string;
    /** On-screen text when it differs from the accessible name (e.g. "Notes on"). */
    visibleText?: string;
    /** A toggle's state; null for a plain action button. */
    pressed?: boolean | null;
}>(), { pressed: null, visibleText: undefined });

defineEmits<{ click: [] }>();
</script>
