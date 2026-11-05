<template>
    <Transition name="hint-popup">
        <div
            v-if="visible"
            class="fixed inset-0 z-50"
        >
            <div
                class="absolute inset-0 bg-scrim/30"
                data-skin="dialog-scrim"
                data-testid="hint-overlay"
                @click="close('close')"
            />
            <div
                class="absolute bottom-safe-24 left-1/2 -translate-x-1/2 bg-card rounded-popup shadow-popup w-72 z-10 flex flex-col gap-1 py-4 px-3"
                data-skin="card"
                data-testid="hint-menu"
            >
                <span
                    class="px-3 pb-1 text-foreground text-sm font-bold"
                    data-testid="hint-title"
                >{{ t("game.hints.title") }}</span>

                <button
                    v-press
                    class="hint-option"
                    data-skin="menu-option"
                    data-testid="hint-check-conflicts"
                    @click="close('checkConflicts')"
                >
                    <ScanSearch
                        :size="20"
                        class="text-foreground shrink-0"
                    />
                    <span class="flex flex-col items-start text-left">
                        <span>{{ t("game.hints.checkConflicts") }}</span>
                        <span
                            class="text-[12px] text-foreground-secondary font-normal text-balance"
                            data-testid="hint-check-conflicts-description"
                        >{{ t("game.hints.checkConflictsDescription") }}</span>
                    </span>
                </button>

                <div
                    class="h-px bg-border mx-3"
                    data-skin="menu-divider"
                />

                <button
                    v-press
                    class="hint-option"
                    data-skin="menu-option"
                    data-testid="hint-reveal-cell"
                    @click="close('revealCell')"
                >
                    <Eye
                        :size="20"
                        class="text-primary shrink-0"
                    />
                    <span class="text-primary font-semibold">{{ t("game.hints.revealCell") }}</span>
                </button>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Eye, ScanSearch } from "@/presentation/components/icon";
import { useHintMenu } from "@/presentation/pages/game/components/useHintMenu";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();
const { visible, close } = useHintMenu();
</script>

<style scoped>
@reference "../../../../style/index.css";

.hint-option {
    @apply w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-foreground cursor-pointer transition-all duration-200 hover:bg-foreground/5;
}
</style>
