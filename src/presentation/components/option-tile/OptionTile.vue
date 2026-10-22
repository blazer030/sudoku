<template>
    <button
        v-press
        :aria-pressed="pressed"
        :class="[
            pressed ? 'bg-primary border-primary text-on-primary' : 'bg-card border-border text-foreground',
            wide ? 'flex-row items-center gap-3 min-h-0' : 'flex-col gap-1.5 min-h-28',
        ]"
        class="relative flex border-2 rounded-2xl p-3 text-left cursor-pointer transition-colors"
        type="button"
        @click="emit('toggle')"
    >
        <component
            :is="icon"
            :class="pressed ? 'text-on-primary' : 'text-primary'"
            :size="20"
            class="shrink-0"
        />
        <span class="flex flex-col gap-0.5 min-w-0 flex-1">
            <span class="text-sm font-semibold">{{ label }}</span>
            <span
                :class="pressed ? 'text-on-primary' : 'text-foreground-secondary'"
                class="text-xs"
            >{{ description }}</span>
        </span>
        <!-- The state is shown by this mark as well as by colour: a check in a filled circle, or an empty ring -->
        <span
            :class="[
                pressed ? 'bg-on-primary text-primary' : 'border-2 border-border',
                wide ? '' : 'absolute top-3 right-3',
            ]"
            class="flex items-center justify-center size-5 rounded-full shrink-0"
            data-testid="option-tile-mark"
        >
            <Check
                v-if="pressed"
                :size="14"
                :stroke-width="3"
            />
        </span>
    </button>
</template>

<script lang="ts" setup>
import type { Component } from "vue";
import { Check } from "lucide-vue-next";
import { vPress } from "@/presentation/directives/press";

withDefaults(defineProps<{
    pressed: boolean;
    label: string;
    description: string;
    icon: Component;
    wide?: boolean;
}>(), { wide: false });

const emit = defineEmits<{ toggle: [] }>();
</script>
