<template>
    <div
        class="flex h-12 w-full bg-card rounded-button shadow-card p-1"
        data-testid="difficulty-switcher"
    >
        <button
            v-for="difficulty in difficulties"
            :key="difficulty"
            :class="modelValue === difficulty
                ? 'bg-primary text-on-primary font-semibold shadow-primary-sm'
                : 'text-foreground-secondary font-medium hover:bg-foreground/5'"
            :data-testid="`difficulty-${difficulty}`"
            class="flex-1 h-full rounded-icon flex items-center justify-center text-sm transition-all cursor-pointer"
            @click="$emit('update:modelValue', difficulty)"
        >
            {{ difficultyLabel(difficulty) }}
        </button>
    </div>
</template>

<script lang="ts" setup>
import { type Difficulty } from "@/domain";
import { useDifficultyLabel } from "@/presentation/labels/difficultyLabels";

defineProps<{ modelValue: Difficulty }>();
defineEmits<{ "update:modelValue": [value: Difficulty] }>();

const difficultyLabel = useDifficultyLabel();
const difficulties: Difficulty[] = ["easy", "medium", "hard"];
</script>
