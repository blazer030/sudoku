<template>
    <Transition name="hint-popup">
        <div
            v-if="visible"
            class="fixed inset-0 z-50"
        >
            <div
                class="absolute inset-0 bg-black/30"
                data-testid="hint-overlay"
                @click="close('close')"
            />
            <div
                class="absolute bottom-24 left-1/2 -translate-x-1/2 bg-card rounded-popup shadow-popup w-55 z-10 flex flex-col gap-1 py-4 px-3"
            >
                <div class="flex items-center justify-between px-3 pb-1">
                    <span class="text-foreground text-sm font-bold">Hints</span>
                    <div class="flex items-center gap-1">
                        <div
                            v-for="i in 3"
                            :key="i"
                            :class="[
                                'w-2 h-2 rounded-full',
                                i <= remaining ? 'bg-primary' : 'border-[1.5px] border-border',
                            ]"
                            data-testid="hint-light"
                        />
                    </div>
                </div>

                <span class="text-foreground-muted text-[11px] mb-1 text-center">
                    First use is free and won't be recorded.
                </span>

                <button
                    :disabled="!params?.canUseHint"
                    class="hint-option"
                    data-testid="hint-auto-notes"
                    @click="close('autoNotes')"
                >
                    <Sparkles
                        :size="20"
                        class="text-foreground shrink-0"
                    />
                    <span>Auto Notes</span>
                </button>

                <button
                    :disabled="!params?.canUseHint"
                    class="hint-option"
                    data-testid="hint-check-conflicts"
                    @click="close('checkConflicts')"
                >
                    <ScanSearch
                        :size="20"
                        class="text-foreground shrink-0"
                    />
                    <span>Check Conflicts</span>
                </button>

                <button
                    :disabled="!params?.canUseHint"
                    class="hint-option"
                    data-testid="hint-check-errors"
                    @click="close('checkErrors')"
                >
                    <CircleAlert
                        :size="20"
                        class="text-foreground shrink-0"
                    />
                    <span>Check Errors</span>
                </button>

                <div class="h-px bg-border mx-3" />

                <button
                    :disabled="!params?.canUseHint"
                    class="hint-option"
                    data-testid="hint-reveal-cell"
                    @click="close('revealCell')"
                >
                    <Eye
                        :size="20"
                        class="text-primary shrink-0"
                    />
                    <span class="text-primary font-semibold">Reveal Cell</span>
                </button>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { CircleAlert, Eye, ScanSearch, Sparkles } from "lucide-vue-next";
import { useHintMenu } from "@/presentation/pages/game/components/useHintMenu";

const { visible, params, close } = useHintMenu();

const remaining = computed(() => 3 - (params.value?.recordedUsed ?? 0));
</script>

<style scoped>
@reference "../../../../style/index.css";

.hint-option {
    @apply w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-foreground cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:bg-foreground/5;
}
</style>
