<template>
    <Transition name="hint-popup">
        <div
            v-if="visible"
            class="fixed inset-0 z-50"
        >
            <div
                class="absolute inset-0 bg-scrim/30"
                data-testid="hint-overlay"
                @click="close('close')"
            />
            <div
                class="absolute bottom-safe-24 left-1/2 -translate-x-1/2 bg-card rounded-popup shadow-popup w-72 z-10 flex flex-col gap-1 py-4 px-3"
                data-skin="card"
                data-testid="hint-menu"
            >
                <div class="flex flex-col px-3 pb-1">
                    <div class="flex flex-wrap items-baseline gap-x-2">
                        <span
                            class="text-foreground text-sm font-bold"
                            data-testid="hint-title"
                        >{{ t("game.hints.title") }}</span>
                        <span
                            v-if="params?.firstHintFree"
                            class="flex-1 min-w-[9rem] text-foreground-muted text-[11px] text-left text-pretty"
                            data-testid="hint-free-note"
                        >{{ t("game.hints.freeNote") }}</span>
                    </div>
                    <span
                        v-if="remaining > 0"
                        class="text-[13px] text-foreground-secondary text-balance"
                        data-testid="hint-remaining"
                    >{{ t("game.hints.remaining", { count: remaining }, remaining) }}</span>
                    <span
                        v-else
                        class="text-[13px] text-foreground-secondary text-balance"
                        data-testid="hint-used-up"
                    >{{ t("game.hints.usedUp", { max: MAX_HINTS }) }}</span>
                </div>

                <button
                    v-press
                    :disabled="remaining === 0"
                    class="hint-option"
                    data-testid="hint-auto-notes"
                    @click="close('autoNotes')"
                >
                    <Sparkles
                        :size="20"
                        class="text-foreground shrink-0"
                    />
                    <span>{{ t("game.hints.autoNotes") }}</span>
                </button>

                <button
                    v-press
                    :disabled="remaining === 0"
                    class="hint-option"
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

                <div class="h-px bg-border mx-3" />

                <button
                    v-press
                    :disabled="remaining === 0"
                    class="hint-option"
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
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Eye, ScanSearch, Sparkles } from "lucide-vue-next";
import { MAX_HINTS } from "@/domain/game/HintTracker";
import { useHintMenu } from "@/presentation/pages/game/components/useHintMenu";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();
const { visible, params, close } = useHintMenu();

const remaining = computed(() => params.value?.remaining ?? 0);
</script>

<style scoped>
@reference "../../../../style/index.css";

.hint-option {
    @apply w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-foreground cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:bg-foreground/5;
}
</style>
