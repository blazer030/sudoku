<template>
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        data-testid="new-game-confirm-dialog"
    >
        <div class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal">
            <div class="w-16 h-16 rounded-2xl bg-[#FFF3E0] flex items-center justify-center">
                <TriangleAlert
                    :size="32"
                    class="text-accent"
                />
            </div>

            <div class="flex flex-col items-center gap-2">
                <h2 class="text-2xl font-bold text-foreground tracking-tight">
                    Give Up Current Game?
                </h2>
                <p class="text-sm text-foreground-secondary text-center">
                    Starting a new game will abandon your current progress. This action cannot be undone.
                </p>
            </div>

            <div class="flex flex-col gap-3 w-full">
                <button
                    class="w-full h-[52px] rounded-button bg-accent flex items-center justify-center gap-2 shadow-accent cursor-pointer"
                    data-testid="give-up-and-start-new-button"
                    @click="emit('giveUpAndStartNew')"
                >
                    <span class="text-base font-semibold text-white">Give Up & Start New</span>
                </button>

                <button
                    class="w-full h-[44px] flex items-center justify-center cursor-pointer"
                    data-testid="new-game-cancel-button"
                    @click="emit('cancel')"
                >
                    <span class="text-base font-semibold text-foreground">Cancel</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { TriangleAlert } from "lucide-vue-next";

const emit = defineEmits<{
    giveUpAndStartNew: [];
    cancel: [];
}>();
</script>
