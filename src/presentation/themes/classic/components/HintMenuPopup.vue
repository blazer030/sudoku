<template>
    <div
        v-if="visible"
        class="fixed inset-0 z-50"
    >
        <div
            data-testid="hint-overlay"
            class="absolute inset-0 bg-black/30"
            @click="close('close')"
        />
        <div class="absolute bottom-24 left-1/2 -translate-x-1/2 bg-card rounded-popup shadow-popup w-[220px] z-10 flex flex-col gap-1 py-4 px-3">
            <!-- Header: Title + Hint Lights -->
            <div class="flex items-center justify-between px-3 pb-1">
                <span class="text-foreground text-sm font-bold">Hints</span>
                <div class="flex items-center gap-1">
                    <div
                        v-for="i in 3"
                        :key="i"
                        data-testid="hint-light"
                        :class="[
                            'w-2 h-2 rounded-full',
                            i <= remaining ? 'bg-primary' : 'border-[1.5px] border-border',
                        ]"
                    />
                </div>
            </div>

            <!-- Subtitle -->
            <span class="text-foreground-muted text-[11px] px-3 mb-1">First use is free and won't be recorded.</span>

            <!-- Auto Notes -->
            <button
                data-testid="hint-auto-notes"
                :disabled="!params?.canUseHint"
                class="hint-option"
                @click="close('autoNotes')"
            >
                <Sparkles
                    :size="20"
                    class="text-foreground shrink-0"
                />
                <span>Auto Notes</span>
            </button>

            <!-- Check Conflicts -->
            <button
                data-testid="hint-check-conflicts"
                :disabled="!params?.canUseHint"
                class="hint-option"
                @click="close('checkConflicts')"
            >
                <ScanSearch
                    :size="20"
                    class="text-foreground shrink-0"
                />
                <span>Check Conflicts</span>
            </button>

            <!-- Check Errors -->
            <button
                data-testid="hint-check-errors"
                :disabled="!params?.canUseHint"
                class="hint-option"
                @click="close('checkErrors')"
            >
                <CircleAlert
                    :size="20"
                    class="text-foreground shrink-0"
                />
                <span>Check Errors</span>
            </button>

            <!-- Divider -->
            <div class="h-px bg-border mx-3" />

            <!-- Reveal Cell -->
            <button
                data-testid="hint-reveal-cell"
                :disabled="!params?.canUseHint"
                class="hint-option"
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
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { CircleAlert, Eye, ScanSearch, Sparkles } from "lucide-vue-next";
import { useHintMenu } from "./useHintMenu";

const { visible, params, close } = useHintMenu();

const remaining = computed(() => 3 - (params.value?.recordedUsed ?? 0));
</script>

<style scoped>
@reference "../../../../style/index.css";

.hint-option {
    @apply w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-foreground cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:bg-foreground/5;
}
</style>
