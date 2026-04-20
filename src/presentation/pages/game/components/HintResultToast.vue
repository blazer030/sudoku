<template>
    <Transition name="toast">
        <div
            v-if="outcome"
            class="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 bg-foreground text-background text-sm px-4 py-3 rounded-xl shadow-lg max-w-[90%]"
            data-testid="hint-result-toast"
        >
            <span v-if="outcome.fallback">
                Random reveal: Row {{ outcome.cell.row + 1 }}, Col {{ outcome.cell.column + 1 }} = {{ outcome.value }}
            </span>
            <span v-else-if="outcome.step">
                {{ TECHNIQUE_LABELS[outcome.step.technique] }}:
                Row {{ outcome.cell.row + 1 }}, Col {{ outcome.cell.column + 1 }} = {{ outcome.value }}
            </span>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import type { RevealOutcome } from "@/domain/game/RevealOutcome";
import { TECHNIQUE_LABELS } from "@/presentation/labels/techniqueLabels";

defineProps<{
    outcome: RevealOutcome | null;
}>();
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: opacity 200ms ease, transform 200ms ease;
}
.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translate(-50%, 10px);
}
</style>
