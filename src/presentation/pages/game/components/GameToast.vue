<template>
    <Transition name="toast">
        <div
            v-if="content"
            class="pointer-events-none fixed left-1/2 -translate-x-1/2 bottom-safe-24 z-50 w-max bg-toast text-on-toast text-sm text-balance px-4 py-3 rounded-xl shadow-lg max-w-[90%]"
            data-testid="game-toast"
        >
            <span>
                {{ message(content) }}
            </span>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import type { RevealOutcome } from "@/domain/game/RevealOutcome";
import type { ToastContent } from "@/presentation/pages/game/useGameToast";
import { useI18n } from "vue-i18n";

defineProps<{
    content: ToastContent | null;
}>();

const { t } = useI18n();

const position = (outcome: RevealOutcome) =>
    t("position.cell", { row: outcome.cell.row + 1, column: outcome.cell.column + 1, value: outcome.value });

const message = (content: ToastContent): string => {
    switch (content.kind) {
    case "randomReveal":
        return t("game.randomReveal", { position: position(content.outcome) });
    case "noConflicts":
        return t("game.toast.noConflicts");
    case "longPressTip":
        return t("game.toast.longPressTip");
    }
};
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
