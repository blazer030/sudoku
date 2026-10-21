<template>
    <SegmentedControl
        :model-value="modelValue"
        :options="options"
        data-testid="difficulty-switcher"
        test-id-prefix="difficulty"
        @update:model-value="emit('update:modelValue', $event)"
    />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { type Difficulty } from "@/domain";
import { useDifficultyLabel } from "@/presentation/labels/difficultyLabels";
import SegmentedControl from "@/presentation/components/segmented-control/SegmentedControl.vue";

defineProps<{ modelValue: Difficulty }>();
const emit = defineEmits<{ "update:modelValue": [value: Difficulty] }>();

const difficultyLabel = useDifficultyLabel();
const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const options = computed(() => difficulties.map(difficulty => ({ value: difficulty, label: difficultyLabel(difficulty) })));
</script>
