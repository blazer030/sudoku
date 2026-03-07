<template>
    <div class="fixed inset-0 z-50">
        <div
            data-testid="hint-overlay"
            class="absolute inset-0 bg-black/30"
            @click="$emit('close')"
        />
        <div class="absolute bottom-24 left-1/2 -translate-x-1/2 bg-card rounded-2xl shadow-lg p-4 w-64 z-10">
            <div class="flex justify-center gap-2 mb-3">
                <div
                    v-for="i in 3"
                    :key="i"
                    data-testid="hint-light"
                    :class="[
                        'w-2.5 h-2.5 rounded-full',
                        i <= recordedUsed ? 'bg-accent opacity-30' : 'bg-accent',
                    ]"
                />
            </div>
            <div class="flex flex-col gap-1">
                <button
                    data-testid="hint-auto-notes"
                    :disabled="!canUseHint"
                    class="hint-option"
                    @click="$emit('autoNotes')"
                >
                    Auto Notes
                </button>
                <button
                    data-testid="hint-check-conflicts"
                    :disabled="!canUseHint"
                    class="hint-option"
                    @click="$emit('checkConflicts')"
                >
                    Check Conflicts
                </button>
                <button
                    data-testid="hint-check-errors"
                    :disabled="!canUseHint"
                    class="hint-option"
                    @click="$emit('checkErrors')"
                >
                    Check Errors
                </button>
                <button
                    data-testid="hint-reveal-cell"
                    :disabled="!canUseHint"
                    class="hint-option"
                    @click="$emit('revealCell')"
                >
                    Reveal Cell
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
defineProps<{
    recordedUsed: number;
    canUseHint: boolean;
}>();

defineEmits<{
    close: [];
    autoNotes: [];
    checkConflicts: [];
    checkErrors: [];
    revealCell: [];
}>();
</script>

<style scoped>
@reference "../../../style/index.css";

.hint-option {
    @apply w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-highlight disabled:opacity-40 disabled:cursor-not-allowed;
}
</style>
