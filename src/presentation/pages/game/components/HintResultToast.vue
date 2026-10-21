<template>
    <Transition name="toast">
        <div
            v-if="outcome"
            class="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 w-max bg-foreground text-background text-sm px-4 py-3 rounded-xl shadow-lg max-w-[90%]"
            data-testid="hint-result-toast"
        >
            <span v-if="outcome.fallback">
                {{ t("game.randomReveal", { position: position(outcome) }) }}
            </span>
            <span v-else-if="outcome.step">
                {{ t("game.hintResult", { technique: techniqueLabel(outcome.step.technique), position: position(outcome) }) }}
            </span>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import type { RevealOutcome } from "@/domain/game/RevealOutcome";
import { useI18n } from "vue-i18n";
import { useTechniqueLabel } from "@/presentation/labels/techniqueLabels";

defineProps<{
    outcome: RevealOutcome | null;
}>();

const { t } = useI18n();
const techniqueLabel = useTechniqueLabel();

const position = (outcome: RevealOutcome) =>
    t("position.cell", { row: outcome.cell.row + 1, column: outcome.cell.column + 1, value: outcome.value });
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
